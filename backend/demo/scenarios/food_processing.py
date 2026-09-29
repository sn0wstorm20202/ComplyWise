"""Demo Scenario: Food Processing & Organic Packaging.

Profile: Food manufacturing, organic packaged foods, snacks, beverages.
Rules: Enforces FSSAI Central License, Legal Metrology, Factory License, SPCB consent, EPF.
"""

from __future__ import annotations

import re
from typing import Any

from common.enums import ApplicabilityStatus
from .base import DemoRequirementItem, DemoScenario


class FoodProcessingScenario(DemoScenario):
    scenario_id = "FOOD_DEMO"
    name = "Food Processing & Packaged Goods"
    description = "Commercial food processing, organic snacks, or beverage manufacturing facility."

    def matches(self, business_name: str, context: dict[str, Any]) -> bool:
        desc_parts = [
            business_name,
            str(context.get("product_description") or ""),
            str(context.get("primary_activity") or ""),
            str(context.get("sector") or ""),
        ]
        combined = " ".join(desc_parts).lower()
        is_food = bool(re.search(r"\b(food|beverage|snack|bakery|dairy|edible oil|organic food|confectionery|juice)\b", combined))
        is_pharma = bool(re.search(r"\b(pharma|tablet|capsule|drug|formulation)\b", combined))
        return is_food and not is_pharma

    def get_requirements(self, context: dict[str, Any]) -> list[DemoRequirementItem]:
        workers = int(context.get("total_worker_count") or 50)
        turnover = int(context.get("annual_turnover") or 250000000)
        is_central = turnover > 200000000  # ₹20 Cr threshold for FSSAI Central

        return [
            DemoRequirementItem(
                requirement_id="REQ-FSSAI-CENTRAL-LICENCE" if is_central else "REQ-FSSAI-STATE-LICENCE",
                name="FSSAI Central Food License" if is_central else "FSSAI State Food License",
                authority="Food Safety and Standards Authority of India (FSSAI)",
                jurisdiction="CENTRAL",
                domain="FOOD",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory Food Business Operator licence under Section 31 of Food Safety and Standards Act, 2006.",
                why_it_applies=f"Turnover ₹{turnover // 10000000} Crore requires {'Central' if is_central else 'State'} FSSAI manufacturing license.",
                statutory_act="Food Safety and Standards Act, 2006 (Section 31)",
                required_documents=["FSMS Plan", "Water Test Report (IS 10500)", "Food Recall Plan", "List of Food Categories"],
                application_steps=["Online application on FoSCoS portal", "Inspection by Food Safety Officer", "Grant of license"],
                timeline="Prior to food manufacture",
                facts_used=[f"annual_turnover=₹{turnover // 10000000} Cr", "sector=FOOD"],
            ),
            DemoRequirementItem(
                requirement_id="REQ-LEGAL-METROLOGY-PACKER",
                name="Legal Metrology Packaged Commodities Registration (Rule 27)",
                authority="Department of Consumer Affairs",
                jurisdiction="CENTRAL",
                domain="STANDARDS",
                status=ApplicabilityStatus.APPLICABLE,
                description="Registration of pre-packaged food items under Rule 27 of Legal Metrology Packaged Commodities Rules.",
                why_it_applies="Manufacturing and packaging retail consumer food packages.",
                statutory_act="Legal Metrology (Packaged Commodities) Rules, 2011",
                facts_used=["is_manufacturing=True"],
            ),
            DemoRequirementItem(
                requirement_id="REQ-EPF-REGISTRATION",
                name="Employees' Provident Fund (EPF) Registration",
                authority="Employees' Provident Fund Organisation (EPFO)",
                jurisdiction="CENTRAL",
                domain="LABOR",
                status=ApplicabilityStatus.APPLICABLE if workers >= 20 else ApplicabilityStatus.NOT_APPLICABLE,
                description="Social security coverage under EPF & MP Act 1952.",
                why_it_applies=f"Employs {workers} workers.",
                statutory_act="Employees' Provident Funds and Miscellaneous Provisions Act, 1952",
                facts_used=[f"total_worker_count={workers}"],
            ),
        ]
