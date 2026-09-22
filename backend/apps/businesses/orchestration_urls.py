"""URL configuration for assessment orchestration endpoints."""

from __future__ import annotations

from django.urls import path

from .orchestration_views import (
    AssessmentOrchestrationCreateView,
    AssessmentOrchestrationStatusView,
)

app_name = "orchestration"

urlpatterns = [
    path("", AssessmentOrchestrationCreateView.as_view(), name="create"),
    path("<uuid:run_id>", AssessmentOrchestrationStatusView.as_view(), name="status"),
    path("<uuid:run_id>/", AssessmentOrchestrationStatusView.as_view(), name="status-slash"),
]
