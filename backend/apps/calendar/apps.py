"""App configuration for the calendar boundary."""

from __future__ import annotations

from django.apps import AppConfig


class CalendarConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.calendar"
    label = "calendar"
    verbose_name = "Calendar"
