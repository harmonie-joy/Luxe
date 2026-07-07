"""
AI service layer for the brand engine.

- All prompts live in prompts.py; nothing tenant-specific is hardcoded.
- Voice extraction persists a new versioned BrandVoice (+ VoiceExample rows)
  instead of overwriting profile fields — drift is visible and reversible.
- Draft generation resolves the effective tone per channel (voice sliders +
  ChannelStyle deltas) and injects annotated few-shot examples.
- Voice reviews are persisted as VoiceAuditScore rows, turning enforcement
  into a time series instead of a throwaway response.
- _run_ai_task always returns (result, run); no *_with_run duplicates.
"""

import base64

from brand.models import (
    BrandAsset,
    BrandVoice,
    Channel,
    ChannelStyle,
    VoiceAuditScore,
    VoiceExample,
)

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


def _clamp(value, low=0, high=100):
    return max(low, min(high, value))


def _run_ai_task(workspace, user, provider, task_type, schema, prompt, input_data, images=None):
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
    return result, run


# --------------------------------------------------------------------------
# Asset analysis
# --------------------------------------------------------------------------

def analyze_brand_asset(workspace, brand_profile, asset, user=None, provider=None):
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
    )

    asset.analysis_summary = result.summary
    if result.detected_language and not asset.language:
        asset.language = result.detected_language
    asset.status = (
        BrandAsset.AssetStatus.NEEDS_REVIEW
        if result.quality_flag == "recommend_exclude"
        else BrandAsset.AssetStatus.READY
    )
    asset.save(update_fields=["analysis_summary", "language", "status", "updated_at"])
    return result, run


# --------------------------------------------------------------------------
# Voice extraction (versioned)
# --------------------------------------------------------------------------

def extract_brand_voice(workspace, brand_profile, assets=None, user=None, provider=None, activate=False):
    """
    Extract a new BrandVoice version from the profile's ready assets.
    Never overwrites: creates version N+1; the version only becomes active
    via `activate=True` or when the profile has no active voice yet.
    Returns (result, voice, run).
    """
    assets = list(
        assets
        if assets is not None
        else brand_profile.assets.filter(status=BrandAsset.AssetStatus.READY)
    )
    context = _brand_voice_extraction_context(brand_profile, assets)
    result, run = _run_ai_task(
        workspace=workspace,
        user=user,
        provider=provider,
        task_type=AIRun.TaskType.BRAND_VOICE_EXTRACTION,
        schema=BrandVoiceExtractionResult,
        prompt=prompts.brand_voice_extraction_prompt(context),
        input_data=context,
    )

    last = brand_profile.voices.order_by("-version").first()
    voice = BrandVoice.objects.create(
        brand_profile=brand_profile,
        version=(last.version + 1) if last else 1,
        voice_summary=result.voice_summary,
        tone_funny=result.tone.funny,
        tone_casual=result.tone.casual,
        tone_irreverent=result.tone.irreverent,
        tone_enthusiastic=result.tone.enthusiastic,
        tone_tags=result.tone_tags,
        point_of_view=result.point_of_view,
        sentence_style=result.sentence_style,
        pacing=result.pacing,
        proof_style=result.proof_style,
        claim_boundaries=[c.model_dump() for c in result.claim_boundaries],
        preferred_vocabulary=[v.model_dump() for v in result.preferred_vocabulary],
        banned_phrases=[b.model_dump() for b in result.banned_phrases],
        extraction_confidence=result.confidence,
        extraction_notes=result.extraction_notes,
    )
    voice.extracted_from.set(assets)
    VoiceExample.objects.bulk_create(
        VoiceExample(
            voice=voice,
            kind=example.kind,
            text=example.text,
            annotation=example.annotation,
            channel=example.channel if example.channel in Channel.values else "",
        )
        for example in result.examples
    )
    if activate or not brand_profile.voices.filter(is_active=True).exists():
        voice.activate()
    return result, voice, run


# --------------------------------------------------------------------------
# Draft generation (channel-aware)
# --------------------------------------------------------------------------

def generate_draft(workspace, brief, channel, user=None, provider=None, segment=None):
    context = _draft_generation_context(brief, channel, segment)
    return _run_ai_task(
        workspace=workspace,
        user=user,
        provider=provider,
        task_type=AIRun.TaskType.DRAFT_GENERATION,
        schema=DraftGenerationResult,
        prompt=prompts.draft_generation_prompt(context),
        input_data=context,
    )


