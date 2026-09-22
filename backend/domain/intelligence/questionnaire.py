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
Your task is to generate EXACTLY 15 intelligent, high-leverage compliance questions for the specified Indian business.

RULES:
1. You must generate EXACTLY 15 questions. Not 10, not 12, not 16. EXACTLY 15.
2. Questions must be tailored specifically to the business's product, manufacturing processes, geography, trade, and operational characteristics.
3. Every question must be in clear, business-friendly language understandable to an enterprise owner.
4. Questions must cover decision-critical compliance dimensions such as:
   - Connected electrical load (HP or kVA) and captive power generation (DG sets)
   - Process water consumption and effluent discharge (Effluent Treatment Plant / ETP)
   - Atmospheric emissions, boilers, furnaces, chimneys, or stack heights
   - Hazardous chemicals storage and hazardous waste disposal (Manifest / SPCB authorization)
   - Total workforce and contract labor engagement (Factories Act / Contract Labour Act)
   - Plant & machinery capital investment tier (MSME classification thresholds)
   - Siting / zoning (MIDC / GIDC approved industrial estate vs agricultural / eco-sensitive zone)
   - Import / export activities, foreign currency receipts, customs bonded warehousing
   - Sector-specific statutory standards (e.g. BIS CRS / QCO for electronics, FSSAI for food, PESO for flammable materials, Textile effluent / ZLD)
   - Packaging materials / Extended Producer Responsibility (EPR for plastic packaging)
5. STRICT RULE ON REASONS & LEGAL CONCLUSIONS:
   The "reason" field must NOT contain final legal applicability conclusions.
   Avoid phrases such as "triggers mandatory license", "is legally required", "is applicable", "the company must obtain...", or "the business is exempt from...".
   Always provide factual/contextual explanations, for example:
   "This helps determine which electrical and factory safety requirements may be relevant to your facility."
6. Allowed `answer_type` values: "TEXT", "NUMBER", "BOOLEAN", "SINGLE_SELECT", "MULTI_SELECT", "DATE", "CURRENCY", "PERCENTAGE".
7. If answer_type is SINGLE_SELECT or MULTI_SELECT, provide at least 2 clear options with {"value": "...", "label": "..."}.
8. If answer_type is BOOLEAN, options should be empty.

