"""URL patterns for standards app."""

from __future__ import annotations

from django.urls import path

from .views import BisAgentQueryView, StandardsSearchView

app_name = "standards"

urlpatterns = [
    path("standards/search", StandardsSearchView.as_view(), name="standards-search"),
    path("standards/bis-query", BisAgentQueryView.as_view(), name="bis-agent-query"),
]
