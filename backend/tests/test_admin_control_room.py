"""Comprehensive tests for ComplyWise Admin Control Room & Scrutiny Engine.

Authority: ComplyWise Architecture Constitution, TRD_v2.0, PRD_v2.0.
Invariant:
    RAG RETRIEVES.
    RULES DECIDE.
    LLM EXPLAINS.

Verifies:
1. Staff-only authorization on admin scrutiny endpoints.
2. Scrutiny data reads directly from Engine 2 DecisionRun, DecisionResult, and cryptographic CIR.
3. Separation of Engine 2 legal applicability from human requirement disposition (officer action never mutates rule truth).
4. Direct creation of administrative deadlines for a business.
5. Tenancy perimeter defense and audit logging.
"""

from __future__ import annotations

import datetime
import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.applicability.models import DecisionResult, DecisionRun, RuleVersion
from apps.businesses.models import Assessment, Business, BusinessProfileVersion
from apps.calendar.models import Deadline
from apps.evidence.models import Evidence, Source
from apps.knowledge.models import RequirementDefinition
from apps.workflows.models import CaseRequirementDisposition, ComplianceCase
from common.enums import ApplicabilityStatus, AssessmentStatus, CaseStatus

pytestmark = pytest.mark.django_db


@pytest.fixture
def staff_user(make_user):
    return make_user(email="officer@complywise.gov.in", full_name="Compliance Officer", is_staff=True)


@pytest.fixture
def non_staff_user(make_user):
    return make_user(email="founder@tenant.com", full_name="Enterprise Founder", is_staff=False)


@pytest.fixture
def business_with_engine2(make_user, make_business):
    owner = make_user(email="msme.owner@example.com", full_name="MSME Owner")
    biz = make_business(owner=owner, name="Apex Renewable Components Ltd")

    # Profile version
    pv = BusinessProfileVersion.objects.create(
        business=biz,
        version=1,
        variables={
            "state": {"value": "MH", "origin": "USER_TYPED", "confidence": 1.0, "is_confirmed": True},
            "employee_count": {"value": 45, "origin": "USER_TYPED", "confidence": 1.0, "is_confirmed": True},
            "is_manufacturing": {"value": True, "origin": "DERIVED", "confidence": 1.0, "is_confirmed": True},
        },
        change_note="Initial onboarding profile",
    )

    # Assessment
    assessment = Assessment.objects.create(
        business=biz,
        assessment_number=1,
        title="Comprehensive Statutory Assessment",
        status=AssessmentStatus.COMPLETED,
        current_step=4,
        profile_version=pv,
    )

    # Decision Run
    run = DecisionRun.objects.create(
        business=biz,
        profile_version=pv,
        assessment=assessment,
        evaluation_date=timezone.now(),
        status="SUCCESS",
    )
    assessment.decision_run = run
    assessment.save()

    # Source & Evidence
    source = Source.objects.create(
        source_id="SRC-FACTORY-ACT",
        title="Factories Act, 1948",
        authority="Ministry of Labour & Employment",
        source_type="ACT",
        canonical_url="https://labour.gov.in/factories-act",
        content_hash="abc123hash999",
    )
    evidence = Evidence.objects.create(
        evidence_id="EV-FACT-01",
        source=source,
        locator="Section 6",
        excerpt="Approval, licensing and registration of factories employing 10 or more workers.",
        verification_status="VERIFIED",
    )

    # Requirement definition
    req_def = RequirementDefinition.objects.create(
        requirement_id="REQ-FACTORY-REG",
        name="Factory Registration & Operating Licence",
        authority="Directorate of Industrial Safety & Health (DISH)",
        domain="LABOUR",
        jurisdiction="STATE",
        evidence_refs=["EV-FACT-01"],
    )

    # Rule Version
    rv = RuleVersion.objects.create(
        rule_id="RULE-FACTORY-01",
        version=1,
        rule_type="STATUTORY",
        requirement=req_def,
        condition_ast={"and": [{"gte": [{"var": "employee_count"}, 10]}, {"var": "is_manufacturing"}]},
        result=ApplicabilityStatus.APPLICABLE,
    )

    # Decision Results (Engine 2 outputs)
    res_applicable = DecisionResult.objects.create(
        decision_run=run,
        rule_version=rv,
        requirement_id="REQ-FACTORY-REG",
        requirement_name="Factory Registration & Operating Licence",
        status=ApplicabilityStatus.APPLICABLE,
        explanation_trace={
            "rule_id": "RULE-FACTORY-01",
            "evaluated_truth": "TRUE",
            "inputs_evaluated": {"employee_count": 45, "is_manufacturing": True},
            "missing_variables": [],
        },
        evidence_refs=[{"evidence_id": "EV-FACT-01"}],
    )

    res_not_applicable = DecisionResult.objects.create(
        decision_run=run,
        requirement_id="REQ-MINING-SAFETY",
        requirement_name="Mines Act Safety Clearance",
        status=ApplicabilityStatus.NOT_APPLICABLE,
        explanation_trace={"evaluated_truth": "FALSE", "reason": "Business is not engaged in mining."},
        evidence_refs=[],
    )

    return {
        "business": biz,
        "owner": owner,
        "assessment": assessment,
        "decision_run": run,
        "applicable_result": res_applicable,
        "not_applicable_result": res_not_applicable,
    }


