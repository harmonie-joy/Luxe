from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from .models import ContentBrief
from .serializers import ContentBriefSerializer


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
