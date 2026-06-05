from django.core.exceptions import ValidationError
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from .models import ContentBrief, ContentDraft, ScheduledContent
from .serializers import (
    ContentBriefSerializer,
    ContentDraftSerializer,
    ScheduledContentSerializer,
)


class ContentBriefViewSet(viewsets.ModelViewSet):
    """
    CRUD for ContentBrief, scoped to workspaces the authenticated user belongs to.
    Creating a brief with a brand profile from another workspace is rejected.
    """

    serializer_class = ContentBriefSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ContentBrief.objects.select_related("workspace", "brand_profile").filter(
            workspace__memberships__user=self.request.user
        )

    def perform_create(self, serializer):
        workspace = serializer.validated_data["workspace"]
        brand_profile = serializer.validated_data["brand_profile"]

        if not workspace.memberships.filter(user=self.request.user).exists():
            raise PermissionDenied(
                "You do not have permission to create briefs in this workspace."
            )

        if brand_profile.workspace_id != workspace.id:
            raise PermissionDenied(
                "You do not have permission to use a brand profile from another workspace."
            )

        serializer.save()

    def perform_update(self, serializer):
        workspace = serializer.validated_data.get("workspace", serializer.instance.workspace)
        brand_profile = serializer.validated_data.get(
            "brand_profile", serializer.instance.brand_profile
        )

        if not workspace.memberships.filter(user=self.request.user).exists():
            raise PermissionDenied(
                "You do not have permission to move briefs into this workspace."
            )

        if brand_profile.workspace_id != workspace.id:
            raise PermissionDenied(
                "You do not have permission to move a brief onto a foreign brand profile."
            )

        serializer.save()


class ContentDraftViewSet(viewsets.ModelViewSet):
    """
    CRUD for ContentDraft, scoped through the parent ContentBrief workspace.
    Supports optional filtering by ?brief=<uuid>.
    """

    serializer_class = ContentDraftSerializer
    permission_classes = [IsAuthenticated]

    def _deny_foreign_brief_payload(self):
        brief_id = self.request.data.get("brief")
        if not brief_id:
            return

        try:
            brief = ContentBrief.objects.select_related("workspace").get(pk=brief_id)
        except (ContentBrief.DoesNotExist, TypeError, ValueError, ValidationError):
            return

        if not brief.workspace.memberships.filter(user=self.request.user).exists():
            raise PermissionDenied(
                "You do not have permission to use this brief."
            )

    def create(self, request, *args, **kwargs):
        self._deny_foreign_brief_payload()
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        self._deny_foreign_brief_payload()
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self._deny_foreign_brief_payload()
        return super().partial_update(request, *args, **kwargs)

    def get_queryset(self):
        qs = (
            ContentDraft.objects.select_related(
                "brief",
                "brief__workspace",
                "created_by",
            )
            .filter(brief__workspace__memberships__user=self.request.user)
        )
        brief_id = self.request.query_params.get("brief")
        if brief_id:
            qs = qs.filter(brief=brief_id)
        return qs

    def perform_create(self, serializer):
        brief = serializer.validated_data["brief"]

        if not brief.workspace.memberships.filter(user=self.request.user).exists():
            raise PermissionDenied(
                "You do not have permission to create drafts for this brief."
            )

        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        brief = serializer.validated_data.get("brief", serializer.instance.brief)

        if not brief.workspace.memberships.filter(user=self.request.user).exists():
            raise PermissionDenied(
                "You do not have permission to move drafts into this brief."
            )

        serializer.save()


class ScheduledContentViewSet(viewsets.ModelViewSet):
    """
    CRUD for ScheduledContent, scoped directly to workspaces the authenticated
    user belongs to. Supports optional filtering by ?workspace=<id> and
    ?draft=<uuid>.
    """

    serializer_class = ScheduledContentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = (
            ScheduledContent.objects.select_related(
                "workspace",
                "draft",
                "draft__brief",
                "draft__brief__workspace",
            )
            .filter(workspace__memberships__user=self.request.user)
        )
        workspace_id = self.request.query_params.get("workspace")
        draft_id = self.request.query_params.get("draft")
        if workspace_id:
            qs = qs.filter(workspace=workspace_id)
        if draft_id:
            qs = qs.filter(draft=draft_id)
        return qs

    def perform_create(self, serializer):
        workspace = serializer.validated_data["workspace"]
        draft = serializer.validated_data["draft"]

        if not workspace.memberships.filter(user=self.request.user).exists():
            raise PermissionDenied(
                "You do not have permission to schedule content in this workspace."
            )

        if draft.brief.workspace_id != workspace.id:
            raise PermissionDenied(
                "You do not have permission to schedule a draft from another workspace."
            )

        serializer.save()

    def perform_update(self, serializer):
        workspace = serializer.validated_data.get(
            "workspace",
            serializer.instance.workspace,
        )
        draft = serializer.validated_data.get("draft", serializer.instance.draft)

        if not workspace.memberships.filter(user=self.request.user).exists():
            raise PermissionDenied(
                "You do not have permission to move scheduled content into this workspace."
            )

        if draft.brief.workspace_id != workspace.id:
            raise PermissionDenied(
                "You do not have permission to schedule a draft from another workspace."
            )

        serializer.save()
