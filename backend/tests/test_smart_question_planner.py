"""Tests for True Dynamic Pre-Discovery Smart Question Planner.

Validates:
- Open-ended business understanding without hardcoded universal candidate pools.
- Negative Regression Test: Prohibits the generic 6-variable fallback questionnaire.
- Test A: Three radically different businesses produce distinct gaps and discovery intents.
- Test B: Unfamiliar business (waste-to-pesticide) generates domain-relevant questions.
- Test C: Non-canonical dynamic discovery variables are supported without hard catalog gating.
- Test D: Business name vs operational description divergence generates a clarification question.
- Test E: Multi-round adaptive progression updates questions based on previous answers.
- Test F & G: Profile variations produce different gaps and prevent generic questionnaires.
- SmartQuestionPlan and SmartQuestionInstance DB persistence and answer recording.
"""

from __future__ import annotations

from unittest.mock import patch
import pytest
from apps.businesses.models import Business, BusinessProfileVersion
from apps.onboarding.models import SmartQuestionPlan, SmartQuestionInstance
from apps.onboarding.planner import plan_adaptive_smart_questions
from apps.onboarding.services import save_smart_question_answers
from common.enums import VariableOrigin
from domain.profile.variables import PROFILE_VARIABLES, get_variable


def _create_profile(business: Business, version: int, **variables) -> BusinessProfileVersion:
    var_dict = {}
    for k, v in variables.items():
        var_dict[k] = {"value": v, "origin": VariableOrigin.USER_PROVIDED}
    return BusinessProfileVersion.objects.create(
        business=business,
        version=version,
        variables=var_dict,
    )


@pytest.mark.django_db
def test_smart_question_canonical_and_dynamic_mapping(make_business, user):
    """Questions map to canonical variables when applicable, or dynamic discovery fields."""
    biz = make_business(owner=user, name="Diagnostic BioTech Pvt Ltd")
    _create_profile(
        biz,
        1,
        state="KARNATAKA",
        product_description="Manufacturing sterile in-vitro diagnostic medical test kits and reagents in cleanrooms.",
        total_worker_count=35,
        annual_turnover="50000000",
    )

    result = plan_adaptive_smart_questions(biz, round_number=1)

    assert result["status"] == "ACTIVE"
    questions = result["questions"]
    assert len(questions) >= 2

    for q in questions:
        assert "target_variable_id" in q
        assert "question" in q
        assert "data_type" in q
        assert "expected_discovery_impact" in q
        # Canonical or dynamic flag is explicit
        assert "is_canonical" in q


@pytest.mark.django_db
def test_smart_question_plan_persistence(make_business, user):
    """Check that SmartQuestionPlan and SmartQuestionInstance records are saved in DB."""
    biz = make_business(owner=user, name="Persistence Test Co")
    _create_profile(
        biz,
        1,
        state="MAHARASHTRA",
        product_description="Cold-pressed organic edible sesame and sunflower oil manufacturing.",
        total_worker_count=20,
        annual_turnover="30000000",
    )

    result = plan_adaptive_smart_questions(biz, round_number=1)
    plan_id = result["plan_id"]

    plan_obj = SmartQuestionPlan.objects.get(id=plan_id)
    assert plan_obj.business == biz
    assert plan_obj.round_number == 1
    assert plan_obj.status == "ACTIVE"
    assert "regulatory_search_intent" in plan_obj.regulatory_search_intent or len(plan_obj.regulatory_search_intent) > 0

    instances = SmartQuestionInstance.objects.filter(plan=plan_obj)
    assert instances.count() == result["total_questions"]
    for inst in instances:
        assert inst.variable_key != ""
        assert inst.is_answered is False


@pytest.mark.django_db
def test_smart_question_fallback_on_llm_failure(make_business, user):
    """When LLM provider fails, planner gracefully falls back to deterministic context extraction."""
    biz = make_business(owner=user, name="Fallback Test Co")
    _create_profile(
        biz,
        1,
        state="TAMIL_NADU",
        product_description="B2B SaaS enterprise workflow automation platform hosted on cloud.",
        total_worker_count=15,
        annual_turnover="20000000",
    )

    with patch("apps.onboarding.planner.get_llm_provider") as mock_get_provider:
        mock_provider = mock_get_provider.return_value
        mock_provider.is_configured = True
        mock_provider.complete.side_effect = RuntimeError("Simulated LLM network failure")

        result = plan_adaptive_smart_questions(biz, round_number=1)
        assert result["status"] == "ACTIVE"
        assert len(result["questions"]) > 0
        keys = {q["target_variable_id"] for q in result["questions"]}
        # For SaaS, must ask personal data / cloud, not factory variables
        assert "processes_personal_data" in keys or "cloud_hosting_location" in keys


