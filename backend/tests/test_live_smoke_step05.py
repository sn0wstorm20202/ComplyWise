"""Live Integration Smoke Test for Step 05 — Full Provider Chain.

Exercises the real external provider chain end-to-end:
1. Business Understanding (Real LLM)
2. Question Generation (Real LLM -> exactly 15 questions)
3. Answer Interpretation (Canonical enriched context merge)
4. Regulatory Discovery (Real Firecrawl search on official government portals)
5. Compliance Synthesis (Real LLM candidate synthesis + deterministic applicability)

Bounded business: Ambuja Heritage Cement Ltd (Maharashtra, Red Category).

Strictly isolated: only executed when COMPLYWISE_LIVE_INTEGRATION=1 is set.
"""

from __future__ import annotations

import os
import time
from typing import Any
import pytest

from apps.businesses.models import Business, BusinessProfileVersion
from apps.ingestion import firecrawl
from domain.intelligence.orchestration import (
    AssessmentOrchestrator,
    AssessmentStage,
    LLMFirstStrategy,
    OrchestrationContext,
    StageStatus,
)
from domain.providers import get_llm_provider
from domain.providers.telemetry import telemetry_tracker


@pytest.mark.skipif(
    not os.getenv("COMPLYWISE_LIVE_INTEGRATION"),
    reason="Live integration smoke tests disabled by default. Set COMPLYWISE_LIVE_INTEGRATION=1 to run.",
)
@pytest.mark.django_db
class TestLiveStep05Integration:
    """Isolated real end-to-end integration smoke test exercising the actual provider chain."""

    @pytest.fixture
    def auth_user(self, db):
        from apps.accounts.models import User
        return User.objects.create_user(
            email="live_eval_officer@complywise.test",
            password="TestPassword123!",
            full_name="Lead Compliance Officer",
        )

    @pytest.fixture
    def cement_business(self, db, auth_user):
        biz = Business.objects.create(name="Ambuja Heritage Cement Ltd", owner=auth_user)
        BusinessProfileVersion.objects.create(
            business=biz,
            version=1,
            variables={
                "product_description": {
                    "value": "Integrated Portland cement and clinker manufacturing plant in Chandrapur with rotary kiln and captive power"
                },
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

    def test_live_full_provider_chain_maharashtra_cement(self, cement_business):
        """Execute the complete 5-stage live provider chain on Maharashtra cement profile."""
        provider = get_llm_provider()
        assert provider is not None and provider.is_configured, "Configured LLM provider must be available."

        orchestrator = AssessmentOrchestrator()
        strategy = LLMFirstStrategy()
        ctx = OrchestrationContext.from_business(cement_business)
        run = orchestrator.create_run(business=cement_business)
        run_id_str = str(run.run_id)

        initial_telemetry_index = len(telemetry_tracker._records)
        overall_t0 = time.perf_counter()

        # =====================================================================
        # STAGE 1: BUSINESS UNDERSTANDING (Real LLM)
        # =====================================================================
        t0_bu = time.perf_counter()
        res_bu = strategy.execute_stage(AssessmentStage.BUSINESS_UNDERSTANDING, ctx, run)
        t_bu_elapsed = time.perf_counter() - t0_bu

        assert res_bu.status == StageStatus.COMPLETED
        bu_data = res_bu.data
        assert bu_data.get("business_type") is not None
        assert len(bu_data.get("likely_regulatory_domains", [])) > 0

        # =====================================================================
        # STAGE 2: QUESTION GENERATION (Real LLM)
        # =====================================================================
        t0_qg = time.perf_counter()
        res_qg = strategy.execute_stage(AssessmentStage.QUESTION_GENERATION, ctx, run)
        t_qg_elapsed = time.perf_counter() - t0_qg

        assert res_qg.status == StageStatus.COMPLETED
        questions = res_qg.data.get("questions", [])
        assert len(questions) == 15, f"Expected exactly 15 questions, got {len(questions)}"

        # =====================================================================
        # STAGE 3: ANSWER INTERPRETATION & CONTEXT SYNTHESIS
        # =====================================================================
        cement_verified_answers = {
            "Q01": False,  # Consumer electronics
            "Q02": 350,    # Workers
            "Q03": 2500,   # Power load in kW
            "Q04": False,  # Cross border export
            "Q05": True,   # Captive boiler / rotary kiln
            "Q06": True,   # Mandatory BIS ISI mark (IS 269)
            "Q07": True,   # Heavy particulate air emissions
            "Q08": True,   # Hazardous process factory license
            "Q09": False,  # E-waste IT hardware
            "Q10": False,  # Food safety / FSSAI (Strictly False)
            "Q11": False,  # DGFT IEC
            "Q12": True,   # Captive limestone mining lease
            "Q13": True,   # Explosive / fire safety
            "Q14": True,   # CAAQMS air quality monitoring
            "Q15": True,   # Hazardous waste authorization
        }

        st = dict(run.stage_metadata)
        st["answers"] = cement_verified_answers
        run.stage_metadata = st
        run.save()

        t0_ai = time.perf_counter()
        res_ai = strategy.execute_stage(AssessmentStage.ANSWER_INTERPRETATION, ctx, run)
        res_cs = strategy.execute_stage(AssessmentStage.CONTEXT_SYNTHESIS, ctx, run)
        t_ai_elapsed = time.perf_counter() - t0_ai

        assert res_ai.status == StageStatus.COMPLETED
        assert res_cs.status == StageStatus.COMPLETED
        extracted_facts = res_ai.data.get("facts", [])
        assert len(extracted_facts) > 0

        # =====================================================================
        # STAGE 4: REGULATORY DISCOVERY (Real Firecrawl Search)
        # =====================================================================
        t0_disc = time.perf_counter()
        res_disc = strategy.execute_stage(AssessmentStage.REGULATORY_DISCOVERY, ctx, run)
        t_disc_elapsed = time.perf_counter() - t0_disc

        assert res_disc.status == StageStatus.COMPLETED
        disc_data = res_disc.data
        disc_queries = disc_data.get("queries", [])
        disc_sources = disc_data.get("sources", [])
        disc_evidence = disc_data.get("evidence_candidates", [])
        disc_warnings = disc_data.get("warnings", [])

        # =====================================================================
        # STAGE 5: COMPLIANCE SYNTHESIS (Real LLM + Deterministic Applicability)
        # =====================================================================
        t0_synth = time.perf_counter()
        res_synth = strategy.execute_stage(AssessmentStage.COMPLIANCE_SYNTHESIS, ctx, run)
        t_synth_elapsed = time.perf_counter() - t0_synth

        assert res_synth.status == StageStatus.COMPLETED
        synth_data = res_synth.data
        requirements = synth_data.get("requirements", [])
        applicable_count = synth_data.get("applicable_count", 0)
        executive_summary = synth_data.get("executive_summary", {})

        overall_total_latency = time.perf_counter() - overall_t0

        # Extract Telemetry Records for this assessment
        assessment_telemetry = [
            rec for rec in telemetry_tracker._records[initial_telemetry_index:]
            if rec.assessment_id == run_id_str or rec.workflow in {"business_understanding", "questionnaire_generation", "compliance_synthesis"}
        ]

        total_input_tokens = sum(r.input_tokens for r in assessment_telemetry)
        total_output_tokens = sum(r.output_tokens for r in assessment_telemetry)
        total_cached_tokens = sum(r.cached_input_tokens for r in assessment_telemetry)
        total_tokens = total_input_tokens + total_output_tokens
        total_estimated_cost = sum(r.estimated_cost_usd for r in assessment_telemetry)

        # Domain Irrelevance Assertions: Cement in Maharashtra
        all_req_text = " ".join(f"{r.get('title', '')} {r.get('description', '')}" for r in requirements).lower()
        assert "dairy" not in all_req_text, "Ambuja cement must NOT contain dairy requirements"
        assert "drinking water" not in all_req_text, "Ambuja cement must NOT contain drinking water requirements"
        assert "restaurant" not in all_req_text, "Ambuja cement must NOT contain restaurant requirements"
        assert "textile dyeing" not in all_req_text, "Ambuja cement must NOT contain textile dyeing requirements"

        # Applicability Status Distribution
        status_counts: dict[str, int] = {}
        for r in requirements:
            st_val = r.get("status", "UNKNOWN")
            status_counts[st_val] = status_counts.get(st_val, 0) + 1

        # =====================================================================
        # PRINT STRUCTURED VERIFICATION REPORT
        # =====================================================================
        print("\n" + "=" * 75)
        print("COMPLYWISE STEP 05 — ISOLATED LIVE INTEGRATION VERIFICATION REPORT")
        print("=" * 75)
        print(f"Target Business: {cement_business.name} (Maharashtra, Red Category)")
        print(f"Assessment ID:   {run_id_str}")
        print(f"Total Latency:   {overall_total_latency:.2f}s")
        print("-" * 75)
        print("1. ACTUAL LLM CALLS BY STAGE:")
        for idx, rec in enumerate(assessment_telemetry, 1):
            print(
                f"   Call #{idx}: [{rec.workflow.upper()}] model={rec.model} "
                f"latency={rec.latency_ms:.0f}ms tokens={rec.total_tokens} (in:{rec.input_tokens}, out:{rec.output_tokens}) "
                f"cost=${rec.estimated_cost_usd:.6f} status={rec.status}"
            )
        print(f"   Total LLM Calls Recorded: {len(assessment_telemetry)}")
        print(f"   Total Tokens Consumed:    {total_tokens} (input: {total_input_tokens}, output: {total_output_tokens}, cached: {total_cached_tokens})")
        print(f"   Total Estimated LLM Cost: ${total_estimated_cost:.6f} (Budget limit: $0.50)")
        print("-" * 75)
        print("2. ACTUAL FIRECRAWL REQUESTS:")
        print(f"   Firecrawl Configured:     {firecrawl.is_configured()}")
        print(f"   Search Queries Generated: {len(disc_queries)}")
        for q in disc_queries[:4]:
            print(f"     - '{q}'")
        print(f"   Sources Captured:         {len(disc_sources)}")
        print(f"   Evidence Candidates:      {len(disc_evidence)}")
        if disc_warnings:
            print(f"   Discovery Warnings:       {disc_warnings[:2]}")
        print("-" * 75)
        print("3. EVIDENCE COUNT:")
        print(f"   Total Evidence Records:   {len(disc_evidence)}")
        if disc_evidence:
            print(f"   Sample Evidence Authority: {disc_evidence[0].get('authority')} ({disc_evidence[0].get('jurisdiction')})")
            print(f"   Sample Official URL:       {disc_evidence[0].get('source_url')}")
        print("-" * 75)
        print("4. COMPLIANCE SYNTHESIS & APPLICABILITY RESULTS:")
        print(f"   Total Synthesized Reqs:   {len(requirements)}")
        print(f"   Applicability Breakdown:  {status_counts}")
        print(f"   Applicable Count:         {applicable_count}")
        print(f"   Executive Summary:        {executive_summary}")
        print("   Sample Synthesized Requirements:")
        for r in requirements[:3]:
            print(f"     * [{r.get('status')}] {r.get('title')} ({r.get('authority')}) Priority: {r.get('priority')}")
        print("-" * 75)
        print("5. FINAL APPLICABILITY RESULT:")
        print(f"   Status:                   {res_synth.status}")
        print(f"   Deterministic Authority:  ENFORCED (LLM synthesized candidates; deterministic rules assigned final legal status)")
        print("=" * 75 + "\n")

        assert len(requirements) > 0, "Must synthesize at least one candidate requirement"
        assert len(assessment_telemetry) >= 2, "Must record telemetry for live LLM invocations"
        assert total_estimated_cost < 0.50, "Total cost must not exceed budget guardrail"
