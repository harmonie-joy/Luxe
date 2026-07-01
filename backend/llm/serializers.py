from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from brand.models import BrandAsset, BrandProfile
from content.models import ContentBrief
from tenancy.models import Workspace


class BrandVoiceExtractionRequestSerializer(serializers.Serializer):
    workspace = serializers.PrimaryKeyRelatedField(queryset=Workspace.objects.all())
    brand_profile = serializers.PrimaryKeyRelatedField(queryset=BrandProfile.objects.all())
    asset_ids = serializers.ListField(
        child=serializers.UUIDField(),
        allow_empty=False,
    )

    def validate(self, attrs):
        request = self.context["request"]
        workspace = attrs["workspace"]
        brand_profile = attrs["brand_profile"]
        asset_ids = attrs["asset_ids"]

        if not workspace.memberships.filter(user=request.user).exists():
            raise PermissionDenied("You do not have permission to use this workspace.")

        if brand_profile.workspace_id != workspace.id:
            raise PermissionDenied(
                "You do not have permission to use this brand profile."
            )

        assets = BrandAsset.objects.select_related(
            "brand_profile",
            "brand_profile__workspace",
        ).filter(id__in=asset_ids)
        assets_by_id = {str(asset.id): asset for asset in assets}
        missing_asset_ids = [
            str(asset_id) for asset_id in asset_ids if str(asset_id) not in assets_by_id
        ]
        if missing_asset_ids:
            raise serializers.ValidationError(
                {"asset_ids": f"Unknown asset IDs: {', '.join(missing_asset_ids)}."}
            )

        ordered_assets = [assets_by_id[str(asset_id)] for asset_id in asset_ids]
        if any(asset.brand_profile_id != brand_profile.id for asset in ordered_assets):
            raise PermissionDenied("You do not have permission to use these assets.")

        attrs["assets"] = ordered_assets
        return attrs


class DraftGenerationRequestSerializer(serializers.Serializer):
    workspace = serializers.PrimaryKeyRelatedField(queryset=Workspace.objects.all())
    brief = serializers.PrimaryKeyRelatedField(queryset=ContentBrief.objects.all())
    channels = serializers.ListField(
        child=serializers.ChoiceField(choices=ContentBrief.Channel.choices),
        allow_empty=False,
    )

    def validate(self, attrs):
        request = self.context["request"]
        workspace = attrs["workspace"]
        brief = attrs["brief"]
        channels = attrs["channels"]

        if not workspace.memberships.filter(user=request.user).exists():
            raise PermissionDenied("You do not have permission to use this workspace.")

        if brief.workspace_id != workspace.id:
            raise PermissionDenied("You do not have permission to use this brief.")

        invalid_for_brief = sorted(set(channels) - set(brief.target_channels))
        if invalid_for_brief:
            raise serializers.ValidationError(
                {
                    "channels": (
                        "Requested channels must be selected on the brief: "
                        f"{', '.join(invalid_for_brief)}."
                    )
                }
            )

        return attrs
