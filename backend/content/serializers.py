from rest_framework import serializers

from brand.models import BrandVoiceApproval

from .models import (
    Approval,
    ContentBrief,
    ContentDraft,
    ContentItem,
    Project,
    ScheduledContent,
)


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


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "workspace", "name", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_fields(self):
        fields = super().get_fields()
        fields["workspace"].queryset = fields["workspace"].queryset.filter(
            memberships__user=self.context["request"].user
        )
        return fields

    def validate_name(self, value):
        if not value.strip():
            raise serializers.ValidationError("Project name cannot be blank.")
        return value

    def to_representation(self, instance):
        return {
            "id": str(instance.id),
            "workspaceId": instance.workspace_id,
            "name": instance.name,
            "createdAt": instance.created_at.isoformat(),
            "updatedAt": instance.updated_at.isoformat(),
        }


class ContentItemWriteSerializer(serializers.ModelSerializer):
    goal = serializers.CharField(max_length=5000)
    next_action = serializers.CharField(max_length=500)
    decisions = serializers.ListField(child=serializers.CharField(max_length=500), max_length=20)
    open_questions = serializers.ListField(child=serializers.CharField(max_length=500), max_length=20)

    class Meta:
        model = ContentItem
        fields = [
            "project", "brand_profile", "brand_voice", "title", "goal",
            "workflow_stage", "next_action", "decisions", "open_questions",
        ]

    def get_fields(self):
        fields = super().get_fields()
        user = self.context["request"].user
        fields["project"].queryset = fields["project"].queryset.filter(workspace__memberships__user=user)
        fields["brand_profile"].queryset = fields["brand_profile"].queryset.filter(
            workspace__memberships__user=user
        )
        fields["brand_voice"].queryset = fields["brand_voice"].queryset.filter(
            brand_profile__workspace__memberships__user=user
        )
        return fields

    def validate(self, attrs):
        project, profile, voice = attrs["project"], attrs["brand_profile"], attrs["brand_voice"]
        if profile.workspace_id != project.workspace_id or voice.brand_profile_id != profile.id:
            raise serializers.ValidationError(
                "Project, brand profile, and voice must belong to the same workspace and profile."
            )
        if not voice.is_active:
            raise serializers.ValidationError({"brand_voice": "Select the active voice version."})
        if not voice.approvals.filter(
            workspace_id=project.workspace_id,
            event=BrandVoiceApproval.Event.ACCEPTED,
        ).exists():
            raise serializers.ValidationError(
                {"brand_voice": "Select a human-approved voice version."}
            )
        return attrs


class CheckpointWriteSerializer(serializers.Serializer):
    expected_revision = serializers.IntegerField(min_value=1)
    client_request_id = serializers.UUIDField()
    goal = serializers.CharField(max_length=5000)
    workflow_stage = serializers.ChoiceField(choices=ContentItem.Stage.choices)
    next_action = serializers.CharField(max_length=500)
    decisions = serializers.ListField(child=serializers.CharField(max_length=500), max_length=20)
    open_questions = serializers.ListField(child=serializers.CharField(max_length=500), max_length=20)


class ContentItemReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContentItem
        fields = "__all__"

    def to_representation(self, instance):
        return {
            "id": str(instance.id),
            "projectId": str(instance.project_id),
            "brandProfileId": str(instance.brand_profile_id),
            "brandVoiceId": str(instance.brand_voice_id),
            "title": instance.title,
            "goal": instance.goal,
            "workflowStage": instance.workflow_stage,
            "nextAction": instance.next_action,
            "decisions": instance.decisions,
            "openQuestions": instance.open_questions,
            "revision": instance.revision,
            "createdAt": instance.created_at.isoformat(),
            "updatedAt": instance.updated_at.isoformat(),
        }


def execution_context(item, checkpoint):
    return {
        "item": ContentItemReadSerializer(item).data,
        "checkpoint": {
            "id": str(checkpoint.id),
            "revision": checkpoint.revision,
            "goal": checkpoint.goal,
            "workflowStage": checkpoint.workflow_stage,
            "nextAction": checkpoint.next_action,
            "decisions": checkpoint.decisions,
            "openQuestions": checkpoint.open_questions,
            "createdAt": checkpoint.created_at.isoformat(),
        },
        "brandVoice": {
            "id": str(item.brand_voice_id),
            "version": item.brand_voice.version,
            "isApproved": BrandVoiceApproval.objects.filter(
                voice_id=item.brand_voice_id,
                workspace_id=item.project.workspace_id,
                event=BrandVoiceApproval.Event.ACCEPTED,
            ).exists(),
        },
    }
