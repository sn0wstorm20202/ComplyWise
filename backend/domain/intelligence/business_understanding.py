"""AI Business Understanding stage for ComplyWise Assessment Orchestration.

Authority: Milestone Step 02 Specification; PRD_v2.0 §10, §11; TRD_v2.0 §4, §8, §30.

Transforms unstructured business profiles (name, constitution, geography,
and natural language description) into a canonical structured understanding of:
- Primary industry & activity
- Products / services
- Manufacturing vs service vs trading intent
- Market & geographic footprint
- Operational characteristics (power, hazardous material, effluent, labor)
- Likely regulatory domains
- Important unknowns (to be targeted by 15-question generation)

STRICT CONSTRAINT: This stage NEVER declares final legal applicability,
approvals, exemptions, or statutory conclusions.
"""

from __future__ import annotations

import json
import logging
import re
import time
from dataclasses import asdict, dataclass, field
from typing import Any

from django.conf import settings

from domain.providers.base import ChatMessage, ProviderError, ProviderNotConfigured
from domain.providers.registry import get_llm_provider
from domain.intelligence.orchestration import (
    OrchestrationContext,
    OrchestrationError,
    ProviderRateLimit,
    ProviderTimeout,
    ProviderUnavailable,
    StructuredOutputInvalid,
)

logger = logging.getLogger(__name__)

BUSINESS_UNDERSTANDING_SYSTEM_PROMPT = """You are the ComplyWise Business Intelligence Engine for Indian regulatory compliance.
Your role is to deeply analyze an Indian business's profile and plain-text description to understand its operational reality.

CRITICAL INSTRUCTIONS:
1. Extract and structure what the business actually does, manufactures, trades, or services.
2. Identify operational characteristics (e.g. connected power load, boiler/furnace, chemical storage, effluent discharge, hazardous waste, contract workforce, packaging/plastics).
3. Identify likely regulatory domains that typically govern such businesses in India (e.g. "State Pollution Control Board (Consent to Establish/Operate)", "Factories Act & DISH (Factory License)", "Central Ground Water Authority (CGWA)", "BIS Quality Control Orders", "FSSAI Food Safety", "PESO Explosives/Petroleum", "DGFT Import-Export Code", "Plastic/E-Waste Management Rules").
4. Identify critical missing unknowns ("important_unknowns") that downstream stages must ask the business owner to determine statutory applicability.
5. STRICT RULE: DO NOT declare final legal applicability, statutory approvals, exemptions, or compliance clearances. You only structure facts and flag likely regulatory domains.

You must output a strictly valid JSON object conforming exactly to this schema:
{
  "business_type": "string (e.g. Manufacturing, Services, Trading, Hybrid)",
  "primary_activity": "string (concise descriptive statement of main business activity)",
  "products": ["string", "..."],
  "manufacturing_or_service": "MANUFACTURING" | "SERVICE" | "TRADING" | "HYBRID",
  "market": "DOMESTIC" | "EXPORT" | "DOMESTIC_AND_EXPORT" | "GLOBAL",
  "geography": {
    "state": "string",
    "district": "string",
    "industrial_zone_status": "string"
  },
  "trade_intent": "DOMESTIC_ONLY" | "IMPORT_ONLY" | "EXPORT_ONLY" | "IMPORT_AND_EXPORT" | "NONE",
  "operational_characteristics": ["string", "..."],
  "likely_regulatory_domains": ["string", "..."],
  "important_unknowns": ["string", "..."],
  "normalized_facts": [
    {
      "key": "string",
      "value": "string or number or boolean",
      "source": "LLM_BUSINESS_UNDERSTANDING",
      "confidence": "INFERRED"
    }
  ]
}
Output ONLY the JSON object. Do not include markdown fences or preamble."""


@dataclass
class BusinessUnderstandingResult:
    business_type: str
    primary_activity: str
    products: list[str]
    manufacturing_or_service: str
    market: str
    geography: dict[str, Any]
    trade_intent: str
    operational_characteristics: list[str]
    likely_regulatory_domains: list[str]
    important_unknowns: list[str]
    normalized_facts: list[dict[str, Any]]
    raw_response: dict[str, Any] = field(default_factory=dict)
    duration_ms: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    def to_clean_dict(self) -> dict[str, Any]:
        """User-safe dictionary without internal provider or prompt metadata."""
        return {
            "business_type": self.business_type,
            "primary_activity": self.primary_activity,
            "products": self.products,
            "manufacturing_or_service": self.manufacturing_or_service,
            "market": self.market,
            "geography": self.geography,
            "trade_intent": self.trade_intent,
            "operational_characteristics": self.operational_characteristics,
            "likely_regulatory_domains": self.likely_regulatory_domains,
            "important_unknowns": self.important_unknowns,
            "normalized_facts": self.normalized_facts,
        }


