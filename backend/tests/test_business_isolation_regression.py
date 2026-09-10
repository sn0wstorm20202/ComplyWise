"""Permanent regression test for business identity and DecisionRun isolation.

Authority: Part 8 of Critical Onboarding -> Analysis -> Dashboard Data-Flow Audit.

Proves:
1. Business A (Shree Ganesh Foods Pvt Ltd) and Business B (Eastern GridCell Energy Pvt. Ltd.)
   maintain strict isolation across profile versions, Smart Questions, DecisionRuns, and Dashboard metrics.
2. Business A dashboard returns only A's data; Business B dashboard returns only B's data.
3. B never receives A's DecisionRun; A never receives B's DecisionRun.
4. Cross-business DecisionRun queries return HTTP 404.
5. Creating/evaluating B does not mutate A's latest result or DecisionRun.
6. Smart Questions for B uses B's profile, never A's profile.
7. An API failure does NOT become "0 Variables Needed" or stale previous data.
"""

from __future__ import annotations

import uuid
import pytest
from rest_framework import status
from rest_framework.test import APIClient

from common.enums import ApplicabilityStatus
from apps.accounts.models import User
from apps.applicability.models import DecisionRun
from apps.applicability.engine import ApplicabilityEngine
from apps.businesses.models import Business, BusinessMembership, BusinessProfileVersion
from apps.dashboard.services import get_dashboard_summary
from apps.knowledge.loader import KnowledgePackLoader
from apps.onboarding.services import get_dynamic_smart_questions


@pytest.fixture(scope="module")
def loaded_packs(django_db_setup, django_db_blocker):
    with django_db_blocker.unblock():
        loader = KnowledgePackLoader()
        counts = loader.load_all_packs()
        yield counts


@pytest.fixture
def owner_user(db) -> User:
    return User.objects.create_user(
        email="audit.officer@example.com",
        password="ValidPassword123!",
        full_name="Lead Audit Officer",
    )


@pytest.fixture
def api_client(owner_user) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=owner_user)
    return client


