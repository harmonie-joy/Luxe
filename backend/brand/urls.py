from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AudienceSegmentViewSet,
    BrandAssetViewSet,
    BrandProfileViewSet,
    BrandVoiceViewSet,
    ChannelStyleViewSet,
    VoiceAuditScoreViewSet,
    VoiceExampleViewSet,
)

router = DefaultRouter()
router.register(r"brand-profiles", BrandProfileViewSet, basename="brand-profile")
router.register(r"brand-assets", BrandAssetViewSet, basename="brand-asset")
router.register(r"brand-voices", BrandVoiceViewSet, basename="brand-voice")
router.register(r"audience-segments", AudienceSegmentViewSet, basename="audience-segment")
router.register(r"channel-styles", ChannelStyleViewSet, basename="channel-style")
router.register(
    r"voice-audit-scores", VoiceAuditScoreViewSet, basename="voice-audit-score"
)
router.register(r"voice-examples", VoiceExampleViewSet, basename="voice-example")

urlpatterns = [
    path("", include(router.urls)),
]
