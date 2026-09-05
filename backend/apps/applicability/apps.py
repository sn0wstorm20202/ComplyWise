"""App configuration for the applicability boundary."""

from __future__ import annotations

from django.apps import AppConfig


class ApplicabilityConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.applicability"
    label = "applicability"
    verbose_name = "Applicability"
