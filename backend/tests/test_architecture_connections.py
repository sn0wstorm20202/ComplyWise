"""Persisted end-to-end connection checks for the architecture gap audit."""
import json
from types import SimpleNamespace
from unittest.mock import Mock, patch

import pytest
from django.test import override_settings
from django.utils import timezone

from apps.businesses.models import WorkspaceGuidance
from apps.evidence.models import Source, Evidence
from apps.ingestion.models import DiscoveryRun, RetrievedDocument
from apps.ingestion.services import _store_discovered_source, run_discovery
from apps.knowledge.models import RequirementDefinition, RuleVersion
from domain.intelligence.discovery import LiveRegulatoryDiscoveryProvider
from domain.intelligence.workspace_guidance import generate_workspace, ensure_workspace
from domain.providers.base import CompletionResult, ProviderError
from tests.test_workspace_guidance import setup_assessment, interpretation

pytestmark = pytest.mark.django_db


def test_retrieved_verified_excerpt_reaches_contextual_provider(make_business, user):
    business, profile, assessment = setup_assessment(make_business, user)
    source = Source.objects.create(source_id="connection-source", title="Synthetic drone filming Karnataka guidance",
                                  authority="Synthetic", status="ACTIVE")
    Evidence.objects.create(evidence_id="connection-evidence", source=source, verification_status="VERIFIED",
                            excerpt="Drone filming outdoors in Karnataka. Synthetic fixture, not regulatory advice.")
    provider = Mock()
    provider.complete.return_value = CompletionResult(json.dumps(interpretation()), "fixture", "fixture")
    with patch("domain.intelligence.workspace_guidance.get_llm_provider", return_value=provider):
        payload = generate_workspace(business, assessment, profile, [])
    sent = json.loads(provider.complete.call_args.args[0][1].content)
    assert sent["verified_passages"][0]["evidence_id"] == "connection-evidence"
    assert sent["verified_passages"][0]["excerpt"].startswith("Drone filming")
    assert payload["compliance_items"] and WorkspaceGuidance.objects.filter(assessment=assessment).exists()


def test_retrieval_infrastructure_failure_does_not_bypass_llm(make_business, user):
    business, profile, assessment = setup_assessment(make_business, user)
    provider = Mock()
    provider.complete.return_value = CompletionResult(json.dumps(interpretation()), "fixture", "fixture")
    with patch("apps.assistant.services.retrieve_evidence", side_effect=RuntimeError("search unavailable")), \
         patch("domain.intelligence.workspace_guidance.get_llm_provider", return_value=provider):
        payload = generate_workspace(business, assessment, profile, [])
    assert provider.complete.call_count == 1
    assert payload["compliance_items"][0]["evidence_ids"] == []
    assert json.loads(provider.complete.call_args.args[0][1].content)["verified_passages"] == []


def test_capture_reaches_interpretation_when_claim_extraction_empty(make_business, user):
    business, profile, assessment = setup_assessment(make_business, user)
    text = "Synthetic official-page capture about drone filming permissions; no factual legal claim."
    source, evidence = _store_discovered_source(url="https://dgca.gov.in/synthetic-fixture", title="Fixture",
        text=text, query="drone filming", authority_tier="OFFICIAL")
    run = DiscoveryRun.objects.create(business=business, assessment=assessment, status="COMPLETED",
        scraped_count=1, scraped_urls=[{"source_id": source.source_id}], summary={"profile_version_id": str(profile.id)})
    with patch("apps.ingestion.services.run_discovery", return_value={"run_id": str(run.id), "status": "COMPLETED", "sources_scraped": 1}):
        result = LiveRegulatoryDiscoveryProvider().discover(SimpleNamespace(business_id=business.id), assessment=assessment)
    assert result.evidence_candidates[0]["excerpt"] == text
    assert result.evidence_candidates[0]["verification_status"] == "UNVERIFIED"
    assert "retrieved_document_id" in result.evidence_candidates[0]
    assert not run.candidate_requirements.exists()


