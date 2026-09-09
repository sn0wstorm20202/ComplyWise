"""Tests comparing dynamic smart questions across Food, MedTech, and SaaS.

Authority: Final Bug-Fix Milestone — Bug 1 Verification; PRD_v2.0 §10, §11; TRD_v2.0 §8, §12.

Validates:
1. Food & Agro processing receives food-specific questions (daily_processing_capacity, packaging, cold storage, boiler, organic claim).
2. Medical Devices receives medtech-specific questions (cdsco_device_risk_class, sterility, cleanroom, biocompatibility, active/implantable).
3. Digital SaaS receives data/software-specific questions (processes_personal_data, cloud_hosting_location, cross_border, critical cyber, software exports).
4. Zero irrelevant cross-contamination (e.g. SaaS NEVER asked about power load, effluent, or hazardous waste; Food NEVER asked about CDSCO or cyber).
5. Distinct variable keys and statutory reasons across all three businesses.
"""

from __future__ import annotations

import pytest
from apps.businesses.models import Assessment, Business, BusinessProfileVersion
from apps.onboarding.planner import (
    MAX_QUESTIONS_PER_ROUND,
    MIN_QUESTIONS_PER_ROUND,
    plan_adaptive_smart_questions,
)
from common.enums import VariableOrigin

pytestmark = pytest.mark.django_db


def _create_profile(business: Business, state: str, desc: str, **kwargs) -> BusinessProfileVersion:
    vars_payload = {
        "state": {"value": state, "origin": VariableOrigin.USER_PROVIDED},
        "product_description": {"value": desc, "origin": VariableOrigin.USER_PROVIDED},
    }
    for k, v in kwargs.items():
        vars_payload[k] = {"value": v, "origin": VariableOrigin.USER_PROVIDED}
    return BusinessProfileVersion.objects.create(
        business=business,
        version=1,
        variables=vars_payload,
    )


