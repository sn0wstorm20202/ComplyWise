"""Authentication foundation and the error envelope."""

from __future__ import annotations

import pytest
from rest_framework.authtoken.models import Token

from tests.conftest import TEST_PASSWORD

pytestmark = pytest.mark.django_db


def test_register_returns_user_and_token(api_client):
    response = api_client.post(
        "/api/v1/auth/register",
        {"email": "New.Founder@Example.com", "password": TEST_PASSWORD, "full_name": "New Founder"},
    )
    assert response.status_code == 201, response.content
    data = response.json()["data"]
    assert data["user"]["email"] == "new.founder@example.com"  # normalised
    assert data["token"]
    assert "password" not in str(data)


def test_register_rejects_weak_password(api_client):
    response = api_client.post(
        "/api/v1/auth/register", {"email": "weak@example.com", "password": "123"}
    )
    assert response.status_code == 400
    error = response.json()["error"]
    assert error["code"] == "VALIDATION_ERROR"
    assert error["details"]


def test_register_rejects_duplicate_email(api_client, user):
    response = api_client.post(
        "/api/v1/auth/register", {"email": user.email, "password": TEST_PASSWORD}
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def test_login_returns_token(api_client, user):
    response = api_client.post(
        "/api/v1/auth/login", {"email": user.email, "password": TEST_PASSWORD}
    )
    assert response.status_code == 200, response.content
    assert response.json()["data"]["token"] == Token.objects.get(user=user).key


def test_login_failure_does_not_disclose_whether_account_exists(api_client, user):
    wrong_password = api_client.post(
        "/api/v1/auth/login", {"email": user.email, "password": "definitely-not-it"}
    )
    unknown_email = api_client.post(
        "/api/v1/auth/login", {"email": "nobody@example.com", "password": TEST_PASSWORD}
    )
    assert wrong_password.status_code == unknown_email.status_code == 400
    assert wrong_password.json()["error"]["details"] == unknown_email.json()["error"]["details"]


def test_me_requires_authentication(api_client):
    response = api_client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "NOT_AUTHENTICATED"


def test_me_returns_current_user(api_client, user):
    token = Token.objects.create(user=user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    response = api_client.get("/api/v1/auth/me")
    assert response.status_code == 200
    assert response.json()["data"]["email"] == user.email


def test_logout_invalidates_the_token(api_client, user):
    token = Token.objects.create(user=user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    assert api_client.post("/api/v1/auth/logout").status_code == 204
    assert not Token.objects.filter(user=user).exists()
    assert api_client.get("/api/v1/auth/me").status_code == 401


def test_user_model_stores_no_government_identifier(user):
    """Data minimisation (TRD_v2.0 §60): the account holds no ID numbers."""
    field_names = {f.name for f in user._meta.get_fields()}
    for forbidden in {"pan", "aadhaar", "gstin", "phone", "gst_number"}:
        assert forbidden not in field_names
