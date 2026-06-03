from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from brand.models import BrandAsset, BrandProfile
from tenancy.models import Membership, Workspace

User = get_user_model()

PROFILES_URL = "/api/brand-profiles/"
ASSETS_URL = "/api/brand-assets/"


def profile_detail_url(profile_id):
    return f"{PROFILES_URL}{profile_id}/"


def asset_detail_url(asset_id):
    return f"{ASSETS_URL}{asset_id}/"


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
        )
        self.other_profile = BrandProfile.objects.create(
            workspace=self.other_workspace,
            name="Other Profile",
            audience="Other audience",
        )

    # --- list ---

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

    # --- create ---

    def test_create_brand_profile(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "workspace": self.workspace.id,
            "name": "New Profile",
            "audience": "Affluent clients",
            "tone": ["professional", "sophisticated"],
            "preferred_vocabulary": ["craftsmanship"],
            "banned_phrases": ["cheap"],
        }
        response = self.client.post(PROFILES_URL, payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["name"], "New Profile")
        self.assertIn("workspaceId", response.data)
        self.assertIn("preferredVocabulary", response.data)
        self.assertIn("bannedPhrases", response.data)
        self.assertIn("sampleCount", response.data)
        self.assertEqual(response.data["sampleCount"], 0)

    def test_create_profile_in_foreign_workspace_is_denied(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "workspace": self.other_workspace.id,
            "name": "Forbidden Profile",
            "audience": "Audience",
            "tone": [],
            "preferred_vocabulary": [],
            "banned_phrases": [],
        }
        response = self.client.post(PROFILES_URL, payload, format="json")
        self.assertEqual(response.status_code, 403)

    # --- retrieve ---

    def test_retrieve_own_workspace_profile(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(profile_detail_url(self.profile.id))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["id"], str(self.profile.id))
        self.assertEqual(response.data["workspaceId"], self.workspace.id)

    def test_cross_workspace_retrieve_returns_404(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(profile_detail_url(self.other_profile.id))
        self.assertEqual(response.status_code, 404)

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
        )
        self.other_profile = BrandProfile.objects.create(
            workspace=self.other_workspace,
            name="Profile B",
            audience="Audience B",
        )
        self.asset = BrandAsset.objects.create(
            brand_profile=self.profile,
            title="Sample Asset",
            content="Sample editorial content.",
        )

    # --- list ---

    def test_list_returns_own_workspace_assets(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(ASSETS_URL)
        self.assertEqual(response.status_code, 200)
        ids = [a["id"] for a in response.data]
        self.assertIn(str(self.asset.id), ids)

    def test_list_filtered_by_brand_profile(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f"{ASSETS_URL}?brand_profile={self.profile.id}")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(len(response.data) >= 1)
        for asset in response.data:
            self.assertEqual(asset["brandProfileId"], str(self.profile.id))

    # --- create ---

    def test_create_brand_asset(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "brand_profile": str(self.profile.id),
            "title": "New Asset",
            "content": "Content text here.",
            "source_type": "pasted",
        }
        response = self.client.post(ASSETS_URL, payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertIn("brandProfileId", response.data)
        self.assertIn("sourceType", response.data)
        self.assertIn("wordCount", response.data)
        self.assertIn("createdAt", response.data)

    def test_create_asset_on_foreign_profile_is_denied(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "brand_profile": str(self.other_profile.id),
            "title": "Forbidden Asset",
            "content": "Content",
        }
        response = self.client.post(ASSETS_URL, payload, format="json")
        self.assertEqual(response.status_code, 403)

    def test_response_shape_matches_frontend_type(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(asset_detail_url(self.asset.id))
        self.assertEqual(response.status_code, 200)
        expected_keys = {
            "id",
            "brandProfileId",
            "title",
            "content",
            "sourceType",
            "format",
            "wordCount",
            "status",
            "createdAt",
        }
        self.assertEqual(set(response.data.keys()), expected_keys)

    def test_sample_count_reflects_asset_count(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(profile_detail_url(self.profile.id))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["sampleCount"], 1)
