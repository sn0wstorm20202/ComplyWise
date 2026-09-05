"""App configuration for the assistant boundary."""

from __future__ import annotations

from django.apps import AppConfig


class AssistantConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.assistant"
    label = "assistant"
    verbose_name = "Assistant"
