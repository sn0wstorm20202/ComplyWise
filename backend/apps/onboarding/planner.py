"""Adaptive Smart Question Planner.

Authority: Milestone Task — Objective 2; PRD_v2.0 §10, §11; TRD_v2.0 §8, §12.

Plans high-information questions tailored specifically to a business's operational reality,
products, and industry to uncover statutory compliances, support schemes, and technical standards.
Maps every question to a canonical variable (V01-V43).
Supports iterative rounds with deterministic stopping conditions and links to Assessment instances.
"""

from __future__ import annotations

import json
import logging
import re
from collections import Counter
from typing import Any

from common.enums import KnowledgeStatus
from domain.context.business_context import DerivedBusinessContext, build_business_context
from domain.profile.variables import (
    PROFILE_VARIABLES,
    Relevance,
    get_variable,
    resolve_variable_options,
)
from domain.providers import get_llm_provider
from domain.providers.base import ChatMessage
from apps.businesses.models import Business
from apps.knowledge.models import RequirementDefinition, RuleVersion
from apps.onboarding.models import SmartQuestionInstance, SmartQuestionPlan

logger = logging.getLogger(__name__)

MIN_QUESTIONS_PER_ROUND = 6
MAX_QUESTIONS_PER_ROUND = 10
MAX_ROUNDS = 2

# Regulatory domains identified dynamically from business activity
DOMAIN_FOOD_SAFETY = "FOOD_SAFETY"
DOMAIN_MEDICAL_DEVICES = "MEDICAL_DEVICES"
DOMAIN_DIGITAL_SAAS = "DIGITAL_SAAS"
DOMAIN_ELECTRONICS_HARDWARE = "ELECTRONICS_HARDWARE"
DOMAIN_PRECISION_ENGINEERING = "PRECISION_ENGINEERING"
DOMAIN_LOGISTICS_WAREHOUSING = "LOGISTICS_WAREHOUSING"
DOMAIN_GENERAL_OPERATIONS = "GENERAL_OPERATIONS"

# Domain-specific candidate variables (ordered by regulatory discrimination power)
DOMAIN_CANDIDATE_VARIABLES: dict[str, list[str]] = {
    DOMAIN_FOOD_SAFETY: [
        "daily_processing_capacity",
        "food_contact_packaging",
        "cold_chain_storage",
        "boiler_installed",
        "organic_claim",
        "annual_turnover",
        "total_worker_count",
        "effluent_emission_generation",
        "import_export_intent",
    ],
    DOMAIN_MEDICAL_DEVICES: [
        "cdsco_device_risk_class",
        "is_sterile_at_supply",
        "cleanroom_iso_class",
        "biocompatibility_tested",
        "active_or_implantable",
        "hazardous_waste_generation",
        "annual_turnover",
        "import_export_intent",
        "export_destination",
        "total_worker_count",
    ],
    DOMAIN_DIGITAL_SAAS: [
        "processes_personal_data",
        "cloud_hosting_location",
        "cross_border_data_transfer",
        "critical_cyber_services",
        "export_of_software_services",
        "annual_turnover",
        "total_worker_count",
        "ecommerce_operations",
        "multi_state_operations",
    ],
    DOMAIN_ELECTRONICS_HARDWARE: [
        "wireless_rf_features",
        "bis_crs_product_category",
        "battery_included",
        "epr_target_obligation",
        "annual_turnover",
        "import_export_intent",
        "connected_power_load",
        "hazardous_waste_generation",
        "total_worker_count",
        "ecommerce_operations",
    ],
    DOMAIN_PRECISION_ENGINEERING: [
        "surface_treatment_type",
        "compressed_gas_storage",
        "connected_power_load",
        "effluent_emission_generation",
        "hazardous_waste_generation",
        "annual_turnover",
        "total_worker_count",
        "contract_worker_count",
        "import_export_intent",
        "industrial_zone_status",
    ],
    DOMAIN_LOGISTICS_WAREHOUSING: [
        "warehouse_storage_type",
        "hazardous_goods_handling",
        "fleet_commercial_vehicles",
        "contract_worker_count",
        "multi_state_operations",
        "annual_turnover",
        "total_worker_count",
        "industrial_zone_status",
    ],
    DOMAIN_GENERAL_OPERATIONS: [
        "annual_turnover",
        "total_worker_count",
        "connected_power_load",
        "effluent_emission_generation",
        "hazardous_waste_generation",
        "import_export_intent",
        "contract_worker_count",
        "industrial_zone_status",
        "ecommerce_operations",
        "multi_state_operations",
    ],
}

