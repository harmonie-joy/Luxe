from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import BrandAssetViewSet, BrandProfileViewSet

router = DefaultRouter()
router.register(r"brand-profiles", BrandProfileViewSet, basename="brand-profile")
router.register(r"brand-assets", BrandAssetViewSet, basename="brand-asset")

urlpatterns = [
    path("", include(router.urls)),
]
