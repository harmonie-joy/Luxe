from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = [
            "id",
            "workspace",
            "user",
            "action",
            "target_type",
            "target_id",
            "description",
            "created_at",
        ]
        read_only_fields = ["id", "user", "created_at"]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        return {
            "id": rep["id"],
            "workspaceId": str(rep["workspace"]),
            "userId": str(rep["user"]) if rep["user"] else None,
            "action": rep["action"],
            "targetType": rep["target_type"],
            "targetId": str(rep["target_id"]),
            "description": rep["description"],
            "createdAt": rep["created_at"],
        }
