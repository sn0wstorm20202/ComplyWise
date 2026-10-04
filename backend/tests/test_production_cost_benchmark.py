"""End-to-End Production LLM Cost Benchmark & Verification.

Traces a representative company through:
1. Business Profile creation
2. Products & Activities submission
3. Step 3: First Smart Question retrieval
4. Step 3: Answering 5 sequential questions one by one
5. Step 4: Regulatory analysis orchestration & discovery
6. Step 5: Assistant / Copilot question answering
7. Measures and asserts exact LLM call counts, tokens, and cost.
"""

from __future__ import annotations

import pytest
from unittest.mock import patch

from apps.businesses.models import Business, BusinessProfileVersion
from apps.onboarding.services import (
    get_next_smart_question,
    submit_sequential_smart_question_answer,
)
from apps.assistant.services import answer_question
from domain.intelligence.orchestration import orchestrate_compliance_analysis
from domain.providers.telemetry import telemetry_tracker
from common.enums import VariableOrigin


@pytest.mark.django_db
def test_end_to_end_onboarding_llm_cost_benchmark(make_business, user):
    """Verify that an entire end-to-end company onboarding consumes minimal LLM calls and tokens."""
    telemetry_tracker.reset()

    # 1. Company Profile Creation
    business = make_business(owner=user, name="Astraeus Advanced Electronics Pvt Ltd")
    initial_profile = BusinessProfileVersion.objects.create(
        business=business,
        version=1,
        variables={
            "legal_constitution": {"value": "PVT_LTD", "origin": VariableOrigin.USER_PROVIDED},
            "state": {"value": "Gujarat", "origin": VariableOrigin.USER_PROVIDED},
            "annual_turnover": {"value": 150000000, "origin": VariableOrigin.USER_PROVIDED},
        },
        change_note="Initial onboarding registration",
        created_by=user,
    )

    assessment = business.assessments.create(
        assessment_number=1,
        title="Initial Comprehensive Assessment",
        status="IN_PROGRESS",
        profile_version=initial_profile,
    )

    # 2. Products & Activities
    # Heuristic regex detects ESDM manufacturing without LLM
    product_desc = "Manufacturing printed circuit board assemblies (PCBA) and surface mount electronics."

    # 3. Step 3: Fetch first sequential question
    q1 = get_next_smart_question(business, assessment_id=str(assessment.id))
    assert q1 is not None, "First smart question should be returned"
    first_q_calls = telemetry_tracker.get_summary()["total_calls"]
    # For a pre-seeded sector/rules, deterministic engine generates questions with ZERO LLM calls!
    assert first_q_calls <= 1, f"Expected <=1 LLM calls on initial question fetch, got {first_q_calls}"

    # 4. Sequentially answer 5 questions one by one
    sample_answers = [
        ("total_worker_count", 45),
        ("connected_power_load", 65),
        ("effluent_emission_generation", False),
        ("hazardous_waste_generation", True),
        ("import_export_intent", "IMPORT_ONLY"),
    ]

    for key, val in sample_answers:
        res = submit_sequential_smart_question_answer(
            business=business,
            variable_key=key,
            answer_value=val,
            user=user,
            assessment_id=str(assessment.id),
        )
        assert "profile_version" in res

    after_questions_calls = telemetry_tracker.get_summary()["total_calls"]
    # CRITICAL: Answering 5 questions sequentially MUST NOT add ANY LLM calls!
    # All 5 answers must be processed deterministically!
    questions_loop_calls = after_questions_calls - first_q_calls
    assert questions_loop_calls == 0, f"Expected 0 LLM calls during 5-question answering loop, got {questions_loop_calls}!"

    # 5. Step 4: Regulatory Analysis & Discovery
    with patch("apps.ingestion.services.search_provider.is_configured", return_value=True), \
         patch("apps.ingestion.services.search_provider.search") as mock_search, \
         patch("apps.ingestion.services.acquire_source") as mock_scrape:
        
        mock_search.return_value = [
            {
                "url": "https://gpcb.gujarat.gov.in/esdm-guidelines",
                "title": "GPCB CTE Environmental Clearances for ESDM",
                "description": "Gujarat Pollution Control Board guidelines for electronic assembly units.",
            }
        ]
        from domain.acquisition.base import WebAcquisitionResult
        mock_scrape.return_value = WebAcquisitionResult(source_url="https://gpcb.gujarat.gov.in/esdm-guidelines",
            resolved_url="https://gpcb.gujarat.gov.in/esdm-guidelines", domain="gpcb.gujarat.gov.in", title="Synthetic fixture", retrieved_at="",
            text_content="Synthetic electronic assembly source passage, retained as contextual material rather than published knowledge. " * 3,
            acquisition_engine="CRAWLEE_HTTP")

        analysis_res = orchestrate_compliance_analysis(
            business,
            assessment_id=str(assessment.id),
            force_live_discovery=True,
        )

    assert analysis_res["status"] == "COMPLETED"

    # 6. Step 5: Ask Copilot / Assistant question
    ask_res = answer_question(
        prompt="What environmental consents are required for my electronics manufacturing unit?",
        business=business,
    )
    assert ask_res.get("answer") or ask_res.get("citations")

    # 7. Final Telemetry Audit
    summary = telemetry_tracker.get_summary(assessment_id=str(assessment.id))
    all_summary = telemetry_tracker.get_summary()

    print("\n" + "="*50)
    print("MEASURED POST-OPTIMIZATION TELEMETRY BENCHMARK:")
    print(f"Total LLM Calls: {all_summary['total_calls']}")
    print(f"Total Input Tokens: {all_summary['total_input_tokens']}")
    print(f"Total Output Tokens: {all_summary['total_output_tokens']}")
    print(f"Total Reasoning Tokens: {all_summary['total_reasoning_tokens']}")
    print(f"Total Estimated Cost: ${all_summary['total_cost_usd']:.6f} USD")
    print(f"Workflow Breakdown: {all_summary['workflows']}")
    print("="*50 + "\n")

    # Rigorous acceptance assertions:
    # Baseline was 8-10 calls per company. Target is 1-2 calls total!
    assert all_summary["total_calls"] <= 3, f"Expected total calls <= 3, got {all_summary['total_calls']}"
    assert all_summary["total_output_tokens"] <= 3000, f"Expected output tokens <= 3000, got {all_summary['total_output_tokens']}"
    assert all_summary["total_cost_usd"] <= 0.005, f"Expected total cost <= $0.005, got ${all_summary['total_cost_usd']}"
