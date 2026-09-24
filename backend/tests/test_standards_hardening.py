"""Step 05.1 Regression Test Suite: Questionnaire Routing, Contextual Standards & Hardening.

Covers Tests A through L:
- Test A: Normal questionnaire start renders exactly 15 questions without mentioning AST/statutory variables.
- Test B: Answer submission for all 15 questions progresses through to results without flow degradation.
- Test C: EV charger manufacturing in West Bengal maps technical standards strictly to IS 17017 family.
- Test D: EV charger manufacturing strictly excludes IS 10146, IS 9845, IATF 16949, IS 1367, ISO 9001, IS 10500, IS 13252, and IS 15885.
- Test E: IS 17017 requirement title matches 'BIS Standard for EV Conductive Charging Systems (IS 17017)'.
- Test F: IS 17017 status is NEEDS_VERIFICATION (not unconditionally mandatory without verified QCO).
- Test G: IS 17017 priority is MEDIUM (not HIGH).
- Test H: West Bengal environmental consent authority is West Bengal Pollution Control Board (WBPCB) with wbpcb.gov.in.
- Test I: West Bengal factory license authority is Directorate of Factories, Department of Labour, Government of West Bengal with wbfactories.gov.in.
- Test J: Environmental consent with unresolved industrial category yields NEEDS_INFORMATION.
- Test K: E-Waste EPR for EV charger manufacturer yields NEEDS_VERIFICATION.
- Test L: All generated/normalized compliance requirements cite valid official portal URLs and never generic egazette.gov.in when specific authority is known.
"""

from __future__ import annotations

import pytest
import re
from decimal import Decimal
from types import SimpleNamespace
from domain.intelligence.context_merge import EnrichedBusinessContext
from domain.intelligence.orchestration import OrchestrationContext
from domain.intelligence.questionnaire import generate_emergency_15_questions
from domain.intelligence.answer_interpretation import AnswerInterpreter
from domain.intelligence.standards_discovery import discover_business_standards
from domain.intelligence.synthesis import LiveComplianceSynthesisProvider
from knowledge_packs.catalogs import STANDARDS_CATALOG


@pytest.fixture
def ev_charger_context_wb() -> EnrichedBusinessContext:
    """EV charger manufacturer based in West Bengal."""
    return EnrichedBusinessContext(
        business_id="biz-ev-test-01",
        business_name="VoltCharge Dynamics Pvt Ltd",
        legal_constitution="PRIVATE_LIMITED",
        state="WB",
        state_name="West Bengal",
        district="Kolkata",
        industrial_zone_status="APPROVED_INDUSTRIAL_AREA",
        lifecycle_stage="OPERATION",
        product_description="Electric vehicle DC fast chargers and commercial EVSE systems",
        trade_intent="DOMESTIC_ONLY",
        annual_turnover=Decimal("120000000"),
        plant_machinery_investment=Decimal("50000000"),
        total_worker_count=45,
        contract_worker_count=10,
        connected_power_load=Decimal("150"),
        effluent_emission_generation=False,
        hazardous_waste_generation=False,
        msme_scale="SMALL",
        is_manufacturing=True,
        is_cross_border=False,
    )


@pytest.fixture
def ev_charger_orch_context_wb() -> OrchestrationContext:
    """OrchestrationContext for EV charger in West Bengal with unresolved pollution category."""
    ctx = OrchestrationContext(
        business_id="biz-ev-test-01",
        business_name="VoltCharge Dynamics Pvt Ltd",
        raw_business_description="Manufacturing and assembly of electric vehicle DC fast charging stations and chargers",
        product="Electric vehicle DC fast chargers and commercial EVSE systems",
        geography={"state": "WB", "state_name": "West Bengal", "district": "Kolkata"},
    )
    ctx.normalized_facts = {
        "is_manufacturing": True,
        "msme_scale": "SMALL",
        "has_effluent": False,
        "pollution_category_resolved": False,  # Unresolved Red/Orange/Green/White
        "is_ewaste_producer": False,          # Scope unverified
    }
    return ctx


# ---------------------------------------------------------------------------
# Test A: Exactly 15 questions generated without AST/statutory variable leakage
# ---------------------------------------------------------------------------
def test_a_questionnaire_renders_exactly_15_questions_no_ast_leakage(ev_charger_orch_context_wb):
    questions = generate_emergency_15_questions(ev_charger_orch_context_wb)

    assert len(questions) == 15, f"Expected exactly 15 questions, got {len(questions)}"

    forbidden_patterns = [
        r"\bast\b",
        r"abstract syntax tree",
        r"statutory variable",
        r"variable determination",
        r"unresolved variable",
        r"sequential ast",
    ]

    for idx, q in enumerate(questions, 1):
        q_dict = q.to_frontend_dict()
        q_text = (q_dict.get("question") or "").lower()
        title = (q_dict.get("category") or "").lower()
        hint = (q_dict.get("help_text") or "").lower()

        for pattern in forbidden_patterns:
            assert not re.search(pattern, q_text), f"Question {idx} contains forbidden internal term '{pattern}': {q_text}"
            assert not re.search(pattern, title), f"Question {idx} title contains forbidden term '{pattern}': {title}"
            assert not re.search(pattern, hint), f"Question {idx} hint contains forbidden term '{pattern}': {hint}"


