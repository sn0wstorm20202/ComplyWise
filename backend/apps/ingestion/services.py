"""Dynamic regulatory discovery orchestration.

Authority: Milestone Task — Parts C, D, E, F, H, I, J; PRD_v2.0 §27A; TRD_v2.0 §11A.

Pipeline contract:

    Business profile
      → DerivedBusinessContext
      → coverage assessment over LOCAL verified knowledge
      → RegulatoryQueryPlanner generates dynamic, multidimensional queries
      → SerpApi search & Crawlee acquisition
      → Domain authority ranking (Official vs Guidance vs Secondary vs Unknown)
      → Stored as DISCOVERED sources + UNVERIFIED evidence
      → Regulatory claim extraction (with prompt injection safety boundary)
      → CandidateRequirement records created in quarantined UNVERIFIED state
      → NOTHING discovered ever reaches a compliance decision directly:
        APPLICABLE requires PUBLISHED rules plus VERIFIED evidence from ACTIVE sources.
"""

from __future__ import annotations

import datetime
import hashlib
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Any
from urllib.parse import urlparse

from django.conf import settings
from django.utils import timezone

from common.enums import KnowledgeStatus, SourceStatus, VerificationStatus
from domain.context.business_context import DerivedBusinessContext, build_business_context
from domain.jurisdictions.resolver import JurisdictionRegistry, normalize_jurisdiction
from domain.providers.base import ProviderError, ProviderNotConfigured
from apps.businesses.models import Business
from apps.evidence.models import Evidence, Source
from apps.knowledge.models import RequirementDefinition

from . import search_provider
from .claim_extraction import extract_claims_from_text
from .models import CandidateRequirement, DiscoveryRun, RetrievedDocument
from .query_planner import RegulatoryQueryPlanner
from .ranking import OFFICIAL, OFFICIAL_GUIDANCE, rank_candidates

logger = logging.getLogger(__name__)

COVERED = "COVERED"
LIMITED = "LIMITED"
GAP = "GAP"

MAX_EXCERPT_CHARS = 1200


def acquire_source(url):
    from domain.acquisition import get_web_acquisition_provider
    return get_web_acquisition_provider().fetch_page(url, {"use_browser": False})


def assess_knowledge_coverage(business: Business, *, profile_version=None) -> dict[str, Any]:
    """How well the published knowledge base covers this business's context."""
    context = build_business_context(business, profile_version=profile_version)
    canonical_state = context.state

    published = RequirementDefinition.objects.filter(status=KnowledgeStatus.PUBLISHED)
    total_published = published.count()
    central_count = published.filter(jurisdiction="CENTRAL").count()
    state_count = (
        published.filter(jurisdiction=canonical_state).count() if canonical_state else 0
    )

    activity_terms = context.detected_activities

    if not canonical_state:
        status = GAP
        message = (
            "The business jurisdiction is unknown, so state-level coverage cannot "
            "be assessed. Set the registered state to assess coverage."
        )
    elif state_count == 0 and central_count == 0:
        status = GAP
        message = "No published regulatory knowledge is loaded for this business."
    elif state_count == 0:
        status = LIMITED
        message = (
            f"Only central (All-India) knowledge exists for {context.state_name}. "
            "State-level obligations may exist that are not yet covered."
        )
    elif not activity_terms:
        status = LIMITED
        message = (
            "State-level knowledge exists, but no published rule recognises this "
            "product or activity yet. Results shown are limited to what is loaded."
        )
    else:
        status = COVERED
        message = (
            f"Published knowledge covers {context.state_name} and recognised "
            f"activity areas ({', '.join(activity_terms[:3])})."
        )

    return {
        "status": status,
        "message": message,
        "jurisdiction_resolved": bool(canonical_state),
        "state_code": canonical_state,
        "state_name": context.state_name,
        "published_requirements_total": total_published,
        "central_requirement_count": central_count,
        "state_requirement_count": state_count,
        "activity_terms_matched": activity_terms,
        "discovery_available": search_provider.is_configured(),
    }


def _source_ids_for(url: str) -> tuple[str, str]:
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:12].upper()
    return f"DISC-{digest}", f"DEVD-{digest}"


