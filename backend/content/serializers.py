from rest_framework import serializers

from .models import ContentBrief


class ContentBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentBrief
        fields = [
            "id",
            "workspace",
            "brand_profile",
            "content_objective",
            "campaign_goal",
            "audience",
            "angle",
            "constraints",
            "target_channels",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_target_channels(self, value):
        allowed_values = {choice for choice, _label in ContentBrief.Channel.choices}
        invalid_values = sorted(set(value) - allowed_values)
        if invalid_values:
            raise serializers.ValidationError(
                f"Unsupported target channel values: {', '.join(invalid_values)}."
            )
        return value

    def validate(self, attrs):
        workspace = attrs.get("workspace")
        brand_profile = attrs.get("brand_profile")

        if self.instance is not None:
            workspace = workspace or self.instance.workspace
            brand_profile = brand_profile or self.instance.brand_profile

        if workspace and brand_profile and brand_profile.workspace_id != workspace.id:
            raise serializers.ValidationError(
                {
                    "brand_profile": (
                        "Brand profile must belong to the selected workspace."
                    )
                }
            )

        return attrs

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        return {
            "id": rep["id"],
            "workspaceId": str(rep["workspace"]),
            "brandProfileId": str(rep["brand_profile"]),
            "contentObjective": rep["content_objective"],
            "campaignGoal": rep["campaign_goal"],
            "audience": rep["audience"],
            "angle": rep["angle"],
            "constraints": rep["constraints"],
            "targetChannels": rep["target_channels"],
            "createdAt": rep["created_at"],
            "updatedAt": rep["updated_at"],
        }
