from rest_framework import serializers

from .models import BrandAsset, BrandProfile


class BrandVocabularyRulePayloadSerializer(serializers.Serializer):
    id = serializers.CharField(max_length=100)
    preferred_term = serializers.CharField(max_length=200)
    restricted_terms = serializers.ListField(
        child=serializers.CharField(max_length=200),
        required=False,
        default=list,
    )
    note = serializers.CharField(required=False, allow_blank=True, default="")


class BannedPhrasePayloadSerializer(serializers.Serializer):
    id = serializers.CharField(max_length=100)
    phrase = serializers.CharField(max_length=200)
    reason = serializers.CharField(required=False, allow_blank=True, default="")


class BrandAssetSerializer(serializers.ModelSerializer):
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
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        return {
            "id": rep["id"],
            "workspaceId": str(instance.brand_profile.workspace_id),
            "brandProfileId": str(rep["brand_profile"]),
            "title": rep["title"],
            "content": rep["content"],
            "sourceType": rep["source_type"],
            "format": rep["format"],
            "wordCount": rep["word_count"],
            "status": rep["status"],
            "createdAt": rep["created_at"],
            "updatedAt": rep["updated_at"],
        }


class BrandProfileSerializer(serializers.ModelSerializer):
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

    def validate_tone(self, value):
        allowed_values = {choice for choice, _label in BrandProfile.ToneValue.choices}
        invalid_values = sorted(set(value) - allowed_values)
        if invalid_values:
            raise serializers.ValidationError(
                f"Unsupported tone values: {', '.join(invalid_values)}."
            )
        return value

    def validate_preferred_vocabulary(self, value):
        serializer = BrandVocabularyRulePayloadSerializer(data=value, many=True)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data

    def validate_banned_phrases(self, value):
        serializer = BannedPhrasePayloadSerializer(data=value, many=True)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        return {
            "id": rep["id"],
            "workspaceId": str(rep["workspace"]),
            "name": rep["name"],
            "audience": rep["audience"],
            "tone": rep["tone"],
            "preferredVocabulary": [
                {
                    "id": rule["id"],
                    "preferredTerm": rule["preferred_term"],
                    "restrictedTerms": rule.get("restricted_terms", []),
                    "note": rule.get("note", ""),
                }
                for rule in rep["preferred_vocabulary"]
            ],
            "bannedPhrases": [
                {
                    "id": phrase["id"],
                    "phrase": phrase["phrase"],
                    "reason": phrase.get("reason", ""),
                }
                for phrase in rep["banned_phrases"]
            ],
            "positioningNotes": rep["positioning_notes"],
            "sampleCount": rep["sample_count"],
            "createdAt": rep["created_at"],
            "updatedAt": rep["updated_at"],
        }
