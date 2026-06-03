# Generated for the Draft Studio feature slice.

import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("content", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ContentDraft",
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
                ("title", models.CharField(max_length=200)),
                ("content", models.TextField(blank=True, default="")),
                (
                    "channel",
                    models.CharField(
                        choices=[
                            ("linkedin", "LinkedIn"),
                            ("instagram", "Instagram"),
                            ("blog", "Blog"),
                            ("newsletter", "Newsletter"),
                            ("x", "X"),
                            ("short_video", "Short video"),
                        ],
                        max_length=32,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("draft", "Draft"),
                            ("in_review", "In review"),
                            ("needs_changes", "Needs changes"),
                            ("approved", "Approved"),
                            ("scheduled", "Scheduled"),
                            ("published", "Published"),
                        ],
                        default="draft",
                        max_length=32,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "brief",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="drafts",
                        to="content.contentbrief",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="content_drafts",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ("-updated_at",),
                "indexes": [
                    models.Index(
                        fields=["brief", "channel"],
                        name="content_con_brief_i_8c35e7_idx",
                    ),
                    models.Index(
                        fields=["status"],
                        name="content_con_status_43f878_idx",
                    ),
                    models.Index(
                        fields=["updated_at"],
                        name="content_con_updated_c48b9b_idx",
                    ),
                ],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("brief", "channel"),
                        name="unique_content_draft_per_brief_channel",
                    )
                ],
            },
        ),
    ]
