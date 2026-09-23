"""URL configuration for assessment orchestration endpoints."""

from __future__ import annotations

from django.urls import path

from .orchestration_views import (
    AssessmentAnswersSubmitView,
    AssessmentBusinessUnderstandingView,
    AssessmentComplianceSynthesisView,
    AssessmentComplianceView,
    AssessmentContextView,
    AssessmentEvidenceView,
    AssessmentOrchestrationCreateView,
    AssessmentOrchestrationStatusView,
    AssessmentQuestionGenerateView,
    AssessmentQuestionsListView,
    AssessmentRegulatoryDiscoveryView,
    AssessmentSchemesView,
    AssessmentStandardsView,
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
    path("<uuid:run_id>/questions/submit/", AssessmentAnswersSubmitView.as_view(), name="questions-submit"),
    path("<uuid:run_id>/questions/submit", AssessmentAnswersSubmitView.as_view(), name="questions-submit-noslash"),
    path("<uuid:run_id>/context/", AssessmentContextView.as_view(), name="context"),
    path("<uuid:run_id>/context", AssessmentContextView.as_view(), name="context-noslash"),
    path("<uuid:run_id>/regulatory-discovery/", AssessmentRegulatoryDiscoveryView.as_view(), name="regulatory-discovery"),
    path("<uuid:run_id>/regulatory-discovery", AssessmentRegulatoryDiscoveryView.as_view(), name="regulatory-discovery-noslash"),
    path("<uuid:run_id>/compliance-synthesis/", AssessmentComplianceSynthesisView.as_view(), name="compliance-synthesis"),
    path("<uuid:run_id>/compliance-synthesis", AssessmentComplianceSynthesisView.as_view(), name="compliance-synthesis-noslash"),
    path("<uuid:run_id>/compliance/", AssessmentComplianceView.as_view(), name="compliance"),
    path("<uuid:run_id>/compliance", AssessmentComplianceView.as_view(), name="compliance-noslash"),
    path("<uuid:run_id>/evidence/", AssessmentEvidenceView.as_view(), name="evidence"),
    path("<uuid:run_id>/evidence", AssessmentEvidenceView.as_view(), name="evidence-noslash"),
    path("<uuid:run_id>/schemes/", AssessmentSchemesView.as_view(), name="schemes"),
    path("<uuid:run_id>/schemes", AssessmentSchemesView.as_view(), name="schemes-noslash"),
    path("<uuid:run_id>/standards/", AssessmentStandardsView.as_view(), name="standards"),
    path("<uuid:run_id>/standards", AssessmentStandardsView.as_view(), name="standards-noslash"),
]
