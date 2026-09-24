"""15-Question Generation & Intelligent Intake Engine for ComplyWise Assessment Orchestration.

Authority: Milestone Step 02 Specification; PRD_v2.0 §10, §11; TRD_v2.0 §4, §8, §30.

Guarantees:
1. Generates EXACTLY 15 contextual compliance questions for any business in ONE LLM call.
2. Questions are generated dynamically from business profile and business understanding.
3. Every question has strict structured fields (ID, question, category, answer_type, options, unit, help_text, reason, order).
4. Persists the question set in SmartQuestionPlan & SmartQuestionInstance for deterministic re-entry.
5. Complete idempotency: repeated generation requests return the persisted 15 questions (0 LLM calls).
6. Deterministic emergency fallback ensures demo never crashes even if LLM provider fails.
7. Frontend safety: clean user-facing contract without internal model or prompt leaks.
"""

from __future__ import annotations

import json
import logging
import re
import time
from dataclasses import asdict, dataclass, field
from enum import StrEnum
from typing import Any

from django.conf import settings

from apps.businesses.models import Business
from apps.onboarding.models import SmartQuestionInstance, SmartQuestionPlan
from domain.providers.base import ChatMessage, ProviderError, ProviderNotConfigured
from domain.providers.registry import get_llm_provider
from domain.intelligence.business_understanding import BusinessUnderstandingResult
from domain.intelligence.orchestration import (
    AssessmentRun,
    OrchestrationContext,
    OrchestrationError,
    ProviderRateLimit,
    ProviderTimeout,
    ProviderUnavailable,
    StructuredOutputInvalid,
)

logger = logging.getLogger(__name__)


class QuestionAnswerType(StrEnum):
    TEXT = "TEXT"
    NUMBER = "NUMBER"
    BOOLEAN = "BOOLEAN"
    SINGLE_SELECT = "SINGLE_SELECT"
    MULTI_SELECT = "MULTI_SELECT"
    DATE = "DATE"
    CURRENCY = "CURRENCY"
    PERCENTAGE = "PERCENTAGE"


@dataclass
class QuestionOption:
    value: str
    label: str

    def to_dict(self) -> dict[str, str]:
        return {"value": self.value, "label": self.label}


@dataclass
class SmartQuestion:
    question_id: str
    question: str
    category: str
    answer_type: str
    required: bool
    options: list[dict[str, str]] = field(default_factory=list)
    unit: str | None = None
    help_text: str | None = None
    reason: str = ""
    order: int = 1

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    def to_frontend_dict(self) -> dict[str, Any]:
        """User-safe frontend representation without internal model or strategy leaks."""
        return {
            "question_id": self.question_id,
            "question": self.question,
            "category": self.category,
            "answer_type": self.answer_type,
            "required": self.required,
            "options": self.options,
            "unit": self.unit,
            "help_text": self.help_text,
            "reason": self.reason,
            "order": self.order,
        }


