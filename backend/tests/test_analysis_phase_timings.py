"""Phase instrumentation must preserve grounding, caching and failure behavior."""
import json
from unittest.mock import Mock, patch

import pytest
from django.test import override_settings

from apps.businesses.models import WorkspaceGuidance
from apps.ingestion.models import DiscoveryRun
from apps.ingestion.services import run_discovery
from domain.intelligence.orchestration import (
    AssessmentRun,
    AssessmentStage,
    assessment_orchestrator,
)
from domain.intelligence.workspace_guidance import ensure_workspace, generate_workspace
from domain.providers.base import CompletionResult, ProviderError
from domain.providers.telemetry import measure_phase
from tests.test_workspace_guidance import interpretation, setup_assessment


def test_phase_time_accumulates_and_propagates_failure(caplog):
    timings = {}
    with caplog.at_level("INFO", logger="domain.providers.telemetry"):
        with patch("domain.providers.telemetry.time.perf_counter", side_effect=[1, 1.025, 2, 2.075]):
            with measure_phase("acquisition", timings):
                pass
            with pytest.raises(ProviderError, match="synthetic failure"), measure_phase("acquisition", timings):
                raise ProviderError("synthetic failure")
    assert timings == {"acquisition": 100.0}
    assert "COMPLETED: 25.00ms" in caplog.text
    assert "FAILED: 75.00ms" in caplog.text
    assert "synthetic failure" not in caplog.text


@pytest.mark.django_db
def test_workspace_metrics_do_not_change_prompt_or_cache(make_business, user):
    business, profile, assessment = setup_assessment(make_business, user)
    provider = Mock()
    provider.complete.return_value = CompletionResult(json.dumps(interpretation()), "fixture", "fixture")
    timings = {}
    with patch("domain.intelligence.workspace_guidance.get_llm_provider", return_value=provider):
        payload = generate_workspace(business, assessment, profile, [], timings=timings)
        saved_key = WorkspaceGuidance.objects.get(assessment=assessment).generation_key
        cached_timings = {}
        assert ensure_workspace(business, assessment, profile, [], timings=cached_timings) == payload
    assert provider.complete.call_count == 1
    assert set(timings) == {"local_retrieval", "regulatory_retrieval", "synthesis_llm", "workspace_persistence"}
    assert all(value >= 0 for value in timings.values())
    assert cached_timings == {}
    assert WorkspaceGuidance.objects.get(assessment=assessment).generation_key == saved_key
    assert "timings" not in provider.complete.call_args.args[0][1].content


@pytest.mark.django_db
@override_settings(SERPAPI_API_KEY="synthetic-search-key")
def test_failed_capture_has_persisted_metrics_without_verified_evidence(make_business, user):
    business, profile, assessment = setup_assessment(make_business, user)
    with patch("apps.ingestion.services.RegulatoryQueryPlanner.plan_queries", return_value=["synthetic query"]), \
         patch("apps.ingestion.search_provider.search", return_value=[{"url": "https://bis.gov.in/synthetic-publication", "title": "Synthetic"}]), \
         patch("apps.ingestion.services.acquire_source", side_effect=ProviderError("capture unavailable")), \
         patch("apps.ingestion.services.extract_claims_from_text") as claims:
        result = run_discovery(business, max_scrape=1, assessment=assessment, profile_version=profile)
    saved = DiscoveryRun.objects.get(pk=result["run_id"])
    assert saved.status == "FAILED" and saved.verified_count == 0 and saved.scraped_count == 0
    assert set(saved.summary["timings_ms"]) == {"source_discovery", "acquisition"}
    assert result["timings_ms"] == saved.summary["timings_ms"]
    claims.assert_not_called()


@pytest.mark.django_db
def test_synthesis_metrics_persist_and_status_reads_them_without_provider(make_business, user, auth_client):
    business, _profile, assessment = setup_assessment(make_business, user)
    assessment.step_state = {"stage_metadata": {"regulatory_discovery": {"status": "FAILED"}}}
    assessment.save(update_fields=["step_state"])
    provider = Mock()
    provider.complete.return_value = CompletionResult(json.dumps(interpretation()), "fixture", "fixture")
    with patch("domain.intelligence.workspace_guidance.get_llm_provider", return_value=provider):
        result = assessment_orchestrator.execute_stage(AssessmentRun(assessment), AssessmentStage.COMPLIANCE_SYNTHESIS)
    assert result.status == "COMPLETED"
    measured = result.data["metadata"]["timings_ms"]
    assert {"deterministic_evaluation", "local_retrieval", "synthesis_llm", "workspace_persistence"} <= set(measured)
    assessment.refresh_from_db()
    assert assessment.step_state["stage_metadata"]["COMPLIANCE_SYNTHESIS"]["data"]["metadata"]["timings_ms"] == measured
    with patch("domain.intelligence.workspace_guidance.get_llm_provider") as untouched:
        response = auth_client.get(f"/api/v1/assessments/{assessment.id}/")
    untouched.assert_not_called()
    assert response.status_code == 200
    assert response.data["data"]["phase_timings_ms"] == measured
    assert response.data["data"]["measured_stage_total_ms"] >= 0
    # Completion and its read-after-completion endpoint retain the measurements
    # without running the model again; these are the actual frontend API routes.
    with patch("domain.intelligence.workspace_guidance.get_llm_provider") as untouched:
        completed = auth_client.post(f"/api/v1/businesses/{business.id}/analysis/orchestrate",
                                     {"assessment_id": str(assessment.id), "force_live_discovery": False}, format="json")
        read = auth_client.get(f"/api/v1/businesses/{business.id}/analysis/status?assessment_id={assessment.id}")
    untouched.assert_not_called()
    assert completed.status_code == 200, completed.data
    assert read.status_code == 200, read.data
    assert completed.data["data"]["phase_timings_ms"] == measured
    assert read.data["data"]["phase_timings_ms"] == measured


@pytest.mark.django_db
def test_answer_submission_reports_time_and_preserves_false(make_business, user, auth_client):
    _business, _profile, assessment = setup_assessment(make_business, user)
    assessment.step_state = {"stage_metadata": {"question_generation": {"questions": [
        {"question_id": "Q_BOOL", "question": "Do you store goods?", "answer_type": "BOOLEAN"}
    ]}}}
    assessment.save(update_fields=["step_state"])
    response = auth_client.post(f"/api/v1/assessments/{assessment.id}/answers",
                               {"question_id": "Q_BOOL", "value": False}, format="json")
    assert response.status_code == 200, response.data
    assert response.data["data"]["saved_value"] is False
    assert response.data["meta"]["timings_ms"]["answer_submission"] >= 0
    assessment.refresh_from_db()
    assert assessment.step_state["stage_metadata"]["answers"]["Q_BOOL"] is False


@pytest.mark.django_db
def test_historical_run_does_not_fabricate_missing_measurements(make_business, user):
    _business, _profile, assessment = setup_assessment(make_business, user)
    state = AssessmentRun(assessment).to_safe_dict()
    assert state["timings_ms"] == {} and state["phase_timings_ms"] == {}
    assert state["measured_stage_total_ms"] == 0
