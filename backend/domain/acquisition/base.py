"""Base Web Acquisition Abstraction Layer for ComplyWise.

Authority: Implementation Prompt §14; Audit Instruction §16; TRD_v2.0 §11A.

Guarantees:
1. Decoupled Web Acquisition interface isolating crawler implementation details.
2. Normalized evidence output contract containing canonical metadata.
3. Clean error hierarchy and graceful failure handling.
4. Pass results into source validation/evidence pipeline — never directly deciding legal applicability.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
import hashlib
from typing import Any
from urllib.parse import urlparse


@dataclass
class WebAcquisitionResult:
    """Normalized evidence contract produced by any acquisition provider."""

    source_url: str
    resolved_url: str
    domain: str
    title: str
    retrieved_at: str
    http_status: int = 200
    content_format: str = "text/plain"
    content_hash: str = ""
    acquisition_engine: str = "crawlee"
    acquisition_tier: str = "HTTP"  # HTTP | BROWSER | MOCKED
    text_content: str = ""
    markdown_content: str = ""
    discovered_links: list[str] = field(default_factory=list)
    crawl_metadata: dict[str, Any] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)

    def __post_init__(self) -> None:
        if not self.domain and self.resolved_url:
            self.domain = urlparse(self.resolved_url).netloc.lower()
        elif not self.domain and self.source_url:
            self.domain = urlparse(self.source_url).netloc.lower()

        if not self.content_hash:
            content_bytes = (self.text_content or self.markdown_content or "").encode("utf-8")
            self.content_hash = hashlib.sha256(content_bytes).hexdigest()

        if not self.retrieved_at:
            self.retrieved_at = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class AcquisitionError(Exception):
    """Base error for web acquisition failures."""


class AcquisitionTimeout(AcquisitionError):
    """The web acquisition request timed out."""


class AcquisitionRateLimited(AcquisitionError):
    """Target portal or acquisition engine rate limit encountered."""


class BaseWebAcquisitionLayer(ABC):
    """Abstract interface for regulatory and statutory document web acquisition."""

    @abstractmethod
    def fetch_page(
        self,
        url: str,
        context: dict[str, Any] | None = None,
    ) -> WebAcquisitionResult:
        """Fetch a single page and return normalized evidence."""
        ...

    @abstractmethod
    def crawl(
        self,
        seed_urls: list[str],
        max_depth: int = 1,
        max_pages: int = 5,
        context: dict[str, Any] | None = None,
    ) -> list[WebAcquisitionResult]:
        """Crawl from seed URLs up to maximum depth and return results."""
        ...
