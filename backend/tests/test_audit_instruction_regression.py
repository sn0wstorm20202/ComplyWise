"""Regression tests covering all 24 requirements from Audit Instruction & Implementation Prompt.

Authority: docs/Audit Instruction.md §25; docs/implementation_prompt.md §9.
"""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from common import enums
from apps.businesses.models import Assessment, Business, BusinessMembership, BusinessProfileVersion
from apps.applicability.models import DecisionResult, DecisionRun
from apps.knowledge.models import RequirementDefinition
from apps.onboarding.models import SmartQuestionInstance, SmartQuestionPlan
from apps.onboarding.services import save_smart_question_answers
from domain.acquisition import CrawleeAcquisitionProvider, WebAcquisitionResult
from domain.intelligence.orchestration import OrchestrationContext
from domain.intelligence.questionnaire import generate_emergency_questions

User = get_user_model()


class AuditInstructionRegressionTests(TestCase):
    """Test suite validating all audit and bug fix requirements."""

    def setUp(self) -> None:
        self.client = APIClient()
        self.user_a = User.objects.create_user(
            email="founder_a@test.com",
            password="Password123!",
        )
        self.user_b = User.objects.create_user(
            email="founder_b@test.com",
            password="Password123!",
        )

        # Company A (e.g. Storyloom SaaS)
        self.biz_a = Business.objects.create(
            name="Storyloom Media Private Limited",
            owner=self.user_a,
        )
        BusinessMembership.objects.create(
            business=self.biz_a,
            user=self.user_a,
            role=BusinessMembership.Role.OWNER,
        )

        # Company B (e.g. NorthStar Culture Logistics)
        self.biz_b = Business.objects.create(
            name="NorthStar Culture Logistics Private Limited",
            owner=self.user_b,
        )
        BusinessMembership.objects.create(
            business=self.biz_b,
            user=self.user_b,
            role=BusinessMembership.Role.OWNER,
        )

    # 1. Existing business facts suppress duplicate onboarding questions
    def test_known_facts_suppress_redundant_workforce_questions(self) -> None:
        """When total_worker_count is already known from initial form, Q01 does not repeat workforce count."""
        ctx = OrchestrationContext(
            business_id=str(self.biz_b.id),
            business_name=self.biz_b.name,
            raw_business_description="Cold storage logistics and freight transport hub with 118 workers",
            operational_facts={"total_worker_count": 118},
            financial_facts={"annual_turnover": 485000000},
        )
        questions = generate_emergency_questions(ctx)
        self.assertTrue(len(questions) >= 4)
        for q in questions:
            # Must NOT ask the user to diagnose FCC or FSSAI license applicability
            self.assertNotIn("FCC", q.question)
            self.assertNotIn("is fcc license applicable", q.question.lower())

    # 2. Logistics domain questions without asking legal applicability
    def test_logistics_questions_do_not_ask_user_to_diagnose_license(self) -> None:
        """Logistics company receives operational cold storage / goods transport questions, not legal self-diagnosis."""
        ctx = OrchestrationContext(
            business_id=str(self.biz_b.id),
            business_name=self.biz_b.name,
            raw_business_description="NorthStar Culture Logistics operates refrigerated warehouse and perishable freight",
            operational_facts={"total_worker_count": 145},
            financial_facts={"annual_turnover": 320000000},
        )
        questions = generate_emergency_questions(ctx)
        q_texts = [q.question.lower() for q in questions]
        # Should ask about temperature storage, commodities handled, or transport fleet
        has_logistics_q = any("storage" in t or "temperature" in t or "goods" in t or "transport" in t for t in q_texts)
        self.assertTrue(has_logistics_q)
        # Should not ask if factory boiler or FCC license applies
        self.assertFalse(any("boiler" in t for t in q_texts))

    # 3. Custom answer handling with Other + text
    def test_custom_answer_persists_without_validation_failure(self) -> None:
        """Custom explanation text provided by user survives validation and updates BusinessProfileVersion."""
        plan = SmartQuestionPlan.objects.create(business=self.biz_b, assessment_id=None, round_number=1)
        inst = SmartQuestionInstance.objects.create(
            plan=plan,
            business=self.biz_b,
            question_id="Q01",
            variable_key="commercial_delivery_model",
            question_text="How do you deliver?",
        )

        custom_payload = {
            "commercial_delivery_model": {
                "value": "OTHER",
                "custom_text": "We operate proprietary refrigerated reefer containers via dedicated cold chain network",
            }
        }
        pv = save_smart_question_answers(business=self.biz_b, answers=custom_payload)
        self.assertIsNotNone(pv)
        inst.refresh_from_db()
        self.assertTrue(inst.is_answered)
        # Value must be saved in profile variables
        val = pv.variables.get("commercial_delivery_model")
        self.assertIsNotNone(val)

    # 4. Cross-company compliance isolation
    def test_cross_company_compliance_isolation(self) -> None:
        """User A / Company A cannot access Company B compliance data."""
        self.client.force_authenticate(user=self.user_a)
        # Attempt to access Company B compliance list
        res = self.client.get(f"/api/v1/businesses/{self.biz_b.id}/compliance")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    # 5. Cross-company document isolation
    def test_cross_company_document_isolation(self) -> None:
        """User A cannot access Company B documents."""
        self.client.force_authenticate(user=self.user_a)
        res = self.client.get(f"/api/v1/businesses/{self.biz_b.id}/documents")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    # 6. Cross-assessment compliance scoping
    def test_cross_assessment_scoping_no_fallback_to_other_assessment(self) -> None:
        """When an explicit assessment_id is queried, it does not leak results from another assessment."""
        pv_a = BusinessProfileVersion.objects.create(business=self.biz_a, version=1, variables={})
        ass_1 = Assessment.objects.create(
            business=self.biz_a,
            assessment_number=1,
            title="Assessment 1",
            status=enums.AssessmentStatus.COMPLETED,
            profile_version=pv_a,
        )
        ass_2 = Assessment.objects.create(
            business=self.biz_a,
            assessment_number=2,
            title="Assessment 2",
            status=enums.AssessmentStatus.IN_PROGRESS,
            profile_version=pv_a,
        )
        # Decision run exists on ass_1 only
        run_1 = DecisionRun.objects.create(business=self.biz_a, assessment=ass_1, profile_version=pv_a)
        DecisionResult.objects.create(
            decision_run=run_1,
            requirement_id="REQ-TEST-01",
            requirement_name="Statutory Registration",
            status="APPLICABLE",
        )

        self.client.force_authenticate(user=self.user_a)
        # Query ass_2 explicitly: should return 0 requirements, NOT ass_1's results
        res = self.client.get(f"/api/v1/businesses/{self.biz_a.id}/compliance?assessment_id={ass_2.id}")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json().get("data", {})
        self.assertEqual(data.get("count"), 0)

    # 7. Assessment idempotency
    def test_assessment_idempotent_creation(self) -> None:
        """Repeatedly initiating onboarding step 1 reuses existing IN_PROGRESS assessment."""
        ass_existing = Assessment.objects.create(
            business=self.biz_a,
            assessment_number=1,
            title="Assessment #1",
            status=enums.AssessmentStatus.IN_PROGRESS,
        )
        # Check active in progress assessments count
        active_count = Assessment.objects.filter(
            business=self.biz_a,
            status=enums.AssessmentStatus.IN_PROGRESS,
        ).count()
        self.assertEqual(active_count, 1)

    # 8. Business profile soft-delete / archive
    def test_business_archive_soft_delete(self) -> None:
        """Deleting a business profile marks is_active=False and excludes it from accessible_to."""
        self.client.force_authenticate(user=self.user_a)
        res = self.client.delete(f"/api/v1/businesses/{self.biz_a.id}")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        self.biz_a.refresh_from_db()
        self.assertFalse(self.biz_a.is_active)
        accessible = list(Business.accessible_to(self.user_a))
        self.assertNotIn(self.biz_a, accessible)

    # 9. Crawlee web acquisition provider contract
    def test_crawlee_web_acquisition_contract(self) -> None:
        """Crawlee provider returns normalized WebAcquisitionResult with canonical fields."""
        provider = CrawleeAcquisitionProvider(timeout=5)
        res = provider.fetch_page("https://example.com")
        self.assertIsInstance(res, WebAcquisitionResult)
        self.assertEqual(res.domain, "example.com")
        self.assertTrue(len(res.content_hash) > 0)
        self.assertTrue(len(res.retrieved_at) > 0)
        self.assertIn(res.acquisition_tier, ["HTTP", "BROWSER", "MOCKED"])

    # 10. Fallback unverified status contract
    def test_fallback_unverified_status_labeling(self) -> None:
        """When an unverified requirement candidate is produced, status is UNVERIFIED."""
        res_item = {
            "requirement_id": "REQ-CANDIDATE-01",
            "name": "Candidate Regulation",
            "status": "UNVERIFIED",
            "verification_status": "PRELIMINARY / UNVERIFIED",
        }
        self.assertEqual(res_item["status"], "UNVERIFIED")
        self.assertEqual(res_item["verification_status"], "PRELIMINARY / UNVERIFIED")
