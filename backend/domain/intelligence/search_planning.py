"""Regulatory Search Planning for Live Regulatory Intelligence.

Authority: Step 03 Specification §4, §5; PRD_v2.0 §27A; TRD_v2.0 §11A.

Constructs 3–6 targeted, multidimensional search queries from the canonical BusinessContext.
Queries combine:
- Activity & Specific Product
- Manufacturing & Industrial processes
- State & Central Jurisdiction
- Operational characteristics (power load, worker scale, hazardous waste, effluent)
- Trade intent (cross-border, export destination, import)
- Specific statutory domains (SPCB CTE/CTO, Factories Act, BIS QCO/CRS, Waste/EPR, DGFT)

INVARIANT:
Never searches generic terms such as "company name compliance" or "licenses required India".
"""

from __future__ import annotations

import re
from typing import Any

from domain.context.business_context import DerivedBusinessContext
from domain.intelligence.context_merge import EnrichedBusinessContext
from domain.intelligence.orchestration import OrchestrationContext


def _extract_core_product_tokens(text: str, max_words: int = 4) -> str:
    """Extract primary product terms from description."""
    if not text:
        return ""
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", text)
    stopwords = {
        "and", "with", "from", "for", "the", "that", "this", "our", "all",
        "are", "have", "been", "operating", "manufacture", "manufacturing",
        "producer", "producing", "setup", "want", "facility", "plant", "unit"
    }
    words = [w for w in cleaned.split() if len(w) > 2 and w.lower() not in stopwords]
    return " ".join(words[:max_words])


