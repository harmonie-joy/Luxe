from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from brand.models import BrandProfile
from tenancy.models import Membership, Workspace

from .models import ContentBrief, ContentDraft

User = get_user_model()

BRIEFS_URL = "/api/content-briefs/"
DRAFTS_URL = "/api/content-drafts/"


def brief_detail_url(brief_id):
    return f"{BRIEFS_URL}{brief_id}/"


def draft_detail_url(draft_id):
    return f"{DRAFTS_URL}{draft_id}/"


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