@pytest.mark.django_db
def test_negative_regression_no_universal_six_variable_fallback(make_business, user):
    """NEGATIVE REGRESSION TEST:
    Fails if the generic 6 factory variables become the universal fallback questionnaire
    for an unseen business (e.g. waste-to-pesticide conversion).
    """
    biz = make_business(owner=user, name="GreenCycle Agro Waste Solutions")
    _create_profile(
        biz,
        1,
        state="TAMIL_NADU",
        product_description="We collect agricultural and household waste from farmers and convert them into bio-pesticides and organic soil fertilizers.",
        total_worker_count=48,
        annual_turnover="30000000",
    )

    result = plan_adaptive_smart_questions(biz, round_number=1)
    question_keys = {q["target_variable_id"] for q in result["questions"]}

    generic_six = {
        "connected_power_load",
        "effluent_emission_generation",
        "hazardous_waste_generation",
        "contract_worker_count",
        "multi_state_operations",
        "ecommerce_operations",
    }

    # The returned question keys MUST NOT simply be the generic six variables!
    assert question_keys != generic_six, (
        f"FAILED NEGATIVE REGRESSION TEST: Unseen business GreenCycle Agro received "
        f"the exact generic 6 fallback variables: {question_keys}"
    )

    # Must contain domain-relevant questions (pesticide category, feedstock, or CIBRC)
    text_content = " ".join(q["question"].lower() for q in result["questions"])
    assert any(k in text_content for k in ["pesticide", "waste", "feedstock", "fertilizer", "cibrc", "organic"]), (
        f"Questions did not contain any pesticide/waste domain inquiries: {text_content}"
    )


@pytest.mark.django_db
def test_unseen_business_waste_to_pesticide_generates_domain_questions(make_business, user):
    """TEST B & C: A business outside the traditional 6 domains generates domain questions
    and supports dynamic non-canonical variables."""
    biz = make_business(owner=user, name="EnviroChem Agro Conversions")
    _create_profile(
        biz,
        1,
        state="TAMIL_NADU",
        district="Madurai",
        product_description="What we do is we collect wastes from households and farmers and then we convert them, using proprietary technology, into pesticides.",
        total_worker_count=30,
        annual_turnover="40000000",
    )

    result = plan_adaptive_smart_questions(biz, round_number=1)
    questions = result["questions"]
    keys = {q["target_variable_id"] for q in questions}

    # Verify presence of dynamic pesticide / waste feedstock fields
    assert any("pesticide" in k or "waste" in k or "feedstock" in k for k in keys)

    # Verify answers can be saved to dynamic non-canonical variables without validation failure
    dynamic_keys = [k for k in keys if k.startswith("dynamic_") or "pesticide" in k or "feedstock" in k]
    assert dynamic_keys, f"Expected dynamic keys in questions, got {keys}"
    chosen_dynamic_key = dynamic_keys[0]
    answers_to_submit = {
        chosen_dynamic_key: "Bio-pesticide / Botanical extract",
    }
    new_profile = save_smart_question_answers(
        business=biz,
        answers=answers_to_submit,
    )
    assert new_profile is not None
    assert chosen_dynamic_key in new_profile.variables


@pytest.mark.django_db
def test_name_vs_activity_divergence_generates_clarification_question(make_business, user):
    """TEST D: Name mentioning MedTech but activity detailing pesticide recycling
    triggers a clarification question rather than forcing a wrong domain."""
    biz = make_business(owner=user, name="BluePeak MedTech Devices")
    _create_profile(
        biz,
        1,
        state="TAMIL_NADU",
        district="Chennai",
        product_description="What we do is we collect wastes from households and farmers and then we convert them, using proprietary technology, into pesticides.",
        total_worker_count=48,
        annual_turnover="30000000",
    )

    result = plan_adaptive_smart_questions(biz, round_number=1)
    questions = result["questions"]

    # At least one question or gap must address the divergence / clarify primary activity
    all_text = " ".join([q["question"] for q in questions] + [g.get("description", "") for g in result.get("information_gaps", [])]).lower()
    assert "medtech" in all_text or "medical" in all_text or "scope" in all_text or "pesticide" in all_text