# Strictly forbidden variables for specific sectors to eliminate irrelevant cross-contamination
DOMAIN_SUPPRESSED_VARIABLES: dict[str, set[str]] = {
    DOMAIN_DIGITAL_SAAS: {
        "connected_power_load",
        "effluent_emission_generation",
        "hazardous_waste_generation",
        "boiler_installed",
        "daily_processing_capacity",
        "food_contact_packaging",
        "cold_chain_storage",
        "cleanroom_iso_class",
        "cdsco_device_risk_class",
        "is_sterile_at_supply",
        "biocompatibility_tested",
        "active_or_implantable",
        "surface_treatment_type",
        "compressed_gas_storage",
        "fleet_commercial_vehicles",
        "epr_target_obligation",
        "battery_included",
        "wireless_rf_features",
        "bis_crs_product_category",
        "warehouse_storage_type",
        "hazardous_goods_handling",
        "industrial_zone_status",
    },
    DOMAIN_FOOD_SAFETY: {
        "cdsco_device_risk_class",
        "is_sterile_at_supply",
        "cleanroom_iso_class",
        "biocompatibility_tested",
        "active_or_implantable",
        "processes_personal_data",
        "cloud_hosting_location",
        "cross_border_data_transfer",
        "critical_cyber_services",
        "export_of_software_services",
        "wireless_rf_features",
        "bis_crs_product_category",
        "battery_included",
        "epr_target_obligation",
        "surface_treatment_type",
        "compressed_gas_storage",
        "fleet_commercial_vehicles",
        "warehouse_storage_type",
        "hazardous_goods_handling",
    },
    DOMAIN_MEDICAL_DEVICES: {
        "daily_processing_capacity",
        "boiler_installed",
        "food_contact_packaging",
        "cold_chain_storage",
        "organic_claim",
        "processes_personal_data",
        "cloud_hosting_location",
        "cross_border_data_transfer",
        "critical_cyber_services",
        "export_of_software_services",
        "surface_treatment_type",
        "compressed_gas_storage",
        "fleet_commercial_vehicles",
        "warehouse_storage_type",
        "hazardous_goods_handling",
        "epr_target_obligation",
        "wireless_rf_features",
        "bis_crs_product_category",
    },
    DOMAIN_ELECTRONICS_HARDWARE: {
        "daily_processing_capacity",
        "boiler_installed",
        "food_contact_packaging",
        "cold_chain_storage",
        "organic_claim",
        "cdsco_device_risk_class",
        "is_sterile_at_supply",
        "biocompatibility_tested",
        "active_or_implantable",
        "processes_personal_data",
        "cloud_hosting_location",
        "cross_border_data_transfer",
        "critical_cyber_services",
        "surface_treatment_type",
        "compressed_gas_storage",
    },
    DOMAIN_PRECISION_ENGINEERING: {
        "daily_processing_capacity",
        "boiler_installed",
        "food_contact_packaging",
        "cold_chain_storage",
        "organic_claim",
        "cdsco_device_risk_class",
        "is_sterile_at_supply",
        "cleanroom_iso_class",
        "biocompatibility_tested",
        "active_or_implantable",
        "processes_personal_data",
        "cloud_hosting_location",
        "cross_border_data_transfer",
        "critical_cyber_services",
        "export_of_software_services",
        "wireless_rf_features",
        "bis_crs_product_category",
        "battery_included",
        "epr_target_obligation",
    },
    DOMAIN_LOGISTICS_WAREHOUSING: {
        "daily_processing_capacity",
        "boiler_installed",
        "food_contact_packaging",
        "cdsco_device_risk_class",
        "is_sterile_at_supply",
        "cleanroom_iso_class",
        "biocompatibility_tested",
        "active_or_implantable",
        "wireless_rf_features",
        "bis_crs_product_category",
        "surface_treatment_type",
    },
}

QUESTION_PLANNER_SYSTEM_PROMPT = """You are an expert industrial compliance and regulatory intake planner for ComplyWise.
Your task is to generate 7 to 10 high-value intake questions tailored precisely to what this specific business actually manufactures, processes, or operates.

THE CORE PHILOSOPHY:
You must NOT produce a generic static checklist. You must understand the specific industry, product categories, operating scale, and operational processes of THIS business.
Frame questions so that a founder immediately recognizes they are tailored to their specific operational reality:
- Medical device manufacturing: talk about CDSCO risk classification, cleanrooms, sterilization, bio-medical waste, biocompatibility, and technical standards.
- Food & agro processing: talk about daily processing throughput, food contact packaging, cold chain storage, industrial steam boilers, food safety standards, and organic certification.
- Digital, Software & SaaS: talk about user personal data, cloud infrastructure regions, cross-border transfers, CERT-In directions, and software exports.
- Electronics & Hardware: talk about wireless RF ETA, BIS CRS safety testing, batteries, and CPCB e-waste EPR obligations.
- Precision engineering: talk about CNC machining, surface treatments (electroplating), compressed gas, effluent, and pollution categories.

CRITICAL RULES:
1. Every question MUST map to one of the provided CANDIDATE_VARIABLE_KEYS using its exact variable_id.
2. Do NOT invent unrecognized variable IDs.
3. Do NOT ask for variables in the SUPPRESSED_VARIABLES list.
4. Do NOT ask for information that is already known in KNOWN_VARIABLES.
5. Frame questions in natural, professional, founder-friendly conversational English mentioning the enterprise's actual domain.
6. Provide a clear reason explaining why this question matters for statutory compliance, government incentives/subsidies (schemes), or technical standards/certifications.
7. Target approximately 7 to 10 high-value questions (minimum 6, maximum 10).
8. Return ONLY a valid JSON object matching the contract below.

OUTPUT FORMAT (JSON ONLY, NO MARKDOWN, NO CODEBLOCKS):
{
  "personalization_summary": "Tailored intake questions formulated for <Business Name> based on its <activity> in <State>.",
  "questions": [
    {
      "question_id": "Q_cdsco_device_risk_class",
      "question_text": "Under the Medical Device Rules 2017, what is the risk classification of your manufactured medical devices (Class A, B, C, or D)?",
      "variable_id": "cdsco_device_risk_class",
      "answer_type": "SINGLE_CHOICE",
      "allowed_values": ["CLASS_A_LOW", "CLASS_B_LOW_MODERATE", "CLASS_C_MODERATE_HIGH", "CLASS_D_HIGH"],
      "priority": 1,
      "information_gain": 0.98,
      "reason": "Class A & B devices are licensed by State Licensing Authorities, whereas Class C & D devices mandate Central CDSCO manufacturing licensing.",
      "domains": ["COMPLIANCE", "STANDARDS"]
    }
  ]
}
"""


