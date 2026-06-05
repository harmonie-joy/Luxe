from django.contrib import admin

from .models import ComplianceCheck, ComplianceIssue


class ComplianceIssueInline(admin.TabularInline):
    model = ComplianceIssue
    extra = 0
    fields = (
        "title",
        "category",
        "severity",
        "suggested_fix",
        "created_at",
    )
    readonly_fields = ("created_at",)


@admin.register(ComplianceCheck)
class ComplianceCheckAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "draft",
        "status",
        "checked_at",
        "updated_at",
    )
    list_filter = (
        "status",
        "draft__channel",
        "draft__brief__workspace",
    )
    search_fields = (
        "draft__title",
        "draft__content",
        "draft__brief__workspace__name",
        "summary",
    )
    readonly_fields = ("created_at", "updated_at")
    inlines = [ComplianceIssueInline]


@admin.register(ComplianceIssue)
class ComplianceIssueAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "title",
        "compliance_check",
        "category",
        "severity",
        "updated_at",
    )
    list_filter = (
        "category",
        "severity",
        "compliance_check__status",
        "compliance_check__draft__brief__workspace",
    )
    search_fields = (
        "title",
        "explanation",
        "suggested_fix",
        "compliance_check__draft__title",
    )
    readonly_fields = ("created_at", "updated_at")
