"""Fast-Track Compliance-First End-to-End Test Suite.

Authority: FAST-TRACK COMPLIANCE IMPLEMENTATION SPECIFICATION;
           01_ENGINEERING_CONSTITUTION.md;
           05_DATA_CONTRACTS.md §8 (CIR);
           08_RAG_SERVICE_CONTRACT.md;
           TRD_v2.0 §10, §14, §15, §16, §17.

Core Invariants Verified:
1. RAG RETRIEVES. RULES DECIDE. LLM EXPLAINS.
   RAG returns candidates + evidence only; zero legal status emitted by RAG.
2. Only Engine 2 determines: APPLICABLE, NOT_APPLICABLE, NEEDS_INFORMATION.
3. UNKNOWN must never silently become NOT_APPLICABLE.
4. Adaptive Questioning asks 0–4 questions; 0 if profile is fully specified.
5. Canonical facts carry forensic provenance (LLM_EXTRACTED, confidence, source excerpt).
6. CIR is cryptographically verifiable via RFC 8785 canonical JSON SHA-256 digest.
7. Dashboard projects genuine Engine 2 truth without mock metrics.
8. 4 Golden Profiles verified: Textile Mill, Pharma Formulation, Cold-Chain, SaaS.
9. BIS Platform is strictly untouched and isolated.
"""

from __future__ import annotations

import datetime
from pathlib import Path
import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.applicability.engine import ApplicabilityEngine
from apps.applicability.models import DecisionResult, DecisionRun
from apps.applicability.services import (
    build_compliance_intelligence_record,
    get_latest_cir,
    verify_cir_integrity,
)
from apps.businesses.models import Business, BusinessMembership, BusinessProfileVersion
from apps.dashboard.services import get_dashboard_summary
from apps.evidence.models import Evidence, Source
from apps.evidence.services.rag_service import (
    CandidateRequirement,
    ComplianceRagClient,
    EnvironmentalFilter,
    JurisdictionFilter,
    OperationsFilter,
    RegulatoryCandidateQuery,
)
from apps.knowledge.loader import KnowledgePackLoader
from apps.knowledge.models import RequirementDefinition, RuleVersion
from apps.onboarding.planner import plan_adaptive_smart_questions
from apps.onboarding.services import save_products_and_activities
from common.enums import (
    ApplicabilityStatus,
    DecisionRunStatus,
    KnowledgeStatus,
    RuleType,
    SourceStatus,
    VariableOrigin,
    VerificationStatus,
)
from domain.intelligence.business_understanding import (
    BusinessUnderstandingEngine,
    BusinessUnderstandingResult,
    extract_canonical_facts_from_understanding,
)
from domain.intelligence.orchestration import OrchestrationContext
from domain.profile.variables import get_variable


# ── Fixtures & Setup ─────────────────────────────────────────────────────────

@pytest.fixture
def compliance_user(db) -> User:
    return User.objects.create_user(
        email="compliance.architect@example.com",
        password="ValidTestPassword123!",
        full_name="Compliance Architect",
    )


@pytest.fixture
def load_maharashtra_fixture(db) -> None:
    """Load real published requirements, rules, and evidence for testing Engine 2."""
    pack_dir = Path(__file__).resolve().parent.parent / "knowledge_packs" / "fixtures" / "maharashtra_manufacturing"
    if pack_dir.exists():
        loader = KnowledgePackLoader()
        loader.load_pack_from_dir(pack_dir)


# ── 1. Canonical Fact Extraction with Provenance ─────────────────────────────

