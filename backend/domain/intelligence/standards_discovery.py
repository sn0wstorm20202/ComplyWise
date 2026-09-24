"""Dynamic industrial standards and certification discovery engine.

Authority: PRD_v2.0 §22; TRD_v2.0 §30; Milestone Parts 9, 23, 24.

Identifies business-specific standards from:
1. Sector and product descriptors (EV charging equipment, Food processing, Automotive components, Electronics, etc.).
2. Mandatory Indian Quality Control Orders (QCOs) issued by line ministries and BIS.
3. Export quality requirements (ISO 22000, IATF 16949, CE mark considerations).
"""

from __future__ import annotations

import re
from typing import Any

from apps.businesses.models import Business
from domain.context.business_context import DerivedBusinessContext, build_business_context

from knowledge_packs.catalogs import STANDARDS_CATALOG


def strip_negations(text: str) -> str:
    """Strip negative clauses (e.g. 'no cement manufacturing', 'does not produce...')
    so negative exclusions are not falsely matched as positive business activities.
    """
    if not text:
        return ""
    pattern = r"\b(?:no|not|neither|nor|without|does\s+not|doesn't|do\s+not|don't|has\s+no|have\s+no|excluding|except\s+for|except)\s+[^.;\n]+"
    return re.sub(pattern, " ", text, flags=re.IGNORECASE)


