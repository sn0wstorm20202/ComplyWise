"""Candidate text is not a product-scope decision; explanations use recorded facts."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import Mock, patch

import pytest

from apps.applicability.engine import ApplicabilityEngine
from apps.businesses.models import Assessment, BusinessProfileVersion
from apps.evidence.models import Evidence, Source
from apps.evidence.presentation import exact_source_url
from apps.knowledge.models import RequirementDefinition, RuleVersion
from apps.requirements.presentation import requirement_reason_summary
from common.enums import ApplicabilityStatus
from domain.intelligence.orchestration import (
    AssessmentStage,
    LLMFirstStrategy,
    OrchestrationContext,
    SchemeResult,
    StandardResult,
)


@pytest.fixture
def standard_rule(business):
    source = Source.objects.create(source_id="S-SCOPE", title="Synthetic product scope",
                                   authority="Test Authority", canonical_url="https://example.org/rules/scope")
    evidence = Evidence.objects.create(evidence_id="E-SCOPE", source=source,
                                      excerpt="Synthetic test scope", verification_status="VERIFIED")
    definition = RequirementDefinition.objects.create(
        requirement_id="R-SCOPE", name="Synthetic product standard", category="STANDARD",
        authority="Test Authority", jurisdiction="CENTRAL", domain="ELECTRONICS",
        status="PUBLISHED", evidence_refs=[evidence.evidence_id])
    rule = RuleVersion.objects.create(rule_id="RULE-SCOPE", requirement=definition,
                                     status="PUBLISHED", evidence_refs=[evidence.evidence_id],
                                     condition_ast={"op": "CONTAINS", "left": {"var": "product_description"},
                                                    "right": "electronic"})
    return definition, rule


def decide(business, facts):
    profile = BusinessProfileVersion.objects.create(business=business, version=business.profile_versions.count()+1,
                                                   variables={key: {"value": value} for key,value in facts.items()})
    return ApplicabilityEngine().evaluate_business_profile(business=business, profile_version=profile).results.get(requirement_id="R-SCOPE")


@pytest.mark.django_db
def test_broad_electronics_keyword_is_not_mandatory_product_scope(business, standard_rule):
    result = decide(business, {"product_description": "Traction battery packs with electronic BMS components"})
    assert result.status == ApplicabilityStatus.UNVERIFIED
    assert result.explanation_trace["evidence_reason"] == "PRODUCT_SCOPE_NOT_ESTABLISHED"
    assert result.evidence_refs[0]["evidence_id"] == "E-SCOPE"


@pytest.mark.django_db
def test_typed_scope_with_evidence_can_decide_product_standard(business, standard_rule):
    _, rule = standard_rule
    rule.condition_ast = {"op": "EQ", "left": {"var": "product_category"}, "right": "SYNTHETIC_CATEGORY"}
    rule.save()
    assert decide(business, {"product_category": "SYNTHETIC_CATEGORY"}).status == ApplicabilityStatus.APPLICABLE
    assert decide(business, {"product_category": "OTHER"}).status == ApplicabilityStatus.NOT_APPLICABLE
    assert decide(business, {}).status == ApplicabilityStatus.NEEDS_INFORMATION


@pytest.mark.django_db
@pytest.mark.parametrize("category,expected", [
    ("OTHER", "NOT_APPLICABLE"), (None, "NEEDS_INFORMATION"), ("SYNTHETIC_CATEGORY", "APPLICABLE")])
def test_explicit_scope_ast_constrains_broad_candidate_rule(business, standard_rule, category, expected):
    definition, _ = standard_rule
    definition.metadata = {"scope_ast": {"op": "EQ", "left": {"var": "product_category"}, "right": "SYNTHETIC_CATEGORY"}}
    definition.save()
    result = decide(business, {"product_description": "Electronic equipment", "product_category": category})
    assert result.status == expected
    assert result.explanation_trace["scope_evaluation"]["result"] == {"APPLICABLE": "TRUE", "NOT_APPLICABLE": "FALSE", "NEEDS_INFORMATION": "UNKNOWN"}[expected]


@pytest.mark.django_db
def test_or_branch_cannot_bypass_typed_scope_guard(business, standard_rule):
    _, rule = standard_rule
    rule.condition_ast = {"op": "OR", "args": [rule.condition_ast,
        {"op": "EQ", "left": {"var": "product_category"}, "right": "SYNTHETIC_CATEGORY"}]}
    rule.save()
    assert decide(business, {"product_description": "Electronic components"}).status == ApplicabilityStatus.UNVERIFIED


@pytest.mark.django_db
def test_tautology_and_lowercase_standard_cannot_promote_mandatory_scope(business, standard_rule):
    definition, rule = standard_rule
    definition.category = "standard"
    definition.save()
    rule.condition_ast = {"op": "EQ", "left": {"var": "product_type"}, "right": {"var": "product_type"}}
    rule.save()
    assert decide(business, {"product_type": "ANY"}).status == ApplicabilityStatus.UNVERIFIED


@pytest.mark.django_db
def test_invalid_scope_is_isolated_to_its_requirement(business, standard_rule):
    definition, _ = standard_rule
    definition.metadata = {"scope_ast": {"op": "UNSUPPORTED"}}
    definition.save()
    result = decide(business, {"product_description": "Electronic components"})
    assert result.status == ApplicabilityStatus.UNVERIFIED
    assert result.explanation_trace["evidence_reason"] == "INVALID_PRODUCT_SCOPE"
    assert result.decision_run.status == "COMPLETED"


@pytest.mark.django_db
def test_legacy_claim_is_cautious_in_ui_without_mutating_history(business, standard_rule, auth_client):
    result = decide(business, {"product_description": "Electronic components"})
    result.status = "APPLICABLE"  # historical result before product-scope guard
    result.save()
    assessment = Assessment.objects.create(business=business, profile_version=result.decision_run.profile_version,
                                           decision_run=result.decision_run)
    response = auth_client.get(f"/api/v1/businesses/{business.id}/compliance?assessment_id={assessment.id}")
    row = response.data["data"]["requirements"][0]
    assert row["status"] == "UNVERIFIED" and row["recorded_status"] == "APPLICABLE"
    result.refresh_from_db()
    assert result.status == "APPLICABLE"


@pytest.mark.django_db
def test_analysis_status_is_a_read_not_a_new_analysis(business, auth_client):
    from unittest.mock import patch
    assessment = Assessment.objects.create(business=business, status="IN_PROGRESS",
        step_state={"current_stage": "REGULATORY_DISCOVERY"})
    with patch("domain.intelligence.orchestration.orchestrate_compliance_analysis") as orchestrate:
        response = auth_client.get(f"/api/v1/businesses/{business.id}/analysis/status?assessment_id={assessment.id}")
    assert response.status_code == 200
    assert response.data["data"]["current_stage"] == "REGULATORY_DISCOVERY"
    orchestrate.assert_not_called()


@pytest.mark.django_db
def test_analysis_without_snapshot_does_not_use_mutable_business_profile(business, auth_client):
    BusinessProfileVersion.objects.create(business=business, version=1,
        variables={"product_description": {"value": "A later mutable profile"}})
    assessment = Assessment.objects.create(business=business)
    response = auth_client.post(f"/api/v1/businesses/{business.id}/analysis/orchestrate",
                                {"assessment_id": str(assessment.id)}, format="json")
    assert response.status_code == 400
    assert response.data["error"]["code"] == "STAGE_INPUT_INVALID"


@pytest.mark.django_db
def test_empty_assessment_context_does_not_inherit_a_later_business_profile(business):
    assessment = Assessment.objects.create(business=business)
    BusinessProfileVersion.objects.create(business=business, version=1,
        variables={"product_description": {"value": "Later unrelated operations"}})
    context = OrchestrationContext.from_business(business, assessment=assessment)
    assert context.raw_business_description == "" and context.normalized_facts == {}
    assert context.profile_version_id is None


@pytest.mark.django_db
def test_business_name_never_fills_missing_product_fact(business, standard_rule):
    business.name = "Electronic Manufacturing"
    business.save()
    assert decide(business, {}).status == ApplicabilityStatus.NEEDS_INFORMATION


@pytest.mark.django_db
def test_explanation_reads_decision_facts_not_copied_catalogue_description(business, standard_rule):
    definition, rule = standard_rule
    definition.description = "A historical template describing unrelated exports of synthetic garments."
    definition.category = "REGISTRATION"
    definition.save()
    rule.condition_ast = {"op": "EQ", "left": {"var": "import_export_intent"}, "right": "IMPORT_ONLY"}
    rule.save()
    result = decide(business, {"import_export_intent": "IMPORT_ONLY"})
    summary = requirement_reason_summary(result.explanation_trace, definition)
    assert "IMPORT_ONLY" in summary
    assert "garments" not in summary and "exports of synthetic" not in summary
    # Editing a later profile must not change the persisted trace explanation.
    decide(business, {"import_export_intent": "NONE"})
    assert requirement_reason_summary(result.explanation_trace, definition) == summary


@pytest.mark.django_db
@pytest.mark.parametrize("source_url,expected", [
    ("https://example.org/regulations/actual-source.pdf", "https://example.org/regulations/actual-source.pdf"),
    ("https://example.org/", ""), ("", "")])
def test_compliance_source_is_evidence_url_never_application_portal(business, standard_rule, auth_client, source_url, expected):
    definition, _ = standard_rule
    definition.category = "REGISTRATION"
    definition.metadata = {"portal": "https://example.org/application-portal"}
    definition.save()
    source = Source.objects.get(source_id="S-SCOPE")
    source.canonical_url = source_url
    source.save()
    result = decide(business, {"product_description": "Electronic assembly"})
    assessment = Assessment.objects.create(business=business, profile_version=result.decision_run.profile_version,
                                           decision_run=result.decision_run)
    result.decision_run.assessment = assessment
    result.decision_run.save()
    for suffix in ("compliance", "compliance/R-SCOPE"):
        response = auth_client.get(f"/api/v1/businesses/{business.id}/{suffix}?assessment_id={assessment.id}")
        assert response.status_code == 200
        data = response.data["data"]
        row = data["requirements"][0] if suffix == "compliance" else data
        assert row["source_url"] == expected
        citation = row.get("citations", row.get("statutory_evidence", []))[0]
        assert citation["source_id"] == "S-SCOPE"
        assert citation["source_title"] == source.title
        assert citation["excerpt"] == "Synthetic test scope"
        assert citation["canonical_url"] == (expected or None)


def test_orchestration_projection_preserves_candidate_source_and_separates_application():
    source = {"url": "https://example.org/support/terms.pdf", "reviewed": False}
    scheme = SchemeResult("S", "Support candidate", "Test", "CENTRAL", "SUPPORT", "Terms", "Unresolved", source["url"],
        extra={"status": "CANDIDATE", "eligibility_status": "CANDIDATE", "source": source,
               "evidence": [], "portal_url": "https://example.org/apply", "matched_facts": ["state"]})
    run = SimpleNamespace(stage_metadata={}, run_id="assessment", save=Mock())
    context = OrchestrationContext(business_id="business", business_name="Business", correlation_id="correlation")
    with patch("domain.intelligence.orchestration.DefaultSchemeProvider") as provider:
        provider.return_value.discover_schemes.return_value = [scheme]
        result = LLMFirstStrategy().execute_stage(AssessmentStage.SCHEMES, context, run)
    row = result.data["schemes"][0]
    assert row["status"] == "CANDIDATE" and row["eligibility_status"] == "CANDIDATE"
    assert row["source"] == source and row["source_url"] == source["url"]
    assert row["application_url"] == "https://example.org/apply"


def test_orchestration_citation_does_not_imply_verification_or_mandatory_status():
    standard = StandardResult("S", "Candidate standard", "Test", "STANDARD", "Recorded facts", None, "",
        extra={"source": {"url": None, "reviewed": False}, "status": "NEEDS_REVIEW",
               "citations": [{"evidence_id": "E", "verification_status": "UNVERIFIED"}]})
    run = SimpleNamespace(stage_metadata={"standards": {"standards": [{"verification_status": "VERIFIED"}]}},
                          run_id="assessment", save=Mock())
    context = OrchestrationContext(business_id="business", business_name="Business", correlation_id="correlation")
    with patch("domain.intelligence.orchestration.DefaultStandardsProvider") as provider:
        provider.return_value.discover_standards.return_value = [standard]
        result = LLMFirstStrategy().execute_stage(AssessmentStage.STANDARDS, context, run)
        provider.return_value.discover_standards.assert_called_once()
    row = result.data["standards"][0]
    assert row["verification_status"] == "NEEDS_VERIFICATION"
    assert row["mandatory_status"] == "UNKNOWN" and row["status"] == "NEEDS_REVIEW"


def test_captured_login_path_is_not_an_exact_document_link():
    assert exact_source_url("https://example.gov.in/Login.aspx/path/to/circular") is None
    assert exact_source_url("https://example.gov.in/search.php?document=123") is None
    assert exact_source_url("https://example.gov.in/circular/actual-document.pdf") == "https://example.gov.in/circular/actual-document.pdf"
