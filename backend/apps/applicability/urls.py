"""URL routes for the applicability evaluation boundary."""

from __future__ import annotations

from django.urls import path

from . import views

app_name = "applicability"

urlpatterns = [
    path(
        "businesses/<uuid:business_id>/evaluate",
        views.BusinessEvaluateView.as_view(),
        name="evaluate",
    ),
    path(
        "businesses/<uuid:business_id>/decisions",
        views.BusinessDecisionRunsListView.as_view(),
        name="decision-runs-list",
    ),
    path(
        "businesses/<uuid:business_id>/decisions/<uuid:run_id>",
        views.DecisionRunDetailView.as_view(),
        name="decision-run-detail",
    ),
]
