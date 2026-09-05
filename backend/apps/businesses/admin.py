"""Admin registration for businesses.

Read-mostly on purpose: profile versions are append-only, so the admin must not
offer an edit form for them.
"""

from __future__ import annotations

from django.contrib import admin

from .models import Business, BusinessMembership, BusinessProfileVersion


@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ("name", "owner", "is_active", "created_at")
    search_fields = ("name", "owner__email")
    list_filter = ("is_active",)


@admin.register(BusinessMembership)
class BusinessMembershipAdmin(admin.ModelAdmin):
    list_display = ("business", "user", "role")
    list_filter = ("role",)


@admin.register(BusinessProfileVersion)
class BusinessProfileVersionAdmin(admin.ModelAdmin):
    list_display = ("business", "version", "created_at", "created_by")
    list_filter = ("business",)
    readonly_fields = ("business", "version", "variables", "created_by", "change_note", "created_at")

    def has_add_permission(self, request) -> bool:  # noqa: ANN001
        return False

    def has_change_permission(self, request, obj=None) -> bool:  # noqa: ANN001
        return False

    def has_delete_permission(self, request, obj=None) -> bool:  # noqa: ANN001
        return False
