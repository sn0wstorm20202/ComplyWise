"""URL patterns for assistant app."""

from __future__ import annotations

from django.urls import path

from .views import AssistantChatView

app_name = "assistant"

urlpatterns = [
    path("assistant/chat", AssistantChatView.as_view(), name="assistant-chat"),
]
