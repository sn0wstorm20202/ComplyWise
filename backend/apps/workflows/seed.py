"""Workflow seed utility to ensure default workflow templates exist in the database.

Authority: Architectural Specification §5-§9.
"A completely new regulatory workflow should be addable through database/configuration
data without changing your workflow engine."
"""

from __future__ import annotations

import logging
from django.db import transaction
from django.utils import timezone

from common.enums import ActorType, WorkflowStepType
from apps.workflows.models import (
    ApplicationForm,
    WorkflowDefinition,
    WorkflowDefinitionVersion,
    WorkflowStepDefinition,
    WorkflowTransitionDefinition,
)

logger = logging.getLogger(__name__)

DEFAULT_WORKFLOW_CODE = "DOCUMENT_AND_APPLICATION_FLOW"


@transaction.atomic
def ensure_default_workflow_definition() -> WorkflowDefinitionVersion:
    """Ensure the standard regulatory application workflow definition and version 1 exist."""
    definition, _ = WorkflowDefinition.objects.get_or_create(
        code=DEFAULT_WORKFLOW_CODE,
        defaults={
            "name": "Standard Regulatory Application Workflow",
            "description": "Standard regulatory clearance workflow covering document collection, AI precheck, human review, form submission, and government tracking.",
            "scope": "REGULATORY",
            "is_active": True,
            "metadata": {
                "category": "UNIVERSAL",
                "authority_agnostic": True,
            },
        },
    )

    version, created = WorkflowDefinitionVersion.objects.get_or_create(
        workflow_definition=definition,
        version_number=1,
        defaults={
            "status": "PUBLISHED",
            "published_at": timezone.now(),
            "configuration": {
                "default_for_new_cases": True,
                "allow_resubmission": True,
            },
        },
    )

    if definition.current_version_id != version.id:
        definition.current_version = version
        definition.save(update_fields=["current_version", "updated_at"])

    # 1. Step Definitions
    steps_data = [
        (1, "DOCUMENT_COLLECTION", "Document Upload & Collection", WorkflowStepType.DOCUMENT_COLLECTION, "Upload all mandated statutory documents and evidence."),
        (2, "DOCUMENT_REVIEW", "AI Pre-Check & Document Review", WorkflowStepType.DOCUMENT_REVIEW, "Automated OCR extraction, format validation, and AI compliance precheck."),
        (3, "HUMAN_REVIEW", "Compliance Officer Verification", WorkflowStepType.HUMAN_REVIEW, "Internal platform expert oversight, verification, and query raising."),
        (4, "FORM_PREPARATION", "Statutory Form Preparation & Submission", WorkflowStepType.FORM_PREPARATION, "Complete and verify statutory filing details for official portal submission."),
        (5, "EXTERNAL_PROCESSING", "Government Portal Scrutiny & Approval", WorkflowStepType.EXTERNAL_PROCESSING, "Application submitted to official statutory authority portal; tracking processing status."),
        (6, "COMPLETION", "Compliance Secured & Active", WorkflowStepType.COMPLETION, "Final statutory clearance granted; certificate issued; renewal cycles scheduled."),
        (7, "REJECTION", "Application Rejected / Clearance Denied", WorkflowStepType.REJECTION, "Statutory clearance rejected or denied by regulatory authority or compliance review."),
    ]

    steps: dict[str, WorkflowStepDefinition] = {}
    for seq, code, name, step_type, desc in steps_data:
        step_obj, _ = WorkflowStepDefinition.objects.get_or_create(
            workflow_version=version,
            code=code,
            defaults={
                "name": name,
                "step_type": step_type,
                "sequence": seq,
                "description": desc,
                "is_required": True,
                "configuration": {},
            },
        )
        steps[code] = step_obj

    # 2. Transition Definitions (Directed Edges)
    # (from_code, to_code, event_code, actor_type, priority)
    transitions_data = [
        ("DOCUMENT_COLLECTION", "DOCUMENT_REVIEW", "DOCUMENTS_UPLOADED", ActorType.ANY, 10),
        ("DOCUMENT_REVIEW", "HUMAN_REVIEW", "AI_PRECHECK_PASSED", ActorType.SYSTEM, 20),
        ("DOCUMENT_REVIEW", "DOCUMENT_COLLECTION", "AI_PRECHECK_FAILED", ActorType.SYSTEM, 25),
        ("HUMAN_REVIEW", "FORM_PREPARATION", "REVIEW_APPROVED", ActorType.ADMIN, 30),
        ("HUMAN_REVIEW", "DOCUMENT_COLLECTION", "QUERY_RAISED", ActorType.ADMIN, 35),
        ("DOCUMENT_COLLECTION", "HUMAN_REVIEW", "QUERY_RESUBMITTED", ActorType.USER, 36),
        ("HUMAN_REVIEW", "REJECTION", "REVIEW_REJECTED", ActorType.ADMIN, 38),
        ("FORM_PREPARATION", "EXTERNAL_PROCESSING", "FORM_SUBMITTED", ActorType.ANY, 40),
        ("EXTERNAL_PROCESSING", "COMPLETION", "PORTAL_APPROVED", ActorType.ANY, 50),
        ("EXTERNAL_PROCESSING", "DOCUMENT_COLLECTION", "PORTAL_QUERY", ActorType.ANY, 55),
        ("EXTERNAL_PROCESSING", "REJECTION", "PORTAL_REJECTED", ActorType.ANY, 60),
    ]

    for from_c, to_c, event_code, actor_type, priority in transitions_data:
        WorkflowTransitionDefinition.objects.get_or_create(
            workflow_version=version,
            from_step=steps[from_c],
            to_step=steps[to_c],
            event_code=event_code,
            defaults={
                "allowed_actor_type": actor_type,
                "priority": priority,
                "condition": {},
            },
        )

    # 3. Default Application Form Specification
    ApplicationForm.objects.get_or_create(
        code="STANDARD_REGULATORY_APPLICATION",
        defaults={
            "name": "Standard Statutory Application Form",
            "description": "Standard regulatory filing declaration form.",
            "version": 1,
            "is_active": True,
            "schema": {
                "fields": [
                    {"name": "applicant_full_name", "type": "string", "label": "Authorized Signatory Name", "required": True},
                    {"name": "designation", "type": "string", "label": "Designation", "required": True},
                    {"name": "pan_number", "type": "string", "label": "PAN Number", "required": True},
                    {"name": "registered_address", "type": "string", "label": "Registered Premises Address", "required": True},
                    {"name": "declaration_confirmed", "type": "boolean", "label": "Statutory Truthfulness Declaration", "required": True},
                ]
            },
        },
    )

    logger.info("Default workflow definition %s v1 verified and ready.", DEFAULT_WORKFLOW_CODE)
    return version
