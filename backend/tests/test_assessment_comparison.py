from copy import deepcopy
from datetime import timedelta
import json
import pytest
from django.utils import timezone
from apps.applicability.models import DecisionResult, DecisionRun
from apps.applicability.services import build_compliance_intelligence_record
from apps.businesses.models import Assessment, AssessmentJob, AssessmentWorkerHeartbeat, BusinessProfileVersion

pytestmark = pytest.mark.django_db


def saved_run(business, user, number, power, status):
    variables = {"connected_power_load": BusinessProfileVersion.build_entry(power),
                 "is_manufacturing": BusinessProfileVersion.build_entry(number > 1)}
    profile = BusinessProfileVersion.objects.create(business=business, version=number, variables=variables)
    assessment = Assessment.objects.create(business=business, created_by=user, profile_version=profile,
        assessment_number=number, title=f"Synthetic snapshot {number}")
    manifest = {"profile": deepcopy(variables), "mode": "PRODUCTION", "requirements": {}, "evidence": {},
                "rules": {}, "catalogue_hash": "same-catalogue", "evaluator_version": "same-evaluator",
                "evaluation_date": timezone.localdate().isoformat()}
    run = DecisionRun.objects.create(business=business, profile_version=profile, assessment=assessment,
        status="COMPLETED", evaluation_manifest=manifest)
    DecisionResult.objects.create(decision_run=run, requirement_id="SYNTHETIC-POWER", requirement_name="Synthetic power rule",
        status=status, explanation_trace={"reason": "SYNTHETIC_TEST_TRACE", "variables_used": {"connected_power_load": power}})
    build_compliance_intelligence_record(run)
    return run


def test_comparison_preserves_false_unknown_and_sealed_records(business, user, auth_client):
    before = saved_run(business, user, 1, 0, "NOT_APPLICABLE")
    after = saved_run(business, user, 2, None, "NEEDS_INFORMATION")
    archives = [deepcopy(run.cir_snapshot) for run in (before, after)]
    response = auth_client.get(f"/api/v1/businesses/{business.id}/compare/{before.id}/{after.id}")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["status_changes"] == 1 and data["uncertain_rows"] == 1
    assert data["same_evaluation_context"] is True
    row = data["requirements"][0]
    assert row["before"]["facts_used"]["connected_power_load"] == 0
    assert row["after"]["facts_used"]["connected_power_load"] is None
    assert row["changed_facts_used"] == ["connected_power_load"]
    assert row["after"]["evidence"]["completion_status"] == "NOT_VERIFIED_BY_APPLICABILITY"
    assert row["after"]["evidence"]["status"] == "NO_RECORDED_PASSAGE"
    for run, original in zip((before, after), archives):
        run.refresh_from_db()
        assert run.cir_snapshot == original
    assert "no-store" in response["Cache-Control"]
    assert not AssessmentJob.objects.exists()


def test_comparison_checks_both_run_tenants_and_does_not_seal_on_get(business, user, auth_client, make_business, other_user):
    before = saved_run(business, user, 1, 0, "NOT_APPLICABLE")
    elsewhere = saved_run(make_business(other_user), other_user, 1, 50, "APPLICABLE")
    root = f"/api/v1/businesses/{business.id}"
    assert auth_client.get(f"{root}/compare/{before.id}/{elsewhere.id}").status_code == 404
    auth_client.force_authenticate(other_user)
    assert auth_client.get(f"{root}/decision-history").status_code == 404
    auth_client.force_authenticate(user)
    DecisionRun.objects.filter(pk=before.pk).update(cir_snapshot={})
    assert auth_client.get(f"{root}/compare/{before.id}/{before.id}").status_code == 409
    before.refresh_from_db()
    assert before.cir_snapshot == {}


def test_context_changes_are_not_attributed_only_to_facts(business, user, auth_client):
    before = saved_run(business, user, 1, 0, "NOT_APPLICABLE")
    after = saved_run(business, user, 2, 50, "UNVERIFIED")
    manifest = {**after.evaluation_manifest, "catalogue_hash": "changed-catalogue"}
    DecisionRun.objects.filter(pk=after.pk).update(evaluation_manifest=manifest)
    data = auth_client.get(f"/api/v1/businesses/{business.id}/compare/{before.id}/{after.id}").json()["data"]
    assert data["same_evaluation_context"] is False
    assert "do not attribute" in data["interpretation"]
    assert data["requirements"][0]["after"]["status"] == "UNVERIFIED"


def test_worker_health_requires_current_release_and_fresh_heartbeat(business, user, auth_client, settings):
    settings.ENABLE_ASSESSMENT_JOBS = True
    settings.ASSESSMENT_WORKER_HEALTH_REQUIRED = True
    assessment = Assessment.objects.create(business=business, created_by=user)
    url = f"/api/v1/assessments/{assessment.id}/jobs/"
    assert auth_client.get(url).json()["data"]["worker_ready"] is False
    assert auth_client.post(url, {"stage": "REGULATORY_DISCOVERY"}, format="json").json()["error"]["code"] == "WORKER_UNAVAILABLE"
    assert not AssessmentJob.objects.exists()
    heartbeat = AssessmentWorkerHeartbeat.objects.create(worker_id="synthetic-worker", release="old-release")
    assert auth_client.get(url).json()["data"]["worker_ready"] is False
    heartbeat.release = settings.COMPLYWISE_VERSION; heartbeat.save()
    assert auth_client.get(url).json()["data"]["worker_ready"] is True
    heartbeat.seen_at = timezone.now() - timedelta(seconds=61); heartbeat.save()
    assert auth_client.get(url).json()["data"]["worker_ready"] is False


def test_read_timing_logs_route_templates_without_identity(business, user, auth_client, caplog):
    with caplog.at_level("INFO", logger="complywise.read_latency"):
        response = auth_client.get(f"/api/v1/businesses/{business.id}/decision-history?secret_query=do-not-log")
    assert response.status_code == 200 and "app;dur=" in response["Server-Timing"]
    events = [record.message for record in caplog.records if '"event": "api_read"' in record.message]
    assert events and str(business.id) not in events[0] and "do-not-log" not in events[0] and user.email not in events[0]


def test_prepared_walkthrough_is_idempotent_and_does_not_publish_legal_content(user, settings):
    from django.core.management import call_command
    from apps.businesses.comparison_views import WALKTHROUGH_ID
    from apps.knowledge.models import RuleVersion, RequirementDefinition
    settings.COMPLYWISE_DEMO_MODE = True
    before = (RuleVersion.objects.count(), RequirementDefinition.objects.count())
    call_command("prepare_assessment_walkthrough", owner_email=user.email)
    runs = list(DecisionRun.objects.filter(business_id=WALKTHROUGH_ID).order_by("created_at"))
    assert len(runs) == 3 and all(run.cir_snapshot for run in runs)
    assert all(run.evaluation_manifest["mode"] == "PRODUCTION" for run in runs)
    assert runs[0].evaluation_manifest["profile"]["is_manufacturing"]["value"] is False
    assert runs[2].evaluation_manifest["profile"]["connected_power_load"]["value"] is None
    archives = [deepcopy(run.cir_snapshot) for run in runs]
    call_command("prepare_assessment_walkthrough", owner_email=user.email)
    assert DecisionRun.objects.filter(business_id=WALKTHROUGH_ID).count() == 3
    assert [run.cir_snapshot for run in DecisionRun.objects.filter(business_id=WALKTHROUGH_ID).order_by("created_at")] == archives
    assert (RuleVersion.objects.count(), RequirementDefinition.objects.count()) == before
    assert settings.COMPLYWISE_DEMO_MODE is True