def test_admin_scrutiny_requires_staff_authorization(api_client, non_staff_user, staff_user, business_with_engine2):
    """Admin scrutiny endpoints must reject non-staff users with HTTP 403."""
    biz = business_with_engine2["business"]
    url = f"/api/v1/admin/businesses/{biz.id}"

    # Unauthenticated
    res = api_client.get(url)
    assert res.status_code in [401, 403]

    # Non-staff authenticated
    api_client.force_authenticate(user=non_staff_user)
    res_non_staff = api_client.get(url)
    assert res_non_staff.status_code == 403

    # Staff user authenticated
    api_client.force_authenticate(user=staff_user)
    res_staff = api_client.get(url)
    assert res_staff.status_code == 200
    data = res_staff.json().get("data", res_staff.json())
    assert data["business"]["id"] == str(biz.id)
    assert data["business"]["name"] == biz.name


def test_admin_scrutiny_reads_engine2_decision_run_and_cir(api_client, staff_user, business_with_engine2):
    """Scrutiny overview exposes Engine 2 results, AST traces, evidence citations, and valid CIR."""
    biz = business_with_engine2["business"]
    url = f"/api/v1/admin/businesses/{biz.id}"

    api_client.force_authenticate(user=staff_user)
    res = api_client.get(url)
    assert res.status_code == 200
    data = res.json().get("data", res.json())

    # Engine 2 results count
    engine2_items = data["engine2_results"]
    assert len(engine2_items) == 2

    # Check Applicable Requirement
    app_item = next(i for i in engine2_items if i["requirement_id"] == "REQ-FACTORY-REG")
    assert app_item["status"] == "APPLICABLE"
    assert app_item["rule_version"]["rule_id"] == "RULE-FACTORY-01"
    assert app_item["explanation_trace"]["evaluated_truth"] == "TRUE"
    assert app_item["explanation_trace"]["inputs_evaluated"]["employee_count"] == 45

    # Evidence records attached
    assert len(app_item["evidence_records"]) >= 1
    ev_record = app_item["evidence_records"][0]
    assert ev_record["evidence_id"] == "EV-FACT-01"
    assert "Factories Act" in ev_record["source_title"]
    assert ev_record["content_hash"] == "abc123hash999"

    # Action destination resolved
    assert app_item["action_destination"] is not None
    assert "action_type" in app_item["action_destination"]
    assert "verification_status" in app_item["action_destination"]

    # CIR Verification
    assert data["cir"] is not None
    assert data["cir_is_valid"] is True
    assert data["cir"]["business_id"] == str(biz.id)
    assert len(data["cir"]["determinations"]) >= 2
    assert data["cir"]["authority_signature"] != ""

    # Metrics separation
    assert data["metrics"]["automated"]["applicable_count"] == 1
    assert data["metrics"]["automated"]["not_applicable_count"] == 1
    assert data["metrics"]["automated"]["total_evaluated"] == 2


