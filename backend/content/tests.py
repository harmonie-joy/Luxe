from unittest import skipUnless

from django.contrib.auth import get_user_model
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase
from rest_framework.test import APITestCase

from brand.models import BrandProfile, BrandVoice, BrandVoiceApproval
from tenancy.models import Membership, Workspace

from .models import (
    Approval,
    ContentBrief,
    ContentDraft,
    ContentItem,
    ContentTemplate,
    Project,
    ScheduledContent,
)

User = get_user_model()

BRIEFS_URL = "/api/content-briefs/"
DRAFTS_URL = "/api/content-drafts/"
SCHEDULED_CONTENT_URL = "/api/scheduled-content/"
APPROVALS_URL = "/api/approvals/"
CONTENT_ITEMS_URL = "/api/content-items/"
CONTENT_TEMPLATES_URL = "/api/content-templates/"


def brief_detail_url(brief_id):
    return f"{BRIEFS_URL}{brief_id}/"


def draft_detail_url(draft_id):
    return f"{DRAFTS_URL}{draft_id}/"


def scheduled_content_detail_url(scheduled_content_id):
    return f"{SCHEDULED_CONTENT_URL}{scheduled_content_id}/"


def approval_detail_url(approval_id):
    return f"{APPROVALS_URL}{approval_id}/"


class ContentBriefAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="brief_user", password="pass")
        self.other_user = User.objects.create_user(username="other_brief", password="pass")

        self.workspace = Workspace.objects.create(name="Brief Workspace")
        self.other_workspace = Workspace.objects.create(name="Other Brief Workspace")

        Membership.objects.create(user=self.user, workspace=self.workspace)
        Membership.objects.create(user=self.other_user, workspace=self.other_workspace)

        self.brand_profile = BrandProfile.objects.create(
            workspace=self.workspace,
            name="Signature Voice",
            audience="Affluent clients",
            tone=["professional", "sophisticated"],
        )
        self.other_brand_profile = BrandProfile.objects.create(
            workspace=self.other_workspace,
            name="Other Voice",
            audience="Other audience",
            tone=["authoritative"],
        )

        self.brief = ContentBrief.objects.create(
            workspace=self.workspace,
            brand_profile=self.brand_profile,
            content_objective="Launch a new editorial teaser for the autumn capsule.",
            campaign_goal=ContentBrief.CampaignGoal.ANNOUNCE,
            audience="Existing high-value clients and invited prospects.",
            angle="Position the collection as quietly collectible.",
            constraints="Avoid discount language and performance claims.",
            target_channels=[
                ContentBrief.Channel.LINKEDIN,
                ContentBrief.Channel.NEWSLETTER,
            ],
        )
        self.other_brief = ContentBrief.objects.create(
            workspace=self.other_workspace,
            brand_profile=self.other_brand_profile,
            content_objective="Other workspace brief.",
            campaign_goal=ContentBrief.CampaignGoal.PROMOTE,
            audience="Other audience",
            angle="Other angle",
            constraints="Other constraints",
            target_channels=[ContentBrief.Channel.INSTAGRAM],
        )
        self.draft = ContentDraft.objects.create(
            brief=self.brief,
            created_by=self.user,
            title="Private preview LinkedIn draft",
            content="A considered first look at the autumn couture capsule.",
            channel=ContentBrief.Channel.LINKEDIN,
            status=ContentDraft.DraftStatus.DRAFT,
        )
        self.other_draft = ContentDraft.objects.create(
            brief=self.other_brief,
            created_by=self.other_user,
            title="Other workspace Instagram draft",
            content="Foreign workspace content.",
            channel=ContentBrief.Channel.INSTAGRAM,
            status=ContentDraft.DraftStatus.IN_REVIEW,
        )
        self.scheduled_content = ScheduledContent.objects.create(
            workspace=self.workspace,
            draft=self.draft,
            channel=ContentBrief.Channel.LINKEDIN,
            status=ContentDraft.DraftStatus.SCHEDULED,
            scheduled_for="2026-06-12T09:00:00Z",
        )
        self.other_scheduled_content = ScheduledContent.objects.create(
            workspace=self.other_workspace,
            draft=self.other_draft,
            channel=ContentBrief.Channel.INSTAGRAM,
            status=ContentDraft.DraftStatus.SCHEDULED,
            scheduled_for="2026-06-13T09:00:00Z",
        )
        self.approval = Approval.objects.create(
            draft=self.draft,
            user=self.user,
            role=Membership.Role.EDITOR,
        )
        self.other_approval = Approval.objects.create(
            draft=self.other_draft,
            user=self.other_user,
            role=Membership.Role.REVIEWER,
        )

    def test_list_returns_only_own_workspace_briefs(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(BRIEFS_URL)
        self.assertEqual(response.status_code, 200)
        ids = [brief["id"] for brief in response.data]
        self.assertIn(str(self.brief.id), ids)
        self.assertNotIn(str(self.other_brief.id), ids)

    def test_unauthenticated_list_is_rejected(self):
        response = self.client.get(BRIEFS_URL)
        self.assertIn(response.status_code, [401, 403])

    def test_create_content_brief(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "workspace": str(self.workspace.id),
            "brand_profile": str(self.brand_profile.id),
            "content_objective": "Introduce a private preview event for couture clients.",
            "campaign_goal": ContentBrief.CampaignGoal.ANNOUNCE,
            "audience": "Top-tier private clients.",
            "angle": "Focus on rarity and appointment-only access.",
            "constraints": "Avoid superlatives that imply guaranteed exclusivity.",
            "target_channels": [
                ContentBrief.Channel.LINKEDIN,
                ContentBrief.Channel.NEWSLETTER,
            ],
        }
        response = self.client.post(BRIEFS_URL, payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["workspaceId"], str(self.workspace.id))
        self.assertEqual(response.data["brandProfileId"], str(self.brand_profile.id))
        self.assertEqual(
            response.data["targetChannels"],
            [
                ContentBrief.Channel.LINKEDIN,
                ContentBrief.Channel.NEWSLETTER,
            ],
        )

    def test_create_brief_with_foreign_workspace_is_denied(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "workspace": str(self.other_workspace.id),
            "brand_profile": str(self.other_brand_profile.id),
            "content_objective": "Forbidden brief.",
            "campaign_goal": ContentBrief.CampaignGoal.PROMOTE,
            "audience": "Audience",
            "angle": "",
            "constraints": "",
            "target_channels": [ContentBrief.Channel.BLOG],
        }
        response = self.client.post(BRIEFS_URL, payload, format="json")
        self.assertEqual(response.status_code, 403)

    def test_create_brief_with_cross_workspace_brand_profile_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "workspace": str(self.workspace.id),
            "brand_profile": str(self.other_brand_profile.id),
            "content_objective": "Invalid pairing.",
            "campaign_goal": ContentBrief.CampaignGoal.EDUCATE,
            "audience": "Audience",
            "angle": "",
            "constraints": "",
            "target_channels": [ContentBrief.Channel.BLOG],
        }
        response = self.client.post(BRIEFS_URL, payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("brand_profile", response.data)

    def test_create_brief_with_invalid_channel_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "workspace": str(self.workspace.id),
            "brand_profile": str(self.brand_profile.id),
            "content_objective": "Invalid channels.",
            "campaign_goal": ContentBrief.CampaignGoal.EDUCATE,
            "audience": "Audience",
            "angle": "",
            "constraints": "",
            "target_channels": ["podcast"],
        }
        response = self.client.post(BRIEFS_URL, payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("target_channels", response.data)

    def test_cross_workspace_retrieve_returns_404(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(brief_detail_url(self.other_brief.id))
        self.assertEqual(response.status_code, 404)

    def test_response_shape_matches_frontend_type(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(brief_detail_url(self.brief.id))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            set(response.data.keys()),
            {
                "id",
                "workspaceId",
                "brandProfileId",
                "contentObjective",
                "campaignGoal",
                "audience",
                "angle",
                "constraints",
                "targetChannels",
                "createdAt",
                "updatedAt",
            },
        )

    def test_list_returns_only_own_workspace_drafts(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(DRAFTS_URL)
        self.assertEqual(response.status_code, 200)
        ids = [draft["id"] for draft in response.data]
        self.assertIn(str(self.draft.id), ids)
        self.assertNotIn(str(self.other_draft.id), ids)

    def test_filter_drafts_by_brief(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(DRAFTS_URL, {"brief": str(self.brief.id)})
        self.assertEqual(response.status_code, 200)
        self.assertEqual([draft["id"] for draft in response.data], [str(self.draft.id)])

    def test_create_content_draft(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "brief": str(self.brief.id),
            "title": "Private preview newsletter draft",
            "content": "A private note for clients invited to the first viewing.",
            "channel": ContentBrief.Channel.NEWSLETTER,
            "status": ContentDraft.DraftStatus.DRAFT,
        }
        response = self.client.post(DRAFTS_URL, payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["workspaceId"], str(self.workspace.id))
        self.assertEqual(response.data["briefId"], str(self.brief.id))
        self.assertEqual(response.data["createdBy"], str(self.user.id))
        self.assertEqual(response.data["channel"], ContentBrief.Channel.NEWSLETTER)

    def test_create_draft_for_foreign_brief_is_denied(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "brief": str(self.other_brief.id),
            "title": "Forbidden draft",
            "content": "Should not be created.",
            "channel": ContentBrief.Channel.INSTAGRAM,
        }
        response = self.client.post(DRAFTS_URL, payload, format="json")
        self.assertEqual(response.status_code, 403)

    def test_create_draft_with_unselected_channel_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "brief": str(self.brief.id),
            "title": "Invalid X draft",
            "content": "This brief did not target X.",
            "channel": ContentBrief.Channel.X,
        }
        response = self.client.post(DRAFTS_URL, payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("channel", response.data)

    def test_create_duplicate_draft_channel_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "brief": str(self.brief.id),
            "title": "Duplicate LinkedIn draft",
            "content": "Only one draft per brief channel is allowed.",
            "channel": ContentBrief.Channel.LINKEDIN,
        }
        response = self.client.post(DRAFTS_URL, payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("channel", response.data)

    def test_update_content_draft(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "title": "Updated LinkedIn draft",
            "status": ContentDraft.DraftStatus.IN_REVIEW,
        }
        response = self.client.patch(
            draft_detail_url(self.draft.id),
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["title"], "Updated LinkedIn draft")
        self.assertEqual(response.data["status"], ContentDraft.DraftStatus.IN_REVIEW)

    def test_cross_workspace_draft_retrieve_returns_404(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(draft_detail_url(self.other_draft.id))
        self.assertEqual(response.status_code, 404)

    def test_draft_response_shape_matches_frontend_type(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(draft_detail_url(self.draft.id))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            set(response.data.keys()),
            {
                "id",
                "workspaceId",
                "briefId",
                "title",
                "content",
                "channel",
                "status",
                "createdBy",
                "createdAt",
                "updatedAt",
            },
        )

    def test_list_returns_only_own_workspace_scheduled_content(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(SCHEDULED_CONTENT_URL)
        self.assertEqual(response.status_code, 200)
        ids = [item["id"] for item in response.data]
        self.assertIn(str(self.scheduled_content.id), ids)
        self.assertNotIn(str(self.other_scheduled_content.id), ids)

    def test_filter_scheduled_content_by_workspace(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            SCHEDULED_CONTENT_URL,
            {"workspace": str(self.workspace.id)},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["id"] for item in response.data],
            [str(self.scheduled_content.id)],
        )

    def test_filter_scheduled_content_by_draft(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            SCHEDULED_CONTENT_URL,
            {"draft": str(self.draft.id)},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["id"] for item in response.data],
            [str(self.scheduled_content.id)],
        )

    def test_unauthenticated_scheduled_content_list_is_rejected(self):
        response = self.client.get(SCHEDULED_CONTENT_URL)
        self.assertIn(response.status_code, [401, 403])

    def test_create_scheduled_content(self):
        self.client.force_authenticate(user=self.user)
        newsletter_draft = ContentDraft.objects.create(
            brief=self.brief,
            created_by=self.user,
            title="Private preview newsletter draft",
            content="A private note for clients invited to the first viewing.",
            channel=ContentBrief.Channel.NEWSLETTER,
            status=ContentDraft.DraftStatus.APPROVED,
        )
        payload = {
            "workspace": str(self.workspace.id),
            "draft": str(newsletter_draft.id),
            "channel": ContentBrief.Channel.NEWSLETTER,
            "status": ContentDraft.DraftStatus.SCHEDULED,
            "scheduled_for": "2026-06-14T09:00:00Z",
        }
        response = self.client.post(SCHEDULED_CONTENT_URL, payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["workspaceId"], str(self.workspace.id))
        self.assertEqual(response.data["draftId"], str(newsletter_draft.id))
        self.assertEqual(response.data["channel"], ContentBrief.Channel.NEWSLETTER)
        self.assertEqual(response.data["status"], ContentDraft.DraftStatus.SCHEDULED)
        self.assertIsNone(response.data["publishedAt"])

    def test_create_scheduled_content_with_foreign_workspace_is_denied(self):
        self.client.force_authenticate(user=self.user)
        new_other_brief = ContentBrief.objects.create(
            workspace=self.other_workspace,
            brand_profile=self.other_brand_profile,
            content_objective="New foreign workspace brief.",
            campaign_goal=ContentBrief.CampaignGoal.PROMOTE,
            audience="Other audience",
            angle="Other angle",
            constraints="Other constraints",
            target_channels=[ContentBrief.Channel.LINKEDIN],
        )
        unscheduled_other_draft = ContentDraft.objects.create(
            brief=new_other_brief,
            created_by=self.other_user,
            title="Unscheduled foreign workspace draft",
            content="Unscheduled draft content.",
            channel=ContentBrief.Channel.LINKEDIN,
            status=ContentDraft.DraftStatus.APPROVED,
        )
        payload = {
            "workspace": str(self.other_workspace.id),
            "draft": str(unscheduled_other_draft.id),
            "channel": ContentBrief.Channel.LINKEDIN,
            "status": ContentDraft.DraftStatus.SCHEDULED,
            "scheduled_for": "2026-06-14T09:00:00Z",
        }
        response = self.client.post(SCHEDULED_CONTENT_URL, payload, format="json")
        self.assertEqual(response.status_code, 403)

    def test_create_scheduled_content_with_mismatched_channel_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        newsletter_draft = ContentDraft.objects.create(
            brief=self.brief,
            created_by=self.user,
            title="Newsletter mismatch draft",
            content="A private note for clients.",
            channel=ContentBrief.Channel.NEWSLETTER,
            status=ContentDraft.DraftStatus.APPROVED,
        )
        payload = {
            "workspace": str(self.workspace.id),
            "draft": str(newsletter_draft.id),
            "channel": ContentBrief.Channel.LINKEDIN,
            "status": ContentDraft.DraftStatus.SCHEDULED,
            "scheduled_for": "2026-06-14T09:00:00Z",
        }
        response = self.client.post(SCHEDULED_CONTENT_URL, payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("channel", response.data)

    def test_create_duplicate_scheduled_content_for_draft_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "workspace": str(self.workspace.id),
            "draft": str(self.draft.id),
            "channel": ContentBrief.Channel.LINKEDIN,
            "status": ContentDraft.DraftStatus.SCHEDULED,
            "scheduled_for": "2026-06-15T09:00:00Z",
        }
        response = self.client.post(SCHEDULED_CONTENT_URL, payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("draft", response.data)

    def test_update_scheduled_content(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "status": ContentDraft.DraftStatus.PUBLISHED,
            "published_at": "2026-06-12T10:00:00Z",
        }
        response = self.client.patch(
            scheduled_content_detail_url(self.scheduled_content.id),
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], ContentDraft.DraftStatus.PUBLISHED)
        self.assertEqual(response.data["publishedAt"], "2026-06-12T10:00:00Z")

    def test_cross_workspace_scheduled_content_retrieve_returns_404(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            scheduled_content_detail_url(self.other_scheduled_content.id)
        )
        self.assertEqual(response.status_code, 404)

    def test_scheduled_content_response_shape_matches_frontend_type(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            scheduled_content_detail_url(self.scheduled_content.id)
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            set(response.data.keys()),
            {
                "id",
                "workspaceId",
                "draftId",
                "channel",
                "status",
                "scheduledFor",
                "publishedAt",
                "createdAt",
                "updatedAt",
            },
        )

    def test_list_returns_only_own_workspace_approvals(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(APPROVALS_URL)
        self.assertEqual(response.status_code, 200)
        ids = [approval["id"] for approval in response.data]
        self.assertIn(str(self.approval.id), ids)
        self.assertNotIn(str(self.other_approval.id), ids)

    def test_filter_approvals_by_draft(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(APPROVALS_URL, {"draft": str(self.draft.id)})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [approval["id"] for approval in response.data],
            [str(self.approval.id)],
        )

    def test_unauthenticated_approval_list_is_rejected(self):
        response = self.client.get(APPROVALS_URL)
        self.assertIn(response.status_code, [401, 403])

    def test_create_approval(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "draft": str(self.draft.id),
            "user": str(self.other_user.id),
            "role": Membership.Role.REVIEWER,
        }
        response = self.client.post(APPROVALS_URL, payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["workspaceId"], str(self.workspace.id))
        self.assertEqual(response.data["draftId"], str(self.draft.id))
        self.assertEqual(response.data["userId"], str(self.user.id))
        self.assertEqual(response.data["role"], Membership.Role.REVIEWER)

    def test_create_approval_for_foreign_draft_is_denied(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "draft": str(self.other_draft.id),
            "role": Membership.Role.REVIEWER,
        }
        response = self.client.post(APPROVALS_URL, payload, format="json")
        self.assertEqual(response.status_code, 403)

    def test_cross_workspace_approval_retrieve_returns_404(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(approval_detail_url(self.other_approval.id))
        self.assertEqual(response.status_code, 404)

    def test_approval_response_shape_matches_frontend_type(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(approval_detail_url(self.approval.id))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            set(response.data.keys()),
            {
                "id",
                "workspaceId",
                "draftId",
                "userId",
                "role",
                "createdAt",
            },
        )


class ContentTemplateAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="template_writer", password="template-test-password"
        )
        self.reader = User.objects.create_user(
            username="template_reader", password="template-test-password"
        )
        self.outsider = User.objects.create_user(
            username="template_outsider", password="template-test-password"
        )
        self.workspace = Workspace.objects.create(name="Template workspace")
        self.other_workspace = Workspace.objects.create(name="Other template workspace")
        Membership.objects.create(
            user=self.user, workspace=self.workspace, role=Membership.Role.EDITOR
        )
        Membership.objects.create(
            user=self.reader, workspace=self.workspace, role=Membership.Role.VIEWER
        )
        Membership.objects.create(
            user=self.outsider,
            workspace=self.other_workspace,
            role=Membership.Role.EDITOR,
        )
        self.profile = BrandProfile.objects.create(
            workspace=self.workspace, name="Template brand"
        )
        self.voice = BrandVoice.objects.create(
            brand_profile=self.profile, version=1, is_active=True
        )
        BrandVoiceApproval.objects.create(
            workspace=self.workspace,
            voice=self.voice,
            approved_by=self.user,
            approved_by_identifier=str(self.user.pk),
        )
        self.project = Project.objects.create(
            workspace=self.workspace,
            name="Template project",
            created_by=self.user,
        )
        self.template = ContentTemplate.objects.get(
            key="linkedin_text_post", version=1
        )

    def create_item(self, content_template=None):
        payload = {
            "project": str(self.project.id),
            "brand_profile": str(self.profile.id),
            "brand_voice": str(self.voice.id),
            "title": "LinkedIn post",
            "goal": "Share a useful observation",
            "workflow_stage": "idea",
            "next_action": "Draft the opening",
            "decisions": [],
            "open_questions": [],
        }
        if content_template is not None:
            payload["content_template"] = str(content_template)
        return self.client.post(CONTENT_ITEMS_URL, payload, format="json")

    def test_workspace_member_can_list_active_system_templates(self):
        inactive = ContentTemplate.objects.create(
            key="retired_linkedin_template",
            name="Retired LinkedIn template",
            channel=ContentTemplate.Channel.LINKEDIN,
            version=1,
            body="[Retired]",
            is_active=False,
        )
        self.client.force_authenticate(user=self.reader)

        response = self.client.get(
            CONTENT_TEMPLATES_URL, {"workspace": self.workspace.id}
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [template["id"] for template in response.data],
            [str(self.template.id)],
        )
        self.assertEqual(response.data[0]["channel"], "linkedin")
        self.assertNotIn(str(inactive.id), [template["id"] for template in response.data])
        self.assertIn("[Opening:", response.data[0]["body"])

    def test_template_list_requires_membership_in_requested_workspace(self):
        self.client.force_authenticate(user=self.outsider)

        response = self.client.get(
            CONTENT_TEMPLATES_URL, {"workspace": self.workspace.id}
        )

        self.assertEqual(response.status_code, 403)

    def test_template_list_requires_authentication_and_workspace(self):
        self.assertIn(
            self.client.get(CONTENT_TEMPLATES_URL).status_code, (401, 403)
        )
        self.client.force_authenticate(user=self.reader)

        response = self.client.get(CONTENT_TEMPLATES_URL)

        self.assertEqual(response.status_code, 400)
        self.assertIn("workspace", response.data)

    def test_new_item_pins_template_and_context_restore_exposes_exact_version(self):
        self.client.force_authenticate(user=self.user)
        created = self.create_item(self.template.id)

        self.assertEqual(created.status_code, 201, created.data)
        item = created.data["item"]
        expected_template = {
            "id": str(self.template.id),
            "name": self.template.name,
            "channel": "linkedin",
            "version": 1,
        }
        self.assertEqual(item["channel"], "linkedin")
        self.assertEqual(item["contentTemplate"], expected_template)
        self.assertEqual(
            ContentItem.objects.get(pk=item["id"]).content_template_id,
            self.template.id,
        )

        self.template.is_active = False
        self.template.save(update_fields=["is_active"])
        ContentTemplate.objects.create(
            key=self.template.key,
            name=self.template.name,
            channel=self.template.channel,
            version=2,
            body="[A newer generic structure]",
        )

        restored = self.client.get(
            f"{CONTENT_ITEMS_URL}{item['id']}/context/"
        )

        self.assertEqual(restored.status_code, 200, restored.data)
        self.assertEqual(restored.data["item"]["channel"], "linkedin")
        self.assertEqual(restored.data["item"]["contentTemplate"], expected_template)

    def test_legacy_item_returns_linkedin_and_null_template(self):
        item = ContentItem.objects.create(
            project=self.project,
            brand_profile=self.profile,
            brand_voice=self.voice,
            created_by=self.user,
            title="Legacy LinkedIn item",
            goal="A pre-template item",
            next_action="Review",
        )
        self.client.force_authenticate(user=self.user)

        response = self.client.get(
            CONTENT_ITEMS_URL, {"workspace": self.workspace.id}
        )

        self.assertEqual(response.status_code, 200)
        item_data = next(value for value in response.data if value["id"] == str(item.id))
        self.assertEqual(item_data["channel"], "linkedin")
        self.assertIsNone(item_data["contentTemplate"])

    def test_new_item_requires_a_template(self):
        self.client.force_authenticate(user=self.user)

        response = self.create_item()

        self.assertEqual(response.status_code, 400)
        self.assertIn("content_template", response.data)
        self.assertEqual(ContentItem.objects.count(), 0)

    def test_unknown_inactive_and_incompatible_templates_are_rejected(self):
        self.client.force_authenticate(user=self.user)
        unknown = self.create_item("00000000-0000-0000-0000-000000000001")
        self.assertEqual(unknown.status_code, 400)

        inactive_template = ContentTemplate.objects.create(
            key="inactive_linkedin_template",
            name="Inactive LinkedIn template",
            channel=ContentTemplate.Channel.LINKEDIN,
            version=1,
            body="[Inactive]",
            is_active=False,
        )
        inactive = self.create_item(inactive_template.id)
        self.assertEqual(inactive.status_code, 400)
        self.assertIn("content_template", inactive.data)

        incompatible_template = ContentTemplate.objects.create(
            key="incompatible_template",
            name="Incompatible template",
            channel="instagram",
            version=1,
            body="[Not LinkedIn]",
        )
        incompatible = self.create_item(incompatible_template.id)
        self.assertEqual(incompatible.status_code, 400)
        self.assertIn("content_template", incompatible.data)
        self.assertEqual(ContentItem.objects.count(), 0)

    def test_non_linkedin_channel_is_rejected_and_writer_role_remains_required(self):
        self.client.force_authenticate(user=self.user)
        valid_item = self.create_item(self.template.id)
        self.assertEqual(valid_item.status_code, 201, valid_item.data)
        payload = {
            "project": str(self.project.id),
            "brand_profile": str(self.profile.id),
            "brand_voice": str(self.voice.id),
            "title": "Wrong channel",
            "goal": "Not LinkedIn",
            "workflow_stage": "idea",
            "next_action": "Review",
            "decisions": [],
            "open_questions": [],
            "channel": "instagram",
            "content_template": str(self.template.id),
        }
        invalid_channel = self.client.post(
            CONTENT_ITEMS_URL, payload, format="json"
        )
        self.assertEqual(invalid_channel.status_code, 400)

        self.client.force_authenticate(user=self.reader)
        denied = self.create_item(self.template.id)

        self.assertEqual(denied.status_code, 403)
        self.assertEqual(ContentItem.objects.count(), 1)


@skipUnless(connection.vendor == "postgresql", "requires a PostgreSQL test database")
class ContentTemplateMigrationTest(TransactionTestCase):
    migrate_from = ("content", "0005_ia1_execution_context")
    migrate_to = ("content", "0006_contenttemplate")

    def tearDown(self):
        executor = MigrationExecutor(connection)
        executor.migrate(executor.loader.graph.leaf_nodes())
        super().tearDown()

    def test_existing_item_backfill_forward_migration_and_rollback(self):
        MigrationExecutor(connection).migrate([self.migrate_from])
        old_apps = MigrationExecutor(connection).loader.project_state(
            [self.migrate_from]
        ).apps
        Workspace = old_apps.get_model("tenancy", "Workspace")
        BrandProfile = old_apps.get_model("brand", "BrandProfile")
        BrandVoice = old_apps.get_model("brand", "BrandVoice")
        Project = old_apps.get_model("content", "Project")
        ContentItem = old_apps.get_model("content", "ContentItem")

        workspace = Workspace.objects.create(name="Legacy template workspace")
        profile = BrandProfile.objects.create(
            workspace=workspace, name="Legacy template brand"
        )
        voice = BrandVoice.objects.create(
            brand_profile=profile, version=1, is_active=True
        )
        project = Project.objects.create(workspace=workspace, name="Legacy project")
        item = ContentItem.objects.create(
            project=project,
            brand_profile=profile,
            brand_voice=voice,
            title="Legacy item",
            goal="Existing content",
            next_action="Continue",
        )

        MigrationExecutor(connection).migrate([self.migrate_to])
        current_apps = MigrationExecutor(connection).loader.project_state(
            [self.migrate_to]
        ).apps
        CurrentContentItem = current_apps.get_model("content", "ContentItem")
        self.assertEqual(
            CurrentContentItem.objects.get(pk=item.pk).channel, "linkedin"
        )
        self.assertIsNone(
            CurrentContentItem.objects.get(pk=item.pk).content_template_id
        )
        self.assertEqual(
            current_apps.get_model("content", "ContentTemplate").objects.filter(
                key="linkedin_text_post", version=1
            ).count(),
            1,
        )

        MigrationExecutor(connection).migrate([self.migrate_from])
        rolled_back_apps = MigrationExecutor(connection).loader.project_state(
            [self.migrate_from]
        ).apps
        self.assertEqual(
            rolled_back_apps.get_model("content", "ContentItem")
            .objects.get(pk=item.pk)
            .title,
            "Legacy item",
        )
        self.assertNotIn(
            "content_contenttemplate",
            connection.introspection.table_names(),
        )

        MigrationExecutor(connection).migrate([self.migrate_to])
        restored_apps = MigrationExecutor(connection).loader.project_state(
            [self.migrate_to]
        ).apps
        restored_item = restored_apps.get_model("content", "ContentItem").objects.get(
            pk=item.pk
        )
        self.assertEqual(restored_item.channel, "linkedin")
        self.assertIsNone(restored_item.content_template_id)
