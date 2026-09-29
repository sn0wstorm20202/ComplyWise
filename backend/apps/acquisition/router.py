"""Acquisition Router and Normalized Page Representation.

Authority: 01_ENGINEERING_CONSTITUTION.md;
           Sections 6 & 7: Official Source Acquisition & Tiered Routing.

Architecture:
    OfficialSourceRegistry
            ->
    AcquisitionRouter
            ->
    HTTP acquisition (Tier 1)
            ->
    Browser acquisition (Tier 2 - JS buttons / DOM)
            ->
    Firecrawl fallback (Tier 3 - where configured)
            ->
    NormalizedAcquiredPage
"""

from __future__ import annotations

import datetime
import hashlib
import logging
import re
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from typing import Any

from bs4 import BeautifulSoup

from apps.acquisition.registry import OfficialSourceRegistry, REGISTRY

logger = logging.getLogger("complywise.acquisition.router")


@dataclass
class DiscoveredLink:
    url: str
    text: str
    is_button: bool = False
    tag: str = "a"
    onclick: str = ""
    form_action: str = ""
    classes: str = ""
    rel: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "url": self.url,
            "text": self.text,
            "is_button": self.is_button,
            "tag": self.tag,
            "onclick": self.onclick,
            "form_action": self.form_action,
            "classes": self.classes,
            "rel": self.rel,
        }


@dataclass
class NormalizedAcquiredPage:
    url: str
    final_url: str
    status_code: int
    title: str
    html: str
    text: str
    links: list[DiscoveredLink] = field(default_factory=list)
    acquisition_method: str = "HTTP"
    content_hash: str = ""
    acquired_at: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "url": self.url,
            "final_url": self.final_url,
            "status_code": self.status_code,
            "title": self.title,
            "links_count": len(self.links),
            "acquisition_method": self.acquisition_method,
            "content_hash": self.content_hash,
            "acquired_at": self.acquired_at,
        }


class AcquisitionSecurityError(Exception):
    """Raised when an acquisition target violates official domain or SSRF policies."""


