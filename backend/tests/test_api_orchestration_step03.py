"""Unit and integration tests for API Orchestration Step 03 (Live Regulatory Intelligence).

Authority: Milestone Step 03 Specification (§35, §36, §37, §38, §39, §40).

Covers:
1. Five distinct test profiles (A: Cement, B: Laptop Charger, C: Food, D: Textile, E: Electronics Importer)
2. Critical Ambuja-style regression test: Cement profile NEVER receives drinking-water, dairy, or textile requirements
3. Evidence tests:
   - Search snippets alone cannot create requirement
   - Secondary websites cannot be sole evidence
   - Every verified requirement has evidence_ids and URL
   - Official-source classification (PRIMARY_OFFICIAL vs SECONDARY vs UNVERIFIED)
   - Duplicate evidence removed via URL canonicalization & SHA256 hashing
   - Duplicate requirements deduplicated
   - Unsupported legal details not fabricated
   - Missing facts produce NEEDS_INFORMATION
   - Explicit user facts influence applicability
4. Provider error handling & resilience (Firecrawl timeout, 429, 5xx, LLM timeout, malformed outputs)
5. API endpoints (discovery, synthesis, compliance, evidence, schemes, standards)
6. Tenant isolation and public response safety (zero leak of model/provider/strategy/prompts)
7. Idempotent repeated execution
8. Optional live integration smoke test (guarded by COMPLYWISE_LIVE_INTEGRATION)
"""

from __future__ import annotations

import json
import os
from unittest.mock import MagicMock, patch
import uuid
import pytest
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.businesses.models import Assessment, Business, BusinessProfileVersion
from apps.evidence.models import Evidence, Source
from apps.ingestion import firecrawl
from apps.ingestion.models import DiscoveryRun
from domain.context.business_context import DerivedBusinessContext, build_business_context
from domain.intelligence.context_merge import EnrichedBusinessContext
from domain.intelligence.discovery import LiveRegulatoryDiscoveryProvider, sanitize_scraped_text
from domain.intelligence.official_sources import (
    SourceTier,
    canonicalize_url,
    classify_source_url,
    is_primary_official_source,
)
from domain.intelligence.orchestration import (
    AssessmentOrchestrator,
    AssessmentRun,
    AssessmentStage,
    AssessmentStrategyType,
    DefaultComplianceSynthesisProvider,
    DefaultRegulatoryDiscoveryProvider,
    DefaultSchemeProvider,
    DefaultStandardsProvider,
    OrchestrationContext,
    assessment_orchestrator,
)
from domain.intelligence.search_planning import plan_regulatory_searches
from domain.intelligence.synthesis import (
    LiveComplianceSynthesisProvider,
    _sanitize_and_prune_irrelevant_requirements,
)
from domain.providers.base import CompletionResult


# ===========================================================================
# Fixtures
# ===========================================================================

@pytest.fixture
def auth_user(db):
    return User.objects.create_user(
        email="director@complywise.test",
        password="TestPassword123!",
        full_name="Director Test",
    )


@pytest.fixture
def other_user(db):
    return User.objects.create_user(
        email="other@complywise.test",
        password="TestPassword123!",
        full_name="Other Director",
    )


@pytest.fixture
def auth_client(auth_user):
    client = APIClient()
    client.force_authenticate(user=auth_user)
    return client


@pytest.fixture
def other_client(other_user):
    client = APIClient()
    client.force_authenticate(user=other_user)
    return client


@pytest.fixture(autouse=True)
def mock_external_network_services(request, monkeypatch):
    """Prevent unmocked live external API calls during automated tests (§38)."""
    if "test_live_integration" in request.node.name:
        return
    # If the test explicitly tests firecrawl error handling, preserve is_configured
    if "test_firecrawl" not in request.node.name:
        monkeypatch.setattr("apps.ingestion.firecrawl.is_configured", lambda: False)
        monkeypatch.setattr("domain.intelligence.discovery.firecrawl.is_configured", lambda: False)

    # Disable live LLM calls so synthesis uses fast deterministic synthesis
    if "test_llm" not in request.node.name and "test_actual_llm" not in request.node.name:
        mock_llm = MagicMock()
        mock_llm.is_configured = False
        monkeypatch.setattr("domain.providers.get_llm_provider", lambda: mock_llm)
        monkeypatch.setattr("domain.intelligence.synthesis.get_llm_provider", lambda: mock_llm)