def discover_business_standards(
    business: Business,
    context: DerivedBusinessContext | None = None,
    assessment_id: str | None = None,
) -> dict[str, Any]:
    """Identify relevant Indian Standards, QCOs, and quality certifications for a business with strict negative filtering."""
    if context is None:
        context = build_business_context(business)

    desc = (context.product_description or "").lower()
    biz_name = (business.name or "").lower()
    raw_acts = getattr(context, "detected_activities", None) or getattr(context, "activities", None) or []
    activities = [a.lower() for a in raw_acts]
    raw_combined = f"{biz_name} {desc} {' '.join(activities)}"
    combined_text = strip_negations(raw_combined)

    # 1. Precise Sector Determination
    is_ev_charging = any(
        w in combined_text
        for w in [
            "ev charg",
            "electric vehicle charg",
            "charging station",
            "charging equipment",
            "evse",
            "dc fast charg",
            "ac charger",
            "power electronic converter",
            "charger manufacturing",
            "distribution box",
        ]
    )

    is_food = any(
        w in combined_text
        for w in [
            "food",
            "fruit",
            "dehydrat",
            "grain",
            "beverage",
            "dairy",
            "bakery",
            "spice",
            "agro",
            "edible",
            "snack",
        ]
    )

    is_food_packaging = is_food and any(
        w in combined_text for w in ["packag", "pouch", "bag", "container", "film"]
    )

    is_packaged_water = any(
        w in combined_text
        for w in [
            "packaged drinking water",
            "mineral water bottling",
            "packaged water plant",
            "water bottling",
        ]
    )

    is_fasteners = any(
        w in combined_text
        for w in [
            "fastener",
            "threaded bolt",
            "nut and bolt",
            "threaded steel",
            "screws",
            "rivet",
        ]
    )

    # Note: Only true automotive OEMs/component manufacturers (e.g. clutch, engine, transmission)
    # NOT EV charging equipment manufacturers who happen to mention "electric vehicle"
    is_automotive_oem = (not is_ev_charging) and any(
        w in combined_text
        for w in [
            "automotive production",
            "automobile manufacturer",
            "auto component",
            "engine block",
            "transmission",
            "gearbox",
            "clutch flange",
            "chassis",
            "hydraulic fittings",
            "tier-1 automotive",
        ]
    )

    is_cnc_machining = any(
        w in combined_text
        for w in [
            "cnc precision",
            "precision machining",
            "machining shop",
            "turning center",
            "lathe job shop",
            "cnc turned",
            "turned parts",
        ]
    )

    is_battery = bool(
        re.search(
            r"\b(battery|bms|lithium|energy storage|cell manufacturing|bess)\b",
            combined_text,
        )
    )

    is_general_electronics = is_ev_charging or is_battery or any(
        w in combined_text
        for w in [
            "electron",
            "pcb",
            "chip",
            "semiconduct",
            "circuit",
            "smart",
            "sensor",
            "meter",
            "inverter",
            "converter",
            "power supply",
            "smps",
            "adapter",
            "charger",
            "usb",
            "gan",
            "hardware",
            "it equipment",
        ]
    )

    is_cement = (not is_battery) and bool(
        re.search(
            r"\b(cement|clinker|portland|concrete|quarry)\b",
            combined_text,
        )
    )

    is_textile = any(
        w in combined_text
        for w in [
            "textile",
            "yarn",
            "denim",
            "fabric",
            "dyeing",
            "weaving",
            "garment",
            "spinning",
        ]
    )

    matched_standards: list[dict[str, Any]] = []

    for item in STANDARDS_CATALOG:
        code = item["standard_code"]
        sectors = item.get("sectors", [])
        match = False

        # Positive Sector Matching
        if is_ev_charging and any(s in sectors for s in ["EV_CHARGING"]):
            match = True
        elif not is_ev_charging and is_battery and any(s in sectors for s in ["BATTERY", "ENERGY_STORAGE"]):
            match = True
        elif not is_ev_charging and is_food and any(s in sectors for s in ["FOOD", "PROCESSING", "AGRO"]):
            match = True
        elif not is_ev_charging and is_food_packaging and any(s in sectors for s in ["FOOD_PACKAGING", "FOOD_CONTACT_PLASTICS"]):
            match = True
        elif not is_ev_charging and is_packaged_water and any(s in sectors for s in ["PACKAGED_WATER", "BEVERAGE_BOTTLING"]):
            match = True
        elif not is_ev_charging and is_cement and any(s in sectors for s in ["CEMENT", "HEAVY_MANUFACTURING", "BUILDING_MATERIALS"]):
            match = True
        elif not is_ev_charging and is_textile and any(s in sectors for s in ["TEXTILE", "DYEING", "WEAVING"]):
            match = True
        elif not is_ev_charging and is_fasteners and any(s in sectors for s in ["FASTENERS", "BOLTS_NUTS_SCREWS"]):
            match = True
        elif not is_ev_charging and is_automotive_oem and any(s in sectors for s in ["AUTOMOTIVE_OEM", "POWERTRAIN_COMPONENTS"]):
            match = True
        elif not is_ev_charging and is_cnc_machining and any(s in sectors for s in ["CNC_MACHINING", "PRECISION_JOB_WORK"]):
            match = True
        elif not is_ev_charging and is_general_electronics and any(s in sectors for s in ["ELECTRONICS", "ESDM", "POWER_ELECTRONICS", "HARDWARE", "IT_EQUIPMENT"]):
            match = True

        # Strict Negative Filter (Relevance Gate: prune contamination)
        if is_ev_charging and not any(s in sectors for s in ["EV_CHARGING"]):
            match = False
        if not is_battery and any(s in sectors for s in ["BATTERY", "ENERGY_STORAGE"]):
            match = False
        if not is_food and any(s in sectors for s in ["FOOD", "PROCESSING", "AGRO"]):
            match = False
        if not is_food_packaging and any(s in sectors for s in ["FOOD_PACKAGING", "FOOD_CONTACT_PLASTICS"]):
            match = False
        if not is_packaged_water and any(s in sectors for s in ["PACKAGED_WATER", "BEVERAGE_BOTTLING"]):
            match = False
        if not is_cement and any(s in sectors for s in ["CEMENT", "HEAVY_MANUFACTURING", "BUILDING_MATERIALS"]):
            match = False
        if not is_textile and any(s in sectors for s in ["TEXTILE", "DYEING", "WEAVING"]):
            match = False
        if not is_fasteners and any(s in sectors for s in ["FASTENERS", "BOLTS_NUTS_SCREWS"]):
            match = False
        if not is_automotive_oem and any(s in sectors for s in ["AUTOMOTIVE_OEM", "POWERTRAIN_COMPONENTS"]):
            match = False
        if not is_cnc_machining and any(s in sectors for s in ["CNC_MACHINING", "PRECISION_JOB_WORK"]):
            match = False

        if match:
            # Standards relevance gate:
            # Technical standards like IS 17017 are relevant but mandatory status requires verified QCO order
            if "17017" in code:
                is_mandatory = False
                mandatory_status = "NEEDS_VERIFICATION"
                verification_status = "NEEDS_VERIFICATION"
            else:
                is_mandatory = item.get("is_mandatory", False)
                mandatory_status = item.get("mandatory_status") or ("MANDATORY" if is_mandatory else "VOLUNTARY")
                verification_status = item.get("verification_status") or ("VERIFIED" if is_mandatory else "NEEDS_VERIFICATION")

            matched_standards.append({
                "standard_code": item["standard_code"],
                "title": item["title"],
                "authority": item["authority"],
                "nature": item["nature"],
                "mandatory_status": mandatory_status,
                "verification_status": verification_status,
                "why_it_matters": item["why_it_matters"],
                "testing_requirements": item["testing_requirements"],
                "next_step": item["next_step"],
                "source_url": item["source_url"],
                "is_mandatory": is_mandatory,
            })

    return {
        "business_id": str(business.id),
        "business_name": business.name,
        "total_standards_found": len(matched_standards),
        "standards": matched_standards,
        "discovery_source": "SECTOR_AND_PRODUCT_CLASSIFICATION",
        "disclaimer": "Standards and Quality Control Orders (QCOs) are matched based on your product category and manufacturing activities. Technical standards are distinguished from mandatory QCOs.",
    }
