"""Compliance Intelligence Record (CIR) projection & integrity service.

Authority: 05_DATA_CONTRACTS.md §8 (ComplianceIntelligenceRecord);
           01_ENGINEERING_CONSTITUTION.md §4;
           04_DOMAIN_BOUNDARIES.md §3;
           TRD_v2.0 §14, §17.

Crucial Invariant:
    ENGINE 2 DETERMINES. CIR RECORDS. FRONTEND PROJECTS.
    CIR is an immutable, verifiable record of Engine 2 determinations.
    It links each requirement to its legal status, authority, evidence chunk,
    official URL, and explanation trace.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
from typing import Any

from django.conf import settings
from django.utils import timezone

from apps.applicability.models import DecisionResult, DecisionRun
from apps.businesses.models import Business
from apps.knowledge.models import RequirementDefinition
from common.enums import ApplicabilityStatus

logger = logging.getLogger("complywise.applicability.services")


def _canonical_json_bytes(obj: Any) -> bytes:
    """Serialize object using RFC 8785 style deterministic JSON canonicalization."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def build_compliance_intelligence_record(
    decision_run: DecisionRun,
    assessment_id: str | None = None,
) -> dict[str, Any]:
    """Project an immutable, cryptographically verifiable CIR from a DecisionRun."""
    business = decision_run.business
    profile_version = decision_run.profile_version

    resolved_assessment_id = assessment_id
    if not resolved_assessment_id:
        ass = decision_run.assessment
        if not ass:
            ass = business.assessments.filter(decision_run=decision_run).first()
        if not ass:
            ass = business.assessments.order_by("-assessment_number").first()
        resolved_assessment_id = str(ass.id) if ass else str(business.id)

    results = list(
        DecisionResult.objects.filter(decision_run=decision_run)
        .order_by("requirement_id")
    )

    req_ids = [r.requirement_id for r in results]
    req_defs = {
        rd.requirement_id: rd
        for rd in RequirementDefinition.objects.filter(requirement_id__in=req_ids)
    }

    determinations: list[dict[str, Any]] = []
    applicable_count = 0
    not_applicable_count = 0
    needs_info_count = 0

    for r in results:
        status_str = r.status
        # Canonical statuses mapped to the 3-valued contract
        if status_str == ApplicabilityStatus.APPLICABLE:
            applicable_count += 1
        elif status_str == ApplicabilityStatus.NOT_APPLICABLE:
            not_applicable_count += 1
        else:
            # CONFLICT_REVIEW, UNVERIFIED, or NEEDS_INFORMATION all require user attention
            needs_info_count += 1

        req_def = req_defs.get(r.requirement_id)
        authority = req_def.authority if req_def else "Regulatory Authority"
        portal_url = str((req_def.metadata or {}).get("portal") or "") if req_def else ""

        # Extract explanation note or trace summary
        trace = r.explanation_trace or {}
        explanation = (
            trace.get("note")
            or trace.get("reason")
            or f"Evaluation completed with status {status_str}"
        )
        if isinstance(trace.get("evaluations"), list) and trace["evaluations"]:
            first_eval = trace["evaluations"][0]
            matched_rule = first_eval.get("rule_id")
            if matched_rule:
                explanation = f"Evaluated under {matched_rule}: {explanation}"

        ev_chunk_id = (r.evidence_refs or [""])[0] if r.evidence_refs else ""
        if not ev_chunk_id and req_def and req_def.evidence_refs:
            ev_chunk_id = req_def.evidence_refs[0]

        # Resolve verified operational action destination for applicable requirements
        action_destination = None
        if status_str == "APPLICABLE":
            trace_dest = trace.get("action_destination")
            if trace_dest:
                action_destination = trace_dest
            else:
                from apps.acquisition.services import resolve_action_for_requirement
                state_val = getattr(business, "primary_state", "")
                if not state_val and profile_version and hasattr(profile_version, "variables"):
                    s_entry = profile_version.variables.get("state")
                    state_val = s_entry.get("value") if isinstance(s_entry, dict) else s_entry
                act_dest = resolve_action_for_requirement(
                    requirement_id=r.requirement_id,
                    requirement_name=r.requirement_name,
                    authority=authority,
                    state_code=str(state_val or ""),
                    authoritative_url=portal_url,
                )
                action_destination = act_dest.to_dict()

        determinations.append(
            {
                "requirement_id": r.requirement_id,
                "title": r.requirement_name,
                "status": status_str,
                "authority": authority,
                "evidence_chunk_id": ev_chunk_id,
                "official_url": portal_url,
                "explanation": explanation,
                "action_destination": action_destination,
            }
        )

    metrics = {
        "applicable_count": applicable_count,
        "not_applicable_count": not_applicable_count,
        "needs_info_count": needs_info_count,
    }

    cir_id = f"CIR-{decision_run.id}"
    created_at = decision_run.created_at.isoformat() if decision_run.created_at else timezone.now().isoformat()

    unsigned_payload = {
        "cir_id": cir_id,
        "business_id": str(business.id),
        "assessment_id": resolved_assessment_id,
        "profile_version_id": str(profile_version.id) if profile_version else None,
        "decision_run_id": str(decision_run.id),
        "determinations": determinations,
        "metrics": metrics,
        "created_at": created_at,
    }

    # Cryptographic CIR digest per 05_DATA_CONTRACTS.md §8.1
    canonical_bytes = _canonical_json_bytes(unsigned_payload)
    content_hash = f"sha256:{hashlib.sha256(canonical_bytes).hexdigest()}"

    # HMAC signature
    auth_key = getattr(settings, "CIR_AUTHORITY_KEY", "complywise-cir-root-authority").encode("utf-8")
    signature = hmac.new(auth_key, canonical_bytes, hashlib.sha256).hexdigest()

    cir_record = dict(unsigned_payload)
    cir_record["content_hash"] = content_hash
    cir_record["authority_signature"] = f"hmac-sha256:{signature}"

    return cir_record


def verify_cir_integrity(cir: dict[str, Any]) -> bool:
    """Verify that a CIR payload's content_hash matches its canonical bytes."""
    provided_hash = cir.get("content_hash", "")
    if not provided_hash.startswith("sha256:"):
        return False

    payload = {k: v for k, v in cir.items() if k not in ("content_hash", "authority_signature")}
    canonical_bytes = _canonical_json_bytes(payload)
    computed_hash = f"sha256:{hashlib.sha256(canonical_bytes).hexdigest()}"
    return hmac.compare_digest(provided_hash, computed_hash)


def get_latest_cir(business: Business, assessment_id: str | None = None) -> dict[str, Any] | None:
    """Retrieve the latest CIR for a business, generating it from the latest DecisionRun if needed."""
    assessment = None
    if assessment_id:
        assessment = business.assessments.filter(pk=assessment_id).first()
    if assessment is None:
        assessment = business.assessments.order_by("-assessment_number").first()

    latest_run = None
    if assessment and assessment.decision_run:
        latest_run = assessment.decision_run
    elif assessment:
        latest_run = DecisionRun.objects.filter(assessment=assessment).order_by("-created_at").first()

    if latest_run is None:
        latest_run = DecisionRun.objects.filter(business=business).order_by("-created_at").first()

    if latest_run is None:
        return None

    return build_compliance_intelligence_record(
        latest_run,
        assessment_id=str(assessment.id) if assessment else None,
    )
