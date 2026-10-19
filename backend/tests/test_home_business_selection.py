"""Selecting an older authorized business must not switch to the recent-list head."""
import pytest
from apps.businesses.models import UserWorkspaceState

pytestmark = pytest.mark.django_db


@pytest.fixture
def older_business(make_business, user):
    older = make_business(user, name="Synthetic older business")
    for index in range(21):
        make_business(user, name=f"Synthetic recent business {index}")
    return older


def test_explicit_older_selection_is_in_bounded_home(auth_client, older_business):
    response = auth_client.get(f"/api/v1/user/profile?business_id={older_business.pk}")
    assert response.status_code == 200
    data = response.data["data"]
    assert str(older_business.pk) in {row["id"] for row in data["businesses"]}
    assert data["total_businesses"] == 22
    assert len(data["businesses"]) <= 22


def test_active_older_selection_survives_login_home(auth_client, user, older_business):
    UserWorkspaceState.objects.update_or_create(user=user, defaults={"active_business": older_business})
    response = auth_client.get("/api/v1/user/profile")
    assert response.status_code == 200
    assert str(older_business.pk) in {row["id"] for row in response.data["data"]["businesses"]}


def test_explicit_inaccessible_selection_never_falls_back(auth_client, make_business, other_user):
    hidden = make_business(other_user)
    response = auth_client.get(f"/api/v1/user/profile?business_id={hidden.pk}")
    assert response.status_code == 404


def test_malformed_selection_is_not_a_server_error(auth_client):
    assert auth_client.get("/api/v1/user/profile?business_id=invalid").status_code == 404
