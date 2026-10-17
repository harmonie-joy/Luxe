from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator

from .models import (
    AudienceSegment,
    BrandAsset,
    BrandProfile,
    BrandVoice,
    BrandVoiceApproval,
    ChannelStyle,
    VoiceAuditScore,
    VoiceExample,
)


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
            "media_type",
            "file",
            "mime_type",
            "analysis_summary",
            "source_type",
            "source_url",
            "channel",
            "language",
            "performance_signal",
            "content_date",
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
            "mediaType": rep["media_type"],
            "file": rep["file"],
            "mimeType": rep["mime_type"],
            "analysisSummary": rep["analysis_summary"],
            "sourceType": rep["source_type"],
            "sourceUrl": rep["source_url"],
            "channel": rep["channel"],
            "language": rep["language"],
            "performanceSignal": rep["performance_signal"],
            "contentDate": rep["content_date"],
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
            "maturity_stage",
            "primary_language",
            "industry",
            "category",
            "key_benefit",
            "differentiators",
            "reasons_to_believe",
            "competitors",
            "known_for",
            "mission",
            "values",
            "tagline",
            "archetype",
            "secondary_archetype",
            "personality_sincerity",
            "personality_excitement",
            "personality_competence",
            "personality_sophistication",
            "personality_ruggedness",
            "distinctive_assets",
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
        active_voice = instance.active_voice
        return {
            "id": rep["id"],
            "workspaceId": str(rep["workspace"]),
            "name": rep["name"],
            "maturityStage": rep["maturity_stage"],
            "primaryLanguage": rep["primary_language"],
            "industry": rep["industry"],
            "category": rep["category"],
            "keyBenefit": rep["key_benefit"],
            "differentiators": rep["differentiators"],
            "reasonsToBelieve": rep["reasons_to_believe"],
            "competitors": rep["competitors"],
            "knownFor": rep["known_for"],
            "mission": rep["mission"],
            "values": rep["values"],
            "tagline": rep["tagline"],
            "archetype": rep["archetype"],
            "secondaryArchetype": rep["secondary_archetype"],
            "personalitySincerity": rep["personality_sincerity"],
            "personalityExcitement": rep["personality_excitement"],
            "personalityCompetence": rep["personality_competence"],
            "personalitySophistication": rep["personality_sophistication"],
            "personalityRuggedness": rep["personality_ruggedness"],
            "distinctiveAssets": rep["distinctive_assets"],
            "activeVoiceId": str(active_voice.id) if active_voice else None,
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


class AudienceSegmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AudienceSegment
        fields = [
            "id",
            "brand_profile",
            "name",
            "is_primary",
            "buyer_type",
            "maturity_level",
            "pains",
            "desired_outcomes",
            "jargon_tolerance",
            "objections",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        return {
            "id": rep["id"],
            "brandProfileId": str(rep["brand_profile"]),
            "name": rep["name"],
            "isPrimary": rep["is_primary"],
            "buyerType": rep["buyer_type"],
            "maturityLevel": rep["maturity_level"],
            "pains": rep["pains"],
            "desiredOutcomes": rep["desired_outcomes"],
            "jargonTolerance": rep["jargon_tolerance"],
            "objections": rep["objections"],
            "notes": rep["notes"],
            "createdAt": rep["created_at"],
            "updatedAt": rep["updated_at"],
        }


class BrandVoiceSerializer(serializers.ModelSerializer):
    """Read-only: voices are created by extraction, never edited via API."""

    class Meta:
        model = BrandVoice
        fields = [
            "id",
            "brand_profile",
            "version",
            "is_active",
            "extracted_from",
            "voice_summary",
            "tone_funny",
            "tone_casual",
            "tone_irreverent",
            "tone_enthusiastic",
            "tone_tags",
            "point_of_view",
            "sentence_style",
            "pacing",
            "proof_style",
            "claim_boundaries",
            "preferred_vocabulary",
            "banned_phrases",
            "extraction_confidence",
            "extraction_notes",
            "created_at",
        ]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        return {
            "id": rep["id"],
            "brandProfileId": str(rep["brand_profile"]),
            "version": rep["version"],
            "isActive": rep["is_active"],
            "extractedFrom": [str(asset_id) for asset_id in rep["extracted_from"]],
            "voiceSummary": rep["voice_summary"],
            "tone": {
                "funny": rep["tone_funny"],
                "casual": rep["tone_casual"],
                "irreverent": rep["tone_irreverent"],
                "enthusiastic": rep["tone_enthusiastic"],
            },
            "toneTags": rep["tone_tags"],
            "pointOfView": rep["point_of_view"],
            "sentenceStyle": rep["sentence_style"],
            "pacing": rep["pacing"],
            "proofStyle": rep["proof_style"],
            "claimBoundaries": rep["claim_boundaries"],
            "preferredVocabulary": rep["preferred_vocabulary"],
            "bannedPhrases": rep["banned_phrases"],
            "extractionConfidence": rep["extraction_confidence"],
            "extractionNotes": rep["extraction_notes"],
            "createdAt": rep["created_at"],
        }


class BrandVoiceApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = BrandVoiceApproval
        fields = ["id", "workspace", "voice", "approved_by", "event", "approved_at"]

    def to_representation(self, instance):
        return {
            "id": str(instance.id),
            "workspaceId": str(instance.workspace_id),
            "voiceId": str(instance.voice_id),
            "approvedById": instance.approved_by_identifier,
            "event": instance.event,
            "approvedAt": instance.approved_at.isoformat(),
        }


class VoiceExampleSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoiceExample
        fields = [
            "id",
            "voice",
            "kind",
            "text",
            "annotation",
            "channel",
            "source_asset",
            "created_at",
        ]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        return {
            "id": rep["id"],
            "voiceId": str(rep["voice"]),
            "kind": rep["kind"],
            "text": rep["text"],
            "annotation": rep["annotation"],
            "channel": rep["channel"],
            "sourceAssetId": str(rep["source_asset"]) if rep["source_asset"] else None,
            "createdAt": rep["created_at"],
        }


class ChannelStyleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChannelStyle
        fields = [
            "id",
            "brand_profile",
            "channel",
            "tone_funny_delta",
            "tone_casual_delta",
            "tone_irreverent_delta",
            "tone_enthusiastic_delta",
            "target_length",
            "structure_norms",
            "emoji_policy",
            "hashtag_policy",
            "cta_style",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        validators = [
            UniqueTogetherValidator(
                queryset=ChannelStyle.objects.all(),
                fields=["brand_profile", "channel"],
                message="A channel style already exists for this brand profile and channel.",
            )
        ]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        return {
            "id": rep["id"],
            "brandProfileId": str(rep["brand_profile"]),
            "channel": rep["channel"],
            "toneFunnyDelta": rep["tone_funny_delta"],
            "toneCasualDelta": rep["tone_casual_delta"],
            "toneIrreverentDelta": rep["tone_irreverent_delta"],
            "toneEnthusiasticDelta": rep["tone_enthusiastic_delta"],
            "targetLength": rep["target_length"],
            "structureNorms": rep["structure_norms"],
            "emojiPolicy": rep["emoji_policy"],
            "hashtagPolicy": rep["hashtag_policy"],
            "ctaStyle": rep["cta_style"],
            "notes": rep["notes"],
            "createdAt": rep["created_at"],
            "updatedAt": rep["updated_at"],
        }


class VoiceAuditScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoiceAuditScore
        fields = [
            "id",
            "voice",
            "channel",
            "draft_excerpt",
            "overall_score",
            "dimension_scores",
            "violations",
            "ai_run",
            "created_at",
        ]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        return {
            "id": rep["id"],
            "voiceId": str(rep["voice"]),
            "channel": rep["channel"],
            "draftExcerpt": rep["draft_excerpt"],
            "overallScore": rep["overall_score"],
            "dimensionScores": rep["dimension_scores"],
            "violations": rep["violations"],
            "aiRunId": str(rep["ai_run"]) if rep["ai_run"] else None,
            "createdAt": rep["created_at"],
        }
