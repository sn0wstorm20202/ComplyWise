from copy import deepcopy
import pytest
from django.core.exceptions import ValidationError
from apps.knowledge.publication import validate_publication
from tests.test_knowledge_review_connections import candidate_fixture, review_payload
from apps.knowledge.models import RuleVersion


def test_threshold_examples_execute_real_three_valued_engine():
    ast = {"op":"GTE", "left":{"var":"synthetic_count"}, "right":10}
    examples = [
        {"kind":"positive", "facts":{"synthetic_count":10}, "expected_truth":"TRUE"},
        {"kind":"negative", "facts":{"synthetic_count":9}, "expected_truth":"FALSE"},
        {"kind":"missing", "facts":{}, "expected_truth":"UNKNOWN"}]
    validate_publication(ast, "2026-01-01", None, examples)
    bad = deepcopy(examples); bad[0]["facts"]["synthetic_count"] = 9
    with pytest.raises(ValueError, match="failed"):
        validate_publication(ast, "2026-01-01", None, bad)
    with pytest.raises(ValueError):
        validate_publication(ast, "2026-01-01", "2025-01-01", examples)


@pytest.mark.django_db
def test_publication_api_requires_review_proof_and_seals_review(make_business, user, other_user, api_client):
    _, _, candidate = candidate_fixture(make_business, user)
    other_user.is_staff = True; other_user.save(); api_client.force_authenticate(other_user)
    url = f"/api/v1/admin/knowledge/{candidate.id}/review"
    payload = review_payload(); payload.pop("examples")
    assert api_client.post(url, payload, format="json").status_code == 400
    assert not RuleVersion.objects.filter(rule_id="fixture-rule").exists()
    assert api_client.post(url, review_payload(), format="json").status_code == 200
    rule = RuleVersion.objects.get(rule_id="fixture-rule")
    assert rule.review_record["source_hash"]
    assert len(rule.review_record["examples"]) == 3
    rule.condition_ast = {"op":"MISSING", "var":"product_description"}
    with pytest.raises(ValidationError):
        rule.save()


@pytest.mark.django_db
def test_next_rule_version_preserves_old_effective_evaluations(make_business, user, api_client):
    from datetime import date
    from apps.ingestion.models import CandidateRequirement
    from apps.applicability.engine import ApplicabilityEngine
    business, assessment, candidate = candidate_fixture(make_business, user)
    user.is_staff = True; user.save(); api_client.force_authenticate(user)
    assert api_client.post(f"/api/v1/admin/knowledge/{candidate.id}/review", review_payload(), format="json").status_code == 200
    original = RuleVersion.objects.get(rule_id="fixture-rule")
    candidate.pk = None; candidate.verification_status = "UNVERIFIED"; candidate.save()
    payload = review_payload(); payload["effective_from"] = "2030-01-01"
    response = api_client.post(f"/api/v1/admin/knowledge/{candidate.id}/review", payload, format="json")
    assert response.status_code == 200, response.data
    replacement = RuleVersion.objects.get(rule_id="fixture-rule", version=2)
    assert replacement.supersedes == original
    engine = ApplicabilityEngine()
    prior = engine.evaluate_business_profile(business=business, profile_version=assessment.profile_version, evaluation_date=date(2029,1,1))
    future = engine.evaluate_business_profile(business=business, profile_version=assessment.profile_version, evaluation_date=date(2031,1,1))
    assert prior.results.get(requirement_id="fixture-reviewed").rule_version_id == original.id
    assert future.results.get(requirement_id="fixture-reviewed").rule_version_id == replacement.id