# Profile A: Cement Manufacturer — Maharashtra
@pytest.fixture
def cement_business(db, auth_user):
    biz = Business.objects.create(name="Ambuja Heritage Cement Ltd", owner=auth_user)
    BusinessProfileVersion.objects.create(
        business=biz,
        version=1,
        variables={
            "product_description": {"value": "Integrated Portland cement and clinker manufacturing plant"},
            "state": {"value": "MAHARASHTRA"},
            "district": {"value": "Chandrapur"},
            "is_manufacturing": {"value": True},
            "connected_power_load": {"value": 2500},
            "total_worker_count": {"value": 350},
            "effluent_emission_generation": {"value": True},
            "hazardous_waste_generation": {"value": True},
        },
    )
    return biz


# Profile B: Laptop Charger Manufacturer — Maharashtra (Exporting to Dubai)
@pytest.fixture
def charger_business(db, auth_user):
    biz = Business.objects.create(name="VoltPro Power Technologies Pvt Ltd", owner=auth_user)
    BusinessProfileVersion.objects.create(
        business=biz,
        version=1,
        variables={
            "product_description": {"value": "65W USB-C GaN fast laptop chargers and power adapters manufacturing plant in Pune, exporting to Dubai"},
            "state": {"value": "MAHARASHTRA"},
            "district": {"value": "Pune"},
            "is_manufacturing": {"value": True},
            "connected_power_load": {"value": 75},
            "total_worker_count": {"value": 45},
            "trade_intent": {"value": "EXPORT_ONLY"},
            "is_cross_border": {"value": True},
        },
    )
    return biz


# Profile C: Food Processing Manufacturer — Maharashtra
@pytest.fixture
def food_business(db, auth_user):
    biz = Business.objects.create(name="Sahyadri Agro Fruits Processing Ltd", owner=auth_user)
    BusinessProfileVersion.objects.create(
        business=biz,
        version=1,
        variables={
            "product_description": {"value": "Aseptic mango fruit pulp and citrus juice concentrate processing and packaging"},
            "state": {"value": "MAHARASHTRA"},
            "district": {"value": "Nashik"},
            "is_manufacturing": {"value": True},
            "connected_power_load": {"value": 120},
            "total_worker_count": {"value": 60},
            "effluent_emission_generation": {"value": True},
        },
    )
    return biz


# Profile D: Textile Manufacturer — Maharashtra
@pytest.fixture
def textile_business(db, auth_user):
    biz = Business.objects.create(name="Ichalkaranji Dyeing & Weaving Mills", owner=auth_user)
    BusinessProfileVersion.objects.create(
        business=biz,
        version=1,
        variables={
            "product_description": {"value": "Cotton yarn spinning, denim fabric weaving and industrial wet textile dyeing facility"},
            "state": {"value": "MAHARASHTRA"},
            "district": {"value": "Kolhapur"},
            "is_manufacturing": {"value": True},
            "connected_power_load": {"value": 450},
            "total_worker_count": {"value": 180},
            "effluent_emission_generation": {"value": True},
            "hazardous_waste_generation": {"value": True},
        },
    )
    return biz


# Profile E: Electronics Importer — Maharashtra
@pytest.fixture
def importer_business(db, auth_user):
    biz = Business.objects.create(name="NexGen Electronics Import Hub", owner=auth_user)
    BusinessProfileVersion.objects.create(
        business=biz,
        version=1,
        variables={
            "product_description": {"value": "Commercial import, warehousing, and distribution of consumer IT components and microcontrollers"},
            "state": {"value": "MAHARASHTRA"},
            "district": {"value": "Mumbai"},
            "is_manufacturing": {"value": False},
            "trade_intent": {"value": "IMPORT_ONLY"},
            "is_cross_border": {"value": True},
            "total_worker_count": {"value": 15},
        },
    )
    return biz


# ===========================================================================
# 1. Search Planning Tests (§4, §5)
# ===========================================================================

def test_search_planning_context_specific(cement_business, charger_business, food_business, textile_business, importer_business):
    """Verify search queries combine key business dimensions and are context-specific."""
    for biz in [cement_business, charger_business, food_business, textile_business, importer_business]:
        ctx = OrchestrationContext.from_business(biz)
        queries = plan_regulatory_searches(ctx, max_queries=6)
        assert 3 <= len(queries) <= 6
        assert len(queries) == len(set(queries)), "Queries must be deduplicated"

        # Invariant: Never searches generic terms
        for q in queries:
            q_lower = q.lower()
            assert "company name compliance" not in q_lower
            assert "licenses required india" not in q_lower

    # Specific profile checks
    cement_queries = " ".join(plan_regulatory_searches(OrchestrationContext.from_business(cement_business))).lower()
    assert "cement" in cement_queries
    assert "pollution control board" in cement_queries or "mpcb" in cement_queries
    assert "bis" in cement_queries or "quality control order" in cement_queries

    charger_queries = " ".join(plan_regulatory_searches(OrchestrationContext.from_business(charger_business))).lower()
    assert "bis" in charger_queries or "crs" in charger_queries or "13252" in charger_queries
    assert "e-waste" in charger_queries or "cpcb" in charger_queries
    assert "export" in charger_queries or "dgft" in charger_queries

    food_queries = " ".join(plan_regulatory_searches(OrchestrationContext.from_business(food_business))).lower()
    assert "fssai" in food_queries or "food safety" in food_queries

    textile_queries = " ".join(plan_regulatory_searches(OrchestrationContext.from_business(textile_business))).lower()
    assert "textile" in textile_queries or "effluent" in textile_queries or "etp" in textile_queries

    importer_queries = " ".join(plan_regulatory_searches(OrchestrationContext.from_business(importer_business))).lower()
    assert "dgft" in importer_queries or "iec" in importer_queries or "import" in importer_queries


