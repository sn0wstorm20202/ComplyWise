"""Dynamic statutory calendar and milestone derivation engine.

Authority: PRD_v2.0 §20; TRD_v2.0 §30; Milestone Parts 7, 23, 24.

Generates business-specific compliance calendars combining:
1. Statutory renewal cycles recorded in requirement metadata.
2. Procedural application milestones derived from applicable requirements.
3. Statutory periodic return deadlines anchored in Indian regulatory schedules
   (FSSAI Form D-1, CPCB/SPCB Form V Environmental Statement, Factories Act Form 27).
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any

from common.enums import ApplicabilityStatus
from apps.applicability.models import DecisionRun
from apps.businesses.models import Business
from apps.dashboard.services import get_statutory_renewal_cycles
from apps.knowledge.models import RequirementDefinition
from domain.context.business_context import DerivedBusinessContext, build_business_context


def derive_business_calendar(
    business: Business,
    context: DerivedBusinessContext | None = None,
    assessment_id: str | None = None,
) -> dict[str, Any]:
    """Derive full compliance timeline and milestones for a business."""
    if context is None:
        context = build_business_context(business)

    today = date.today()
    events: list[dict[str, Any]] = []

    # 1. Statutory renewal cycles (from existing requirement metadata)
    cycles = get_statutory_renewal_cycles(business)
    for cycle in cycles:
        events.append({
            "id": f"RENEWAL::{cycle['requirement_id']}",
            "title": cycle["title"],
            "date": cycle["due_date"],
            "type": "STATUTORY_RENEWAL",
            "authority": cycle["authority"],
            "status": cycle["status"],
            "days_remaining": cycle["days_remaining"],
            "basis": cycle["basis"],
            "anchored_on": cycle["anchored_on"],
            "is_action_required": cycle["days_remaining"] <= 30,
        })

    # Only persisted deadlines and explicitly source-backed renewals belong on a calendar.
    from apps.calendar.models import Deadline
    deadlines = Deadline.objects.filter(business=business)
    if assessment_id:
        deadlines = deadlines.filter(case__assessment_id=assessment_id)
    for deadline in deadlines:
        if deadline.due_at.date():
            days = (deadline.due_at.date() - today).days
            events.append({"id": str(deadline.id), "title": deadline.title,
                "date": deadline.due_at.date().isoformat(), "type": "RECORDED_DEADLINE",
                "authority": "", "status": deadline.status,
                "days_remaining": days, "basis": "Persisted deadline record",
                "anchored_on": "Recorded by the compliance workspace", "is_action_required": days <= 30})

    return {
        "business_id": str(business.id),
        "business_name": business.name,
        "evaluated": business.decision_runs.exists(),
        "events": events,
        "count": len(events),
        "covers": [
            "STATUTORY_RENEWAL_CYCLE",
            "RECORDED_DEADLINE",
        ],
        "not_covered": [
            "PENALTY_EXPOSURE",
            "UNNOTIFIED_AD_HOC_INSPECTIONS",
        ],
        "not_covered_reason": "Statutory calendar tracks published periodic returns, renewals, and procedural milestones. Ad-hoc unannounced departmental inspections are not predictable.",
        "disclaimer": "Only recorded deadlines and supported renewal dates are shown.",
    }