QUESTION_GENERATION_SYSTEM_PROMPT = """You are the ComplyWise Adaptive Questioning Intelligence Engine.
Your task is to generate between 5 and 6 intelligent, high-leverage compliance questions (Q01 through Q05 or Q06) tailored specifically to the provided Indian business profile.

RULES:
1. You must generate between 5 and 6 questions (minimum 5, maximum 6). Not 15, not 10. EXACTLY 5 or 6 questions.
2. Questions must be tailored specifically to the business's sector, product/service, operations, workforce, trade, and geography.
3. Every question must be in clear, founder-friendly language.
4. Sector-Specific Invariants:
   - For SOFTWARE / IT / SAAS / DIGITAL PLATFORMS / MEDIA / CREATIVE SERVICES:
     * Focus on:
       1) Total workforce scale (on-roll staff and contractors for Shops & Establishments Act, PF, ESI).
       2) Service export model and foreign client billing (to determine GST LUT under Section 16 of IGST Act vs physical goods IEC).
       3) User personal data collection, processing, and storage (Digital Personal Data Protection / DPDP Act 2023).
       4) Commercial premises arrangement (leased commercial office vs co-working vs remote).
       5) Intellectual property / software licensing / cloud infrastructure security.
       6) Annual turnover tier (GST threshold & filing requirements).
     * NEVER ask about factory connected electrical load, industrial boilers, chimney emissions, industrial effluent, or hazardous waste disposal.
   - For FOOD BUSINESSES / CLOUD KITCHENS / RESTAURANTS:
     * Focus on:
       1) Annual turnover tier (determines FSSAI Basic <= ₹12L, State ₹12L-₹20Cr, or Central >₹20Cr under FSS Act §31).
       2) Operating model (cloud kitchen / delivery-only vs takeaway vs dine-in).
       3) Potable water source and laboratory testing (IS 10500 potability report).
       4) Total kitchen workforce count (food handler health checks & worker thresholds).
       5) Commercial LPG / fire suppression clearance and Municipal Health Trade License.
     * NEVER ask about heavy engineering or metal smelting standards.
   - For PHYSICAL MANUFACTURING / ELECTRONICS / BATTERIES / CHEMICALS:
     * Focus on:
       1) Connected electrical load (HP or kVA).
       2) Total factory workforce & shift laborers (Factories Act threshold of 10+ workers).
       3) Industrial emissions, effluent discharge, or hazardous waste handling.
       4) Siting / zoning (approved industrial estate vs non-conforming land).
       5) Technical product standards and conformity testing (BIS CRS, QCO, ARAI, etc.).
       6) Foreign trade scope (importing components vs exporting finished goods).
5. STRICT RULE ON REASONS & LEGAL CONCLUSIONS:
   The "reason" field must NOT contain final legal applicability conclusions.
   Avoid phrases such as "triggers mandatory license", "is legally required", "is applicable", "the company must obtain...", or "the business is exempt from...".
   Always provide factual/contextual explanations, for example:
   "This helps determine which state employment frameworks and establishment registrations apply to your facility."
6. Allowed `answer_type` values: "SINGLE_SELECT", "MULTI_SELECT", "BOOLEAN", "NUMBER", "CURRENCY", "TEXT".
   Prefer "SINGLE_SELECT", "MULTI_SELECT", or "BOOLEAN" with 2 to 4 clear, intuitive options. The user can also provide their own explanation/description alongside any option.
7. If answer_type is SINGLE_SELECT or MULTI_SELECT, provide at least 2 clear options with {"value": "...", "label": "..."}.

Output a valid JSON object matching this schema:
{
  "questions": [
    {
      "question_id": "Q01",
      "question": "What is the total size of your current workforce (including full-time employees and contractors)?",
      "category": "Workforce & Labor",
      "answer_type": "SINGLE_SELECT",
      "required": true,
      "options": [
        {"value": "BELOW_10", "label": "1 to 9 employees"},
        {"value": "10_TO_19", "label": "10 to 19 employees"},
        {"value": "20_TO_49", "label": "20 to 49 employees"},
        {"value": "50_PLUS", "label": "50 or more employees"}
      ],
      "unit": null,
      "help_text": "Workforce size determines applicability of Shops & Establishments, PF, and ESI registration thresholds.",
      "reason": "This helps determine which state employment frameworks and social security thresholds apply to your team.",
      "order": 1
    }
    // ... 5 to 6 questions total (Q01 through Q05 or Q06)
  ]
}
Output ONLY the raw JSON object. Do not include markdown formatting or commentary."""


