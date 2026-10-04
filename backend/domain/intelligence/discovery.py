"""Live Regulatory Discovery Engine for ComplyWise.

Authority: Step 03 Specification §3, §6, §7, §8, §9, §10, §11, §12, §13, §14; TRD_v2.0 §11A.

Architecture:
1. Search Planning: Generates 3–6 multidimensional regulatory queries.
2. SerpApi / Crawlee Search: Fetches candidates via search provider adapter.
3. Official-source Filtering: Classifies sources into PRIMARY_OFFICIAL, SECONDARY, and UNVERIFIED.
   Only PRIMARY_OFFICIAL sources can directly support compliance requirements.
4. Bounded Source Scraping: Fetches and sanitizes markdown from top 6–10 candidate official URLs.
5. Verbatim Evidence Extraction: Excerpts actual text, hashes content, links provenance.
6. Quarantine & Audit Trail: Persists Source, Evidence, and DiscoveryRun records.
7. Resilience & Fallback: Gracefully handles SerpApi / Crawlee failure without fabricating compliance.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
import hashlib
import logging
import re
from typing import Any
import uuid

from django.conf import settings
from django.utils import timezone as django_tz

from common.enums import SourceStatus, VerificationStatus
from apps.businesses.models import Business
from apps.evidence.models import Evidence, Source
from apps.ingestion.models import CandidateRequirement, DiscoveryRun
from domain.acquisition import get_web_acquisition_provider, WebAcquisitionResult
from domain.context.business_context import DerivedBusinessContext
from domain.intelligence.context_merge import EnrichedBusinessContext
from domain.intelligence.official_sources import (
    SourceTier,
    canonicalize_url,
    classify_source_url,
    is_primary_official_source,
)
from domain.intelligence.orchestration import (
    OrchestrationContext,
    RegulatoryDiscoveryProvider,
    RegulatoryDiscoveryResult,
)
from domain.intelligence.search_planning import plan_regulatory_searches
from domain.providers.base import ProviderError, ProviderNotConfigured
from domain.providers.telemetry import telemetry_tracker
from knowledge_packs.catalogs import STATUTORY_PORTAL_REGISTRY

logger = logging.getLogger(__name__)

# Workload and Safety Limits for Hackathon Demo
MAX_SEARCH_QUERIES = 6
MAX_RESULTS_PER_QUERY = 5
MAX_OFFICIAL_URLS_TO_SCRAPE = 8
MAX_CONTENT_CHARS_PER_SOURCE = 3000
MAX_EXCERPT_CHARS = 1000


def sanitize_scraped_text(raw_text: str) -> str:
    """Sanitize scraped web content to protect against prompt injection and strip noise."""
    if not raw_text:
        return ""
    # Strip HTML tags
    cleaned = re.sub(r"<(script|style|nav|footer|header|iframe|object)[^>]*>.*?</\1>", "", raw_text, flags=re.DOTALL | re.IGNORECASE)
    cleaned = re.sub(r"<[^>]+>", " ", cleaned)
    # Strip markdown images and links
    cleaned = re.sub(r"!\[.*?\]\(.*?\)", "", cleaned)
    cleaned = re.sub(r"\[(.*?)\]\(.*?\)", r"\1", cleaned)
    # Strip non-printable / control characters
    cleaned = "".join(ch for ch in cleaned if ch.isprintable() or ch in "\n\r\t ")
    # Collapse multiple whitespaces
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r"\n\s*\n+", "\n\n", cleaned)
    return cleaned.strip()[:MAX_CONTENT_CHARS_PER_SOURCE]


def strip_negations(text: str) -> str:
    """Strip negative clauses (e.g. 'no cement manufacturing', 'does not produce...')
    so negative exclusions are not falsely matched as positive business activities.
    """
    if not text:
        return ""
    pattern = r"\b(?:no|not|neither|nor|without|does\s+not|doesn't|do\s+not|don't|has\s+no|have\s+no|excluding|except\s+for|except)\s+[^.;\n]+"
    return re.sub(pattern, " ", text, flags=re.IGNORECASE)


def _make_source_ids(canonical_url: str) -> tuple[str, str]:
    """Generate deterministic source and evidence IDs from canonical URL."""
    digest = hashlib.sha256(canonical_url.encode("utf-8")).hexdigest()[:12].upper()
    return f"SRC-{digest}", f"EVD-{digest}"


class LiveRegulatoryDiscoveryProvider(RegulatoryDiscoveryProvider):
    """Authoritative live regulatory discovery provider backed by SerpApi / Crawlee and official-source policy."""

    def discover(self, context, query_plan=None, *, assessment=None):
        """Use the persisted acquisition path. A portal URL is not verified evidence."""
        from apps.ingestion.services import run_discovery
        business = Business.objects.get(pk=context.business_id)
        from domain.intelligence.regulatory_retrieval import retrieve_regulatory_context
        profile = assessment.profile_version if assessment else business.current_profile
        facts = profile.variables if profile else {}
        description = facts.get("product_description", {})
        description = description.get("value", "") if isinstance(description, dict) else description
        remote = retrieve_regulatory_context(description or business.name, facts)
        data = run_discovery(business, max_scrape=3, assessment=assessment,
                             profile_version=assessment.profile_version if assessment else None)
        run = DiscoveryRun.objects.filter(pk=data.get("run_id")).first()
        evidence_candidates = []
        if run:
            # Captured text remains usable even when claim extraction produces
            # nothing. A capture is contextual material, never verified evidence.
            from apps.ingestion.models import RetrievedDocument
            source_ids = [row.get("source_id") for row in run.scraped_urls if isinstance(row, dict)]
            for capture in RetrievedDocument.objects.filter(source__source_id__in=source_ids).select_related("source")[:8]:
                evidence_candidates.append({"source_id": capture.source.source_id,
                    "source_url": capture.source.canonical_url, "excerpt": capture.normalized_content[:3000],
                    "authority": capture.source.authority, "verification_status": "UNVERIFIED",
                    "retrieved_document_id": str(capture.id), "content_hash": capture.content_hash})
            for candidate in run.candidate_requirements.select_related("source", "evidence"):
                if candidate.evidence and candidate.source:
                    evidence_candidates.append({"evidence_id": candidate.evidence.evidence_id,
                        "source_id": candidate.source.source_id, "source_url": candidate.source.canonical_url,
                        "excerpt": candidate.evidence.excerpt, "authority": candidate.source.authority,
                        "verification_status": candidate.evidence.verification_status,
                        "jurisdiction": candidate.jurisdiction})
        # Remote chunks are real retrieved context, never local published rules.
        evidence_candidates.extend({**passage, "verification_status": "EXTERNAL_CONTEXT"}
                                   for passage in remote["passages"])
        remote_sources = {passage["source_id"] for passage in remote["passages"] if passage["source_id"]}
        return RegulatoryDiscoveryResult(status="COMPLETED" if remote["passages"] else data.get("status", "UNAVAILABLE"),
            sources_count=data.get("sources_scraped", 0) + len(remote_sources), candidate_count=len(evidence_candidates),
            queries=data.get("queries", []), evidence_candidates=evidence_candidates,
            metadata={"discovery_run_id": str(run.id) if run else None, "warnings": data.get("errors", []),
                "verified_count": 0, "fallback_used": False, "external_retrieval": remote}, errors=data.get("errors", []))

    def _generate_verified_catalog_evidence(self, context, business):
        """Registry entries are source plans, never captured statutory evidence."""
        return []
