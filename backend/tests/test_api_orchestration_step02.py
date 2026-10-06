"""Unit and integration tests for API Orchestration Step 02.

Authority: Milestone Step 02 Specification (Acceptance Criteria A-V).

Covers:
1. Business understanding schema validation
2. Business understanding provider success
3. Business understanding provider failure / error mapping
4. Exactly 15 questions generated
5. Dynamic questions for different business profiles (laptop charger, cement, food, textile, electronics importer)
6. No duplicate question IDs
7. Answer-type validation & coercion
8. Questionnaire persistence in database
9. Repeated question-generation idempotency (0 additional LLM calls)
10. Answer validation and rejection of invalid values
11. Answer persistence
12. Structured answer interpretation
13. Explicit user fact precedence over LLM inference
14. Inferred fact provenance preservation
15. Malformed LLM response handling
16. Provider timeout handling
17. Provider 429 handling
18. Provider 503 handling
19. Deterministic emergency fallback
20. Tenant isolation across all new endpoints
21. Public response safety (zero leak of model/provider/strategy/prompts)
22. Verification that cement profile does NOT receive drinking water or dairy questions
"""

from __future__ import annotations

import json
from decimal import Decimal
from unittest.mock import MagicMock, patch
import uuid
import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.businesses.models import Assessment, Business, BusinessProfileVersion
from apps.onboarding.models import SmartQuestionInstance, SmartQuestionPlan
from domain.providers.base import CompletionResult, ProviderError, ProviderNotConfigured
from domain.intelligence.business_understanding import (
    BusinessUnderstandingEngine,
    BusinessUnderstandingResult,
    generate_emergency_business_understanding,
    validate_business_understanding_schema,
)
from domain.intelligence.context_merge import (
    ConfidenceLevel,
    EnrichedBusinessContext,
    FactSource,
    build_canonical_enriched_context,
    merge_facts_with_precedence,
)
from domain.intelligence.orchestration import (
    AssessmentOrchestrator,
    AssessmentRun,
    AssessmentStage,
    AssessmentStrategyType,
    OrchestrationContext,
    ProviderRateLimit,
    ProviderTimeout,
    ProviderUnavailable,
    StructuredOutputInvalid,
    assessment_orchestrator,
)
from domain.intelligence.questionnaire import (
    QuestionnaireEngine,
    SmartQuestion,
    generate_emergency_15_questions,
    validate_and_normalize_questions,
)
from domain.intelligence.answer_interpretation import (
    AnswerInterpreter,
    coerce_and_validate_answer,
)


@pytest.fixture
def auth_user(db):
    return User.objects.create_user(
        email="owner_s2@complywise.in",
        password="TestPassword123!",
        full_name="VoltPro Director",
    )


@pytest.fixture
def other_user(db):
    return User.objects.create_user(
        email="other_s2@complywise.in",
        password="TestPassword123!",
        full_name="Other Director",
    )


@pytest.fixture
def test_business(db, auth_user):
    biz = Business.objects.create(
        name="VoltPro Power Systems",
        owner=auth_user,
    )
    BusinessProfileVersion.objects.create(
        business=biz,
        version=1,
        variables={
            "legal_constitution": {"value": "PVT_LTD"},
            "state": {"value": "Maharashtra"},
            "district": {"value": "Pune"},
            "product_description": {"value": "Manufacturing 65W GaN fast chargers for laptops and smartphones"},
            "annual_turnover": {"value": "45000000"},
            "plant_machinery_investment": {"value": "8000000"},
        },
    )
    return biz


@pytest.fixture
def other_business(db, other_user):
    biz = Business.objects.create(
        name="Other Corp",
        owner=other_user,
    )
    return biz


@pytest.fixture
def auth_client(auth_user):
    client = APIClient()
    client.force_authenticate(user=auth_user)
    return client


# ===========================================================================
# 1. Business Understanding Schema & Engine Tests
# ===========================================================================