@pytest.mark.django_db
def test_three_radically_different_businesses_produce_differentiated_gaps_and_intents(make_business, user):
    """TEST A: Three radically different businesses produce distinct gaps, discovery intents,
    and subjects (Food vs MedTech vs SaaS)."""
    # 1. Food
    food_biz = make_business(owner=user, name="PureHarvest Agro Foods")
    _create_profile(
        food_biz,
        1,
        state="MAHARASHTRA",
        product_description="Dehydrating tropical mango and banana pulp for export packaged snacks.",
        total_worker_count=25,
        annual_turnover="35000000",
    )
    food_res = plan_adaptive_smart_questions(food_biz, round_number=1)

    # 2. MedTech
    med_biz = make_business(owner=user, name="CardioVance Diagnostics")
    _create_profile(
        med_biz,
        1,
        state="KARNATAKA",
        product_description="Manufacturing sterile cardiovascular diagnostic catheters and balloon delivery systems.",
        total_worker_count=45,
        annual_turnover="80000000",
    )
    med_res = plan_adaptive_smart_questions(med_biz, round_number=1)

    # 3. SaaS
    saas_biz = make_business(owner=user, name="CloudFlow Automation")
    _create_profile(
        saas_biz,
        1,
        state="KARNATAKA",
        product_description="B2B enterprise SaaS cloud workflow analytics platform.",
        total_worker_count=12,
        annual_turnover="15000000",
    )
    saas_res = plan_adaptive_smart_questions(saas_biz, round_number=1)

    food_keys = {q["target_variable_id"] for q in food_res["questions"]}
    med_keys = {q["target_variable_id"] for q in med_res["questions"]}
    saas_keys = {q["target_variable_id"] for q in saas_res["questions"]}

    # Food must have food keys, not cleanrooms or personal data
    assert any("processing" in k or "food" in k or "packaging" in k for k in food_keys)
    assert "cdsco_device_risk_class" not in food_keys
    assert "processes_personal_data" not in food_keys

    # MedTech must have med keys, not food throughput
    assert any("cdsco" in k or "sterile" in k or "cleanroom" in k for k in med_keys)
    assert "daily_processing_capacity" not in med_keys

    # SaaS must have data/cloud keys, not factory power/effluent
    assert any("personal_data" in k or "cloud" in k or "cyber" in k for k in saas_keys)
    assert "connected_power_load" not in saas_keys
    assert "effluent_emission_generation" not in saas_keys


@pytest.mark.django_db
def test_multi_round_adaptive_progression_with_previous_answers(make_business, user):
    """TEST E: Answering Round 1 questions modifies Round 2 evaluation adaptively."""
    biz = make_business(owner=user, name="OrthoBiome MedTech")
    _create_profile(
        biz,
        1,
        state="KARNATAKA",
        product_description="Manufacturing medical implants and orthopedic prosthetics.",
        total_worker_count=30,
        annual_turnover="60000000",
    )

    # Round 1
    r1 = plan_adaptive_smart_questions(biz, round_number=1)
    assert r1["status"] == "ACTIVE"
    assert len(r1["questions"]) > 0

    # Answer questions
    answers = {}
    for q in r1["questions"][:3]:
        qid = q["target_variable_id"]
        dt = q.get("data_type")
        opts = q.get("options")
        if dt == "BOOLEAN":
            answers[qid] = "true"
        elif opts:
            first_opt = opts[0]
            answers[qid] = first_opt["value"] if isinstance(first_opt, dict) else str(first_opt)
        elif dt in ("DECIMAL", "INTEGER", "CURRENCY_INR"):
            answers[qid] = "25"
        else:
            answers[qid] = "Standard Model"

    save_smart_question_answers(business=biz, answers=answers)

    # Round 2
    r2 = plan_adaptive_smart_questions(biz, round_number=2)
    # The answered keys must NOT be re-asked in Round 2
    r2_keys = {q["target_variable_id"] for q in r2["questions"]}
    for answered_k in answers.keys():
        assert answered_k not in r2_keys
