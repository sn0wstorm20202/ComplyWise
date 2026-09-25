"""Comprehensive unit and integration tests for Compliance Cases and Generic Workflow Engine.

Authority: Architectural Specification §1-§40.
Verifies:
1. Zero Hardcoding: GenericWorkflowEngine executes purely configuration-driven transitions.
2. Case Factory: Instantiates ComplianceCases, WorkflowInstances, and DocumentRequirements from APPLICABLE decisions.
3. Document Versioning & AI Precheck: Never overwrites v1; produces immutable submissions and AI precheck reviews.
4. Human Review & Correction Loop: Officer queries transition case to ACTION_REQUIRED; user resubmission returns to HUMAN_REVIEW.
5. Form submission & external portal status tracking.
6. Status Contract Parity between backend enums and frontend TypeScript types.
"""

from __future__ import annotations

import re
from pathlib import Path
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.utils import timezone

from common import enums
from apps.applicability.models import DecisionResult, DecisionRun
from apps.businesses.models import Business, BusinessProfileVersion
from apps.documents.models import (
    DocumentRequirement,
    DocumentReview,
    DocumentSubmission,
)
from apps.documents.services.precheck import process_document_upload
from apps.knowledge.models import RequirementDefinition
from apps.workflows.engine import GenericWorkflowEngine, InvalidTransitionError
from apps.workflows.models import (
    ApplicationForm,
    ComplianceCase,
    ExternalApplicationStatus,
    FormSubmission,
    WorkflowDefinition,
    WorkflowDefinitionVersion,
    WorkflowEvent,
    WorkflowInstance,
    WorkflowStepDefinition,
    WorkflowTransitionDefinition,
)
from apps.workflows.seed import DEFAULT_WORKFLOW_CODE, ensure_default_workflow_definition
from apps.workflows.services.case_factory import generate_compliance_cases_for_business

User = get_user_model()
FRONTEND_TYPES_PATH = Path(__file__).resolve().parent.parent.parent / "frontend" / "types" / "index.ts"


class ComplianceWorkflowsTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="testuser@example.com",
            password="securepassword123",
            full_name="Compliance Test User",
        )
        self.officer = User.objects.create_user(
            email="officer@example.com",
            password="securepassword123",
            full_name="Compliance Officer",
            is_staff=True,
        )
        self.business = Business.objects.create(
            name="Alpha Clean Foods Pvt Ltd",
            owner=self.user,
        )
        self.profile_version = BusinessProfileVersion.objects.create(
            business=self.business,
            version=1,
            variables={"industry": {"value": "FOOD_PROCESSING", "origin": "USER_PROVIDED"}},
            created_by=self.user,
        )
        self.req_def = RequirementDefinition.objects.create(
            requirement_id="FSSAI_CENTRAL_LICENSE",
            name="FSSAI Central Manufacturing License",
            category="LICENCE",
            authority="FSSAI",
            jurisdiction="CENTRAL",
            domain="FOOD",
            status=enums.KnowledgeStatus.PUBLISHED,
            metadata={
                "documents": [
                    "Blueprint Layout of Processing Facility",
                    "Water Potability IS 10500 Test Report",
                ],
                "portal": "FoSCoS",
            },
        )
        self.decision_run = DecisionRun.objects.create(
            business=self.business,
            profile_version=self.profile_version,
            status=enums.DecisionRunStatus.COMPLETED,
        )
        self.decision_result = DecisionResult.objects.create(
            decision_run=self.decision_run,
            requirement_id="FSSAI_CENTRAL_LICENSE",
            requirement_name="FSSAI Central Manufacturing License",
            status=enums.ApplicabilityStatus.APPLICABLE,
        )

    def test_default_workflow_seeding(self):
        """Workflow definition and step definitions must be seeded with full configuration graph."""
        version = ensure_default_workflow_definition()
        self.assertIsNotNone(version)
        self.assertEqual(version.workflow_definition.code, DEFAULT_WORKFLOW_CODE)
        self.assertEqual(version.version_number, 1)

        step_codes = list(version.step_definitions.values_list("code", flat=True))
        expected_steps = [
            "DOCUMENT_COLLECTION",
            "DOCUMENT_REVIEW",
            "HUMAN_REVIEW",
            "FORM_PREPARATION",
            "EXTERNAL_PROCESSING",
            "COMPLETION",
        ]
        for exp in expected_steps:
            self.assertIn(exp, step_codes)

        self.assertTrue(version.transition_definitions.count() >= 10)

    def test_case_factory_creates_case_from_applicable_results(self):
        """Case factory creates central ComplianceCase and document requirements when requirement is APPLICABLE."""
        cases = generate_compliance_cases_for_business(self.business)
        self.assertEqual(len(cases), 1)

        case = cases[0]
        self.assertTrue(case.case_number.startswith("CASE-"))
        self.assertEqual(case.business, self.business)
        self.assertEqual(case.requirement_id_code, "FSSAI_CENTRAL_LICENSE")
        self.assertEqual(case.status_code, enums.CaseStatus.OPEN)

        # Active workflow instance started at step 1
        instance = case.current_workflow_instance
        self.assertIsNotNone(instance)
        self.assertEqual(instance.current_step.code, "DOCUMENT_COLLECTION")

        # Document requirements populated
        doc_reqs = case.document_requirements.all()
        self.assertTrue(doc_reqs.count() >= 2)

        # Initial audit event recorded
        events = case.events.all()
        self.assertEqual(events.count(), 1)
        self.assertEqual(events.first().event_code, "CASE_OPENED")

    def test_generic_workflow_engine_full_lifecycle(self):
        """Test complete progression through document upload, review, queries, form, and portal approval."""
        cases = generate_compliance_cases_for_business(self.business)
        case = cases[0]
        self.assertEqual(case.current_workflow_instance.current_step.code, "DOCUMENT_COLLECTION")

        # 1. User uploads documents -> DOCUMENTS_UPLOADED -> DOCUMENT_REVIEW
        target_step, event = GenericWorkflowEngine.trigger_transition(
            compliance_case=case,
            event_code="DOCUMENTS_UPLOADED",
            actor_type=enums.ActorType.USER,
            actor_user=self.user,
        )
        self.assertEqual(target_step.code, "DOCUMENT_REVIEW")
        case.refresh_from_db()
        self.assertEqual(case.current_workflow_instance.current_step.code, "DOCUMENT_REVIEW")

        # 2. AI Precheck Passes -> AI_PRECHECK_PASSED -> HUMAN_REVIEW
        target_step, event = GenericWorkflowEngine.trigger_transition(
            compliance_case=case,
            event_code="AI_PRECHECK_PASSED",
            actor_type=enums.ActorType.SYSTEM,
        )
        self.assertEqual(target_step.code, "HUMAN_REVIEW")
        case.refresh_from_db()
        self.assertEqual(case.status_code, enums.CaseStatus.HUMAN_REVIEW)

        # 3. Compliance Officer raises a query -> QUERY_RAISED -> DOCUMENT_COLLECTION (ACTION_REQUIRED)
        target_step, event = GenericWorkflowEngine.trigger_transition(
            compliance_case=case,
            event_code="QUERY_RAISED",
            actor_type=enums.ActorType.ADMIN,
            actor_user=self.officer,
            payload={"comments": "Premises blueprint missing structural engineer seal."},
        )
        self.assertEqual(target_step.code, "DOCUMENT_COLLECTION")
        case.refresh_from_db()
        self.assertEqual(case.status_code, enums.CaseStatus.ACTION_REQUIRED)

        # 4. User corrects and resubmits -> QUERY_RESUBMITTED -> HUMAN_REVIEW
        target_step, event = GenericWorkflowEngine.trigger_transition(
            compliance_case=case,
            event_code="QUERY_RESUBMITTED",
            actor_type=enums.ActorType.USER,
            actor_user=self.user,
            payload={"note": "Uploaded revised sealed blueprint."},
        )
        self.assertEqual(target_step.code, "HUMAN_REVIEW")
        case.refresh_from_db()
        self.assertEqual(case.status_code, enums.CaseStatus.HUMAN_REVIEW)

        # 5. Compliance Officer approves -> REVIEW_APPROVED -> FORM_PREPARATION
        target_step, event = GenericWorkflowEngine.trigger_transition(
            compliance_case=case,
            event_code="REVIEW_APPROVED",
            actor_type=enums.ActorType.ADMIN,
            actor_user=self.officer,
        )
        self.assertEqual(target_step.code, "FORM_PREPARATION")

        # 6. Form Submitted -> FORM_SUBMITTED -> EXTERNAL_PROCESSING
        target_step, event = GenericWorkflowEngine.trigger_transition(
            compliance_case=case,
            event_code="FORM_SUBMITTED",
            actor_type=enums.ActorType.USER,
            actor_user=self.user,
            payload={"form_code": "STANDARD_REGULATORY_APPLICATION"},
        )
        self.assertEqual(target_step.code, "EXTERNAL_PROCESSING")
        case.refresh_from_db()
        self.assertEqual(case.status_code, enums.CaseStatus.EXTERNAL_PROCESSING)

        # 7. External Government Portal Approves -> PORTAL_APPROVED -> COMPLETION
        target_step, event = GenericWorkflowEngine.trigger_transition(
            compliance_case=case,
            event_code="PORTAL_APPROVED",
            actor_type=enums.ActorType.EXTERNAL,
            payload={"license_no": "FSSAI-11223344556677"},
        )
        self.assertEqual(target_step.code, "COMPLETION")
        case.refresh_from_db()
        self.assertEqual(case.status_code, enums.CaseStatus.COMPLETED)
        self.assertIsNotNone(case.completed_at)

        # Verify audit trail has recorded every event
        self.assertEqual(case.events.count(), 8)

    def test_portal_rejection_leads_to_rejected_status(self):
        """Authority: Architectural Specification §45.

        EXTERNAL_PROCESSING --PORTAL_REJECTED--> REJECTION
        Must not be modeled as completion.
        """
        cases = generate_compliance_cases_for_business(self.business)
        case = cases[0]

        # Fast forward case to EXTERNAL_PROCESSING
        GenericWorkflowEngine.trigger_transition(compliance_case=case, event_code="DOCUMENTS_UPLOADED")
        GenericWorkflowEngine.trigger_transition(compliance_case=case, event_code="AI_PRECHECK_PASSED")
        GenericWorkflowEngine.trigger_transition(compliance_case=case, event_code="REVIEW_APPROVED", actor_type=enums.ActorType.ADMIN)
        GenericWorkflowEngine.trigger_transition(compliance_case=case, event_code="FORM_SUBMITTED", actor_type=enums.ActorType.USER)

        case.refresh_from_db()
        self.assertEqual(case.current_workflow_instance.current_step.code, "EXTERNAL_PROCESSING")

        # Trigger PORTAL_REJECTED
        target_step, event = GenericWorkflowEngine.trigger_transition(
            compliance_case=case,
            event_code="PORTAL_REJECTED",
            actor_type=enums.ActorType.EXTERNAL,
            payload={"reason": "Water test report failed permissible nitrate levels."},
        )
        self.assertEqual(target_step.code, "REJECTION")
        case.refresh_from_db()
        self.assertEqual(case.status_code, enums.CaseStatus.REJECTED)
        self.assertIsNotNone(case.closed_at)
        self.assertIsNone(case.completed_at)

    def test_review_service_and_context_aggregation(self):
        """Authority: Architectural Specification §8, §12, §13, §41, §42.

        Tests ReviewTask, ReviewService scrutiny decisions, business context, and 'What must I do' task.
        """
        from apps.workflows.services.case_service import CaseService
        from apps.workflows.services.review_service import ReviewService

        cases = generate_compliance_cases_for_business(self.business)
        case = cases[0]

        # 1. Test CaseService business context derivation
        context = CaseService.get_business_context(case)
        self.assertEqual(context["business_name"], self.business.name)
        self.assertIn("workers", context)
        self.assertIn("power_load", context)

        # 2. Test initial user task
        task = CaseService.get_current_user_task(case)
        self.assertEqual(task["action_type"], "UPLOAD_DOCUMENT")
        self.assertTrue(task["is_action_required"])

        # 3. Advance to HUMAN_REVIEW
        GenericWorkflowEngine.trigger_transition(compliance_case=case, event_code="DOCUMENTS_UPLOADED")
        GenericWorkflowEngine.trigger_transition(compliance_case=case, event_code="AI_PRECHECK_PASSED")

        case.refresh_from_db()
        self.assertEqual(case.status_code, enums.CaseStatus.HUMAN_REVIEW)

        # Verify active ReviewTask was auto-created
        review_task = case.review_tasks.filter(status="PENDING").first()
        self.assertIsNotNone(review_task)

        # Test ReviewService assignment
        ReviewService.assign_review_task(
            case=case,
            admin_user=self.officer,
            priority="HIGH",
            action="CLAIM",
        )
        case.refresh_from_db()
        self.assertEqual(case.assigned_reviewer, self.officer)
        self.assertEqual(case.priority, "HIGH")

        # Test ReviewService execute human review: QUERY
        human_review, event = ReviewService.execute_human_review(
            case=case,
            reviewer_user=self.officer,
            decision="QUERY",
            reason="Facility blueprint requires fire marshal stamp.",
            required_action="Upload revised certified blueprint.",
        )
        case.refresh_from_db()
        self.assertEqual(case.status_code, enums.CaseStatus.ACTION_REQUIRED)
        self.assertEqual(human_review.decision, "QUERY")

        # Test user task now reflects ACTION_REQUIRED
        task_queried = CaseService.get_current_user_task(case)
        self.assertEqual(task_queried["action_type"], "CORRECT_DOCUMENT")
        self.assertTrue(task_queried["is_action_required"])
        self.assertIn("fire marshal", task_queried["description"])


    def test_document_versioning_and_ai_precheck(self):
        """Every upload must create a new immutable version without destroying earlier ones."""
        cases = generate_compliance_cases_for_business(self.business)
        case = cases[0]
        doc_req = case.document_requirements.first()
        self.assertIsNotNone(doc_req)

        # Upload v1
        dummy_content_v1 = b"%PDF-1.4 Statutory Document Water Potability IS 10500 Test Report Approved"
        sub1, rev1, ver1 = process_document_upload(
            document_requirement=doc_req,
            file_bytes=dummy_content_v1,
            file_name="water_test_v1.pdf",
            uploaded_by=self.user,
        )
        self.assertEqual(sub1.version_number, 1)
        self.assertEqual(doc_req.submissions.count(), 1)
        self.assertEqual(rev1.review_type, enums.ReviewType.AI_PRECHECK)

        # Upload v2 (correction resubmission)
        dummy_content_v2 = b"%PDF-1.4 Revised Statutory Document Water Potability IS 10500 Inspection Certified"
        sub2, rev2, ver2 = process_document_upload(
            document_requirement=doc_req,
            file_bytes=dummy_content_v2,
            file_name="water_test_v2.pdf",
            uploaded_by=self.user,
        )
        self.assertEqual(sub2.version_number, 2)
        self.assertEqual(doc_req.submissions.count(), 2)

        # Ensure v1 was never overwritten
        sub1.refresh_from_db()
        self.assertEqual(sub1.version_number, 1)
        self.assertEqual(sub1.file_name, "water_test_v1.pdf")

    def test_contract_parity_with_frontend_types(self):
        """Verify that every new status enum value is mirrored in frontend/types/index.ts."""
        self.assertTrue(FRONTEND_TYPES_PATH.exists(), "Frontend types file missing.")
        content = FRONTEND_TYPES_PATH.read_text(encoding="utf-8")

        enum_checks = [
            (enums.CaseStatus, "CaseStatus"),
            (enums.WorkflowStepType, "WorkflowStepType"),
            (enums.StepStatus, "StepStatus"),
            (enums.ActorType, "ActorType"),
            (enums.ReviewType, "ReviewType"),
            (enums.DocumentReviewStatus, "DocumentReviewStatus"),
            (enums.ExternalApplicationStatusEnum, "ExternalApplicationStatusEnum"),
            (enums.NotificationChannel, "NotificationChannel"),
            (enums.NotificationDeliveryStatus, "NotificationDeliveryStatus"),
        ]

        for enum_cls, ts_type in enum_checks:
            pattern = rf"export\s+type\s+{ts_type}\s*=\s*([^;]+);"
            match = re.search(pattern, content)
            self.assertIsNotNone(match, f"TypeScript type '{ts_type}' not found in frontend/types/index.ts")
            raw_union = match.group(1)
            ts_values = set(re.findall(r'"([^"]+)"', raw_union))
            backend_values = set(enum_cls.values)

            self.assertEqual(
                ts_values,
                backend_values,
                f"Contract mismatch in {ts_type}: Backend has {backend_values - ts_values}, Frontend has {ts_values - backend_values}",
            )
