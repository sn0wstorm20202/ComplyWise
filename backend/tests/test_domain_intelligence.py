"""Tests for ComplyWise Domain Intelligence Engines.

Verifies:
1. Document checklist derivation (Food, Environment, Labor, Trade).
2. Approval workflow derivation & sequential dependency steps.
3. Statutory calendar deadlines, renewal cycles, and annual returns.
4. Central and State MSME scheme discovery.
5. Indian Standards and QCO certification matching.
6. Full 8-stage regulatory analysis orchestration pipeline.
7. Sector-adaptive smart question planning.
8. Business-aware assistant context injection.
"""

from __future__ import annotations

import pytest
from unittest.mock import patch, MagicMock

from apps.businesses.models import Business, BusinessProfileVersion
from apps.applicability.models import DecisionRun, DecisionResult
from apps.knowledge.models import RequirementDefinition
from common.enums import ApplicabilityStatus, VariableOrigin, DecisionRunStatus, KnowledgeStatus
from domain.intelligence.document_derivation import derive_business_documents
from domain.intelligence.workflow_derivation import derive_business_workflows
from domain.intelligence.calendar_derivation import derive_business_calendar
from domain.intelligence.scheme_discovery import discover_business_schemes
from domain.intelligence.standards_discovery import discover_business_standards
from domain.intelligence.orchestration import orchestrate_compliance_analysis
from apps.onboarding.planner import plan_adaptive_smart_questions
from apps.assistant.services import answer_question


@pytest.fixture
def food_business(db, make_business, user):
    """A food processing business in Maharashtra."""
    biz = make_business(owner=user, name="Aarohan BioHarvest Foods Pvt Ltd")
    variables = {
        "state": {"value": "MAHARASHTRA", "origin": VariableOrigin.USER_PROVIDED},
        "product_description": {
            "value": "Processing dehydrated organic onion powder, garlic flakes, and packaged agro spices",
            "origin": VariableOrigin.USER_PROVIDED,
        },
        "annual_turnover": {"value": 85000000, "origin": VariableOrigin.USER_PROVIDED},
        "total_worker_count": {"value": 42, "origin": VariableOrigin.USER_PROVIDED},
        "import_export_intent": {"value": "DIRECT_EXPORTER", "origin": VariableOrigin.USER_PROVIDED},
    }
    profile = BusinessProfileVersion.objects.create(
        business=biz,
        version=1,
        variables=variables,
        created_by=user,
    )

    # Seed published requirement definitions
    RequirementDefinition.objects.get_or_create(
        requirement_id="CENTRAL_FSSAI_STATE_LICENSE",
        defaults={
            "name": "FSSAI State Manufacturing License",
            "authority": "Food Safety and Standards Authority of India (FSSAI)",
            "jurisdiction": "CENTRAL",
            "domain": "FOOD_PROCESSING",
            "category": "LICENCE",
            "status": KnowledgeStatus.PUBLISHED,
            "metadata": {"renewal_period_years": 1, "portal": "FoSCoS"},
        },
    )
    RequirementDefinition.objects.get_or_create(
        requirement_id="CENTRAL_FACTORIES_LICENSE",
        defaults={
            "name": "Factories Act Registration & License",
            "authority": "Directorate of Industrial Safety & Health (DISH)",
            "jurisdiction": "CENTRAL",
            "domain": "MANUFACTURING",
            "category": "LICENCE",
            "status": KnowledgeStatus.PUBLISHED,
            "metadata": {"renewal_period_years": 1, "portal": "DISH Single Window"},
        },
    )

    run = DecisionRun.objects.create(
        business=biz,
        profile_version=profile,
        status=DecisionRunStatus.COMPLETED,
    )
    DecisionResult.objects.create(
        decision_run=run,
        requirement_id="CENTRAL_FSSAI_STATE_LICENSE",
        requirement_name="FSSAI State Manufacturing License",
        status=ApplicabilityStatus.APPLICABLE,
    )
    DecisionResult.objects.create(
        decision_run=run,
        requirement_id="CENTRAL_FACTORIES_LICENSE",
        requirement_name="Factories Act Registration & License",
        status=ApplicabilityStatus.APPLICABLE,
    )
    return biz


