"""Domain-aware official source classification and ranking.

Authority: Milestone Task — Part C, Part D; TRD_v2.0 §11A.

Source classification distinguishes:
- OFFICIAL (Government / Statutory Regulator)
- OFFICIAL_GUIDANCE (Authorized statutory development or promotion portal)
- SECONDARY (Reputable statutory repo or gazette)
- UNKNOWN (General web / unverified blog)
"""

from __future__ import annotations

from typing import Any
from urllib.parse import urlparse

OFFICIAL = "OFFICIAL"
OFFICIAL_GUIDANCE = "OFFICIAL_GUIDANCE"
SECONDARY = "SECONDARY"
UNKNOWN = "UNKNOWN"

# Primary official authority host suffixes for Indian central and state regulators
OFFICIAL_HOST_SUFFIXES = (
    ".gov.in",
    ".nic.in",
    ".res.in",
    "cpcb.nic.in",
    "bis.gov.in",
    "dgft.gov.in",
    "fssai.gov.in",
    "indiacode.nic.in",
    "egazette.gov.in",
    "moef.gov.in",
    "parivesh.nic.in",
    "msme.gov.in",
    "dpiit.gov.in",
    "wbpcb.gov.in",
    "gpcb.gujarat.gov.in",
    "tnpcb.gov.in",
    "kspcb.karnataka.gov.in",
    "tspcb.cpcb.gov.in",
    "mppcb.mp.gov.in",
)

OFFICIAL_GUIDANCE_HOSTS = (
    "investindia.gov.in",
    "wbpidc.gov.in",
    "indextb.com",
    "guidancekerala.com",
    "ibbi.gov.in",
)

SECONDARY_HOSTS = (
    "prsindia.org",
    "legalaffairs.gov.in",
)

BLOCKED_SPAM_SUBSTRINGS = (
    "blogspot.com",
    "wordpress.com",
    "quora.com",
    "reddit.com",
    "facebook.com",
    "instagram.com",
    "twitter.com",
    "x.com",
    "youtube.com",
)


def classify_domain(url: str) -> str:
    """Classify a URL into an authoritative source tier."""
    try:
        host = (urlparse(url).hostname or "").lower()
    except Exception:
        return UNKNOWN

    if not host:
        return UNKNOWN

    if any(blocked in host for blocked in BLOCKED_SPAM_SUBSTRINGS):
        return UNKNOWN

    if any(host.endswith(suffix) or host == suffix for suffix in OFFICIAL_HOST_SUFFIXES):
        return OFFICIAL

    if any(host.endswith(h) or host == h for h in OFFICIAL_GUIDANCE_HOSTS):
        return OFFICIAL_GUIDANCE

    if any(host.endswith(h) or host == h for h in SECONDARY_HOSTS):
        return SECONDARY

    return UNKNOWN


def score_candidate(candidate: dict[str, Any]) -> int:
    """Score candidate source by domain authority and content signals."""
    url = candidate.get("url", "")
    tier = classify_domain(url)

    score = 0
    if tier == OFFICIAL:
        score += 100
    elif tier == OFFICIAL_GUIDANCE:
        score += 70
    elif tier == SECONDARY:
        score += 40
    else:
        score += 5

    # Boost score if title or description references statutory acts or boards
    text = (candidate.get("title", "") + " " + candidate.get("description", "")).lower()
    statutory_cues = ["act", "rules", "board", "regulation", "order", "portal", "licence", "license", "consent", "epr", "notification"]
    matches = sum(1 for cue in statutory_cues if cue in text)
    score += min(matches * 5, 25)

    return score


def rank_candidates(candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Rank, deduplicate and prioritize official candidate URLs."""
    seen_urls: set[str] = set()
    ranked: list[dict[str, Any]] = []

    for c in candidates:
        url = c.get("url", "").strip()
        if not url or url in seen_urls:
            continue
        seen_urls.add(url)

        tier = classify_domain(url)
        score = score_candidate(c)
        ranked.append({
            **c,
            "url": url,
            "authority_tier": tier,
            "rank_score": score,
            "is_official": tier in {OFFICIAL, OFFICIAL_GUIDANCE},
        })

    # Sort descending by score
    ranked.sort(key=lambda item: -item["rank_score"])
    return ranked