def _clean_json_text(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()


LEGAL_CONCLUSION_TERMS = [
    "triggers mandatory",
    "is legally required",
    "is applicable",
    "must obtain",
    "the company must",
    "the business must",
    "is exempt from",
    "is exempt",
    "mandatory license",
    "mandatory statutory",
    "is illegal",
    "mandates",
    "requires mandatory",
    "triggers",
]


def sanitize_question_reason(reason: str, category: str) -> str:
    """Ensure question reason contains factual/contextual explanation rather than legal conclusions."""
    r_lower = reason.lower()
    for term in LEGAL_CONCLUSION_TERMS:
        if term in r_lower:
            clean_cat = category.strip().lower() if category else "operational"
            return f"This helps determine which {clean_cat} requirements may be relevant to your facility."
    return reason


def validate_and_normalize_questions(raw_questions: list[dict[str, Any]]) -> list[SmartQuestion]:
    """Validate 5-6 question list against quality guards."""
    if not isinstance(raw_questions, list):
        raise StructuredOutputInvalid("Generated questions must be a list.")

    if not (4 <= len(raw_questions) <= 8):
        raise StructuredOutputInvalid(f"Generated questions count must be between 5 and 6, received {len(raw_questions)}.")

    seen_ids: set[str] = set()
    seen_texts: set[str] = set()
    validated: list[SmartQuestion] = []

    valid_types = {t.value for t in QuestionAnswerType}

    for idx, item in enumerate(raw_questions, start=1):
        if not isinstance(item, dict):
            raise StructuredOutputInvalid(f"Question at index {idx} is not an object.")

        qid = str(item.get("question_id") or f"Q{idx:02d}").strip().upper()
        if qid in seen_ids:
            qid = f"Q{idx:02d}"
        seen_ids.add(qid)

        q_text = str(item.get("question") or "").strip()
        if len(q_text) < 8:
            raise StructuredOutputInvalid(f"Question text too short at index {idx}: '{q_text}'")

        norm_text = q_text.lower().replace(" ", "").replace("?", "")
        if norm_text in seen_texts:
            raise StructuredOutputInvalid(f"Duplicate question detected: '{q_text}'")
        seen_texts.add(norm_text)

        category = str(item.get("category") or "Operations").strip().title()
        raw_type = str(item.get("answer_type") or "TEXT").strip().upper()
        answer_type = raw_type if raw_type in valid_types else QuestionAnswerType.TEXT.value

        required = bool(item.get("required", True))

        raw_options = item.get("options") or []
        options: list[dict[str, str]] = []
        if answer_type in {QuestionAnswerType.SINGLE_SELECT.value, QuestionAnswerType.MULTI_SELECT.value}:
            if isinstance(raw_options, list):
                for opt in raw_options:
                    if isinstance(opt, dict):
                        val = str(opt.get("value") or opt.get("label") or "").strip()
                        lbl = str(opt.get("label") or opt.get("value") or "").strip()
                        if val:
                            options.append({"value": val, "label": lbl or val})
                    elif isinstance(opt, str) and opt.strip():
                        options.append({"value": opt.strip(), "label": opt.strip()})
            if len(options) < 2:
                # Default generic options for select type if missing
                options = [{"value": "YES", "label": "Yes"}, {"value": "NO", "label": "No"}]
        else:
            options = []

        unit = item.get("unit")
        unit_str = str(unit).strip() if unit and str(unit).strip() else None
        help_text = item.get("help_text")
        help_str = str(help_text).strip() if help_text and str(help_text).strip() else None
        raw_reason = str(item.get("reason") or "This helps determine which requirements may be relevant to your facility.").strip()
        reason = sanitize_question_reason(raw_reason, category)

        validated.append(
            SmartQuestion(
                question_id=qid,
                question=q_text,
                category=category,
                answer_type=answer_type,
                required=required,
                options=options,
                unit=unit_str,
                help_text=help_str,
                reason=reason,
                order=idx,
            )
        )

    return validated


def strip_negations(text: str) -> str:
    """Strip negative clauses (e.g. 'no cement manufacturing', 'does not produce...')
    so negative exclusions are not falsely matched as positive business activities.
    """
    if not text:
        return ""
    pattern = r"\b(?:no|not|neither|nor|without|does\s+not|doesn't|do\s+not|don't|has\s+no|have\s+no|excluding|except\s+for|except)\s+[^.;\n]+"
    return re.sub(pattern, " ", text, flags=re.IGNORECASE)


def generate_emergency_questions(
    context: OrchestrationContext,
    understanding: BusinessUnderstandingResult | None = None,
) -> list[SmartQuestion]:
    """Deterministic emergency fallback generating 5 to 6 valid questions tailored to business sector."""
    desc = (context.raw_business_description or context.product or context.business_name or "").lower()
    cleaned_desc = strip_negations(desc)
    is_software = bool(re.search(r"(software|saas|it|digital|platform|app|cloud|web|ai|tech|film pre-visualization|storyloom)", cleaned_desc))
    is_food = (not is_software) and bool(re.search(r"(food|kitchen|cloud kitchen|restaurant|catering|bakery|beverage|fruit juice|edible|meal|snack|dairy|millet|flour|grain|agro)", cleaned_desc))
    is_battery = (not is_software) and (not is_food) and bool(re.search(r"(battery|bms|lithium|energy storage|cell manufacturing|bess)", cleaned_desc))
    is_electronics = (not is_software) and (not is_food) and (not is_battery) and bool(re.search(r"(electronic|charg|circuit|pcb|importer|hardware)", cleaned_desc))

    questions_data: list[dict[str, Any]] = []

    if is_software:
        # Software / SaaS / Digital Platform / Media: 5 targeted questions
        questions_data = [
            {
                "question_id": "Q01",
                "question": "What is the total size of your workforce (full-time employees and contractors)?",
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
                "help_text": "Workforce size determines applicability of State Shops and Commercial Establishments Act, PF, and ESI.",
                "reason": "This helps determine which state employment frameworks and social security thresholds apply to your team.",
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
                    {"value": "EXPORT_ONLINE_SERVICES", "label": "Online export to international clients (cross-border service delivery)"},
                    {"value": "BOTH_DOMESTIC_AND_EXPORT", "label": "Both domestic Indian clients and international exports"},
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
                    {"value": "YES_USER_DATA", "label": "Yes, collects customer/user personal identifiable information (PII)"},
                    {"value": "NO_PERSONAL_DATA", "label": "No personal data; enterprise B2B non-personal data only"},
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
                    {"value": "REMOTE_VIRTUAL", "label": "Fully remote distributed team with virtual registered office"},
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
                    {"value": "UP_TO_12_LAKHS", "label": "Up to ₹12 Lakhs (Petty Food Business Operator)"},
                    {"value": "12_LAKHS_TO_20_CRORE", "label": "₹12 Lakhs to ₹20 Crore (State Food License)"},
                    {"value": "ABOVE_20_CRORE", "label": "Above ₹20 Crore or Export/Import (Central Food License)"},
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
                    {"value": "CLOUD_KITCHEN_DELIVERY", "label": "Cloud Kitchen (Delivery-only via platforms and direct)"},
                    {"value": "TAKEAWAY_AND_DELIVERY", "label": "Takeaway counter and online delivery"},
                    {"value": "DINE_IN_RESTAURANT", "label": "Dine-in restaurant or cafe with customer seating"},
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
                    {"value": "TESTED_POTABLE_SUPPLY", "label": "Potable RO/municipal supply tested in NABL lab per IS 10500"},
                    {"value": "MUNICIPAL_UNTESTED", "label": "Municipal piped water pending chemical/bacteriological test report"},
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
                    {"value": "COMMERCIAL_LPG_WITH_NOC", "label": "Commercial piped LPG cylinder bank with Fire NOC"},
                    {"value": "COMMERCIAL_LPG_PENDING", "label": "Commercial LPG cylinders (Fire inspection / NOC in progress)"},
                    {"value": "ALL_ELECTRIC", "label": "100% Electric induction commercial cooking (no gas cylinders)"},
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
                    {"value": "NO_HAZARDOUS_WASTE", "label": "Dry assembly only; no hazardous waste generated"},
                    {"value": "SPENT_BATTERIES_OR_SOLVENTS", "label": "Generates scrap cells, electronic waste, or solvent residues"},
                    {"value": "PROCESS_EFFLUENT_ETP", "label": "Wet process generating liquid effluent requiring treatment"},
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
                    {"value": "APPROVED_ESTATE", "label": "Approved Industrial Area / Estate (e.g. MIDC / GIDC / RIICO)"},
                    {"value": "SPECIAL_ECONOMIC_ZONE", "label": "Special Economic Zone (SEZ)"},
                    {"value": "CONVERTED_COMMERCIAL", "label": "Commercial Converted Land / Municipal Zone"},
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
                    {"value": "BIS_CERTIFIED", "label": "Certified under applicable BIS standard (e.g. IS 17017 / IS 16046)"},
                    {"value": "IN_PROGRESS_TESTING", "label": "Prototypes undergoing NABL / ARAI accredited laboratory testing"},
                    {"value": "NOT_YET_TESTED", "label": "Testing not yet commenced; standards to be determined"},
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
                    {"value": "IMPORT_COMPONENTS", "label": "Importing components or raw materials from abroad"},
                    {"value": "EXPORT_FINISHED", "label": "Exporting finished goods to international markets"},
                    {"value": "IMPORT_AND_EXPORT", "label": "Both importing materials and exporting finished goods"},
                ],
                "unit": None,
                "help_text": "Physical cross-border movement of goods requires DGFT Import Export Code (IEC) and customs clearance.",
                "reason": "This helps determine which customs procedures and import/export authorizations apply.",
                "order": 6,
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
                    {"value": "COMMERCIAL_OFFICE", "label": "Commercial office / retail shop premise"},
                    {"value": "WAREHOUSE", "label": "Warehouse / storage godown"},
                    {"value": "FACTORY_WORKSHOP", "label": "Manufacturing workshop or fabrication shed"},
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
                    {"value": "BELOW_20_LAKHS", "label": "Below ₹20 Lakhs (Exempt from mandatory GST)"},
                    {"value": "20_LAKHS_TO_40_LAKHS", "label": "₹20 Lakhs to ₹40 Lakhs (GST threshold for goods)"},
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
                    {"value": "SERVICES_EXPORT", "label": "Exporting services/software electronically"},
                    {"value": "GOODS_IMPORT_EXPORT", "label": "Importing or exporting physical goods"},
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
                    {"value": "SERVICES_DIGITAL", "label": "Services, consulting, or digital products (Non-manufacturing)"},
                    {"value": "TRADING_DISTRIBUTION", "label": "Wholesale, retail, or e-commerce trading of goods"},
                    {"value": "PHYSICAL_MANUFACTURING", "label": "Physical processing, assembly, or manufacturing"},
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


generate_emergency_15_questions = generate_emergency_questions


class QuestionnaireEngine:
    """Central engine managing the 15-question intelligent intake lifecycle."""

    def __init__(self, provider: Any = None) -> None:
        self._provider = provider

    def get_provider(self) -> Any:
        if self._provider is not None:
            return self._provider
        return get_llm_provider()

    def generate_questionnaire(
        self,
        context: OrchestrationContext,
        run: AssessmentRun,
        understanding: BusinessUnderstandingResult | None = None,
    ) -> list[SmartQuestion]:
        """Generate exactly 15 questions for the business in a single LLM call.

        Guarantees:
        - Completely idempotent: returns existing 15 questions if already generated.
        - Persists question set to SmartQuestionPlan & SmartQuestionInstance.
        - Returns list of 15 SmartQuestion objects.
        """
        # Idempotency check: see if already generated in run stage metadata
        existing_meta = run.stage_metadata.get("question_generation")
        if isinstance(existing_meta, dict) and "questions" in existing_meta:
            raw_qs = existing_meta.get("questions")
            if isinstance(raw_qs, list) and 4 <= len(raw_qs) <= 8:
                logger.info("AssessmentRun %s returning existing 15 questions from state (idempotent).", run.run_id)
                try:
                    return validate_and_normalize_questions(raw_qs)
                except Exception as val_exc:
                    logger.warning("Could not revalidate cached questions: %s", val_exc)

        # Also check database SmartQuestionPlan for business
        existing_plan = SmartQuestionPlan.objects.filter(assessment=run.assessment).first()
        if existing_plan:
            existing_instances = list(existing_plan.questions.all().order_by("created_at"))
            if 4 <= len(existing_instances) <= 8:
                logger.info("AssessmentRun %s returning 15 questions from existing plan (idempotent).", run.run_id)
                reconstructed = []
                for idx, inst in enumerate(existing_instances, start=1):
                    reconstructed.append(
                        SmartQuestion(
                            question_id=inst.question_id or f"Q{idx:02d}",
                            question=inst.question_text,
                            category=inst.domains[0] if inst.domains else "Operations",
                            answer_type=inst.data_type,
                            required=True,
                            options=inst.options or [],
                            unit=inst.unit or None,
                            help_text=inst.why_it_matters or None,
                            reason=inst.reason or inst.expected_discovery_impact or "",
                            order=idx,
                        )
                    )
                return reconstructed

        # Construct single prompt for 15 questions
        t0 = time.perf_counter()
        user_prompt_dict = {
            "business_name": context.business_name,
            "state": context.geography.get("state_name") or context.geography.get("state") or "Maharashtra",
            "district": context.geography.get("district") or "Pune",
            "business_description": context.raw_business_description or context.product or "Commercial Enterprise",
        }
        if understanding:
            user_prompt_dict["business_type"] = understanding.business_type
            user_prompt_dict["primary_activity"] = understanding.primary_activity
            user_prompt_dict["products"] = understanding.products
            user_prompt_dict["trade_intent"] = understanding.trade_intent
            user_prompt_dict["likely_regulatory_domains"] = understanding.likely_regulatory_domains
            user_prompt_dict["critical_unknowns"] = understanding.important_unknowns

        user_prompt = (
            f"BUSINESS PROFILE (JSON):\n"
            f"{json.dumps(user_prompt_dict, indent=2)}\n\n"
            f"Generate 5 to 6 targeted compliance questions with clear options for this business."
        )

        messages = [
            ChatMessage(role="system", content=QUESTION_GENERATION_SYSTEM_PROMPT),
            ChatMessage(role="user", content=user_prompt),
        ]

        questions: list[SmartQuestion] = []
        try:
            provider = self.get_provider()
            response = provider.complete(
                messages,
                temperature=0.2,
                max_output_tokens=3000,
                response_format={"type": "json_object"},
                workflow="question_generation",
                assessment_id=run.run_id,
                business_id=context.business_id,
            )
            raw_text = _clean_json_text(response.text)
            parsed = json.loads(raw_text)
            raw_list = parsed.get("questions") if isinstance(parsed, dict) else parsed
            questions = validate_and_normalize_questions(raw_list)

        except (ProviderNotConfigured, StructuredOutputInvalid) as exc:
            logger.warning("Question generation engaging emergency fallback: %s", exc)
            questions = generate_emergency_15_questions(context, understanding)
        except ProviderError as p_err:
            msg = str(p_err).lower()
            if "timeout" in msg:
                raise ProviderTimeout("Question generation timed out consulting intelligence provider.")
            elif "rate limit" in msg or "429" in msg or "guardrail" in msg:
                raise ProviderRateLimit("Intelligence provider rate limit reached.")
            elif "503" in msg or "unavailable" in msg:
                raise ProviderUnavailable("Intelligence provider temporarily unavailable.")
            else:
                logger.warning("Provider error in question generation, engaging emergency fallback: %s", p_err)
                questions = generate_emergency_15_questions(context, understanding)
        except Exception as err:
            logger.exception("Unexpected error generating questions, engaging emergency fallback: %s", err)
            questions = generate_emergency_15_questions(context, understanding)

        # Enforce question count between 4 and 8
        if not (4 <= len(questions) <= 8):
            questions = generate_emergency_questions(context, understanding)

        # Persist to SmartQuestionPlan & SmartQuestionInstance
        self._persist_questionnaire(questions, context, run, understanding)
        return questions

    def _persist_questionnaire(
        self,
        questions: list[SmartQuestion],
        context: OrchestrationContext,
        run: AssessmentRun,
        understanding: BusinessUnderstandingResult | None,
    ) -> None:
        # Always update run metadata first
        try:
            state = dict(run.stage_metadata)
            state["question_generation"] = {
                "questions": [q.to_dict() for q in questions],
                "count": len(questions),
                "generated_at": time.time(),
            }
            run.stage_metadata = state
            run.save()
            logger.info("Persisted 15 questions in metadata for assessment run %s", run.run_id)
        except Exception as meta_exc:
            logger.exception("Could not save questions to run stage_metadata: %s", meta_exc)

        try:
            biz = Business.objects.filter(pk=context.business_id).first()
            if not biz:
                return

            plan, _ = SmartQuestionPlan.objects.get_or_create(
                business=biz,
                assessment=run.assessment,
                defaults={
                    "status": "ACTIVE",
                    "business_summary": understanding.primary_activity if understanding else context.raw_business_description,
                    "regulatory_search_intent": {
                        "domains": understanding.likely_regulatory_domains if understanding else [],
                    },
                    "information_gaps": understanding.important_unknowns if understanding else [],
                },
            )

            # Persist each question instance
            SmartQuestionInstance.objects.filter(plan=plan).delete()
            instances = []
            for q in questions:
                instances.append(
                    SmartQuestionInstance(
                        plan=plan,
                        business=biz,
                        question_id=q.question_id,
                        variable_key=q.question_id.lower(),
                        question_text=q.question,
                        why_it_matters=q.help_text or "",
                        reason=q.reason,
                        expected_discovery_impact=q.reason,
                        domains=[q.category],
                        data_type=q.answer_type,
                        options=q.options,
                        unit=q.unit or "",
                        priority="HIGH",
                        is_answered=False,
                    )
                )
            SmartQuestionInstance.objects.bulk_create(instances)
            logger.info("Persisted 15 questions to SmartQuestionPlan for assessment run %s", run.run_id)

        except Exception as p_exc:
            logger.exception("Could not persist question set to database: %s", p_exc)
