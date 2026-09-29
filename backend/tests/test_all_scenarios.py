"""Comprehensive test suite for the complete ComplyWise Demo Scenario Suite.

Authority: COMPLYWISE FINAL SCENARIO PACK SPECIFICATION
Validates all 6 production demo scenarios:
1. Meridian Pharma Formulations Pvt. Ltd. (Pharma Manufacturing, Gujarat/Telangana)
2. VoltGrid Mobility Services Pvt. Ltd. (EV Charging Infrastructure, Maharashtra)
3. ApexBuild Infrastructure Pvt. Ltd. (Civil Construction, Rajasthan)
4. SilkRoute Exports Pvt. Ltd. (Apparel Merchant Export, Tamil Nadu)
5. CloudAxis Data Centres India Pvt. Ltd. (Hyperscale Data Centre, Telangana)
6. Sahaya Microfinance Services Ltd. (Regulated Microfinance / NBFC, Uttar Pradesh)

Invariants tested:
- Deterministic scenario resolution by entity name and context facts
- Complete statutory requirement counts and three-valued status distribution
- Negative domain suppression (e.g. SilkRoute merchant exporter suppresses factory/dyeing)
- 4-Tier verified statutory action destinations
- Adaptive smart question generation with zero cross-sector contamination
"""

import pytest
from common.enums import ApplicabilityStatus
from demo.destinations import ActionDestinationType, resolve_demo_destination
from demo.resolver import DemoScenarioResolver
from demo.scenarios.meridian_pharma import MeridianPharmaScenario
from demo.scenarios.ev_charging import EvChargingScenario
from demo.scenarios.construction import ConstructionScenario
from demo.scenarios.textile_export import TextileExportScenario
from demo.scenarios.data_centre import DataCentreScenario
from demo.scenarios.microfinance import MicrofinanceScenario
from apps.businesses.models import Business, BusinessProfileVersion
from apps.onboarding.planner import plan_adaptive_smart_questions
from common.enums import VariableOrigin


@pytest.mark.django_db
class TestScenarioResolutionSuite:
    """Verify deterministic scenario matching for all 6 curated businesses."""

    def test_meridian_pharma_resolution(self):
        ctx = {"state": "GUJARAT", "product_description": "Formulation of pharmaceuticals and finished oral solid dosage tablets"}
        scenario = DemoScenarioResolver.resolve_scenario("Meridian Pharma Formulations Pvt. Ltd.", ctx)
        assert scenario is not None
        assert isinstance(scenario, MeridianPharmaScenario)
        assert scenario.scenario_id == "MERIDIAN_PHARMA_DEMO"

    def test_voltgrid_mobility_resolution(self):
        ctx = {"state": "MAHARASHTRA", "product_description": "Public EV charging station network and DC fast charging infrastructure"}
        scenario = DemoScenarioResolver.resolve_scenario("VoltGrid Mobility Services Pvt. Ltd.", ctx)
        assert scenario is not None
        assert isinstance(scenario, EvChargingScenario)
        assert scenario.scenario_id == "VOLTGRID_EV_CHARGING_DEMO"

    def test_apexbuild_construction_resolution(self):
        ctx = {"state": "RAJASTHAN", "product_description": "Civil construction contractor building commercial complexes and roads"}
        scenario = DemoScenarioResolver.resolve_scenario("ApexBuild Infrastructure Pvt. Ltd.", ctx)
        assert scenario is not None
        assert isinstance(scenario, ConstructionScenario)
        assert scenario.scenario_id == "APEXBUILD_CONSTRUCTION_DEMO"

    def test_silkroute_textile_export_resolution(self):
        ctx = {"state": "TAMIL_NADU", "product_description": "Apparel merchant export house buying finished garments for overseas shipment"}
        scenario = DemoScenarioResolver.resolve_scenario("SilkRoute Exports Pvt. Ltd.", ctx)
        assert scenario is not None
        assert isinstance(scenario, TextileExportScenario)
        assert scenario.scenario_id == "SILKROUTE_TEXTILE_EXPORT_DEMO"

    def test_cloudaxis_data_centre_resolution(self):
        ctx = {"state": "TELANGANA", "product_description": "Colocation tier-3 data centre operations, server halls, and backup DG systems"}
        scenario = DemoScenarioResolver.resolve_scenario("CloudAxis Data Centres India Pvt. Ltd.", ctx)
        assert scenario is not None
        assert isinstance(scenario, DataCentreScenario)
        assert scenario.scenario_id == "CLOUDAXIS_DATA_CENTRE_DEMO"

    def test_sahaya_microfinance_resolution(self):
        ctx = {"state": "UTTAR_PRADESH", "product_description": "Micro-credit collateral-free loans to joint liability groups and women entrepreneurs"}
        scenario = DemoScenarioResolver.resolve_scenario("Sahaya Microfinance Services Ltd.", ctx)
        assert scenario is not None
        assert isinstance(scenario, MicrofinanceScenario)
        assert scenario.scenario_id == "SAHAYA_MICROFINANCE_DEMO"


