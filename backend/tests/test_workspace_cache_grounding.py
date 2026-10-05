"""Read-only legacy workspace grounding and follow-up question regressions."""
import hashlib
import json
from copy import deepcopy
from unittest.mock import Mock, patch

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from apps.businesses.models import Assessment, BusinessProfileVersion, WorkspaceGuidance
from domain.intelligence.output_safety import validate_workspace_shape
from domain.intelligence.workspace_guidance import (
    GROUNDING_POLICY_VERSION,
    ensure_workspace,
    generate_workspace,
    get_workspace,
    normalize_workspace,
)
from domain.providers.base import CompletionResult

pytestmark = pytest.mark.django_db


def guidance():
    return {
        "compliance_items": [{"key": "premises", "title": "Review premises arrangements",
            "why_it_may_apply": "The business operates from a physical workshop.",
            "description": "Record the premises and operating activities.",
            "recommended_next_step": "Confirm the relevant process with the authority."}],
        "documents": [{"title": "Premises information", "requirement_key": "premises"}],
        "workflows": [{"title": "Review premises", "requirement_key": "premises",
                       "steps": ["Record the site details", "Confirm the relevant process"]}],
        "standards": [], "schemes": [], "follow_up_questions": [],
    }


def question(key="dynamic_storage", text="What goods are stored at this business?"):
    return {"variable_key": key, "question": text, "options": ["General goods", "Other goods"],
            "why_it_matters": "This detail helps focus relevant source searches."}


def profile_context():
    return {"profile_facts": {"total_worker_count": {"value": 86},
            "hazardous_waste_generation": {"value": False}, "connected_power_load": {"value": 0}}}


def saved_workspace(make_business, user, raw=None, metadata=None):
    business = make_business(user, name="Synthetic workshop")
    profile = BusinessProfileVersion.objects.create(business=business, version=1,
                                                   variables=profile_context()["profile_facts"])
    assessment = Assessment.objects.create(business=business, created_by=user, profile_version=profile)
    payload = normalize_workspace(raw or guidance(), [])
    row = WorkspaceGuidance.objects.create(business=business, assessment=assessment, profile_version=profile,
        generation_key="legacy-key", payload=payload, provider_metadata=metadata or {})
    return business, profile, assessment, row


@pytest.mark.parametrize("change", [
    {"options": "Yes"}, {"options": ["Yes"]}, {"options": [True, False]},
    {"variable_key": None}, {"question": 12}, {"why_it_matters": None},
    {"evidence_id": "invented"},
])
def test_follow_up_question_shape_is_validated(change):
    raw = guidance()
    raw["follow_up_questions"] = [dict(question(), **change)]
    with pytest.raises(ValueError, match="schema"):
        validate_workspace_shape(raw, profile_context())


def test_follow_up_questions_cannot_exceed_five():
    raw = guidance()
    raw["follow_up_questions"] = [question(f"dynamic_fact_{index}") for index in range(6)]
    with pytest.raises(ValueError, match="schema"):
        validate_workspace_shape(raw, profile_context())


@pytest.mark.parametrize("field, wording", [
    ("question", "Under Imaginary Licensing Rules 2040, what goods are stored?"),
    ("why_it_matters", "The business must obtain the invented approval."),
    ("options", "AIS-156 is mandatory"),
])
def test_follow_up_question_text_and_choices_are_grounded(field, wording):
    raw = guidance()
    follow_up = question()
    follow_up[field] = [wording, "Other"] if field == "options" else wording
    raw["follow_up_questions"] = [follow_up]
    with pytest.raises(ValueError, match=r"unsupported|unsupplied"):
        validate_workspace_shape(raw, profile_context())


def test_operational_follow_up_options_do_not_require_statutory_evidence():
    raw = guidance()
    raw["follow_up_questions"] = [dict(question(), options=["Small premises", "Large premises"])]
    validate_workspace_shape(raw, profile_context())


