"""App configuration for the requirements boundary."""

from __future__ import annotations

from django.apps import AppConfig


class RequirementsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.requirements"
    label = "requirements"
    verbose_name = "Requirements"
