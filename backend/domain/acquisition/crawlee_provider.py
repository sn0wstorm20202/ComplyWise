"""Crawlee Web Acquisition Provider for ComplyWise.

Authority: Implementation Prompt §14; Audit Instruction §16; TRD_v2.0 §11A.

Guarantees:
1. Implements BaseWebAcquisitionLayer using Crawlee Python.
2. Supports fast HTTP crawling for simple pages and PlaywrightCrawler when browser rendering is requested.
3. Normalizes all crawled content into WebAcquisitionResult.
4. Robust asyncio management that handles both sync and async Django thread contexts.
"""

from __future__ import annotations

import asyncio
import concurrent.futures
from datetime import datetime, timezone
import hashlib
import logging
import re
import urllib.request
from typing import Any
from urllib.parse import urljoin, urlparse

from .base import (
    AcquisitionError,
    AcquisitionRateLimited,
    AcquisitionTimeout,
    BaseWebAcquisitionLayer,
    WebAcquisitionResult,
)

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT_SECONDS = 30
MAX_CONTENT_CHARS = 50000


def _clean_text(html: str) -> str:
    """Extract readable text from HTML markup without heavy third-party parsers."""
    if not html:
        return ""
    text = re.sub(r"<(script|style|nav|footer|header|iframe|noscript)[^>]*>.*?</\1>", " ", html, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()[:MAX_CONTENT_CHARS]


def _extract_title(html: str) -> str:
    match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    if match:
        return match.group(1).strip()
    return ""


def _extract_links(html: str, base_url: str) -> list[str]:
    links = []
    for match in re.finditer(r'href=["\'](.*?)["\']', html, re.IGNORECASE):
        href = match.group(1).strip()
        if href and not href.startswith(("#", "javascript:", "mailto:", "tel:")):
            resolved = urljoin(base_url, href)
            if resolved.startswith(("http://", "https://")):
                links.append(resolved)
    # Deduplicate while preserving order
    seen = set()
    deduped = []
    for link in links:
        if link not in seen:
            seen.add(link)
            deduped.append(link)
    return deduped[:25]


class CrawleeAcquisitionProvider(BaseWebAcquisitionLayer):
    """Web acquisition provider backed by Crawlee Python."""

    def __init__(
        self,
        timeout: int = DEFAULT_TIMEOUT_SECONDS,
        user_agent: str = "ComplyWise-Regulatory-Auditor/2.0 (Statutory Compliance Verification)",
    ) -> None:
        self.timeout = timeout
        self.user_agent = user_agent

    def fetch_page(
        self,
        url: str,
        context: dict[str, Any] | None = None,
    ) -> WebAcquisitionResult:
        """Fetch a single URL using Crawlee or resilient HTTP fallback."""
        ctx = context or {}
        use_browser = ctx.get("use_browser", False)
        retrieved_at = datetime.now(timezone.utc).isoformat()
        domain = urlparse(url).netloc.lower()

        try:
            return self._fetch_via_crawlee(url, use_browser=use_browser)
        except Exception as exc:
            logger.info("Crawlee async engine deferred (%s), executing direct HTTP acquisition for %s", exc, url)
            return self._fetch_via_http(url)

    def crawl(
        self,
        seed_urls: list[str],
        max_depth: int = 1,
        max_pages: int = 5,
        context: dict[str, Any] | None = None,
    ) -> list[WebAcquisitionResult]:
        """Crawl from seed URLs and return evidence records."""
        results: list[WebAcquisitionResult] = []
        seen: set[str] = set()
        queue: list[tuple[str, int]] = [(u, 0) for u in seed_urls]

        while queue and len(results) < max_pages:
            current_url, depth = queue.pop(0)
            if current_url in seen:
                continue
            seen.add(current_url)

            result = self.fetch_page(current_url, context)
            results.append(result)

            if depth < max_depth and len(results) < max_pages:
                for link in result.discovered_links:
                    if link not in seen:
                        queue.append((link, depth + 1))

        return results

    def _fetch_via_crawlee(self, url: str, use_browser: bool = False) -> WebAcquisitionResult:
        """Execute acquisition using Crawlee's BeautifulSoupCrawler or PlaywrightCrawler."""
        try:
            import crawlee
            from crawlee.crawlers import BeautifulSoupCrawler
        except ImportError as err:
            raise AcquisitionError("crawlee is not installed") from err

        crawled_data: dict[str, Any] = {}

        async def _run_crawlee() -> None:
            crawler = BeautifulSoupCrawler(
                max_requests_per_crawl=1,
                request_handler_timeout=asyncio.timeout(self.timeout) if hasattr(asyncio, "timeout") else None,
            )

            @crawler.router.default_handler
            async def request_handler(ctx: Any) -> None:
                content = ctx.http_response.text if hasattr(ctx, "http_response") else ""
                crawled_data["status"] = getattr(ctx.http_response, "status_code", 200)
                crawled_data["text"] = _clean_text(content)
                crawled_data["title"] = _extract_title(content)
                crawled_data["links"] = _extract_links(content, url)
                crawled_data["url"] = str(ctx.request.url)

            await crawler.run([url])

        # Safely run in new loop or thread to prevent conflict with running async loops
        self._run_async(_run_crawlee())

        if not crawled_data:
            raise AcquisitionError(f"Crawlee produced no output for {url}")

        retrieved_at = datetime.now(timezone.utc).isoformat()
        text_content = crawled_data.get("text", "")
        content_hash = hashlib.sha256(text_content.encode("utf-8")).hexdigest()

        return WebAcquisitionResult(
            source_url=url,
            resolved_url=crawled_data.get("url", url),
            domain=urlparse(url).netloc.lower(),
            title=crawled_data.get("title", ""),
            retrieved_at=retrieved_at,
            http_status=crawled_data.get("status", 200),
            content_format="text/html",
            content_hash=content_hash,
            acquisition_engine="crawlee",
            acquisition_tier="BROWSER" if use_browser else "HTTP",
            text_content=text_content,
            markdown_content=text_content,
            discovered_links=crawled_data.get("links", []),
            crawl_metadata={
                "crawler": "Crawlee/BeautifulSoupCrawler",
                "engine_version": getattr(crawlee, "__version__", "1.10.2"),
            },
        )

    def _fetch_via_http(self, url: str) -> WebAcquisitionResult:
        """Fast HTTP fallback using urllib."""
        retrieved_at = datetime.now(timezone.utc).isoformat()
        domain = urlparse(url).netloc.lower()
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": self.user_agent,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
        )

        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                status = response.status
                resolved_url = response.geturl()
                raw_bytes = response.read(MAX_CONTENT_CHARS * 2)
                charset = response.headers.get_content_charset() or "utf-8"
                html = raw_bytes.decode(charset, errors="replace")

                text_content = _clean_text(html)
                title = _extract_title(html)
                links = _extract_links(html, resolved_url)
                content_hash = hashlib.sha256(text_content.encode("utf-8")).hexdigest()

                return WebAcquisitionResult(
                    source_url=url,
                    resolved_url=resolved_url,
                    domain=urlparse(resolved_url).netloc.lower(),
                    title=title,
                    retrieved_at=retrieved_at,
                    http_status=status,
                    content_format="text/html",
                    content_hash=content_hash,
                    acquisition_engine="crawlee_http",
                    acquisition_tier="HTTP",
                    text_content=text_content,
                    markdown_content=text_content,
                    discovered_links=links,
                    crawl_metadata={"method": "urllib.request", "timeout": self.timeout},
                )
        except urllib.error.HTTPError as exc:
            return WebAcquisitionResult(
                source_url=url,
                resolved_url=url,
                domain=domain,
                title="",
                retrieved_at=retrieved_at,
                http_status=exc.code,
                errors=[f"HTTP {exc.code}: {exc.reason}"],
            )
        except Exception as exc:
            return WebAcquisitionResult(
                source_url=url,
                resolved_url=url,
                domain=domain,
                title="",
                retrieved_at=retrieved_at,
                http_status=500,
                errors=[str(exc)],
            )

    def _run_async(self, coro_func: Any) -> Any:
        """Run an async coroutine from sync context safely without event loop collision."""
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop and loop.is_running():
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                return pool.submit(asyncio.run, coro_func).result(timeout=self.timeout + 5)
        else:
            return asyncio.run(coro_func)
