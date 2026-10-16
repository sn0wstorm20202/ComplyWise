"""Google auth flow security checks; external code/token verification is mocked."""
from datetime import timedelta
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

import pytest
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.google_auth import challenge, digest, resolve_google_user
from apps.accounts.models import GoogleIdentity, GoogleLoginAttempt, User

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def oauth_config():
    with override_settings(GOOGLE_AUTH_CLIENT_ID="fixture-client", GOOGLE_AUTH_CLIENT_SECRET="fixture-secret",
        GOOGLE_AUTH_REDIRECT_URI="http://127.0.0.1:8000/api/v1/auth/google/callback",
        GOOGLE_AUTH_FRONTEND_CALLBACK_URL="http://localhost:3000/auth/google/callback"):
        yield


def begin(client):
    verifier = "browser-verifier-" + "x" * 40
    response = client.get("/api/v1/auth/google/start", {"handoff_challenge": challenge(verifier)})
    assert response.status_code == 302
    query = parse_qs(urlparse(response["Location"]).query)
    attempt = GoogleLoginAttempt.objects.get(pk=digest(query["state"][0]))
    return verifier, query["state"][0], attempt


def test_google_login_handoff_is_browser_bound_and_single_use(api_client):
    verifier, state, attempt = begin(api_client)
    claims = {"email": "new@gmail.com", "email_verified": True, "sub": "fixture-subject", "name": "Fixture",
              "nonce": attempt.nonce}
    with patch("apps.accounts.google_auth.exchange_google_code", return_value=claims) as exchange:
        callback = api_client.get("/api/v1/auth/google/callback", {"state": state, "code": "fixture-code"})
    ticket = parse_qs(urlparse(callback["Location"]).fragment)["ticket"][0]
    assert "token=" not in callback["Location"] and "fixture-secret" not in callback["Location"]
    assert exchange.call_args.args == ("fixture-code", attempt.code_verifier)
    wrong = api_client.post("/api/v1/auth/google/exchange", {"ticket": ticket, "verifier": "other-browser"}, format="json")
    assert wrong.status_code == 401
    with patch.object(GoogleLoginAttempt.objects, "select_for_update",
                      wraps=GoogleLoginAttempt.objects.select_for_update) as lock:
        result = api_client.post("/api/v1/auth/google/exchange", {"ticket": ticket, "verifier": verifier}, format="json")
    # A nullable user join cannot be locked on PostgreSQL. Lock only the attempt
    # while preserving atomic consumption and browser binding.
    lock.assert_called_once_with(of=("self",))
    assert result.status_code == 200 and result.data["token"]
    assert result.data["user"]["email"] == "new@gmail.com"
    replay = api_client.post("/api/v1/auth/google/exchange", {"ticket": ticket, "verifier": verifier}, format="json")
    assert replay.status_code == 401
    assert User.objects.count() == GoogleIdentity.objects.count() == 1
    assert not User.objects.first().has_usable_password()


@pytest.mark.parametrize("failure", ["missing_cookie", "wrong_nonce", "expired", "unverified_email"])
def test_google_invalid_binding_never_creates_account(api_client, failure):
    verifier, state, attempt = begin(api_client)
    claims = {"email": "new@gmail.com", "email_verified": failure != "unverified_email", "sub": "fixture-subject",
              "nonce": "wrong" if failure == "wrong_nonce" else attempt.nonce}
    if failure == "missing_cookie":
        api_client.cookies.clear()
    if failure == "expired":
        attempt.expires_at = timezone.now() - timedelta(seconds=1)
        attempt.save()
    with patch("apps.accounts.google_auth.exchange_google_code", return_value=claims):
        result = api_client.get("/api/v1/auth/google/callback", {"state": state, "code": "fixture-code"})
    assert "error=" in result["Location"] and "ticket=" not in result["Location"]
    assert not GoogleIdentity.objects.exists() and not User.objects.exists()


def test_google_gmail_links_existing_password_account_without_duplicates(make_user):
    user = make_user(email="same@gmail.com")
    resolved, created = resolve_google_user({"email": "Same@GMAIL.com", "email_verified": True, "sub": "fixture-subject"})
    assert resolved.pk == user.pk and created is False
    assert User.objects.count() == 1 and resolved.has_usable_password()


def test_google_cannot_take_over_existing_third_party_email(make_user):
    make_user(email="existing@example.com")
    with pytest.raises(ValueError, match="existing email and password"):
        resolve_google_user({"email": "existing@example.com", "email_verified": True, "sub": "fixture-subject"})
    assert not GoogleIdentity.objects.exists() and User.objects.count() == 1


def test_duplicate_registration_message_exact_case_insensitive(make_user, api_client):
    make_user(email="existing@example.com")
    result = api_client.post("/api/v1/auth/register", {"email": "EXISTING@example.com", "password": "synthetic-Password-2026"}, format="json")
    assert result.status_code == 400
    assert result.data["error"]["message"] == "The user already exists. Please sign in."
    assert User.objects.count() == 1
