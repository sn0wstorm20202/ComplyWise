"""Dynamic behaviour guarantees for the milestone.

Authority: PRD_v2.0 §P3, §P4, §P12; milestone §4/§6/§24.

These tests pin the core promise: decisions come from the profile plus published
knowledge, never from scenario branches. Each test varies exactly ONE business
input and asserts the outcome tracks the data:

- changed state       -> different applicability (jurisdiction-driven)
- changed activity    -> different applicability (content of `product_description`)
- missing variable    -> NEEDS_INFORMATION (UNKNOWN is never silently FALSE)
- answered variable   -> the question disappears and the result can resolve

All knowledge here is synthetic in-database content built through the same models
the knowledge-pack loader writes to; no fixture pack or demo scenario is involved.
"""

from __future__ import annotations

import pytest

from apps.applicability.engine import ApplicabilityEngine
from apps.businesses.models import Business, BusinessProfileVersion
from apps.evidence.models import Evidence, Source
from apps.knowledge.models import RequirementDefinition, RuleVersion
from apps.onboarding.services import get_dynamic_smart_questions
from common.enums import (
    ApplicabilityStatus,
    KnowledgeStatus,
    RuleType,
    SourceStatus,
    VariableOrigin,
    VerificationStatus,
)

TURNOVER_RULE_AST = {
    "op": "AND",
    "args": [
        {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "FOOD"},
        {"op": "GTE", "left": {"var": "annual_turnover"}, "right": 1000000},
    ],
}


@pytest.fixture
def knowledge(db) -> dict:
    """One synthetic CENTRAL requirement/rule with a real evidence chain."""
    source = Source.objects.create(
        source_id="SRC-DYN-01",
        title="Synthetic Regulatory Test Gazette",
        authority="TESTAUTHORITY",
        status=SourceStatus.ACTIVE,
    )
    evidence = Evidence.objects.create(
        evidence_id="EVD-DYN-01",
        source=source,
        locator="Section 1",
        excerpt="Synthetic evidence excerpt for dynamic testing.",
        verification_status=VerificationStatus.VERIFIED,
    )
    requirement = RequirementDefinition.objects.create(
        requirement_id="REQ-DYN-CENTRAL-01",
        name="Synthetic Central Test Requirement",
        authority="TESTAUTHORITY",
        category="LICENCE",
        jurisdiction="CENTRAL",
        domain="GENERAL",
        status=KnowledgeStatus.PUBLISHED,
        evidence_refs=[evidence.evidence_id],
    )
    RuleVersion.objects.create(
        rule_id="RULE-DYN-01",
        version=1,
        domain="GENERAL",
        jurisdiction="CENTRAL",
        requirement=requirement,
        status=KnowledgeStatus.PUBLISHED,
        rule_type=RuleType.NORMAL,
        result=ApplicabilityStatus.APPLICABLE,
        condition_ast=TURNOVER_RULE_AST,
        evidence_refs=[evidence.evidence_id],
    )
    return {"requirement": requirement, "evidence": evidence}


def _make_business(db, owner_email: str, name: str) -> Business:
    from apps.accounts.models import User

    user = User.objects.create_user(email=owner_email, password="TestPass123!", full_name="T U")
    return Business.objects.create(name=name, owner=user)


def _profile(business: Business, state: str, description: str, **extra) -> BusinessProfileVersion:
    variables: dict = {
        "state": {"value": state, "origin": VariableOrigin.USER_PROVIDED},
        "product_description": {"value": description, "origin": VariableOrigin.USER_PROVIDED},
    }
    for key, value in extra.items():
        variables[key] = {"value": value, "origin": VariableOrigin.USER_PROVIDED}
    return BusinessProfileVersion.objects.create(business=business, version=1, variables=variables)


def _status_of(run, requirement_id: str) -> str:
    return run.results.get(requirement_id=requirement_id).status


@pytest.mark.django_db
def test_missing_turnover_yields_needs_information_never_not_applicable(knowledge):
    business = _make_business(None, "dyn.missing@example.com", "Dynamic Foods")
    profile = _profile(business, "GUJARAT", "We pack FOOD products.")

    run = ApplicabilityEngine().evaluate_business_profile(
        business=business, profile_version=profile
    )
    status_value = _status_of(run, "REQ-DYN-CENTRAL-01")
    assert status_value == ApplicabilityStatus.NEEDS_INFORMATION
    assert status_value != ApplicabilityStatus.NOT_APPLICABLE


@pytest.mark.django_db
def test_answering_turnover_resolves_to_applicable_with_evidence(knowledge):
    business = _make_business(None, "dyn.answer@example.com", "Dynamic Foods")
    profile = _profile(
        business, "GUJARAT", "We pack FOOD products.", annual_turnover="5000000"
    )

    run = ApplicabilityEngine().evaluate_business_profile(
        business=business, profile_version=profile
    )
    result = run.results.get(requirement_id="REQ-DYN-CENTRAL-01")
    assert result.status == ApplicabilityStatus.APPLICABLE
    assert result.explanation_trace["matched_rule_id"] == "RULE-DYN-01"
    assert result.evidence_refs[0]["evidence_id"] == "EVD-DYN-01"
    assert result.evidence_refs[0]["source_id"] == "SRC-DYN-01"