# ---------------------------------------------------------------------------
# Test B: Answer submission for all 15 questions progresses through to results
# ---------------------------------------------------------------------------
def test_b_answer_submission_for_15_questions_progresses(ev_charger_orch_context_wb):
    questions = generate_emergency_15_questions(ev_charger_orch_context_wb)
    assert len(questions) == 15

    q_dicts = [q.to_frontend_dict() for q in questions]

    answers = {
        "Q01": 150.0,
        "Q02": 45,
        "Q03": True,
        "Q04": "DOMESTIC_ONLY",
        "Q05": False,
        "Q06": True,
        "Q07": False,
        "Q08": False,
        "Q09": 50000000.0,
        "Q10": 120000000.0,
        "Q11": True,
        "Q12": "APPROVED_ESTATE",
        "Q13": False,
        "Q14": True,
        "Q15": False,
    }

    interpreter = AnswerInterpreter()
    facts = interpreter.interpret_answers_to_facts(
        questions=q_dicts,
        answers=answers,
    )

    assert isinstance(facts, list)
    assert len(facts) > 0
    fact_keys = [f.get("key") for f in facts]
    assert "connected_power_load" in fact_keys
    assert "total_worker_count" in fact_keys


# ---------------------------------------------------------------------------
# Test C: EV charger manufacturing maps technical standards strictly to IS 17017 family
# ---------------------------------------------------------------------------
def test_c_ev_charger_maps_technical_standards_strictly_to_is17017(ev_charger_context_wb):
    mock_biz = SimpleNamespace(id="biz-ev-test-01", name="VoltCharge Dynamics Pvt Ltd")
    mock_ctx = SimpleNamespace(
        product_description="Electric vehicle DC fast chargers and commercial EVSE systems",
        detected_activities=["MANUFACTURING", "EV_CHARGER_ASSEMBLY"],
    )
    result = discover_business_standards(business=mock_biz, context=mock_ctx)
    matches = result.get("standards", [])

    standard_codes = [m.get("standard_code") for m in matches]
    assert any("IS 17017" in code for code in standard_codes), f"IS 17017 family missing from matches: {standard_codes}"


# ---------------------------------------------------------------------------
# Test D: EV charger manufacturing strictly excludes unrelated standards
# ---------------------------------------------------------------------------
def test_d_ev_charger_strictly_excludes_unrelated_standards(ev_charger_context_wb):
    mock_biz = SimpleNamespace(id="biz-ev-test-01", name="VoltCharge Dynamics Pvt Ltd")
    mock_ctx = SimpleNamespace(
        product_description="Electric vehicle DC fast chargers and commercial EVSE systems",
        detected_activities=["MANUFACTURING", "EV_CHARGER_ASSEMBLY"],
    )
    result = discover_business_standards(business=mock_biz, context=mock_ctx)
    matches = result.get("standards", [])

    standard_codes = [m.get("standard_code", "") for m in matches]
    titles = [m.get("title", "") for m in matches]

    forbidden_standards = [
        "IS 10146",   # Food packaging polymers
        "IS 9845",    # Food contact testing
        "IATF 16949", # Automotive precision machining
        "IS 1367",    # Fasteners
        "ISO 9001",   # General QMS
        "IS 10500",   # Drinking water
        "IS 13252",   # IT equipment adapters
        "IS 15885",   # LED lamp controlgear
    ]

    for forbidden in forbidden_standards:
        for code in standard_codes:
            assert forbidden not in code, f"Forbidden standard {forbidden} was matched for EV charger: {code}"
        for t in titles:
            assert forbidden not in t, f"Forbidden standard {forbidden} appeared in title: {t}"


# ---------------------------------------------------------------------------
# Test E: IS 17017 requirement title matches 'BIS Standard for EV Conductive Charging Systems (IS 17017)'
# ---------------------------------------------------------------------------
def test_e_is17017_requirement_title(ev_charger_orch_context_wb):
    provider = LiveComplianceSynthesisProvider()
    result = provider.synthesize(ev_charger_orch_context_wb, {"evidence_candidates": []})

    is17017_reqs = [
        r for r in result.requirements
        if "17017" in r.get("title", "") or "17017" in r.get("description", "")
    ]
    assert len(is17017_reqs) > 0, "IS 17017 requirement not found in synthesized requirements"
    for req in is17017_reqs:
        assert req["title"] == "BIS Standard for EV Conductive Charging Systems (IS 17017)", (
            f"Unexpected title for IS 17017 requirement: {req['title']}"
        )


