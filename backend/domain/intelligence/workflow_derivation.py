"""Dynamic statutory workflow derivation engine.

Authority: PRD_v2.0 §19; TRD_v2.0 §30; Milestone Parts 6, 23, 24.

Derives sequential, dependency-aware clearance workflows from:
1. Requirements evaluated as APPLICABLE or NEEDS_INFORMATION by the engine.
2. Authority-specific administrative clearance procedures in India (FSSAI FoSCoS,
   SPCB OCMMS/XGN, DISH Factory Licensing, DGFT Trade Portal, BIS Manakonline).
3. Prerequisite relationships across environmental, municipal, safety, and sector approvals.
"""

from __future__ import annotations

from typing import Any

from common.enums import ApplicabilityStatus
from apps.applicability.models import DecisionRun
from apps.businesses.models import Business
from apps.knowledge.models import RequirementDefinition
from domain.context.business_context import DerivedBusinessContext, build_business_context

from knowledge_packs.catalogs import STATUTORY_WORKFLOW_TEMPLATES


def _match_workflow_template(req_def: RequirementDefinition) -> str:
    dom = (req_def.domain or "").upper()
    cat = (req_def.category or "").upper()
    auth = (req_def.authority or "").upper()
    req_id = req_def.requirement_id.upper()

    if "FOOD" in dom or "FSSAI" in auth or "FOOD" in req_id:
        return "FOOD"
    if "ENVIRONMENT" in dom or "POLLUTION" in dom or "PCB" in auth or "CPCB" in auth or "SPCB" in auth:
        return "ENVIRONMENT"
    if "LABOR" in dom or "FACTORY" in dom or "DISH" in auth:
        return "LABOR"
    if "TRADE" in dom or "DGFT" in auth or "CUSTOM" in dom or "IEC" in req_id:
        return "TRADE"
    if "STANDARD" in cat or "BIS" in auth or "CRS" in req_id:
        return "STANDARD"
    return "DEFAULT"


def derive_business_workflows(
    business: Business,
    context: DerivedBusinessContext | None = None,
    assessment_id: str | None = None,
) -> dict[str, Any]:
    """Derive prioritized statutory workflow roadmaps for a business."""
    if context is None:
        context = build_business_context(business)

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

    workflows: list[dict[str, Any]] = []

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

        # Sequence workflows with prerequisite awareness:
        # 1. Trade / IEC (fast, foundational)
        # 2. Environmental CTE (prerequisite to construction)
        # 3. Factory Plan & License (prerequisite to machinery run)
        # 4. Food License / Sector Specific (operational)
        # 5. Standards & Certifications (distribution)

        priority_order = {"TRADE": 1, "ENVIRONMENT": 2, "LABOR": 3, "FOOD": 4, "STANDARD": 5, "DEFAULT": 6}

        sorted_results = sorted(
            actionable_results,
            key=lambda r: priority_order.get(_match_workflow_template(req_defs.get(r.requirement_id) or RequirementDefinition(requirement_id="")), 99)
        )

        for result in sorted_results:
            req_def = req_defs.get(result.requirement_id)
            if req_def is None:
                continue

            template_key = _match_workflow_template(req_def)
            tmpl = STATUTORY_WORKFLOW_TEMPLATES.get(template_key, STATUTORY_WORKFLOW_TEMPLATES["DEFAULT"])

            portal_name = (req_def.metadata or {}).get("portal") or tmpl["portal_name"]

            formatted_steps = []
            for idx, s in enumerate(tmpl["steps"], start=1):
                step_num = s.get("step_number", idx)
                st_raw = s.get("status", "NOT_STARTED")
                status_map = {
                    "READY_TO_START": "READY",
                    "UPCOMING": "NOT_STARTED",
                    "IN_PROGRESS": "IN_PROGRESS",
                    "COMPLETED": "COMPLETED",
                    "BLOCKED": "BLOCKED",
                }
                step_status = status_map.get(st_raw, "NOT_STARTED")
                formatted_steps.append({
                    "step": step_num,
                    "step_number": step_num,
                    "title": s["title"],
                    "description": s.get("description", ""),
                    "duration": s.get("duration", ""),
                    "status": step_status,
                })

            workflows.append({
                "id": f"WF::{result.requirement_id}",
                "requirement_id": result.requirement_id,
                "title": result.requirement_name,
                "authority": req_def.authority,
                "category": req_def.category,
                "domain": req_def.domain,
                "portal_name": portal_name,
                "portal_url": tmpl.get("portal_url", ""),
                "estimated_duration": tmpl["estimated_days"],
                "total_steps": len(formatted_steps),
                "current_step": 1,
                "current_step_title": formatted_steps[0]["title"] if formatted_steps else "Step 1: Document Preparation",
                "prerequisites": "Entity incorporation and business premises confirmation",
                "steps": formatted_steps,
                "status": "IN_PROGRESS" if result.status == ApplicabilityStatus.APPLICABLE else "NOT_STARTED",
            })

    return {
        "business_id": str(business.id),
        "business_name": business.name,
        "available": True,
        "evaluated": latest_run is not None,
        "count": len(workflows),
        "total_workflows": len(workflows),
        "workflows": workflows,
        "source": "STATUTORY_PROCEDURE_MAPPING",
        "disclaimer": "Clearance workflows are structured from statutory filing guidelines established by regulatory authorities.",
    }
