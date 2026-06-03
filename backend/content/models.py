import uuid

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
