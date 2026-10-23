import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient
from unittest.mock import patch

from apps.businesses.models import Assessment, BusinessProfileVersion, UserWorkspaceState
from apps.dashboard.services import get_workspace_widgets
from apps.documents.models import DocumentRequirement, DocumentSubmission
from apps.workflows.models import ComplianceCase, WorkflowEvent


@pytest.mark.django_db
def test_bootstrap_empty_and_requires_auth(auth_client):
    assert APIClient().get("/api/v1/user/workspace-bootstrap").status_code == 401
    response = auth_client.get("/api/v1/user/workspace-bootstrap")
    assert response.status_code == 200
    assert response.data["data"]["business"] is None
    assert response.data["data"]["dashboard"] is None
    assert "no-store" in response["Cache-Control"]


@pytest.mark.django_db
def test_bootstrap_historical_profile_and_both_selection_boundaries(auth_client, business, make_business, other_user, user):
    older = BusinessProfileVersion.objects.create(business=business, version=1,
        variables={"state": {"value": "KARNATAKA", "origin": "USER_PROVIDED"}})
    BusinessProfileVersion.objects.create(business=business, version=2,
        variables={"state": {"value": "TAMIL_NADU", "origin": "USER_PROVIDED"}})
    first = Assessment.objects.create(business=business, profile_version=older, created_by=user)
    second = Assessment.objects.create(business=business, created_by=user, assessment_number=2)
    UserWorkspaceState.objects.update_or_create(user=user, defaults={"active_business": business, "active_assessment": second})
    foreign = make_business(other_user)
    foreign_assessment = Assessment.objects.create(business=foreign, created_by=other_user)
    params = {"business_id": str(business.id), "assessment_id": str(first.id)}
    # The bootstrap delegates the legal projection; it must never reinterpret it.
    with patch("apps.dashboard.bootstrap.get_dashboard_summary", return_value={"assessment_id": str(first.id)}) as summary:
        response = auth_client.get("/api/v1/user/workspace-bootstrap", params)
        assert response.status_code == 200
        data = response.data["data"]
        assert data["assessment_id"] == str(first.id)
        assert data["profile_variables"] == older.variables
        summary.assert_called_once()
    for invalid in [{"business_id": str(foreign.id)}, {**params, "assessment_id": str(foreign_assessment.id)},
                    {**params, "assessment_id": "malformed"}]:
        assert auth_client.get("/api/v1/user/workspace-bootstrap", invalid).status_code == 404


@pytest.mark.django_db
def test_bootstrap_saved_selection_precedes_stale_cache(auth_client, business, user):
    saved = Assessment.objects.create(business=business, created_by=user)
    UserWorkspaceState.objects.update_or_create(user=user, defaults={"active_business": business, "active_assessment": saved})
    response = auth_client.get("/api/v1/user/workspace-bootstrap", {
        "business_id": str(business.id), "cached_assessment_id": "stale-browser-value"})
    assert response.status_code == 200
    assert response.data["data"]["assessment_id"] == str(saved.id)
    assert response.data["data"]["dashboard"]["has_evaluation"] is False


@pytest.mark.django_db
def test_widgets_queries_stay_bounded_and_only_latest_submission_counts(business, make_business, other_user):
    case = ComplianceCase.objects.create(business=business, case_number="SYNTHETIC-ONE", requirement_id_code="SYNTHETIC")
    for i in range(35):
        document = DocumentRequirement.objects.create(case=case, document_type_code=f"SYNTHETIC-{i}", name="Synthetic")
        for version, status in [(1, "INTERNAL_HUMAN_APPROVED"), (2, "PENDING")]:
            DocumentSubmission.objects.create(document_requirement=document, version_number=version,
                file_name="synthetic.pdf", storage_path="synthetic/no-file", status_code=status)
    for i in range(25):
        WorkflowEvent.objects.create(compliance_case=case, event_code="SYNTHETIC")
    other = make_business(other_user)
    ComplianceCase.objects.create(business=other, case_number="FOREIGN", requirement_id_code="SYNTHETIC", status_code="COMPLETED")
    with CaptureQueriesContext(connection) as queries:
        widgets = get_workspace_widgets(business)
    assert len(queries) == 4
    assert widgets["documents"]["totalCount"] == 35
    assert widgets["documents"]["verifiedPercentage"] == 0
    assert widgets["documents"]["underReviewPercentage"] == 100
    assert widgets["activity"]["weeklyTasks"] == 25
    assert sum(d["tasks"] for d in widgets["activity"]["daily"]) == 25
    assert len(widgets["recent_activity"]) == 10
    assert widgets["cases"]["Overall"]["compliantCount"] == 0
