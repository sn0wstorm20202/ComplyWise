"""Comprehensive Security Perimeter & Tenant Isolation Test Suite.

Authority: Phase 2 Security, Tenant Isolation & Sanitization Specification.
Verifies:
1. Zero unauthenticated tenant resolution (HTTP 401).
2. Zero cross-tenant data leakage / existence disclosure (HTTP 404).
3. Zero implicit fallback to database records (.objects.first()).
4. Zero unauthorized access to administrative / scrutiny endpoints (HTTP 403).
5. Explicit staff resolution with audit logging.
"""

from __future__ import annotations

import logging
import uuid
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.businesses.models import Assessment, Business, BusinessMembership
from apps.documents.models import DocumentRequirement, DocumentSubmission
from apps.workflows.models import ComplianceCase

User = get_user_model()
pytestmark = pytest.mark.django_db


@pytest.fixture
def user_a(make_user):
    return make_user(email="tenant_a@example.com", full_name="Tenant A")


@pytest.fixture
def user_b(make_user):
    return make_user(email="tenant_b@example.com", full_name="Tenant B")


@pytest.fixture
def staff_user(make_user):
    return make_user(email="staff@example.com", full_name="Staff Officer", is_staff=True)


@pytest.fixture
def client_a(api_client, user_a):
    api_client.force_authenticate(user=user_a)
    return api_client


@pytest.fixture
def client_b(api_client, user_b):
    api_client.force_authenticate(user=user_b)
    return api_client


@pytest.fixture
def client_staff(api_client, staff_user):
    api_client.force_authenticate(user=staff_user)
    return api_client


@pytest.fixture
def business_a(make_business, user_a):
    return make_business(user_a, name="Tenant A Corp")


@pytest.fixture
def business_b(make_business, user_b):
    return make_business(user_b, name="Tenant B Corp")


@pytest.fixture
def assessment_b(business_b):
    return Assessment.objects.create(
        business=business_b,
        assessment_number=1,
        title="Initial Assessment B",
    )


@pytest.fixture
def case_b(business_b, assessment_b):
    return ComplianceCase.objects.create(
        business=business_b,
        assessment=assessment_b,
        case_number=f"CASE-B-{uuid.uuid4().hex[:6].upper()}",
        requirement_id_code="REQ-TEST-B",
    )


@pytest.fixture
def doc_req_b(case_b):
    return DocumentRequirement.objects.create(
        case=case_b,
        document_type_code="DOC-REQ-B",
        name="Mandatory Statutory Doc B",
    )


@pytest.fixture
def doc_sub_b(doc_req_b, user_b):
    return DocumentSubmission.objects.create(
        document_requirement=doc_req_b,
        version_number=1,
        file_name="statutory_proof_b.pdf",
        storage_path="submissions/statutory_proof_b.pdf",
    )


# ---------------------------------------------------------------------------
# Section 1: Cross-Tenant Isolation (Must return 404 to conceal existence)
# ---------------------------------------------------------------------------

def test_cross_tenant_business_read_conceals_existence_with_404(client_a, business_b):
    resp = client_a.get(f"/api/v1/businesses/{business_b.id}")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


def test_cross_tenant_business_profile_conceals_existence_with_404(client_a, business_b):
    resp = client_a.get(f"/api/v1/businesses/{business_b.id}/profile")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


def test_cross_tenant_assessment_detail_conceals_existence_with_404(client_a, assessment_b):
    resp = client_a.get(f"/api/v1/assessments/{assessment_b.id}")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


def test_cross_tenant_compliance_cases_list_returns_404(client_a, business_b):
    resp = client_a.get(f"/api/v1/businesses/{business_b.id}/cases")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


def test_cross_tenant_case_detail_returns_404(client_a, case_b):
    resp = client_a.get(f"/api/v1/cases/{case_b.id}")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


def test_cross_tenant_case_transition_returns_404(client_a, case_b):
    resp = client_a.post(
        f"/api/v1/cases/{case_b.id}/transition",
        {"event_code": "START_PROCESSING", "actor_type": "USER"},
        format="json",
    )
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


def test_cross_tenant_case_timeline_returns_404(client_a, case_b):
    resp = client_a.get(f"/api/v1/cases/{case_b.id}/timeline")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


def test_cross_tenant_case_form_returns_404(client_a, case_b):
    resp = client_a.get(f"/api/v1/cases/{case_b.id}/form")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


def test_cross_tenant_case_deadlines_returns_404(client_a, case_b):
    resp = client_a.get(f"/api/v1/cases/{case_b.id}/deadlines")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


def test_cross_tenant_case_document_upload_returns_404(client_a, case_b, doc_req_b):
    resp = client_a.post(
        f"/api/v1/cases/{case_b.id}/documents/{doc_req_b.id}/upload",
        {"file_content_text": "Sample document content", "file_name": "sample.txt"},
        format="json",
    )
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


def test_cross_tenant_document_view_returns_404(client_a, doc_sub_b):
    resp = client_a.get(f"/api/v1/documents/{doc_sub_b.id}/view?mode=json")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


def test_cross_tenant_document_metadata_returns_404(client_a, doc_sub_b):
    resp = client_a.get(f"/api/v1/documents/{doc_sub_b.id}/metadata")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


