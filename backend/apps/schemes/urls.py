"""URL patterns for schemes app."""

from __future__ import annotations

from django.urls import path

from .views import (
    BusinessSchemesListView,
    SchemeCatalogListView,
    SchemeContextEvaluateView,
    SchemePipelineRunView,
    SchemePipelineStatusView,
    SchemeRollbackView,
    SchemeUpdatePublishView,
    SchemeVersionHistoryView,
)

app_name = "schemes"

urlpatterns = [
    # Business context-driven matching endpoint
    path("schemes", BusinessSchemesListView.as_view(), name="schemes-list"),
    # Catalog and pipeline endpoints
    path("catalog", SchemeCatalogListView.as_view(), name="schemes-catalog"),
    path("evaluate", SchemeContextEvaluateView.as_view(), name="schemes-evaluate"),
    path("pipeline/run", SchemePipelineRunView.as_view(), name="schemes-pipeline-run"),
    path("pipeline/status", SchemePipelineStatusView.as_view(), name="schemes-pipeline-status"),
    path("<str:scheme_code>/versions", SchemeVersionHistoryView.as_view(), name="schemes-version-history"),
    path("<str:scheme_code>/rollback", SchemeRollbackView.as_view(), name="schemes-rollback"),
    path("<str:scheme_code>/update", SchemeUpdatePublishView.as_view(), name="schemes-update"),
]
