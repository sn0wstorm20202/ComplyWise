"""Dynamic government scheme and incentive discovery engine.

Authority: PRD_v2.0 §21; TRD_v2.0 §30; Milestone Parts 8, 23, 24.

Discovers business-specific government support schemes based on:
1. Enterprise scale (MSMED Act 2020: Micro, Small, Medium, Large).
2. Sector & Activity profile (Food processing, Electronics, Automotive/Machining, etc.).
3. Jurisdiction & State industrial policies (Maharashtra PSI, Odisha IPR, Gujarat, Tamil Nadu).
4. Trade intent (Export incentives, MAI, RoDTEP).
"""

from __future__ import annotations

from typing import Any

from apps.businesses.models import Business
from domain.context.business_context import DerivedBusinessContext, build_business_context

from knowledge_packs.catalogs import GOVERNMENT_SCHEME_CATALOG


def discover_business_schemes(
    business: Business,
    context: DerivedBusinessContext | None = None,
) -> dict[str, Any]:
    """Dynamically discover government schemes matching the business's profile."""
    if context is None:
        context = build_business_context(business)

    desc = (context.product_description or "").lower()
    state_code = (context.state or "").upper()
    msme_scale = context.msme_scale

    matched_schemes: list[dict[str, Any]] = []

    for item in GOVERNMENT_SCHEME_CATALOG:
        # Jurisdiction match: CENTRAL or matches business state
        jurisdiction = item["jurisdiction"]
        if jurisdiction != "CENTRAL" and jurisdiction != state_code:
            continue

        # Scale match: Must match MSME scale if scale_match is specified
        if item.get("scale_match") and msme_scale != "UNKNOWN":
            if msme_scale not in item["scale_match"]:
                continue

        # Sector match:
        sectors = item.get("sectors", ["ALL"])
        sector_match = False
        relevance_rationale = ""

        if "ALL" in sectors:
            sector_match = True
            relevance_rationale = f"Universal support program available for {msme_scale.capitalize()} enterprises."
        if "FOOD" in sectors and any(w in desc for w in ["food", "fruit", "dehydrat", "grain", "beverage", "dairy", "bakery", "spice", "agro", "edible"]):
            sector_match = True
            relevance_rationale = f"Specifically formulated for food processing enterprises in {context.state_name}."
        if "AUTOMOTIVE" in sectors and any(w in desc for w in ["auto", "vehic", "car", "motor", "engine", "gear", "clutch", "transmission"]):
            sector_match = True
            relevance_rationale = f"Dedicated incentive for automotive and transport engineering components."
        if ("ENGINEERING" in sectors or "MACHINING" in sectors) and any(w in desc for w in ["metal", "machin", "cnc", "component", "precision", "fabricat", "tool", "casting", "forging"]):
            sector_match = True
            relevance_rationale = f"Tailored for precision metal machining and precision component manufacturing."
        if "ELECTRONICS" in sectors and any(w in desc for w in ["electron", "pcb", "chip", "semiconduct", "smart", "circuit", "sensor", "meter", "bess", "battery"]):
            sector_match = True
            relevance_rationale = f"High-priority incentive under national electronics and hardware manufacturing initiatives."
        if "EXPORT" in sectors and context.is_cross_border:
            sector_match = True
            relevance_rationale = "Export competitiveness and duty remission scheme matching your international trade profile."

        if sector_match:
            ben = item["benefit"]
            ben_lower = ben.lower()
            if "guarantee" in ben_lower or "credit" in ben_lower:
                b_type = "LOAN_GUARANTEE"
            elif "subsidy" in ben_lower or "grant" in ben_lower or "assistance" in ben_lower:
                b_type = "CAPITAL_SUBSIDY"
            elif "duty" in ben_lower or "remission" in ben_lower:
                b_type = "DUTY_REMISSION"
            else:
                b_type = "INCENTIVE_SCHEME"

            matched_schemes.append({
                "id": item["id"],
                "title": item["name"],
                "name": item["name"],
                "authority": item["authority"],
                "jurisdiction": item["jurisdiction"],
                "benefit_type": b_type,
                "benefit": ben,
                "benefit_summary": ben,
                "eligibility": item["eligibility"],
                "eligibility_status": "POTENTIALLY_ELIGIBLE",
                "application_route": item["application_route"],
                "portal_url": item["portal_url"],
                "action_url": item["portal_url"],
                "relevance_rationale": relevance_rationale,
                "status": "POTENTIALLY_RELEVANT",
                "is_state_specific": item["jurisdiction"] != "CENTRAL",
            })

    return {
        "business_id": str(business.id),
        "business_name": business.name,
        "available": True,
        "state": context.state,
        "state_name": context.state_name,
        "msme_scale": context.msme_scale,
        "count": len(matched_schemes),
        "total_schemes_found": len(matched_schemes),
        "schemes": matched_schemes,
        "discovery_mode": "PROFILE_ATTRIBUTES_AND_STATE_POLICY",
        "disclaimer": "Scheme relevance is derived from your business activity, jurisdiction, and MSME classification. Final financial approval depends on official scheme guidelines and departmental scrutiny.",
    }
