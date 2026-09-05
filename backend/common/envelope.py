"""Response envelope and error contract.

Authority: TRD_v2.0 §30.

Success::

    {"data": ..., "meta": {...}}

Error::

    {"error": {"code": "VALIDATION_ERROR", "message": "...", "details": [...]}}

Every API response passes through here so that the frontend never has to guess
at a response shape, and so that no view can accidentally leak a bare payload.
"""

from __future__ import annotations

import logging
from typing import Any

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.db import IntegrityError
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

logger = logging.getLogger("complywise.api")

ENVELOPE_KEYS = frozenset({"data", "meta"})

#: DRF exception class -> stable machine-readable error code.
ERROR_CODES: dict[type[Exception], str] = {
    exceptions.ValidationError: "VALIDATION_ERROR",
    exceptions.ParseError: "PARSE_ERROR",
    exceptions.AuthenticationFailed: "AUTHENTICATION_FAILED",
    exceptions.NotAuthenticated: "NOT_AUTHENTICATED",
    exceptions.PermissionDenied: "PERMISSION_DENIED",
    exceptions.NotFound: "NOT_FOUND",
    exceptions.MethodNotAllowed: "METHOD_NOT_ALLOWED",
    exceptions.NotAcceptable: "NOT_ACCEPTABLE",
    exceptions.UnsupportedMediaType: "UNSUPPORTED_MEDIA_TYPE",
    exceptions.Throttled: "THROTTLED",
}

STATUS_FALLBACK_CODES: dict[int, str] = {
    status.HTTP_400_BAD_REQUEST: "BAD_REQUEST",
    status.HTTP_401_UNAUTHORIZED: "NOT_AUTHENTICATED",
    status.HTTP_403_FORBIDDEN: "PERMISSION_DENIED",
    status.HTTP_404_NOT_FOUND: "NOT_FOUND",
    status.HTTP_405_METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
    status.HTTP_409_CONFLICT: "CONFLICT",
}


def envelope(data: Any = None, meta: dict[str, Any] | None = None) -> dict[str, Any]:
    """Build a success envelope explicitly (useful in tests and services)."""
    return {"data": data, "meta": meta or {}}


def error_body(code: str, message: str, details: list[Any] | None = None) -> dict[str, Any]:
    return {"error": {"code": code, "message": message, "details": details or []}}


def error_response(
    code: str,
    message: str,
    http_status: int,
    details: list[Any] | None = None,
) -> Response:
    return Response(error_body(code, message, details), status=http_status)


def is_enveloped(data: Any) -> bool:
    if not isinstance(data, dict):
        return False
    if "error" in data:
        return True
    return "data" in data and set(data).issubset(ENVELOPE_KEYS)


class EnvelopeJSONRenderer(JSONRenderer):
    """Wrap any non-enveloped payload in ``{"data": ..., "meta": {}}``."""

    def render(self, data, accepted_media_type=None, renderer_context=None):  # noqa: ANN001
        if data is None:
            return b""
        if not is_enveloped(data):
            data = envelope(data)
        return super().render(data, accepted_media_type, renderer_context)


def _flatten_validation_details(detail: Any, field: str | None = None) -> list[dict[str, Any]]:
    """Turn DRF's nested validation detail into a flat, renderable list."""
    if isinstance(detail, dict):
        out: list[dict[str, Any]] = []
        for key, value in detail.items():
            nested = key if field is None else f"{field}.{key}"
            out.extend(_flatten_validation_details(value, nested))
        return out
    if isinstance(detail, list):
        # A list of plain messages belongs to `field`; a list of structures nests.
        if all(not isinstance(item, (dict, list)) for item in detail):
            return [{"field": field, "messages": [str(item) for item in detail]}]
        out = []
        for index, item in enumerate(detail):
            nested = f"{field}[{index}]" if field else f"[{index}]"
            out.extend(_flatten_validation_details(item, nested))
        return out
    return [{"field": field, "messages": [str(detail)]}]


def _first_message(details: list[dict[str, Any]]) -> str:
    for item in details:
        messages = item.get("messages") or []
        if messages:
            return str(messages[0])
    return "The request could not be processed."


def envelope_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    """DRF exception handler that emits the canonical error envelope."""
    if isinstance(exc, Http404):
        exc = exceptions.NotFound()
    elif isinstance(exc, DjangoPermissionDenied):
        exc = exceptions.PermissionDenied()
    elif isinstance(exc, ValueError):
        logger.info("Validation ValueError on %s: %s", context.get("request"), exc)
        return error_response(
            "VALIDATION_ERROR",
            str(exc),
            status.HTTP_400_BAD_REQUEST,
            details=[{"messages": [str(exc)]}],
        )
    elif isinstance(exc, IntegrityError):
        # Concurrency / uniqueness collisions are a client-visible conflict,
        # not a server fault (TRD_v2.0 §63).
        logger.warning("Integrity error on %s", context.get("request"), exc_info=True)
        return error_response(
            "CONFLICT",
            "The request conflicts with the current state of the resource.",
            status.HTTP_409_CONFLICT,
        )

    response = drf_exception_handler(exc, context)
    if response is None:
        # Unhandled exception: let Django's handler produce a 500 so the failure
        # is logged loudly rather than being flattened into a tidy payload.
        return None

    code = ERROR_CODES.get(type(exc)) or STATUS_FALLBACK_CODES.get(
        response.status_code, "ERROR"
    )

    if isinstance(exc, exceptions.ValidationError):
        details = _flatten_validation_details(exc.detail)
        message = _first_message(details)
    else:
        details = []
        detail = getattr(exc, "detail", None)
        if isinstance(detail, (dict, list)):
            details = _flatten_validation_details(detail)
            message = _first_message(details)
        else:
            message = str(detail) if detail else "The request could not be processed."

    response.data = error_body(code, message, details)
    return response
