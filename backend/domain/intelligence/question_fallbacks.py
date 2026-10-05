"""Historical emergency intake generators retained for existing contracts.

The active QuestionnaireEngine delegates to apps.onboarding.planner instead.
These generators do not publish rules or call an external provider.
"""

from __future__ import annotations

import re
from typing import Any

from domain.context.activity_text import strip_negations

from .business_understanding import BusinessUnderstandingResult
from .orchestration import OrchestrationContext
from .question_types import SmartQuestion
from .question_validation import sanitize_question_reason


def generate_emergency_questions(
    context: OrchestrationContext,
    understanding: BusinessUnderstandingResult | None = None,
) -> list[SmartQuestion]:
    """Deterministic emergency fallback generating 5 to 6 valid questions tailored to business sector."""

    desc = (
        context.raw_business_description or context.product or context.business_name or ""
    ).lower()

    cleaned_desc = strip_negations(desc)

    is_software = bool(
        re.search(
            r"(software|saas|it|digital|platform|app|cloud|web|ai|tech|film pre-visualization|storyloom)",
            cleaned_desc,
        )
    )

    is_food = (not is_software) and bool(
        re.search(
            r"(food|kitchen|cloud kitchen|restaurant|catering|bakery|beverage|fruit juice|edible|meal|snack|dairy|millet|flour|grain|agro)",
            cleaned_desc,
        )
    )

    is_battery = (
        (not is_software)
        and (not is_food)
        and bool(
            re.search(r"(battery|bms|lithium|energy storage|cell manufacturing|bess)", cleaned_desc)
        )
    )

    is_electronics = (
        (not is_software)
        and (not is_food)
        and (not is_battery)
        and bool(re.search(r"(electronic|charg|circuit|pcb|importer|hardware)", cleaned_desc))
    )

    is_logistics = (
        (not is_software)
        and (not is_food)
        and (not is_battery)
        and (not is_electronics)
        and bool(
            re.search(
                r"(logistics|warehouse|warehousing|cold storage|freight|transport|supply chain|cargo|courier|fleet|depot|distribution|trucking)",
                cleaned_desc,
            )
        )
    )

    workers_known = bool(context.operational_facts.get("total_worker_count"))

    questions_data: list[dict[str, Any]] = []

    if is_software:
        # Software / SaaS / Digital Platform / Media: 5 targeted questions

        questions_data = [
            {
                "question_id": "Q01",
                "question": (
                    "What primary cloud and data hosting infrastructure does your software platform rely on?"
                    if workers_known
                    else "What is the total size of your workforce (full-time employees and contractors)?"
                ),
                "category": "Cloud & Infrastructure" if workers_known else "Workforce & Labor",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": (
                    [
                        {
                            "value": "PUBLIC_CLOUD_INDIA",
                            "label": "Public cloud with data centers located in India",
                        },
                        {
                            "value": "CROSS_BORDER_CLOUD",
                            "label": "Global public cloud with cross-border storage",
                        },
                        {
                            "value": "HYBRID_PRIVATE_CLOUD",
                            "label": "Hybrid on-premises and private infrastructure",
                        },
                    ]
                    if workers_known
                    else [
                        {"value": "BELOW_10", "label": "1 to 9 employees"},
                        {"value": "10_TO_19", "label": "10 to 19 employees"},
                        {"value": "20_TO_49", "label": "20 to 49 employees"},
                        {"value": "50_PLUS", "label": "50 or more employees"},
                    ]
                ),
                "unit": None,
                "help_text": (
                    "Data residency and infrastructure location dictate obligations under DPDP 2023 and CERT-In directions."
                    if workers_known
                    else "Workforce size determines applicability of State Shops and Commercial Establishments Act, PF, and ESI."
                ),
                "reason": (
                    "This helps determine which cloud data residency norms and CERT-In cybersecurity directives apply to your systems."
                    if workers_known
                    else "This helps determine which state employment frameworks and social security thresholds apply to your team."
                ),
                "order": 1,
            },
            {
                "question_id": "Q02",
                "question": "How does your business sell or deliver its software products and services?",
                "category": "Foreign Trade & GST",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {"value": "DOMESTIC_ONLY", "label": "Exclusively to clients within India"},
                    {
                        "value": "EXPORT_ONLINE_SERVICES",
                        "label": "Online export to international clients (cross-border service delivery)",
                    },
                    {
                        "value": "BOTH_DOMESTIC_AND_EXPORT",
                        "label": "Both domestic Indian clients and international exports",
                    },
                ],
                "unit": None,
                "help_text": "Software service exports delivered electronically do not require physical goods IEC; GST LUT under Section 16 of IGST Act applies.",
                "reason": "This helps determine whether export GST Letter of Undertaking (LUT) and SOFTEX reporting apply to your revenue.",
                "order": 2,
            },
            {
                "question_id": "Q03",
                "question": "Does your digital platform collect, store, or process personal user data or payment information?",
                "category": "Data Privacy & DPDP",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {
                        "value": "YES_USER_DATA",
                        "label": "Yes, collects customer/user personal identifiable information (PII)",
                    },
                    {
                        "value": "NO_PERSONAL_DATA",
                        "label": "No personal data; enterprise B2B non-personal data only",
                    },
                ],
                "unit": None,
                "help_text": "Processing personal data activates obligations under the Digital Personal Data Protection (DPDP) Act 2023.",
                "reason": "This helps determine which data protection guidelines, consent architectures, and privacy frameworks apply to your platform.",
                "order": 3,
            },
            {
                "question_id": "Q04",
                "question": "What is the physical operational arrangement of your business premises?",
                "category": "Premises & Establishment",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {"value": "LEASED_OFFICE", "label": "Dedicated leased commercial office"},
                    {"value": "COWORKING", "label": "Co-working space / shared business incubator"},
                    {
                        "value": "REMOTE_VIRTUAL",
                        "label": "Fully remote distributed team with virtual registered office",
                    },
                ],
                "unit": None,
                "help_text": "Premises type dictates registration under the State Shops and Commercial Establishments Act.",
                "reason": "This helps determine which local municipal trade and commercial establishment registration rules apply.",
                "order": 4,
            },
            {
                "question_id": "Q05",
                "question": "What is the expected or current annual gross turnover of the company?",
                "category": "Financial & GST",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {"value": "BELOW_20_LAKHS", "label": "Below ₹20 Lakhs"},
                    {"value": "20_LAKHS_TO_1_5_CRORE", "label": "₹20 Lakhs to ₹1.5 Crore"},
                    {"value": "ABOVE_1_5_CRORE", "label": "Above ₹1.5 Crore"},
                ],
                "unit": None,
                "help_text": "Turnover determines GST registration requirement (threshold of ₹20 Lakhs for services) and MSME classification.",
                "reason": "This helps determine statutory GST registration schedules and MSME development benefits.",
                "order": 5,
            },
        ]

    elif is_food:
        # Food / Cloud Kitchen / Restaurant: 5 targeted questions

        questions_data = [
            {
                "question_id": "Q01",
                "question": "What is the current or projected annual gross turnover of your food operations?",
                "category": "Food Safety & FSSAI",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {
                        "value": "UP_TO_12_LAKHS",
                        "label": "Up to ₹12 Lakhs (Petty Food Business Operator)",
                    },
                    {
                        "value": "12_LAKHS_TO_20_CRORE",
                        "label": "₹12 Lakhs to ₹20 Crore (State Food License)",
                    },
                    {
                        "value": "ABOVE_20_CRORE",
                        "label": "Above ₹20 Crore or Export/Import (Central Food License)",
                    },
                ],
                "unit": None,
                "help_text": "FSS Act 2006 Section 31 specifies licensing tier based directly on annual turnover.",
                "reason": "This helps determine which FoSCoS food license or basic registration tier is relevant to your operations.",
                "order": 1,
            },
            {
                "question_id": "Q02",
                "question": "What is the operating model of your culinary facility?",
                "category": "Operations",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {
                        "value": "CLOUD_KITCHEN_DELIVERY",
                        "label": "Cloud Kitchen (Delivery-only via platforms and direct)",
                    },
                    {
                        "value": "TAKEAWAY_AND_DELIVERY",
                        "label": "Takeaway counter and online delivery",
                    },
                    {
                        "value": "DINE_IN_RESTAURANT",
                        "label": "Dine-in restaurant or cafe with customer seating",
                    },
                ],
                "unit": None,
                "help_text": "Cloud kitchens require specific delivery-service FSSAI endorsements and municipal trade licenses.",
                "reason": "This helps determine which municipal health trade guidelines and food delivery standards apply.",
                "order": 2,
            },
            {
                "question_id": "Q03",
                "question": "What is the source of water used for cooking, food preparation, and ice?",
                "category": "Hygiene & Water",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {
                        "value": "TESTED_POTABLE_SUPPLY",
                        "label": "Potable RO/municipal supply tested in NABL lab per IS 10500",
                    },
                    {
                        "value": "MUNICIPAL_UNTESTED",
                        "label": "Municipal piped water pending chemical/bacteriological test report",
                    },
                    {"value": "BOREWELL_SUPPLY", "label": "Private borewell or tanker supply"},
                ],
                "unit": None,
                "help_text": "FSSAI FoSCoS mandates an annual water potability test report under Indian Standard IS 10500.",
                "reason": "This helps determine which water quality documentation and testing schedules apply to your kitchen.",
                "order": 3,
            },
            {
                "question_id": "Q04",
                "question": "How many kitchen staff, chefs, and food handlers work at your premise?",
                "category": "Workforce & Safety",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {"value": "BELOW_10", "label": "1 to 9 kitchen staff"},
                    {"value": "10_TO_19", "label": "10 to 19 staff"},
                    {"value": "20_PLUS", "label": "20 or more staff"},
                ],
                "unit": None,
                "help_text": "Food handlers must hold medical fitness certificates (Form IX) and undergo FoSTaC hygiene training.",
                "reason": "This helps determine food safety training mandates and employee health inspection standards.",
                "order": 4,
            },
            {
                "question_id": "Q05",
                "question": "What is your commercial cooking fuel setup and fire safety status?",
                "category": "Fire & Life Safety",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {
                        "value": "COMMERCIAL_LPG_WITH_NOC",
                        "label": "Commercial piped LPG cylinder bank with Fire NOC",
                    },
                    {
                        "value": "COMMERCIAL_LPG_PENDING",
                        "label": "Commercial LPG cylinders (Fire inspection / NOC in progress)",
                    },
                    {
                        "value": "ALL_ELECTRIC",
                        "label": "100% Electric induction commercial cooking (no gas cylinders)",
                    },
                ],
                "unit": None,
                "help_text": "Commercial kitchens using gas cylinders require fire suppression systems and local Fire NOC.",
                "reason": "This helps determine which life safety, gas pipeline, and fire safety norms apply to your kitchen.",
                "order": 5,
            },
        ]

    elif is_battery or is_electronics:
        # Battery / Electronics / Manufacturing: 6 targeted questions

        questions_data = [
            {
                "question_id": "Q01",
                "question": "What is the total connected electrical power load of your facility?",
                "category": "Facility & Power",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {"value": "BELOW_10_HP", "label": "Below 10 HP"},
                    {"value": "10_TO_50_HP", "label": "10 to 50 HP"},
                    {"value": "50_TO_100_HP", "label": "50 to 100 HP"},
                    {"value": "ABOVE_100_HP", "label": "Above 100 HP"},
                ],
                "unit": None,
                "help_text": "Connected load determines factory safety electrical inspectorate oversight and utility clearances.",
                "reason": "This helps determine which electrical infrastructure and factory safety requirements may be relevant.",
                "order": 1,
            },
            {
                "question_id": "Q02",
                "question": "How many total employees and shopfloor laborers work at your enterprise?",
                "category": "Workforce & Labor",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {"value": "BELOW_10", "label": "1 to 9 workers"},
                    {"value": "10_TO_19", "label": "10 to 19 workers"},
                    {"value": "20_TO_49", "label": "20 to 49 workers"},
                    {"value": "50_PLUS", "label": "50 or more workers"},
                ],
                "unit": None,
                "help_text": "Factories Act 1948 applies to premises employing 10+ workers with power or 20+ without power.",
                "reason": "This helps determine which workforce scale and factory premises licensing thresholds apply.",
                "order": 2,
            },
            {
                "question_id": "Q03",
                "question": "Does production generate hazardous chemical wastes, spent solvents, or electronic scrap?",
                "category": "Environmental & Waste",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {
                        "value": "NO_HAZARDOUS_WASTE",
                        "label": "Dry assembly only; no hazardous waste generated",
                    },
                    {
                        "value": "SPENT_BATTERIES_OR_SOLVENTS",
                        "label": "Generates scrap cells, electronic waste, or solvent residues",
                    },
                    {
                        "value": "PROCESS_EFFLUENT_ETP",
                        "label": "Wet process generating liquid effluent requiring treatment",
                    },
                ],
                "unit": None,
                "help_text": "Hazardous waste triggers SPCB authorization and manifest tracking under Hazardous Waste Rules.",
                "reason": "This helps determine which waste stream management protocols and environmental safeguards apply.",
                "order": 3,
            },
            {
                "question_id": "Q04",
                "question": "Where is the physical production premises situated?",
                "category": "Siting & Land",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {
                        "value": "APPROVED_ESTATE",
                        "label": "Approved Industrial Area / Estate (e.g. MIDC / GIDC / RIICO)",
                    },
                    {"value": "SPECIAL_ECONOMIC_ZONE", "label": "Special Economic Zone (SEZ)"},
                    {
                        "value": "CONVERTED_COMMERCIAL",
                        "label": "Commercial Converted Land / Municipal Zone",
                    },
                    {"value": "NON_CONFORMING", "label": "Non-conforming Industrial Area"},
                ],
                "unit": None,
                "help_text": "Siting determines ease of obtaining State Pollution Control Board environmental consent (CTE/CTO).",
                "reason": "This helps determine which industrial estate siting guidelines and municipal norms apply.",
                "order": 4,
            },
            {
                "question_id": "Q05",
                "question": "What is the certification status of your products under Bureau of Indian Standards (BIS)?",
                "category": "Technical Standards",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {
                        "value": "BIS_CERTIFIED",
                        "label": "Certified under applicable BIS standard (e.g. IS 17017 / IS 16046)",
                    },
                    {
                        "value": "IN_PROGRESS_TESTING",
                        "label": "Prototypes undergoing NABL / ARAI accredited laboratory testing",
                    },
                    {
                        "value": "NOT_YET_TESTED",
                        "label": "Testing not yet commenced; standards to be determined",
                    },
                ],
                "unit": None,
                "help_text": "Ministry Quality Control Orders (QCO) mandate BIS certification prior to commercial sale.",
                "reason": "This helps determine which product safety standards and technical certification frameworks apply.",
                "order": 5,
            },
            {
                "question_id": "Q06",
                "question": "What is the cross-border trade scope of your components and finished products?",
                "category": "Foreign Trade",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {"value": "DOMESTIC_ONLY", "label": "Domestic operations only within India"},
                    {
                        "value": "IMPORT_COMPONENTS",
                        "label": "Importing components or raw materials from abroad",
                    },
                    {
                        "value": "EXPORT_FINISHED",
                        "label": "Exporting finished goods to international markets",
                    },
                    {
                        "value": "IMPORT_AND_EXPORT",
                        "label": "Both importing materials and exporting finished goods",
                    },
                ],
                "unit": None,
                "help_text": "Physical cross-border movement of goods requires DGFT Import Export Code (IEC) and customs clearance.",
                "reason": "This helps determine which customs procedures and import/export authorizations apply.",
                "order": 6,
            },
        ]

    elif is_logistics:
        # Logistics / Warehousing / Cold Storage / Transport: 5 targeted questions without asking legal applicability

        questions_data = [
            {
                "question_id": "Q01",
                "question": "Does your logistics facility operate temperature-controlled storage (refrigerated, cold chain, or deep freeze)?",
                "category": "Cold Chain & Facility",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {"value": "AMBIENT_ONLY", "label": "Ambient / standard dry storage only"},
                    {
                        "value": "COLD_CHAIN_PERISHABLE",
                        "label": "Refrigerated / cold storage for perishable goods",
                    },
                    {
                        "value": "DEEP_FREEZE_MULTI_TEMP",
                        "label": "Multi-temperature deep freeze (-18C or below)",
                    },
                ],
                "unit": None,
                "help_text": "Temperature-controlled facilities activate specific FSSAI cold storage schedules and state power tariff concessions.",
                "reason": "This helps determine which storage safety guidelines and cold-chain infrastructure standards apply to your facility.",
                "order": 1,
            },
            {
                "question_id": "Q02",
                "question": "What primary categories of goods or commodities are handled, received, or stored in your facility?",
                "category": "Commodity Operations",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {
                        "value": "FOOD_AGRICULTURE",
                        "label": "Food, agricultural produce, or packaged edible goods",
                    },
                    {
                        "value": "PHARMACEUTICALS",
                        "label": "Pharmaceutical, healthcare, or medical supplies",
                    },
                    {
                        "value": "HAZARDOUS_CHEMICALS",
                        "label": "Chemicals, paints, batteries, or hazardous substances",
                    },
                    {
                        "value": "GENERAL_DRY_CARGO",
                        "label": "General dry merchandise, apparel, or electronics",
                    },
                ],
                "unit": None,
                "help_text": "Commodity category determines statutory warehousing endorsements under Food Safety or Drugs & Cosmetics frameworks.",
                "reason": "This helps determine which commodity-specific warehousing standards and statutory reporting rules apply.",
                "order": 2,
            },
            {
                "question_id": "Q03",
                "question": "How does your business transport goods between hubs, warehouses, and client locations?",
                "category": "Transport Fleet",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {
                        "value": "OWNED_COMMERCIAL_FLEET",
                        "label": "Fleet of company-owned commercial transport vehicles",
                    },
                    {
                        "value": "CONTRACTED_TRANSPORTERS",
                        "label": "Contracted third-party logistics and carrier partners",
                    },
                    {
                        "value": "BOTH_OWNED_AND_CONTRACTED",
                        "label": "Hybrid model with both owned vehicles and contracted haulers",
                    },
                ],
                "unit": None,
                "help_text": "Operating commercial goods carriages requires Motor Vehicles Act transport permits, pollution certificates, and driver fitness records.",
                "reason": "This helps determine which transport carriage norms and vehicle fitness schedules apply to your fleet.",
                "order": 3,
            },
            {
                "question_id": "Q04",
                "question": "Does your warehouse or logistics center engage contract labour for material handling, loading, or packing?",
                "category": "Workforce & Safety",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {
                        "value": "CONTRACT_LABOUR_20_PLUS",
                        "label": "Yes, 20 or more contract workers through staffing contractors",
                    },
                    {
                        "value": "CONTRACT_LABOUR_UNDER_20",
                        "label": "Yes, fewer than 20 contract workers",
                    },
                    {
                        "value": "DIRECT_EMPLOYEES_ONLY",
                        "label": "All material handlers are direct payroll employees",
                    },
                ],
                "unit": None,
                "help_text": "Engaging 20 or more contract workers requires principal employer registration under the Contract Labour (R&A) Act 1970.",
                "reason": "This helps determine principal employer statutory obligations and contract labour thresholds.",
                "order": 4,
            },
            {
                "question_id": "Q05",
                "question": "What is the physical operational arrangement and fire clearance status of your warehouse premises?",
                "category": "Premises & Fire Safety",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {
                        "value": "INDUSTRIAL_ESTATE_FIRE_NOC",
                        "label": "Approved logistics / industrial park with Fire Department NOC",
                    },
                    {
                        "value": "COMMERCIAL_GODOWN_PENDING",
                        "label": "Commercial godown / storage facility pending fire inspection",
                    },
                    {
                        "value": "STANDALONE_RURAL_STORAGE",
                        "label": "Standalone rural or non-notified storage premise",
                    },
                ],
                "unit": None,
                "help_text": "Commercial warehouses exceeding threshold storage areas require Municipal Fire Safety Clearance and local trade license.",
                "reason": "This helps determine which municipal commercial storage licenses and fire prevention standards apply.",
                "order": 5,
            },
        ]

    else:
        # General Commercial Fallback: 5 questions

        questions_data = [
            {
                "question_id": "Q01",
                "question": "What is the total size of your workforce (employees and contract staff)?",
                "category": "Workforce & Labor",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {"value": "BELOW_10", "label": "1 to 9 employees"},
                    {"value": "10_TO_19", "label": "10 to 19 employees"},
                    {"value": "20_TO_49", "label": "20 to 49 employees"},
                    {"value": "50_PLUS", "label": "50 or more employees"},
                ],
                "unit": None,
                "help_text": "Workforce size dictates applicability of Shops & Establishments, PF, and ESI registration.",
                "reason": "This helps determine which state employment frameworks and social security thresholds apply.",
                "order": 1,
            },
            {
                "question_id": "Q02",
                "question": "What is the nature of your physical operating premises?",
                "category": "Premises & Establishment",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {
                        "value": "COMMERCIAL_OFFICE",
                        "label": "Commercial office / retail shop premise",
                    },
                    {"value": "WAREHOUSE", "label": "Warehouse / storage godown"},
                    {
                        "value": "FACTORY_WORKSHOP",
                        "label": "Manufacturing workshop or fabrication shed",
                    },
                    {"value": "REMOTE_VIRTUAL", "label": "Remote / residential registered address"},
                ],
                "unit": None,
                "help_text": "Premises type dictates local municipal trade license and shop establishment registration.",
                "reason": "This helps determine which municipal trade norms and establishment licenses apply.",
                "order": 2,
            },
            {
                "question_id": "Q03",
                "question": "What is the expected or current annual gross turnover of the business?",
                "category": "Financial & GST",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {
                        "value": "BELOW_20_LAKHS",
                        "label": "Below ₹20 Lakhs (Exempt from mandatory GST)",
                    },
                    {
                        "value": "20_LAKHS_TO_40_LAKHS",
                        "label": "₹20 Lakhs to ₹40 Lakhs (GST threshold for goods)",
                    },
                    {"value": "40_LAKHS_TO_1_5_CRORE", "label": "₹40 Lakhs to ₹1.5 Crore"},
                    {"value": "ABOVE_1_5_CRORE", "label": "Above ₹1.5 Crore"},
                ],
                "unit": None,
                "help_text": "Turnover dictates GST registration schedules and MSME development categorization.",
                "reason": "This helps determine statutory GST registration schedules and taxation compliance.",
                "order": 3,
            },
            {
                "question_id": "Q04",
                "question": "Does your business engage in cross-border trade (importing or exporting)?",
                "category": "Foreign Trade",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {"value": "DOMESTIC_ONLY", "label": "Purely domestic business within India"},
                    {
                        "value": "SERVICES_EXPORT",
                        "label": "Exporting services/software electronically",
                    },
                    {
                        "value": "GOODS_IMPORT_EXPORT",
                        "label": "Importing or exporting physical goods",
                    },
                ],
                "unit": None,
                "help_text": "Cross-border trade activates DGFT, customs, and FEMA regulatory requirements.",
                "reason": "This helps determine whether DGFT IEC, customs filing, or GST LUT applies.",
                "order": 4,
            },
            {
                "question_id": "Q05",
                "question": "Does your business manufacture physical products or provide services?",
                "category": "Operations Scope",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {
                        "value": "SERVICES_DIGITAL",
                        "label": "Services, consulting, or digital products (Non-manufacturing)",
                    },
                    {
                        "value": "TRADING_DISTRIBUTION",
                        "label": "Wholesale, retail, or e-commerce trading of goods",
                    },
                    {
                        "value": "PHYSICAL_MANUFACTURING",
                        "label": "Physical processing, assembly, or manufacturing",
                    },
                ],
                "unit": None,
                "help_text": "Manufacturing operations fall under Factories Act and environmental consents; services do not.",
                "reason": "This helps determine whether factory safety and industrial environmental laws apply.",
                "order": 5,
            },
        ]

    return [
        SmartQuestion(
            question_id=item["question_id"],
            question=item["question"],
            category=item["category"],
            answer_type=item["answer_type"],
            required=item["required"],
            options=item.get("options") or [],
            unit=item.get("unit"),
            help_text=item.get("help_text"),
            reason=item.get("reason", ""),
            order=item["order"],
        )
        for item in questions_data
    ]


