"""BIS Intelligence Engine Integration Tests for ComplyWise.

Verifies:
1. Query Classifier & Routing (BIS vs General vs Mixed vs Ambiguous).
2. Elimination of hardcoded BIS fallbacks (IS 16444/IS 15885 canned response removal).
3. Data minimization (stripping financial/PII data before sending to BIS engine).
4. BisServiceClient contract parsing, claim entailment mapping, and error resilience.
5. Circuit breaker state transitions (_record_failure, _record_success, _is_circuit_open).
6. Standards API endpoint (/api/v1/standards/bis-query) contract and fault handling.
7. End-to-end assistant chat dispatching and citation adaptation.
"""

from __future__ import annotations

import time
from unittest.mock import MagicMock, patch

import pytest
from rest_framework.test import APIClient

from apps.assistant.router import (
    QueryIntent,
    RouteDecision,
    classify_compliance_query,
    extract_standard_references,
)
from apps.assistant.services import (
    _adapt_bis_citations,
    _generate_structured_compact_answer,
    answer_question,
)
from domain.intelligence.bis_client import (
    BisServiceClient,
    sanitize_business_context_for_bis,
)
from domain.intelligence.bis_models import (
    AnswerabilityState,
    AuthorityTier,
    BisClaim,
    BisQueryRequest,
    BisQueryResponse,
    ClaimStatus,
)


# ===========================================================================
# 1. Query Classifier & Router Tests
# ===========================================================================

@pytest.mark.parametrize(
    "query,expected_category",
    [
        ("What is the mandatory ISI standard for smart meters under IS 16444?", QueryIntent.BIS_STANDARDS),
        ("Does IS 1293 apply to electrical plugs and sockets?", QueryIntent.BIS_STANDARDS),
        ("What are the QCO requirements and BIS Scheme-I marking?", QueryIntent.BIS_STANDARDS),
        ("How do I obtain a CTE and CTO from the State Pollution Control Board?", QueryIntent.GENERAL_COMPLIANCE),
        ("What are the hazardous waste return filing deadlines under CPCB?", QueryIntent.GENERAL_COMPLIANCE),
        ("What are the factory safety officer prerequisites under the Factories Act?", QueryIntent.GENERAL_COMPLIANCE),
        ("What are the BIS testing norms and SPCB air consent limits for cement plants?", QueryIntent.MIXED_QUERY),
        ("Do we need both ISI mark and pollution clearance?", QueryIntent.MIXED_QUERY),
        ("", QueryIntent.AMBIGUOUS),
        ("   ", QueryIntent.AMBIGUOUS),
    ],
)
def test_classify_compliance_query(query: str, expected_category: QueryIntent):
    decision = classify_compliance_query(query)
    assert decision.intent == expected_category


def test_extract_standard_references():
    refs = extract_standard_references("We manufacture under IS 16444:2015 and IS 1293.")
    assert any("IS 16444" in r for r in refs)
    assert any("IS 1293" in r for r in refs)


# ===========================================================================
# 2. Canned Fallback Removal & Anti-Hallucination Regression
# ===========================================================================

def test_no_hardcoded_bis_standards_in_compact_fallback():
    """Verify that querying arbitrary or unseen products does NOT return fabricated IS 16444 or IS 15885."""
    unrelated_queries = [
        "What are the compliance rules for wooden dining tables?",
        "What BIS standard applies to organic microbial fertilizers?",
        "What are the statutory requirements for clinical thermometers?",
        "Are there mandatory standards for cotton surgical dressings?",
    ]
    for q in unrelated_queries:
        answer = _generate_structured_compact_answer(q, None)
        assert "IS 16444" not in answer, f"Fabricated IS 16444 found for query: {q}"
        assert "IS 15885" not in answer, f"Fabricated IS 15885 found for query: {q}"
        assert "Scheme-I mandatory" not in answer, f"Blanket Scheme-I claimed for query: {q}"


# ===========================================================================
# 3. Data Minimization & Privacy Tests
# ===========================================================================

def test_sanitize_business_context_for_bis():
    """Verify sensitive PII and financial metrics are stripped before sending to BIS."""
    dirty_context = {
        "company_name": "ACME Defense Technologies Pvt Ltd",
        "turnover_inr": 450000000,
        "bank_account_number": "987654321098",
        "secret_api_key": "sk-live-secret-key-123",
        "authorized_signatory_pan": "ABCDE1234F",
        "product_description": "Smart Meter Assembly",
        "is_manufacturing": True,
        "state_name": "Maharashtra",
        "connected_power_load": 150,
    }
    sanitized = sanitize_business_context_for_bis(dirty_context)
    assert sanitized["product_description"] == "Smart Meter Assembly"
    assert sanitized["manufacturing_location"] == "Maharashtra"
    assert sanitized["technical_characteristics"]["power_load_hp"] == 150
    # Stripped fields
    assert "turnover_inr" not in sanitized
    assert "bank_account_number" not in sanitized
    assert "secret_api_key" not in sanitized
    assert "authorized_signatory_pan" not in sanitized
    assert "company_name" not in sanitized