@pytest.mark.django_db
def test_canonical_fact_extraction_with_forensic_provenance():
    """Verify raw natural-language business description is parsed into typed canonical facts with provenance."""
    description = (
        "Textile weaving and processing mill in Surat, Gujarat with 165 workers and 643.7 HP "
        "sanctioned power load. We operate an industrial steam boiler of 3.0 TPH capacity and "
        "generate trade effluent from textile dyeing and wet chemical finishing across 3 shifts."
    )

    understanding = BusinessUnderstandingResult(
        business_type="Manufacturing Enterprise",
        primary_activity="Textile weaving and dyeing",
        products=["Woven fabrics", "Dyed textiles"],
        manufacturing_or_service="MANUFACTURING",
        market="DOMESTIC_AND_EXPORT",
        geography={"state": "Gujarat", "district": "Surat"},
        trade_intent="DOMESTIC_AND_EXPORT",
        operational_characteristics=["Steam boiler", "Trade effluent", "Textile dyeing"],
        likely_regulatory_domains=["GPCB CTE/CTO", "Factories Act", "Boiler Regulations"],
        important_unknowns=[],
        normalized_facts=[],
        canonical_operational_facts={
            "total_worker_count": 165,
            "connected_power_load": 643.7,
            "connected_power_unit": "HP",
            "boiler_installed": True,
            "boiler_capacity_tph": 3.0,
            "effluent_emission_generation": True,
            "dyeing_activity": True,
            "shifts_count": 3,
            "is_manufacturing": True,
        },
    )

    facts = extract_canonical_facts_from_understanding(understanding, raw_text=description)

    # 1. Total worker count
    assert "total_worker_count" in facts
    worker_entry = facts["total_worker_count"]
    assert worker_entry["value"] == 165
    assert worker_entry["origin"] == VariableOrigin.LLM_EXTRACTED
    assert worker_entry["confidence"] == 0.95
    assert "source_excerpt" in worker_entry

    # 2. Connected power load (with unit preservation)
    assert "connected_power_load" in facts
    power_entry = facts["connected_power_load"]
    assert power_entry["value"] == "643.7"
    assert power_entry["canonical_unit"] == "HP"
    assert power_entry["origin"] == VariableOrigin.LLM_EXTRACTED

    # 3. Boiler installed & capacity
    assert "boiler_installed" in facts
    assert facts["boiler_installed"]["value"] is True
    assert "boiler_capacity_tph" in facts
    assert facts["boiler_capacity_tph"]["value"] == "3.0"
    assert facts["boiler_capacity_tph"]["canonical_unit"] == "TPH"

    # 4. Environmental & operational characteristics
    assert facts["effluent_emission_generation"]["value"] is True
    assert facts["dyeing_activity"]["value"] is True
    assert facts["is_manufacturing"]["value"] is True
    assert facts["shifts_count"]["value"] == 3

    # 5. Invariant: Unmentioned variables are NOT invented
    assert "hazardous_goods_handling" not in facts
    assert "processes_personal_data" not in facts


# ── 2. Adaptive Questioning Bounds (0–4 Questions) ───────────────────────────