def test_business_understanding_schema_valid():
    """Valid business understanding schema parses cleanly into BusinessUnderstandingResult."""
    raw = {
        "business_type": "Manufacturing",
        "primary_activity": "Production of electronics and fast chargers",
        "products": ["65W Laptop Charger", "USB-C Cables"],
        "manufacturing_or_service": "MANUFACTURING",
        "market": "DOMESTIC_AND_EXPORT",
        "geography": {"state": "Maharashtra", "district": "Pune"},
        "trade_intent": "EXPORT_ONLY",
        "operational_characteristics": ["SMT assembly line", "Wave soldering"],
        "likely_regulatory_domains": ["BIS CRS", "SPCB CTE/CTO", "E-Waste EPR"],
        "important_unknowns": ["Sanctioned power load", "Contract worker count"],
        "normalized_facts": [{"key": "is_manufacturing", "value": True}],
    }
    res = validate_business_understanding_schema(raw)
    assert res.business_type == "Manufacturing"
    assert res.manufacturing_or_service == "MANUFACTURING"
    assert len(res.products) == 2
    assert "BIS CRS" in res.likely_regulatory_domains
    assert len(res.important_unknowns) == 2


def test_business_understanding_schema_invalid():
    """Non-dictionary input raises StructuredOutputInvalid."""
    with pytest.raises(StructuredOutputInvalid):
        validate_business_understanding_schema(["not", "a", "dict"])


@pytest.mark.django_db
def test_business_understanding_provider_success(test_business):
    """Mock LLM provider successfully returns structured business understanding."""
    context = OrchestrationContext.from_business(test_business)
    mock_payload = {
        "business_type": "Electronics Manufacturing",
        "primary_activity": "Design and assembly of GaN laptop power adapters",
        "products": ["65W Chargers"],
        "manufacturing_or_service": "MANUFACTURING",
        "market": "EXPORT",
        "geography": {"state": "Maharashtra", "district": "Pune"},
        "trade_intent": "EXPORT_ONLY",
        "operational_characteristics": ["High connected electrical load"],
        "likely_regulatory_domains": ["BIS Compulsory Registration", "SPCB Consent"],
        "important_unknowns": ["Connected load in HP", "Workforce count"],
        "normalized_facts": [],
    }

    mock_provider = MagicMock()
    mock_provider.complete.return_value = CompletionResult(
        text=json.dumps(mock_payload),
        provider="mock_llm",
        model="mock_model",
    )

    engine = BusinessUnderstandingEngine(provider=mock_provider)
    result = engine.analyze_business(context)

    assert result.business_type == "Electronics Manufacturing"
    assert result.trade_intent == "EXPORT_ONLY"
    assert "BIS Compulsory Registration" in result.likely_regulatory_domains


@pytest.mark.django_db
def test_business_understanding_provider_timeout_mapping(test_business):
    """Provider timeout is correctly mapped to ProviderTimeout error."""
    context = OrchestrationContext.from_business(test_business)
    mock_provider = MagicMock()
    mock_provider.complete.side_effect = ProviderError("Gateway Timeout 504")

    engine = BusinessUnderstandingEngine(provider=mock_provider)
    with pytest.raises(ProviderTimeout):
        engine.analyze_business(context)


@pytest.mark.django_db
def test_business_understanding_provider_rate_limit_mapping(test_business):
    """Provider 429 / rate limit is correctly mapped to ProviderRateLimit error."""
    context = OrchestrationContext.from_business(test_business)
    mock_provider = MagicMock()
    mock_provider.complete.side_effect = ProviderError("Rate limit exceeded 429")

    engine = BusinessUnderstandingEngine(provider=mock_provider)
    with pytest.raises(ProviderRateLimit):
        engine.analyze_business(context)


# ===========================================================================
# 2. 15-Question Generation Engine Tests
# ===========================================================================

def test_emergency_15_questions_count():
    """Emergency fallback always generates EXACTLY 15 questions."""
    ctx = OrchestrationContext(
        business_id=str(uuid.uuid4()),
        business_name="Acme Cement Corp",
        raw_business_description="Clinker grinding and portland cement manufacturing in Chandrapur",
    )
    questions = generate_emergency_15_questions(ctx)
    assert len(questions) == 15
    qids = [q.question_id for q in questions]
    assert len(set(qids)) == 15
    assert qids[0] == "Q01"
    assert qids[14] == "Q15"


def test_cement_profile_questions_no_food_or_dairy():
    """Cement profile MUST NOT receive food or drinking water questions."""
    ctx = OrchestrationContext(
        business_id=str(uuid.uuid4()),
        business_name="Vindhya Cement Works",
        raw_business_description="Portland Pozzolana Cement clinker grinding facility",
    )
    questions = generate_emergency_15_questions(ctx)
    assert len(questions) == 15

    all_texts = " ".join([q.question.lower() + " " + (q.help_text or "").lower() for q in questions])
    assert "fssai" not in all_texts
    assert "food" not in all_texts
    assert "dairy" not in all_texts
    assert "drinking water" not in all_texts

    # Must contain clinker or cement or emission specific questions
    assert "cement" in all_texts or "clinker" in all_texts or "limestone" in all_texts


