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
5. Extract structured operational facts for statutory decision rules (workers, power load in HP/kW, boiler status/capacity, trade effluent, dyeing, hazardous materials, shifts).
6. STRICT RULE: DO NOT declare final legal applicability, statutory approvals, exemptions, or compliance clearances. You only structure facts and flag likely regulatory domains.

You must output a strictly valid JSON object conforming exactly to this schema:
{
  "business_type": "string (e.g. Manufacturing, Services, Trading, Hybrid)",
  "primary_activity": "string (concise descriptive statement of main business activity)",
  "secondary_activities": ["string", "..."],
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
  "canonical_operational_facts": {
    "total_worker_count": integer or null,
    "connected_power_load": float or null,
    "connected_power_unit": "HP" | "KW" | "KVA" | null,
    "facility_area": float or null,
    "facility_area_unit": "SQFT" | "SQM" | null,
    "dyeing_activity": boolean or null,
    "boiler_installed": boolean or null,
    "boiler_capacity_tph": float or null,
    "effluent_emission_generation": boolean or null,
    "shifts_count": integer or null,
    "hazardous_waste_generation": boolean or null,
    "hazardous_goods_handling": boolean or null,
    "is_manufacturing": boolean or null
  },
  "normalized_facts": [
    {
      "key": "string",
      "value": "string or number or boolean",
      "source": "LLM_BUSINESS_UNDERSTANDING",
      "confidence": "INFERRED",
      "raw_unit": "string or null",
      "source_excerpt": "string or null"
    }
  ]
}
Output ONLY the JSON object. Do not include markdown fences or preamble."""


from domain.intelligence.output_safety import EVIDENCE_CONSTRAINTS
BUSINESS_UNDERSTANDING_SYSTEM_PROMPT += EVIDENCE_CONSTRAINTS


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
    secondary_activities: list[str] = field(default_factory=list)
    canonical_operational_facts: dict[str, Any] = field(default_factory=dict)
    raw_response: dict[str, Any] = field(default_factory=dict)
    duration_ms: float = 0.0

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    def to_clean_dict(self) -> dict[str, Any]:
        """User-safe dictionary without internal provider or prompt metadata."""
        return {
            "business_type": self.business_type,
            "primary_activity": self.primary_activity,
            "secondary_activities": self.secondary_activities,
            "products": self.products,
            "manufacturing_or_service": self.manufacturing_or_service,
            "market": self.market,
            "geography": self.geography,
            "trade_intent": self.trade_intent,
            "operational_characteristics": self.operational_characteristics,
            "likely_regulatory_domains": self.likely_regulatory_domains,
            "important_unknowns": self.important_unknowns,
            "canonical_operational_facts": self.canonical_operational_facts,
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

    raw_secondary = data.get("secondary_activities", [])
    secondary_activities = [str(s).strip() for s in raw_secondary if str(s).strip()] if isinstance(raw_secondary, list) else []

    canonical_op_facts = data.get("canonical_operational_facts")
    if not isinstance(canonical_op_facts, dict):
        canonical_op_facts = {}

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
        secondary_activities=secondary_activities,
        canonical_operational_facts=canonical_op_facts,
        raw_response=data,
    )


def extract_canonical_facts_from_understanding(
    understanding: BusinessUnderstandingResult,
    raw_text: str = "",
) -> dict[str, dict[str, Any]]:
    """Extract and validate canonical operational facts with forensic provenance.

    Produces typed profile version variables matching CanonicalFact & BusinessProfileVersion schema.
    Includes unit conversions (kW -> HP), numeric bounds, and explicit source excerpts.
    Never invents unstated facts.
    """
    from apps.businesses.models import BusinessProfileVersion
    from common.enums import VariableOrigin
    from domain.jurisdictions.resolver import normalize_jurisdiction

    facts: dict[str, dict[str, Any]] = {}
    combined_text = f"{raw_text} {understanding.primary_activity} {' '.join(understanding.operational_characteristics)}".lower()

    # 1. Establishment / Manufacturing Status
    mfg_status = understanding.manufacturing_or_service
    is_mfg = mfg_status in {"MANUFACTURING", "HYBRID"}
    if "software" in combined_text or "saas" in combined_text or "cloud platform" in combined_text:
        if not any(w in combined_text for w in ["hardware", "plant", "factory", "assembly"]):
            is_mfg = False

    facts["is_manufacturing"] = BusinessProfileVersion.build_entry(
        value=is_mfg,
        origin=VariableOrigin.LLM_EXTRACTED,
        confidence=0.95,
        derived_from=["manufacturing_or_service"],
    )

    # 2. Jurisdiction (State & District)
    state_val = understanding.geography.get("state")
    if state_val:
        norm_state = normalize_jurisdiction(state_val)
        if norm_state:
            facts["state"] = BusinessProfileVersion.build_entry(
                value=norm_state,
                origin=VariableOrigin.LLM_EXTRACTED,
                confidence=0.99,
            )

    dist_val = understanding.geography.get("district")
    if dist_val:
        facts["district"] = BusinessProfileVersion.build_entry(
            value=str(dist_val).strip(),
            origin=VariableOrigin.LLM_EXTRACTED,
            confidence=0.90,
        )

    # 3. Product Description / Primary Activity
    activity_val = understanding.primary_activity or raw_text
    if activity_val:
        facts["product_description"] = BusinessProfileVersion.build_entry(
            value=activity_val[:500],
            origin=VariableOrigin.LLM_EXTRACTED,
            confidence=0.98,
        )

    # 4. Trade / Import-Export Intent
    trade_val = understanding.trade_intent
    if trade_val:
        ti_map = {
            "DOMESTIC_ONLY": "DOMESTIC_ONLY",
            "IMPORT_ONLY": "IMPORT_ONLY",
            "EXPORT_ONLY": "EXPORT_ONLY",
            "IMPORT_AND_EXPORT": "BOTH",
            "NONE": "DOMESTIC_ONLY",
        }
        ti_canonical = ti_map.get(trade_val, "DOMESTIC_ONLY")
        facts["import_export_intent"] = BusinessProfileVersion.build_entry(
            value=ti_canonical,
            origin=VariableOrigin.LLM_EXTRACTED,
            confidence=0.92,
        )

    # 5. Extract structured facts from LLM canonical_operational_facts
    op_facts = understanding.canonical_operational_facts or {}

    # Total Worker Count
    workers = op_facts.get("total_worker_count")
    worker_excerpt = None
    if raw_text:
        m = re.search(r"\b(\d+)\s*(?:workers?|employees?|staff|personnel|workforce)\b", raw_text, re.IGNORECASE)
        if m:
            if workers is None:
                workers = int(m.group(1))
            worker_excerpt = m.group(0)
    if workers is not None:
        facts["total_worker_count"] = BusinessProfileVersion.build_entry(
            value=int(workers),
            origin=VariableOrigin.LLM_EXTRACTED,
            confidence=0.95,
        )
        if worker_excerpt:
            facts["total_worker_count"]["source_excerpt"] = worker_excerpt

    # Connected Power Load
    power = op_facts.get("connected_power_load")
    power_unit = op_facts.get("connected_power_unit") or "HP"
    power_excerpt = None
    if power is None:
        m = re.search(r"\b(\d+(?:\.\d+)?)\s*(hp|kw|kva)\b", raw_text, re.IGNORECASE)
        if m:
            power = float(m.group(1))
            power_unit = m.group(2).upper()
            power_excerpt = m.group(0)
    if power is not None:
        canon_power = float(power)
        if power_unit in {"KW", "KVA"}:
            canon_power = round(canon_power * 1.34102, 2)
        facts["connected_power_load"] = BusinessProfileVersion.build_entry(
            value=str(round(canon_power, 2)),
            origin=VariableOrigin.LLM_EXTRACTED,
            confidence=0.95,
        )
        facts["connected_power_load"]["raw_value"] = power
        facts["connected_power_load"]["raw_unit"] = power_unit
        facts["connected_power_load"]["canonical_unit"] = "HP"
        if power_excerpt:
            facts["connected_power_load"]["source_excerpt"] = power_excerpt

    # Boiler Installed & Capacity
    has_boiler = op_facts.get("boiler_installed")
    boiler_excerpt = None
    if has_boiler is None:
        if re.search(r"\b(no boiler|without boiler)\b", raw_text, re.IGNORECASE):
            has_boiler = False
        elif re.search(r"\b(steam boiler|industrial boiler|boiler)\b", raw_text, re.IGNORECASE):
            has_boiler = True
            boiler_excerpt = "steam boiler"
    if has_boiler is not None:
        facts["boiler_installed"] = BusinessProfileVersion.build_entry(
            value=bool(has_boiler),
            origin=VariableOrigin.LLM_EXTRACTED,
            confidence=0.95,
        )
        if boiler_excerpt:
            facts["boiler_installed"]["source_excerpt"] = boiler_excerpt

    boiler_cap = op_facts.get("boiler_capacity_tph")
    if boiler_cap is None and has_boiler:
        m = re.search(r"\b(\d+(?:\.\d+)?)\s*(?:tph|tonnes?/hr|tons?/hr)\b", raw_text, re.IGNORECASE)
        if m:
            boiler_cap = float(m.group(1))
    if boiler_cap is not None:
        facts["boiler_capacity_tph"] = BusinessProfileVersion.build_entry(
            value=str(round(float(boiler_cap), 2)),
            origin=VariableOrigin.LLM_EXTRACTED,
            confidence=0.95,
        )
        facts["boiler_capacity_tph"]["canonical_unit"] = "TPH"

    # Effluent / Emission Generation
    effluent = op_facts.get("effluent_emission_generation")
    effluent_excerpt = None
    if effluent is None:
        m = re.search(r"\b(trade effluent|wastewater|toxic discharge|effluent|air emissions)\b", raw_text, re.IGNORECASE)
        if m:
            effluent = True
            effluent_excerpt = m.group(0)
    if effluent is not None:
        facts["effluent_emission_generation"] = BusinessProfileVersion.build_entry(
            value=bool(effluent),
            origin=VariableOrigin.LLM_EXTRACTED,
            confidence=0.95,
        )
        if effluent_excerpt:
            facts["effluent_emission_generation"]["source_excerpt"] = effluent_excerpt

    # Dyeing Activity
    dyeing = op_facts.get("dyeing_activity")
    dyeing_excerpt = None
    if dyeing is None:
        m = re.search(r"\b(dyeing|bleaching|textile printing|wet chemical processing)\b", raw_text, re.IGNORECASE)
        if m:
            dyeing = True
            dyeing_excerpt = m.group(0)
    if dyeing is not None:
        facts["dyeing_activity"] = BusinessProfileVersion.build_entry(
            value=bool(dyeing),
            origin=VariableOrigin.LLM_EXTRACTED,
            confidence=0.95,
        )
        if dyeing_excerpt:
            facts["dyeing_activity"]["source_excerpt"] = dyeing_excerpt

    # Hazardous Waste / Materials
    haz_waste = op_facts.get("hazardous_waste_generation")
    if haz_waste is None and re.search(r"\b(hazardous waste|toxic waste|chemical sludge)\b", raw_text, re.IGNORECASE):
        haz_waste = True
    if haz_waste is not None:
        facts["hazardous_waste_generation"] = BusinessProfileVersion.build_entry(
            value=bool(haz_waste),
            origin=VariableOrigin.LLM_EXTRACTED,
            confidence=0.95,
        )

    haz_goods = op_facts.get("hazardous_goods_handling")
    if haz_goods is None and re.search(r"\b(flammable|toxic chemical|explosive|hazardous substance)\b", raw_text, re.IGNORECASE):
        haz_goods = True
    if haz_goods is not None:
        facts["hazardous_goods_handling"] = BusinessProfileVersion.build_entry(
            value=bool(haz_goods),
            origin=VariableOrigin.LLM_EXTRACTED,
            confidence=0.95,
        )

    # Shifts Count
    shifts = op_facts.get("shifts_count")
    if shifts is None:
        m = re.search(r"\b(\d+)\s*shifts?\b", raw_text, re.IGNORECASE)
        if m:
            shifts = int(m.group(1))
        elif re.search(r"\btriple shift\b", raw_text, re.IGNORECASE):
            shifts = 3
        elif re.search(r"\bdouble shift\b", raw_text, re.IGNORECASE):
            shifts = 2
    if shifts is not None:
        facts["shifts_count"] = BusinessProfileVersion.build_entry(
            value=int(shifts),
            origin=VariableOrigin.LLM_EXTRACTED,
            confidence=0.90,
        )

    # Facility Area
    area = op_facts.get("facility_area")
    if area is None:
        m = re.search(r"\b(\d+(?:,\d+)*(?:\.\d+)?)\s*(sq\.?\s*ft|sqft|square feet|sqm)\b", raw_text, re.IGNORECASE)
        if m:
            raw_str = m.group(1).replace(",", "")
            area = float(raw_str)
            unit_str = m.group(2).lower()
            if "sqm" in unit_str:
                area = area * 10.7639
    if area is not None:
        facts["facility_area"] = BusinessProfileVersion.build_entry(
            value=str(round(float(area), 2)),
            origin=VariableOrigin.LLM_EXTRACTED,
            confidence=0.90,
        )
        facts["facility_area"]["canonical_unit"] = "sqft"

    # Software / Personal Data
    if not is_mfg and any(w in combined_text for w in ["software", "saas", "app", "cloud"]):
        if re.search(r"\b(personal data|customer data|user data|pii|employee records|payroll)\b", combined_text):
            facts["processes_personal_data"] = BusinessProfileVersion.build_entry(
                value=True,
                origin=VariableOrigin.LLM_EXTRACTED,
                confidence=0.95,
            )

    return facts


def generate_emergency_business_understanding(context: OrchestrationContext) -> BusinessUnderstandingResult:
    """Deterministic fallback for business understanding if LLM provider fails."""
    desc = (context.raw_business_description or context.product or context.business_name or "").lower()

    is_mfg = any(w in desc for w in ["manufactur", "produc", "plant", "factory", "charg", "cement", "garment", "process", "assembl"])
    is_export = any(w in desc for w in ["export", "uae", "dubai", "global", "overseas", "ship", "international"])
    is_import = any(w in desc for w in ["import", "customs", "china", "procure"])

    trade_intent = "IMPORT_AND_EXPORT" if (is_export and is_import) else ("EXPORT_ONLY" if is_export else ("IMPORT_ONLY" if is_import else "DOMESTIC_ONLY"))
    market = "DOMESTIC_AND_EXPORT" if (is_export and not is_import) else ("EXPORT" if is_export else "DOMESTIC")
    mfg_type = "MANUFACTURING" if is_mfg else ("TRADING" if (is_export or is_import) else "SERVICE")

    likely_domains = ["Establishment requirements for the declared operations"]
    if is_mfg:
        likely_domains.extend(["Industrial safety requirements to review", "Environmental requirements to review"])
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
            "state": context.geography.get("state") or "Not specified",
            "district": context.geography.get("district") or "Not specified",
            "industrial_zone_status": context.geography.get("industrial_zone_status") or "Not specified",
        },
        trade_intent=trade_intent,
        operational_characteristics=[f"{key.replace('_', ' ')}: {value}" for key,value in context.operational_facts.items() if value is not None],
        likely_regulatory_domains=likely_domains,
        important_unknowns=[key.replace('_', ' ') for key,value in context.operational_facts.items() if value is None],
        normalized_facts=[
            {"key": "is_manufacturing", "value": is_mfg, "source": "LOCAL_DESCRIPTION_HEURISTIC", "confidence": "INFERRED"},
            {"key": "trade_intent", "value": trade_intent, "source": "LOCAL_DESCRIPTION_HEURISTIC", "confidence": "INFERRED"},
        ],
        secondary_activities=["Cross-border trade"] if (is_export or is_import) else ["Domestic distribution"],
        canonical_operational_facts={},
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
            f"Legal Constitution: {context.normalized_facts.get('legal_constitution') or 'Not specified'}",
            f"Business Description / Activity: {context.raw_business_description or context.product or 'Not provided'}",
        ]
        if context.financial_facts.get("annual_turnover"):
            user_prompt_parts.append(f"Declared Turnover: {context.financial_facts['annual_turnover']} INR")
        if context.financial_facts.get("plant_machinery_investment"):
            user_prompt_parts.append(f"Plant & Machinery Investment: {context.financial_facts['plant_machinery_investment']} INR")

        messages = [
            ChatMessage(role="system", content=BUSINESS_UNDERSTANDING_SYSTEM_PROMPT),
            ChatMessage(role="user", content="\n".join(user_prompt_parts)),
        ]

        def validate_response(text):
            try:
                return validate_business_understanding_schema(json.loads(_clean_json_text(text)))
            except StructuredOutputInvalid as exc:
                raise ValueError("Business understanding schema is invalid.") from exc

        try:
            provider = self.get_provider()
            response = provider.complete(
                messages,
                temperature=0.1,
                max_output_tokens=1500,
                response_format={"type": "json_object"},
                response_validator=validate_response,
                workflow="business_understanding",
                assessment_id=assessment_id,
                business_id=context.business_id,
            )
            raw_text = _clean_json_text(response.text)
            try:
                parsed_json = json.loads(raw_text)
            except json.JSONDecodeError as json_err:
                logger.warning("Business understanding returned malformed JSON.")
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