@pytest.mark.django_db
class TestScenarioStatutoryRequirementsAndStatuses:
    """Validate requirement counts and three-valued status distributions."""

    def test_meridian_pharma_requirements(self):
        scenario = MeridianPharmaScenario()
        reqs = scenario.get_requirements({"state": "TELANGANA"})
        assert len(reqs) == 18
        applicable = [r for r in reqs if r.status == ApplicabilityStatus.APPLICABLE]
        needs_info = [r for r in reqs if r.status == ApplicabilityStatus.NEEDS_INFORMATION]
        not_applicable = [r for r in reqs if r.status == ApplicabilityStatus.NOT_APPLICABLE]
        assert len(applicable) == 11
        assert len(needs_info) == 3
        assert len(not_applicable) == 4

    def test_voltgrid_requirements(self):
        scenario = EvChargingScenario()
        reqs = scenario.get_requirements({"state": "MAHARASHTRA"})
        assert len(reqs) == 14
        applicable = [r for r in reqs if r.status == ApplicabilityStatus.APPLICABLE]
        needs_info = [r for r in reqs if r.status == ApplicabilityStatus.NEEDS_INFORMATION]
        not_applicable = [r for r in reqs if r.status == ApplicabilityStatus.NOT_APPLICABLE]
        assert len(applicable) == 9
        assert len(needs_info) == 2
        assert len(not_applicable) == 3

    def test_apexbuild_requirements(self):
        scenario = ConstructionScenario()
        reqs = scenario.get_requirements({"state": "RAJASTHAN"})
        assert len(reqs) == 14
        applicable = [r for r in reqs if r.status == ApplicabilityStatus.APPLICABLE]
        needs_info = [r for r in reqs if r.status == ApplicabilityStatus.NEEDS_INFORMATION]
        not_applicable = [r for r in reqs if r.status == ApplicabilityStatus.NOT_APPLICABLE]
        assert len(applicable) == 9
        assert len(needs_info) == 3
        assert len(not_applicable) == 2

    def test_silkroute_requirements(self):
        scenario = TextileExportScenario()
        reqs = scenario.get_requirements({"state": "TAMIL_NADU"})
        assert len(reqs) == 14
        applicable = [r for r in reqs if r.status == ApplicabilityStatus.APPLICABLE]
        needs_info = [r for r in reqs if r.status == ApplicabilityStatus.NEEDS_INFORMATION]
        not_applicable = [r for r in reqs if r.status == ApplicabilityStatus.NOT_APPLICABLE]
        assert len(applicable) == 8
        assert len(needs_info) == 2
        assert len(not_applicable) == 4

    def test_cloudaxis_requirements(self):
        scenario = DataCentreScenario()
        reqs = scenario.get_requirements({"state": "TELANGANA"})
        assert len(reqs) == 15
        applicable = [r for r in reqs if r.status == ApplicabilityStatus.APPLICABLE]
        needs_info = [r for r in reqs if r.status == ApplicabilityStatus.NEEDS_INFORMATION]
        not_applicable = [r for r in reqs if r.status == ApplicabilityStatus.NOT_APPLICABLE]
        assert len(applicable) == 11
        assert len(needs_info) == 2
        assert len(not_applicable) == 2

    def test_sahaya_microfinance_requirements(self):
        scenario = MicrofinanceScenario()
        reqs = scenario.get_requirements({"state": "UTTAR_PRADESH"})
        assert len(reqs) == 14
        applicable = [r for r in reqs if r.status == ApplicabilityStatus.APPLICABLE]
        needs_info = [r for r in reqs if r.status == ApplicabilityStatus.NEEDS_INFORMATION]
        not_applicable = [r for r in reqs if r.status == ApplicabilityStatus.NOT_APPLICABLE]
        assert len(applicable) == 9
        assert len(needs_info) == 2
        assert len(not_applicable) == 3