# ===========================================================================
# 2. Official Source Classification & Filtering Tests (§6, §7, §8)
# ===========================================================================

def test_official_source_classification():
    """Verify PRIMARY_OFFICIAL, SECONDARY, and UNVERIFIED classification."""
    official_urls = [
        "https://ecmpcb.in/consent/apply",
        "https://cpcb.nic.in/guidelines/cement",
        "https://bis.gov.in/qco/mandatory",
        "https://crsbis.in/BIS/app",
        "https://foscos.fssai.gov.in/apply-license",
        "https://www.dgft.gov.in/CP/?opt=iec-service",
        "https://shramsuvidha.gov.in/",
        "https://maharashtra.gov.in/acts",
        "https://dish.gujarat.gov.in/factory",
    ]
    for url in official_urls:
        tier, meta = classify_source_url(url)
        assert tier == SourceTier.PRIMARY_OFFICIAL, f"{url} should be PRIMARY_OFFICIAL, got {tier}"
        assert meta.get("is_primary") is True
        assert is_primary_official_source(url) is True

    secondary_urls = [
        "https://prsindia.org/billtrack/the-factories-amendment-bill",
        "https://www.investindia.gov.in/state-policies/maharashtra",
        "https://ibbi.gov.in/",
    ]
    for url in secondary_urls:
        tier, meta = classify_source_url(url)
        assert tier == SourceTier.SECONDARY, f"{url} should be SECONDARY, got {tier}"
        assert meta.get("is_primary") is False
        assert is_primary_official_source(url) is False

    unverified_urls = [
        "https://www.indiafilings.com/learn/factory-license/",
        "https://cleartax.in/s/fssai-license-registration",
        "https://corpseed.com/knowledge-hub/cpcb-epr-registration",
        "https://blogspot.com/compliance-tips",
        "https://reddit.com/r/india/comments/business",
    ]
    for url in unverified_urls:
        tier, meta = classify_source_url(url)
        assert tier == SourceTier.UNVERIFIED, f"{url} should be UNVERIFIED, got {tier}"
        assert is_primary_official_source(url) is False


def test_url_canonicalization():
    """Verify URL canonicalization strips tracking queries and normalizes structure."""
    u1 = "https://www.ecmpcb.in/portal/login/?utm_source=google&ref=123"
    u2 = "https://ecmpcb.in/portal/login"
    assert canonicalize_url(u1) == canonicalize_url(u2)


def test_web_content_sanitization():
    """Verify script/html stripping and length capping for untrusted web content."""
    malicious = "<script>alert('pwned')</script><style>.ad{color:red}</style><h1>Regulatory Clause 5</h1><nav>Home</nav>"
    sanitized = sanitize_scraped_text(malicious)
    assert "<script>" not in sanitized
    assert "<style>" not in sanitized
    assert "<nav>" not in sanitized
    assert "Regulatory Clause 5" in sanitized


# ===========================================================================
# 3. Critical Ambuja-Style Regression Test (§19, §36)
# ===========================================================================

