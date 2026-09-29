"""Demo Scenario: B2B SaaS / Digital Software Platform.

Profile: Pure software, web application, cloud infrastructure, no physical manufacturing.
Rules: Enforces digital data protection (DPDP), CERT-In directives, POSH, EPF.
Suppresses: All factory licences, pollution control CTE/CTO, boilers, mining, hazardous waste.
"""

from __future__ import annotations

import re
from typing import Any

from common.enums import ApplicabilityStatus
from .base import DemoRequirementItem, DemoScenario


class SaasScenario(DemoScenario):
    scenario_id = "SAAS_DEMO"
    name = "B2B SaaS / Cloud Software Platform"
    description = "Cloud-based software, web application, or digital IT services platform."

    def matches(self, business_name: str, context: dict[str, Any]) -> bool:
        desc_parts = [
            business_name,
            str(context.get("product_description") or ""),
            str(context.get("primary_activity") or ""),
            str(context.get("sector") or ""),
        ]
        combined = " ".join(desc_parts).lower()

        is_software = bool(
            re.search(r"\b(saas|software|platform|app|web|digital|cloud|b2b saas|it services|analytics)\b", combined)
        )
        is_mfg = bool(
            re.search(r"\b(manufacturing|factory|hardware|plant|assembly|chemical|textile|pharma)\b", combined)
        )
        return is_software and not is_mfg

    def get_requirements(self, context: dict[str, Any]) -> list[DemoRequirementItem]:
        workers = int(context.get("total_worker_count") or 25)
        return [
            # 1. DPDP Compliance
            DemoRequirementItem(
                requirement_id="REQ-DPDP-DATA-FIDUCIARY-COMPLIANCE",
                name="Digital Personal Data Protection (DPDP) Compliance",
                authority="Data Protection Board of India / MeitY",
                jurisdiction="CENTRAL",
                domain="DIGITAL_DATA_PROTECTION",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory obligations of a Data Fiduciary processing personal digital data under the Digital Personal Data Protection Act, 2023.",
                why_it_applies="As a digital SaaS platform processing customer identity, usage records, and user data in digital form, the entity operates as a statutory Data Fiduciary.",
                statutory_act="Digital Personal Data Protection Act, 2023",
                required_documents=[
                    "Data Privacy Policy and Notice in English and 22 Scheduled Languages",
                    "Consent Management Architecture Specification",
                    "Data Protection Officer (DPO) Appointment Charter",
                    "Data Breach Response and Notification Standard Operating Procedure",
                ],
                application_steps=[
                    "Publish clear, itemized notice before obtaining personal data consent",
                    "Deploy verifiable consent management mechanism with withdrawal capability",
                    "Designate Data Protection Officer based in India for user grievance redressal",
                    "Implement reasonable security safeguards to prevent personal data breaches",
                ],
                timeline="Continuous statutory compliance obligation",
                statutory_fee="Nil",
                facts_used=["business_type=SaaS", "is_manufacturing=False"],
                evidence_records=[
                    {
                        "evidence_id": "EV-DPDP-ACT-2023",
                        "source_title": "Digital Personal Data Protection Act, 2023",
                        "authority": "Ministry of Electronics and Information Technology",
                        "locator": "Section 4 & Section 8",
                        "excerpt": "A Data Fiduciary shall be responsible for complying with the provisions of this Act in respect of any processing undertaken by it or on its behalf.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://www.meity.gov.in/",
                    }
                ],
            ),

            # 2. CERT-In Directives
            DemoRequirementItem(
                requirement_id="REQ-CERTIN-CYBERSECURITY-DIRECTIVES",
                name="CERT-In Cybersecurity Incident Reporting & Log Retention",
                authority="Indian Computer Emergency Response Team (CERT-In)",
                jurisdiction="CENTRAL",
                domain="CYBERSECURITY",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory 6-hour cybersecurity incident reporting and 180-day ICT system log retention under Section 70B of the Information Technology Act, 2000.",
                why_it_applies="Operating cloud applications, virtual servers, and databases in India requires mandatory system log retention and prompt cybersecurity reporting.",
                statutory_act="Information Technology Act, 2000 (Section 70B & CERT-In Directions 2022)",
                required_documents=[
                    "Cyber Incident Management Protocol and 6-hour Reporting Template",
                    "NTP Server Synchronization Architecture Document",
                    "System and ICT Log Retention Policy (180 days domestic retention)",
                ],
                application_steps=[
                    "Configure all cloud server clocks to synchronize with National Physical Laboratory NTP",
                    "Maintain secure, rolling 180-day system and application access logs",
                    "Designate incident reporting coordinator for CERT-In communications",
                ],
                timeline="Continuous statutory operating requirement",
                statutory_fee="Nil",
                facts_used=["business_type=SaaS"],
                evidence_records=[
                    {
                        "evidence_id": "EV-CERT-IN-DIR-2022",
                        "source_title": "CERT-In Directions under Section 70B of IT Act",
                        "authority": "Indian Computer Emergency Response Team",
                        "locator": "Direction No. 20(3)/2022-CERT-In",
                        "excerpt": "Any service provider, intermediaries, data centres, body corporate and Government organisations shall mandatorily report cyber incidents to CERT-In within 6 hours of noticing such incidents.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://www.cert-in.org.in/",
                    }
                ],
            ),

            # 3. POSH Internal Committee
            DemoRequirementItem(
                requirement_id="REQ-POSH-INTERNAL-COMMITTEE",
                name="Internal Committee for Prevention of Sexual Harassment at Workplace (POSH)",
                authority="Appropriate Government under POSH Act, 2013",
                jurisdiction="CENTRAL",
                domain="EMPLOYMENT_SAFETY",
                status=ApplicabilityStatus.APPLICABLE if workers >= 10 else ApplicabilityStatus.NOT_APPLICABLE,
                description="Mandatory constitution of Internal Committee for establishments employing 10 or more individuals.",
                why_it_applies=f"Establishment employs {workers} staff members, exceeding the statutory 10-person threshold under POSH Act.",
                statutory_act="Sexual Harassment of Women at Workplace Act, 2013",
                required_documents=[
                    "Formal Order Constituting the Internal Committee (IC)",
                    "Appointment and Consent Letter of Independent External Member",
                    "Company Prevention of Sexual Harassment Policy Document",
                ],
                application_steps=[
                    "Executive order appointing Presiding Officer and internal members",
                    "Engagement of qualified external member from legal/NGO background",
                    "Display of policy and filing annual compliance return",
                ],
                timeline="Immediate requirement",
                statutory_fee="Nil",
                facts_used=[f"total_worker_count={workers}"],
            ),

            # 4. EPF Registration
            DemoRequirementItem(
                requirement_id="REQ-EPF-REGISTRATION",
                name="Employees' Provident Fund (EPF) Registration",
                authority="Employees' Provident Fund Organisation (EPFO)",
                jurisdiction="CENTRAL",
                domain="LABOR",
                status=ApplicabilityStatus.APPLICABLE if workers >= 20 else ApplicabilityStatus.NOT_APPLICABLE,
                description="Statutory social security coverage under Section 1(3) of EPF & MP Act, 1952.",
                why_it_applies=f"Employs {workers} workers, {'exceeding' if workers >= 20 else 'below'} the statutory 20-employee threshold.",
                statutory_act="Employees' Provident Funds and Miscellaneous Provisions Act, 1952",
                facts_used=[f"total_worker_count={workers}"],
            ),

            # 5. Suppressed Industrial Mandates (NOT_APPLICABLE for SaaS)
            DemoRequirementItem(
                requirement_id="REQ-TS-FACTORY-LICENSE",
                name="Factory License (Industrial Premises)",
                authority="Directorate of Factories",
                jurisdiction="STATE",
                domain="MANUFACTURING",
                status=ApplicabilityStatus.NOT_APPLICABLE,
                description="Factory operating license under the Factories Act, 1948.",
                why_it_applies="This requirement is NOT APPLICABLE because a digital SaaS company does not carry out physical manufacturing with power.",
                statutory_act="Factories Act, 1948",
                facts_used=["is_manufacturing=False"],
            ),
            DemoRequirementItem(
                requirement_id="REQ-TSPCB-CTE",
                name="Pollution Control Consent to Establish (CTE)",
                authority="State Pollution Control Board",
                jurisdiction="STATE",
                domain="ENVIRONMENT",
                status=ApplicabilityStatus.NOT_APPLICABLE,
                description="Industrial environmental clearance under Water and Air Acts.",
                why_it_applies="This requirement is NOT APPLICABLE because digital software development produces no industrial wastewater or stack air emissions.",
                statutory_act="Water Act, 1974 & Air Act, 1981",
                facts_used=["is_manufacturing=False"],
            ),
        ]