def _store_discovered_source(
    *,
    url: str,
    title: str,
    text: str,
    query: str,
    authority_tier: str,
    provider: str = "crawlee",
    capture_metadata: dict | None = None,
) -> tuple[Source, Evidence]:
    """Persist one captured page as a DISCOVERED source + UNVERIFIED evidence."""
    source_id, evidence_id = _source_ids_for(url)
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    source_id += "-" + digest[:12].upper()
    evidence_id += "-" + digest[:12].upper()
    host = (urlparse(url).hostname or "").lower()

    source, _ = Source.objects.get_or_create(
        source_id=source_id,
        defaults={
            "authority": host,
            "title": (title or url)[:300],
            "source_type": "OFFICIAL_PORTAL" if authority_tier in {OFFICIAL, OFFICIAL_GUIDANCE} else "REGULATORY_DOC",
            "canonical_url": url,
            "status": SourceStatus.DISCOVERED,
            "content_hash": hashlib.sha256(text.encode("utf-8")).hexdigest(),
            "metadata": {
                "discovered_by": provider,
                "discovery_query": query,
                "authority_tier": authority_tier,
                "retrieved_at": timezone.now().isoformat(),
            },
        },
    )

    captured, _ = RetrievedDocument.objects.get_or_create(source=source, content_hash=digest,
        defaults={"normalized_content": text, "metadata": {"source_url": url, "query": query,
            "provider": provider, "authority_tier": authority_tier, "capture": capture_metadata or {}}})
    evidence, _ = Evidence.objects.get_or_create(
        evidence_id=evidence_id,
        defaults={
            "source": source,
            "locator": "Web Document",
            "excerpt": (text[:MAX_EXCERPT_CHARS] or "(no text content captured)").strip(),
            "structured_fact": {
                "retrieved_document_id": str(captured.id),
                "discovery_query": query,
                "captured_at": timezone.now().isoformat(),
                "authority_tier": authority_tier,
            },
            "verification_status": VerificationStatus.UNVERIFIED,
        },
    )
    return source, evidence


