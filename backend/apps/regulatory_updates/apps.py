"""App configuration for the regulatory_updates boundary."""

from __future__ import annotations

from django.apps import AppConfig


class RegulatoryUpdatesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.regulatory_updates"
    label = "regulatory_updates"
    verbose_name = "Regulatory updates"
