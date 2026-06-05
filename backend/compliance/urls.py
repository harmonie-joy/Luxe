from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ComplianceCheckViewSet, ComplianceIssueViewSet

router = DefaultRouter()
router.register(r"compliance-checks", ComplianceCheckViewSet, basename="compliance-check")
router.register(r"compliance-issues", ComplianceIssueViewSet, basename="compliance-issue")

urlpatterns = [
    path("", include(router.urls)),
]
