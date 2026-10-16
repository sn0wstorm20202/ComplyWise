"""Official-source Crawlee acquisition with explicit HTTP/browser modes.

Crawlee owns fetching; SerpApi owns discovery. Captures never publish rules.
"""
from __future__ import annotations

import asyncio
import concurrent.futures
import hashlib
import html
import io
import ipaddress
import re
import socket
import time
import uuid
from datetime import datetime, timezone, timedelta
from urllib.parse import urljoin, urlparse
from typing import Any

from django.conf import settings
from .base import AcquisitionError, BaseWebAcquisitionLayer, WebAcquisitionResult

MAX_CONTENT_CHARS = 50000
MAX_BYTES = 5_000_000


def validate_destination(url: str, *, official: bool = True) -> None:
    from domain.intelligence.official_sources import is_primary_official_source
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.password:
        raise AcquisitionError("Rejected destination URL.")
    if parsed.port not in {None, 80, 443}:
        raise AcquisitionError("Rejected destination port.")
    if official and not is_primary_official_source(url):
        raise AcquisitionError("Rejected unofficial source or redirect.")
    try:
        addresses = socket.getaddrinfo(parsed.hostname, parsed.port or (443 if parsed.scheme == "https" else 80))
    except OSError:
        raise AcquisitionError("Source DNS resolution failed.") from None
    if not addresses or any(not ipaddress.ip_address(row[4][0]).is_global for row in addresses):
        raise AcquisitionError("Rejected private or reserved destination.")


def _clean_text(markup: str) -> str:
    markup = re.sub(r"<(script|style|nav|footer|header|iframe|noscript)[^>]*>.*?</\1>", " ", markup, flags=re.S | re.I)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", markup))).strip()[:MAX_CONTENT_CHARS]


def _extract_title(markup: str) -> str:
    match = re.search(r"<title[^>]*>(.*?)</title>", markup, re.S | re.I)
    return _clean_text(match.group(1)) if match else ""


def _extract_links(markup: str, base_url: str) -> list[str]:
    return list(dict.fromkeys(urljoin(base_url, link) for link in re.findall(r"href=[\"'](.*?)[\"']", markup, re.I)
                            if link and not link.startswith(("#", "javascript:", "mailto:", "tel:"))))[:25]


def normalize_capture(url, final_url, body, mime, status, *, mode, metadata=None):
    if not 200 <= status < 300:
        raise AcquisitionError(f"Source returned HTTP {status}.")
    if not body or len(body) > MAX_BYTES:
        raise AcquisitionError("Source was empty or exceeded the capture byte limit.")
    metadata = dict(metadata or {})
    metadata.update(raw_content_hash=hashlib.sha256(body).hexdigest(), content_length_bytes=len(body), mime_type=mime)
    if body.startswith(b"%PDF") or mime == "application/pdf":
        from pypdf import PdfReader
        try:
            reader = PdfReader(io.BytesIO(body))
            if len(reader.pages) > 150:
                raise AcquisitionError("PDF exceeded page limit.")
            text = "\n".join(page.extract_text() or "" for page in reader.pages)[:MAX_CONTENT_CHARS]
            title = str((reader.metadata or {}).get("/Title") or "")
        except AcquisitionError:
            raise
        except Exception:
            raise AcquisitionError("PDF parsing failed; no usable capture.") from None
        mime = "application/pdf"
    elif mime in {"text/html", "application/xhtml+xml", "text/plain"}:
        markup = body.decode("utf-8", errors="replace")
        title = _extract_title(markup)
        text = _clean_text(markup)
    else:
        raise AcquisitionError("Unsupported source MIME type.")
    if len(text.strip()) < 80:
        raise AcquisitionError("Empty, boilerplate, or non-text source; review required.")
    blocked = ("access denied", "captcha", "just a moment", "sign in", "log in", "403 forbidden", "404 not found")
    if any(word in title.casefold() for word in blocked) or (len(text) < 1500 and any(word in text.casefold() for word in blocked)):
        raise AcquisitionError("Blocked, login, CAPTCHA, or error page rejected.")
    metadata["normalized_text_hash"] = hashlib.sha256(text.encode()).hexdigest()
    # Dates are retained only if supplied by the source; never guessed.
    return WebAcquisitionResult(source_url=url, resolved_url=final_url, domain=urlparse(final_url).hostname or "",
        title=title, retrieved_at=datetime.now(timezone.utc).isoformat(), http_status=status,
        content_format=mime, content_hash=metadata["normalized_text_hash"], acquisition_engine=mode,
        acquisition_tier="BROWSER" if mode == "CRAWLEE_BROWSER" else "HTTP", text_content=text,
        markdown_content=text, crawl_metadata=metadata)


