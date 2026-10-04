"""SIH arbitrary-business continuity and honest provenance regressions."""
import json
from unittest.mock import Mock, patch

import pytest
from apps.businesses.models import Assessment, BusinessProfileVersion, WorkspaceGuidance
from apps.knowledge.models import RequirementDefinition
from domain.intelligence.workspace_guidance import generate_workspace, get_workspace, normalize_workspace
from domain.providers.base import CompletionResult, ProviderError

pytestmark = pytest.mark.django_db


def interpretation():
    return {"compliance_items": [{"key": "activity", "title": "Review drone filming permissions",
        "why_it_may_apply": "You film outdoors with drones in Karnataka.",
        "description": "Confirm the operating permissions for the aircraft and filming locations.",
        "authority_or_regulator": "Civil aviation authority", "jurisdiction": "Karnataka",
        "category": "SECTOR", "recommended_next_step": "Document the aircraft and flight locations.",
        "source_reference": "Civil aviation authority"}],
        "documents": [{"title": "Aircraft and location checklist", "requirement_key": "activity"}],
        "workflows": [{"title": "Prepare filming permissions", "requirement_key": "activity",
                       "steps": ["List flight locations", "Confirm permissions with the authority"]}],
        "standards": [{"title": "Aircraft safety assessment", "why_it_may_apply": "Drone operations"}],
        "schemes": [{"title": "Explore creative industry support", "why_it_may_apply": "Filming services"}],
        "follow_up_questions": []}


def setup_assessment(make_business, user):
    business = make_business(user, name="Drone film studio")
    profile = BusinessProfileVersion.objects.create(business=business, version=1, variables={
        "product_description": {"value": "Drone filming outdoors in Karnataka", "origin": "USER_PROVIDED"},
        "state": {"value": "KARNATAKA", "origin": "USER_PROVIDED"}})
    assessment = Assessment.objects.create(business=business, created_by=user, profile_version=profile)
    return business, profile, assessment


def test_persisted_guidance_reused_and_never_published(make_business, user):
    business, profile, assessment = setup_assessment(make_business, user)
    before = RequirementDefinition.objects.count()
    provider = Mock()
    provider.complete.return_value = CompletionResult(json.dumps(interpretation()), "test", "test-model")
    with patch("domain.intelligence.workspace_guidance.get_llm_provider", return_value=provider):
        first = generate_workspace(business, assessment, profile, [], {"queries": ["drone filming"]})
        again = generate_workspace(business, assessment, profile, [], {"queries": ["drone filming"]})
    assert first == again
    assert provider.complete.call_count == 1
    assert WorkspaceGuidance.objects.count() == 1
    assert RequirementDefinition.objects.count() == before
    assert "https://" not in json.dumps(first)
    item = first["compliance_items"][0]
    assert item["result_origin"] == "LLM_FALLBACK_RESULT"
    assert item["evidence_ids"] == [] and item["rule_version_id"] is None
    assert first["documents"][0]["requirement_id"] == item["id"]
    assert first["workflows"][0]["requirement_id"] == item["id"]
    assert get_workspace(business, assessment.id) == first


def test_assessment_and_profile_isolation(make_business, user):
    business, profile, assessment = setup_assessment(make_business, user)
    WorkspaceGuidance.objects.create(business=business, assessment=assessment, profile_version=profile,
        generation_key="x" * 64, payload=normalize_workspace(interpretation(), []))
    second = Assessment.objects.create(business=business, assessment_number=2, profile_version=profile)
    assert get_workspace(business, second.id)["compliance_items"] == []
    other = make_business(user, name="Another company")
    assert get_workspace(other, assessment.id)["compliance_items"] == []
    newer = BusinessProfileVersion.objects.create(business=business, version=2, variables={})
    assessment.profile_version = newer
    assessment.save()
    assert get_workspace(business, assessment.id)["compliance_items"] == []


def test_deterministic_precedence_and_unlinked_documents_rejected():
    raw = interpretation()
    data = normalize_workspace(raw, [{"title": "Review drone filming permissions", "status": "NOT_APPLICABLE"}])
    assert data["compliance_items"] == []
    assert data["documents"] == []
    assert data["workflows"] == []


def test_invalid_provider_output_is_retried_without_fake_results(make_business, user):
    business, profile, assessment = setup_assessment(make_business, user)
    provider = Mock()
    provider.complete.return_value = CompletionResult("not JSON", "test", "test-model")
    with patch("domain.intelligence.workspace_guidance.get_llm_provider", return_value=provider):
        with pytest.raises(ProviderError):
            generate_workspace(business, assessment, profile, [], {})
    assert provider.complete.call_count == 2
    assert not WorkspaceGuidance.objects.exists()


def test_omitted_or_unlinked_child_arrays_become_practical_preparation_aids():
    raw = interpretation()
    raw["documents"] = [{"title": "Unlinked official-looking form", "requirement_key": "not-in-result"}]
    raw["workflows"] = []
    payload = normalize_workspace(raw, [])
    item = payload["compliance_items"][0]
    assert payload["documents"][0]["requirement_id"] == item["id"]
    assert "Business information" in payload["documents"][0]["title"]
    assert "official-looking" not in json.dumps(payload)
    assert payload["workflows"][0]["steps"][0] == item["recommended_next_step"]
    assert all(child["source_url"] is None for child in payload["documents"] + payload["workflows"])
