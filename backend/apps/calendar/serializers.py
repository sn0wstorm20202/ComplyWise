"""Serializers for calendar and deadline entities.

Authority: Architectural Specification §18-§21.
"""

from __future__ import annotations

from rest_framework import serializers

from apps.calendar.models import Deadline, DeadlineNotificationDelivery, NotificationPreference


class DeadlineSerializer(serializers.ModelSerializer):
    case_number = serializers.ReadOnlyField(source="case.case_number")
    business_name = serializers.ReadOnlyField(source="business.name")
    created_by_name = serializers.SerializerMethodField()
    created_by_email = serializers.ReadOnlyField(source="created_by.email")
    is_overdue = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Deadline
        fields = [
            "id",
            "case",
            "case_number",
            "business",
            "business_name",
            "requirement",
            "requirement_id_code",
            "title",
            "description",
            "due_at",
            "source",
            "status",
            "priority",
            "reminder_policy",
            "google_calendar_event_id",
            "email_notification_enabled",
            "calendar_notification_enabled",
            "in_app_notification_enabled",
            "notes",
            "metadata",
            "created_by",
            "created_by_name",
            "created_by_email",
            "is_overdue",
            "days_remaining",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "case_number", "business_name", "created_by", "created_at", "updated_at"]

    def get_created_by_name(self, obj: Deadline) -> str | None:
        if obj.created_by:
            return obj.created_by.full_name or obj.created_by.email
        return None

    def get_is_overdue(self, obj: Deadline) -> bool:
        from django.utils import timezone
        return obj.status == "PENDING" and obj.due_at < timezone.now()

    def get_days_remaining(self, obj: Deadline) -> int:
        from django.utils import timezone
        delta = obj.due_at.date() - timezone.now().date()
        return delta.days
