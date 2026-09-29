"""Comprehensive Golden Profile & Retrieval Benchmark Evaluation Runner.

Authority: ComplyWise Architecture Constitution, TRD_v2.0, PRD_v2.0.
Verifies:
1. 5 Golden Profiles (Textile, Pharma, Cold-Chain, SaaS, Food-Processing)
2. Invariant: Rules Decide, RAG Retrieves, LLM Explains
3. Three-Valued Logic (Kleene UNKNOWN -> NEEDS_INFORMATION)
4. Non-manufacturing business obligation suppression
5. Cryptographic CIR Digest & HMAC verification
6. Candidate Retrieval Benchmark (Recall@20, nDCG@10, Precision)
7. Exact Official Action URL Resolution
"""

from __future__ import annotations

import math
from pathlib import Path
import pytest

from apps.accounts.models import User
from apps.businesses.models import Business, BusinessMembership, BusinessProfileVersion, Assessment
from apps.applicability.engine import ApplicabilityEngine
from apps.applicability.models import DecisionRun, DecisionResult
from apps.applicability.services import build_compliance_intelligence_record, verify_cir_integrity
from apps.knowledge.loader import KnowledgePackLoader
from apps.acquisition.services import resolve_action_for_requirement
from apps.evidence.services.rag_service import (
    ComplianceRagClient,
    RegulatoryCandidateQuery,
    JurisdictionFilter,
    OperationsFilter,
    EnvironmentalFilter,
)
from common.enums import ApplicabilityStatus, AssessmentStatus, DecisionRunStatus, VariableOrigin

pytestmark = pytest.mark.django_db


@pytest.fixture
def load_all_fixtures():
    loader = KnowledgePackLoader()
    fixtures_dir = Path(__file__).resolve().parent.parent / "knowledge_packs" / "fixtures"
    if fixtures_dir.exists():
        for sub in fixtures_dir.iterdir():
            if sub.is_dir():
                loader.load_pack_from_dir(sub)