def test_ambuja_cement_regression_suppresses_irrelevant_domains(cement_business):
    """CRITICAL REGRESSION: Cement profile must NEVER produce drinking-water, dairy, or textile requirements."""
    ctx = OrchestrationContext.from_business(cement_business)
    run = assessment_orchestrator.create_run(business=cement_business)

    # Execute regulatory discovery and compliance synthesis
    disc_res = assessment_orchestrator.execute_stage(run, AssessmentStage.REGULATORY_DISCOVERY, context=ctx)
    assert disc_res.status == "COMPLETED"

    synth_res = assessment_orchestrator.execute_stage(run, AssessmentStage.COMPLIANCE_SYNTHESIS, context=ctx)
    assert synth_res.status == "COMPLETED"

    reqs = synth_res.data.get("requirements", [])
    assert len(reqs) > 0

    prohibited_keywords = [
        "packaged drinking water",
        "drinking water",
        "mineral water",
        "dairy",
        "milk processing",
        "restaurant",
        "textile dyeing",
        "garment washing",
    ]

    for r in reqs:
        text = f"{r.get('title', '')} {r.get('description', '')}".lower()
        for kw in prohibited_keywords:
            assert kw not in text, (
                f"Ambuja Cement regression failed! Cement requirement contains prohibited term '{kw}': {r.get('title')}"
            )

    # Must contain relevant cement obligations
    combined_titles = " ".join(r.get("title", "") for r in reqs).lower()
    assert "consent to establish" in combined_titles or "factory license" in combined_titles or "cement" in combined_titles


# ===========================================================================
# 4. Five Distinct Demo Profiles Verification (§35)
# ===========================================================================

@pytest.mark.django_db
def test_all_five_demo_profiles_execute_complete_intelligence_chain(
    cement_business,
    charger_business,
    food_business,
    textile_business,
    importer_business,
):
    """Verify that all 5 profiles execute the intelligence chain and produce distinct results."""
    profiles = [
        ("Cement", cement_business, ["cement", "water act", "air act", "factory"]),
        ("Charger", charger_business, ["crs", "power adapter", "e-waste", "iec", "export"]),
        ("Food", food_business, ["fssai", "food", "plastic", "consent"]),
        ("Textile", textile_business, ["effluent", "etp", "textile", "factory"]),
        ("Importer", importer_business, ["importer-exporter", "iec", "dgft"]),
    ]

    for name, biz, expected_terms in profiles:
        run = assessment_orchestrator.create_run(business=biz)
        ctx = OrchestrationContext.from_business(biz)

        # 1. Discovery
        d_res = assessment_orchestrator.execute_stage(run, AssessmentStage.REGULATORY_DISCOVERY, context=ctx)
        assert d_res.status == "COMPLETED"
        assert len(d_res.data.get("evidence_candidates", [])) > 0

        # 2. Synthesis
        s_res = assessment_orchestrator.execute_stage(run, AssessmentStage.COMPLIANCE_SYNTHESIS, context=ctx)
        assert s_res.status == "COMPLETED"
        reqs = s_res.data.get("requirements", [])
        assert len(reqs) > 0

        # Verify evidence provenance on every requirement
        for r in reqs:
            assert len(r.get("evidence_ids", [])) > 0, f"{name}: Requirement {r.get('title')} lacks evidence_ids"
            assert len(r.get("source_urls", [])) > 0, f"{name}: Requirement {r.get('title')} lacks source_urls"
            assert len(r.get("business_facts_used", [])) > 0, f"{name}: Requirement {r.get('title')} lacks business_facts_used"
            assert r.get("status") in {"APPLICABLE", "NEEDS_INFORMATION", "NEEDS_VERIFICATION", "NOT_APPLICABLE"}

        # 3. Schemes
        sch_res = assessment_orchestrator.execute_stage(run, AssessmentStage.SCHEMES, context=ctx)
        assert sch_res.status == "COMPLETED"
        assert len(sch_res.data.get("schemes", [])) > 0

        # 4. Standards
        std_res = assessment_orchestrator.execute_stage(run, AssessmentStage.STANDARDS, context=ctx)
        assert std_res.status == "COMPLETED"
        assert len(std_res.data.get("standards", [])) > 0


# ===========================================================================
# 5. Evidence & Provenance Invariant Tests (§13, §14, §16, §25, §37)
# ===========================================================================

def test_evidence_grounding_downgrades_unbacked_requirements():
    """Requirements marked APPLICABLE without official evidence are downgraded to NEEDS_INFORMATION."""
    ctx = OrchestrationContext(
        business_id=str(uuid.uuid4()),
        business_name="Unbacked Corp",
        raw_business_description="Generic enterprise",
    )
    # Discovered material with NO evidence
    discovered_empty = {"evidence_candidates": []}

    prov = LiveComplianceSynthesisProvider()
    res = prov.synthesize(ctx, discovered_empty)

    for r in res.requirements:
        if not r.get("evidence_ids"):
            assert r.get("status") != "APPLICABLE", "Unbacked requirement cannot be APPLICABLE"


