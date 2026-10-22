from datetime import timedelta
from types import SimpleNamespace
from unittest.mock import patch

import pytest
from django.utils import timezone
from apps.businesses.models import Assessment, AssessmentJob, BusinessProfileVersion
from apps.businesses.jobs import enqueue, process_next, JobConflict

pytestmark = pytest.mark.django_db


@pytest.fixture
def assessment(business, user):
    profile = BusinessProfileVersion.objects.create(business=business, version=1, variables={})
    return Assessment.objects.create(business=business, created_by=user, profile_version=profile)


def test_api_to_worker_to_result_is_durable_and_tenant_scoped(assessment, user, auth_client, other_user, settings):
    settings.ENABLE_ASSESSMENT_JOBS = True
    url = f"/api/v1/assessments/{assessment.id}/jobs/"
    response = auth_client.post(url, {"stage":"COMPLIANCE_SYNTHESIS"}, format="json")
    assert response.status_code == 202
    assert response["Retry-After"] == "2"
    again = auth_client.post(url, {"stage":"COMPLIANCE_SYNTHESIS"}, format="json")
    assert again.json()["data"]["job_id"] == response.json()["data"]["job_id"]
    def evaluate(run, stage):
        from apps.applicability.engine import ApplicabilityEngine
        decision = ApplicabilityEngine().evaluate_business_profile(business=run.assessment.business, profile_version=run.assessment.profile_version)
        return SimpleNamespace(status="COMPLETED", data={"decision_run_id":str(decision.id)})
    with patch("domain.intelligence.orchestration.assessment_orchestrator.execute_stage", side_effect=evaluate) as execute:
        assert process_next()
        assert not process_next()
        execute.assert_called_once()
    detail = auth_client.get(response["Location"])
    assert detail.json()["data"]["status"] == "SUCCEEDED"
    assert detail.json()["data"]["result"]["decision_run_id"]
    auth_client.force_authenticate(other_user)
    assert auth_client.get(response["Location"]).status_code == 404
    assert auth_client.post(url, {"stage":"COMPLIANCE_SYNTHESIS"}, format="json").status_code == 404


def test_stale_inputs_cannot_execute(assessment, user):
    job = enqueue(assessment, user, "REGULATORY_DISCOVERY")
    assessment.step_state = {"stage_metadata":{"answers":{"q":"changed"}}}; assessment.save()
    with patch("domain.intelligence.orchestration.assessment_orchestrator.execute_stage") as execute:
        assert process_next()
        execute.assert_not_called()
    job.refresh_from_db()
    assert job.error_code == "INPUT_CHANGED"


def test_failed_work_rolls_back_domain_writes_and_retries(assessment, user):
    job = enqueue(assessment, user, "REGULATORY_DISCOVERY")
    def failed(run, stage):
        Assessment.objects.filter(pk=assessment.pk).update(title="Should roll back")
        raise TimeoutError("provider credentials must not be stored")
    with patch("domain.intelligence.orchestration.assessment_orchestrator.execute_stage", side_effect=failed):
        process_next()
    job.refresh_from_db(); assessment.refresh_from_db()
    assert assessment.title != "Should roll back"
    assert job.status == "QUEUED" and job.attempts == 1
    assert job.error_code == "DEPENDENCY_UNAVAILABLE"
    job.available_at = timezone.now() - timedelta(seconds=1); job.save()
    with patch("domain.intelligence.orchestration.assessment_orchestrator.execute_stage", return_value=SimpleNamespace(status="COMPLETED", data={"ok":True})):
        process_next()
    job.refresh_from_db()
    assert job.status == "SUCCEEDED" and job.attempts == 2


def test_expired_worker_lease_is_recovered(assessment, user):
    job = enqueue(assessment, user, "REGULATORY_DISCOVERY")
    job.status = "RUNNING"; job.attempts = 1; job.lease_until = timezone.now() - timedelta(seconds=1); job.save()
    with patch("domain.intelligence.orchestration.assessment_orchestrator.execute_stage", return_value=SimpleNamespace(status="COMPLETED", data={})):
        process_next()
    job.refresh_from_db()
    assert job.status == "SUCCEEDED" and job.attempts == 2


def test_conflicting_retry_key_rejected(assessment, user):
    enqueue(assessment, user, "REGULATORY_DISCOVERY", idempotency_key="same")
    with pytest.raises(JobConflict):
        enqueue(assessment, user, "COMPLIANCE_SYNTHESIS", idempotency_key="same")


def test_lost_refresh_response_can_resume_the_active_operation(assessment, user):
    first = enqueue(assessment, user, "REGULATORY_DISCOVERY", idempotency_key="refresh-first", force_refresh=True)
    again = enqueue(assessment, user, "REGULATORY_DISCOVERY", idempotency_key="refresh-reconnect", force_refresh=True)
    assert again.id == first.id


def test_feature_flag_preserves_deployment_compatibility(assessment, auth_client, settings):
    settings.ENABLE_ASSESSMENT_JOBS = False
    response = auth_client.post(f"/api/v1/assessments/{assessment.id}/jobs/", {"stage":"REGULATORY_DISCOVERY"}, format="json")
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "ASYNC_DISABLED"


@pytest.mark.parametrize("enabled", [False, True])
def test_processing_mode_is_read_only_and_tenant_scoped(assessment, auth_client, other_user, settings, enabled):
    settings.ENABLE_ASSESSMENT_JOBS = enabled
    url = f"/api/v1/assessments/{assessment.id}/jobs/"
    response = auth_client.get(url)
    assert response.status_code == 200
    assert response.json()["data"] == {"background_processing_enabled": enabled}
    assert "no-store" in response["Cache-Control"]
    assert not AssessmentJob.objects.exists()
    auth_client.force_authenticate(other_user)
    assert auth_client.get(url).status_code == 404


def test_pending_job_blocks_answer_mutation_and_malformed_stage_is_400(assessment, user, auth_client, settings):
    settings.ENABLE_ASSESSMENT_JOBS = True
    assert auth_client.post(f"/api/v1/assessments/{assessment.id}/jobs/", {"stage":[]}, format="json").status_code == 400
    enqueue(assessment, user, "REGULATORY_DISCOVERY")
    response = auth_client.post(f"/api/v1/assessments/{assessment.id}/answers", {"answers":{"q":"value"}}, format="json")
    assert response.status_code == 409


def test_question_generation_runs_through_worker_with_legacy_response_contract(assessment, user, auth_client, settings):
    settings.ENABLE_ASSESSMENT_JOBS = True
    url = f"/api/v1/assessments/{assessment.id}/jobs/"
    response = auth_client.post(url, {"stage": "QUESTION_GENERATION"}, format="json")
    assert response.status_code == 202
    assert process_next(assessment_id=assessment.id)
    result = auth_client.get(response["Location"]).json()["data"]
    assert result["status"] == "SUCCEEDED"
    assert 0 <= len(result["result"]["questions"]) <= 4
    legacy = auth_client.post(f"/api/v1/assessments/{assessment.id}/questions/generate/", {}, format="json")
    assert legacy.status_code == 200
    assert legacy.json()["data"] == result["result"]