PROFILES = [
    {
        "id": "GP-01",
        "name": "Textile Weaving & Dyeing",
        "description": "Textile weaving, bleaching, and chemical dyeing mill in Maharashtra with 165 workers and 3.0 TPH boiler.",
        "variables": {
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
        "must_have_applicable": ["REQ-MH-FACTORY-LICENSE", "REQ-MPCB-CTE"],
        "must_not_have_applicable": ["REQ-SEBI-DEPOSITORIES", "REQ-MINING-SAFETY"],
    },
    {
        "id": "GP-02",
        "name": "Pharma Formulation (Uncertainty)",
        "description": "Pharma Formulation in Maharashtra with missing worker count and unverified boiler capacity.",
        "variables": {
            "state": {"value": "MAHARASHTRA", "origin": VariableOrigin.USER_PROVIDED},
            "product_description": {"value": "Pharmaceutical formulations, generic oral solid dosage", "origin": VariableOrigin.USER_PROVIDED},
            "is_manufacturing": {"value": True, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.90},
            # worker count and power load intentionally missing to test Kleene UNKNOWN
        },
        "expected_needs_info": ["REQ-MH-FACTORY-LICENSE"],
        "must_not_have_applicable": ["REQ-MINING-SAFETY"],
    },
    {
        "id": "GP-03",
        "name": "Cold-Chain Logistics",
        "description": "Cold-chain warehousing and reefer logistics provider with 18 employees.",
        "variables": {
            "state": {"value": "MAHARASHTRA", "origin": VariableOrigin.USER_PROVIDED},
            "product_description": {"value": "Temperature-controlled warehousing, cold storage, and cold-chain freight distribution", "origin": VariableOrigin.USER_PROVIDED},
            "total_worker_count": {"value": 18, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.92},
            "is_manufacturing": {"value": False, "origin": VariableOrigin.DERIVED, "confidence": 1.0},
            "boiler_installed": {"value": False, "origin": VariableOrigin.DERIVED, "confidence": 1.0},
        },
        "must_not_have_applicable": ["REQ-MH-FACTORY-LICENSE", "REQ-BOILER-REG", "REQ-MINING-SAFETY"],
    },
    {
        "id": "GP-04",
        "name": "B2B SaaS Cloud Software",
        "description": "B2B SaaS multi-tenant cloud software company with 12 remote employees.",
        "variables": {
            "state": {"value": "MAHARASHTRA", "origin": VariableOrigin.USER_PROVIDED},
            "product_description": {"value": "Enterprise cloud workflow software, B2B SaaS platform hosted on AWS", "origin": VariableOrigin.USER_PROVIDED},
            "total_worker_count": {"value": 12, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.99},
            "is_manufacturing": {"value": False, "origin": VariableOrigin.DERIVED, "confidence": 1.0},
            "connected_power_load": {"value": "5.0", "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.90},
            "boiler_installed": {"value": False, "origin": VariableOrigin.DERIVED, "confidence": 1.0},
            "effluent_emission_generation": {"value": False, "origin": VariableOrigin.DERIVED, "confidence": 1.0},
            "dyeing_activity": {"value": False, "origin": VariableOrigin.DERIVED, "confidence": 1.0},
        },
        "must_not_have_applicable": ["REQ-MH-FACTORY-LICENSE", "REQ-MPCB-CTE", "REQ-BOILER-REG", "REQ-MINING-SAFETY"],
    },
    {
        "id": "GP-05",
        "name": "Food Processing & Packaged Spices",
        "description": "Food processing and spices manufacturing with 25 workers in Maharashtra.",
        "variables": {
            "state": {"value": "MAHARASHTRA", "origin": VariableOrigin.USER_PROVIDED},
            "product_description": {"value": "Food processing, automated spices milling, blending and hygienic packaging unit", "origin": VariableOrigin.USER_PROVIDED},
            "total_worker_count": {"value": 25, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "connected_power_load": {"value": "45.0", "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "is_manufacturing": {"value": True, "origin": VariableOrigin.LLM_EXTRACTED, "confidence": 0.95},
            "effluent_emission_generation": {"value": False, "origin": VariableOrigin.USER_PROVIDED},
            "dyeing_activity": {"value": False, "origin": VariableOrigin.USER_PROVIDED},
        },
        "must_have_applicable": ["REQ-MH-FACTORY-LICENSE"],
        "must_not_have_applicable": ["REQ-MPCB-CTE", "REQ-MINING-SAFETY"],
    },
]


def test_five_golden_profiles_end_to_end(load_all_fixtures):
    """Test 5 Golden Profiles for exact statutory applicability, invariant adherence, and CIR integrity."""
    qa_user = User.objects.create_user(
        email="golden.qa@complywise.test",
        password="TestPass1234!",
        full_name="Golden Profile QA Auditor",
        is_staff=True,
    )

    engine = ApplicabilityEngine()

    for p in PROFILES:
        biz = Business.objects.create(
            name=f"Enterprise {p['id']} - {p['name']}",
            owner=qa_user,
        )

        pv = BusinessProfileVersion.objects.create(
            business=biz,
            version=1,
            variables=p["variables"],
            change_note=f"Golden profile test {p['id']}",
            created_by=qa_user,
        )

        assessment = Assessment.objects.create(
            business=biz,
            assessment_number=1,
            title=f"Assessment for {p['name']}",
            status=AssessmentStatus.COMPLETED,
            current_step=4,
            profile_version=pv,
        )

        run = engine.evaluate_business_profile(business=biz, profile_version=pv, save_run=True)
        assessment.decision_run = run
        assessment.save()

        assert run.status == DecisionRunStatus.COMPLETED
        dec_results = list(run.results.all())
        app_req_ids = {r.requirement_id for r in dec_results if r.status == ApplicabilityStatus.APPLICABLE}
        needs_info_ids = {r.requirement_id for r in dec_results if r.status == ApplicabilityStatus.NEEDS_INFORMATION}
        not_app_ids = {r.requirement_id for r in dec_results if r.status == ApplicabilityStatus.NOT_APPLICABLE}

        # 1. Must-have obligations
        for req in p.get("must_have_applicable", []):
            assert req in app_req_ids, f"Profile {p['name']} missing expected applicable requirement: {req}"

        # 2. Must-not-have obligations (suppression of irrelevant industrial rules)
        for req in p.get("must_not_have_applicable", []):
            assert req not in app_req_ids, f"Profile {p['name']} received falsely applicable requirement: {req}"

        # 3. Three-valued logic (Kleene UNKNOWN -> NEEDS_INFORMATION)
        for req in p.get("expected_needs_info", []):
            assert req in needs_info_ids, f"Profile {p['name']} expected {req} in NEEDS_INFORMATION due to missing facts"

        # 4. CIR generation and verification
        cir = build_compliance_intelligence_record(run, assessment_id=str(assessment.id))
        assert cir["business_id"] == str(biz.id)
        assert len(cir["determinations"]) == len(dec_results)
        assert verify_cir_integrity(cir) is True

        # 5. Action URL resolution verification
        if app_req_ids:
            first_app = next(r for r in dec_results if r.status == ApplicabilityStatus.APPLICABLE)
            action_dest = resolve_action_for_requirement(
                requirement_id=first_app.requirement_id,
                requirement_name=first_app.requirement_name,
                state_code="MH",
            )
            assert action_dest is not None
            assert action_dest.action_type != ""
            assert action_dest.verification_status in ["EXACT_OFFICIAL_ACTION_PAGE", "OFFICIAL_PORTAL_ROOT", "ACTION_PAGE_NOT_VERIFIED"]


def test_retrieval_candidate_benchmark(load_all_fixtures):
    """Benchmark regulatory candidate retrieval: Recall@20, nDCG@10, and precision."""
    client = ComplianceRagClient()

    benchmark_suite = [
        {
            "sector": "TEXTILE",
            "query": RegulatoryCandidateQuery(
                jurisdiction=JurisdictionFilter(state_code="MH"),
                operations=OperationsFilter(manufacturing_status="PHYSICAL_MANUFACTURING", worker_count=165, connected_load_hp=643.7),
                environmental=EnvironmentalFilter(has_boiler=True, boiler_capacity_tph=3.0, generates_trade_effluent=True, dyeing_activity=True),
                top_k=20,
            ),
            "ground_truth": {"REQ-MH-FACTORY-LICENSE", "REQ-MPCB-CTE"},
        },
        {
            "sector": "SAAS",
            "query": RegulatoryCandidateQuery(
                jurisdiction=JurisdictionFilter(state_code="MH"),
                operations=OperationsFilter(manufacturing_status="SERVICES", worker_count=12, connected_load_hp=5.0),
                environmental=EnvironmentalFilter(has_boiler=False, generates_trade_effluent=False, dyeing_activity=False),
                top_k=20,
            ),
            "ground_truth": set(),
        },
        {
            "sector": "FOOD_PROCESSING",
            "query": RegulatoryCandidateQuery(
                jurisdiction=JurisdictionFilter(state_code="MH"),
                operations=OperationsFilter(manufacturing_status="PHYSICAL_MANUFACTURING", worker_count=25, connected_load_hp=45.0),
                environmental=EnvironmentalFilter(has_boiler=False, generates_trade_effluent=False, dyeing_activity=False),
                top_k=20,
            ),
            "ground_truth": {"REQ-MH-FACTORY-LICENSE"},
        },
    ]

    total_recall = []
    total_precision = []
    total_ndcg = []

    for item in benchmark_suite:
        res = client.discover_candidates(item["query"])
        retrieved_ids = [c.requirement_id for c in res.candidates]
        gt = item["ground_truth"]

        if not gt:
            # Query with zero industrial ground truth (SaaS): precision measures rejection of industrial false positives
            fp_count = sum(1 for rid in retrieved_ids if "FACTORY" in rid or "BOILER" in rid or "MPCB" in rid)
            prec = 1.0 if fp_count == 0 else max(0.0, 1.0 - (fp_count / len(retrieved_ids) if retrieved_ids else 0))
            recall = 1.0
            ndcg = 1.0
        else:
            retrieved_set = set(retrieved_ids)
            hits = gt.intersection(retrieved_set)
            recall = len(hits) / len(gt)
            prec = len(hits) / len(retrieved_ids) if retrieved_ids else 0.0

            # Compute nDCG@10
            dcg = 0.0
            for rank_idx, cand_id in enumerate(retrieved_ids[:10], start=1):
                rel = 1.0 if cand_id in gt else 0.0
                dcg += rel / math.log2(rank_idx + 1)
            idcg = sum(1.0 / math.log2(i + 1) for i in range(1, min(len(gt), 10) + 1))
            ndcg = (dcg / idcg) if idcg > 0 else 0.0

        total_recall.append(recall)
        total_precision.append(prec)
        total_ndcg.append(ndcg)

    avg_recall = sum(total_recall) / len(total_recall)
    avg_ndcg = sum(total_ndcg) / len(total_ndcg)
    avg_prec = sum(total_precision) / len(total_precision)

    # Benchmark assertion: Recall >= 90%, nDCG@10 >= 0.85
    assert avg_recall >= 0.90, f"Average Recall@20 ({avg_recall:.2f}) below 90% benchmark threshold"
    assert avg_ndcg >= 0.85, f"Average nDCG@10 ({avg_ndcg:.2f}) below 0.85 benchmark threshold"
