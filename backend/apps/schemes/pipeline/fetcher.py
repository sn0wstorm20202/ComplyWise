"""Page Fetching Worker for Central & Maharashtra Government Portals.

Authority: User Specification — "A scheduled worker fetches each source (HTTP GET).
We take a snapshot of the HTML or JSON content. We compute a content hash for each
source snapshot; if the hash changes, we know the scheme has been updated."
"""

from __future__ import annotations

import hashlib
import logging
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Optional

from .registry import SchemeSourceConfig
from .snapshots_data import (
    CENTRAL_MSME_HTML,
    DPIIT_OFFERINGS_HTML,
    MAHARASHTRA_MCED_HTML,
    MSME_CHAMPIONS_HTML,
)

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT_SECONDS = 5
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 "
        "ComplyWise/1.0 (Government Scheme Ingestion Pipeline; Regulatory Research)"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

SNAPSHOT_FALLBACK_MAP = {
    "CENTRAL_MSME": CENTRAL_MSME_HTML,
    "MSME_CHAMPIONS": MSME_CHAMPIONS_HTML,
    "DPIIT_OFFERINGS": DPIIT_OFFERINGS_HTML,
    "MAHARASHTRA_MCED": MAHARASHTRA_MCED_HTML,
}


@dataclass
class FetchResult:
    source_key: str
    source_url: str
    domain: str
    content: str
    content_hash: str
    is_live: bool
    status: str
    error: Optional[str] = None


def compute_sha256(text: str) -> str:
    """Computes a canonical SHA-256 hash for raw content."""
    clean_bytes = text.strip().encode("utf-8")
    return hashlib.sha256(clean_bytes).hexdigest()


class SchemePortalFetcher:
    """Fetches official government portal content and computes cryptographic snapshot hash."""

    def __init__(self, timeout: int = DEFAULT_TIMEOUT_SECONDS):
        self.timeout = timeout

    def fetch(self, config: SchemeSourceConfig, simulate_changed_content: str | None = None) -> FetchResult:
        """Fetches the source page, falling back gracefully to authoritative offline snapshot if unreachable."""
        if simulate_changed_content is not None:
            content = simulate_changed_content
            content_hash = compute_sha256(content)
            return FetchResult(
                source_key=config.key,
                source_url=config.primary_url,
                domain=config.domain,
                content=content,
                content_hash=content_hash,
                is_live=True,
                status="SUCCESS",
            )

        content = ""
        is_live = False
        error_msg = None

        try:
            req = urllib.request.Request(config.primary_url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                if response.status == 200:
                    raw_data = response.read()
                    content = raw_data.decode("utf-8", errors="replace")
                    is_live = True
        except Exception as exc:  # Network unreachable / sandbox blocked / 403 / 503
            error_msg = str(exc)
            logger.info("Live crawl for %s failed (%s); capturing an explicit source failure.", config.key, exc)

        if not content:
            content = ""
            is_live = False

        content_hash = compute_sha256(content)
        return FetchResult(
            source_key=config.key,
            source_url=config.primary_url,
            domain=config.domain,
            content=content,
            content_hash=content_hash,
            is_live=is_live,
            status="SUCCESS" if content else "FAILED",
            error=error_msg,
        )
