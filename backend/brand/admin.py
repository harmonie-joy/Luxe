from django.contrib import admin

from brand.models import (
    AudienceSegment,
    BrandAsset,
    BrandProfile,
    BrandVoice,
    ChannelStyle,
    VoiceAuditScore,
    VoiceExample,
)


class BrandAssetInline(admin.TabularInline):
    model = BrandAsset
    extra = 0
    fields = (
        "title",
        "media_type",
        "source_type",
        "format",
        "word_count",
        "status",
        "created_at",
        "updated_at",
    )
    readonly_fields = ("created_at", "updated_at")


@admin.register(BrandProfile)
class BrandProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "workspace", "updated_at", "created_at")
    list_filter = ("workspace", "updated_at")
    search_fields = ("name", "workspace__name")
    ordering = ("-updated_at",)
    inlines = [BrandAssetInline]


@admin.register(BrandAsset)
class BrandAssetAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "brand_profile",
        "media_type",
        "source_type",
        "channel",
        "performance_signal",
        "status",
        "updated_at",
        "created_at",
    )
    list_filter = (
        "media_type",
        "source_type",
        "channel",
        "performance_signal",
        "status",
        "updated_at",
        "created_at",
    )
    search_fields = ("title", "brand_profile__name")
    ordering = ("-updated_at",)


@admin.register(AudienceSegment)
class AudienceSegmentAdmin(admin.ModelAdmin):
    list_display = ("name", "brand_profile", "is_primary", "maturity_level", "updated_at")
    list_filter = ("is_primary", "maturity_level")
    search_fields = ("name", "brand_profile__name")


@admin.register(BrandVoice)
class BrandVoiceAdmin(admin.ModelAdmin):
    list_display = (
        "brand_profile",
        "version",
        "is_active",
        "extraction_confidence",
        "created_at",
    )
    list_filter = ("is_active",)
    search_fields = ("brand_profile__name",)
    readonly_fields = ("created_at",)


@admin.register(VoiceExample)
class VoiceExampleAdmin(admin.ModelAdmin):
    list_display = ("voice", "kind", "channel", "created_at")
    list_filter = ("kind", "channel")
    search_fields = ("text", "voice__brand_profile__name")


@admin.register(ChannelStyle)
class ChannelStyleAdmin(admin.ModelAdmin):
    list_display = ("brand_profile", "channel", "target_length", "updated_at")
    list_filter = ("channel",)
    search_fields = ("brand_profile__name",)


@admin.register(VoiceAuditScore)
class VoiceAuditScoreAdmin(admin.ModelAdmin):
    list_display = ("voice", "channel", "overall_score", "created_at")
    list_filter = ("channel",)
    search_fields = ("voice__brand_profile__name",)
    readonly_fields = ("created_at",)
