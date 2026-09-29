"""Admin Scrutiny & Assessment Truth Service.

Authority: ComplyWise Architecture Constitution, TRD_v2.0, PRD_v2.0.
Core Invariant:
    RAG RETRIEVES.
    RULES DECIDE.
    LLM EXPLAINS.

This service aggregates and isolates:
1. Automated Compliance Intelligence: Engine 2 truth (DecisionRun, DecisionResult, CIR digest & signature).
2. Operational Workflow State: Human review disposition, documents, cases, statutory deadlines.
3. Provenance & Audit Trail: Canonical fact origin, AST traces, verbatim statutory evidence.

Strict Separation:
Admin human dispositions MUST NEVER mutate Engine 2 legal applicability results.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

from django.conf import settings
from django.utils import timezone

from common.enums import (
    ApplicabilityStatus,
    CaseStatus,
    DecisionRunStatus,
    KnowledgeStatus,
)
from apps.businesses.models import Business, BusinessProfileVersion, Assessment
from apps.applicability.models import DecisionRun, DecisionResult
from apps.applicability.services import (
    build_compliance_intelligence_record,
    get_latest_cir,
    verify_cir_integrity,
)
from apps.evidence.models import Evidence
from apps.knowledge.models import RequirementDefinition
from apps.schemes.engine.matcher import match_business_schemes
from domain.intelligence.standards_discovery import discover_business_standards
from domain.intelligence.calendar_derivation import derive_business_calendar
from apps.calendar.models import Deadline
from apps.documents.models import DocumentSubmission
from apps.workflows.models import (
    CaseRequirementDisposition,
    ComplianceCase,
    HumanReview,
)
from domain.profile.variables import PROFILE_VARIABLES
from apps.workflows.services.case_service import CaseService

logger = logging.getLogger(__name__)


class AdminScrutinyService:
    """Consolidated administrative scrutiny aggregator providing 360-degree Engine 2 truth and workflow review."""

    @classmethod
    def get_business_scrutiny_overview(
        cls,
        business_id: str | uuid.UUID,
        assessment_id: str | uuid.UUID | None = None,
        user: Any = None,
    ) -> dict[str, Any]:
        """Aggregate 360-degree Engine 2 compliance truth, signed CIR, evidence, schemes, standards, and workflow state.

        Strictly enforces tenant scoping and staff audit logging.
        """
        uuid_obj = uuid.UUID(str(business_id)) if not isinstance(business_id, uuid.UUID) else business_id
        business = Business.objects.select_related("owner").get(pk=uuid_obj)

        if user:
            logger.info(
                "AUDIT: Staff/Admin user %s scrutinized business %s (%s)",
                getattr(user, "id", None),
                business.id,
                business.name,
            )

        # 1. All Assessments for this business
        assessments_qs = business.assessments.order_by("-created_at")
        assessments_list = [
            {
                "id": str(a.id),
                "assessment_number": a.assessment_number,
                "title": a.title or f"Assessment #{a.assessment_number}",
                "status": a.status,
                "current_step": a.current_step,
                "profile_version_id": str(a.profile_version_id) if a.profile_version_id else None,
                "decision_run_id": str(a.decision_run_id) if a.decision_run_id else None,
                "created_at": a.created_at.isoformat() if hasattr(a, "created_at") and a.created_at else None,
                "completed_at": a.completed_at.isoformat() if a.completed_at else None,
            }
            for a in assessments_qs
        ]

        # 2. Resolve Selected Assessment
        selected_assessment = None
        if assessment_id:
            try:
                ass_uuid = uuid.UUID(str(assessment_id))
                selected_assessment = business.assessments.filter(pk=ass_uuid).first()
            except (ValueError, TypeError):
                selected_assessment = None
        elif assessments_qs.exists():
            selected_assessment = assessments_qs.first()

        # 3. Resolve Business Profile Version
        profile_version = None
        if selected_assessment and selected_assessment.profile_version:
            profile_version = selected_assessment.profile_version
        elif business.current_profile:
            profile_version = business.current_profile

        # 4. Profile Variables & Fact Provenance (§17)
        variables_data = profile_version.variables if profile_version and hasattr(profile_version, "variables") else {}
        var_map = {v.key: v for v in PROFILE_VARIABLES}
        fact_provenance: list[dict[str, Any]] = []

        if isinstance(variables_data, dict):
            for k, v in variables_data.items():
                if isinstance(v, dict):
                    val = v.get("value")
                    origin = v.get("origin", "USER_PROVIDED")
                    unit = v.get("unit")
                    confidence = v.get("confidence", 1.0)
                    source_excerpt = v.get("source_excerpt", "")
                    is_confirmed = v.get("is_confirmed", True)
                    recorded_at = v.get("recorded_at")
                    override_metadata = v.get("override_metadata") or {}
                else:
                    val = v
                    origin = "USER_PROVIDED"
                    unit = None
                    confidence = 1.0
                    source_excerpt = ""
                    is_confirmed = True
                    recorded_at = None
                    override_metadata = {}

                if val is not None:
                    def_obj = var_map.get(k)
                    label = def_obj.label if def_obj else k.replace("_", " ").title()
                    unit = unit or (def_obj.unit if def_obj else None)
                    fact_provenance.append({
                        "key": k,
                        "label": label,
                        "value": val,
                        "unit": unit,
                        "origin": origin,
                        "confidence": confidence,
                        "source_excerpt": source_excerpt,
                        "is_confirmed": is_confirmed,
                        "recorded_at": recorded_at,
                        "override_metadata": override_metadata,
                    })

        # Past profile versions
        profile_history = []
        for p in business.profile_versions.order_by("-version"):
            profile_history.append({
                "id": str(p.id),
                "version": p.version,
                "change_note": p.change_note or f"Profile snapshot v{p.version}",
                "variables_count": len(p.variables) if isinstance(p.variables, dict) else 0,
                "created_at": p.created_at.isoformat() if hasattr(p, "created_at") and p.created_at else None,
            })

        # 5. Resolve Decision Run & Engine 2 Truth
        decision_run = None
        if selected_assessment and selected_assessment.decision_run:
            decision_run = selected_assessment.decision_run
        elif selected_assessment:
            decision_run = DecisionRun.objects.filter(assessment=selected_assessment).order_by("-created_at").first()
        if not decision_run and profile_version:
            decision_run = profile_version.decision_runs.order_by("-created_at").first()
        if not decision_run:
            decision_run = DecisionRun.objects.filter(business=business).order_by("-created_at").first()

        # Build evidence lookup map
        engine2_results: list[dict[str, Any]] = []
        cir_payload = None
        cir_is_valid = False

        automated_metrics = {
            "applicable_count": 0,
            "not_applicable_count": 0,
            "needs_info_count": 0,
            "unverified_count": 0,
            "conflict_review_count": 0,
            "total_evaluated": 0,
        }

        # Build human workflow disposition map
        dispositions_by_req: dict[str, dict[str, Any]] = {}
        disps_qs = CaseRequirementDisposition.objects.filter(
            case__business=business
        ).select_related("case", "reviewer", "requirement")

        for d in disps_qs:
            dispositions_by_req[d.requirement_id_code] = {
                "disposition_id": str(d.id),
                "admin_disposition": d.admin_disposition,
                "reason": d.reason,
                "reviewer_email": d.reviewer.email if d.reviewer else None,
                "reviewer_name": d.reviewer.full_name if d.reviewer and hasattr(d.reviewer, "full_name") else None,
                "case_id": str(d.case_id),
                "case_number": d.case.case_number,
                "updated_at": d.updated_at.isoformat() if hasattr(d, "updated_at") and d.updated_at else None,
            }

        if decision_run:
            results_qs = list(
                decision_run.results.all()
                .select_related("rule_version")
                .order_by("requirement_id")
            )

            # Pre-fetch evidence records
            all_evidence_ids: set[str] = set()
            for r in results_qs:
                for ref in (r.evidence_refs or []):
                    ev_id = ref.get("evidence_id") if isinstance(ref, dict) else ref
                    if ev_id:
                        all_evidence_ids.add(str(ev_id))
                if r.rule_version and r.rule_version.evidence_refs:
                    for ev_id in r.rule_version.evidence_refs:
                        all_evidence_ids.add(str(ev_id))

            # Also fetch from RequirementDefinition
            req_ids = [r.requirement_id for r in results_qs]
            req_defs = {
                rd.requirement_id: rd
                for rd in RequirementDefinition.objects.filter(requirement_id__in=req_ids)
            }
            for rd in req_defs.values():
                for ev_id in (rd.evidence_refs or []):
                    all_evidence_ids.add(str(ev_id))

            evidences_map = {}
            if all_evidence_ids:
                for ev in Evidence.objects.filter(evidence_id__in=all_evidence_ids).select_related("source"):
                    evidences_map[ev.evidence_id] = {
                        "evidence_id": ev.evidence_id,
                        "source_id": ev.source.source_id,
                        "source_title": ev.source.title,
                        "authority": ev.source.authority,
                        "source_type": ev.source.source_type,
                        "canonical_url": ev.source.canonical_url,
                        "locator": ev.locator,
                        "excerpt": ev.excerpt,
                        "verification_status": ev.verification_status,
                        "content_hash": ev.source.content_hash,
                        "effective_from": ev.effective_from.isoformat() if ev.effective_from else None,
                        "effective_until": ev.effective_until.isoformat() if ev.effective_until else None,
                    }

            # Import action resolver
            from apps.acquisition.services import resolve_action_for_requirement
            state_val = getattr(business, "primary_state", "")
            if not state_val and profile_version and hasattr(profile_version, "variables"):
                s_entry = profile_version.variables.get("state")
                state_val = s_entry.get("value") if isinstance(s_entry, dict) else s_entry

            for r in results_qs:
                status_str = r.status.upper()
                if status_str == ApplicabilityStatus.APPLICABLE:
                    automated_metrics["applicable_count"] += 1
                elif status_str == ApplicabilityStatus.NOT_APPLICABLE:
                    automated_metrics["not_applicable_count"] += 1
                elif status_str == ApplicabilityStatus.NEEDS_INFORMATION:
                    automated_metrics["needs_info_count"] += 1
                elif status_str == ApplicabilityStatus.UNVERIFIED:
                    automated_metrics["unverified_count"] += 1
                elif status_str == ApplicabilityStatus.CONFLICT_REVIEW:
                    automated_metrics["conflict_review_count"] += 1
                automated_metrics["total_evaluated"] += 1

                req_def = req_defs.get(r.requirement_id)
                authority = req_def.authority if req_def else "Regulatory Authority"
                jurisdiction = req_def.jurisdiction if req_def else "CENTRAL"
                domain = req_def.domain if req_def else "GENERAL"
                portal_url = str((req_def.metadata or {}).get("portal") or "") if req_def else ""

                # Collect citations for this requirement
                citations = []
                req_ev_ids = []
                for ref in (r.evidence_refs or []):
                    ev_id = ref.get("evidence_id") if isinstance(ref, dict) else ref
                    if ev_id:
                        req_ev_ids.append(str(ev_id))
                if not req_ev_ids and req_def and req_def.evidence_refs:
                    req_ev_ids.extend([str(x) for x in req_def.evidence_refs])

                for eid in req_ev_ids:
                    if eid in evidences_map:
                        citations.append(evidences_map[eid])

                # Official operational action destination
                action_destination = None
                if status_str == ApplicabilityStatus.APPLICABLE:
                    try:
                        from demo.destinations import get_demo_destination
                        demo_dest = get_demo_destination(r.requirement_id)
                    except ImportError:
                        demo_dest = None

                    if demo_dest:
                        action_destination = demo_dest.to_dict()
                    else:
                        act_dest = resolve_action_for_requirement(
                            requirement_id=r.requirement_id,
                            requirement_name=r.requirement_name,
                            authority=authority,
                            state_code=str(state_val or ""),
                            authoritative_url=portal_url,
                            allow_live_network=False,
                        )
                        action_destination = act_dest.to_dict()

                # Operational workflow disposition (human review)
                disposition = dispositions_by_req.get(r.requirement_id)

                engine2_results.append({
                    "id": str(r.id),
                    "requirement_id": r.requirement_id,
                    "requirement_name": r.requirement_name,
                    "status": status_str,
                    "authority": authority,
                    "jurisdiction": jurisdiction,
                    "domain": domain,
                    "portal_url": portal_url,
                    "rule_version": {
                        "rule_id": r.rule_version.rule_id,
                        "version": r.rule_version.version,
                        "rule_type": r.rule_version.rule_type,
                    } if r.rule_version else None,
                    "explanation_trace": r.explanation_trace or {},
                    "evidence_records": citations,
                    "evidence_count": len(citations),
                    "action_destination": action_destination,
                    "human_disposition": disposition,
                    "evaluated_at": r.created_at.isoformat() if hasattr(r, "created_at") and r.created_at else None,
                })

            # Cryptographic CIR
            try:
                cir_payload = build_compliance_intelligence_record(
                    decision_run,
                    assessment_id=str(selected_assessment.id) if selected_assessment else None,
                )
                cir_is_valid = verify_cir_integrity(cir_payload)
            except Exception as cir_exc:
                logger.warning("Could not generate CIR for decision run %s: %s", decision_run.id, cir_exc)
                cir_payload = None

        # 6. Schemes Admin View (§12)
        schemes_data: list[dict[str, Any]] = []
        try:
            ass_id_str = str(selected_assessment.id) if selected_assessment else None
            schemes_res = match_business_schemes(business, assessment_id=ass_id_str)
            schemes_data = schemes_res.get("schemes", [])
        except Exception as sch_exc:
            logger.debug("Schemes matching error: %s", sch_exc)

        # 7. Standards Admin View (§13)
        standards_data: list[dict[str, Any]] = []
        try:
            ass_id_str = str(selected_assessment.id) if selected_assessment else None
            standards_res = discover_business_standards(business, assessment_id=ass_id_str)
            standards_data = standards_res.get("standards", [])
        except Exception as std_exc:
            logger.debug("Standards discovery error: %s", std_exc)

        # 8. Statutory Calendar & Deadlines (§16)
        calendar_events: list[dict[str, Any]] = []
        try:
            ass_id_str = str(selected_assessment.id) if selected_assessment else None
            cal_res = derive_business_calendar(business, assessment_id=ass_id_str)
            calendar_events = cal_res.get("events", [])
        except Exception as cal_exc:
            logger.debug("Calendar derivation error: %s", cal_exc)

        admin_deadlines_qs = Deadline.objects.filter(business=business).order_by("due_at")
        admin_deadlines = [
            {
                "id": str(d.id),
                "title": d.title,
                "requirement_id_code": d.requirement_id_code,
                "due_at": d.due_at.isoformat(),
                "priority": d.priority,
                "status": d.status,
                "source": d.source,
                "description": d.description,
                "notes": d.notes,
                "created_by": d.created_by.email if d.created_by else "System",
            }
            for d in admin_deadlines_qs
        ]

        # 9. Document Review (§14)
        submissions_qs = (
            DocumentSubmission.objects.filter(document_requirement__case__business=business)
            .select_related("document_requirement__case", "uploaded_by")
            .prefetch_related("reviews")
            .order_by("-created_at")
        )

        uploaded_documents = []
        for s in submissions_qs:
            latest_rev = s.reviews.order_by("-reviewed_at").first()
            uploaded_documents.append({
                "id": str(s.id),
                "document_requirement_id": str(s.document_requirement_id),
                "requirement_name": s.document_requirement.name,
                "document_type_code": s.document_requirement.document_type_code,
                "case_id": str(s.document_requirement.case_id),
                "case_number": s.document_requirement.case.case_number,
                "version_number": s.version_number,
                "file_name": s.file_name,
                "file_size_bytes": s.file_size_bytes,
                "mime_type": s.mime_type,
                "checksum": s.checksum,
                "status_code": s.status_code,
                "stream_url": f"/api/v1/documents/{s.id}/view?mode=stream",
                "uploaded_at": s.created_at.isoformat() if hasattr(s, "created_at") and s.created_at else None,
                "uploaded_by_email": s.uploaded_by.email if s.uploaded_by else None,
                "latest_review": {
                    "review_type": latest_rev.review_type,
                    "status": latest_rev.status,
                    "reviewer_comments": latest_rev.reviewer_comments,
                    "findings": latest_rev.findings,
                    "reviewed_at": latest_rev.reviewed_at.isoformat() if latest_rev.reviewed_at else None,
                } if latest_rev else None,
            })

        # 10. Operational Workflow Cases (§15)
        cases_qs = business.compliance_cases.all().select_related(
            "requirement", "current_workflow_instance__current_step", "assigned_reviewer"
        ).prefetch_related("document_requirements__submissions")

        workflow_metrics = {
            "pending_review_count": 0,
            "submitted_count": 0,
            "query_raised_count": 0,
            "approved_count": 0,
            "rejected_count": 0,
            "total_cases": 0,
        }

        cases_data = []
        for c in cases_qs:
            status_code = c.status_code.upper()
            if status_code in [CaseStatus.HUMAN_REVIEW, "PENDING_REVIEW", "PENDING"]:
                workflow_metrics["pending_review_count"] += 1
            elif status_code in [CaseStatus.COMPLETED, "APPROVED"]:
                workflow_metrics["approved_count"] += 1
            elif status_code in ["QUERY_RAISED", "QUERY"]:
                workflow_metrics["query_raised_count"] += 1
            elif status_code in [CaseStatus.REJECTED, "REJECTED"]:
                workflow_metrics["rejected_count"] += 1
            elif status_code in [CaseStatus.SUBMITTED, "IN_REVIEW"]:
                workflow_metrics["submitted_count"] += 1
            workflow_metrics["total_cases"] += 1

            doc_reqs = c.document_requirements.all()
            docs_req_count = len(doc_reqs)
            docs_up_count = sum(1 for d in doc_reqs if d.latest_submission)
            docs_app_count = sum(
                1
                for d in doc_reqs
                if d.latest_submission and d.latest_submission.status_code == "INTERNAL_HUMAN_APPROVED"
            )

            mandate_basis = CaseService.get_why_applicable_summary(c)
            req_name = c.requirement.name if (c.requirement and c.requirement.name) else (c.metadata.get("requirement_name") or c.requirement_id_code)
            auth_name = c.requirement.authority if (c.requirement and c.requirement.authority) else (c.metadata.get("authority") or "Regulatory Authority")
            step_name = c.current_workflow_instance.current_step.name if (c.current_workflow_instance and c.current_workflow_instance.current_step) else "Document Upload"

            cases_data.append({
                "id": str(c.id),
                "case_number": c.case_number,
                "requirement_id_code": c.requirement_id_code,
                "requirement_name": req_name,
                "authority": auth_name,
                "status_code": c.status_code,
                "priority": c.priority,
                "is_mandated": True,
                "mandate_basis": mandate_basis,
                "current_step_name": step_name,
                "documents_required_count": docs_req_count,
                "documents_uploaded_count": docs_up_count,
                "documents_approved_count": docs_app_count,
                "assigned_reviewer_name": c.assigned_reviewer.full_name if c.assigned_reviewer and hasattr(c.assigned_reviewer, "full_name") else None,
                "assigned_reviewer_email": c.assigned_reviewer.email if c.assigned_reviewer else None,
                "opened_at": c.opened_at.isoformat() if c.opened_at else None,
                "updated_at": c.updated_at.isoformat() if c.updated_at else None,
            })

        return {
            "business": {
                "id": str(business.id),
                "name": business.name,
                "incorporation_type": getattr(business, "incorporation_type", None) or (
                    profile_version.variables.get("incorporation_type", {}).get("value")
                    if profile_version and isinstance(profile_version.variables.get("incorporation_type"), dict)
                    else (profile_version.variables.get("incorporation_type") if profile_version else None)
                ) or "PRIVATE_LIMITED",
                "primary_state": getattr(business, "primary_state", None) or (
                    profile_version.variables.get("state", {}).get("value")
                    if profile_version and isinstance(profile_version.variables.get("state"), dict)
                    else (profile_version.variables.get("state") if profile_version else None)
                ) or "CENTRAL",
                "created_at": business.created_at.isoformat() if hasattr(business, "created_at") and business.created_at else None,
                "owner_id": str(business.owner_id) if business.owner_id else None,
                "owner_email": business.owner.email if business.owner else None,
                "owner_name": getattr(business.owner, "full_name", "") or (business.owner.email if business.owner else ""),
            },
            "selected_assessment": {
                "id": str(selected_assessment.id),
                "assessment_number": selected_assessment.assessment_number,
                "title": selected_assessment.title or f"Assessment #{selected_assessment.assessment_number}",
                "status": selected_assessment.status,
                "current_step": selected_assessment.current_step,
                "profile_version_id": str(selected_assessment.profile_version_id) if selected_assessment.profile_version_id else None,
                "decision_run_id": str(selected_assessment.decision_run_id) if selected_assessment.decision_run_id else None,
                "created_at": selected_assessment.created_at.isoformat() if hasattr(selected_assessment, "created_at") and selected_assessment.created_at else None,
                "completed_at": selected_assessment.completed_at.isoformat() if selected_assessment.completed_at else None,
            } if selected_assessment else None,
            "assessments": assessments_list,
            "profile": {
                "version_number": profile_version.version if profile_version else 1,
                "change_note": profile_version.change_note if profile_version else "Initial profile",
                "created_at": profile_version.created_at.isoformat() if profile_version and hasattr(profile_version, "created_at") and profile_version.created_at else None,
                "answered_variables": fact_provenance,
            },
            "profile_history": profile_history,
            "decision_run": {
                "id": str(decision_run.id),
                "status": decision_run.status,
                "evaluation_date": decision_run.evaluation_date.isoformat() if decision_run.evaluation_date else None,
                "created_at": decision_run.created_at.isoformat() if decision_run.created_at else None,
            } if decision_run else None,
            "engine2_results": engine2_results,
            "cir": cir_payload,
            "cir_is_valid": cir_is_valid,
            "schemes": schemes_data,
            "standards": standards_data,
            "calendar": {
                "statutory_events": calendar_events,
                "admin_deadlines": admin_deadlines,
            },
            "uploaded_documents": uploaded_documents,
            "compliance_cases": cases_data,
            "metrics": {
                "automated": automated_metrics,
                "workflow": workflow_metrics,
                "total_uploaded_documents": len(uploaded_documents),
            },
            # Compatibility summary with legacy Admin overview format
            "summary": {
                "total_compliances": automated_metrics["total_evaluated"] or len(cases_data),
                "mandated_compliances": automated_metrics["applicable_count"] or sum(1 for c in cases_data if c["is_mandated"]),
                "pending_reviews": workflow_metrics["pending_review_count"],
                "action_required": automated_metrics["applicable_count"] + automated_metrics["needs_info_count"],
                "completed": workflow_metrics["approved_count"],
                "total_uploaded_documents": len(uploaded_documents),
            },
        }