def test_follow_up_known_facts_including_false_zero_and_aliases_are_removed():
    raw = guidance()
    raw["follow_up_questions"] = [
        question("dynamic_employee_count", "How many employees work at this business?"),
        question("hazardous_waste", "Does this business generate hazardous waste?"),
        question("connected_power", "What is the connected power load?"),
        question(),
        question("dynamic_storage", "What goods are kept in storage?"),
    ]
    validate_workspace_shape(raw, profile_context())
    normalized = normalize_workspace(raw, [], profile_context())
    assert [item["variable_key"] for item in normalized["follow_up_questions"]] == ["dynamic_storage"]


def test_safe_legacy_cache_preserves_ids_and_does_not_write_or_call_providers(make_business, user):
    business, profile, assessment, row = saved_workspace(make_business, user)
    original = deepcopy(row.payload)
    with patch("domain.intelligence.workspace_guidance.get_llm_provider") as provider, \
         patch("domain.intelligence.regulatory_retrieval.retrieve_regulatory_context") as retrieval, \
         CaptureQueriesContext(connection) as queries:
        projection = get_workspace(business, assessment.id)
    assert projection == original
    assert projection["documents"][0]["requirement_id"] == original["compliance_items"][0]["id"]
    provider.assert_not_called()
    retrieval.assert_not_called()
    assert all(query["sql"].lstrip().upper().startswith("SELECT") for query in queries)
    row.refresh_from_db()
    assert row.payload == original and row.provider_metadata == {}
    assert row.profile_version_id == profile.id


@pytest.mark.parametrize("collection, field, value", [
    ("compliance_items", "why_it_may_apply", "The assessment has 64 employees."),
    ("compliance_items", "rule_version_id", "invented-rule"),
    ("documents", "evidence_id", "invented-evidence"),
    ("workflows", "steps", ["The company must obtain approval"]),
    ("compliance_items", "source_urls", ["https://invented.gov.in/rule"]),
    ("compliance_items", "verification_status", "VERIFIED"),
])
def test_unsafe_legacy_cache_is_hidden_without_repair(make_business, user, collection, field, value):
    business, _, assessment, row = saved_workspace(make_business, user)
    row.payload[collection][0][field] = value
    row.save(update_fields=["payload"])
    original = deepcopy(row.payload)
    with patch("domain.intelligence.workspace_guidance.get_llm_provider") as provider:
        projection = get_workspace(business, assessment.id)
    assert all(rows == [] for rows in projection.values())
    provider.assert_not_called()
    row.refresh_from_db()
    assert row.payload == original


def test_legacy_source_names_without_recorded_provenance_are_stripped_only_in_projection(make_business, user):
    raw = guidance()
    raw["compliance_items"][0].update(source_reference="Invented authority", authority_or_regulator="Invented authority")
    business, _, assessment, row = saved_workspace(make_business, user, raw)
    projection = get_workspace(business, assessment.id)
    item = projection["compliance_items"][0]
    assert item["source_reference"] == item["authority_or_regulator"] == ""
    assert item["id"] == row.payload["compliance_items"][0]["id"]
    row.refresh_from_db()
    assert row.payload["compliance_items"][0]["source_reference"] == "Invented authority"


def test_legacy_recorded_retrieval_supports_exact_source_and_employee_snapshot_still_wins(make_business, user):
    raw = guidance()
    raw["compliance_items"][0].update(description="Example Rules 2040",
        source_reference="Recorded authority", authority_or_regulator="Recorded authority")
    metadata = {"external_retrieval": {"documents": [{"source_id": "test-source",
        "authority": "Recorded authority", "excerpt": "Example Rules 2040 describe an example with 64 employees."}]}}
    business, _, assessment, row = saved_workspace(make_business, user, raw, metadata)
    projection = get_workspace(business, assessment.id)
    assert projection["compliance_items"][0]["source_reference"] == "Recorded authority"
    row.payload["compliance_items"][0]["why_it_may_apply"] = "The assessment has 64 employees."
    row.save(update_fields=["payload"])
    assert get_workspace(business, assessment.id)["compliance_items"] == []