@override_settings(SERPAPI_API_KEY="fixture")
def test_search_provider_failure_reuses_same_snapshot_capture(make_business, user):
    business, profile, assessment = setup_assessment(make_business, user)
    prior = DiscoveryRun.objects.create(business=business, assessment=assessment, status="COMPLETED",
        scraped_count=1, queries=["drone filming Karnataka"], summary={"profile_version_id": str(profile.id)},
        completed_at=timezone.now())
    with patch("apps.ingestion.services.search_provider.search", side_effect=ProviderError("service outage")):
        result = run_discovery(business, force_refresh=True, assessment=assessment, profile_version=profile)
    assert result["run_id"] == str(prior.id)
    assert result["recovered_from_persisted"] is True
    assert DiscoveryRun.objects.get(pk=result["failed_run_id"]).status == "FAILED"


@override_settings(LLM_PROVIDER="gemini", GEMINI_API_KEY="fixture-first", GEMINI_API_KEYS=["fixture-second"],
                   OPENAI_API_KEY="", GEMINI_KEY_COOLDOWN_SECONDS=0)
def test_provider_fallback_persists_then_populates_normal_workspace(make_business, user, auth_client):
    business, profile, assessment = setup_assessment(make_business, user)
    assessment.step_state = {"strategy": "LLM_FIRST", "stage_metadata": {"regulatory_discovery": {"status": "FAILED", "evidence_candidates": []}}}
    assessment.save()
    response_body = {"candidates": [{"content": {"parts": [{"text": json.dumps(interpretation())}]}}]}
    with patch("domain.providers.gemini_provider.post_json", side_effect=[ProviderError("outage"), response_body]) as transport:
        response = auth_client.post(f"/api/v1/assessments/{assessment.id}/compliance-synthesis", {}, format="json")
    assert response.status_code == 200, response.data
    assert transport.call_count == 2
    saved = WorkspaceGuidance.objects.get(assessment=assessment)
    assert saved.provider_metadata["provider"] == "gemini"
    assert response.data["data"]["requirements"][0]["result_origin"] == "LLM_FALLBACK_RESULT"
    for section, key in [("documents", "documents"), ("workflows", "workflows"), ("standards", "standards"), ("schemes", "schemes")]:
        url = (f"/api/v1/standards/search?business_id={business.id}&assessment_id={assessment.id}" if section == "standards"
               else f"/api/v1/businesses/{business.id}/{section}?assessment_id={assessment.id}")
        result = auth_client.get(url)
        assert result.status_code == 200, result.data
        assert result.data["data"][key], section
    assert RequirementDefinition.objects.count() == 0
    assert Evidence.objects.count() == 0


@override_settings(LLM_PROVIDER="gemini", GEMINI_API_KEY="fixture-first", GEMINI_API_KEYS=["fixture-second"],
                   OPENAI_API_KEY="sk-unit-"+"x"*32, GEMINI_KEY_COOLDOWN_SECONDS=0)
def test_all_provider_failure_is_controlled_api_retry_after_exhaustion(make_business, user, auth_client):
    business, profile, assessment = setup_assessment(make_business, user)
    assessment.step_state = {"strategy": "LLM_FIRST", "stage_metadata": {"regulatory_discovery": {"status": "FAILED"}}}
    assessment.save()
    with patch("domain.providers.gemini_provider.post_json", side_effect=ProviderError("outage")) as gemini, \
         patch("domain.providers.openai_provider.post_json", side_effect=ProviderError("outage")) as openai:
        response = auth_client.post(f"/api/v1/assessments/{assessment.id}/compliance-synthesis", {}, format="json")
    assert response.status_code == 503, response.data
    assert response.data["error"]["code"] == "PROVIDER_UNAVAILABLE"
    assert gemini.call_count == 2 and openai.call_count == 1
    assert not WorkspaceGuidance.objects.exists()