# ---------------------------------------------------------------------------
# Test F: IS 17017 status is NEEDS_VERIFICATION (not mandatory without QCO)
# ---------------------------------------------------------------------------
def test_f_is17017_status_is_needs_verification(ev_charger_orch_context_wb):
    provider = LiveComplianceSynthesisProvider()
    result = provider.synthesize(ev_charger_orch_context_wb, {"evidence_candidates": []})

    is17017_reqs = [
        r for r in result.requirements
        if "17017" in r.get("title", "") or "17017" in r.get("description", "")
    ]
    assert len(is17017_reqs) > 0
    for req in is17017_reqs:
        assert req["status"] == "NEEDS_VERIFICATION", (
            f"IS 17017 status should be NEEDS_VERIFICATION, got {req['status']}"
        )


# ---------------------------------------------------------------------------
# Test G: IS 17017 priority is MEDIUM (not HIGH)
# ---------------------------------------------------------------------------
def test_g_is17017_priority_is_medium(ev_charger_orch_context_wb):
    provider = LiveComplianceSynthesisProvider()
    result = provider.synthesize(ev_charger_orch_context_wb, {"evidence_candidates": []})

    is17017_reqs = [
        r for r in result.requirements
        if "17017" in r.get("title", "") or "17017" in r.get("description", "")
    ]
    assert len(is17017_reqs) > 0
    for req in is17017_reqs:
        assert req["priority"] == "MEDIUM", (
            f"IS 17017 priority should be MEDIUM, got {req['priority']}"
        )


# ---------------------------------------------------------------------------
# Test H: West Bengal environmental consent authority is WBPCB (wbpcb.gov.in)
# ---------------------------------------------------------------------------
def test_h_west_bengal_environmental_consent_authority(ev_charger_orch_context_wb):
    provider = LiveComplianceSynthesisProvider()
    fake_cte_evidence = [
        {
            "evidence_id": "EVD-ENV-01",
            "source_title": "Consent to Establish under Water & Air Acts",
            "authority": "State Pollution Control Board",
            "source_url": "https://wbpcb.gov.in",
            "excerpt": "Prior statutory consent to establish (CTE) required before commencing plant setup.",
        }
    ]
    result = provider.synthesize(ev_charger_orch_context_wb, {"evidence_candidates": fake_cte_evidence})

    env_reqs = [
        r for r in result.requirements
        if r.get("regulatory_domain") == "ENVIRONMENTAL" or "consent to establish" in r.get("title", "").lower()
    ]
    assert len(env_reqs) > 0, "Environmental consent requirement not found"

    for req in env_reqs:
        assert req["authority"] == "West Bengal Pollution Control Board (WBPCB)", (
            f"Wrong authority for WB environmental consent: {req['authority']}"
        )
        assert req["jurisdiction"] == "WEST_BENGAL", f"Expected WEST_BENGAL jurisdiction, got {req['jurisdiction']}"
        assert any("wbpcb.gov.in" in u for u in req.get("source_urls", [])), (
            f"Source URLs should contain wbpcb.gov.in: {req.get('source_urls')}"
        )
        assert "cpcb" not in req["authority"].lower(), "WB State Consent must cite WBPCB, not CPCB"


# ---------------------------------------------------------------------------
# Test I: West Bengal factory license authority is Directorate of Factories WB
# ---------------------------------------------------------------------------
def test_i_west_bengal_factory_license_authority(ev_charger_orch_context_wb):
    provider = LiveComplianceSynthesisProvider()
    fake_factory_evidence = [
        {
            "evidence_id": "EVD-FACT-01",
            "source_title": "Factories Act Registration",
            "authority": "Directorate of Factories",
            "source_url": "https://wbfactories.gov.in",
            "excerpt": "Factory licensing under Section 6 of Factories Act 1948 and West Bengal Factories Rules.",
        }
    ]
    result = provider.synthesize(ev_charger_orch_context_wb, {"evidence_candidates": fake_factory_evidence})

    fact_reqs = [
        r for r in result.requirements
        if r.get("regulatory_domain") == "LABOUR_SAFETY" or "factory" in r.get("title", "").lower()
    ]
    assert len(fact_reqs) > 0, "Factory license requirement not found"

    for req in fact_reqs:
        assert req["authority"] == "Directorate of Factories, Department of Labour, Government of West Bengal", (
            f"Wrong authority for WB factory license: {req['authority']}"
        )
        assert req["jurisdiction"] == "WEST_BENGAL"
        assert any("wbfactories.gov.in" in u for u in req.get("source_urls", []))


