"""Dashboard read-only aggregation service.

Authority: PRD_v2.0 §14, TRD_v2.0 §30, §31.

Composes data from business profile, latest DecisionRun, RequirementDefinitions,
and statutory deadlines into an actionable, unified dashboard summary.
Never invents legal certification or replaces backend rule evaluation.
"""

from __future__ import annotations

import datetime
from typing import Any

from django.conf import settings
from django.utils import timezone

from apps.applicability.models import DecisionResult, DecisionRun
from apps.businesses.models import Business
from apps.ingestion.services import assess_knowledge_coverage
from apps.knowledge.models import RequirementDefinition
from common.enums import ApplicabilityStatus


def get_dashboard_summary(business: Business, assessment_id: str | None = None) -> dict[str, Any]:
    """Compile comprehensive dashboard intelligence for the business, optionally scoped to an assessment."""
    assessment = None
    if assessment_id:
        assessment = business.assessments.filter(pk=assessment_id).first()
    if assessment is None:
        assessment = business.assessments.order_by("-assessment_number").first()

    profile = assessment.profile_version if assessment and assessment.profile_version else business.current_profile

    latest_run = None
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

    if latest_run is None:
        return {
            "business_id": str(business.id),
            "business_name": business.name,
            "assessment_id": str(assessment.id) if assessment else None,
            "assessment_number": assessment.assessment_number if assessment else 1,
            "assessment_title": assessment.title if assessment else None,
            "assessment_status": assessment.status if assessment else None,
            "has_evaluation": False,
            "profile_version": profile.version if profile else None,
            # Not 0: nothing has been evaluated, so readiness is not yet calculated.
            "compliance_readiness": None,
            # Nothing has been evaluated, so every metric is unknown rather than
            # zero: a 0 would assert "no requirements apply to you".
            "metrics": {
                "applicable_count": None,
                "action_required_count": None,
                "due_soon_count": None,
                "benefits_count": None,
                "needs_information_count": None,
                "conflict_review_count": None,
                "unverified_count": None,
                "not_applicable_count": None,
                "total_evaluated": 0,
            },
            "priority_actions": [],
            "upcoming_deadlines": [],
            "category_breakdown": {},
            "jurisdiction_breakdown": {},
            "recent_updates": [],
            "recent_updates_available": False,
            # Coverage is meaningful before any run exists.
            "coverage": assess_knowledge_coverage(business),
        }

    results = list(latest_run.results.all())
    total_evaluated = len(results)

    # Coverage honesty: how well the loaded knowledge base covers this business's
    # jurisdiction/activity at all (distinct from per-requirement outcomes).
    coverage = assess_knowledge_coverage(business)

    status_counts = {
        ApplicabilityStatus.APPLICABLE: 0,
        ApplicabilityStatus.NOT_APPLICABLE: 0,
        ApplicabilityStatus.NEEDS_INFORMATION: 0,
        ApplicabilityStatus.CONFLICT_REVIEW: 0,
        ApplicabilityStatus.UNVERIFIED: 0,
    }

    category_counts: dict[str, int] = {}
    jurisdiction_counts: dict[str, int] = {}

    req_ids = [r.requirement_id for r in results]
    req_defs = {
        rd.requirement_id: rd
        for rd in RequirementDefinition.objects.filter(requirement_id__in=req_ids)
    }

    priority_actions = []

    for r in results:
        status_counts[r.status] = status_counts.get(r.status, 0) + 1
        req_def = req_defs.get(r.requirement_id)
        cat = req_def.category if req_def else "GENERAL"
        jur = req_def.jurisdiction if req_def else "CENTRAL"

        category_counts[cat] = category_counts.get(cat, 0) + 1
        jurisdiction_counts[jur] = jurisdiction_counts.get(jur, 0) + 1

        # Surface actionable items: CONFLICT_REVIEW, NEEDS_INFORMATION, APPLICABLE
        if r.status in {
            ApplicabilityStatus.CONFLICT_REVIEW,
            ApplicabilityStatus.NEEDS_INFORMATION,
            ApplicabilityStatus.APPLICABLE,
        }:
            action_type = (
                "Review Statutory Conflict"
                if r.status == ApplicabilityStatus.CONFLICT_REVIEW
                else "Provide Missing Information"
                if r.status == ApplicabilityStatus.NEEDS_INFORMATION
                else "Application / Filing Required"
            )
            priority_actions.append(
                {
                    "requirement_id": r.requirement_id,
                    "requirement_name": r.requirement_name,
                    "authority": req_def.authority if req_def else "Regulatory Authority",
                    "status": r.status,
                    "category": cat,
                    "action_type": action_type,
                    "evidence_count": len(r.evidence_refs or []),
                }
            )

    # Sort priority actions: Conflict Review first, then Needs Information, then Applicable
    status_order = {
        ApplicabilityStatus.CONFLICT_REVIEW: 0,
        ApplicabilityStatus.NEEDS_INFORMATION: 1,
        ApplicabilityStatus.APPLICABLE: 2,
    }
    priority_actions.sort(key=lambda a: status_order.get(a["status"], 3))

    # Calculate honest compliance readiness score (percentage of determined rules)
    # Determined = APPLICABLE + NOT_APPLICABLE
    # Total = total evaluated
    determined_count = (
        status_counts.get(ApplicabilityStatus.APPLICABLE, 0)
        + status_counts.get(ApplicabilityStatus.NOT_APPLICABLE, 0)
    )
    readiness_score = round(determined_count / total_evaluated * 100) if total_evaluated > 0 else 0

    action_required_count = (
        status_counts.get(ApplicabilityStatus.APPLICABLE, 0)
        + status_counts.get(ApplicabilityStatus.NEEDS_INFORMATION, 0)
        + status_counts.get(ApplicabilityStatus.CONFLICT_REVIEW, 0)
    )

    upcoming_deadlines = _statutory_deadlines(results, req_defs)
    # "Due soon" means inside the configured window, so the counter can never
    # quietly include a renewal cycle that is years away.
    due_soon_count = sum(
        1
        for deadline in upcoming_deadlines
        if deadline["days_remaining"] <= settings.UPCOMING_DEADLINE_WINDOW_DAYS
    )

    from domain.intelligence.document_derivation import derive_business_documents
    from domain.intelligence.workflow_derivation import derive_business_workflows
    from domain.intelligence.scheme_discovery import discover_business_schemes
    from domain.intelligence.standards_discovery import discover_business_standards

    aid = str(assessment.id) if assessment else None
    doc_data = derive_business_documents(business, assessment_id=aid)
    wf_data = derive_business_workflows(business, assessment_id=aid)
    scheme_data = discover_business_schemes(business, assessment_id=aid)
    std_data = discover_business_standards(business, assessment_id=aid)

    return {
        "business_id": str(business.id),
        "business_name": business.name,
        "assessment_id": aid,
        "assessment_number": assessment.assessment_number if assessment else 1,
        "assessment_title": assessment.title if assessment else None,
        "assessment_status": assessment.status if assessment else None,
        "has_evaluation": True,
        "latest_run_id": str(latest_run.id),
        "evaluation_date": str(latest_run.evaluation_date),
        "profile_version": profile.version if profile else None,
        "compliance_readiness": readiness_score,
        # What the number actually measures. It is the share of requirements the
        # engine could decide either way — not a claim that the business is 100%
        # compliant, which no evaluation of applicability can establish.
        "readiness_label": "Assessment completeness",
        "readiness_basis": (
            f"{determined_count} of {total_evaluated} requirements were decided "
            f"APPLICABLE or NOT_APPLICABLE. The rest need more information."
        ),
        "metrics": {
            "applicable_count": status_counts.get(ApplicabilityStatus.APPLICABLE, 0),
            "action_required_count": action_required_count,
            "due_soon_count": due_soon_count,
            # Scheme eligibility is not yet evaluated by any rule, so there is no
            # count to report. `null` renders as "Not yet calculated"; a 0 would
            # wrongly assert that no benefits exist.
            "benefits_count": scheme_data.get("total_schemes_found", 0),
            "needs_information_count": status_counts.get(ApplicabilityStatus.NEEDS_INFORMATION, 0),
            "conflict_review_count": status_counts.get(ApplicabilityStatus.CONFLICT_REVIEW, 0),
            "unverified_count": status_counts.get(ApplicabilityStatus.UNVERIFIED, 0),
            "not_applicable_count": status_counts.get(ApplicabilityStatus.NOT_APPLICABLE, 0),
            "total_evaluated": total_evaluated,
        },
        "total_documents_needed": doc_data.get("total_documents_needed", 0),
        "total_workflows_count": wf_data.get("total_workflows", 0),
        "schemes_preview": scheme_data.get("schemes", [])[:3],
        "total_schemes_count": scheme_data.get("total_schemes_found", 0),
        "standards_preview": std_data.get("standards", [])[:3],
        "total_standards_count": std_data.get("total_standards_found", 0),
        "priority_actions": priority_actions[:6],
        "upcoming_deadlines": upcoming_deadlines,
        "category_breakdown": category_counts,
        "jurisdiction_breakdown": jurisdiction_counts,
        # No regulatory-change ingestion exists yet (apps.regulatory_updates has
        # no models). An empty list is the truthful answer; curated headlines
        # would read as live monitoring.
        "recent_updates": [],
        "recent_updates_available": False,
        "coverage": coverage,
    }