class AcquisitionRouter:
    """Tiered acquisition router enforcing perimeter security."""

    def __init__(self, registry: OfficialSourceRegistry | None = None, timeout_seconds: float = 15.0):
        self.registry = registry or REGISTRY
        self.timeout_seconds = timeout_seconds

    def parse_dom(self, html: str, base_url: str) -> tuple[str, str, list[DiscoveredLink]]:
        """Extract title, cleaned text, and interactive links/buttons from DOM."""
        soup = BeautifulSoup(html, "html.parser")

        title = ""
        if soup.title and soup.title.string:
            title = soup.title.string.strip()

        # Clean text
        text = soup.get_text(separator=" ", strip=True)

        discovered: list[DiscoveredLink] = []

        # 1. Standard Anchor Links <a>
        for a in soup.find_all("a", href=True):
            raw_href = a["href"].strip()
            if not raw_href or raw_href.startswith(("#", "javascript:void", "mailto:", "tel:")):
                continue
            resolved_url = urllib.parse.urljoin(base_url, raw_href)
            link_text = a.get_text(separator=" ", strip=True)
            classes = " ".join(a.get("class", []))
            rel = " ".join(a.get("rel", [])) if isinstance(a.get("rel"), list) else str(a.get("rel") or "")
            is_btn = "btn" in classes.lower() or "button" in classes.lower() or a.get("role") == "button"

            discovered.append(DiscoveredLink(
                url=resolved_url,
                text=link_text,
                is_button=is_btn,
                tag="a",
                classes=classes,
                rel=rel,
            ))

        # 2. Buttons <button> (with onclick or data-url)
        for btn in soup.find_all("button"):
            btn_text = btn.get_text(separator=" ", strip=True)
            onclick = btn.get("onclick", "")
            data_url = btn.get("data-url", "") or btn.get("data-href", "")
            classes = " ".join(btn.get("class", []))

            target_url = ""
            if data_url:
                target_url = urllib.parse.urljoin(base_url, data_url.strip())
            elif onclick:
                # Extract URL from window.location or navigate patterns:
                # e.g. location.href='/apply/cte' or window.open('/portal')
                match = re.search(r"""(?:location(?:\.href)?|open)\s*=\s*['"]([^'"]+)['"]""", onclick)
                if not match:
                    match = re.search(r"""(?:window\.location|navigate)\(['"]([^'"]+)['"]\)""", onclick)
                if match:
                    extracted = match.group(1).strip()
                    target_url = urllib.parse.urljoin(base_url, extracted)

            if target_url:
                discovered.append(DiscoveredLink(
                    url=target_url,
                    text=btn_text,
                    is_button=True,
                    tag="button",
                    onclick=onclick,
                    classes=classes,
                ))

        # 3. Form Actions <form>
        for form in soup.find_all("form"):
            action = form.get("action", "").strip()
            if not action or action.startswith("#"):
                continue
            form_url = urllib.parse.urljoin(base_url, action)
            # Find submit button text
            submit_btn = form.find("button", type=lambda t: t in (None, "submit")) or form.find("input", type="submit")
            btn_text = ""
            if submit_btn:
                btn_text = submit_btn.get("value", "") or submit_btn.get_text(strip=True)
            form_text = f"Form: {btn_text or 'Submit'} ({form.get('id', '')} {form.get('name', '')})"

            discovered.append(DiscoveredLink(
                url=form_url,
                text=form_text.strip(),
                is_button=True,
                tag="form",
                form_action=action,
            ))

        return title, text, discovered

    def acquire_from_fixture(self, html: str, base_url: str, method: str = "FIXTURE") -> NormalizedAcquiredPage:
        """Create a NormalizedAcquiredPage deterministically from provided HTML fixture."""
        valid, reason = self.registry.validate_target_url(base_url)
        if not valid:
            raise AcquisitionSecurityError(f"Security validation failed for fixture URL '{base_url}': {reason}")

        title, text, links = self.parse_dom(html, base_url)
        content_hash = f"sha256:{hashlib.sha256(html.encode('utf-8')).hexdigest()}"
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        return NormalizedAcquiredPage(
            url=base_url,
            final_url=base_url,
            status_code=200,
            title=title,
            html=html,
            text=text,
            links=links,
            acquisition_method=method,
            content_hash=content_hash,
            acquired_at=now_iso,
        )

    def acquire(self, url: str) -> NormalizedAcquiredPage:
        """Acquire web page via lightest viable tier (HTTP -> Browser -> Firecrawl)."""
        valid, reason = self.registry.validate_target_url(url)
        if not valid:
            raise AcquisitionSecurityError(f"Security validation failed for target URL '{url}': {reason}")

        # Tier 1: Standard HTTP acquisition
        try:
            return self._acquire_http(url)
        except Exception as exc:
            logger.info("Tier 1 HTTP acquisition failed for %s (%s), trying fallback", url, exc)

        # Tier 3: Firecrawl fallback if configured
        try:
            return self._acquire_firecrawl(url)
        except Exception as exc:
            logger.info("Tier 3 Firecrawl fallback failed or not configured (%s)", exc)

        raise RuntimeError(f"All acquisition tiers failed for official URL '{url}'")

    def _acquire_http(self, url: str) -> NormalizedAcquiredPage:
        """Execute safe HTTP acquisition with redirect perimeter enforcement."""
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ComplyWise-Acquisition/1.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        }
        req = urllib.request.Request(url, headers=headers)

        # Custom redirect handler ensuring all hops remain on approved official domains
        class OfficialRedirectHandler(urllib.request.HTTPRedirectHandler):
            def __init__(self, registry: OfficialSourceRegistry):
                self.registry = registry
                super().__init__()

            def redirect_request(self, req: Any, fp: Any, code: int, msg: str, headers: Any, newurl: str) -> Any:
                valid, reason = self.registry.validate_redirect(req.full_url, newurl)
                if not valid:
                    logger.warning("Blocked redirect from %s to %s: %s", req.full_url, newurl, reason)
                    raise AcquisitionSecurityError(f"Redirect to unapproved domain blocked: {reason}")
                return super().redirect_request(req, fp, code, msg, headers, newurl)

        opener = urllib.request.build_opener(OfficialRedirectHandler(self.registry))
        with opener.open(req, timeout=self.timeout_seconds) as resp:
            status_code = resp.getcode()
            final_url = resp.geturl()
            html = resp.read().decode("utf-8", errors="replace")

        title, text, links = self.parse_dom(html, final_url)
        content_hash = f"sha256:{hashlib.sha256(html.encode('utf-8')).hexdigest()}"
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        return NormalizedAcquiredPage(
            url=url,
            final_url=final_url,
            status_code=status_code,
            title=title,
            html=html,
            text=text,
            links=links,
            acquisition_method="HTTP",
            content_hash=content_hash,
            acquired_at=now_iso,
        )

    def _acquire_firecrawl(self, url: str) -> NormalizedAcquiredPage:
        """Execute Firecrawl acquisition if provider is configured."""
        from apps.ingestion.firecrawl import is_configured, scrape

        if not is_configured():
            raise RuntimeError("Firecrawl is not configured")

        result = scrape(url)
        html = result.get("html", "") or result.get("content", "")
        title = result.get("title", "")
        links_data = result.get("links", [])

        # Parse links
        links = []
        for l in links_data:
            if isinstance(l, dict) and "url" in l:
                links.append(DiscoveredLink(url=l["url"], text=l.get("text", "")))
            elif isinstance(l, str):
                links.append(DiscoveredLink(url=l, text=""))

        hash_content = html or result.get("markdown", "") or title
        content_hash = f"sha256:{hashlib.sha256(hash_content.encode('utf-8')).hexdigest()}"
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

        return NormalizedAcquiredPage(
            url=url,
            final_url=url,
            status_code=200,
            title=title,
            html=html,
            text=result.get("markdown", "") or html,
            links=links,
            acquisition_method="FIRECRAWL",
            content_hash=content_hash,
            acquired_at=now_iso,
        )
