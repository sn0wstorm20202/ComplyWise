"""SerpApi discovers URLs only; acquisition is owned by domain.acquisition.

Contract: https://serpapi.com/search-api and /api-status-and-error-codes.
The provider URL contains a credential: never log requests or upstream bodies.
"""
import json
import socket
import threading
import time
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings
from domain.providers.base import ProviderError, ProviderNotConfigured

PROVIDER_NAME = "serpapi"
API_ROOT = "https://serpapi.com/search.json"
_unavailable_until = 0.0
_lock = threading.Lock()


def is_configured():
    return bool(getattr(settings, "SERPAPI_API_KEY", ""))


def search(query, *, limit=5):
    global _unavailable_until
    key = getattr(settings, "SERPAPI_API_KEY", "")
    if not key:
        raise ProviderNotConfigured(PROVIDER_NAME, "SERPAPI_API_KEY / SERP_API")
    if not isinstance(query, str) or not query.strip():
        raise ProviderError("Search query is empty.", failure_type="invalid_request")
    with _lock:
        if time.monotonic() < _unavailable_until:
            raise ProviderError("Search provider cooling down.", failure_type="rate_limit")
    params = urllib.parse.urlencode({"engine": "google", "q": query, "api_key": key,
                                     "gl": "in", "hl": "en", "num": max(1, min(limit, 10))})
    request = urllib.request.Request(API_ROOT + "?" + params, headers={"Accept": "application/json"})
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(request, timeout=settings.SEARCH_TIMEOUT_SECONDS) as response:
            raw = response.read(2_000_001)
            if len(raw) > 2_000_000:
                raise ProviderError("Search response exceeded limit.", failure_type="malformed_response")
            data = json.loads(raw)
    except urllib.error.HTTPError as exc:
        kind = "authentication" if exc.code in {401,403} else "rate_limit" if exc.code == 429 else "provider_unavailable" if exc.code >= 500 else "invalid_request"
        if kind in {"authentication", "rate_limit"}:
            with _lock:
                _unavailable_until = time.monotonic() + 60
        raise ProviderError(f"SerpApi returned HTTP {exc.code}.", failure_type=kind, status_code=exc.code) from None
    except (TimeoutError, socket.timeout):
        raise ProviderError("SerpApi timed out.", failure_type="timeout") from None
    except urllib.error.URLError as exc:
        kind = "timeout" if isinstance(exc.reason, TimeoutError) else "network"
        raise ProviderError("SerpApi transport failed.", failure_type=kind) from None
    except (ValueError, UnicodeError):
        raise ProviderError("SerpApi returned invalid JSON.", failure_type="malformed_response") from None
    if not isinstance(data, dict) or data.get("error"):
        # Empty organic results without an error are a valid empty search.
        raise ProviderError("SerpApi reported an unsuccessful search.", failure_type="provider_unavailable")
    rows = data.get("organic_results", [])
    if not isinstance(rows, list):
        raise ProviderError("SerpApi returned invalid results.", failure_type="malformed_response")
    metadata = data.get("search_metadata") or {}
    if not isinstance(metadata, dict):
        raise ProviderError("SerpApi returned invalid metadata.", failure_type="malformed_response")
    latency = round((time.perf_counter() - started) * 1000, 2)
    return [{"url": row["link"], "title": str(row.get("title") or ""),
             "description": str(row.get("snippet") or ""), "acquisition_mode": "SEARCH_API",
             "search_id": str(metadata.get("id") or ""), "search_latency_ms": latency}
            for row in rows[:limit] if isinstance(row, dict) and isinstance(row.get("link"), str)
            and row["link"].startswith(("https://", "http://"))]
