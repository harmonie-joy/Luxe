import json
from unittest.mock import Mock, patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APITestCase

from brand.models import (
    AudienceSegment,
    BrandAsset,
    BrandProfile,
    BrandVoice,
    BrandVoiceApproval,
    ChannelStyle,
    VoiceAuditScore,
    VoiceExample,
)
from content.models import ContentBrief, ContentDraft
from tenancy.models import Membership, Workspace

from . import prompts
from .models import AIRun
from .providers import MOCK_RESULTS, AIProviderError, MockProvider, OllamaProvider
from .schemas import (
    BrandAssetAnalysisResult,
    BrandVoiceExtractionResult,
    ComplianceReviewResult,
    DraftGenerationResult,
    VoiceReviewResult,
)
from .services import (
    _effective_tone,
    _voice_examples_context,
    analyze_brand_asset,
    extract_brand_voice,
    generate_draft,
    review_compliance,
    review_voice,
)

User = get_user_model()
BRAND_EXTRACT_URL = "/api/ai/brand/extract/"
BRAND_ANALYZE_ASSETS_URL = "/api/ai/brand/analyze-assets/"
DRAFT_GENERATE_URL = "/api/ai/drafts/generate/"


class RecordingProvider(MockProvider):
    def __init__(self):
        super().__init__()
        self.prompt = ""

    def generate(self, prompt, schema, images=None):
        self.prompt = prompt
        self.images = images
        return super().generate(prompt, schema, images=images)


