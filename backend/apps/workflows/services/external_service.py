"""External Service for official government statutory portal tracking.

Authority: Architectural Specification §27, §28, §33, §45.
Enforces:
1. Strict separation of Internal Review vs Government Scrutiny.
2. PORTAL_APPROVED -> COMPLETED.
3. PORTAL_QUERY -> ACTION_REQUIRED (loops back to user fix).
4. PORTAL_REJECTED -> REJECTED (visibly distinct from completion!).
"""

from __future__ import annotations

import logging
from typing import Any
from django.db import transaction

from common.enums import ActorType, ExternalApplicationStatusEnum
from apps.workflows.engine import GenericWorkflowEngine
from apps.workflows.models import ComplianceCase, ExternalApplicationStatus

logger = logging.getLogger(__name__)


class ExternalService:
    @classmethod
    @transaction.atomic
    def record_portal_status(
        cls,
        *,
        case: ComplianceCase,
        portal_name: str,
        status_code: str,
        reference_number: str = "",
        remarks: str = "",
        raw_response: dict[str, Any] | None = None,
    ) -> ExternalApplicationStatus:
        """Record official status from government statutory portal and trigger transitions."""
        ext_status = ExternalApplicationStatus.objects.create(
            compliance_case=case,
            portal_name=portal_name or case.metadata.get("authority") or "Statutory Authority Portal",
            application_reference_number=reference_number,
            status_code=status_code,
            portal_remarks=remarks,
            raw_response=raw_response or {},
        )

        # Trigger corresponding workflow transition edge
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

        elif status_code in {ExternalApplicationStatusEnum.QUERY_RAISED, "QUERY_RAISED", ExternalApplicationStatusEnum.RESUBMISSION_REQUIRED}:
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

        elif status_code in {ExternalApplicationStatusEnum.REJECTED, "REJECTED"}:
            try:
                GenericWorkflowEngine.trigger_transition(
                    compliance_case=case,
                    event_code="PORTAL_REJECTED",
                    actor_type=ActorType.EXTERNAL,
                    payload={"portal_name": portal_name, "reason": remarks},
                    notes=f"Government portal rejected application: {remarks}",
                )
            except Exception as exc:
                logger.debug("PORTAL_REJECTED transition error: %s", exc)

        return ext_status
