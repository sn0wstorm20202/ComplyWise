"""Case Requirement Disposition & Compliance Control Service.

Authority: Architectural Specification §11-§16, §39, §40.
Enforces:
1. Separation between System Applicability and Admin Case Disposition.
2. Invariant: Admin judgment NEVER silently mutates or deletes original rule engine truth.
3. Mandatory reason required when marking a requirement as NOT_REQUIRED.
4. Full audit provenance with SecurityAuditEvent and CaseRequirementDisposition history.
5. Support for future compliance catalog attaching via ADMIN_ASSIGNED source.
"""

from __future__ import annotations

import logging
from typing import Any

from django.db import transaction
from django.utils import timezone

from common.enums import ActorType, AdminDisposition
from apps.knowledge.models import RequirementDefinition
from apps.workflows.models import (
    CaseRequirementDisposition,
    ComplianceCase,
    SecurityAuditEvent,
    WorkflowEvent,
)

logger = logging.getLogger(__name__)


def reviewed_requirement_treatment(business, assessment_id=None, profile_version_id=None):
    """Read case-level reviewer treatment without rewriting engine truth."""
    from django.db.models import Q
    rows = CaseRequirementDisposition.objects.filter(case__business=business,
        reviewer__isnull=False, user_visible=True).select_related("case", "reviewer", "requirement")
    if assessment_id:
        assessment = business.assessments.filter(pk=assessment_id).first()
        if not assessment:
            return {}
        rows = rows.filter(Q(case__assessment=assessment) | Q(case__metadata__assessment_id=str(assessment.id)) |
            Q(case__assessment__isnull=True, case__profile_version_id=assessment.profile_version_id,
              case__metadata__assessment_id__isnull=True))
    elif profile_version_id:
        rows = rows.filter(case__profile_version_id=profile_version_id)
    result = {}
    for row in rows.order_by("-updated_at"):
        result.setdefault(row.requirement_id_code, {"admin_disposition": row.admin_disposition,
            "review_reason": row.reason, "reviewer_id": str(row.reviewer_id),
            "reviewed_at": row.updated_at.isoformat(), "user_action_required": row.user_action_required,
            "treatment_source": row.source})
    return result


def reviewer_assigned_requirements(business, assessment_id=None, profile_version_id=None):
    """Catalogue assignments are human actions, never synthetic engine decisions."""
    treatments = reviewed_requirement_treatment(business, assessment_id, profile_version_id)
    ids = [key for key, treatment in treatments.items() if treatment["treatment_source"] == "ADMIN_ASSIGNED"]
    return [{"requirement_id": definition.requirement_id, "name": definition.name, "title": definition.name,
        "authority": definition.authority, "category": definition.category, "domain": definition.domain,
        "jurisdiction": definition.jurisdiction, "description": definition.description, "status": "SUGGESTED",
        "result_origin": "HUMAN_REVIEW_RESULT", "matched_rule_id": None, "evidence_count": 0,
        "citations": [], "citation_count": 0, "portal_url": None,
        "reason_summary": treatments[definition.requirement_id]["review_reason"],
        **treatments[definition.requirement_id]}
        for definition in RequirementDefinition.objects.filter(requirement_id__in=ids)]


class DispositionValidationError(Exception):
    """Raised when an admin disposition change violates statutory or data integrity rules."""


