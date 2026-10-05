"""Actual deployed retrieval contract, isolation and graceful failure boundaries."""
import json
from unittest.mock import Mock, patch
import pytest
from django.test import override_settings
from domain.providers.base import CompletionResult, ProviderError
from domain.intelligence.regulatory_retrieval import retrieve_regulatory_context

CHUNK = {"chunk_id": "external-test-chunk", "source_id": "external-test-source",
    "source_title": "Synthetic Gujarat business guidance", "authority": "Example Gujarat authority",
    "content": "Synthetic factory registration guidance for test purposes.",
    "official_url": "https://example.invalid/fake", "relevance_score": 0.8,
    "verification_status": "VERIFIED"}

@pytest.mark.parametrize("state,expected", [("GUJARAT", 1), ("MAHARASHTRA", 0), (None, 0)])
@override_settings(COMPLIANCERAG_URL="https://retrieval.example.test")
def test_remote_results_enforce_business_jurisdiction(state, expected):
    with patch("domain.intelligence.regulatory_retrieval.post_json", return_value={"results":[CHUNK]}) as post:
        result = retrieve_regulatory_context("factory registration", {"state":{"value":state}})
    assert len(result["passages"]) == expected
    assert post.call_args.args[0].endswith("/retrieval/search")
    assert post.call_args.kwargs["max_retries"] == 0
    if expected:
        passage = result["passages"][0]
        assert passage["source_url"] is None  # Never guess or allow fabricated official links.
        assert passage["chunk_id"] == CHUNK["chunk_id"]
        assert passage["reported_verification_status"] == "VERIFIED"
        assert "evidence_id" not in passage and "verification_status" not in passage

@pytest.mark.parametrize("response", [{"results":[]}, {"wrong":[]}, {"results":[None,{}, {**CHUNK,"relevance_score":0.05}]}])
@override_settings(COMPLIANCERAG_URL="https://retrieval.example.test")
def test_empty_or_malformed_retrieval_is_controlled(response):
    with patch("domain.intelligence.regulatory_retrieval.post_json", return_value=response):
        result = retrieve_regulatory_context("synthetic query", {"state":"GUJARAT"})
    assert not result["passages"]
    assert result["status"] in {"EMPTY","UNAVAILABLE"}

@pytest.mark.django_db
@override_settings(COMPLIANCERAG_URL="https://retrieval.example.test")
def test_remote_outage_does_not_bypass_workspace_provider_or_persistence(make_business, user):
    from tests.test_architecture_connections import setup_assessment, interpretation
    from domain.intelligence.workspace_guidance import generate_workspace
    from apps.businesses.models import WorkspaceGuidance
    business, profile, assessment = setup_assessment(make_business, user)
    provider = Mock()
    provider.complete.return_value = CompletionResult(json.dumps(interpretation()), "fixture", "fixture")
    with patch("domain.intelligence.regulatory_retrieval.post_json", side_effect=ProviderError("outage",failure_type="timeout")), \
         patch("domain.intelligence.workspace_guidance.get_llm_provider",return_value=provider):
        payload = generate_workspace(business, assessment, profile, [])
    assert payload["compliance_items"] and provider.complete.call_count == 1
    saved = WorkspaceGuidance.objects.get(assessment=assessment)
    assert saved.provider_metadata["external_retrieval"]["status"] == "UNAVAILABLE"
    assert not payload["compliance_items"][0]["evidence_ids"]

@pytest.mark.django_db
@override_settings(COMPLIANCERAG_URL="https://retrieval.example.test")
def test_external_context_reaches_model_and_persists_without_publishing_knowledge(make_business,user):
    from tests.test_architecture_connections import setup_assessment, interpretation
    from domain.intelligence.workspace_guidance import generate_workspace
    from apps.businesses.models import WorkspaceGuidance
    from apps.knowledge.models import RequirementDefinition
    business, profile, assessment = setup_assessment(make_business,user)
    provider = Mock()
    provider.complete.return_value = CompletionResult(json.dumps(interpretation()), "fixture", "fixture")
    chunk = {**CHUNK,"source_title":"Synthetic national drone guidance", "authority":"Example central authority"}
    with patch("domain.intelligence.regulatory_retrieval.post_json",return_value={"results":[chunk]}), \
         patch("domain.intelligence.workspace_guidance.get_llm_provider",return_value=provider):
        generate_workspace(business,assessment,profile,[])
    context = json.loads(provider.complete.call_args.args[0][1].content)
    assert context["external_retrieval"]["passages"][0]["excerpt"] == CHUNK["content"]
    assert WorkspaceGuidance.objects.get(assessment=assessment).provider_metadata["external_retrieval"]["status"] == "SUCCESS"
    assert not RequirementDefinition.objects.exists()


@pytest.mark.django_db
@override_settings(COMPLIANCERAG_URL="https://retrieval.example.test")
def test_remote_context_keeps_discovery_useful_when_search_provider_unavailable(make_business,user):
    from types import SimpleNamespace
    from tests.test_architecture_connections import setup_assessment
    from domain.intelligence.discovery import LiveRegulatoryDiscoveryProvider
    from apps.evidence.models import Evidence
    business, profile, assessment = setup_assessment(make_business,user)
    chunk = {**CHUNK,"source_title":"Synthetic national drone guidance", "authority":"Example central authority"}
    with patch("domain.intelligence.regulatory_retrieval.post_json",return_value={"results":[chunk]}), \
         patch("apps.ingestion.services.run_discovery",return_value={"status":"UNAVAILABLE","errors":[]}):
        result = LiveRegulatoryDiscoveryProvider().discover(SimpleNamespace(business_id=business.id),assessment=assessment)
    assert result.status == "COMPLETED" and result.sources_count == 1
    assert result.evidence_candidates[0]["verification_status"] == "EXTERNAL_CONTEXT"
    assert result.metadata["external_retrieval"]["passages"]
    assert not Evidence.objects.exists()
