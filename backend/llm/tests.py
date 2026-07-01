from django.contrib.auth import get_user_model
from django.test import TestCase

from tenancy.models import Workspace

from .models import AIRun
from .providers import AIProviderError, MockProvider
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
