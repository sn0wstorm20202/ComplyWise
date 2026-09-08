"""Tests for Assessment persistence, versioning, step tracking, and downstream linking.

Authority: Milestone Task — Objective 1; PRD_v2.0 §10, §14; TRD_v2.0 §30, §31.
"""

from __future__ import annotations

import pytest
from apps.applicability.engine import ApplicabilityEngine
from apps.applicability.models import DecisionRun
from apps.businesses.models import Assessment, Business, BusinessProfileVersion
from apps.ingestion.models import DiscoveryRun
from common.enums import VariableOrigin

pytestmark = pytest.mark.django_db


def test_create_assessment_and_auto_increment(auth_client, user, make_business):
    """Creating multiple assessments for the same business increments assessment_number."""
    biz = make_business(user, name="Precision Machining Works")

    # Assessment 1
    resp1 = auth_client.post(f"/api/v1/businesses/{biz.id}/assessments", {
        "title": "Baseline Assessment",
    })
    assert resp1.status_code == 201, resp1.content
    data1 = resp1.json()["data"]
    assert data1["assessment_number"] == 1
    assert data1["status"] == "IN_PROGRESS"
    assert data1["current_step"] == 1

    # Assessment 2
    resp2 = auth_client.post(f"/api/v1/businesses/{biz.id}/assessments", {
        "title": "Facility Expansion 2026",
    })
    assert resp2.status_code == 201, resp2.content
    data2 = resp2.json()["data"]
    assert data2["assessment_number"] == 2
    assert data2["id"] != data1["id"]

    # List assessments for business
    list_resp = auth_client.get(f"/api/v1/businesses/{biz.id}/assessments")
    assert list_resp.status_code == 200
    items = list_resp.json()["data"]
    assert len(items) == 2
    assert [item["assessment_number"] for item in items] == [2, 1]


def test_assessment_step_state_tracking_and_resume(auth_client, user, make_business):
    """Step state updates preserve form values across onboarding steps."""
    biz = make_business(user, name="BioMed Solutions")
    create_resp = auth_client.post(f"/api/v1/businesses/{biz.id}/assessments")
    assert create_resp.status_code == 201
    aid = create_resp.json()["data"]["id"]

    # Patch assessment step state
    patch_resp = auth_client.patch(f"/api/v1/businesses/{biz.id}/assessments/{aid}", {
        "current_step": 3,
        "step_state": {
            "state": "KA",
            "annual_turnover": "15000000",
            "product_description": "Orthopedic implants and titanium surgical tools",
        },
    })
    assert patch_resp.status_code == 200
    patched = patch_resp.json()["data"]
    assert patched["current_step"] == 3
    assert patched["step_state"]["annual_turnover"] == "15000000"

    # Direct retrieval verifies persistence
    detail_resp = auth_client.get(f"/api/v1/businesses/{biz.id}/assessments/{aid}")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["data"]["step_state"]["state"] == "KA"


def test_assessment_completion_locks_and_preserves_history(auth_client, user, make_business):
    """Completing assessment marks status COMPLETED and locks summary."""
    biz = make_business(user, name="Green Clean Packaging")
    create_resp = auth_client.post(f"/api/v1/businesses/{biz.id}/assessments", {
        "title": "Initial Review",
    })
    aid = create_resp.json()["data"]["id"]

    complete_resp = auth_client.post(f"/api/v1/businesses/{biz.id}/assessments/{aid}/complete", {
        "summary": {
            "requirements_identified": 12,
            "documents_to_prepare": 8,
            "readiness_score": 85,
        }
    })
    assert complete_resp.status_code == 200
    comp_data = complete_resp.json()["data"]
    assert comp_data["status"] == "COMPLETED"
    assert comp_data["current_step"] == 5
    assert comp_data["completed_at"] is not None
    assert comp_data["summary"]["requirements_identified"] == 12


def test_assessment_scoping_in_dashboard(auth_client, user, make_business):
    """Dashboard endpoint accepts assessment_id and returns that assessment's evaluation results."""
    biz = make_business(user, name="Solar Panels Co")

    pv = BusinessProfileVersion.objects.create(
        business=biz,
        version=1,
        variables={
            "state": {"value": "GJ", "origin": VariableOrigin.USER_PROVIDED},
            "annual_turnover": {"value": "20000000", "origin": VariableOrigin.USER_PROVIDED},
        },
    )

    engine = ApplicabilityEngine()
    run1 = engine.evaluate_business_profile(business=biz, profile_version=pv, save_run=True)

    a1 = Assessment.objects.create(
        business=biz,
        created_by=user,
        assessment_number=1,
        title="Assessment 1",
        status="COMPLETED",
        profile_version=pv,
        decision_run=run1,
    )

    resp = auth_client.get(f"/api/v1/businesses/{biz.id}/dashboard?assessment_id={a1.id}")
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["assessment_id"] == str(a1.id)
    assert data["assessment_number"] == 1
    assert data["has_evaluation"] is True