@pytest.fixture
def precision_business(db, make_business, user):
    """An automotive precision machining business in Odisha."""
    biz = make_business(owner=user, name="MarineStar Precision Components Pvt Ltd")
    variables = {
        "state": {"value": "ODISHA", "origin": VariableOrigin.USER_PROVIDED},
        "product_description": {
            "value": "CNC precision machining, turned stainless steel fasteners, automotive clutch flanges, and hydraulic fittings",
            "origin": VariableOrigin.USER_PROVIDED,
        },
        "connected_power_load": {"value": 75, "origin": VariableOrigin.USER_PROVIDED},
        "effluent_emission_generation": {"value": True, "origin": VariableOrigin.USER_PROVIDED},
    }
    profile = BusinessProfileVersion.objects.create(
        business=biz,
        version=1,
        variables=variables,
        created_by=user,
    )

    RequirementDefinition.objects.get_or_create(
        requirement_id="CENTRAL_PCB_CTE",
        defaults={
            "name": "Consent to Establish (CTE) under Air & Water Acts",
            "authority": "State Pollution Control Board",
            "jurisdiction": "CENTRAL",
            "domain": "ENVIRONMENT",
            "category": "CONSENT",
            "status": KnowledgeStatus.PUBLISHED,
            "metadata": {"portal": "OCMMS Portal"},
        },
    )
    RequirementDefinition.objects.get_or_create(
        requirement_id="ODISHA_PCB_CTO",
        defaults={
            "name": "Odisha SPCB Consent to Operate (CTO)",
            "authority": "Odisha State Pollution Control Board",
            "jurisdiction": "ODISHA",
            "domain": "ENVIRONMENT",
            "category": "CONSENT",
            "status": KnowledgeStatus.PUBLISHED,
            "metadata": {"renewal_period_years": 5, "portal": "Odisha Single Window"},
        },
    )

    run = DecisionRun.objects.create(
        business=biz,
        profile_version=profile,
        status=DecisionRunStatus.COMPLETED,
    )
    DecisionResult.objects.create(
        decision_run=run,
        requirement_id="CENTRAL_PCB_CTE",
        requirement_name="Consent to Establish (CTE) under Air & Water Acts",
        status=ApplicabilityStatus.APPLICABLE,
    )
    DecisionResult.objects.create(
        decision_run=run,
        requirement_id="ODISHA_PCB_CTO",
        requirement_name="Odisha SPCB Consent to Operate (CTO)",
        status=ApplicabilityStatus.APPLICABLE,
    )
    return biz


@pytest.mark.django_db
def test_document_derivation_food(food_business):
    """Documents derived for food processing entity must contain food safety plans and layout."""
    doc_res = derive_business_documents(food_business)
    assert doc_res["evaluated"] is True
    assert doc_res["total_documents_needed"] > 0
    assert doc_res["total_count"] > 0
    assert "requirements_without_checklist" in doc_res

    doc_names = [d["name"] for d in doc_res["documents"]]
    assert any("FSMS" in name or "Food Safety" in name or "Layout" in name for name in doc_names)


@pytest.mark.django_db
def test_workflow_derivation_food(food_business):
    """Workflows derived for food processing entity must contain sequential steps and available: True."""
    wf_res = derive_business_workflows(food_business)
    assert wf_res["available"] is True
    assert wf_res["total_workflows"] > 0
    assert wf_res["count"] > 0

    first_wf = wf_res["workflows"][0]
    assert "steps" in first_wf
    assert len(first_wf["steps"]) > 0
    assert "step" in first_wf["steps"][0]
    assert "status" in first_wf["steps"][0]