def test_food_profile_questions_fssai():
    """Food profile receives food safety and capacity questions."""
    ctx = OrchestrationContext(
        business_id=str(uuid.uuid4()),
        business_name="NutriBite Snacks",
        raw_business_description="Dairy and processed snack food packaging in Nashik",
    )
    questions = generate_emergency_15_questions(ctx)
    assert len(questions) == 15
    all_texts = " ".join([q.question.lower() + " " + q.reason.lower() for q in questions])
    assert "fssai" in all_texts or "food" in all_texts


def test_textile_profile_questions_effluent():
    """Textile profile receives wet processing and effluent questions."""
    ctx = OrchestrationContext(
        business_id=str(uuid.uuid4()),
        business_name="Surat Dyeing Mills",
        raw_business_description="Textile fabric dyeing, bleaching, and garment manufacturing",
    )
    questions = generate_emergency_15_questions(ctx)
    assert len(questions) == 15
    all_texts = " ".join([q.question.lower() + " " + q.reason.lower() for q in questions])
    assert "dyeing" in all_texts or "textile" in all_texts or "water" in all_texts


def test_electronics_profile_questions_bis():
    """Electronics profile receives BIS CRS / power adapter questions."""
    ctx = OrchestrationContext(
        business_id=str(uuid.uuid4()),
        business_name="VoltMax Electronics",
        raw_business_description="Manufacturing 65W laptop chargers and power adapters",
    )
    questions = generate_emergency_15_questions(ctx)
    assert len(questions) == 15
    all_texts = " ".join([q.question.lower() + " " + q.reason.lower() for q in questions])
    assert "bis" in all_texts or "electronic" in all_texts or "charger" in all_texts


@pytest.mark.django_db
def test_questionnaire_persistence_and_idempotency(test_business, auth_user):
    """The compact decision-critical interview persists and reuses identical questions."""
    run = assessment_orchestrator.create_run(
        business=test_business,
        user=auth_user,
        strategy=AssessmentStrategyType.LLM_FIRST,
    )
    context = OrchestrationContext.from_business(test_business)

    engine = QuestionnaireEngine()
    q_list_1 = engine.generate_questionnaire(context, run)
    assert 1 <= len(q_list_1) <= 5

    # Verify DB persistence
    plan = SmartQuestionPlan.objects.filter(assessment=run.assessment).first()
    assert plan is not None
    assert plan.questions.count() == len(q_list_1)

    # Verify idempotency: second call returns the same compact questions without calling LLM
    with patch.object(engine, "get_provider") as mock_get_prov:
        q_list_2 = engine.generate_questionnaire(context, run)
        mock_get_prov.assert_not_called()
        assert len(q_list_2) == len(q_list_1)
        assert q_list_1[0].question_id == q_list_2[0].question_id


# ===========================================================================
# 3. Answer Validation, Persistence, & Interpretation Tests
# ===========================================================================

def test_coerce_and_validate_answers():
    """Answers are coerced properly across types."""
    assert coerce_and_validate_answer("BOOLEAN", "yes") is True
    assert coerce_and_validate_answer("BOOLEAN", "0") is False
    assert coerce_and_validate_answer("NUMBER", "125.5 HP") == 125.5
    assert coerce_and_validate_answer("NUMBER", "40") == 40
    assert coerce_and_validate_answer("PERCENTAGE", "30%") == 30

    with pytest.raises(StructuredOutputInvalid if hasattr(StructuredOutputInvalid, "code") else Exception):
        coerce_and_validate_answer("PERCENTAGE", "150%")


@pytest.mark.django_db
def test_answer_recording_without_llm(test_business, auth_user):
    """Recording an answer updates run state and DB with zero LLM calls."""
    run = assessment_orchestrator.create_run(
        business=test_business,
        user=auth_user,
        strategy=AssessmentStrategyType.LLM_FIRST,
    )
    context = OrchestrationContext.from_business(test_business)
    engine = QuestionnaireEngine()
    generated = engine.generate_questionnaire(context, run)
    question = next(q for q in generated if q.answer_type == "BOOLEAN")
    qid = question.question_id
    interpreter = AnswerInterpreter()
    res = interpreter.record_answer(run, qid, True)

    assert res["question_id"] == qid
    assert res["saved_value"] is True
    assert res["answered_count"] == 1
    assert res["is_complete"] is False

    # Check run stage metadata
    assert run.stage_metadata["answers"][qid] is True

    # Check SmartQuestionInstance
    inst = SmartQuestionInstance.objects.filter(plan__assessment=run.assessment, question_id=qid).first()
    assert inst is not None
    assert inst.is_answered is True
    assert inst.answer_value is True


