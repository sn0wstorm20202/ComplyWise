"""Tests for onboarding, smart questions, and dashboard aggregation.

Authority: PRD_v2.0 §10, §14; TRD_v2.0 §8, §30, §31, §32.
"""

from __future__ import annotations

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from common.enums import (
    ApplicabilityStatus,
    KnowledgeStatus,
    RuleType,
    SourceStatus,
    VerificationStatus,
)
from apps.accounts.models import User
from apps.businesses.models import Business, BusinessMembership, BusinessProfileVersion
from apps.evidence.models import Evidence, Source
from apps.knowledge.models import RequirementDefinition, RuleVersion


@pytest.fixture
def test_user(db) -> User:
    return User.objects.create_user(
        email="onboarding.founder@example.com",
        password="ValidPassword123!",
        full_name="Onboarding Founder",
    )


@pytest.fixture
def other_user(db) -> User:
    return User.objects.create_user(
        email="other.founder@example.com",
        password="ValidPassword123!",
        full_name="Other Founder",
    )


@pytest.fixture
def test_business(db, test_user) -> Business:
    biz = Business.objects.create(name="Shree Krishna Foods LLP", owner=test_user)
    BusinessMembership.objects.create(
        business=biz,
        user=test_user,
        role=BusinessMembership.Role.OWNER,
    )
    return biz


@pytest.fixture
def test_knowledge(db) -> RequirementDefinition:
    source = Source.objects.create(
        source_id="SRC-FSSAI-001",
        title="Food Safety Standards Act",
        authority="FSSAI",
        status=SourceStatus.ACTIVE,
    )
    ev = Evidence.objects.create(
        evidence_id="EVD-FSSAI-001",
        source=source,
        locator="Sec 31",
        excerpt="Food licence mandatory",
        verification_status=VerificationStatus.VERIFIED,
    )
    req = RequirementDefinition.objects.create(
        requirement_id="REQ-FSSAI-STATE",
        name="FSSAI State Licence",
        authority="FSSAI",
        category="LICENCE",
        jurisdiction="GUJARAT",
        domain="FOOD",
        status=KnowledgeStatus.PUBLISHED,
        evidence_refs=[ev.evidence_id],
    )
    # Rule references 'annual_turnover' and 'total_worker_count'
    RuleVersion.objects.create(
        rule_id="RULE-FSSAI-SCALE",
        version=1,
        domain="FOOD",
        jurisdiction="GUJARAT",
        requirement=req,
        status=KnowledgeStatus.PUBLISHED,
        rule_type=RuleType.NORMAL,
        result=ApplicabilityStatus.APPLICABLE,
        condition_ast={
            "op": "AND",
            "args": [
                {"op": "EQ", "left": {"var": "state"}, "right": "GUJARAT"},
                {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "FOOD"},
                {"op": "GTE", "left": {"var": "annual_turnover"}, "right": 1200000},
                {"op": "GTE", "left": {"var": "total_worker_count"}, "right": 10},
            ],
        },
        evidence_refs=[ev.evidence_id],
    )
    return req


@pytest.mark.django_db
def test_dynamic_smart_questions_generation(test_user, test_business, test_knowledge):
    """Smart questions must be data-driven based on missing variables in candidate rules."""
    client = APIClient()
    client.force_authenticate(user=test_user)

    # Initial profile with only state
    BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={"state": {"value": "Gujarat", "origin": "USER_PROVIDED"}},
    )

    url = f"/api/v1/businesses/{test_business.id}/onboarding/questions"
    res = client.get(url)
    assert res.status_code == status.HTTP_200_OK
    assert "data" in res.data
    data = res.data["data"]

    questions = data["questions"]
    question_keys = [q["key"] for q in questions]

    # Rule references 'annual_turnover' and 'total_worker_count', which are missing
    assert "annual_turnover" in question_keys
    assert "total_worker_count" in question_keys

    # Each question has explanation of why it matters
    turnover_q = next(q for q in questions if q["key"] == "annual_turnover")
    assert turnover_q["why_it_matters"] != ""
    assert turnover_q["data_type"] == "CURRENCY_INR"


@pytest.mark.django_db
def test_submit_answers_persists_new_profile_version(test_user, test_business):
    """Submitting answers must create an immutable BusinessProfileVersion."""
    client = APIClient()
    client.force_authenticate(user=test_user)

    # Create initial version
    BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={"state": {"value": "GUJARAT", "origin": "USER_PROVIDED"}},
    )

    url = f"/api/v1/businesses/{test_business.id}/onboarding/answers"
    payload = {
        "answers": {
            "annual_turnover": 2500000,
            "total_worker_count": 15,
        }
    }
    res = client.post(url, data=payload, format="json")
    assert res.status_code == status.HTTP_200_OK

    current = test_business.current_profile
    assert current.version == 2
    assert "annual_turnover" in current.variables
    assert current.variables["annual_turnover"]["value"] == "2500000"
    assert current.variables["total_worker_count"]["value"] == 15
    # Previous state variable carried forward
    assert current.variables["state"]["value"] == "GUJARAT"


