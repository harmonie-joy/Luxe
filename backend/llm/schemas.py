"""
Pydantic schemas for AI task outputs.

Each schema mirrors the structured model fields it is persisted into, so
extraction results map onto BrandVoice / VoiceExample / AudienceSegment rows
without intermediate text parsing. Compliance categories and severities stay
on the canonical MVP enum values (gdpr, consent, ip, claims / low, medium,
high) from AGENTS.md.
"""

from typing import Annotated, Literal, Optional

from pydantic import BaseModel, Field

Score = Annotated[int, Field(ge=0, le=100)]


# --------------------------------------------------------------------------
# Asset analysis
# --------------------------------------------------------------------------

class BrandAssetAnalysisResult(BaseModel):
    summary: str = Field(
        description="Concise, reusable analysis for later voice extraction."
    )
    audience_clues: list[str] = Field(default_factory=list)
    tone_clues: list[str] = Field(default_factory=list)
    vocabulary_observed: list[str] = Field(default_factory=list)
    generic_or_banned_candidates: list[str] = Field(
        default_factory=list,
        description="Cliché or off-brand phrases found in the asset.",
    )
    claim_observations: list[str] = Field(
        default_factory=list,
        description="Claims made and whether they appear substantiated.",
    )
    do_not_infer: list[str] = Field(
        default_factory=list,
        description="Things this asset does NOT support conclusions about.",
    )
    detected_language: str = ""
    quality_flag: Literal[
        "strong_evidence", "usable", "weak", "recommend_exclude"
    ] = "usable"
    quality_reason: str = ""


# --------------------------------------------------------------------------
# Voice extraction
# --------------------------------------------------------------------------

class ToneDimensions(BaseModel):
    """NN/g four tone-of-voice dimensions, each 0-100."""

    funny: Score = Field(description="0 fully serious .. 100 fully funny")
    casual: Score = Field(description="0 fully formal .. 100 fully casual")
    irreverent: Score = Field(description="0 fully respectful .. 100 fully irreverent")
    enthusiastic: Score = Field(description="0 matter-of-fact .. 100 enthusiastic")
    justification: str = Field(
        default="",
        description="Short evidence-based justification citing patterns from the samples.",
    )


class VocabularyRule(BaseModel):
    term: str
    instead_of: Optional[str] = None
    note: str = ""


class BannedPhrase(BaseModel):
    phrase: str
    reason: str = ""
    severity: Literal["hard", "soft"] = "soft"


class ClaimBoundary(BaseModel):
    rule: str
    reason: str = ""


class ExtractedExample(BaseModel):
    kind: Literal["do", "dont"]
    text: str
    annotation: str = Field(
        default="",
        description="Why this works/fails as a reusable pattern, not a vibe.",
    )
    channel: str = ""


class SegmentSketch(BaseModel):
    name: str
    buyer_type: str = ""
    maturity_level: Literal[
        "unaware", "problem_aware", "solution_aware", "product_aware", "expert"
    ] = "problem_aware"
    pains: list[str] = Field(default_factory=list)
    desired_outcomes: list[str] = Field(default_factory=list)
    jargon_tolerance: Score = 50


class PositioningSketch(BaseModel):
    category: str = ""
    key_benefit: str = ""
    differentiators: list[str] = Field(default_factory=list)
    reasons_to_believe: list[str] = Field(default_factory=list)
    known_for: str = ""


class BrandVoiceExtractionResult(BaseModel):
    voice_summary: str = Field(
        description="2-3 sentences a new writer could act on immediately."
    )
    tone: ToneDimensions
    tone_tags: list[str] = Field(default_factory=list, max_length=4)
    point_of_view: str = ""
    sentence_style: str = Field(
        default="",
        description="Behavioral rules, e.g. 'Short declaratives. Open with the answer.'",
    )
    pacing: str = ""
    proof_style: str = ""
    claim_boundaries: list[ClaimBoundary] = Field(default_factory=list)
    preferred_vocabulary: list[VocabularyRule] = Field(default_factory=list)
    banned_phrases: list[BannedPhrase] = Field(default_factory=list)
    examples: list[ExtractedExample] = Field(
        default_factory=list,
        description="At least 3 'do' and 3 'dont' examples with annotations.",
    )
    audience_segments: list[SegmentSketch] = Field(
        default_factory=list,
        description="Only segments actually evidenced by the samples.",
    )
    positioning: PositioningSketch = Field(default_factory=PositioningSketch)
    confidence: Score = Field(
        default=0,
        description="Extraction confidence given sample volume, recency, and consistency.",
    )
    extraction_notes: str = Field(
        default="",
        description="Gaps, conflicts between assets, and what additional evidence would raise confidence.",
    )


# --------------------------------------------------------------------------
# Draft generation
# --------------------------------------------------------------------------

class DraftGenerationResult(BaseModel):
    title: str
    content: str
    channel: str
    rationale: str = Field(
        default="",
        description="How the draft applies the voice, positioning, and channel norms.",
    )
    self_check: str = Field(
        default="",
        description="One-pass self-review: any tone slider deviations or near-banned phrasing.",
    )


# --------------------------------------------------------------------------
# Voice review (enforcement)
# --------------------------------------------------------------------------

class VoiceViolation(BaseModel):
    span: str = Field(description="Exact text span from the draft.")
    issue: str
    severity: Literal["hard", "soft"]
    suggested_fix: str = ""


class VoiceReviewResult(BaseModel):
    overall_score: Score
    tone_alignment: Score
    vocabulary: Score
    sentence_style: Score
    claims: Score
    channel_fit: Score
    violations: list[VoiceViolation] = Field(default_factory=list)
    summary: str = Field(
        default="", description="One-paragraph verdict with the top fix first."
    )


# --------------------------------------------------------------------------
# Compliance review
# --------------------------------------------------------------------------

class ComplianceIssueResult(BaseModel):
    span: str = ""
    category: Literal["gdpr", "consent", "ip", "claims"]
    severity: Literal["low", "medium", "high"]
    explanation: str
    suggested_fix: str = ""


class ComplianceReviewResult(BaseModel):
    passed: bool
    issues: list[ComplianceIssueResult] = Field(default_factory=list)
    summary: str = ""
    disclaimer: str = Field(default="Automated screening, not legal advice.")
