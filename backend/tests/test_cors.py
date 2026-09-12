"""Comprehensive test suite for environment-driven CORS and CSRF configuration.

Authority: Milestone CORS Task — Production Readiness & Security Invariants.
Validates:
A. Allowed localhost origin succeeds with Access-Control-Allow-Origin.
B. Allowed production frontend origin succeeds.
C. Multiple configured origins work independently.
D. Unlisted origin does NOT receive Access-Control-Allow-Origin.
E. Wildcard configuration is strictly rejected in production.
F. Missing production CORS configuration fails safely and visibly.
G. Whitespace in comma-separated environment values is handled correctly.
H. Empty entries and trailing commas are ignored safely.
I. Invalid origin syntax (missing scheme, trailing path, query params) is rejected.
J. OPTIONS preflight request works correctly for an allowed origin.
K. OPTIONS preflight request is rejected for an unapproved origin.
L. Authenticated cross-origin API requests with Authorization header succeed.
"""

from __future__ import annotations

import pytest
from django.test import Client, override_settings
from rest_framework import status
from rest_framework.authtoken.models import Token

from apps.accounts.models import User
from config.cors import (
    CorsConfigurationError,
    get_cors_allowed_origins,
    get_csrf_trusted_origins,
    parse_origins,
    validate_origin,
)


# ==============================================================================
# Unit Tests: Parser & Environment Validation
# ==============================================================================

def test_parse_origins_splits_and_trims_whitespace():
    """G: Whitespace in comma-separated values is trimmed cleanly."""
    raw = "  http://localhost:3000 ,  https://complywise.vercel.app  , https://app.complywise.in "
    parsed = parse_origins(raw)
    assert parsed == [
        "http://localhost:3000",
        "https://complywise.vercel.app",
        "https://app.complywise.in",
    ]


def test_parse_origins_ignores_empty_tokens():
    """H: Empty tokens and trailing commas are safely ignored."""
    raw = ",http://localhost:3000,,,https://complywise.vercel.app,,"
    parsed = parse_origins(raw)
    assert parsed == [
        "http://localhost:3000",
        "https://complywise.vercel.app",
    ]


def test_parse_origins_none_or_empty_returns_empty_list():
    assert parse_origins(None) == []
    assert parse_origins("") == []
    assert parse_origins("   ") == []


def test_validate_origin_valid_http_and_https():
    assert validate_origin("http://localhost:3000") == "http://localhost:3000"
    assert validate_origin("https://complywise.vercel.app") == "https://complywise.vercel.app"
    assert validate_origin("https://app.complywise.in:8443") == "https://app.complywise.in:8443"


def test_validate_origin_strips_trailing_slash():
    assert validate_origin("https://complywise.vercel.app/") == "https://complywise.vercel.app"


def test_validate_origin_rejects_wildcard():
    """E: Wildcard '*' is strictly forbidden."""
    with pytest.raises(CorsConfigurationError, match=r"Wildcard '\*' is strictly forbidden"):
        validate_origin("*")

    with pytest.raises(CorsConfigurationError, match=r"Wildcard '\*' is strictly forbidden"):
        validate_origin("https://*.complywise.app")


def test_validate_origin_rejects_missing_scheme():
    """I: Missing scheme is rejected."""
    with pytest.raises(CorsConfigurationError, match=r"Scheme must be 'http://' or 'https://'"):
        validate_origin("complywise.vercel.app")

    with pytest.raises(CorsConfigurationError, match=r"Scheme must be 'http://' or 'https://'"):
        validate_origin("ftp://complywise.vercel.app")


def test_validate_origin_rejects_trailing_path():
    """I: Trailing path is rejected."""
    with pytest.raises(CorsConfigurationError, match=r"Origins must not contain a path component"):
        validate_origin("https://complywise.vercel.app/dashboard")

    with pytest.raises(CorsConfigurationError, match=r"Origins must not contain a path component"):
        validate_origin("https://complywise.vercel.app/api/v1")


