"""URL patterns for standards app."""

from __future__ import annotations

from django.urls import path

from .views import StandardsSearchView

app_name = "standards"

urlpatterns = [
    path("standards/search", StandardsSearchView.as_view(), name="standards-search"),
]