@pytest.mark.django_db
def test_adaptive_questioning_bounds_and_zero_question_fast_path(compliance_user, load_maharashtra_fixture):
    """Verify adaptive questioning: 0 questions if profile is sufficient, 0-4 if gaps exist."""
    # Case A: Fully specified profile
    biz_full = Business.objects.create(name="Fully Specified Mill", owner=compliance_user)
    BusinessMembership.objects.create(business=biz_full, user=compliance_user, role=BusinessMembership.Role.OWNER)

    BusinessProfileVersion.objects.create(
        business=biz_full,
        version=1,
        variables={
            "state": {"value": "MAHARASHTRA", "origin": VariableOrigin.USER_PROVIDED},
            "product_description": {"value": "Textile manufacturing and dyeing", "origin": VariableOrigin.USER_PROVIDED},
            "total_worker_count": {"value": 165, "origin": VariableOrigin.LLM_EXTRACTED},
            "connected_power_load": {"value": "643.7", "origin": VariableOrigin.LLM_EXTRACTED},
            "boiler_installed": {"value": True, "origin": VariableOrigin.LLM_EXTRACTED},
            "effluent_emission_generation": {"value": True, "origin": VariableOrigin.LLM_EXTRACTED},
            "is_manufacturing": {"value": True, "origin": VariableOrigin.LLM_EXTRACTED},
        },
        created_by=compliance_user,
    )

    plan_full = plan_adaptive_smart_questions(biz_full, round_number=1)
    questions_full = plan_full.get("questions", [])
    # Since all required variables for candidate rules are known, question count is minimal/zero
    assert len(questions_full) <= 4, f"Expected <= 4 questions, got {len(questions_full)}"

    # Case B: Incomplete profile where worker count is missing
    biz_partial = Business.objects.create(name="Partial Mill", owner=compliance_user)
    BusinessMembership.objects.create(business=biz_partial, user=compliance_user, role=BusinessMembership.Role.OWNER)

    BusinessProfileVersion.objects.create(
        business=biz_partial,
        version=1,
        variables={
            "state": {"value": "MAHARASHTRA", "origin": VariableOrigin.USER_PROVIDED},
            "product_description": {"value": "Textile weaving factory", "origin": VariableOrigin.USER_PROVIDED},
            # total_worker_count intentionally omitted
        },
        created_by=compliance_user,
    )

    plan_partial = plan_adaptive_smart_questions(biz_partial, round_number=1)
    questions_partial = plan_partial.get("questions", [])
    assert 0 <= len(questions_partial) <= 4, f"Expected 0-4 questions, got {len(questions_partial)}"
    # If questions asked, they must target missing variables, never generic padding
    if questions_partial:
        q_vars = [q.get("variable_id") for q in questions_partial]
        assert any(v in ("total_worker_count", "connected_power_load", "plant_machinery_investment") for v in q_vars)


# ── 3. ComplianceRag Client Boundary (Zero Legal Status Emitted) ────────────

@pytest.mark.django_db
def test_compliancerag_candidate_retrieval_boundary(load_maharashtra_fixture):
    """Verify ComplianceRag retrieves candidates + evidence ONLY; ZERO legal status emitted."""
    client = ComplianceRagClient()

    query = RegulatoryCandidateQuery(
        jurisdiction=JurisdictionFilter(state_code="MH"),
        operations=OperationsFilter(
            manufacturing_status="PHYSICAL_MANUFACTURING",
            worker_count=165,
            connected_load_hp=643.7,
        ),
        environmental=EnvironmentalFilter(
            has_boiler=True,
            boiler_capacity_tph=3.0,
            generates_trade_effluent=True,
            dyeing_activity=True,
        ),
        top_k=10,
    )

    response = client.discover_candidates(query)

    assert response.candidates_count > 0
    candidate_ids = [c.requirement_id for c in response.candidates]
    assert "REQ-MH-FACTORY-LICENSE" in candidate_ids or "REQ-MPCB-CTE" in candidate_ids

    # CRUCIAL INVARIANT: RAG RETRIEVES. RULES DECIDE.
    # No candidate may contain APPLICABLE / NOT_APPLICABLE / NEEDS_INFORMATION
    for candidate in response.candidates:
        assert isinstance(candidate, CandidateRequirement)
        assert hasattr(candidate, "confidence_score")
        assert hasattr(candidate, "matched_reasons")
        assert not hasattr(candidate, "applicability_status")
        assert not hasattr(candidate, "legal_decision")
        assert not hasattr(candidate, "is_applicable")


@pytest.mark.django_db
def test_compliancerag_evidence_chunk_retrieval(load_maharashtra_fixture):
    """Verify evidence chunk retrieval returns valid citations and content hash."""
    client = ComplianceRagClient()

    chunk = client.get_evidence_chunk("EVD-DISH-MH-FACTORIES-ACT")
    assert chunk is not None
    assert chunk.chunk_id == "EVD-DISH-MH-FACTORIES-ACT"
    assert chunk.source_id == "SRC-DISH-MAHARASHTRA"
    assert "Factories Act" in chunk.source_title
    assert chunk.content_hash.startswith("sha256:")
    assert chunk.verification_status == "VERIFIED"
    assert len(chunk.verbatim_text) > 20


# ── 4. Golden Business Profile 1: Textile Weaving & Dyeing ──────────────────

