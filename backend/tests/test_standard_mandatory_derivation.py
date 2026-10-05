"""A relevant standard does not make its preparation documents mandatory."""
import pytest

from apps.applicability.engine import ApplicabilityEngine
from apps.requirements.presentation import standard_mandatory_status
from domain.intelligence.standards_discovery import discover_business_standards
from tests.test_standards_hardening import standard_business as standard_business

pytestmark = pytest.mark.django_db


@pytest.fixture
def mandatory_decision(standard_business):
    business, profile, assessment, definition, rule, evidence = standard_business
    definition.metadata = {
        "is_mandatory": True,
        "mandatory_reference": {"rule_id": rule.rule_id, "evidence_ids": [evidence.evidence_id]},
    }
    definition.save(update_fields=["metadata"])
    run = ApplicabilityEngine().evaluate_business_profile(business=business, profile_version=profile)
    run.assessment = assessment
    run.save(update_fields=["assessment"])
    assessment.decision_run = run
    assessment.save(update_fields=["decision_run"])
    decision = run.results.get(requirement_id=definition.requirement_id)
    decision.rule_version = rule
    return decision, definition, rule, evidence, business, assessment


def test_mandatory_status_requires_bound_actual_rule_and_passage(mandatory_decision):
    decision, definition, *_ = mandatory_decision
    assert standard_mandatory_status(decision, definition) is True


def test_explicit_voluntary_standard_stays_false_without_a_mandate(mandatory_decision):
    decision, definition, *_ = mandatory_decision
    definition.metadata = {"is_mandatory": False}
    assert standard_mandatory_status(decision, definition) is False
    assert standard_mandatory_status(None, definition) is False


@pytest.mark.parametrize("metadata", [
    {}, {"is_mandatory": True}, {"is_mandatory": "true"},
    {"is_mandatory": True, "mandatory_reference": {"rule_id": "another-rule", "evidence_ids": ["missing"]}},
    {"is_mandatory": True, "mandatory_reference": {"evidence_ids": []}},
    {"is_mandatory": True, "mandatory_reference": {"evidence_ids": [{"evidence_id": "missing"}]}},
])
def test_flag_or_unbound_metadata_is_unknown(mandatory_decision, metadata):
    decision, definition, *_ = mandatory_decision
    definition.metadata = metadata
    assert standard_mandatory_status(decision, definition) is None


@pytest.mark.parametrize("change", ["decision_refs", "rule_refs", "rule_owner", "decision_owner", "decision_status"])
def test_mandatory_binding_cannot_cross_decision_or_rule_identity(mandatory_decision, change):
    decision, definition, rule, *_ = mandatory_decision
    if change == "decision_refs":
        decision.evidence_refs = []
    elif change == "rule_refs":
        rule.evidence_refs = []
    elif change == "rule_owner":
        rule.requirement_id = None
    elif change == "decision_owner":
        decision.requirement_id = "another-requirement"
    else:
        decision.status = "NOT_APPLICABLE"
    assert standard_mandatory_status(decision, definition) is None


@pytest.mark.parametrize("change", ["unverified", "inactive", "empty", "generic_url", "invalid_redirect"])
def test_mandatory_status_requires_valid_recorded_evidence(mandatory_decision, change):
    decision, definition, _, evidence, *_ = mandatory_decision
    if change == "unverified":
        evidence.verification_status = "UNVERIFIED"
        evidence.save(update_fields=["verification_status"])
    elif change == "empty":
        evidence.excerpt = " "
        evidence.save(update_fields=["excerpt"])
    else:
        source = evidence.source
        if change == "inactive":
            source.status = "INACTIVE"
        elif change == "generic_url":
            source.canonical_url = "https://bis.gov.in/"
        else:
            source.metadata = {"final_url": "https://unofficial.example/unrelated.pdf"}
        source.save()
    assert standard_mandatory_status(decision, definition) is None


def test_historical_narrative_match_cannot_establish_mandatory_status(mandatory_decision):
    decision, definition, *_ = mandatory_decision
    decision.explanation_trace = {"evaluations": [{"truth_value": "TRUE", "trace": {
        "op": "CONTAINS", "result": "TRUE", "variables_used": {"product_description": "electronic equipment"},
    }}]}
    assert standard_mandatory_status(decision, definition) is None


def test_standard_list_reuses_nullable_mandatory_projection(mandatory_decision):
    decision, definition, _, _, business, assessment = mandatory_decision
    rows = discover_business_standards(business, assessment_id=assessment.id)["standards"]
    assert rows[0]["is_mandatory"] is standard_mandatory_status(decision, definition)
    definition.metadata = {"is_mandatory": True}
    definition.save(update_fields=["metadata"])
    assert discover_business_standards(business, assessment_id=assessment.id)["standards"][0]["is_mandatory"] is None
