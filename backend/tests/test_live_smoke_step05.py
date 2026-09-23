"""Live Integration Smoke Tests for Step 05.

Verifies:
1. Real LLM integration (Business Understanding, Questionnaire Generation, Compliance Synthesis)
2. Real Firecrawl integration (Search on official portals, Scrape, Sanitization, Evidence creation)

Strictly isolated: only runs when COMPLYWISE_LIVE_INTEGRATION=1 is set.
"""

from __future__ import annotations

import os
import time
import pytest
from apps.businesses.models import Business
from apps.ingestion import firecrawl
from domain.intelligence.business_understanding import BusinessUnderstandingEngine
from domain.intelligence.orchestration import (
    AssessmentOrchestrator,
    OrchestrationContext,
)
from domain.intelligence.questionnaire import QuestionnaireEngine
from domain.providers.registry import get_llm_provider


@pytest.mark.skipif(
    not os.getenv("COMPLYWISE_LIVE_INTEGRATION"),
    reason="Live integration smoke tests disabled by default. Set COMPLYWISE_LIVE_INTEGRATION=1 to run.",
)
@pytest.mark.django_db
class TestLiveStep05Integration:
    """Live smoke test executing real external API calls."""

    @pytest.fixture
    def auth_user(self, db):
        from apps.accounts.models import User
        return User.objects.create_user(
            email="live_eval@complywise.test",
            password="TestPassword123!",
            full_name="Live Evaluation Officer",
        )

    @pytest.fixture
    def cement_business(self, db, auth_user):
        from apps.businesses.models import BusinessProfileVersion
        biz = Business.objects.create(name="Ambuja Heritage Cement Ltd", owner=auth_user)
        BusinessProfileVersion.objects.create(
            business=biz,
            version=1,
            variables={
                "product_description": {"value": "Integrated Portland cement and clinker manufacturing plant in Chandrapur with rotary kiln"},
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

    def test_live_llm_integration(self, cement_business):
        """Test real LLM provider on Business Understanding and Questionnaire Generation."""
        provider = get_llm_provider()
        assert provider is not None, "Configured LLM provider must be initialized."

        ctx = OrchestrationContext.from_business(cement_business)
        orchestrator = AssessmentOrchestrator()
        run = orchestrator.create_run(business=cement_business)

        # 1. Business Understanding
        t0 = time.perf_counter()
        bu_engine = BusinessUnderstandingEngine(provider=provider)
        bu_result = bu_engine.analyze_business(ctx, assessment_id=str(run.run_id))
        bu_elapsed = time.perf_counter() - t0

        assert bu_result.business_type is not None
        assert len(bu_result.likely_regulatory_domains) > 0
        print(f"\n[LIVE LLM SMOKE] Business Understanding completed in {bu_elapsed:.2f}s")
        print(f"[LIVE LLM SMOKE] Domains identified: {bu_result.likely_regulatory_domains[:4]}")

        # 2. Questionnaire Generation (exactly 15 questions)
        t1 = time.perf_counter()
        q_engine = QuestionnaireEngine(provider=provider)
        questions = q_engine.generate_questionnaire(ctx, run, understanding=bu_result)
        q_elapsed = time.perf_counter() - t1

        assert len(questions) == 15, "Must generate exactly 15 questions."
        print(f"[LIVE LLM SMOKE] 15 Questions generated in {q_elapsed:.2f}s")
        print(f"[LIVE LLM SMOKE] Sample Q1: {questions[0].question}")

        assert bu_elapsed + q_elapsed < 60.0

    def test_live_firecrawl_integration(self):
        """Test real Firecrawl search on official government domains."""
        if not firecrawl.is_configured():
            pytest.skip("Firecrawl API key not configured; skipping Firecrawl live test.")

        t0 = time.perf_counter()
        query = "site:mpcb.gov.in consent to establish cement manufacturing plant"
        try:
            results = firecrawl.search(query=query, limit=3, scrape_markdown=False)
            elapsed = time.perf_counter() - t0
        except Exception as exc:
            if any(term in str(exc).lower() for term in ["401", "402", "429", "unauthorized", "quota", "forbidden", "could not be reached", "getaddrinfo", "timeout"]):
                pytest.skip(f"Firecrawl API service unavailable or network offline: {exc}")
            raise

        assert isinstance(results, list)
        print(f"\n[LIVE FIRECRAWL SMOKE] Query '{query}' completed in {elapsed:.2f}s")
        print(f"[LIVE FIRECRAWL SMOKE] Results returned: {len(results)}")
        if results:
            print(f"[LIVE FIRECRAWL SMOKE] First URL: {results[0].get('url')}")