def test_structured_answer_interpretation_facts():
    """Structured interpretation extracts canonical facts from answers."""
    questions = [
        {"question_id": "Q01", "question": "What is the total connected electrical load?", "category": "Facility"},
        {"question_id": "Q02", "question": "How many total employees work at the facility?", "category": "Workforce"},
        {"question_id": "Q09", "question": "What is the cross-border trade scope?", "category": "Trade"},
    ]
    answers = {
        "Q01": 80,
        "Q02": 45,
        "Q09": "EXPORT_ONLY",
    }
    interpreter = AnswerInterpreter()
    facts = interpreter.interpret_answers_to_facts(questions, answers)

    fact_dict = {f["key"]: f["value"] for f in facts}
    assert fact_dict.get("connected_power_load") == 80.0
    assert fact_dict.get("total_worker_count") == 45
    assert fact_dict.get("export_intent") is True
    assert fact_dict.get("trade_intent") == "EXPORT_ONLY"


# ===========================================================================
# 4. Context Merge & Fact Precedence Tests
# ===========================================================================

def test_fact_precedence_user_answer_overrides_inference():
    """Explicit USER_ANSWER overrides LLM_BUSINESS_UNDERSTANDING inference."""
    existing_facts = {
        "trade_intent": {"key": "trade_intent", "value": "DOMESTIC_ONLY", "source": "LLM_BUSINESS_UNDERSTANDING", "confidence": "INFERRED"},
        "connected_power_load": {"key": "connected_power_load", "value": 20, "source": "DERIVED_FACT", "confidence": "HIGH"},
    }
    incoming_facts = [
        {"key": "trade_intent", "value": "EXPORT_ONLY", "source": "USER_ANSWER", "confidence": "EXPLICIT"},
        {"key": "connected_power_load", "value": 100, "source": "USER_ANSWER", "confidence": "EXPLICIT"},
    ]

    # Convert existing to ProvenanceFact dict
    from domain.intelligence.context_merge import ProvenanceFact
    fact_pool = {k: ProvenanceFact(key=v["key"], value=v["value"], source=v["source"], confidence=v["confidence"]) for k, v in existing_facts.items()}

    merged = merge_facts_with_precedence(fact_pool, incoming_facts)
    assert merged["trade_intent"].value == "EXPORT_ONLY"
    assert merged["trade_intent"].source == FactSource.USER_ANSWER.value
    assert merged["trade_intent"].confidence == ConfidenceLevel.EXPLICIT.value
    assert merged["connected_power_load"].value == 100


def test_fact_precedence_inference_cannot_overwrite_user_answer():
    """LLM inference CANNOT overwrite an existing explicit USER_ANSWER."""
    from domain.intelligence.context_merge import ProvenanceFact
    fact_pool = {
        "connected_power_load": ProvenanceFact(key="connected_power_load", value=75, source=FactSource.USER_ANSWER.value, confidence=ConfidenceLevel.EXPLICIT.value)
    }
    incoming = [
        {"key": "connected_power_load", "value": 15, "source": FactSource.LLM_BUSINESS_UNDERSTANDING.value, "confidence": ConfidenceLevel.INFERRED.value}
    ]
    merged = merge_facts_with_precedence(fact_pool, incoming)
    # Remains 75 from USER_ANSWER!
    assert merged["connected_power_load"].value == 75
    assert merged["connected_power_load"].source == FactSource.USER_ANSWER.value


# ===========================================================================
# 5. REST API Integration & Tenant Isolation Tests
# ===========================================================================

@pytest.mark.django_db
def test_api_business_understanding_endpoint(auth_client, test_business):
    """POST /api/v1/assessments/{id}/understand/ executes business understanding."""
    create_res = auth_client.post(
        "/api/v1/assessments/",
        data={"business_id": str(test_business.id)},
        format="json",
    )
    run_id = create_res.json()["data"]["run_id"]

    res = auth_client.post(f"/api/v1/assessments/{run_id}/understand/")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()["data"]
    assert "primary_activity" in data
    assert "likely_regulatory_domains" in data
    assert "important_unknowns" in data
    # Safe response verification: no internal metadata leaked
    assert "model" not in data
    assert "provider" not in data
    assert "prompt" not in data


