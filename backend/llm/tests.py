from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APITestCase

from brand.models import BrandAsset, BrandProfile
from content.models import ContentBrief, ContentDraft
from tenancy.models import Membership, Workspace

from .models import AIRun
from .providers import AIProviderError, MockProvider, OllamaProvider
from .schemas import (
    BrandVoiceExtractionResult,
    ComplianceReviewResult,
    DraftGenerationResult,
    VoiceReviewResult,
)
from .services import (
    extract_brand_voice,
    generate_draft,
    review_compliance,
    review_voice,
)

User = get_user_model()
BRAND_EXTRACT_URL = "/api/ai/brand/extract/"
DRAFT_GENERATE_URL = "/api/ai/drafts/generate/"


class RecordingProvider(MockProvider):
    def __init__(self):
        super().__init__()
        self.prompt = ""

    def generate(self, prompt, schema):
        self.prompt = prompt
        return super().generate(prompt, schema)


class MockAIServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="ai_user", password="pass")
        self.workspace = Workspace.objects.create(
            name="AI Workspace",
            created_by=self.user,
        )
        self.provider = MockProvider()

    def test_mock_services_return_schema_valid_results(self):
        self.assertIsInstance(
            extract_brand_voice(
                self.workspace,
                "Precise, editorial copy for a premium audience.",
                user=self.user,
                provider=self.provider,
            ),
            BrandVoiceExtractionResult,
        )
        self.assertIsInstance(
            generate_draft(
                self.workspace,
                "Announce a new collection.",
                "linkedin",
                user=self.user,
                provider=self.provider,
            ),
            DraftGenerationResult,
        )
        self.assertIsInstance(
            review_voice(
                self.workspace,
                "A calm launch note.",
                "Professional and sophisticated.",
                user=self.user,
                provider=self.provider,
            ),
            VoiceReviewResult,
        )
        self.assertIsInstance(
            review_compliance(
                self.workspace,
                "This product will double conversion.",
                user=self.user,
                provider=self.provider,
            ),
            ComplianceReviewResult,
        )
        self.assertEqual(AIRun.objects.filter(status=AIRun.Status.SUCCEEDED).count(), 4)

    def test_successful_run_records_output(self):
        result = generate_draft(
            self.workspace,
            "Create a newsletter opener.",
            "newsletter",
            user=self.user,
            provider=self.provider,
        )
        run = AIRun.objects.get()
        self.assertEqual(run.workspace, self.workspace)
        self.assertEqual(run.user, self.user)
        self.assertEqual(run.task_type, AIRun.TaskType.DRAFT_GENERATION)
        self.assertEqual(run.provider, "mock")
        self.assertEqual(run.status, AIRun.Status.SUCCEEDED)
        self.assertEqual(run.output_data["title"], result.title)
        self.assertEqual(run.error, "")
        self.assertIsNotNone(run.completed_at)

    def test_failed_run_records_error_without_real_provider_call(self):
        with self.assertRaises(AIProviderError):
            review_compliance(
                self.workspace,
                "Draft text",
                user=self.user,
                provider=MockProvider(fail=True),
            )

        run = AIRun.objects.get()
        self.assertEqual(run.status, AIRun.Status.FAILED)
        self.assertEqual(run.provider, "mock")
        self.assertIn("Mock provider failure", run.error)
        self.assertEqual(run.output_data, {})
        self.assertIsNotNone(run.completed_at)

    def test_brand_voice_extraction_prompt_includes_asset_context(self):
        profile = BrandProfile.objects.create(
            workspace=self.workspace,
            name="Extraction Voice",
            audience="Service business owners",
            tone=["professional"],
        )
        asset = BrandAsset.objects.create(
            brand_profile=profile,
            title="Homepage sample",
            format="landing_page",
            content="We help consultants explain their offer without hype.",
        )
        provider = RecordingProvider()

        result = extract_brand_voice(
            self.workspace,
            [asset],
            user=self.user,
            provider=provider,
        )

        self.assertIsInstance(result, BrandVoiceExtractionResult)
        self.assertIn("Homepage sample", provider.prompt)
        self.assertIn("landing_page", provider.prompt)
        self.assertIn("consultants explain their offer", provider.prompt)
        self.assertIn("Voice DNA", result.positioning_notes)
        run = AIRun.objects.get()
        self.assertEqual(run.input_data["assets"][0]["title"], "Homepage sample")
        self.assertEqual(run.input_data["assets"][0]["format"], "landing_page")
        self.assertIn("without hype", run.input_data["assets"][0]["content"])

    def test_draft_generation_prompt_includes_brief_and_brand_voice_context(self):
        profile = BrandProfile.objects.create(
            workspace=self.workspace,
            name="Prompt Voice",
            audience="Premium founders",
            tone=["professional", "sophisticated"],
            preferred_vocabulary=[
                {
                    "preferred_term": "clientele",
                    "restricted_terms": ["customers"],
                    "note": "Use elevated language.",
                }
            ],
            banned_phrases=[
                {
                    "phrase": "cheap",
                    "reason": "Conflicts with premium positioning.",
                }
            ],
            positioning_notes="Quiet authority.",
        )
        brief = ContentBrief.objects.create(
            workspace=self.workspace,
            brand_profile=profile,
            content_objective="Announce a private preview.",
            campaign_goal=ContentBrief.CampaignGoal.ANNOUNCE,
            audience="Existing clients",
            angle="Calm editorial invitation",
            constraints="Avoid discount language.",
            target_channels=[ContentBrief.Channel.LINKEDIN],
        )
        provider = RecordingProvider()

        generate_draft(
            self.workspace,
            brief,
            ContentBrief.Channel.LINKEDIN,
            user=self.user,
            provider=provider,
        )

        self.assertIn("Announce a private preview.", provider.prompt)
        self.assertIn("linkedin", provider.prompt)
        self.assertIn("Premium founders", provider.prompt)
        self.assertIn("clientele", provider.prompt)
        self.assertIn("cheap", provider.prompt)
        run = AIRun.objects.get()
        self.assertEqual(
            run.input_data["brief"]["content_objective"],
            "Announce a private preview.",
        )
        self.assertEqual(run.input_data["channel"], ContentBrief.Channel.LINKEDIN)
        self.assertEqual(
            run.input_data["brand_profile"]["preferred_vocabulary"][0][
                "preferred_term"
            ],
            "clientele",
        )

    @override_settings(OLLAMA_MODEL="")
    def test_ollama_provider_requires_model_from_environment(self):
        with self.assertRaisesMessage(
            AIProviderError,
            "OLLAMA_MODEL must be set when AI_PROVIDER=ollama.",
        ):
            OllamaProvider(base_url="http://localhost:11434")


