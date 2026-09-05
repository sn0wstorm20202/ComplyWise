"""Business endpoints and tenant isolation.

Isolation is the security property most likely to regress once more modules start
resolving a business from the URL (TRD_v2.0 §32), so it is asserted here at the
foundation.
"""

from __future__ import annotations

import uuid

import pytest

pytestmark = pytest.mark.django_db


def test_create_business_assigns_the_caller_as_owner(auth_client, user):
    response = auth_client.post("/api/v1/businesses", {"name": "  Example Foods  "})
    assert response.status_code == 201, response.content
    data = response.json()["data"]
    assert data["name"] == "Example Foods"  # trimmed
    assert data["profile_version"] is None  # no profile invented on creation

    from apps.businesses.models import Business

    created = Business.objects.get(pk=data["id"])
    assert created.owner == user
    assert created.memberships.filter(user=user, role="OWNER").exists()


def test_business_list_is_paginated_and_enveloped(auth_client, business):
    response = auth_client.get("/api/v1/businesses")
    assert response.status_code == 200
    body = response.json()
    assert [item["id"] for item in body["data"]] == [str(business.id)]
    assert body["meta"]["count"] == 1
    assert body["meta"]["page"] == 1


def test_list_excludes_other_users_businesses(auth_client, make_business, other_user):
    make_business(other_user, name="Rival Industries")
    body = auth_client.get("/api/v1/businesses").json()
    assert body["data"] == []
    assert body["meta"]["count"] == 0


def test_detail_of_another_users_business_is_not_found(auth_client, make_business, other_user):
    foreign = make_business(other_user, name="Rival Industries")
    response = auth_client.get(f"/api/v1/businesses/{foreign.id}")
    # 404, not 403: existence of another tenant's record is not disclosed.
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_profile_of_another_users_business_is_not_found(auth_client, make_business, other_user):
    foreign = make_business(other_user, name="Rival Industries")
    assert auth_client.get(f"/api/v1/businesses/{foreign.id}/profile").status_code == 404
    assert (
        auth_client.post(
            f"/api/v1/businesses/{foreign.id}/profile",
            {"variables": {"state": {"value": "Gujarat"}}},
            format="json",
        ).status_code
        == 404
    )


def test_unknown_business_id_is_not_found(auth_client):
    assert auth_client.get(f"/api/v1/businesses/{uuid.uuid4()}").status_code == 404


def test_business_endpoints_require_authentication(api_client, business):
    assert api_client.get("/api/v1/businesses").status_code == 401
    assert api_client.get(f"/api/v1/businesses/{business.id}/profile").status_code == 401


def test_membership_grants_access_without_ownership(api_client, business, other_user):
    from apps.businesses.models import BusinessMembership

    BusinessMembership.objects.create(
        business=business, user=other_user, role=BusinessMembership.Role.MANAGER
    )
    api_client.force_authenticate(user=other_user)
    response = api_client.get(f"/api/v1/businesses/{business.id}")
    assert response.status_code == 200
    assert business.is_accessible_by(other_user) is True


def test_accessible_to_returns_nothing_for_anonymous_users(business):
    from django.contrib.auth.models import AnonymousUser

    from apps.businesses.models import Business

    assert Business.accessible_to(AnonymousUser()).count() == 0
    assert business.is_accessible_by(AnonymousUser()) is False