def derive_relevant_domains(context: DerivedBusinessContext) -> list[str]:
    """Derive applicable regulatory domains from operational context using word boundaries."""
    combined = f"{context.product_description or ''} {context.industry_hint or ''} {context.primary_activity or ''}".lower()
    domains: list[str] = []

    # 1. Digital, Software & SaaS
    saas_patterns = [
        r"\bsaas\b", r"\bsoftware\b", r"\bcloud\b", r"\bdigital\b", r"\bplatform\b",
        r"\bit services\b", r"\bweb application\b", r"\bmobile app\b", r"\bcyber\b",
        r"\bai platform\b", r"\bdata analytics\b", r"\bfintech\b", r"\bedtech\b",
        r"\bapi service\b"
    ]
    if any(re.search(p, combined) for p in saas_patterns):
        domains.append(DOMAIN_DIGITAL_SAAS)

    # 2. Medical Devices & Healthcare Equipment
    med_patterns = [
        r"\bmed\b", r"\bmedical\b", r"\bdevice\b", r"\bdevices\b", r"\bsurgical\b",
        r"\bdiagnostic\b", r"\bimplant\b", r"\bimplants\b", r"\bhospital\b",
        r"\bclinical\b", r"\borthopaedic\b", r"\bcatheter\b", r"\bstent\b",
        r"\bbiomed\b", r"\bbiomedical\b", r"\bcdsco\b", r"\bin-vitro\b",
        r"\bhealthcare\b"
    ]
    if any(re.search(p, combined) for p in med_patterns):
        domains.append(DOMAIN_MEDICAL_DEVICES)

    # 3. Food & Agro Processing
    food_patterns = [
        r"\bfood\b", r"\bfoods\b", r"\bfruit\b", r"\bfruits\b", r"\bbeverage\b",
        r"\bbeverages\b", r"\bsnack\b", r"\bsnacks\b", r"\bdehydrat", r"\bdairy\b",
        r"\bbakery\b", r"\bspice\b", r"\bspices\b", r"\bagro\b", r"\bgrain\b",
        r"\bgrains\b", r"\btea\b", r"\bcoffee\b", r"\bmeat\b", r"\bfish\b",
        r"\bedible\b", r"\bjuice\b", r"\bpulp\b", r"\bfssai\b", r"\borganic food\b"
    ]
    if any(re.search(p, combined) for p in food_patterns):
        domains.append(DOMAIN_FOOD_SAFETY)

    # 4. Electronics & Hardware
    elec_patterns = [
        r"\belectronic\b", r"\belectronics\b", r"\bhardware\b", r"\bpcb\b",
        r"\bsemiconductor\b", r"\biot\b", r"\bsensor\b", r"\bsensors\b",
        r"\bcircuit\b", r"\bbattery\b", r"\bbatteries\b", r"\btelecom hardware\b",
        r"\bled lighting\b", r"\bappliance\b"
    ]
    if any(re.search(p, combined) for p in elec_patterns):
        domains.append(DOMAIN_ELECTRONICS_HARDWARE)

    # 5. Precision Engineering & Automotive
    eng_patterns = [
        r"\bmachin", r"\bmetal\b", r"\bcnc\b", r"\bprecision\b", r"\bgear\b",
        r"\bgears\b", r"\bfastener\b", r"\bfasteners\b", r"\bcasting\b",
        r"\bforging\b", r"\btooling\b", r"\bautomotive\b", r"\bauto component",
        r"\bengine\b", r"\bfabrication\b", r"\blathe\b"
    ]
    if any(re.search(p, combined) for p in eng_patterns):
        domains.append(DOMAIN_PRECISION_ENGINEERING)

    # 6. Logistics & Warehousing
    log_patterns = [
        r"\bwarehouse\b", r"\bwarehousing\b", r"\blogistics\b", r"\bfreight\b",
        r"\btransport\b", r"\bfleet\b", r"\bfulfillment\b", r"\bsupply chain\b"
    ]
    if any(re.search(p, combined) for p in log_patterns):
        domains.append(DOMAIN_LOGISTICS_WAREHOUSING)

    if not domains:
        domains.append(DOMAIN_GENERAL_OPERATIONS)

    return domains


def _extract_ast_variables(node: Any) -> set[str]:
    found: set[str] = set()
    if isinstance(node, dict):
        if "var" in node and isinstance(node["var"], str):
            found.add(node["var"].strip())
        for v in node.values():
            found.update(_extract_ast_variables(v))
    elif isinstance(node, list):
        for item in node:
            found.update(_extract_ast_variables(item))
    return found


