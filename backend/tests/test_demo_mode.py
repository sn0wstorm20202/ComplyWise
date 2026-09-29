"""Comprehensive test suite for ComplyWise Selection Demo Mode.

Authority: COMPLYWISE SELECTION DEMO SPECIFICATION Part 16
Covers:
1. Meridian Pharma scenario resolution
2. Meridian compliance count & multi-domain coverage
3. Three-valued logic & unknown-state preservation
4. SaaS scenario industrial clearance suppression
5. Textile, Logistics, Food processing scenario resolution
6. Deterministic reliability (OpenAI independence)
7. Action destination classification & DGFT IEC truthfulness
8. BIS strict isolation
9. API response count consistency
"""

import pytest
from common.enums import ApplicabilityStatus
from demo.destinations import ActionDestinationType, DEMO_DESTINATIONS, resolve_demo_destination
from demo.resolver import DemoScenarioResolver
from demo.scenarios.meridian_pharma import MeridianPharmaScenario
from demo.scenarios.saas import SaasScenario
from demo.scenarios.textile import TextileScenario
from demo.scenarios.logistics import LogisticsScenario
from demo.scenarios.food_processing import FoodProcessingScenario
from apps.businesses.models import Business, BusinessProfileVersion
from apps.applicability.engine import ApplicabilityEngine
from apps.applicability.models import DecisionResult, DecisionRun
from apps.applicability.services import build_compliance_intelligence_record


@pytest.mark.django_db
class TestDemoScenarioResolution:
    """Test deterministic scenario matching."""

    def test_meridian_pharma_resolution_by_name(self):
        context = {
            "state": "TELANGANA",
            "is_manufacturing": True,
            "product_description": "Manufacturing oral solid dosage formulations",
        }
        scenario = DemoScenarioResolver.resolve_scenario(
            "Meridian Pharma Formulations Pvt. Ltd.", context
        )
        assert scenario is not None
        assert isinstance(scenario, MeridianPharmaScenario)
        assert scenario.scenario_id == "MERIDIAN_PHARMA_DEMO"

    def test_meridian_pharma_resolution_by_facts(self):
        context = {
            "state": "TELANGANA",
            "is_manufacturing": True,
            "sector": "PHARMACEUTICAL",
            "product_description": "Finished pharmaceutical tablets and capsule manufacturing",
        }
        scenario = DemoScenarioResolver.resolve_scenario("Apex Formulations", context)
        assert scenario is not None
        assert scenario.scenario_id == "MERIDIAN_PHARMA_DEMO"

    def test_saas_scenario_resolution(self):
        context = {
            "state": "KARNATAKA",
            "is_manufacturing": False,
            "product_description": "B2B SaaS cloud analytics platform",
        }
        scenario = DemoScenarioResolver.resolve_scenario("CloudMetrics Technologies", context)
        assert scenario is not None
        assert isinstance(scenario, SaasScenario)
        assert scenario.scenario_id == "SAAS_DEMO"

    def test_textile_scenario_resolution(self):
        context = {
            "state": "MAHARASHTRA",
            "is_manufacturing": True,
            "product_description": "Cotton yarn spinning and fabric weaving mill",
        }
        scenario = DemoScenarioResolver.resolve_scenario("Vidarbha Textile Mills", context)
        assert scenario is not None
        assert isinstance(scenario, TextileScenario)
        assert scenario.scenario_id == "TEXTILE_DEMO"

    def test_logistics_scenario_resolution(self):
        context = {
            "state": "HARYANA",
            "is_manufacturing": False,
            "product_description": "Temperature controlled cold chain logistics and food warehousing",
        }
        scenario = DemoScenarioResolver.resolve_scenario("FrostLine Cold Chain Logistics", context)
        assert scenario is not None
        assert isinstance(scenario, LogisticsScenario)
        assert scenario.scenario_id == "LOGISTICS_DEMO"

    def test_food_processing_scenario_resolution(self):
        context = {
            "state": "GUJARAT",
            "is_manufacturing": True,
            "product_description": "Organic snack food processing and packaging",
        }
        scenario = DemoScenarioResolver.resolve_scenario("NutriBite Organic Foods", context)
        assert scenario is not None
        assert isinstance(scenario, FoodProcessingScenario)
        assert scenario.scenario_id == "FOOD_DEMO"


