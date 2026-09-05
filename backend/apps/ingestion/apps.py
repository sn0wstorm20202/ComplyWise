"""App configuration for the ingestion boundary."""

from __future__ import annotations

from django.apps import AppConfig


class IngestionConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.ingestion"
    label = "ingestion"
    verbose_name = "Ingestion"
