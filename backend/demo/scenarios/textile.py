"""Demo Scenario: Textile Manufacturing Mill (Maharashtra).

Profile: Fabric spinning, weaving, and textile processing mill in Maharashtra.
Rules: Enforces factory license, Textiles Committee Cess, MPCB Consent to Establish/Operate, EPF, ESI.
Suppresses: CERT-In, DPDP data fiduciary compliance.
"""

from __future__ import annotations

import re
from typing import Any

from common.enums import ApplicabilityStatus
from .base import DemoRequirementItem, DemoScenario


class TextileScenario(DemoScenario):
    scenario_id = "TEXTILE_DEMO"
    name = "Textile Spinning & Weaving Mill (Maharashtra)"
    description = "Textile fabric spinning, dyeing, and processing manufacturing plant."

    def matches(self, business_name: str, context: dict[str, Any]) -> bool:
        desc_parts = [
            business_name,
            str(context.get("product_description") or ""),
            str(context.get("primary_activity") or ""),
            str(context.get("sector") or ""),
        ]
        combined = " ".join(desc_parts).lower()
        return bool(re.search(r"\b(textile|fabric|weaving|spinning|yarn|cotton|apparel mill|garment manufacturing)\b", combined))

    def get_requirements(self, context: dict[str, Any]) -> list[DemoRequirementItem]:
        workers = int(context.get("total_worker_count") or 85)
        return [
            DemoRequirementItem(
                requirement_id="REQ-TEXTILE-COMMITTEE-CESS",
                name="Textiles Committee Statutory Cess & Inspection",
                authority="Textiles Committee, Ministry of Textiles",
                jurisdiction="CENTRAL",
                domain="MANUFACTURING",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory inspection and cess assessment on textiles and textile machinery manufactured in India under Section 5A of the Textiles Committee Act, 1963.",
                why_it_applies="Engaged in manufacturing textiles, fabric, or yarn, attracting mandatory monthly cess returns and quality inspection audit.",
                statutory_act="Textiles Committee Act, 1963 (Section 5A)",
                required_documents=[
                    "Monthly Production and Dispatch Register",
                    "Statutory Form A Cess Return with Sales Invoices",
                    "Certificate of Quality Testing for Export / Domestic Consignments",
                ],
                application_steps=[
                    "Registration with regional Textiles Committee office",
                    "Monthly electronic filing of Form A cess returns",
                    "Payment of statutory cess (0.05% ad valorem)",
                ],
                timeline="Monthly return filing by 10th of following month",
                facts_used=["sector=TEXTILE", "is_manufacturing=True"],
            ),
            DemoRequirementItem(
                requirement_id="REQ-MH-FACTORY-LICENSE",
                name="Maharashtra Factory License (DISH)",
                authority="Directorate of Industrial Safety & Health (DISH Maharashtra)",
                jurisdiction="MAHARASHTRA",
                domain="LABOR",
                status=ApplicabilityStatus.APPLICABLE,
                description="Factory registration and licensing under Section 6 of Factories Act, 1948 and Maharashtra Factories Rules, 1963.",
                why_it_applies=f"Manufacturing plant employs {workers} workers with connected motor machinery.",
                statutory_act="Factories Act, 1948 & Maharashtra Factories Rules, 1963",
                required_documents=[
                    "Factory Layout Drawing and Machinery Schedule (Form 1)",
                    "Stability Certificate signed by Recognized Competent Person",
                    "Online Application Form 2 via DISH portal",
                ],
                application_steps=[
                    "Online plan approval via Aaple Sarkar portal",
                    "Site inspection by Factory Inspector",
                    "Grant of license in Form 4",
                ],
                timeline="Prior to operational commencement",
                facts_used=[f"total_worker_count={workers}", "is_manufacturing=True"],
            ),
            DemoRequirementItem(
                requirement_id="REQ-MPCB-CTE",
                name="MPCB Consent to Establish (CTE)",
                authority="Maharashtra Pollution Control Board (MPCB)",
                jurisdiction="MAHARASHTRA",
                domain="ENVIRONMENT",
                status=ApplicabilityStatus.APPLICABLE,
                description="Consent to Establish under Section 25 of Water Act 1974 and Section 21 of Air Act 1981.",
                why_it_applies="Textile wet processing and dyeing activities generate trade effluent, categorizing the unit under Orange/Red environmental classification.",
                statutory_act="Water Act, 1974 & Air Act, 1981",
                required_documents=["Process Flow Diagram", "Effluent Treatment Plant (ETP) Proposal", "Site Plan"],
                application_steps=["Online application on MPCB e-Consent system", "Technical scrutiny and CAC approval"],
                timeline="Prior to plant setup",
                facts_used=["is_manufacturing=True"],
            ),
            DemoRequirementItem(
                requirement_id="REQ-EPF-REGISTRATION",
                name="Employees' Provident Fund (EPF) Registration",
                authority="Employees' Provident Fund Organisation (EPFO)",
                jurisdiction="CENTRAL",
                domain="LABOR",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory social security registration under EPF & MP Act 1952.",
                why_it_applies=f"Employs {workers} workers, exceeding the 20-employee statutory threshold.",
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
                why_it_applies=f"Factory employs {workers} staff in an implemented ESI industrial area.",
                statutory_act="Employees' State Insurance Act, 1948",
                facts_used=[f"total_worker_count={workers}"],
            ),
            # Suppressed IT mandates
            DemoRequirementItem(
                requirement_id="REQ-CERTIN-CYBERSECURITY-DIRECTIVES",
                name="CERT-In Cybersecurity Incident Reporting",
                authority="Indian Computer Emergency Response Team",
                jurisdiction="CENTRAL",
                domain="CYBERSECURITY",
                status=ApplicabilityStatus.NOT_APPLICABLE,
                description="ICT systems incident reporting.",
                why_it_applies="This requirement is NOT APPLICABLE because a physical textile spinning mill is an industrial manufacturing establishment, not an ICT data intermediary.",
                statutory_act="Information Technology Act, 2000",
                facts_used=["sector=TEXTILE"],
            ),
        ]
