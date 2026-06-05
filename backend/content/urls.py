from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ApprovalViewSet,
    ContentBriefViewSet,
    ContentDraftViewSet,
    ScheduledContentViewSet,
)

router = DefaultRouter()
router.register(r"content-briefs", ContentBriefViewSet, basename="content-brief")
router.register(r"content-drafts", ContentDraftViewSet, basename="content-draft")
router.register(
    r"scheduled-content",
    ScheduledContentViewSet,
    basename="scheduled-content",
)
router.register(r"approvals", ApprovalViewSet, basename="approval")

urlpatterns = [
    path("", include(router.urls)),
]
