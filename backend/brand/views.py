from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    AudienceSegment,
    BrandAsset,
    BrandProfile,
    BrandVoice,
    ChannelStyle,
    VoiceAuditScore,
    VoiceExample,
)
from .serializers import (
    AudienceSegmentSerializer,
    BrandAssetSerializer,
    BrandProfileSerializer,
    BrandVoiceSerializer,
    ChannelStyleSerializer,
    VoiceAuditScoreSerializer,
    VoiceExampleSerializer,
)


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


class _ProfileScopedViewSet(viewsets.ModelViewSet):
    """
    Shared behavior for models hanging off a brand_profile FK: queryset scoped
    through workspace membership, optional ?brand_profile=<uuid> filter, and
    403 on writes against a foreign profile.
    """

    permission_classes = [IsAuthenticated]
    model = None

    def get_queryset(self):
        qs = self.model.objects.select_related(
            "brand_profile", "brand_profile__workspace"
        ).filter(brand_profile__workspace__memberships__user=self.request.user)
        brand_profile_id = self.request.query_params.get("brand_profile")
        if brand_profile_id:
            qs = qs.filter(brand_profile=brand_profile_id)
        return qs

    def _check_profile_membership(self, serializer, verb):
        brand_profile = serializer.validated_data.get(
            "brand_profile",
            serializer.instance.brand_profile if serializer.instance else None,
        )
        workspace = brand_profile.workspace
        if not workspace.memberships.filter(user=self.request.user).exists():
            raise PermissionDenied(
                f"You do not have permission to {verb} this brand profile."
            )

    def perform_create(self, serializer):
        self._check_profile_membership(serializer, "add records to")
        serializer.save()

    def perform_update(self, serializer):
        self._check_profile_membership(serializer, "move records into")
        serializer.save()


class BrandAssetViewSet(_ProfileScopedViewSet):
    """
    CRUD for BrandAsset, scoped to workspaces the authenticated user belongs to.
    Supports optional filtering by ?brand_profile=<uuid>.
    Creating an asset on a brand profile in a foreign workspace is denied (403).
    """

    model = BrandAsset
    serializer_class = BrandAssetSerializer


class AudienceSegmentViewSet(_ProfileScopedViewSet):
    """CRUD for AudienceSegment with the same workspace scoping as assets."""

    model = AudienceSegment
    serializer_class = AudienceSegmentSerializer


class ChannelStyleViewSet(_ProfileScopedViewSet):
    """CRUD for ChannelStyle; unique per (brand_profile, channel)."""

    model = ChannelStyle
    serializer_class = ChannelStyleSerializer


class BrandVoiceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only BrandVoice versions (extraction creates them). Supports
    ?brand_profile=<uuid> filtering and POST /activate/ to switch the
    active version.
    """

    serializer_class = BrandVoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = (
            BrandVoice.objects.select_related("brand_profile", "brand_profile__workspace")
            .prefetch_related("extracted_from")
            .filter(brand_profile__workspace__memberships__user=self.request.user)
        )
        brand_profile_id = self.request.query_params.get("brand_profile")
        if brand_profile_id:
            qs = qs.filter(brand_profile=brand_profile_id)
        return qs

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        voice = self.get_object()
        voice.activate()
        return Response(self.get_serializer(voice).data)


class VoiceExampleViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only voice examples; supports ?voice=<uuid> filtering."""

    serializer_class = VoiceExampleSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = VoiceExample.objects.select_related("voice__brand_profile__workspace").filter(
            voice__brand_profile__workspace__memberships__user=self.request.user
        )
        voice_id = self.request.query_params.get("voice")
        if voice_id:
            qs = qs.filter(voice=voice_id)
        return qs


class VoiceAuditScoreViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only persisted voice-review scores; supports ?voice=<uuid> filtering."""

    serializer_class = VoiceAuditScoreSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = VoiceAuditScore.objects.select_related("voice__brand_profile__workspace").filter(
            voice__brand_profile__workspace__memberships__user=self.request.user
        )
        voice_id = self.request.query_params.get("voice")
        if voice_id:
            qs = qs.filter(voice=voice_id)
        return qs