#: Requirement metadata key holding a statutory renewal cycle, in years.
RENEWAL_PERIOD_YEARS_KEY = "renewal_period_years"


def get_statutory_renewal_cycles(business: Business) -> list[dict[str, Any]]:
    """Renewal cycles for a business, derived from its latest evaluation.

    Shared by the dashboard and the statutory calendar so the two surfaces cannot
    disagree about which dates published knowledge actually supports.
    """
    latest_run = (
        DecisionRun.objects.filter(business=business)
        .prefetch_related("results")
        .order_by("-created_at")
        .first()
    )
    if latest_run is None:
        return []

    results = list(latest_run.results.all())
    req_defs = {
        rd.requirement_id: rd
        for rd in RequirementDefinition.objects.filter(
            requirement_id__in=[r.requirement_id for r in results]
        )
    }
    return _statutory_deadlines(results, req_defs)


def _statutory_deadlines(
    results: list[DecisionResult],
    req_defs: dict[str, RequirementDefinition],
) -> list[dict[str, Any]]:
    """Renewal deadlines that published knowledge actually states.

    A due date is only emitted where the requirement's own metadata records a
    statutory cycle. Filing timelines are not uniform across authorities, so
    inventing "30 days from today" would put a fabricated legal deadline in
    front of the user (PRD_v2.0 §P5).
    """
    today = timezone.localdate()
    deadlines: list[dict[str, Any]] = []

    for result in results:
        if result.status != ApplicabilityStatus.APPLICABLE:
            continue
        req_def = req_defs.get(result.requirement_id)
        if req_def is None:
            continue

        period_years = (req_def.metadata or {}).get(RENEWAL_PERIOD_YEARS_KEY)
        if not isinstance(period_years, (int, float)) or period_years <= 0:
            continue

        # Anchored on the evaluation date, not on an issue date we do not hold.
        # Reported as a cycle length so it is not mistaken for a filing due date.
        due_date = today + datetime.timedelta(days=round(float(period_years) * 365))
        deadlines.append(
            {
                "requirement_id": result.requirement_id,
                "title": f"{result.requirement_name} — renewal cycle",
                "due_date": str(due_date),
                "days_remaining": (due_date - today).days,
                "type": "STATUTORY_RENEWAL_CYCLE",
                "status": "UPCOMING",
                "authority": req_def.authority,
                "basis": (
                    f"Renewal period of {period_years} year(s) recorded in published "
                    f"knowledge for {result.requirement_id}."
                ),
                "anchored_on": str(today),
            }
        )

    deadlines.sort(key=lambda d: d["due_date"])
    return deadlines
