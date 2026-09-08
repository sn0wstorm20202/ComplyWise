"""Discovery source acquisition — Firecrawl client (server-side only).

Authority: TRD_v2.0 §11A; milestone §6-§8, §40.

Firecrawl exists to *acquire candidate source material* for human verification.
It never writes production knowledge directly: everything it fetches is stored as
`Source(status=DISCOVERED)` + `Evidence(verification_status=UNVERIFIED)`, which the
applicability engine and the assistant are structurally unable to treat as verified
(APPLICABLE requires ACTIVE source + VERIFIED evidence; assistant retrieval filters
source__status=ACTIVE).

No vendor SDK: a single documented JSON endpoint over stdlib urllib, matching the
provider layer's transport discipline (`domain.providers.http`). The API key is
read from settings, sent as a Bearer header, and never appears in logs, errors or
API responses.
"""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Any

from django.conf import settings

from domain.providers.base import ProviderError, ProviderNotConfigured

PROVIDER_NAME = "firecrawl"
API_ROOT = "https://api.firecrawl.dev/v2"

#: Seconds to wait for the crawl service. Bounded so a hung call cannot hold a
#: request worker open indefinitely.
DEFAULT_TIMEOUT_SECONDS = 45


class FirecrawlUnavailable(ProviderError):
    """The crawl service answered but could not serve this request (auth, quota,
    malformed target). Distinct from 'not configured': the key exists but the
    call failed."""


def _api_key() -> str:
    return getattr(settings, "FIRECRAWL_API_KEY", "") or ""


def is_configured() -> bool:
    return bool(_api_key())


def _post(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    key = _api_key()
    if not key:
        raise ProviderNotConfigured(PROVIDER_NAME, "FIRECRAWL_API_KEY")

    request = urllib.request.Request(
        f"{API_ROOT}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {key}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=DEFAULT_TIMEOUT_SECONDS) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        # Never echo the body: on 4xx it can contain request metadata.
        raise FirecrawlUnavailable(f"firecrawl returned HTTP {exc.code}.") from None
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        raise FirecrawlUnavailable(f"firecrawl could not be reached: {exc}") from None
    except json.JSONDecodeError:
        raise FirecrawlUnavailable("firecrawl returned a response that was not valid JSON.") from None


def search(
    query: str,
    *,
    limit: int = 5,
    scrape_markdown: bool = True,
) -> list[dict[str, Any]]:
    """Search the web through Firecrawl and return raw result records.

    """
    payload: dict[str, Any] = {
        "query": query,
        "limit": limit,
    }
    if scrape_markdown:
        payload["scrapeOptions"] = {"formats": ["markdown"]}

    data = _post("/search", payload)
    if not data.get("success", True):
        raise FirecrawlUnavailable("firecrawl reported an unsuccessful search.")
    web = (data.get("data") or {}).get("web") or []
    results: list[dict[str, Any]] = []
    for item in web:
        if not isinstance(item, dict):
            continue
        url = str(item.get("url") or "").strip()
        if not url:
            continue
        results.append(
            {
                "url": url,
                "title": str(item.get("title") or "").strip(),
                "description": str(item.get("description") or "").strip(),
                "markdown": str(item.get("markdown") or "").strip(),
            }
        )
    return results


def scrape(url: str) -> dict[str, Any]:
    """Fetch one URL and return the normalized page (title + markdown)."""
    data = _post("/scrape", {"url": url, "formats": ["markdown"]})
    doc = data.get("data") or {}
    metadata = doc.get("metadata") or {}
    return {
        "url": url,
        "title": str(metadata.get("title") or doc.get("title") or "").strip(),
        "markdown": str(doc.get("markdown") or "").strip(),
        "status_code": metadata.get("statusCode"),
    }
