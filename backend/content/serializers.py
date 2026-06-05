from rest_framework import serializers

from .models import Approval, ContentBrief, ContentDraft, ScheduledContent


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


class ContentDraftSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentDraft
        fields = [
            "id",
            "brief",
            "created_by",
            "title",
            "content",
            "channel",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]
        validators = []

    def validate(self, attrs):
        brief = attrs.get("brief")
        channel = attrs.get("channel")

        if self.instance is not None:
            brief = brief or self.instance.brief
            channel = channel or self.instance.channel

        if brief and channel and channel not in brief.target_channels:
            raise serializers.ValidationError(
                {
                    "channel": (
                        "Draft channel must be one of the brief target channels."
                    )
                }
            )

        if brief and channel:
            duplicate_draft = ContentDraft.objects.filter(
                brief=brief,
                channel=channel,
            )
            if self.instance is not None:
                duplicate_draft = duplicate_draft.exclude(pk=self.instance.pk)

            if duplicate_draft.exists():
                raise serializers.ValidationError(
                    {
                        "channel": (
                            "A draft already exists for this brief and channel."
                        )
                    }
                )

        return attrs

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        return {
            "id": rep["id"],
            "workspaceId": str(instance.brief.workspace_id),
            "briefId": str(rep["brief"]),
            "title": rep["title"],
            "content": rep["content"],
            "channel": rep["channel"],
            "status": rep["status"],
            "createdBy": str(rep["created_by"]) if rep["created_by"] else None,
            "createdAt": rep["created_at"],
            "updatedAt": rep["updated_at"],
        }


class ScheduledContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledContent
        fields = [
            "id",
            "workspace",
            "draft",
            "channel",
            "status",
            "scheduled_for",
            "published_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        validators = []

    def validate(self, attrs):
        workspace = attrs.get("workspace")
        draft = attrs.get("draft")
        channel = attrs.get("channel")

        if self.instance is not None:
            workspace = workspace or self.instance.workspace
            draft = draft or self.instance.draft
            channel = channel or self.instance.channel

        if workspace and draft and draft.brief.workspace_id != workspace.id:
            raise serializers.ValidationError(
                {
                    "draft": (
                        "Scheduled draft must belong to the selected workspace."
                    )
                }
            )

        if draft and channel and channel != draft.channel:
            raise serializers.ValidationError(
                {
                    "channel": (
                        "Scheduled content channel must match the linked draft channel."
                    )
                }
            )

        if draft:
            duplicate_item = ScheduledContent.objects.filter(draft=draft)
            if self.instance is not None:
                duplicate_item = duplicate_item.exclude(pk=self.instance.pk)

            if duplicate_item.exists():
                raise serializers.ValidationError(
                    {
                        "draft": (
                            "A scheduled content item already exists for this draft."
                        )
                    }
                )

        return attrs

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        return {
            "id": rep["id"],
            "workspaceId": str(rep["workspace"]),
            "draftId": str(rep["draft"]),
            "channel": rep["channel"],
            "status": rep["status"],
            "scheduledFor": rep["scheduled_for"],
            "publishedAt": rep["published_at"],
            "createdAt": rep["created_at"],
            "updatedAt": rep["updated_at"],
        }


class ApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Approval
        fields = [
            "id",
            "draft",
            "user",
            "role",
            "created_at",
        ]
        read_only_fields = ["id", "user", "created_at"]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        return {
            "id": rep["id"],
            "workspaceId": str(instance.draft.brief.workspace_id),
            "draftId": str(rep["draft"]),
            "userId": str(rep["user"]) if rep["user"] else None,
            "role": rep["role"],
            "createdAt": rep["created_at"],
        }
