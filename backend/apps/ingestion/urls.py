"""URL routes for the ingestion/discovery boundary."""

from __future__ import annotations

from django.urls import path

from .views import (
    AnalysisOrchestrateView,
    AnalysisStatusView,
    DiscoveryCandidatesView,
    DiscoveryRunDetailView,
    DiscoveryRunsListView,
    DiscoveryRunView,
    DiscoveryStatusView,
)

app_name = "ingestion"

urlpatterns = [
    path("discovery/status", DiscoveryStatusView.as_view(), name="discovery-status"),
    path("discovery/run", DiscoveryRunView.as_view(), name="discovery-run"),
    path("discovery/runs", DiscoveryRunsListView.as_view(), name="discovery-runs-list"),
    path("discovery/runs/<uuid:run_id>", DiscoveryRunDetailView.as_view(), name="discovery-run-detail"),
    path("discovery/runs/<uuid:run_id>/candidates", DiscoveryCandidatesView.as_view(), name="discovery-candidates"),
    path("discovery/candidates", DiscoveryCandidatesView.as_view(), name="discovery-candidates-latest"),
    path("analysis/orchestrate", AnalysisOrchestrateView.as_view(), name="analysis-orchestrate"),
    path("analysis/status", AnalysisStatusView.as_view(), name="analysis-status"),
]