def test_validate_origin_rejects_query_and_fragment():
    """I: Query parameters and fragments are rejected."""
    with pytest.raises(CorsConfigurationError, match=r"Origins must not contain query parameters"):
        validate_origin("https://complywise.vercel.app?redirect=true")

    with pytest.raises(CorsConfigurationError, match=r"Origins must not contain URL fragments"):
        validate_origin("https://complywise.vercel.app#section")


def test_validate_origin_production_enforces_https():
    """Production origins must use HTTPS."""
    with pytest.raises(CorsConfigurationError, match=r"Production origins must use 'https://'"):
        validate_origin("http://insecure-frontend.example.com", is_production=True)


def test_validate_origin_production_disallows_localhost_by_default():
    """Localhost origin is not permitted in production unless opted in."""
    with pytest.raises(CorsConfigurationError, match=r"Localhost origin .* is not permitted in production"):
        validate_origin("http://localhost:3000", is_production=True)

    with pytest.raises(CorsConfigurationError, match=r"Localhost origin .* is not permitted in production"):
        validate_origin("http://127.0.0.1:3000", is_production=True)

    # Opted-in localhost passes in production if flag is enabled
    valid = validate_origin(
        "http://localhost:3000",
        is_production=True,
        allow_localhost_in_prod=True,
    )
    assert valid == "http://localhost:3000"


def test_get_cors_allowed_origins_missing_in_production_fails_safely(monkeypatch):
    """F: Missing production CORS configuration fails safely with an actionable error."""
    with pytest.raises(CorsConfigurationError, match=r"CORS_ALLOWED_ORIGINS environment variable is required in production"):
        get_cors_allowed_origins("", is_production=True)

    monkeypatch.delenv("CORS_ALLOWED_ORIGINS", raising=False)
    with pytest.raises(CorsConfigurationError, match=r"CORS_ALLOWED_ORIGINS environment variable is required in production"):
        get_cors_allowed_origins(None, is_production=True)


def test_get_cors_allowed_origins_dev_fallback():
    """In development, missing CORS_ALLOWED_ORIGINS safely defaults to localhost:3000."""
    dev_origins = get_cors_allowed_origins("", is_production=False)
    assert "http://localhost:3000" in dev_origins
    assert "http://127.0.0.1:3000" in dev_origins


def test_get_csrf_trusted_origins_inherits_production_cors_origins():
    """CSRF trusted origins inherit valid production HTTPS origins when unconfigured."""
    csrf_origins = get_csrf_trusted_origins(
        raw_value=None,
        cors_origins=["https://complywise.vercel.app", "https://app.complywise.in"],
        is_production=True,
    )
    assert csrf_origins == [
        "https://complywise.vercel.app",
        "https://app.complywise.in",
    ]


# ==============================================================================
# Integration Tests: HTTP Requests & CORS Middleware Headers
# ==============================================================================

@pytest.fixture
def client() -> Client:
    return Client()


@pytest.mark.django_db
def test_allowed_localhost_origin_succeeds(client: Client):
    """A: Allowed localhost origin receives Access-Control-Allow-Origin."""
    with override_settings(
        CORS_ALLOWED_ORIGINS=["http://localhost:3000"],
        CORS_ALLOW_ALL_ORIGINS=False,
    ):
        resp = client.get("/api/v1/health", HTTP_ORIGIN="http://localhost:3000")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.headers.get("Access-Control-Allow-Origin") == "http://localhost:3000"
        assert resp.headers.get("Access-Control-Allow-Credentials") == "true"


@pytest.mark.django_db
def test_allowed_production_frontend_origin_succeeds(client: Client):
    """B: Allowed production frontend origin receives Access-Control-Allow-Origin."""
    prod_origin = "https://complywise.vercel.app"
    with override_settings(
        CORS_ALLOWED_ORIGINS=[prod_origin],
        CORS_ALLOW_ALL_ORIGINS=False,
    ):
        resp = client.get("/api/v1/health", HTTP_ORIGIN=prod_origin)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.headers.get("Access-Control-Allow-Origin") == prod_origin
        assert resp.headers.get("Access-Control-Allow-Credentials") == "true"