@pytest.mark.django_db
def test_products_activities_submission(test_user, test_business, test_knowledge):
    """Products and activities endpoint saves natural language text and returns detected hints."""
    client = APIClient()
    client.force_authenticate(user=test_user)

    url = f"/api/v1/businesses/{test_business.id}/onboarding/products-activities"
    payload = {
        "product_description": "We manufacture and package organic food: fruit juices, jams, and pickles.",
        "import_export_intent": "NONE",
    }
    res = client.post(url, data=payload, format="json")
    assert res.status_code == status.HTTP_200_OK
    assert "data" in res.data
    data = res.data["data"]
    # Detected activities are the text probes published rules actually search for,
    # not a curated label set. "FOOD" is what the FSSAI rule matches on.
    assert "FOOD" in data["detected_activities"]

    current = test_business.current_profile
    assert current is not None
    assert "product_description" in current.variables
    assert "fruit juices" in current.variables["product_description"]["value"]


@pytest.mark.django_db
def test_dashboard_summary_with_evaluation(test_user, test_business, test_knowledge):
    """Dashboard endpoint aggregates compliance score, priority actions, and metrics."""
    client = APIClient()
    client.force_authenticate(user=test_user)

    # Profile meeting the rule
    profile = BusinessProfileVersion.objects.create(
        business=test_business,
        version=1,
        variables={
            "state": {"value": "Gujarat", "origin": "USER_PROVIDED"},
            "product_description": {"value": "Food processing unit", "origin": "USER_PROVIDED"},
            "annual_turnover": {"value": "2500000", "origin": "USER_PROVIDED"},
            "total_worker_count": {"value": 20, "origin": "USER_PROVIDED"},
        },
    )

    # Evaluate business
    eval_url = f"/api/v1/businesses/{test_business.id}/evaluate"
    client.post(eval_url, format="json")

    # Fetch dashboard
    dash_url = f"/api/v1/businesses/{test_business.id}/dashboard"
    res = client.get(dash_url)
    assert res.status_code == status.HTTP_200_OK
    data = res.data["data"]

    assert data["has_evaluation"] is True
    assert data["compliance_readiness"] > 0
    assert data["metrics"]["applicable_count"] >= 1
    assert len(data["priority_actions"]) >= 1


@pytest.mark.django_db
def test_onboarding_tenant_isolation(other_user, test_business):
    """Other users must not access another business's onboarding or questions."""
    client = APIClient()
    client.force_authenticate(user=other_user)

    url = f"/api/v1/businesses/{test_business.id}/onboarding/questions"
    res = client.get(url)
    assert res.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_end_to_end_onboarding_journey(test_user, test_knowledge):
    """Verify complete user journey from profile save through dashboard."""
    client = APIClient()

    # 1. Unauthenticated canonical variable definition fetch
    res_vars = client.get("/api/v1/profile/variables")
    assert res_vars.status_code == status.HTTP_200_OK
    assert len(res_vars.json()["data"]) >= 8

    # 2. Authenticate
    client.force_authenticate(user=test_user)

    # 3. Create Business
    res_biz = client.post("/api/v1/businesses", data={"name": "Patanjali Organics Pvt Ltd"}, format="json")
    assert res_biz.status_code == status.HTTP_201_CREATED
    biz_id = res_biz.json()["data"]["id"]

    # 4. Save Business Profile with canonical keys
    profile_payload = {
        "variables": {
            "legal_constitution": {"value": "PRIVATE_LIMITED", "origin": "USER_PROVIDED"},
            "state": {"value": "GUJARAT", "origin": "USER_PROVIDED"},
            "district": {"value": "Ahmedabad", "origin": "USER_PROVIDED"},
            "industrial_zone_status": {"value": "INSIDE_NOTIFIED_INDUSTRIAL_AREA", "origin": "USER_PROVIDED"},
            "lifecycle_stage": {"value": "OPERATIONAL", "origin": "USER_PROVIDED"},
            "plant_machinery_investment": {"value": 45000000, "origin": "USER_PROVIDED"},
            "annual_turnover": {"value": 85000000, "origin": "USER_PROVIDED"},
            "total_worker_count": {"value": 38, "origin": "USER_PROVIDED"},
        }
    }
    res_prof = client.post(f"/api/v1/businesses/{biz_id}/profile", data=profile_payload, format="json")
    assert res_prof.status_code == status.HTTP_201_CREATED
    assert res_prof.json()["data"]["version"] == 1

    # 5. Save Products & Activities
    res_prod = client.post(
        f"/api/v1/businesses/{biz_id}/onboarding/products-activities",
        data={
            "product_description": "We manufacture and process packaged fruit juices and health supplements.",
            "import_export_intent": "IMPORT_AND_EXPORT",
        },
        format="json",
    )
    assert res_prod.status_code == status.HTTP_200_OK

    # 6. Get Smart Questions
    res_q = client.get(f"/api/v1/businesses/{biz_id}/onboarding/questions")
    assert res_q.status_code == status.HTTP_200_OK
    questions = res_q.json()["data"]["questions"]
    assert isinstance(questions, list)

    # 7. Submit Smart Question Answers
    res_ans = client.post(
        f"/api/v1/businesses/{biz_id}/onboarding/answers",
        data={"answers": {"annual_turnover": 85000000, "total_worker_count": 38}},
        format="json",
    )
    assert res_ans.status_code == status.HTTP_200_OK
    assert res_ans.json()["data"]["profile_version"]["version"] >= 1

    # 8. Evaluate Applicability
    res_eval = client.post(f"/api/v1/businesses/{biz_id}/evaluate", format="json")
    assert res_eval.status_code == status.HTTP_200_OK

    # 9. Access Dashboard
    res_dash = client.get(f"/api/v1/businesses/{biz_id}/dashboard")
    assert res_dash.status_code == status.HTTP_200_OK
    assert res_dash.json()["data"]["has_evaluation"] is True

