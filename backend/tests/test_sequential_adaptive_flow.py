"""Integration test for True Sequential Adaptive Flow:

ASK -> ANSWER -> SAVE PROFILE VERSION -> RE-EVALUATE -> ASK NEXT

Validates:
1. Minimum User Input -> Maximum Regulatory Intelligence.
2. Answering a variable creates an immutable BusinessProfileVersion.
3. Re-evaluating rules marks satisfied rules TRUE or FALSE.
4. Resolved rules prune remaining branches (e.g. worker < 10 makes power load irrelevant).
5. Onboarding stops cleanly when all rules are resolved.
6. API endpoint `/questions/next` (GET and POST) functions seamlessly.
"""

from __future__ import annotations

import pytest
from apps.businesses.models import Business, BusinessProfileVersion
from apps.knowledge.models import RequirementDefinition, RuleVersion
from apps.onboarding.services import (
    get_next_smart_question,
    submit_sequential_smart_question_answer,
)
from common.enums import KnowledgeStatus, VariableOrigin


@pytest.fixture
def gujarat_rules(db):
    """Setup canonical Gujarat rules for testing adaptive pruning."""
    # Isolate published rules so rules leaked from previous tests do not alter sequential flow
    RuleVersion.objects.filter(status=KnowledgeStatus.PUBLISHED).exclude(
        rule_id__in=["RULE-FSSAI-01", "RULE-GPCB-01", "RULE-GUJ-FACT-01"]
    ).update(status=KnowledgeStatus.DRAFT)

    # 1. FSSAI State License
    req_fssai, _ = RequirementDefinition.objects.update_or_create(
        requirement_id="REQ-FSSAI-STATE",
        defaults={
            "name": "FSSAI State Food License",
            "authority": "FSSAI",
            "jurisdiction": "CENTRAL",
            "domain": "FOOD",
            "status": KnowledgeStatus.PUBLISHED,
        },
    )
    rule_fssai, _ = RuleVersion.objects.update_or_create(
        rule_id="RULE-FSSAI-01",
        version=1,
        defaults={
            "requirement": req_fssai,
            "domain": "FOOD",
            "jurisdiction": "CENTRAL",
            "status": KnowledgeStatus.PUBLISHED,
            "condition_ast": {
                "op": "AND",
                "args": [
                    {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "FOOD"},
                    {"op": "GTE", "left": {"var": "annual_turnover"}, "right": 1200000},
                    {"op": "LTE", "left": {"var": "annual_turnover"}, "right": 200000000},
                ],
            },
        },
    )

    # 2. GPCB Consent to Establish
    req_gpcb, _ = RequirementDefinition.objects.update_or_create(
        requirement_id="REQ-GPCB-CTE",
        defaults={
            "name": "GPCB Consent to Establish",
            "authority": "GPCB",
            "jurisdiction": "GUJARAT",
            "domain": "ENVIRONMENT",
            "status": KnowledgeStatus.PUBLISHED,
        },
    )
    rule_gpcb, _ = RuleVersion.objects.update_or_create(
        rule_id="RULE-GPCB-01",
        version=1,
        defaults={
            "requirement": req_gpcb,
            "domain": "ENVIRONMENT",
            "jurisdiction": "GUJARAT",
            "status": KnowledgeStatus.PUBLISHED,
            "condition_ast": {
                "op": "AND",
                "args": [
                    {"op": "EQ", "left": {"var": "state"}, "right": "GUJARAT"},
                    {
                        "op": "OR",
                        "args": [
                            {"op": "EQ", "left": {"var": "effluent_emission_generation"}, "right": True},
                            {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "FOOD"},
                        ],
                    },
                ],
            },
        },
    )

    # 3. Gujarat Factory License
    req_fact, _ = RequirementDefinition.objects.update_or_create(
        requirement_id="REQ-GUJ-FACTORY",
        defaults={
            "name": "Gujarat Factory License",
            "authority": "DISH",
            "jurisdiction": "GUJARAT",
            "domain": "LABOR",
            "status": KnowledgeStatus.PUBLISHED,
        },
    )
    rule_fact, _ = RuleVersion.objects.update_or_create(
        rule_id="RULE-GUJ-FACT-01",
        version=1,
        defaults={
            "requirement": req_fact,
            "domain": "LABOR",
            "jurisdiction": "GUJARAT",
            "status": KnowledgeStatus.PUBLISHED,
            "condition_ast": {
                "op": "AND",
                "args": [
                    {"op": "EQ", "left": {"var": "state"}, "right": "GUJARAT"},
                    {"op": "GTE", "left": {"var": "total_worker_count"}, "right": 10},
                    {"op": "GT", "left": {"var": "connected_power_load"}, "right": 0},
                ],
            },
        },
    )

    return rule_fssai, rule_gpcb, rule_fact


