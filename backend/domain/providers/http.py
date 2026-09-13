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
from typing import Any

from .base import ProviderError

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
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < max_retries:
                time.sleep(1.5 * (2**attempt))
                continue
            err_detail = ""
            try:
                raw_body = exc.read().decode("utf-8", errors="replace")
                err_data = json.loads(raw_body)
                if isinstance(err_data, dict):
                    if "error" in err_data:
                        err_obj = err_data["error"]
                        err_detail = err_obj.get("message") if isinstance(err_obj, dict) else str(err_obj)
                    elif "message" in err_data:
                        err_detail = err_data["message"]
            except Exception:
                pass
            msg = f"{provider} returned HTTP {exc.code} ({err_detail})" if err_detail else f"{provider} returned HTTP {exc.code}."
            raise ProviderError(msg) from None
        except urllib.error.URLError as exc:
            raise ProviderError(f"{provider} could not be reached: {exc.reason}") from None
        except json.JSONDecodeError:
            raise ProviderError(f"{provider} returned a response that was not valid JSON.") from None