Output a valid JSON object matching this schema:
{
  "questions": [
    {
      "question_id": "Q01",
      "question": "What is the total connected electrical load of your production facility?",
      "category": "Operations",
      "answer_type": "NUMBER",
      "required": true,
      "options": [],
      "unit": "HP",
      "help_text": "Include the total sanctioned load from the electricity distribution company (MSEDCL/TNEB/etc.).",
      "reason": "This helps determine which electrical infrastructure and factory safety requirements may be relevant to your facility.",
      "order": 1
    }
    // ... exactly 15 questions Q01 through Q15
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
    """Validate 15-question list against quality guards."""
    if not isinstance(raw_questions, list):
        raise StructuredOutputInvalid("Generated questions must be a list.")

    if len(raw_questions) != 15:
        raise StructuredOutputInvalid(f"Generated questions count must be exactly 15, received {len(raw_questions)}.")

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


def generate_emergency_15_questions(
    context: OrchestrationContext,
    understanding: BusinessUnderstandingResult | None = None,
) -> list[SmartQuestion]:
    """Deterministic emergency fallback generating 15 valid questions tailored to business sector."""
    desc = (context.raw_business_description or context.product or context.business_name or "").lower()
    is_cement = "cement" in desc or "clinker" in desc or "concrete" in desc or "lime" in desc
    is_food = "food" in desc or "dairy" in desc or "beverage" in desc or "snack" in desc or "bakery" in desc
    is_textile = "textile" in desc or "garment" in desc or "apparel" in desc or "cloth" in desc or "dye" in desc
    is_electronics = "electronic" in desc or "charg" in desc or "battery" in desc or "circuit" in desc or "pcb" in desc or "importer" in desc

    questions_data: list[dict[str, Any]] = []

    # 1. Connected Load
    questions_data.append({
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
    })

    # 2. Total Workforce
    questions_data.append({
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
    })

    # 3. Contract Labor
    questions_data.append({
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
    })

    # 4. Plant & Machinery Investment
    questions_data.append({
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
    })

    # 5. Annual Turnover
    questions_data.append({
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
    })

    # 6. Industrial Estate vs Non-conforming Land
    questions_data.append({
        "question_id": "Q06",
        "question": "Where is the physical manufacturing or business premises situated?",
        "category": "Siting & Land",
        "answer_type": "SINGLE_SELECT",
        "required": True,
        "options": [
            {"value": "APPROVED_ESTATE", "label": "Approved Industrial Area / Estate (e.g. MIDC / GIDC / RIICO)"},
            {"value": "SPECIAL_ECONOMIC_ZONE", "label": "Special Economic Zone (SEZ)"},
            {"value": "CONVERTED_COMMERCIAL", "label": "Commercial Converted Land / Municipal Zone"},
            {"value": "NON_CONFORMING", "label": "Non-conforming Industrial Area / Agricultural conversion"},
        ],
        "unit": None,
        "help_text": "Indicate whether the facility is in a government-notified industrial zone.",
        "reason": "This helps determine which industrial estate siting guidelines and municipal norms may be relevant to your facility.",
        "order": 6,
    })

    # 7. DG Set Captive Power
    questions_data.append({
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
    })

    # 8. Hazardous Waste Generation
    questions_data.append({
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
    })

    # 9. Trade Intent (Imports / Exports)
    questions_data.append({
        "question_id": "Q09",
        "question": "What is the cross-border trade scope of your business operations?",
        "category": "Foreign Trade",
        "answer_type": "SINGLE_SELECT",
        "required": True,
        "options": [
            {"value": "DOMESTIC_ONLY", "label": "Domestic operations only within India"},
            {"value": "EXPORT_ONLY", "label": "Direct exports to overseas markets"},
            {"value": "IMPORT_ONLY", "label": "Importing components / raw materials from abroad"},
            {"value": "IMPORT_AND_EXPORT", "label": "Both importing materials and exporting finished goods"},
        ],
        "unit": None,
        "help_text": "Specify if cross-border goods movement or foreign currency transactions are planned.",
        "reason": "This helps determine which cross-border trade documentation and customs procedures may be relevant to your operations.",
        "order": 9,
    })

    # Sector-Specific Questions (10, 11, 12, 13)
    if is_cement:
        questions_data.append({
            "question_id": "Q10",
            "question": "What type of clinker grinding or cement manufacturing process is utilized?",
            "category": "Process & Emissions",
            "answer_type": "SINGLE_SELECT",
            "required": True,
            "options": [
                {"value": "INTEGRATED_PLANT", "label": "Integrated Cement Plant with captive limestone mining and rotary kiln"},
                {"value": "STANDALONE_GRINDING", "label": "Standalone Clinker Grinding and Blending Unit"},
                {"value": "READY_MIX_CONCRETE", "label": "Ready Mix Concrete (RMC) batching plant"},
            ],
            "unit": None,
            "help_text": "Integrated plants involve rotary kilns, whereas grinding units process pre-manufactured clinker.",
            "reason": "This helps determine which clinker processing guidelines and environmental frameworks may be relevant to your facility.",
            "order": 10,
        })
        questions_data.append({
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
        })
        questions_data.append({
            "question_id": "Q12",
            "question": "Will your facility operate captive limestone quarrying or procure clinker externally?",
            "category": "Raw Materials",
            "answer_type": "SINGLE_SELECT",
            "required": True,
            "options": [
                {"value": "CAPTIVE_MINING", "label": "Captive limestone mining under mineral concession lease"},
                {"value": "EXTERNAL_PROCUREMENT", "label": "Procured from domestic/imported merchant suppliers"},
            ],
            "unit": None,
            "help_text": "Mining activities involve lease permissions and mineral dispatch guidelines.",
            "reason": "This helps determine which raw material sourcing guidelines and mineral transportation frameworks may be relevant to your facility.",
            "order": 12,
        })
        questions_data.append({
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
        })
    elif is_food:
        questions_data.append({
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
        })
        questions_data.append({
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
        })
        questions_data.append({
            "question_id": "Q12",
            "question": "What is the primary water source for food processing and washing?",
            "category": "Water & Sanitation",
            "answer_type": "SINGLE_SELECT",
            "required": True,
            "options": [
                {"value": "MUNICIPAL_SUPPLY", "label": "Municipal / Industrial Water Corporation Pipe"},
                {"value": "GROUNDWATER_BOREWELL", "label": "Captive Groundwater Borewell / Tubewell"},
                {"value": "PRIVATE_TANKER", "label": "Private Water Tanker supply"},
            ],
            "unit": None,
            "help_text": "Specifies utility water sourcing vs private or groundwater extraction.",
            "reason": "This helps determine which process water quality standards and testing schedules may be relevant to your facility.",
            "order": 12,
        })
        questions_data.append({
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
        })
    elif is_electronics:
        questions_data.append({
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
        })
        questions_data.append({
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
        })
        questions_data.append({
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
        })
        questions_data.append({
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
        })
    elif is_textile:
        questions_data.append({
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
        })
        questions_data.append({
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
        })
        questions_data.append({
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
        })
        questions_data.append({
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
        })
    else:
        # General manufacturing / trading
        questions_data.append({
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
        })
        questions_data.append({
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
        })
        questions_data.append({
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
        })
        questions_data.append({
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
        })

    # 14. Plastic Packaging & EPR
    questions_data.append({
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
    })

    # 15. Fire Safety & NOC
    questions_data.append({
        "question_id": "Q15",
        "question": "Does your commercial facility possess an updated Fire Safety NOC from the State Fire Services / Municipal Authority?",
        "category": "Fire & Life Safety",
        "answer_type": "BOOLEAN",
        "required": True,
        "options": [],
        "unit": None,
        "help_text": "Fire department clearance certificate for industrial buildings.",
        "reason": "This helps determine which building life safety standards and emergency preparedness guidelines may be relevant to your facility.",
        "order": 15,
    })

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
            if isinstance(raw_qs, list) and len(raw_qs) == 15:
                logger.info("AssessmentRun %s returning existing 15 questions from state (idempotent).", run.run_id)
                try:
                    return validate_and_normalize_questions(raw_qs)
                except Exception as val_exc:
                    logger.warning("Could not revalidate cached questions: %s", val_exc)

        # Also check database SmartQuestionPlan for business
        existing_plan = SmartQuestionPlan.objects.filter(assessment=run.assessment).first()
        if existing_plan:
            existing_instances = list(existing_plan.questions.all().order_by("created_at"))
            if len(existing_instances) == 15:
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
        user_prompt_lines = [
            f"Business Name: {context.business_name}",
            f"State: {context.geography.get('state_name') or context.geography.get('state') or 'Maharashtra'}",
            f"District: {context.geography.get('district') or 'Pune'}",
            f"Business Description: {context.raw_business_description or context.product or 'Industrial Enterprise'}",
        ]
        if understanding:
            user_prompt_lines.append(f"Business Type: {understanding.business_type}")
            user_prompt_lines.append(f"Primary Activity: {understanding.primary_activity}")
            user_prompt_lines.append(f"Products: {', '.join(understanding.products)}")
            user_prompt_lines.append(f"Trade Intent: {understanding.trade_intent}")
            user_prompt_lines.append(f"Likely Regulatory Domains: {', '.join(understanding.likely_regulatory_domains)}")
            user_prompt_lines.append(f"Critical Unknowns to Resolve: {', '.join(understanding.important_unknowns)}")

        messages = [
            ChatMessage(role="system", content=QUESTION_GENERATION_SYSTEM_PROMPT),
            ChatMessage(role="user", content="\n".join(user_prompt_lines)),
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

        # Enforce exactly 15 questions
        if len(questions) != 15:
            questions = generate_emergency_15_questions(context, understanding)

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

            # Update run metadata
            state = dict(run.stage_metadata)
            state["question_generation"] = {
                "questions": [q.to_dict() for q in questions],
                "count": len(questions),
                "generated_at": time.time(),
            }
            run.stage_metadata = state
            run.save()
            logger.info("Persisted 15 questions for assessment run %s", run.run_id)

        except Exception as p_exc:
            logger.exception("Could not persist question set to database: %s", p_exc)