# --------------------------------------------------------------------------
# Voice review (persisted enforcement)
# --------------------------------------------------------------------------

def review_voice(workspace, draft, voice, channel="", user=None, provider=None):
    context = {
        "draft": draft,
        "channel": channel,
        "voice": _voice_context(voice),
        "effective_tone": _effective_tone(voice, channel),
        "channel_style": _channel_style_context(voice.brand_profile, channel),
        "examples": _voice_examples_context(voice, channel),
    }
    result, run = _run_ai_task(
        workspace=workspace,
        user=user,
        provider=provider,
        task_type=AIRun.TaskType.VOICE_REVIEW,
        schema=VoiceReviewResult,
        prompt=prompts.voice_review_prompt(context),
        input_data=context,
    )
    VoiceAuditScore.objects.create(
        voice=voice,
        channel=channel,
        draft_excerpt=draft[:500],
        overall_score=result.overall_score,
        dimension_scores={
            "tone_alignment": result.tone_alignment,
            "vocabulary": result.vocabulary,
            "sentence_style": result.sentence_style,
            "claims": result.claims,
            "channel_fit": result.channel_fit,
        },
        violations=[v.model_dump() for v in result.violations],
        ai_run=run,
    )
    return result, run


def review_compliance(workspace, draft, user=None, provider=None, voice=None, jurisdiction="EU"):
    context = {
        "draft": draft,
        "jurisdiction": jurisdiction,
        "claim_boundaries": voice.claim_boundaries if voice else [],
    }
    return _run_ai_task(
        workspace=workspace,
        user=user,
        provider=provider,
        task_type=AIRun.TaskType.COMPLIANCE_REVIEW,
        schema=ComplianceReviewResult,
        prompt=prompts.compliance_review_prompt(context),
        input_data=context,
    )


# --------------------------------------------------------------------------
# Context builders
# --------------------------------------------------------------------------

def _brand_profile_context(brand_profile):
    if not brand_profile:
        return {}
    return {
        "name": brand_profile.name,
        "maturity_stage": brand_profile.maturity_stage,
        "primary_language": brand_profile.primary_language,
        "industry": brand_profile.industry,
        "category": brand_profile.category,
        "key_benefit": brand_profile.key_benefit,
        "differentiators": brand_profile.differentiators,
        "reasons_to_believe": brand_profile.reasons_to_believe,
        "competitors": brand_profile.competitors,
        "known_for": brand_profile.known_for,
        "mission": brand_profile.mission,
        "values": brand_profile.values,
        "tagline": brand_profile.tagline,
        "archetype": brand_profile.archetype,
        "secondary_archetype": brand_profile.secondary_archetype,
        "personality": {
            "sincerity": brand_profile.personality_sincerity,
            "excitement": brand_profile.personality_excitement,
            "competence": brand_profile.personality_competence,
            "sophistication": brand_profile.personality_sophistication,
            "ruggedness": brand_profile.personality_ruggedness,
        },
        "segments": [_segment_context(s) for s in brand_profile.segments.all()],
    }


def _segment_context(segment):
    if not segment:
        return {}
    return {
        "name": segment.name,
        "is_primary": segment.is_primary,
        "buyer_type": segment.buyer_type,
        "maturity_level": segment.maturity_level,
        "pains": segment.pains,
        "desired_outcomes": segment.desired_outcomes,
        "jargon_tolerance": segment.jargon_tolerance,
        "objections": segment.objections,
    }


def _asset_context(asset):
    return {
        "title": asset.title,
        "format": asset.format,
        "media_type": asset.media_type,
        "channel": asset.channel,
        "language": asset.language,
        "source_type": asset.source_type,
        "source_url": asset.source_url,
        "performance_signal": asset.performance_signal,
        "content_date": asset.content_date.isoformat() if asset.content_date else None,
        "status": asset.status,
        "content": "" if asset.media_type == BrandAsset.MediaType.IMAGE else asset.content,
        "analysis_summary": asset.analysis_summary,
    }


