"""Review Service for Human Compliance Officer Scrutiny.

Authority: Architectural Specification §9, §10, §12, §13, §14, §15, §30, §31, §33.
Enforces:
1. Unified Command Pipeline for APPROVE, QUERY, REJECT, and ESCALATE.
2. Optimistic Concurrency Control (workflow_version / concurrency_version).
3. Creation of first-class CaseQuery instances on officer queries.
4. Auto-resolution of open queries on document approval.
5. Transactional outbox event creation for async side effects.
"""

from __future__ import annotations

import logging
from typing import Any

from django.db import transaction
from django.utils import timezone

from common.enums import (
    ActorType,
    CaseStatus,
    DocumentReviewStatus,
    Priority,
    QuerySeverity,
    QueryStatus,
    QueryType,
    ReviewType,
    WorkflowStepType,
)
from apps.documents.models import DocumentReview, DocumentSubmission
from apps.workflows.engine import GenericWorkflowEngine
from apps.workflows.models import (
    CaseQuery,
    ComplianceCase,
    HumanReview,
    OutboxEvent,
    ReviewTask,
)

logger = logging.getLogger(__name__)


class ConcurrencyConflictError(Exception):
    """Raised when expected workflow version does not match authoritative database version."""


class ReviewService:
    """Orchestrates human review operations, task assignment, scrutiny transitions, and query creation."""

    @classmethod
    def get_or_create_active_task(cls, case: ComplianceCase) -> ReviewTask:
        """Retrieve active pending/in-progress review task or create a new one."""
        task = case.review_tasks.filter(status__in=["PENDING", "IN_PROGRESS"]).first()
        if not task:
            task = ReviewTask.objects.create(
                case=case,
                review_type="DOCUMENT_REVIEW",
                status="PENDING",
                priority=case.priority,
                assigned_admin=case.assigned_reviewer,
            )
        return task

    @classmethod
    @transaction.atomic
    def assign_review_task(
        cls,
        *,
        case: ComplianceCase,
        admin_user=None,
        priority: str | None = None,
        action: str = "ASSIGN",  # ASSIGN, REASSIGN, CLAIM, RELEASE, ESCALATE
        expected_workflow_version: int | None = None,
    ) -> ReviewTask:
        """Assign, reassign, claim, release, or escalate a review task."""
        # 1. Concurrency Check
        if expected_workflow_version is not None and case.concurrency_version != expected_workflow_version:
            raise ConcurrencyConflictError(
                f"Case version conflict: current version is {case.concurrency_version}, but action was submitted for version {expected_workflow_version}."
            )

        task = cls.get_or_create_active_task(case)

        if action == "CLAIM" and admin_user:
            task.assigned_admin = admin_user
            case.assigned_reviewer = admin_user
        elif action == "RELEASE":
            task.assigned_admin = None
            case.assigned_reviewer = None
        elif action == "ESCALATE":
            task.status = "ESCALATED"
            task.priority = Priority.HIGH
            case.priority = Priority.HIGH
        elif admin_user is not None:
            task.assigned_admin = admin_user
            case.assigned_reviewer = admin_user

        if priority and priority in Priority.values:
            task.priority = priority
            case.priority = priority

        case.concurrency_version += 1
        task.save(update_fields=["assigned_admin", "status", "priority", "updated_at"])
        case.save(update_fields=["assigned_reviewer", "priority", "concurrency_version", "updated_at"])

        OutboxEvent.objects.create(
            event_type="REVIEW_TASK_UPDATED",
            payload={
                "case_id": str(case.id),
                "task_id": str(task.id),
                "action": action,
                "assigned_admin_id": str(task.assigned_admin_id) if task.assigned_admin_id else None,
            },
        )

        logger.info(
            "Review task %s updated for case %s: admin=%s, priority=%s, v=%d",
            task.id,
            case.case_number,
            task.assigned_admin,
            task.priority,
            case.concurrency_version,
        )
        return task

    @classmethod
    @transaction.atomic
    def execute_human_review(
        cls,
        *,
        case: ComplianceCase,
        reviewer_user=None,
        decision: str,  # "APPROVE", "QUERY", "REJECT", "ESCALATE"
        reason: str = "",
        required_action: str = "",
        submission_id: str | None = None,
        query_title: str | None = None,
        due_at=None,
        expected_workflow_version: int | None = None,
    ) -> tuple[HumanReview, Any]:
        """Unified command pipeline for officer scrutiny decisions (§30).

        Actions:
        - APPROVE -> REVIEW_APPROVED transition -> FORM_PREPARATION
        - QUERY -> QUERY_RAISED transition -> ACTION_REQUIRED (creates CaseQuery)
        - REJECT -> REVIEW_REJECTED transition -> REJECTION
        - ESCALATE -> Escalates priority and notifies Senior Officer
        """
        # 1. Optimistic Concurrency Control Check (§31)
        if expected_workflow_version is not None and case.concurrency_version != expected_workflow_version:
            raise ConcurrencyConflictError(
                f"Stale review action rejected: Case {case.case_number} is on version {case.concurrency_version}, but client submitted version {expected_workflow_version}."
            )

        now = timezone.now()
        task = cls.get_or_create_active_task(case)

        # 2. Record HumanReview entry
        human_review = HumanReview.objects.create(
            task=task,
            case=case,
            reviewer=reviewer_user,
            decision=decision,
            reason=reason,
            required_action=required_action,
            reviewed_at=now,
        )

        # 3. Mark active ReviewTask
        if decision in ("APPROVE", "REJECT"):
            task.status = "COMPLETED"
            task.completed_at = now
        elif decision == "QUERY":
            task.status = "AWAITING_USER_INPUT"
        elif decision == "ESCALATE":
            task.status = "ESCALATED"
            task.priority = Priority.HIGH

        task.save(update_fields=["status", "priority", "completed_at", "updated_at"])

        # 4. Resolve DocumentSubmission if targeted
        sub = None
        if submission_id:
            sub = DocumentSubmission.objects.filter(pk=submission_id).select_related("document_requirement").first()
        elif case.document_requirements.exists():
            # If no submission specified, find the latest submission on first active doc requirement
            first_req = case.document_requirements.first()
            if first_req:
                sub = first_req.latest_submission

        if sub:
            review_status = DocumentReviewStatus.INTERNAL_HUMAN_APPROVED
            if decision == "QUERY":
                review_status = DocumentReviewStatus.INTERNAL_HUMAN_QUERY
            elif decision == "REJECT":
                review_status = DocumentReviewStatus.INTERNAL_HUMAN_REJECTED

            sub.status_code = review_status
            sub.save(update_fields=["status_code"])

            DocumentReview.objects.create(
                submission=sub,
                review_type=ReviewType.HUMAN_REVIEW,
                reviewer_user=reviewer_user,
                status=review_status,
                findings=[{
                    "finding_code": f"HUMAN_{decision}",
                    "severity": "CRITICAL" if decision == "REJECT" else ("WARNING" if decision == "QUERY" else "INFO"),
                    "field": sub.document_requirement.name,
                    "expected_value": "Statutory compliance satisfaction",
                    "observed_value": reason or f"Reviewed as {decision}",
                    "source": "Compliance Officer Scrutiny",
                    "confidence": 1.0,
                }],
                reviewer_comments=reason,
                reviewed_at=now,
            )

        # 5. Handle First-Class CaseQuery Creation on QUERY (§9)
        if decision == "QUERY":
            q_title = query_title or f"Correction Required: {sub.document_requirement.name if sub else case.requirement_id_code}"
            q_req_action = required_action or "Please upload a corrected document satisfying the compliance criteria."
            CaseQuery.objects.create(
                case=case,
                document_requirement=sub.document_requirement if sub else None,
                document_submission=sub if sub else None,
                raised_by=reviewer_user,
                query_type=QueryType.DOCUMENT_CORRECTION,
                title=q_title,
                message=reason or "Discrepancy identified during compliance review.",
                required_action=q_req_action,
                severity=QuerySeverity.HIGH,
                status=QueryStatus.OPEN,
                due_at=due_at,
            )

        # 6. Handle Auto-Resolution of Open Queries on APPROVE (§10)
        elif decision == "APPROVE":
            doc_req = sub.document_requirement if sub else None
            query_filter = {"case": case, "status__in": [QueryStatus.OPEN, QueryStatus.RESPONDED, QueryStatus.UNDER_REVIEW]}
            if doc_req:
                query_filter["document_requirement"] = doc_req

            open_queries = CaseQuery.objects.filter(**query_filter)
            for q in open_queries:
                q.status = QueryStatus.RESOLVED
                q.resolved_at = now
                q.resolved_by = reviewer_user
                q.save(update_fields=["status", "resolved_at", "resolved_by", "updated_at"])

        # 7. Advance Workflow Engine State Machine
        event_code = "REVIEW_APPROVED"
        payload = {"reason": reason, "submission_id": str(sub.id) if sub else None}

        if decision == "QUERY":
            event_code = "QUERY_RAISED"
            payload["required_action"] = required_action
        elif decision == "REJECT":
            event_code = "REVIEW_REJECTED"
        elif decision == "ESCALATE":
            event_code = "REVIEW_ESCALATED"

        target_step, event_obj = GenericWorkflowEngine.trigger_transition(
            compliance_case=case,
            event_code=event_code,
            actor_type=ActorType.ADMIN,
            actor_user=reviewer_user,
            payload=payload,
            notes=reason or f"Compliance Officer Scrutiny: {decision}",
        )

        # 8. Increment Concurrency Version & Save
        case.concurrency_version += 1
        case.save(update_fields=["concurrency_version", "updated_at"])

        # 9. Emit Outbox Event for Realtime / Async Notifications
        OutboxEvent.objects.create(
            event_type="CASE_REVIEW_DECIDED",
            payload={
                "case_id": str(case.id),
                "decision": decision,
                "case_number": case.case_number,
                "reason": reason,
                "reviewer_id": str(reviewer_user.id) if reviewer_user else None,
                "new_version": case.concurrency_version,
            },
        )

        logger.info(
            "Human review %s on case %s (v=%d) -> %s",
            decision,
            case.case_number,
            case.concurrency_version,
            target_step.name,
        )
        return human_review, event_obj