@override_settings(MEDIA_ROOT="/tmp/theluxe-test-media")
class MockAIServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="ai_user", password="pass")
        self.workspace = Workspace.objects.create(
            name="AI Workspace",
            created_by=self.user,
        )
        self.provider = MockProvider()

    def test_mock_services_return_schema_valid_results(self):
        profile = BrandProfile.objects.create(
            workspace=self.workspace,
            name="Mock Voice",
        )
        extraction, voice, _run = extract_brand_voice(
            self.workspace,
            profile,
            assets=[],
            user=self.user,
            provider=self.provider,
        )
        self.assertIsInstance(extraction, BrandVoiceExtractionResult)
        draft_result, _run = generate_draft(
            self.workspace,
            "Announce a new collection.",
            "linkedin",
            user=self.user,
            provider=self.provider,
        )
        self.assertIsInstance(draft_result, DraftGenerationResult)
        voice_result, _run = review_voice(
            self.workspace,
            "A calm launch note.",
            voice,
            user=self.user,
            provider=self.provider,
        )
        self.assertIsInstance(voice_result, VoiceReviewResult)
        compliance_result, _run = review_compliance(
            self.workspace,
            "This product will double conversion.",
            user=self.user,
            provider=self.provider,
        )
        self.assertIsInstance(compliance_result, ComplianceReviewResult)
        self.assertEqual(AIRun.objects.filter(status=AIRun.Status.SUCCEEDED).count(), 4)

    def test_successful_run_records_output(self):
        result, _run = generate_draft(
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
        )
        AudienceSegment.objects.create(
            brand_profile=profile,
            name="Service business owners",
            is_primary=True,
        )
        asset = BrandAsset.objects.create(
            brand_profile=profile,
            title="Homepage sample",
            format="landing_page",
            content="We help consultants explain their offer without hype.",
        )
        provider = RecordingProvider()

        result, voice, run = extract_brand_voice(
            self.workspace,
            profile,
            assets=[asset],
            user=self.user,
            provider=provider,
        )

        self.assertIsInstance(result, BrandVoiceExtractionResult)
        self.assertIn("Extraction Voice", provider.prompt)
        self.assertIn("Service business owners", provider.prompt)
        self.assertIn("Homepage sample", provider.prompt)
        self.assertIn("landing_page", provider.prompt)
        self.assertIn("consultants explain their offer", provider.prompt)
        self.assertTrue(result.voice_summary)
        self.assertTrue(0 <= result.tone.casual <= 100)
        self.assertEqual(run.input_data["assets"][0]["title"], "Homepage sample")
        self.assertEqual(run.input_data["assets"][0]["format"], "landing_page")
        self.assertIn("without hype", run.input_data["assets"][0]["content"])
        self.assertEqual(run.input_data["brand_profile"]["name"], "Extraction Voice")
        self.assertEqual(
            run.input_data["brand_profile"]["segments"][0]["name"],
            "Service business owners",
        )
        self.assertEqual(list(voice.extracted_from.all()), [asset])

    def test_asset_analysis_records_summary_and_run(self):
        profile = BrandProfile.objects.create(
            workspace=self.workspace,
            name="Analysis Voice",
        )
        asset = BrandAsset.objects.create(
            brand_profile=profile,
            title="Transcript sample",
            media_type=BrandAsset.MediaType.AUDIO_TRANSCRIPT,
            content="We help operators speak clearly without promising results.",
        )
        provider = RecordingProvider()

        result, run = analyze_brand_asset(
            self.workspace,
            profile,
            asset,
            user=self.user,
            provider=provider,
        )

        asset.refresh_from_db()
        self.assertEqual(run.task_type, AIRun.TaskType.BRAND_ASSET_ANALYSIS)
        self.assertEqual(asset.status, BrandAsset.AssetStatus.READY)
        self.assertEqual(asset.analysis_summary, result.summary)
        self.assertEqual(asset.language, "en")
        self.assertIn("AUDIO_TRANSCRIPT".lower(), provider.prompt.lower())

    def test_image_asset_analysis_sends_base64_images_to_provider(self):
        profile = BrandProfile.objects.create(
            workspace=self.workspace,
            name="Image Voice",
            audience="Premium operators",
            tone=["professional"],
        )
        asset = BrandAsset.objects.create(
            brand_profile=profile,
            title="Moodboard",
            media_type=BrandAsset.MediaType.IMAGE,
            file=SimpleUploadedFile(
                "moodboard.png",
                b"fake-image-bytes",
                content_type="image/png",
            ),
            mime_type="image/png",
        )
        provider = RecordingProvider()

        analyze_brand_asset(
            self.workspace,
            profile,
            asset,
            user=self.user,
            provider=provider,
        )

        self.assertEqual(provider.images, ["ZmFrZS1pbWFnZS1ieXRlcw=="])

    def test_draft_generation_prompt_includes_brief_and_brand_voice_context(self):
        profile = BrandProfile.objects.create(
            workspace=self.workspace,
            name="Prompt Voice",
            category="editorial studio",
            key_benefit="turn brand direction into clear stories",
        )
        ChannelStyle.objects.create(
            brand_profile=profile,
            channel=ContentBrief.Channel.LINKEDIN,
            target_length="80-150 words",
            structure_norms="Hook, one useful point, soft invitation.",
            emoji_policy="no emoji characters",
            hashtag_policy="only #BrandDirection",
            cta_style="invite readers to share their perspective",
        )
        AudienceSegment.objects.create(
            brand_profile=profile,
            name="Premium founders",
            is_primary=True,
        )
        voice = BrandVoice.objects.create(
            brand_profile=profile,
            version=1,
            is_active=True,
            preferred_vocabulary=[
                {"term": "clientele", "instead_of": "customers", "note": "Elevated."}
            ],
            banned_phrases=[
                {"phrase": "cheap", "reason": "Off-brand.", "severity": "hard"}
            ],
        )
        VoiceExample.objects.create(
            voice=voice,
            kind=VoiceExample.Kind.DO,
            text="We prepared three considered options.",
            annotation="Specific and calm.",
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
        self.assertIn("Prompt Voice", provider.prompt)
        self.assertIn("editorial studio", provider.prompt)
        self.assertIn("turn brand direction into clear stories", provider.prompt)
        self.assertIn("Premium founders", provider.prompt)
        self.assertIn("80-150 words", provider.prompt)
        self.assertIn("Hook, one useful point, soft invitation.", provider.prompt)
        self.assertIn("no emoji characters", provider.prompt)
        self.assertIn("only #BrandDirection", provider.prompt)
        self.assertIn("invite readers to share their perspective", provider.prompt)
        self.assertIn("clientele", provider.prompt)
        self.assertIn("cheap", provider.prompt)
        self.assertIn("We prepared three considered options.", provider.prompt)
        run = AIRun.objects.get()
        self.assertEqual(
            run.input_data["brief"]["content_objective"],
            "Announce a private preview.",
        )
        self.assertEqual(run.input_data["channel"], ContentBrief.Channel.LINKEDIN)
        self.assertEqual(
            run.input_data["brand_profile"]["category"],
            "editorial studio",
        )
        self.assertEqual(
            run.input_data["brand_profile"]["key_benefit"],
            "turn brand direction into clear stories",
        )
        self.assertEqual(
            run.input_data["channel_style"],
            {
                "target_length": "80-150 words",
                "structure_norms": "Hook, one useful point, soft invitation.",
                "emoji_policy": "no emoji characters",
                "hashtag_policy": "only #BrandDirection",
                "cta_style": "invite readers to share their perspective",
                "notes": "",
            },
        )
        self.assertEqual(
            run.input_data["voice"]["preferred_vocabulary"][0]["term"],
            "clientele",
        )
        self.assertEqual(
            run.input_data["effective_tone"],
            {"funny": 50, "casual": 50, "irreverent": 50, "enthusiastic": 50},
        )
        self.assertEqual(
            run.input_data["audience_segment"]["name"],
            "Premium founders",
        )

    @override_settings(OLLAMA_MODEL="")
    def test_ollama_provider_requires_model_from_environment(self):
        with self.assertRaisesMessage(
            AIProviderError,
            "OLLAMA_MODEL must be set when AI_PROVIDER=ollama.",
        ):
            OllamaProvider(base_url="http://localhost:11434")

    @override_settings(OLLAMA_MODEL="gemma4:12b", OLLAMA_NUM_PREDICT=8192)
    def test_ollama_provider_sends_generation_budget(self):
        response = Mock()
        response.json.return_value = {
            "response": json.dumps(
                {
                    "summary": "Clear brand reference.",
                    "audience_clues": [],
                    "tone_clues": [],
                }
            )
        }

        with patch("llm.providers.requests.post", return_value=response) as post:
            OllamaProvider(base_url="http://localhost:11434").generate(
                "Analyze this sample.",
                BrandAssetAnalysisResult,
            )

        payload = post.call_args.kwargs["json"]
        self.assertEqual(payload["options"]["num_predict"], 8192)
        self.assertEqual(payload["format"]["title"], "BrandAssetAnalysisResult")

    @override_settings(OLLAMA_MODEL="gemma4:12b", OLLAMA_NUM_PREDICT=4096)
    def test_ollama_provider_accepts_first_json_object(self):
        response = Mock()
        response.json.return_value = {
            "response": (
                '{"summary": "Clear brand reference.", "audience_clues": [], '
                '"tone_clues": []}\n\nDone.'
            )
        }

        with patch("llm.providers.requests.post", return_value=response):
            result = OllamaProvider(base_url="http://localhost:11434").generate(
                "Analyze this sample.",
                BrandAssetAnalysisResult,
            )

        self.assertEqual(result.summary, "Clear brand reference.")


@override_settings(AI_PROVIDER="mock", MEDIA_ROOT="/tmp/theluxe-test-media")
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
        self.assertTrue(suggestions.voice_summary)
        self.assertTrue(0 <= suggestions.tone.funny <= 100)
        self.assertGreaterEqual(len(suggestions.examples), 6)

        voice = BrandVoice.objects.get(id=response.data["voice"]["id"])
        self.assertEqual(voice.brand_profile, self.profile)
        self.assertEqual(response.data["voice"]["version"], voice.version)
        # First extraction for a profile with no active voice auto-activates.
        self.assertTrue(response.data["voice"]["isActive"])
        self.assertFalse(BrandVoiceApproval.objects.filter(voice=voice).exists())
        self.assertEqual(voice.examples.count(), len(suggestions.examples))

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


@override_settings(AI_PROVIDER="mock", MEDIA_ROOT="/tmp/theluxe-test-media")
class BrandAssetAnalysisAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="asset_ai_user", password="pass")
        self.other_user = User.objects.create_user(username="asset_ai_other", password="pass")
        self.workspace = Workspace.objects.create(name="Asset AI Workspace")
        self.other_workspace = Workspace.objects.create(name="Other Asset AI Workspace")
        Membership.objects.create(user=self.user, workspace=self.workspace)
        Membership.objects.create(user=self.other_user, workspace=self.other_workspace)
        self.profile = BrandProfile.objects.create(
            workspace=self.workspace,
            name="Asset Voice",
            audience="Premium teams",
            tone=["professional"],
        )
        self.other_profile = BrandProfile.objects.create(
            workspace=self.other_workspace,
            name="Other Asset Voice",
            audience="Other teams",
            tone=["visionary"],
        )
        self.text_asset = BrandAsset.objects.create(
            brand_profile=self.profile,
            title="Text Sample",
            media_type=BrandAsset.MediaType.TEXT,
            content="Specific, calm brand copy for premium teams.",
        )
        self.image_asset = BrandAsset.objects.create(
            brand_profile=self.profile,
            title="Image Sample",
            media_type=BrandAsset.MediaType.IMAGE,
            file=SimpleUploadedFile("sample.png", b"image", content_type="image/png"),
            mime_type="image/png",
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
            "asset_ids": [str(self.text_asset.id), str(self.image_asset.id)],
        }
        data.update(overrides)
        return data

    def test_authenticated_success_updates_asset_summaries_and_returns_runs(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            BRAND_ANALYZE_ASSETS_URL,
            self.payload(),
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["aiRunIds"]), 2)
        self.assertEqual(response.data["warnings"], [])
        self.assertEqual(len(response.data["assets"]), 2)
        self.assertEqual(AIRun.objects.count(), 2)
        self.text_asset.refresh_from_db()
        self.image_asset.refresh_from_db()
        self.assertTrue(self.text_asset.analysis_summary)
        self.assertTrue(self.image_asset.analysis_summary)
        self.assertEqual(self.text_asset.status, BrandAsset.AssetStatus.READY)
        self.assertEqual(self.image_asset.status, BrandAsset.AssetStatus.READY)

    def test_foreign_workspace_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            BRAND_ANALYZE_ASSETS_URL,
            self.payload(workspace=str(self.other_workspace.id)),
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_foreign_asset_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            BRAND_ANALYZE_ASSETS_URL,
            self.payload(asset_ids=[str(self.text_asset.id), str(self.other_asset.id)]),
            format="json",
        )
        self.assertEqual(response.status_code, 403)


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
                run.input_data["brand_profile"]["name"],
                "Draft Voice",
            )
            # No extracted voice exists yet, so voice context is empty.
            self.assertEqual(run.input_data["voice"], {})

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


