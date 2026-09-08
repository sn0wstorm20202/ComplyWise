"""Dynamic industrial standards and certification discovery engine.

Authority: PRD_v2.0 §22; TRD_v2.0 §30; Milestone Parts 9, 23, 24.

Identifies business-specific standards from:
1. Sector and product descriptors (Food processing, Automotive components, Electronics, etc.).
2. Mandatory Indian Quality Control Orders (QCOs) issued by line ministries and BIS.
3. Export quality requirements (ISO 22000, IATF 16949, CE mark considerations).
"""

from __future__ import annotations

from typing import Any

from apps.businesses.models import Business
from domain.context.business_context import DerivedBusinessContext, build_business_context

from knowledge_packs.catalogs import STANDARDS_CATALOG


def discover_business_standards(
    business: Business,
    context: DerivedBusinessContext | None = None,
) -> dict[str, Any]:
    """Identify relevant Indian Standards, QCOs, and quality certifications for a business."""
    if context is None:
        context = build_business_context(business)

    desc = (context.product_description or "").lower()
    matched_standards: list[dict[str, Any]] = []

    for item in STANDARDS_CATALOG:
        sectors = item.get("sectors", ["ALL"])
        match = False

        if "ALL" in sectors:
            match = True
        if "FOOD" in sectors and any(w in desc for w in ["food", "fruit", "dehydrat", "grain", "beverage", "dairy", "bakery", "spice", "agro", "edible"]):
            match = True
        if "PACKAGING" in sectors and any(w in desc for w in ["packag", "pouch", "bag", "container", "film", "food"]):
            match = True
        if "AUTOMOTIVE" in sectors and any(w in desc for w in ["auto", "vehic", "car", "motor", "engine", "gear", "transmission"]):
            match = True
        if ("ENGINEERING" in sectors or "MACHINING" in sectors) and any(w in desc for w in ["metal", "machin", "cnc", "component", "precision", "fabricat", "tool", "casting", "turned"]):
            match = True
        if "ELECTRONICS" in sectors and any(w in desc for w in ["electron", "pcb", "chip", "semiconduct", "circuit", "smart", "sensor", "meter", "bess", "battery"]):
            match = True

        if match:
            matched_standards.append({
                "standard_code": item["standard_code"],
                "title": item["title"],
                "authority": item["authority"],
                "nature": item["nature"],
                "why_it_matters": item["why_it_matters"],
                "testing_requirements": item["testing_requirements"],
                "next_step": item["next_step"],
                "source_url": item["source_url"],
                "is_mandatory": "MANDATORY" in item["nature"],
            })

    return {
        "business_id": str(business.id),
        "business_name": business.name,
        "total_standards_found": len(matched_standards),
        "standards": matched_standards,
        "discovery_source": "SECTOR_AND_PRODUCT_CLASSIFICATION",
        "disclaimer": "Standards and Quality Control Orders (QCOs) are matched based on your product category and manufacturing activities. Verify specific product scope with Bureau of Indian Standards (BIS).",
    }
