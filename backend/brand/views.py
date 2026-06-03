from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from .models import BrandAsset, BrandProfile
from .serializers import BrandAssetSerializer, BrandProfileSerializer


class BrandProfileViewSet(viewsets.ModelViewSet):
    """
    CRUD for BrandProfile, scoped to workspaces the authenticated user belongs to.
    Creating a profile in a workspace the user is not a member of is denied (403).
    """

    serializer_class = BrandProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            BrandProfile.objects.select_related("workspace")
            .prefetch_related("assets")
            .filter(workspace__memberships__user=self.request.user)
        )

    def perform_create(self, serializer):
        workspace = serializer.validated_data["workspace"]
        if not workspace.memberships.filter(user=self.request.user).exists():
            raise PermissionDenied(
                "You do not have permission to create profiles in this workspace."
            )
        serializer.save()

    def perform_update(self, serializer):
        workspace = serializer.validated_data.get("workspace", serializer.instance.workspace)
        if not workspace.memberships.filter(user=self.request.user).exists():
            raise PermissionDenied(
                "You do not have permission to move profiles into this workspace."
            )
        serializer.save()


class BrandAssetViewSet(viewsets.ModelViewSet):
    """
    CRUD for BrandAsset, scoped to workspaces the authenticated user belongs to.
    Supports optional filtering by ?brand_profile=<uuid>.
    Creating an asset on a brand profile in a foreign workspace is denied (403).
    """

    serializer_class = BrandAssetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = BrandAsset.objects.select_related("brand_profile", "brand_profile__workspace").filter(
            brand_profile__workspace__memberships__user=self.request.user
        )
        brand_profile_id = self.request.query_params.get("brand_profile")
        if brand_profile_id:
            qs = qs.filter(brand_profile=brand_profile_id)
        return qs

    def perform_create(self, serializer):
        brand_profile = serializer.validated_data["brand_profile"]
        workspace = brand_profile.workspace
        if not workspace.memberships.filter(user=self.request.user).exists():
            raise PermissionDenied(
                "You do not have permission to add assets to this brand profile."
            )
        serializer.save()

    def perform_update(self, serializer):
        brand_profile = serializer.validated_data.get(
            "brand_profile", serializer.instance.brand_profile
        )
        workspace = brand_profile.workspace
        if not workspace.memberships.filter(user=self.request.user).exists():
            raise PermissionDenied(
                "You do not have permission to move assets into this brand profile."
            )
        serializer.save()
