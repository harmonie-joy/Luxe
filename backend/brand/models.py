"""
Brand engine data models (structured Voice DNA architecture).

Design principles:

- Strategy vs. voice separation: BrandProfile holds slow-changing strategy
  (positioning, personality, audience segments). BrandVoice holds linguistic
  execution and is versioned, because it is regenerated whenever samples
  change.
- Tone as dimensions, not adjectives: the four Nielsen Norman Group tone
  dimensions are stored as integer sliders (0-100). Machine-operable,
  diff-able, and channel-adjustable. Descriptive tags remain as a secondary,
  human-friendly layer.
- Positioning as structure: the classic positioning statement is decomposed
  into queryable fields instead of a free-text blob.
- Examples as first-class data: annotated do/don't examples are rows so they
  can be tagged by channel and injected as few-shot data at generation time.
- Evidence weighting: assets record source, recency, language, and a
  performance signal so extraction can prefer current, high-performing
  content and skip stale material.
- Enforcement is persisted: voice review scores are stored per voice version
  (VoiceAuditScore), enabling consistency tracking over time.
"""

import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from tenancy.models import Workspace


def _score_field(default=50, help_text=""):
    """0-100 integer slider."""
    return models.PositiveSmallIntegerField(
        default=default,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text=help_text,
    )


class BrandArchetype(models.TextChoices):
    """The 12 Jungian brand archetypes (Mark & Pearson)."""

    INNOCENT = "innocent", "Innocent"
    SAGE = "sage", "Sage"
    EXPLORER = "explorer", "Explorer"
    OUTLAW = "outlaw", "Outlaw"
    MAGICIAN = "magician", "Magician"
    HERO = "hero", "Hero"
    LOVER = "lover", "Lover"
    JESTER = "jester", "Jester"
    EVERYPERSON = "everyperson", "Everyperson"
    CAREGIVER = "caregiver", "Caregiver"
    RULER = "ruler", "Ruler"
    CREATOR = "creator", "Creator"


class Channel(models.TextChoices):
    """Canonical MVP content channels (mirrors ContentBrief.Channel values)."""

    LINKEDIN = "linkedin", "LinkedIn"
    INSTAGRAM = "instagram", "Instagram"
    BLOG = "blog", "Blog"
    NEWSLETTER = "newsletter", "Newsletter"
    X = "x", "X"
    SHORT_VIDEO = "short_video", "Short video"