@pytest.mark.django_db
def test_api_question_generation_endpoint(auth_client, test_business):
    """POST /api/v1/assessments/{id}/questions/generate/ produces at most five decision-critical questions."""
    create_res = auth_client.post(
        "/api/v1/assessments/",
        data={"business_id": str(test_business.id)},
        format="json",
    )
    run_id = create_res.json()["data"]["run_id"]

    res = auth_client.post(f"/api/v1/assessments/{run_id}/questions/generate/")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()["data"]
    assert 1 <= data["total_questions"] <= 5
    assert len(data["questions"]) == data["total_questions"]
    first_q = data["questions"][0]
    assert "question_id" in first_q
    assert "question" in first_q
    assert "answer_type" in first_q
    assert "reason" in first_q
    assert "model" not in first_q
    assert "provider" not in first_q


@pytest.mark.django_db
def test_api_answer_submission_and_context(auth_client, test_business):
    """POST answers and GET context return valid progress and canonical enriched context."""
    create_res = auth_client.post(
        "/api/v1/assessments/",
        data={"business_id": str(test_business.id)},
        format="json",
    )
    run_id = create_res.json()["data"]["run_id"]

    # Generate questions first
    generated = auth_client.post(f"/api/v1/assessments/{run_id}/questions/generate/").json()["data"]["questions"]
    question = next(q for q in generated if q["answer_type"] == "BOOLEAN")

    # Submit answer
    ans_res = auth_client.post(
        f"/api/v1/assessments/{run_id}/answers/",
        data={"question_id": question["question_id"], "value": True},
        format="json",
    )
    assert ans_res.status_code == status.HTTP_200_OK
    assert ans_res.json()["data"]["answered_count"] == 1

    # List questions
    list_res = auth_client.get(f"/api/v1/assessments/{run_id}/questions/")
    assert list_res.status_code == status.HTTP_200_OK
    list_data = list_res.json()["data"]
    assert list_data["total_questions"] == len(generated)
    assert list_data["answered_count"] == 1

    # Get enriched context
    ctx_res = auth_client.get(f"/api/v1/assessments/{run_id}/context/")
    assert ctx_res.status_code == status.HTTP_200_OK
    ctx_data = ctx_res.json()["data"]
    assert "operational_facts" in ctx_data
    assert "financial_facts" in ctx_data
    assert "provenance_summary" in ctx_data
    assert "connected_power_load" in ctx_data["operational_facts"]


@pytest.mark.django_db
def test_smart_questions_completion_survives_optional_workspace_provider_failure(
    auth_client, test_business, auth_user
):
    """Final-answer retries and optional guidance failure must not block synthesis."""
    from domain.intelligence.orchestration import assessment_orchestrator
    from domain.providers.base import ProviderError

    test_business.name = "Questionnaire Regression Restaurant"
    test_business.save(update_fields=["name"])
    profile = BusinessProfileVersion.objects.create(
        business=test_business,
        version=2,
        variables={
            "product_description": {
                "value": "A small local food service business",
                "origin": "USER_PROVIDED",
            },
            "state": {"value": "KARNATAKA", "origin": "USER_PROVIDED"},
        },
    )
    assessment = Assessment.objects.create(
        business=test_business,
        created_by=auth_user,
        profile_version=profile,
    )
    run = assessment_orchestrator.create_run(
        business=test_business,
        user=auth_user,
        strategy="LLM_FIRST",
    )
    run.stage_metadata = {
        **run.stage_metadata,
        "question_generation": {"question_policy_version": 5, "questions": [{
            "question_id": "Q01",
            "variable_key": "contract_workers",
            "answer_type": "NUMBER",
            "required": True,
            "options": [],
        }]},
        "answers": {},
        "regulatory_discovery": {"status": "COMPLETED", "evidence_candidates": []},
    }
    run.save()

    # The created run adopts the existing assessment and its profile snapshot.
    assert run.run_id == str(assessment.id)
    answer_payload = {"question_id": "Q01", "value": 0}
    first_answer = auth_client.post(
        f"/api/v1/assessments/{run.run_id}/answers/",
        data=answer_payload,
        format="json",
    )
    assert first_answer.status_code == status.HTTP_200_OK
    profile_versions_after_first_answer = BusinessProfileVersion.objects.filter(
        business=test_business
    ).count()
    retry_answer = auth_client.post(
        f"/api/v1/assessments/{run.run_id}/answers/",
        data=answer_payload,
        format="json",
    )
    assert retry_answer.status_code == status.HTTP_200_OK
    assert retry_answer.json()["data"]["answered_count"] == 1
    assert BusinessProfileVersion.objects.filter(business=test_business).count() == (
        profile_versions_after_first_answer
    )

    with patch(
        "domain.intelligence.workspace_guidance.generate_workspace",
        side_effect=ProviderError("Optional contextual guidance is unavailable."),
    ):
        response = auth_client.post(
            f"/api/v1/assessments/{run.run_id}/compliance-synthesis/",
            data={},
            format="json",
        )

    assert response.status_code == status.HTTP_200_OK
    result = response.json()["data"]
    assert result["status"] in {"COMPLETED", "NEEDS_INFORMATION"}
    first_decision_run_id = Assessment.objects.get(pk=assessment.pk).decision_run_id
    first_decision_run_count = test_business.decision_runs.count()

    with patch(
        "domain.intelligence.workspace_guidance.generate_workspace",
        side_effect=ProviderError("Optional contextual guidance is unavailable."),
    ):
        retry_response = auth_client.post(
            f"/api/v1/assessments/{run.run_id}/compliance-synthesis/",
            data={},
            format="json",
        )
    assert retry_response.status_code == status.HTTP_200_OK
    assessment.refresh_from_db()
    assert assessment.decision_run_id == first_decision_run_id
    assert test_business.decision_runs.count() == first_decision_run_count