class SchemaAndPromptTests(TestCase):
    """Slice 2: schemas instantiate from mock fixtures; prompts stay tenant-neutral."""

    def test_mock_fixtures_validate_against_their_schemas(self):
        for schema in (
            BrandAssetAnalysisResult,
            BrandVoiceExtractionResult,
            DraftGenerationResult,
            VoiceReviewResult,
            ComplianceReviewResult,
        ):
            result = schema.model_validate(MOCK_RESULTS[schema.__name__])
            self.assertIsInstance(result, schema)

    def _all_prompts(self):
        context = {
            "brand_profile": {"name": "Maison Belle"},
            "channel": "linkedin",
            "draft": "A calm launch note.",
        }
        return {
            "asset_analysis_text": prompts.brand_asset_analysis_prompt(context, is_image=False),
            "asset_analysis_image": prompts.brand_asset_analysis_prompt(context, is_image=True),
            "voice_extraction": prompts.brand_voice_extraction_prompt(context),
            "draft_generation": prompts.draft_generation_prompt(context),
            "voice_review": prompts.voice_review_prompt(context),
            "compliance_review": prompts.compliance_review_prompt(context),
        }

    def test_no_prompt_contains_the_platform_name(self):
        platform_name = " ".join(("THE", "LUXE"))  # keeps the repo grep gate clean
        for name, prompt in self._all_prompts().items():
            self.assertNotIn(platform_name, prompt, f"{name} hardcodes the platform name")

    def test_prompts_reference_the_workspace_brand_name(self):
        built = self._all_prompts()
        self.assertIn("Maison Belle", built["voice_extraction"])
        self.assertIn("Maison Belle", built["draft_generation"])

    def test_prompts_fall_back_without_a_brand_name(self):
        prompt = prompts.brand_voice_extraction_prompt({"brand_profile": {}})
        self.assertIn("this brand", prompt)


