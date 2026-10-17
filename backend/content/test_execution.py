import uuid
from unittest.mock import patch

from django.contrib import admin
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import RequestFactory
from rest_framework.test import APITestCase

from brand.models import BrandProfile, BrandVoice, BrandVoiceApproval
from tenancy.models import Membership, Workspace

from .models import ContentBrief, ContentDraft, ContentItem, ExecutionCheckpoint, Project
from .serializers import ContentItemWriteSerializer


User = get_user_model()
PROJECTS_URL = "/api/projects/"
ITEMS_URL = "/api/content-items/"


class ExecutionAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="creator", password="pass")
        self.workspace = Workspace.objects.create(name="Creator workspace")
        Membership.objects.create(user=self.user, workspace=self.workspace, role=Membership.Role.EDITOR)
        self.profile = BrandProfile.objects.create(workspace=self.workspace, name="Creator brand")
        self.voice = BrandVoice.objects.create(brand_profile=self.profile, version=1, is_active=True)
        BrandVoiceApproval.objects.create(
            workspace=self.workspace,
            voice=self.voice,
            approved_by=self.user,
            approved_by_identifier=str(self.user.pk),
        )
        self.client.force_authenticate(user=self.user)

    def create_project(self):
        response = self.client.post(PROJECTS_URL, {"workspace": self.workspace.id, "name": "LinkedIn series"}, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        return response.data["id"]

    def create_item(self, project_id):
        return self.client.post(ITEMS_URL, {
            "project": project_id,
            "brand_profile": str(self.profile.id),
            "brand_voice": str(self.voice.id),
            "title": "First post",
            "goal": "Explain the new offer",
            "workflow_stage": "idea",
            "next_action": "Write an outline",
            "decisions": ["Use a customer example"],
            "open_questions": ["Which example?"],
        }, format="json")

    def save_checkpoint(self, item_id, expected_revision=1, request_id=None, **changes):
        payload = {
            "expected_revision": expected_revision,
            "client_request_id": str(request_id or uuid.uuid4()),
            "goal": "Explain the updated offer",
            "workflow_stage": "drafting",
            "next_action": "Review the opening",
            "decisions": ["Use the concrete example"],
            "open_questions": ["Which quote?"],
        }
        payload.update(changes)
        return self.client.post(f"{ITEMS_URL}{item_id}/checkpoint/", payload, format="json")

    def test_create_and_restore_item_with_initial_checkpoint(self):
        project_id = self.create_project()
        response = self.create_item(project_id)
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["item"]["revision"], 1)
        self.assertEqual(response.data["item"]["goal"], "Explain the new offer")
        self.assertEqual(response.data["checkpoint"]["revision"], 1)
        self.assertEqual(response.data["brandVoice"]["id"], str(self.voice.id))
        item_id = response.data["item"]["id"]

        self.client.force_authenticate(user=None)
        self.client.login(username="creator", password="pass")
        restored = self.client.get(f"{ITEMS_URL}{item_id}/context/")
        self.assertEqual(restored.status_code, 200, restored.data)
        self.assertEqual(restored.data["item"]["decisions"], ["Use a customer example"])
        self.assertEqual(restored.data["item"]["openQuestions"], ["Which example?"])
        self.assertEqual(restored.data["checkpoint"]["id"], response.data["checkpoint"]["id"])

    def test_save_restores_latest_checkpoint_and_pins_voice_version(self):
        item_id = self.create_item(self.create_project()).data["item"]["id"]
        saved = self.save_checkpoint(item_id)
        self.assertEqual(saved.status_code, 201, saved.data)
        self.assertEqual(saved.data["item"]["revision"], 2)
        self.assertEqual(saved.data["checkpoint"]["nextAction"], "Review the opening")
        second_voice = BrandVoice.objects.create(brand_profile=self.profile, version=2)
        second_voice.activate()
        restored = self.client.get(f"{ITEMS_URL}{item_id}/context/")
        self.assertEqual(
            restored.data["brandVoice"],
            {"id": str(self.voice.id), "version": 1, "isApproved": True},
        )
        self.assertEqual(restored.data["checkpoint"]["decisions"], ["Use the concrete example"])
        self.assertEqual(restored.data["item"]["revision"], 2)
        self.assertEqual(ExecutionCheckpoint.objects.filter(content_item_id=item_id).count(), 2)

    def test_stale_save_and_conflicting_idempotency_key_do_not_change_state(self):
        item_id = self.create_item(self.create_project()).data["item"]["id"]
        key = uuid.uuid4()
        first = self.save_checkpoint(item_id, request_id=key)
        self.assertEqual(first.status_code, 201)
        retry = self.save_checkpoint(item_id, request_id=key)
        self.assertEqual(retry.status_code, 201)
        self.assertEqual(retry.data["checkpoint"]["id"], first.data["checkpoint"]["id"])
        conflict = self.save_checkpoint(item_id, request_id=key, goal="Different data")
        self.assertEqual(conflict.status_code, 409)
        self.assertEqual(conflict.data["code"], "idempotency_key_reused")
        stale = self.save_checkpoint(item_id, expected_revision=1)
        self.assertEqual(stale.status_code, 409)
        self.assertEqual(stale.data["code"], "stale_revision")
        self.assertEqual(stale.data["currentRevision"], 2)
        self.assertEqual(ContentItem.objects.get(pk=item_id).goal, "Explain the updated offer")
        self.assertEqual(ExecutionCheckpoint.objects.filter(content_item_id=item_id).count(), 2)

    def test_two_writers_starting_from_the_same_revision_cannot_overwrite(self):
        item_id = self.create_item(self.create_project()).data["item"]["id"]
        first_seen = self.client.get(f"{ITEMS_URL}{item_id}/context/").data["item"]["revision"]
        second_seen = self.client.get(f"{ITEMS_URL}{item_id}/context/").data["item"]["revision"]
        first = self.save_checkpoint(item_id, expected_revision=first_seen, goal="First writer")
        second = self.save_checkpoint(item_id, expected_revision=second_seen, goal="Second writer")
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 409)
        self.assertEqual(ContentItem.objects.get(pk=item_id).goal, "First writer")
        self.assertEqual(ExecutionCheckpoint.objects.filter(content_item_id=item_id).count(), 2)

    def test_repeated_key_after_newer_save_returns_original_snapshot(self):
        item_id = self.create_item(self.create_project()).data["item"]["id"]
        key = uuid.uuid4()
        first = self.save_checkpoint(item_id, request_id=key)
        self.save_checkpoint(item_id, expected_revision=2, goal="Third version")
        retry = self.save_checkpoint(item_id, request_id=key)
        self.assertEqual(retry.status_code, 201)
        self.assertEqual(retry.data["checkpoint"]["id"], first.data["checkpoint"]["id"])
        self.assertEqual(retry.data["item"]["revision"], 2)
        self.assertEqual(ContentItem.objects.get(pk=item_id).revision, 3)

    def test_cross_workspace_and_read_only_roles_are_rejected(self):
        project_id = self.create_project()
        item_id = self.create_item(project_id).data["item"]["id"]
        other_user = User.objects.create_user(username="outsider", password="pass")
        other_workspace = Workspace.objects.create(name="Other workspace")
        Membership.objects.create(user=other_user, workspace=other_workspace)
        other_profile = BrandProfile.objects.create(workspace=other_workspace, name="Other brand")
        other_voice = BrandVoice.objects.create(brand_profile=other_profile, is_active=True)
        self.client.force_authenticate(user=other_user)
        self.assertEqual(self.client.get(f"{ITEMS_URL}{item_id}/context/").status_code, 404)
        self.assertEqual(self.save_checkpoint(item_id).status_code, 404)
        self.assertEqual(self.client.get(f"{ITEMS_URL}?workspace={self.workspace.id}").data, [])
        foreign_project = self.client.post(PROJECTS_URL, {"workspace": self.workspace.id, "name": "Probe"}, format="json")
        self.assertEqual(foreign_project.status_code, 400)
        self.client.force_authenticate(user=self.user)
        foreign_voice = self.client.post(ITEMS_URL, {
            "project": project_id, "brand_profile": str(self.profile.id),
            "brand_voice": str(other_voice.id), "title": "No", "goal": "No", "next_action": "No",
            "decisions": [], "open_questions": [],
        }, format="json")
        self.assertEqual(foreign_voice.status_code, 400)
        foreign_profile = self.client.post(ITEMS_URL, {
            "project": project_id, "brand_profile": str(other_profile.id),
            "brand_voice": str(self.voice.id), "title": "No", "goal": "No", "next_action": "No",
            "decisions": [], "open_questions": [],
        }, format="json")
        self.assertEqual(foreign_profile.status_code, 400)
        self.assertEqual(ContentItem.objects.count(), 1)
        Membership.objects.filter(user=self.user, workspace=self.workspace).update(role=Membership.Role.VIEWER)
        self.assertEqual(self.client.get(f"{ITEMS_URL}{item_id}/context/").status_code, 200)
        self.assertEqual(self.save_checkpoint(item_id).status_code, 403)
        self.assertEqual(self.client.post(PROJECTS_URL, {"workspace": self.workspace.id, "name": "No"}, format="json").status_code, 403)

    def test_validation_and_failed_checkpoint_insert_leave_original_state(self):
        item_id = self.create_item(self.create_project()).data["item"]["id"]
        invalid = self.save_checkpoint(item_id, workflow_stage="published")
        self.assertEqual(invalid.status_code, 400)
        self.assertEqual(self.client.get(f"{ITEMS_URL}not-a-uuid/context/").status_code, 404)
        with patch("content.views.ExecutionCheckpoint.objects.create", side_effect=IntegrityError("write failed")):
            with self.assertRaises(IntegrityError):
                self.save_checkpoint(item_id)
        self.assertEqual(ContentItem.objects.get(pk=item_id).revision, 1)
        self.assertEqual(ExecutionCheckpoint.objects.filter(content_item_id=item_id).count(), 1)

    def test_failed_initial_checkpoint_rolls_back_item_creation(self):
        project_id = self.create_project()
        with patch("content.views.ExecutionCheckpoint.objects.create", side_effect=IntegrityError("write failed")):
            with self.assertRaises(IntegrityError):
                self.create_item(project_id)
        self.assertEqual(ContentItem.objects.count(), 0)
        self.assertEqual(ExecutionCheckpoint.objects.count(), 0)

    def test_key_is_scoped_to_item_and_missing_or_inactive_voice_is_rejected(self):
        project_id = self.create_project()
        first_id = self.create_item(project_id).data["item"]["id"]
        second_id = self.create_item(project_id).data["item"]["id"]
        key = uuid.uuid4()
        first = self.save_checkpoint(first_id, request_id=key)
        second = self.save_checkpoint(second_id, request_id=key)
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        self.assertNotEqual(first.data["checkpoint"]["id"], second.data["checkpoint"]["id"])
        self.voice.is_active = False
        self.voice.save(update_fields=["is_active"])
        rejected = self.create_item(project_id)
        self.assertEqual(rejected.status_code, 400)
        self.assertEqual(ContentItem.objects.count(), 2)

    def test_active_voice_requires_explicit_human_approval(self):
        project_id = self.create_project()
        BrandVoiceApproval.objects.filter(voice=self.voice).delete()
        rejected = self.create_item(project_id)
        self.assertEqual(rejected.status_code, 400)
        self.assertIn("brand_voice", rejected.data)
        self.assertEqual(ContentItem.objects.count(), 0)

    def test_approval_is_pinned_to_the_accepted_voice_version(self):
        project_id = self.create_project()
        second_voice = BrandVoice.objects.create(brand_profile=self.profile, version=2)
        second_voice.activate()
        payload = {
            "project": project_id,
            "brand_profile": str(self.profile.id),
            "brand_voice": str(second_voice.id),
            "title": "Second voice post",
            "goal": "Explain the new offer",
            "workflow_stage": "idea",
            "next_action": "Write an outline",
            "decisions": [],
            "open_questions": [],
        }
        rejected = self.client.post(ITEMS_URL, payload, format="json")
        self.assertEqual(rejected.status_code, 400)
        self.assertFalse(BrandVoiceApproval.objects.filter(voice=second_voice).exists())

        approved = self.client.post(f"/api/brand-voices/{second_voice.id}/approve/")
        self.assertEqual(approved.status_code, 201, approved.data)
        self.assertEqual(self.client.post(ITEMS_URL, payload, format="json").status_code, 201)

    def test_historical_content_item_without_approval_is_exposed_as_unverified(self):
        project_id = self.create_project()
        created = self.create_item(project_id)
        self.assertEqual(created.status_code, 201)
        BrandVoiceApproval.objects.filter(voice=self.voice).delete()

        restored = self.client.get(f"{ITEMS_URL}{created.data['item']['id']}/context/")
        self.assertEqual(restored.status_code, 200, restored.data)
        self.assertFalse(restored.data["brandVoice"]["isApproved"])

    def test_missing_ids_and_unauthenticated_requests_fail_without_exposing_items(self):
        item_id = self.create_item(self.create_project()).data["item"]["id"]
        self.assertEqual(self.client.get(f"{ITEMS_URL}{uuid.uuid4()}/context/").status_code, 404)
        self.assertEqual(self.client.get(ITEMS_URL).status_code, 400)
        self.assertEqual(self.client.get(PROJECTS_URL).status_code, 400)
        self.client.force_authenticate(user=None)
        self.assertIn(self.client.get(f"{ITEMS_URL}{item_id}/context/").status_code, (401, 403))
        self.assertIn(self.client.post(PROJECTS_URL, {"workspace": self.workspace.id, "name": "No"}).status_code, (401, 403))

    def test_existing_brief_and_draft_remain_readable_after_new_tables(self):
        brief = ContentBrief.objects.create(
            workspace=self.workspace, brand_profile=self.profile, content_objective="Existing goal",
            campaign_goal=ContentBrief.CampaignGoal.EDUCATE, audience="Creators",
            target_channels=[ContentBrief.Channel.LINKEDIN],
        )
        draft = ContentDraft.objects.create(brief=brief, title="Existing draft", channel=ContentBrief.Channel.LINKEDIN)
        self.create_item(self.create_project())
        self.assertEqual(self.client.get(f"/api/content-briefs/{brief.id}/").status_code, 200)
        self.assertEqual(self.client.get(f"/api/content-drafts/{draft.id}/").status_code, 200)

    def test_profile_with_content_item_cannot_move_to_another_workspace(self):
        item_id = self.create_item(self.create_project()).data["item"]["id"]
        destination = Workspace.objects.create(name="Second workspace")
        Membership.objects.create(user=self.user, workspace=destination, role=Membership.Role.EDITOR)
        moved = self.client.patch(
            f"/api/brand-profiles/{self.profile.id}/",
            {"workspace": destination.id},
            format="json",
        )
        self.assertEqual(moved.status_code, 400)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.workspace_id, self.workspace.id)
        self.assertEqual(self.client.get(f"{ITEMS_URL}{item_id}/context/").status_code, 200)

    def test_voice_deactivated_after_payload_validation_is_rejected(self):
        project_id = self.create_project()
        validate = ContentItemWriteSerializer.is_valid

        def deactivate_after_validation(serializer, *args, **kwargs):
            result = validate(serializer, *args, **kwargs)
            BrandVoice.objects.filter(pk=self.voice.pk).update(is_active=False)
            return result

        with patch.object(ContentItemWriteSerializer, "is_valid", deactivate_after_validation):
            response = self.create_item(project_id)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(ContentItem.objects.count(), 0)

    def test_execution_models_are_inspectable_but_not_editable_in_admin(self):
        request = RequestFactory().get("/admin/")
        request.user = User.objects.create_superuser(username="admin", password="pass")
        for model in (Project, ContentItem, ExecutionCheckpoint):
            model_admin = admin.site._registry[model]
            self.assertTrue(model_admin.has_view_permission(request))
            self.assertFalse(model_admin.has_add_permission(request))
            self.assertFalse(model_admin.has_change_permission(request))
            self.assertFalse(model_admin.has_delete_permission(request))
