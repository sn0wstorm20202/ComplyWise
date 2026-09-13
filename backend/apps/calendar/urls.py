"""URL patterns for calendar app."""

from __future__ import annotations

from django.urls import path

from .views import BusinessCalendarListView

app_name = "calendar"

urlpatterns = [
    path("calendar", BusinessCalendarListView.as_view(), name="calendar-list"),
]