@pytest.mark.django_db
def test_tenant_isolation_step02(auth_client, other_business, other_user):
    """User cannot generate questions or submit answers to another user's assessment."""
    run = assessment_orchestrator.create_run(
        business=other_business,
        user=other_user,
        strategy=AssessmentStrategyType.LLM_FIRST,
    )

    # Auth user tries to access other user's run
    understand_res = auth_client.post(f"/api/v1/assessments/{run.run_id}/understand/")
    assert understand_res.status_code == status.HTTP_404_NOT_FOUND

    q_res = auth_client.post(f"/api/v1/assessments/{run.run_id}/questions/generate/")
    assert q_res.status_code == status.HTTP_404_NOT_FOUND

    ans_res = auth_client.post(f"/api/v1/assessments/{run.run_id}/answers/", data={"question_id": "Q01", "value": 10})
    assert ans_res.status_code == status.HTTP_404_NOT_FOUND

    ctx_res = auth_client.get(f"/api/v1/assessments/{run.run_id}/context/")
    assert ctx_res.status_code == status.HTTP_404_NOT_FOUND


# ===========================================================================
# 6. Question Reason Safety Regression Tests
# ===========================================================================

def test_question_reasons_contain_no_final_legal_conclusions():
    """Verify that question 'reason' fields contain factual/contextual explanations, not legal conclusions."""
    ctx = OrchestrationContext(
        business_id=str(uuid.uuid4()),
        business_name="Universal Industrial Systems",
        raw_business_description="Precision metal fabrication and electrical assemblies",
    )
    questions = generate_emergency_15_questions(ctx)
    assert len(questions) == 15

    forbidden_phrases = [
        "triggers mandatory license",
        "is legally required",
        "is applicable",
        "the company must obtain",
        "the business must obtain",
        "is exempt from",
        "mandatory statutory prerequisite",
        "is illegal",
    ]

    for q in questions:
        reason_lower = q.reason.lower()
        for phrase in forbidden_phrases:
            assert phrase not in reason_lower, (
                f"Question {q.question_id} reason contains legal conclusion '{phrase}': '{q.reason}'"
            )
        # Ensure it contains factual/contextual explanation language
        assert "helps determine which" in reason_lower or "may be relevant" in reason_lower, (
            f"Question {q.question_id} reason should be a contextual explanation: '{q.reason}'"
        )


def test_sanitize_question_reason_replaces_legal_conclusions():
    """validate_and_normalize_questions sanitizes any model-generated legal conclusion phrases in reasons."""
    from domain.intelligence.questionnaire import sanitize_question_reason

    test_cases = [
        ("Exceeding 10 HP triggers mandatory license under Factories Act.", "Power", "This helps determine which power requirements may be relevant to your facility."),
        ("This is legally required under SPCB guidelines.", "Environmental", "This helps determine which environmental requirements may be relevant to your facility."),
        ("The business is exempt from EPF registration.", "Labor", "This helps determine which labor requirements may be relevant to your facility."),
    ]
    for raw, cat, expected in test_cases:
        sanitized = sanitize_question_reason(raw, cat)
        assert sanitized == expected