def test_known_follow_up_removed_from_legacy_projection_without_mutation(make_business, user):
    raw = guidance()
    raw["follow_up_questions"] = [question("worker_count", "How many workers are employed?")]
    business, _, assessment, row = saved_workspace(make_business, user, raw)
    assert get_workspace(business, assessment.id)["follow_up_questions"] == []
    row.refresh_from_db()
    assert len(row.payload["follow_up_questions"]) == 1


def test_legacy_follow_up_injection_invalidates_read_projection(make_business, user):
    business, _, assessment, row = saved_workspace(make_business, user)
    row.payload["follow_up_questions"] = [question(text="Which licence is mandatory under Imaginary Rules 2040?")]
    row.save(update_fields=["payload"])
    assert get_workspace(business, assessment.id)["compliance_items"] == []


def test_ensure_workspace_does_not_reuse_invalid_cache(make_business, user):
    business, profile, assessment, row = saved_workspace(make_business, user)
    row.payload["compliance_items"][0]["description"] = "There are 64 employees."
    row.save(update_fields=["payload"])
    with patch("domain.intelligence.workspace_guidance.generate_workspace", return_value={"fresh": True}) as generate:
        assert ensure_workspace(business, assessment, profile, []) == {"fresh": True}
    generate.assert_called_once_with(business, assessment, profile, [], None)


def test_ensure_workspace_preserves_safe_legacy_without_provider(make_business, user):
    business, profile, assessment, row = saved_workspace(make_business, user)
    with patch("domain.intelligence.workspace_guidance.generate_workspace") as generate:
        assert ensure_workspace(business, assessment, profile, []) == row.payload
    generate.assert_not_called()


def test_exact_generation_cache_is_revalidated_and_policy_stamped(make_business, user):
    business, profile, assessment, _ = saved_workspace(make_business, user)
    provider = Mock()
    provider.complete.return_value = CompletionResult(json.dumps(guidance()), "test", "test-model")
    with patch("domain.intelligence.workspace_guidance.get_llm_provider", return_value=provider), \
         patch("apps.assistant.services.retrieve_evidence", return_value=[]), \
         patch("domain.intelligence.regulatory_retrieval.retrieve_regulatory_context", return_value={}):
        first = generate_workspace(business, assessment, profile, [])
        row = WorkspaceGuidance.objects.get(assessment=assessment)
        supplied = json.loads(provider.complete.call_args.args[0][1].content)
        assert supplied["workspace_grounding_policy_version"] == GROUNDING_POLICY_VERSION == 1
        assert row.provider_metadata["workspace_grounding_policy_version"] == 1
        assert row.generation_key == hashlib.sha256(json.dumps(supplied, sort_keys=True).encode()).hexdigest()
        assert generate_workspace(business, assessment, profile, []) == first
        row.payload["compliance_items"][0]["description"] = "The saved assessment has 64 employees."
        row.save(update_fields=["payload"])
        regenerated = generate_workspace(business, assessment, profile, [])
    assert provider.complete.call_count == 2
    assert regenerated["compliance_items"][0]["description"] == guidance()["compliance_items"][0]["description"]
    assert get_workspace(business, assessment.id) == regenerated


def test_cached_generation_cannot_cross_business_or_profile(make_business, user):
    _business, profile, assessment, _ = saved_workspace(make_business, user)
    other = make_business(user, name="Another synthetic business")
    with patch("domain.intelligence.workspace_guidance.get_llm_provider") as provider:
        with pytest.raises(ValueError, match="scoped"):
            ensure_workspace(other, assessment, profile, [])
        assert get_workspace(other, assessment.id)["compliance_items"] == []
    provider.assert_not_called()
