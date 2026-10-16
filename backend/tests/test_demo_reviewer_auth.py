"""Demo autofill remains opt-in and separate from normal authentication."""
import pytest
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import override_settings
from rest_framework.authtoken.models import Token

from apps.accounts.models import User
from common.enums import AdminRole

pytestmark = pytest.mark.django_db
DEMO_PASSWORD = "synthetic-reviewer-passphrase-2026"
ENDPOINT = "/api/v1/auth/demo-reviewer-credentials"


def test_demo_disabled_by_default_does_not_read_accounts(api_client, django_assert_num_queries):
    with override_settings(DEMO_REVIEWER_AUTOFILL_ENABLED=False), django_assert_num_queries(0):
        response = api_client.get(ENDPOINT)
    assert response.status_code == 403
    assert response["Cache-Control"] == "no-store, private"
    assert "password" not in response.data


def test_demo_missing_configuration_is_not_fake_credentials(api_client):
    with override_settings(DEMO_REVIEWER_AUTOFILL_ENABLED=True, DEMO_REVIEWER_EMAIL="", DEMO_REVIEWER_PASSWORD=""):
        response = api_client.get(ENDPOINT)
    assert response.status_code == 503
    assert not Token.objects.exists()


def test_demo_autofill_requires_normal_login(api_client, make_user):
    reviewer = make_user(email="reviewer-demo@example.test", password=DEMO_PASSWORD, role=AdminRole.COMPLIANCE_OFFICER)
    with override_settings(DEMO_REVIEWER_AUTOFILL_ENABLED=True,
                          DEMO_REVIEWER_EMAIL=reviewer.email, DEMO_REVIEWER_PASSWORD=DEMO_PASSWORD):
        response = api_client.get(ENDPOINT)
    assert response.status_code == 200
    assert response.data == {"email": reviewer.email, "password": DEMO_PASSWORD}
    assert response["Cache-Control"] == "no-store, private"
    assert not Token.objects.exists()
    assert api_client.get("/api/v1/auth/me").status_code in (401, 403)
    login = api_client.post("/api/v1/auth/admin-login", response.data, format="json")
    assert login.status_code == 200
    assert login.data["user"]["is_compliance_officer"] is True
    assert Token.objects.filter(user=reviewer).count() == 1


@pytest.mark.parametrize("account", ["missing", "password_mismatch", "ordinary", "staff", "superuser", "inactive", "senior"])
def test_demo_never_reveals_private_or_invalid_account_credentials(api_client, make_user, account):
    email = "reviewer-demo@example.test"
    if account != "missing":
        make_user(email=email,
                  password="different-synthetic-value" if account == "password_mismatch" else DEMO_PASSWORD,
                  role=AdminRole.USER if account == "ordinary" else AdminRole.SENIOR_OFFICER if account == "senior" else AdminRole.COMPLIANCE_OFFICER,
                  is_staff=account == "staff", is_superuser=account == "superuser", is_active=account != "inactive")
    with override_settings(DEMO_REVIEWER_AUTOFILL_ENABLED=True, DEMO_REVIEWER_ALLOW_PRIVILEGED_ACCOUNT=False,
                          DEMO_REVIEWER_EMAIL=email, DEMO_REVIEWER_PASSWORD=DEMO_PASSWORD):
        response = api_client.get(ENDPOINT)
    assert response.status_code == 503
    assert "password" not in response.data
    assert not Token.objects.exists()


def test_demo_allows_privileged_account_when_explicitly_configured(api_client, make_user):
    admin = make_user(email="admin-demo@example.test", password=DEMO_PASSWORD, is_staff=True)
    with override_settings(DEMO_REVIEWER_AUTOFILL_ENABLED=True, DEMO_REVIEWER_ALLOW_PRIVILEGED_ACCOUNT=True,
                          DEMO_REVIEWER_EMAIL=admin.email, DEMO_REVIEWER_PASSWORD=DEMO_PASSWORD):
        response = api_client.get(ENDPOINT)
    assert response.status_code == 200
    assert response.data == {"email": admin.email, "password": DEMO_PASSWORD}


def test_demo_provisioning_creates_one_real_least_privilege_reviewer(api_client):
    with override_settings(DEMO_REVIEWER_AUTOFILL_ENABLED=True, DEMO_REVIEWER_ALLOW_PRIVILEGED_ACCOUNT=False,
                          DEMO_REVIEWER_EMAIL="reviewer-demo@example.test", DEMO_REVIEWER_PASSWORD=DEMO_PASSWORD):
        call_command("configure_demo_reviewer")
        call_command("configure_demo_reviewer")
        autofill = api_client.get(ENDPOINT)
    assert User.objects.count() == 1
    user = User.objects.get()
    assert user.is_compliance_officer and not user.is_staff and not user.is_superuser
    assert user.check_password(DEMO_PASSWORD)
    assert not Token.objects.exists()
    assert api_client.post("/api/v1/auth/admin-login", autofill.data, format="json").status_code == 200


def test_demo_provisioning_never_changes_existing_private_account(make_user):
    user = make_user(email="private@example.test", is_staff=True)
    original_password_hash = user.password
    with override_settings(DEMO_REVIEWER_AUTOFILL_ENABLED=True, DEMO_REVIEWER_ALLOW_PRIVILEGED_ACCOUNT=False,
                          DEMO_REVIEWER_EMAIL=user.email, DEMO_REVIEWER_PASSWORD=DEMO_PASSWORD):
        with pytest.raises(CommandError, match="no account changed"):
            call_command("configure_demo_reviewer")
    user.refresh_from_db()
    assert user.password == original_password_hash and user.is_staff