class BrandProfile(models.Model):
    """
    The strategic core of a brand: who it is for, where it plays, why it
    wins, and what personality it projects. Slow-changing by design.
    """

    class ToneValue(models.TextChoices):
        PROFESSIONAL = "professional", "Professional"
        AUTHORITATIVE = "authoritative", "Authoritative"
        SOPHISTICATED = "sophisticated", "Sophisticated"
        APPROACHABLE = "approachable", "Approachable"
        VISIONARY = "visionary", "Visionary"

    class MaturityStage(models.TextChoices):
        IDEA = "idea", "Idea / pre-launch"
        NEW = "new", "Newly launched"
        GROWING = "growing", "Growing"
        ESTABLISHED = "established", "Established"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="brand_profiles",
    )
    name = models.CharField(max_length=120)
    maturity_stage = models.CharField(
        max_length=20, choices=MaturityStage.choices, default=MaturityStage.NEW
    )
    primary_language = models.CharField(max_length=12, default="en")
    industry = models.CharField(max_length=120, blank=True, default="")

    # --- Positioning statement, decomposed ------------------------------
    # "For {target} who {need}, {brand} is the {category} that
    #  {key_benefit}, because {reasons_to_believe}."
    category = models.CharField(
        max_length=200,
        blank=True,
        default="",
        help_text="The market frame of reference, e.g. 'bookkeeping app for freelancers'.",
    )
    key_benefit = models.TextField(
        blank=True,
        default="",
        help_text="The single most important benefit the brand promises.",
    )
    differentiators = models.JSONField(
        default=list,
        help_text="List of {'claim': str, 'vs': str} — what is different and versus whom/what.",
    )
    reasons_to_believe = models.JSONField(
        default=list,
        help_text="List of proof points supporting the key benefit.",
    )
    competitors = models.JSONField(
        default=list,
        help_text="List of {'name': str, 'url': str, 'notes': str} for positioning audits.",
    )
    known_for = models.TextField(
        blank=True,
        default="",
        help_text="What the brand wants to be known for, in one or two sentences.",
    )
    mission = models.TextField(blank=True, default="")
    values = models.JSONField(default=list, help_text="List of 3-5 core value strings.")
    tagline = models.CharField(max_length=200, blank=True, default="")

    # --- Personality -----------------------------------------------------
    archetype = models.CharField(
        max_length=20, choices=BrandArchetype.choices, blank=True, default=""
    )
    secondary_archetype = models.CharField(
        max_length=20, choices=BrandArchetype.choices, blank=True, default=""
    )
    # Aaker's five brand personality dimensions, 0-100.
    personality_sincerity = _score_field(help_text="Down-to-earth, honest, wholesome.")
    personality_excitement = _score_field(help_text="Daring, spirited, imaginative.")
    personality_competence = _score_field(help_text="Reliable, intelligent, successful.")
    personality_sophistication = _score_field(help_text="Upper-class, charming, refined.")
    personality_ruggedness = _score_field(help_text="Outdoorsy, tough.")

    # --- Distinctive brand assets ----------------------------------------
    distinctive_assets = models.JSONField(
        default=dict,
        help_text=(
            "Recognition assets: {'colors': [...], 'fonts': [...], "
            "'taglines': [...], 'recurring_motifs': [...], 'emoji_signature': [...]}"
        ),
    )

    # --- Deprecated flat voice fields --------------------------------------
    # Kept through a deprecation window; data was migrated into BrandVoice v1
    # and AudienceSegment rows. Drop once serializers and frontend stop
    # reading them.
    audience = models.TextField(
        blank=True,
        default="",
        help_text="Deprecated: replaced by AudienceSegment rows.",
    )
    tone = models.JSONField(
        default=list,
        help_text="Deprecated: replaced by BrandVoice tone sliders and tone_tags.",
    )
    preferred_vocabulary = models.JSONField(
        default=list,
        help_text="Deprecated: replaced by BrandVoice.preferred_vocabulary.",
    )
    banned_phrases = models.JSONField(
        default=list,
        help_text="Deprecated: replaced by BrandVoice.banned_phrases.",
    )
    positioning_notes = models.TextField(
        blank=True,
        default="",
        help_text="Deprecated: replaced by structured positioning fields and BrandVoice.",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-updated_at",)
        indexes = [
            models.Index(fields=["workspace"]),
            models.Index(fields=["updated_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.workspace})"

    @property
    def active_voice(self):
        return self.voices.filter(is_active=True).first()

    def positioning_statement(self) -> str:
        """Render the canonical positioning statement from structured fields."""
        target = self.segments.filter(is_primary=True).first()
        target_label = target.name if target else "its audience"
        rtb = "; ".join(str(r) for r in self.reasons_to_believe[:3])
        return (
            f"For {target_label}, {self.name} is the {self.category or 'brand'} "
            f"that {self.key_benefit or 'delivers its key benefit'}"
            + (f", because {rtb}." if rtb else ".")
        )


class AudienceSegment(models.Model):
    """
    A structured audience segment. Replaces the single free-text `audience`
    field: real brands serve multiple segments, and generation should be
    able to target one explicitly.
    """

    class MaturityLevel(models.TextChoices):
        UNAWARE = "unaware", "Problem-unaware"
        PROBLEM_AWARE = "problem_aware", "Problem-aware"
        SOLUTION_AWARE = "solution_aware", "Solution-aware"
        PRODUCT_AWARE = "product_aware", "Product-aware"
        EXPERT = "expert", "Expert / power user"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    brand_profile = models.ForeignKey(
        BrandProfile, on_delete=models.CASCADE, related_name="segments"
    )
    name = models.CharField(
        max_length=120, help_text="e.g. 'Solo consultants scaling past referrals'."
    )
    is_primary = models.BooleanField(default=False)
    buyer_type = models.CharField(
        max_length=120,
        blank=True,
        default="",
        help_text="e.g. 'B2B decision maker', 'consumer'.",
    )
    maturity_level = models.CharField(
        max_length=20, choices=MaturityLevel.choices, default=MaturityLevel.PROBLEM_AWARE
    )
    pains = models.JSONField(default=list, help_text="List of pain point strings.")
    desired_outcomes = models.JSONField(default=list, help_text="List of outcome strings.")
    jargon_tolerance = _score_field(
        default=50, help_text="0 = plain language only, 100 = full industry jargon."
    )
    objections = models.JSONField(
        default=list, help_text="Common objections content should pre-empt."
    )
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-is_primary", "name")
        indexes = [models.Index(fields=["brand_profile", "is_primary"])]

    def __str__(self) -> str:
        return f"{self.name} ({self.brand_profile.name})"


class BrandVoice(models.Model):
    """
    A versioned linguistic execution profile ("Voice DNA"), extracted from
    assets. Versioning makes voice drift visible, comparable, and
    reversible — extraction never silently overwrites a working voice.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    brand_profile = models.ForeignKey(
        BrandProfile, on_delete=models.CASCADE, related_name="voices"
    )
    version = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=False)
    extracted_from = models.ManyToManyField(
        "BrandAsset",
        blank=True,
        related_name="voice_versions",
        help_text="Assets this voice version was extracted from (provenance).",
    )

    voice_summary = models.TextField(
        blank=True,
        default="",
        help_text="2-3 sentence description of the voice a new writer could act on.",
    )

    # --- NN/g four tone-of-voice dimensions, 0-100 ------------------------
    tone_funny = _score_field(help_text="0 = fully serious, 100 = fully funny.")
    tone_casual = _score_field(help_text="0 = fully formal, 100 = fully casual.")
    tone_irreverent = _score_field(help_text="0 = fully respectful, 100 = fully irreverent.")
    tone_enthusiastic = _score_field(help_text="0 = matter-of-fact, 100 = enthusiastic.")

    tone_tags = models.JSONField(
        default=list,
        help_text="Secondary human-friendly descriptors, e.g. ['warm', 'direct']. Max 4.",
    )

    # --- Behavioral linguistic traits -------------------------------------
    point_of_view = models.CharField(
        max_length=40,
        blank=True,
        default="",
        help_text="Dominant POV, e.g. 'we-to-you', 'first-person-singular'.",
    )
    sentence_style = models.TextField(
        blank=True,
        default="",
        help_text="Behavioral rules: e.g. 'Short declaratives. One idea per sentence.'",
    )
    pacing = models.CharField(max_length=200, blank=True, default="")
    proof_style = models.TextField(
        blank=True,
        default="",
        help_text="How claims are supported: specifics vs. stories vs. data; hedging policy.",
    )
    claim_boundaries = models.JSONField(
        default=list,
        help_text="List of {'rule': str, 'reason': str} claim rules.",
    )
    preferred_vocabulary = models.JSONField(
        default=list,
        help_text="List of {'term': str, 'instead_of': str|null, 'note': str}.",
    )
    banned_phrases = models.JSONField(
        default=list,
        help_text="List of {'phrase': str, 'reason': str, 'severity': 'hard'|'soft'}.",
    )

    extraction_confidence = _score_field(
        default=0,
        help_text="Model-reported confidence 0-100 given sample volume/quality.",
    )
    extraction_notes = models.TextField(
        blank=True,
        default="",
        help_text="Model notes: gaps in the sample set, conflicts between assets.",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-version",)
        constraints = [
            models.UniqueConstraint(
                fields=["brand_profile", "version"], name="unique_voice_version"
            ),
            models.UniqueConstraint(
                fields=["brand_profile"],
                condition=models.Q(is_active=True),
                name="single_active_voice",
            ),
        ]
        indexes = [models.Index(fields=["brand_profile", "is_active"])]

    def __str__(self) -> str:
        return f"{self.brand_profile.name} voice v{self.version}"

    def activate(self):
        BrandVoice.objects.filter(
            brand_profile=self.brand_profile, is_active=True
        ).update(is_active=False)
        self.is_active = True
        self.save(update_fields=["is_active"])


class BrandVoiceApproval(models.Model):
    class Event(models.TextChoices):
        ACCEPTED = "accepted", "Accepted"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace, on_delete=models.CASCADE, related_name="brand_voice_approvals"
    )
    voice = models.ForeignKey(
        BrandVoice, on_delete=models.CASCADE, related_name="approvals"
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="approved_brand_voices",
    )
    approved_by_identifier = models.CharField(max_length=255)
    event = models.CharField(
        max_length=16, choices=Event.choices, default=Event.ACCEPTED
    )
    approved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-approved_at",)
        constraints = [
            models.UniqueConstraint(fields=["voice"], name="unique_brand_voice_approval")
        ]

    def __str__(self) -> str:
        return f"{self.voice} accepted"


class VoiceExample(models.Model):
    """
    An annotated do/don't example. First-class rows so they can be tagged by
    channel and injected as few-shot examples at generation time — annotated
    examples are the highest-leverage input for LLM voice adherence.
    """

    class Kind(models.TextChoices):
        DO = "do", "Do (sounds like us)"
        DONT = "dont", "Don't (avoid sounding like this)"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    voice = models.ForeignKey(
        BrandVoice, on_delete=models.CASCADE, related_name="examples"
    )
    kind = models.CharField(max_length=8, choices=Kind.choices)
    text = models.TextField()
    annotation = models.TextField(
        help_text="Why this works / fails, as a reusable pattern."
    )
    channel = models.CharField(
        max_length=20, choices=Channel.choices, blank=True, default=""
    )
    source_asset = models.ForeignKey(
        "BrandAsset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="derived_examples",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("kind", "created_at")
        indexes = [models.Index(fields=["voice", "kind", "channel"])]

    def __str__(self) -> str:
        return f"{self.get_kind_display()}: {self.text[:60]}"


class ChannelStyle(models.Model):
    """
    Per-channel tone adaptation. Voice stays stable; tone flexes by channel
    (formality, length, emoji/hashtag/CTA norms). Stored as deltas so the
    base voice remains the single source of truth.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    brand_profile = models.ForeignKey(
        BrandProfile, on_delete=models.CASCADE, related_name="channel_styles"
    )
    channel = models.CharField(max_length=20, choices=Channel.choices)

    # Deltas applied to the active voice's tone sliders (-50..+50).
    tone_funny_delta = models.SmallIntegerField(
        default=0, validators=[MinValueValidator(-50), MaxValueValidator(50)]
    )
    tone_casual_delta = models.SmallIntegerField(
        default=0, validators=[MinValueValidator(-50), MaxValueValidator(50)]
    )
    tone_irreverent_delta = models.SmallIntegerField(
        default=0, validators=[MinValueValidator(-50), MaxValueValidator(50)]
    )
    tone_enthusiastic_delta = models.SmallIntegerField(
        default=0, validators=[MinValueValidator(-50), MaxValueValidator(50)]
    )

    target_length = models.CharField(
        max_length=120,
        blank=True,
        default="",
        help_text="e.g. '80-150 words', '3 short paragraphs', '<= 280 chars'.",
    )
    structure_norms = models.TextField(
        blank=True,
        default="",
        help_text="e.g. 'Hook line, 3 value points, single CTA. No headers.'",
    )
    emoji_policy = models.CharField(
        max_length=200,
        blank=True,
        default="",
        help_text="e.g. 'none', 'max 1, never in first line'.",
    )
    hashtag_policy = models.CharField(max_length=200, blank=True, default="")
    cta_style = models.CharField(
        max_length=200,
        blank=True,
        default="",
        help_text="e.g. 'soft invitation, never urgency-driven'.",
    )
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["brand_profile", "channel"], name="unique_channel_style"
            )
        ]

    def __str__(self) -> str:
        return f"{self.brand_profile.name} / {self.get_channel_display()}"


class BrandAsset(models.Model):
    """
    Evidence for voice extraction. Assets carry provenance, language,
    channel, and a performance signal so extraction can weight current,
    high-performing content and skip stale or off-brand material.
    """

    class SourceType(models.TextChoices):
        PASTED = "pasted", "Pasted sample"
        UPLOADED = "uploaded", "Uploaded file"
        CRAWLED = "crawled", "Crawled from URL"

    class MediaType(models.TextChoices):
        TEXT = "text", "Text"
        IMAGE = "image", "Image"
        AUDIO_TRANSCRIPT = "audio_transcript", "Audio transcript"

    class AssetStatus(models.TextChoices):
        READY = "ready", "Ready"
        NEEDS_REVIEW = "needs_review", "Needs review"
        EXCLUDED = "excluded", "Excluded from extraction"

    class PerformanceSignal(models.TextChoices):
        UNKNOWN = "unknown", "Unknown"
        TOP = "top", "Top performer"
        AVERAGE = "average", "Average"
        POOR = "poor", "Underperformed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    brand_profile = models.ForeignKey(
        BrandProfile,
        on_delete=models.CASCADE,
        related_name="assets",
    )
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True, default="")
    media_type = models.CharField(
        max_length=24,
        choices=MediaType.choices,
        default=MediaType.TEXT,
    )
    file = models.FileField(upload_to="brand_assets/%Y/%m/", blank=True, default="")
    mime_type = models.CharField(max_length=120, blank=True, default="")
    analysis_summary = models.TextField(blank=True, default="")
    source_type = models.CharField(
        max_length=20,
        choices=SourceType.choices,
        default=SourceType.PASTED,
    )
    source_url = models.URLField(blank=True, default="")
    channel = models.CharField(
        max_length=20, choices=Channel.choices, blank=True, default=""
    )
    language = models.CharField(max_length=12, blank=True, default="")
    performance_signal = models.CharField(
        max_length=10,
        choices=PerformanceSignal.choices,
        default=PerformanceSignal.UNKNOWN,
        help_text="User-declared: did this content perform well? Weights extraction.",
    )
    content_date = models.DateField(
        null=True,
        blank=True,
        help_text="When the content was originally published; stale content is down-weighted.",
    )
    format = models.CharField(max_length=50, blank=True, default="")
    word_count = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=AssetStatus.choices,
        default=AssetStatus.NEEDS_REVIEW,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-updated_at",)
        indexes = [
            models.Index(fields=["brand_profile", "status"]),
            models.Index(fields=["brand_profile", "media_type"]),
            models.Index(fields=["updated_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.title} ({self.brand_profile})"


class VoiceAuditScore(models.Model):
    """
    Persisted output of a voice review. Turns one-off reviews into a
    consistency time series per voice version.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    voice = models.ForeignKey(
        BrandVoice, on_delete=models.CASCADE, related_name="audit_scores"
    )
    channel = models.CharField(
        max_length=20, choices=Channel.choices, blank=True, default=""
    )
    draft_excerpt = models.TextField(blank=True, default="")
    overall_score = _score_field(default=0)
    dimension_scores = models.JSONField(
        default=dict,
        help_text=(
            "{'tone_alignment': int, 'vocabulary': int, 'sentence_style': int, "
            "'claims': int, 'channel_fit': int}"
        ),
    )
    violations = models.JSONField(
        default=list,
        help_text="List of {'span': str, 'issue': str, 'severity': str, 'suggested_fix': str}.",
    )
    ai_run = models.ForeignKey(
        "llm.AIRun",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_scores",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [models.Index(fields=["voice", "created_at"])]

    def __str__(self) -> str:
        return f"{self.voice} audit {self.overall_score}/100"
