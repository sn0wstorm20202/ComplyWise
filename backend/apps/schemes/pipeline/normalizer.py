"""Field Normalization for Ingested Scheme Metadata.

Authority: User Specification — "Convert free-text into controlled fields.
E.g., convert 'micro, small and medium enterprises' into an MSME scale category;
map state names to codes. Ensure consistent units (e.g. ₹, percentages)."
"""

from __future__ import annotations

import re
from datetime import date
from typing import Any


def normalize_jurisdiction(raw_jurisdiction: str) -> str:
    raw = (raw_jurisdiction or "").strip().upper()
    if any(k in raw for k in ["MAHARASHTRA", "MH", "MUMBAI", "PUNE", "GOM"]):
        return "MH"
    return "CENTRAL"


def normalize_msme_scales(raw_text: str) -> list[str]:
    text = (raw_text or "").upper()
    scales = []
    if "MICRO" in text:
        scales.append("MICRO")
    if "SMALL" in text:
        scales.append("SMALL")
    if "MEDIUM" in text:
        scales.append("MEDIUM")
    if "LARGE" in text:
        scales.append("LARGE")

    if not scales:
        if "MSME" in text:
            scales = ["MICRO", "SMALL", "MEDIUM"]
        else:
            scales = ["MICRO", "SMALL", "MEDIUM"]
    return scales


def normalize_sectors(raw_text: str) -> list[str]:
    text = (raw_text or "").upper()
    sectors = set()

    if "ALL" in text or "ANY SECTOR" in text or "UNIVERSAL" in text:
        return ["ALL"]

    if any(w in text for w in ["TEXTILE", "GARMENT", "APPAREL", "GINNING", "SPINNING", "WEAVING"]):
        sectors.add("TEXTILE")
    if any(w in text for w in ["FOOD", "AGRO", "DAIRY", "GRAIN", "BAKERY", "SPICE"]):
        sectors.add("FOOD_PROCESSING")
    if any(w in text for w in ["AUTOMOTIVE", "AUTO", "VEHICLE", "EV"]):
        sectors.add("AUTOMOTIVE")
    if any(w in text for w in ["ENGINEERING", "MACHINING", "CNC", "PRECISION", "FABRICAT", "TOOL"]):
        sectors.add("ENGINEERING")
    if any(w in text for w in ["ELECTRONIC", "HARDWARE", "SEMICONDUCTOR", "SENSOR", "ESDM"]):
        sectors.add("ELECTRONICS")
    if any(w in text for w in ["PHARMA", "DRUG", "BIOTECH", "KSM", "API", "FORMULATION"]):
        sectors.add("PHARMACEUTICALS")
    if any(w in text for w in ["EXPORT", "CROSS_BORDER", "ICEGATE", "SHIPPING"]):
        sectors.add("EXPORT")
    if "SERVICES" in text or "SERVICE" in text:
        sectors.add("SERVICES")

    if not sectors and any(w in text for w in ["MANUFACTUR", "INDUSTRIAL", "PLANT", "FACTORY"]):
        sectors.add("MANUFACTURING")

    if not sectors:
        sectors.add("ALL")

    return sorted(list(sectors))


def normalize_benefit_type(raw_type: str, benefit_desc: str) -> str:
    combined = f"{raw_type} {benefit_desc}".upper()

    if "GUARANTEE" in combined or "CREDIT GUARANTEE" in combined:
        return "CREDIT_GUARANTEE"
    if "INTEREST" in combined or "SUBVENTION" in combined:
        return "INTEREST_SUBVENTION"
    if "POWER TARIFF" in combined or "TARIFF SUBSIDY" in combined or "PER UNIT" in combined:
        return "POWER_TARIFF_SUBSIDY"
    if "ELECTRICITY DUTY" in combined or "STAMP DUTY" in combined or "TAX EXEMPTION" in combined or "WAIVER" in combined:
        return "TAX_EXEMPTION"
    if "ZED" in combined or "CERTIFICATION" in combined or "TESTING" in combined or "NABL" in combined or "QUALITY" in combined:
        return "QUALITY_CERTIFICATION"
    if "SEED MONEY" in combined or "SOFT LOAN" in combined:
        return "SOFT_LOAN"
    if "CLUSTER" in combined or "INFRASTRUCTURE" in combined or "COMMON FACILITY" in combined:
        return "INFRASTRUCTURE_GRANT"
    if "PRODUCTION" in combined or "INCREMENTAL" in combined or "BHAVYA" in combined:
        return "PRODUCTION_INCENTIVE"
    if "CAPITAL SUBSIDY" in combined or "SUBSIDY" in combined or "MARGIN MONEY" in combined or "GRANT" in combined:
        return "CAPITAL_SUBSIDY"

    return "INCENTIVE_SCHEME"


def parse_date_safe(date_str: str | None) -> date | None:
    if not date_str:
        return None
    try:
        parts = [int(p) for p in date_str.strip().split("-")]
        if len(parts) == 3:
            return date(parts[0], parts[1], parts[2])
    except Exception:
        pass
    return None


def extract_quantitative_benefit(benefit_desc: str) -> dict[str, Any]:
    """Extracts structured values like percentage rates and maximum ceiling amounts."""
    details: dict[str, Any] = {}
    pct_match = re.search(r"(\d+(?:\.\d+)?)\s*%", benefit_desc)
    if pct_match:
        details["rate_percent"] = float(pct_match.group(1))

    cr_match = re.search(r"Rs\.?\s*(\d+(?:\.\d+)?)\s*Crore", benefit_desc, re.IGNORECASE)
    if cr_match:
        details["max_ceiling_inr"] = float(cr_match.group(1)) * 10_000_000

    lakh_match = re.search(r"Rs\.?\s*(\d+(?:\.\d+)?)\s*Lakh", benefit_desc, re.IGNORECASE)
    if lakh_match and "max_ceiling_inr" not in details:
        details["max_ceiling_inr"] = float(lakh_match.group(1)) * 100_000

    unit_match = re.search(r"Rs\.?\s*(\d+(?:\.\d+)?)\s*per unit", benefit_desc, re.IGNORECASE)
    if unit_match:
        details["tariff_rebate_per_kwh"] = float(unit_match.group(1))

    return details