@override_settings(AI_PROVIDER="mock")
class BrandVoiceExtractionAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="api_ai_user", password="pass")
        self.other_user = User.objects.create_user(username="api_other", password="pass")
        self.workspace = Workspace.objects.create(name="AI API Workspace")
        self.other_workspace = Workspace.objects.create(name="Other AI API Workspace")
        Membership.objects.create(user=self.user, workspace=self.workspace)
        Membership.objects.create(user=self.other_user, workspace=self.other_workspace)
        self.profile = BrandProfile.objects.create(
            workspace=self.workspace,
            name="Voice Profile",
            audience="Existing audience",
            tone=["professional"],
            positioning_notes="Do not change me.",
        )
        self.other_profile = BrandProfile.objects.create(
            workspace=self.other_workspace,
            name="Other Voice Profile",
            audience="Other audience",
            tone=["visionary"],
        )
        self.asset = BrandAsset.objects.create(
            brand_profile=self.profile,
            title="Editorial Sample",
            format="editorial",
            content="Precise editorial language for premium teams.",
        )
        self.second_asset = BrandAsset.objects.create(
            brand_profile=self.profile,
            title="Launch Sample",
            format="launch_note",
            content="Calm launch notes with practical clarity.",
        )
        self.other_asset = BrandAsset.objects.create(
            brand_profile=self.other_profile,
            title="Foreign Sample",
            content="Foreign workspace content.",
        )

    def payload(self, **overrides):
        data = {
            "workspace": str(self.workspace.id),
            "brand_profile": str(self.profile.id),
            "asset_ids": [str(self.asset.id), str(self.second_asset.id)],
        }
        data.update(overrides)
        return data

    def test_authenticated_success_returns_schema_valid_suggestions(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(BRAND_EXTRACT_URL, self.payload(), format="json")
        self.assertEqual(response.status_code, 200)
        self.assertIn("aiRunId", response.data)
        suggestions = BrandVoiceExtractionResult.model_validate(
            response.data["suggestions"]
        )
        self.assertEqual(suggestions.audience, response.data["suggestions"]["audience"])
        self.assertEqual(len(suggestions.tone), 1)
        self.assertIn("Voice DNA", suggestions.positioning_notes)

    def test_unauthenticated_request_is_rejected(self):
        response = self.client.post(BRAND_EXTRACT_URL, self.payload(), format="json")
        self.assertIn(response.status_code, [401, 403])

    def test_foreign_workspace_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            BRAND_EXTRACT_URL,
            self.payload(workspace=str(self.other_workspace.id)),
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_foreign_asset_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            BRAND_EXTRACT_URL,
            self.payload(asset_ids=[str(self.asset.id), str(self.other_asset.id)]),
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_missing_asset_is_validation_error(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            BRAND_EXTRACT_URL,
            self.payload(asset_ids=["00000000-0000-0000-0000-000000000000"]),
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("asset_ids", response.data)

    def test_success_creates_ai_run_without_mutating_brand_profile(self):
        self.client.force_authenticate(user=self.user)
        original_profile = {
            "audience": self.profile.audience,
            "tone": self.profile.tone,
            "preferred_vocabulary": self.profile.preferred_vocabulary,
            "banned_phrases": self.profile.banned_phrases,
            "positioning_notes": self.profile.positioning_notes,
        }

        response = self.client.post(BRAND_EXTRACT_URL, self.payload(), format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(AIRun.objects.count(), 1)
        run = AIRun.objects.get(id=response.data["aiRunId"])
        self.assertEqual(run.workspace, self.workspace)
        self.assertEqual(run.user, self.user)
        self.assertEqual(run.task_type, AIRun.TaskType.BRAND_VOICE_EXTRACTION)
        self.assertEqual(run.provider, "mock")
        self.assertEqual(run.status, AIRun.Status.SUCCEEDED)
        self.assertEqual(run.input_data["assets"][0]["title"], self.asset.title)
        self.assertEqual(run.input_data["assets"][0]["format"], self.asset.format)
        self.assertIn(self.asset.content, run.input_data["assets"][0]["content"])
        self.assertEqual(
            run.input_data["assets"][1]["title"],
            self.second_asset.title,
        )
        self.assertEqual(
            run.input_data["assets"][1]["format"],
            self.second_asset.format,
        )
        self.assertIn(
            self.second_asset.content,
            run.input_data["assets"][1]["content"],
        )

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.audience, original_profile["audience"])
        self.assertEqual(self.profile.tone, original_profile["tone"])
        self.assertEqual(
            self.profile.preferred_vocabulary,
            original_profile["preferred_vocabulary"],
        )
        self.assertEqual(
            self.profile.banned_phrases,
            original_profile["banned_phrases"],
        )
        self.assertEqual(
            self.profile.positioning_notes,
            original_profile["positioning_notes"],
        )


@override_settings(AI_PROVIDER="mock")
class DraftGenerationAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="draft_ai_user", password="pass")
        self.other_user = User.objects.create_user(
            username="draft_ai_other",
            password="pass",
        )
        self.workspace = Workspace.objects.create(name="Draft AI Workspace")
        self.other_workspace = Workspace.objects.create(name="Other Draft AI Workspace")
        Membership.objects.create(user=self.user, workspace=self.workspace)
        Membership.objects.create(user=self.other_user, workspace=self.other_workspace)
        self.profile = BrandProfile.objects.create(
            workspace=self.workspace,
            name="Draft Voice",
            audience="Premium founders",
            tone=["professional"],
            preferred_vocabulary=[
                {
                    "preferred_term": "clientele",
                    "restricted_terms": ["customers"],
                    "note": "Use elevated language.",
                }
            ],
            banned_phrases=[
                {
                    "phrase": "cheap",
                    "reason": "Conflicts with premium positioning.",
                }
            ],
            positioning_notes="Quiet authority.",
        )
        self.other_profile = BrandProfile.objects.create(
            workspace=self.other_workspace,
            name="Other Draft Voice",
            audience="Other audience",
            tone=["visionary"],
        )
        self.brief = ContentBrief.objects.create(
            workspace=self.workspace,
            brand_profile=self.profile,
            content_objective="Announce a private preview.",
            campaign_goal=ContentBrief.CampaignGoal.ANNOUNCE,
            audience="Existing clients",
            angle="Quiet authority",
            constraints="Avoid discount language.",
            target_channels=[
                ContentBrief.Channel.LINKEDIN,
                ContentBrief.Channel.INSTAGRAM,
                ContentBrief.Channel.NEWSLETTER,
            ],
        )
        self.other_brief = ContentBrief.objects.create(
            workspace=self.other_workspace,
            brand_profile=self.other_profile,
            content_objective="Foreign brief.",
            campaign_goal=ContentBrief.CampaignGoal.PROMOTE,
            audience="Other audience",
            angle="Other angle",
            constraints="Other constraints",
            target_channels=[ContentBrief.Channel.LINKEDIN],
        )

    def payload(self, **overrides):
        data = {
            "workspace": str(self.workspace.id),
            "brief": str(self.brief.id),
            "channels": [
                ContentBrief.Channel.LINKEDIN,
                ContentBrief.Channel.INSTAGRAM,
            ],
        }
        data.update(overrides)
        return data

    def test_authenticated_success_creates_drafts_and_ai_runs(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(DRAFT_GENERATE_URL, self.payload(), format="json")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["aiRunIds"]), 2)
        self.assertEqual(len(response.data["drafts"]), 2)
        self.assertEqual(ContentDraft.objects.count(), 2)
        self.assertEqual(AIRun.objects.count(), 2)

        channels = {draft["channel"] for draft in response.data["drafts"]}
        self.assertEqual(
            channels,
            {ContentBrief.Channel.LINKEDIN, ContentBrief.Channel.INSTAGRAM},
        )
        for draft in response.data["drafts"]:
            self.assertEqual(draft["brief"], str(self.brief.id))
            self.assertEqual(draft["status"], ContentDraft.DraftStatus.DRAFT)

        runs = AIRun.objects.filter(id__in=response.data["aiRunIds"])
        self.assertEqual(runs.count(), 2)
        self.assertTrue(
            all(run.task_type == AIRun.TaskType.DRAFT_GENERATION for run in runs)
        )
        self.assertTrue(all(run.provider == "mock" for run in runs))
        self.assertTrue(all(run.status == AIRun.Status.SUCCEEDED for run in runs))
        for run in runs:
            self.assertEqual(
                run.input_data["brief"]["content_objective"],
                "Announce a private preview.",
            )
            self.assertEqual(run.input_data["brief"]["campaign_goal"], "announce")
            self.assertEqual(run.input_data["brief"]["audience"], "Existing clients")
            self.assertEqual(run.input_data["brief"]["angle"], "Quiet authority")
            self.assertEqual(
                run.input_data["brief"]["constraints"],
                "Avoid discount language.",
            )
            self.assertIn(run.input_data["channel"], channels)
            self.assertEqual(
                run.input_data["brand_profile"]["audience"],
                "Premium founders",
            )
            self.assertEqual(
                run.input_data["brand_profile"]["preferred_vocabulary"][0][
                    "preferred_term"
                ],
                "clientele",
            )
            self.assertEqual(
                run.input_data["brand_profile"]["banned_phrases"][0]["phrase"],
                "cheap",
            )

    def test_unauthenticated_request_is_rejected(self):
        response = self.client.post(DRAFT_GENERATE_URL, self.payload(), format="json")
        self.assertIn(response.status_code, [401, 403])

    def test_foreign_workspace_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            DRAFT_GENERATE_URL,
            self.payload(workspace=str(self.other_workspace.id)),
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_foreign_brief_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            DRAFT_GENERATE_URL,
            self.payload(brief=str(self.other_brief.id)),
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_invalid_channel_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            DRAFT_GENERATE_URL,
            self.payload(channels=["podcast"]),
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("channels", response.data)

    def test_channel_not_selected_on_brief_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            DRAFT_GENERATE_URL,
            self.payload(channels=[ContentBrief.Channel.BLOG]),
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("channels", response.data)

    def test_one_draft_created_per_requested_channel(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            DRAFT_GENERATE_URL,
            self.payload(
                channels=[
                    ContentBrief.Channel.LINKEDIN,
                    ContentBrief.Channel.NEWSLETTER,
                ],
            ),
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(ContentDraft.objects.count(), 2)
        self.assertEqual(
            set(ContentDraft.objects.values_list("channel", flat=True)),
            {ContentBrief.Channel.LINKEDIN, ContentBrief.Channel.NEWSLETTER},
        )

    def test_repeated_generation_updates_existing_draft(self):
        existing = ContentDraft.objects.create(
            brief=self.brief,
            created_by=self.user,
            title="Old title",
            content="Old content",
            channel=ContentBrief.Channel.LINKEDIN,
            status=ContentDraft.DraftStatus.IN_REVIEW,
        )

        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            DRAFT_GENERATE_URL,
            self.payload(channels=[ContentBrief.Channel.LINKEDIN]),
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(ContentDraft.objects.count(), 1)
        existing.refresh_from_db()
        self.assertEqual(existing.title, response.data["drafts"][0]["title"])
        self.assertEqual(existing.content, response.data["drafts"][0]["content"])
        self.assertEqual(existing.status, ContentDraft.DraftStatus.DRAFT)
        self.assertEqual(str(existing.id), response.data["drafts"][0]["id"])
