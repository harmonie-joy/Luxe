from django.contrib import admin
from tenancy.models import Membership, Workspace


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
	list_display = ("name", "created_by", "created_at", "updated_at")
	search_fields = ("name", "created_by__username", "created_by__email")
	list_filter = ("created_at",)
	ordering = ("name",)


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
	list_display = ("workspace", "user", "role", "created_at")
	search_fields = (
		"workspace__name",
		"user__username",
		"user__email",
	)
	list_filter = ("role", "created_at")
	autocomplete_fields = ("workspace", "user")
