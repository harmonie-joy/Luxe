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
            "maturityStage",
            "primaryLanguage",
            "industry",
            "category",
            "keyBenefit",
            "differentiators",
            "reasonsToBelieve",
            "competitors",
            "knownFor",
            "mission",
            "values",
            "tagline",
            "archetype",
            "secondaryArchetype",
            "personalitySincerity",
            "personalityExcitement",
            "personalityCompetence",
            "personalitySophistication",
            "personalityRuggedness",
            "distinctiveAssets",
            "activeVoiceId",
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
            "sourceUrl",
            "channel",
            "language",
            "performanceSignal",
            "contentDate",
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


class VoiceDnaAPITest(APITestCase):
    """Slice 4: workspace scoping and shapes for the new Voice DNA endpoints."""

    def setUp(self):
        self.user = User.objects.create_user(username="dna_api", password="pass")
        self.other_user = User.objects.create_user(username="dna_other", password="pass")
        self.workspace = Workspace.objects.create(name="Mine")
        self.other_workspace = Workspace.objects.create(name="Theirs")
        Membership.objects.create(user=self.user, workspace=self.workspace)
        Membership.objects.create(user=self.other_user, workspace=self.other_workspace)

        self.profile = BrandProfile.objects.create(
            workspace=self.workspace, name="Mine Brand"
        )
        self.other_profile = BrandProfile.objects.create(
            workspace=self.other_workspace, name="Theirs Brand"
        )

        self.voice = BrandVoice.objects.create(
            brand_profile=self.profile, version=1, is_active=True
        )
        self.voice_v2 = BrandVoice.objects.create(brand_profile=self.profile, version=2)
        self.other_voice = BrandVoice.objects.create(
            brand_profile=self.other_profile, version=1, is_active=True
        )

        self.segment = AudienceSegment.objects.create(
            brand_profile=self.profile, name="Mine Segment", is_primary=True
        )
        self.other_segment = AudienceSegment.objects.create(
            brand_profile=self.other_profile, name="Theirs Segment"
        )

        self.style = ChannelStyle.objects.create(
            brand_profile=self.profile, channel=Channel.LINKEDIN, tone_casual_delta=-10
        )
        self.other_style = ChannelStyle.objects.create(
            brand_profile=self.other_profile, channel=Channel.LINKEDIN
        )

        self.example = VoiceExample.objects.create(
            voice=self.voice,
            kind=VoiceExample.Kind.DO,
            text="Mine example.",
            annotation="Pattern.",
        )
        self.other_example = VoiceExample.objects.create(
            voice=self.other_voice,
            kind=VoiceExample.Kind.DO,
            text="Theirs example.",
            annotation="Pattern.",
        )

        self.score = VoiceAuditScore.objects.create(voice=self.voice, overall_score=90)
        self.other_score = VoiceAuditScore.objects.create(
            voice=self.other_voice, overall_score=40
        )

    def test_unauthenticated_requests_are_rejected(self):
        for url in (
            "/api/brand-voices/",
            "/api/audience-segments/",
            "/api/channel-styles/",
            "/api/voice-examples/",
            "/api/voice-audit-scores/",
        ):
            response = self.client.get(url)
            self.assertIn(response.status_code, [401, 403], url)

    def test_lists_are_workspace_scoped(self):
        self.client.force_authenticate(user=self.user)
        cases = [
            ("/api/brand-voices/", 2),
            ("/api/audience-segments/", 1),
            ("/api/channel-styles/", 1),
            ("/api/voice-examples/", 1),
            ("/api/voice-audit-scores/", 1),
        ]
        for url, expected_count in cases:
            response = self.client.get(url)
            self.assertEqual(response.status_code, 200, url)
            self.assertEqual(len(response.data), expected_count, url)

    def test_cross_workspace_detail_returns_404(self):
        self.client.force_authenticate(user=self.user)
        for url in (
            f"/api/brand-voices/{self.other_voice.id}/",
            f"/api/audience-segments/{self.other_segment.id}/",
            f"/api/channel-styles/{self.other_style.id}/",
            f"/api/voice-examples/{self.other_example.id}/",
            f"/api/voice-audit-scores/{self.other_score.id}/",
        ):
            response = self.client.get(url)
            self.assertEqual(response.status_code, 404, url)

    def test_brand_voice_response_shape(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/brand-voices/{self.voice.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            set(response.data.keys()),
            {
                "id",
                "brandProfileId",
                "version",
                "isActive",
                "extractedFrom",
                "voiceSummary",
                "tone",
                "toneTags",
                "pointOfView",
                "sentenceStyle",
                "pacing",
                "proofStyle",
                "claimBoundaries",
                "preferredVocabulary",
                "bannedPhrases",
                "extractionConfidence",
                "extractionNotes",
                "createdAt",
            },
        )
        self.assertEqual(
            set(response.data["tone"].keys()),
            {"funny", "casual", "irreverent", "enthusiastic"},
        )

    def test_brand_voice_list_filters_by_profile(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"/api/brand-voices/?brand_profile={self.profile.id}")
        self.assertEqual(len(response.data), 2)

    def test_activate_switches_active_version(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(f"/api/brand-voices/{self.voice_v2.id}/activate/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["isActive"])
        self.voice.refresh_from_db()
        self.voice_v2.refresh_from_db()
        self.assertFalse(self.voice.is_active)
        self.assertTrue(self.voice_v2.is_active)

    def test_activate_foreign_voice_returns_404(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(f"/api/brand-voices/{self.other_voice.id}/activate/")
        self.assertEqual(response.status_code, 404)
        self.other_voice.refresh_from_db()
        self.assertTrue(self.other_voice.is_active)

    def test_create_segment(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/audience-segments/",
            {
                "brand_profile": str(self.profile.id),
                "name": "Boutique owners",
                "buyer_type": "B2B decision maker",
                "pains": ["Generic content"],
                "desired_outcomes": ["Clear positioning"],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["name"], "Boutique owners")
        self.assertEqual(response.data["brandProfileId"], str(self.profile.id))
        self.assertFalse(response.data["isPrimary"])

    def test_create_segment_on_foreign_profile_is_denied(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/audience-segments/",
            {"brand_profile": str(self.other_profile.id), "name": "Sneaky"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_create_channel_style(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/channel-styles/",
            {
                "brand_profile": str(self.profile.id),
                "channel": "instagram",
                "tone_casual_delta": 15,
                "emoji_policy": "max 1, never in first line",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["channel"], "instagram")
        self.assertEqual(response.data["toneCasualDelta"], 15)

    def test_duplicate_channel_style_is_rejected(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/channel-styles/",
            {"brand_profile": str(self.profile.id), "channel": Channel.LINKEDIN},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_create_channel_style_on_foreign_profile_is_denied(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/channel-styles/",
            {"brand_profile": str(self.other_profile.id), "channel": "blog"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_voice_examples_and_audit_scores_are_read_only(self):
        self.client.force_authenticate(user=self.user)
        example_post = self.client.post(
            "/api/voice-examples/",
            {"voice": str(self.voice.id), "kind": "do", "text": "x", "annotation": "y"},
            format="json",
        )
        score_post = self.client.post(
            "/api/voice-audit-scores/",
            {"voice": str(self.voice.id), "overall_score": 10},
            format="json",
        )
        self.assertEqual(example_post.status_code, 405)
        self.assertEqual(score_post.status_code, 405)

    def test_profile_exposes_active_voice_id(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(profile_detail_url(self.profile.id))
        self.assertEqual(response.data["activeVoiceId"], str(self.voice.id))
