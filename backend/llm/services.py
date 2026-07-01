import json

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


def extract_brand_voice_with_run(workspace, sample_text, user=None, provider=None):
    return _run_ai_task(
        workspace=workspace,
        user=user,
        provider=provider,
        task_type=AIRun.TaskType.BRAND_VOICE_EXTRACTION,
        schema=BrandVoiceExtractionResult,
        prompt=f"Extract brand voice from this sample:\n{sample_text}",
        input_data={"sample_text": sample_text},
        return_run=True,
    )


def generate_draft(workspace, brief, channel, user=None, provider=None):
    context = _draft_generation_context(brief, channel)
    return _run_ai_task(
        workspace=workspace,
        user=user,
        provider=provider,
        task_type=AIRun.TaskType.DRAFT_GENERATION,
        schema=DraftGenerationResult,
        prompt=_draft_generation_prompt(context),
        input_data=context,
    )


def generate_draft_with_run(workspace, brief, channel, user=None, provider=None):
    context = _draft_generation_context(brief, channel)
    return _run_ai_task(
        workspace=workspace,
        user=user,
        provider=provider,
        task_type=AIRun.TaskType.DRAFT_GENERATION,
        schema=DraftGenerationResult,
        prompt=_draft_generation_prompt(context),
        input_data=context,
        return_run=True,
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


def _run_ai_task(
    workspace,
    user,
    provider,
    task_type,
    schema,
    prompt,
    input_data,
    return_run=False,
):
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
    if return_run:
        return result, run
    return result


def _draft_generation_context(brief, channel):
    if isinstance(brief, str):
        return {
            "channel": channel,
            "brief": {"summary": brief},
            "brand_profile": {},
        }

    brand_profile = brief.brand_profile
    return {
        "channel": channel,
        "brief": {
            "content_objective": brief.content_objective,
            "campaign_goal": brief.campaign_goal,
            "audience": brief.audience,
            "angle": brief.angle,
            "constraints": brief.constraints,
            "target_channels": brief.target_channels,
        },
        "brand_profile": {
            "audience": brand_profile.audience,
            "tone": brand_profile.tone,
            "preferred_vocabulary": brand_profile.preferred_vocabulary,
            "banned_phrases": brand_profile.banned_phrases,
            "positioning_notes": brand_profile.positioning_notes,
        },
    }


def _draft_generation_prompt(context):
    return (
        "Generate one THE LUXE channel-ready content draft as valid JSON only.\n"
        "The JSON must match DraftGenerationResult exactly: "
        "title, content, channel, rationale.\n"
        f"Set channel to {context['channel']!r}.\n"
        "Use the brief fields for intent and constraints. Use the brand profile "
        "for audience, tone, preferred vocabulary, banned phrases, and positioning. "
        "Do not include banned phrases.\n\n"
        f"Context:\n{json.dumps(context, indent=2)}"
    )
