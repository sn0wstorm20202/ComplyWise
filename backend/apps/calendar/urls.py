"""URL patterns for calendar and notification app."""

from __future__ import annotations

from django.urls import path

from .views import (
    AdminCaseDeadlinesView,
    AdminDeadlineDetailView,
    AdminDeadlineSendAlertView,
    BusinessCalendarListView,
    BusinessCalendarNotificationsListView,
    CaseDeadlinesListView,
    GoogleCalendarAuthUrlView,
    GoogleCalendarCallbackView,
    GoogleCalendarDisconnectView,
    GoogleCalendarStatusView,
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
    path("calendar/google/auth-url", GoogleCalendarAuthUrlView.as_view(), name="calendar-google-auth-url"),
    path("calendar/google/callback", GoogleCalendarCallbackView.as_view(), name="calendar-google-callback"),
    path("calendar/google/status", GoogleCalendarStatusView.as_view(), name="calendar-google-status"),
    path("calendar/google/disconnect", GoogleCalendarDisconnectView.as_view(), name="calendar-google-disconnect"),

    # Statutory & Admin Deadlines (§18, §19, §21)
    path("cases/<uuid:case_id>/deadlines", CaseDeadlinesListView.as_view(), name="case-deadlines"),
    path("cases/<str:case_id>/deadlines", CaseDeadlinesListView.as_view(), name="case-deadlines-str"),
    path("admin/cases/<uuid:case_id>/deadlines", AdminCaseDeadlinesView.as_view(), name="admin-case-deadlines"),
    path("admin/cases/<str:case_id>/deadlines", AdminCaseDeadlinesView.as_view(), name="admin-case-deadlines-str"),
    path("admin/deadlines/<uuid:deadline_id>", AdminDeadlineDetailView.as_view(), name="admin-deadline-detail"),
    path("admin/deadlines/<str:deadline_id>", AdminDeadlineDetailView.as_view(), name="admin-deadline-detail-str"),
    path("admin/deadlines/<uuid:deadline_id>/send-alert", AdminDeadlineSendAlertView.as_view(), name="admin-deadline-send-alert"),
    path("admin/deadlines/<str:deadline_id>/send-alert", AdminDeadlineSendAlertView.as_view(), name="admin-deadline-send-alert-str"),
]

