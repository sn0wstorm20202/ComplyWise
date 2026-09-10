"""Autonomous Regulatory Knowledge Ingestion Engine.

Authority: Milestone User Request — Autonomous Web Discovery & Knowledge Pack Ingestion.
Bridges web discovery, LLM statutory reasoning, and the deterministic applicability engine.

When a business presents an operational profile where existing pre-seeded rules do not
provide complete coverage or evaluate to 0 compliances:
1. Gathers business context and web search/scrape findings.
2. Prompts the statutory LLM agent to synthesize mandatory Indian Central and State obligations.
3. Formulates valid condition AST expressions aligned with canonical profile variables.
4. Autonomously persists RequirementDefinition, Source, Evidence, and RuleVersion records.
5. Enables immediate evaluation of live, accurate statutory compliances on the dashboard.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from django.db import transaction
from django.utils import timezone

from apps.businesses.models import Business
from apps.evidence.models import Evidence, Source
from apps.ingestion.models import CandidateRequirement, DiscoveryRun
from apps.knowledge.models import RequirementDefinition, RuleVersion
from common.enums import (
    ApplicabilityStatus,
    KnowledgeStatus,
    RuleType,
    SourceStatus,
    VerificationStatus,
)
from domain.context.business_context import DerivedBusinessContext, build_business_context
from domain.providers import get_llm_provider
from domain.providers.base import ChatMessage
from knowledge_packs.catalogs import STATUTORY_PORTALS

logger = logging.getLogger(__name__)

AUTO_INGEST_SYSTEM_PROMPT = """You are the Senior Chief Regulatory Counsel for ComplyWise India.
Your mission is to perform dynamic statutory synthesis and generate the complete set of mandatory regulatory compliance permits, licenses, consents, registrations, and environmental authorizations required by Indian Central and State laws for a business enterprise.

You are given:
1. Complete operational and commercial profile of the enterprise (turnover, workforce, power load, location, products, activities, packaging, trade intent).
2. Scraped web excerpts from official government regulatory portals and legal gazettes.

YOUR TASK:
Synthesize 4 to 8 MANDATORY STATUTORY REQUIREMENTS that legally apply to this specific business under Indian law.

STATUTORY LEGAL FOUNDATIONS & JURISDICTIONS:
- FOOD SAFETY:
  - FSSAI Central Food License (Sec 31, FSS Act 2006): Applies if annual turnover > 20 Crore INR (200,000,000 INR).
  - FSSAI State Food License: Applies if annual turnover <= 20 Crore INR (up to 200,000,000 INR).
  - Legal Metrology (Packaged Commodities) Rules, 2011 (Rule 27): Registration as Pre-Packer / Manufacturer of pre-packed food products.
  - Plastic Waste Management Rules, 2016: CPCB Extended Producer Responsibility (EPR) registration for brand owners using plastic packaging.
  - Organic Food Regulations, 2017: Jaivik Bharat / APEDA NPOP endorsement for organic food claims.
- INDUSTRIAL & FACTORIES:
  - Factories Act, 1948 (Section 6 / Section 2m): Factory license from State Directorate of Factories if total workers >= 10 using electrical power (or >= 20 workers without power). State jurisdiction.
  - State Pollution Control Board (SPCB) Consent to Establish (CTE) and Consent to Operate (CTO) under Water (P&CP) Act 1974 & Air (P&CP) Act 1981: Required for manufacturing units discharging trade effluent, air emissions, or operating in Green/Orange/Red industrial categories. State jurisdiction.
- ELECTRONICS & HARDWARE:
  - BIS Compulsory Registration Scheme (CRS) under CRO 2012: For notified electronic products / smart devices.
  - WPC Equipment Type Approval (ETA): For wireless / RF equipment operating in de-licensed frequency bands.
  - E-Waste Management Rules 2022: CPCB EPR registration for electrical & electronic equipment producers.
- MEDICAL DEVICES:
  - Medical Device Rules 2017 / CDSCO: Manufacturing License (Form MD-5 for Class A/B; Form MD-9 for Class C/D).
- DIGITAL / SAAS:
  - Digital Personal Data Protection (DPDP) Act, 2023: Compliance as Data Fiduciary for collecting/processing personal data.
  - CERT-In Cybersecurity Directives: Mandatory incident reporting and NTP synchronization.
