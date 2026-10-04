"""Workflow and Compliance Case Views.

Authority: Architectural Specification §1-§40.
Provides:
1. Business compliance cases overview and generation.
2. Individual compliance case detail and configuration-driven transitions.
3. Chronological timeline and audit trail.
4. Form submission and official portal tracking.
5. Admin workspace queue and metrics.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from django.db import transaction
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from common.enums import (
    ActorType,
    CaseStatus,
    ExternalApplicationStatusEnum,
    Priority,
    WorkflowStepType,
)
from common.permissions import IsComplianceReviewer
from common.envelope import envelope, error_response
from apps.businesses.models import Business
from apps.workflows.engine import GenericWorkflowEngine, WorkflowEngineError
from apps.workflows.models import (
    ApplicationForm,
    ComplianceCase,
    ExternalApplicationStatus,
    FormSubmission,
    WorkflowEvent,
)
from apps.workflows.serializers import (
    ApplicationFormSerializer,
    ComplianceCaseDetailSerializer,
    ComplianceCaseListSerializer,
    ExternalApplicationStatusSerializer,
    FormSubmissionSerializer,
    WorkflowEventSerializer,
)
from apps.workflows.services.case_factory import generate_compliance_cases_for_business
from domain.intelligence.workflow_derivation import derive_business_workflows

logger = logging.getLogger(__name__)


def _resolve_business(request: Request, business_id: Any) -> Business | None:
    return Business.resolve_safely(business_id, request.user)


class BusinessComplianceCasesView(APIView):
    """List and initialize compliance cases for a business."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, business_id=None) -> Response:  # noqa: ANN001
        business = _resolve_business(request, business_id)
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        cases_qs = ComplianceCase.objects.filter(business=business).select_related(
            "requirement", "current_workflow_instance__current_step"
        ).prefetch_related("document_requirements")

        # Auto-instantiate cases if none exist yet for evaluated requirements
        if not cases_qs.exists():
            assessment_id = request.query_params.get("assessment_id")
            assessment = business.assessments.filter(pk=assessment_id).first() if assessment_id else business.latest_assessment
            generate_compliance_cases_for_business(business, assessment=assessment)
            cases_qs = ComplianceCase.objects.filter(business=business).select_related(
                "requirement", "current_workflow_instance__current_step"
            ).prefetch_related("document_requirements")

        cases_data = ComplianceCaseListSerializer(cases_qs, many=True).data

        # Aggregate summaries
        status_counts = dict(cases_qs.values("status_code").annotate(count=Count("id")).values_list("status_code", "count"))
        priority_counts = dict(cases_qs.values("priority").annotate(count=Count("id")).values_list("priority", "count"))

        return Response(
            envelope({
                "business_id": str(business.id),
                "business_name": business.name,
                "total_cases": len(cases_data),
                "status_summary": {
                    "OPEN": status_counts.get(CaseStatus.OPEN, 0),
                    "IN_PROGRESS": status_counts.get(CaseStatus.IN_PROGRESS, 0),
                    "ACTION_REQUIRED": status_counts.get(CaseStatus.ACTION_REQUIRED, 0),
                    "HUMAN_REVIEW": status_counts.get(CaseStatus.HUMAN_REVIEW, 0),
                    "SUBMITTED": status_counts.get(CaseStatus.SUBMITTED, 0),
                    "EXTERNAL_PROCESSING": status_counts.get(CaseStatus.EXTERNAL_PROCESSING, 0),
                    "COMPLETED": status_counts.get(CaseStatus.COMPLETED, 0),
                    "REJECTED": status_counts.get(CaseStatus.REJECTED, 0),
                },
                "priority_summary": {
                    "HIGH": priority_counts.get(Priority.HIGH, 0),
                    "MEDIUM": priority_counts.get(Priority.MEDIUM, 0),
                    "LOW": priority_counts.get(Priority.LOW, 0),
                },
                "cases": cases_data,
            }),
            status=status.HTTP_200_OK,
        )

    def post(self, request: Request, business_id=None) -> Response:  # noqa: ANN001
        """Explicitly trigger case generation from applicable rules."""
        business = _resolve_business(request, business_id)
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        assessment_id = request.data.get("assessment_id") or request.query_params.get("assessment_id")
        assessment = business.assessments.filter(pk=assessment_id).first() if assessment_id else business.latest_assessment
        created_cases = generate_compliance_cases_for_business(business, assessment=assessment)

        cases_data = ComplianceCaseListSerializer(created_cases, many=True).data
        return Response(
            envelope({
                "message": f"Generated {len(created_cases)} compliance cases.",
                "total_cases": len(created_cases),
                "cases": cases_data,
            }),
            status=status.HTTP_201_CREATED if created_cases else status.HTTP_200_OK,
        )


class ComplianceCaseDetailView(APIView):
    """Retrieve full details of a specific compliance case."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, case_id) -> Response:  # noqa: ANN001
        case = ComplianceCase.objects.filter(pk=case_id, business__in=Business.accessible_to(request.user)).select_related(
            "business", "requirement", "current_workflow_instance__current_step", "workflow_version"
        ).prefetch_related(
            "document_requirements__submissions__reviews",
            "form_submissions",
            "external_statuses",
        ).first()

        if case is None:
            return error_response("NOT_FOUND", "Compliance case not found.", http_status=status.HTTP_404_NOT_FOUND)

        data = ComplianceCaseDetailSerializer(case).data
        return Response(envelope(data), status=status.HTTP_200_OK)


class ComplianceCaseTransitionView(APIView):
    """Execute a workflow transition for a compliance case via the generic workflow engine."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, case_id) -> Response:  # noqa: ANN001
        case = ComplianceCase.objects.filter(pk=case_id, business__in=Business.accessible_to(request.user)).first()
        if case is None:
            return error_response("NOT_FOUND", "Compliance case not found.", http_status=status.HTTP_404_NOT_FOUND)

        event_code = request.data.get("event_code")
        if not event_code:
            return error_response("BAD_REQUEST", "event_code is required.", http_status=status.HTTP_400_BAD_REQUEST)

        # Actor resolution
        actor_type = request.data.get("actor_type")
        if not actor_type:
            actor_type = ActorType.ADMIN if (request.user and request.user.is_staff) else ActorType.USER

        payload = request.data.get("payload") or {}
        notes = request.data.get("notes") or ""

        try:
            target_step, event_obj = GenericWorkflowEngine.trigger_transition(
                compliance_case=case,
                event_code=event_code,
                actor_type=actor_type,
                actor_user=request.user if (request.user and request.user.is_authenticated) else None,
                payload=payload,
                notes=notes,
            )
        except WorkflowEngineError as err:
            return error_response("INVALID_TRANSITION", str(err), http_status=status.HTTP_400_BAD_REQUEST)

        case.refresh_from_db()
        detail_data = ComplianceCaseDetailSerializer(case).data
        return Response(
            envelope({
                "message": f"Transitioned to {target_step.name}.",
                "new_step": target_step.code,
                "case": detail_data,
                "event": WorkflowEventSerializer(event_obj).data,
            }),
            status=status.HTTP_200_OK,
        )