class CrawleeAcquisitionProvider(BaseWebAcquisitionLayer):
    def __init__(self, timeout=None, user_agent="ComplyWise/2.0 Regulatory Research"):
        self.timeout = timeout or getattr(settings, "ACQUISITION_TIMEOUT_SECONDS", 10)
        self.user_agent = user_agent

    def fetch_page(self, url, context=None):
        started = time.perf_counter()
        effective_timeout = min(self.timeout, int((context or {}).get("timeout", self.timeout)))
        try:
            validate_destination(url)
            use_browser = bool((context or {}).get("use_browser"))
            try:
                result = self._fetch_via_crawlee(url, use_browser=use_browser)
            except AcquisitionError as exc:
                # A thin HTML shell can require rendering. Do not retry blocked,
                # authentication, destination or timeout failures in a browser.
                elapsed = time.perf_counter() - started
                if use_browser or "Empty, boilerplate, or non-text source" not in str(exc) or elapsed >= effective_timeout - 3:
                    raise
                try:
                    from crawlee.crawlers import PlaywrightCrawler  # noqa: F401
                    browser_provider = CrawleeAcquisitionProvider(timeout=max(3, effective_timeout - elapsed))
                    result = browser_provider._fetch_via_crawlee(url, use_browser=True)
                    result.crawl_metadata["render_reason"] = "HTTP_THIN_CONTENT"
                except Exception:
                    raise exc

            result.crawl_metadata["latency_ms"] = round((time.perf_counter() - started) * 1000, 2)
            return result
        except Exception as exc:
            # No hidden vendor/direct HTTP fallback. Persisted recovery is owned
            # by discovery, which can still continue into contextual planning.
            return WebAcquisitionResult(source_url=url, resolved_url=url, domain=urlparse(url).hostname or "",
                title="", retrieved_at="", http_status=0, acquisition_engine="FAILED_ACQUISITION",
                errors=[str(exc) if isinstance(exc, AcquisitionError) else f"Acquisition failed ({type(exc).__name__})."],
                crawl_metadata={"latency_ms": round((time.perf_counter()-started)*1000, 2)})

    def crawl(self, seed_urls, max_depth=1, max_pages=5, context=None):
        # Links must pass the exact same destination policy as initial seeds.
        queue = [(url, 0) for url in seed_urls]; seen = set(); results = []
        while queue and len(results) < max_pages:
            url, depth = queue.pop(0)
            if url in seen: continue
            seen.add(url); result = self.fetch_page(url, context); results.append(result)
            if not result.errors and depth < max_depth:
                queue.extend((link, depth+1) for link in result.discovered_links if link not in seen)
        return results

    def _fetch_via_crawlee(self, url, use_browser=False):
        try:
            from crawlee.crawlers import HttpCrawler, PlaywrightCrawler
            from crawlee.http_clients import HttpxHttpClient
            from crawlee.storage_clients import MemoryStorageClient
            from crawlee.storages import RequestQueue
        except ImportError:
            raise AcquisitionError("Crawlee runtime is not installed.") from None

        async def capture():
            redirects = []; current = url
            for hop in range(6):
                validate_destination(current)
                captured = {}
                storage = MemoryStorageClient()
                queue = await RequestQueue.open(name="capture-" + uuid.uuid4().hex, storage_client=storage)
                options = dict(max_requests_per_crawl=1, max_request_retries=0, max_session_rotations=0,
                    use_session_pool=False, retry_on_blocked=False, configure_logging=False,
                    request_handler_timeout=timedelta(seconds=self.timeout), storage_client=storage, request_manager=queue)
                if use_browser:
                    crawler = PlaywrightCrawler(**options, headless=True, navigation_timeout=timedelta(seconds=self.timeout))
                    @crawler.pre_navigation_hook
                    async def guard(ctx):
                        async def route_guard(route):
                            try:
                                validate_destination(route.request.url, official=route.request.is_navigation_request() and route.request.frame == ctx.page.main_frame)
                            except (AcquisitionError, ValueError):
                                await route.abort(); return
                            await route.continue_()
                        await ctx.page.route("**/*", route_guard)
                else:
                    # Disable automatic redirects: each hop is checked before fetching.
                    crawler = HttpCrawler(**options, http_client=HttpxHttpClient(follow_redirects=False))
                @crawler.router.default_handler
                async def handler(ctx):
                    if use_browser:
                        body = (await ctx.page.content()).encode()
                        response = ctx.response
                        final = ctx.page.url
                        validate_destination(final)
                        request = response.request if response else None
                        chain = []
                        while request is not None:
                            chain.append(request.url); request = request.redirected_from
                        captured.update(body=body, mime="text/html", status=response.status if response else 0,
                                        final=final, location="", browser_redirect_chain=list(reversed(chain)))
                    else:
                        headers = ctx.http_response.headers
                        captured.update(body=await ctx.http_response.read(), mime=headers.get("content-type", "").split(";")[0].lower(),
                                        status=ctx.http_response.status_code, final=ctx.request.loaded_url or current,
                                        location=headers.get("location", ""), source_last_modified=headers.get("last-modified"))
                try:
                    await crawler.run([current])
                finally:
                    await queue.drop()
                if not captured:
                    raise AcquisitionError("Crawlee produced no usable capture; blocked or failed source.")
                if not use_browser and 300 <= captured["status"] < 400 and captured["location"]:
                    redirects.append(current); current = urljoin(current, captured["location"]); continue
                validate_destination(captured["final"])
                if urlparse(url).path.strip("/") and not urlparse(captured["final"]).path.strip("/"):
                    raise AcquisitionError("Requested document redirected to an unrelated portal homepage.")
                result = normalize_capture(url, captured["final"], captured["body"], captured["mime"], captured["status"],
                    mode="CRAWLEE_BROWSER" if use_browser else "CRAWLEE_HTTP",
                    metadata={"redirect_chain": captured.get("browser_redirect_chain") or [*redirects, captured["final"]],
                              "source_last_modified": captured.get("source_last_modified"), "extractor_version": "cw-crawlee-1",
                              "engine_version": "1.7.2", "http_backend": "httpx" if not use_browser else None})
                if result.content_format == "text/html":
                    result.discovered_links = _extract_links(captured["body"].decode("utf-8", errors="replace"), captured["final"])
                return result
            raise AcquisitionError("Source exceeded redirect limit.")
        return self._run_async(asyncio.wait_for(capture(), timeout=self.timeout))

    def _run_async(self, coroutine: Any):
        try: asyncio.get_running_loop()
        except RuntimeError: return asyncio.run(coroutine)
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            return executor.submit(asyncio.run, coroutine).result(timeout=self.timeout + 2)
