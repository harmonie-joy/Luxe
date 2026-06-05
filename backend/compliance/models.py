import uuid

from django.db import models
from django.utils import timezone

from content.models import ContentDraft


class ComplianceCheck(models.Model):
    class ComplianceStatus(models.TextChoices):
        GREEN = "green", "Green"
        YELLOW = "yellow", "Yellow"
        RED = "red", "Red"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    draft = models.ForeignKey(
        ContentDraft,
        on_delete=models.CASCADE,
        related_name="compliance_checks",
    )
    status = models.CharField(
        max_length=16,
        choices=ComplianceStatus.choices,
        default=ComplianceStatus.YELLOW,
    )
    summary = models.TextField(blank=True, default="")
    checked_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-checked_at", "-created_at")
        indexes = [
            models.Index(fields=["draft", "checked_at"]),
            models.Index(fields=["status"]),
            models.Index(fields=["checked_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.draft} compliance check ({self.get_status_display()})"


class ComplianceIssue(models.Model):
    class ComplianceCategory(models.TextChoices):
        GDPR = "gdpr", "GDPR"
        CONSENT = "consent", "Consent"
        IP = "ip", "IP"
        CLAIMS = "claims", "Claims"

    class ComplianceSeverity(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    compliance_check = models.ForeignKey(
        ComplianceCheck,
        on_delete=models.CASCADE,
        related_name="issues",
    )
    title = models.CharField(max_length=200)
    category = models.CharField(
        max_length=16,
        choices=ComplianceCategory.choices,
    )
    severity = models.CharField(
        max_length=16,
        choices=ComplianceSeverity.choices,
    )
    explanation = models.TextField()
    suggested_fix = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("category", "-severity", "title")
        indexes = [
            models.Index(fields=["compliance_check", "category"]),
            models.Index(fields=["category", "severity"]),
        ]

    def __str__(self) -> str:
        return f"{self.title} ({self.get_category_display()})"