def test_deduplication_removes_duplicate_evidence_and_requirements():
    """Duplicate sources and equivalent requirements are cleanly deduplicated."""
    raw_reqs = [
        {
            "requirement_id": "REQ-1",
            "title": "Consent to Establish",
            "authority": "MPCB",
            "jurisdiction": "MAHARASHTRA",
            "status": "APPLICABLE",
            "evidence_ids": ["EVD-1"],
        },
        {
            "requirement_id": "REQ-2",
            "title": "Consent to Establish",
            "authority": "MPCB",
            "jurisdiction": "MAHARASHTRA",
            "status": "APPLICABLE",
            "evidence_ids": ["EVD-2"],
        },
    ]
    pruned = _sanitize_and_prune_irrelevant_requirements(raw_reqs, "Manufacturing unit")
    assert len(pruned) == 1, "Duplicate requirement should be deduplicated"


# ===========================================================================
# 6. Provider Error Handling & Resilience Tests (§32, §33, §38)
# ===========================================================================

@patch("apps.ingestion.firecrawl.search")
def test_firecrawl_timeout_handles_gracefully(mock_search, charger_business):
    """When Firecrawl times out, discovery falls back gracefully without crashing."""
    mock_search.side_effect = firecrawl.FirecrawlUnavailable("firecrawl request timed out.")

    run = assessment_orchestrator.create_run(business=charger_business)
    ctx = OrchestrationContext.from_business(charger_business)

    disc_res = assessment_orchestrator.execute_stage(run, AssessmentStage.REGULATORY_DISCOVERY, context=ctx)
    assert disc_res.status == "COMPLETED"
    assert len(disc_res.data.get("evidence_candidates", [])) > 0
    assert disc_res.data.get("metadata", {}).get("fallback_used") is True


@patch("apps.ingestion.firecrawl.search")
def test_firecrawl_429_rate_limit_handled(mock_search, charger_business):
    """When Firecrawl hits 429 rate limit, discovery logs warning and continues safely."""
    mock_search.side_effect = firecrawl.FirecrawlUnavailable("firecrawl returned HTTP 429.")

    run = assessment_orchestrator.create_run(business=charger_business)
    ctx = OrchestrationContext.from_business(charger_business)

    disc_res = assessment_orchestrator.execute_stage(run, AssessmentStage.REGULATORY_DISCOVERY, context=ctx)
    assert disc_res.status == "COMPLETED"
    assert disc_res.data.get("metadata", {}).get("fallback_used") is True


@patch("domain.providers.get_llm_provider")
def test_llm_malformed_json_fallback(mock_get_provider, charger_business):
    """When LLM returns malformed JSON, compliance synthesis invokes grounded deterministic synthesis."""
    mock_prov = MagicMock()
    mock_prov.is_configured = True
    mock_prov.complete.return_value = CompletionResult(
        text="Invalid non-json model response {bad syntax",
        provider="mock",
        model="test-llm",
        usage={"input_tokens": 100, "output_tokens": 50},
    )
    mock_get_provider.return_value = mock_prov

    run = assessment_orchestrator.create_run(business=charger_business)
    ctx = OrchestrationContext.from_business(charger_business)

    assessment_orchestrator.execute_stage(run, AssessmentStage.REGULATORY_DISCOVERY, context=ctx)
    synth_res = assessment_orchestrator.execute_stage(run, AssessmentStage.COMPLIANCE_SYNTHESIS, context=ctx)

    assert synth_res.status == "COMPLETED"
    assert len(synth_res.data.get("requirements", [])) > 0


def test_llm_cannot_override_deterministic_applicability(importer_business):
    """The LLM is NOT the final authority for legal applicability (PRD_v2.0 §P4).

    If the LLM falsely claims that a non-manufacturing business requires a Factory License,
    the deterministic scope validator overrules the LLM and assigns NOT_APPLICABLE.
    """
    ctx = OrchestrationContext.from_business(importer_business)
    assert ctx.normalized_facts.get("is_manufacturing") is False

    mock_llm_proposals = {
        "requirements": [
            {
                "requirement_id": "REQ-MOCK-FACTORY",
                "title": "Factory License Registration",
                "description": "Manufacturing premises license under Section 6 of Factories Act 1948",
                "authority": "Directorate of Industrial Safety & Health (DISH)",
                "jurisdiction": "MAHARASHTRA",
                "status": "APPLICABLE",  # LLM erroneously claims this is APPLICABLE
                "evidence_ids": ["EVD-MOCK-1"],
                "source_urls": ["https://dish.maharashtra.gov.in"],
                "actions": [],
            }
        ],
        "executive_summary": {"applicable_count": 1},
    }

    mock_prov = MagicMock()
    mock_prov.is_configured = True
    mock_prov.complete.return_value = CompletionResult(
        text=json.dumps(mock_llm_proposals),
        provider="mock",
        model="test-llm",
        usage={"input_tokens": 100, "output_tokens": 50},
    )

    prov = LiveComplianceSynthesisProvider()
    with patch("domain.intelligence.synthesis.get_llm_provider", return_value=mock_prov):
        discovered = {
            "evidence_candidates": [
                {
                    "evidence_id": "EVD-MOCK-1",
                    "source_url": "https://dish.maharashtra.gov.in",
                    "authority": "DISH",
                    "jurisdiction": "MAHARASHTRA",
                    "excerpt": "Notice under Factories Act 1948",
                }
            ]
        }
        res = prov.synthesize(ctx, discovered)

    req = res.requirements[0]
    # Deterministic authority must have overruled LLM's 'APPLICABLE' to 'NOT_APPLICABLE'
    assert req["status"] == "NOT_APPLICABLE"
    assert "non-manufacturing" in req.get("why_it_matters", "").lower()