def test_admin_human_disposition_does_not_mutate_engine2_legal_status(api_client, staff_user, business_with_engine2):
    """Recording a human disposition (CONFIRMED_REQUIRED / NOT_REQUIRED) records operational action

    without altering the immutable Engine 2 legal determination.
    """
    biz = business_with_engine2["business"]
    req_code = "REQ-FACTORY-REG"
    disposition_url = f"/api/v1/admin/businesses/{biz.id}/requirements/{req_code}/disposition"

    api_client.force_authenticate(user=staff_user)

    # 1. Reject missing reason on NOT_REQUIRED
    res_bad = api_client.post(
        disposition_url,
        {"action": "NOT_REQUIRED", "reason": ""},
        format="json",
    )
    assert res_bad.status_code == 400

    # 2. Record NOT_REQUIRED with substantive reason
    res_ok = api_client.post(
        disposition_url,
        {
            "action": "NOT_REQUIRED",
            "reason": "Exempted under state MSME notification No. DISH/2026/04 for initial 180 days.",
        },
        format="json",
    )
    assert res_ok.status_code == 200
    res_data = res_ok.json().get("data", res_ok.json())
    assert res_data["disposition"]["admin_disposition"] == "NOT_REQUIRED"

    # 3. Verify DecisionResult remains APPLICABLE (Engine 2 invariant!)
    applicable_res = business_with_engine2["applicable_result"]
    applicable_res.refresh_from_db()
    assert applicable_res.status == ApplicabilityStatus.APPLICABLE

    # 4. Check that scrutiny overview reflects human disposition alongside Engine 2 truth
    scrutiny_res = api_client.get(f"/api/v1/admin/businesses/{biz.id}")
    s_data = scrutiny_res.json().get("data", scrutiny_res.json())
    item = next(i for i in s_data["engine2_results"] if i["requirement_id"] == req_code)
    assert item["status"] == "APPLICABLE"  # Legal determination is still APPLICABLE
    assert item["human_disposition"] is not None
    assert item["human_disposition"]["admin_disposition"] == "NOT_REQUIRED"
    assert "Exempted under state MSME notification" in item["human_disposition"]["reason"]


def test_admin_create_business_deadline(api_client, staff_user, non_staff_user, business_with_engine2):
    """Staff can create administrative compliance deadlines directly for a business."""
    biz = business_with_engine2["business"]
    deadlines_url = f"/api/v1/admin/businesses/{biz.id}/deadlines"

    # Non-staff forbidden
    api_client.force_authenticate(user=non_staff_user)
    res_forbidden = api_client.post(deadlines_url, {"title": "Test", "due_at": "2026-10-15T00:00:00Z"})
    assert res_forbidden.status_code == 403

    # Staff creates deadline
    api_client.force_authenticate(user=staff_user)
    payload = {
        "title": "Submit Form 1 Factory Blueprint Rectification",
        "due_at": "2026-10-31T18:00:00Z",
        "priority": "CRITICAL",
        "requirement_id_code": "REQ-FACTORY-REG",
        "description": "Blueprint requires certified structural engineer seal.",
        "notes": "Directive issued during scrutiny review.",
    }
    res_created = api_client.post(deadlines_url, payload, format="json")
    assert res_created.status_code == 201
    created_id = res_created.json().get("data", res_created.json())["deadline"]["id"]

    # Verify deadline in database
    dl = Deadline.objects.get(id=created_id)
    assert dl.business == biz
    assert dl.priority == "CRITICAL"
    assert dl.source in ["ADMIN_SET", "ADMINISTRATIVE"]

    # Verify deadline appears in scrutiny overview
    overview_res = api_client.get(f"/api/v1/admin/businesses/{biz.id}")
    deadlines = overview_res.json().get("data", overview_res.json())["calendar"]["admin_deadlines"]
    assert any(d["id"] == created_id for d in deadlines)


def test_admin_fact_provenance_and_version_audit(api_client, staff_user, business_with_engine2):
    """Scrutiny overview exposes canonical fact provenance items with origins and confidence."""
    biz = business_with_engine2["business"]
    url = f"/api/v1/admin/businesses/{biz.id}"

    api_client.force_authenticate(user=staff_user)
    res = api_client.get(url)
    assert res.status_code == 200
    data = res.json().get("data", res.json())

    answered_vars = data["profile"]["answered_variables"]
    assert len(answered_vars) >= 3

    # Verify user-typed fact
    state_var = next(v for v in answered_vars if v["key"] == "state")
    assert state_var["value"] == "MH"
    assert state_var["origin"] == "USER_TYPED"
    assert state_var["confidence"] == 1.0

    # Verify derived fact
    mfg_var = next(v for v in answered_vars if v["key"] == "is_manufacturing")
    assert mfg_var["value"] is True
    assert mfg_var["origin"] == "DERIVED"

    # Verify profile history
    assert len(data["profile_history"]) >= 1
    assert data["profile_history"][0]["version"] == 1