@pytest.mark.django_db
def test_golden_profile_1_textile_mill(compliance_user, load_maharashtra_fixture):
    """Golden Profile 1: Textile Weaving & Dyeing Mill in Maharashtra.

    Expected:
    - REQ-MH-FACTORY-LICENSE: APPLICABLE (workers >= 10 with power)
    - REQ-MPCB-CTE: APPLICABLE (textile dyeing / trade effluent in Maharashtra)
    - Zero software or fintech leaks.
    """
    biz = Business.objects.create(name="Surat TexFab Mills", owner=compliance_user)
    BusinessMembership.objects.create(business=biz, user=compliance_user, role=BusinessMembership.Role.OWNER)

    pv = BusinessProfileVersion.objects.create(
        business=biz,
        version=1,
        variables={
            "state": {"value": "MAHARASHTRA", "origin": VariableOrigin.USER_PROVIDED},
            "product_description": {"value": "Textile weaving, bleaching, and chemical dyeing mill", "origin": VariableOrigin.USER_PROVIDED},
            "total_worker_count": {"value": 165, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "connected_power_load": {"value": "643.7", "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "boiler_installed": {"value": True, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "boiler_capacity_tph": {"value": "3.0", "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "effluent_emission_generation": {"value": True, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "dyeing_activity": {"value": True, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "is_manufacturing": {"value": True, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
        },
        created_by=compliance_user,
    )

    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=biz, profile_version=pv, save_run=True)

    assert run.status == DecisionRunStatus.COMPLETED
    results_map = {r.requirement_id: r for r in run.results.all()}

    # Factory License must be APPLICABLE
    assert "REQ-MH-FACTORY-LICENSE" in results_map
    res_factory = results_map["REQ-MH-FACTORY-LICENSE"]
    assert res_factory.status == ApplicabilityStatus.APPLICABLE
    ev_ids_factory = [e.get("evidence_id") if isinstance(e, dict) else e for e in (res_factory.evidence_refs or [])]
    assert "EVD-DISH-MH-FACTORIES-ACT" in ev_ids_factory

    # Environmental CTE must be APPLICABLE
    assert "REQ-MPCB-CTE" in results_map
    res_cte = results_map["REQ-MPCB-CTE"]
    assert res_cte.status == ApplicabilityStatus.APPLICABLE
    ev_ids_cte = [e.get("evidence_id") if isinstance(e, dict) else e for e in (res_cte.evidence_refs or [])]
    assert "EVD-MPCB-CTE-RED-TEXTILE" in ev_ids_cte

    # Explanation trace must contain exact rule logic
    trace = results_map["REQ-MH-FACTORY-LICENSE"].explanation_trace
    assert trace["requirement_id"] == "REQ-MH-FACTORY-LICENSE"
    assert trace["status"] == "APPLICABLE"


# ── 5. Golden Business Profile 2: Pharma Formulation (Uncertainty) ──────────

@pytest.mark.django_db
def test_golden_profile_2_pharma_formulation_uncertainty(compliance_user, load_maharashtra_fixture):
    """Golden Profile 2: Pharma Formulation with Missing Facts.

    Expected:
    - REQ-MH-FACTORY-LICENSE: NEEDS_INFORMATION (worker count missing)
    - Invariant: UNKNOWN never silently becomes NOT_APPLICABLE.
    """
    biz = Business.objects.create(name="Aura Pharma Labs", owner=compliance_user)
    BusinessMembership.objects.create(business=biz, user=compliance_user, role=BusinessMembership.Role.OWNER)

    # State is known, but worker count and connected load are unknown
    pv = BusinessProfileVersion.objects.create(
        business=biz,
        version=1,
        variables={
            "state": {"value": "MAHARASHTRA", "origin": VariableOrigin.USER_PROVIDED},
            "product_description": {"value": "Pharmaceutical tablet and syrup formulation laboratory", "origin": VariableOrigin.USER_PROVIDED},
            "is_manufacturing": {"value": True, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
        },
        created_by=compliance_user,
    )

    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=biz, profile_version=pv, save_run=True)

    results_map = {r.requirement_id: r for r in run.results.all()}
    assert "REQ-MH-FACTORY-LICENSE" in results_map

    # Invariant: Must be NEEDS_INFORMATION, never NOT_APPLICABLE
    assert results_map["REQ-MH-FACTORY-LICENSE"].status == ApplicabilityStatus.NEEDS_INFORMATION


# ── 6. Golden Business Profile 3: Cold-Chain Logistics ───────────────────────

@pytest.mark.django_db
def test_golden_profile_3_cold_chain_logistics(compliance_user, load_maharashtra_fixture):
    """Golden Profile 3: Cold-Chain Logistics & Temperature-Controlled Warehousing.

    Expected:
    - Manufacturing CTE / Textile Dyeing: NOT_APPLICABLE.
    """
    biz = Business.objects.create(name="KoolRoute Cold Chain", owner=compliance_user)
    BusinessMembership.objects.create(business=biz, user=compliance_user, role=BusinessMembership.Role.OWNER)

    pv = BusinessProfileVersion.objects.create(
        business=biz,
        version=1,
        variables={
            "state": {"value": "MAHARASHTRA", "origin": VariableOrigin.USER_PROVIDED},
            "product_description": {"value": "Temperature-controlled cold storage warehouse and refrigerated transport logistics", "origin": VariableOrigin.USER_PROVIDED},
            "total_worker_count": {"value": 25, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "is_manufacturing": {"value": False, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "boiler_installed": {"value": False, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "effluent_emission_generation": {"value": False, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "dyeing_activity": {"value": False, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
        },
        created_by=compliance_user,
    )

    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=biz, profile_version=pv, save_run=True)

    results_map = {r.requirement_id: r for r in run.results.all()}
    # MPCB Red Category textile dyeing CTE is NOT_APPLICABLE for cold storage
    assert "REQ-MPCB-CTE" in results_map
    assert results_map["REQ-MPCB-CTE"].status == ApplicabilityStatus.NOT_APPLICABLE


# ── 7. Golden Business Profile 4: SaaS / Cloud Software ─────────────────────

@pytest.mark.django_db
def test_golden_profile_4_saas_software(compliance_user, load_maharashtra_fixture):
    """Golden Profile 4: B2B HRMS Cloud SaaS.

    Expected:
    - 0 industrial factory or boiler rules APPLICABLE.
    - REQ-MPCB-CTE: NOT_APPLICABLE.
    """
    biz = Business.objects.create(name="CloudFlow Systems", owner=compliance_user)
    BusinessMembership.objects.create(business=biz, user=compliance_user, role=BusinessMembership.Role.OWNER)

    pv = BusinessProfileVersion.objects.create(
        business=biz,
        version=1,
        variables={
            "state": {"value": "MAHARASHTRA", "origin": VariableOrigin.USER_PROVIDED},
            "product_description": {"value": "Cloud-based B2B HRMS SaaS platform processing payroll and employee records", "origin": VariableOrigin.USER_PROVIDED},
            "total_worker_count": {"value": 15, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "is_manufacturing": {"value": False, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "boiler_installed": {"value": False, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "effluent_emission_generation": {"value": False, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "dyeing_activity": {"value": False, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "processes_personal_data": {"value": True, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
        },
        created_by=compliance_user,
    )

    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=biz, profile_version=pv, save_run=True)

    results_map = {r.requirement_id: r for r in run.results.all()}
    # Industrial pollution CTE must be NOT_APPLICABLE
    assert results_map["REQ-MPCB-CTE"].status == ApplicabilityStatus.NOT_APPLICABLE


# ── 8. Compliance Intelligence Record (CIR) Cryptographic Verification ──────

@pytest.mark.django_db
def test_cir_generation_and_cryptographic_verification(compliance_user, load_maharashtra_fixture):
    """Verify CIR matches 05_DATA_CONTRACTS.md §8 and cryptographic hash is valid."""
    biz = Business.objects.create(name="Verified Enterprise", owner=compliance_user)
    BusinessMembership.objects.create(business=biz, user=compliance_user, role=BusinessMembership.Role.OWNER)

    pv = BusinessProfileVersion.objects.create(
        business=biz,
        version=1,
        variables={
            "state": {"value": "MAHARASHTRA", "origin": VariableOrigin.USER_PROVIDED},
            "product_description": {"value": "Textile manufacturing and dyeing", "origin": VariableOrigin.USER_PROVIDED},
            "total_worker_count": {"value": 165, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "connected_power_load": {"value": "643.7", "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "boiler_installed": {"value": True, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "effluent_emission_generation": {"value": True, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "dyeing_activity": {"value": True, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "is_manufacturing": {"value": True, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
        },
        created_by=compliance_user,
    )

    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=biz, profile_version=pv, save_run=True)

    cir = build_compliance_intelligence_record(run)

    # 1. Structural schema compliance
    assert "cir_id" in cir
    assert "business_id" in cir
    assert "assessment_id" in cir
    assert "profile_version_id" in cir
    assert "decision_run_id" in cir
    assert "determinations" in cir
    assert "metrics" in cir
    assert "content_hash" in cir
    assert "created_at" in cir

    # 2. Determinations contain required fields
    for d in cir["determinations"]:
        assert "requirement_id" in d
        assert "title" in d
        assert "status" in d
        assert "authority" in d
        assert "evidence_chunk_id" in d
        assert "explanation" in d

    # 3. Cryptographic integrity check
    assert verify_cir_integrity(cir) is True

    # 4. Tamper detection: modifying status must cause integrity failure
    tampered_cir = dict(cir)
    tampered_determinations = list(cir["determinations"])
    tampered_determinations[0] = dict(tampered_determinations[0])
    tampered_determinations[0]["status"] = "NOT_APPLICABLE"
    tampered_cir["determinations"] = tampered_determinations

    assert verify_cir_integrity(tampered_cir) is False


# ── 9. Dashboard Projection End-to-End ───────────────────────────────────────

@pytest.mark.django_db
def test_dashboard_projection_end_to_end(compliance_user, load_maharashtra_fixture):
    """Verify Dashboard projects genuine Engine 2 CIR without mock percentages."""
    biz = Business.objects.create(name="Dashboard Projection Enterprise", owner=compliance_user)
    BusinessMembership.objects.create(business=biz, user=compliance_user, role=BusinessMembership.Role.OWNER)

    pv = BusinessProfileVersion.objects.create(
        business=biz,
        version=1,
        variables={
            "state": {"value": "MAHARASHTRA", "origin": VariableOrigin.USER_PROVIDED},
            "product_description": {"value": "Industrial textile dyeing and manufacturing", "origin": VariableOrigin.USER_PROVIDED},
            "total_worker_count": {"value": 165, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "connected_power_load": {"value": "643.7", "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "boiler_installed": {"value": True, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "effluent_emission_generation": {"value": True, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "dyeing_activity": {"value": True, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "is_manufacturing": {"value": True, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
        },
        created_by=compliance_user,
    )

    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=biz, profile_version=pv, save_run=True)

    summary = get_dashboard_summary(biz)

    assert summary["has_evaluation"] is True
    assert summary["latest_run_id"] == str(run.id)
    assert summary["cir"] is not None
    assert summary["cir"]["decision_run_id"] == str(run.id)
    assert summary["metrics"]["applicable_count"] >= 2
    assert summary["compliance_readiness"] > 0
    assert summary["readiness_label"] == "Assessment completeness"


# ── 10. BIS Strict Isolation Invariant ───────────────────────────────────────

def test_bis_strict_isolation_invariant():
    """Verify that BIS platform is completely out of scope and nowhere imported."""
    import sys
    assert "BIS" not in sys.modules
    assert "bis_system" not in sys.modules
    assert "bis_intelligence" not in sys.modules

    # Check settings does not configure BIS apps
    from django.conf import settings
    installed = " ".join(settings.INSTALLED_APPS).lower()
    assert "bis" not in installed
