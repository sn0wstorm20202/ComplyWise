"""Connect the deployed ComplianceRAG search contract; preserve local retrieval.

Remote chunks remain external context. A remote VERIFIED label does not publish
an AST rule or create locally verified evidence. Failure never consumes LLM fallback.
"""
from __future__ import annotations

import logging
import re
import time
from urllib.parse import urlparse

from django.conf import settings
from domain.jurisdictions.resolver import JurisdictionRegistry, normalize_jurisdiction
from domain.intelligence.official_sources import is_primary_official_source
from domain.providers.http import post_json

logger = logging.getLogger(__name__)


def _value(value):
    return value.get("value") if isinstance(value, dict) else value


def _matches_state(row, state):
    explicit = row.get("jurisdiction") or row.get("state")
    if explicit:
        codes = {normalize_jurisdiction(item) for item in (explicit if isinstance(explicit, list) else [explicit])}
        if None in codes or (state not in codes and "CENTRAL" not in codes):
            return False
    # The deployed service returns state sources even when business_context is
    # supplied. Filter recognizable state names in title/authority ourselves.
    text = " ".join(str(row.get(key) or "") for key in ("source_title", "authority"))
    scopes = {item["code"] for item in JurisdictionRegistry.all_jurisdictions()
        if item["code"] != "CENTRAL" and re.search(r"\b" + re.escape(item["name"]) + r"\b", text, re.I)}
    return not scopes or state in scopes


def retrieve_regulatory_context(query, facts=None, *, limit=6):
    base = getattr(settings, "COMPLIANCERAG_URL", "").strip().rstrip("/")
    if not base:
        return {"status": "NOT_CONFIGURED", "passages": [], "rejected_count": 0}
    facts = {key: _value(value) for key, value in (facts or {}).items()}
    state = normalize_jurisdiction(facts.get("state"))
    started = time.monotonic()
    try:
        parsed = urlparse(base)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            raise ValueError("Invalid retrieval service URL.")
        # Send only the query and decision context, never account/provider secrets.
        filters = {key: facts[key] for key in ("state", "district", "is_manufacturing",
            "total_worker_count", "legal_constitution", "import_export_intent") if key in facts}
        data = post_json(base + "/retrieval/search", {"query": str(query)[:1200],
            "business_context": filters, "top_k": min(limit, 6)}, headers={},
            provider="compliancerag", timeout=getattr(settings, "COMPLIANCERAG_TIMEOUT_SECONDS", 8),
            max_retries=0)
        rows = data.get("results")
        if not isinstance(rows, list):
            raise ValueError("Invalid retrieval response.")
        passages = []
        rejected = 0
        for row in rows[:24]:
            if not isinstance(row, dict):
                rejected += 1
                continue
            text, chunk_id = row.get("content"), row.get("chunk_id")
            score = row.get("relevance_score")
            if (not isinstance(text, str) or not text.strip() or not isinstance(chunk_id, str)
                    or not chunk_id.strip() or not _matches_state(row, state)
                    or (score is not None and (not isinstance(score, (int, float)) or score < 0.25))):
                rejected += 1
                continue
            source_url = row.get("official_url")
            if not isinstance(source_url, str) or not is_primary_official_source(source_url):
                source_url = None
            passages.append({"chunk_id": chunk_id[:200], "source_id": str(row.get("source_id") or "")[:200],
                "source_title": str(row.get("source_title") or "")[:400],
                "authority": str(row.get("authority") or "")[:300], "excerpt": text.strip()[:3000],
                "locator": str(row.get("locator") or "")[:200], "source_url": source_url,
                "relevance_score": score, "reported_verification_status": str(row.get("verification_status") or ""),
                "result_origin": "EXTERNAL_RETRIEVAL_CONTEXT"})
            if len(passages) >= min(limit, 6):
                break
        status = "SUCCESS" if passages else "EMPTY"
        logger.info("ComplianceRAG retrieval %s: %s passages, %sms", status, len(passages), int((time.monotonic()-started)*1000))
        return {"status": status, "passages": passages, "rejected_count": rejected}
    except Exception as error:
        logger.warning("ComplianceRAG retrieval unavailable (%s); local retrieval and provider fallback preserved", type(error).__name__)
        return {"status": "UNAVAILABLE", "passages": [], "rejected_count": 0,
                "failure_type": getattr(error, "failure_type", "invalid_response")}
