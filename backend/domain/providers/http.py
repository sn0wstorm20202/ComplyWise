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
from typing import Any

from .base import ProviderError

#: Seconds to wait for a provider response before failing. Kept finite so a hung
#: vendor cannot hold a request worker open indefinitely.
DEFAULT_TIMEOUT_SECONDS = 10


def post_json(
    url: str,
    payload: dict[str, Any],
    *,
    headers: dict[str, str],
    provider: str,
    timeout: int = DEFAULT_TIMEOUT_SECONDS,
) -> dict[str, Any]:
    """POST `payload` as JSON and return the decoded response.

    Raises `ProviderError` with the status code but without the response body: an
    error body can echo the submitted prompt back, and this exception message may
    reach a log or an API response.
    """
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json", **headers},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise ProviderError(
            f"{provider} returned HTTP {exc.code}. Response body withheld from the log."
        ) from None
    except urllib.error.URLError as exc:
        raise ProviderError(f"{provider} could not be reached: {exc.reason}") from None
    except json.JSONDecodeError:
        raise ProviderError(f"{provider} returned a response that was not valid JSON.") from None
