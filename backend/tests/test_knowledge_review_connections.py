"""Explicit human publication of captured claims reaches the saved user result."""
import hashlib

import pytest
from rest_framework.test import APIClient

from apps.ingestion.models import CandidateRequirement, DiscoveryRun
from apps.ingestion.services import _store_discovered_source
from apps.knowledge.models import RequirementDefinition, RuleVersion
from apps.workflows.models import SecurityAuditEvent
from tests.test_workspace_guidance import setup_assessment

pytestmark = pytest.mark.django_db


def candidate_fixture(make_business, user):
    business, profile, assessment = setup_assessment(make_business, user)
    text = "Synthetic test statement: drone filming records need a review. This is a test fixture."
    source, evidence = _store_discovered_source(url="https://dgca.gov.in/fixture", title="Synthetic source",
        text=text, query="drone filming records", authority_tier="OFFICIAL")
    run = DiscoveryRun.objects.create(business=business, assessment=assessment, status="COMPLETED")
    candidate = CandidateRequirement.objects.create(discovery_run=run, business=business, requirement_name="Synthetic recorded review",
        category="COMPLIANCE", authority="Synthetic fixture authority", jurisdiction="CENTRAL", source=source,
        evidence=evidence, applicability_statement=text, document_requirements=["Recorded test checklist"])
    return business, assessment, candidate


def review_payload():
    return {"decision": "PUBLISH", "reason": "Reviewed the synthetic captured statement", "requirement_id": "fixture-reviewed",
        "rule_id": "fixture-rule", "condition_ast": {"op": "EXISTS", "var": "product_description"}}


def test_reviewer_publication_persists_audit_and_user_result(make_business, user, other_user, auth_client):
    business, assessment, candidate = candidate_fixture(make_business, user)
    url = f"/api/v1/admin/knowledge/{candidate.id}/review"
    assert auth_client.post(url, review_payload(), format="json").status_code == 403
    other_user.is_staff = True; other_user.save()
    reviewer = APIClient(); reviewer.force_authenticate(other_user)
    result = reviewer.post(url, review_payload(), format="json")
    assert result.status_code == 200, result.data
    assert SecurityAuditEvent.objects.filter(action="KNOWLEDGE_PUBLISH", actor_user=other_user).exists()
    assert RuleVersion.objects.get(rule_id="fixture-rule").status == "PUBLISHED"
    assessment.refresh_from_db()
    decision = assessment.decision_run.results.get(requirement_id="fixture-reviewed")
    assert decision.status == "APPLICABLE"
    assert candidate.evidence.evidence_id in [r["evidence_id"] for r in decision.evidence_refs]
    response = auth_client.get(f"/api/v1/businesses/{business.id}/compliance?assessment_id={assessment.id}")
    assert response.status_code == 200, response.data
    assert any(item["requirement_id"] == "fixture-reviewed" and item["status"] == "APPLICABLE" for item in response.data["data"]["requirements"])
    assert reviewer.post(url, review_payload(), format="json").status_code == 409


def test_publication_rejects_nonverbatim_capture_without_publishing(make_business, user, other_user):
    business, assessment, candidate = candidate_fixture(make_business, user)
    candidate.evidence.excerpt = "A fabricated claim not present in the captured fixture."
    candidate.evidence.save()
    other_user.is_staff = True; other_user.save()
    reviewer = APIClient(); reviewer.force_authenticate(other_user)
    result = reviewer.post(f"/api/v1/admin/knowledge/{candidate.id}/review", review_payload(), format="json")
    assert result.status_code == 400
    assert not RequirementDefinition.objects.filter(requirement_id="fixture-reviewed").exists()
    assert not RuleVersion.objects.filter(rule_id="fixture-rule").exists()


