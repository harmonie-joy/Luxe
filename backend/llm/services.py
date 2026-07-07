import base64

from brand.models import BrandAsset

from . import prompts
from .models import AIRun
from .providers import get_provider
from .schemas import (
    BrandAssetAnalysisResult,
    BrandVoiceExtractionResult,
    ComplianceReviewResult,
    DraftGenerationResult,
    VoiceReviewResult,
)


def analyze_brand_asset_with_run(workspace, brand_profile, asset, user=None, provider=None):
    context = _brand_asset_analysis_context(brand_profile, asset)
    result, run = _run_ai_task(
        workspace=workspace,
        user=user,
        provider=provider,
        task_type=AIRun.TaskType.BRAND_ASSET_ANALYSIS,
        schema=BrandAssetAnalysisResult,
        prompt=prompts.brand_asset_analysis_prompt(
            context, is_image=asset.media_type == BrandAsset.MediaType.IMAGE
        ),
        input_data=context,
        images=_brand_asset_images(asset),
        return_run=True,
    )
    asset.analysis_summary = result.summary
    asset.status = BrandAsset.AssetStatus.READY
    asset.save(update_fields=["analysis_summary", "status", "updated_at"])
    return result, run


def extract_brand_voice(workspace, samples, user=None, provider=None, brand_profile=None):
    context = _brand_voice_extraction_context(samples, brand_profile)
    return _run_ai_task(
        workspace=workspace,
        user=user,
        provider=provider,
        task_type=AIRun.TaskType.BRAND_VOICE_EXTRACTION,
        schema=BrandVoiceExtractionResult,
        prompt=prompts.brand_voice_extraction_prompt(context),
        input_data=context,
    )


def extract_brand_voice_with_run(workspace, samples, user=None, provider=None, brand_profile=None):
    context = _brand_voice_extraction_context(samples, brand_profile)
    return _run_ai_task(
        workspace=workspace,
        user=user,
        provider=provider,
        task_type=AIRun.TaskType.BRAND_VOICE_EXTRACTION,
        schema=BrandVoiceExtractionResult,
        prompt=prompts.brand_voice_extraction_prompt(context),
        input_data=context,
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
        prompt=prompts.draft_generation_prompt(context),
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
        prompt=prompts.draft_generation_prompt(context),
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
        prompt=prompts.voice_review_prompt({"draft": draft, "brand_voice": brand_voice}),
        input_data={"draft": draft, "brand_voice": brand_voice},
    )


def review_compliance(workspace, draft, user=None, provider=None):
    return _run_ai_task(
        workspace=workspace,
        user=user,
        provider=provider,
        task_type=AIRun.TaskType.COMPLIANCE_REVIEW,
        schema=ComplianceReviewResult,
        prompt=prompts.compliance_review_prompt({"draft": draft}),
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
    images=None,
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
        result = provider.generate(prompt, schema, images=images)
    except Exception as error:
        run.mark_failed(error)
        raise

    run.mark_succeeded(result.model_dump(mode="json"))
    if return_run:
        return result, run
    return result


def _brand_asset_analysis_context(brand_profile, asset):
    return {
        "brand_profile": _brand_profile_context(brand_profile),
        "asset": {
            "title": asset.title,
            "format": asset.format,
            "media_type": asset.media_type,
            "mime_type": asset.mime_type,
            "content": asset.content,
            "has_file": bool(asset.file),
        },
    }



def _brand_asset_images(asset):
    if asset.media_type != BrandAsset.MediaType.IMAGE or not asset.file:
        return None

    with asset.file.open("rb") as image_file:
        return [base64.b64encode(image_file.read()).decode("ascii")]


def _brand_voice_extraction_context(samples, brand_profile=None):
    if isinstance(samples, str):
        return {
            "brand_profile": {},
            "assets": [
                {
                    "title": "Sample",
                    "format": "",
                    "media_type": "text",
                    "content": samples,
                    "analysis_summary": "",
                }
            ]
        }

    return {
        "brand_profile": _brand_profile_context(brand_profile),
        "assets": [
            {
                "title": asset.title,
                "format": asset.format,
                "media_type": asset.media_type,
                "content": "" if asset.media_type == BrandAsset.MediaType.IMAGE else asset.content,
                "analysis_summary": asset.analysis_summary,
            }
            for asset in samples
        ]
    }


def _brand_profile_context(brand_profile):
    if not brand_profile:
        return {}

    return {
        "audience": brand_profile.audience,
        "tone": brand_profile.tone,
        "preferred_vocabulary": brand_profile.preferred_vocabulary,
        "banned_phrases": brand_profile.banned_phrases,
        "positioning_notes": brand_profile.positioning_notes,
    }



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

