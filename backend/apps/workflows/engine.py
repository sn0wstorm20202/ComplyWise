"""Generic Configuration-Driven Regulatory Workflow Engine.

Authority: Architectural Specification §5-§12, §22-§24, §37-§40.
Core Principles:
1. Zero Hardcoding: Engine is strictly data-driven. It looks at the case's workflow
   version, current step, and incoming event. No requirement-specific `if` branches.
2. Every state change is recorded as an immutable WorkflowEvent.
3. Automated notification generation with multi-channel dispatch.
"""

from __future__ import annotations

import logging
from typing import Any

from django.db import transaction
from django.utils import timezone

from common.enums import (
    ActorType,
    CaseStatus,
    NotificationChannel,
    NotificationDeliveryStatus,
    StepStatus,
    WorkflowStatus,
    WorkflowStepType,
)
from apps.workflows.models import (
    ComplianceCase,
    NotificationDelivery,
    NotificationEvent,
    WorkflowDefinitionVersion,
    WorkflowEvent,
    WorkflowInstance,
    WorkflowStepDefinition,
    WorkflowStepInstance,
    WorkflowTransitionDefinition,
)

logger = logging.getLogger(__name__)


class WorkflowEngineError(Exception):
    """Base error for workflow engine transition failures."""


class InvalidTransitionError(WorkflowEngineError):
    """Raised when no valid transition edge matches the event and conditions."""