@pytest.mark.django_db
def test_changed_activity_changes_applicability(knowledge):
    """Identical profiles except the product text: the C-must-track-data bit."""
    food_biz = _make_business(None, "dyn.food@example.com", "Food Biz")
    food_profile = _profile(
        food_biz, "GUJARAT", "We pack FOOD products.", annual_turnover="5000000"
    )
    other_biz = _make_business(None, "dyn.other@example.com", "Textile Biz")
    other_profile = _profile(
        other_biz, "GUJARAT", "We weave cotton garments.", annual_turnover="5000000"
    )

    engine = ApplicabilityEngine()
    food_status = _status_of(
        engine.evaluate_business_profile(business=food_biz, profile_version=food_profile),
        "REQ-DYN-CENTRAL-01",
    )
    other_status = _status_of(
        engine.evaluate_business_profile(business=other_biz, profile_version=other_profile),
        "REQ-DYN-CENTRAL-01",
    )
    assert food_status == ApplicabilityStatus.APPLICABLE
    assert other_status == ApplicabilityStatus.NOT_APPLICABLE


@pytest.mark.django_db
def test_changed_variables_change_questions(knowledge):
    """Questions are the diff between rule-referenced variables and answers."""
    business = _make_business(None, "dyn.questions@example.com", "Dynamic Foods")

    profile = _profile(business, "GUJARAT", "We pack FOOD products.")
    questions_before = get_dynamic_smart_questions(business)
    keys_before = {q["variable_key"] for q in questions_before["questions"]}
    assert "annual_turnover" in keys_before

    BusinessProfileVersion.objects.create(
        business=business,
        version=2,
        variables={
            **profile.variables,
            "annual_turnover": {
                "value": "5000000",
                "origin": VariableOrigin.USER_PROVIDED,
            },
        },
    )
    questions_after = get_dynamic_smart_questions(business)
    keys_after = {q["variable_key"] for q in questions_after["questions"]}
    assert "annual_turnover" not in keys_after


@pytest.mark.django_db
def test_changed_state_changes_question_set(knowledge):
    """A business in a state with no state-level rules must not be asked
    state-rule variables; a business in the rule's state must."""
    # A second, state-scoped requirement referencing a variable the CENTRAL rule
    # does not use.
    requirement = RequirementDefinition.objects.create(
        requirement_id="REQ-DYN-STATE-01",
        name="Synthetic State Requirement",
        authority="STATEAUTHORITY",
        category="CONSENT",
        jurisdiction="GUJARAT",
        domain="ENVIRONMENT",
        status=KnowledgeStatus.PUBLISHED,
        evidence_refs=["EVD-DYN-01"],
    )
    RuleVersion.objects.create(
        rule_id="RULE-DYN-STATE-01",
        version=1,
        domain="ENVIRONMENT",
        jurisdiction="GUJARAT",
        requirement=requirement,
        status=KnowledgeStatus.PUBLISHED,
        rule_type=RuleType.NORMAL,
        result=ApplicabilityStatus.APPLICABLE,
        condition_ast={
            "op": "AND",
            "args": [
                {"op": "EQ", "left": {"var": "state"}, "right": "GUJARAT"},
                {"op": "EQ", "left": {"var": "hazardous_waste_generation"}, "right": True},
            ],
        },
        evidence_refs=["EVD-DYN-01"],
    )

    gujarat_biz = _make_business(None, "dyn.gj@example.com", "GJ Biz")
    _profile(gujarat_biz, "GUJARAT", "We pack FOOD products.", annual_turnover="5000000")
    kerala_biz = _make_business(None, "dyn.kl@example.com", "KL Biz")
    _profile(kerala_biz, "KERALA", "We pack FOOD products.", annual_turnover="5000000")

    gj_questions = {q["variable_key"] for q in get_dynamic_smart_questions(gujarat_biz)["questions"]}
    kl_questions = {q["variable_key"] for q in get_dynamic_smart_questions(kerala_biz)["questions"]}

    assert "hazardous_waste_generation" in gj_questions
    assert "hazardous_waste_generation" not in kl_questions


@pytest.mark.django_db
def test_export_destination_multi_choice_coercion_and_submission():
    """MULTI_CHOICE variables like export_destination accept lists, comma-separated strings,
    and single strings without throwing 'must be a list' validation errors."""
    from domain.profile.variables import get_variable, coerce_value
    from apps.onboarding.services import save_smart_question_answers

    var = get_variable("export_destination")
    assert var is not None

    # 1. Direct coercion guarantees
    assert coerce_value(var, ["US", "EU"]) == ["US", "EU"]
    assert coerce_value(var, "US, EU, UAE") == ["US", "EU", "UAE"]
    assert coerce_value(var, "US") == ["US"]
    assert coerce_value(var, '["US", "EU"]') == ["US", "EU"]
    assert coerce_value(var, "") is None
    assert coerce_value(var, None) is None

    # 2. End-to-end saving via save_smart_question_answers with comma-separated string
    biz = _make_business(None, "dyn.exp@example.com", "Export Biz")
    profile = _profile(biz, "MAHARASHTRA", "Food processing and export", annual_turnover="5000000")

    updated_profile = save_smart_question_answers(
        business=biz,
        answers={"export_destination": "United States, European Union, UAE"},
        user=None,
    )
    assert updated_profile.raw_value("export_destination") == ["United States", "European Union", "UAE"]

    # 3. End-to-end saving with already-split list
    updated_profile2 = save_smart_question_answers(
        business=biz,
        answers={"export_destination": ["Japan", "Australia"]},
        user=None,
    )
    assert updated_profile2.raw_value("export_destination") == ["Japan", "Australia"]

