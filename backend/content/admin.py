from django.contrib import admin

from .models import (
    Approval,
    ContentBrief,
    ContentDraft,
    ContentItem,
    ExecutionCheckpoint,
    Project,
    ScheduledContent,
)


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


@admin.register(ScheduledContent)
class ScheduledContentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "workspace",
        "draft",
        "channel",
        "status",
        "scheduled_for",
        "published_at",
    )
    list_filter = (
        "workspace",
        "channel",
        "status",
        "scheduled_for",
    )
    search_fields = (
        "draft__title",
        "draft__content",
        "workspace__name",
    )
    readonly_fields = ("created_at", "updated_at")


@admin.register(Approval)
class ApprovalAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "draft",
        "user",
        "role",
        "created_at",
    )
    list_filter = ("role", "draft__brief__workspace")
    search_fields = (
        "draft__title",
        "user__username",
        "user__email",
    )
    readonly_fields = ("created_at",)


@admin.register(Project, ContentItem, ExecutionCheckpoint)
class ExecutionStateAdmin(admin.ModelAdmin):
    list_display = ("id",)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
