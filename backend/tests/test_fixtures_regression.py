"""End-to-end regression tests across all 5 regulatory scenario fixtures.

Authority: TRD_v2.0 §10, §14, §17; PRD_v2.0 §1, §P3, §P4, §P5; Problem Statement 26130.

Scenarios tested:
1. Gujarat Food Manufacturing -> FSSAI State Licence, GPCB CTE, Gujarat Factory Licence
2. Telangana Smart Electronics -> BIS CRS, TSPCB CTE, CPCB EPR E-Waste
3. Gujarat Cross-Border Trade -> DGFT IEC
4. Tamil Nadu Automotive Components -> TNPCB CTE, TN Factory Licence
5. Karnataka ESDM Wireless / IoT -> KSPCB CTE, WPC ETA

Negative & Invariant tests:
- Non-qualifying profiles correctly produce NOT_APPLICABLE.
- Incomplete profiles produce NEEDS_INFORMATION, never NOT_APPLICABLE.
- Central rules apply across states; state rules apply only to matching jurisdiction.
- Full provenance is preserved in results (evidence_refs and explanation_trace).
"""

from __future__ import annotations

import pytest

from common.enums import ApplicabilityStatus
from apps.accounts.models import User
from apps.applicability.engine import ApplicabilityEngine
from apps.businesses.models import Business, BusinessMembership, BusinessProfileVersion
from apps.knowledge.loader import KnowledgePackLoader


@pytest.fixture(scope="module")
def loaded_knowledge_packs(django_db_setup, django_db_blocker):
    """Load all 5 golden fixture knowledge packs into test database."""
    with django_db_blocker.unblock():
        loader = KnowledgePackLoader()
        counts = loader.load_all_packs()
        assert counts["packs_loaded"] >= 5
        assert counts["rules"] >= 11
        assert counts["requirements"] >= 11
        assert counts["evidence"] >= 11
        assert counts["sources"] >= 11
        yield counts


@pytest.fixture
def owner_user(db) -> User:
    return User.objects.create_user(
        email="founder@enterprise.in",
        password="SecurePassword123!",
        full_name="Enterprise Founder",
    )


@pytest.fixture
def create_business_and_profile(db, owner_user):
    def _create(name: str, variables: dict) -> tuple[Business, BusinessProfileVersion]:
        business = Business.objects.create(name=name, owner=owner_user)
        BusinessMembership.objects.create(
            business=business,
            user=owner_user,
            role=BusinessMembership.Role.OWNER,
        )
        profile_variables = {}
        for k, v in variables.items():
            profile_variables[k] = {"value": v, "origin": "USER_PROVIDED"}

        profile = BusinessProfileVersion.objects.create(
            business=business,
            version=1,
            variables=profile_variables,
            change_note="Initial profile",
        )
        return business, profile

    return _create


# ===========================================================================
# Scenario 1: Gujarat Food Manufacturing
# ===========================================================================

@pytest.mark.django_db
def test_scenario_gujarat_food(loaded_knowledge_packs, create_business_and_profile):
    business, profile = create_business_and_profile(
        "Kutch Agro Processors Pvt Ltd",
        {
            "state": "GUJARAT",
            "product_description": "Food processing of mango pulp, pickles and tomato sauce",
            "annual_turnover": 45000000,  # 4.5 Crores -> FSSAI State Licence band
            "total_worker_count": 22,    # >= 10 workers
            "connected_power_load": 35,   # > 0 HP power
            "effluent_emission_generation": True,
        },
    )

    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=business, profile_version=profile)

    results = {r.requirement_id: r for r in run.results.all()}

    # Check Applicable Requirements
    assert results["REQ-FSSAI-STATE-LICENCE"].status == ApplicabilityStatus.APPLICABLE
    assert results["REQ-GPCB-CTE"].status == ApplicabilityStatus.APPLICABLE
    assert results["REQ-GUJ-FACTORY-LICENSE"].status == ApplicabilityStatus.APPLICABLE

    # Verify provenance on FSSAI
    fssai_res = results["REQ-FSSAI-STATE-LICENCE"]
    assert len(fssai_res.evidence_refs) >= 1
    assert "FSSAI" in fssai_res.evidence_refs[0]["authority"]
    assert fssai_res.explanation_trace["status"] == ApplicabilityStatus.APPLICABLE


# ===========================================================================
# Scenario 2: Telangana Electronics Manufacturing
# ===========================================================================

@pytest.mark.django_db
def test_scenario_telangana_electronics(loaded_knowledge_packs, create_business_and_profile):
    business, profile = create_business_and_profile(
        "Deccan Smart Meters Ltd",
        {
            "state": "TELANGANA",
            "product_description": "Smart electronic electricity meters and telemetry devices",
            "import_export_intent": False,
        },
    )

    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=business, profile_version=profile)

    results = {r.requirement_id: r for r in run.results.all()}

    assert results["REQ-BIS-CRS-SMART-METER"].status == ApplicabilityStatus.APPLICABLE
    assert results["REQ-TSPCB-CTE"].status == ApplicabilityStatus.APPLICABLE
    assert results["REQ-CPCB-EPR-EWASTE"].status == ApplicabilityStatus.APPLICABLE

    # State isolation check: Gujarat CTE is recorded as UNVERIFIED per C5 (JURISDICTION_NOT_MATCHED)
    assert results["REQ-GPCB-CTE"].status == ApplicabilityStatus.UNVERIFIED
    assert results["REQ-GPCB-CTE"].explanation_trace["reason"] == "JURISDICTION_NOT_MATCHED"


