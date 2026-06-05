from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "workspace",
        "user",
        "action",
        "target_type",
        "target_id",
        "created_at",
    )
    list_filter = ("action", "target_type", "workspace", "created_at")
    search_fields = (
        "description",
        "user__username",
        "workspace__name",
        "target_id",
    )
    readonly_fields = ("created_at",)
