"""URL configuration for assessment orchestration endpoints."""

from __future__ import annotations

from django.urls import path

from .orchestration_views import (
    AssessmentAnswersSubmitView,
    AssessmentBusinessUnderstandingView,
    AssessmentContextView,
    AssessmentOrchestrationCreateView,
    AssessmentOrchestrationStatusView,
    AssessmentQuestionGenerateView,
    AssessmentQuestionsListView,
)

app_name = "orchestration"

urlpatterns = [
    path("", AssessmentOrchestrationCreateView.as_view(), name="create"),
    path("<uuid:run_id>", AssessmentOrchestrationStatusView.as_view(), name="status"),
    path("<uuid:run_id>/", AssessmentOrchestrationStatusView.as_view(), name="status-slash"),
    path("<uuid:run_id>/understand/", AssessmentBusinessUnderstandingView.as_view(), name="understand"),
    path("<uuid:run_id>/understand", AssessmentBusinessUnderstandingView.as_view(), name="understand-noslash"),
    path("<uuid:run_id>/questions/generate/", AssessmentQuestionGenerateView.as_view(), name="questions-generate"),
    path("<uuid:run_id>/questions/generate", AssessmentQuestionGenerateView.as_view(), name="questions-generate-noslash"),
    path("<uuid:run_id>/questions/", AssessmentQuestionsListView.as_view(), name="questions-list"),
    path("<uuid:run_id>/questions", AssessmentQuestionsListView.as_view(), name="questions-list-noslash"),
    path("<uuid:run_id>/answers/", AssessmentAnswersSubmitView.as_view(), name="answers-submit"),
    path("<uuid:run_id>/answers", AssessmentAnswersSubmitView.as_view(), name="answers-submit-noslash"),
    path("<uuid:run_id>/context/", AssessmentContextView.as_view(), name="context"),
    path("<uuid:run_id>/context", AssessmentContextView.as_view(), name="context-noslash"),
]
