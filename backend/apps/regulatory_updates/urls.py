"""URL patterns for regulatory updates app."""

from __future__ import annotations

from django.urls import path

from .views import RegulatoryUpdatesListView

app_name = "regulatory_updates"

urlpatterns = [
    path("regulatory-updates", RegulatoryUpdatesListView.as_view(), name="updates-list"),
]
