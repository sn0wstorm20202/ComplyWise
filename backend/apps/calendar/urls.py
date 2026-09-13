"""URL patterns for calendar and notification app."""

from __future__ import annotations

from django.urls import path

from .views import (
    BusinessCalendarListView,
    BusinessCalendarNotificationsListView,
    NotificationMarkAllReadView,
    NotificationMarkReadView,
    NotificationPreferenceView,
    NotificationSummaryView,
    NotificationSyncView,
)

app_name = "calendar"

urlpatterns = [
    path("calendar", BusinessCalendarListView.as_view(), name="calendar-list"),
    path("calendar/sync", NotificationSyncView.as_view(), name="calendar-sync"),
    path("calendar/notifications", BusinessCalendarNotificationsListView.as_view(), name="calendar-notifications"),
    path("calendar/notifications/sync", NotificationSyncView.as_view(), name="calendar-notifications-sync"),
    path("calendar/notifications/summary", NotificationSummaryView.as_view(), name="calendar-notifications-summary"),
    path("calendar/notifications/read-all", NotificationMarkAllReadView.as_view(), name="calendar-notifications-read-all"),
    path("calendar/notifications/<uuid:notification_id>/read", NotificationMarkReadView.as_view(), name="calendar-notifications-mark-read"),
    path("calendar/preferences", NotificationPreferenceView.as_view(), name="calendar-preferences"),
]
