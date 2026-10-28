from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase


class ExecutionMigrationTest(TransactionTestCase):
    def tearDown(self):
        executor = MigrationExecutor(connection)
        executor.migrate(executor.loader.graph.leaf_nodes())
        super().tearDown()

    def test_existing_brief_and_draft_survive_ia1_migration(self):
        executor = MigrationExecutor(connection)
        before = [("content", "0004_add_approval"), ("brand", "0005_seed_voice_from_flat_fields")]
        executor.migrate(before)
        old_apps = executor.loader.project_state(before).apps
        Workspace = old_apps.get_model("tenancy", "Workspace")
        BrandProfile = old_apps.get_model("brand", "BrandProfile")
        BrandVoice = old_apps.get_model("brand", "BrandVoice")
        ContentBrief = old_apps.get_model("content", "ContentBrief")
        ContentDraft = old_apps.get_model("content", "ContentDraft")
        workspace = Workspace.objects.create(name="Existing workspace")
        profile = BrandProfile.objects.create(workspace=workspace, name="Existing profile")
        voice = BrandVoice.objects.create(brand_profile=profile, version=1, is_active=True)
        brief = ContentBrief.objects.create(
            workspace=workspace, brand_profile=profile, content_objective="Existing objective",
            campaign_goal="educate", audience="Existing audience", target_channels=["linkedin"],
        )
        draft = ContentDraft.objects.create(brief=brief, title="Existing draft", channel="linkedin")

        executor = MigrationExecutor(connection)
        targets = [
            ("brand", "0006_brand_voice_approval"),
            ("content", "0005_ia1_execution_context"),
        ]
        executor.migrate(targets)
        new_apps = executor.loader.project_state(targets).apps
        self.assertEqual(new_apps.get_model("content", "ContentBrief").objects.get(pk=brief.pk).content_objective, "Existing objective")
        self.assertEqual(new_apps.get_model("content", "ContentDraft").objects.get(pk=draft.pk).title, "Existing draft")
        self.assertEqual(new_apps.get_model("brand", "BrandProfile").objects.get(pk=profile.pk).name, "Existing profile")
        self.assertEqual(new_apps.get_model("brand", "BrandVoice").objects.get(pk=voice.pk).version, 1)
        self.assertFalse(
            new_apps.get_model("brand", "BrandVoiceApproval").objects.filter(
                voice_id=voice.pk
            ).exists()
        )
