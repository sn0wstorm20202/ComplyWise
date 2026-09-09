"""Tests for User Workspace State, Auth Bootstrap, and Assessment Persistence.

Authority: Final Bug-Fix Milestone — Bug 2 Verification; PRD_v2.0 §10, §11; TRD_v2.0 §31.

Validates:
1. New user with no businesses is targeted to /onboarding?new=true.
2. In-progress assessment targets /onboarding with business and assessment IDs.
3. Completed assessment targets /dashboard with business and assessment IDs.
4. Switching active assessment via POST /user/workspace persists across subsequent GET requests.
5. Strict isolation: users cannot access or set another user's business or assessment.
"""

from __future__ import annotations

import pytest
from apps.accounts.models import User
from apps.businesses.models import Assessment, Business, UserWorkspaceState
from rest_framework import status

pytestmark = pytest.mark.django_db


def test_new_user_workspace_redirects_to_onboarding(auth_client, user):
    """A fresh account with no business profile is targeted to Onboarding."""
    res = auth_client.get("/api/v1/user/workspace")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()["data"]

    assert data["has_workspace"] is False
    assert data["active_business_id"] is None
    assert data["active_assessment_id"] is None
    assert data["redirect_target"] == "ONBOARDING"
    assert data["redirect_url"] == "/onboarding?new=true"


def test_returning_user_with_completed_assessment_redirects_to_dashboard(auth_client, user, make_business):
    """A returning founder with a completed assessment is targeted directly to Dashboard."""
    biz = make_business(user, name="Apex MedTech Solutions")
    ass1 = Assessment.objects.create(
        business=biz,
        created_by=user,
        assessment_number=1,
        title="Initial Intake",
        status="COMPLETED",
    )

    res = auth_client.get("/api/v1/user/workspace")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()["data"]

    assert data["has_workspace"] is True
    assert data["active_business_id"] == str(biz.id)
    assert data["active_assessment_id"] == str(ass1.id)
    assert data["redirect_target"] == "DASHBOARD"
    assert f"/dashboard?business_id={biz.id}&assessment_id={ass1.id}" in data["redirect_url"]


def test_returning_user_with_in_progress_assessment_resumes_onboarding(auth_client, user, make_business):
    """A user with an in-progress assessment is targeted to resume Onboarding."""
    biz = make_business(user, name="BioAdvance Diagnostics")
    ass1 = Assessment.objects.create(
        business=biz,
        created_by=user,
        assessment_number=1,
        title="Draft Assessment",
        status="IN_PROGRESS",
        current_step=3,
    )

    res = auth_client.get("/api/v1/user/workspace")
    assert res.status_code == status.HTTP_200_OK
    data = res.json()["data"]

    assert data["has_workspace"] is True
    assert data["active_business_id"] == str(biz.id)
    assert data["active_assessment_id"] == str(ass1.id)
    assert data["redirect_target"] == "ONBOARDING"
    assert f"/onboarding?business_id={biz.id}&assessment_id={ass1.id}" in data["redirect_url"]


def test_workspace_switcher_persists_across_sessions(auth_client, user, make_business):
    """Switching active assessment persists in database and is returned on subsequent calls."""
    biz = make_business(user, name="Solaris Manufacturing")
    ass1 = Assessment.objects.create(business=biz, created_by=user, assessment_number=1, title="Q1 Audit", status="COMPLETED")
    ass2 = Assessment.objects.create(business=biz, created_by=user, assessment_number=2, title="Q2 Expansion", status="COMPLETED")

    # Initially resolves to latest updated assessment
    get1 = auth_client.get("/api/v1/user/workspace")
    assert get1.status_code == status.HTTP_200_OK

    # Explicitly switch to Assessment 1
    switch_res = auth_client.post(
        "/api/v1/user/workspace",
        data={"business_id": str(biz.id), "assessment_id": str(ass1.id)},
        format="json",
    )
    assert switch_res.status_code == status.HTTP_200_OK
    assert switch_res.json()["data"]["active_assessment_id"] == str(ass1.id)

    # Subsequent GET (simulating page reload or new session) returns Assessment 1
    get2 = auth_client.get("/api/v1/user/workspace")
    assert get2.status_code == status.HTTP_200_OK
    assert get2.json()["data"]["active_assessment_id"] == str(ass1.id)
    assert get2.json()["data"]["active_assessment_title"] == "Q1 Audit"

    # Switch to Assessment 2
    switch_res2 = auth_client.post(
        "/api/v1/user/workspace",
        data={"business_id": str(biz.id), "assessment_id": str(ass2.id)},
        format="json",
    )
    assert switch_res2.status_code == status.HTTP_200_OK
    assert switch_res2.json()["data"]["active_assessment_id"] == str(ass2.id)

    # Subsequent GET returns Assessment 2
    get3 = auth_client.get("/api/v1/user/workspace")
    assert get3.status_code == status.HTTP_200_OK
    assert get3.json()["data"]["active_assessment_id"] == str(ass2.id)
    assert get3.json()["data"]["active_assessment_title"] == "Q2 Expansion"


def test_workspace_isolation_prevents_unauthorized_access(auth_client, user, make_business):
    """User cannot set or access another user's business or assessment."""
    other_user = User.objects.create_user(email="other.founder@example.com", password="OtherPassword123!")
    other_biz = make_business(other_user, name="Secret Enterprise")
    other_ass = Assessment.objects.create(business=other_biz, created_by=other_user, assessment_number=1, status="COMPLETED")

    # Current user tries to switch to other user's business
    res = auth_client.post(
        "/api/v1/user/workspace",
        data={"business_id": str(other_biz.id)},
        format="json",
    )
    assert res.status_code == status.HTTP_403_FORBIDDEN

    # Current user tries to switch to other user's assessment
    res2 = auth_client.post(
        "/api/v1/user/workspace",
        data={"assessment_id": str(other_ass.id)},
        format="json",
    )
    assert res2.status_code == status.HTTP_403_FORBIDDEN
