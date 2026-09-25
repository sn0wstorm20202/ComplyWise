"""Models for the calendar boundary.

Deadlines, renewals and reminders derived from verified knowledge or
explicit user events. Renewal cycles are never invented.

No models yet — this boundary is implemented in a later major task. Adding a
model here must not require changing another app's models.
"""

from __future__ import annotations

from django.conf import settings
from django.db import models

from common.enums import DeadlineSource, DeadlineStatus, Priority
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


class UserGoogleCalendarConnection(BaseModel):
    """User-specific Google Calendar OAuth connection and tokens.

    Authority: Multi-user compliance notification isolation.
    Each ComplyWise user connects and authorizes their own Google Calendar account.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="google_calendar_connection",
        db_index=True,
    )
    google_email = models.EmailField(blank=True, default="")
    access_token = models.TextField(blank=True, default="")
    refresh_token = models.TextField(blank=True, default="")
    token_uri = models.CharField(max_length=255, default="https://oauth2.googleapis.com/token")
    expires_at = models.DateTimeField(null=True, blank=True)
    scopes = models.TextField(blank=True, default="https://www.googleapis.com/auth/calendar.events")
    calendar_id = models.CharField(max_length=255, default="primary")
    is_active = models.BooleanField(default=True)
    last_synced_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "calendar_user_google_connection"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        status = "Active" if self.is_active else "Inactive"
        return f"UserGoogleCalendarConnection({self.user.email} -> {self.google_email or 'Unlinked'} [{status}])"

    def get_valid_access_token(self) -> str:
        """Return valid access token, automatically refreshing if expired and refresh_token exists."""
        from datetime import timedelta
        import json
        import logging
        import urllib.parse
        import urllib.request
        from django.utils import timezone

        now = timezone.now()
        if self.access_token and self.expires_at and self.expires_at > now + timedelta(seconds=60):
            return self.access_token

        client_id = (getattr(settings, "GOOGLE_CALENDAR_CLIENT_ID", "") or "").strip()
        client_secret = (getattr(settings, "GOOGLE_CALENDAR_CLIENT_SECRET", "") or "").strip()

        if self.refresh_token and client_id and client_secret:
            try:
                data = urllib.parse.urlencode({
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "refresh_token": self.refresh_token,
                    "grant_type": "refresh_token",
                }).encode("utf-8")

                req = urllib.request.Request(
                    self.token_uri or "https://oauth2.googleapis.com/token",
                    data=data,
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    res_data = json.loads(resp.read().decode("utf-8"))
                    new_token = res_data.get("access_token")
                    expires_in = res_data.get("expires_in", 3600)
                    if new_token:
                        self.access_token = new_token
                        self.expires_at = now + timedelta(seconds=int(expires_in))
                        self.save(update_fields=["access_token", "expires_at", "updated_at"])
                        return new_token
            except Exception as exc:
                logging.getLogger(__name__).error(
                    "Failed to refresh user %s Google OAuth token: %s", self.user_id, exc
                )

        return self.access_token or ""


class Deadline(BaseModel):
    """First-class statutory and administrative compliance deadline.

    Authority: Architectural Specification §18-§21.
    All user calendar views are projections of actual Deadline records.
    Admin can create, edit, cancel, change due dates, and trigger instant alerts.
    """

    case = models.ForeignKey(
        "workflows.ComplianceCase",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="calendar_deadlines",
        db_index=True,
    )
    business = models.ForeignKey(
        "businesses.Business",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="compliance_deadlines",
        db_index=True,
    )
    requirement = models.ForeignKey(
        "knowledge.RequirementDefinition",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="requirement_deadlines",
    )
    requirement_id_code = models.CharField(max_length=100, db_index=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    due_at = models.DateTimeField(db_index=True)
    source = models.CharField(
        max_length=50,
        choices=DeadlineSource.choices,
        default=DeadlineSource.ADMIN_SET,
        db_index=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
    )
    status = models.CharField(
        max_length=30,
        choices=DeadlineStatus.choices,
        default=DeadlineStatus.PENDING,
        db_index=True,
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    reminder_policy = models.JSONField(
        default=dict,
        blank=True,
        help_text="Configured alert triggers (e.g. {'days_before': [7, 3, 1]})",
    )
    google_calendar_event_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Google Calendar event ID for idempotent synchronization",
    )
    email_notification_enabled = models.BooleanField(default=True)
    calendar_notification_enabled = models.BooleanField(default=True)
    in_app_notification_enabled = models.BooleanField(default=True)
    notes = models.TextField(blank=True, default="")
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "calendar_deadline"
        ordering = ["due_at"]
        indexes = [
            models.Index(fields=["business", "due_at"]),
            models.Index(fields=["case", "status"]),
        ]

    def __str__(self) -> str:
        return f"Deadline: {self.title} due {self.due_at.strftime('%Y-%m-%d')} [{self.status}]"

