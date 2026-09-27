"""Compliance Case Factory.

Authority: Architectural Specification §2, §3, §11, §14.
"The workflow system starts after applicability.
Business -> Profile -> Context -> Rule evaluation -> Requirement = APPLICABLE -> ComplianceCase."
"""

from __future__ import annotations

import logging
from typing import Any

from django.db import transaction
from django.utils import timezone

from common.enums import (
    ActorType,
    ApplicabilityStatus,
    CaseStatus,
    DocumentStatus,
    Priority,
    StepStatus,
    WorkflowStatus,
)
from apps.applicability.models import DecisionResult, DecisionRun
from apps.businesses.models import Assessment, Business
from apps.documents.models import DocumentRequirement
from apps.knowledge.models import RequirementDefinition
from apps.workflows.models import (
    ComplianceCase,
    WorkflowEvent,
    WorkflowInstance,
    WorkflowStepInstance,
)
from apps.workflows.seed import ensure_default_workflow_definition

logger = logging.getLogger(__name__)


@transaction.atomic
def generate_compliance_cases_for_business(
    business: Business,
    assessment: Assessment | None = None,
) -> list[ComplianceCase]:
    """Inspect latest applicability evaluation and ensure a ComplianceCase exists

    for every APPLICABLE requirement.
    """
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
        logger.info("No decision runs found for business %s; skipping case creation.", business.id)
        return []

    # Filter applicable results
    applicable_results = latest_run.results.filter(
        status__in=[ApplicabilityStatus.APPLICABLE, ApplicabilityStatus.NEEDS_INFORMATION]
    )

    wf_version = ensure_default_workflow_definition()
    step_1 = wf_version.step_definitions.filter(sequence=1).first()

    cases: list[ComplianceCase] = []

    for res in applicable_results:
        existing_case = ComplianceCase.objects.filter(
            business=business,
            requirement_id_code=res.requirement_id,
        ).first()

        if existing_case:
            cases.append(existing_case)
            continue

        req_def = RequirementDefinition.objects.filter(requirement_id=res.requirement_id).first()
        case_seq = ComplianceCase.objects.count() + 10001
        case_number = f"CASE-{case_seq}"

        priority_val = Priority.HIGH if (req_def and "LICENSE" in req_def.category.upper()) else Priority.MEDIUM

        new_case = ComplianceCase.objects.create(
            case_number=case_number,
            business=business,
            assessment=assessment,
            requirement=req_def,
            requirement_id_code=res.requirement_id,
            rule_version=res.rule_version,
            profile_version=latest_run.profile_version,
            workflow_definition=wf_version.workflow_definition,
            workflow_version=wf_version,
            status_code=CaseStatus.OPEN,
            priority=priority_val,
            opened_at=timezone.now(),
            metadata={
                "requirement_name": res.requirement_name,
                "authority": req_def.authority if req_def else "",
                "category": req_def.category if req_def else "",
            },
        )

        wf_instance = WorkflowInstance.objects.create(
            compliance_case=new_case,
            workflow_definition_version=wf_version,
            current_step=step_1,
            status_code=WorkflowStatus.IN_PROGRESS,
            started_at=timezone.now(),
            metadata={"case_number": case_number},
        )

        new_case.current_workflow_instance = wf_instance
        new_case.save(update_fields=["current_workflow_instance", "updated_at"])

        # Initial step instance
        step_inst = None
        if step_1:
            step_inst = WorkflowStepInstance.objects.create(
                workflow_instance=wf_instance,
                step_definition=step_1,
                status_code=StepStatus.IN_PROGRESS,
                started_at=timezone.now(),
            )

        # Populate DocumentRequirements for this case
        _populate_case_document_requirements(new_case, step_inst, req_def)

        # Initial audit event
        WorkflowEvent.objects.create(
            compliance_case=new_case,
            workflow_instance=wf_instance,
            from_step=None,
            to_step=step_1,
            event_code="CASE_OPENED",
            actor_type=ActorType.SYSTEM,
            payload={
                "requirement_id": res.requirement_id,
                "requirement_name": res.requirement_name,
                "decision_run_id": str(latest_run.id),
            },
            notes=f"Compliance case {case_number} initialized for applicable requirement {res.requirement_id}.",
        )

        cases.append(new_case)
        logger.info("Created compliance case %s for %s (%s)", case_number, business.name, res.requirement_id)

    return cases


def _populate_case_document_requirements(
    case: ComplianceCase,
    step_inst: WorkflowStepInstance | None,
    req_def: RequirementDefinition | None,
) -> None:
    """Derive initial DocumentRequirement rows from requirement definition metadata."""
    doc_specs: list[dict[str, Any]] = []

    if req_def and req_def.metadata:
        raw_docs = req_def.metadata.get("documents") or req_def.metadata.get("required_documents") or []
        for idx, doc in enumerate(raw_docs, start=1):
            if isinstance(doc, str):
                doc_specs.append({
                    "code": f"DOC_{case.requirement_id_code}_{idx}",
                    "name": doc,
                    "description": f"Mandatory evidence for {req_def.name}.",
                    "required": True,
                })
            elif isinstance(doc, dict):
                doc_specs.append({
                    "code": doc.get("code") or f"DOC_{case.requirement_id_code}_{idx}",
                    "name": doc.get("name") or doc.get("title") or f"Statutory Document {idx}",
                    "description": doc.get("description") or "",
                    "required": doc.get("required", True),
                })

    # Default statutory document requirements if none specified in knowledge pack
    if not doc_specs:
        req_name = req_def.name if req_def else case.requirement_id_code
        auth = req_def.authority if req_def else "Regulatory Authority"
        doc_specs = [
            {
                "code": f"DOC_{case.requirement_id_code}_IDENTITY",
                "name": f"Identity Proof & Entity Registration ({auth})",
                "description": f"Official proof of incorporation or business registration for {req_name}.",
                "required": True,
            },
            {
                "code": f"DOC_{case.requirement_id_code}_PREMISES",
                "name": "Premises Proof & Site Layout Blueprint",
                "description": "Proof of possession of premises (Lease agreement/ownership deed) and layout plan.",
                "required": True,
            },
            {
                "code": f"DOC_{case.requirement_id_code}_UNDERTAKING",
                "name": "Statutory Declaration & Compliance Undertaking",
                "description": f"Authorized signatory declaration conforming to {auth} regulatory guidelines.",
                "required": True,
            },
        ]

    for spec in doc_specs:
        DocumentRequirement.objects.get_or_create(
            case=case,
            document_type_code=spec["code"],
            defaults={
                "workflow_step_instance": step_inst,
                "name": spec["name"],
                "description": spec.get("description", ""),
                "required": spec.get("required", True),
                "status_code": DocumentStatus.NOT_UPLOADED,
                "configuration": {},
            },
        )