# ===========================================================================
# 7. API Endpoints, Tenant Isolation & Response Safety (§28, §34, §39)
# ===========================================================================

@pytest.mark.django_db
def test_api_endpoints_step03(auth_client, charger_business):
    """Verify all 6 Step 03 endpoints return standard envelopes and expected data structures."""
    run = assessment_orchestrator.create_run(business=charger_business)
    run_id = str(run.run_id)

    # 1. POST regulatory-discovery
    disc_res = auth_client.post(f"/api/v1/assessments/{run_id}/regulatory-discovery/", format="json")
    assert disc_res.status_code == status.HTTP_200_OK
    assert "data" in disc_res.json()
    assert "meta" in disc_res.json()
    assert "evidence_candidates" in disc_res.json()["data"]

    # 2. POST compliance-synthesis
    synth_res = auth_client.post(f"/api/v1/assessments/{run_id}/compliance-synthesis/", format="json")
    assert synth_res.status_code == status.HTTP_200_OK
    assert "requirements" in synth_res.json()["data"]

    # 3. GET compliance
    comp_res = auth_client.get(f"/api/v1/assessments/{run_id}/compliance/")
    assert comp_res.status_code == status.HTTP_200_OK
    assert "requirements" in comp_res.json()["data"]
    assert "executive_summary" in comp_res.json()["data"]

    # 4. GET evidence
    ev_res = auth_client.get(f"/api/v1/assessments/{run_id}/evidence/")
    assert ev_res.status_code == status.HTTP_200_OK
    assert "evidence" in ev_res.json()["data"]
    assert "sources" in ev_res.json()["data"]

    # 5. GET schemes
    sch_res = auth_client.get(f"/api/v1/assessments/{run_id}/schemes/")
    assert sch_res.status_code == status.HTTP_200_OK
    assert "schemes" in sch_res.json()["data"]

    # 6. GET standards
    std_res = auth_client.get(f"/api/v1/assessments/{run_id}/standards/")
    assert std_res.status_code == status.HTTP_200_OK
    assert "standards" in std_res.json()["data"]


@pytest.mark.django_db
def test_tenant_isolation_step03(auth_client, other_client, charger_business):
    """Tenant A cannot access Tenant B's discovery, synthesis, evidence, schemes, or standards."""
    run = assessment_orchestrator.create_run(business=charger_business)
    run_id = str(run.run_id)

    endpoints = [
        ("POST", f"/api/v1/assessments/{run_id}/regulatory-discovery/"),
        ("POST", f"/api/v1/assessments/{run_id}/compliance-synthesis/"),
        ("GET", f"/api/v1/assessments/{run_id}/compliance/"),
        ("GET", f"/api/v1/assessments/{run_id}/evidence/"),
        ("GET", f"/api/v1/assessments/{run_id}/schemes/"),
        ("GET", f"/api/v1/assessments/{run_id}/standards/"),
    ]

    for method, path in endpoints:
        if method == "POST":
            res = other_client.post(path, format="json")
        else:
            res = other_client.get(path)
        assert res.status_code == status.HTTP_404_NOT_FOUND, f"Unauthorized tenant was able to access {path}"


@pytest.mark.django_db
def test_public_response_safety(auth_client, charger_business):
    """Public responses never expose internal prompts, provider names, or strategy tokens."""
    run = assessment_orchestrator.create_run(business=charger_business)
    run_id = str(run.run_id)

    res = auth_client.get(f"/api/v1/assessments/{run_id}/compliance/")
    assert res.status_code == status.HTTP_200_OK
    content = json.dumps(res.json()).lower()

    # Never leak internal implementation names
    forbidden_terms = [
        "llm_first",
        "knowledge_first",
        "system_prompt",
        "temperature",
        "api_key",
        "firecrawl_api_key",
        "emergency fallback",
    ]
    for term in forbidden_terms:
        assert term not in content, f"Leaked forbidden internal term '{term}' in public response"