def test_cross_tenant_assistant_chat_with_foreign_business_returns_404(client_a, business_b):
    resp = client_a.post(
        "/api/v1/assistant/chat",
        {"business_id": str(business_b.id), "message": "What are my obligations?"},
        format="json",
    )
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


def test_cross_tenant_assistant_chat_with_foreign_assessment_returns_404(client_a, business_a, assessment_b):
    resp = client_a.post(
        "/api/v1/assistant/chat",
        {
            "business_id": str(business_a.id),
            "assessment_id": str(assessment_b.id),
            "message": "What is my status?",
        },
        format="json",
    )
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


def test_cross_tenant_schemes_list_returns_404(client_a, business_b):
    resp = client_a.get(f"/api/v1/businesses/{business_b.id}/schemes")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


def test_cross_tenant_calendar_list_returns_404(client_a, business_b):
    resp = client_a.get(f"/api/v1/businesses/{business_b.id}/calendar")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


def test_cross_tenant_workspace_post_foreign_business_returns_404(client_a, business_b):
    resp = client_a.post(
        "/api/v1/user/workspace",
        {"business_id": str(business_b.id)},
        format="json",
    )
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


def test_cross_tenant_workspace_post_foreign_assessment_returns_404(client_a, business_a, assessment_b):
    resp = client_a.post(
        "/api/v1/user/workspace",
        {"business_id": str(business_a.id), "assessment_id": str(assessment_b.id)},
        format="json",
    )
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "NOT_FOUND"


# ---------------------------------------------------------------------------
# Section 2: Unauthenticated Access Rejections (Must return HTTP 401)
# ---------------------------------------------------------------------------

def test_unauthenticated_business_access_returns_401(api_client, business_a):
    resp = api_client.get(f"/api/v1/businesses/{business_a.id}")
    assert resp.status_code == 401


def test_unauthenticated_assistant_chat_returns_401(api_client, business_a):
    resp = api_client.post(
        "/api/v1/assistant/chat",
        {"business_id": str(business_a.id), "message": "Help me."},
        format="json",
    )
    assert resp.status_code == 401


def test_unauthenticated_business_schemes_returns_401(api_client, business_a):
    resp = api_client.get(f"/api/v1/businesses/{business_a.id}/schemes")
    assert resp.status_code == 401


def test_unauthenticated_business_calendar_returns_401(api_client, business_a):
    resp = api_client.get(f"/api/v1/businesses/{business_a.id}/calendar")
    assert resp.status_code == 401


def test_unauthenticated_workflows_list_returns_401(api_client, business_a):
    resp = api_client.get(f"/api/v1/businesses/{business_a.id}/workflows")
    assert resp.status_code == 401


def test_unauthenticated_admin_review_queue_returns_401(api_client):
    resp = api_client.get("/api/v1/admin/cases/review-queue")
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Section 3: Non-Staff Access to Admin Scrutiny Endpoints (Must return HTTP 403)
# ---------------------------------------------------------------------------

def test_regular_user_admin_review_queue_returns_403(client_a):
    resp = client_a.get("/api/v1/admin/cases/review-queue")
    assert resp.status_code == 403


def test_regular_user_scheme_pipeline_run_returns_403(client_a):
    resp = client_a.post("/api/v1/schemes/pipeline/run", {"force": True}, format="json")
    assert resp.status_code == 403


def test_regular_user_document_review_returns_403(client_a, doc_sub_b):
    resp = client_a.post(
        f"/api/v1/documents/submissions/{doc_sub_b.id}/review",
        {"action": "APPROVE", "comments": "Unauthorized approval attempt"},
        format="json",
    )
    assert resp.status_code == 403


def test_regular_user_admin_case_review_packet_returns_403(client_a, case_b):
    resp = client_a.get(f"/api/v1/admin/cases/{case_b.id}/packet")
    assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Section 4: Staff Explicit Access with Audit Logging
# ---------------------------------------------------------------------------

def test_staff_user_resolve_authorized_audit_log(caplog, staff_user, business_a):
    with caplog.at_level(logging.INFO):
        resolved = Business.resolve_authorized(staff_user, business_a.id)
        assert resolved.id == business_a.id
        assert any("AUDIT: Staff user" in record.message for record in caplog.records)


# ---------------------------------------------------------------------------
# Section 5: Zero Fallback Verification (Random UUIDs never resolve to first())
# ---------------------------------------------------------------------------

def test_zero_fallback_random_uuid_returns_404_not_first_business(client_a, business_a):
    random_uuid = uuid.uuid4()
    
    # Assistant chat
    resp_chat = client_a.post(
        "/api/v1/assistant/chat",
        {"business_id": str(random_uuid), "message": "Hello"},
        format="json",
    )
    assert resp_chat.status_code == 404

    # Schemes
    resp_schemes = client_a.get(f"/api/v1/businesses/{random_uuid}/schemes")
    assert resp_schemes.status_code == 404

    # Calendar
    resp_cal = client_a.get(f"/api/v1/businesses/{random_uuid}/calendar")
    assert resp_cal.status_code == 404

    # Cases
    resp_cases = client_a.get(f"/api/v1/businesses/{random_uuid}/cases")
    assert resp_cases.status_code == 404