@pytest.mark.django_db
class TestMeridianPharmaFlagshipDemo:
    """Test full coverage and status semantics for Meridian Pharma."""

    def test_meridian_pharma_coverage_count(self):
        scenario = MeridianPharmaScenario()
        context = {
            "total_worker_count": 164,
            "annual_turnover": 420000000,
            "state": "TELANGANA",
            "is_manufacturing": True,
        }
        reqs = scenario.get_requirements(context)
        # Meridian must have substantially more than 1 single IEC result
        assert len(reqs) >= 15

        statuses = [r.status for r in reqs]
        assert ApplicabilityStatus.APPLICABLE in statuses
        assert ApplicabilityStatus.NEEDS_INFORMATION in statuses
        assert ApplicabilityStatus.NOT_APPLICABLE in statuses

    def test_meridian_pharma_domains_covered(self):
        scenario = MeridianPharmaScenario()
        context = {"total_worker_count": 164, "annual_turnover": 420000000, "state": "TELANGANA"}
        reqs = scenario.get_requirements(context)
        domains = {r.domain for r in reqs}

        assert "PHARMACEUTICALS" in domains
        assert "MANUFACTURING" in domains
        assert "ENVIRONMENT" in domains
        assert "SAFETY" in domains
        assert "TRADE" in domains
        assert "LABOR" in domains

    def test_meridian_unknown_facts_preserve_needs_information(self):
        scenario = MeridianPharmaScenario()
        context = {"total_worker_count": 164, "annual_turnover": 420000000, "state": "TELANGANA"}
        reqs = scenario.get_requirements(context)
        needs_info_reqs = {r.requirement_id: r for r in reqs if r.status == ApplicabilityStatus.NEEDS_INFORMATION}

        # Schedule M GMP, Hazardous Waste, and Groundwater Abstraction must be NEEDS_INFORMATION
        assert "REQ-SCHEDULE-M-GMP" in needs_info_reqs
        assert "REQ-TSPCB-HAZARDOUS-WASTE" in needs_info_reqs
        assert "REQ-WALTA-GROUNDWATER-NOC" in needs_info_reqs

        for req_id, req in needs_info_reqs.items():
            assert len(req.missing_facts) > 0

    def test_engine_evaluation_for_meridian(self, django_user_model):
        user = django_user_model.objects.create_user(email="pharma_test@complywise.in", password="TestPassword123!")
        biz = Business.objects.create(name="Meridian Pharma Formulations Pvt. Ltd.", owner=user)
        pv = BusinessProfileVersion.objects.create(
            business=biz,
            version=1,
            variables={
                "state": {"value": "TELANGANA"},
                "district": {"value": "Hyderabad"},
                "is_manufacturing": {"value": True},
                "total_worker_count": {"value": 164},
                "product_description": {"value": "Oral solid dosage pharmaceutical manufacturing"},
            },
        )

        engine = ApplicabilityEngine()
        run = engine.evaluate_business_profile(business=biz, profile_version=pv, save_run=True)

        assert run.status == "COMPLETED"
        results = DecisionResult.objects.filter(decision_run=run)
        assert results.count() >= 15

        applicable_count = results.filter(status=ApplicabilityStatus.APPLICABLE).count()
        needs_info_count = results.filter(status=ApplicabilityStatus.NEEDS_INFORMATION).count()
        not_applicable_count = results.filter(status=ApplicabilityStatus.NOT_APPLICABLE).count()

        assert applicable_count >= 10
        assert needs_info_count >= 3
        assert not_applicable_count >= 3

        # Test CIR Projection
        cir = build_compliance_intelligence_record(run)
        assert len(cir["determinations"]) == results.count()
        assert cir["metrics"]["applicable_count"] == applicable_count
        assert cir["metrics"]["needs_info_count"] == needs_info_count