class VoiceDnaServiceTests(TestCase):
    """Slice 3: versioned extraction, persisted enforcement, effective tone."""

    def setUp(self):
        self.user = User.objects.create_user(username="dna_user", password="pass")
        self.workspace = Workspace.objects.create(name="DNA Workspace")
        self.profile = BrandProfile.objects.create(
            workspace=self.workspace, name="Maison Calme"
        )
        self.provider = MockProvider()

    def extract(self, **kwargs):
        return extract_brand_voice(
            self.workspace,
            self.profile,
            assets=[],
            user=self.user,
            provider=self.provider,
            **kwargs,
        )

    def test_extraction_creates_next_version_with_examples(self):
        _result, v1, _run = self.extract()
        result, v2, _run = self.extract()

        self.assertEqual((v1.version, v2.version), (1, 2))
        v1.refresh_from_db()
        # v1 auto-activated (no active voice existed); v2 stays inactive.
        self.assertTrue(v1.is_active)
        self.assertFalse(v2.is_active)
        self.assertEqual(v2.examples.count(), len(result.examples))
        self.assertEqual(
            v2.examples.filter(kind=VoiceExample.Kind.DO).count(),
            sum(1 for e in result.examples if e.kind == "do"),
        )
        self.assertEqual(v2.tone_casual, result.tone.casual)
        self.assertEqual(v2.preferred_vocabulary[0]["term"], "practical clarity")
        self.assertEqual(v2.banned_phrases[0]["severity"], "soft")
        self.assertEqual(v2.extraction_confidence, result.confidence)

    def test_extraction_with_activate_swaps_active_voice(self):
        _result, v1, _run = self.extract()
        _result, v2, _run = self.extract(activate=True)

        v1.refresh_from_db()
        v2.refresh_from_db()
        self.assertFalse(v1.is_active)
        self.assertTrue(v2.is_active)
        self.assertEqual(self.profile.active_voice, v2)

    def test_extraction_defaults_to_ready_assets(self):
        ready = BrandAsset.objects.create(
            brand_profile=self.profile,
            title="Ready sample",
            content="Calm, specific copy.",
            status=BrandAsset.AssetStatus.READY,
        )
        BrandAsset.objects.create(
            brand_profile=self.profile,
            title="Excluded sample",
            content="Stale copy.",
            status=BrandAsset.AssetStatus.EXCLUDED,
        )

        _result, voice, run = extract_brand_voice(
            self.workspace,
            self.profile,
            user=self.user,
            provider=self.provider,
        )

        self.assertEqual(list(voice.extracted_from.all()), [ready])
        self.assertEqual(len(run.input_data["assets"]), 1)

    def test_review_voice_persists_audit_score(self):
        _result, voice, _run = self.extract()
        draft_text = "A considered launch note for existing clients." * 20

        result, run = review_voice(
            self.workspace,
            draft_text,
            voice,
            channel="linkedin",
            user=self.user,
            provider=self.provider,
        )

        score = VoiceAuditScore.objects.get()
        self.assertEqual(score.voice, voice)
        self.assertEqual(score.channel, "linkedin")
        self.assertEqual(score.overall_score, result.overall_score)
        self.assertEqual(
            set(score.dimension_scores),
            {"tone_alignment", "vocabulary", "sentence_style", "claims", "channel_fit"},
        )
        self.assertEqual(len(score.violations), len(result.violations))
        self.assertEqual(score.violations[0]["severity"], "soft")
        self.assertEqual(score.ai_run, run)
        self.assertEqual(len(score.draft_excerpt), 500)

    def test_effective_tone_applies_and_clamps_channel_deltas(self):
        voice = BrandVoice.objects.create(
            brand_profile=self.profile,
            version=1,
            tone_funny=95,
            tone_casual=10,
            tone_irreverent=40,
            tone_enthusiastic=60,
        )
        ChannelStyle.objects.create(
            brand_profile=self.profile,
            channel="instagram",
            tone_funny_delta=20,
            tone_casual_delta=-30,
            tone_irreverent_delta=5,
            tone_enthusiastic_delta=0,
        )

        self.assertEqual(
            _effective_tone(voice, "instagram"),
            {"funny": 100, "casual": 0, "irreverent": 45, "enthusiastic": 60},
        )
        # No style for the channel: base sliders pass through.
        self.assertEqual(
            _effective_tone(voice, "blog"),
            {"funny": 95, "casual": 10, "irreverent": 40, "enthusiastic": 60},
        )

    def test_voice_examples_context_prefers_channel_matches(self):
        voice = BrandVoice.objects.create(brand_profile=self.profile, version=1)
        linkedin_do = VoiceExample.objects.create(
            voice=voice,
            kind=VoiceExample.Kind.DO,
            text="LinkedIn-specific opener.",
            annotation="Channel match.",
            channel="linkedin",
        )
        VoiceExample.objects.create(
            voice=voice,
            kind=VoiceExample.Kind.DO,
            text="General opener.",
            annotation="Fallback.",
        )

        examples = _voice_examples_context(voice, "linkedin", limit_per_kind=1)
        self.assertEqual(examples[0]["text"], linkedin_do.text)

        general = _voice_examples_context(voice, "", limit_per_kind=1)
        self.assertEqual(general[0]["text"], "General opener.")

    def test_review_compliance_includes_claim_boundaries_from_voice(self):
        _result, voice, _run = self.extract()
        provider = RecordingProvider()

        _result, run = review_compliance(
            self.workspace,
            "This will double your revenue.",
            user=self.user,
            provider=provider,
            voice=voice,
        )

        self.assertIn("Never promise performance outcomes.", provider.prompt)
        self.assertEqual(
            run.input_data["claim_boundaries"],
            voice.claim_boundaries,
        )