# ===========================================================================
# 4. BisServiceClient Contract & Entailment Mapping
# ===========================================================================

def test_client_maps_bis_system_claims_and_entailment_accurately():
    """Verify claims from Bis-system schema (using 'text' and 'support_status') map correctly."""
    mock_bis_response = {
        "query": "Is IS 16444 mandatory for smart meters?",
        "answer": "Yes, IS 16444 (Part 1) is mandatory for a.c. static direct connected watt-hour smart meters.",
        "decision": "ANSWER",
        "grounding_status": "fully_grounded",
        "verification_required": False,
        "retrieved_chunks": 3,
        "confidence": {"score": 0.96, "level": "HIGH"},
        "claims": [
            {
                "claim_id": "C1",
                "text": "IS 16444:2015 is compulsory for smart meters.",
                "support_status": "supported",
                "citation": "IS 16444 Cl. 1.1",
            },
            {
                "claim_id": "C2",
                "text": "Every manufacturer must hold a foreign patent.",
                "support_status": "unsupported",
                "citation": None,
            },
        ],
        "citations": [
            {
                "standard_number": "IS 16444",
                "clause_id": "Clause 1.1",
                "excerpt": "This standard specifies requirements for a.c. static direct connected watt-hour smart meters.",
                "authority": "Bureau of Indian Standards",
                "verifiable": True,
            }
        ],
    }

    client = BisServiceClient(config={
        "enabled": True,
        "base_url": "http://mock-bis:8001",
        "internal_key": "test-key",
        "timeout": 12.0,
        "max_retries": 1,
    })

    with patch.object(client, "get_http_client") as mock_get_http:
        mock_http = MagicMock()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_bis_response
        mock_http.post.return_value = mock_resp
        mock_get_http.return_value = mock_http

        res = client.query("Is IS 16444 mandatory for smart meters?")

        assert res.answerability == AnswerabilityState.ANSWERABLE
        assert len(res.claims) == 2
        # Claim 1: supported
        assert res.claims[0].status == ClaimStatus.SUPPORTED
        assert res.claims[0].claim_text == "IS 16444:2015 is compulsory for smart meters."
        # Claim 2: unsupported - CRITICAL: must NOT be marked SUPPORTED!
        assert res.claims[1].status == ClaimStatus.UNSUPPORTED
        assert res.claims[1].claim_text == "Every manufacturer must hold a foreign patent."
        # Citations
        assert len(res.citations) == 1
        assert res.citations[0].standard_number == "IS 16444"
        assert res.citations[0].verifiable is True


# ===========================================================================
# 5. Circuit Breaker State Transitions
# ===========================================================================

def test_circuit_breaker_trips_on_failures_and_recovers():
    """Verify circuit breaker opens after failure threshold and resets on success."""
    client = BisServiceClient(config={
        "enabled": True,
        "base_url": "http://mock-bis:8001",
        "internal_key": "test-key",
        "timeout": 12.0,
        "max_retries": 1,
    })

    # Initially closed
    client._record_success()
    assert client._is_circuit_open() is False

    # Trip 3 failures -> breaker should OPEN
    client._record_failure()
    client._record_failure()
    client._record_failure()
    assert client._is_circuit_open() is True

    # When open, query immediately returns SERVICE_UNAVAILABLE without making HTTP request
    with patch.object(client, "get_http_client") as mock_get_http:
        res = client.query("What standard applies to plugs?")
        mock_get_http.assert_not_called()
        assert res.answerability == AnswerabilityState.SERVICE_UNAVAILABLE
        assert res.verification_required is True

    # Reset circuit breaker
    client._record_success()
    assert client._is_circuit_open() is False


# ===========================================================================
# 6. Standards API View (/api/v1/standards/bis-query)
# ===========================================================================

@pytest.mark.django_db
def test_bis_agent_query_view_valid_request(auth_client: APIClient, business):
    """Test standards/bis-query endpoint with mocked BIS engine."""
    mock_resp = BisQueryResponse(
        version="2.0",
        query="What is IS 16444?",
        answerability=AnswerabilityState.ANSWERABLE,
        decision="Verified standard in corpus.",
        verification_required=False,
        answer="IS 16444 specifies smart meter criteria.",
        claims=[
            BisClaim(claim_text="IS 16444 specifies smart meter criteria.", status=ClaimStatus.SUPPORTED)
        ],
        citations=[],
        candidate_standards=[],
    )

    with patch.object(BisServiceClient, "query", return_value=mock_resp):
        response = auth_client.post(
            "/api/v1/standards/bis-query",
            data={"query": "What is IS 16444?", "business_id": str(business.id)},
            format="json",
        )

        assert response.status_code == 200
        data = response.json()["data"]
        assert data["answerability"] == "ANSWERABLE"
        assert data["answer"] == "IS 16444 specifies smart meter criteria."
        assert len(data["claims"]) == 1
        assert data["claims"][0]["status"] == "SUPPORTED"


