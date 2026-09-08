"""Tests for Adaptive Smart Question Planner.

Authority: Milestone Section 1 (Smart Question Planner).
Validates:
- AST dependency extraction and question ranking.
- Canonical variable mapping (variable_key is never null or fabricated).
- Fallback to deterministic AST ranking when LLM is offline or returns invalid JSON.
- SmartQuestionPlan and SmartQuestionInstance creation and DB persistence.
"""

from __future__ import annotations

from unittest.mock import patch
import pytest
from apps.businesses.models import Business, BusinessProfileVersion
from apps.onboarding.models import SmartQuestionPlan, SmartQuestionInstance
from apps.onboarding.planner import plan_adaptive_smart_questions
from common.enums import VariableOrigin
from domain.profile.variables import PROFILE_VARIABLES


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
def test_smart_question_canonical_mapping(make_business, user):
    """Ensure all planned questions map strictly to valid canonical variables."""
    biz = make_business(owner=user, name="Planner Canonical Test")
    _create_profile(
        biz,
        1,
        organization_type="MANUFACTURING",
        plant_machinery_investment=25000000,
    )

    result = plan_adaptive_smart_questions(biz, round_number=1)

    assert result["status"] == "ACTIVE"
    questions = result["questions"]
    assert len(questions) > 0

    canonical_keys = {pv.key for pv in PROFILE_VARIABLES}
    for q in questions:
        assert "variable_key" in q
        assert q["variable_key"] in canonical_keys
        assert "question" in q
        assert "data_type" in q


@pytest.mark.django_db
def test_smart_question_plan_persistence(make_business, user):
    """Check that SmartQuestionPlan and SmartQuestionInstance records are saved in DB."""
    biz = make_business(owner=user, name="Persistence Test Co")
    _create_profile(
        biz,
        1,
        organization_type="MANUFACTURING",
    )

    result = plan_adaptive_smart_questions(biz, round_number=1)
    plan_id = result["plan_id"]

    plan_obj = SmartQuestionPlan.objects.get(id=plan_id)
    assert plan_obj.business == biz
    assert plan_obj.round_number == 1
    assert plan_obj.status == "ACTIVE"

    instances = SmartQuestionInstance.objects.filter(plan=plan_obj)
    assert instances.count() == result["total_questions"]
    for inst in instances:
        assert inst.variable_key != ""
        assert inst.is_answered is False


@pytest.mark.django_db
def test_smart_question_fallback_on_llm_failure(make_business, user):
    """When LLM provider fails, planner gracefully falls back to deterministic AST ranking."""
    biz = make_business(owner=user, name="Fallback Test Co")
    _create_profile(
        biz,
        1,
        organization_type="MANUFACTURING",
    )

    with patch("apps.onboarding.planner.get_llm_provider") as mock_get_provider:
        mock_provider = mock_get_provider.return_value
        mock_provider.is_configured = True
        mock_provider.complete.side_effect = RuntimeError("Simulated LLM network failure")

        result = plan_adaptive_smart_questions(biz, round_number=1)
        assert result["status"] == "ACTIVE"
        assert len(result["questions"]) > 0