class ComplianceCaseTimelineView(APIView):
    """Chronological audit trail of all state transitions and events for a case."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, case_id) -> Response:  # noqa: ANN001
        case = get_object_or_404(ComplianceCase, pk=case_id, business__in=Business.accessible_to(request.user))
        events = WorkflowEvent.objects.filter(compliance_case=case).select_related(
            "from_step", "to_step", "actor_user"
        ).order_by("-created_at")

        data = WorkflowEventSerializer(events, many=True).data
        return Response(envelope(data), status=status.HTTP_200_OK)


class ComplianceCaseFormView(APIView):
    """Inspect form specification and handle statutory form submissions."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, case_id) -> Response:  # noqa: ANN001
        case = get_object_or_404(ComplianceCase, pk=case_id, business__in=Business.accessible_to(request.user))
        form = ApplicationForm.objects.filter(is_active=True).first()
        submissions = FormSubmission.objects.filter(compliance_case=case).order_by("-submitted_at")

        return Response(
            envelope({
                "form": ApplicationFormSerializer(form).data if form else None,
                "submissions": FormSubmissionSerializer(submissions, many=True).data,
                "latest_submission": FormSubmissionSerializer(submissions.first()).data if submissions.exists() else None,
            }),
            status=status.HTTP_200_OK,
        )

    def post(self, request: Request, case_id) -> Response:  # noqa: ANN001
        case = get_object_or_404(ComplianceCase, pk=case_id, business__in=Business.accessible_to(request.user))
        form = ApplicationForm.objects.filter(is_active=True).first()
        if not form:
            return error_response("CONFIG_ERROR", "No active application form found.", http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        form_data = request.data.get("form_data") or request.data
        if hasattr(form_data, "dict"):
            form_data = form_data.dict()

        sub_count = case.form_submissions.count()
        submission = FormSubmission.objects.create(
            compliance_case=case,
            form=form,
            version_number=sub_count + 1,
            form_data=dict(form_data),
            status_code="SUBMITTED",
            submitted_by=request.user if (request.user and request.user.is_authenticated) else None,
        )

        # Advance workflow to EXTERNAL_PROCESSING via engine
        try:
            GenericWorkflowEngine.trigger_transition(
                compliance_case=case,
                event_code="FORM_SUBMITTED",
                actor_type=ActorType.USER,
                actor_user=request.user if (request.user and request.user.is_authenticated) else None,
                payload={"form_submission_id": str(submission.id)},
                notes=f"Statutory Form {form.name} submitted.",
            )
        except Exception as exc:
            logger.debug("FORM_SUBMITTED transition error: %s", exc)

        case.refresh_from_db()
        return Response(
            envelope({
                "message": "Statutory application form submitted successfully.",
                "submission": FormSubmissionSerializer(submission).data,
                "case": ComplianceCaseDetailSerializer(case).data,
            }),
            status=status.HTTP_201_CREATED,
        )


class ComplianceCaseExternalStatusView(APIView):
    """Track official government portal status (FoSCoS, SPCB, etc.)."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, case_id) -> Response:  # noqa: ANN001
        case = get_object_or_404(ComplianceCase, pk=case_id, business__in=Business.accessible_to(request.user))

        portal_name = request.data.get("portal_name") or case.metadata.get("authority") or "Statutory Portal"
        status_code = request.data.get("status_code") or ExternalApplicationStatusEnum.SUBMITTED
        reference_number = request.data.get("application_reference_number") or ""
        remarks = request.data.get("portal_remarks") or ""

        ext_status = ExternalApplicationStatus.objects.create(
            compliance_case=case,
            portal_name=portal_name,
            application_reference_number=reference_number,
            status_code=status_code,
            portal_remarks=remarks,
            raw_response=dict(request.data),
        )

        # Evaluate external trigger into workflow engine
        if status_code in {ExternalApplicationStatusEnum.APPROVED, "APPROVED"}:
            try:
                GenericWorkflowEngine.trigger_transition(
                    compliance_case=case,
                    event_code="PORTAL_APPROVED",
                    actor_type=ActorType.EXTERNAL,
                    payload={"portal_name": portal_name, "reference_number": reference_number},
                    notes=f"Government portal approved application: {remarks}",
                )
            except Exception as exc:
                logger.debug("PORTAL_APPROVED transition error: %s", exc)
        elif status_code in {ExternalApplicationStatusEnum.QUERY_RAISED, "QUERY_RAISED"}:
            try:
                GenericWorkflowEngine.trigger_transition(
                    compliance_case=case,
                    event_code="PORTAL_QUERY",
                    actor_type=ActorType.EXTERNAL,
                    payload={"portal_name": portal_name, "query": remarks},
                    notes=f"Government portal raised query: {remarks}",
                )
            except Exception as exc:
                logger.debug("PORTAL_QUERY transition error: %s", exc)

        case.refresh_from_db()
        return Response(
            envelope({
                "message": f"External status recorded: {status_code}.",
                "status_record": ExternalApplicationStatusSerializer(ext_status).data,
                "case": ComplianceCaseDetailSerializer(case).data,
            }),
            status=status.HTTP_201_CREATED,
        )


class AdminComplianceSummaryView(APIView):
    """Aggregate statistics for Admin / Compliance Officer operations (§6).

    Answers: What needs human attention right now?
    """

    permission_classes = [IsComplianceReviewer]

    def get(self, request: Request) -> Response:
        total_cases = ComplianceCase.objects.count()
        pending_reviews = ComplianceCase.objects.filter(
            Q(status_code=CaseStatus.HUMAN_REVIEW)
            | Q(current_workflow_instance__current_step__step_type=WorkflowStepType.HUMAN_REVIEW)
            | Q(review_tasks__status__in=["PENDING", "IN_PROGRESS"])
        ).distinct().count()
        queries_awaiting = ComplianceCase.objects.filter(status_code=CaseStatus.ACTION_REQUIRED).count()
        forms_ready = ComplianceCase.objects.filter(
            current_workflow_instance__current_step__step_type=WorkflowStepType.FORM_PREPARATION
        ).count()
        external_processing = ComplianceCase.objects.filter(status_code=CaseStatus.EXTERNAL_PROCESSING).count()
        completed_cases = ComplianceCase.objects.filter(status_code=CaseStatus.COMPLETED).count()
        rejected_cases = ComplianceCase.objects.filter(status_code=CaseStatus.REJECTED).count()

        return Response(
            envelope({
                "total_cases": total_cases,
                "pending_reviews": pending_reviews,
                "in_human_review": pending_reviews,
                "queries_awaiting": queries_awaiting,
                "queries_raised": queries_awaiting,
                "forms_ready": forms_ready,
                "external_processing": external_processing,
                "in_government_scrutiny": external_processing,
                "completed_cases": completed_cases,
                "rejected_cases": rejected_cases,
                "overdue_cases": 0,
            }),
            status=status.HTTP_200_OK,
        )


class AdminReviewQueueView(APIView):
    """Compliance Officer queue of cases requiring human verification (§7)."""

    permission_classes = [IsComplianceReviewer]

    def get(self, request: Request) -> Response:
        queue_qs = ComplianceCase.objects.filter(
            Q(status_code__in=[CaseStatus.HUMAN_REVIEW, CaseStatus.ACTION_REQUIRED, CaseStatus.OPEN])
            | Q(current_workflow_instance__current_step__step_type=WorkflowStepType.HUMAN_REVIEW)
            | Q(review_tasks__status__in=["PENDING", "IN_PROGRESS"])
        ).distinct().select_related("business", "requirement", "current_workflow_instance__current_step").order_by("-updated_at")

        # Priority filter
        priority = request.query_params.get("priority")
        if priority:
            queue_qs = queue_qs.filter(priority=priority)

        # Status filter
        status_param = request.query_params.get("status")
        if status_param:
            queue_qs = queue_qs.filter(status_code=status_param)

        data = ComplianceCaseListSerializer(queue_qs, many=True).data
        return Response(
            envelope({
                "queue_count": len(data),
                "cases": data,
            }),
            status=status.HTTP_200_OK,
        )


class AdminCaseListView(APIView):
    """Full case list for Admin Control Room with multi-dimension filters (§5)."""

    permission_classes = [IsComplianceReviewer]

    def get(self, request: Request) -> Response:
        qs = ComplianceCase.objects.all().select_related(
            "business", "requirement", "current_workflow_instance__current_step"
        ).prefetch_related("document_requirements").order_by("-updated_at")

        status_param = request.query_params.get("status")
        if status_param:
            if status_param == "PENDING_REVIEW":
                qs = qs.filter(
                    Q(status_code=CaseStatus.HUMAN_REVIEW)
                    | Q(current_workflow_instance__current_step__step_type=WorkflowStepType.HUMAN_REVIEW)
                )
            elif status_param in CaseStatus.values:
                qs = qs.filter(status_code=status_param)

        priority = request.query_params.get("priority")
        if priority:
            qs = qs.filter(priority=priority)

        search = request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(case_number__icontains=search)
                | Q(business__name__icontains=search)
                | Q(requirement_id_code__icontains=search)
                | Q(requirement__name__icontains=search)
            )

        data = ComplianceCaseListSerializer(qs, many=True).data
        return Response(envelope({"total_count": len(data), "cases": data}), status=status.HTTP_200_OK)


class AdminCaseAssignView(APIView):
    """Assign, reassign, claim, release, or escalate review task (§13)."""

    permission_classes = [IsComplianceReviewer]

    def post(self, request: Request, case_id) -> Response:
        from apps.workflows.services.review_service import ReviewService
        from django.contrib.auth import get_user_model
        User = get_user_model()

        case = get_object_or_404(ComplianceCase, pk=case_id, business__in=Business.accessible_to(request.user))
        admin_id = request.data.get("assigned_admin_id")
        priority = request.data.get("priority")
        action = request.data.get("action", "ASSIGN")

        admin_user = None
        if admin_id:
            admin_user = User.objects.filter(pk=admin_id).first()
        elif action == "CLAIM" and request.user and request.user.is_authenticated:
            admin_user = request.user

        task = ReviewService.assign_review_task(
            case=case,
            admin_user=admin_user,
            priority=priority,
            action=action,
        )

        case.refresh_from_db()
        return Response(
            envelope({
                "message": f"Review task {action.lower()}ed successfully.",
                "case": ComplianceCaseDetailSerializer(case).data,
            }),
            status=status.HTTP_200_OK,
        )


class AdminCaseApproveView(APIView):
    """Direct Compliance Officer approval action (§14)."""

    permission_classes = [IsComplianceReviewer]

    def post(self, request: Request, case_id) -> Response:
        from apps.workflows.services.review_service import ConcurrencyConflictError, ReviewService

        case = get_object_or_404(ComplianceCase, pk=case_id, business__in=Business.accessible_to(request.user))
        remarks = request.data.get("remarks") or request.data.get("comments") or "Approved by Compliance Officer."
        submission_id = request.data.get("submission_id")
        expected_version = request.data.get("expectedWorkflowVersion") or request.data.get("expected_workflow_version")

        try:
            human_review, event_obj = ReviewService.execute_human_review(
                case=case,
                reviewer_user=request.user if (request.user and request.user.is_authenticated) else None,
                decision="APPROVE",
                reason=remarks,
                submission_id=submission_id,
                expected_workflow_version=expected_version,
            )
        except ConcurrencyConflictError as err:
            return error_response(
                code="CONCURRENCY_CONFLICT",
                message=str(err),
                http_status=status.HTTP_409_CONFLICT,
                details=[{"concurrency_version": case.concurrency_version}],
            )

        case.refresh_from_db()
        return Response(
            envelope({
                "message": "Case reviewed and approved successfully.",
                "case": ComplianceCaseDetailSerializer(case).data,
                "review_id": str(human_review.id),
            }),
            status=status.HTTP_200_OK,
        )


class AdminCaseQueryView(APIView):
    """Direct Compliance Officer query action (§15)."""

    permission_classes = [IsComplianceReviewer]

    def post(self, request: Request, case_id) -> Response:
        from apps.workflows.services.review_service import ConcurrencyConflictError, ReviewService

        case = get_object_or_404(ComplianceCase, pk=case_id, business__in=Business.accessible_to(request.user))
        reason = request.data.get("reason") or request.data.get("comments") or "Correction required."
        required_action = request.data.get("required_action") or "Please upload corrected document."
        submission_id = request.data.get("submission_id")
        expected_version = request.data.get("expectedWorkflowVersion") or request.data.get("expected_workflow_version")

        try:
            human_review, event_obj = ReviewService.execute_human_review(
                case=case,
                reviewer_user=request.user if (request.user and request.user.is_authenticated) else None,
                decision="QUERY",
                reason=reason,
                required_action=required_action,
                submission_id=submission_id,
                expected_workflow_version=expected_version,
            )
        except ConcurrencyConflictError as err:
            return error_response(
                code="CONCURRENCY_CONFLICT",
                message=str(err),
                http_status=status.HTTP_409_CONFLICT,
                details=[{"concurrency_version": case.concurrency_version}],
            )

        case.refresh_from_db()
        return Response(
            envelope({
                "message": "Query successfully raised. Case transitioned to Action Required.",
                "case": ComplianceCaseDetailSerializer(case).data,
                "review_id": str(human_review.id),
            }),
            status=status.HTTP_200_OK,
        )


class AdminCaseRejectView(APIView):
    """Direct Compliance Officer reject action (§12, §45)."""

    permission_classes = [IsComplianceReviewer]

    def post(self, request: Request, case_id) -> Response:
        from apps.workflows.services.review_service import ConcurrencyConflictError, ReviewService

        case = get_object_or_404(ComplianceCase, pk=case_id, business__in=Business.accessible_to(request.user))
        reason = request.data.get("reason") or "Application does not satisfy statutory regulatory criteria."
        submission_id = request.data.get("submission_id")
        expected_version = request.data.get("expectedWorkflowVersion") or request.data.get("expected_workflow_version")

        try:
            human_review, event_obj = ReviewService.execute_human_review(
                case=case,
                reviewer_user=request.user if (request.user and request.user.is_authenticated) else None,
                decision="REJECT",
                reason=reason,
                submission_id=submission_id,
                expected_workflow_version=expected_version,
            )
        except ConcurrencyConflictError as err:
            return error_response(
                code="CONCURRENCY_CONFLICT",
                message=str(err),
                http_status=status.HTTP_409_CONFLICT,
                details=[{"concurrency_version": case.concurrency_version}],
            )

        case.refresh_from_db()
        return Response(
            envelope({
                "message": "Case rejected by Compliance Officer.",
                "case": ComplianceCaseDetailSerializer(case).data,
                "review_id": str(human_review.id),
            }),
            status=status.HTTP_200_OK,
        )


class ComplianceCaseQueryRespondView(APIView):
    """User responds to query or clarifies discrepancy (§16, §18)."""

    permission_classes = [IsAuthenticated]

    def post(self, request: Request, case_id) -> Response:
        case = get_object_or_404(ComplianceCase, pk=case_id, business__in=Business.accessible_to(request.user))
        notes = request.data.get("notes") or request.data.get("response") or "User submitted query clarification."

        try:
            GenericWorkflowEngine.trigger_transition(
                compliance_case=case,
                event_code="QUERY_RESUBMITTED",
                actor_type=ActorType.USER,
                actor_user=request.user if (request.user and request.user.is_authenticated) else None,
                payload={"response_notes": notes},
                notes=notes,
            )
        except Exception as exc:
            logger.debug("QUERY_RESUBMITTED transition error: %s", exc)

        case.refresh_from_db()
        return Response(
            envelope({
                "message": "Query response submitted. Case returned to Compliance Officer Scrutiny.",
                "case": ComplianceCaseDetailSerializer(case).data,
            }),
            status=status.HTTP_200_OK,
        )


# Workflows View supporting retrieval and interactive step updates with DB synchronization
class BusinessWorkflowsListView(APIView):
    """Retrieves business-wide clearance roadmaps and syncs step updates to the database."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, business_id=None, workflow_id=None) -> Response:  # noqa: ANN001
        business = _resolve_business(request, business_id)
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        assessment_id = request.query_params.get("assessment_id")
        payload = derive_business_workflows(business, assessment_id=assessment_id)
        return Response(envelope(payload), status=status.HTTP_200_OK)

    def post(self, request: Request, business_id=None, workflow_id=None) -> Response:  # noqa: ANN001
        return self._handle_step_update(request, business_id, workflow_id)

    def patch(self, request: Request, business_id=None, workflow_id=None) -> Response:  # noqa: ANN001
        return self._handle_step_update(request, business_id, workflow_id)

    @transaction.atomic
    def _handle_step_update(self, request: Request, business_id=None, workflow_id=None) -> Response:  # noqa: ANN001
        business = _resolve_business(request, business_id)
        if business is None:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        wf_id = workflow_id or request.data.get("workflow_id")
        step_number = request.data.get("step_number")
        status_val = request.data.get("status")
        user_reference = request.data.get("user_reference", "")
        notes = request.data.get("notes", "")

        if not wf_id or step_number is None or not status_val:
            return error_response(
                "BAD_REQUEST",
                "workflow_id, step_number, and status are required fields.",
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            step_num = int(step_number)
        except (ValueError, TypeError):
            return error_response(
                "BAD_REQUEST",
                "step_number must be an integer.",
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        assessment_id = request.data.get("assessment_id") or request.query_params.get("assessment_id")
        available = derive_business_workflows(business, assessment_id=assessment_id).get("workflows", [])
        workflow = next((w for w in available if w["id"] == wf_id), None)
        if not workflow:
            return error_response("NOT_FOUND", "Workflow not found for this assessment.", http_status=404)
        total_steps = len(workflow["steps"])
        if not 1 <= step_num <= total_steps or status_val not in {"NOT_STARTED", "IN_PROGRESS", "COMPLETED"}:
            return error_response("VALIDATION_ERROR", "Choose a valid workflow step and state.", http_status=400)
        req_code = workflow["requirement_id"]
        Business.objects.select_for_update().get(pk=business.pk)
        assessment = (business.assessments.filter(pk=assessment_id).first() if assessment_id
                      else business.assessments.order_by("-assessment_number").first())
        profile = assessment.profile_version if assessment else business.current_profile
        case = ComplianceCase.objects.select_for_update().filter(business=business,
            requirement_id_code=req_code, profile_version=profile).first()
        if not case:
            case = ComplianceCase.objects.create(business=business, assessment=assessment, case_number="CASE-" + uuid.uuid4().hex[:16].upper(),
                requirement_id_code=req_code, profile_version=profile,
                metadata={"requirement_name": workflow["title"], "authority": workflow["authority"],
                    "category": workflow["category"], "result_origin": workflow.get("result_origin", "DETERMINISTIC_KB_RESULT"),
                    "assessment_id": str(assessment.id) if assessment else None})

        wf_state = case.metadata.get("workflow_state", {})
        steps_dict = wf_state.get("steps", {})

        step_data = steps_dict.get(str(step_num), {})
        step_data["status"] = status_val
        if user_reference is not None:
            step_data["user_reference"] = user_reference
        if notes is not None:
            step_data["notes"] = notes
        if status_val == "COMPLETED":
            step_data["completed_at"] = timezone.now().isoformat()
        elif status_val == "IN_PROGRESS" and "started_at" not in step_data:
            step_data["started_at"] = timezone.now().isoformat()

        steps_dict[str(step_num)] = step_data
        wf_state["steps"] = steps_dict

        completed_steps = sum(1 for s in steps_dict.values() if s.get("status") == "COMPLETED")
        progress = int((completed_steps / max(total_steps, 1)) * 100)
        wf_state["progress_percent"] = progress

        if completed_steps >= total_steps:
            wf_state["status"] = "COMPLETED"
            case.status_code = CaseStatus.COMPLETED
            case.completed_at = timezone.now()
        elif completed_steps > 0 or status_val == "IN_PROGRESS":
            wf_state["status"] = "IN_PROGRESS"
            case.status_code = CaseStatus.IN_PROGRESS
        else:
            wf_state["status"] = "NOT_STARTED"
            case.status_code = CaseStatus.OPEN

        next_step = step_num + 1 if status_val == "COMPLETED" and step_num < total_steps else step_num
        wf_state["current_step"] = next_step

        case.metadata["workflow_state"] = wf_state
        if wf_state.get("status") != "COMPLETED":
            case.completed_at = None
        case.save(update_fields=["metadata", "status_code", "completed_at", "updated_at"])
        from apps.workflows.models import WorkflowEvent
        WorkflowEvent.objects.create(compliance_case=case, event_code="WORKFLOW_STEP_UPDATED", actor_user=request.user,
            actor_type="USER", payload={"workflow_id": wf_id, "step_number": step_num, "status": status_val})

        return Response(
            envelope({
                "message": f"Step {step_num} successfully updated to {status_val}.",
                "workflow_id": wf_id,
                "step_number": step_num,
                "status": status_val,
                "progress_percent": progress,
                "current_step": next_step,
                "case_number": case.case_number,
                "workflow_state": wf_state,
            }),
            status=status.HTTP_200_OK,
        )


class AdminBusinessOverviewView(APIView):
    """360-degree Business Overview for Admin Portal.

    Provides:
    1. Business identity and owner account details.
    2. Immutable profile version evaluations and questionnaire declarations.
    3. Business-wise compliance requirements (mandated/needed status, basis, progress).
    4. All uploaded documents & evidence with OCR extracts and AI/human review outcomes.
    """

    permission_classes = [IsComplianceReviewer]

    def get(self, request: Request, business_id) -> Response:  # noqa: ANN001
        from apps.businesses.models import Business
        from apps.documents.models import DocumentSubmission
        from domain.profile.variables import PROFILE_VARIABLES
        from apps.workflows.services.case_service import CaseService

        business = Business.objects.filter(pk=business_id).first()
        if not business:
            return error_response("NOT_FOUND", "Business not found.", http_status=status.HTTP_404_NOT_FOUND)

        current_profile = business.current_profile
        variables = current_profile.variables if current_profile else {}
        var_map = {v.key: v for v in PROFILE_VARIABLES}

        answered_vars = []
        for k, v in variables.items():
            if isinstance(v, dict):
                val = v.get("value")
                origin = v.get("origin", "USER_PROVIDED")
                recorded_at = v.get("recorded_at")
            else:
                val = v
                origin = "USER_PROVIDED"
                recorded_at = None

            if val is not None:
                def_obj = var_map.get(k)
                label = def_obj.label if def_obj else k.replace("_", " ").title()
                unit = def_obj.unit if def_obj else None
                answered_vars.append({
                    "key": k,
                    "label": label,
                    "value": val,
                    "origin": origin,
                    "unit": unit,
                    "recorded_at": recorded_at,
                })

        # Past profile versions
        history_list = []
        for p in business.profile_versions.order_by("-version"):
            history_list.append({
                "id": str(p.id),
                "version": p.version,
                "change_note": p.change_note or f"Profile snapshot v{p.version}",
                "variables_count": len(p.variables),
                "created_at": p.created_at.isoformat() if hasattr(p, "created_at") else None,
            })

        # Compliance cases business-wise
        cases_qs = business.compliance_cases.all().select_related(
            "requirement", "current_workflow_instance__current_step"
        ).prefetch_related("document_requirements__submissions")

        cases_data = []
        for c in cases_qs:
            doc_reqs = c.document_requirements.all()
            docs_req_count = len(doc_reqs)
            docs_up_count = sum(1 for d in doc_reqs if d.latest_submission)
            docs_app_count = sum(
                1
                for d in doc_reqs
                if d.latest_submission and d.latest_submission.status_code == "INTERNAL_HUMAN_APPROVED"
            )

            mandate_basis = CaseService.get_why_applicable_summary(c)

            req_name = c.requirement.name if (c.requirement and c.requirement.name) else (c.metadata.get("requirement_name") or c.requirement_id_code)
            auth_name = c.requirement.authority if (c.requirement and c.requirement.authority) else (c.metadata.get("authority") or "Regulatory Authority")
            step_name = c.current_workflow_instance.current_step.name if (c.current_workflow_instance and c.current_workflow_instance.current_step) else "Document Upload"
            step_code = c.current_workflow_instance.current_step.code if (c.current_workflow_instance and c.current_workflow_instance.current_step) else "DOCUMENT_COLLECTION"
            rev_name = c.assigned_reviewer.full_name if c.assigned_reviewer else None
            rev_email = c.assigned_reviewer.email if c.assigned_reviewer else None

            cases_data.append({
                "id": str(c.id),
                "case_number": c.case_number,
                "requirement_id_code": c.requirement_id_code,
                "requirement_name": req_name,
                "authority": auth_name,
                "status_code": c.status_code,
                "priority": c.priority,
                "is_mandated": True,
                "mandate_basis": mandate_basis,
                "current_step_name": step_name,
                "current_step_code": step_code,
                "documents_required_count": docs_req_count,
                "documents_uploaded_count": docs_up_count,
                "documents_approved_count": docs_app_count,
                "assigned_reviewer_name": rev_name,
                "assigned_reviewer_email": rev_email,
                "opened_at": c.opened_at.isoformat() if c.opened_at else None,
                "updated_at": c.updated_at.isoformat() if c.updated_at else None,
            })

        # All uploaded documents across this business
        submissions_qs = DocumentSubmission.objects.filter(
            document_requirement__case__business=business
        ).select_related(
            "document_requirement__case", "uploaded_by"
        ).prefetch_related("reviews").order_by("-created_at")

        documents_data = []
        for s in submissions_qs:
            req = s.document_requirement
            c = req.case
            latest_rev = s.latest_review

            review_info = None
            if latest_rev:
                review_info = {
                    "review_type": latest_rev.review_type,
                    "status": latest_rev.status,
                    "reviewer_comments": latest_rev.reviewer_comments,
                    "findings": latest_rev.findings,
                    "reviewed_at": latest_rev.reviewed_at.isoformat() if latest_rev.reviewed_at else None,
                }

            documents_data.append({
                "id": str(s.id),
                "document_requirement_id": str(req.id),
                "requirement_name": req.name,
                "document_type_code": req.document_type_code,
                "case_id": str(c.id),
                "case_number": c.case_number,
                "version_number": s.version_number,
                "file_name": s.file_name,
                "file_size_bytes": s.file_size_bytes,
                "mime_type": s.mime_type,
                "checksum": s.checksum,
                "status_code": s.status_code,
                "uploaded_at": s.created_at.isoformat() if hasattr(s, "created_at") else None,
                "uploaded_by_email": s.uploaded_by.email if s.uploaded_by else None,
                "latest_review": review_info,
            })

        return Response(
            envelope({
                "business": {
                    "id": str(business.id),
                    "name": business.name,
                    "owner_id": str(business.owner_id) if business.owner_id else None,
                    "owner_email": business.owner.email if business.owner else None,
                    "owner_name": business.owner.full_name if business.owner else None,
                    "is_active": business.is_active,
                    "created_at": business.created_at.isoformat() if hasattr(business, "created_at") else None,
                    "profile_version": current_profile.version if current_profile else 1,
                },
                "profile": {
                    "version_number": current_profile.version if current_profile else 1,
                    "change_note": current_profile.change_note if current_profile else "",
                    "created_at": (
                        current_profile.created_at.isoformat()
                        if (current_profile and hasattr(current_profile, "created_at"))
                        else None
                    ),
                    "answered_variables": answered_vars,
                },
                "profile_history": history_list,
                "compliance_cases": cases_data,
                "uploaded_documents": documents_data,
                "summary": {
                    "total_compliances": len(cases_data),
                    "mandated_compliances": len(cases_data),
                    "pending_reviews": sum(1 for c in cases_data if c["status_code"] == "HUMAN_REVIEW"),
                    "action_required": sum(1 for c in cases_data if c["status_code"] == "ACTION_REQUIRED"),
                    "completed": sum(1 for c in cases_data if c["status_code"] == "COMPLETED"),
                    "total_uploaded_documents": len(documents_data),
                },
            }),
            status=status.HTTP_200_OK,
        )


class AdminBusinessListView(APIView):
    """List all registered businesses across all user accounts for Admin Control Room."""

    permission_classes = [IsComplianceReviewer]

    def get(self, request: Request) -> Response:
        from apps.businesses.models import Business
        from apps.businesses.serializers import BusinessSerializer

        qs = Business.objects.all().select_related("owner").prefetch_related("profile_versions").order_by("-created_at")

        search = request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(owner__email__icontains=search)
                | Q(id__icontains=search)
            )

        from django.db.models import Count
        from apps.documents.models import DocumentSubmission
        from common.enums import CaseStatus

        biz_list = list(qs)
        cases_by_biz = dict(ComplianceCase.objects.values_list('business_id').annotate(c=Count('id')).values_list('business_id', 'c'))
        docs_by_biz = dict(DocumentSubmission.objects.values_list('document_requirement__case__business_id').annotate(c=Count('id')).values_list('document_requirement__case__business_id', 'c'))
        pending_by_biz = dict(ComplianceCase.objects.filter(status_code=CaseStatus.HUMAN_REVIEW).values_list('business_id').annotate(c=Count('id')).values_list('business_id', 'c'))

        for b in biz_list:
            b._cached_cases_count = cases_by_biz.get(b.id, 0)
            b._cached_documents_count = docs_by_biz.get(b.id, 0)
            b._cached_pending_reviews_count = pending_by_biz.get(b.id, 0)
            pvs = list(b.profile_versions.all())
            b._cached_cp = max(pvs, key=lambda v: v.version) if pvs else None

        data = BusinessSerializer(biz_list, many=True).data
        return Response(envelope({"total_count": len(data), "businesses": data}), status=status.HTTP_200_OK)


class AdminCaseRequirementsListView(APIView):
    """List all requirement dispositions and statutory catalog options for a case (§11-§16, §40)."""

    permission_classes = [IsComplianceReviewer]

    def get(self, request: Request, case_id) -> Response:
        from apps.knowledge.models import RequirementDefinition
        from apps.workflows.models import CaseRequirementDisposition, ComplianceCase
        from apps.workflows.serializers import CaseRequirementDispositionSerializer
        from apps.workflows.services.disposition_service import CaseRequirementDispositionService

        case = ComplianceCase.objects.filter(pk=case_id, business__in=Business.accessible_to(request.user)).first()
        if not case:
            return error_response("NOT_FOUND", "Compliance case not found.", http_status=status.HTTP_404_NOT_FOUND)

        # Ensure primary case requirement has disposition record
        CaseRequirementDispositionService.get_or_create_disposition(
            case=case,
            requirement_id_code=case.requirement_id_code,
            original_applicability="APPLICABLE",
        )

        dispositions = case.dispositions.all().select_related("requirement", "reviewer").order_by("-created_at")
        disposition_data = CaseRequirementDispositionSerializer(dispositions, many=True).data

        # Available catalog requirements to add
        existing_codes = set(dispositions.values_list("requirement_id_code", flat=True))
        catalog_defs = RequirementDefinition.objects.exclude(requirement_id__in=existing_codes).values(
            "requirement_id", "name", "authority", "category"
        )[:50]

        return Response(
            envelope({
                "case_id": str(case.id),
                "case_number": case.case_number,
                "dispositions": disposition_data,
                "catalog_requirements": list(catalog_defs),
            }),
            status=status.HTTP_200_OK,
        )


class AdminConfirmRequirementView(APIView):
    """Admin confirms a requirement is mandatory for this case (§11, §14, §40)."""

    permission_classes = [IsComplianceReviewer]

    def post(self, request: Request, case_id, requirement_code) -> Response:
        from apps.workflows.models import ComplianceCase
        from apps.workflows.serializers import CaseRequirementDispositionSerializer
        from apps.workflows.services.disposition_service import CaseRequirementDispositionService

        case = ComplianceCase.objects.filter(pk=case_id, business__in=Business.accessible_to(request.user)).first()
        if not case:
            return error_response("NOT_FOUND", "Compliance case not found.", http_status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get("reason", "Confirmed operational requirement by Compliance Officer.")
        disp = CaseRequirementDispositionService.confirm_required(
            case=case,
            requirement_id_code=requirement_code,
            reviewer_user=request.user if (request.user and request.user.is_authenticated) else None,
            reason=reason,
        )

        return Response(
            envelope({
                "message": f"Requirement {requirement_code} confirmed as REQUIRED.",
                "disposition": CaseRequirementDispositionSerializer(disp).data,
            }),
            status=status.HTTP_200_OK,
        )


class AdminMarkNotRequiredView(APIView):
    """Admin marks a requirement as NOT_REQUIRED with mandatory rationale (§11, §12, §14, §40).

    CRITICAL INVARIANT: Original rule applicability is preserved intact.
    """

    permission_classes = [IsComplianceReviewer]

    def post(self, request: Request, case_id, requirement_code) -> Response:
        from apps.workflows.models import ComplianceCase
        from apps.workflows.serializers import CaseRequirementDispositionSerializer
        from apps.workflows.services.disposition_service import (
            CaseRequirementDispositionService,
            DispositionValidationError,
        )

        case = ComplianceCase.objects.filter(pk=case_id, business__in=Business.accessible_to(request.user)).first()
        if not case:
            return error_response("NOT_FOUND", "Compliance case not found.", http_status=status.HTTP_404_NOT_FOUND)

        reason = (request.data.get("reason") or request.data.get("rationale") or "").strip()
        if not reason:
            return error_response(
                "VALIDATION_ERROR",
                "A clear, substantive reason is mandatory when marking a requirement as NOT_REQUIRED.",
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            disp = CaseRequirementDispositionService.mark_not_required(
                case=case,
                requirement_id_code=requirement_code,
                reviewer_user=request.user if (request.user and request.user.is_authenticated) else None,
                reason=reason,
            )
        except DispositionValidationError as exc:
            return error_response("VALIDATION_ERROR", str(exc), http_status=status.HTTP_400_BAD_REQUEST)

        return Response(
            envelope({
                "message": f"Requirement {requirement_code} marked NOT_REQUIRED.",
                "disposition": CaseRequirementDispositionSerializer(disp).data,
            }),
            status=status.HTTP_200_OK,
        )


class AdminAddRequirementView(APIView):
    """Admin manually attaches a regulatory requirement from catalog to this case (§15, §16)."""

    permission_classes = [IsComplianceReviewer]

    def post(self, request: Request, case_id) -> Response:
        from apps.workflows.models import ComplianceCase
        from apps.workflows.serializers import CaseRequirementDispositionSerializer
        from apps.workflows.services.disposition_service import CaseRequirementDispositionService

        case = ComplianceCase.objects.filter(pk=case_id, business__in=Business.accessible_to(request.user)).first()
        if not case:
            return error_response("NOT_FOUND", "Compliance case not found.", http_status=status.HTTP_404_NOT_FOUND)

        requirement_code = request.data.get("requirement_id_code") or request.data.get("requirement_code")
        if not requirement_code:
            return error_response("VALIDATION_ERROR", "requirement_id_code is required.", http_status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get("reason", "Manually attached by compliance officer.")
        evidence_refs = request.data.get("evidence_refs", [])

        disp = CaseRequirementDispositionService.add_catalog_requirement(
            case=case,
            requirement_id_code=requirement_code,
            reviewer_user=request.user if (request.user and request.user.is_authenticated) else None,
            reason=reason,
            evidence_refs=evidence_refs,
        )

        return Response(
            envelope({
                "message": f"Requirement {requirement_code} attached to case.",
                "disposition": CaseRequirementDispositionSerializer(disp).data,
            }),
            status=status.HTTP_201_CREATED,
        )


class AdminCaseReviewPacketView(APIView):
    """Unified 360-degree review packet for Compliance Officer Scrutiny Desk.

    Authority: Architectural Specification §3, §4, §5, §13-§16, §39, §40.
    Returns:
    1. Case details, concurrency_version, status, workflow steps.
    2. Business details and profile questionnaire declarations.
    3. Document requirements with ALL historical submission versions, signed view URLs,
       structured AI precheck findings, and human review history.
    4. Active & historical case queries.
    5. Statutory vs Admin requirement dispositions.
    6. Compliance deadlines with alert status.
    7. Full immutable audit trail.
    """

    permission_classes = [IsComplianceReviewer]

    def get(self, request: Request, case_id) -> Response:
        from apps.calendar.serializers import DeadlineSerializer
        from apps.documents.serializers import DocumentRequirementSerializer
        from apps.workflows.models import ComplianceCase, SecurityAuditEvent
        from apps.workflows.serializers import (
            CaseQuerySerializer,
            CaseRequirementDispositionSerializer,
            ComplianceCaseDetailSerializer,
            WorkflowEventSerializer,
        )
        from domain.profile.variables import PROFILE_VARIABLES

        case = ComplianceCase.objects.filter(pk=case_id, business__in=Business.accessible_to(request.user)).select_related(
            "business", "requirement", "assigned_reviewer", "current_workflow_instance__current_step"
        ).prefetch_related(
            "document_requirements__submissions__reviews",
            "case_queries",
            "dispositions",
            "calendar_deadlines",
            "events",
        ).first()

        if not case:
            return error_response("NOT_FOUND", "Compliance case not found.", http_status=status.HTTP_404_NOT_FOUND)

        business = case.business
        current_profile = business.current_profile if business else None
        variables = current_profile.variables if current_profile else {}
        var_map = {v.key: v for v in PROFILE_VARIABLES}

        answered_vars = []
        for k, v in variables.items():
            val = v.get("value") if isinstance(v, dict) else v
            if val is not None:
                def_obj = var_map.get(k)
                answered_vars.append({
                    "key": k,
                    "label": def_obj.label if def_obj else k.replace("_", " ").title(),
                    "value": val,
                })

        doc_reqs = DocumentRequirementSerializer(case.document_requirements.all(), many=True).data
        queries = CaseQuerySerializer(case.case_queries.all().order_by("-created_at"), many=True).data
        dispositions = CaseRequirementDispositionSerializer(case.dispositions.all().order_by("-created_at"), many=True).data
        deadlines = DeadlineSerializer(case.calendar_deadlines.all().order_by("due_at"), many=True).data
        events = WorkflowEventSerializer(case.events.all()[:100], many=True).data

        security_audits = SecurityAuditEvent.objects.filter(
            resource_type__in=["ComplianceCase", "DocumentSubmission"],
            resource_id__in=[str(case.id)] + [str(s["id"]) for d in doc_reqs for s in d.get("submissions", [])],
        ).order_by("-created_at")[:50]
        security_audit_data = [
            {
                "id": str(sa.id),
                "action": sa.action,
                "actor_type": sa.actor_type,
                "actor_email": sa.actor_user.email if sa.actor_user else None,
                "resource_type": sa.resource_type,
                "resource_id": sa.resource_id,
                "created_at": sa.created_at.isoformat(),
                "metadata": sa.metadata,
            }
            for sa in security_audits
        ]

        return Response(
            envelope({
                "case": ComplianceCaseDetailSerializer(case).data,
                "concurrency_version": case.concurrency_version,
                "business": {
                    "id": str(business.id) if business else None,
                    "name": business.name if business else "",
                    "owner_name": business.owner.full_name if (business and business.owner) else None,
                    "owner_email": business.owner.email if (business and business.owner) else None,
                    "profile_variables": answered_vars,
                },
                "document_requirements": doc_reqs,
                "queries": queries,
                "dispositions": dispositions,
                "deadlines": deadlines,
                "audit_events": events,
                "security_audits": security_audit_data,
            }),
            status=status.HTTP_200_OK,
        )


