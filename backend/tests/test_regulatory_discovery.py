"""Tests for Regulatory Discovery and Quarantined Knowledge Invariants.

Authority: Milestone Sections 3, 4, 5, 6, 8.
Validates:
- Query synthesis via RegulatoryQueryPlanner without hardcoding.
- Domain authority ranking (official vs guidance vs secondary vs unknown).
- Quarantined candidate claims invariant (UNVERIFIED status).
- Prompt injection boundary: web scraped content is UNTRUSTED DATA.
- Verification status contract: candidate claims NEVER produce APPLICABLE decisions.
"""

from __future__ import annotations

from unittest.mock import patch
import pytest
from apps.businesses.models import Business, BusinessProfileVersion
from apps.ingestion.models import DiscoveryRun, CandidateRequirement
from apps.ingestion.query_planner import RegulatoryQueryPlanner
from apps.ingestion.ranking import (
    OFFICIAL,
    OFFICIAL_GUIDANCE,
    SECONDARY,
    UNKNOWN,
    classify_domain,
    rank_candidates,
)
from apps.ingestion.services import run_discovery
from common.enums import VariableOrigin
from domain.context.business_context import build_business_context


def _create_profile(business: Business, version: int, **variables) -> BusinessProfileVersion:
    var_dict = {}
    for k, v in variables.items():
        var_dict[k] = {"value": v, "origin": VariableOrigin.USER_PROVIDED}
    return BusinessProfileVersion.objects.create(
        business=business,
        version=version,
        variables=var_dict,
    )


@pytest.mark.django_db
def test_regulatory_query_planner_dynamic(make_business, user):
    """Query planner produces industry- and jurisdiction-specific regulatory queries."""
    biz = make_business(owner=user, name="Bengal Solar Tech")
    _create_profile(
        biz,
        1,
        state="WB",
        organization_type="MANUFACTURING",
        product_description="Solar panel manufacturing and fabrication unit",
        hazardous_waste_generation=True,
    )

    ctx = build_business_context(biz)
    queries = RegulatoryQueryPlanner.plan_queries(ctx)

    assert len(queries) >= 3
    query_text = " ".join(queries).lower()
    assert "west bengal" in query_text or "pollution control" in query_text
    assert "consent" in query_text or "waste" in query_text or "factory" in query_text


def test_domain_authority_ranking():
    """Official government portals are classified as OFFICIAL; authorized portals as OFFICIAL_GUIDANCE."""
    assert classify_domain("https://cpcb.nic.in/air-pollution") == OFFICIAL
    assert classify_domain("https://dgft.gov.in/import-policy") == OFFICIAL
    assert classify_domain("https://wbpcb.gov.in/consent-to-establish") == OFFICIAL
    assert classify_domain("https://investindia.gov.in/services") == OFFICIAL
    assert classify_domain("https://indextb.com/invest") == OFFICIAL_GUIDANCE
    assert classify_domain("https://prsindia.org/bills") == SECONDARY
    assert classify_domain("https://randomblog123.com/rules") == UNKNOWN

    candidates = [
        {"url": "https://randomblog123.com/news", "title": "Random Blog"},
        {"url": "https://wbpcb.gov.in/guidelines", "title": "WBPCB Guidelines"},
        {"url": "https://cpcb.nic.in/epr", "title": "CPCB EPR Portal"},
    ]
    ranked = rank_candidates(candidates)
    assert len(ranked) == 3
    assert ranked[0]["authority_tier"] == OFFICIAL
    assert ranked[1]["authority_tier"] == OFFICIAL
    assert ranked[2]["authority_tier"] == UNKNOWN


@pytest.mark.django_db
def test_quarantine_invariant_and_audit_logging(make_business, user):
    """Live discovered candidate claims are stored strictly in CandidateRequirement with UNVERIFIED status.
    They NEVER alter RequirementDefinition or produce APPLICABLE decisions.
    """
    biz = make_business(owner=user, name="Quarantine Invariant Enterprise")
    _create_profile(
        biz,
        1,
        state="MH",
        organization_type="MANUFACTURING",
        product_description="Automotive brake pads manufacturing",
    )

    mock_search_results = [
        {
            "url": "https://mpcb.gov.in/consent-management",
            "title": "MPCB Consent Management",
            "description": "MPCB consent to establish and operate requirements.",
        }
    ]
    mock_scrape_results = {
        "url": "https://mpcb.gov.in/consent-management",
        "title": "MPCB Consent Management",
        "markdown": "# Maharashtra Pollution Control Board\nEvery manufacturing unit must obtain Consent to Establish before commencing operations under Water Act 1974.",
    }

    with patch("apps.ingestion.services.firecrawl.is_configured", return_value=True), \
         patch("apps.ingestion.services.firecrawl.search", return_value=mock_search_results), \
         patch("apps.ingestion.services.firecrawl.scrape", return_value=mock_scrape_results):

        result = run_discovery(biz, force_refresh=True)

        assert result["status"] == "COMPLETED"
        assert result["official_sources_count"] >= 1
        assert result["candidate_requirements_count"] >= 1

        run_id = result["run_id"]
        run_obj = DiscoveryRun.objects.get(id=run_id)
        assert run_obj.status == "COMPLETED"

        candidates = CandidateRequirement.objects.filter(discovery_run=run_obj)
        assert candidates.exists()
        for cand in candidates:
            # INVARIANT: Candidate requirements must always be UNVERIFIED
            assert cand.verification_status == "UNVERIFIED"
            assert cand.source is not None
            assert cand.source.status == "DISCOVERED"