@pytest.mark.django_db
class TestNegativeDomainSuppression:
    """Ensure explicit NOT_APPLICABLE suppression for domain-inappropriate obligations."""

    def test_silkroute_merchant_exporter_suppression(self):
        """SilkRoute must NEVER be burdened with factory license, dyeing, or industrial boiler."""
        scenario = TextileExportScenario()
        reqs = {r.requirement_id: r for r in scenario.get_requirements({})}
        assert reqs["REQ-TN-FACTORIES-ACT-MFG"].status == ApplicabilityStatus.NOT_APPLICABLE
        assert reqs["REQ-TNPCB-CTO-DYEING-BLEACHING"].status == ApplicabilityStatus.NOT_APPLICABLE
        assert reqs["REQ-IBR-BOILER-TEXTILE"].status == ApplicabilityStatus.NOT_APPLICABLE
        assert reqs["REQ-TEXTILES-COMMITTEE-CESS-PRODUCER"].status == ApplicabilityStatus.NOT_APPLICABLE
        assert "Section 2(m)" in reqs["REQ-TN-FACTORIES-ACT-MFG"].statutory_act

    def test_voltgrid_suppression(self):
        """VoltGrid operator must NOT be assigned vehicle manufacturing or generic factory CTO."""
        scenario = EvChargingScenario()
        reqs = {r.requirement_id: r for r in scenario.get_requirements({})}
        assert reqs["REQ-CMVR-TYPE-APPROVAL-VEHICLE"].status == ApplicabilityStatus.NOT_APPLICABLE
        assert reqs["REQ-BIS-CRS-EV-CHARGER-MFG"].status == ApplicabilityStatus.NOT_APPLICABLE
        assert reqs["REQ-MPCB-CTO-FACTORY"].status == ApplicabilityStatus.NOT_APPLICABLE

    def test_apexbuild_suppression(self):
        """ApexBuild civil contractor must NOT be assigned permanent factory registration."""
        scenario = ConstructionScenario()
        reqs = {r.requirement_id: r for r in scenario.get_requirements({})}
        assert reqs["REQ-RAJASTHAN-FACTORIES-ACT"].status == ApplicabilityStatus.NOT_APPLICABLE
        assert reqs["REQ-CPCB-EPR-PLASTIC"].status == ApplicabilityStatus.NOT_APPLICABLE

    def test_cloudaxis_suppression(self):
        """CloudAxis must NOT be assigned food licenses or B2C consumer social obligations."""
        scenario = DataCentreScenario()
        reqs = {r.requirement_id: r for r in scenario.get_requirements({})}
        assert reqs["REQ-FSSAI-CENTRAL-LICENCE"].status == ApplicabilityStatus.NOT_APPLICABLE
        assert reqs["REQ-MEITY-DPDP-CONSUMER-PLATFORM"].status == ApplicabilityStatus.NOT_APPLICABLE

    def test_sahaya_suppression(self):
        """Sahaya must NOT be assigned factory or environmental emission obligations."""
        scenario = MicrofinanceScenario()
        reqs = {r.requirement_id: r for r in scenario.get_requirements({})}
        assert reqs["REQ-UP-FACTORIES-ACT"].status == ApplicabilityStatus.NOT_APPLICABLE
        assert reqs["REQ-UPPCB-CONSENT-POLLUTION"].status == ApplicabilityStatus.NOT_APPLICABLE
        assert reqs["REQ-DGFT-IEC-DOMESTIC"].status == ApplicabilityStatus.NOT_APPLICABLE
        # Unknown licensing status must be preserved as NEEDS_INFORMATION, not guessed
        assert reqs["REQ-RBI-NBFC-MFI-COR"].status == ApplicabilityStatus.NEEDS_INFORMATION


