from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("brand", "0002_brandasset_updated_at_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="brandasset",
            name="analysis_summary",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="brandasset",
            name="file",
            field=models.FileField(blank=True, default="", upload_to="brand_assets/%Y/%m/"),
        ),
        migrations.AddField(
            model_name="brandasset",
            name="media_type",
            field=models.CharField(
                choices=[
                    ("text", "Text"),
                    ("image", "Image"),
                    ("audio_transcript", "Audio transcript"),
                ],
                default="text",
                max_length=24,
            ),
        ),
        migrations.AddField(
            model_name="brandasset",
            name="mime_type",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
        migrations.AddIndex(
            model_name="brandasset",
            index=models.Index(
                fields=["brand_profile", "media_type"],
                name="brand_brand_brand_p_0ceec1_idx",
            ),
        ),
    ]
