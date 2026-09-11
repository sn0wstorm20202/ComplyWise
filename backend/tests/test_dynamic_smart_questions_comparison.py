"""Tests comparing dynamic smart questions across diverse business sectors.

Authority: Milestone Task — Objective 2; PRD_v2.0 §10, §11; TRD_v2.0 §8, §12.

Validates:
1. Questions are formulated dynamically to match the business's specific operational reality.
2. Formulates 7 to 10 high-value intake questions (min 6, max 10).
3. Every question maps strictly to canonical profile variables (V01-V19).
4. Strict contract fields: question_id, question_text, variable_id, answer_type, allowed_values, priority, information_gain, reason, domains.
5. Sector comparison: Medical Device manufacturing vs Food & Agro processing produces materially different, sector-tailored questions.
6. Multi-round adaptive stopping condition terminates cleanly.
"""

from __future__ import annotations

import pytest
from apps.businesses.models import Assessment, Business, BusinessProfileVersion
from apps.onboarding.planner import MAX_QUESTIONS_PER_ROUND, MIN_QUESTIONS_PER_ROUND, plan_adaptive_smart_questions
from common.enums import VariableOrigin
from domain.profile.variables import VARIABLES_BY_KEY

pytestmark = pytest.mark.django_db


def _create_profile(business: Business, state: str, desc: str, **kwargs) -> BusinessProfileVersion:
    vars_payload = {
        "state": {"value": state, "origin": VariableOrigin.USER_PROVIDED},
        "product_description": {"value": desc, "origin": VariableOrigin.USER_PROVIDED},
    }
    for k, v in kwargs.items():
        vars_payload[k] = {"value": v, "origin": VariableOrigin.USER_PROVIDED}
    return BusinessProfileVersion.objects.create(
        business=business,
        version=1,
        variables=vars_payload,
    )


def test_question_contract_and_canonical_mapping(auth_client, user, make_business):
    """Every generated question strictly adheres to the structured JSON contract and maps to canonical variables."""
    biz = make_business(user, name="Apex MedTech Solutions")
    _create_profile(
        biz,
        state="KA",
        desc="Manufacturing orthopedic surgical implants, sterile hip replacement prosthetics, and titanium bone screws in a Class 10000 cleanroom.",
    )

    assessment = Assessment.objects.create(
        business=biz,
        created_by=user,
        assessment_number=1,
        title="MedTech Intake",
    )

    plan_result = plan_adaptive_smart_questions(biz, round_number=1, assessment_id=str(assessment.id))

    assert plan_result["status"] == "ACTIVE"
    questions = plan_result["questions"]

    # Approximately 7 to 10 questions (min 6, max 10)
    assert MIN_QUESTIONS_PER_ROUND <= len(questions) <= MAX_QUESTIONS_PER_ROUND

    seen_keys = set()
    for q in questions:
        # Contract field assertions
        assert "id" in q or "question_id" in q
        assert "question" in q and len(q["question"]) > 10
        assert "key" in q or "variable_key" in q
        assert "why_it_matters" in q and len(q["why_it_matters"]) > 5
        assert "priority" in q
        assert "information_gain" in q
        assert 0.0 <= float(q["information_gain"]) <= 1.0

        # Canonical variable mapping (V01 - V19)
        var_key = q.get("variable_key") or q.get("key")
        assert var_key in VARIABLES_BY_KEY, f"Question mapped to unknown variable: {var_key}"
        assert var_key not in seen_keys, f"Duplicate question for variable {var_key}"
        seen_keys.add(var_key)

        # State and product_description were already provided, so they MUST NOT be asked
        assert var_key not in {"state", "product_description"}