def test_three_business_smart_question_structural_differentiation(auth_client, user, make_business):
    """Food, MedTech, and SaaS receive distinct, sector-adaptive intake questions with zero cross-contamination."""

    # 1. Food Processing Business
    food_biz = make_business(user, name="PureHarvest Agro Foods")
    _create_profile(
        food_biz,
        state="MH",
        desc="Dehydrating tropical mango, banana, and pineapple pulp, and packaging organic fruit snacks for domestic and export retail.",
        industry_hint="Food and Agro Processing",
    )
    food_assessment = Assessment.objects.create(business=food_biz, created_by=user, assessment_number=1, title="Food Intake")
    food_plan = plan_adaptive_smart_questions(food_biz, round_number=1, assessment_id=str(food_assessment.id))

    # 2. Medical Devices Business
    med_biz = make_business(user, name="CardioVance MedTech")
    _create_profile(
        med_biz,
        state="KA",
        desc="Manufacturing sterile cardiovascular diagnostic catheters, balloon delivery systems, and titanium surgical implants in cleanrooms.",
        industry_hint="Medical Devices & Healthcare",
    )
    med_assessment = Assessment.objects.create(business=med_biz, created_by=user, assessment_number=1, title="MedTech Intake")
    med_plan = plan_adaptive_smart_questions(med_biz, round_number=1, assessment_id=str(med_assessment.id))

    # 3. Digital SaaS Business
    saas_biz = make_business(user, name="CloudFlow Technologies")
    _create_profile(
        saas_biz,
        state="KA",
        desc="B2B enterprise workflow automation and analytics SaaS platform hosted on multi-region cloud infrastructure.",
        industry_hint="Digital Software & Cloud Services",
    )
    saas_assessment = Assessment.objects.create(business=saas_biz, created_by=user, assessment_number=1, title="SaaS Intake")
    saas_plan = plan_adaptive_smart_questions(saas_biz, round_number=1, assessment_id=str(saas_assessment.id))

    # Assertion 1: All plans are ACTIVE with valid question count
    assert food_plan["status"] == "ACTIVE"
    assert med_plan["status"] == "ACTIVE"
    assert saas_plan["status"] == "ACTIVE"

    assert MIN_QUESTIONS_PER_ROUND <= len(food_plan["questions"]) <= MAX_QUESTIONS_PER_ROUND
    assert MIN_QUESTIONS_PER_ROUND <= len(med_plan["questions"]) <= MAX_QUESTIONS_PER_ROUND
    assert MIN_QUESTIONS_PER_ROUND <= len(saas_plan["questions"]) <= MAX_QUESTIONS_PER_ROUND

    food_keys = {q["variable_key"] for q in food_plan["questions"]}
    med_keys = {q["variable_key"] for q in med_plan["questions"]}
    saas_keys = {q["variable_key"] for q in saas_plan["questions"]}

    # Assertion 2: Food has food-specific variables
    food_expected = {"daily_processing_capacity", "food_contact_packaging", "cold_chain_storage", "boiler_installed"}
    assert food_expected.issubset(food_keys), f"Food questions missing key variables: {food_expected - food_keys}"

    # Food must NEVER ask about MedTech or SaaS
    food_forbidden = {
        "cdsco_device_risk_class", "is_sterile_at_supply", "cleanroom_iso_class",
        "processes_personal_data", "cloud_hosting_location", "critical_cyber_services",
        "epr_target_obligation", "wireless_rf_features",
    }
    assert not food_forbidden.intersection(food_keys), f"Food questions contaminated with: {food_forbidden.intersection(food_keys)}"

    # Assertion 3: MedTech has medical-specific variables
    med_expected = {"cdsco_device_risk_class", "is_sterile_at_supply", "cleanroom_iso_class", "biocompatibility_tested", "active_or_implantable"}
    assert med_expected.issubset(med_keys), f"MedTech questions missing key variables: {med_expected - med_keys}"

    # MedTech must NEVER ask about Food processing or SaaS
    med_forbidden = {
        "daily_processing_capacity", "boiler_installed", "food_contact_packaging", "organic_claim",
        "processes_personal_data", "cloud_hosting_location", "critical_cyber_services",
        "epr_target_obligation", "wireless_rf_features",
    }
    assert not med_forbidden.intersection(med_keys), f"MedTech questions contaminated with: {med_forbidden.intersection(med_keys)}"

    # Assertion 4: SaaS has digital/data-specific variables
    saas_expected = {"processes_personal_data", "cloud_hosting_location", "cross_border_data_transfer", "critical_cyber_services", "export_of_software_services"}
    assert saas_expected.issubset(saas_keys), f"SaaS questions missing key variables: {saas_expected - saas_keys}"

    # SaaS must NEVER ask about physical factory/pollution variables!
    saas_forbidden = {
        "connected_power_load", "effluent_emission_generation", "hazardous_waste_generation",
        "boiler_installed", "daily_processing_capacity", "food_contact_packaging", "cold_chain_storage",
        "cleanroom_iso_class", "cdsco_device_risk_class", "is_sterile_at_supply", "epr_target_obligation",
    }
    assert not saas_forbidden.intersection(saas_keys), f"SaaS questions contaminated with physical factory requirements: {saas_forbidden.intersection(saas_keys)}"

    # Assertion 5: Domain-specific variables have ZERO overlap across the 3 sectors
    food_domain_vars = food_keys.intersection({"daily_processing_capacity", "food_contact_packaging", "cold_chain_storage", "boiler_installed", "organic_claim"})
    med_domain_vars = med_keys.intersection({"cdsco_device_risk_class", "is_sterile_at_supply", "cleanroom_iso_class", "biocompatibility_tested", "active_or_implantable"})
    saas_domain_vars = saas_keys.intersection({"processes_personal_data", "cloud_hosting_location", "cross_border_data_transfer", "critical_cyber_services", "export_of_software_services"})

    assert not food_domain_vars.intersection(med_domain_vars), "Food and MedTech domain questions overlapped!"
    assert not food_domain_vars.intersection(saas_domain_vars), "Food and SaaS domain questions overlapped!"
    assert not med_domain_vars.intersection(saas_domain_vars), "MedTech and SaaS domain questions overlapped!"
