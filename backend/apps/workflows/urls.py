"""URL patterns for workflows and compliance cases."""

from __future__ import annotations

from django.urls import path

from .views import (
    AdminAddRequirementView,
    AdminBusinessListView,
    AdminBusinessOverviewView,
    AdminCaseApproveView,
    AdminCaseAssignView,
    AdminCaseListView,
    AdminCaseQueryView,
    AdminCaseRejectView,
    AdminCaseRequirementsListView,
    AdminCaseReviewPacketView,
    AdminComplianceSummaryView,
    AdminConfirmRequirementView,
    AdminMarkNotRequiredView,
    AdminReviewQueueView,
    BusinessComplianceCasesView,
    BusinessWorkflowsListView,
    ComplianceCaseDetailView,
    ComplianceCaseExternalStatusView,
    ComplianceCaseFormView,
    ComplianceCaseQueryRespondView,
    ComplianceCaseTimelineView,
    ComplianceCaseTransitionView,
)

app_name = "workflows"

urlpatterns = [
    # Workflows list and interactive step progression
    path("workflows", BusinessWorkflowsListView.as_view(), name="workflows-list"),
    path("workflows/step", BusinessWorkflowsListView.as_view(), name="workflows-step-update"),
    path("workflows/<str:workflow_id>/step", BusinessWorkflowsListView.as_view(), name="workflows-step-update-with-id"),

    # Compliance Case Operations (User Site)
    path("cases", BusinessComplianceCasesView.as_view(), name="business-cases-list"),
    path("cases/generate", BusinessComplianceCasesView.as_view(), name="business-cases-generate"),
    path("cases/<uuid:case_id>", ComplianceCaseDetailView.as_view(), name="case-detail"),
    path("cases/<str:case_id>", ComplianceCaseDetailView.as_view(), name="case-detail-str"),
    path("cases/<uuid:case_id>/transition", ComplianceCaseTransitionView.as_view(), name="case-transition"),
    path("cases/<str:case_id>/transition", ComplianceCaseTransitionView.as_view(), name="case-transition-str"),
    path("cases/<uuid:case_id>/respond-query", ComplianceCaseQueryRespondView.as_view(), name="case-respond-query"),
    path("cases/<str:case_id>/respond-query", ComplianceCaseQueryRespondView.as_view(), name="case-respond-query-str"),
    path("cases/<uuid:case_id>/timeline", ComplianceCaseTimelineView.as_view(), name="case-timeline"),
    path("cases/<str:case_id>/timeline", ComplianceCaseTimelineView.as_view(), name="case-timeline-str"),
    path("cases/<uuid:case_id>/form", ComplianceCaseFormView.as_view(), name="case-form"),
    path("cases/<str:case_id>/form", ComplianceCaseFormView.as_view(), name="case-form-str"),
    path("cases/<uuid:case_id>/external-status", ComplianceCaseExternalStatusView.as_view(), name="case-external-status"),
    path("cases/<str:case_id>/external-status", ComplianceCaseExternalStatusView.as_view(), name="case-external-status-str"),

    # Admin Operations (Admin Site / Control Room)
    path("admin/cases", AdminCaseListView.as_view(), name="admin-cases-list"),
    path("admin/cases/summary", AdminComplianceSummaryView.as_view(), name="admin-cases-summary"),
    path("admin/cases/review-queue", AdminReviewQueueView.as_view(), name="admin-review-queue"),
    path("admin/cases/<uuid:case_id>", ComplianceCaseDetailView.as_view(), name="admin-case-detail"),
    path("admin/cases/<str:case_id>", ComplianceCaseDetailView.as_view(), name="admin-case-detail-str"),
    path("admin/cases/<uuid:case_id>/packet", AdminCaseReviewPacketView.as_view(), name="admin-case-packet"),
    path("admin/cases/<str:case_id>/packet", AdminCaseReviewPacketView.as_view(), name="admin-case-packet-str"),
    path("admin/cases/<uuid:case_id>/assign", AdminCaseAssignView.as_view(), name="admin-case-assign"),
    path("admin/cases/<str:case_id>/assign", AdminCaseAssignView.as_view(), name="admin-case-assign-str"),
    path("admin/cases/<uuid:case_id>/approve", AdminCaseApproveView.as_view(), name="admin-case-approve"),
    path("admin/cases/<str:case_id>/approve", AdminCaseApproveView.as_view(), name="admin-case-approve-str"),
    path("admin/cases/<uuid:case_id>/query", AdminCaseQueryView.as_view(), name="admin-case-query"),
    path("admin/cases/<str:case_id>/query", AdminCaseQueryView.as_view(), name="admin-case-query-str"),
    path("admin/cases/<uuid:case_id>/reject", AdminCaseRejectView.as_view(), name="admin-case-reject"),
    path("admin/cases/<str:case_id>/reject", AdminCaseRejectView.as_view(), name="admin-case-reject-str"),

    # Requirement Dispositions (§11-§16, §40)
    path("admin/cases/<uuid:case_id>/requirements", AdminCaseRequirementsListView.as_view(), name="admin-case-requirements"),
    path("admin/cases/<str:case_id>/requirements", AdminCaseRequirementsListView.as_view(), name="admin-case-requirements-str"),
    path("admin/cases/<uuid:case_id>/requirements/<str:requirement_code>/confirm", AdminConfirmRequirementView.as_view(), name="admin-case-req-confirm"),
    path("admin/cases/<str:case_id>/requirements/<str:requirement_code>/confirm", AdminConfirmRequirementView.as_view(), name="admin-case-req-confirm-str"),
    path("admin/cases/<uuid:case_id>/requirements/<str:requirement_code>/not-required", AdminMarkNotRequiredView.as_view(), name="admin-case-req-not-required"),
    path("admin/cases/<str:case_id>/requirements/<str:requirement_code>/not-required", AdminMarkNotRequiredView.as_view(), name="admin-case-req-not-required-str"),
    path("admin/cases/<uuid:case_id>/requirements/add", AdminAddRequirementView.as_view(), name="admin-case-req-add"),
    path("admin/cases/<str:case_id>/requirements/add", AdminAddRequirementView.as_view(), name="admin-case-req-add-str"),

    # Admin Business 360-View
    path("admin/businesses", AdminBusinessListView.as_view(), name="admin-businesses-list"),
    path("admin/businesses/<uuid:business_id>", AdminBusinessOverviewView.as_view(), name="admin-business-overview"),
    path("admin/businesses/<str:business_id>", AdminBusinessOverviewView.as_view(), name="admin-business-overview-str"),
]