@pytest.mark.django_db
def test_multiple_configured_origins_work(client: Client):
    """C: Multiple configured origins work independently."""
    origins = [
        "https://complywise.vercel.app",
        "https://app.complywise.in",
    ]
    with override_settings(
        CORS_ALLOWED_ORIGINS=origins,
        CORS_ALLOW_ALL_ORIGINS=False,
    ):
        for o in origins:
            resp = client.get("/api/v1/health", HTTP_ORIGIN=o)
            assert resp.status_code == status.HTTP_200_OK
            assert resp.headers.get("Access-Control-Allow-Origin") == o


@pytest.mark.django_db
def test_unlisted_origin_does_not_receive_allow_origin_header(client: Client):
    """D: Unlisted origin does NOT receive Access-Control-Allow-Origin header."""
    with override_settings(
        CORS_ALLOWED_ORIGINS=["https://complywise.vercel.app"],
        CORS_ALLOW_ALL_ORIGINS=False,
    ):
        resp = client.get("/api/v1/health", HTTP_ORIGIN="https://malicious-attacker.com")
        assert resp.status_code == status.HTTP_200_OK
        # Header must be completely absent for unauthorized origins
        assert "Access-Control-Allow-Origin" not in resp.headers


@pytest.mark.django_db
def test_options_preflight_request_allowed_origin(client: Client):
    """J: OPTIONS preflight request works correctly for an allowed origin."""
    allowed_origin = "https://complywise.vercel.app"
    with override_settings(
        CORS_ALLOWED_ORIGINS=[allowed_origin],
        CORS_ALLOW_ALL_ORIGINS=False,
        CORS_ALLOW_METHODS=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        CORS_ALLOW_HEADERS=["accept", "authorization", "content-type", "x-csrftoken"],
    ):
        resp = client.options(
            "/api/v1/auth/login",
            HTTP_ORIGIN=allowed_origin,
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS="authorization,content-type",
        )
        assert resp.status_code == status.HTTP_200_OK
        assert resp.headers.get("Access-Control-Allow-Origin") == allowed_origin
        assert "POST" in resp.headers.get("Access-Control-Allow-Methods", "")
        assert "authorization" in resp.headers.get("Access-Control-Allow-Headers", "").lower()
        assert resp.headers.get("Access-Control-Allow-Credentials") == "true"


@pytest.mark.django_db
def test_options_preflight_request_unapproved_origin(client: Client):
    """K: OPTIONS preflight request is rejected for an unapproved origin."""
    with override_settings(
        CORS_ALLOWED_ORIGINS=["https://complywise.vercel.app"],
        CORS_ALLOW_ALL_ORIGINS=False,
    ):
        resp = client.options(
            "/api/v1/auth/login",
            HTTP_ORIGIN="https://unauthorized-attacker.example.org",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS="authorization,content-type",
        )
        # For rejected origin, Access-Control-Allow-Origin is NOT emitted
        assert "Access-Control-Allow-Origin" not in resp.headers


@pytest.mark.django_db
def test_authenticated_cross_origin_request_with_authorization_header(client: Client):
    """L: Cross-origin request sending Authorization header succeeds and authenticates."""
    user = User.objects.create_user(
        email="cors_user@example.com",
        password="ValidPassword123!",
        full_name="CORS Test User",
    )
    token, _ = Token.objects.get_or_create(user=user)
    allowed_origin = "https://complywise.vercel.app"

    with override_settings(
        CORS_ALLOWED_ORIGINS=[allowed_origin],
        CORS_ALLOW_ALL_ORIGINS=False,
    ):
        resp = client.get(
            "/api/v1/auth/me",
            HTTP_ORIGIN=allowed_origin,
            HTTP_AUTHORIZATION=f"Token {token.key}",
        )
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data["data"]["email"] == "cors_user@example.com"
        assert resp.headers.get("Access-Control-Allow-Origin") == allowed_origin
        assert resp.headers.get("Access-Control-Allow-Credentials") == "true"
