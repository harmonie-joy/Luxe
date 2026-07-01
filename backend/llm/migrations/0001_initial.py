# Generated manually for the local-first AI orchestration MVP slice.

import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("tenancy", "0002_rename_related_name_owned_workspaces"),
    ]

    operations = [
        migrations.CreateModel(
            name="AIRun",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "task_type",
                    models.CharField(
                        choices=[
                            ("brand_voice_extraction", "Brand voice extraction"),
                            ("draft_generation", "Draft generation"),
                            ("voice_review", "Voice review"),
                            ("compliance_review", "Compliance review"),
                        ],
                        max_length=64,
                    ),
                ),
                ("provider", models.CharField(max_length=64)),
                ("model", models.CharField(blank=True, default="", max_length=120)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("running", "Running"),
                            ("succeeded", "Succeeded"),
                            ("failed", "Failed"),
                        ],
                        default="running",
                        max_length=24,
                    ),
                ),
                ("input_data", models.JSONField(default=dict)),
                ("output_data", models.JSONField(blank=True, default=dict)),
                ("error", models.TextField(blank=True, default="")),
                ("started_at", models.DateTimeField(auto_now_add=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="ai_runs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ai_runs",
                        to="tenancy.workspace",
                    ),
                ),
            ],
            options={
                "ordering": ("-started_at",),
                "indexes": [
                    models.Index(
                        fields=["workspace", "task_type", "started_at"],
                        name="llm_airun_workspa_eaacb3_idx",
                    ),
                    models.Index(
                        fields=["workspace", "status"],
                        name="llm_airun_workspa_01292d_idx",
                    ),
                ],
            },
        ),
    ]
