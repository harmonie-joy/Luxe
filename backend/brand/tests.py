from importlib import import_module

from django.apps import apps
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError
from django.test import override_settings
from rest_framework.test import APITestCase

from brand.models import (
    AudienceSegment,
    BrandAsset,
    BrandProfile,
    BrandVoice,
    Channel,
    ChannelStyle,
    VoiceAuditScore,
    VoiceExample,
)
from tenancy.models import Membership, Workspace

seed_migration = import_module("brand.migrations.0005_seed_voice_from_flat_fields")

User = get_user_model()

PROFILES_URL = "/api/brand-profiles/"
ASSETS_URL = "/api/brand-assets/"


def profile_detail_url(profile_id):
    return f"{PROFILES_URL}{profile_id}/"


def asset_detail_url(asset_id):
    return f"{ASSETS_URL}{asset_id}/"


def build_preferred_vocabulary(rule_id="craftsmanship"):
    return [
        {
            "id": rule_id,
            "preferred_term": "craftsmanship",
            "restricted_terms": ["handmade-ish"],
            "note": "Use for quality and provenance references.",
        }
    ]


def build_banned_phrases(phrase_id="cheap-luxury"):
    return [
        {
            "id": phrase_id,
            "phrase": "affordable luxury",
            "reason": "Dilutes premium positioning.",
        }
    ]


class BrandProfileAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="tester", password="pass")
        self.other_user = User.objects.create_user(username="other", password="pass")

        self.workspace = Workspace.objects.create(name="My Workspace")
        self.other_workspace = Workspace.objects.create(name="Other Workspace")

        Membership.objects.create(user=self.user, workspace=self.workspace)
        Membership.objects.create(user=self.other_user, workspace=self.other_workspace)

        self.profile = BrandProfile.objects.create(
            workspace=self.workspace,
            name="My Profile",
            audience="Luxury consumers",
            tone=["professional", "sophisticated"],
            preferred_vocabulary=build_preferred_vocabulary(),
            banned_phrases=build_banned_phrases(),
        )
        self.other_profile = BrandProfile.objects.create(
            workspace=self.other_workspace,
            name="Other Profile",
            audience="Other audience",
            tone=["authoritative"],
            preferred_vocabulary=build_preferred_vocabulary("editorial-authority"),
            banned_phrases=build_banned_phrases("trend-chasing"),
        )

    def test_list_returns_only_own_workspace_profiles(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(PROFILES_URL)
        self.assertEqual(response.status_code, 200)
        ids = [p["id"] for p in response.data]
        self.assertIn(str(self.profile.id), ids)
        self.assertNotIn(str(self.other_profile.id), ids)

    def test_unauthenticated_list_is_rejected(self):
        response = self.client.get(PROFILES_URL)
        self.assertIn(response.status_code, [401, 403])

    def test_create_brand_profile(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "workspace": str(self.workspace.id),
            "name": "New Profile",
            "audience": "Affluent clients",
            "tone": ["professional", "sophisticated"],
            "preferred_vocabulary": build_preferred_vocabulary("clientele"),
            "banned_phrases": build_banned_phrases("cheap"),
        }
        response = self.client.post(PROFILES_URL, payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["name"], "New Profile")
        self.assertEqual(response.data["workspaceId"], str(self.workspace.id))
        self.assertEqual(
            response.data["preferredVocabulary"][0]["preferredTerm"], "craftsmanship"
        )
        self.assertEqual(
            response.data["bannedPhrases"][0]["phrase"], "affordable luxury"
        )
        self.assertEqual(response.data["sampleCount"], 0)

    def test_create_profile_in_foreign_workspace_is_denied(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "workspace": str(self.other_workspace.id),
            "name": "Forbidden Profile",
            "audience": "Audience",
            "tone": [],
            "preferred_vocabulary": [],
            "banned_phrases": [],
        }
        response = self.client.post(PROFILES_URL, payload, format="json")
        self.assertEqual(response.status_code, 403)

    def test_create_profile_with_invalid_tone_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "workspace": str(self.workspace.id),
            "name": "Invalid Tone Profile",
            "audience": "Audience",
            "tone": ["loud"],
            "preferred_vocabulary": [],
            "banned_phrases": [],
        }
        response = self.client.post(PROFILES_URL, payload, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("tone", response.data)

    def test_retrieve_own_workspace_profile(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(profile_detail_url(self.profile.id))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["id"], str(self.profile.id))
        self.assertEqual(response.data["workspaceId"], str(self.workspace.id))

    def test_cross_workspace_retrieve_returns_404(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(profile_detail_url(self.other_profile.id))
        self.assertEqual(response.status_code, 404)

    def test_update_profile_cannot_move_to_foreign_workspace(self):
        self.client.force_authenticate(user=self.user)
        payload = {"workspace": str(self.other_workspace.id)}
        response = self.client.patch(
            profile_detail_url(self.profile.id), payload, format="json"
        )
        self.assertEqual(response.status_code, 403)
        self.profile.refresh_from_db()
        self.assertEqual(self.profile.workspace_id, self.workspace.id)

    def test_response_shape_matches_frontend_type(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(profile_detail_url(self.profile.id))
        self.assertEqual(response.status_code, 200)
        expected_keys = {
            "id",
            "workspaceId",
            "name",
            "audience",
            "tone",
            "preferredVocabulary",
            "bannedPhrases",
            "positioningNotes",
            "sampleCount",
            "createdAt",
            "updatedAt",
        }
        self.assertEqual(set(response.data.keys()), expected_keys)
        self.assertEqual(
            set(response.data["preferredVocabulary"][0].keys()),
            {"id", "preferredTerm", "restrictedTerms", "note"},
        )
        self.assertEqual(
            set(response.data["bannedPhrases"][0].keys()),
            {"id", "phrase", "reason"},
        )


@override_settings(MEDIA_ROOT="/tmp/theluxe-test-media")
class BrandAssetAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="asset_user", password="pass")
        self.other_user = User.objects.create_user(username="other_asset", password="pass")

        self.workspace = Workspace.objects.create(name="Asset Workspace")
        self.other_workspace = Workspace.objects.create(name="Other Asset Workspace")

        Membership.objects.create(user=self.user, workspace=self.workspace)
        Membership.objects.create(user=self.other_user, workspace=self.other_workspace)

        self.profile = BrandProfile.objects.create(
            workspace=self.workspace,
            name="Profile A",
            audience="Audience A",
            tone=["professional"],
        )
        self.other_profile = BrandProfile.objects.create(
            workspace=self.other_workspace,
            name="Profile B",
            audience="Audience B",
            tone=["visionary"],
        )
        self.asset = BrandAsset.objects.create(
            brand_profile=self.profile,
            title="Sample Asset",
            content="Sample editorial content.",
        )
        self.other_asset = BrandAsset.objects.create(
            brand_profile=self.other_profile,
            title="Other Asset",
            content="Other workspace content.",
        )

    def test_list_returns_own_workspace_assets(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(ASSETS_URL)
        self.assertEqual(response.status_code, 200)
        ids = [a["id"] for a in response.data]
        self.assertIn(str(self.asset.id), ids)
        self.assertNotIn(str(self.other_asset.id), ids)

    def test_unauthenticated_list_is_rejected(self):
        response = self.client.get(ASSETS_URL)
        self.assertIn(response.status_code, [401, 403])

    def test_list_filtered_by_brand_profile(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"{ASSETS_URL}?brand_profile={self.profile.id}")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(len(response.data) >= 1)
        for asset in response.data:
            self.assertEqual(asset["brandProfileId"], str(self.profile.id))

    def test_create_brand_asset(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "brand_profile": str(self.profile.id),
            "title": "New Asset",
            "content": "Content text here.",
            "media_type": "text",
            "source_type": "pasted",
        }
        response = self.client.post(ASSETS_URL, payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["workspaceId"], str(self.workspace.id))
        self.assertIn("brandProfileId", response.data)
        self.assertIn("sourceType", response.data)
        self.assertEqual(response.data["mediaType"], "text")
        self.assertIn("wordCount", response.data)
        self.assertIn("createdAt", response.data)
        self.assertIn("updatedAt", response.data)

    def test_create_image_brand_asset(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "brand_profile": str(self.profile.id),
            "title": "Moodboard",
            "media_type": "image",
            "source_type": "uploaded",
            "format": "PNG",
            "mime_type": "image/png",
            "file": SimpleUploadedFile(
                "moodboard.png",
                b"fake-image",
                content_type="image/png",
            ),
        }
        response = self.client.post(ASSETS_URL, payload, format="multipart")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["mediaType"], "image")
        self.assertEqual(response.data["mimeType"], "image/png")
        self.assertTrue(response.data["file"])

    def test_create_asset_on_foreign_profile_is_denied(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "brand_profile": str(self.other_profile.id),
            "title": "Forbidden Asset",
            "content": "Content",
        }
        response = self.client.post(ASSETS_URL, payload, format="json")
        self.assertEqual(response.status_code, 403)

    def test_retrieve_own_workspace_asset(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(asset_detail_url(self.asset.id))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["id"], str(self.asset.id))
        self.assertEqual(response.data["workspaceId"], str(self.workspace.id))

    def test_cross_workspace_asset_retrieve_returns_404(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(asset_detail_url(self.other_asset.id))
        self.assertEqual(response.status_code, 404)

    def test_update_asset_cannot_move_to_foreign_profile(self):
        self.client.force_authenticate(user=self.user)
        payload = {"brand_profile": str(self.other_profile.id)}
        response = self.client.patch(asset_detail_url(self.asset.id), payload, format="json")
        self.assertEqual(response.status_code, 403)
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.brand_profile_id, self.profile.id)

    def test_response_shape_matches_frontend_type(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(asset_detail_url(self.asset.id))
        self.assertEqual(response.status_code, 200)
        expected_keys = {
            "id",
            "workspaceId",
            "brandProfileId",
            "title",
            "content",
            "mediaType",
            "file",
            "mimeType",
            "analysisSummary",
            "sourceType",
            "format",
            "wordCount",
            "status",
            "createdAt",
            "updatedAt",
        }
        self.assertEqual(set(response.data.keys()), expected_keys)

    def test_sample_count_reflects_asset_count(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(profile_detail_url(self.profile.id))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["sampleCount"], 1)


class VoiceDnaModelTest(APITestCase):
    """Model-level tests for the structured Voice DNA architecture (slice 1)."""

    def setUp(self):
        self.workspace = Workspace.objects.create(name="Voice DNA Workspace")
        self.profile = BrandProfile.objects.create(
            workspace=self.workspace,
            name="Atelier",
            category="private styling service",
            key_benefit="turns wardrobes into working systems",
            reasons_to_believe=["10 years of atelier work", "named-client references"],
        )

    def test_model_str_representations(self):
        voice = BrandVoice.objects.create(brand_profile=self.profile, version=1)
        segment = AudienceSegment.objects.create(
            brand_profile=self.profile, name="Collectors", is_primary=True
        )
        style = ChannelStyle.objects.create(
            brand_profile=self.profile, channel=Channel.LINKEDIN
        )
        example = VoiceExample.objects.create(
            voice=voice, kind=VoiceExample.Kind.DO, text="Open with the offer.", annotation="Direct."
        )
        score = VoiceAuditScore.objects.create(voice=voice, overall_score=88)

        self.assertEqual(str(voice), "Atelier voice v1")
        self.assertEqual(str(segment), "Collectors (Atelier)")
        self.assertEqual(str(style), "Atelier / LinkedIn")
        self.assertIn("Open with the offer.", str(example))
        self.assertIn("88/100", str(score))

    def test_unique_voice_version_per_profile(self):
        BrandVoice.objects.create(brand_profile=self.profile, version=1)
        with self.assertRaises(IntegrityError):
            BrandVoice.objects.create(brand_profile=self.profile, version=1)

    def test_single_active_voice_constraint(self):
        BrandVoice.objects.create(brand_profile=self.profile, version=1, is_active=True)
        with self.assertRaises(IntegrityError):
            BrandVoice.objects.create(
                brand_profile=self.profile, version=2, is_active=True
            )

    def test_activate_swaps_active_voice(self):
        v1 = BrandVoice.objects.create(
            brand_profile=self.profile, version=1, is_active=True
        )
        v2 = BrandVoice.objects.create(brand_profile=self.profile, version=2)

        v2.activate()

        v1.refresh_from_db()
        v2.refresh_from_db()
        self.assertFalse(v1.is_active)
        self.assertTrue(v2.is_active)
        self.assertEqual(self.profile.active_voice, v2)

    def test_unique_channel_style_per_profile(self):
        ChannelStyle.objects.create(brand_profile=self.profile, channel=Channel.BLOG)
        with self.assertRaises(IntegrityError):
            ChannelStyle.objects.create(brand_profile=self.profile, channel=Channel.BLOG)

    def test_positioning_statement_renders_from_structured_fields(self):
        AudienceSegment.objects.create(
            brand_profile=self.profile, name="Private clients", is_primary=True
        )
        statement = self.profile.positioning_statement()
        self.assertIn("For Private clients", statement)
        self.assertIn("private styling service", statement)
        self.assertIn("because 10 years of atelier work", statement)


class VoiceDnaDataMigrationTest(APITestCase):
    """The 0005 mapping helpers convert flat legacy fields without data loss."""

    def test_vocabulary_mapping(self):
        entries = [
            "quiet luxury",
            {
                "id": "craftsmanship",
                "preferred_term": "craftsmanship",
                "restricted_terms": ["handmade-ish", "artisanal-ish"],
                "note": "Provenance references.",
            },
        ]
        self.assertEqual(
            seed_migration.map_vocabulary(entries),
            [
                {"term": "quiet luxury", "instead_of": None, "note": ""},
                {
                    "term": "craftsmanship",
                    "instead_of": "handmade-ish, artisanal-ish",
                    "note": "Provenance references.",
                },
            ],
        )

    def test_banned_phrase_mapping(self):
        entries = ["cheap", {"id": "x", "phrase": "affordable luxury", "reason": "Dilutes."}]
        self.assertEqual(
            seed_migration.map_banned_phrases(entries),
            [
                {"phrase": "cheap", "reason": "", "severity": "soft"},
                {"phrase": "affordable luxury", "reason": "Dilutes.", "severity": "soft"},
            ],
        )

    def test_slider_seeding_from_first_tone_tag(self):
        self.assertEqual(
            seed_migration.seed_sliders(["approachable", "visionary"]),
            {"casual": 65, "funny": 40, "irreverent": 20, "enthusiastic": 60},
        )
        self.assertEqual(seed_migration.seed_sliders([]), seed_migration.DEFAULT_SLIDERS)

    def test_extraction_notes_preserve_legacy_positioning(self):
        notes = seed_migration.build_extraction_notes("Voice DNA:\n- Brand personality: calm")
        self.assertIn("seeded from the legacy tone tags", notes)
        self.assertIn("Legacy positioning_notes:\nVoice DNA:\n- Brand personality: calm", notes)

    def test_forward_migration_seeds_voice_and_segment(self):
        workspace = Workspace.objects.create(name="Legacy Workspace")
        profile = BrandProfile.objects.create(
            workspace=workspace,
            name="Legacy Brand",
            audience="Solo consultants",
            tone=["sophisticated"],
            preferred_vocabulary=[
                {
                    "id": "clientele",
                    "preferred_term": "clientele",
                    "restricted_terms": ["customers"],
                    "note": "",
                }
            ],
            banned_phrases=[{"id": "cheap", "phrase": "cheap", "reason": "Off-brand."}],
            positioning_notes="Quiet authority.",
        )

        seed_migration.seed_voice_dna(apps, None)

        voice = profile.voices.get()
        self.assertEqual(voice.version, 1)
        self.assertTrue(voice.is_active)
        self.assertEqual(voice.tone_tags, ["sophisticated"])
        self.assertEqual(voice.tone_casual, 20)
        self.assertEqual(voice.tone_enthusiastic, 35)
        self.assertEqual(voice.preferred_vocabulary[0]["term"], "clientele")
        self.assertEqual(voice.banned_phrases[0]["severity"], "soft")
        self.assertIn("Legacy positioning_notes:\nQuiet authority.", voice.extraction_notes)

        segment = profile.segments.get()
        self.assertEqual(segment.name, "Primary audience")
        self.assertTrue(segment.is_primary)
        self.assertEqual(segment.notes, "Solo consultants")

        # Idempotent: re-running does not duplicate rows.
        seed_migration.seed_voice_dna(apps, None)
        self.assertEqual(profile.voices.count(), 1)
        self.assertEqual(profile.segments.count(), 1)
