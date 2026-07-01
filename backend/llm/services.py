from .models import AIRun
from .providers import get_provider
from .schemas import (
    BrandVoiceExtractionResult,
    ComplianceReviewResult,
    DraftGenerationResult,
    VoiceReviewResult,
)


def extract_brand_voice(workspace, sample_text, user=None, provider=None):
    return _run_ai_task(
        workspace=workspace,
        user=user,
        provider=provider,
        task_type=AIRun.TaskType.BRAND_VOICE_EXTRACTION,
        schema=BrandVoiceExtractionResult,
        prompt=f"Extract brand voice from this sample:\n{sample_text}",
        input_data={"sample_text": sample_text},
    )


def generate_draft(workspace, brief, channel, user=None, provider=None):
    return _run_ai_task(
        workspace=workspace,
        user=user,
        provider=provider,
        task_type=AIRun.TaskType.DRAFT_GENERATION,
        schema=DraftGenerationResult,
        prompt=f"Generate a {channel} draft for this brief:\n{brief}",
        input_data={"brief": brief, "channel": channel},
    )


def review_voice(workspace, draft, brand_voice, user=None, provider=None):
    return _run_ai_task(
        workspace=workspace,
        user=user,
        provider=provider,
        task_type=AIRun.TaskType.VOICE_REVIEW,
        schema=VoiceReviewResult,
        prompt=f"Review this draft against brand voice:\n{brand_voice}\n\n{draft}",
        input_data={"draft": draft, "brand_voice": brand_voice},
    )


def review_compliance(workspace, draft, user=None, provider=None):
    return _run_ai_task(
        workspace=workspace,
        user=user,
        provider=provider,
        task_type=AIRun.TaskType.COMPLIANCE_REVIEW,
        schema=ComplianceReviewResult,
        prompt=f"Review this draft for GDPR, consent, IP, and claims issues:\n{draft}",
        input_data={"draft": draft},
    )


def _run_ai_task(workspace, user, provider, task_type, schema, prompt, input_data):
    provider = provider or get_provider()
    run = AIRun.objects.create(
        workspace=workspace,
        user=user,
        task_type=task_type,
        provider=provider.name,
        model=getattr(provider, "model", ""),
        input_data=input_data,
    )

    try:
        result = provider.generate(prompt, schema)
    except Exception as error:
        run.mark_failed(error)
        raise

    run.mark_succeeded(result.model_dump(mode="json"))
    return result
