"""Minimal JSON-over-HTTPS transport shared by every provider.

Uses `urllib` from the standard library rather than three vendor SDKs. The calls
needed here are single POSTs to documented JSON endpoints, so an SDK per provider
would add three dependency trees, three auth conventions and three upgrade paths in
exchange for nothing — and §14 forbids overengineering this layer.

No request or response body is logged. Prompts can contain business data and headers
carry credentials (TRD_v2.0 §62).
"""

from __future__ import annotations

import json
import urllib.error
import urllib.request
import time
import socket
from typing import Any

from .base import ProviderError, ProviderResponseError

#: Seconds to wait for a provider response before failing. Kept finite so a hung
#: vendor cannot hold a request worker open indefinitely.
DEFAULT_TIMEOUT_SECONDS = 90



def post_json(
    url: str,
    payload: dict[str, Any],
    *,
    headers: dict[str, str],
    provider: str,
    timeout: int = DEFAULT_TIMEOUT_SECONDS,
    max_retries: int = 2,
) -> dict[str, Any]:
    """POST `payload` as JSON and return the decoded response.

    Raises `ProviderError` with the status code but without the response body: an
    error body can echo the submitted prompt back, and this exception message may
    reach a log or an API response. Includes transient backoff retry for HTTP 429.
    """
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", **headers},
        method="POST",
    )
    for attempt in range(max_retries + 1):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                data = json.loads(response.read().decode("utf-8"))
                if not isinstance(data, dict):
                    raise ProviderResponseError(f"{provider} returned an invalid response envelope.")
                return data
        except urllib.error.HTTPError as exc:
            if exc.code in {429, 502, 503, 504} and attempt < max_retries:
                time.sleep(0.5 * (2**attempt))
                continue
            # Vendor bodies may echo credentials/prompts. Never include them in
            # exceptions, API responses or telemetry.
            kind = ("authentication" if exc.code in {401, 403} else "rate_limit" if exc.code == 429
                    else "provider_unavailable" if exc.code >= 500 or exc.code == 404 else "invalid_request")
            if exc.code == 429:
                try:
                    detail = json.loads(exc.read(16000)).get("error", {})
                    if "quota" in str(detail).lower():
                        kind = "quota"
                except (ValueError, AttributeError, OSError):
                    pass
            raise ProviderError(f"{provider} returned HTTP {exc.code}.",
                                failure_type=kind, status_code=exc.code) from None
        except urllib.error.URLError as exc:
            kind = "timeout" if isinstance(exc.reason, (TimeoutError, socket.timeout)) else "network"
            raise ProviderError(f"{provider} transport failed ({kind}).", failure_type=kind) from None
        except (TimeoutError, socket.timeout):
            raise ProviderError(f"{provider} timed out.", failure_type="timeout") from None
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise ProviderResponseError(f"{provider} returned a response that was not valid JSON.") from None