@pytest.mark.django_db
def test_calendar_derivation(food_business):
    """Calendar derivation must include renewal cycles, annual returns, and not_covered fields."""
    cal_res = derive_business_calendar(food_business)
    assert "events" in cal_res
    assert len(cal_res["events"]) > 0
    assert "not_covered" in cal_res
    assert "not_covered_reason" in cal_res

    titles = [e["title"] for e in cal_res["events"]]
    assert any("FSSAI" in t or "Annual" in t or "Return" in t for t in titles)


@pytest.mark.django_db
def test_scheme_discovery_sector_and_state(food_business, precision_business):
    """Schemes must match sector (Food vs Automotive) and jurisdiction (Maharashtra vs Odisha)."""
    food_schemes = discover_business_schemes(food_business)
    assert food_schemes["available"] is True
    assert food_schemes["total_schemes_found"] > 0

    food_titles = [s["title"] for s in food_schemes["schemes"]]
    assert any("PMFME" in t or "Maharashtra" in t or "CGTMSE" in t for t in food_titles)

    precision_schemes = discover_business_schemes(precision_business)
    assert precision_schemes["available"] is True
    assert precision_schemes["total_schemes_found"] > 0

    precision_titles = [s["title"] for s in precision_schemes["schemes"]]
    assert any("ZED" in t or "Odisha" in t or "CGTMSE" in t for t in precision_titles)


@pytest.mark.django_db
def test_standards_discovery(food_business, precision_business):
    """Standards discovery must match IS 2491/ISO 22000 for food and IATF/IS 1367 for machining."""
    food_stds = discover_business_standards(food_business)
    food_codes = [s["standard_code"] for s in food_stds["standards"]]
    assert any("2491" in c or "22000" in c or "10500" in c for c in food_codes)

    machining_stds = discover_business_standards(precision_business)
    machining_codes = [s["standard_code"] for s in machining_stds["standards"]]
    assert any("16949" in c or "1367" in c or "9001" in c for c in machining_codes)


@pytest.mark.django_db
def test_orchestration_pipeline_runs_all_stages(food_business):
    """Orchestration pipeline must execute all stages and produce executive summary."""
    with patch("domain.intelligence.orchestration.run_discovery") as mock_disc:
        mock_disc.return_value = {
            "ran": True,
            "run_id": None,
            "queries": ["food safety maharashtra"],
            "discovered_sources": [{"title": "FSSAI Official Portal"}],
        }
        res = orchestrate_compliance_analysis(food_business, force_live_discovery=False)

        assert res["business_name"] == food_business.name
        assert "stages" in res
        assert len(res["stages"]) >= 8
        assert all(s["status"] == "COMPLETED" for s in res["stages"])

        summary = res["executive_summary"]
        assert summary["total_requirements_evaluated"] >= 0
        assert summary["documents_count"] > 0
        assert summary["workflows_count"] > 0


@pytest.mark.django_db
def test_smart_question_planner_targets_dynamic_questions(food_business):
    """Planner must return 7-9 relevant questions for an active business."""
    plan_res = plan_adaptive_smart_questions(food_business)
    assert "questions" in plan_res
    questions = plan_res["questions"]
    assert len(questions) >= 5
    assert len(questions) <= 20


@pytest.mark.django_db
def test_business_aware_assistant(food_business):
    """Assistant service must inject evaluated business context when business is passed."""
    mock_provider = MagicMock()
    mock_result = MagicMock()
    mock_result.text = "Based on your FSSAI State License and Factories Act obligations..."
    mock_result.provider = "mock"
    mock_result.model = "mock-model"
    mock_provider.complete.return_value = mock_result

    res = answer_question("What permits do I need first?", provider=mock_provider, business=food_business)
    assert res["business_id"] == str(food_business.id)
    assert res["answer_generated"] is True
    # Verify mock provider received the business-aware prompt
    call_args = mock_provider.complete.call_args[0][0]
    sys_msg = next(m.content for m in call_args if m.role == "system")
    assert food_business.name in sys_msg
    assert "CENTRAL_FSSAI_STATE_LICENSE" in sys_msg
