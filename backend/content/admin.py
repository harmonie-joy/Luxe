from django.contrib import admin

from .models import ContentBrief


@admin.register(ContentBrief)
class ContentBriefAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "workspace",
        "brand_profile",
        "campaign_goal",
        "updated_at",
    )
    list_filter = ("campaign_goal", "workspace")
    search_fields = (
        "workspace__name",
        "brand_profile__name",
        "content_objective",
        "audience",
    )
    readonly_fields = ("created_at", "updated_at")
