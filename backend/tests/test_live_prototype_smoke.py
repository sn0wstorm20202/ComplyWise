"""Opt-in real-provider smoke using isolated test data, never shared user records."""
import os

import pytest
import json
import time
from pathlib import Path

from apps.ingestion.models import DiscoveryRun, RetrievedDocument
from apps.applicability.models import DecisionResult
from domain.providers.telemetry import telemetry_tracker

from apps.businesses.models import BusinessProfileVersion, WorkspaceGuidance
from apps.knowledge.models import RequirementDefinition, RuleVersion


@pytest.mark.skipif(not os.getenv("COMPLYWISE_LIVE_INTEGRATION"), reason="Real-provider smoke is opt-in.")
@pytest.mark.django_db
def test_live_integration_arbitrary_business_workspace(make_business, user, auth_client):
    started = time.perf_counter()
    record_start = len(telemetry_tracker._records)
    stage_times = {}
    business = make_business(user, name="Synthetic Kerala Leather Repair Workshop")
    BusinessProfileVersion.objects.create(business=business, version=1, variables={
        "state": {"value": "KERALA"}, "district": {"value": "Kochi"},
        "legal_constitution": {"value": "SOLE_PROPRIETORSHIP"},
        "product_description": {"value": "A small walk-in mushroom leather repair and upcycling workshop repairing customers' belts and bags; no factory production or import/export."},
        "is_manufacturing": {"value": False}, "total_worker_count": {"value": 4},
        "annual_turnover": {"value": "1800000"}, "plant_machinery_investment": {"value": "200000"},
        "import_export_intent": {"value": "DOMESTIC_ONLY"}})
    created = auth_client.post("/api/v1/assessments/", {"business_id": str(business.id)}, format="json")
    assert created.status_code == 201, created.data
    assessment_id = created.data["data"]["assessment_id"]
    for stage in ("understand", "questions/generate"):
        stage_start = time.perf_counter()
        response = auth_client.post(f"/api/v1/assessments/{assessment_id}/{stage}", {}, format="json")
        stage_times[stage] = round(time.perf_counter() - stage_start, 3)
        assert response.status_code == 200, response.data
    questions = response.data["data"]["questions"]
    assert len(questions) <= 5
    answers = {}
    for question in questions:
        options = question.get("options") or []
        if question["answer_type"] in {"BOOLEAN", "YES_NO"}:
            answers[question["question_id"]] = False
        elif question["answer_type"] == "MULTI_SELECT":
            answers[question["question_id"]] = [options[0].get("value") if isinstance(options[0],dict) else options[0]] if options else []
        elif options:
            answers[question["question_id"]] = options[0].get("value") if isinstance(options[0], dict) else options[0]
        elif question["answer_type"] in {"BOOLEAN", "YES_NO"}:
            answers[question["question_id"]] = False
        elif question["answer_type"] in {"NUMBER", "INTEGER", "DECIMAL", "CURRENCY_INR", "PERCENTAGE"}:
            answers[question["question_id"]] = 4
        else:
            answers[question["question_id"]] = "Small walk-in premises; no industrial production"
    if answers:
        answered = auth_client.post(f"/api/v1/assessments/{assessment_id}/answers", {"answers": answers}, format="json")
        assert answered.status_code == 200, answered.data
    stage_start = time.perf_counter()
    discovered = auth_client.post(f"/api/v1/assessments/{assessment_id}/regulatory-discovery", {}, format="json")
    stage_times["discovery"] = round(time.perf_counter() - stage_start, 3)
    assert discovered.status_code == 200, discovered.data
    stage_start = time.perf_counter()
    result = auth_client.post(f"/api/v1/assessments/{assessment_id}/compliance-synthesis", {}, format="json")
    stage_times["synthesis"] = round(time.perf_counter() - stage_start, 3)
    assert result.status_code == 200, result.data
    saved = WorkspaceGuidance.objects.get(assessment_id=assessment_id)
    assert saved.payload["compliance_items"]
    assert saved.payload["documents"] and saved.payload["workflows"]
    assert not RequirementDefinition.objects.exists() and not RuleVersion.objects.exists()
    for item in saved.payload["compliance_items"]:
        assert item["result_origin"] == "LLM_FALLBACK_RESULT" and item["status"] == "SUGGESTED"
        assert not item["evidence_ids"] and item["rule_version_id"] is None
    for section, key in [("compliance", "requirements"), ("documents", "documents"), ("workflows", "workflows")]:
        listed = auth_client.get(f"/api/v1/businesses/{business.id}/{section}?assessment_id={assessment_id}")
        assert listed.status_code == 200 and listed.data["data"][key]

    before_completion_calls = len(telemetry_tracker._records)
    completed = auth_client.post(f"/api/v1/businesses/{business.id}/analysis/orchestrate", {"assessment_id":assessment_id,"force_live_discovery":False}, format="json")
    assert completed.status_code == 200, completed.data
    assert len(telemetry_tracker._records) == before_completion_calls
    assert DiscoveryRun.objects.filter(assessment_id=assessment_id).count() == 1
    from apps.businesses.models import Assessment
    assessment = Assessment.objects.get(pk=assessment_id)
    assert assessment.status == "COMPLETED"
    sections = {}
    for section in ("schemes", "standards", "calendar", "dashboard"):
        url = f"/api/v1/assessments/{assessment_id}/{section}" if section in ("schemes", "standards") else f"/api/v1/businesses/{business.id}/{section}?assessment_id={assessment_id}"
        response = auth_client.get(url)
        assert response.status_code == 200, response.data
        payload = response.data["data"]
        sections[section] = {"keys": list(payload), "count": len(payload.get(section, payload.get("events", [])))}
    attempts = [{key:getattr(record,key) for key in ("provider", "provider_slot", "model", "attempt", "status", "failure_type", "fallback", "latency_ms", "total_tokens", "workflow")} for record in telemetry_tracker._records[record_start:]]
    runs = list(DiscoveryRun.objects.filter(assessment_id=assessment_id))
    report = {"test_kind":"REAL_PROVIDERS_API_WITH_ISOLATED_TEST_DATABASE", "assessment_status":assessment.status, "business_type":"Kerala leather repair/upcycling workshop", "assessment_id":str(assessment_id), "adaptive_question_count":len(questions), "provider_attempts":attempts, "search_provider":"serpapi", "discovery_runs":[{"status":r.status, "search_result_count":len(r.candidate_urls), "official_source_count":r.official_source_count, "scraped_count":r.scraped_count, "acquisition_modes":[row.get("acquisition_mode") for row in r.scraped_urls], "summary":r.summary, "error":r.error} for r in runs], "retrieved_document_count":RetrievedDocument.objects.count(), "deterministic_decision_count":DecisionResult.objects.count(), "workspace_counts":{key:len(saved.payload.get(key,[])) for key in ("compliance_items","documents","workflows","schemes","standards")}, "workspace_titles":{key:[item["title"] for item in saved.payload.get(key,[])] for key in ("compliance_items","documents","workflows","schemes","standards")}, "sections":sections, "stage_seconds":stage_times, "total_seconds":round(time.perf_counter()-started,3), "limitation":"No published rules seeded; verifies arbitrary-business contextual path, not covered production KB or actual browser login."}
    target = Path(__file__).resolve().parents[2] / "docs" / "final-submission-live-assessment.json"
    target.write_text(json.dumps(report, indent=2, default=str), encoding="utf-8")
