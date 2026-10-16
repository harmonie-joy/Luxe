import copy
import uuid

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import F
from rest_framework import serializers as drf_serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError as APIValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from tenancy.models import Membership
from brand.models import BrandProfile, BrandVoice

from .models import (
    Approval,
    ContentBrief,
    ContentDraft,
    ContentItem,
    ExecutionCheckpoint,
    Project,
    ScheduledContent,
)
from .serializers import (
    ApprovalSerializer,
    CheckpointWriteSerializer,
    ContentBriefSerializer,
    ContentDraftSerializer,
    ContentItemReadSerializer,
    ContentItemWriteSerializer,
    ProjectSerializer,
    ScheduledContentSerializer,
    execution_context,
)


WRITE_ROLES = (Membership.Role.OWNER, Membership.Role.ADMIN, Membership.Role.EDITOR)


def _list_workspace(request):
    value = request.query_params.get("workspace")
    if value is None:
        raise APIValidationError({"workspace": "This query parameter is required."})
    return drf_serializers.IntegerField(min_value=1).run_validation(value)


def _require_writer(user, workspace_id):
    if not Membership.objects.filter(user=user, workspace_id=workspace_id, role__in=WRITE_ROLES).exists():
        raise PermissionDenied("You cannot edit content in this workspace.")


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


class ApprovalViewSet(viewsets.ModelViewSet):
    """
    CRUD for Approval, scoped through the parent ContentDraft -> ContentBrief workspace.
    """

    serializer_class = ApprovalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = (
            Approval.objects.select_related(
                "draft",
                "draft__brief",
                "draft__brief__workspace",
                "user",
            )
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
                "You do not have permission to approve drafts in this workspace."
            )

        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        draft = serializer.validated_data.get("draft", serializer.instance.draft)

        if not draft.brief.workspace.memberships.filter(user=self.request.user).exists():
            raise PermissionDenied(
                "You do not have permission to approve drafts in this workspace."
            )

        serializer.save()


class ProjectViewSet(viewsets.GenericViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(workspace__memberships__user=self.request.user)

    def list(self, request):
        workspace_id = _list_workspace(request)
        projects = self.get_queryset().filter(workspace_id=workspace_id)
        return Response(self.get_serializer(projects, many=True).data)

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        _require_writer(request.user, serializer.validated_data["workspace"].id)
        project = serializer.save(created_by=request.user)
        return Response(self.get_serializer(project).data, status=status.HTTP_201_CREATED)


class ContentItemViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ContentItem.objects.select_related("project", "brand_profile", "brand_voice").filter(
            project__workspace__memberships__user=self.request.user,
            brand_profile__workspace_id=F("project__workspace_id"),
            brand_voice__brand_profile_id=F("brand_profile_id"),
        )

    def list(self, request):
        workspace_id = _list_workspace(request)
        items = self.get_queryset().filter(project__workspace_id=workspace_id)
        return Response(ContentItemReadSerializer(items, many=True).data)

    def retrieve(self, request, pk=None):
        item = self.get_object()
        return Response(execution_context(item, item.checkpoints.first()))

    @action(detail=True, methods=["get"], url_path="context")
    def context(self, request, pk=None):
        return self.retrieve(request, pk)

    def create(self, request):
        serializer = ContentItemWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        _require_writer(request.user, serializer.validated_data["project"].workspace_id)
        with transaction.atomic():
            profile = BrandProfile.objects.select_for_update().get(
                pk=serializer.validated_data["brand_profile"].pk
            )
            voice = BrandVoice.objects.select_for_update().get(
                pk=serializer.validated_data["brand_voice"].pk
            )
            if (
                profile.workspace_id != serializer.validated_data["project"].workspace_id
                or voice.brand_profile_id != profile.id
                or not voice.is_active
            ):
                raise APIValidationError({"brand_voice": "The selected voice is no longer active for this workspace."})
            item = serializer.save(created_by=request.user)
            checkpoint = ExecutionCheckpoint.objects.create(
                content_item=item,
                revision=1,
                client_request_id=uuid.uuid4(),
                goal=item.goal,
                workflow_stage=item.workflow_stage,
                next_action=item.next_action,
                decisions=item.decisions,
                open_questions=item.open_questions,
                created_by=request.user,
            )
        return Response(execution_context(item, checkpoint), status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="checkpoint")
    def checkpoint(self, request, pk=None):
        item = self.get_object()
        _require_writer(request.user, item.project.workspace_id)
        serializer = CheckpointWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        with transaction.atomic():
            item = self.get_queryset().select_for_update().get(pk=item.pk)
            prior = item.checkpoints.filter(client_request_id=data["client_request_id"]).first()
            if prior:
                snapshot_matches = prior.revision == data["expected_revision"] + 1 and all(
                    getattr(prior, field) == data[field]
                    for field in ("goal", "workflow_stage", "next_action", "decisions", "open_questions")
                )
                if not snapshot_matches:
                    return Response(
                        {"code": "idempotency_key_reused", "currentRevision": item.revision},
                        status=409,
                    )
                previous_item = copy.copy(item)
                for field in ("goal", "workflow_stage", "next_action", "decisions", "open_questions"):
                    setattr(previous_item, field, getattr(prior, field))
                previous_item.revision = prior.revision
                previous_item.updated_at = prior.created_at
                return Response(execution_context(previous_item, prior), status=status.HTTP_201_CREATED)
            if item.revision != data["expected_revision"]:
                return Response({"code": "stale_revision", "currentRevision": item.revision}, status=409)
            for field in ("goal", "workflow_stage", "next_action", "decisions", "open_questions"):
                setattr(item, field, data[field])
            item.revision += 1
            item.save(update_fields=[
                "goal", "workflow_stage", "next_action", "decisions",
                "open_questions", "revision", "updated_at",
            ])
            checkpoint = ExecutionCheckpoint.objects.create(
                content_item=item,
                revision=item.revision,
                client_request_id=data["client_request_id"],
                goal=item.goal,
                workflow_stage=item.workflow_stage,
                next_action=item.next_action,
                decisions=item.decisions,
                open_questions=item.open_questions,
                created_by=request.user,
            )
        return Response(execution_context(item, checkpoint), status=status.HTTP_201_CREATED)
