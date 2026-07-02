from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from brand.models import BrandProfile
from tenancy.models import Membership, Workspace


User = get_user_model()


class AuthApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_signup_logs_in_and_bootstrap_creates_workspace(self):
        response = self.client.post(
            "/api/auth/signup/",
            {
                "email": "founder@example.com",
                "password": "strong-pass-123",
                "display_name": "Founder User",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["user"]["email"], "founder@example.com")
        self.assertEqual(response.data["activeWorkspaceId"], None)

        bootstrap = self.client.post("/api/auth/bootstrap-workspace/", {}, format="json")

        self.assertEqual(bootstrap.status_code, 200)
        self.assertEqual(bootstrap.data["workspaces"][0]["role"], Membership.Role.OWNER)
        self.assertEqual(Workspace.objects.count(), 1)

    def test_login_me_and_logout(self):
        user = User.objects.create_user(
            username="editor",
            email="editor@example.com",
            password="strong-pass-123",
        )
        workspace = Workspace.objects.create(name="Editorial", created_by=user)
        Membership.objects.create(user=user, workspace=workspace)

        bad_login = self.client.post(
            "/api/auth/login/",
            {"email": "editor@example.com", "password": "wrong"},
            format="json",
        )
        self.assertEqual(bad_login.status_code, 400)

        login = self.client.post(
            "/api/auth/login/",
            {"email": "editor@example.com", "password": "strong-pass-123"},
            format="json",
        )
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.data["activeWorkspaceId"], str(workspace.id))

        me = self.client.get("/api/auth/me/")
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data["user"]["email"], "editor@example.com")

        logout = self.client.post("/api/auth/logout/", {}, format="json")
        self.assertEqual(logout.status_code, 204)
        self.assertEqual(self.client.get("/api/auth/me/").status_code, 403)


class AuthMePatchTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="editor",
            email="editor@example.com",
            password="strong-pass-123",
            first_name="Old",
            last_name="Name",
        )

    def test_unauthenticated_patch_is_rejected(self):
        response = self.client.patch(
            "/api/auth/me/", {"display_name": "New Name"}, format="json"
        )
        self.assertEqual(response.status_code, 403)

    def test_patch_updates_display_name(self):
        self.client.force_authenticate(self.user)

        response = self.client.patch(
            "/api/auth/me/", {"display_name": "  Ada Lovelace  "}, format="json"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["user"]["displayName"], "Ada Lovelace")
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Ada")
        self.assertEqual(self.user.last_name, "Lovelace")

    def test_patch_rejects_blank_display_name(self):
        self.client.force_authenticate(self.user)

        response = self.client.patch(
            "/api/auth/me/", {"display_name": "   "}, format="json"
        )

        self.assertEqual(response.status_code, 400)

    def test_patch_cannot_change_email_or_username(self):
        self.client.force_authenticate(self.user)

        response = self.client.patch(
            "/api/auth/me/",
            {
                "display_name": "Ada Lovelace",
                "email": "hacker@example.com",
                "username": "hacker",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["user"]["email"], "editor@example.com")
        self.assertEqual(response.data["user"]["username"], "editor")
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "editor@example.com")
        self.assertEqual(self.user.get_username(), "editor")


class SeedDemoCommandTests(TestCase):
    def test_seed_demo_is_idempotent(self):
        out = StringIO()

        call_command("seed_demo", stdout=out)
        call_command("seed_demo", stdout=out)

        user = User.objects.get(email="demo@theluxe.local")
        self.assertTrue(user.check_password("theluxe-demo"))
        self.assertEqual(Workspace.objects.filter(name="THE LUXE Demo Workspace").count(), 1)
        self.assertEqual(Membership.objects.filter(user=user).count(), 1)
        self.assertEqual(BrandProfile.objects.count(), 1)