@pytest.mark.django_db
class TestActionDestinationIntegrity:
    """Verify all action links resolve to verified, high-trust official destinations."""

    def test_all_scenario_destinations_resolve(self):
        scenarios = [
            MeridianPharmaScenario(),
            EvChargingScenario(),
            ConstructionScenario(),
            TextileExportScenario(),
            DataCentreScenario(),
            MicrofinanceScenario(),
        ]
        valid_destination_types = {
            ActionDestinationType.EXACT_ACTION_FORM.value,
            ActionDestinationType.OFFICIAL_SERVICE_PAGE.value,
            ActionDestinationType.OFFICIAL_PORTAL_REQUIRES_LOGIN.value,
            ActionDestinationType.ACTION_PAGE_NOT_VERIFIED.value,
        }

        for scenario in scenarios:
            reqs = scenario.get_requirements({})
            for r in reqs:
                if r.status in (ApplicabilityStatus.APPLICABLE, ApplicabilityStatus.NEEDS_INFORMATION):
                    dest = resolve_demo_destination(r.requirement_id)
                    assert dest is not None, f"Missing destination for {r.requirement_id}"
                    assert dest.url.startswith("http"), f"Invalid URL for {r.requirement_id}: {dest.url}"
                    assert dest.destination_type in valid_destination_types
                    assert len(dest.display_label) > 0


@pytest.mark.django_db
class TestAdaptiveIntakeQuestionsSuite:
    """Verify adaptive intake generation produces domain-appropriate questions."""

    def test_scenario_adaptive_question_differentiation(self, user, make_business):
        # 1. EV Charging
        ev_biz = make_business(owner=user, name="VoltGrid Mobility Services Pvt. Ltd.")
        BusinessProfileVersion.objects.create(
            business=ev_biz,
            version=1,
            variables={
                "state": {"value": "MAHARASHTRA", "origin": VariableOrigin.USER_PROVIDED},
                "product_description": {"value": "EV charging station network with DC fast chargers and energy distribution", "origin": VariableOrigin.USER_PROVIDED},
            },
            created_by=user,
        )
        ev_plan = plan_adaptive_smart_questions(ev_biz, round_number=1)
        ev_keys = {q["variable_key"] for q in ev_plan["questions"]}
        ev_text = " ".join([q["question"] for q in ev_plan["questions"]]).lower()
        # Must relate to EV charging / power / infrastructure
        assert any(term in ev_text for term in ["charg", "ev", "electric", "substation", "transformer", "power", "grid"])
        # Sector isolation: must NOT contain food or medical questions
        assert not any(k in ev_keys for k in ["daily_processing_capacity", "food_contact_packaging", "cdsco_device_risk_class"])

        # 2. Construction
        const_biz = make_business(owner=user, name="ApexBuild Infrastructure Pvt. Ltd.")
        BusinessProfileVersion.objects.create(
            business=const_biz,
            version=1,
            variables={
                "state": {"value": "RAJASTHAN", "origin": VariableOrigin.USER_PROVIDED},
                "product_description": {"value": "Civil construction contractor building commercial complexes and earthworks", "origin": VariableOrigin.USER_PROVIDED},
            },
            created_by=user,
        )
        const_plan = plan_adaptive_smart_questions(const_biz, round_number=1)
        const_keys = {q["variable_key"] for q in const_plan["questions"]}
        const_text = " ".join([q["question"] for q in const_plan["questions"]]).lower()
        # Must relate to construction / workers / site
        assert any(term in const_text for term in ["work", "site", "diesel", "labor", "labour", "contractor", "employ"])
        # Sector isolation: must NOT contain medical devices or cloud software
        assert not any(k in const_keys for k in ["cdsco_device_risk_class", "processes_personal_data", "cloud_hosting_location"])

        # 3. Textile Export
        textile_biz = make_business(owner=user, name="SilkRoute Exports Pvt. Ltd.")
        BusinessProfileVersion.objects.create(
            business=textile_biz,
            version=1,
            variables={
                "state": {"value": "TAMIL_NADU", "origin": VariableOrigin.USER_PROVIDED},
                "product_description": {"value": "Apparel merchant export house buying finished garments from vendors", "origin": VariableOrigin.USER_PROVIDED},
            },
            created_by=user,
        )
        textile_plan = plan_adaptive_smart_questions(textile_biz, round_number=1)
        textile_keys = {q["variable_key"] for q in textile_plan["questions"]}
        textile_text = " ".join([q["question"] for q in textile_plan["questions"]]).lower()
        # Must relate to export / warehouse / manufacturing boundary
        assert any(term in textile_text for term in ["export", "manufactur", "warehous", "goods", "import", "ship"])
        # Sector isolation: must NEVER contain factory machinery power load or boiler
        assert "connected_power_load" not in textile_keys
        assert "boiler_installed" not in textile_keys
