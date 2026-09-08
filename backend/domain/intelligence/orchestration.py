"""Comprehensive compliance analysis orchestration engine.

Authority: Milestone Parts 3, 4, 14, 17, 18, 23.

Orchestrates the complete business assessment in one coherent, staged pipeline:
1. BUSINESS_CONTEXT: Enriches context, MSMED Act 2020 scale, and activity footprints.
2. SMART_QUESTIONS: Verifies variable resolution.
3. REGULATORY_DISCOVERY: Executes dynamic multi-query Firecrawl search.
4. SOURCE_REVIEW: Ranks official .gov.in domains and quarantines candidate claims.
5. COMPLIANCE_EVALUATION: Authoritative deterministic AST rule evaluation.
6. DOCUMENT_PLANNING: Derives statutory document checklist.
7. WORKFLOW_PLANNING: Derives multi-stage approval workflows.
8. CALENDAR_PLANNING: Derives compliance calendar milestones.
9. SCHEME_DISCOVERY: Discovers central and state support schemes.
10. STANDARDS_DISCOVERY: Identifies applicable Indian Standards and QCOs.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from common.enums import ApplicabilityStatus
from apps.applicability.engine import ApplicabilityEngine
from apps.applicability.models import DecisionRun
from apps.businesses.models import Business
from apps.ingestion.models import CandidateRequirement, DiscoveryRun
from apps.ingestion.services import run_discovery
from domain.context.business_context import DerivedBusinessContext, build_business_context
from domain.intelligence.calendar_derivation import derive_business_calendar
from domain.intelligence.document_derivation import derive_business_documents
from domain.intelligence.scheme_discovery import discover_business_schemes
from domain.intelligence.standards_discovery import discover_business_standards
from domain.intelligence.workflow_derivation import derive_business_workflows

logger = logging.getLogger(__name__)

STAGES = [
    "BUSINESS_CONTEXT",
    "SMART_QUESTIONS",
    "REGULATORY_DISCOVERY",
    "SOURCE_REVIEW",
    "COMPLIANCE_EVALUATION",
    "DOCUMENT_PLANNING",
    "WORKFLOW_PLANNING",
    "SCHEME_DISCOVERY",
    "STANDARDS_DISCOVERY",
    "COMPLETED",
]


def orchestrate_compliance_analysis(
    business: Business,
    *,
    force_live_discovery: bool = True,
) -> dict[str, Any]:
    """Execute complete staged compliance analysis for a business."""
    start_time = datetime.now(timezone.utc)
    analysis_id = str(uuid.uuid4())
    stage_records: list[dict[str, Any]] = []

    def record_stage(stage_name: str, message: str, count: int = 0) -> None:
        stage_records.append({
            "stage": stage_name,
            "status": "COMPLETED",
            "message": message,
            "count": count,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    # Stage 1: BUSINESS_CONTEXT
    context = build_business_context(business)
    record_stage(
        "BUSINESS_CONTEXT",
        f"Synthesized profile context for {business.name}. Enterprise scale: {context.msme_scale}.",
        count=len(context.known_variable_keys),
    )

    # Stage 2: SMART_QUESTIONS
    missing_count = len(context.missing_variable_keys)
    record_stage(
        "SMART_QUESTIONS",
        f"Verified known profile variables ({len(context.known_variable_keys)} resolved, {missing_count} pending).",
        count=len(context.known_variable_keys),
    )

    # Stage 3: REGULATORY_DISCOVERY
    disc_run = DiscoveryRun.objects.filter(business=business).order_by("-created_at").first()
    if disc_run is None or force_live_discovery:
        try:
            disc_res = run_discovery(business, max_scrape=1)
            disc_run_id = disc_res.get("run_id")
            disc_run = DiscoveryRun.objects.filter(pk=disc_run_id).first() if disc_run_id else None
        except Exception as exc:
            logger.warning("Live discovery encountered error, continuing with published rules: %s", exc)

    queries_run = getattr(disc_run, "queries", []) or []
    record_stage(
        "REGULATORY_DISCOVERY",
        f"Searched official regulatory portals across {len(queries_run)} targeted queries.",
        count=len(queries_run),
    )

    # Stage 4: SOURCE_REVIEW
    candidate_count = 0
    sources_count = 0
    if disc_run:
        sources_count = getattr(disc_run, "candidate_count", 0) or len(getattr(disc_run, "candidate_urls", []))
        candidate_count = CandidateRequirement.objects.filter(discovery_run=disc_run).count()

    record_stage(
        "SOURCE_REVIEW",
        f"Reviewed {sources_count} regulatory sources; quarantined {candidate_count} candidate claims for verification.",
        count=sources_count,
    )

    # Stage 5: COMPLIANCE_EVALUATION (Authoritative deterministic AST)
    from django.db import connection
    try:
        connection.close_if_unusable_or_obsolete()
    except Exception:
        connection.close()

    try:
        profile_version = business.current_profile
    except Exception:
        connection.close()
        profile_version = business.current_profile

    existing_run = DecisionRun.objects.filter(business=business).order_by("-created_at").first()
    if existing_run and profile_version and existing_run.profile_version_id == profile_version.id and existing_run.results.exists():
        decision_run = existing_run
    elif profile_version:
        engine = ApplicabilityEngine()
        new_run = engine.evaluate_business_profile(
            business=business,
            profile_version=profile_version,
            save_run=True,
        )
        decision_run = new_run if (new_run and new_run.results.exists()) else (existing_run or new_run)
    else:
        decision_run = existing_run
    actionable_reqs = []
    if decision_run:
        actionable_reqs = [
            r for r in decision_run.results.all()
            if r.status in {ApplicabilityStatus.APPLICABLE, ApplicabilityStatus.NEEDS_INFORMATION}
        ]

    applicable_count = sum(1 for r in actionable_reqs if r.status == ApplicabilityStatus.APPLICABLE)
    needs_info_count = sum(1 for r in actionable_reqs if r.status == ApplicabilityStatus.NEEDS_INFORMATION)

    record_stage(
        "COMPLIANCE_EVALUATION",
        f"Authoritative evaluation complete: {applicable_count} requirements required, {needs_info_count} need information.",
        count=len(actionable_reqs),
    )

    # Stage 6: DOCUMENT_PLANNING
    docs_payload = derive_business_documents(business, context=context)
    total_docs = docs_payload.get("total_documents_needed", 0)
    record_stage(
        "DOCUMENT_PLANNING",
        f"Derived required document checklist containing {total_docs} statutory filings across applicable licenses.",
        count=total_docs,
    )

    # Stage 7: WORKFLOW_PLANNING
    wf_payload = derive_business_workflows(business, context=context)
    total_wfs = wf_payload.get("total_workflows", 0)
    record_stage(
        "WORKFLOW_PLANNING",
        f"Structured clearance execution workflows for {total_wfs} statutory approvals.",
        count=total_wfs,
    )

    # Stage 8: SCHEME_DISCOVERY
    schemes_payload = discover_business_schemes(business, context=context)
    total_schemes = schemes_payload.get("total_schemes_found", 0)
    record_stage(
        "SCHEME_DISCOVERY",
        f"Identified {total_schemes} potentially relevant government support schemes & incentives for {context.state_name}.",
        count=total_schemes,
    )

    # Stage 9: STANDARDS_DISCOVERY
    standards_payload = discover_business_standards(business, context=context)
    total_standards = standards_payload.get("total_standards_found", 0)
    record_stage(
        "STANDARDS_DISCOVERY",
        f"Matched {total_standards} applicable Indian Standards, QCOs, and quality certifications.",
        count=total_standards,
    )

    # Stage 10: CALENDAR_PLANNING
    cal_payload = derive_business_calendar(business, context=context)
    total_events = cal_payload.get("count", 0)
    upcoming_deadlines = sum(1 for e in cal_payload.get("events", []) if e.get("days_remaining", 999) <= 30)

    # Stage 11: COMPLETED
    end_time = datetime.now(timezone.utc)
    record_stage(
        "COMPLETED",
        f"Compliance plan synthesized successfully for {business.name}.",
        count=applicable_count,
    )

    from apps.applicability.serializers import DecisionRunSerializer
    run_data = DecisionRunSerializer(decision_run).data if decision_run else None

    return {
        "analysis_id": analysis_id,
        "business_id": str(business.id),
        "business_name": business.name,
        "status": "COMPLETED",
        "current_stage": "COMPLETED",
        "started_at": start_time.isoformat(),
        "completed_at": end_time.isoformat(),
        "duration_seconds": (end_time - start_time).total_seconds(),
        "stages": stage_records,
        "decision_run": run_data,
        "executive_summary": {
            "total_requirements_evaluated": len(decision_run.results.all()) if decision_run else 0,
            "requirements_identified": applicable_count,
            "requirements_action_needed": needs_info_count,
            "documents_to_prepare": total_docs,
            "documents_count": total_docs,
            "major_approval_workflows": total_wfs,
            "workflows_count": total_wfs,
            "upcoming_deadlines": upcoming_deadlines,
            "schemes_identified": total_schemes,
            "schemes_count": total_schemes,
            "standards_identified": total_standards,
            "standards_count": total_standards,
            "official_sources_searched": sources_count,
            "quarantined_claims": candidate_count,
        },
        "live_discovery": {
            "queries": queries_run,
            "sources_count": sources_count,
            "candidate_claims_count": candidate_count,
        },
        "context_summary": context.as_dict(),
    }
