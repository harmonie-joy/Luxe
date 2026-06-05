import uuid

from django.conf import settings
from django.db import models

from brand.models import BrandProfile
from tenancy.models import Workspace


class ContentBrief(models.Model):
    class CampaignGoal(models.TextChoices):
        EDUCATE = "educate", "Educate"
        ANNOUNCE = "announce", "Announce"
        PROMOTE = "promote", "Promote"
        FUNDRAISE = "fundraise", "Fundraise"
        THOUGHT_LEADERSHIP = "thought_leadership", "Thought leadership"

    class Channel(models.TextChoices):
        LINKEDIN = "linkedin", "LinkedIn"
        INSTAGRAM = "instagram", "Instagram"
        BLOG = "blog", "Blog"
        NEWSLETTER = "newsletter", "Newsletter"
        X = "x", "X"
        SHORT_VIDEO = "short_video", "Short video"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="content_briefs",
    )
    brand_profile = models.ForeignKey(
        BrandProfile,
        on_delete=models.PROTECT,
        related_name="content_briefs",
    )
    content_objective = models.TextField()
    campaign_goal = models.CharField(
        max_length=32,
        choices=CampaignGoal.choices,
    )
    audience = models.TextField()
    angle = models.TextField(blank=True, default="")
    constraints = models.TextField(blank=True, default="")
    target_channels = models.JSONField(
        default=list,
        help_text="Ordered list of target content channels.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-updated_at",)
        indexes = [
            models.Index(fields=["workspace", "campaign_goal"]),
            models.Index(fields=["brand_profile"]),
            models.Index(fields=["updated_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.workspace} brief ({self.get_campaign_goal_display()})"


class ContentDraft(models.Model):
    class DraftStatus(models.TextChoices):
        DRAFT = "draft", "Draft"
        IN_REVIEW = "in_review", "In review"
        NEEDS_CHANGES = "needs_changes", "Needs changes"
        APPROVED = "approved", "Approved"
        SCHEDULED = "scheduled", "Scheduled"
        PUBLISHED = "published", "Published"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    brief = models.ForeignKey(
        ContentBrief,
        on_delete=models.CASCADE,
        related_name="drafts",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="content_drafts",
    )
    title = models.CharField(max_length=200)
    content = models.TextField(blank=True, default="")
    channel = models.CharField(
        max_length=32,
        choices=ContentBrief.Channel.choices,
    )
    status = models.CharField(
        max_length=32,
        choices=DraftStatus.choices,
        default=DraftStatus.DRAFT,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-updated_at",)
        constraints = [
            models.UniqueConstraint(
                fields=["brief", "channel"],
                name="unique_content_draft_per_brief_channel",
            )
        ]
        indexes = [
            models.Index(fields=["brief", "channel"]),
            models.Index(fields=["status"]),
            models.Index(fields=["updated_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.title} ({self.get_channel_display()})"


class ScheduledContent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="scheduled_content",
    )
    draft = models.ForeignKey(
        ContentDraft,
        on_delete=models.CASCADE,
        related_name="scheduled_items",
    )
    channel = models.CharField(
        max_length=32,
        choices=ContentBrief.Channel.choices,
    )
    status = models.CharField(
        max_length=32,
        choices=ContentDraft.DraftStatus.choices,
        default=ContentDraft.DraftStatus.SCHEDULED,
    )
    scheduled_for = models.DateTimeField()
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("scheduled_for",)
        constraints = [
            models.UniqueConstraint(
                fields=["draft"],
                name="unique_scheduled_content_per_draft",
            )
        ]
        indexes = [
            models.Index(fields=["workspace", "scheduled_for"]),
            models.Index(fields=["workspace", "status"]),
            models.Index(fields=["channel", "scheduled_for"]),
        ]

    def __str__(self) -> str:
        return f"{self.draft} scheduled for {self.scheduled_for:%Y-%m-%d %H:%M}"
