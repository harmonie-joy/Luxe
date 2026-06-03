from rest_framework import serializers

from .models import BrandAsset, BrandProfile


class BrandAssetSerializer(serializers.ModelSerializer):
    """
    Serializer for BrandAsset.

    Write fields use snake_case matching model field names.
    Read output uses camelCase aligned with the frontend BrandAsset type.
    """

    class Meta:
        model = BrandAsset
        fields = [
            "id",
            "brand_profile",
            "title",
            "content",
            "source_type",
            "format",
            "word_count",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        return {
            "id": rep["id"],
            "brandProfileId": str(rep["brand_profile"]),
            "title": rep["title"],
            "content": rep["content"],
            "sourceType": rep["source_type"],
            "format": rep["format"],
            "wordCount": rep["word_count"],
            "status": rep["status"],
            "createdAt": rep["created_at"],
        }


class BrandProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for BrandProfile.

    Write fields use snake_case matching model field names.
    Read output uses camelCase aligned with the frontend BrandProfile type.
    sampleCount is a computed read-only field derived from the related asset set.
    """

    sample_count = serializers.SerializerMethodField()

    class Meta:
        model = BrandProfile
        fields = [
            "id",
            "workspace",
            "name",
            "audience",
            "tone",
            "preferred_vocabulary",
            "banned_phrases",
            "positioning_notes",
            "sample_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_sample_count(self, obj):
        return obj.assets.count()

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        return {
            "id": rep["id"],
            "workspaceId": rep["workspace"],
            "name": rep["name"],
            "audience": rep["audience"],
            "tone": rep["tone"],
            "preferredVocabulary": rep["preferred_vocabulary"],
            "bannedPhrases": rep["banned_phrases"],
            "positioningNotes": rep["positioning_notes"],
            "sampleCount": rep["sample_count"],
            "createdAt": rep["created_at"],
            "updatedAt": rep["updated_at"],
        }
