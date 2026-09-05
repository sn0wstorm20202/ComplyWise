"""App configuration for the standards boundary."""

from __future__ import annotations

from django.apps import AppConfig


class StandardsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.standards"
    label = "standards"
    verbose_name = "Standards"