# Statutory rationale and founder questions for canonical variables V01-V43
CANONICAL_VARIABLE_SPECIFICATIONS: dict[str, dict[str, Any]] = {
    # Food & Agro (V20-V24)
    "daily_processing_capacity": {
        "question_text": "What is your projected daily manufacturing or processing throughput (in metric tonnes per day)?",
        "reason": "Production throughput over 2 MT/day mandates FSSAI Central License under Schedule 1; lower throughput falls under State Licensing.",
        "domains": ["COMPLIANCE"],
        "priority": 1,
        "information_gain": 0.96,
    },
    "food_contact_packaging": {
        "question_text": "Does your facility use packaging materials that come into direct contact with food products?",
        "reason": "Direct food contact packaging requires IS 9845 migration compliance testing and FSSAI Packaging Regulations declarations.",
        "domains": ["COMPLIANCE", "STANDARDS"],
        "priority": 1,
        "information_gain": 0.94,
    },
    "cold_chain_storage": {
        "question_text": "Does your enterprise operate temperature-controlled cold storage, chilling rooms, or deep freeze units?",
        "reason": "Cold storage triggers FSSAI cold chain compliance, continuous temperature logging, and unlocks PMKSY capital subsidy schemes.",
        "domains": ["COMPLIANCE", "SCHEMES"],
        "priority": 2,
        "information_gain": 0.91,
    },
    "boiler_installed": {
        "question_text": "Does your facility operate an industrial steam boiler for heating, cooking, or sanitization?",
        "reason": "Steam boilers mandate Indian Boilers Act registration, annual hydraulic test certification, and qualified boiler attendants.",
        "domains": ["COMPLIANCE"],
        "priority": 2,
        "information_gain": 0.92,
    },
    "organic_claim": {
        "question_text": "Do you market or plan to label your food products as 'Organic' or 'Jaivik Bharat'?",
        "reason": "Organic food claims require NPOP third-party certification and FSSAI Organic Food Regulations registration before commercial sale.",
        "domains": ["COMPLIANCE", "STANDARDS"],
        "priority": 3,
        "information_gain": 0.88,
    },

    # Medical Devices (V25-V29)
    "cdsco_device_risk_class": {
        "question_text": "Under Medical Device Rules 2017, what is the risk classification of your manufactured medical devices (Class A, B, C, or D)?",
        "reason": "Class A & B devices are licensed by the State Licensing Authority (Form MD-5); Class C & D devices mandate Central CDSCO licensing (Form MD-9).",
        "domains": ["COMPLIANCE"],
        "priority": 1,
        "information_gain": 0.98,
    },
    "is_sterile_at_supply": {
        "question_text": "Are your medical devices supplied to healthcare providers in a terminally sterile condition?",
        "reason": "Sterile supply mandates ISO 11135 / ISO 11137 sterilization validation dossiers and cleanroom bioburden monitoring.",
        "domains": ["COMPLIANCE", "STANDARDS"],
        "priority": 1,
        "information_gain": 0.95,
    },
    "cleanroom_iso_class": {
        "question_text": "What ISO classification is maintained for your manufacturing and packaging cleanrooms (e.g. ISO Class 7, Class 8)?",
        "reason": "Cleanroom validation under ISO 14644 is a mandatory prerequisite for CDSCO medical device manufacturing inspection audits.",
        "domains": ["COMPLIANCE", "STANDARDS"],
        "priority": 1,
        "information_gain": 0.94,
    },
    "biocompatibility_tested": {
        "question_text": "Have the patient-contacting materials in your medical device undergone ISO 10993 biocompatibility testing?",
        "reason": "ISO 10993 biological safety test reports are mandatory technical attachments for CDSCO medical device registration dossiers.",
        "domains": ["STANDARDS", "COMPLIANCE"],
        "priority": 2,
        "information_gain": 0.92,
    },
    "active_or_implantable": {
        "question_text": "What is the primary operational category of your medical device (e.g. active electro-medical, implantable, IVD)?",
        "reason": "Active devices require IEC 60601 electrical safety compliance; implants require post-market clinical follow-up registries.",
        "domains": ["COMPLIANCE", "STANDARDS"],
        "priority": 2,
        "information_gain": 0.93,
    },

    # Digital & Software SaaS (V30-V34)
    "processes_personal_data": {
        "question_text": "Does your software, platform, or mobile application collect or process personal data of users in India?",
        "reason": "Data fiduciaries must comply with Digital Personal Data Protection (DPDP) Act notice, consent, and grievance redressal mandates.",
        "domains": ["COMPLIANCE"],
        "priority": 1,
        "information_gain": 0.97,
    },
    "cloud_hosting_location": {
        "question_text": "Where is your primary production cloud infrastructure and database hosted (India Domestic vs Multi-Region Global)?",
        "reason": "Infrastructure location determines compliance with RBI/CERT-In data residency directives and cross-border transfer frameworks.",
        "domains": ["COMPLIANCE", "STANDARDS"],
        "priority": 1,
        "information_gain": 0.94,
    },
    "cross_border_data_transfer": {
        "question_text": "Does your application architecture transfer user data or analytical telemetry across international borders?",
        "reason": "Cross-border data transfers are subject to Central Government destination restrictions and DPDP Act security safeguards.",
        "domains": ["COMPLIANCE"],
        "priority": 1,
        "information_gain": 0.92,
    },
    "critical_cyber_services": {
        "question_text": "Does your company offer cloud hosting, VPN, virtual private servers, or critical data processing services?",
        "reason": "CERT-In Cyber Security Directions mandate maintaining user logs for 5 years and reporting cyber incidents within 6 hours.",
        "domains": ["COMPLIANCE"],
        "priority": 2,
        "information_gain": 0.90,
    },
    "export_of_software_services": {
        "question_text": "Does your business export SaaS software, digital platforms, or IT services to international clients?",
        "reason": "Software exports mandate STPI/SOFTEX filings with RBI and foreign exchange realization compliance under FEMA.",
        "domains": ["COMPLIANCE", "SCHEMES"],
        "priority": 2,
        "information_gain": 0.89,
    },

    # Electronics & Hardware (V35-V38)
    "wireless_rf_features": {
        "question_text": "Do your electronic products incorporate wireless RF modules (such as Wi-Fi, Bluetooth, 4G/5G, or LoRa)?",
        "reason": "Radio transmitters require Equipment Type Approval (ETA) and Import Licensing from WPC (Wireless Planning & Coordination).",
        "domains": ["COMPLIANCE", "STANDARDS"],
        "priority": 1,
        "information_gain": 0.94,
    },
    "bis_crs_product_category": {
        "question_text": "Does your electronic product category fall under the BIS Compulsory Registration Scheme (CRS)?",
        "reason": "Notified electronics cannot be manufactured or sold in India without mandatory safety testing and BIS CRS registration.",
        "domains": ["COMPLIANCE", "STANDARDS"],
        "priority": 1,
        "information_gain": 0.96,
    },
    "battery_included": {
        "question_text": "Do your hardware devices include integrated rechargeable lithium-ion cells or secondary battery packs?",
        "reason": "Batteries mandate compliance with Battery Waste Management Rules 2022 EPR targets and BIS IS 16046 safety testing.",
        "domains": ["COMPLIANCE", "STANDARDS"],
        "priority": 2,
        "information_gain": 0.91,
    },
    "epr_target_obligation": {
        "question_text": "As a producer or brand owner of electronic equipment, do you hold CPCB EPR registration for e-waste?",
        "reason": "CPCB E-Waste Management Rules mandate producer registration and meeting annual recycling targets through authorized recyclers.",
        "domains": ["COMPLIANCE"],
        "priority": 2,
        "information_gain": 0.90,
    },

    # Logistics & Warehousing (V39-V41)
    "warehouse_storage_type": {
        "question_text": "What classification of storage does your warehouse facility handle (e.g. general, cold chain, hazardous, bonded)?",
        "reason": "Warehouse classification determines fire safety NOC norms, WDRA registration eligibility, and commercial zoning clearances.",
        "domains": ["COMPLIANCE"],
        "priority": 1,
        "information_gain": 0.93,
    },
    "hazardous_goods_handling": {
        "question_text": "Does your facility store or handle dangerous goods, flammable liquids, or toxic chemicals in bulk?",
        "reason": "Requires District Magistrate storage NOC, PESO petroleum licenses, and MSIHC (Hazardous Chemical) safety audits.",
        "domains": ["COMPLIANCE"],
        "priority": 1,
        "information_gain": 0.95,
    },
    "fleet_commercial_vehicles": {
        "question_text": "Does your business own or operate a dedicated fleet of commercial transport vehicles?",
        "reason": "Commercial fleet mandates national/state transport permits, FASTag, and AIS-140 GPS tracking compliance.",
        "domains": ["COMPLIANCE"],
        "priority": 2,
        "information_gain": 0.88,
    },

    # Precision Engineering & Automotive (V42-V43)
    "surface_treatment_type": {
        "question_text": "What metal finishing or surface treatments are performed (e.g. electroplating, phosphating, powder coating)?",
        "reason": "Electroplating is categorized as Red Category by CPCB requiring dedicated ETP, zero liquid discharge, or hazardous waste disposal.",
        "domains": ["COMPLIANCE", "STANDARDS"],
        "priority": 1,
        "information_gain": 0.95,
    },
    "compressed_gas_storage": {
        "question_text": "Does your facility maintain bulk storage of compressed industrial gases, LPG, or cryogenic fluids?",
        "reason": "Pressurized gas storage requires PESO approval under the Static and Mobile Pressure Vessels (SMPV) Rules.",
        "domains": ["COMPLIANCE"],
        "priority": 2,
        "information_gain": 0.91,
    },

    # Core & Threshold Variables (V07, V11, V13-V19)
    "annual_turnover": {
        "question_text": "What is your projected or current annual business turnover (in INR)?",
        "reason": "Turnover determines statutory licensing brackets (e.g. Central vs State authority), MSME enterprise scale, and GST filing thresholds.",
        "domains": ["COMPLIANCE", "SCHEMES"],
        "priority": 1,
        "information_gain": 0.95,
    },
    "connected_power_load": {
        "question_text": "What is the anticipated connected electrical power load (in HP) for your manufacturing facility?",
        "reason": "Connected electrical load determines registration thresholds under state Factory Acts and Pollution Control Board consent categories.",
        "domains": ["COMPLIANCE", "STANDARDS"],
        "priority": 1,
        "information_gain": 0.93,
    },
    "effluent_emission_generation": {
        "question_text": "Will your manufacturing, processing, or cleaning operations produce liquid trade effluent or air emissions?",
        "reason": "Discharges and emissions mandate Consent to Establish (CTE) and Consent to Operate (CTO) from the State Pollution Control Board under Water & Air Acts.",
        "domains": ["COMPLIANCE"],
        "priority": 1,
        "information_gain": 0.92,
    },
    "hazardous_waste_generation": {
        "question_text": "Will your facility generate, store, or handle hazardous waste (such as chemical sludge, solvent residues, or toxic scrap)?",
        "reason": "Hazardous waste handling requires dedicated statutory authorization under CPCB/SPCB Hazardous Waste Management Rules.",
        "domains": ["COMPLIANCE", "STANDARDS"],
        "priority": 2,
        "information_gain": 0.90,
    },
    "total_worker_count": {
        "question_text": "What is your anticipated total workforce (including operators, technical staff, and supervisors)?",
        "reason": "Workforce size determines applicability of the Factories Act (thresholds at 10 or 20 workers), EPF, and ESI employee social security registrations.",
        "domains": ["COMPLIANCE", "SCHEMES"],
        "priority": 2,
        "information_gain": 0.88,
    },
    "contract_worker_count": {
        "question_text": "Do you plan to engage contract labour or third-party personnel for operations, packing, or facility maintenance?",
        "reason": "Engaging contract labour triggers principal employer registration under the Contract Labour (Regulation and Abolition) Act once statutory thresholds are reached.",
        "domains": ["COMPLIANCE"],
        "priority": 3,
        "information_gain": 0.84,
    },
    "import_export_intent": {
        "question_text": "Do you plan to engage in international cross-border trade (importing raw materials or exporting finished products)?",
        "reason": "Cross-border trade mandates an Importer-Exporter Code (IEC) from DGFT, customs duty authorizations, and unlocks export incentive schemes.",
        "domains": ["COMPLIANCE", "SCHEMES", "STANDARDS"],
        "priority": 2,
        "information_gain": 0.91,
    },
    "export_destination": {
        "question_text": "Which destination countries or regions do you plan to export to (e.g. US, European Union, Southeast Asia, Middle East)?",
        "reason": "Specific destination jurisdictions require harmonized technical standards, country-specific testing dossiers, and quality certifications.",
        "domains": ["STANDARDS", "SCHEMES"],
        "priority": 3,
        "information_gain": 0.82,
    },
    "industrial_zone_status": {
        "question_text": "Is your facility located inside a notified industrial area / technology park or outside?",
        "reason": "Zoning status affects municipal trade approvals, pollution board siting restrictions, and state industrial policy capital subsidies.",
        "domains": ["COMPLIANCE", "SCHEMES"],
        "priority": 3,
        "information_gain": 0.85,
    },
    "ecommerce_operations": {
        "question_text": "Will you sell products directly to consumers or business clients through online platforms or digital e-commerce channels?",
        "reason": "Digital sales introduce Legal Metrology e-commerce declarations, consumer protection mandates, and multi-state GST tax registrations.",
        "domains": ["COMPLIANCE"],
        "priority": 3,
        "information_gain": 0.80,
    },
    "multi_state_operations": {
        "question_text": "Do you plan to operate manufacturing, warehousing, or sales facilities across more than one Indian state?",
        "reason": "Inter-state presence determines Central versus State regulatory jurisdiction and triggers multi-state GST and regulatory compliance registrations.",
        "domains": ["COMPLIANCE"],
        "priority": 3,
        "information_gain": 0.81,
    },
    "plant_machinery_investment": {
        "question_text": "What is your enterprise's investment in plant and machinery or equipment (in INR)?",
        "reason": "Investment determines MSME classification thresholds under MSMED Act and subsidy eligibility under central/state capital schemes.",
        "domains": ["SCHEMES"],
        "priority": 2,
        "information_gain": 0.86,
    },
    "ownership_social_category": {
        "question_text": "What is the primary social category of enterprise ownership (e.g. General, SC, ST, OBC)?",
        "reason": "SC/ST entrepreneurs qualify for specialized central procurement mandates and enhanced capital subsidies under MSME schemes.",
        "domains": ["SCHEMES"],
        "priority": 4,
        "information_gain": 0.70,
    },
    "ownership_gender": {
        "question_text": "Is the enterprise majority woman-owned?",
        "reason": "Woman-owned enterprises qualify for preferential credit access, concessional guarantee fees, and dedicated MSME scheme grants.",
        "domains": ["SCHEMES"],
        "priority": 4,
        "information_gain": 0.72,
    },
}