def generate_emergency_15_questions(
    context: OrchestrationContext,
    understanding: BusinessUnderstandingResult | None = None,
) -> list[SmartQuestion]:
    """Deterministic emergency fallback generating EXACTLY 15 valid questions tailored to business sector."""

    desc = (
        context.raw_business_description or context.product or context.business_name or ""
    ).lower()

    cleaned_desc = strip_negations(desc)

    is_cement = bool(re.search(r"\b(cement|clinker|portland|concrete|lime)\b", cleaned_desc))

    is_food = (not is_cement) and bool(
        re.search(
            r"\b(food|dairy|beverage|snack|bakery|edible|meal|flour|grain|agro)\b", cleaned_desc
        )
    )

    is_textile = (
        (not is_cement)
        and (not is_food)
        and bool(
            re.search(r"\b(textile|garment|apparel|cloth|dye|spinning|weaving)\b", cleaned_desc)
        )
    )

    is_electronics = (
        (not is_cement)
        and (not is_food)
        and (not is_textile)
        and bool(
            re.search(r"\b(electronic|charg|battery|circuit|pcb|importer|hardware)\b", cleaned_desc)
        )
    )

    is_logistics = (
        (not is_cement)
        and (not is_food)
        and (not is_textile)
        and (not is_electronics)
        and bool(
            re.search(
                r"\b(logistics|warehouse|cold storage|freight|transport|supply chain|cargo|courier|fleet)\b",
                cleaned_desc,
            )
        )
    )

    questions_data: list[dict[str, Any]] = []

    # 1. Connected Load

    questions_data.append(
        {
            "question_id": "Q01",
            "question": "What is the sanctioned or connected electrical load of your facility?",
            "category": "Facility & Power",
            "answer_type": "NUMBER",
            "required": True,
            "options": [],
            "unit": "HP",
            "help_text": "Enter the total connected electrical load sanctioned by the electricity utility.",
            "reason": "This helps determine which electrical infrastructure and factory safety requirements may be relevant to your facility.",
            "order": 1,
        }
    )

    # 2. Total Workforce

    questions_data.append(
        {
            "question_id": "Q02",
            "question": "How many total employees (on-roll staff and laborers) work at your enterprise?",
            "category": "Workforce & Labor",
            "answer_type": "NUMBER",
            "required": True,
            "options": [],
            "unit": "workers",
            "help_text": "Include all administrative, technical, and operational on-roll personnel.",
            "reason": "This helps determine which workforce scale and social security frameworks may be relevant to your enterprise.",
            "order": 2,
        }
    )

    # 3. Contract Labor

    questions_data.append(
        {
            "question_id": "Q03",
            "question": "Do you engage or plan to engage contract workers or third-party outsourced labor?",
            "category": "Workforce & Labor",
            "answer_type": "BOOLEAN",
            "required": True,
            "options": [],
            "unit": None,
            "help_text": "Applies if you hire security, housekeeping, packing, or casual labor through contractors.",
            "reason": "This helps determine which contractor engagement and workforce guidelines may be relevant to your operations.",
            "order": 3,
        }
    )

    # 4. Plant & Machinery Investment

    questions_data.append(
        {
            "question_id": "Q04",
            "question": "What is the total capital investment in plant, machinery, and production equipment?",
            "category": "Capital & MSME",
            "answer_type": "CURRENCY",
            "required": True,
            "options": [],
            "unit": "INR",
            "help_text": "Gross original value of plant and machinery excluding land and buildings.",
            "reason": "This helps determine which MSME investment tier and capital incentive frameworks may be relevant to your enterprise.",
            "order": 4,
        }
    )

    # 5. Annual Turnover

    questions_data.append(
        {
            "question_id": "Q05",
            "question": "What is the expected or current annual gross turnover of the business?",
            "category": "Financial",
            "answer_type": "CURRENCY",
            "required": True,
            "options": [],
            "unit": "INR",
            "help_text": "Total annual revenue from sales of goods or services.",
            "reason": "This helps determine which enterprise revenue thresholds and statutory filing schedules may be relevant to your business.",
            "order": 5,
        }
    )

    # 6. Industrial Estate vs Non-conforming Land

    questions_data.append(
        {
            "question_id": "Q06",
            "question": "Where is the physical manufacturing or business premises situated?",
            "category": "Siting & Land",
            "answer_type": "SINGLE_SELECT",
            "required": True,
            "options": [
                {
                    "value": "APPROVED_ESTATE",
                    "label": "Approved Industrial Area / Estate (e.g. MIDC / GIDC / RIICO)",
                },
                {"value": "SPECIAL_ECONOMIC_ZONE", "label": "Special Economic Zone (SEZ)"},
                {
                    "value": "CONVERTED_COMMERCIAL",
                    "label": "Commercial Converted Land / Municipal Zone",
                },
                {
                    "value": "NON_CONFORMING",
                    "label": "Non-conforming Industrial Area / Agricultural conversion",
                },
            ],
            "unit": None,
            "help_text": "Indicate whether the facility is in a government-notified industrial zone.",
            "reason": "This helps determine which industrial estate siting guidelines and municipal norms may be relevant to your facility.",
            "order": 6,
        }
    )

    # 7. DG Set Captive Power

    questions_data.append(
        {
            "question_id": "Q07",
            "question": "Do you install or operate a diesel generator (DG set) for backup or captive power?",
            "category": "Operations",
            "answer_type": "BOOLEAN",
            "required": True,
            "options": [],
            "unit": None,
            "help_text": "Select yes if you have an acoustic enclosed diesel generator.",
            "reason": "This helps determine which backup power emission guidelines and acoustic standards may be relevant to your facility.",
            "order": 7,
        }
    )

    # 8. Hazardous Waste Generation

    questions_data.append(
        {
            "question_id": "Q08",
            "question": "Does your production generate hazardous wastes such as spent oils, chemical sludge, or electronic scrap?",
            "category": "Environmental",
            "answer_type": "BOOLEAN",
            "required": True,
            "options": [],
            "unit": None,
            "help_text": "Includes used machine oil, solvent residues, e-waste, or chemical containers.",
            "reason": "This helps determine which waste stream management protocols and environmental safeguards may be relevant to your facility.",
            "order": 8,
        }
    )

    # 9. Trade Intent (Imports / Exports)

    questions_data.append(
        {
            "question_id": "Q09",
            "question": "What is the cross-border trade scope of your business operations?",
            "category": "Foreign Trade",
            "answer_type": "SINGLE_SELECT",
            "required": True,
            "options": [
                {"value": "DOMESTIC_ONLY", "label": "Domestic operations only within India"},
                {"value": "EXPORT_ONLY", "label": "Direct exports to overseas markets"},
                {
                    "value": "IMPORT_ONLY",
                    "label": "Importing components / raw materials from abroad",
                },
                {
                    "value": "IMPORT_AND_EXPORT",
                    "label": "Both importing materials and exporting finished goods",
                },
            ],
            "unit": None,
            "help_text": "Specify if cross-border goods movement or foreign currency transactions are planned.",
            "reason": "This helps determine which cross-border trade documentation and customs procedures may be relevant to your operations.",
            "order": 9,
        }
    )

    # Sector-Specific Questions (10, 11, 12, 13)

    if is_cement:
        questions_data.append(
            {
                "question_id": "Q10",
                "question": "What type of clinker grinding or cement manufacturing process is utilized?",
                "category": "Process & Emissions",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {
                        "value": "INTEGRATED_PLANT",
                        "label": "Integrated Cement Plant with captive limestone mining and rotary kiln",
                    },
                    {
                        "value": "STANDALONE_GRINDING",
                        "label": "Standalone Clinker Grinding and Blending Unit",
                    },
                    {
                        "value": "READY_MIX_CONCRETE",
                        "label": "Ready Mix Concrete (RMC) batching plant",
                    },
                ],
                "unit": None,
                "help_text": "Integrated plants involve rotary kilns, whereas grinding units process pre-manufactured clinker.",
                "reason": "This helps determine which clinker processing guidelines and environmental frameworks may be relevant to your facility.",
                "order": 10,
            }
        )

        questions_data.append(
            {
                "question_id": "Q11",
                "question": "What is the planned annual clinker or cement production capacity?",
                "category": "Production Scale",
                "answer_type": "NUMBER",
                "required": True,
                "options": [],
                "unit": "MT/annum",
                "help_text": "Nominal design capacity in metric tonnes per year.",
                "reason": "This helps determine which production capacity and emission monitoring standards may be relevant to your facility.",
                "order": 11,
            }
        )

        questions_data.append(
            {
                "question_id": "Q12",
                "question": "Will your facility operate captive limestone quarrying or procure clinker externally?",
                "category": "Raw Materials",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {
                        "value": "CAPTIVE_MINING",
                        "label": "Captive limestone mining under mineral concession lease",
                    },
                    {
                        "value": "EXTERNAL_PROCUREMENT",
                        "label": "Procured from domestic/imported merchant suppliers",
                    },
                ],
                "unit": None,
                "help_text": "Mining activities involve lease permissions and mineral dispatch guidelines.",
                "reason": "This helps determine which raw material sourcing guidelines and mineral transportation frameworks may be relevant to your facility.",
                "order": 12,
            }
        )

        questions_data.append(
            {
                "question_id": "Q13",
                "question": "Does the cement facility maintain a captive thermal power plant or waste heat recovery system?",
                "category": "Energy & Power",
                "answer_type": "BOOLEAN",
                "required": True,
                "options": [],
                "unit": None,
                "help_text": "Waste Heat Recovery Systems (WHRS) assist energy efficiency and thermal optimization.",
                "reason": "This helps determine which waste heat recovery programs and energy efficiency frameworks may be relevant to your facility.",
                "order": 13,
            }
        )

    elif is_food:
        questions_data.append(
            {
                "question_id": "Q10",
                "question": "What is the daily processing or production capacity of food/beverage products?",
                "category": "Food Safety",
                "answer_type": "NUMBER",
                "required": True,
                "options": [],
                "unit": "MT/day",
                "help_text": "Metric tonnes of finished food items produced per operational day.",
                "reason": "This helps determine which food processing scale and hygiene standards may be relevant to your facility.",
                "order": 10,
            }
        )

        questions_data.append(
            {
                "question_id": "Q11",
                "question": "Does the facility require cold chain storage or chilled transport vehicles?",
                "category": "Cold Chain & Storage",
                "answer_type": "BOOLEAN",
                "required": True,
                "options": [],
                "unit": None,
                "help_text": "Temperature-controlled warehousing or refrigerated delivery vans.",
                "reason": "This helps determine which cold chain standards and temperature monitoring guidelines may be relevant to your facility.",
                "order": 11,
            }
        )

        questions_data.append(
            {
                "question_id": "Q12",
                "question": "What is the primary water source for food processing and washing?",
                "category": "Water & Sanitation",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {
                        "value": "MUNICIPAL_SUPPLY",
                        "label": "Municipal / Industrial Water Corporation Pipe",
                    },
                    {
                        "value": "GROUNDWATER_BOREWELL",
                        "label": "Captive Groundwater Borewell / Tubewell",
                    },
                    {"value": "PRIVATE_TANKER", "label": "Private Water Tanker supply"},
                ],
                "unit": None,
                "help_text": "Specifies utility water sourcing vs private or groundwater extraction.",
                "reason": "This helps determine which process water quality standards and testing schedules may be relevant to your facility.",
                "order": 12,
            }
        )

        questions_data.append(
            {
                "question_id": "Q13",
                "question": "Are food products fortified or categorized as proprietary / novel foods?",
                "category": "Product Standards",
                "answer_type": "BOOLEAN",
                "required": True,
                "options": [],
                "unit": None,
                "help_text": "Proprietary formulations, novel ingredients, or enriched nutrients.",
                "reason": "This helps determine which food product labeling and formulation standards may be relevant to your facility.",
                "order": 13,
            }
        )

    elif is_electronics:
        questions_data.append(
            {
                "question_id": "Q10",
                "question": "Are your electronic products or chargers covered under the BIS Compulsory Registration Scheme (CRS)?",
                "category": "BIS Compliance",
                "answer_type": "BOOLEAN",
                "required": True,
                "options": [],
                "unit": None,
                "help_text": "Power adapters, chargers, laptops, and IT equipment notified under standard product safety codes.",
                "reason": "This helps determine which equipment safety standards and technical certification frameworks may be relevant to your facility.",
                "order": 10,
            }
        )

        questions_data.append(
            {
                "question_id": "Q11",
                "question": "What is the expected monthly production or assembly volume of electronic units?",
                "category": "Production Scale",
                "answer_type": "NUMBER",
                "required": True,
                "options": [],
                "unit": "units/month",
                "help_text": "Total number of finished power adapters, chargers, or assemblies.",
                "reason": "This helps determine which production volume and electronic lifecycle frameworks may be relevant to your facility.",
                "order": 11,
            }
        )

        questions_data.append(
            {
                "question_id": "Q12",
                "question": "Do you import electronic components (such as semiconductor ICs, transformers, or enclosures) from abroad?",
                "category": "Supply Chain",
                "answer_type": "BOOLEAN",
                "required": True,
                "options": [],
                "unit": None,
                "help_text": "Importing components from overseas component suppliers.",
                "reason": "This helps determine which component sourcing procedures and import documentation frameworks may be relevant to your facility.",
                "order": 12,
            }
        )

        questions_data.append(
            {
                "question_id": "Q13",
                "question": "Are surface-mount technology (SMT) pick-and-place lines and wave soldering used in assembly?",
                "category": "Manufacturing Process",
                "answer_type": "BOOLEAN",
                "required": True,
                "options": [],
                "unit": None,
                "help_text": "Soldering processes release fumes that require local exhaust ventilation.",
                "reason": "This helps determine which electronic assembly ventilation and workplace environment standards may be relevant to your facility.",
                "order": 13,
            }
        )

    elif is_textile:
        questions_data.append(
            {
                "question_id": "Q10",
                "question": "Does your textile operation involve wet processing such as dyeing, bleaching, printing, or washing?",
                "category": "Chemical Processing",
                "answer_type": "BOOLEAN",
                "required": True,
                "options": [],
                "unit": None,
                "help_text": "Wet processing operations involving water, colorants, or chemical treatments.",
                "reason": "This helps determine which wet processing guidelines and effluent treatment frameworks may be relevant to your facility.",
                "order": 10,
            }
        )

        questions_data.append(
            {
                "question_id": "Q11",
                "question": "What is the estimated daily water consumption for production processes?",
                "category": "Water & Effluent",
                "answer_type": "NUMBER",
                "required": True,
                "options": [],
                "unit": "kilo-litres/day",
                "help_text": "Combined water usage for processing, steam generation, and cleaning.",
                "reason": "This helps determine which water consumption thresholds and recycling standards may be relevant to your facility.",
                "order": 11,
            }
        )

        questions_data.append(
            {
                "question_id": "Q12",
                "question": "What is the monthly garment or fabric production capacity?",
                "category": "Scale & Capacity",
                "answer_type": "NUMBER",
                "required": True,
                "options": [],
                "unit": "pieces/month",
                "help_text": "Finished garments or meters of woven/knitted fabric produced.",
                "reason": "This helps determine which garment manufacturing volume and export promotion frameworks may be relevant to your facility.",
                "order": 12,
            }
        )

        questions_data.append(
            {
                "question_id": "Q13",
                "question": "Do you operate an industrial boiler or thermic fluid heater for steam generation?",
                "category": "Boiler & Steam",
                "answer_type": "BOOLEAN",
                "required": True,
                "options": [],
                "unit": None,
                "help_text": "Steam boilers used for pressing, curing, or dye vessels.",
                "reason": "This helps determine which thermal equipment standards and steam safety guidelines may be relevant to your facility.",
                "order": 13,
            }
        )

    elif is_logistics:
        questions_data.append(
            {
                "question_id": "Q10",
                "question": "Does your logistics facility operate temperature-controlled storage (refrigerated, cold chain, or deep freeze)?",
                "category": "Cold Chain & Facility",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {"value": "AMBIENT_ONLY", "label": "Ambient / standard dry storage only"},
                    {
                        "value": "COLD_CHAIN_PERISHABLE",
                        "label": "Refrigerated / cold storage for perishable goods",
                    },
                    {
                        "value": "DEEP_FREEZE_MULTI_TEMP",
                        "label": "Multi-temperature deep freeze (-18C or below)",
                    },
                ],
                "unit": None,
                "help_text": "Temperature-controlled facilities activate specific storage safety schedules and power tariff concessions.",
                "reason": "This helps determine which storage safety guidelines and cold-chain infrastructure standards apply to your facility.",
                "order": 10,
            }
        )

        questions_data.append(
            {
                "question_id": "Q11",
                "question": "What primary categories of goods or commodities are handled, received, or stored in your facility?",
                "category": "Commodity Operations",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {
                        "value": "FOOD_AGRICULTURE",
                        "label": "Food, agricultural produce, or packaged edible goods",
                    },
                    {
                        "value": "PHARMACEUTICALS",
                        "label": "Pharmaceutical, healthcare, or medical supplies",
                    },
                    {
                        "value": "HAZARDOUS_CHEMICALS",
                        "label": "Chemicals, paints, batteries, or hazardous substances",
                    },
                    {
                        "value": "GENERAL_DRY_CARGO",
                        "label": "General dry merchandise, apparel, or electronics",
                    },
                ],
                "unit": None,
                "help_text": "Commodity category determines statutory warehousing endorsements and reporting rules.",
                "reason": "This helps determine which commodity-specific warehousing standards and statutory reporting rules apply.",
                "order": 11,
            }
        )

        questions_data.append(
            {
                "question_id": "Q12",
                "question": "How does your business transport goods between hubs, warehouses, and client locations?",
                "category": "Transport Fleet",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {
                        "value": "OWNED_COMMERCIAL_FLEET",
                        "label": "Fleet of company-owned commercial transport vehicles",
                    },
                    {
                        "value": "CONTRACTED_TRANSPORTERS",
                        "label": "Contracted third-party logistics and carrier partners",
                    },
                    {
                        "value": "BOTH_OWNED_AND_CONTRACTED",
                        "label": "Hybrid model with both owned vehicles and contracted haulers",
                    },
                ],
                "unit": None,
                "help_text": "Operating commercial goods carriages requires transport permits, pollution certificates, and driver fitness records.",
                "reason": "This helps determine which transport carriage norms and vehicle fitness schedules apply to your fleet.",
                "order": 12,
            }
        )

        questions_data.append(
            {
                "question_id": "Q13",
                "question": "Does your warehouse or logistics center engage contract labour for material handling, loading, or packing?",
                "category": "Workforce & Safety",
                "answer_type": "SINGLE_SELECT",
                "required": True,
                "options": [
                    {
                        "value": "CONTRACT_LABOUR_20_PLUS",
                        "label": "Yes, 20 or more contract workers through staffing contractors",
                    },
                    {
                        "value": "CONTRACT_LABOUR_UNDER_20",
                        "label": "Yes, fewer than 20 contract workers",
                    },
                    {
                        "value": "DIRECT_EMPLOYEES_ONLY",
                        "label": "All material handlers are direct payroll employees",
                    },
                ],
                "unit": None,
                "help_text": "Engaging 20 or more contract workers involves principal employer registration under the Contract Labour Act.",
                "reason": "This helps determine principal employer statutory obligations and contract labour thresholds.",
                "order": 13,
            }
        )

    else:
        questions_data.append(
            {
                "question_id": "Q10",
                "question": "Do you utilize industrial chemical solvents, paints, lubricants, or flammable adhesives in processing?",
                "category": "Chemical Safety",
                "answer_type": "BOOLEAN",
                "required": True,
                "options": [],
                "unit": None,
                "help_text": "Storage of industrial chemicals or solvents in production areas.",
                "reason": "This helps determine which chemical storage and workplace handling guidelines may be relevant to your facility.",
                "order": 10,
            }
        )

        questions_data.append(
            {
                "question_id": "Q11",
                "question": "What is the total built-up factory or warehouse floor area?",
                "category": "Facility",
                "answer_type": "NUMBER",
                "required": True,
                "options": [],
                "unit": "sq ft",
                "help_text": "Enclosed operational area across all floors.",
                "reason": "This helps determine which built-up area and facility layout guidelines may be relevant to your facility.",
                "order": 11,
            }
        )

        questions_data.append(
            {
                "question_id": "Q12",
                "question": "Does the enterprise operate on e-commerce platforms or direct-to-consumer online channels?",
                "category": "Digital Commerce",
                "answer_type": "BOOLEAN",
                "required": True,
                "options": [],
                "unit": None,
                "help_text": "Selling via online marketplaces or direct consumer digital channels.",
                "reason": "This helps determine which digital commerce standards and consumer disclosure frameworks may be relevant to your facility.",
                "order": 12,
            }
        )

        questions_data.append(
            {
                "question_id": "Q13",
                "question": "Are finished goods sold in pre-packaged retail containers with mandatory label declarations?",
                "category": "Packaging & Metrology",
                "answer_type": "BOOLEAN",
                "required": True,
                "options": [],
                "unit": None,
                "help_text": "Retail packages with printed net quantity, manufacturing dates, and consumer details.",
                "reason": "This helps determine which packaged commodity guidelines and declaration standards may be relevant to your facility.",
                "order": 13,
            }
        )

    # 14. Plastic Packaging & EPR

    questions_data.append(
        {
            "question_id": "Q14",
            "question": "Do you use plastic packaging material (corrugated boxes, pouches, bubble wrap, shrink film) for finished goods?",
            "category": "Packaging & EPR",
            "answer_type": "BOOLEAN",
            "required": True,
            "options": [],
            "unit": None,
            "help_text": "Applies to brand owners and producers who package products in plastics.",
            "reason": "This helps determine which packaging waste management and recycling frameworks may be relevant to your facility.",
            "order": 14,
        }
    )

    # 15. Fire Safety & NOC

    questions_data.append(
        {
            "question_id": "Q15",
            "question": "Does your commercial facility possess an updated Fire Safety NOC from the State Fire Services / Municipal Authority?",
            "category": "Fire & Life Safety",
            "answer_type": "BOOLEAN",
            "required": True,
            "options": [],
            "unit": None,
            "help_text": "Fire department clearance certificate for commercial/industrial buildings.",
            "reason": "This helps determine which building life safety standards and emergency preparedness guidelines may be relevant to your facility.",
            "order": 15,
        }
    )

    return [
        SmartQuestion(
            question_id=item["question_id"],
            question=item["question"],
            category=item["category"],
            answer_type=item["answer_type"],
            required=item["required"],
            options=item.get("options") or [],
            unit=item.get("unit"),
            help_text=item.get("help_text"),
            reason=sanitize_question_reason(item.get("reason", ""), item["category"]),
            order=item["order"],
        )
        for item in questions_data
    ]
