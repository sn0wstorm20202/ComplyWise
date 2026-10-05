"""End-to-end integration and architectural tests for the unified Compliance Lifecycle.

Authority: Architectural Specification & Implementation Mandate:
- ONE ComplianceCase shared between User and Admin portals
- Fix #1: PDF Document Viewing Pipeline (short-lived HMAC token, inline streaming)
- Fix #2: AI Document Pre-validation with structured findings & technical error decoupling
- Fix #3: Human Review & Query Feedback Loop (CaseQuery, resubmission)
- Fix #4: Admin Requirement Dispositions (statutory truth preserved, operational disposition)
- Deadlines & Multi-channel Alerting (in-app, email, Google Calendar, Outbox pattern)
- Optimistic Concurrency Control (concurrency_version conflict detection)
"""

from __future__ import annotations

import json
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from common import enums
from apps.applicability.models import DecisionResult, DecisionRun
from apps.businesses.models import Business, BusinessProfileVersion
from apps.calendar.models import Deadline
from apps.calendar.services import DeadlineService
from apps.documents.models import (
    DocumentRequirement,
    DocumentReview,
    DocumentSubmission,
)
from apps.documents.services.precheck import process_document_upload
from apps.documents.services.storage_service import DocumentStorageService
from apps.knowledge.models import RequirementDefinition
from apps.workflows.engine import GenericWorkflowEngine
from apps.workflows.models import (
    CaseQuery,
    CaseRequirementDisposition,
    ComplianceCase,
    OutboxEvent,
    SecurityAuditEvent,
    WorkflowEvent,
)
from apps.workflows.services.case_factory import generate_compliance_cases_for_business

User = get_user_model()


class ComplianceLifecycleTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Regular business owner user
        self.user = User.objects.create_user(
            email="business_owner@example.com",
            password="securepassword123",
            full_name="Rajesh Sharma",
        )

        # Compliance officer / Admin
        self.officer = User.objects.create_user(
            email="compliance_officer@complywise.in",
            password="officerpassword123",
            full_name="Officer Sunita Rao",
            is_staff=True,
            role="COMPLIANCE_OFFICER",
        )

        # Unrelated third-party user
        self.intruder = User.objects.create_user(
            email="intruder@example.com",
            password="intruderpassword123",
            full_name="Malicious Actor",
        )

        # Enterprise Business
        self.business = Business.objects.create(
            name="Apex Foods & Beverages Pvt Ltd",
            owner=self.user,
        )

        self.profile_version = BusinessProfileVersion.objects.create(
            business=self.business,
            version=1,
            variables={"industry": {"value": "FOOD_PROCESSING", "origin": "USER_PROVIDED"}},
            created_by=self.user,
        )

        # Statutory Requirement Definition
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
                    "Factory Layout Blueprint",
                    "Water Potability Test Report",
                ],
                "portal": "FoSCoS",
            },
        )

        # Statutory Applicability Run & Decision
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
            explanation_trace={"summary": "Food manufacturing unit with annual turnover above threshold."},
        )

        # Generate single compliance case
        cases = generate_compliance_cases_for_business(self.business)
        self.assertEqual(len(cases), 1)
        self.case = cases[0]

        # Get first document requirement
        self.doc_req = self.case.document_requirements.first()
        self.assertIsNotNone(self.doc_req)

    # ==================================================================
    # FIX #1: PDF DOCUMENT VIEWING & STREAMING PIPELINE
    # ==================================================================

    def test_document_storage_and_inline_streaming(self):
        """PDF documents must stream inline with Content-Disposition: inline and valid token verification."""
        pdf_content = b"%PDF-1.4 Mock PDF Content For Testing Compliance Viewing Engine"
        uploaded_file = SimpleUploadedFile(
            name="factory_layout_v1.pdf",
            content=pdf_content,
            content_type="application/pdf",
        )

        sub, review, _ = process_document_upload(
            document_requirement=self.doc_req,
            uploaded_file=uploaded_file,
            uploaded_by=self.user,
            extra_metadata={"notes": "Uploaded initial blueprint copy"},
        )

        self.assertIsNotNone(sub)
        self.assertEqual(sub.version_number, 1)
        self.assertEqual(sub.mime_type, "application/pdf")
        self.assertTrue(len(sub.checksum) == 64)

        # 1. Generate short-lived signed access URL
        signed_url = DocumentStorageService.generate_signed_access_url(sub)
        self.assertIsNotNone(signed_url)

        # 2. Officer views document inline via endpoint with signature
        self.client.force_authenticate(user=self.officer)
        response = self.client.get(signed_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.assertIn("inline", response["Content-Disposition"])
        self.assertIn("factory_layout_v1.pdf", response["Content-Disposition"])
        self.assertEqual(response.content, pdf_content)

        # 3. Document Metadata Endpoint check
        meta_res = self.client.get(f"/api/v1/documents/{sub.id}/metadata")
        self.assertEqual(meta_res.status_code, status.HTTP_200_OK)
        meta_json = meta_res.json()
        data = meta_json.get("data", meta_json)
        self.assertEqual(data["file_name"], "factory_layout_v1.pdf")
        self.assertEqual(data["version_number"], 1)
        self.assertEqual(data["checksum"], sub.checksum)
        self.assertIn("signed_url", data)

        # 4. Unauthorized intruder rejected
        self.client.force_authenticate(user=self.intruder)
        intruder_res = self.client.get(f"/api/v1/documents/{sub.id}/view")
        # Tenant-scoped lookup hides the existence of another business's file.
        self.assertEqual(intruder_res.status_code, status.HTTP_404_NOT_FOUND)

        # 5. Tampered / invalid HMAC signature rejected
        unauth_client = APIClient()
        invalid_res = unauth_client.get(f"/api/v1/documents/{sub.id}/view?sig=tampered_signature&exp=9999999999")
        self.assertEqual(invalid_res.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==================================================================
    # FIX #2: AI DOCUMENT PRE-VALIDATION & TECHNICAL ERROR DECOUPLING
    # ==================================================================

    def test_ai_precheck_structured_findings_generation(self):
        """AI Precheck must produce advisory structured findings without unilaterally rejecting the case."""
        dummy_content = b"Mock document content containing address and name details."
        uploaded_file = SimpleUploadedFile(
            name="premises_address_proof.pdf",
            content=dummy_content,
            content_type="application/pdf",
        )

        sub, review, _ = process_document_upload(
            document_requirement=self.doc_req,
            uploaded_file=uploaded_file,
            uploaded_by=self.user,
        )

        # DocumentReview should have structured advisory findings
        self.assertIsNotNone(review)
        self.assertIn(review.status, [enums.DocumentReviewStatus.PRECHECK_PASSED, enums.DocumentReviewStatus.PRECHECK_FAILED])

        # Findings must be list of dicts with structured fields
        self.assertIsInstance(review.findings, list)
        self.assertTrue(len(review.findings) > 0)
        finding = review.findings[0]
        self.assertIn("finding_code", finding)
        self.assertIn("severity", finding)
        self.assertIn("field", finding)
        self.assertIn("confidence", finding)

        # Case must NOT be rejected by AI alone
        self.case.refresh_from_db()
        self.assertNotEqual(self.case.status_code, enums.CaseStatus.REJECTED)

    # ==================================================================
    # FIX #3: HUMAN REVIEW & QUERY FEEDBACK LOOP
    # ==================================================================

    def test_case_query_feedback_loop_and_resubmission(self):
        """Admin query creates CaseQuery entity, moves case to ACTION_REQUIRED, user clarifies & resubmits."""
        # 1. User uploads document v1 (advances case to HUMAN_REVIEW automatically)
        pdf_v1 = SimpleUploadedFile("blueprint_v1.pdf", b"Version 1 PDF", "application/pdf")
        sub_v1, _, _ = process_document_upload(
            document_requirement=self.doc_req,
            uploaded_file=pdf_v1,
            uploaded_by=self.user,
        )

        self.case.refresh_from_db()
        self.assertEqual(self.case.status_code, enums.CaseStatus.HUMAN_REVIEW)

        # 2. Officer raises a formal clarification query
        self.client.force_authenticate(user=self.officer)
        query_payload = {
            "query_type": "DOCUMENT_CORRECTION",
            "submission_id": str(sub_v1.id),
            "severity": "HIGH",
            "reason": "Layout blueprint requires certified fire safety clearance seal.",
            "expectedWorkflowVersion": self.case.concurrency_version,
        }
        res = self.client.post(f"/api/v1/admin/cases/{self.case.id}/query", data=query_payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.case.refresh_from_db()
        self.assertEqual(self.case.status_code, enums.CaseStatus.ACTION_REQUIRED)

        # Verify CaseQuery entity created
        active_query = CaseQuery.objects.filter(case=self.case, status=enums.QueryStatus.OPEN).first()
        self.assertIsNotNone(active_query)
        self.assertEqual(active_query.severity, "HIGH")
        self.assertEqual(active_query.document_submission, sub_v1)

        # 3. User responds with clarification note
        self.client.force_authenticate(user=self.user)
        response_payload = {
            "response": "We have obtained the fire safety seal and attached the updated layout.",
        }
        resp_res = self.client.post(
            f"/api/v1/cases/{self.case.id}/respond-query",
            data=response_payload,
            format="json",
        )
        self.assertEqual(resp_res.status_code, status.HTTP_200_OK)

        # 4. User uploads corrected document v2
        pdf_v2 = SimpleUploadedFile("blueprint_v2_sealed.pdf", b"Version 2 PDF with Official Seal", "application/pdf")
        sub_v2, _, _ = process_document_upload(
            document_requirement=self.doc_req,
            uploaded_file=pdf_v2,
            uploaded_by=self.user,
        )
        self.assertEqual(sub_v2.version_number, 2)

        # 5. Case transitions back to HUMAN_REVIEW
        self.case.refresh_from_db()
        self.assertEqual(self.case.status_code, enums.CaseStatus.HUMAN_REVIEW)

        # Verify historical v1 remains intact
        self.assertEqual(self.doc_req.submissions.count(), 2)
        self.assertTrue(self.doc_req.submissions.filter(version_number=1).exists())
        self.assertTrue(self.doc_req.submissions.filter(version_number=2).exists())

    # ==================================================================
    # FIX #4: ADMIN REQUIREMENT DISPOSITION (PRESERVES REGULATORY TRUTH)
    # ==================================================================

    def test_admin_requirement_disposition_preserves_regulatory_truth(self):
        """Admin marking a requirement NOT_REQUIRED overrides operationally without altering statutory rule truth."""
        self.client.force_authenticate(user=self.officer)
        disp_payload = {
            "reason": "Business turnover qualifies for State license category instead of Central.",
            "exemption_category": "TURNOVER_THRESHOLD",
        }
        res = self.client.post(
            f"/api/v1/admin/cases/{self.case.id}/requirements/{self.req_def.requirement_id}/not-required",
            data=disp_payload,
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # 1. Operational disposition recorded
        disp = CaseRequirementDisposition.objects.get(case=self.case, requirement_id_code=self.req_def.requirement_id)
        self.assertEqual(disp.admin_disposition, enums.AdminDisposition.NOT_REQUIRED)
        self.assertEqual(disp.reviewer, self.officer)
        self.assertIn("State license category", disp.reason)

        # 2. Statutory DecisionResult remains unchanged (APPLICABLE)
        self.decision_result.refresh_from_db()
        self.assertEqual(self.decision_result.status, enums.ApplicabilityStatus.APPLICABLE)
        self.assertEqual(disp.original_applicability_status, enums.ApplicabilityStatus.APPLICABLE)

        # 3. Security Audit Event logged
        audit = SecurityAuditEvent.objects.filter(
            action="MARK_NOT_REQUIRED",
        ).first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.actor_user, self.officer)

    # ==================================================================
    # ADMIN CASE REVIEW PACKET
    # ==================================================================

    def test_admin_case_review_packet_delivery(self):
        """Admin review packet endpoint delivers comprehensive dossier for officer decision-making."""
        self.client.force_authenticate(user=self.officer)
        res = self.client.get(f"/api/v1/admin/cases/{self.case.id}/packet")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        packet_json = res.json()
        packet = packet_json.get("data", packet_json)

        self.assertEqual(packet["case"]["id"], str(self.case.id))
        self.assertEqual(packet["case"]["case_number"], self.case.case_number)
        self.assertIn("concurrency_version", packet)
        self.assertIn("document_requirements", packet)
        self.assertIn("queries", packet)
        self.assertIn("dispositions", packet)
        self.assertIn("deadlines", packet)
        self.assertIn("security_audits", packet)

    # ==================================================================
    # DEADLINE SERVICE & MULTI-CHANNEL ALERTING
    # ==================================================================

    def test_deadline_service_and_multi_channel_alerting(self):
        """Compliance deadlines trigger in-app, email, calendar payloads, and durable outbox events."""
        due_date = timezone.now() + timezone.timedelta(days=7)
        deadline = DeadlineService.create_deadline(
            case=self.case,
            title="Submit Revised Factory Blueprint",
            due_at=due_date,
            source="OFFICER_REVIEW",
            priority="HIGH",
            created_by=self.officer,
        )

        self.assertIsNotNone(deadline)
        self.assertEqual(deadline.status, enums.DeadlineStatus.PENDING)
        self.assertEqual(deadline.metadata.get("alerts_sent_count", 0), 0)

        # Officer triggers immediate multi-channel alert
        self.client.force_authenticate(user=self.officer)
        res = self.client.post(f"/api/v1/admin/deadlines/{deadline.id}/send-alert")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        res_data = res.json()
        self.assertTrue(res_data.get("data", {}).get("result", {}).get("success", False))

        deadline.refresh_from_db()
        self.assertEqual(deadline.metadata.get("alerts_sent_count", 0), 1)
        self.assertIsNotNone(deadline.metadata.get("last_alert_sent_at"))

        # Verify durable OutboxEvent queued for reliable delivery
        outbox_event = OutboxEvent.objects.filter(
            event_type="DEADLINE_ALERT_DISPATCHED",
        ).first()
        self.assertIsNotNone(outbox_event)
        self.assertEqual(outbox_event.payload["deadline_id"], str(deadline.id))

    # ==================================================================
    # OPTIMISTIC CONCURRENCY PROTECTION
    # ==================================================================

    def test_optimistic_concurrency_conflict_detection(self):
        """Mismatched expectedWorkflowVersion returns 409 Conflict preventing parallel overwrite."""
        # Ensure case is at HUMAN_REVIEW step
        self.case.refresh_from_db()
        GenericWorkflowEngine.trigger_transition(
            compliance_case=self.case,
            event_code="DOCUMENTS_UPLOADED",
            actor_type=enums.ActorType.USER,
        )
        GenericWorkflowEngine.trigger_transition(
            compliance_case=self.case,
            event_code="AI_PRECHECK_PASSED",
            actor_type=enums.ActorType.SYSTEM,
        )
        self.case.refresh_from_db()
        self.assertEqual(self.case.status_code, enums.CaseStatus.HUMAN_REVIEW)

        self.client.force_authenticate(user=self.officer)
        stale_version = self.case.concurrency_version + 99

        approve_payload = {
            "comments": "Approved without review",
            "expectedWorkflowVersion": stale_version,
        }
        res = self.client.post(f"/api/v1/admin/cases/{self.case.id}/approve", data=approve_payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_409_CONFLICT)
        error_json = res.json()
        self.assertEqual(error_json.get("error", {}).get("code"), "CONCURRENCY_CONFLICT")

        # Now approve with correct version -> must succeed and advance to FORM_PREPARATION
        current_version = self.case.concurrency_version
        valid_payload = {
            "comments": "Properly scrutinized and approved.",
            "expectedWorkflowVersion": current_version,
        }
        success_res = self.client.post(f"/api/v1/admin/cases/{self.case.id}/approve", data=valid_payload, format="json")
        self.assertEqual(success_res.status_code, status.HTTP_200_OK)

        self.case.refresh_from_db()
        self.assertEqual(self.case.current_workflow_instance.current_step.code, "FORM_PREPARATION")
        self.assertTrue(self.case.concurrency_version > current_version)
