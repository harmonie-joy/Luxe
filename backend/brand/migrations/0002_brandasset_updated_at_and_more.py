from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("brand", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="brandasset",
            name="updated_at",
            field=models.DateTimeField(
                auto_now=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.AlterModelOptions(
            name="brandasset",
            options={"ordering": ("-updated_at",)},
        ),
        migrations.AddIndex(
            model_name="brandasset",
            index=models.Index(fields=["updated_at"], name="brand_brand_updated_6de9b4_idx"),
        ),
    ]
