from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("llm", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="airun",
            name="task_type",
            field=models.CharField(
                choices=[
                    ("brand_asset_analysis", "Brand asset analysis"),
                    ("brand_voice_extraction", "Brand voice extraction"),
                    ("draft_generation", "Draft generation"),
                    ("voice_review", "Voice review"),
                    ("compliance_review", "Compliance review"),
                ],
                max_length=64,
            ),
        ),
    ]
