"""Tests for Autonomous Regulatory Knowledge Ingestion Engine.

Authority: Milestone User Request — Autonomous Web Discovery and Knowledge Pack Ingestion.
Verifies:
- Dynamic statutory synthesis when knowledge coverage is missing.
- Ingestion of RequirementDefinition, Source, Evidence, and RuleVersion.
- Deterministic applicability engine evaluation on newly ingested rules.
- Seamless trigger during full compliance analysis orchestration.
- Idempotency and skip behaviors when rules already exist.
"""

from __future__ import annotations

import pytest
from unittest.mock import patch

from apps.applicability.engine import ApplicabilityEngine
from apps.applicability.models import DecisionRun
from apps.businesses.models import Business, BusinessProfileVersion
from apps.ingestion.auto_ingest import auto_ingest_regulatory_knowledge, persist_synthesized_requirements
from apps.knowledge.models import RequirementDefinition, RuleVersion
from common.enums import ApplicabilityStatus, KnowledgeStatus, VariableOrigin
from domain.intelligence.orchestration import orchestrate_compliance_analysis


def _create_profile(business: Business, version: int, **variables) -> BusinessProfileVersion:
    var_dict = {}
    for k, v in variables.items():
        var_dict[k] = {"value": v, "origin": VariableOrigin.USER_PROVIDED}
    return BusinessProfileVersion.objects.create(
        business=business,
        version=version,
        variables=var_dict,
    )


@pytest.mark.django_db
def test_auto_ingest_when_no_rules_exist(make_business, user):
    """When a business has 0 applicable rules, auto_ingest dynamically generates statutory requirements."""
    biz = make_business(owner=user, name="Aarohan Agro Processing Ltd")
    prof = _create_profile(
        biz,
        1,
        state="WEST_BENGAL",
        product_description="Processing organic roasted millet crisps and packaged grain snacks",
        annual_turnover=220000000,
        total_worker_count=45,
        connected_power_load=50,
        food_contact_packaging=True,
        organic_claim=True,
        effluent_emission_generation=True,
    )

    # In a clean DB, no published rules match
    engine = ApplicabilityEngine()
    initial_run = engine.evaluate_business_profile(business=biz, profile_version=prof, save_run=False)
    assert sum(1 for r in initial_run.results.all() if r.status == ApplicabilityStatus.APPLICABLE) == 0

    # Trigger autonomous ingestion
    ingested = auto_ingest_regulatory_knowledge(biz, force=True)
    assert len(ingested) >= 4

    # Re-evaluate with deterministic engine
    post_run = engine.evaluate_business_profile(business=biz, profile_version=prof, save_run=True)
    results_by_id = {r.requirement_id: r.status for r in post_run.results.all()}

    # Check that mandatory statutory obligations were evaluated as APPLICABLE
    assert results_by_id.get("REQ-FSSAI-CENTRAL-LICENCE") == ApplicabilityStatus.APPLICABLE
    assert results_by_id.get("REQ-LEGAL-METROLOGY-PACKER") == ApplicabilityStatus.APPLICABLE
    assert results_by_id.get("REQ-CPCB-EPR-PLASTIC") == ApplicabilityStatus.APPLICABLE
    assert results_by_id.get("REQ-APEDA-NPOP-ORGANIC") == ApplicabilityStatus.APPLICABLE
    assert results_by_id.get("REQ-WEST_BENGAL-FACTORY-LICENSE") == ApplicabilityStatus.APPLICABLE
    assert results_by_id.get("REQ-WEST_BENGALPCB-CTE") == ApplicabilityStatus.APPLICABLE


@pytest.mark.django_db
def test_orchestration_triggers_auto_ingest_seamlessly(make_business, user):
    """Full orchestration pipeline automatically ingests requirements if coverage is initially 0."""
    biz = make_business(owner=user, name="Sundarban BioHarvest Pvt Ltd")
    _create_profile(
        biz,
        1,
        state="WEST_BENGAL",
        product_description="Manufacturing dehydrated organic fruit and millet snacks",
        annual_turnover=250000000,
        total_worker_count=35,
        connected_power_load=40,
        food_contact_packaging=True,
        organic_claim=True,
        effluent_emission_generation=True,
    )

    with patch("domain.intelligence.orchestration.run_discovery") as mock_disc:
        mock_disc.return_value = {
            "ran": True,
            "run_id": None,
            "queries": ["FSSAI Central Food License Kolkata", "WBPCB Consent to Establish"],
            "discovered_sources": [{"title": "FSSAI FoSCoS Portal", "url": "https://foscos.fssai.gov.in"}],
        }
        res = orchestrate_compliance_analysis(biz, force_live_discovery=False)

    assert res["status"] == "COMPLETED"
    summary = res["executive_summary"]
    assert summary["requirements_identified"] >= 4
    assert summary["documents_count"] > 0
    assert summary["workflows_count"] > 0
    assert summary["schemes_count"] > 0


@pytest.mark.django_db
def test_auto_ingest_skips_when_rules_already_exist(make_business, user):
    """Auto-ingest does nothing if the enterprise already has applicable rules and force=False."""
    biz = make_business(owner=user, name="Kolkata Millets Corp")
    prof = _create_profile(
        biz,
        1,
        state="WEST_BENGAL",
        product_description="Food processing",
        annual_turnover=50000000,
    )

    # Manually seed 1 published rule with valid Source & Evidence that is applicable
    from apps.evidence.models import Source, Evidence
    from common.enums import SourceStatus, VerificationStatus

    src = Source.objects.create(
        source_id="SRC-TEST-EXISTING",
        authority="Test Authority",
        title="Statutory Act",
        status=SourceStatus.ACTIVE,
    )
    evd = Evidence.objects.create(
        evidence_id="EVD-TEST-EXISTING",
        source=src,
        locator="Section 1",
        excerpt="Test rationale",
        verification_status=VerificationStatus.VERIFIED,
    )
    req = RequirementDefinition.objects.create(
        requirement_id="TEST-REQ-EXISTING",
        name="Existing Test Req",
        authority="Test Authority",
        jurisdiction="CENTRAL",
        category="LICENCE",
        status=KnowledgeStatus.PUBLISHED,
        evidence_refs=["EVD-TEST-EXISTING"],
    )
    RuleVersion.objects.create(
        rule_id="RULE-TEST-EXISTING-01",
        version=1,
        domain="TEST",
        jurisdiction="CENTRAL",
        requirement=req,
        status=KnowledgeStatus.PUBLISHED,
        condition_ast={"op": "GT", "left": {"var": "annual_turnover"}, "right": 0},
        result=ApplicabilityStatus.APPLICABLE,
        evidence_refs=["EVD-TEST-EXISTING"],
    )

    # Call auto_ingest with force=False
    ingested = auto_ingest_regulatory_knowledge(biz, force=False)
    # Since 1 rule is already applicable, it skips
    assert len(ingested) == 0