def _clean_json_text(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()


def validate_business_understanding_schema(data: dict[str, Any]) -> BusinessUnderstandingResult:
    """Validate and normalize raw JSON into a BusinessUnderstandingResult."""
    if not isinstance(data, dict):
        raise StructuredOutputInvalid("Business understanding output must be a JSON dictionary.")

    business_type = str(data.get("business_type") or "General Business").strip()
    primary_activity = str(data.get("primary_activity") or "Commercial Operations").strip()

    raw_products = data.get("products", [])
    if isinstance(raw_products, list):
        products = [str(p).strip() for p in raw_products if str(p).strip()]
    elif isinstance(raw_products, str) and raw_products.strip():
        products = [raw_products.strip()]
    else:
        products = []

    mfg_or_svc = str(data.get("manufacturing_or_service") or "MANUFACTURING").strip().upper()
    if mfg_or_svc not in {"MANUFACTURING", "SERVICE", "TRADING", "HYBRID"}:
        mfg_or_svc = "HYBRID" if "service" in mfg_or_svc.lower() and "manufactur" in mfg_or_svc.lower() else "MANUFACTURING"

    market = str(data.get("market") or "DOMESTIC").strip().upper()
    if market not in {"DOMESTIC", "EXPORT", "DOMESTIC_AND_EXPORT", "GLOBAL"}:
        market = "DOMESTIC"

    geography = data.get("geography", {})
    if not isinstance(geography, dict):
        geography = {}

    trade_intent = str(data.get("trade_intent") or "DOMESTIC_ONLY").strip().upper()
    if trade_intent not in {"DOMESTIC_ONLY", "IMPORT_ONLY", "EXPORT_ONLY", "IMPORT_AND_EXPORT", "NONE"}:
        trade_intent = "DOMESTIC_ONLY"

    raw_ops = data.get("operational_characteristics", [])
    operational_characteristics = [str(op).strip() for op in raw_ops if str(op).strip()] if isinstance(raw_ops, list) else []

    raw_domains = data.get("likely_regulatory_domains", [])
    likely_regulatory_domains = [str(d).strip() for d in raw_domains if str(d).strip()] if isinstance(raw_domains, list) else []

    raw_unknowns = data.get("important_unknowns", [])
    important_unknowns = [str(u).strip() for u in raw_unknowns if str(u).strip()] if isinstance(raw_unknowns, list) else []

    raw_facts = data.get("normalized_facts", [])
    normalized_facts: list[dict[str, Any]] = []
    if isinstance(raw_facts, list):
        for f in raw_facts:
            if isinstance(f, dict) and "key" in f and "value" in f:
                normalized_facts.append({
                    "key": str(f["key"]),
                    "value": f["value"],
                    "source": "LLM_BUSINESS_UNDERSTANDING",
                    "confidence": "INFERRED",
                })

    return BusinessUnderstandingResult(
        business_type=business_type,
        primary_activity=primary_activity,
        products=products,
        manufacturing_or_service=mfg_or_svc,
        market=market,
        geography=geography,
        trade_intent=trade_intent,
        operational_characteristics=operational_characteristics,
        likely_regulatory_domains=likely_regulatory_domains,
        important_unknowns=important_unknowns,
        normalized_facts=normalized_facts,
        raw_response=data,
    )


def generate_emergency_business_understanding(context: OrchestrationContext) -> BusinessUnderstandingResult:
    """Deterministic fallback for business understanding if LLM provider fails."""
    desc = (context.raw_business_description or context.product or context.business_name or "").lower()

    is_mfg = any(w in desc for w in ["manufactur", "produc", "plant", "factory", "charg", "cement", "garment", "process", "assembl"])
    is_export = any(w in desc for w in ["export", "uae", "dubai", "global", "overseas", "ship", "international"])
    is_import = any(w in desc for w in ["import", "customs", "china", "procure"])

    trade_intent = "IMPORT_AND_EXPORT" if (is_export and is_import) else ("EXPORT_ONLY" if is_export else ("IMPORT_ONLY" if is_import else "DOMESTIC_ONLY"))
    market = "DOMESTIC_AND_EXPORT" if (is_export and not is_import) else ("EXPORT" if is_export else "DOMESTIC")
    mfg_type = "MANUFACTURING" if is_mfg else ("TRADING" if (is_export or is_import) else "SERVICE")

    likely_domains = [
        "State Pollution Control Board (CTE/CTO)",
        "Factories Act & Industrial Safety",
        "Shops & Commercial Establishments",
    ]
    if is_export or is_import:
        likely_domains.append("Directorate General of Foreign Trade (IEC & Customs)")
    if any(w in desc for w in ["food", "dairy", "beverage", "snack"]):
        likely_domains.append("Food Safety and Standards Authority of India (FSSAI)")
    if any(w in desc for w in ["electronic", "charg", "battery", "appliance"]):
        likely_domains.append("Bureau of Indian Standards (BIS Compulsory Registration Scheme)")
        likely_domains.append("E-Waste Management Rules (EPR)")

    products = [p.strip() for p in re.split(r"[,;.]", context.raw_business_description or context.business_name) if len(p.strip()) > 2][:3]
    if not products:
        products = [context.business_name]

    return BusinessUnderstandingResult(
        business_type=f"{mfg_type.title()} Enterprise",
        primary_activity=context.raw_business_description or f"Commercial operations of {context.business_name}",
        products=products,
        manufacturing_or_service=mfg_type,
        market=market,
        geography={
            "state": context.geography.get("state") or "Maharashtra",
            "district": context.geography.get("district") or "Pune",
            "industrial_zone_status": context.geography.get("industrial_zone_status") or "APPROVED_ESTATE",
        },
        trade_intent=trade_intent,
        operational_characteristics=[
            "Industrial power connectivity required",
            "Workforce scaling planned",
            "Statutory environmental clearances applicable",
        ],
        likely_regulatory_domains=likely_domains,
        important_unknowns=[
            "Sanctioned electrical load (HP/kVA)",
            "Total workforce and contract labor count",
            "Effluent and emission generation parameters",
            "Plant & machinery capital investment tier",
        ],
        normalized_facts=[
            {"key": "is_manufacturing", "value": is_mfg, "source": "LLM_BUSINESS_UNDERSTANDING", "confidence": "INFERRED"},
            {"key": "trade_intent", "value": trade_intent, "source": "LLM_BUSINESS_UNDERSTANDING", "confidence": "INFERRED"},
        ],
        raw_response={"fallback": True},
    )


class BusinessUnderstandingEngine:
    """Orchestrates AI Business Understanding stage."""

    def __init__(self, provider: Any = None) -> None:
        self._provider = provider

    def get_provider(self) -> Any:
        if self._provider is not None:
            return self._provider
        return get_llm_provider()

    def analyze_business(
        self,
        context: OrchestrationContext,
        assessment_id: str | None = None,
    ) -> BusinessUnderstandingResult:
        """Run business understanding analysis using the configured LLM provider."""
        t0 = time.perf_counter()

        user_prompt_parts = [
            f"Business Name: {context.business_name}",
            f"Jurisdiction State: {context.geography.get('state_name') or context.geography.get('state') or 'India'}",
            f"District: {context.geography.get('district') or 'Not specified'}",
            f"Legal Constitution: {context.normalized_facts.get('legal_constitution') or 'Private Limited'}",
            f"Business Description / Activity: {context.raw_business_description or context.product or 'Industrial manufacturing and commercial operations'}",
        ]
        if context.financial_facts.get("annual_turnover"):
            user_prompt_parts.append(f"Declared Turnover: {context.financial_facts['annual_turnover']} INR")
        if context.financial_facts.get("plant_machinery_investment"):
            user_prompt_parts.append(f"Plant & Machinery Investment: {context.financial_facts['plant_machinery_investment']} INR")

        messages = [
            ChatMessage(role="system", content=BUSINESS_UNDERSTANDING_SYSTEM_PROMPT),
            ChatMessage(role="user", content="\n".join(user_prompt_parts)),
        ]

        try:
            provider = self.get_provider()
            response = provider.complete(
                messages,
                temperature=0.1,
                max_output_tokens=1500,
                response_format={"type": "json_object"},
                workflow="business_understanding",
                assessment_id=assessment_id,
                business_id=context.business_id,
            )
            raw_text = _clean_json_text(response.text)
            try:
                parsed_json = json.loads(raw_text)
            except json.JSONDecodeError as json_err:
                logger.warning("LLM returned non-JSON business understanding: %s", raw_text)
                raise StructuredOutputInvalid(f"Malformed JSON from business understanding provider: {json_err}")

            result = validate_business_understanding_schema(parsed_json)
            result.duration_ms = (time.perf_counter() - t0) * 1000
            return result

        except (ProviderNotConfigured, StructuredOutputInvalid) as exc:
            logger.warning("Business understanding falling back to deterministic emergency understanding: %s", exc)
            fallback_res = generate_emergency_business_understanding(context)
            fallback_res.duration_ms = (time.perf_counter() - t0) * 1000
            return fallback_res
        except ProviderError as p_err:
            msg = str(p_err).lower()
            if "timeout" in msg:
                raise ProviderTimeout("Business understanding timed out consulting intelligence provider.")
            elif "rate limit" in msg or "429" in msg or "guardrail" in msg:
                raise ProviderRateLimit("Intelligence provider rate limit reached.")
            elif "503" in msg or "unavailable" in msg:
                raise ProviderUnavailable("Intelligence provider temporarily unavailable.")
            else:
                logger.warning("Provider error in business understanding, using emergency fallback: %s", p_err)
                fallback_res = generate_emergency_business_understanding(context)
                fallback_res.duration_ms = (time.perf_counter() - t0) * 1000
                return fallback_res
        except Exception as err:
            logger.exception("Unexpected error in business understanding: %s", err)
            fallback_res = generate_emergency_business_understanding(context)
            fallback_res.duration_ms = (time.perf_counter() - t0) * 1000
            return fallback_res
