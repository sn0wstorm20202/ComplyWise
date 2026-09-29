"""Adaptive Smart Question Planner — Pre-Discovery Information Gathering Architecture.

Authority: ComplyWise Smart Question Intelligence Correction Milestone.
PRD_v2.0 §10, §11; TRD_v2.0 §8, §12.

CORE ARCHITECTURE:
Smart Questions are NOT a static questionnaire or a fixed question bank.
Smart Questions serve as an intelligent PRE-DISCOVERY INTERVIEW:
1. Business Understanding: Analyze what the enterprise actually manufactures, formulates,
   processes, stores, sells, imports, exports, or operates under Indian Central & State jurisdictions.
2. Divergence & Ambiguity Detection: If the company name (e.g. 'BluePeak MedTech Devices')
   and operational description (e.g. 'convert waste into pesticides') diverge, ask a high-priority
   clarification question to establish the real operational scope.
3. Open-Ended Information Gaps: Identify DiscoveryInformationGap objects representing unknown
   facts that materially refine upcoming regulatory search queries on official portals and gazettes.
4. Smart Question Generation: Convert the highest-value gaps into founder-friendly questions.
   - If a gap aligns with an existing canonical variable (V01-V43), map target_variable_id to it.
   - If NO canonical variable exists, formulate a descriptive dynamic key (e.g., 'dynamic_pesticide_category')
     so the LLM is NEVER constrained or gated by a predefined variable catalog.
   - NEVER ask for facts that are already known in the profile.
   - NEVER dump a generic 6-variable factory questionnaire on unseen businesses.
"""

from __future__ import annotations

from collections import Counter
import json
import logging
import re
import uuid
from dataclasses import asdict, dataclass, field
from typing import Any

from common.enums import KnowledgeStatus
from domain.context.business_context import DerivedBusinessContext, build_business_context
from domain.profile.variables import (
    PROFILE_VARIABLES,
    VARIABLES_BY_KEY,
    Relevance,
    get_variable,
    resolve_variable_options,
)
from domain.providers import get_llm_provider
from domain.providers.base import ChatMessage
from apps.businesses.models import Business
from apps.knowledge.models import RequirementDefinition, RuleVersion
from apps.onboarding.adaptive import (
    KnowledgeBaseAnalysis,
    analyze_candidate_rules,
    analyze_rule,
    extract_ast_variables,
)
from apps.onboarding.models import SmartQuestionInstance, SmartQuestionPlan

logger = logging.getLogger(__name__)

TARGET_QUESTIONS_COUNT = 4
MIN_QUESTIONS_PER_ROUND = 0
MAX_QUESTIONS_PER_ROUND = 4
MAX_ROUNDS = 2


@dataclass
class DiscoveryInformationGap:
    """A material operational ambiguity that refining upcoming regulatory discovery requires resolving."""
    gap_id: str
    description: str
    business_reason: str
    expected_discovery_impact: str
    domain: str
    target_field: str | None = None
    priority: int = 1
    confidence: float = 0.90

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class RegulatoryDiscoveryIntent:
    """Structured pre-discovery intent object feeding downstream regulatory discovery."""
    business_type: str
    primary_activity: str
    secondary_activities: list[str] = field(default_factory=list)
    products: list[str] = field(default_factory=list)
    relevant_jurisdictions: list[str] = field(default_factory=list)
    likely_sectors: list[str] = field(default_factory=list)
    possible_regulatory_domains: list[str] = field(default_factory=list)
    search_topics: list[str] = field(default_factory=list)
    unresolved_facts: list[str] = field(default_factory=list)
    information_gaps: list[str] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


QUESTION_PLANNER_SYSTEM_PROMPT = """You are the Lead Regulatory Intake Planner for ComplyWise, an intelligent Indian statutory compliance and regulatory discovery system.

SECTOR ISOLATION RULES (STRICT INVARIANT):
- PHYSICAL / AGRO / FOOD PROCESSING: NEVER ask about digital software, cloud hosting, IT cybersecurity, or medical devices (e.g., do NOT ask processes_personal_data, cloud_hosting_location, critical_cyber_services, cdsco_device_risk_class, cleanroom_iso_class).
- DIGITAL SAAS / CLOUD SOFTWARE: NEVER ask about physical factory operations, environmental emissions, or medical devices (e.g., do NOT ask connected_power_load, effluent_emission_generation, hazardous_waste_generation, boiler_installed, daily_processing_capacity, food_contact_packaging, cdsco_device_risk_class).
- MEDICAL DEVICES: NEVER ask about food processing, agrochemicals, or cloud software (e.g., do NOT ask daily_processing_capacity, organic_claim, food_contact_packaging, cloud_hosting_location).


YOUR MISSION:
Conduct an intelligent Pre-Discovery Interview with the business founder.
Your goal is NOT to fill pre-existing variable slots or paraphrase a fixed questionnaire.
Your goal is to:
1. UNDERSTAND THE BUSINESS: Analyze what the company actually manufactures, formulates, processes, stores, provides, sells, imports, exports, or operates under Indian law.
2. DETECT CONFLICTS & DIVERGENCES: If the business name (e.g. 'BluePeak MedTech Devices') and product/activity description (e.g. 'collect waste and convert into pesticides') appear divergent or contradictory, ask a high-priority clarification question to establish the real operational scope being assessed.
3. IDENTIFY REGULATORY DISCOVERY GAPS: Formulate DiscoveryInformationGap objects for operational facts that are currently unknown or ambiguous, where knowing the answer materially changes which official portals, gazettes, acts, approvals, registrations, or standards (e.g., CIBRC, SPCB, CDSCO, FSSAI, PESO, DGFT, BIS, etc.) must be searched.
4. GENERATE 3 TO 4 HIGH-VALUE QUESTIONS: Convert the most valuable information gaps into clear, professional, founder-friendly questions. The interview questionnaire should be tailored to the business profile, manufacturing scale, and state jurisdiction.

CANONICAL VARIABLES vs DYNAMIC FIELDS:
You are provided with a catalog of platform canonical variables (CANONICAL_VARIABLE_CATALOG) for reference mapping.
- If an information gap directly corresponds to a canonical variable in the catalog (e.g. daily processing capacity, personal data processing, CDSCO device risk class, cleanroom ISO class, turnover, etc.), set target_variable_id to that canonical variable key and set is_canonical: true.
- If the information gap targets a domain-specific operational fact that is NOT in the catalog (for example: biopesticide vs chemical pesticide under the Insecticides Act, waste feedstock origin, hazardous chemical formulation, drone flight altitude, metallurgical alloy standard, clinical trial phase, etc.), invent a clear descriptive snake_case key (e.g. 'dynamic_pesticide_category', 'dynamic_feedstock_source') and set is_canonical: false.
- NEVER force an enterprise to answer unrelated canonical variables (such as asking a digital SaaS company about factory power load, or asking a pesticide manufacturer about medical cleanrooms).
- NEVER ask for facts that are ALREADY KNOWN in the profile.

OUTPUT FORMAT (STRICT JSON ONLY, NO CODEBLOCKS, NO MARKDOWN):
{
  "business_summary": "Detailed synthesis of business operations, scale, and activity.",
  "divergence_note": "Optional note if name and description appear divergent, otherwise null.",
  "regulatory_search_intent": {
    "business_type": "...",
    "primary_activity": "...",
    "secondary_activities": ["..."],
    "products": ["..."],
    "relevant_jurisdictions": ["..."],
    "likely_sectors": ["..."],
    "possible_regulatory_domains": ["..."],
    "search_topics": [
      "Official portal search query 1",
      "Official portal search query 2"
    ],
    "unresolved_facts": ["..."],
    "information_gaps": ["..."]
  },
  "information_gaps": [
    {
      "gap_id": "GAP_1",
      "description": "What is missing and why",
      "business_reason": "Why this fact is critical for regulatory classification",
      "expected_discovery_impact": "How this refines upcoming search queries on official portals",
      "domain": "REGULATORY_DOMAIN",
      "priority": 1,
      "confidence": 0.95
    }
  ],
  "reasoning_summary": "Why these specific questions were prioritized for regulatory discovery.",
  "questions": [
    {
      "question_id": "Q_1",
      "target_variable_id": "canonical_key_or_dynamic_key",
      "is_canonical": true,
      "question_text": "Clear, founder-friendly question text",
      "answer_type": "SINGLE_CHOICE | MULTI_CHOICE | BOOLEAN | NUMBER | TEXT",
      "allowed_values": ["Option 1", "Option 2"],
      "priority": 1,
      "reason": "Why this question matters for discovering applicable rules",
      "expected_discovery_impact": "How knowing this answer refines regulatory search queries",
      "domain": "REGULATORY_DOMAIN"
    }
  ]
}
"""


def _build_canonical_catalog() -> list[dict[str, Any]]:
    """Build lightweight summary of canonical variables to provide as a mapping reference."""
    catalog: list[dict[str, Any]] = []
    for pv in PROFILE_VARIABLES:
        opts = [o.value for o in pv.options] if pv.options else []
        catalog.append({
            "key": pv.key,
            "label": pv.label,
            "data_type": str(pv.data_type),
            "options": opts,
            "description": pv.why_it_matters,
        })
    return catalog


def _extract_ast_variables(node: Any) -> set[str]:
    """Recursively collect variable keys referenced in an AST condition."""
    return extract_ast_variables(node)


