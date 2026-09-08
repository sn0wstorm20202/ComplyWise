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

    # 2. Procedural execution milestones based on applicable requirements
    latest_run = None
    if assessment_id:
        assessment = business.assessments.filter(pk=assessment_id).first()
        if assessment and assessment.decision_run:
            latest_run = assessment.decision_run
        elif assessment:
            latest_run = DecisionRun.objects.filter(assessment=assessment).prefetch_related("results").first()

    if latest_run is None:
        latest_run = (
            DecisionRun.objects.filter(business=business)
            .prefetch_related("results")
            .order_by("-created_at")
            .first()
        )

    if latest_run is not None:
        actionable_results = [
            r
            for r in latest_run.results.all()
            if r.status in {ApplicabilityStatus.APPLICABLE, ApplicabilityStatus.NEEDS_INFORMATION}
        ]

        req_defs = {
            rd.requirement_id: rd
            for rd in RequirementDefinition.objects.filter(
                requirement_id__in=[r.requirement_id for r in actionable_results]
            )
        }

        # Milestone offsets from today (in days)
        milestone_offsets = {
            "TRADE": 7,        # Fast turnaround
            "ENVIRONMENT": 14,  # Early planning required
            "LABOR": 21,        # Building plan approval
            "FOOD": 30,         # FSMS preparation
            "STANDARD": 45,     # Laboratory testing
            "DEFAULT": 20,
        }

        domains_seen: set[str] = set()

        for result in actionable_results:
            req_def = req_defs.get(result.requirement_id)
            if req_def is None:
                continue

            dom = (req_def.domain or "").upper()
            auth = (req_def.authority or "").upper()
            cat = (req_def.category or "").upper()

            if "FOOD" in dom or "FSSAI" in auth:
                key = "FOOD"
            elif "ENVIRONMENT" in dom or "PCB" in auth:
                key = "ENVIRONMENT"
            elif "LABOR" in dom or "DISH" in auth:
                key = "LABOR"
            elif "TRADE" in dom or "DGFT" in auth:
                key = "TRADE"
            elif "STANDARD" in cat or "BIS" in auth:
                key = "STANDARD"
            else:
                key = "DEFAULT"

            domains_seen.add(key)
            offset_days = milestone_offsets.get(key, 20)
            target_date = today + timedelta(days=offset_days)

            events.append({
                "id": f"MILESTONE::{result.requirement_id}",
                "title": f"Complete Filing: {result.requirement_name}",
                "date": target_date.isoformat(),
                "type": "APPLICATION_MILESTONE",
                "authority": req_def.authority,
                "status": "UPCOMING" if offset_days > 7 else "DUE_SOON",
                "days_remaining": offset_days,
                "basis": f"Procedural onboarding timeline to obtain operational clearance from {req_def.authority}.",
                "anchored_on": "Target clearance schedule for new business operations.",
                "is_action_required": True,
            })

        # 3. Statutory periodic return filings anchored in Indian regulatory rules
        current_year = today.year

        if "FOOD" in domains_seen:
            # FSSAI Form D-1 due May 31
            d1_date = date(current_year if today <= date(current_year, 5, 31) else current_year + 1, 5, 31)
            days_d1 = (d1_date - today).days
            events.append({
                "id": "STATUTORY_RETURN::FSSAI-D1",
                "title": "FSSAI Annual Return (Form D-1)",
                "date": d1_date.isoformat(),
                "type": "STATUTORY_RETURN",
                "authority": "FSSAI",
                "status": "SCHEDULED",
                "days_remaining": days_d1,
                "basis": "Mandatory annual filing under Food Safety and Standards (Licensing and Registration) Regulations.",
                "anchored_on": "Fixed statutory filing date (May 31 annually).",
                "is_action_required": days_d1 <= 30,
            })

        if "ENVIRONMENT" in domains_seen:
            # SPCB Form V Environmental Statement due September 30
            form_v_date = date(current_year if today <= date(current_year, 9, 30) else current_year + 1, 9, 30)
            days_v = (form_v_date - today).days
            events.append({
                "id": "STATUTORY_RETURN::SPCB-FORM-V",
                "title": "Environmental Audit Statement (Form V)",
                "date": form_v_date.isoformat(),
                "type": "STATUTORY_RETURN",
                "authority": "State Pollution Control Board",
                "status": "SCHEDULED",
                "days_remaining": days_v,
                "basis": "Rule 14 of Environment (Protection) Rules 1986 submitted to the SPCB for the preceding financial year.",
                "anchored_on": "Fixed statutory filing date (September 30 annually).",
                "is_action_required": days_v <= 30,
            })

        if "LABOR" in domains_seen:
            # Factories Act Form 27 Annual Return due February 1
            form_27_date = date(current_year if today <= date(current_year, 2, 1) else current_year + 1, 2, 1)
            days_27 = (form_27_date - today).days
            events.append({
                "id": "STATUTORY_RETURN::FACTORIES-FORM-27",
                "title": "Annual Factory Return (Form 27)",
                "date": form_27_date.isoformat(),
                "type": "STATUTORY_RETURN",
                "authority": "Directorate of Industrial Safety & Health",
                "status": "SCHEDULED",
                "days_remaining": days_27,
                "basis": "Section 110 of Factories Act 1948 recording annual employment, accidents, and safety inspections.",
                "anchored_on": "Fixed statutory filing date (February 1 annually).",
                "is_action_required": days_27 <= 30,
            })

    # Sort events chronologically by date
    events.sort(key=lambda e: e["date"])

    return {
        "business_id": str(business.id),
        "business_name": business.name,
        "evaluated": latest_run is not None,
        "events": events,
        "count": len(events),
        "covers": [
            "STATUTORY_RENEWAL_CYCLE",
            "APPLICATION_MILESTONE",
            "STATUTORY_PERIODIC_RETURN",
        ],
        "not_covered": [
            "PENALTY_EXPOSURE",
            "UNNOTIFIED_AD_HOC_INSPECTIONS",
        ],
        "not_covered_reason": "Statutory calendar tracks published periodic returns, renewals, and procedural milestones. Ad-hoc unannounced departmental inspections are not predictable.",
        "disclaimer": "Compliance dates combine statutory renewal periods, procedural application targets, and annual statutory return deadlines.",
    }
