from django.contrib import admin

from brand.models import BrandAsset, BrandProfile


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
        "status",
        "updated_at",
        "created_at",
    )
    list_filter = ("media_type", "source_type", "status", "updated_at", "created_at")
    search_fields = ("title", "brand_profile__name")
    ordering = ("-updated_at",)
