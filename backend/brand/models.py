import uuid

from django.db import models

from tenancy.models import Workspace


class BrandProfile(models.Model):
    class ToneValue(models.TextChoices):
        PROFESSIONAL = "professional", "Professional"
        AUTHORITATIVE = "authoritative", "Authoritative"
        SOPHISTICATED = "sophisticated", "Sophisticated"
        APPROACHABLE = "approachable", "Approachable"
        VISIONARY = "visionary", "Visionary"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="brand_profiles",
    )
    name = models.CharField(max_length=120)
    audience = models.TextField()
    tone = models.JSONField(
        default=list,
        help_text="Ordered list of tone attribute values, e.g. ['professional', 'sophisticated'].",
    )
    preferred_vocabulary = models.JSONField(
        default=list,
        help_text="List of preferred vocabulary rule objects.",
    )
    banned_phrases = models.JSONField(
        default=list,
        help_text="List of banned phrase objects with optional rationale.",
    )
    positioning_notes = models.TextField(blank=True, default="")
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


class BrandAsset(models.Model):
    class SourceType(models.TextChoices):
        PASTED = "pasted", "Pasted sample"
        UPLOADED = "uploaded", "Uploaded file"

    class AssetStatus(models.TextChoices):
        READY = "ready", "Ready"
        NEEDS_REVIEW = "needs_review", "Needs review"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    brand_profile = models.ForeignKey(
        BrandProfile,
        on_delete=models.CASCADE,
        related_name="assets",
    )
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True, default="")
    source_type = models.CharField(
        max_length=20,
        choices=SourceType.choices,
        default=SourceType.PASTED,
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
            models.Index(fields=["updated_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.title} ({self.brand_profile})"