def _build_context_driven_fallback_questions(
    context: DerivedBusinessContext,
    candidate_keys: list[str],
    var_frequency: Counter[str],
) -> list[dict[str, Any]]:
    """Generate dynamic, context-tailored questions mapped strictly to canonical variables."""
    fallback_items: list[dict[str, Any]] = []
    for k in candidate_keys:
        var_def = get_variable(k)
        if not var_def:
            continue

        spec = CANONICAL_VARIABLE_SPECIFICATIONS.get(k)
        if spec:
            fallback_items.append({
                "question_id": f"Q_{k}",
                "variable_id": k,
                "question_text": spec["question_text"],
                "answer_type": str(var_def.data_type),
                "allowed_values": [opt.value for opt in var_def.options] if var_def.options else [],
                "priority": spec.get("priority", 2),
                "information_gain": spec.get("information_gain", 0.85),
                "reason": spec["reason"],
                "domains": spec.get("domains", ["COMPLIANCE"]),
            })
        else:
            label = var_def.label
            if label.lower().startswith("generates ") or label.lower().startswith("sells ") or label.lower().startswith("operates "):
                q_text = f"Does your enterprise {label.lower()}?"
            elif not label.endswith("?"):
                q_text = f"What is your enterprise's {label.lower()}?"
            else:
                q_text = label

            fallback_items.append({
                "question_id": f"Q_{k}",
                "variable_id": k,
                "question_text": q_text,
                "answer_type": str(var_def.data_type),
                "allowed_values": [opt.value for opt in var_def.options] if var_def.options else [],
                "priority": 1 if (var_def.default_relevance == Relevance.CORE or var_frequency.get(k, 0) > 0) else 3,
                "information_gain": 0.90 if var_frequency.get(k, 0) > 0 else 0.75,
                "reason": var_def.why_it_matters or "Statutory classification variable for industrial compliance and approvals.",
                "domains": ["COMPLIANCE"],
            })

    return fallback_items