def test_explicit_complete_verified_coverage_skips_contextual_model(make_business, user):
    business, profile, assessment = setup_assessment(make_business, user)
    RequirementDefinition.objects.create(requirement_id="fixture-complete", name="Synthetic covered area", authority="Synthetic",
        jurisdiction="CENTRAL", domain="FIXTURE", status="PUBLISHED", metadata={"complete_business_coverage": True})
    with patch("domain.intelligence.workspace_guidance.get_llm_provider") as provider:
        result = ensure_workspace(business, assessment, profile, [{"requirement_id": "fixture-complete", "status": "APPLICABLE"}])
    provider.assert_not_called()
    assert result["compliance_items"] == []


def test_assistant_can_explain_saved_business_without_unrelated_citations(make_business, user):
    from apps.assistant.services import answer_question
    business, profile, assessment = setup_assessment(make_business, user)
    provider = Mock()
    provider.complete.return_value = CompletionResult("List your aircraft and filming locations before checking permissions.", "fixture", "fixture")
    result = answer_question("What should I prepare?", business=business, assessment_id=str(assessment.id), provider=provider)
    assert result["business_context_used"] and result["answer_generated"]
    assert result["citations"] == [] and result["result_origin"] == "LLM_FALLBACK_RESULT"


def test_facade_retains_snapshot_capture_and_serializes_saved_profile(make_business, user, auth_client):
    from apps.businesses.models import BusinessProfileVersion
    from domain.intelligence.orchestration import orchestrate_compliance_analysis
    business, profile, assessment = setup_assessment(make_business, user)
    source, _ = _store_discovered_source(url="https://dgca.gov.in/fixture-facade", title="Synthetic capture",
        text="Synthetic drone filming capture for the saved assessment.", query="drone filming", authority_tier="OFFICIAL")
    discovery = DiscoveryRun.objects.create(business=business, assessment=assessment, status="COMPLETED",
        scraped_urls=[{"source_id": source.source_id}], scraped_count=1,
        summary={"profile_version_id": str(profile.id)})
    BusinessProfileVersion.objects.create(business=business, version=2,
        variables={"product_description": {"value": "A different current activity"}})
    provider = Mock(); provider.complete.return_value = CompletionResult(json.dumps(interpretation()), "fixture", "fixture")
    with patch("domain.intelligence.workspace_guidance.get_llm_provider", return_value=provider):
        orchestrate_compliance_analysis(business, assessment_id=str(assessment.id), force_live_discovery=False)
    sent = json.loads(provider.complete.call_args.args[0][1].content)
    assert sent["profile_facts"] == profile.variables
    assert sent["retrieved_context"]["evidence_candidates"][0]["excerpt"].startswith("Synthetic drone")
    assessment.refresh_from_db()
    assert assessment.discovery_run_id == discovery.id
    detail = auth_client.get(f"/api/v1/businesses/{business.id}/assessments/{assessment.id}")
    assert detail.status_code == 200 and detail.data["data"]["profile_variables"] == profile.variables


def test_facade_final_provider_exhaustion_returns_controlled_error(make_business, user, auth_client):
    business, _, assessment = setup_assessment(make_business, user)
    url = f"/api/v1/businesses/{business.id}/analysis/orchestrate?assessment_id={assessment.id}"
    with patch("domain.intelligence.orchestration.orchestrate_compliance_analysis", side_effect=ProviderError("all alternatives exhausted")):
        result = auth_client.post(url)
    assert result.status_code == 503
    assert result.data["error"]["code"] == "WORKSPACE_PREPARATION_FAILED"


def test_status_read_does_not_invoke_an_exhausted_provider(make_business, user, auth_client):
    business, _, assessment = setup_assessment(make_business, user)
    url = f"/api/v1/businesses/{business.id}/analysis/status?assessment_id={assessment.id}"
    with patch("domain.intelligence.orchestration.orchestrate_compliance_analysis", side_effect=ProviderError("all alternatives exhausted")) as orchestrate:
        result = auth_client.get(url)
    assert result.status_code == 200
    assert result.data["data"]["assessment_id"] == str(assessment.id)
    orchestrate.assert_not_called()