def test_case_treatment_reaches_user_actions_without_overwriting_engine(make_business, user, other_user, auth_client):
    from apps.workflows.models import ComplianceCase
    from apps.workflows.services.disposition_service import CaseRequirementDispositionService
    from apps.applicability.engine import ApplicabilityEngine
    business, assessment, candidate = candidate_fixture(make_business, user)
    candidate.source.status = "ACTIVE"; candidate.source.save()
    candidate.evidence.verification_status = "VERIFIED"; candidate.evidence.save()
    definition = RequirementDefinition.objects.create(requirement_id="fixture-treatment", name="Synthetic review",
        authority="Synthetic", jurisdiction="CENTRAL", domain="FIXTURE", status="PUBLISHED",
        evidence_refs=[candidate.evidence.evidence_id])
    RuleVersion.objects.create(requirement=definition, rule_id="fixture-treatment-rule", domain="FIXTURE",
        jurisdiction="CENTRAL", status="PUBLISHED", evidence_refs=definition.evidence_refs,
        condition_ast={"op": "EXISTS", "var": "product_description"})
    run = ApplicabilityEngine().evaluate_business_profile(business=business, profile_version=assessment.profile_version)
    run.assessment = assessment; run.save()
    assessment.decision_run = run; assessment.save()
    case = ComplianceCase.objects.create(business=business, assessment=assessment, case_number="fixture-case",
        profile_version=assessment.profile_version, requirement=definition, requirement_id_code=definition.requirement_id)
    other_user.is_staff = True; other_user.save()
    CaseRequirementDispositionService.mark_not_required(case, definition.requirement_id,
        reason="Already covered by a recorded business approval", reviewer_user=other_user)
    listed = auth_client.get(f"/api/v1/businesses/{business.id}/compliance?assessment_id={assessment.id}").data["data"]["requirements"]
    item = next(r for r in listed if r["requirement_id"] == definition.requirement_id)
    assert item["status"] == "APPLICABLE" and item["user_action_required"] is False
    assert item["admin_disposition"] == "NOT_REQUIRED" and item["review_reason"]
    assert run.results.get(requirement_id=definition.requirement_id).status == "APPLICABLE"


def test_catalog_assignment_reaches_workspace_without_creating_rule(make_business, user, other_user, auth_client):
    from apps.applicability.engine import ApplicabilityEngine
    from apps.workflows.models import ComplianceCase
    from apps.workflows.services.disposition_service import CaseRequirementDispositionService
    business, assessment, _ = candidate_fixture(make_business, user)
    run = ApplicabilityEngine().evaluate_business_profile(business=business, profile_version=assessment.profile_version)
    run.assessment = assessment; run.save()
    assessment.decision_run = run; assessment.save()
    definition = RequirementDefinition.objects.create(requirement_id="synthetic-manual-record",
        name="Synthetic reviewer requested records", domain="FIXTURE", jurisdiction="CENTRAL", status="DRAFT",
        metadata={"required_documents": ["Synthetic business activity record"]})
    case = ComplianceCase.objects.create(business=business, assessment=assessment, case_number="manual-fixture",
        profile_version=assessment.profile_version, requirement_id_code="synthetic-original-case")
    other_user.is_staff = True; other_user.save()
    CaseRequirementDispositionService.add_catalog_requirement(case, definition.requirement_id,
        reviewer_user=other_user, reason="Prepare the activity records discussed during review")
    for section, key in [("compliance", "requirements"), ("documents", "documents"), ("workflows", "workflows")]:
        result = auth_client.get(f"/api/v1/businesses/{business.id}/{section}?assessment_id={assessment.id}")
        assert result.status_code == 200, result.data
        item = next(row for row in result.data["data"][key] if row["requirement_id"] == definition.requirement_id)
        assert item["result_origin"] == "HUMAN_REVIEW_RESULT"
    assert not RuleVersion.objects.filter(requirement=definition).exists()
    assert not run.results.filter(requirement_id=definition.requirement_id).exists()
    detail = auth_client.get(f"/api/v1/businesses/{business.id}/requirements/{definition.requirement_id}?assessment_id={assessment.id}")
    # Detail routing uses the established compliance URL.
    if detail.status_code == 404:
        detail = auth_client.get(f"/api/v1/businesses/{business.id}/compliance/{definition.requirement_id}?assessment_id={assessment.id}")
    assert detail.status_code == 200 and detail.data["data"]["reviewer_assignment"] is True
