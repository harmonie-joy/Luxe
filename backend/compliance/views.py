from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from .models import ComplianceCheck, ComplianceIssue
from .serializers import ComplianceCheckSerializer, ComplianceIssueSerializer


class ComplianceCheckViewSet(viewsets.ModelViewSet):
    """
    CRUD for ComplianceCheck, scoped through ContentDraft -> ContentBrief workspace.
    Supports optional filtering by ?draft=<uuid>.
    """

    serializer_class = ComplianceCheckSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = (
            ComplianceCheck.objects.select_related(
                "draft",
                "draft__brief",
                "draft__brief__workspace",
            )
            .prefetch_related("issues")
            .filter(draft__brief__workspace__memberships__user=self.request.user)
        )
        draft_id = self.request.query_params.get("draft")
        if draft_id:
            qs = qs.filter(draft=draft_id)
        return qs

    def perform_create(self, serializer):
        draft = serializer.validated_data["draft"]

        if not draft.brief.workspace.memberships.filter(user=self.request.user).exists():
            raise PermissionDenied(
                "You do not have permission to create checks for this draft."
            )

        serializer.save()

    def perform_update(self, serializer):
        draft = serializer.validated_data.get("draft", serializer.instance.draft)

        if not draft.brief.workspace.memberships.filter(user=self.request.user).exists():
            raise PermissionDenied(
                "You do not have permission to move checks onto this draft."
            )

        serializer.save()


class ComplianceIssueViewSet(viewsets.ModelViewSet):
    """
    CRUD for ComplianceIssue, scoped through ComplianceCheck -> ContentDraft workspace.
    Supports optional filtering by ?check=<uuid>.
    """

    serializer_class = ComplianceIssueSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = (
            ComplianceIssue.objects.select_related(
                "compliance_check",
                "compliance_check__draft",
                "compliance_check__draft__brief",
                "compliance_check__draft__brief__workspace",
            )
            .filter(
                compliance_check__draft__brief__workspace__memberships__user=(
                    self.request.user
                )
            )
        )
        check_id = self.request.query_params.get("check")
        if check_id:
            qs = qs.filter(compliance_check=check_id)
        return qs

    def perform_create(self, serializer):
        check = serializer.validated_data["compliance_check"]

        if not check.draft.brief.workspace.memberships.filter(
            user=self.request.user
        ).exists():
            raise PermissionDenied(
                "You do not have permission to create issues for this check."
            )

        serializer.save()

    def perform_update(self, serializer):
        check = serializer.validated_data.get(
            "compliance_check",
            serializer.instance.compliance_check,
        )

        if not check.draft.brief.workspace.memberships.filter(
            user=self.request.user
        ).exists():
            raise PermissionDenied(
                "You do not have permission to move issues onto this check."
            )

        serializer.save()