def plan_adaptive_smart_questions(
    business: Business,
    round_number: int = 1,
    assessment_id: str | None = None,
) -> dict[str, Any]:
    """Dynamically plan adaptive smart questions for a business.

    1. Derives relevant regulatory domains from business activity.
    2. Identifies domain-relevant variables and strictly suppresses irrelevant variables.
    3. Respects multi-round progression, adapting based on prior answers.
    4. Terminates cleanly when all critical variables are satisfied or max rounds are reached.
    """
    context = build_business_context(business)

    # Resolve assessment if passed
    assessment = None
    if assessment_id:
        assessment = business.assessments.filter(pk=assessment_id).first()
    if assessment is None:
        assessment = business.assessments.order_by("-assessment_number").first()

    # Derive active domains from business activity
    domains = derive_relevant_domains(context)

    # Build suppressed variables set for the business's domains
    suppressed_vars: set[str] = set()
    for d in domains:
        suppressed_vars.update(DOMAIN_SUPPRESSED_VARIABLES.get(d, set()))

    # Candidate requirements for business jurisdiction
    reqs_query = RequirementDefinition.objects.filter(status=KnowledgeStatus.PUBLISHED)
    jurisdictions = {"CENTRAL"}
    if context.state:
        jurisdictions.add(context.state)
    if context.state_name:
        jurisdictions.add(context.state_name)
        jurisdictions.add(context.state_name.upper())
    raw_st = str(context.raw_variables.get("state") or "").strip()
    if raw_st:
        jurisdictions.add(raw_st)
        jurisdictions.add(raw_st.upper())
    reqs_query = reqs_query.filter(jurisdiction__in=list(jurisdictions))

    candidate_req_ids = set(reqs_query.values_list("requirement_id", flat=True))
    candidate_rules = RuleVersion.objects.filter(
        requirement__requirement_id__in=candidate_req_ids,
        status=KnowledgeStatus.PUBLISHED,
    )

    var_frequency: Counter[str] = Counter()
    for rule in candidate_rules:
        for rv in _extract_ast_variables(rule.condition_ast):
            var_frequency[rv] += 1

    # 1. Missing variables referenced in candidate published rules (excluding suppressed)
    missing_rule_vars = [
        k for k in sorted(
            [k for k in var_frequency if k in context.missing_variable_keys and k not in suppressed_vars],
            key=lambda k: var_frequency[k],
            reverse=True,
        )
    ]

    # 2. Domain-specific candidate variables (strictly tailored to detected domains)
    domain_candidates: list[str] = []
    for d in domains:
        for vk in DOMAIN_CANDIDATE_VARIABLES.get(d, []):
            if vk not in suppressed_vars and vk not in domain_candidates:
                domain_candidates.append(vk)

    # Multi-round adaptive filtering
    if round_number > 1:
        # In round 2, check prior answers to branch intelligently
        prior_trade = context.raw_variables.get("import_export_intent")
        if prior_trade in {"EXPORT_ONLY", "IMPORT_AND_EXPORT"} and "export_destination" not in context.known_variable_keys:
            if "export_destination" not in domain_candidates:
                domain_candidates.insert(0, "export_destination")

        if context.raw_variables.get("processes_personal_data") is True:
            if "cross_border_data_transfer" not in context.known_variable_keys and "cross_border_data_transfer" not in domain_candidates:
                domain_candidates.insert(0, "cross_border_data_transfer")

    # Filter candidates to only unanswered missing variables
    domain_missing = [
        k for k in domain_candidates
        if k in context.missing_variable_keys and k not in suppressed_vars
    ]

    # Published rule-dependent variables have the highest information gain.
    # Prioritize missing rule variables at the top of candidate keys (excluding suppressed).
    candidate_keys = list(dict.fromkeys(missing_rule_vars + domain_missing))

    # Stopping condition: No missing domain variables or max rounds exhausted
    if not candidate_keys or round_number > MAX_ROUNDS:
        reason = "ROUNDS_EXHAUSTED" if round_number > MAX_ROUNDS else "ALL_CRITICAL_VARIABLES_SATISFIED"
        plan, _ = SmartQuestionPlan.objects.get_or_create(
            business=business,
            round_number=round_number,
            defaults={"status": "COMPLETED", "stopping_reason": reason, "assessment": assessment},
        )
        if assessment and not assessment.question_plan:
            assessment.question_plan = plan
            assessment.save(update_fields=["question_plan"])

        return {
            "business_id": str(business.id),
            "business_name": business.name,
            "assessment_id": str(assessment.id) if assessment else None,
            "round": round_number,
            "status": "COMPLETED",
            "stopping_reason": reason,
            "personalization_header": f"Assessment complete for {business.name}",
            "personalization_subtitle": "All necessary profile details have been collected.",
            "questions": [],
            "total_questions": 0,
            "total_missing": len(context.missing_variable_keys),
            "known_variables_count": len(context.known_variable_keys),
            "context_summary": context.as_dict(),
        }

    # Prepare structured candidate variable specifications for LLM input
    var_specs = []
    for k in candidate_keys[:MAX_QUESTIONS_PER_ROUND]:
        var_def = get_variable(k)
        if var_def:
            var_specs.append({
                "variable_id": var_def.key,
                "label": var_def.label,
                "data_type": str(var_def.data_type),
                "why_it_matters": var_def.why_it_matters,
                "options": [opt.value for opt in var_def.options] if var_def.options else [],
                "rule_dependency_count": var_frequency.get(k, 0),
            })

    known_vars_summary = {
        k: context.raw_variables.get(k)
        for k in context.known_variable_keys
    }

    planned_items: list[dict[str, Any]] = []
    personalization_summary = f"Questions tailored to {business.name} ({', '.join(domains)})"

    provider = get_llm_provider()
    if provider.is_configured:
        prompt = f"""BUSINESS PROFILE CONTEXT:
Business Name: {business.name}
Legal Constitution: {context.legal_constitution or 'Not specified'}
State / Jurisdiction: {context.state_name} ({context.state})
Primary Activity: {context.primary_activity or 'Industrial Operations'}
Products / Activity Description:
{context.product_description}

Regulatory Domains Identified: {", ".join(domains)}
Enterprise Scale (MSMED Act): {context.msme_scale}

KNOWN VARIABLES (DO NOT ASK FOR THESE):
{json.dumps(known_vars_summary, indent=2)}

CANDIDATE DOMAIN-FILTERED VARIABLES TO CHOOSE FROM:
{json.dumps(var_specs, indent=2)}

Formulate approximately 7 to 10 high-value questions (minimum 6, maximum {MAX_QUESTIONS_PER_ROUND}) tailored specifically to this business's operational reality."""

        try:
            res = provider.complete(
                [
                    ChatMessage(role="system", content=QUESTION_PLANNER_SYSTEM_PROMPT),
                    ChatMessage(role="user", content=prompt),
                ],
                temperature=0.1,
                max_output_tokens=2000,
            )
            content = res.text.strip()
            if content.startswith("```"):
                lines = content.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                content = "\n".join(lines).strip()

            parsed = json.loads(content)
            personalization_summary = parsed.get("personalization_summary") or personalization_summary
            raw_qs = parsed.get("questions", [])

            valid_keys_set = set(candidate_keys)
            seen_vars: set[str] = set()

            for item in raw_qs:
                var_key = item.get("variable_id") or item.get("variable_key")
                if not var_key or var_key not in valid_keys_set or var_key in seen_vars or var_key in suppressed_vars:
                    continue
                seen_vars.add(var_key)

                domains_val = item.get("domains")
                if not isinstance(domains_val, list) or not domains_val:
                    domains_val = ["COMPLIANCE"]
                domains_val = [d for d in domains_val if d in {"COMPLIANCE", "SCHEMES", "STANDARDS"}] or ["COMPLIANCE"]

                planned_items.append({
                    "question_id": item.get("question_id") or f"Q_{var_key}",
                    "variable_key": var_key,
                    "question_text": str(item.get("question_text", "")).strip(),
                    "why_it_matters": str(item.get("reason", "")).strip() or str(item.get("why_it_matters", "")).strip(),
                    "reason": str(item.get("reason", "")).strip(),
                    "domains": domains_val,
                    "priority": item.get("priority", 1),
                    "information_gain": float(item.get("information_gain", 0.90)),
                })
        except Exception as e:
            logger.warning("LLM question planning failed, using dynamic context fallback: %s", e)

    # Fallback to dynamic context-driven question generation if LLM was unavailable or returned insufficient items
    if len(planned_items) < MIN_QUESTIONS_PER_ROUND:
        logger.info("Using context-driven dynamic question fallback for %s", business.name)
        fallback_items = _build_context_driven_fallback_questions(context, candidate_keys, var_frequency)

        existing_keys = {item["variable_key"] for item in planned_items}
        for fb in fallback_items:
            vk = fb["variable_id"]
            if vk not in existing_keys and vk not in suppressed_vars:
                planned_items.append({
                    "question_id": fb["question_id"],
                    "variable_key": vk,
                    "question_text": fb["question_text"],
                    "why_it_matters": fb["reason"],
                    "reason": fb["reason"],
                    "domains": fb["domains"],
                    "priority": fb["priority"],
                    "information_gain": fb["information_gain"],
                })
                existing_keys.add(vk)
    # Guarantee that candidate rule-dependent variables (excluding suppressed) are included in planned items
    existing_keys = {item["variable_key"] for item in planned_items}
    for mk in missing_rule_vars:
        if mk not in existing_keys and mk not in suppressed_vars:
            fb_list = _build_context_driven_fallback_questions(context, [mk], var_frequency)
            if fb_list:
                fb = fb_list[0]
                planned_items.insert(0, {
                    "question_id": fb["question_id"],
                    "variable_key": mk,
                    "question_text": fb["question_text"],
                    "why_it_matters": fb["reason"],
                    "reason": fb["reason"],
                    "domains": fb["domains"],
                    "priority": fb["priority"],
                    "information_gain": fb["information_gain"],
                })
                existing_keys.add(mk)

    # Cap at MAX_QUESTIONS_PER_ROUND
    planned_items = planned_items[:MAX_QUESTIONS_PER_ROUND]

    # Create SmartQuestionPlan and SmartQuestionInstances in DB
    plan = SmartQuestionPlan.objects.create(
        business=business,
        assessment=assessment,
        round_number=round_number,
        status="ACTIVE",
    )

    if assessment:
        assessment.question_plan = plan
        assessment.save(update_fields=["question_plan"])

    output_questions: list[dict[str, Any]] = []
    for item in planned_items:
        k = item["variable_key"]
        var_def = get_variable(k)
        if not var_def:
            continue

        q_inst = SmartQuestionInstance.objects.create(
            plan=plan,
            business=business,
            question_id=item.get("question_id", f"Q_{k}"),
            variable_key=k,
            question_text=item.get("question_text", var_def.label),
            why_it_matters=item.get("why_it_matters", var_def.why_it_matters),
            reason=item.get("reason", item.get("why_it_matters", "")),
            domains=item.get("domains", ["COMPLIANCE"]),
            data_type=str(var_def.data_type),
            options=resolve_variable_options(var_def),
            unit=var_def.unit or "",
            priority=str(item.get("priority", "1")),
            information_gain=float(item.get("information_gain", 1.0)),
            rule_dependency_count=var_frequency.get(k, 0),
        )

        output_questions.append({
            "id": str(q_inst.id),
            "question_id": q_inst.question_id,
            "code": var_def.code,
            "key": k,
            "variable_key": k,
            "variable_id": k,
            "label": var_def.label,
            "question": q_inst.question_text,
            "question_text": q_inst.question_text,
            "data_type": q_inst.data_type,
            "answer_type": q_inst.data_type,
            "why_it_matters": q_inst.why_it_matters,
            "reason": q_inst.reason,
            "domains": q_inst.domains,
            "unit": q_inst.unit,
            "options": q_inst.options,
            "allowed_values": [opt["value"] if isinstance(opt, dict) else opt for opt in q_inst.options],
            "current_value": context.raw_variables.get(k),
            "priority": q_inst.priority,
            "information_gain": q_inst.information_gain,
            "required": var_def.default_relevance == Relevance.CORE,
            "rule_dependency_count": q_inst.rule_dependency_count,
        })

    sector_label = ", ".join(domains) if domains else "industrial operations"
    return {
        "business_id": str(business.id),
        "business_name": business.name,
        "assessment_id": str(assessment.id) if assessment else None,
        "plan_id": str(plan.id),
        "round": round_number,
        "status": "ACTIVE",
        "personalization_header": f"Questions tailored to: {business.name}",
        "personalization_subtitle": f"Based on your {sector_label} activity, we need a few specific operational details to build your comprehensive compliance, schemes, and standards plan.",
        "personalization_summary": personalization_summary,
        "questions": output_questions,
        "total_questions": len(output_questions),
        "total_missing": len(context.missing_variable_keys),
        "known_variables_count": len(context.known_variable_keys),
        "context_summary": context.as_dict(),
    }
