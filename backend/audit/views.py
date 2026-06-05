from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ModelViewSet):
    """
    CRUD for AuditLog, scoped directly to workspaces the authenticated user belongs to.
    Supports optional filtering by ?workspace=<id> and ?target_id=<uuid>.
    """

    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]

    def _ensure_workspace_membership(self, workspace):
        if not workspace.memberships.filter(user=self.request.user).exists():
            raise PermissionDenied(
                "You do not have permission to log activity in this workspace."
            )

    def get_queryset(self):
        qs = (
            AuditLog.objects.select_related("workspace", "user")
            .filter(workspace__memberships__user=self.request.user)
        )
        workspace_id = self.request.query_params.get("workspace")
        target_id = self.request.query_params.get("target_id")
        if workspace_id:
            qs = qs.filter(workspace=workspace_id)
        if target_id:
            qs = qs.filter(target_id=target_id)
        return qs

    def perform_create(self, serializer):
        workspace = serializer.validated_data["workspace"]

        self._ensure_workspace_membership(workspace)

        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        workspace = serializer.validated_data.get(
            "workspace",
            serializer.instance.workspace,
        )

        self._ensure_workspace_membership(workspace)

        serializer.save()