@pytest.mark.django_db
def test_bis_agent_query_view_validation_error(auth_client: APIClient):
    """Test standards/bis-query returns 400 when query is empty."""
    response = auth_client.post(
        "/api/v1/standards/bis-query",
        data={"query": "   "},
        format="json",
    )
    assert response.status_code == 400


# ===========================================================================
# 7. End-to-End Assistant Chat Dispatching
# ===========================================================================

@pytest.mark.django_db
def test_assistant_chat_dispatches_to_bis_for_standards_query(business):
    """Verify that a BIS query to answer_question routes to BIS engine and adapts citations."""
    mock_bis_resp = BisQueryResponse(
        version="2.0",
        query="What are the testing requirements in IS 1293?",
        answerability=AnswerabilityState.ANSWERABLE,
        decision="ANSWER",
        verification_required=False,
        answer="Under IS 1293:2019, plugs must undergo temperature rise and insulation resistance tests.",
        claims=[
            BisClaim(
                claim_text="Plugs must undergo temperature rise tests.",
                status=ClaimStatus.SUPPORTED,
                citation="IS 1293 Cl. 19",
                authority_tier=AuthorityTier.TIER_1_REGULATORY,
            )
        ],
        citations=[],
        candidate_standards=[],
    )

    with patch.object(BisServiceClient, "query", return_value=mock_bis_resp):
        response = answer_question(
            prompt="What are the testing requirements in IS 1293?",
            business=business,
        )

        assert response["grounding_level"] == "STATUTORY_DETERMINISTIC_EVALUATION"
        assert "temperature rise" in response["answer"]
        assert response["bis_response"] is not None
        assert response["bis_response"]["answerability"] == "ANSWERABLE"


# ===========================================================================
# 8. Mixed Query Decomposition & Anti-Leakage Tests
# ===========================================================================

def test_decompose_mixed_query_splits_bis_and_general_accurately():
    """Verify decompose_mixed_query cleanly segregates BIS inquiries from general inquiries."""
    from apps.assistant.router import decompose_mixed_query

    # Example 1: Smart meter BIS CRS + Telangana subsidy
    q1 = "Does my smart meter need BIS CRS certification and what subsidy is available in Telangana?"
    bis_part, gen_part = decompose_mixed_query(q1)
    assert "smart meter" in bis_part.lower()
    assert "bis" in bis_part.lower() or "crs" in bis_part.lower()
    assert "subsidy" in gen_part.lower()
    assert "telangana" in gen_part.lower()

    # Example 2: IS 1786 elongation + Gujarat CTE
    q2 = "What is the minimum elongation for Fe 500D under IS 1786? Also how do I get CTE in Gujarat?"
    bis_part, gen_part = decompose_mixed_query(q2)
    assert "is 1786" in bis_part.lower()
    assert "elongation" in bis_part.lower()
    assert "cte" in gen_part.lower()
    assert "gujarat" in gen_part.lower()


def test_no_bis_act_in_default_statutory_citations():
    """Verify that DEFAULT_STATUTORY_CITATIONS contains zero BIS citations."""
    from apps.assistant.services import DEFAULT_STATUTORY_CITATIONS
    for cit in DEFAULT_STATUTORY_CITATIONS:
        assert "bis" not in cit["authority"].lower()
        assert "bis" not in cit["source_title"].lower()
        assert "EVD-BIS" not in cit["evidence_id"]


@pytest.mark.django_db
def test_mixed_query_routes_subqueries_to_appropriate_engines(business):
    """Verify that in mixed queries, bis_client receives ONLY the BIS subquery."""
    from apps.assistant.services import answer_question

    mock_bis_resp = BisQueryResponse(
        version="2.0",
        query="Does my smart meter need BIS CRS certification?",
        answerability=AnswerabilityState.ANSWERABLE,
        decision="ANSWER",
        verification_required=False,
        answer="Smart meters are covered under IS 16444 and mandatory under CRS.",
        claims=[
            BisClaim(
                claim_text="Smart meters are covered under IS 16444.",
                status=ClaimStatus.SUPPORTED,
                citation="IS 16444:2015",
                authority_tier=AuthorityTier.TIER_1_REGULATORY,
            )
        ],
        citations=[],
        candidate_standards=[],
    )

    with patch.object(BisServiceClient, "query", return_value=mock_bis_resp) as mock_bis_query:
        resp = answer_question(
            prompt="Does my smart meter need BIS CRS certification and what subsidy is available in Telangana?",
            business=business,
        )

        # Ensure bis_client was called with the BIS subquery, not the subsidy query
        mock_bis_query.assert_called_once()
        called_query = mock_bis_query.call_args[0][0]
        assert "smart meter" in called_query.lower()
        assert "subsidy" not in called_query.lower()

        # Ensure the combined response contains both sections
        assert "Bureau of Indian Standards" in resp["answer"]
        assert "General Statutory" in resp["answer"]
        assert resp["bis_response"] is not None