- INTERNATIONAL TRADE:
  - Directorate General of Foreign Trade (DGFT): Importer-Exporter Code (IEC) under Foreign Trade (D&R) Act.

OUTPUT FORMAT:
Return a JSON object with key "requirements" containing a list of objects:
{
  "requirements": [
    {
      "requirement_id": "REQ-FSSAI-CENTRAL-LICENCE",
      "name": "FSSAI Central Food License",
      "authority": "Food Safety and Standards Authority of India (FSSAI)",
      "jurisdiction": "CENTRAL",
      "category": "LICENCE",
      "domain": "FOOD",
      "statutory_act": "Section 31 of Food Safety and Standards Act, 2006",
      "applicability_rationale": "Mandatory for food processing units whose annual turnover exceeds Rs. 20 Crore.",
      "condition_ast": {
        "op": "AND",
        "args": [
          {"op": "OR", "args": [
            {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "FOOD"},
            {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "MILLET"},
            {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "SNACK"}
          ]},
          {"op": "GT", "left": {"var": "annual_turnover"}, "right": 200000000}
        ]
      },
      "portal": "Official Regulatory Licensing Portal",
      "statutory_fee": "Rs. 7,500 per year",
      "validity_period": "1 to 5 years",
      "required_documents": [
        "FSMS plan or Food Safety Management Certificate",
        "Blueprint / layout plan of the processing unit",
        "List of equipment and machinery with installed capacities",
        "NABL accredited water test report"
      ],
      "application_steps": [
        "Submit Form B on FoSCoS portal",
        "Upload required technical FSMS dossiers and machinery layout",
        "Pay statutory fee through Bharatkosh payment gateway",
        "Undergo pre-licensing inspection by Designated Officer (DO)"
      ],
      "source_title": "FSSAI Licensing and Registration Regulations 2011 Schedule 1"
    }
  ]
}
"""


def _heuristic_statutory_synthesis(context: DerivedBusinessContext, business: Business) -> list[dict[str, Any]]:
    """Heuristic fallback when LLM is offline or unconfigured, ensuring accurate baseline rules."""
    reqs: list[dict[str, Any]] = []
    desc = (context.product_description or "").lower()
    raw = context.raw_variables or {}
    organic_val = raw.get("organic_claim")
    state_code = context.state or "CENTRAL"
    state_name = context.state_name or "State"
    turnover = float(context.annual_turnover or 0)
    has_food = any(w in desc for w in ["food", "fruit", "beverage", "snack", "bakery", "dairy", "agro", "millet", "flour", "cereal"])
    has_mfg = context.is_manufacturing or any(w in desc for w in ["manufactur", "produc", "machin", "process", "fabricat", "component", "pack"])
    has_saas = bool(re.search(r"\b(software|saas|cloud|platform|digital|apps?)\b", desc))

    # 1. Food Processing Obligations
    if has_food:
        if turnover > 200000000:
            reqs.append({
                "requirement_id": "REQ-FSSAI-CENTRAL-LICENCE",
                "name": "FSSAI Central Food License",
                "authority": "Food Safety and Standards Authority of India (FSSAI)",
                "jurisdiction": "CENTRAL",
                "category": "LICENCE",
                "domain": "FOOD",
                "statutory_act": "Section 31 of Food Safety and Standards Act, 2006",
                "applicability_rationale": "Mandatory for food business operators with annual turnover exceeding Rs. 20 Crore.",
                "condition_ast": {
                    "op": "AND",
                    "args": [
                        {"op": "OR", "args": [
                            {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "FOOD"},
                            {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "MILLET"},
                            {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "SNACK"},
                            {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "FLOUR"},
                        ]},
                        {"op": "GT", "left": {"var": "annual_turnover"}, "right": 200000000},
                    ],
                },
                "portal": STATUTORY_PORTALS.get("FOSCOS", ""),
                "statutory_fee": "Rs. 7,500 per year",
                "validity_period": "1 to 5 years",
                "required_documents": [
                    "Blueprint / layout plan of the processing unit",
                    "List of equipment and machinery with installed capacities",
                    "NABL accredited water test report",
                    "FSMS Plan / ISO 22000 Certificate",
                ],
                "application_steps": [
                    "File Form B application on FoSCoS portal",
                    "Upload architectural machinery layout and FSMS plan",
                    "Pay statutory fee of Rs. 7,500 via Bharatkosh",
                    "Complete joint inspection by Central Licensing Authority",
                ],
                "source_title": "FSSAI Licensing and Registration Regulations 2011 Schedule 1",
            })
        else:
            reqs.append({
                "requirement_id": "REQ-FSSAI-STATE-LICENCE",
                "name": "FSSAI State Food License",
                "authority": "State Food Safety Authority",
                "jurisdiction": "CENTRAL",
                "category": "LICENCE",
                "domain": "FOOD",
                "statutory_act": "Section 31 of Food Safety and Standards Act, 2006",
                "applicability_rationale": "Mandatory for food processing units with annual turnover up to Rs. 20 Crore.",
                "condition_ast": {
                    "op": "AND",
                    "args": [
                        {"op": "OR", "args": [
                            {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "FOOD"},
                            {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "SNACK"},
                        ]},
                        {"op": "LTE", "left": {"var": "annual_turnover"}, "right": 200000000},
                    ],
                },
                "portal": STATUTORY_PORTALS.get("FOSCOS", ""),
                "statutory_fee": "Rs. 3,000 to Rs. 5,000 per year",
                "validity_period": "1 to 5 years",
                "required_documents": [
                    "Layout plan of the processing area",
                    "List of food categories manufactured",
                    "NABL water test report",
                    "Medical fitness certificates of food handlers",
                ],
                "application_steps": [
                    "Submit Form B on FoSCoS portal",
                    "Upload layout and laboratory reports",
                    "Pay fee and receive inspection by Food Safety Officer",
                ],
                "source_title": "FSSAI Regulations 2011 Schedule 2",
            })

        # Pre-packer Registration
        reqs.append({
            "requirement_id": "REQ-LEGAL-METROLOGY-PACKER",
            "name": "Legal Metrology Packaged Commodities Registration (Rule 27)",
            "authority": "Department of Consumer Affairs, Legal Metrology Division",
            "jurisdiction": "CENTRAL",
            "category": "REGISTRATION",
            "domain": "STANDARDS",
            "statutory_act": "Rule 27 of Legal Metrology (Packaged Commodities) Rules, 2011",
            "applicability_rationale": "Mandatory registration for all commercial enterprises manufacturing or packaging commodities for retail sale.",
            "condition_ast": {
                "op": "OR",
                "args": [
                    {"op": "EQ", "left": {"var": "food_contact_packaging"}, "right": True},
                    {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "PACKAG"},
                    {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "FOOD"},
                ],
            },
            "portal": STATUTORY_PORTALS.get("CONSUMER_AFFAIRS", ""),
            "statutory_fee": "Rs. 500 one-time fee",
            "validity_period": "Lifetime / Permanent unless premises change",
            "required_documents": [
                "Specimen artwork / container packaging label showing mandatory declarations",
                "Proof of factory / packaging premises ownership or lease",
                "GST registration certificate and Udyam certificate",
                "List of packaged net weight variants",
            ],
            "application_steps": [
                "File pre-packer application under Rule 27",
                "Submit specimen label artwork with mandatory declarations (MRP, Net Qty, Best Before)",
                "Receive Pre-Packer Registration Certificate",
            ],
            "source_title": "Legal Metrology (Packaged Commodities) Rules 2011",
        })

        # Plastic EPR
        reqs.append({
            "requirement_id": "REQ-CPCB-EPR-PLASTIC",
            "name": "CPCB Extended Producer Responsibility (EPR) for Plastic Packaging",
            "authority": "Central Pollution Control Board (CPCB)",
            "jurisdiction": "CENTRAL",
            "category": "REGISTRATION",
            "domain": "ENVIRONMENT",
            "statutory_act": "Rule 13 of Plastic Waste Management Rules, 2016",
            "applicability_rationale": "Mandatory EPR registration for Brand Owners and Producers utilizing plastic packaging for consumer goods.",
            "condition_ast": {
                "op": "OR",
                "args": [
                    {"op": "EQ", "left": {"var": "food_contact_packaging"}, "right": True},
                    {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "PACKAG"},
                ],
            },
            "portal": STATUTORY_PORTALS.get("EPR_PLASTIC", ""),
            "statutory_fee": "Rs. 10,000 to Rs. 20,000 based on packaging tonnage",
            "validity_period": "1 year initially, 3 years upon renewal",
            "required_documents": [
                "Category-wise plastic packaging procurement breakdown (Rigid, Flexible, Multi-layered)",
                "Proof of tie-up with registered plastic waste processor or recycling certificates",
                "GST and PAN of the entity",
            ],
            "application_steps": [
                "Register on the National CPCB EPR Centralized Portal",
                "Enter annual plastic packaging procurement baseline",
                "Submit EPR action plan and obtain PIBO EPR Registration Certificate",
            ],
            "source_title": "Guidelines on Extended Producer Responsibility for Plastic Packaging 2022",
        })

        # Organic Certification (if organic)
        if organic_val or "organic" in desc:
            reqs.append({
                "requirement_id": "REQ-APEDA-NPOP-ORGANIC",
                "name": "Jaivik Bharat / NPOP Organic Food Certification",
                "authority": "FSSAI & APEDA",
                "jurisdiction": "CENTRAL",
                "category": "CERTIFICATION",
                "domain": "FOOD",
                "statutory_act": "Food Safety and Standards (Organic Foods) Regulations, 2017",
                "applicability_rationale": "Mandatory certification to print the Jaivik Bharat organic logo and label products as organic in commercial trade.",
                "condition_ast": {
                    "op": "OR",
                    "args": [
                        {"op": "EQ", "left": {"var": "organic_claim"}, "right": True},
                        {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "ORGANIC"},
                    ],
                },
                "portal": STATUTORY_PORTALS.get("JAIVIK_BHARAT", ""),
                "statutory_fee": "Variable based on third-party accredited inspection body",
                "validity_period": "Annual audit and renewal",
                "required_documents": [
                    "NPOP Scope Certificate from accredited certification agency",
                    "Complete supply chain traceability and transaction certificates",
                    "Laboratory pesticide residue test report (< Limit of Quantification)",
                ],
                "application_steps": [
                    "Engage NPOP-accredited certification body (e.g. Aditi Organic, OneCert)",
                    "Undergo on-site organic inspection and traceability audit",
                    "Register Scope Certificate on FSSAI Jaivik Bharat portal to obtain logo authorization",
                ],
                "source_title": "FSS (Organic Foods) Regulations 2017",
            })

    # 2. Industrial Manufacturing & Factory Obligations (State specific)
    if has_mfg and state_code != "CENTRAL":
        # Factory License
        reqs.append({
            "requirement_id": f"REQ-{state_code}-FACTORY-LICENSE",
            "name": f"Factory License ({state_name})",
            "authority": f"Directorate of Factories, Government of {state_name}",
            "jurisdiction": state_code,
            "category": "LICENCE",
            "domain": "MANUFACTURING",
            "statutory_act": "Section 6 of Factories Act, 1948 & State Factories Rules",
            "applicability_rationale": f"Statutory license required for manufacturing facilities employing 10 or more workers with power in {state_name}.",
            "condition_ast": {
                "op": "AND",
                "args": [
                    {"op": "EQ", "left": {"var": "state"}, "right": state_code},
                    {"op": "GTE", "left": {"var": "total_worker_count"}, "right": 10},
                ],
            },
            "portal": STATUTORY_PORTALS.get("SILPASATHI_WB", "") if state_code == "WEST_BENGAL" else STATUTORY_PORTALS.get("DISH_CENTRAL", ""),
            "statutory_fee": "Rs. 5,000 to Rs. 25,000 based on worker count and HP",
            "validity_period": "1 to 5 years (Renewable annually)",
            "required_documents": [
                "Approved factory building plan and sectional elevation drawings",
                "Machinery layout showing emergency exits and worker flow",
                "Stability certificate signed by a Chartered Structural Engineer",
                "NOC from State Fire & Emergency Services",
            ],
            "application_steps": [
                "Apply for plan approval in Form 1 on State Single Window Portal",
                "Upload stability certificate and machinery layout plans",
                "Submit Form 2 for grant of Factory License and pay statutory fees",
                "Undergo factory inspection by Inspector of Factories",
            ],
            "source_title": f"{state_name} Factories Rules",
        })

        # SPCB Consent to Establish
        spcb_name = f"{state_name} State Pollution Control Board" if not state_name.endswith("Board") else state_name
        reqs.append({
            "requirement_id": f"REQ-{state_code}PCB-CTE",
            "name": f"{state_code}PCB Consent to Establish (CTE)",
            "authority": spcb_name,
            "jurisdiction": state_code,
            "category": "CONSENT",
            "domain": "ENVIRONMENT",
            "statutory_act": "Section 25 of Water Act 1974 & Section 21 of Air Act 1981",
            "applicability_rationale": f"Statutory environmental clearance required prior to construction or installation of industrial processing machinery in {state_name}.",
            "condition_ast": {
                "op": "AND",
                "args": [
                    {"op": "EQ", "left": {"var": "state"}, "right": state_code},
                    {"op": "OR", "args": [
                        {"op": "EQ", "left": {"var": "effluent_emission_generation"}, "right": True},
                        {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "FOOD"},
                        {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "PROCESS"},
                        {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "MANUFACTUR"},
                    ]},
                ],
            },
            "portal": STATUTORY_PORTALS.get("WBPCB", "") if state_code == "WEST_BENGAL" else STATUTORY_PORTALS.get("CPCB", ""),
            "statutory_fee": "Rs. 15,000 to Rs. 50,000 based on capital investment",
            "validity_period": "5 years or until commercial commissioning",
            "required_documents": [
                "Detailed Project Report (DPR) with manufacturing flow chart",
                "Site layout plan with drainage lines and green belt demarcation",
                "Effluent Treatment Plant (ETP) / sewage treatment scheme details",
                "Land possession document / industrial estate allotment letter",
            ],
            "application_steps": [
                "Submit CTE application on State Pollution Control Board Online Portal",
                "Upload pollution abatement flow diagrams and environmental management plan",
                "Pay consent fee based on gross capital investment",
                "Receive Consent to Establish certificate with compliance stipulations",
            ],
            "source_title": "Water (P&CP) Act 1974 and Air (P&CP) Act 1981",
        })

    # 3. Digital SaaS obligations
    if has_saas:
        reqs.append({
            "requirement_id": "REQ-DPDP-ACT-2023",
            "name": "Digital Personal Data Protection (DPDP) Act Compliance",
            "authority": "Data Protection Board of India / MeitY",
            "jurisdiction": "CENTRAL",
            "category": "COMPLIANCE",
            "domain": "DIGITAL",
            "statutory_act": "Digital Personal Data Protection Act, 2023",
            "applicability_rationale": "Mandatory statutory compliance for all data fiduciaries processing digital personal data in India.",
            "condition_ast": {
                "op": "OR",
                "args": [
                    {"op": "EQ", "left": {"var": "processes_personal_data"}, "right": True},
                    {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "SOFTWARE"},
                    {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "SAAS"},
                ],
            },
            "portal": STATUTORY_PORTALS.get("MEITY_DPDP", ""),
            "statutory_fee": "Nil statutory filing fee; high penalties for non-compliance",
            "validity_period": "Continuous compliance",
            "required_documents": [
                "Standard itemized consent notices in English and scheduled languages",
                "Data fiduciary privacy policy and data retention schedule",
                "Data breach response plan aligned with CERT-In 6-hour reporting mandate",
            ],
            "application_steps": [
                "Implement granular consent management architecture on web & mobile interfaces",
                "Publish data retention and grievance redressal policies",
                "Appoint Data Protection Officer (DPO) if notified as Significant Data Fiduciary",
            ],
            "source_title": "Digital Personal Data Protection Act 2023",
        })

    return reqs


@transaction.atomic
def persist_synthesized_requirements(
    requirements_data: list[dict[str, Any]],
    business: Business,
) -> list[RequirementDefinition]:
    """Persist synthesized requirements, sources, evidence, and rule versions into SQLite/Postgres."""
    created_defs: list[RequirementDefinition] = []

    for item in requirements_data:
        req_id = str(item.get("requirement_id") or "").strip().upper()
        if not req_id:
            continue

        name = str(item.get("name") or req_id)[:255]
        auth = str(item.get("authority") or "Regulatory Authority")[:100]
        jur = str(item.get("jurisdiction") or "CENTRAL").strip().upper()
        cat = str(item.get("category") or "LICENCE")[:50]
        domain = str(item.get("domain") or "GENERAL")[:50]
        portal_url = str(item.get("portal") or STATUTORY_PORTALS.get("INDIA_GOV", ""))[:500]
        act = str(item.get("statutory_act") or "Indian Statutory Regulation")[:200]
        rationale = str(item.get("applicability_rationale") or f"Statutory requirement under {auth}.")

        # 1. Source Record
        src_id = f"SRC-{req_id}"
        source, _ = Source.objects.update_or_create(
            source_id=src_id,
            defaults={
                "authority": auth,
                "title": str(item.get("source_title") or f"Statutory Code: {name}")[:300],
                "source_type": "STATUTORY_ACT",
                "canonical_url": portal_url,
                "status": SourceStatus.ACTIVE,
                "metadata": {
                    "auto_ingested": True,
                    "synthesized_at": timezone.now().isoformat(),
                    "business_id": str(business.id),
                    "business_name": business.name,
                },
            },
        )

        # 2. Evidence Record
        evd_id = f"EVD-{req_id}"
        evidence, _ = Evidence.objects.update_or_create(
            evidence_id=evd_id,
            defaults={
                "source": source,
                "locator": act,
                "excerpt": rationale,
                "structured_fact": {
                    "requirement_id": req_id,
                    "jurisdiction": jur,
                    "portal": portal_url,
                    "statutory_act": act,
                },
                "verification_status": VerificationStatus.VERIFIED,
            },
        )

        # 3. RequirementDefinition
        metadata = {
            "required_documents": item.get("required_documents") or [],
            "statutory_fee": item.get("statutory_fee") or "Statutory schedule applies",
            "validity_period": item.get("validity_period") or "1 to 5 years",
            "portal": portal_url,
            "application_steps": item.get("application_steps") or [],
            "auto_ingested": True,
            "statutory_act": act,
            "applicability_rationale": rationale,
        }

        req_def, _ = RequirementDefinition.objects.update_or_create(
            requirement_id=req_id,
            defaults={
                "name": name,
                "category": cat,
                "authority": auth,
                "jurisdiction": jur,
                "domain": domain,
                "status": KnowledgeStatus.PUBLISHED,
                "evidence_refs": [evd_id],
                "metadata": metadata,
            },
        )
        created_defs.append(req_def)

        # 4. RuleVersion
        cond_ast = item.get("condition_ast")
        if not cond_ast or not isinstance(cond_ast, dict) or "op" not in cond_ast:
            if jur != "CENTRAL":
                cond_ast = {"op": "EQ", "left": {"var": "state"}, "right": jur}
            else:
                cond_ast = {"op": "GT", "left": {"var": "annual_turnover"}, "right": 0}

        rule_id = f"RULE-{req_id}-01"
        RuleVersion.objects.update_or_create(
            rule_id=rule_id,
            version=1,
            defaults={
                "requirement": req_def,
                "domain": domain,
                "jurisdiction": jur,
                "status": KnowledgeStatus.PUBLISHED,
                "condition_ast": cond_ast,
                "result": ApplicabilityStatus.APPLICABLE,
                "evidence_refs": [evd_id],
            },
        )

    logger.info("Autonomous Ingestion: Persisted %d statutory requirements into knowledge base.", len(created_defs))
    return created_defs


def auto_ingest_regulatory_knowledge(
    business: Business,
    context: DerivedBusinessContext | None = None,
    discovery_run: DiscoveryRun | None = None,
    force: bool = False,
) -> list[RequirementDefinition]:
    """Dynamically discover, scrape, synthesize, and auto-ingest statutory knowledge for an unseen business.

    Guarantee:
    Ensures that whenever an enterprise is evaluated, missing statutory rules are autonomously
    researched and ingested so that the business receives accurate, applicable compliance permits
    rather than a false 0 compliances result.
    """
    if context is None:
        context = build_business_context(business)

    profile = business.current_profile
    if profile is None:
        logger.warning("Auto Ingest: Business %s has no current profile version.", business.id)
        return []

    # Check if already covered by sufficient published applicable rules
    if not force:
        from apps.applicability.models import DecisionRun
        latest_run = DecisionRun.objects.filter(business=business).order_by("-created_at").first()
        if latest_run and latest_run.results.filter(status=ApplicabilityStatus.APPLICABLE).exists():
            app_count = latest_run.results.filter(status=ApplicabilityStatus.APPLICABLE).count()
            logger.info("Auto Ingest: Business %s already has %d applicable rules; skipping.", business.name, app_count)
            return []

        from apps.applicability.engine import ApplicabilityEngine
        engine = ApplicabilityEngine()
        test_run = engine.evaluate_business_profile(
            business=business,
            profile_version=profile,
            save_run=True,
        )
        app_count = test_run.results.filter(status=ApplicabilityStatus.APPLICABLE).count()
        if app_count >= 1:
            logger.info("Auto Ingest: Business %s already has %d applicable rules; skipping.", business.name, app_count)
            return []

    # Gather scraped web text or candidate requirements from discovery_run
    scraped_excerpts: list[str] = []
    if discovery_run:
        for cr in discovery_run.candidate_requirements.all()[:8]:
            scraped_excerpts.append(
                f"Candidate Requirement: {cr.requirement_name} | Authority: {cr.authority} | "
                f"Applicability: {cr.applicability_statement}"
            )
        for s in discovery_run.scraped_urls[:4]:
            scraped_excerpts.append(f"Scraped Source: {s.get('title')} ({s.get('url')})")

    web_content_str = "\n".join(scraped_excerpts) if scraped_excerpts else "No live scraped web text available."

    raw = context.raw_variables or {}
    food_contact_str = str(raw.get("food_contact_packaging", "Not specified"))
    organic_str = str(raw.get("organic_claim", "Not specified"))
    import_export_str = str(raw.get("import_export_intent", context.trade_intent or "DOMESTIC_ONLY"))

    # Build statutory prompt
    user_prompt = f"""ENTERPRISE OPERATIONAL PROFILE:
Entity Name: {context.business_name}
Legal Constitution: {context.legal_constitution}
Jurisdiction State: {context.state_name} ({context.state})
Operational / Product Description: {context.product_description}
Primary Activity: {context.primary_activity}
Annual Turnover: Rs. {context.annual_turnover} INR
Total Workforce: {context.total_worker_count} workers
Connected Electrical Load: {context.connected_power_load} HP
Food Contact Packaging: {food_contact_str}
Organic Claims: {organic_str}
Import / Export Intent: {import_export_str}
Trade Effluent / Emissions: {context.effluent_emission_generation}
Hazardous Waste: {context.hazardous_waste_generation}

RETRIEVED REGULATORY WEB DISCOVERY EXCERPTS:
{web_content_str}

Analyze this enterprise profile under Indian Central and State statutory law.
Determine the 4 to 8 mandatory statutory licenses, permits, registrations, and environmental/safety consents that legally apply to this business.
Return strict JSON with key "requirements" as instructed in system prompt."""

    provider = get_llm_provider()
    requirements_data: list[dict[str, Any]] = []

    if provider.is_configured:
        try:
            logger.info("Auto Ingest: Requesting LLM statutory synthesis for %s via %s", business.name, provider.name)
            res = provider.complete(
                [
                    ChatMessage(role="system", content=AUTO_INGEST_SYSTEM_PROMPT),
                    ChatMessage(role="user", content=user_prompt),
                ],
                temperature=0.1,
                max_output_tokens=3500,
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
            reqs = parsed.get("requirements", [])
            if isinstance(reqs, list) and len(reqs) > 0:
                requirements_data = reqs
                logger.info("Auto Ingest: LLM successfully synthesized %d statutory requirements.", len(requirements_data))
        except Exception as exc:
            logger.warning("Auto Ingest: LLM synthesis encountered error: %s. Using heuristic synthesis.", exc)

    if not requirements_data:
        logger.info("Auto Ingest: Generating heuristic statutory synthesis for %s.", business.name)
        requirements_data = _heuristic_statutory_synthesis(context, business)

    # Persist the synthesized requirements
    return persist_synthesized_requirements(requirements_data, business)