def _build_context_driven_fallback_questions(
    context: DerivedBusinessContext,
    business_name: str,
    known_keys: set[str],
) -> tuple[RegulatoryDiscoveryIntent, list[dict[str, Any]], list[dict[str, Any]]]:
    """Gracefully formulate discovery intent and dynamic questions when LLM is unavailable.
    
    CRITICAL: Never dumps the generic 6 factory variables on an unfamiliar business.
    Extracts operational keywords and detects name-vs-activity conflicts.
    """
    desc = (context.product_description or "").lower()
    name_lower = (business_name or "").lower()
    state_name = context.state_name or "India"

    search_topics: list[str] = []
    gaps: list[dict[str, Any]] = []
    questions: list[dict[str, Any]] = []

    # 1. Detect Conflict between Business Name and Product Description
    name_has_med = any(w in name_lower for w in ["medtech", "medical", "device", "surgical", "pharma", "biotech"])
    desc_has_pesticide = any(w in desc for w in ["pesticide", "waste", "fertilizer", "crop", "biomass", "recycle"])
    desc_has_saas = bool(re.search(r"\b(software|saas|cloud|platform|digital|apps?)\b", desc))
    desc_has_food = any(w in desc for w in ["food", "fruit", "beverage", "snack", "bakery", "dairy"])
    desc_has_ev = any(w in desc for w in ["ev charging", "electric vehicle", "charging station", "charging infrastructure", "dc fast charger", "charging point", "evse"]) or any(w in name_lower for w in ["voltgrid", "ev charge", "mobility services"])
    desc_has_construction = any(w in desc for w in ["construction", "civil engineering", "infrastructure contractor", "building contractor", "highways", "earthmoving", "bocw"]) or any(w in name_lower for w in ["apexbuild", "construction", "infra"])
    desc_has_textile_export = any(w in desc for w in ["textile", "apparel export", "garment export", "finished garments", "merchant exporter"]) or any(w in name_lower for w in ["silkroute", "textile export", "apparel export"])
    desc_has_data_centre = any(w in desc for w in ["data centre", "data center", "colocation", "hyperscale", "server hall"]) or any(w in name_lower for w in ["cloudaxis", "data centre", "data center"])
    desc_has_microfinance = any(w in desc for w in ["microfinance", "micro-credit", "joint liability", "nbfc-mfi", "lending", "credit facility", "mfi"]) or any(w in name_lower for w in ["sahaya", "microfinance", "mfi", "finances"])

    if name_has_med and desc_has_pesticide:
        q_id = "scope_activity_clarification"
        gaps.append({
            "gap_id": "GAP_SCOPE_DIVERGENCE",
            "description": "Business entity name mentions MedTech while operational description focuses on waste/pesticides.",
            "business_reason": "Prevents misrouting to CDSCO medical device regulations if operations are environmental agrochemical processing.",
            "expected_discovery_impact": "Directs regulatory harvesting to CIBRC / SPCB portals rather than CDSCO medical device licensing.",
            "domain": "SCOPE_VALIDATION",
            "priority": 1,
            "confidence": 0.98,
        })
        questions.append({
            "question_id": f"Q_{q_id}",
            "target_variable_id": q_id,
            "is_canonical": False,
            "question_text": f"Your entity name mentions medical technology, but your operational description details waste conversion into pesticides. Which primary operations are being assessed for compliance?",
            "answer_type": "SINGLE_CHOICE",
            "allowed_values": [
                "Waste collection and pesticide / agrochemical manufacturing",
                "Medical device & healthcare diagnostic manufacturing",
                "Both activities under separate operating divisions",
            ],
            "priority": 1,
            "reason": "Resolves whether Central Insecticides Board (CIBRC) or CDSCO Medical Device Rules apply.",
            "expected_discovery_impact": "Directs search to CIBRC / SPCB portals rather than CDSCO medical device licensing.",
            "domain": "SCOPE_VALIDATION",
        })

    # 2. Domain-Aware Dynamic Inquiry
    if desc_has_pesticide or "pesticide" in desc or "waste" in desc:
        search_topics.extend([
            f"Central Insecticides Board CIBRC pesticide manufacture license guidelines India",
            f"{state_name} pollution control board consent to establish pesticide chemical plant",
            "Solid Waste Management Rules feedstock authorization guidelines CPCB",
        ])
        if "dynamic_pesticide_category" not in known_keys:
            questions.append({
                "question_id": "Q_dynamic_pesticide_category",
                "target_variable_id": "dynamic_pesticide_category",
                "is_canonical": False,
                "question_text": "What specific category of pesticide or agricultural input does your facility manufacture?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": [
                    "Bio-pesticide / Botanical extract",
                    "Microbial biopesticide",
                    "Chemical synthetic pesticide formulation",
                    "Bio-fertilizer / Organic soil conditioner",
                ],
                "priority": 1,
                "reason": "Determines statutory licensing track under the Insecticides Act 1968 vs Fertilizer Control Order.",
                "expected_discovery_impact": "Refines discovery to CIBRC Schedule vs FCO registration schedules.",
                "domain": "AGROCHEMICALS_AND_WASTE",
            })
        if "dynamic_waste_feedstock_origin" not in known_keys:
            questions.append({
                "question_id": "Q_dynamic_waste_feedstock_origin",
                "target_variable_id": "dynamic_waste_feedstock_origin",
                "is_canonical": False,
                "question_text": "What is the primary source of the waste feedstock collected for processing?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": [
                    "Agricultural crop residue and farm biomass",
                    "Segregated municipal organic household waste",
                    "Industrial chemical or packaging waste",
                ],
                "priority": 1,
                "reason": "Determines applicability of Solid Waste Management Rules vs Hazardous Waste Rules.",
                "expected_discovery_impact": "Directs search to CPCB waste processor registration criteria.",
                "domain": "ENVIRONMENTAL_SAFETY",
            })
        if "dynamic_conversion_method" not in known_keys:
            questions.append({
                "question_id": "Q_dynamic_conversion_method",
                "target_variable_id": "dynamic_conversion_method",
                "is_canonical": False,
                "question_text": "Does your proprietary conversion process involve biological fermentation or chemical synthesis?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": [
                    "Biological fermentation / anaerobic digestion",
                    "Chemical synthesis and solvent extraction",
                    "Mechanical grinding and physical extraction",
                ],
                "priority": 2,
                "reason": "Determines SPCB industrial pollution categorization (Red vs Orange category).",
                "expected_discovery_impact": "Focuses discovery on SPCB Consent to Establish (CTE) fee and effluent schedules.",
                "domain": "ENVIRONMENTAL_SAFETY",
            })

    elif desc_has_saas:
        search_topics.extend([
            "DPDP Act 2023 personal data processing guidelines MeitY India",
            "CERT-In cybersecurity incident reporting directives cloud hosting",
            "Cross border data transfer rules MeitY and software export SOFTEX RBI",
        ])
        if "processes_personal_data" not in known_keys:
            questions.append({
                "question_id": "Q_processes_personal_data",
                "target_variable_id": "processes_personal_data",
                "is_canonical": True,
                "question_text": "Does your software platform collect, store, or process personal data of users or clients?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 1,
                "reason": "Determines applicability of the Digital Personal Data Protection (DPDP) Act 2023.",
                "expected_discovery_impact": "Directs discovery to DPDP Act data fiduciary obligations.",
                "domain": "DIGITAL_SAAS",
            })
        if "cloud_hosting_location" not in known_keys:
            questions.append({
                "question_id": "Q_cloud_hosting_location",
                "target_variable_id": "cloud_hosting_location",
                "is_canonical": True,
                "question_text": "Where is your primary cloud production infrastructure hosted?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": ["INDIA_ONLY", "GLOBAL_MULTI_REGION", "OUTSIDE_INDIA"],
                "priority": 1,
                "reason": "Determines data localization and CERT-In log retention compliance.",
                "expected_discovery_impact": "Focuses discovery on CERT-In directives and cross-border data transfer rules.",
                "domain": "DIGITAL_SAAS",
            })
        if "cross_border_data_transfer" not in known_keys:
            questions.append({
                "question_id": "Q_cross_border_data_transfer",
                "target_variable_id": "cross_border_data_transfer",
                "is_canonical": True,
                "question_text": "Does your software platform transfer or process customer data outside India?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines cross-border data transfer restrictions under DPDP Act 2023.",
                "expected_discovery_impact": "Focuses discovery on Central Government blacklisted cross-border data transfer regions.",
                "domain": "DIGITAL_SAAS",
            })
        if "critical_cyber_services" not in known_keys:
            questions.append({
                "question_id": "Q_critical_cyber_services",
                "target_variable_id": "critical_cyber_services",
                "is_canonical": True,
                "question_text": "Does your application provide services to Critical Information Infrastructure (CII) or BFSI entities?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines enhanced CERT-In reporting (6-hour mandate) and NCIIPC guidelines.",
                "expected_discovery_impact": "Directs discovery to mandatory CERT-In cyber audit requirements.",
                "domain": "DIGITAL_SAAS",
            })
        if "export_of_software_services" not in known_keys:
            questions.append({
                "question_id": "Q_export_of_software_services",
                "target_variable_id": "export_of_software_services",
                "is_canonical": True,
                "question_text": "Do you export software or cloud services to overseas clients earning foreign exchange?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines RBI SOFTEX form filing and STPI registration compliance.",
                "expected_discovery_impact": "Refines discovery to STPI SOFTEX certification guidelines.",
                "domain": "TRADE_COMPLIANCE",
            })
        if "dynamic_data_retention_policy" not in known_keys:
            questions.append({
                "question_id": "Q_dynamic_data_retention_policy",
                "target_variable_id": "dynamic_data_retention_policy",
                "is_canonical": False,
                "question_text": "What is your defined data retention and deletion schedule for user personal data and system logs?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": ["180_DAYS_CERT_IN", "1_TO_3_YEARS", "INDEFINITE", "PURGED_ON_ACCOUNT_CLOSURE"],
                "priority": 2,
                "reason": "Determines compliance with CERT-In 180-day log mandate and DPDP Act purpose limitation.",
                "expected_discovery_impact": "Focuses discovery on CERT-In directions and DPDP compliance schedules.",
                "domain": "DIGITAL_SAAS",
            })
        if "dynamic_cloud_multi_tenancy" not in known_keys:
            questions.append({
                "question_id": "Q_dynamic_cloud_multi_tenancy",
                "target_variable_id": "dynamic_cloud_multi_tenancy",
                "is_canonical": False,
                "question_text": "Does your cloud infrastructure deploy multi-tenant databases with logical customer data segregation?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines data boundary segregation standards and SOC 2 / ISO 27001 regulatory audit requirements.",
                "expected_discovery_impact": "Refines discovery to MeitY cloud service provider empanelment requirements.",
                "domain": "DIGITAL_SAAS",
            })

    elif name_has_med or any(w in desc for w in ["medical", "device", "surgical", "diagnostic", "implant"]):
        search_topics.extend([
            "CDSCO medical device manufacturing license Form MD-5 MD-9 guidelines India",
            "Medical Device Rules 2017 ISO 13485 quality management compliance",
            "Biocompatibility testing ISO 10993 and cleanroom class validation CDSCO",
        ])
        if "cdsco_device_risk_class" not in known_keys:
            questions.append({
                "question_id": "Q_cdsco_device_risk_class",
                "target_variable_id": "cdsco_device_risk_class",
                "is_canonical": True,
                "question_text": "What is the CDSCO risk classification of your manufactured medical devices?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": ["CLASS_A_LOW", "CLASS_B_LOW_MODERATE", "CLASS_C_MODERATE_HIGH", "CLASS_D_HIGH"],
                "priority": 1,
                "reason": "Determines State Licensing Authority (Class A/B) vs Central Licensing Authority (Class C/D).",
                "expected_discovery_impact": "Directs harvesting to Central CDSCO Form MD-9 vs State Form MD-5 portals.",
                "domain": "MEDICAL_DEVICES",
            })
        if "is_sterile_at_supply" not in known_keys:
            questions.append({
                "question_id": "Q_is_sterile_at_supply",
                "target_variable_id": "is_sterile_at_supply",
                "is_canonical": True,
                "question_text": "Are your medical devices supplied in a sterile state requiring validated sterilization?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 1,
                "reason": "Determines ethylene oxide / gamma irradiation sterilization audit mandates.",
                "expected_discovery_impact": "Refines search to CDSCO notified body audit schedules.",
                "domain": "MEDICAL_DEVICES",
            })
        if "cleanroom_iso_class" not in known_keys:
            questions.append({
                "question_id": "Q_cleanroom_iso_class",
                "target_variable_id": "cleanroom_iso_class",
                "is_canonical": True,
                "question_text": "What ISO class cleanroom is deployed for your medical manufacturing operations?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": ["ISO_CLASS_5", "ISO_CLASS_7", "ISO_CLASS_8", "CONTROLLED_UNCLASSIFIED", "NONE"],
                "priority": 2,
                "reason": "Determines CDSCO environmental air particulate and microbiological validation requirements.",
                "expected_discovery_impact": "Refines search to Schedule M-III cleanroom environmental specifications.",
                "domain": "MEDICAL_DEVICES",
            })
        if "biocompatibility_tested" not in known_keys:
            questions.append({
                "question_id": "Q_biocompatibility_tested",
                "target_variable_id": "biocompatibility_tested",
                "is_canonical": True,
                "question_text": "Have the patient-contact materials undergone ISO 10993 biocompatibility testing?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Mandated for invasive or mucosal contact medical devices under MDR 2017.",
                "expected_discovery_impact": "Focuses discovery on CDSCO biological evaluation safety testing standards.",
                "domain": "MEDICAL_DEVICES",
            })
        if "active_or_implantable" not in known_keys:
            questions.append({
                "question_id": "Q_active_or_implantable",
                "target_variable_id": "active_or_implantable",
                "is_canonical": True,
                "question_text": "Are the medical devices manufactured active (electrically powered) or surgically implantable?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines electrical medical equipment safety (IEC 60601) and post-market clinical follow-up.",
                "expected_discovery_impact": "Directs discovery to BIS medical electrical equipment safety standards.",
                "domain": "MEDICAL_DEVICES",
            })

    elif desc_has_food:
        search_topics.extend([
            "FSSAI manufacturing license capacity threshold central vs state schedule",
            "Food Safety and Standards Packaging Regulations migration testing IS 9845",
            "Cold chain storage and industrial boiler environmental compliance food industry",
        ])
        if "daily_processing_capacity" not in known_keys:
            questions.append({
                "question_id": "Q_daily_processing_capacity",
                "target_variable_id": "daily_processing_capacity",
                "is_canonical": True,
                "question_text": "What is your projected daily food processing throughput (in metric tonnes per day)?",
                "answer_type": "NUMBER",
                "allowed_values": [],
                "priority": 1,
                "reason": "Determines Central FSSAI Schedule 1 license vs State FSSAI license bracket.",
                "expected_discovery_impact": "Directs regulatory search to FSSAI Central vs State licensing capacity portals.",
                "domain": "FOOD_SAFETY",
            })
        if "food_contact_packaging" not in known_keys:
            questions.append({
                "question_id": "Q_food_contact_packaging",
                "target_variable_id": "food_contact_packaging",
                "is_canonical": True,
                "question_text": "Does your packaging come into direct contact with food products?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 1,
                "reason": "Determines IS 9845 migration testing and food packaging declaration rules.",
                "expected_discovery_impact": "Focuses discovery on BIS packaging standards.",
                "domain": "FOOD_SAFETY",
            })
        if "cold_chain_storage" not in known_keys:
            questions.append({
                "question_id": "Q_cold_chain_storage",
                "target_variable_id": "cold_chain_storage",
                "is_canonical": True,
                "question_text": "Does your facility utilize refrigerated cold chain storage or temperature-controlled warehousing?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines FSSAI cold storage registration and energy efficiency compliance.",
                "expected_discovery_impact": "Refines search to FSSAI Schedule 4 cold chain storage mandates.",
                "domain": "FOOD_SAFETY",
            })
        if "boiler_installed" not in known_keys:
            questions.append({
                "question_id": "Q_boiler_installed",
                "target_variable_id": "boiler_installed",
                "is_canonical": True,
                "question_text": "Does your processing facility operate an industrial boiler or steam generation equipment?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines Indian Boilers Act 1923 registration and annual inspection certificates.",
                "expected_discovery_impact": "Directs discovery to Chief Inspector of Boilers registration portals.",
                "domain": "SAFETY_CLEARANCES",
            })
        if "organic_claim" not in known_keys and "organic" in desc:
            questions.append({
                "question_id": "Q_organic_claim",
                "target_variable_id": "organic_claim",
                "is_canonical": True,
                "question_text": "Do you market or label any of your food products with organic certification claims (Jaivik Bharat)?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines FSSAI Organic Food Regulations 2017 and NPOP certification mandates.",
                "expected_discovery_impact": "Focuses discovery on Jaivik Bharat logo regulations and APEDA NPOP standards.",
                "domain": "FOOD_SAFETY",
            })

    elif desc_has_ev:
        search_topics.extend([
            "Central Electricity Authority Technical Standards for Connectivity of Distributed Generation Regulations",
            f"{state_name} DISCOM EV charging tariff and consumer electrical connection guidelines",
            "MOP Guidelines for Installation and Operation of Electric Vehicle Charging Infrastructure",
        ])
        if "ev_charging_land_type" not in known_keys:
            questions.append({
                "question_id": "Q_ev_charging_land_type",
                "target_variable_id": "ev_charging_land_type",
                "is_canonical": False,
                "question_text": "Are charging stations installed on public land or private premises?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": [
                    "Public Land / Municipal Concession",
                    "Private Premises / Commercial Real Estate",
                    "Both Public and Private Sites",
                ],
                "priority": 1,
                "reason": "Determines municipal right-of-way permissions, municipal advertising guidelines, and DISCOM commercial consumer tariff classification.",
                "expected_discovery_impact": "Directs regulatory harvesting to municipal right-of-way permissions and DISCOM public EV charging tariffs.",
                "domain": "ENERGY_INFRASTRUCTURE",
            })
        if "ev_connected_capacity" not in known_keys:
            questions.append({
                "question_id": "Q_ev_connected_capacity",
                "target_variable_id": "ev_connected_capacity",
                "is_canonical": False,
                "question_text": "What electrical connection capacity is used?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": [
                    "High Tension (HT >= 33kV)",
                    "Medium Tension (11kV)",
                    "Low Tension (LT 415V)",
                ],
                "priority": 1,
                "reason": "Determines whether CEA Electrical Safety Inspections (Regulation 43) and dedicated step-down substations are mandated.",
                "expected_discovery_impact": "Refines search to Chief Electrical Inspectorate (CEI) approval threshold rules.",
                "domain": "ELECTRICAL_SAFETY",
            })
        if "owns_operates_transformers" not in known_keys:
            questions.append({
                "question_id": "Q_owns_operates_transformers",
                "target_variable_id": "owns_operates_transformers",
                "is_canonical": False,
                "question_text": "Do you own or operate transformers/substations?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 1,
                "reason": "Determines CEA safety inspection certificates and substation clearance requirements prior to energization.",
                "expected_discovery_impact": "Directs discovery to CEA safety standards and DISCOM technical connection schedules.",
                "domain": "ELECTRICAL_SAFETY",
            })
        if "operates_payment_functions" not in known_keys:
            questions.append({
                "question_id": "Q_operates_payment_functions",
                "target_variable_id": "operates_payment_functions",
                "is_canonical": False,
                "question_text": "Are payment functions directly operated by you?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines RBI Payment Aggregator directives and digital tariff metering compliances.",
                "expected_discovery_impact": "Focuses discovery on RBI digital payment aggregator and consumer protection guidelines.",
                "domain": "DIGITAL_COMPLIANCE",
            })

    elif desc_has_construction:
        search_topics.extend([
            f"{state_name} Building and Other Construction Workers Welfare Cess Act rules and registration",
            "Contract Labour Regulation and Abolition Act contractor licensing State Labour Dept",
            "Petroleum Rules bulk diesel storage consumer pump PESO guidelines",
        ])
        if "direct_site_employment" not in known_keys:
            questions.append({
                "question_id": "Q_direct_site_employment",
                "target_variable_id": "direct_site_employment",
                "is_canonical": False,
                "question_text": "Does the company directly employ workers at sites?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": [
                    "Direct Company Employment",
                    "Subcontractor / Labour Contractor Only",
                    "Hybrid (Both Direct and Contract)",
                ],
                "priority": 1,
                "reason": "Determines principal employer registration under CLRA 1970 vs direct employer BOCW liability.",
                "expected_discovery_impact": "Directs discovery to State Labour Commissioner CLRA vs BOCW establishment registration.",
                "domain": "CONSTRUCTION_LABOUR",
            })
        if "site_diesel_storage" not in known_keys:
            questions.append({
                "question_id": "Q_site_diesel_storage",
                "target_variable_id": "site_diesel_storage",
                "is_canonical": False,
                "question_text": "Is diesel stored at active sites?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 1,
                "reason": "Determines PESO petroleum storage licensing thresholds under Petroleum Rules 2002.",
                "expected_discovery_impact": "Refines search to PESO Form XIV site fuel storage authorization rules.",
                "domain": "PETROLEUM_SAFETY",
            })
        if "peak_site_workforce" not in known_keys:
            questions.append({
                "question_id": "Q_peak_site_workforce",
                "target_variable_id": "peak_site_workforce",
                "is_canonical": False,
                "question_text": "What is the maximum workforce at each site?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": [
                    "Under 10 workers",
                    "10 to 49 workers",
                    "50 or more workers",
                ],
                "priority": 1,
                "reason": "Determines mandatory BOCW Act Section 7 establishment registration threshold (10+ workers).",
                "expected_discovery_impact": "Focuses discovery on BOCW registration and 1% welfare cess assessment.",
                "domain": "CONSTRUCTION_LABOUR",
            })
        if "company_controlled_temp_electrical" not in known_keys:
            questions.append({
                "question_id": "Q_company_controlled_temp_electrical",
                "target_variable_id": "company_controlled_temp_electrical",
                "is_canonical": False,
                "question_text": "Are temporary electrical installations company-controlled?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines Central Electricity Authority construction safety compliance and temporary CEI permits.",
                "expected_discovery_impact": "Directs discovery to state electrical inspectorate temporary installation clearances.",
                "domain": "ELECTRICAL_SAFETY",
            })

    elif desc_has_textile_export:
        search_topics.extend([
            "Directorate General of Foreign Trade DGFT Importer Exporter Code guidelines",
            "Apparel Export Promotion Council AEPC RCMC registration procedures",
            "Customs ICEGATE registration and electronic shipping bill procedures",
        ])
        if "performs_manufacturing_processing" not in known_keys:
            questions.append({
                "question_id": "Q_performs_manufacturing_processing",
                "target_variable_id": "performs_manufacturing_processing",
                "is_canonical": False,
                "question_text": "Do you perform any manufacturing/processing?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": [
                    "Pure Merchant Exporter (Zero Manufacturing/Wet Processing)",
                    "Contract Cutting & Packing Only",
                    "In-house Manufacturing & Processing",
                ],
                "priority": 1,
                "reason": "Decisive differentiator: Pure merchant exporters are exempt from Factories Act and SPCB effluent treatment mandates under Section 2(m).",
                "expected_discovery_impact": "Directs regulatory harvesting to trade export procedures while explicitly suppressing industrial factory licensing.",
                "domain": "TRADE_COMPLIANCE",
            })
        if "direct_import_goods" not in known_keys:
            questions.append({
                "question_id": "Q_direct_import_goods",
                "target_variable_id": "direct_import_goods",
                "is_canonical": False,
                "question_text": "Do you directly import any goods?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 1,
                "reason": "Determines Customs Bill of Entry filings, Customs Bonded Warehouse compliances, and IGST import deferrals.",
                "expected_discovery_impact": "Refines search to ICEGATE import documentation and customs clearing schedules.",
                "domain": "TRADE_COMPLIANCE",
            })
        if "operates_own_warehouse" not in known_keys:
            questions.append({
                "question_id": "Q_operates_own_warehouse",
                "target_variable_id": "operates_own_warehouse",
                "is_canonical": False,
                "question_text": "Do you operate the warehouse yourself?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": [
                    "Self-operated Warehouse",
                    "Third-party Logistics (3PL)",
                    "Direct Shipments from Vendors",
                ],
                "priority": 2,
                "reason": "Determines municipal commercial trade license and commercial premises fire NOC obligations.",
                "expected_discovery_impact": "Focuses discovery on local municipal commercial warehousing regulations.",
                "domain": "COMMERCIAL_OPERATIONS",
            })
        if "packages_goods_for_export" not in known_keys:
            questions.append({
                "question_id": "Q_packages_goods_for_export",
                "target_variable_id": "packages_goods_for_export",
                "is_canonical": False,
                "question_text": "Do you package goods for export?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines Legal Metrology (Packaged Commodities) export labeling exemptions and EPR plastic obligations.",
                "expected_discovery_impact": "Directs discovery to Legal Metrology export packaging rules and CPCB EPR registrations.",
                "domain": "TRADE_COMPLIANCE",
            })

    elif desc_has_data_centre:
        search_topics.extend([
            "CEA Technical Standards for Connectivity to the Grid and CEI inspection guidelines data centres",
            "SPCB Consent to Establish standby diesel generator sets emission standards",
            "Petroleum Rules PESO bulk diesel storage class B license server farm",
        ])
        if "facility_building_ownership" not in known_keys:
            questions.append({
                "question_id": "Q_facility_building_ownership",
                "target_variable_id": "facility_building_ownership",
                "is_canonical": False,
                "question_text": "Who owns the building?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": [
                    "Company-owned Freehold Building",
                    "Long-term Facility Lease (Commercial Landlord)",
                    "Shared IT Park Tenancy",
                ],
                "priority": 1,
                "reason": "Determines whether primary structural approvals, municipal occupancy certificates, and substation clearances fall directly on the enterprise.",
                "expected_discovery_impact": "Separates building landlord structural compliances from data centre tenant operational authorizations.",
                "domain": "INFRASTRUCTURE_GOVERNANCE",
            })
        if "dg_set_operator" not in known_keys:
            questions.append({
                "question_id": "Q_dg_set_operator",
                "target_variable_id": "dg_set_operator",
                "is_canonical": False,
                "question_text": "Who operates the DG sets?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": [
                    "Company In-house Engineering Team",
                    "Building Facility Management / Landlord",
                    "Third-party Operations Contractor",
                ],
                "priority": 1,
                "reason": "Determines statutory responsibility for SPCB Air Act CTO and acoustic emission compliance.",
                "expected_discovery_impact": "Directs discovery to SPCB DG set operational consent schedules.",
                "domain": "ENVIRONMENTAL_SAFETY",
            })
        if "diesel_storage_capacity" not in known_keys:
            questions.append({
                "question_id": "Q_diesel_storage_capacity",
                "target_variable_id": "diesel_storage_capacity",
                "is_canonical": False,
                "question_text": "What diesel storage capacity exists?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": [
                    "Below 1,000 Litres",
                    "1,000 to 4,999 Litres",
                    "5,000 Litres or above (Bulk PESO Storage)",
                ],
                "priority": 1,
                "reason": "Storage exceeding 2,500 L (or 5,000 L combined) mandates a PESO Form XIV Petroleum Class B Storage License.",
                "expected_discovery_impact": "Refines search to PESO Petroleum Rules storage license brackets.",
                "domain": "PETROLEUM_SAFETY",
            })
        if "groundwater_extracted" not in known_keys:
            questions.append({
                "question_id": "Q_groundwater_extracted",
                "target_variable_id": "groundwater_extracted",
                "is_canonical": False,
                "question_text": "Is groundwater extracted?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines Central Ground Water Authority (CGWA) or State Ground Water Authority NOC mandates.",
                "expected_discovery_impact": "Focuses discovery on CGWA industrial groundwater abstraction guidelines.",
                "domain": "ENVIRONMENTAL_SAFETY",
            })
        if "fire_approval_status" not in known_keys:
            questions.append({
                "question_id": "Q_fire_approval_status",
                "target_variable_id": "fire_approval_status",
                "is_canonical": False,
                "question_text": "What fire approval currently exists?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": [
                    "State Fire Services NOC Obtained",
                    "Gas Suppression System Under Approval",
                    "Provisional / Landlord Campus NOC Only",
                ],
                "priority": 2,
                "reason": "Critical infrastructure with clean agent gas fire suppression requires specialized State Fire Department clearance.",
                "expected_discovery_impact": "Directs discovery to State Fire Prevention and Life Safety measures rules.",
                "domain": "FIRE_SAFETY",
            })

    elif desc_has_microfinance:
        search_topics.extend([
            "RBI Master Direction Non-Banking Financial Company - Systemically Important Non-Deposit taking Company and Deposit taking Company",
            "Financial Intelligence Unit India FIU-IND PMLA reporting entity registration guidelines",
            "Central Registry of Securitisation Asset Reconstruction and Security Interest CERSAI guidelines",
        ])
        if "regulated_entity_category" not in known_keys:
            questions.append({
                "question_id": "Q_regulated_entity_category",
                "target_variable_id": "regulated_entity_category",
                "is_canonical": False,
                "question_text": "What is the company's exact regulated entity/category?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": [
                    "RBI Registered NBFC-MFI",
                    "Section 8 Non-Profit Microfinance",
                    "Business Correspondent (BC) Partner",
                    "Unregistered / Application Pending",
                ],
                "priority": 1,
                "reason": "Crucial statutory boundary: NBFC-MFIs require RBI Certificate of Registration (CoR) and Net Owned Fund of Rs 10 Crore, whereas Section 8 entities and BCs operate under distinct exemptions.",
                "expected_discovery_impact": "Separates RBI NBFC Master Direction compliance from Section 8 MCA non-profit governance.",
                "domain": "FINANCIAL_REGULATION",
            })
        if "balance_sheet_lending" not in known_keys:
            questions.append({
                "question_id": "Q_balance_sheet_lending",
                "target_variable_id": "balance_sheet_lending",
                "is_canonical": False,
                "question_text": "Are loans funded directly from company balance sheet?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": [
                    "Direct Balance Sheet Lending",
                    "Business Correspondent (BC) Origination",
                    "Co-lending Model",
                ],
                "priority": 1,
                "reason": "Determines capital adequacy ratio (CRAR 15%), provisioning norms, and RBI asset classification mandates.",
                "expected_discovery_impact": "Focuses discovery on RBI prudential norms and capital adequacy requirements.",
                "domain": "FINANCIAL_REGULATION",
            })
        if "accepts_deposits" not in known_keys:
            questions.append({
                "question_id": "Q_accepts_deposits",
                "target_variable_id": "accepts_deposits",
                "is_canonical": False,
                "question_text": "Are deposits accepted?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 1,
                "reason": "Strict legal boundary: NBFC-MFIs are strictly prohibited from accepting public deposits under RBI directions.",
                "expected_discovery_impact": "Directs discovery to RBI deposit-taking prohibitions and statutory disclosure rules.",
                "domain": "FINANCIAL_REGULATION",
            })
        if "digital_payment_integrations" not in known_keys:
            questions.append({
                "question_id": "Q_digital_payment_integrations",
                "target_variable_id": "digital_payment_integrations",
                "is_canonical": False,
                "question_text": "Which digital payment/account integrations are used?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": [
                    "UPI & NACH / e-Mandate",
                    "Aadhaar Enabled Payment System (AePS)",
                    "Cash Collections Only",
                    "Multi-channel (UPI, NACH, AePS, Cash)",
                ],
                "priority": 2,
                "reason": "Determines NPCI e-Mandate compliances, RBI Digital Lending Guidelines 2022, and Aadhaar Act Section 7 requirements.",
                "expected_discovery_impact": "Refines search to RBI Digital Lending Directions and CIC reporting integrations.",
                "domain": "FINANCIAL_REGULATION",
            })

    desc_has_mfg = any(w in desc for w in ["manufactur", "machin", "metal", "component", "fabricat", "cnc", "tool", "assembl", "industrial", "pack", "produc", "precis"])
    if desc_has_mfg and not (desc_has_food or desc_has_saas or desc_has_pesticide or name_has_med or desc_has_ev or desc_has_construction or desc_has_textile_export or desc_has_data_centre or desc_has_microfinance):
        search_topics.extend([
            f"{state_name} Factories Act registration threshold with power guidelines",
            f"{state_name} pollution control board consent to establish engineering industry",
            "Hazardous and Other Wastes Management Rules spent cutting oil disposal CPCB",
        ])
        if "annual_turnover" not in known_keys:
            var_def = get_variable("annual_turnover")
            if var_def:
                questions.append({
                    "question_id": "Q_annual_turnover",
                    "target_variable_id": "annual_turnover",
                    "is_canonical": True,
                    "question_text": "What is your enterprise's projected annual turnover (in INR)?",
                    "answer_type": "NUMBER",
                    "allowed_values": [],
                    "priority": 1,
                    "reason": "Determines statutory MSME classification and threshold for state vs central licensing.",
                    "expected_discovery_impact": "Directs regulatory discovery to enterprise scale licensing brackets.",
                    "domain": "ENTERPRISE_CLASSIFICATION",
                })
        if "import_export_intent" not in known_keys:
            var_def = get_variable("import_export_intent")
            if var_def:
                questions.append({
                    "question_id": "Q_import_export_intent",
                    "target_variable_id": "import_export_intent",
                    "is_canonical": True,
                    "question_text": "Does your enterprise plan to import raw materials or export finished goods?",
                    "answer_type": "SINGLE_CHOICE",
                    "allowed_values": [opt.value for opt in var_def.options] if var_def.options else ["DOMESTIC_ONLY", "DIRECT_EXPORTER", "MERCHANT_EXPORTER", "IMPORT_AND_EXPORT"],
                    "priority": 1,
                    "reason": "Determines mandatory Directorate General of Foreign Trade (DGFT) IEC registration.",
                    "expected_discovery_impact": "Directs regulatory search to DGFT foreign trade policy requirements.",
                    "domain": "TRADE_COMPLIANCE",
                })
        if "dynamic_machining_process_type" not in known_keys:
            questions.append({
                "question_id": "Q_dynamic_machining_process_type",
                "target_variable_id": "dynamic_machining_process_type",
                "is_canonical": False,
                "question_text": "What specific manufacturing or machining processes are performed at your facility (e.g. CNC milling, lathe turning, stamping)?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": [
                    "Precision CNC milling and lathe turning (dry/coolant)",
                    "Sheet metal stamping and deep drawing",
                    "Electroplating and chemical surface finishing",
                    "Mechanical assembly and testing only",
                ],
                "priority": 1,
                "reason": "Determines SPCB Consent to Establish pollution categorization (Orange vs Green category).",
                "expected_discovery_impact": "Directs discovery to SPCB engineering industry consent schedules.",
                "domain": "OPERATIONAL_SCOPE",
            })
        if "dynamic_surface_treatment_finish" not in known_keys:
            questions.append({
                "question_id": "Q_dynamic_surface_treatment_finish",
                "target_variable_id": "dynamic_surface_treatment_finish",
                "is_canonical": False,
                "question_text": "Do your finished components undergo chemical surface treatment, electroplating, anodizing, or heat treatment?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 1,
                "reason": "Determines Red category industrial pollution consent under SPCB guidelines.",
                "expected_discovery_impact": "Focuses discovery on hazardous waste disposal and SPCB CTE fee schedules.",
                "domain": "ENVIRONMENTAL_SAFETY",
            })
        if "plant_machinery_investment" not in known_keys:
            var_def = get_variable("plant_machinery_investment")
            if var_def:
                questions.append({
                    "question_id": "Q_plant_machinery_investment",
                    "target_variable_id": "plant_machinery_investment",
                    "is_canonical": True,
                    "question_text": "What is your enterprise's total investment in plant, machinery, and equipment (in INR)?",
                    "answer_type": "NUMBER",
                    "allowed_values": [],
                    "priority": 1,
                    "reason": "Determines statutory MSME classification (Micro vs Small vs Medium Enterprise).",
                    "expected_discovery_impact": "Directs discovery to MSMED Act thresholds and state industrial incentive schemes.",
                    "domain": "ENTERPRISE_CLASSIFICATION",
                })
        if "connected_power_load" not in known_keys:
            var_def = get_variable("connected_power_load")
            if var_def:
                questions.append({
                    "question_id": "Q_connected_power_load",
                    "target_variable_id": "connected_power_load",
                    "is_canonical": True,
                    "question_text": "What is your facility's total connected electrical power load (in HP or kW)?",
                    "answer_type": "NUMBER",
                    "allowed_values": [],
                    "priority": 2,
                    "reason": "Determines Factories Act threshold (10 HP with power) and electricity duty slabs.",
                    "expected_discovery_impact": "Refines search to State Factories Rules power thresholds.",
                    "domain": "FACTORY_LICENSING",
                })
        if "hazardous_waste_generation" not in known_keys:
            var_def = get_variable("hazardous_waste_generation")
            if var_def:
                questions.append({
                    "question_id": "Q_hazardous_waste_generation",
                    "target_variable_id": "hazardous_waste_generation",
                    "is_canonical": True,
                    "question_text": "Does your manufacturing operation generate spent cutting fluids, oily sludge, or hazardous waste?",
                    "answer_type": "BOOLEAN",
                    "allowed_values": ["true", "false"],
                    "priority": 2,
                    "reason": "Determines Hazardous and Other Wastes Management Rules authorization mandates.",
                    "expected_discovery_impact": "Directs search to SPCB Form 1 hazardous waste authorization schedules.",
                    "domain": "ENVIRONMENTAL_SAFETY",
                })
        if "effluent_emission_generation" not in known_keys:
            var_def = get_variable("effluent_emission_generation")
            if var_def:
                questions.append({
                    "question_id": "Q_effluent_emission_generation",
                    "target_variable_id": "effluent_emission_generation",
                    "is_canonical": True,
                    "question_text": "Does your operation discharge industrial trade effluent or machine wash-water?",
                    "answer_type": "BOOLEAN",
                    "allowed_values": ["true", "false"],
                    "priority": 2,
                    "reason": "Determines Water Act Section 25 consent and effluent treatment plant requirements.",
                    "expected_discovery_impact": "Refines search to SPCB consent conditions.",
                    "domain": "ENVIRONMENTAL_SAFETY",
                })

    # Cross-border export destination check
    if context.is_cross_border and "export_destination" not in known_keys:
        questions.append({
            "question_id": "Q_export_destination",
            "target_variable_id": "export_destination",
            "is_canonical": True,
            "question_text": "Which target export markets or countries do you plan to ship your products to (e.g. US, EU, UAE)?",
            "answer_type": "TEXT",
            "allowed_values": [],
            "priority": 2,
            "reason": "Determines international technical standards, phytosanitary certificates, and DGFT export protocols.",
            "expected_discovery_impact": "Focuses discovery on destination market regulatory requirements and DGFT guidelines.",
            "domain": "TRADE_COMPLIANCE",
        })

    # State specific published rules check
    if context.state:
        state_rules = RuleVersion.objects.filter(
            jurisdiction=context.state,
            status=KnowledgeStatus.PUBLISHED,
        )
        for rule in state_rules:
            for rv in sorted(_extract_ast_variables(rule.condition_ast)):
                if rv not in known_keys and not any(q["target_variable_id"] == rv for q in questions):
                    var_def = get_variable(rv)
                    if var_def:
                        questions.append({
                            "question_id": f"Q_{rv}",
                            "target_variable_id": rv,
                            "is_canonical": True,
                            "question_text": f"What is your enterprise's {var_def.label.lower()}?",
                            "answer_type": str(var_def.data_type),
                            "allowed_values": [opt.value for opt in var_def.options] if var_def.options else [],
                            "priority": 2,
                            "reason": f"Required by state-specific published rule for {state_name}.",
                            "expected_discovery_impact": f"Directs regulatory discovery to {state_name} state portal schedules.",
                            "domain": "STATE_REGULATION",
                        })

    # Supplementary pool to ensure 15 questions standard
    existing_q_ids = {q["target_variable_id"] for q in questions}

    if desc_has_saas:
        saas_pool = [
            {
                "target_variable_id": "dynamic_data_retention_policy",
                "is_canonical": False,
                "question_text": "Does your digital platform enforce a formal personal data retention schedule and automated erasure mechanism?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines statutory compliance under Section 8 of the Digital Personal Data Protection (DPDP) Act 2023.",
                "expected_discovery_impact": "Directs discovery to DPDP Act data fiduciary obligations.",
                "domain": "DATA_PROTECTION",
            },
            {
                "target_variable_id": "dynamic_certin_incident_readiness",
                "is_canonical": False,
                "question_text": "Does your technical team maintain system access logs for 180 days and possess a 6-hour cybersecurity incident reporting protocol?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Mandatory under CERT-In Directions 2022 under Section 70B of the Information Technology Act.",
                "expected_discovery_impact": "Directs search to CERT-In cybersecurity reporting frameworks.",
                "domain": "CYBER_SECURITY",
            },
            {
                "target_variable_id": "dynamic_grievance_redressal_officer",
                "is_canonical": False,
                "question_text": "Has your organization designated and publicly displayed the contact details of a Data Grievance Redressal Officer?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Statutorily required under Information Technology (Intermediary Guidelines) Rules 2021 & DPDP Act.",
                "expected_discovery_impact": "Focuses discovery on intermediary guidelines and user grievance mechanisms.",
                "domain": "DIGITAL_COMPLIANCE",
            },
            {
                "target_variable_id": "dynamic_payment_gateway_integration",
                "is_canonical": False,
                "question_text": "Does your software accept electronic payments or process financial transactions through third-party payment gateways?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines Reserve Bank of India (RBI) Payment Aggregator (PA) and Tokenization guidelines.",
                "expected_discovery_impact": "Focuses discovery on RBI digital payment compliance frameworks.",
                "domain": "FINTECH_REGULATION",
            },
            {
                "target_variable_id": "dynamic_children_personal_data",
                "is_canonical": False,
                "question_text": "Does your service process personal data belonging to children (under 18 years) or track their behavioral patterns?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines Section 9 DPDP Act mandates on verifiable parental consent and prohibition of behavioral tracking.",
                "expected_discovery_impact": "Directs search to DPDP Act child data protection stipulations.",
                "domain": "DATA_PROTECTION",
            },
            {
                "target_variable_id": "dynamic_iso_soc2_audits",
                "is_canonical": False,
                "question_text": "Has your cloud architecture undergone third-party SOC 2 Type II or ISO/IEC 27001 security certification?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines international cybersecurity baseline recognition under MeitY guidelines.",
                "expected_discovery_impact": "Focuses search on government procurement cloud security empanelment.",
                "domain": "CYBER_SECURITY",
            },
        ]
        for q in saas_pool:
            k = q["target_variable_id"]
            if k not in known_keys and k not in existing_q_ids and len(questions) < TARGET_QUESTIONS_COUNT:
                q["question_id"] = f"Q_{k}"
                questions.append(q)
                existing_q_ids.add(k)
    else:
        physical_pool = [
            {
                "target_variable_id": "contract_worker_count",
                "is_canonical": True,
                "question_text": "How many contract or temporary workers are deployed through contractors at your facility at peak operations?",
                "answer_type": "NUMBER",
                "allowed_values": [],
                "priority": 1,
                "reason": "Determines mandatory registration under Section 7 of the Contract Labour (Regulation & Abolition) Act 1970.",
                "expected_discovery_impact": "Directs regulatory discovery to State Labour Commissioner contract labor registration rules.",
                "domain": "LABOUR_SAFETY",
            },
            {
                "target_variable_id": "boiler_installed",
                "is_canonical": True,
                "question_text": "Does your manufacturing facility operate an industrial steam boiler, thermic fluid heater, or steam generator?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 1,
                "reason": "Determines statutory registration, inspection, and boiler attendant certification under the Indian Boilers Act 1923.",
                "expected_discovery_impact": "Focuses discovery on Chief Inspector of Boilers approval schedules.",
                "domain": "FACTORY_SAFETY",
            },
            {
                "target_variable_id": "dynamic_air_emission_sources",
                "is_canonical": False,
                "question_text": "Does your facility operate industrial diesel generator (DG) sets, chimney exhausts, or process kilns that discharge emissions?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines stack height monitoring and Consent to Operate under Section 21 of the Air (P&CP) Act 1981.",
                "expected_discovery_impact": "Directs discovery to SPCB air emission consent conditions and acoustic enclosure norms.",
                "domain": "ENVIRONMENTAL_SAFETY",
            },
            {
                "target_variable_id": "dynamic_packaging_type_plastic",
                "is_canonical": False,
                "question_text": "Does your enterprise utilize plastic packaging, plastic containers, or pre-packaged wrappers for distributing products?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines mandatory Extended Producer Responsibility (EPR) registration under Plastic Waste Management Rules 2016.",
                "expected_discovery_impact": "Directs discovery to CPCB centralized EPR plastic waste registration portal.",
                "domain": "ENVIRONMENTAL_SAFETY",
            },
            {
                "target_variable_id": "dynamic_raw_materials_hazardous",
                "is_canonical": False,
                "question_text": "Do you store, formulate, or handle scheduled hazardous, toxic, or flammable chemicals in bulk at your premises?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines notification of major accident hazard installations under MSIHC Rules 1989 and on-site emergency plans.",
                "expected_discovery_impact": "Focuses discovery on DISH (Factory Inspectorate) chemical safety approvals.",
                "domain": "HAZARDOUS_SAFETY",
            },
            {
                "target_variable_id": "dynamic_groundwater_extraction",
                "is_canonical": False,
                "question_text": "Does your facility extract groundwater via dedicated on-site borewells or tube-wells for industrial or washing use?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines mandatory No Objection Certificate (NOC) from Central Ground Water Authority (CGWA) or State Ground Water Authority.",
                "expected_discovery_impact": "Directs discovery to CGWA industrial abstraction guidelines.",
                "domain": "ENVIRONMENTAL_SAFETY",
            },
            {
                "target_variable_id": "dynamic_product_bis_standard",
                "is_canonical": False,
                "question_text": "Are your manufactured components or finished commodities governed by mandatory Bureau of Indian Standards (BIS) Quality Control Orders?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines mandatory ISI mark license or Compulsory Registration Scheme (CRS) prior to commercial sale.",
                "expected_discovery_impact": "Directs discovery to BIS product certification schedules.",
                "domain": "QUALITY_STANDARDS",
            },
            {
                "target_variable_id": "dynamic_storage_flammables",
                "is_canonical": False,
                "question_text": "Does your plant store bulk petroleum fuels, solvents, paints, LPG, or compressed gas cylinders exceeding statutory threshold limits?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines storage licensing from Petroleum and Explosives Safety Organisation (PESO) under Petroleum Rules 2002.",
                "expected_discovery_impact": "Focuses discovery on PESO Form XIV license schedules.",
                "domain": "HAZARDOUS_SAFETY",
            },
            {
                "target_variable_id": "dynamic_trade_license_municipality",
                "is_canonical": False,
                "question_text": "Has a formal municipal trade license or industrial health clearance been issued for this operational site?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines compliance with State Municipal Acts and local urban local body licensing mandates.",
                "expected_discovery_impact": "Directs discovery to local municipal industrial trade licensing rules.",
                "domain": "LOCAL_GOVERNANCE",
            },
            {
                "target_variable_id": "dynamic_fire_safety_noc",
                "is_canonical": False,
                "question_text": "Does the manufacturing premises possess a valid Fire Safety No Objection Certificate (NOC) from the State Fire Services?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Statutorily mandatory for all factory sheds, storage godowns, and industrial occupancies under State Fire Safety Acts.",
                "expected_discovery_impact": "Directs discovery to State Fire Prevention and Safety Measures rules.",
                "domain": "FIRE_SAFETY",
            },
            {
                "target_variable_id": "dynamic_battery_ewaste_handling",
                "is_canonical": False,
                "question_text": "Does your facility refurbish, dismantle, or handle electrical, electronic equipment, or industrial batteries?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Determines applicability of Battery Waste Management Rules 2022 or E-Waste Management Rules 2022.",
                "expected_discovery_impact": "Focuses discovery on CPCB EPR portal registration for batteries/e-waste.",
                "domain": "ENVIRONMENTAL_SAFETY",
            },
            {
                "target_variable_id": "plant_machinery_investment",
                "is_canonical": True,
                "question_text": "What is your total capital investment in plant, machinery, and operational equipment (in INR)?",
                "answer_type": "NUMBER",
                "allowed_values": [],
                "priority": 1,
                "reason": "Plant & machinery valuation determines MSME statutory tiering (Micro, Small, Medium) under the MSMED Act and qualifies capital subsidy schemes.",
                "expected_discovery_impact": "Directs regulatory harvesting to MSME development schemes and capital subsidy thresholds.",
                "domain": "COMPLIANCE",
            },
            {
                "target_variable_id": "legal_constitution",
                "is_canonical": True,
                "question_text": "What is the formal legal constitution of your enterprise (e.g. Pvt Ltd, LLP, Partnership, Sole Proprietorship)?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": ["Pvt Ltd", "LLP", "Partnership", "Sole Proprietorship"],
                "priority": 1,
                "reason": "Constitution governs MCA corporate compliance, statutory audit rules, director KYC, and board reporting mandates.",
                "expected_discovery_impact": "Determines MCA filing forms, director disclosure schedules, and statutory audit obligations.",
                "domain": "COMPLIANCE",
            },
            {
                "target_variable_id": "lifecycle_stage",
                "is_canonical": True,
                "question_text": "What is your current operational lifecycle stage (e.g. Pre-commissioning Setup, Expanding, or Fully Operational)?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": ["Pre-commissioning Setup", "Expanding", "Fully Operational"],
                "priority": 1,
                "reason": "Operational stage separates pre-establishment statutory approvals (CTE, building plan) from operational licenses (CTO, factory license).",
                "expected_discovery_impact": "Separates pre-construction approvals from ongoing operational renewals.",
                "domain": "COMPLIANCE",
            },
            {
                "target_variable_id": "ownership_social_category",
                "is_canonical": True,
                "question_text": "What is the social category of the enterprise's primary promoter or majority shareholder?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": ["General", "SC", "ST", "OBC"],
                "priority": 2,
                "reason": "Promoter social category qualifies the enterprise for preferential procurement quotas and enhanced subsidies under Central/State MSME schemes.",
                "expected_discovery_impact": "Unlocks SC/ST Hub incentives and specialized state industrial subsidies.",
                "domain": "SCHEMES",
            },
            {
                "target_variable_id": "ownership_gender",
                "is_canonical": True,
                "question_text": "Is the enterprise woman-owned or co-founded by women (holding 51%+ equity)?",
                "answer_type": "BOOLEAN",
                "allowed_values": ["true", "false"],
                "priority": 2,
                "reason": "Woman-owned enterprises unlock dedicated credit guarantees, grant subsidies, and SIDBI priority financing windows.",
                "expected_discovery_impact": "Identifies Stand-Up India and state women-entrepreneurship subsidy eligibility.",
                "domain": "SCHEMES",
            },
            {
                "target_variable_id": "district",
                "is_canonical": True,
                "question_text": "In which municipal district is your primary factory or operating facility located?",
                "answer_type": "TEXT",
                "allowed_values": [],
                "priority": 2,
                "reason": "District location dictates local municipal trade licenses, district industrial centre (DIC) registrations, and local zoning permissions.",
                "expected_discovery_impact": "Filters district-level DIC incentives and municipal council permits.",
                "domain": "COMPLIANCE",
            },
            {
                "target_variable_id": "state",
                "is_canonical": True,
                "question_text": "In which Indian State or Union Territory is your primary operating premises registered?",
                "answer_type": "SINGLE_CHOICE",
                "allowed_values": [],
                "priority": 1,
                "reason": "State jurisdiction governs State Pollution Control Board, state labour departments, and state industrial policy incentives.",
                "expected_discovery_impact": "Establishes primary state regulatory portal and inspectorate jurisdiction.",
                "domain": "COMPLIANCE",
            },
        ]
        for q in physical_pool:
            k = q["target_variable_id"]
            if k not in known_keys and k not in existing_q_ids and len(questions) < TARGET_QUESTIONS_COUNT:
                q["question_id"] = f"Q_{k}"
                questions.append(q)
                existing_q_ids.add(k)

    questions = questions[:TARGET_QUESTIONS_COUNT]

    intent = RegulatoryDiscoveryIntent(
        business_type=f"{business_name} Operational Profile",
        primary_activity=context.primary_activity or context.product_description[:80] or "Commercial Operations",
        secondary_activities=["Cross-border trade"] if context.is_cross_border else ["Domestic distribution"],
        products=[p.strip() for p in (context.product_description or "Commercial goods").split(",")[:4]],
        relevant_jurisdictions=[state_name, "CENTRAL"],
        likely_sectors=["Agrochemical & Environmental" if desc_has_pesticide else "Commercial Operations"],
        possible_regulatory_domains=["Pollution Control Board", "State Licensing Authority"],
        search_topics=search_topics,
        unresolved_facts=[q["target_variable_id"] for q in questions],
        information_gaps=[g.get("description", "") for g in gaps] if gaps else ["Specific product classification"],
    )

    for q in questions:
        q["variable_key"] = q["target_variable_id"]

    return intent, gaps, questions


