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


def test_all_authorized_businesses_are_reachable_by_paging(auth_client, older_business):
    first = auth_client.get("/api/v1/user/profile").data["data"]
    assert first["next_business_page"] == 2
    second = auth_client.get("/api/v1/user/profile?business_page=2").data["data"]
    assert second["next_business_page"] is None
    assert len({row["id"] for page in (first, second) for row in page["businesses"]}) == 22


def test_invalid_business_page_is_rejected(auth_client):
    assert auth_client.get("/api/v1/user/profile?business_page=0").status_code == 400
    assert auth_client.get("/api/v1/user/profile?business_page=bad").status_code == 400


def test_demo_explanation_and_coverage_are_explicit():
    from types import SimpleNamespace
    from apps.requirements.presentation import requirement_reason_summary
    from apps.applicability.snapshots import coverage_for_run
    summary = requirement_reason_summary({"reason": "DEMO_SCENARIO_EVALUATION", "status": "APPLICABLE",
        "note": "Prepared fixture explanation."}, None)
    assert summary == "Curated demo scenario. Prepared fixture explanation."
    assert "no published rule" not in summary.lower()
    coverage = coverage_for_run(SimpleNamespace(evaluation_manifest={"mode": "DEMO"}))
    assert coverage["status"] == "DEMO" and "curated" in coverage["message"]
