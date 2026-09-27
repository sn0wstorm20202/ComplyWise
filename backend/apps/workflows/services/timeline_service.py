"""Timeline Service deriving chronological audit events.

Authority: Architectural Specification §20, §21, §38.
Enforces:
1. Derivation of case timeline entirely from immutable WorkflowEvent records.
2. Clear actor badges: USER, ADMIN, SYSTEM, EXTERNAL.
"""

from __future__ import annotations

from typing import Any
from apps.workflows.models import ComplianceCase, WorkflowEvent


class TimelineService:
    @classmethod
    def get_timeline(cls, case: ComplianceCase) -> list[dict[str, Any]]:
        """Return formatted chronological audit events for a compliance case."""
        events = WorkflowEvent.objects.filter(compliance_case=case).select_related(
            "from_step", "to_step", "actor_user"
        ).order_by("-created_at")

        result = []
        for ev in events:
            result.append({
                "id": str(ev.id),
                "event_code": ev.event_code,
                "from_step_code": ev.from_step.code if ev.from_step else None,
                "from_step_name": ev.from_step.name if ev.from_step else None,
                "to_step_code": ev.to_step.code if ev.to_step else None,
                "to_step_name": ev.to_step.name if ev.to_step else None,
                "actor_type": ev.actor_type,
                "actor_email": ev.actor_user.email if ev.actor_user else None,
                "actor_name": getattr(ev.actor_user, "full_name", None) if ev.actor_user else None,
                "payload": ev.payload,
                "notes": ev.notes,
                "created_at": ev.created_at.isoformat(),
            })
        return result