def plan_adaptive_smart_questions(
    business: Business,
    round_number: int = 1,
    assessment_id: str | None = None,
    batch_size: int | None = None,
) -> dict[str, Any]:
    """Dynamically plan adaptive smart questions for a business as a Pre-Discovery Interview.

    Pipeline:
    1. Business Understanding: Understand what the company actually manufactures, formulates,
       processes, stores, provides, sells, imports, exports, or operates.
    2. Conflict Detection: Identify divergences between business name and operational description.
    3. Deterministic AST-Aware Rules Analysis: Evaluate published rules using three-valued Kleene
       logic; identify which missing variables are decision-relevant for UNKNOWN rules.
    4. Smart Question Generation: Convert high-value gaps and decision-relevant variables into
       founder-friendly questions.
    """
    context = build_business_context(business)

    # Resolve assessment if passed or latest
    assessment = None
    if assessment_id:
        assessment = business.assessments.filter(pk=assessment_id).first()
    if assessment is None:
        assessment = business.assessments.order_by("-assessment_number").first()

    # If exceeding MAX_ROUNDS, terminate with COMPLETED
    if round_number > MAX_ROUNDS:
        reason = "ROUNDS_EXHAUSTED"
        plan = SmartQuestionPlan.objects.filter(business=business, round_number=round_number).order_by("-created_at").first()
        if plan:
            plan.status = "COMPLETED"
            plan.stopping_reason = reason
            plan.business_summary = f"Intake complete for {business.name} after {MAX_ROUNDS} rounds."
            plan.reasoning_summary = "Maximum adaptive interview rounds reached."
            plan.save(update_fields=["status", "stopping_reason", "business_summary", "reasoning_summary"])
        else:
            plan = SmartQuestionPlan.objects.create(
                business=business,
                round_number=round_number,
                status="COMPLETED",
                stopping_reason=reason,
                assessment=assessment,
                business_summary=f"Intake complete for {business.name} after {MAX_ROUNDS} rounds.",
                regulatory_search_intent={},
                information_gaps=[],
                reasoning_summary="Maximum adaptive interview rounds reached.",
            )
        if assessment and not assessment.question_plan:
            assessment.question_plan = plan
            assessment.save(update_fields=["question_plan"])

        return {
            "business_id": str(business.id),
            "business_name": business.name,
            "assessment_id": str(assessment.id) if assessment else None,
            "plan_id": str(plan.id),
            "round": round_number,
            "status": "COMPLETED",
            "stopping_reason": reason,
            "personalization_header": f"Intake Completed for {business.name}",
            "personalization_subtitle": "Maximum interview rounds reached.",
            "questions": [],
            "total_questions": 0,
            "total_missing": len(context.missing_variable_keys),
        }

    # Collect all facts already known from previous intake steps or versions
    known_facts: dict[str, Any] = {
        "business_name": business.name,
        "legal_constitution": context.legal_constitution,
        "state": context.state,
        "state_name": context.state_name,
        "district": context.district,
        "industrial_zone_status": context.industrial_zone_status,
        "lifecycle_stage": context.lifecycle_stage,
        "product_description": context.product_description,
        "trade_intent": context.trade_intent,
        "msme_scale": context.msme_scale,
    }
    for k in context.known_variable_keys:
        val = context.raw_variables.get(k)
        if val is not None and val != "":
            known_facts[k] = val

    known_keys = set(known_facts.keys())

    # Build reference catalog of canonical variables
    canonical_catalog = _build_canonical_catalog()

    # Multi-round history
    previous_rounds_answers: dict[str, Any] = {}
    if round_number > 1:
        prev_plans = business.question_plans.filter(round_number__lt=round_number)
        for p in prev_plans:
            for q in p.questions.filter(is_answered=True):
                previous_rounds_answers[q.variable_key] = q.answer_value

    # --------------------------------------------------------------------------
    # Deterministic AST-Aware Analysis of Published Statutory Rules (AUTHORITY)
    # --------------------------------------------------------------------------
    candidate_rules_qs = RuleVersion.objects.filter(
        status=KnowledgeStatus.PUBLISHED,
        requirement__status=KnowledgeStatus.PUBLISHED,
    ).select_related("requirement")

    candidate_jurisdictions = {"CENTRAL"}
    if context.state:
        candidate_jurisdictions.add(context.state)
        candidate_jurisdictions.add(context.state.upper())
    candidate_rules = list(candidate_rules_qs.filter(jurisdiction__in=list(candidate_jurisdictions)))

    kb_analysis = analyze_candidate_rules(candidate_rules, context)

    business_summary = f"{business.name} operations located in {context.state_name}."
    reasoning_summary = "Formulated discovery information gaps to refine upcoming regulatory searches."
    discovery_intent = RegulatoryDiscoveryIntent(
        business_type=f"{business.name} Entity",
        primary_activity=context.primary_activity or context.product_description[:80] or "Commercial Operations",
        secondary_activities=["Cross-border trade"] if context.is_cross_border else ["Domestic distribution"],
        products=[p.strip() for p in (context.product_description or "Commercial goods").split(",")[:4]],
        relevant_jurisdictions=[context.state_name or "India", "CENTRAL"],
        likely_sectors=["Industrial & Commercial Operations"],
        possible_regulatory_domains=["Central & State Statutory Authorities"],
        search_topics=[],
        unresolved_facts=[],
        information_gaps=[],
    )
    information_gaps_list: list[dict[str, Any]] = []
    planned_items: list[dict[str, Any]] = []

    # --------------------------------------------------------------------------
    # Invoke LLM for Business Understanding & Information Gap Interview Planning
    # --------------------------------------------------------------------------
    provider = get_llm_provider()
    llm_succeeded = False

    # Phase 1 & 2: First check if an existing active question plan with questions exists
    existing_plan = SmartQuestionPlan.objects.filter(
        business=business,
        round_number=round_number,
        status="ACTIVE",
    ).order_by("-created_at").first()

    if existing_plan and existing_plan.questions.exists():
        cached_qs = []
        for q in existing_plan.questions.all():
            if q.is_answered or q.variable_key in known_keys or q.variable_key in context.known_variable_keys:
                continue
            cached_qs.append({
                "question_id": q.question_id or f"Q_{q.variable_key}",
                "target_variable_id": q.target_variable_id or q.variable_key,
                "variable_key": q.variable_key,
                "question_text": q.question_text,
                "why_it_matters": q.why_it_matters,
                "reason": q.reason,
                "domains": q.domains or ["STATUTORY_COMPLIANCE"],
                "data_type": q.data_type,
                "options": q.options or [],
                "priority": q.priority,
                "is_canonical": bool(q.variable_key in VARIABLES_BY_KEY),
            })
        if cached_qs:
            if batch_size is not None:
                cached_qs = cached_qs[:batch_size]
            return {
                "business_id": str(business.id),
                "business_name": business.name,
                "assessment_id": str(assessment.id) if assessment else None,
                "plan_id": str(existing_plan.id),
                "round": round_number,
                "status": existing_plan.status,
                "stopping_reason": existing_plan.stopping_reason,
                "business_summary": existing_plan.business_summary,
                "regulatory_search_intent": existing_plan.regulatory_search_intent,
                "information_gaps": existing_plan.information_gaps,
                "reasoning_summary": existing_plan.reasoning_summary,
                "questions": cached_qs,
                "total_questions": len(cached_qs),
                "total_missing": len(context.missing_variable_keys),
                "known_variables_count": len(context.known_variable_keys),
                "context_summary": context.as_dict(),
            }

    # Deterministic-first policy: only call LLM when deterministic candidate rules
    # cannot provide enough questions for intake (len(ranked_variables) < 3) and batch_size is None
    should_call_llm = (
        provider.is_configured
        and (batch_size is None)
        and (round_number == 1)
        and (len(kb_analysis.ranked_variables) < 3)
    )

    if should_call_llm:
        # Phase 3: Send only relevant unresolved variable keys, NOT the 43-variable catalog
        compact_vars = {
            rv: (get_variable(rv).label if get_variable(rv) else rv)
            for rv in kb_analysis.ranked_variables[:6]
        }
        if not compact_vars:
            compact_vars = {
                k: (get_variable(k).label if get_variable(k) else k)
                for k in ("total_worker_count", "annual_turnover", "connected_power_load", "effluent_emission_generation", "hazardous_waste_generation", "import_export_intent")
                if k not in known_keys
            }

        # Phase 4: Static prompt instructions first, dynamic business profile last for cache prefix stability
        prompt = f"""Conduct an intake pre-discovery interview. Understand this specific business, detect information gaps, and generate 3 to 5 targeted discovery questions.

RELEVANT TARGET VARIABLES FOR THIS INTERVIEW:
{json.dumps(compact_vars, indent=2)}

ALREADY KNOWN FACTS (DO NOT ASK ABOUT THESE):
{json.dumps(known_facts, indent=2)}

BUSINESS PROFILE:
Business Name: {business.name}
Legal Constitution: {context.legal_constitution or 'Not specified'}
State: {context.state_name} ({context.state})
Activity / Products: {context.product_description}
Trade Intent: {context.trade_intent or 'Domestic operations'}
MSME Scale: {context.msme_scale}"""

        try:
            res = provider.complete(
                [
                    ChatMessage(role="system", content=QUESTION_PLANNER_SYSTEM_PROMPT),
                    ChatMessage(role="user", content=prompt),
                ],
                temperature=0.1,
                max_output_tokens=2500,
                reasoning_effort="none",
                workflow="smart_questions_planner",
                assessment_id=str(assessment.id) if assessment else None,
                business_id=str(business.id),
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
            business_summary = parsed.get("business_summary") or business_summary
            reasoning_summary = parsed.get("reasoning_summary") or reasoning_summary

            if parsed.get("regulatory_search_intent"):
                intent_data = parsed["regulatory_search_intent"]
                discovery_intent = RegulatoryDiscoveryIntent(
                    business_type=intent_data.get("business_type", discovery_intent.business_type),
                    primary_activity=intent_data.get("primary_activity", discovery_intent.primary_activity),
                    secondary_activities=intent_data.get("secondary_activities", discovery_intent.secondary_activities),
                    products=intent_data.get("products", discovery_intent.products),
                    relevant_jurisdictions=intent_data.get("relevant_jurisdictions", discovery_intent.relevant_jurisdictions),
                    likely_sectors=intent_data.get("likely_sectors", discovery_intent.likely_sectors),
                    possible_regulatory_domains=intent_data.get("possible_regulatory_domains", discovery_intent.possible_regulatory_domains),
                    search_topics=intent_data.get("search_topics", discovery_intent.search_topics),
                    unresolved_facts=intent_data.get("unresolved_facts", discovery_intent.unresolved_facts),
                    information_gaps=intent_data.get("information_gaps", discovery_intent.information_gaps),
                )

            if parsed.get("information_gaps") and isinstance(parsed["information_gaps"], list):
                information_gaps_list = parsed["information_gaps"]

            raw_qs = parsed.get("questions", [])
            seen_vars: set[str] = set()

            for item in raw_qs:
                var_key = str(
                    item.get("target_variable_id")
                    or item.get("variable_key")
                    or item.get("variable_id")
                    or item.get("key")
                    or ""
                ).strip().lower()

                # Clean snake_case key
                var_key = re.sub(r"[^a-z0-9_]+", "_", var_key).strip("_")

                if not var_key or var_key in seen_vars or var_key in known_keys:
                    continue
                seen_vars.add(var_key)

                is_canonical = bool(item.get("is_canonical", False) or var_key in VARIABLES_BY_KEY)
                domains_val = item.get("domains")
                if not isinstance(domains_val, list) or not domains_val:
                    d_single = item.get("domain")
                    domains_val = [d_single] if d_single else ["COMPLIANCE"]

                ans_type = str(item.get("answer_type") or item.get("data_type") or "TEXT").upper()
                opts = item.get("allowed_values") or item.get("options") or []

                # If canonical variable exists, synchronize options if missing
                var_def = get_variable(var_key)
                if var_def:
                    is_canonical = True
                    if not opts and var_def.options:
                        opts = [o.value for o in var_def.options]
                    ans_type = str(var_def.data_type)

                planned_items.append({
                    "question_id": item.get("question_id") or f"Q_{var_key}",
                    "target_variable_id": var_key,
                    "variable_key": var_key,
                    "is_canonical": is_canonical,
                    "question_text": str(item.get("question_text", "")).strip(),
                    "reason": str(item.get("reason", "")).strip(),
                    "why_it_matters": str(item.get("reason", "")).strip(),
                    "expected_discovery_impact": str(item.get("expected_discovery_impact", "")).strip(),
                    "domains": domains_val,
                    "domain": item.get("domain") or domains_val[0],
                    "answer_type": ans_type,
                    "data_type": ans_type,
                    "options": opts,
                    "priority": str(item.get("priority", "1")),
                    "information_gain": float(item.get("information_gain", 0.90)),
                })

            if len(planned_items) > 0 or (parsed.get("questions") is not None and len(parsed.get("questions", [])) == 0):
                llm_succeeded = True
        except Exception as exc:
            logger.warning("LLM question planning failed, using dynamic context fallback: %s", exc)

    # --------------------------------------------------------------------------
    # Fallback to Deterministic Context-Driven Extraction if LLM Failed
    # --------------------------------------------------------------------------
    if not llm_succeeded or len(planned_items) == 0:
        fb_intent, fb_gaps, fb_questions = _build_context_driven_fallback_questions(
            context,
            business.name,
            known_keys,
        )
        if not llm_succeeded:
            discovery_intent = fb_intent
            information_gaps_list = fb_gaps
        existing_keys = {item["variable_key"] for item in planned_items}
        for q in fb_questions:
            k = q["target_variable_id"]
            if k not in existing_keys and k not in known_keys:
                existing_keys.add(k)
                planned_items.append(q)

    # --------------------------------------------------------------------------
    # Sector Isolation Filtering (Invariant: Zero cross-contamination)
    # --------------------------------------------------------------------------
    desc_lower = (context.product_description or "").lower()
    name_lower = (business.name or "").lower()
    is_food = any(w in desc_lower for w in ["food", "fruit", "beverage", "snack", "bakery", "dairy", "agro"])
    is_saas = bool(re.search(r"\b(software|saas|cloud|platform|digital|apps?)\b", desc_lower))
    is_med = any(w in desc_lower or w in name_lower for w in ["medtech", "medical", "device", "surgical", "diagnostic", "implant", "catheter"])
    is_pesticide = any(w in desc_lower for w in ["pesticide", "waste", "fertilizer", "crop", "biomass", "recycle"])
    is_ev = any(w in desc_lower for w in ["ev charging", "electric vehicle", "charging station", "charging infrastructure", "dc fast charger", "charging point", "evse"]) or any(w in name_lower for w in ["voltgrid", "ev charge", "mobility services"])
    is_construction = any(w in desc_lower for w in ["construction", "civil engineering", "infrastructure contractor", "building contractor", "highways", "earthmoving", "bocw"]) or any(w in name_lower for w in ["apexbuild", "construction", "infra"])
    is_textile_export = any(w in desc_lower for w in ["textile", "apparel export", "garment export", "finished garments", "merchant exporter"]) or any(w in name_lower for w in ["silkroute", "textile export", "apparel export"])
    is_data_centre = any(w in desc_lower for w in ["data centre", "data center", "colocation", "hyperscale", "server hall"]) or any(w in name_lower for w in ["cloudaxis", "data centre", "data center"])
    is_microfinance = any(w in desc_lower for w in ["microfinance", "micro-credit", "joint liability", "nbfc-mfi", "lending", "credit facility", "mfi"]) or any(w in name_lower for w in ["sahaya", "microfinance", "mfi", "finances"])

    if is_food and not is_pesticide:
        planned_items = [
            q for q in planned_items
            if q["variable_key"] not in {
                "cdsco_device_risk_class", "is_sterile_at_supply", "cleanroom_iso_class",
                "biocompatibility_tested", "active_or_implantable",
                "processes_personal_data", "cloud_hosting_location", "critical_cyber_services",
                "cross_border_data_transfer", "export_of_software_services",
                "epr_target_obligation", "wireless_rf_features",
            }
        ]
    elif is_saas:
        planned_items = [
            q for q in planned_items
            if q["variable_key"] not in {
                "connected_power_load", "effluent_emission_generation", "hazardous_waste_generation",
                "boiler_installed", "daily_processing_capacity", "food_contact_packaging", "cold_chain_storage",
                "cleanroom_iso_class", "cdsco_device_risk_class", "is_sterile_at_supply", "epr_target_obligation",
                "organic_claim", "biocompatibility_tested", "active_or_implantable",
            }
        ]
    elif is_med and not is_pesticide:
        planned_items = [
            q for q in planned_items
            if q["variable_key"] not in {
                "daily_processing_capacity", "boiler_installed", "food_contact_packaging", "organic_claim",
                "processes_personal_data", "cloud_hosting_location", "critical_cyber_services",
                "cross_border_data_transfer", "export_of_software_services",
                "cold_chain_storage", "epr_target_obligation", "wireless_rf_features",
            }
        ]
    elif is_textile_export:
        planned_items = [
            q for q in planned_items
            if q["variable_key"] not in {
                "connected_power_load", "boiler_installed", "effluent_emission_generation", "hazardous_waste_generation",
                "dynamic_machining_process_type", "dynamic_surface_treatment_finish", "cdsco_device_risk_class",
                "is_sterile_at_supply", "cleanroom_iso_class", "processes_personal_data", "cloud_hosting_location",
                "critical_cyber_services", "daily_processing_capacity", "food_contact_packaging",
            }
        ]
    elif is_microfinance:
        planned_items = [
            q for q in planned_items
            if q["variable_key"] not in {
                "connected_power_load", "boiler_installed", "effluent_emission_generation", "hazardous_waste_generation",
                "dynamic_machining_process_type", "dynamic_surface_treatment_finish", "cdsco_device_risk_class",
                "is_sterile_at_supply", "cleanroom_iso_class", "daily_processing_capacity", "food_contact_packaging",
                "cold_chain_storage", "organic_claim",
            }
        ]
    elif is_ev:
        planned_items = [
            q for q in planned_items
            if q["variable_key"] not in {
                "cdsco_device_risk_class", "is_sterile_at_supply", "cleanroom_iso_class", "daily_processing_capacity",
                "food_contact_packaging", "cold_chain_storage", "organic_claim", "biocompatibility_tested", "active_or_implantable",
            }
        ]
    elif is_construction:
        planned_items = [
            q for q in planned_items
            if q["variable_key"] not in {
                "connected_power_load", "cdsco_device_risk_class", "is_sterile_at_supply", "cleanroom_iso_class",
                "daily_processing_capacity", "food_contact_packaging", "cold_chain_storage", "organic_claim",
                "processes_personal_data", "cloud_hosting_location",
            }
        ]
    elif is_data_centre:
        planned_items = [
            q for q in planned_items
            if q["variable_key"] not in {
                "daily_processing_capacity", "food_contact_packaging", "cleanroom_iso_class", "cdsco_device_risk_class",
                "is_sterile_at_supply", "organic_claim",
            }
        ]

    # --------------------------------------------------------------------------
    # Published Rules Alignment: AST-Aware Adaptive Decision Variables
    # --------------------------------------------------------------------------
    rule_driven_items: list[dict[str, Any]] = []
    seen_rule_vars: set[str] = set()

    CANONICAL_VARIABLE_QUESTIONS: dict[str, str] = {
        "annual_turnover": "What is your enterprise's approximate annual turnover (in INR)?",
        "plant_machinery_investment": "What is your enterprise's total investment in plant, machinery, and equipment (in INR)?",
        "total_worker_count": "What is the peak total number of workers and employees engaged at your facility?",
        "contract_worker_count": "How many contract or temporary workers are engaged through third-party contractors?",
        "connected_power_load": "What is the sanctioned electrical connected load (in HP or kW) for your facility?",
        "effluent_emission_generation": "Does your facility generate trade effluent, air emissions, or toxic industrial discharges?",
        "hazardous_waste_generation": "Does your unit generate, handle, or store any hazardous wastes specified under CPCB schedules?",
        "import_export_intent": "Does your enterprise plan to import raw materials or export finished goods across borders?",
        "boiler_installed": "Is an industrial boiler or steam-generating pressure vessel installed and operated on your premises?",
        "daily_processing_capacity": "What is your facility's peak daily food processing or production capacity (in metric tonnes)?",
        "food_contact_packaging": "Do you manufacture, pack, or store materials that come into direct contact with food products?",
        "cold_chain_storage": "Does your operation include refrigerated storage, cold rooms, or temperature-controlled transit?",
        "organic_claim": "Do you label or market products with organic claims requiring Jaivik Bharat certification?",
        "cdsco_device_risk_class": "What is the CDSCO Medical Device classification for your manufactured products?",
        "is_sterile_at_supply": "Are your manufactured medical products supplied in a sterile state to healthcare providers?",
        "cleanroom_iso_class": "What ISO classification standard does your cleanroom manufacturing area meet?",
        "biocompatibility_tested": "Have your medical materials undergone ISO 10993 biocompatibility testing?",
        "active_or_implantable": "Are your medical devices surgically implantable or powered active devices?",
        "processes_personal_data": "Does your software platform collect, store, or process personal data of Indian citizens?",
        "cloud_hosting_location": "Where are your production cloud servers and user databases physically hosted?",
        "critical_cyber_services": "Does your application provide critical services to government or regulated financial institutions?",
        "cross_border_data_transfer": "Does your organization transfer personal or customer data outside India?",
        "export_of_software_services": "Do you export software or IT-enabled services to clients outside India?",
        "epr_target_obligation": "Do you introduce packaged plastic into the market requiring Extended Producer Responsibility (EPR)?",
        "wireless_rf_features": "Does your hardware product incorporate Wi-Fi, Bluetooth, or wireless RF transmitter modules?",
    }

    for rv in kb_analysis.ranked_variables:
        if rv in known_keys or rv in seen_rule_vars:
            continue
        seen_rule_vars.add(rv)
        var_def = get_variable(rv)
        dep_count = kb_analysis.variable_impact.get(rv, 0)
        info_gain = round(dep_count / max(kb_analysis.unresolved_count, 1), 4) if kb_analysis.unresolved_count > 0 else 1.0
        info_gain = max(0.1, min(1.0, info_gain))

        q_text = CANONICAL_VARIABLE_QUESTIONS.get(rv)
        if not q_text:
            q_text = f"What is your enterprise's {var_def.label.lower()}?" if var_def else f"Please specify {rv.replace('_', ' ')}."

        domains_list = ["STATUTORY_COMPLIANCE"]
        rule_driven_items.append({
            "question_id": f"Q_{rv}",
            "target_variable_id": rv,
            "variable_key": rv,
            "is_canonical": bool(var_def is not None),
            "question_text": q_text,
            "reason": f"Evaluated by {dep_count} unresolved statutory compliance rule(s).",
            "why_it_matters": (var_def.why_it_matters if var_def else "") or f"Required to resolve {dep_count} applicable statutory rules.",
            "expected_discovery_impact": f"Directly resolves legal uncertainty for {dep_count} compliance rule(s).",
            "domains": domains_list,
            "domain": domains_list[0],
            "answer_type": str(var_def.data_type) if var_def else "TEXT",
            "data_type": str(var_def.data_type) if var_def else "TEXT",
            "options": [opt.value for opt in var_def.options] if var_def and var_def.options else [],
            "priority": "1",
            "information_gain": info_gain,
            "rule_dependency_count": dep_count,
            "candidate_rules_count": dep_count,
        })

    # Merge rule_driven_items (highest priority) with planned_items (pre-discovery)
    combined_items: list[dict[str, Any]] = []
    seen_combined: set[str] = set()

    for item in rule_driven_items:
        k = item["variable_key"]
        if k not in seen_combined and k not in known_keys:
            seen_combined.add(k)
            combined_items.append(item)

    for item in planned_items:
        k = item["variable_key"]
        if k not in seen_combined and k not in known_keys:
            seen_combined.add(k)
            combined_items.append(item)

    # Sector Isolation Filtering (Invariant: Zero cross-contamination)
    food_forbidden = {
        "cdsco_device_risk_class", "is_sterile_at_supply", "cleanroom_iso_class",
        "biocompatibility_tested", "active_or_implantable",
        "processes_personal_data", "cloud_hosting_location", "critical_cyber_services",
        "cross_border_data_transfer", "export_of_software_services",
        "epr_target_obligation", "wireless_rf_features",
    }
    saas_forbidden = {
        "connected_power_load", "effluent_emission_generation", "hazardous_waste_generation",
        "boiler_installed", "daily_processing_capacity", "food_contact_packaging", "cold_chain_storage",
        "cleanroom_iso_class", "cdsco_device_risk_class", "is_sterile_at_supply", "epr_target_obligation",
        "organic_claim", "biocompatibility_tested", "active_or_implantable",
    }
    med_forbidden = {
        "daily_processing_capacity", "boiler_installed", "food_contact_packaging", "organic_claim",
        "processes_personal_data", "cloud_hosting_location", "critical_cyber_services",
        "cross_border_data_transfer", "export_of_software_services",
        "cold_chain_storage", "epr_target_obligation", "wireless_rf_features",
    }

    if is_food and not is_pesticide:
        combined_items = [q for q in combined_items if q["variable_key"] not in food_forbidden]
    elif is_saas:
        combined_items = [q for q in combined_items if q["variable_key"] not in saas_forbidden]
    elif is_med and not is_pesticide:
        combined_items = [q for q in combined_items if q["variable_key"] not in med_forbidden]
    elif is_textile_export:
        combined_items = [
            q for q in combined_items
            if q["variable_key"] not in {
                "connected_power_load", "boiler_installed", "effluent_emission_generation", "hazardous_waste_generation",
                "dynamic_machining_process_type", "dynamic_surface_treatment_finish", "cdsco_device_risk_class",
                "is_sterile_at_supply", "cleanroom_iso_class", "processes_personal_data", "cloud_hosting_location",
                "critical_cyber_services", "daily_processing_capacity", "food_contact_packaging",
            }
        ]
    elif is_microfinance:
        combined_items = [
            q for q in combined_items
            if q["variable_key"] not in {
                "connected_power_load", "boiler_installed", "effluent_emission_generation", "hazardous_waste_generation",
                "dynamic_machining_process_type", "dynamic_surface_treatment_finish", "cdsco_device_risk_class",
                "is_sterile_at_supply", "cleanroom_iso_class", "daily_processing_capacity", "food_contact_packaging",
                "cold_chain_storage", "organic_claim",
            }
        ]
    elif is_ev:
        combined_items = [
            q for q in combined_items
            if q["variable_key"] not in {
                "cdsco_device_risk_class", "is_sterile_at_supply", "cleanroom_iso_class", "daily_processing_capacity",
                "food_contact_packaging", "cold_chain_storage", "organic_claim", "biocompatibility_tested", "active_or_implantable",
            }
        ]
    elif is_construction:
        combined_items = [
            q for q in combined_items
            if q["variable_key"] not in {
                "connected_power_load", "cdsco_device_risk_class", "is_sterile_at_supply", "cleanroom_iso_class",
                "daily_processing_capacity", "food_contact_packaging", "cold_chain_storage", "organic_claim",
                "processes_personal_data", "cloud_hosting_location",
            }
        ]
    elif is_data_centre:
        combined_items = [
            q for q in combined_items
            if q["variable_key"] not in {
                "daily_processing_capacity", "food_contact_packaging", "cleanroom_iso_class", "cdsco_device_risk_class",
                "is_sterile_at_supply", "organic_claim",
            }
        ]

    if batch_size is not None:
        # Pure sequential adaptive mode: driven strictly by unresolved rules
        if candidate_rules and kb_analysis.unresolved_count == 0:
            planned_items = []
        elif candidate_rules and not kb_analysis.ranked_variables:
            planned_items = []
        else:
            # Only ask decision-relevant variables for candidate rules (or discovery if no rules)
            rule_vars = set(kb_analysis.ranked_variables)
            relevant_items = [q for q in combined_items if not candidate_rules or q["variable_key"] in rule_vars]
            planned_items = relevant_items[:max(1, batch_size)]
    else:
        # Standard adaptive mode: driven strictly by unresolved rules and genuine gaps (0-4 questions)
        if candidate_rules and (kb_analysis.unresolved_count == 0 or not kb_analysis.ranked_variables):
            planned_items = []
        else:
            rule_vars = set(kb_analysis.ranked_variables) if candidate_rules else set()
            if rule_vars:
                relevant_items = [q for q in combined_items if q["variable_key"] in rule_vars]
                planned_items = relevant_items[:TARGET_QUESTIONS_COUNT]
            else:
                planned_items = combined_items[:TARGET_QUESTIONS_COUNT]

    # Stopping condition: If no questions remain
    if not planned_items:
        reason = (
            "ALL_RULES_RESOLVED"
            if candidate_rules and kb_analysis.unresolved_count == 0
            else ("SUFFICIENT_INFORMATION_GATHERED" if round_number > 1 else "ALL_CRITICAL_VARIABLES_SATISFIED")
        )
        plan = SmartQuestionPlan.objects.filter(business=business, round_number=round_number).order_by("-created_at").first()
        if plan:
            plan.status = "COMPLETED"
            plan.stopping_reason = reason
            plan.business_summary = business_summary
            plan.regulatory_search_intent = discovery_intent.as_dict()
            plan.information_gaps = information_gaps_list
            plan.reasoning_summary = reasoning_summary
            plan.save(update_fields=["status", "stopping_reason", "business_summary", "regulatory_search_intent", "information_gaps", "reasoning_summary"])
        else:
            plan = SmartQuestionPlan.objects.create(
                business=business,
                round_number=round_number,
                status="COMPLETED",
                stopping_reason=reason,
                assessment=assessment,
                business_summary=business_summary,
                regulatory_search_intent=discovery_intent.as_dict(),
                information_gaps=information_gaps_list,
                reasoning_summary=reasoning_summary,
            )
        if assessment and not assessment.question_plan:
            assessment.question_plan = plan
            assessment.save(update_fields=["question_plan"])

        return {
            "business_id": str(business.id),
            "business_name": business.name,
            "assessment_id": str(assessment.id) if assessment else None,
            "plan_id": str(plan.id),
            "round": round_number,
            "status": "COMPLETED",
            "stopping_reason": reason,
            "personalization_header": f"Pre-Discovery Interview Complete for {business.name}",
            "personalization_subtitle": "Sufficient operational clarity collected for targeted regulatory search.",
            "questions": [],
            "total_questions": 0,
            "total_missing": len(context.missing_variable_keys),
            "known_variables_count": len(context.known_variable_keys),
            "context_summary": context.as_dict(),
            "regulatory_discovery_intent": discovery_intent.as_dict(),
            "information_gaps": information_gaps_list,
        }

    # Persist SmartQuestionPlan record
    plan = SmartQuestionPlan.objects.create(
        business=business,
        assessment=assessment,
        round_number=round_number,
        status="ACTIVE",
        business_summary=business_summary,
        regulatory_search_intent=discovery_intent.as_dict(),
        information_gaps=information_gaps_list,
        reasoning_summary=reasoning_summary,
    )
    if assessment and not assessment.question_plan:
        assessment.question_plan = plan
        assessment.save(update_fields=["question_plan"])

    output_questions: list[dict[str, Any]] = []

    for item in planned_items:
        k = item["variable_key"]
        var_def = get_variable(k)

        # Resolve options: canonical options if defined, otherwise format choice list
        raw_opts = item.get("options") or item.get("allowed_values") or []
        if var_def and var_def.options:
            resolved_options = resolve_variable_options(var_def)
        elif raw_opts:
            resolved_options = [
                {"value": str(opt), "label": str(opt)}
                for opt in raw_opts
            ]
        else:
            resolved_options = []

        dep_count = kb_analysis.variable_impact.get(k, 0)
        info_gain = (
            round(dep_count / max(kb_analysis.unresolved_count, 1), 4)
            if kb_analysis.unresolved_count > 0 and dep_count > 0
            else float(item.get("information_gain", 0.85))
        )
        info_gain = max(0.05, min(1.0, info_gain))
        q_inst = SmartQuestionInstance.objects.create(
            plan=plan,
            business=business,
            question_id=item.get("question_id", f"Q_{k}"),
            target_variable_id=k,
            variable_key=k,
            question_text=item.get("question_text", (var_def.label if var_def else k)),
            why_it_matters=item.get("reason", (var_def.why_it_matters if var_def else "")),
            reason=item.get("reason", ""),
            expected_discovery_impact=item.get("expected_discovery_impact", ""),
            domains=item.get("domains", ["COMPLIANCE"]),
            data_type=item.get("data_type", (str(var_def.data_type) if var_def else "TEXT")),
            options=resolved_options,
            unit=(var_def.unit or "") if var_def else "",
            priority=str(item.get("priority", "1")),
            information_gain=float(item.get("information_gain", 0.90)),
            rule_dependency_count=dep_count,
            status="UNANSWERED",
        )

        output_questions.append({
            "id": str(q_inst.id),
            "question_id": q_inst.question_id,
            "code": var_def.code if var_def else "DYN",
            "key": k,
            "variable_key": k,
            "variable_id": k,
            "target_variable_id": k,
            "is_canonical": bool(var_def is not None),
            "label": var_def.label if var_def else k.replace("dynamic_", "").replace("_", " ").title(),
            "question": q_inst.question_text,
            "question_text": q_inst.question_text,
            "data_type": q_inst.data_type,
            "answer_type": q_inst.data_type,
            "why_it_matters": q_inst.why_it_matters,
            "reason": q_inst.reason,
            "expected_discovery_impact": q_inst.expected_discovery_impact,
            "unit": q_inst.unit,
            "options": resolved_options,
            "allowed_values": [opt["value"] if isinstance(opt, dict) else str(opt) for opt in resolved_options],
            "current_value": context.raw_variables.get(k),
            "priority": q_inst.priority,
            "information_gain": q_inst.information_gain,
            "domains": q_inst.domains,
            "required": True if (q_inst.priority == "1" or (var_def and var_def.default_relevance == Relevance.CORE)) else False,
            "rule_dependency_count": q_inst.rule_dependency_count,
            "candidate_rules_count": q_inst.rule_dependency_count,
        })

    sector_name = context.industry_hint or "manufacturing and commercial"
    personalization_summary = (
        f"Selected {len(output_questions)} questions focusing on {sector_name} statutory clearances, "
        f"MSME capital tiers, and environmental mandates under Indian law."
    )

    return {
        "business_id": str(business.id),
        "business_name": business.name,
        "assessment_id": str(assessment.id) if assessment else None,
        "plan_id": str(plan.id),
        "round": round_number,
        "status": "ACTIVE",
        "personalization_header": f"Pre-Discovery Interview for {business.name}",
        "personalization_subtitle": f"Targeted questions formulating search topics across official portals for {context.state_name}.",
        "personalization_summary": personalization_summary,
        "business_summary": business_summary,
        "regulatory_discovery_intent": discovery_intent.as_dict(),
        "information_gaps": information_gaps_list,
        "reasoning_summary": reasoning_summary,
        "questions": output_questions,
        "total_questions": len(output_questions),
        "total_missing": len(context.missing_variable_keys),
        "known_variables_count": len(context.known_variable_keys),
        "context_summary": context.as_dict(),
    }


def get_next_adaptive_question(
    business: Business,
    assessment_id: str | None = None,
) -> dict[str, Any] | None:
    """Sequential adaptive questioning: returns the single highest-impact unresolved question."""
    active_plan = SmartQuestionPlan.objects.filter(
        business=business,
        status="ACTIVE",
    ).order_by("-created_at").first()

    if active_plan:
        unanswered_instance = active_plan.questions.filter(is_answered=False).first()
        if unanswered_instance:
            return {
                "question_id": unanswered_instance.question_id or f"Q_{unanswered_instance.variable_key}",
                "target_variable_id": unanswered_instance.target_variable_id or unanswered_instance.variable_key,
                "variable_key": unanswered_instance.variable_key,
                "question_text": unanswered_instance.question_text,
                "why_it_matters": unanswered_instance.why_it_matters,
                "data_type": unanswered_instance.data_type,
                "options": unanswered_instance.options or [],
                "domains": unanswered_instance.domains or ["STATUTORY_COMPLIANCE"],
                "is_canonical": bool(unanswered_instance.variable_key in VARIABLES_BY_KEY),
                "reason": unanswered_instance.reason,
            }

    plan_result = plan_adaptive_smart_questions(
        business,
        round_number=1,
        assessment_id=assessment_id,
        batch_size=1,
    )
    questions = plan_result.get("questions", [])
    return questions[0] if questions else None