def _brand_asset_analysis_context(brand_profile, asset):
    return {
        "brand_profile": _brand_profile_context(brand_profile),
        "asset": {**_asset_context(asset), "has_file": bool(asset.file)},
    }


def _brand_asset_images(asset):
    if asset.media_type != BrandAsset.MediaType.IMAGE or not asset.file:
        return None
    with asset.file.open("rb") as image_file:
        return [base64.b64encode(image_file.read()).decode("ascii")]


def _brand_voice_extraction_context(brand_profile, assets):
    return {
        "brand_profile": _brand_profile_context(brand_profile),
        "assets": [_asset_context(a) for a in assets],
    }


def _voice_context(voice):
    if not voice:
        return {}
    return {
        "version": voice.version,
        "voice_summary": voice.voice_summary,
        "tone": {
            "funny": voice.tone_funny,
            "casual": voice.tone_casual,
            "irreverent": voice.tone_irreverent,
            "enthusiastic": voice.tone_enthusiastic,
        },
        "tone_tags": voice.tone_tags,
        "point_of_view": voice.point_of_view,
        "sentence_style": voice.sentence_style,
        "pacing": voice.pacing,
        "proof_style": voice.proof_style,
        "claim_boundaries": voice.claim_boundaries,
        "preferred_vocabulary": voice.preferred_vocabulary,
        "banned_phrases": voice.banned_phrases,
    }


def _voice_examples_context(voice, channel="", limit_per_kind=4):
    """Channel-specific examples first, then general ones."""
    if not voice:
        return []
    examples = []
    for kind in (VoiceExample.Kind.DO, VoiceExample.Kind.DONT):
        qs = voice.examples.filter(kind=kind)
        picked = list(qs.filter(channel=channel)[:limit_per_kind]) if channel else []
        if len(picked) < limit_per_kind:
            seen = {e.pk for e in picked}
            picked += [e for e in qs.filter(channel="") if e.pk not in seen][
                : limit_per_kind - len(picked)
            ]
        examples += [
            {"kind": e.kind, "text": e.text, "annotation": e.annotation, "channel": e.channel}
            for e in picked
        ]
    return examples


def _channel_style_context(brand_profile, channel):
    style = (
        ChannelStyle.objects.filter(brand_profile=brand_profile, channel=channel).first()
        if brand_profile and channel
        else None
    )
    if not style:
        return {}
    return {
        "target_length": style.target_length,
        "structure_norms": style.structure_norms,
        "emoji_policy": style.emoji_policy,
        "hashtag_policy": style.hashtag_policy,
        "cta_style": style.cta_style,
        "notes": style.notes,
    }


def _effective_tone(voice, channel):
    """Voice tone sliders with the channel's deltas applied, clamped 0-100."""
    if not voice:
        return {}
    base = {
        "funny": voice.tone_funny,
        "casual": voice.tone_casual,
        "irreverent": voice.tone_irreverent,
        "enthusiastic": voice.tone_enthusiastic,
    }
    style = (
        ChannelStyle.objects.filter(
            brand_profile=voice.brand_profile, channel=channel
        ).first()
        if channel
        else None
    )
    if not style:
        return base
    return {
        "funny": _clamp(base["funny"] + style.tone_funny_delta),
        "casual": _clamp(base["casual"] + style.tone_casual_delta),
        "irreverent": _clamp(base["irreverent"] + style.tone_irreverent_delta),
        "enthusiastic": _clamp(base["enthusiastic"] + style.tone_enthusiastic_delta),
    }


def _draft_generation_context(brief, channel, segment=None):
    if isinstance(brief, str):
        return {
            "channel": channel,
            "brief": {"summary": brief},
            "brand_profile": {},
            "voice": {},
            "effective_tone": {},
            "channel_style": {},
            "examples": [],
            "audience_segment": {},
        }

    brand_profile = brief.brand_profile
    voice = brand_profile.active_voice
    segment = segment or brand_profile.segments.filter(is_primary=True).first()
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
        "brand_profile": _brand_profile_context(brand_profile),
        "voice": _voice_context(voice),
        "effective_tone": _effective_tone(voice, channel),
        "channel_style": _channel_style_context(brand_profile, channel),
        "examples": _voice_examples_context(voice, channel),
        "audience_segment": _segment_context(segment),
    }
