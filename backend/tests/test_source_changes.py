import pytest
from apps.ingestion.services import _store_discovered_source
from apps.ingestion.models import SourceChange
from apps.knowledge.models import RequirementDefinition, RuleVersion
from apps.workflows.models import SecurityAuditEvent

pytestmark = pytest.mark.django_db


def test_changed_capture_creates_review_with_impacts_and_preserves_prior_evidence(api_client, user):
    arguments = dict(url="https://regulator.gov.in/synthetic-test", title="Synthetic source", query="fixture", authority_tier="OFFICIAL")
    old, evidence = _store_discovered_source(text="Synthetic old passage", **arguments)
    requirement = RequirementDefinition.objects.create(requirement_id="SOURCE-TEST", name="Synthetic",
        jurisdiction="CENTRAL", domain="TEST", status="PUBLISHED", evidence_refs=[evidence.evidence_id])
    rule = RuleVersion.objects.create(rule_id="SOURCE-RULE", requirement=requirement, status="PUBLISHED",
        condition_ast={"op":"EXISTS", "var":"synthetic_fact"}, evidence_refs=[evidence.evidence_id])
    new, _ = _store_discovered_source(text="Synthetic changed passage", **arguments)
    _store_discovered_source(text="Synthetic changed passage", **arguments)
    change = SourceChange.objects.get()
    assert change.previous_source == old and change.new_source == new
    assert change.affected_rule_ids == [str(rule.id)]
    evidence.refresh_from_db()
    assert evidence.excerpt == "Synthetic old passage"
    api_client.force_authenticate(user)
    url = f"/api/v1/admin/knowledge/source-changes/{change.id}/review"
    assert api_client.post(url, {"decision":"NO_RULE_CHANGE", "reason":"reviewed"}).status_code == 403
    user.is_staff = True; user.save()
    assert api_client.post(url, {"decision":"NO_RULE_CHANGE", "reason":""}).status_code == 400
    assert api_client.post(url, {"decision":"UPDATE_REQUIRED", "reason":"Synthetic changed condition"}).status_code == 200
    event = SecurityAuditEvent.objects.get(action="SOURCE_CHANGE_REVIEW")
    assert event.metadata["previous_hash"] == old.content_hash
    queue = api_client.get("/api/v1/admin/knowledge").json()["data"]["source_changes"]
    assert queue[0]["status"] == "UPDATE_REQUIRED"


def test_reassessment_requires_reviewed_replacement_then_queues_once(api_client, user, business, settings):
    from apps.applicability.engine import ApplicabilityEngine
    from apps.businesses.models import Assessment, AssessmentJob, BusinessProfileVersion
    from apps.businesses.jobs import process_next
    from unittest.mock import patch
    from types import SimpleNamespace
    settings.ENABLE_ASSESSMENT_JOBS = True
    user.is_staff = True; user.save(); api_client.force_authenticate(user)
    args = dict(url="https://regulator.gov.in/reassessment-fixture", title="Synthetic", query="test", authority_tier="OFFICIAL")
    old, evidence = _store_discovered_source(text="Synthetic old", **args)
    old.status = "ACTIVE"; old.save(); evidence.verification_status = "VERIFIED"; evidence.save()
    requirement = RequirementDefinition.objects.create(requirement_id="IMPACT", name="Synthetic", status="PUBLISHED", jurisdiction="CENTRAL")
    rule = RuleVersion.objects.create(rule_id="IMPACT", requirement=requirement, jurisdiction="CENTRAL", status="PUBLISHED",
        condition_ast={"op":"EXISTS", "var":"synthetic"}, evidence_refs=[evidence.evidence_id])
    profile = BusinessProfileVersion.objects.create(business=business, version=1, variables={"synthetic":{"value":True}})
    assessment = Assessment.objects.create(business=business, profile_version=profile, created_by=user)
    recorded = ApplicabilityEngine().evaluate_business_profile(business=business, profile_version=profile, assessment=assessment)
    assessment.decision_run = recorded; assessment.save()
    archive = recorded.cir_snapshot
    new, newer = _store_discovered_source(text="Synthetic new", **args)
    change = SourceChange.objects.get(); change.status = "UPDATE_REQUIRED"; change.save()
    url = f"/api/v1/admin/knowledge/source-changes/{change.id}/reassess"
    assert api_client.post(url).status_code == 409
    newer.verification_status = "VERIFIED"; newer.save()
    RuleVersion.objects.create(rule_id="IMPACT", version=2, supersedes=rule, requirement=requirement,
        jurisdiction="CENTRAL", status="PUBLISHED", condition_ast=rule.condition_ast, evidence_refs=[newer.evidence_id])
    response = api_client.post(url)
    assert response.status_code == 202, response.data
    assert len(response.json()["data"]["job_ids"]) == 1
    assert api_client.post(url).json()["data"]["job_ids"] == response.json()["data"]["job_ids"]
    assert AssessmentJob.objects.count() == 1
    def evaluate(run, stage):
        latest = ApplicabilityEngine().evaluate_business_profile(business=business, profile_version=profile, assessment=assessment)
        Assessment.objects.filter(pk=assessment.pk).update(decision_run=latest)
        return SimpleNamespace(status="COMPLETED", data={"decision_run_id":str(latest.id)})
    with patch("domain.intelligence.orchestration.assessment_orchestrator.execute_stage", side_effect=evaluate):
        assert process_next()
    recorded.refresh_from_db(); assessment.refresh_from_db()
    assert recorded.cir_snapshot == archive and assessment.decision_run_id != recorded.id
