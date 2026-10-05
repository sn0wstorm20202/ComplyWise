"""HTML DOM & API Parser for Government Scheme Portals.

Authority: User Specification — "We parse the content (e.g. HTML DOM or API JSON)
to locate scheme entries. For example, find each scheme title, description, and
detail link on the page. Extract standardized fields: title, summary, authority,
jurisdiction, sectors, benefits, application link, effective dates, evidence..."
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

from bs4 import BeautifulSoup

from .normalizer import (
    extract_quantitative_benefit,
    normalize_benefit_type,
    normalize_jurisdiction,
    normalize_msme_scales,
    normalize_sectors,
    parse_date_safe,
)
from .registry import SchemeSourceConfig

logger = logging.getLogger(__name__)


@dataclass
class ExtractedSchemeCandidate:
    scheme_code: str
    title: str
    authority: str
    jurisdiction: str
    summary: str
    benefit_type: str
    benefit_summary: str
    benefit_details: dict[str, Any]
    eligibility_statement: str
    eligibility_criteria: dict[str, Any]
    sectors: list[str]
    scale_match: list[str]
    application_route: str
    application_url: str
    source_url: str
    source_domain: str
    evidence_snippet: str
    effective_from: Any = None
    effective_to: Any = None
    published_date: Any = None
    metadata: dict[str, Any] = field(default_factory=dict)


class SchemeDOMParser:
    """Parses HTML DOM from official government portals into standardized candidate records."""

    def parse(self, html_content: str, config: SchemeSourceConfig, *, source_url: str | None = None) -> list[ExtractedSchemeCandidate]:
        if not html_content:
            return []

        soup = BeautifulSoup(html_content, "html.parser")
        candidates: list[ExtractedSchemeCandidate] = []

        # Find scheme containers across the supported portal layouts
        containers = soup.find_all(["article", "div", "section"], class_=lambda c: c and any(
            k in str(c) for k in ["scheme-card", "scheme-entry", "offering-box", "mced-item", "scheme-box"]
        ))

        for el in containers:
            try:
                candidate = self._parse_element(el, config)
                if candidate:
                    if source_url:
                        candidate.source_url = source_url
                    candidates.append(candidate)
            except Exception as exc:
                logger.warning("Error parsing scheme element in %s: %s", config.key, exc)

        return candidates

    def _parse_element(self, el, config: SchemeSourceConfig) -> ExtractedSchemeCandidate | None:
        code = el.get("data-code") or ""
        title_el = el.find(["h2", "h3", "h1", "div"], class_=lambda c: c and any(
            k in str(c) for k in ["title", "heading", "name"]
        ))
        title = title_el.get_text(strip=True) if title_el else ""
        if not title:
            return None

        authority_el = el.find(class_=lambda c: c and "authority" in str(c))
        authority = authority_el.get_text(strip=True) if authority_el else config.authority

        jur_el = el.find(class_=lambda c: c and "jurisdiction" in str(c))
        raw_jur = jur_el.get_text(strip=True) if jur_el else config.jurisdiction
        jurisdiction = normalize_jurisdiction(raw_jur)

        sectors_el = el.find(class_=lambda c: c and "sector" in str(c))
        raw_sectors = sectors_el.get_text(strip=True) if sectors_el else "ALL"
        sectors = normalize_sectors(raw_sectors)

        scales_el = el.find(class_=lambda c: c and "scale" in str(c))
        raw_scales = scales_el.get_text(strip=True) if scales_el else "MICRO, SMALL, MEDIUM"
        scale_match = normalize_msme_scales(raw_scales)

        btype_el = el.find(class_=lambda c: c and "type" in str(c).lower() and "benefit" in str(c).lower())
        raw_btype = btype_el.get_text(strip=True) if btype_el else ""

        bdesc_el = el.find(
            class_=lambda c: c and (
                any(k in str(c).lower() for k in ["benefit-desc", "entry-benefit", "offering-benefit-desc"])
                or ("benefit" in str(c).lower() and "type" not in str(c).lower())
            )
        )
        benefit_summary = bdesc_el.get_text(strip=True) if bdesc_el else ""

        benefit_type = normalize_benefit_type(raw_btype, benefit_summary)
        benefit_details = extract_quantitative_benefit(benefit_summary)

        elig_el = el.find(class_=lambda c: c and "eligibility" in str(c))
        eligibility_statement = elig_el.get_text(strip=True) if elig_el else ""

        evidence_el = el.find(class_=lambda c: c and "evidence" in str(c))
        # No source passage was captured when that element is absent. A source
        # label is not a quotation, and must never be substituted for one.
        evidence_snippet = evidence_el.get_text(strip=True) if evidence_el else ""

        app_route_el = el.find(class_=lambda c: c and any(k in str(c) for k in ["app-route", "route"]))
        app_route = app_route_el.get_text(strip=True) if app_route_el else f"Apply via {config.domain}"

        link_el = el.find("a", href=True)
        app_url = link_el["href"] if link_el else config.primary_url

        dates_el = el.find(class_=lambda c: c and any(k in str(c) for k in ["dates", "validity"]))
        eff_from = None
        eff_to = None
        if dates_el:
            eff_from = parse_date_safe(dates_el.get("data-from"))
            eff_to = parse_date_safe(dates_el.get("data-to"))

        if not code:
            code = "SCHEME-" + title[:30].upper().replace(" ", "-").replace("(", "").replace(")", "")

        eligibility_criteria = {
            "jurisdiction": jurisdiction,
            "sectors": sectors,
            "scale_match": scale_match,
            "requires_active_production": True,
        }

        return ExtractedSchemeCandidate(
            scheme_code=code,
            title=title,
            authority=authority,
            jurisdiction=jurisdiction,
            summary=benefit_summary,
            benefit_type=benefit_type,
            benefit_summary=benefit_summary,
            benefit_details=benefit_details,
            eligibility_statement=eligibility_statement,
            eligibility_criteria=eligibility_criteria,
            sectors=sectors,
            scale_match=scale_match,
            application_route=app_route,
            application_url=app_url,
            source_url=config.primary_url,
            source_domain=config.domain,
            evidence_snippet=evidence_snippet,
            effective_from=eff_from,
            effective_to=eff_to,
            published_date=eff_from,
        )
