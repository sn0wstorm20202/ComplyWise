"""Dated procedural releases must never leak future instructions into past decisions."""
from copy import deepcopy
from datetime import date

import pytest
from django.core.exceptions import ValidationError

from apps.applicability.engine import ApplicabilityEngine
from apps.applicability.snapshots import current_catalogue_hash
from apps.knowledge.models import RequirementRevision
from apps.knowledge.publication import validate_procedural_metadata
from apps.knowledge.revisions import project_requirements
from tests.test_knowledge_review_connections import candidate_fixture, review_payload


def publish(client, candidate, *, start="2020-01-01", metadata=None):
    payload = review_payload()
    payload.update(effective_from=start, procedural_metadata=metadata or {})
    response = client.post(f"/api/v1/admin/knowledge/{candidate.id}/review", payload, format="json")
    assert response.status_code == 200, response.data
    return RequirementRevision.objects.get(pk=response.data["data"]["requirement_revision_id"])


def clone(candidate):
    candidate.pk = None
    candidate.verification_status = "UNVERIFIED"
    candidate.save()
    return candidate


@pytest.mark.django_db
def test_dated_publication_and_backdated_release_preserve_archives(make_business, user, api_client):
    business, assessment, candidate = candidate_fixture(make_business, user)
    user.is_staff = True; user.save(); api_client.force_authenticate(user)
    first = publish(api_client, candidate, metadata={"required_documents": ["Original checklist"], "statutory_fee": "Original fee"})
    engine = ApplicabilityEngine()
    def evaluate(year):
        return engine.evaluate_business_profile(business=business, profile_version=assessment.profile_version,
            evaluation_date=date(year, 1, 1))
    original = evaluate(2029)
    archived = deepcopy(original.evaluation_manifest)
    future = publish(api_client, clone(candidate), start="2030-01-01",
        metadata={"required_documents": ["Future checklist"], "statutory_fee": "Future fee"})
    past = evaluate(2029)
    later = evaluate(2031)
    def metadata(run):
        return run.evaluation_manifest["requirements"]["fixture-reviewed"]["metadata"]
    assert metadata(past)["required_documents"] == ["Original checklist"]
    assert metadata(later)["required_documents"] == ["Future checklist"]
    assert later.evaluation_manifest["selected_requirement_revisions"]["fixture-reviewed"] == str(future.pk)
    assert past.evaluation_manifest["catalogue_hash"] == current_catalogue_hash()
    backdated = publish(api_client, clone(candidate), start="2025-01-01",
        metadata={"required_documents": []})
    assert backdated.metadata["statutory_fee"] == "Original fee"
    assert metadata(evaluate(2029))["required_documents"] == []
    assert metadata(evaluate(2031))["statutory_fee"] == "Future fee"
    assert evaluate(2031).results.get(requirement_id="fixture-reviewed").rule_version.requirement_revision_id == future.pk
    original.refresh_from_db()
    assert original.evaluation_manifest == archived
    assert evaluate(2019).results.get(requirement_id="fixture-reviewed").status == "UNVERIFIED"
    first.metadata = {"statutory_fee": "Silently changed"}
    with pytest.raises(ValidationError):
        first.save()


@pytest.mark.django_db
def test_expired_or_withdrawn_latest_release_never_revives_previous(make_business, user, api_client, django_assert_num_queries):
    business, assessment, candidate = candidate_fixture(make_business, user)
    user.is_staff = True; user.save(); api_client.force_authenticate(user)
    first = publish(api_client, candidate)
    latest = publish(api_client, clone(candidate), start="2025-01-01")
    requirement = first.requirement
    RequirementRevision.objects.create(requirement=requirement, version=3, effective_from=date(2026, 1, 1),
        name="Unpublished draft", metadata={"required_documents": ["Do not expose"]})
    projected, _, _ = project_requirements([requirement], date(2026, 6, 1))
    assert projected[0]._revision_available
    assert projected[0].name != "Unpublished draft"
    # Simulate independently imported bounded historical releases.
    RequirementRevision.objects.filter(pk=latest.pk).update(effective_until=date(2026, 1, 1))
    with django_assert_num_queries(1):
        definitions, _, selected = project_requirements([requirement] * 20, date(2027, 1, 1))
    assert all(not definition._revision_available and definition.metadata == {} for definition in definitions)
    assert selected[requirement.requirement_id] == str(latest.pk)
    fingerprint = current_catalogue_hash()
    latest.refresh_from_db(); latest.status = "ARCHIVED"; latest.save(update_fields=["status"])
    assert current_catalogue_hash() != fingerprint
    result = ApplicabilityEngine().evaluate_business_profile(business=business,
        profile_version=assessment.profile_version, evaluation_date=date(2025, 6, 1))
    assert result.results.get(requirement_id="fixture-reviewed").status == "UNVERIFIED"


@pytest.mark.parametrize("metadata", [[], {"is_mandatory": True}, {"required_documents": "one"},
    {"application_steps": [""]}, {"statutory_fee": 123}, {"required_documents": ["x"] * 101}])
def test_invalid_procedural_payload_is_rejected(metadata):
    with pytest.raises(ValueError):
        validate_procedural_metadata(metadata)


@pytest.mark.django_db
def test_invalid_procedural_payload_cannot_publish(make_business, user, api_client):
    _, _, candidate = candidate_fixture(make_business, user)
    user.is_staff = True; user.save(); api_client.force_authenticate(user)
    payload = review_payload(); payload["procedural_metadata"] = {"scope_ast": {}}
    response = api_client.post(f"/api/v1/admin/knowledge/{candidate.id}/review", payload, format="json")
    assert response.status_code == 400
    assert not RequirementRevision.objects.exists()
    candidate.evidence.refresh_from_db()
    assert candidate.evidence.verification_status != "VERIFIED"
