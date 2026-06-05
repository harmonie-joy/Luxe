from rest_framework import serializers

from .models import ComplianceCheck, ComplianceIssue


class ComplianceIssueSerializer(serializers.ModelSerializer):
    check = serializers.PrimaryKeyRelatedField(
        queryset=ComplianceCheck.objects.all(),
        source="compliance_check",
    )

    class Meta:
        model = ComplianceIssue
        fields = [
            "id",
            "check",
            "title",
            "category",
            "severity",
            "explanation",
            "suggested_fix",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        return {
            "id": rep["id"],
            "workspaceId": str(instance.compliance_check.draft.brief.workspace_id),
            "checkId": str(rep["check"]),
            "draftId": str(instance.compliance_check.draft_id),
            "title": rep["title"],
            "category": rep["category"],
            "severity": rep["severity"],
            "explanation": rep["explanation"],
            "suggestedFix": rep["suggested_fix"],
            "createdAt": rep["created_at"],
            "updatedAt": rep["updated_at"],
        }


class ComplianceCheckSerializer(serializers.ModelSerializer):
    issues = ComplianceIssueSerializer(many=True, read_only=True)

    class Meta:
        model = ComplianceCheck
        fields = [
            "id",
            "draft",
            "status",
            "summary",
            "checked_at",
            "created_at",
            "updated_at",
            "issues",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "issues"]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        return {
            "id": rep["id"],
            "workspaceId": str(instance.draft.brief.workspace_id),
            "draftId": str(rep["draft"]),
            "status": rep["status"],
            "summary": rep["summary"],
            "checkedAt": rep["checked_at"],
            "createdAt": rep["created_at"],
            "updatedAt": rep["updated_at"],
            "issues": rep["issues"],
        }