@pytest.mark.django_db
def test_sequential_adaptive_service_flow(make_business, user, gujarat_rules):
    """Verify true sequential step-by-step adaptive onboarding:
    
    1. Business in Gujarat producing Food.
    2. GPCB CTE is immediately TRUE (because product CONTAINS FOOD).
    3. FSSAI needs annual_turnover. Factory rule needs worker_count and power_load.
    4. User provides annual_turnover -> FSSAI resolves TRUE!
    5. User provides worker_count = 5 (< 10) -> Factory rule resolves FALSE!
    6. connected_power_load is NEVER asked because Factory rule is already FALSE.
    7. Onboarding completes!
    """
    biz = make_business(owner=user, name="Gujarat Organic Food Processors")
    p1 = BusinessProfileVersion.objects.create(
        business=biz,
        version=1,
        variables={
            "state": {"value": "GUJARAT", "origin": VariableOrigin.USER_PROVIDED},
            "product_description": {"value": "Manufacturing packaged organic fruit and food snacks", "origin": VariableOrigin.USER_PROVIDED},
        },
        created_by=user,
    )

    # STEP 1: Ask next question
    q1 = get_next_smart_question(biz)
    assert q1 is not None
    # Must be one of the decision-relevant variables (annual_turnover or total_worker_count)
    assert q1["variable_key"] in {"annual_turnover", "total_worker_count"}
    # Must NOT ask effluent because GPCB CTE rule is already TRUE due to FOOD branch!
    assert q1["variable_key"] != "effluent_emission_generation"

    # STEP 2: Answer annual_turnover
    step2_res = submit_sequential_smart_question_answer(
        business=biz,
        variable_key="annual_turnover",
        answer_value="15000000",  # 1.5 Cr
        user=user,
    )
    assert step2_res["profile_version"] == 2
    assert step2_res["is_complete"] is False

    # STEP 3: Next question must be worker count (FSSAI is resolved TRUE, turnover never asked again)
    q2 = step2_res["next_question"]
    assert q2 is not None
    assert q2["variable_key"] == "total_worker_count"

    # STEP 4: Answer worker count = 5 (< 10)
    step4_res = submit_sequential_smart_question_answer(
        business=biz,
        variable_key="total_worker_count",
        answer_value=5,
        user=user,
    )
    assert step4_res["profile_version"] == 3

    # STEP 5: Re-evaluation:
    # Gujarat Factory rule: worker >= 10 is FALSE -> AND is FALSE!
    # connected_power_load is IRRELEVANT and MUST NOT BE ASKED!
    # All rules (FSSAI=TRUE, GPCB=TRUE, Factory=FALSE) are now decisively resolved!
    assert step4_res["is_complete"] is True
    assert step4_res["next_question"] is None


@pytest.mark.django_db
def test_sequential_adaptive_api_endpoints(auth_client, user, make_business, gujarat_rules):
    """Verify /api/v1/onboarding/business/<id>/questions/next GET and POST endpoints."""
    biz = make_business(owner=user, name="Sequential API Test Business")
    BusinessProfileVersion.objects.create(
        business=biz,
        version=1,
        variables={
            "state": {"value": "GUJARAT", "origin": VariableOrigin.USER_PROVIDED},
            "product_description": {"value": "Organic food processing", "origin": VariableOrigin.USER_PROVIDED},
        },
        created_by=user,
    )

    # 1. GET next question
    url_next = f"/api/v1/businesses/{biz.id}/onboarding/questions/next"
    res_get = auth_client.get(url_next)
    assert res_get.status_code == 200
    data_get = res_get.json()["data"]
    assert data_get["is_complete"] is False
    next_q = data_get["next_question"]
    assert next_q is not None
    assert next_q["variable_key"] in {"annual_turnover", "total_worker_count"}

    # 2. POST answer to next question
    res_post = auth_client.post(url_next, {
        "variable_key": next_q["variable_key"],
        "answer_value": "25000000",
    }, format="json")
    assert res_post.status_code == 200
    data_post = res_post.json()["data"]
    assert data_post["profile_version"] == 2
    assert data_post["answered_variable"] == next_q["variable_key"]