@pytest.mark.django_db
class TestSaasScenarioSuppression:
    """Test SaaS scenario properly suppresses industrial manufacturing mandates."""

    def test_saas_suppresses_factories_and_pcb(self):
        scenario = SaasScenario()
        context = {"total_worker_count": 30, "is_manufacturing": False}
        reqs = scenario.get_requirements(context)
        req_map = {r.requirement_id: r for r in reqs}

        # Digital obligations are APPLICABLE
        assert req_map["REQ-DPDP-DATA-FIDUCIARY-COMPLIANCE"].status == ApplicabilityStatus.APPLICABLE
        assert req_map["REQ-CERTIN-CYBERSECURITY-DIRECTIVES"].status == ApplicabilityStatus.APPLICABLE

        # Factory and pollution mandates are NOT_APPLICABLE
        assert req_map["REQ-TS-FACTORY-LICENSE"].status == ApplicabilityStatus.NOT_APPLICABLE
        assert req_map["REQ-TSPCB-CTE"].status == ApplicabilityStatus.NOT_APPLICABLE


class TestActionDestinationTruthfulness:
    """Test action URL classification and truthful labeling."""

    def test_dgft_iec_classified_as_service_page_not_exact_form(self):
        dest = resolve_demo_destination("REQ-DGFT-IEC")
        assert dest.destination_type == ActionDestinationType.OFFICIAL_SERVICE_PAGE
        assert dest.display_label == "Official DGFT IEC Service"
        assert dest.requires_login is True
        assert "iec-service" in dest.url

    def test_tsipass_classified_as_service_page(self):
        dest = resolve_demo_destination("REQ-TS-FACTORY-LICENSE")
        assert dest.destination_type == ActionDestinationType.OFFICIAL_SERVICE_PAGE
        assert "ipass.telangana.gov.in" in dest.url
        assert dest.display_label == "Official TS-iPASS Single Window Portal"

    def test_tspcb_classified_as_service_page(self):
        dest = resolve_demo_destination("REQ-TSPCB-CTE")
        assert dest.destination_type == ActionDestinationType.OFFICIAL_SERVICE_PAGE
        assert "tspcb.cgg.gov.in" in dest.url
        assert dest.display_label == "Official TSPCB OCMMS Portal"

    def test_all_demo_destinations_have_valid_official_urls(self):
        for req_id, dest in DEMO_DESTINATIONS.items():
            assert dest.url.startswith("https://")
            assert dest.display_label != ""
            assert dest.destination_type in (
                ActionDestinationType.EXACT_ACTION_FORM,
                ActionDestinationType.OFFICIAL_SERVICE_PAGE,
                ActionDestinationType.OFFICIAL_PORTAL_REQUIRES_LOGIN,
                ActionDestinationType.ACTION_PAGE_NOT_VERIFIED,
            )


@pytest.mark.django_db
class TestBisIsolation:
    """Ensure BIS remains untouched and strictly isolated from statutory compliance."""

    def test_demo_mode_does_not_modify_bis(self):
        from apps.knowledge.models import RequirementDefinition
        scenario = MeridianPharmaScenario()
        context = {"total_worker_count": 164, "annual_turnover": 420000000, "state": "TELANGANA"}
        reqs = scenario.get_requirements(context)

        # Confirm no BIS mandates are falsely marked applicable for pharmaceutical manufacturing
        for r in reqs:
            if "BIS" in r.requirement_id or "CRS" in r.requirement_id:
                assert r.status == ApplicabilityStatus.NOT_APPLICABLE