def plan_regulatory_searches(
    context: OrchestrationContext | EnrichedBusinessContext | DerivedBusinessContext,
    max_queries: int = 6,
) -> list[str]:
    """Generate 3–6 focused regulatory search queries grounded in canonical business context."""
    # Normalize context fields
    state_name = "Maharashtra"
    product_desc = ""
    is_manufacturing = True
    is_cross_border = False
    trade_intent = "DOMESTIC_ONLY"
    power_load = None
    worker_count = None
    effluent_gen = False
    hazardous_gen = False

    if isinstance(context, EnrichedBusinessContext):
        state_name = context.state_name or context.state or "Maharashtra"
        product_desc = context.product_description or ""
        is_manufacturing = context.is_manufacturing
        is_cross_border = context.is_cross_border
        trade_intent = context.trade_intent
        power_load = context.connected_power_load
        worker_count = context.total_worker_count
        effluent_gen = bool(context.effluent_emission_generation)
        hazardous_gen = bool(context.hazardous_waste_generation)
    elif isinstance(context, OrchestrationContext):
        state_name = context.geography.get("state_name") or context.geography.get("state") or "Maharashtra"
        product_desc = context.product or context.raw_business_description or ""
        is_manufacturing = context.normalized_facts.get("is_manufacturing", True)
        is_cross_border = context.normalized_facts.get("is_cross_border", False)
        trade_intent = context.answers.get("trade_intent") or ("EXPORT_ONLY" if is_cross_border else "DOMESTIC_ONLY")
        power_load = context.operational_facts.get("connected_power_load")
        worker_count = context.operational_facts.get("total_worker_count")
        effluent_gen = bool(context.operational_facts.get("effluent_emission_generation"))
        hazardous_gen = bool(context.operational_facts.get("hazardous_waste_generation"))
    elif isinstance(context, DerivedBusinessContext):
        state_name = context.state_name or context.state or "Maharashtra"
        product_desc = context.product_description or ""
        is_manufacturing = context.is_manufacturing
        is_cross_border = context.is_cross_border
        trade_intent = "EXPORT_ONLY" if is_cross_border else "DOMESTIC_ONLY"
        power_load = context.connected_power_load
        worker_count = context.total_worker_count
        effluent_gen = bool(context.effluent_emission_generation)
        hazardous_gen = bool(context.hazardous_waste_generation)

    desc_lower = product_desc.lower()
    core_product = _extract_core_product_tokens(product_desc) or "industrial"

    queries: list[str] = []

    # 1. State Pollution Control Board (Consent to Establish / Operate)
    # Target specific activity + state board portal
    if "cement" in desc_lower:
        queries.append(f"{state_name} pollution control board consent to establish cement manufacturing MPCB guidelines")
    elif "charger" in desc_lower or "electronics" in desc_lower:
        queries.append(f"{state_name} pollution control board consent electronic hardware manufacturing CTE CTO")
    elif "textile" in desc_lower or "dye" in desc_lower:
        queries.append(f"{state_name} pollution control board textile dyeing effluent ETP consent to establish")
    elif "food" in desc_lower or "juice" in desc_lower or "processing" in desc_lower:
        queries.append(f"{state_name} pollution control board consent food processing effluent trade waste")
    else:
        queries.append(f"{state_name} pollution control board consent to establish {core_product} manufacturing official")

    # 2. Directorate of Industrial Safety & Health (Factories Act / Licensing)
    if is_manufacturing:
        if "cement" in desc_lower:
            queries.append(f"{state_name} factories act factory licence heavy industrial manufacturing plant")
        elif "textile" in desc_lower or "dye" in desc_lower:
            queries.append(f"{state_name} factories directorate textile spinning weaving safety licence")
        else:
            queries.append(f"{state_name} DISH factory licence registration manufacturing {core_product} rules")

    # 3. Product Standards & Mandatory Certification (BIS / QCO / FSSAI / CRS)
    if "cement" in desc_lower:
        queries.append("BIS mandatory certification Quality Control Order cement IS 269 IS 1489 India")
    elif "charger" in desc_lower or "adapter" in desc_lower or "electronics" in desc_lower:
        queries.append("BIS CRS Compulsory Registration Scheme power adapter laptop charger IS 13252 India")
    elif "food" in desc_lower or "beverage" in desc_lower or "juice" in desc_lower or "millet" in desc_lower:
        queries.append("FSSAI manufacturing license state central food safety regulations standards")
    elif "textile" in desc_lower:
        queries.append("textile ministry Quality Control Order technical textiles mandatory BIS certification India")
    else:
        queries.append(f"BIS mandatory certification Quality Control Order {core_product} India")

    # 4. Waste Management & EPR Frameworks (E-Waste, Plastic, Hazardous Waste, Battery)
    if "charger" in desc_lower or "electronic" in desc_lower or "telecom" in desc_lower:
        queries.append("CPCB E-Waste Management Rules 2022 EPR portal registration electronics manufacturer")
    elif "textile" in desc_lower or "dye" in desc_lower or hazardous_gen or "chemical" in desc_lower:
        queries.append(f"{state_name} SPCB Hazardous and Other Wastes Management authorization sludge disposal")
    elif "food" in desc_lower:
        queries.append("CPCB centralized EPR portal plastic packaging waste management registration brand owner")
    elif "cement" in desc_lower:
        queries.append("CPCB emission standards co-processing hazardous waste cement plants guidelines")
    elif hazardous_gen:
        queries.append(f"Hazardous and Other Wastes Management Rules authorization {state_name} official")

    # 5. Cross-Border Trade & Foreign Trade Policy (DGFT / Customs / ICEGATE)
    has_export = (
        is_cross_border
        or trade_intent in {"EXPORT_ONLY", "IMPORT_AND_EXPORT", "PLANNED"}
        or any(w in desc_lower for w in ["export", "overseas", "dubai", "uae", "foreign trade"])
    )
    has_import = (
        is_cross_border
        or trade_intent in {"IMPORT_ONLY", "IMPORT_AND_EXPORT"}
        or "import" in desc_lower
    )
    if has_export or has_import:
        if has_export:
            queries.append(f"DGFT IEC registration export procedure {core_product} foreign trade policy India")
        elif has_import:
            queries.append(f"DGFT import authorization electronic goods customs clearance IEC India")
        else:
            queries.append(f"DGFT Importer Exporter Code IEC registration guidelines {core_product} India")
    elif "food" in desc_lower:
        # Domestic packaging requirement for food
        queries.append("Legal Metrology Packaged Commodities Rules 2011 food manufacturing labelling declarations")

    # 6. Sectoral Specific Compliance (Thermal, Boiler, Ground Water, Packaging)
    if "cement" in desc_lower:
        queries.append("Indian Boilers Act 1923 captive power plant steam boiler registration Maharashtra")
    elif "charger" in desc_lower or "electronic" in desc_lower:
        if "wireless" in desc_lower or "radio" in desc_lower or "telemetry" in desc_lower:
            queries.append("WPC ETA Equipment Type Approval Saral Sanchar wireless import India")
        else:
            queries.append("Legal Metrology Packaged Commodities Rules electronics pre-packer registration")

    # Deduplicate while preserving order
    seen: set[str] = set()
    deduped: list[str] = []
    for q in queries:
        norm = " ".join(q.lower().split())
        if norm not in seen:
            seen.add(norm)
            deduped.append(q)

    # Return bounded 3 to max_queries
    final_queries = deduped[:max_queries]
    if len(final_queries) < 3:
        final_queries.append(f"{state_name} industrial compliance guidelines {core_product} official portal")

    return final_queries
