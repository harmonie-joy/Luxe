from django.contrib import admin

from .models import ContentBrief, ContentDraft


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


@admin.register(ContentDraft)
class ContentDraftAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "brief",
        "channel",
        "status",
        "updated_at",
    )
    list_filter = ("channel", "status", "brief__workspace")
    search_fields = (
        "title",
        "content",
        "brief__content_objective",
        "brief__workspace__name",
    )
    readonly_fields = ("created_at", "updated_at")
