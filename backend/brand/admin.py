from django.contrib import admin

from brand.models import BrandAsset, BrandProfile


class BrandAssetInline(admin.TabularInline):
    model = BrandAsset
    extra = 0
    fields = ("title", "source_type", "format", "word_count", "status", "created_at")
    readonly_fields = ("created_at",)


@admin.register(BrandProfile)
class BrandProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "workspace", "updated_at", "created_at")
    list_filter = ("workspace", "updated_at")
    search_fields = ("name", "workspace__name")
    ordering = ("-updated_at",)
    inlines = [BrandAssetInline]


@admin.register(BrandAsset)
class BrandAssetAdmin(admin.ModelAdmin):
    list_display = ("title", "brand_profile", "source_type", "status", "created_at")
    list_filter = ("source_type", "status", "created_at")
    search_fields = ("title", "brand_profile__name")
    ordering = ("-created_at",)
