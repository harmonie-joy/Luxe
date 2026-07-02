import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from tenancy.models import Workspace


class AIRun(models.Model):
    class TaskType(models.TextChoices):
        BRAND_ASSET_ANALYSIS = "brand_asset_analysis", "Brand asset analysis"
        BRAND_VOICE_EXTRACTION = "brand_voice_extraction", "Brand voice extraction"
        DRAFT_GENERATION = "draft_generation", "Draft generation"
        VOICE_REVIEW = "voice_review", "Voice review"
        COMPLIANCE_REVIEW = "compliance_review", "Compliance review"

    class Status(models.TextChoices):
        RUNNING = "running", "Running"
        SUCCEEDED = "succeeded", "Succeeded"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="ai_runs",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ai_runs",
    )
    task_type = models.CharField(max_length=64, choices=TaskType.choices)
    provider = models.CharField(max_length=64)
    model = models.CharField(max_length=120, blank=True, default="")
    status = models.CharField(
        max_length=24,
        choices=Status.choices,
        default=Status.RUNNING,
    )
    input_data = models.JSONField(default=dict)
    output_data = models.JSONField(default=dict, blank=True)
    error = models.TextField(blank=True, default="")
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-started_at",)
        indexes = [
            models.Index(fields=["workspace", "task_type", "started_at"]),
            models.Index(fields=["workspace", "status"]),
        ]

    def mark_succeeded(self, output_data):
        self.status = self.Status.SUCCEEDED
        self.output_data = output_data
        self.error = ""
        self.completed_at = timezone.now()
        self.save(update_fields=["status", "output_data", "error", "completed_at"])

    def mark_failed(self, error):
        self.status = self.Status.FAILED
        self.error = str(error)
        self.completed_at = timezone.now()
        self.save(update_fields=["status", "error", "completed_at"])

    def __str__(self) -> str:
        return f"{self.task_type} via {self.provider} ({self.status})"
