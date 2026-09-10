"""Environment-driven CORS and CSRF configuration and validation.

Authority: Production Deployment Readiness and Cross-Origin Security.
Ensures:
* Allowed origins are dynamically configured via environment variables.
* Strict parsing: trims whitespace, ignores empty values, preserves full scheme and port.
* Production validation: enforces explicit HTTPS origins, strictly bans wildcards (*),
  bans path components and query/fragment tokens, and disallows localhost in production
  unless explicitly opted in.
* Fails safely and visibly during startup if configuration is missing or malformed in production.
"""

from __future__ import annotations

import os
import urllib.parse
from typing import Sequence

DEFAULT_DEV_ORIGINS: tuple[str, ...] = (
    "http://localhost:3000",
    "http://127.0.0.1:3000",
)

CORS_ALLOW_METHODS: tuple[str, ...] = (
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
)

CORS_ALLOW_HEADERS: tuple[str, ...] = (
    "accept",
    "authorization",
    "content-type",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
)

CORS_EXPOSE_HEADERS: tuple[str, ...] = (
    "content-type",
    "content-disposition",
)


class CorsConfigurationError(ValueError):
    """Raised when CORS or CSRF configuration is invalid, unsafe, or missing in production."""


def parse_origins(raw_value: str | None) -> list[str]:
    """Split comma-separated origin strings, trim whitespace, and discard empty entries.

    Deduplicates entries while preserving insertion order.
    """
    if not raw_value:
        return []

    tokens = [item.strip() for item in raw_value.split(",") if item.strip()]
    return list(dict.fromkeys(tokens))


def validate_origin(
    origin: str,
    *,
    is_production: bool = False,
    allow_localhost_in_prod: bool = False,
) -> str:
    """Validate a single origin string according to HTTP origin specification.

    Origins must:
    * Include an explicit scheme (http:// or https://)
    * Contain a non-empty hostname/network location
    * NOT contain a wildcard (*)
    * NOT contain a path component (e.g. /path or /api)
    * NOT contain query parameters or fragments
    * In production: use https:// and NOT use localhost (unless opted in)
    """
    if not origin or not isinstance(origin, str):
        raise CorsConfigurationError("CORS origin must be a non-empty string.")

    cleaned = origin.strip()

    if cleaned == "*" or "*" in cleaned:
        raise CorsConfigurationError(
            f"Invalid CORS origin '{origin}': Wildcard '*' is strictly forbidden. "
            "An explicit allowlist of trusted frontend origins must be specified."
        )

    parsed = urllib.parse.urlsplit(cleaned)

    if parsed.scheme not in {"http", "https"}:
        raise CorsConfigurationError(
            f"Invalid CORS origin '{origin}': Scheme must be 'http://' or 'https://'. "
            f"Expected format: 'https://{cleaned.lstrip(':/')}'"
        )

    if not parsed.netloc or not parsed.hostname:
        raise CorsConfigurationError(
            f"Invalid CORS origin '{origin}': Missing hostname or network location. "
            f"Expected format: '{parsed.scheme}://example.com'"
        )

    # Path must be empty or just a trailing single slash
    if parsed.path and parsed.path != "/":
        raise CorsConfigurationError(
            f"Invalid CORS origin '{origin}': Origins must not contain a path component. "
            f"Use '{parsed.scheme}://{parsed.netloc}' instead of '{origin}'."
        )

    if parsed.query:
        raise CorsConfigurationError(
            f"Invalid CORS origin '{origin}': Origins must not contain query parameters."
        )

    if parsed.fragment:
        raise CorsConfigurationError(
            f"Invalid CORS origin '{origin}': Origins must not contain URL fragments."
        )

    # Production-specific safety checks
    if is_production:
        is_localhost = parsed.hostname in {"localhost", "127.0.0.1", "::1"} or parsed.hostname.endswith(".localhost")

        if is_localhost and not allow_localhost_in_prod:
            raise CorsConfigurationError(
                f"Localhost origin '{origin}' is not permitted in production. "
                "Set CORS_ALLOW_LOCALHOST_IN_PRODUCTION=True if local frontend testing against production is intentionally required."
            )

        if parsed.scheme != "https" and not is_localhost:
            raise CorsConfigurationError(
                f"Insecure origin '{origin}' in production: Production origins must use 'https://'."
            )

    # Return normalized origin (scheme://host[:port])
    return f"{parsed.scheme}://{parsed.netloc}"


def get_cors_allowed_origins(
    raw_value: str | None = None,
    *,
    is_production: bool = False,
    allow_localhost_in_prod: bool = False,
) -> list[str]:
    """Parse and validate CORS allowed origins from an environment value.

    If raw_value is not passed, reads from os.getenv('CORS_ALLOWED_ORIGINS').
    """
    if raw_value is None:
        raw_value = os.getenv("CORS_ALLOWED_ORIGINS")

    tokens = parse_origins(raw_value)

    if not tokens:
        if is_production:
            raise CorsConfigurationError(
                "CORS_ALLOWED_ORIGINS environment variable is required in production, but was not set or is empty. "
                "Configure an explicit origin list (e.g. 'CORS_ALLOWED_ORIGINS=https://complywise.vercel.app')."
            )
        return list(DEFAULT_DEV_ORIGINS)

    validated = [
        validate_origin(
            tok,
            is_production=is_production,
            allow_localhost_in_prod=allow_localhost_in_prod,
        )
        for tok in tokens
    ]
    return list(dict.fromkeys(validated))


def get_csrf_trusted_origins(
    raw_value: str | None = None,
    cors_origins: Sequence[str] | None = None,
    *,
    is_production: bool = False,
    allow_localhost_in_prod: bool = False,
) -> list[str]:
    """Parse and validate CSRF trusted origins from environment values.

    Checks CSRF_TRUSTED_ORIGINS and DJANGO_CSRF_TRUSTED_ORIGINS.
    If unset or empty:
    * In production: defaults to secure HTTPS origins from cors_origins.
    * In development: defaults to DEFAULT_DEV_ORIGINS.
    """
    if raw_value is None:
        raw_value = os.getenv("CSRF_TRUSTED_ORIGINS")
        if raw_value is None and not is_production:
            raw_value = os.getenv("DJANGO_CSRF_TRUSTED_ORIGINS")

    tokens = parse_origins(raw_value)

    if not tokens:
        if cors_origins:
            # Safely inherit origins from validated CORS allowlist
            inherited = [
                o for o in cors_origins
                if (o.startswith("https://") or (not is_production or allow_localhost_in_prod))
            ]
            return list(dict.fromkeys(inherited))
        if is_production:
            return []
        return list(DEFAULT_DEV_ORIGINS)

    validated = [
        validate_origin(
            tok,
            is_production=is_production,
            allow_localhost_in_prod=allow_localhost_in_prod,
        )
        for tok in tokens
    ]
    return list(dict.fromkeys(validated))