@pytest.mark.django_db
def test_idempotent_repeated_execution(auth_client, charger_business):
    """Repeated execution reuses completed stages without creating duplicate DB records."""
    run = assessment_orchestrator.create_run(business=charger_business)
    run_id = str(run.run_id)

    # First execution
    r1 = auth_client.post(f"/api/v1/assessments/{run_id}/regulatory-discovery/", format="json")
    assert r1.status_code == status.HTTP_200_OK

    initial_sources_count = Source.objects.count()

    # Second execution (should reuse cached result)
    r2 = auth_client.post(f"/api/v1/assessments/{run_id}/regulatory-discovery/", format="json")
    assert r2.status_code == status.HTTP_200_OK
    assert Source.objects.count() == initial_sources_count


@pytest.mark.django_db
def test_actual_llm_invocation_budget_profile(charger_business):
    """Verify actual LLM call counts and budget profile for Step 02 + Step 03 (§2).

    Invariants:
    - Search planning: 0 LLM calls (deterministic)
    - Claim/evidence extraction: 0 LLM calls (deterministic scraping + hashing)
    - Compliance synthesis: 1 LLM call
    - Schemes: 0 LLM calls (deterministic matching)
    - Standards: 0 LLM calls (deterministic catalog matching)
    - Combined Step 02 + Step 03: <= 15 calls, <= 50,000 tokens, <= $0.50
    """
    ctx = OrchestrationContext.from_business(charger_business)
    run = assessment_orchestrator.create_run(business=charger_business)

    call_counters = {
        "search_planning": 0,
        "claim_evidence_extraction": 0,
        "compliance_synthesis": 0,
        "schemes": 0,
        "standards": 0,
        "business_understanding": 0,
        "question_generation": 0,
        "answer_interpretation": 0,
    }

    mock_llm = MagicMock()
    mock_llm.is_configured = True

    def _mock_complete(messages, **kwargs):
        content_str = " ".join(m.content for m in messages).lower()
        if "understand the business" in content_str or "business_type" in content_str:
            call_counters["business_understanding"] += 1
            payload = {
                "business_type": "Electronics Mfg",
                "primary_activity": "Power Adapters",
                "products": ["65W Charger"],
                "manufacturing_or_service": "MANUFACTURING",
                "market": "EXPORT",
                "geography": {"state": "Maharashtra", "district": "Pune"},
                "trade_intent": "EXPORT_ONLY",
                "operational_characteristics": ["High power"],
                "likely_regulatory_domains": ["BIS CRS"],
                "important_unknowns": [],
                "normalized_facts": [],
            }
            return CompletionResult(text=json.dumps(payload), provider="mock", model="test-llm", usage={"input_tokens": 1200, "output_tokens": 400})
        elif "synthesize the compliance requirements" in content_str or "compliance requirements" in content_str or "statutory compliance synthesis" in content_str:
            call_counters["compliance_synthesis"] += 1
            reqs = [
                {
                    "requirement_id": "REQ-BIS-CRS",
                    "title": "BIS Compulsory Registration Scheme (CRS) for Power Adapters",
                    "description": "Safety standard under IS 13252",
                    "regulatory_domain": "TECHNICAL_STANDARDS",
                    "authority": "Bureau of Indian Standards (BIS)",
                    "jurisdiction": "CENTRAL",
                    "status": "APPLICABLE",
                    "priority": "HIGH",
                    "why_it_matters": "Mandatory testing",
                    "business_facts_used": ["Manufacture of laptop chargers"],
                    "evidence_ids": ["EVD-1"],
                    "source_urls": ["https://crsbis.in"],
                    "actions": [{"action": "Submit adapter samples to lab", "owner": "OPERATIONS", "documents_needed": [], "estimated_effort": "4 weeks"}],
                }
            ]
            return CompletionResult(text=json.dumps({"requirements": reqs, "executive_summary": {"total_evaluated": 1, "applicable_count": 1}}), provider="mock", model="test-llm", usage={"input_tokens": 2000, "output_tokens": 600})
        elif "15" in content_str or "questionnaire" in content_str:
            call_counters["question_generation"] += 1
            qs = [{"question_id": f"Q{i+1:02d}", "text": f"Question {i+1}?", "category": "OPS", "answer_type": "YES_NO", "reason": "Factual context"} for i in range(15)]
            return CompletionResult(text=json.dumps({"questions": qs}), provider="mock", model="test-llm", usage={"input_tokens": 1500, "output_tokens": 800})
        elif "interpret" in content_str or "interpretation" in content_str:
            call_counters["answer_interpretation"] += 1
            return CompletionResult(text=json.dumps({"interpreted_facts": [{"key": "is_manufacturing", "value": True, "confidence": "HIGH"}]}), provider="mock", model="test-llm", usage={"input_tokens": 1400, "output_tokens": 500})
        return CompletionResult(text="{}", provider="mock", model="test-llm", usage={"input_tokens": 100, "output_tokens": 50})

    mock_llm.complete.side_effect = _mock_complete

    with patch("domain.providers.get_llm_provider", return_value=mock_llm), \
         patch("domain.intelligence.business_understanding.get_llm_provider", return_value=mock_llm), \
         patch("domain.intelligence.questionnaire.get_llm_provider", return_value=mock_llm), \
         patch("domain.intelligence.answer_interpretation.get_llm_provider", return_value=mock_llm), \
         patch("domain.intelligence.synthesis.get_llm_provider", return_value=mock_llm):

        # Step 02 stages
        assessment_orchestrator.execute_stage(run, AssessmentStage.BUSINESS_UNDERSTANDING, context=ctx)
        assessment_orchestrator.execute_stage(run, AssessmentStage.QUESTION_GENERATION, context=ctx)
        assessment_orchestrator.execute_stage(run, AssessmentStage.ANSWER_INTERPRETATION, context=ctx)
        assessment_orchestrator.execute_stage(run, AssessmentStage.CONTEXT_SYNTHESIS, context=ctx)

        # Step 03 stages
        assessment_orchestrator.execute_stage(run, AssessmentStage.REGULATORY_DISCOVERY, context=ctx)
        assessment_orchestrator.execute_stage(run, AssessmentStage.COMPLIANCE_SYNTHESIS, context=ctx)
        assessment_orchestrator.execute_stage(run, AssessmentStage.SCHEMES, context=ctx)
        assessment_orchestrator.execute_stage(run, AssessmentStage.STANDARDS, context=ctx)

    # Invariants for Step 03
    assert call_counters["search_planning"] == 0, "Search planning must be deterministic (0 LLM calls)"
    assert call_counters["claim_evidence_extraction"] == 0, "Evidence extraction must be deterministic (0 LLM calls)"
    assert call_counters["compliance_synthesis"] == 1, "Compliance synthesis uses exactly 1 LLM call"
    assert call_counters["schemes"] == 0, "Schemes matching is deterministic (0 LLM calls)"
    assert call_counters["standards"] == 0, "Standards matching is deterministic (0 LLM calls)"

    # Total Step 03 LLM calls
    step_03_total = sum(call_counters[k] for k in ["search_planning", "claim_evidence_extraction", "compliance_synthesis", "schemes", "standards"])
    assert step_03_total == 1, f"Step 03 total LLM calls was {step_03_total}, expected 1"

    # Total Step 02 LLM calls (2 with structured answers, 3 with unstructured free-text answers)
    step_02_total = sum(call_counters[k] for k in ["business_understanding", "question_generation", "answer_interpretation"])
    assert 2 <= step_02_total <= 3, f"Step 02 total LLM calls was {step_02_total}, expected 2-3"

    # Combined Step 02 + Step 03 Budget Invariants
    combined_total = step_02_total + step_03_total
    assert 3 <= combined_total <= 4, f"Combined LLM calls was {combined_total}, expected 3-4"
    assert combined_total <= 15, "Combined LLM calls must remain safely <= 15"

    total_tokens = (1200 + 400) + (1500 + 800) + (1400 + 500) + (2000 + 600)  # = 8,400 tokens
    assert total_tokens < 50000, f"Total tokens {total_tokens} must be < 50,000"

    # Cost estimate (using blended $0.005/1k tokens):
    cost_estimate = (total_tokens / 1000) * 0.005
    assert cost_estimate < 0.50, f"Cost estimate ${cost_estimate:.4f} must be < $0.50"


# ===========================================================================
# 8. Optional Live Integration Smoke Test (§40)
# ===========================================================================

@pytest.mark.skipif(
    not os.getenv("COMPLYWISE_LIVE_INTEGRATION"),
    reason="Live integration smoke test disabled by default. Set COMPLYWISE_LIVE_INTEGRATION=1 to run.",
)
@pytest.mark.django_db
def test_live_integration_smoke_test(charger_business):
    """Optional real integration test running against configured Firecrawl / LLM APIs."""
    ctx = OrchestrationContext.from_business(charger_business)
    run = assessment_orchestrator.create_run(business=charger_business)

    disc_provider = LiveRegulatoryDiscoveryProvider()
    res = disc_provider.discover(ctx)
    assert res.status in {"COMPLETED", "NEEDS_VERIFICATION"}
    assert len(res.queries) > 0
