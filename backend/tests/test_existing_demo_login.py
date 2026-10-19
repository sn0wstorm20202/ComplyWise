import pytest
from django.contrib.auth import get_user_model

pytestmark = pytest.mark.django_db


def test_disabled_demo_login_never_creates_accounts(api_client, settings):
    settings.DEMO_USER_LOGIN_ENABLED = False
    before = get_user_model().objects.count()
    assert not api_client.get("/api/v1/auth/demo-login").json()["data"]["enabled"]
    assert api_client.post("/api/v1/auth/demo-login").status_code == 403
    assert get_user_model().objects.count() == before


def test_quick_login_uses_existing_normal_account(api_client, settings, make_user):
    user = make_user(email="existing.demo@example.test", password="Synthetic-demo-password-2026")
    settings.DEMO_USER_LOGIN_ENABLED = True
    settings.DEMO_USER_EMAIL = user.email
    settings.DEMO_USER_PASSWORD = "Synthetic-demo-password-2026"
    before = get_user_model().objects.count()
    response = api_client.post("/api/v1/auth/demo-login")
    assert response.status_code == 200
    assert "no-store" in response["Cache-Control"]
    data = response.json()["data"]
    assert data["user"]["id"] == str(user.id)
    assert not data["user"]["is_compliance_officer"]
    assert "password" not in data
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {data['token']}")
    assert api_client.get("/api/v1/auth/me").json()["data"]["id"] == str(user.id)
    assert get_user_model().objects.count() == before


@pytest.mark.parametrize("kind", ["missing", "wrong_password", "privileged", "inactive"])
def test_demo_configuration_fails_closed(api_client, settings, make_user, kind):
    user = make_user(email="existing.demo@example.test", password="Synthetic-demo-password-2026",
                     is_staff=kind == "privileged", is_active=kind != "inactive")
    settings.DEMO_USER_LOGIN_ENABLED = True
    settings.DEMO_USER_EMAIL = "absent@example.test" if kind == "missing" else user.email
    settings.DEMO_USER_PASSWORD = "wrong" if kind == "wrong_password" else "Synthetic-demo-password-2026"
    assert api_client.post("/api/v1/auth/demo-login").status_code == 403
    user.refresh_from_db()
    assert user.check_password("Synthetic-demo-password-2026")
