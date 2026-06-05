from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from brand.models import BrandProfile
from content.models import ContentBrief, ContentDraft
from tenancy.models import Membership, Workspace

from .models import ComplianceCheck, ComplianceIssue

User = get_user_model()

CHECKS_URL = "/api/compliance-checks/"
ISSUES_URL = "/api/compliance-issues/"


def check_detail_url(check_id):
    return f"{CHECKS_URL}{check_id}/"


def issue_detail_url(issue_id):
    return f"{ISSUES_URL}{issue_id}/"


class ComplianceAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="compliance_user", password="pass")
        self.other_user = User.objects.create_user(
            username="other_compliance",
            password="pass",
        )

        self.workspace = Workspace.objects.create(name="Compliance Workspace")
        self.other_workspace = Workspace.objects.create(name="Other Compliance")

        Membership.objects.create(user=self.user, workspace=self.workspace)
        Membership.objects.create(user=self.other_user, workspace=self.other_workspace)

        self.brand_profile = BrandProfile.objects.create(
            workspace=self.workspace,
            name="Compliance Voice",
            audience="Private clients",
            tone=["professional", "sophisticated"],
        )
        self.other_brand_profile = BrandProfile.objects.create(
            workspace=self.other_workspace,
            name="Other Compliance Voice",
            audience="Other audience",
            tone=["authoritative"],
        )

        self.brief = ContentBrief.objects.create(
            workspace=self.workspace,
            brand_profile=self.brand_profile,
            content_objective="Invite clients to a preview appointment.",
            campaign_goal=ContentBrief.CampaignGoal.ANNOUNCE,
            audience="VIP clients",
            angle="Private access with careful language.",
            constraints="Avoid guaranteed availability claims.",
            target_channels=[ContentBrief.Channel.LINKEDIN],
        )
        self.other_brief = ContentBrief.objects.create(
            workspace=self.other_workspace,
            brand_profile=self.other_brand_profile,
            content_objective="Other workspace objective.",
            campaign_goal=ContentBrief.CampaignGoal.PROMOTE,
            audience="Other audience",
            angle="Other angle",
            constraints="Other constraints",
            target_channels=[ContentBrief.Channel.NEWSLETTER],
        )

        self.draft = ContentDraft.objects.create(
            brief=self.brief,
            created_by=self.user,
            title="Private preview LinkedIn draft",
            content="A private preview for selected clients.",
            channel=ContentBrief.Channel.LINKEDIN,
            status=ContentDraft.DraftStatus.IN_REVIEW,
        )
        self.other_draft = ContentDraft.objects.create(
            brief=self.other_brief,
            created_by=self.other_user,
            title="Other workspace newsletter draft",
            content="Foreign workspace draft.",
            channel=ContentBrief.Channel.NEWSLETTER,
            status=ContentDraft.DraftStatus.IN_REVIEW,
        )

        self.check = ComplianceCheck.objects.create(
            draft=self.draft,
            status=ComplianceCheck.ComplianceStatus.YELLOW,
            summary="Review two language risks before approval.",
        )
        self.other_check = ComplianceCheck.objects.create(
            draft=self.other_draft,
            status=ComplianceCheck.ComplianceStatus.GREEN,
            summary="Foreign workspace check.",
        )

        self.issue = ComplianceIssue.objects.create(
            compliance_check=self.check,
            title="Clarify invitation consent",
            category=ComplianceIssue.ComplianceCategory.CONSENT,
            severity=ComplianceIssue.ComplianceSeverity.MEDIUM,
            explanation=(
                "The draft references selected clients without making the consent "
                "basis for the invitation clear."
            ),
            suggested_fix=(
                "Mention that recipients are existing opted-in clients or remove "
                "personalization assumptions."
            ),
        )
        self.other_issue = ComplianceIssue.objects.create(
            compliance_check=self.other_check,
            title="Foreign issue",
            category=ComplianceIssue.ComplianceCategory.CLAIMS,
            severity=ComplianceIssue.ComplianceSeverity.LOW,
            explanation="Should not be visible.",
            suggested_fix="Do not expose.",
        )

    def test_list_returns_only_own_workspace_checks(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(CHECKS_URL)
        self.assertEqual(response.status_code, 200)
        ids = [check["id"] for check in response.data]
        self.assertIn(str(self.check.id), ids)
        self.assertNotIn(str(self.other_check.id), ids)

    def test_filter_checks_by_draft(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(CHECKS_URL, {"draft": str(self.draft.id)})
        self.assertEqual(response.status_code, 200)
        self.assertEqual([check["id"] for check in response.data], [str(self.check.id)])

    def test_unauthenticated_check_list_is_rejected(self):
        response = self.client.get(CHECKS_URL)
        self.assertIn(response.status_code, [401, 403])

    def test_create_compliance_check(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "draft": str(self.draft.id),
            "status": ComplianceCheck.ComplianceStatus.RED,
            "summary": "Resolve high-priority claims before review can continue.",
        }
        response = self.client.post(CHECKS_URL, payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["workspaceId"], str(self.workspace.id))
        self.assertEqual(response.data["draftId"], str(self.draft.id))
        self.assertEqual(response.data["status"], ComplianceCheck.ComplianceStatus.RED)
        self.assertEqual(response.data["issues"], [])

    def test_create_check_for_foreign_draft_is_denied(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "draft": str(self.other_draft.id),
            "status": ComplianceCheck.ComplianceStatus.YELLOW,
            "summary": "Forbidden check.",
        }
        response = self.client.post(CHECKS_URL, payload, format="json")
        self.assertEqual(response.status_code, 403)

    def test_cross_workspace_check_retrieve_returns_404(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(check_detail_url(self.other_check.id))
        self.assertEqual(response.status_code, 404)

    def test_check_response_shape_matches_frontend_type(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(check_detail_url(self.check.id))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            set(response.data.keys()),
            {
                "id",
                "workspaceId",
                "draftId",
                "status",
                "summary",
                "checkedAt",
                "createdAt",
                "updatedAt",
                "issues",
            },
        )
        self.assertEqual(response.data["issues"][0]["id"], str(self.issue.id))

    def test_list_returns_only_own_workspace_issues(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(ISSUES_URL)
        self.assertEqual(response.status_code, 200)
        ids = [issue["id"] for issue in response.data]
        self.assertIn(str(self.issue.id), ids)
        self.assertNotIn(str(self.other_issue.id), ids)

    def test_filter_issues_by_check(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(ISSUES_URL, {"check": str(self.check.id)})
        self.assertEqual(response.status_code, 200)
        self.assertEqual([issue["id"] for issue in response.data], [str(self.issue.id)])

    def test_create_compliance_issue(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "check": str(self.check.id),
            "title": "Substantiate exclusivity claim",
            "category": ComplianceIssue.ComplianceCategory.CLAIMS,
            "severity": ComplianceIssue.ComplianceSeverity.HIGH,
            "explanation": "The copy implies access is guaranteed to remain exclusive.",
            "suggested_fix": "Soften the claim and avoid a guarantee of future access.",
        }
        response = self.client.post(ISSUES_URL, payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["workspaceId"], str(self.workspace.id))
        self.assertEqual(response.data["checkId"], str(self.check.id))
        self.assertEqual(response.data["draftId"], str(self.draft.id))
        self.assertEqual(response.data["category"], ComplianceIssue.ComplianceCategory.CLAIMS)

    def test_create_issue_for_foreign_check_is_denied(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "check": str(self.other_check.id),
            "title": "Forbidden issue",
            "category": ComplianceIssue.ComplianceCategory.IP,
            "severity": ComplianceIssue.ComplianceSeverity.LOW,
            "explanation": "Should not be created.",
            "suggested_fix": "",
        }
        response = self.client.post(ISSUES_URL, payload, format="json")
        self.assertEqual(response.status_code, 403)

    def test_cross_workspace_issue_retrieve_returns_404(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(issue_detail_url(self.other_issue.id))
        self.assertEqual(response.status_code, 404)

    def test_issue_response_shape_matches_frontend_type(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(issue_detail_url(self.issue.id))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            set(response.data.keys()),
            {
                "id",
                "workspaceId",
                "checkId",
                "draftId",
                "title",
                "category",
                "severity",
                "explanation",
                "suggestedFix",
                "createdAt",
                "updatedAt",
            },
        )
