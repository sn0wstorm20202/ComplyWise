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


class NotificationDeliveryStatus(models.TextChoices):
    DELIVERED = "DELIVERED", "Delivered"
    SIMULATED = "SIMULATED", "Simulated"
    SKIPPED_DUPLICATE = "SKIPPED_DUPLICATE", "Skipped (Duplicate)"
    FAILED = "FAILED", "Failed"


class DeadlineNotificationDelivery(BaseModel):
    """Immutable audit record of compliance deadline notification dispatches.

    Enforces idempotency across repeated scheduler executions.
    Scoped by (user, business, requirement_id, deadline_date, offset_days, channel).
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
        help_text="Days remaining at time of dispatch (7 for T-7, 1 for T-1)"
    )
    channel = models.CharField(
        max_length=32,
        choices=NotificationChannel.choices,
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
    details = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "calendar_deadline_notification"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "business", "requirement_id", "deadline_date", "offset_days", "channel"],
                name="uniq_calendar_deadline_notification",
            )
        ]
        indexes = [
            models.Index(fields=["business", "deadline_date"]),
            models.Index(fields=["user", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.channel} notification for {self.requirement_id} (T-{self.offset_days}) to {self.user.email} [{self.status}]"

