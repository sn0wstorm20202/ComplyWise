"""URL patterns for workflows app."""

from __future__ import annotations

from django.urls import path

from .views import BusinessWorkflowsListView

app_name = "workflows"

urlpatterns = [
    path("workflows", BusinessWorkflowsListView.as_view(), name="workflows-list"),
]