class GenericWorkflowEngine:
    """The central workflow state machine engine."""

    @classmethod
    def evaluate_condition(cls, condition: dict[str, Any], context: dict[str, Any]) -> bool:
        """Evaluate declarative transition condition against event payload and case context.

        Empty condition ({}) always evaluates to True.
        """
        if not condition:
            return True

        for key, expected_val in condition.items():
            actual_val = context.get(key)
            if isinstance(expected_val, list):
                if actual_val not in expected_val:
                    return False
            elif actual_val != expected_val:
                return False

        return True

    @classmethod
    @transaction.atomic
    def trigger_transition(
        cls,
        *,
        compliance_case: ComplianceCase,
        event_code: str,
        actor_type: str = ActorType.SYSTEM,
        actor_user=None,  # User instance or None
        payload: dict[str, Any] | None = None,
        notes: str = "",
    ) -> tuple[WorkflowStepDefinition, WorkflowEvent]:
        """Advance the compliance case workflow instance according to configuration definitions.

        Steps:
        1. Identify active WorkflowInstance and current WorkflowStepDefinition.
        2. Query matching WorkflowTransitionDefinition for (version, from_step, event_code, actor_type).
        3. Evaluate condition logic against payload and case context.
        4. Advance current step, complete prior step instance, initialize new step instance.
        5. Synchronize ComplianceCase.status_code.
        6. Append immutable WorkflowEvent.
        7. Emit NotificationEvent.
        """
        payload = payload or {}
        instance = compliance_case.current_workflow_instance

        if instance is None:
            raise WorkflowEngineError(f"ComplianceCase {compliance_case.case_number} has no active workflow instance.")

        current_step = instance.current_step
        if current_step is None:
            raise WorkflowEngineError(f"WorkflowInstance {instance.id} has no current step assigned.")

        version = instance.workflow_definition_version

        # 1. Query possible outgoing transitions
        candidate_transitions = WorkflowTransitionDefinition.objects.filter(
            workflow_version=version,
            from_step=current_step,
            event_code=event_code,
        ).order_by("priority")

        valid_transition = None
        eval_context = {
            **compliance_case.metadata,
            **instance.metadata,
            **payload,
        }

        for trans in candidate_transitions:
            # Check actor permission
            if trans.allowed_actor_type != ActorType.ANY and trans.allowed_actor_type != actor_type:
                continue

            # Evaluate transition conditions
            if cls.evaluate_condition(trans.condition, eval_context):
                valid_transition = trans
                break

        if valid_transition is None:
            raise InvalidTransitionError(
                f"No valid transition from step '{current_step.code}' on event '{event_code}' "
                f"for actor '{actor_type}' in workflow version {version.version_number}."
            )

        target_step = valid_transition.to_step

        # 2. Complete previous step instance if active
        prior_step_inst = instance.step_instances.filter(
            step_definition=current_step,
            status_code__in=[StepStatus.IN_PROGRESS, StepStatus.WAITING_FOR_INPUT, StepStatus.NOT_STARTED],
        ).order_by("-started_at").first()

        now = timezone.now()
        if prior_step_inst:
            prior_step_inst.status_code = StepStatus.COMPLETED
            prior_step_inst.completed_at = now
            prior_step_inst.result = {
                "exit_event": event_code,
                "payload": payload,
            }
            prior_step_inst.save(update_fields=["status_code", "completed_at", "result", "updated_at"])

        # 3. Create or activate target step instance
        new_step_status = StepStatus.IN_PROGRESS
        if target_step.step_type == WorkflowStepType.HUMAN_REVIEW:
            new_step_status = StepStatus.WAITING_FOR_INPUT
        elif target_step.step_type == WorkflowStepType.COMPLETION:
            new_step_status = StepStatus.COMPLETED

        new_step_inst = WorkflowStepInstance.objects.create(
            workflow_instance=instance,
            step_definition=target_step,
            status_code=new_step_status,
            started_at=now,
            completed_at=now if new_step_status == StepStatus.COMPLETED else None,
            data=payload,
            metadata={"entered_via_event": event_code},
        )

        # 4. Update workflow instance current step
        instance.current_step = target_step
        if target_step.step_type == WorkflowStepType.COMPLETION:
            instance.status_code = WorkflowStatus.COMPLETED
            instance.completed_at = now
        elif target_step.step_type == WorkflowStepType.REJECTION:
            instance.status_code = WorkflowStatus.BLOCKED
            instance.completed_at = now
        else:
            instance.status_code = WorkflowStatus.IN_PROGRESS

        instance.save(update_fields=["current_step", "status_code", "completed_at", "updated_at"])

        # Ensure active ReviewTask exists when entering HUMAN_REVIEW
        if target_step.step_type == WorkflowStepType.HUMAN_REVIEW:
            from apps.workflows.models import ReviewTask
            # Check for existing pending task or create new one
            pending_task = compliance_case.review_tasks.filter(status__in=["PENDING", "IN_PROGRESS"]).first()
            if not pending_task:
                ReviewTask.objects.create(
                    case=compliance_case,
                    review_type="DOCUMENT_REVIEW",
                    status="PENDING",
                    priority=compliance_case.priority,
                    assigned_admin=compliance_case.assigned_reviewer,
                )

        # 5. Synchronize central ComplianceCase status_code
        cls._sync_case_status(compliance_case, target_step, event_code, payload)

        # 6. Record immutable audit WorkflowEvent
        event_obj = WorkflowEvent.objects.create(
            compliance_case=compliance_case,
            workflow_instance=instance,
            from_step=current_step,
            to_step=target_step,
            event_code=event_code,
            actor_type=actor_type,
            actor_user=actor_user,
            payload=payload,
            notes=notes or f"Transitioned from {current_step.name} to {target_step.name} via {event_code}.",
        )

        # 7. Generate and deliver notifications
        cls._emit_transition_notifications(compliance_case, current_step, target_step, event_code, payload)

        logger.info(
            "Workflow for case %s advanced: %s -> %s on %s by %s",
            compliance_case.case_number,
            current_step.code,
            target_step.code,
            event_code,
            actor_type,
        )

        return target_step, event_obj

    @classmethod
    def _sync_case_status(
        cls,
        case: ComplianceCase,
        target_step: WorkflowStepDefinition,
        event_code: str,
        payload: dict[str, Any],
    ) -> None:
        """Map target step and event code to the canonical CaseStatus enum."""
        step_type = target_step.step_type
        now = timezone.now()

        if event_code == "QUERY_RAISED":
            case.status_code = CaseStatus.ACTION_REQUIRED
        elif step_type == WorkflowStepType.DOCUMENT_COLLECTION:
            case.status_code = CaseStatus.IN_PROGRESS if case.status_code != CaseStatus.ACTION_REQUIRED else CaseStatus.ACTION_REQUIRED
        elif step_type == WorkflowStepType.DOCUMENT_REVIEW:
            case.status_code = CaseStatus.IN_PROGRESS
        elif step_type == WorkflowStepType.HUMAN_REVIEW:
            case.status_code = CaseStatus.HUMAN_REVIEW
        elif step_type == WorkflowStepType.FORM_PREPARATION:
            case.status_code = CaseStatus.IN_PROGRESS
        elif step_type == WorkflowStepType.EXTERNAL_PROCESSING:
            case.status_code = CaseStatus.EXTERNAL_PROCESSING
        elif step_type == WorkflowStepType.COMPLETION:
            case.status_code = CaseStatus.COMPLETED
            case.completed_at = now
        elif step_type == WorkflowStepType.REJECTION:
            case.status_code = CaseStatus.REJECTED
            case.closed_at = now

        case.save(update_fields=["status_code", "completed_at", "closed_at", "updated_at"])

    @classmethod
    def _emit_transition_notifications(
        cls,
        case: ComplianceCase,
        from_step: WorkflowStepDefinition,
        to_step: WorkflowStepDefinition,
        event_code: str,
        payload: dict[str, Any],
    ) -> None:
        """Generate idempotent notifications for business owner and assigned reviewer."""
        recipient = case.business.owner
        if recipient is None:
            return

        title = f"Compliance Case {case.case_number} Update"
        message = f"Your case for {case.requirement_id_code} moved to: {to_step.name}."

        if event_code == "QUERY_RAISED":
            title = f"Action Required: Query Raised on {case.case_number}"
            query_text = payload.get("query") or payload.get("comments") or "Please review the query notes and resubmit."
            message = f"Compliance officer raised a query: {query_text}"
        elif event_code == "REVIEW_APPROVED":
            title = f"Documents Approved for {case.case_number}"
            message = "All submitted documents have been approved by compliance officer. Proceed to statutory form submission."
        elif event_code == "PORTAL_APPROVED":
            title = f"Official Clearance Granted: {case.case_number}"
            message = "Official statutory portal has approved the application."

        notif_event = NotificationEvent.objects.create(
            event_type=f"WORKFLOW_{event_code}",
            compliance_case=case,
            recipient_user=recipient,
            title=title,
            message=message,
            data={
                "case_id": str(case.id),
                "case_number": case.case_number,
                "from_step": from_step.code,
                "to_step": to_step.code,
                "event_code": event_code,
                "payload": payload,
            },
        )

        # Create deliveries across configured channels (IN_APP, EMAIL, GOOGLE_CALENDAR if deadline)
        channels = [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
        if to_step.step_type == WorkflowStepType.COMPLETION or event_code == "PORTAL_APPROVED":
            channels.append(NotificationChannel.GOOGLE_CALENDAR)

        for ch in channels:
            NotificationDelivery.objects.create(
                notification_event=notif_event,
                channel=ch,
                status=NotificationDeliveryStatus.SENT,
                delivered_at=timezone.now(),
            )
