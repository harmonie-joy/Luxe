import uuid

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from tenancy.models import Membership, Workspace

from .models import AuditLog

User = get_user_model()

AUDIT_LOGS_URL = "/api/audit-logs/"


def audit_log_detail_url(audit_log_id):
    return f"{AUDIT_LOGS_URL}{audit_log_id}/"


class AuditLogAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="audit_user", password="pass")
        self.other_user = User.objects.create_user(username="other_audit", password="pass")

        self.workspace = Workspace.objects.create(name="Audit Workspace")
        self.other_workspace = Workspace.objects.create(name="Other Audit Workspace")

        Membership.objects.create(user=self.user, workspace=self.workspace)
        Membership.objects.create(user=self.other_user, workspace=self.other_workspace)

        self.target_id = uuid.uuid4()
        self.other_target_id = uuid.uuid4()

        self.audit_log = AuditLog.objects.create(
            workspace=self.workspace,
            user=self.user,
            action="draft_created",
            target_type="content_draft",
            target_id=self.target_id,
            description="Mario Salamanca created a LinkedIn draft.",
        )
        self.other_audit_log = AuditLog.objects.create(
            workspace=self.other_workspace,
            user=self.other_user,
            action="status_changed",
            target_type="content_draft",
            target_id=self.other_target_id,
            description="Foreign workspace status changed.",
        )

    def test_list_returns_only_own_workspace_audit_logs(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(AUDIT_LOGS_URL)
        self.assertEqual(response.status_code, 200)
        ids = [audit_log["id"] for audit_log in response.data]
        self.assertIn(str(self.audit_log.id), ids)
        self.assertNotIn(str(self.other_audit_log.id), ids)

    def test_filter_audit_logs_by_workspace(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            AUDIT_LOGS_URL,
            {"workspace": str(self.workspace.id)},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [audit_log["id"] for audit_log in response.data],
            [str(self.audit_log.id)],
        )

    def test_filter_audit_logs_by_target_id(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            AUDIT_LOGS_URL,
            {"target_id": str(self.target_id)},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [audit_log["id"] for audit_log in response.data],
            [str(self.audit_log.id)],
        )

    def test_unauthenticated_audit_log_list_is_rejected(self):
        response = self.client.get(AUDIT_LOGS_URL)
        self.assertIn(response.status_code, [401, 403])

    def test_create_audit_log(self):
        self.client.force_authenticate(user=self.user)
        target_id = uuid.uuid4()
        payload = {
            "workspace": str(self.workspace.id),
            "user": str(self.other_user.id),
            "action": "compliance_checked",
            "target_type": "content_draft",
            "target_id": str(target_id),
            "description": "Compliance check completed.",
        }
        response = self.client.post(AUDIT_LOGS_URL, payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["workspaceId"], str(self.workspace.id))
        self.assertEqual(response.data["userId"], str(self.user.id))
        self.assertEqual(response.data["targetId"], str(target_id))
        self.assertEqual(response.data["targetType"], "content_draft")

    def test_create_audit_log_for_foreign_workspace_is_denied(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "workspace": str(self.other_workspace.id),
            "action": "status_changed",
            "target_type": "content_draft",
            "target_id": str(uuid.uuid4()),
            "description": "Should not be created.",
        }
        response = self.client.post(AUDIT_LOGS_URL, payload, format="json")
        self.assertEqual(response.status_code, 403)

    def test_update_audit_log_into_foreign_workspace_is_denied(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "workspace": str(self.other_workspace.id),
        }
        response = self.client.patch(
            audit_log_detail_url(self.audit_log.id),
            payload,
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_cross_workspace_audit_log_retrieve_returns_404(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(audit_log_detail_url(self.other_audit_log.id))
        self.assertEqual(response.status_code, 404)

    def test_audit_log_response_shape_matches_frontend_type(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(audit_log_detail_url(self.audit_log.id))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            set(response.data.keys()),
            {
                "id",
                "workspaceId",
                "userId",
                "action",
                "targetType",
                "targetId",
                "description",
                "createdAt",
            },
        )