class CaseRequirementDispositionService:
    """Orchestrates admin requirement control and operational disposition."""

    @classmethod
    def get_or_create_disposition(
        cls,
        case: ComplianceCase,
        requirement_id_code: str,
        original_applicability: str = "APPLICABLE",
    ) -> CaseRequirementDisposition:
        """Fetch or initialize a requirement disposition for a case."""
        disp = case.dispositions.filter(requirement_id_code=requirement_id_code).first()
        if not disp:
            req_def = RequirementDefinition.objects.filter(requirement_id=requirement_id_code).first()
            disp = CaseRequirementDisposition.objects.create(
                case=case,
                requirement=req_def,
                requirement_id_code=requirement_id_code,
                original_applicability_status=original_applicability,
                admin_disposition=AdminDisposition.SYSTEM_REVIEW_PENDING,
                source="SYSTEM_RULE",
                reason="Awaiting reviewer decision",
                user_visible=True,
                user_action_required=True,
            )
        return disp

    @classmethod
    @transaction.atomic
    def confirm_required(
        cls,
        case: ComplianceCase,
        requirement_id_code: str,
        reviewer_user=None,
        reason: str = "Confirmed operational requirement by Compliance Officer.",
    ) -> CaseRequirementDisposition:
        """Mark a requirement as CONFIRMED_REQUIRED by administrative decision."""
        cls._validate_reviewer(reviewer_user)
        case = ComplianceCase.objects.select_for_update().get(pk=case.pk)
        disp = cls.get_or_create_disposition(case, requirement_id_code)
        previous = {"admin_disposition": disp.admin_disposition, "reason": disp.reason, "user_action_required": disp.user_action_required}
        disp.admin_disposition = AdminDisposition.CONFIRMED_REQUIRED
        disp.reviewer = reviewer_user
        disp.reason = reason or "Confirmed operational requirement by Compliance Officer."
        disp.user_visible = True
        disp.user_action_required = True
        disp.save(update_fields=["admin_disposition", "reviewer", "reason", "user_visible", "user_action_required", "updated_at"])

        # Audit
        cls._record_audit(case, disp, "CONFIRM_REQUIRED", reviewer_user, reason, previous=previous)
        logger.info("Requirement %s on case %s confirmed by %s", requirement_id_code, case.case_number, reviewer_user)
        return disp

    @classmethod
    @transaction.atomic
    def mark_not_required(
        cls,
        case: ComplianceCase,
        requirement_id_code: str,
        reviewer_user=None,
        reason: str = "",
    ) -> CaseRequirementDisposition:
        """Mark a requirement as NOT_REQUIRED with mandatory operational/legal rationale (§11, §12, §14, §40).

        CRITICAL: Does NOT alter original rule applicability in original_applicability_status!
        """
        if not reason or not reason.strip():
            raise DispositionValidationError("A clear, substantive reason is mandatory when marking a requirement as NOT_REQUIRED.")

        cls._validate_reviewer(reviewer_user)
        case = ComplianceCase.objects.select_for_update().get(pk=case.pk)
        disp = cls.get_or_create_disposition(case, requirement_id_code)
        previous = {"admin_disposition": disp.admin_disposition, "reason": disp.reason, "user_action_required": disp.user_action_required}
        disp.admin_disposition = AdminDisposition.NOT_REQUIRED
        disp.reviewer = reviewer_user
        disp.reason = reason.strip()
        disp.user_action_required = False
        disp.save(update_fields=["admin_disposition", "reviewer", "reason", "user_action_required", "updated_at"])

        # Audit
        cls._record_audit(case, disp, "MARK_NOT_REQUIRED", reviewer_user, reason, previous=previous)
        logger.info("Requirement %s on case %s marked NOT_REQUIRED by %s. Reason: %s", requirement_id_code, case.case_number, reviewer_user, reason)
        return disp

    @classmethod
    @transaction.atomic
    def add_catalog_requirement(
        cls,
        case: ComplianceCase,
        requirement_id_code: str,
        reviewer_user=None,
        reason: str = "Manually assigned by compliance officer from regulatory catalog.",
        evidence_refs: list[str] | None = None,
    ) -> CaseRequirementDisposition:
        """Admin attaches an additional compliance requirement to a case from the catalog (§15, §16)."""
        cls._validate_reviewer(reviewer_user)
        case = ComplianceCase.objects.select_for_update().get(pk=case.pk)
        req_def = RequirementDefinition.objects.filter(requirement_id=requirement_id_code).first()
        if not req_def:
            raise DispositionValidationError("Select an existing requirement from the catalogue.")
        disp, created = CaseRequirementDisposition.objects.get_or_create(
            case=case,
            requirement_id_code=requirement_id_code,
            defaults={
                "requirement": req_def,
                "original_applicability_status": "NOT_IDENTIFIED_BY_SYSTEM",
                "admin_disposition": AdminDisposition.CONFIRMED_REQUIRED,
                "source": "ADMIN_ASSIGNED",
                "reason": reason,
                "reviewer": reviewer_user,
                "evidence_refs": evidence_refs or [],
                "user_visible": True,
                "user_action_required": True,
            },
        )
        if not created:
            disp.admin_disposition = AdminDisposition.CONFIRMED_REQUIRED
            disp.source = "ADMIN_ASSIGNED"
            disp.reason = reason
            disp.reviewer = reviewer_user
            disp.user_visible = True
            disp.user_action_required = True
            disp.save(update_fields=["admin_disposition", "source", "reason", "reviewer", "user_visible", "user_action_required", "updated_at"])

        cls._record_audit(case, disp, "ADMIN_ASSIGN_REQUIREMENT", reviewer_user, reason)
        logger.info("Requirement %s added to case %s by %s", requirement_id_code, case.case_number, reviewer_user)
        return disp

    @classmethod
    def _record_audit(
        cls,
        case: ComplianceCase,
        disp: CaseRequirementDisposition,
        action: str,
        actor_user,
        reason: str,
        previous: dict | None = None,
    ) -> None:
        """Log audit trail in SecurityAuditEvent and WorkflowEvent."""
        SecurityAuditEvent.objects.create(
            actor_user=actor_user,
            actor_type=ActorType.ADMIN if (actor_user and getattr(actor_user, "is_compliance_officer", False)) else ActorType.USER,
            action=action,
            resource_type="CaseRequirementDisposition",
            resource_id=str(disp.id),
            metadata={
                "before": previous,
                "after": {"admin_disposition": disp.admin_disposition, "reason": disp.reason, "user_action_required": disp.user_action_required},
                "case_number": case.case_number,
                "requirement_id_code": disp.requirement_id_code,
                "admin_disposition": disp.admin_disposition,
                "original_applicability": disp.original_applicability_status,
                "reason": reason,
            },
        )
        WorkflowEvent.objects.create(
            compliance_case=case,
            workflow_instance=case.current_workflow_instance,
            from_step=case.current_workflow_instance.current_step if case.current_workflow_instance else None,
            to_step=case.current_workflow_instance.current_step if case.current_workflow_instance else None,
            event_code=f"DISPOSITION_{action}",
            actor_type=ActorType.ADMIN,
            actor_user=actor_user,
            payload={
                "requirement_id_code": disp.requirement_id_code,
                "admin_disposition": disp.admin_disposition,
                "reason": reason,
            },
            notes=f"Compliance Requirement Treatment: {disp.requirement_id_code} -> {disp.admin_disposition}. Rationale: {reason}",
        )

    @staticmethod
    def _validate_reviewer(user):
        if not user or not user.is_authenticated or not user.is_compliance_officer:
            raise DispositionValidationError("A compliance reviewer is required.")
