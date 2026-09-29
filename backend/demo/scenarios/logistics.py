"""Demo Scenario: Cold Chain Logistics & Warehousing.

Profile: Temperature-controlled logistics, refrigerated transport, and food/pharma warehousing.
Rules: Enforces FSSAI storage/transport registration, Commercial Establishments Act, EPF, ESI.
"""

from __future__ import annotations

import re
from typing import Any

from common.enums import ApplicabilityStatus
from .base import DemoRequirementItem, DemoScenario


class LogisticsScenario(DemoScenario):
    scenario_id = "LOGISTICS_DEMO"
    name = "Cold Chain Logistics & Warehousing"
    description = "Temperature-controlled warehousing, refrigerated trucking, and supply chain fulfillment."

    def matches(self, business_name: str, context: dict[str, Any]) -> bool:
        desc_parts = [
            business_name,
            str(context.get("product_description") or ""),
            str(context.get("primary_activity") or ""),
            str(context.get("sector") or ""),
        ]
        combined = " ".join(desc_parts).lower()
        return bool(re.search(r"\b(logistics|cold chain|warehousing|freight|storage facility|distribution center|transport)\b", combined))

    def get_requirements(self, context: dict[str, Any]) -> list[DemoRequirementItem]:
        workers = int(context.get("total_worker_count") or 45)
        return [
            DemoRequirementItem(
                requirement_id="REQ-FSSAI-STATE-LICENCE",
                name="FSSAI Storage / Transporter Food License",
                authority="Food Safety and Standards Authority of India (FSSAI)",
                jurisdiction="CENTRAL",
                domain="FOOD",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory registration of cold storage facilities and temperature-controlled food transport vehicles under FSS Act, 2006.",
                why_it_applies="Operating food warehousing, cold storage, and specialized refrigerated logistics requires an FSSAI storage/transport license.",
                statutory_act="Food Safety and Standards Act, 2006 (Section 31)",
                required_documents=["Warehouse Blueprint showing Temp Zones", "Vehicle Refrigeration Calibration Certificates", "Pest Control Contract"],
                application_steps=["Online application on FoSCoS portal", "Inspection of cold storage facility", "Grant of license"],
                timeline="Prior to handling food cargo",
                facts_used=["business_type=LOGISTICS"],
            ),
            DemoRequirementItem(
                requirement_id="REQ-EPF-REGISTRATION",
                name="Employees' Provident Fund (EPF) Registration",
                authority="Employees' Provident Fund Organisation (EPFO)",
                jurisdiction="CENTRAL",
                domain="LABOR",
                status=ApplicabilityStatus.APPLICABLE if workers >= 20 else ApplicabilityStatus.NOT_APPLICABLE,
                description="Social security coverage under EPF & MP Act 1952.",
                why_it_applies=f"Employs {workers} logistics and warehouse staff.",
                statutory_act="Employees' Provident Funds and Miscellaneous Provisions Act, 1952",
                facts_used=[f"total_worker_count={workers}"],
            ),
            DemoRequirementItem(
                requirement_id="REQ-ESI-REGISTRATION",
                name="Employees' State Insurance (ESI) Registration",
                authority="Employees' State Insurance Corporation (ESIC)",
                jurisdiction="CENTRAL",
                domain="LABOR",
                status=ApplicabilityStatus.APPLICABLE,
                description="Healthcare coverage under ESI Act, 1948.",
                why_it_applies=f"Employs {workers} logistics staff in commercial establishment.",
                statutory_act="Employees' State Insurance Act, 1948",
                facts_used=[f"total_worker_count={workers}"],
            ),
        ]