# ---------------------------------------------------------------------------
# Test J: Environmental consent with unresolved industrial category yields NEEDS_INFORMATION
# ---------------------------------------------------------------------------
def test_j_environmental_consent_unresolved_category_yields_needs_information(ev_charger_orch_context_wb):
    provider = LiveComplianceSynthesisProvider()
    fake_cte_evidence = [
        {
            "evidence_id": "EVD-ENV-01",
            "source_title": "Consent to Establish under Water & Air Acts",
            "authority": "WBPCB",
            "source_url": "https://wbpcb.gov.in",
            "excerpt": "Prior statutory consent to establish required.",
        }
    ]
    result = provider.synthesize(ev_charger_orch_context_wb, {"evidence_candidates": fake_cte_evidence})

    cte_reqs = [
        r for r in result.requirements
        if "consent to establish" in r.get("title", "").lower() or "cte" in r.get("title", "").lower()
    ]
    assert len(cte_reqs) > 0
    for req in cte_reqs:
        assert req["status"] == "NEEDS_INFORMATION", (
            f"Expected status NEEDS_INFORMATION when category is unresolved, got {req['status']}"
        )


# ---------------------------------------------------------------------------
# Test K: E-Waste EPR for EV charger manufacturer yields NEEDS_VERIFICATION
# ---------------------------------------------------------------------------
def test_k_ewaste_epr_for_ev_charger_yields_needs_verification(ev_charger_orch_context_wb):
    provider = LiveComplianceSynthesisProvider()
    fake_ewaste_evidence = [
        {
            "evidence_id": "EVD-EW-01",
            "source_title": "CPCB EPR E-Waste Portal",
            "authority": "CPCB",
            "source_url": "https://eprewastecpcb.in",
            "excerpt": "Extended Producer Responsibility (EPR) registration under E-Waste Rules 2022.",
        }
    ]
    result = provider.synthesize(ev_charger_orch_context_wb, {"evidence_candidates": fake_ewaste_evidence})

    ewaste_reqs = [
        r for r in result.requirements
        if "e-waste" in r.get("title", "").lower() or "epr" in r.get("title", "").lower()
    ]
    assert len(ewaste_reqs) > 0
    for req in ewaste_reqs:
        assert req["status"] == "NEEDS_VERIFICATION", (
            f"Expected status NEEDS_VERIFICATION for EV charger E-Waste EPR, got {req['status']}"
        )


# ---------------------------------------------------------------------------
# Test L: All requirements cite valid official portal URLs and never generic egazette
# ---------------------------------------------------------------------------
def test_l_all_requirements_cite_valid_official_portals_never_generic_egazette(ev_charger_orch_context_wb):
    provider = LiveComplianceSynthesisProvider()
    mixed_evidence = [
        {
            "evidence_id": "EVD-ENV-01",
            "source_title": "Consent to Establish",
            "authority": "West Bengal Pollution Control Board",
            "source_url": "https://wbpcb.gov.in",
            "excerpt": "Consent to Establish required under Water and Air Acts.",
        },
        {
            "evidence_id": "EVD-FACT-01",
            "source_title": "Factory License",
            "authority": "Directorate of Factories",
            "source_url": "https://wbfactories.gov.in",
            "excerpt": "Factory registration under Factories Act 1948.",
        },
        {
            "evidence_id": "EVD-BIS-17017",
            "source_title": "IS 17017 Conductive Charging",
            "authority": "Bureau of Indian Standards",
            "source_url": "https://bis.gov.in",
            "excerpt": "Conformity assessment under IS 17017 for electric vehicle chargers.",
        },
        {
            "evidence_id": "EVD-EW-01",
            "source_title": "EPR E-Waste",
            "authority": "CPCB",
            "source_url": "https://eprewastecpcb.in",
            "excerpt": "EPR producer obligations under E-Waste Rules.",
        },
    ]
    result = provider.synthesize(ev_charger_orch_context_wb, {"evidence_candidates": mixed_evidence})

    assert len(result.requirements) > 0
    for req in result.requirements:
        urls = req.get("source_urls") or []
        assert len(urls) > 0, f"Requirement '{req.get('title')}' has no source URLs"
        for url in urls:
            assert "egazette.gov.in" not in url, (
                f"Requirement '{req.get('title')}' contains generic egazette URL: {url}"
            )
            assert any(
                domain in url
                for domain in [
                    "wbpcb.gov.in",
                    "wbfactories.gov.in",
                    "bis.gov.in",
                    "eprewastecpcb.in",
                    "dgft.gov.in",
                    "cpcb.nic.in",
                    "ecmpcb.in",
                    "shramsuvidha.gov.in",
                    "foscos.fssai.gov.in",
                ]
            ), f"Requirement '{req.get('title')}' URL '{url}' is not a recognized official authority portal"
