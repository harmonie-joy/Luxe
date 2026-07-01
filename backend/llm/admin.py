from django.contrib import admin

from .models import AIRun


@admin.register(AIRun)
class AIRunAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "workspace",
        "task_type",
        "provider",
        "model",
        "status",
        "started_at",
        "completed_at",
    )
    list_filter = ("task_type", "provider", "status", "started_at")
    search_fields = ("workspace__name", "error")
    readonly_fields = ("started_at", "completed_at")
