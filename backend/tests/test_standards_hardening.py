"""Standards trust regressions using saved decisions and explicitly synthetic evidence.

These replace the old static-catalog expectations: a company description alone
must never produce an official standard, authority, rule ID or legal decision.
"""
import json
from unittest.mock import Mock, patch

import pytest

from apps.applicability.engine import ApplicabilityEngine
from apps.businesses.models import Assessment, BusinessProfileVersion
from apps.evidence.models import Evidence, Source
from apps.knowledge.models import RequirementDefinition, RuleVersion
from domain.intelligence.standards_discovery import discover_business_standards
from domain.intelligence.workspace_guidance import generate_workspace
from domain.providers.base import CompletionResult, ProviderError
from tests.test_workspace_guidance import interpretation

pytestmark = pytest.mark.django_db


@pytest.fixture
def standard_business(make_business, user):
    business = make_business(user, name="Synthetic charging equipment maker")
    profile = BusinessProfileVersion.objects.create(business=business, version=1, variables={
        "product_description": {"value": "Synthetic charging equipment assembly"},
        "state": {"value": "WEST_BENGAL"}, "is_manufacturing": {"value": True},
        "product_type": {"value": "SYNTHETIC_CHARGING_EQUIPMENT"}})
    assessment = Assessment.objects.create(business=business, profile_version=profile)
    source = Source.objects.create(source_id="synthetic-standard-source", authority="Synthetic standards authority",
        title="Synthetic test standard", canonical_url="https://bis.gov.in/synthetic-test-fixture", status="ACTIVE")
    evidence = Evidence.objects.create(evidence_id="synthetic-standard-passage", source=source,
        excerpt="Synthetic fixture: review the described equipment. This is not regulatory advice.", verification_status="VERIFIED")
    requirement = RequirementDefinition.objects.create(requirement_id="EXAMPLE_EV_STANDARD",
        name="Synthetic charging equipment standard", description="Synthetic test fixture", authority=source.authority,
        jurisdiction="CENTRAL", category="STANDARD", domain="SYNTHETIC_EQUIPMENT", status="PUBLISHED",
        evidence_refs=[evidence.evidence_id])
    rule = RuleVersion.objects.create(requirement=requirement, rule_id="EXAMPLE_EV_RULE", domain=requirement.domain,
        jurisdiction="CENTRAL", status="PUBLISHED", evidence_refs=[evidence.evidence_id],
        condition_ast={"op": "AND", "args": [
            {"op": "EQ", "left": {"var": "is_manufacturing"}, "right": True},
            {"op": "EQ", "left": {"var": "product_type"}, "right": "SYNTHETIC_CHARGING_EQUIPMENT"}]})
    return business, profile, assessment, requirement, rule, evidence


def evaluate(fixture):
    business, profile, assessment, *_ = fixture
    run = ApplicabilityEngine().evaluate_business_profile(business=business, profile_version=profile)
    run.assessment = assessment; run.save()
    assessment.decision_run = run; assessment.save()
    return discover_business_standards(business, assessment_id=assessment.id)


def test_description_without_assessment_does_not_populate_catalog(standard_business):
    business = standard_business[0]
    assert discover_business_standards(business)["standards"] == []


def test_saved_applicable_standard_retains_actual_identity_and_passage(standard_business):
    result = evaluate(standard_business)
    item = result["standards"][0]
    assert item["standard_code"] == "EXAMPLE_EV_STANDARD"
    assert item["title"] == standard_business[3].name
    assert item["rule_version_id"] == str(standard_business[4].id)
    assert item["citations"][0]["evidence_id"] == standard_business[5].evidence_id
    assert item["source_url"] == standard_business[5].source.canonical_url


def test_standard_without_mandatory_metadata_never_claims_mandatory(standard_business):
    assert evaluate(standard_business)["standards"][0]["is_mandatory"] is None


def test_recorded_mandatory_flag_is_preserved(standard_business):
    requirement = standard_business[3]
    requirement.metadata = {"is_mandatory": False}; requirement.save()
    assert evaluate(standard_business)["standards"][0]["is_mandatory"] is False


@pytest.mark.parametrize("status", ["DRAFT", "RETIRED"])
def test_unpublished_standard_is_excluded(standard_business, status):
    requirement = standard_business[3]; requirement.status = status; requirement.save()
    assert evaluate(standard_business)["standards"] == []


def test_unverified_passage_excludes_business_match(standard_business):
    evidence = standard_business[5]; evidence.verification_status = "UNVERIFIED"; evidence.save()
    assert evaluate(standard_business)["standards"] == []


def test_inactive_source_excludes_business_match(standard_business):
    source = standard_business[5].source; source.status = "INACTIVE"; source.save()
    assert evaluate(standard_business)["standards"] == []


def test_nonmatching_profile_excludes_standard(standard_business):
    business, previous, assessment, *tail = standard_business
    variables = dict(previous.variables); variables["is_manufacturing"] = {"value": False}
    profile = BusinessProfileVersion.objects.create(business=business, version=2, variables=variables)
    assessment.profile_version = profile; assessment.save()
    assert evaluate((business, profile, assessment, *tail))["standards"] == []


def test_missing_decision_fact_is_not_a_confirmed_standard(standard_business):
    business, previous, assessment, *tail = standard_business
    variables = {key: value for key, value in previous.variables.items() if key != "is_manufacturing"}
    profile = BusinessProfileVersion.objects.create(business=business, version=2, variables=variables)
    assessment.profile_version = profile; assessment.save()
    assert evaluate((business, profile, assessment, *tail))["standards"] == []


def test_assessments_and_businesses_do_not_share_matches(standard_business, make_business, user):
    assert evaluate(standard_business)["standards"]
    business, profile, assessment, *_ = standard_business
    later = Assessment.objects.create(business=business, profile_version=profile, assessment_number=2)
    assert discover_business_standards(business, assessment_id=later.id)["standards"] == []
    other = make_business(user, name="Synthetic separate business")
    assert discover_business_standards(other, assessment_id=assessment.id)["standards"] == []


def test_contextual_quality_guidance_cannot_manufacture_official_metadata(standard_business):
    business, profile, assessment, *_ = standard_business
    provider = Mock()
    raw = interpretation()
    raw["standards"][0].update(standard_code="FAKE-OFFICIAL-CODE", source_url="https://fabricated.gov.in/standard",
        rule_version_id="fake-rule", citations=[{"evidence_id": "fake-evidence"}], is_mandatory=True)
    provider.complete.return_value = CompletionResult(json.dumps(raw), "synthetic-fixture", "fixture")
    from apps.businesses.models import WorkspaceGuidance
    with patch("domain.intelligence.workspace_guidance.get_llm_provider", return_value=provider):
        with pytest.raises(ProviderError):
            generate_workspace(business, assessment, profile, [])
    assert not WorkspaceGuidance.objects.filter(assessment=assessment).exists()
    assert not any(item.get("result_origin") == "LLM_FALLBACK_RESULT" for item in discover_business_standards(business, assessment_id=assessment.id)["standards"])
