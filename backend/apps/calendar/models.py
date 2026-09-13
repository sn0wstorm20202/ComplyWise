"""Models for the calendar boundary.

Deadlines, renewals and reminders derived from verified knowledge or
explicit user events. Renewal cycles are never invented.

No models yet — this boundary is implemented in a later major task. Adding a
model here must not require changing another app's models.
"""

from __future__ import annotations

from django.conf import settings
from django.db import models

from common.models import BaseModel


class NotificationChannel(models.TextChoices):
    GOOGLE_CALENDAR = "GOOGLE_CALENDAR", "Google Calendar"
    EMAIL = "EMAIL", "Email"
    IN_APP = "IN_APP", "In-App"


class NotificationDeliveryStatus(models.TextChoices):
    DELIVERED = "DELIVERED", "Delivered"
    SIMULATED = "SIMULATED", "Simulated"
    SKIPPED_DUPLICATE = "SKIPPED_DUPLICATE", "Skipped (Duplicate)"
    FAILED = "FAILED", "Failed"
    PENDING = "PENDING", "Pending"
    RETRYING = "RETRYING", "Retrying"


class NotificationPriority(models.TextChoices):
    LOW = "LOW", "Low"
    MEDIUM = "MEDIUM", "Medium"
    HIGH = "HIGH", "High"
    CRITICAL = "CRITICAL", "Critical"


class NotificationEventType(models.TextChoices):
    UPCOMING = "UPCOMING", "Upcoming"
    OVERDUE = "OVERDUE", "Overdue"
    ESCALATION = "ESCALATION", "Escalation"


class DeadlineNotificationDelivery(BaseModel):
    """Immutable audit record of compliance deadline notification dispatches.

    Enforces idempotency across repeated scheduler executions.
    Scoped by (user, business, requirement_id, deadline_date, offset_days, channel, event_type).
    Does NOT modify or replace the authoritative compliance deadline.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="deadline_notifications",
        db_index=True,
    )
    business = models.ForeignKey(
        "businesses.Business",
        on_delete=models.CASCADE,
        related_name="deadline_notifications",
        db_index=True,
    )
    requirement_id = models.CharField(max_length=255, db_index=True)
    deadline_date = models.DateField(db_index=True)
    offset_days = models.PositiveIntegerField(
        help_text="Days remaining (upcoming) or days overdue (overdue) at time of dispatch"
    )
    channel = models.CharField(
        max_length=32,
        choices=NotificationChannel.choices,
        db_index=True,
    )
    event_type = models.CharField(
        max_length=32,
        choices=NotificationEventType.choices,
        default=NotificationEventType.UPCOMING,
        db_index=True,
    )
    priority = models.CharField(
        max_length=16,
        choices=NotificationPriority.choices,
        default=NotificationPriority.MEDIUM,
        db_index=True,
    )
    status = models.CharField(
        max_length=32,
        choices=NotificationDeliveryStatus.choices,
        default=NotificationDeliveryStatus.DELIVERED,
    )
    language = models.CharField(
        max_length=10,
        default="en",
        help_text="Language code: en, hi, bn",
    )
    subject_or_title = models.CharField(max_length=500, blank=True, default="")
    recipient = models.CharField(max_length=255, blank=True, default="")
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    attempt_count = models.PositiveIntegerField(default=1)
    failure_reason = models.TextField(blank=True, default="")
    provider = models.CharField(max_length=64, blank=True, default="")
    details = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "calendar_deadline_notification"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "business", "requirement_id", "deadline_date", "offset_days", "channel", "event_type"],
                name="uniq_calendar_deadline_notification_v2",
            )
        ]
        indexes = [
            models.Index(fields=["business", "deadline_date"]),
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["business", "is_read"]),
            models.Index(fields=["event_type", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.channel} {self.event_type} notification for {self.requirement_id} (offset {self.offset_days}) to {self.user.email} [{self.status}]"


class NotificationPreference(BaseModel):
    """User preferences for compliance notification channels and localization."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_preferences",
        db_index=True,
    )
    business = models.ForeignKey(
        "businesses.Business",
        on_delete=models.CASCADE,
        related_name="notification_preferences",
        null=True,
        blank=True,
        db_index=True,
    )
    email_enabled = models.BooleanField(default=True)
    calendar_enabled = models.BooleanField(default=True)
    in_app_enabled = models.BooleanField(default=True)
    language = models.CharField(
        max_length=10,
        default="en",
        help_text="Language code: en, hi, bn",
    )

    class Meta:
        db_table = "calendar_notification_preference"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "business"],
                name="uniq_user_business_notification_preference",
            )
        ]

    def __str__(self) -> str:
        biz_name = self.business.name if self.business else "All Businesses"
        return f"NotificationPreference({self.user.email} @ {biz_name})"