def run_discovery(
    business: Business,
    *,
    force_refresh: bool = False,
    max_scrape: int = 3,
    profile_version=None,
    assessment=None,
) -> dict[str, Any]:
    """Execute one bounded regulatory discovery run for an unseen business.

    Saves audit trail in DiscoveryRun and candidate claims in CandidateRequirement.
    All discoveries are quarantined as DISCOVERED/UNVERIFIED.
    """
    profile = profile_version if profile_version is not None else business.current_profile
    profile_id = str(profile.id) if profile else None
    coverage = assess_knowledge_coverage(business, profile_version=profile)
    context = build_business_context(business, profile_version=profile)

    # Reuse recent completed discovery run if exists and not forced
    if not force_refresh:
        recent_cutoff = timezone.now() - timezone.timedelta(hours=1)
        existing_run = DiscoveryRun.objects.filter(
            business=business,
            status="COMPLETED",
            created_at__gte=recent_cutoff,
            summary__profile_version_id=profile_id,
        ).first()
        if existing_run:
            candidates = list(existing_run.candidate_requirements.all()[:10])
            return {
                "ran": True,
                "run_id": str(existing_run.id),
                "cached": True,
                "status": "COMPLETED",
                "discovery_available": search_provider.is_configured(),
                "reason": "Reused recent discovery assessment run.",
                "coverage": coverage,
                "queries": existing_run.queries,
                "candidate_urls_count": existing_run.candidate_count,
                "sources_scraped": existing_run.scraped_count,
                "official_sources_count": existing_run.official_source_count,
                "verified_count": 0,
                "candidate_requirements_count": len(candidates),
                "candidate_requirements": [
                    {
                        "id": str(cr.id),
                        "name": cr.requirement_name,
                        "authority": cr.authority,
                        "category": cr.category,
                        "applicability_statement": cr.applicability_statement,
                        "status": cr.verification_status,
                    }
                    for cr in candidates
                ],
                "errors": [existing_run.error] if existing_run.error else [],
                "note": (
                    "Captured material is quarantined as DISCOVERED/UNVERIFIED and does "
                    "not alter applicability decisions until verified by a regulatory expert."
                ),
            }

    # Handle unconfigured SerpApi
    if not search_provider.is_configured():
        run = DiscoveryRun.objects.create(
            business=business,
            status="UNAVAILABLE",
            error="SERPAPI_API_KEY / SERP_API is not configured.",
            summary={"reason": "Knowledge-only mode"},
            completed_at=timezone.now(),
        )
        return {
            "ran": False,
            "run_id": str(run.id),
            "cached": False,
            "status": "UNAVAILABLE",
            "discovery_available": False,
            "reason": (
                "SERPAPI_API_KEY / SERP_API is not configured. Running in verified knowledge-only "
                "mode: applicability decisions continue using loaded published knowledge."
            ),
            "coverage": coverage,
            "queries": [],
            "candidate_urls_count": 0,
            "sources_scraped": 0,
            "official_sources_count": 0,
            "verified_count": 0,
            "candidate_requirements_count": 0,
            "candidate_requirements": [],
            "errors": ["SERPAPI_API_KEY / SERP_API is not configured."],
            "note": "Deterministic applicability engine remains fully operational with local knowledge.",
        }

    # Extract discovery intent from active/latest question plan if present
    discovery_intent = None
    plans = business.question_plans.filter(status__in=["ACTIVE", "COMPLETED"])
    if assessment:
        plans = plans.filter(assessment=assessment)
    latest_plan = plans.order_by("-created_at").first()
    if latest_plan and latest_plan.regulatory_search_intent:
        discovery_intent = latest_plan.regulatory_search_intent

    # Generate dynamic queries from business context and discovery intent
    queries = RegulatoryQueryPlanner.plan_queries(context, discovery_intent=discovery_intent)
    if not queries:
        run = DiscoveryRun.objects.create(
            business=business,
            status="PARTIAL",
            error="Insufficient business context to form queries.",
            completed_at=timezone.now(),
        )
        return {
            "ran": False,
            "run_id": str(run.id),
            "status": "PARTIAL",
            "discovery_available": True,
            "reason": "Complete the business profile and product description to generate discovery queries.",
            "coverage": coverage,
            "queries": [],
            "candidate_urls_count": 0,
            "sources_scraped": 0,
            "official_sources_count": 0,
            "verified_count": 0,
            "candidate_requirements_count": 0,
            "candidate_requirements": [],
            "errors": [],
        }

    # Phase 8: Check for a recent completed discovery run within 24 hours
    recent_cutoff = timezone.now() - datetime.timedelta(hours=24)
    existing_run = DiscoveryRun.objects.filter(
        business=business,
        status="COMPLETED",
        created_at__gte=recent_cutoff,
    ).order_by("-created_at").first()

    if not force_refresh and existing_run and existing_run.scraped_count and existing_run.summary.get("profile_version_id") == profile_id:
        logger.info("Discovery cache hit: reusing completed run %s for business %s", existing_run.id, business.name)
        return {
            "ran": True,
            "run_id": str(existing_run.id),
            "queries": existing_run.queries,
            "candidate_urls_count": existing_run.candidate_count,
            "sources_scraped": existing_run.scraped_count,
            "official_sources_count": existing_run.official_source_count,
            "verified_count": 0,
            "candidate_requirements_count": existing_run.candidate_requirements.count(),
            "candidate_requirements": [
                {
                    "id": str(cr.id),
                    "requirement_name": cr.requirement_name,
                    "category": cr.category,
                    "authority": cr.authority,
                    "jurisdiction": cr.jurisdiction,
                    "applicability_statement": cr.applicability_statement,
                    "prerequisite": cr.prerequisite,
                    "fee_info": cr.fee_info,
                    "deadline_info": cr.deadline_info,
                    "validity_info": cr.validity_info,
                }
                for cr in existing_run.candidate_requirements.all()
            ],
            "errors": [],
            "cached": True,
        }

    run = DiscoveryRun.objects.create(
        business=business,
        assessment=assessment,
        provider="serpapi",
        status="RUNNING",
        queries=queries,
    )

    all_raw_candidates: list[dict[str, Any]] = []
    errors: list[str] = []

    # Queries are independent network reads. Keep all database writes on the
    # request thread, and collect results in query order for stable ranking.
    with ThreadPoolExecutor(max_workers=min(3, len(queries))) as executor:
        futures = [executor.submit(search_provider.search, query, limit=5) for query in queries]
        for query, future in zip(queries, futures):
            try:
                results = future.result()
                for r in results:
                    all_raw_candidates.append({**r, "query": query})
            except Exception as exc:
                errors.append(f"Query '{query[:30]}...' failed: {exc}")

    # Rank and filter candidate URLs
    ranked = rank_candidates(all_raw_candidates)
    run.candidate_urls = [
        {
            "url": c["url"],
            "title": c.get("title", ""),
            "authority_tier": c.get("authority_tier", "UNKNOWN"),
            "rank_score": c.get("rank_score", 0),
            "query": c.get("query", ""),
        }
        for c in ranked[:20]
    ]
    run.candidate_count = len(ranked)
    official_candidates = [c for c in ranked if c.get("is_official")]
    run.official_source_count = len(official_candidates)

    # Scrape & extract claims from top candidates (up to max_scrape)
    candidates_to_scrape = official_candidates[:max_scrape]
    scraped_records: list[dict[str, Any]] = []
    candidate_requirements_created: list[CandidateRequirement] = []

    for item in candidates_to_scrape:
        url = item["url"]
        from domain.intelligence.official_sources import is_primary_official_source
        try:
            acquired = acquire_source(url)
        except Exception as exc:
            errors.append(f"Acquisition failed ({type(exc).__name__}).")
            continue
        if acquired.errors or not 200 <= acquired.http_status < 300 or not is_primary_official_source(acquired.resolved_url):
            errors.append("Source capture rejected: " + "; ".join(acquired.errors or ["invalid status or official domain"]))
            continue
        markdown = acquired.markdown_content or acquired.text_content
        title = acquired.title or item.get("title", "")
        url = acquired.resolved_url
        acquisition_provider = acquired.acquisition_engine
        if len(markdown.strip()) < 80:
            errors.append("Source capture contained too little useful text.")
            continue

        # Store discovered source & evidence
        source, evidence = _store_discovered_source(
            url=url,
            title=title,
            text=markdown,
            query=item.get("query", ""),
            authority_tier=item.get("authority_tier", "UNKNOWN"),
            provider=acquisition_provider,
            capture_metadata=acquired.crawl_metadata,
        )
        scraped_records.append({
            "url": url,
            "title": title,
            "source_id": source.source_id,
            "evidence_id": evidence.evidence_id,
            "content_length": len(markdown),
            "acquisition_mode": acquired.acquisition_engine,
            "capture_metadata": acquired.crawl_metadata,
        })

        # Extract claims with prompt-injection boundary
        claims = extract_claims_from_text(
            text=markdown,
            url=url,
            context=context,
        )

        for claim in claims:
            claim_id = hashlib.sha256((source.source_id + claim["requirement_name"] + claim["excerpt"]).encode()).hexdigest()[:32].upper()
            claim_evidence, _ = Evidence.objects.get_or_create(evidence_id="CLAIM-" + claim_id,
                defaults={"source": source, "excerpt": claim["excerpt"], "locator": "Captured source passage",
                          "structured_fact": evidence.structured_fact, "verification_status": VerificationStatus.UNVERIFIED})
            cr = CandidateRequirement.objects.create(
                discovery_run=run,
                business=business,
                requirement_name=claim["requirement_name"],
                category=claim.get("category", "GENERAL"),
                authority=claim.get("authority", source.authority),
                jurisdiction=claim.get("jurisdiction", context.state or "CENTRAL"),
                applicability_statement=claim.get("applicability_statement", ""),
                prerequisite=claim.get("prerequisite", ""),
                document_requirements=claim.get("document_requirements", []),
                fee_info=claim.get("fee_info", ""),
                deadline_info=claim.get("deadline_info", ""),
                validity_info=claim.get("validity_info", ""),
                source=source,
                evidence=claim_evidence,
                verification_status=VerificationStatus.UNVERIFIED,
            )
            candidate_requirements_created.append(cr)

    # Finalize DiscoveryRun
    run.scraped_urls = scraped_records
    run.scraped_count = len(scraped_records)
    run.verified_count = 0  # Crucial invariant: remains 0 until manual governance
    run.status = "PARTIAL" if errors and scraped_records else "FAILED" if errors else "COMPLETED"
    run.error = "; ".join(errors[:3])
    run.completed_at = timezone.now()
    run.summary = {
        "queries_count": len(queries),
        "search_provider": search_provider.PROVIDER_NAME,
        "search_latency_ms": [r.get("search_latency_ms") for r in all_raw_candidates if r.get("search_latency_ms") is not None],
        "candidates_found": len(ranked),
        "official_sources": len(official_candidates),
        "sources_scraped": len(scraped_records),
        "profile_version_id": profile_id,
        "claims_extracted": len(candidate_requirements_created),
    }
    run.save()

    if not scraped_records and errors and existing_run and existing_run.scraped_count and existing_run.summary.get("profile_version_id") == profile_id:
        # Keep the failed attempt for diagnostics, but return real previously
        # captured material for this exact snapshot instead of a discovery dead end.
        return {"ran": True, "run_id": str(existing_run.id), "cached": True,
                "recovered_from_persisted": True, "failed_run_id": str(run.id),
                "status": existing_run.status, "discovery_available": True,
                "queries": existing_run.queries, "sources_scraped": existing_run.scraped_count,
                "candidate_urls_count": existing_run.candidate_count, "errors": errors, "coverage": coverage}

    return {
        "ran": True,
        "run_id": str(run.id),
        "cached": False,
        "status": run.status,
        "discovery_available": True,
        "reason": None,
        "coverage": coverage,
        "queries": queries,
        "candidate_urls_count": len(ranked),
        "sources_scraped": len(scraped_records),
        "official_sources_count": len(official_candidates),
        "verified_count": 0,
        "candidate_requirements_count": len(candidate_requirements_created),
        "candidate_requirements": [
            {
                "id": str(cr.id),
                "name": cr.requirement_name,
                "authority": cr.authority,
                "category": cr.category,
                "applicability_statement": cr.applicability_statement,
                "status": cr.verification_status,
            }
            for cr in candidate_requirements_created[:10]
        ],
        "errors": errors,
        "note": (
            "Captured material is stored as DISCOVERED/UNVERIFIED and does not "
            "affect applicability decisions until reviewed and published."
        ),
    }
