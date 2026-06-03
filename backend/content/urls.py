from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ContentBriefViewSet

router = DefaultRouter()
router.register(r"content-briefs", ContentBriefViewSet, basename="content-brief")

urlpatterns = [
    path("", include(router.urls)),
]
