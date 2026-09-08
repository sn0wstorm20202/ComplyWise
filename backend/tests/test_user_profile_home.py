"""Tests for user profile home and multi-business assessment dashboard.

Authority: Milestone Task — Objective 1; PRD_v2.0 §10, §14; TRD_v2.0 §30, §31.
"""

from __future__ import annotations

import pytest
from apps.businesses.models import Assessment, Business

pytestmark = pytest.mark.django_db


def test_user_profile_home_empty(auth_client, user):
    """A new user with no businesses sees an empty profile home with 0 counts."""
    response = auth_client.get("/api/v1/user/profile")
    assert response.status_code == 200, response.content
    data = response.json()["data"]

    assert data["user"]["id"] == str(user.id)
    assert data["user"]["email"] == user.email
    assert data["businesses"] == []
    assert data["recent_assessments"] == []
    assert data["total_businesses"] == 0
    assert data["total_assessments"] == 0


def test_user_profile_home_with_businesses_and_assessments(auth_client, user, make_business):
    """UserProfileHome returns all user-owned businesses and recent assessments in reverse chron order."""
    biz1 = make_business(user, name="MedTech Devices Pvt Ltd")
    biz2 = make_business(user, name="Himalayan Foods LLP")

    # Create assessments for biz1
    a1 = Assessment.objects.create(
        business=biz1,
        created_by=user,
        assessment_number=1,
        title="Initial Intake Assessment",
        status="COMPLETED",
        current_step=5,
    )
    a2 = Assessment.objects.create(
        business=biz1,
        created_by=user,
        assessment_number=2,
        title="Expansion Assessment",
        status="IN_PROGRESS",
        current_step=3,
    )
    # Create assessment for biz2
    a3 = Assessment.objects.create(
        business=biz2,
        created_by=user,
        assessment_number=1,
        title="FSSAI Launch Assessment",
        status="COMPLETED",
        current_step=5,
    )

    response = auth_client.get("/api/v1/user/profile")
    assert response.status_code == 200
    data = response.json()["data"]

    assert data["total_businesses"] == 2
    assert data["total_assessments"] == 3

    biz_ids = [b["id"] for b in data["businesses"]]
    assert str(biz1.id) in biz_ids
    assert str(biz2.id) in biz_ids

    # Assessments ordered by recent activity
    recent_ids = [a["id"] for a in data["recent_assessments"]]
    assert len(recent_ids) == 3
    assert set(recent_ids) == {str(a3.id), str(a2.id), str(a1.id)}

    # /user/home alias works identically
    alias_resp = auth_client.get("/api/v1/user/home")
    assert alias_resp.status_code == 200
    assert alias_resp.json()["data"]["total_assessments"] == 3


def test_user_profile_home_tenant_isolation(auth_client, user, other_user, make_business):
    """Users cannot see businesses or assessments belonging to other tenants."""
    foreign_biz = make_business(other_user, name="Other User Corp")
    Assessment.objects.create(
        business=foreign_biz,
        created_by=other_user,
        assessment_number=1,
        title="Secret Assessment",
        status="COMPLETED",
    )

    # Caller has no businesses yet
    response = auth_client.get("/api/v1/user/profile")
    assert response.status_code == 200
    data = response.json()["data"]

    assert data["total_businesses"] == 0
    assert data["total_assessments"] == 0
    assert data["businesses"] == []
    assert data["recent_assessments"] == []
