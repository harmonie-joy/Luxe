import uuid

import django.db.models.deletion
from django.db import migrations, models


def seed_linkedin_text_template(apps, schema_editor):
    ContentTemplate = apps.get_model("content", "ContentTemplate")
    ContentTemplate.objects.create(
        key="linkedin_text_post",
        name="LinkedIn text post",
        channel="linkedin",
        version=1,
        body=(
            "[Opening: state the main idea.]\n\n"
            "[Context: share one useful observation or example.]\n\n"
            "[Takeaway: explain what the reader can use.]\n\n"
            "[Close: invite a thoughtful response.]"
        ),
        is_active=True,
    )


class Migration(migrations.Migration):
    dependencies = [
        ("content", "0005_ia1_execution_context"),
    ]

    operations = [
        migrations.CreateModel(
            name="ContentTemplate",
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
                ("key", models.SlugField(max_length=100)),
                ("name", models.CharField(max_length=200)),
                (
                    "channel",
                    models.CharField(
                        choices=[("linkedin", "LinkedIn")],
                        max_length=32,
                    ),
                ),
                ("version", models.PositiveIntegerField()),
                ("body", models.TextField()),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "ordering": ("key", "-version"),
                "constraints": [
                    models.UniqueConstraint(
                        fields=("key", "version"),
                        name="unique_content_template_key_version",
                    ),
                    models.UniqueConstraint(
                        condition=models.Q(("is_active", True)),
                        fields=("key",),
                        name="unique_active_content_template_key",
                    ),
                    models.CheckConstraint(
                        condition=models.Q(("version__gte", 1)),
                        name="content_template_positive_version",
                    ),
                ],
            },
        ),
        migrations.AddField(
            model_name="contentitem",
            name="channel",
            field=models.CharField(
                choices=[("linkedin", "LinkedIn")],
                default="linkedin",
                max_length=32,
            ),
        ),
        migrations.AddField(
            model_name="contentitem",
            name="content_template",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="content_items",
                to="content.contenttemplate",
            ),
        ),
        migrations.RunPython(
            seed_linkedin_text_template,
            migrations.RunPython.noop,
        ),
    ]
