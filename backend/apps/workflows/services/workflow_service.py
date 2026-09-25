"""Workflow Service orchestrating generic workflow transitions.

Authority: Architectural Specification §5-§10, §38.
"""

from __future__ import annotations

import logging
from typing import Any
from django.db import transaction

from common.enums import ActorType
from apps.workflows.engine import GenericWorkflowEngine
from apps.workflows.models import ComplianceCase, WorkflowEvent, WorkflowStepDefinition

logger = logging.getLogger(__name__)


class WorkflowService:
    @classmethod
    @transaction.atomic
    def execute_transition(
        cls,
        *,
        case: ComplianceCase,
        event_code: str,
        actor_type: str = ActorType.USER,
        actor_user=None,
        payload: dict[str, Any] | None = None,
        notes: str = "",
    ) -> tuple[WorkflowStepDefinition, WorkflowEvent]:
        """Trigger transition using the configuration-driven workflow engine."""
        return GenericWorkflowEngine.trigger_transition(
            compliance_case=case,
            event_code=event_code,
            actor_type=actor_type,
            actor_user=actor_user,
            payload=payload or {},
            notes=notes,
        )
