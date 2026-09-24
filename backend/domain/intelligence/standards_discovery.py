"""Dynamic industrial standards and certification discovery engine.

Authority: PRD_v2.0 §22; TRD_v2.0 §30; Milestone Parts 9, 23, 24.

Identifies business-specific standards from:
1. Sector and product descriptors (EV charging equipment, Food processing, Automotive components, Electronics, etc.).
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
    assessment_id: str | None = None,
) -> dict[str, Any]:
    """Identify relevant Indian Standards, QCOs, and quality certifications for a business with strict negative filtering."""
    if context is None:
        context = build_business_context(business)

    desc = (context.product_description or "").lower()
    biz_name = (business.name or "").lower()
    raw_acts = getattr(context, "detected_activities", None) or getattr(context, "activities", None) or []
    activities = [a.lower() for a in raw_acts]
    combined_text = f"{biz_name} {desc} {' '.join(activities)}"

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

    is_general_electronics = is_ev_charging or any(
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
            "bess",
            "battery",
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

    is_cement = any(
        w in combined_text
        for w in [
            "cement",
            "clinker",
            "portland",
            "concrete",
            "quarry",
        ]
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
        if is_ev_charging and any(s in sectors for s in ["EV_CHARGING", "CLEANTECH", "AUTOMOTIVE_ELECTRICAL"]):
            match = True
        elif is_food and any(s in sectors for s in ["FOOD", "PROCESSING", "AGRO"]):
            match = True
        elif is_food_packaging and any(s in sectors for s in ["FOOD_PACKAGING", "FOOD_CONTACT_PLASTICS"]):
            match = True
        elif is_packaged_water and any(s in sectors for s in ["PACKAGED_WATER", "BEVERAGE_BOTTLING"]):
            match = True
        elif is_cement and any(s in sectors for s in ["CEMENT", "HEAVY_MANUFACTURING", "BUILDING_MATERIALS"]):
            match = True
        elif is_textile and any(s in sectors for s in ["TEXTILE", "DYEING", "WEAVING"]):
            match = True
        elif is_fasteners and any(s in sectors for s in ["FASTENERS", "BOLTS_NUTS_SCREWS"]):
            match = True
        elif is_automotive_oem and any(s in sectors for s in ["AUTOMOTIVE_OEM", "POWERTRAIN_COMPONENTS", "AUTOMOTIVE"]):
            match = True
        elif is_cnc_machining and any(s in sectors for s in ["CNC_MACHINING", "PRECISION_JOB_WORK"]):
            match = True
        elif is_general_electronics and any(s in sectors for s in ["ELECTRONICS", "ESDM", "POWER_ELECTRONICS", "HARDWARE"]):
            # For EV charging, only include power converter/SMPS standard IS 15885, not generic IT computer IS 13252 unless computer mentioned
            if is_ev_charging:
                if code == "IS 15885 (Part 2/Sec 13)":
                    match = True
            else:
                match = True

        # Strict Negative Filter (prune contamination)
        if not is_food and any(s in sectors for s in ["FOOD", "PROCESSING", "AGRO"]):
            match = False
        if not is_food_packaging and any(s in sectors for s in ["FOOD_PACKAGING", "FOOD_CONTACT_PLASTICS"]):
            match = False
        if not is_packaged_water and any(s in sectors for s in ["PACKAGED_WATER", "BEVERAGE_BOTTLING"]):
            match = False
        if not is_cement and any(s in sectors for s in ["CEMENT", "BUILDING_MATERIALS"]):
            match = False
        if not is_textile and any(s in sectors for s in ["TEXTILE", "DYEING", "WEAVING"]):
            match = False
        if not is_fasteners and any(s in sectors for s in ["FASTENERS", "BOLTS_NUTS_SCREWS"]):
            match = False
        if is_ev_charging and any(s in sectors for s in ["AUTOMOTIVE_OEM", "POWERTRAIN_COMPONENTS", "AUTOMOTIVE", "FASTENERS", "CNC_MACHINING", "FOOD_PACKAGING", "CEMENT", "TEXTILE"]):
            match = False
        if not is_automotive_oem and any(s in sectors for s in ["AUTOMOTIVE_OEM", "POWERTRAIN_COMPONENTS"]):
            match = False
        if not is_cnc_machining and any(s in sectors for s in ["CNC_MACHINING", "PRECISION_JOB_WORK"]):
            match = False

        if match:
            is_mandatory = item.get("is_mandatory", "MANDATORY" in item.get("nature", ""))
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