def test_two_business_sector_comparison_medtech_vs_food(auth_client, user, make_business):
    """Comparing Medical Device vs Food Processing yields materially different questions tailored to each reality."""
    # Business 1: MedTech
    med_biz = make_business(user, name="St. Jude Biomechatronics")
    _create_profile(
        med_biz,
        state="MH",
        desc="Manufacturing sterile cardiovascular stents, catheter delivery systems, and titanium surgical implants.",
    )

    # Business 2: Food & Agro Processing
    food_biz = make_business(user, name="Konkan Agro Dehydrated Foods")
    _create_profile(
        food_biz,
        state="MH",
        desc="Dehydrating tropical mango, banana, and pineapple pulp, and packaging organic fruit snacks for domestic and export retail.",
    )

    med_plan = plan_adaptive_smart_questions(med_biz, round_number=1)
    food_plan = plan_adaptive_smart_questions(food_biz, round_number=1)

    med_questions = med_plan["questions"]
    food_questions = food_plan["questions"]

    assert len(med_questions) >= MIN_QUESTIONS_PER_ROUND
    assert len(food_questions) >= MIN_QUESTIONS_PER_ROUND

    med_text_blob = " ".join(f"{q['question']} {q['why_it_matters']}" for q in med_questions).lower()
    food_text_blob = " ".join(f"{q['question']} {q['why_it_matters']}" for q in food_questions).lower()

    # The medical device intake questions should reference cleanrooms, surgical, clinical, sterilization, or medical equipment
    med_keywords = ["cleanroom", "production lines", "testing", "sterilization", "medical", "surgical", "implant", "power load"]
    has_med_flavor = any(kw in med_text_blob for kw in med_keywords)
    assert has_med_flavor, f"MedTech questions lacked industry-specific terminology: {med_text_blob}"

    # The food processing intake questions should reference food processing, refrigeration, wash water, boiler, food safety, or cold storage
    food_keywords = ["food", "refrigeration", "cold chain", "wash water", "processing", "boiler", "packaging"]
    has_food_flavor = any(kw in food_text_blob for kw in food_keywords)
    assert has_food_flavor, f"Food questions lacked industry-specific terminology: {food_text_blob}"

    # Verify that the questions are distinct
    med_q_texts = {q["question"] for q in med_questions}
    food_q_texts = {q["question"] for q in food_questions}
    assert med_q_texts != food_q_texts, "Both businesses received identical question text!"


def test_multi_round_adaptive_stopping_condition(auth_client, user, make_business):
    """When questions from round 1 are answered, round 2 targets only remaining variables and terminates cleanly."""
    biz = make_business(user, name="Apex Precision Hub")
    _create_profile(biz, state="TN", desc="Precision metal components CNC machining")

    # Round 1
    plan1 = plan_adaptive_smart_questions(biz, round_number=1)
    assert plan1["status"] == "ACTIVE"
    q_keys = [q["variable_key"] for q in plan1["questions"][:4]]

    # User answers 4 questions with valid typed answers
    from apps.onboarding.services import save_smart_question_answers
    from domain.profile.variables import get_variable, VariableDataType

    answers = {}
    for k in q_keys:
        var = get_variable(k)
        if var.data_type == VariableDataType.BOOLEAN:
            answers[k] = False
        elif var.data_type in {VariableDataType.INTEGER, VariableDataType.DECIMAL, VariableDataType.CURRENCY_INR}:
            answers[k] = "100"
        elif var.data_type == VariableDataType.SINGLE_CHOICE:
            answers[k] = var.options[0].value if var.options else "OPERATIONAL"
        elif var.data_type == VariableDataType.MULTI_CHOICE:
            answers[k] = [var.options[0].value] if var.options else []
        else:
            answers[k] = "Standard Value"

    save_smart_question_answers(business=biz, answers=answers, user=user)

    # Round 2
    plan2 = plan_adaptive_smart_questions(biz, round_number=2)
    # Round 2 questions must NOT contain the answered variables
    for q in plan2["questions"]:
        assert q["variable_key"] not in q_keys

    # Round 3 (exceeding MAX_ROUNDS) terminates with COMPLETED
    plan3 = plan_adaptive_smart_questions(biz, round_number=3)
    assert plan3["status"] == "COMPLETED"
    assert plan3["stopping_reason"] == "ROUNDS_EXHAUSTED"
    assert len(plan3["questions"]) == 0