@pytest.mark.django_db
def test_business_isolation_and_no_stale_data(loaded_packs, owner_user, api_client):
    """Prove strict isolation between Shree Ganesh Foods and Eastern GridCell Energy."""
    engine = ApplicabilityEngine()

    # ------------------------------------------------------------------
    # 1. Create Business A: Shree Ganesh Foods Pvt Ltd (Gujarat Food)
    # ------------------------------------------------------------------
    biz_a = Business.objects.create(name="Shree Ganesh Foods Pvt Ltd", owner=owner_user)
    BusinessMembership.objects.create(business=biz_a, user=owner_user, role=BusinessMembership.Role.OWNER)

    vars_a = {
        "state": {"value": "GUJARAT", "origin": "USER_PROVIDED"},
        "legal_constitution": {"value": "PRIVATE_LIMITED", "origin": "USER_PROVIDED"},
        "district": {"value": "Ahmedabad", "origin": "USER_PROVIDED"},
        "industrial_zone_status": {"value": "INSIDE_NOTIFIED_INDUSTRIAL_AREA", "origin": "USER_PROVIDED"},
        "lifecycle_stage": {"value": "OPERATIONAL", "origin": "USER_PROVIDED"},
        "plant_machinery_investment": {"value": "12000000", "origin": "USER_PROVIDED"},
        "annual_turnover": {"value": "45000000", "origin": "USER_PROVIDED"},
        "total_worker_count": {"value": 25, "origin": "USER_PROVIDED"},
        "connected_power_load": {"value": "35.0", "origin": "USER_PROVIDED"},
        "effluent_emission_generation": {"value": True, "origin": "USER_PROVIDED"},
        "product_description": {"value": "Manufacture of bakery biscuits, snacks and processed food", "origin": "USER_PROVIDED"},
        "import_export_intent": {"value": "IMPORT_AND_EXPORT", "origin": "USER_PROVIDED"},
    }
    prof_a = BusinessProfileVersion.objects.create(
        business=biz_a, version=1, variables=vars_a, change_note="Initial profile A"
    )

    run_a = engine.evaluate_business_profile(business=biz_a, profile_version=prof_a, save_run=True)
    results_a = {r.requirement_id: r.status for r in run_a.results.all()}

    # Verify A results
    assert results_a["REQ-FSSAI-STATE-LICENCE"] == ApplicabilityStatus.APPLICABLE
    assert results_a["REQ-GPCB-CTE"] == ApplicabilityStatus.APPLICABLE
    assert results_a["REQ-GUJ-FACTORY-LICENSE"] == ApplicabilityStatus.APPLICABLE

    # Dashboard A verification
    dash_a = get_dashboard_summary(biz_a)
    assert dash_a["business_id"] == str(biz_a.id)
    assert dash_a["business_name"] == "Shree Ganesh Foods Pvt Ltd"
    assert dash_a["metrics"]["applicable_count"] >= 3
    initial_a_applicable = dash_a["metrics"]["applicable_count"]

    # ------------------------------------------------------------------
    # 2. Create Business B: Eastern GridCell Energy Pvt. Ltd. (West Bengal Battery)
    # ------------------------------------------------------------------
    biz_b = Business.objects.create(name="Eastern GridCell Energy Pvt. Ltd.", owner=owner_user)
    BusinessMembership.objects.create(business=biz_b, user=owner_user, role=BusinessMembership.Role.OWNER)

    vars_b = {
        "state": {"value": "WEST_BENGAL", "origin": "USER_PROVIDED"},
        "legal_constitution": {"value": "PRIVATE_LIMITED", "origin": "USER_PROVIDED"},
        "district": {"value": "Kolkata", "origin": "USER_PROVIDED"},
        "industrial_zone_status": {"value": "INSIDE_NOTIFIED_INDUSTRIAL_AREA", "origin": "USER_PROVIDED"},
        "lifecycle_stage": {"value": "OPERATIONAL", "origin": "USER_PROVIDED"},
        "plant_machinery_investment": {"value": "80000000", "origin": "USER_PROVIDED"},
        "annual_turnover": {"value": "140000000", "origin": "USER_PROVIDED"},
        "total_worker_count": {"value": 85, "origin": "USER_PROVIDED"},
        "product_description": {
            "value": (
                "Manufacturing and assembly of lithium-ion battery packs used in commercial and "
                "industrial battery energy-storage systems, including battery modules, battery "
                "management systems, protection circuits, enclosures, and associated electrical components."
            ),
            "origin": "USER_PROVIDED",
        },
        "import_export_intent": {"value": "IMPORT_AND_EXPORT", "origin": "USER_PROVIDED"},
    }
    prof_b = BusinessProfileVersion.objects.create(
        business=biz_b, version=1, variables=vars_b, change_note="Initial profile B"
    )

    # ------------------------------------------------------------------
    # 3. Smart Questions for Business B must use B's profile
    # ------------------------------------------------------------------
    questions_b_data = get_dynamic_smart_questions(biz_b)
    assert questions_b_data["business_id"] == str(biz_b.id)
    assert questions_b_data["business_name"] == "Eastern GridCell Energy Pvt. Ltd."
    assert questions_b_data["total_missing"] >= 0
    assert questions_b_data["known_variables_count"] == 10

    # ------------------------------------------------------------------
    # 4. Evaluate Business B
    # ------------------------------------------------------------------
    run_b = engine.evaluate_business_profile(business=biz_b, profile_version=prof_b, save_run=True)
    results_b = {r.requirement_id: r.status for r in run_b.results.all()}

    # B has DGFT IEC APPLICABLE, all state requirements NOT_APPLICABLE
    assert results_b["REQ-DGFT-IEC"] == ApplicabilityStatus.APPLICABLE
    assert results_b["REQ-GPCB-CTE"] == ApplicabilityStatus.NOT_APPLICABLE
    assert results_b["REQ-GUJ-FACTORY-LICENSE"] == ApplicabilityStatus.NOT_APPLICABLE
    assert results_b["REQ-FSSAI-STATE-LICENCE"] == ApplicabilityStatus.NOT_APPLICABLE
    assert results_b["REQ-TSPCB-CTE"] == ApplicabilityStatus.NOT_APPLICABLE

    # Dashboard B verification
    dash_b = get_dashboard_summary(biz_b)
    assert dash_b["business_id"] == str(biz_b.id)
    assert dash_b["business_name"] == "Eastern GridCell Energy Pvt. Ltd."
    assert dash_b["metrics"]["applicable_count"] == 1
    assert dash_b["metrics"]["not_applicable_count"] >= 10

    # ------------------------------------------------------------------
    # 5. Isolation Invariants
    # ------------------------------------------------------------------
    # B never receives A's DecisionRun
    assert run_b.id != run_a.id
    assert run_a.business == biz_a
    assert run_b.business == biz_b

    # Creating / evaluating B did NOT mutate A's latest dashboard results
    dash_a_after = get_dashboard_summary(biz_a)
    assert dash_a_after["business_name"] == "Shree Ganesh Foods Pvt Ltd"
    assert dash_a_after["metrics"]["applicable_count"] == initial_a_applicable

    # Verify via API client scoping
    resp_a = api_client.get(f"/api/v1/businesses/{biz_a.id}/dashboard")
    assert resp_a.status_code == status.HTTP_200_OK
    assert resp_a.json()["data"]["business_name"] == "Shree Ganesh Foods Pvt Ltd"

    resp_b = api_client.get(f"/api/v1/businesses/{biz_b.id}/dashboard")
    assert resp_b.status_code == status.HTTP_200_OK
    assert resp_b.json()["data"]["business_name"] == "Eastern GridCell Energy Pvt. Ltd."

    # Cross-business decision run query returns 404
    resp_cross_1 = api_client.get(f"/api/v1/businesses/{biz_a.id}/decisions/{run_b.id}")
    assert resp_cross_1.status_code == status.HTTP_404_NOT_FOUND

    resp_cross_2 = api_client.get(f"/api/v1/businesses/{biz_b.id}/decisions/{run_a.id}")
    assert resp_cross_2.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_smart_questions_missing_variables_vs_zero(loaded_packs, owner_user, api_client):
    """Prove that Smart Questions genuinely asks for missing variables and does not falsely report 0."""
    biz = Business.objects.create(name="Incomplete Battery Maker", owner=owner_user)
    BusinessMembership.objects.create(business=biz, user=owner_user, role=BusinessMembership.Role.OWNER)

    vars_incomplete = {
        "state": {"value": "WEST_BENGAL", "origin": "USER_PROVIDED"},
        "legal_constitution": {"value": "PRIVATE_LIMITED", "origin": "USER_PROVIDED"},
        "product_description": {"value": "Battery components", "origin": "USER_PROVIDED"},
    }
    BusinessProfileVersion.objects.create(business=biz, version=1, variables=vars_incomplete)

    resp = api_client.get(f"/api/v1/businesses/{biz.id}/onboarding/questions")
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()["data"]

    assert data["total_missing"] > 0
    missing_keys = {q["variable_key"] for q in data["questions"]}
    assert "annual_turnover" in missing_keys
    assert "import_export_intent" in missing_keys


@pytest.mark.django_db
def test_api_failure_does_not_mask_as_zero_questions(api_client):
    """Prove that an API error returns an explicit error envelope, never a fake 0 questions result."""
    fake_id = uuid.uuid4()
    resp = api_client.get(f"/api/v1/businesses/{fake_id}/onboarding/questions")
    assert resp.status_code == status.HTTP_404_NOT_FOUND
    err = resp.json()
    assert "error" in err
    assert err["error"]["code"] == "NOT_FOUND"