# ===========================================================================
# Scenario 3: Gujarat Cross-Border Trade
# ===========================================================================

@pytest.mark.django_db
def test_scenario_gujarat_trade(loaded_knowledge_packs, create_business_and_profile):
    business, profile = create_business_and_profile(
        "Surat Silk & Cotton Exporters",
        {
            "state": "GUJARAT",
            "product_description": "Trading and export of synthetic textile fabrics",
            "import_export_intent": True,
        },
    )

    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=business, profile_version=profile)

    results = {r.requirement_id: r for r in run.results.all()}

    assert results["REQ-DGFT-IEC"].status == ApplicabilityStatus.APPLICABLE
    # Non-food trading business does not get FSSAI
    assert results["REQ-FSSAI-STATE-LICENCE"].status == ApplicabilityStatus.NOT_APPLICABLE


# ===========================================================================
# Scenario 4: Tamil Nadu Automotive Components
# ===========================================================================

@pytest.mark.django_db
def test_scenario_tamil_nadu_auto(loaded_knowledge_packs, create_business_and_profile):
    business, profile = create_business_and_profile(
        "Kaveri Automotive Components Pvt Ltd",
        {
            "state": "TAMIL_NADU",
            "product_description": "Manufacturing precision automotive transmission gears and shafts",
            "total_worker_count": 55,
            "connected_power_load": 120,
        },
    )

    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=business, profile_version=profile)

    results = {r.requirement_id: r for r in run.results.all()}

    assert results["REQ-TNPCB-CTE"].status == ApplicabilityStatus.APPLICABLE
    assert results["REQ-TN-FACTORY-LICENSE"].status == ApplicabilityStatus.APPLICABLE

    # Gujarat Factory Licence is recorded as UNVERIFIED per C5 (JURISDICTION_NOT_MATCHED)
    assert results["REQ-GUJ-FACTORY-LICENSE"].status == ApplicabilityStatus.UNVERIFIED
    assert results["REQ-GUJ-FACTORY-LICENSE"].explanation_trace["reason"] == "JURISDICTION_NOT_MATCHED"


# ===========================================================================
# Scenario 5: Karnataka ESDM Wireless / IoT
# ===========================================================================

@pytest.mark.django_db
def test_scenario_karnataka_esdm(loaded_knowledge_packs, create_business_and_profile):
    business, profile = create_business_and_profile(
        "Bengaluru ESDM Embedded Systems",
        {
            "state": "KARNATAKA",
            "product_description": "ESDM IoT sensor nodes with Bluetooth low energy and WiFi radio modules",
        },
    )

    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=business, profile_version=profile)

    results = {r.requirement_id: r for r in run.results.all()}

    assert results["REQ-KSPCB-CTE"].status == ApplicabilityStatus.APPLICABLE
    assert results["REQ-WPC-ETA"].status == ApplicabilityStatus.APPLICABLE

    # Central wireless rule applied, but Telangana state CTE is recorded as UNVERIFIED per C5
    assert results["REQ-TSPCB-CTE"].status == ApplicabilityStatus.UNVERIFIED
    assert results["REQ-TSPCB-CTE"].explanation_trace["reason"] == "JURISDICTION_NOT_MATCHED"


# ===========================================================================
# Invariant & Boundary Tests across Fixtures
# ===========================================================================

@pytest.mark.django_db
def test_missing_critical_variables_across_scenarios(
    loaded_knowledge_packs, create_business_and_profile
):
    """Missing critical turnover in a food business MUST resolve to NEEDS_INFORMATION, never NOT_APPLICABLE."""
    business, profile = create_business_and_profile(
        "Incomplete Profile Food Processing",
        {
            "state": "GUJARAT",
            "product_description": "Processed packaged foods",
            # Turnover is missing!
        },
    )

    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=business, profile_version=profile)

    results = {r.requirement_id: r for r in run.results.all()}
    fssai_res = results["REQ-FSSAI-STATE-LICENCE"]
    assert fssai_res.status == ApplicabilityStatus.NEEDS_INFORMATION
    assert fssai_res.status != ApplicabilityStatus.NOT_APPLICABLE


@pytest.mark.django_db
def test_negative_cases_across_scenarios(
    loaded_knowledge_packs, create_business_and_profile
):
    """A business without import/export intent must not get DGFT IEC."""
    business, profile = create_business_and_profile(
        "Domestic Gujarat Retailer",
        {
            "state": "GUJARAT",
            "product_description": "Retail clothing store",
            "import_export_intent": False,
        },
    )

    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=business, profile_version=profile)

    results = {r.requirement_id: r for r in run.results.all()}
    assert results["REQ-DGFT-IEC"].status == ApplicabilityStatus.NOT_APPLICABLE
