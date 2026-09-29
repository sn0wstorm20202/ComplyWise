"""Scenario 4: CloudAxis Data Centres India Pvt. Ltd.

Location: Hyderabad, Telangana
Profile: Commercial data centre & colocation IT infrastructure facility (~18 MW IT power capacity)
Power & Utilities: 12 standby diesel generator sets (DG sets), dual-redundant UPS systems, chilled water cooling towers, battery rooms
Operations: 24x7 continuous operations, clean-agent fire suppression (Inergen / Novec 1230), physical access logging
Workforce: ~190 direct employees (data centre operations engineers, electrical supervisors) + facility-management contractors
Turnover: Approximately ₹240 Crore

Classification: Commercial data centre / critical IT infrastructure facility
NOT: Ordinary consumer SaaS or software development company.
"""

from __future__ import annotations

import re
from typing import Any

from common.enums import ApplicabilityStatus
from .base import DemoRequirementItem, DemoScenario


class DataCentreScenario(DemoScenario):
    scenario_id = "CLOUDAXIS_DATA_CENTRE_DEMO"
    name = "CloudAxis Data Centres (Critical IT Infrastructure - Telangana)"
    description = "Commercial Tier-III/IV data centre facility in Hyderabad, Telangana."

    def matches(self, business_name: str, context: dict[str, Any]) -> bool:
        name_lower = business_name.lower()
        if "cloudaxis" in name_lower or "cloud axis" in name_lower:
            return True

        desc_parts = [
            business_name,
            str(context.get("product_description") or ""),
            str(context.get("primary_activity") or ""),
            str(context.get("sector") or ""),
        ]
        combined = " ".join(desc_parts).lower()

        is_data_centre = bool(
            re.search(r"\b(data centre|data center|colocation|server farm|it infrastructure facility|hosting infrastructure)\b", combined)
        )
        is_not_plain_saas = not bool(
            re.search(r"\b(saas application|consumer web app|mobile gaming|social media app|edtech platform)\b", combined)
        )

        return is_data_centre and is_not_plain_saas

    def get_requirements(self, context: dict[str, Any]) -> list[DemoRequirementItem]:
        return [
            # 1. Telangana CEIG High Tension Substation Approval
            DemoRequirementItem(
                requirement_id="REQ-TS-CEIG-HT-SUBSTATION",
                name="Telangana CEIG Statutory Approval for HT Substation & Transformers",
                authority="Chief Electrical Inspector to Government (Telangana CEIG)",
                jurisdiction="TELANGANA",
                domain="ELECTRICAL_INFRASTRUCTURE",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory inspection and approval under Central Electricity Authority Regulations for 18 MW High Tension (33kV / 132kV) substation, step-down transformers, and vacuum circuit breakers.",
                why_it_applies="Operating an 18 MW critical power infrastructure facility in Hyderabad requires mandatory pre-commissioning and annual statutory safety inspection by the Chief Electrical Inspector.",
                statutory_act="Central Electricity Authority (Measures relating to Safety and Electric Supply) Regulations, 2023 (Regulation 43 & 44)",
                required_documents=[
                    "Electrical Single Line Diagram (SLD) with dual-feed utility grid redundancy schematics",
                    "Factory Test Certificates for Step-Down Transformers and GIS Switchgear",
                    "Earth Mat Resistance Measurement Reports (< 0.5 Ohm for Data Centre Earth Grid)",
                    "Protective Relay Coordination Study and Relay Setting Schedules",
                ],
                application_steps=[
                    "Submit HT electrical scheme drawings via TS-iPASS / CEIG online portal",
                    "Site inspection by Deputy Chief Electrical Inspector",
                    "Endorsement of charging permission and safety certificate issuance",
                ],
                timeline="Prior to initial grid synchronization / energisation",
                statutory_fee="Statutory inspection fee based on aggregate kVA/MVA transformer capacity",
                facts_used=["power_capacity=18_MW", "operates_high_voltage=True", "state=TELANGANA"],
                evidence_records=[
                    {
                        "evidence_id": "EV-TS-CEIG-REG43",
                        "source_title": "CEA Safety Regulations 2023 — Regulation 43",
                        "authority": "Chief Electrical Inspectorate",
                        "locator": "Regulation 43 — Approval of high and extra-high voltage installations",
                        "excerpt": "No high or extra-high voltage installation shall be connected to the system without inspection and approval in writing of the Electrical Inspector.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://ceig.telangana.gov.in/",
                    }
                ],
            ),

            # 2. PESO Bulk Petroleum Class B Storage License for DG Sets
            DemoRequirementItem(
                requirement_id="REQ-PESO-BULK-DIESEL-STORAGE",
                name="PESO Bulk Diesel Fuel Storage License (Form XIV / Form XV)",
                authority="Petroleum & Explosives Safety Organization (PESO)",
                jurisdiction="CENTRAL",
                domain="SAFETY",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory licence under Petroleum Rules 2002 for bulk storage of Petroleum Class B (High Speed Diesel) in underground / aboveground bulk tanks supporting 12 standby generator sets.",
                why_it_applies="12 large diesel generator sets supporting 18 MW critical IT load require dedicated bulk diesel fuel storage (>50,000 L) ensuring 48-hour continuous runtime under N+1 redundancy.",
                statutory_act="Petroleum Act, 1934 & Petroleum Rules, 2002",
                required_documents=[
                    "Form VII / Form VIII Application to Joint Chief Controller of Explosives",
                    "Fabrication Test Certificates (ASME / IS 2825) for Bulk Fuel Storage Tanks",
                    "Safety Distance Blueprint showing 4.5m / 9m clearances from surrounding buildings",
                    "Automatic Fuel Transfer Pipeline Layout and Leak Detection System Schematics",
                ],
                application_steps=[
                    "Submit tank design and site layout for prior approval by PESO",
                    "Construct double-walled tanks and 110% volume capacity secondary containment dikes",
                    "Site inspection by Controller of Explosives and grant of Form XIV/XV Storage Licence",
                ],
                timeline="Prior to filling bulk fuel storage tanks with commercial diesel",
                statutory_fee="₹10,000 to ₹25,000 based on aggregate kilolitre storage volume",
                facts_used=["dg_set_count=12", "operates_standby_power=True", "power_capacity=18_MW"],
                evidence_records=[
                    {
                        "evidence_id": "EV-PESO-DIESEL-DATA-CENTRE",
                        "source_title": "Petroleum Rules, 2002 — Form XIV & XV",
                        "authority": "Petroleum & Explosives Safety Organization",
                        "locator": "Rule 141 — Licences for storage of petroleum",
                        "excerpt": "A licence in Form XIV or XV may be granted for storage of Petroleum Class B in an installation or in bulk tanks exceeding forty-five thousand litres.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://peso.gov.in/",
                    }
                ],
            ),

            # 3. TSPCB Consent to Operate for DG Sets & Cooling Towers
            DemoRequirementItem(
                requirement_id="REQ-TSPCB-CTO-DG-SETS",
                name="TSPCB Consent to Operate (CTO) for DG Sets & Chiller Cooling Towers",
                authority="Telangana State Pollution Control Board (TSPCB)",
                jurisdiction="TELANGANA",
                domain="ENVIRONMENT",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory Consent to Operate under Section 21 of the Air Act and Section 25 of the Water Act covering air emissions from 12 DG sets and cooling tower bleed water discharge.",
                why_it_applies="Operating 12 high-capacity standby diesel generators and evaporative cooling towers requires stack emission validation (NOx, PM, CO) and acoustic enclosure decibel compliance.",
                statutory_act="Air (Prevention and Control of Pollution) Act, 1981 & Water (Prevention and Control of Pollution) Act, 1974",
                required_documents=[
                    "Form I Combined Consent Application on TSPCB OCMMS portal",
                    "Acoustic Enclosure Insertion Loss Test Certificates (compliance with 75 dB(A) at 1m limit)",
                    "DG Set Stack Height Calculation (H = h + 0.2 * sqrt(kVA)) verification document",
                    "Cooling Tower Blowdown Effluent Quality Report and Neutralization System Schematic",
                ],
                application_steps=[
                    "Submit consolidated CTO application via TS-iPASS single window system",
                    "Physical verification and stack emission sampling by Environmental Engineer, TSPCB",
                    "Board approval and grant of 5-year consolidated Consent to Operate",
                ],
                timeline="Prior to commercial facility commissioning",
                statutory_fee="Prescribed consent fee based on gross capital investment bracket (₹240 Crore tier)",
                facts_used=["state=TELANGANA", "dg_sets=12", "has_cooling_systems=True", "turnover=240_crore"],
                evidence_records=[
                    {
                        "evidence_id": "EV-TSPCB-CTO-DG",
                        "source_title": "Air (Prevention and Control of Pollution) Act, 1981",
                        "authority": "Telangana State Pollution Control Board",
                        "locator": "Section 21 — Restrictions on use of certain industrial plants",
                        "excerpt": "No person shall operate any industrial plant or standby power installation discharging emissions into the atmosphere without previous consent of the State Board.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://tspcb.cpcb.gov.in/",
                    }
                ],
            ),

            # 4. Telangana Fire Services Specialized Data Centre NOC
            DemoRequirementItem(
                requirement_id="REQ-TS-FIRE-NOC-DATA-CENTRE",
                name="Telangana Fire Services High-Hazard Data Centre Fire Clearance",
                authority="Telangana State Disaster Response and Fire Services",
                jurisdiction="TELANGANA",
                domain="SAFETY",
                status=ApplicabilityStatus.APPLICABLE,
                description="Specialized fire safety clearance under Telangana Fire Service Act, 1999 and NBC Part 4 for mission-critical buildings with gaseous fire suppression systems.",
                why_it_applies="Mission-critical server halls, transformer rooms, and battery storage areas require statutory inspection of clean-agent fire suppression systems (Inergen / Novec 1230) and VESDA early warning smoke detection.",
                statutory_act="Telangana Fire Service Act, 1999 & National Building Code of India (Part 4)",
                required_documents=[
                    "Fire Safety Layout Drawing with gas suppression cylinder room schematics",
                    "Very Early Smoke Detection Apparatus (VESDA) layout and calibration reports",
                    "Hydrant system and underground dedicated fire water storage tank certification",
                    "Fire barrier and door 2-hour fire-resistance rating test certificates",
                ],
                application_steps=[
                    "Online submission of architectural fire safety plan through TS-iPASS",
                    "Joint inspection by Regional Fire Officer and electrical safety team",
                    "Issuance of Final Fire No-Objection Certificate",
                ],
                timeline="Prior to building occupancy and server deployment",
                statutory_fee="Statutory fire inspection fee based on total built-up floor area",
                facts_used=["has_fire_suppression=True", "facility_type=data_centre", "state=TELANGANA"],
                evidence_records=[
                    {
                        "evidence_id": "EV-TS-FIRE-NOC-DC",
                        "source_title": "Telangana Fire Service Act, 1999",
                        "authority": "Telangana State Disaster Response and Fire Services",
                        "locator": "Section 13 — Inspection of buildings and issue of fire certificate",
                        "excerpt": "Any building used for hazardous, electronic data processing, or special commercial operations shall obtain a fire clearance certificate before occupancy.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://fire.telangana.gov.in/",
                    }
                ],
            ),

            # 5. CPCB Battery Waste Management EPR
            DemoRequirementItem(
                requirement_id="REQ-CPCB-BATTERY-WASTE-EPR",
                name="CPCB Battery Waste Management Rules Bulk Consumer EPR Authorization",
                authority="Central Pollution Control Board",
                jurisdiction="CENTRAL",
                domain="ENVIRONMENT",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory bulk consumer authorization, annual filing, and authorized recycler disposal under the Battery Waste Management Rules, 2022.",
                why_it_applies="Dual-redundant UPS systems supporting 18 MW IT capacity contain extensive lead-acid and lithium-ion battery arrays requiring statutory lifecycle tracking and recycling handover.",
                statutory_act="Battery Waste Management Rules, 2022 (Rule 4 & Rule 10)",
                required_documents=[
                    "Annual Return in Form II detailing total battery inventory (Metric Tonnes)",
                    "Agreement with CPCB registered battery recycling facilities",
                    "Battery room acid-spill containment and ventilation system specifications",
                ],
                application_steps=[
                    "Online registration as Bulk Consumer on CPCB centralized battery portal",
                    "Annual submission of battery acquisition, replacement, and recycling returns by June 30",
                ],
                timeline="Annual statutory reporting obligation",
                statutory_fee="Nil portal fee for bulk consumer reporting",
                facts_used=["has_battery_rooms=True", "has_ups_systems=True", "power_capacity=18_MW"],
                evidence_records=[
                    {
                        "evidence_id": "EV-CPCB-BWMR-DC",
                        "source_title": "Battery Waste Management Rules, 2022",
                        "authority": "Ministry of Environment, Forest and Climate Change",
                        "locator": "Rule 4 — Responsibilities of Consumer",
                        "excerpt": "Bulk consumers of industrial batteries shall file annual returns of used batteries by 30th day of June of the following financial year on the portal.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://eprbattery.cpcb.gov.in/",
                    }
                ],
            ),

            # 6. CPCB E-Waste Bulk Consumer Mandate
            DemoRequirementItem(
                requirement_id="REQ-CPCB-EWASTE-BULK-CONSUMER",
                name="CPCB E-Waste Management Rules Bulk Consumer Annual Filing",
                authority="Central Pollution Control Board / TSPCB",
                jurisdiction="CENTRAL",
                domain="ENVIRONMENT",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory record maintenance and annual return filing in Form 3 for decommissioned servers, networking switches, storage arrays, and electrical wiring.",
                why_it_applies="Continuous server refreshes and decommissioned customer hardware across 18 MW capacity generate electronic waste requiring disposal only to registered dismantlers.",
                statutory_act="E-Waste (Management) Rules, 2022 (Rule 6)",
                required_documents=[
                    "Form 2 Record Book detailing inventory of decommissioned electrical & electronic equipment",
                    "Form 6 Manifest copies evidencing handover to CPCB-registered EPR recyclers",
                    "Annual Return in Form 3 for submission to State Pollution Control Board",
                ],
                application_steps=[
                    "Maintain real-time asset asset retirement and e-waste register on-site",
                    "Submit annual Form 3 return to TSPCB on or before June 30 every year",
                ],
                timeline="Annual statutory return by June 30",
                statutory_fee="Nil government filing fee",
                facts_used=["colocation_services=True", "hardware_inventory=extensive"],
                evidence_records=[
                    {
                        "evidence_id": "EV-CPCB-EWMR-DC",
                        "source_title": "E-Waste (Management) Rules, 2022",
                        "authority": "Ministry of Environment, Forest and Climate Change",
                        "locator": "Rule 6 — Responsibilities of Bulk Consumer",
                        "excerpt": "Bulk consumers of electrical and electronic equipment shall maintain records in Form 2 and file annual returns in Form 3 on or before the 30th day of June.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://eprewastecpcb.in/",
                    }
                ],
            ),

            # 7. CERT-In Mandatory Cybersecurity Log Retention & Incident Reporting
            DemoRequirementItem(
                requirement_id="REQ-CERT-IN-CYBERSECURITY-LOGS",
                name="CERT-In Directions - 180-Day Log Retention & 6-Hour Incident Reporting",
                authority="Indian Computer Emergency Response Team (CERT-In) / MeitY",
                jurisdiction="CENTRAL",
                domain="CYBERSECURITY",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory obligation under Section 70B of the Information Technology Act to synchronize with NTP servers, maintain 180-day system logs, and report cyber incidents within 6 hours.",
                why_it_applies="Operating commercial data centre infrastructure hosting third-party networks requires secure maintenance of perimeter firewall logs, VPN access logs, and physical access telemetry within Indian territory.",
                statutory_act="Information Technology Act, 2000 (Section 70B) & CERT-In Cybersecurity Directions 2022",
                required_documents=[
                    "NTP Synchronization Architecture Documentation (synchronized with NPL / NIC clocks)",
                    "Data Centre Access & Firewall Log Retention Architecture Document (180-day secure storage)",
                    "Cybersecurity Incident Reporting Standard Operating Procedure (Form Part-I)",
                    "Designated Chief Information Security Officer (CISO) Point of Contact details",
                ],
                application_steps=[
                    "Implement automated log archival with cryptographic integrity verification",
                    "Register designated security officer contact on CERT-In official portal",
                    "Ensure mandatory notification to incident@cert-in.org.in within 6 hours of cyber breach",
                ],
                timeline="Continuous statutory operational mandate",
                statutory_fee="Nil statutory filing fee",
                facts_used=["operates_data_centre=True", "infrastructure_access_logs=True"],
                evidence_records=[
                    {
                        "evidence_id": "EV-CERT-IN-2022",
                        "source_title": "CERT-In Directions under Section 70B(6) of IT Act, 2000",
                        "authority": "Indian Computer Emergency Response Team",
                        "locator": "Paragraph 2(v) & 2(vi) — Log Retention and Incident Reporting",
                        "excerpt": "Data centres and cloud service providers shall mandate 180-day log maintenance within the Indian jurisdiction and report cyber security incidents within 6 hours of noticing.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://www.cert-in.org.in/",
                    }
                ],
            ),

            # 8. Telangana Factories Act / Continuous Operations Exemption
            DemoRequirementItem(
                requirement_id="REQ-TS-FACTORIES-ACT-DATA-CENTRE",
                name="Telangana Factories Act Continuous 24x7 Process Shift Exemption",
                authority="Directorate of Factories / DISH Telangana",
                jurisdiction="TELANGANA",
                domain="LABOR",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory factory registration and continuous process shift-working notification under Section 64/65 of the Factories Act, 1948 allowing 24x7 365-day engineering shift operations.",
                why_it_applies="Data centre electrical substations, HVAC plants, and network operations centers (NOC) require round-the-clock shift staffing with statutory female night work permissions.",
                statutory_act="Factories Act, 1948 & Telangana Factories Rules, 1950",
                required_documents=[
                    "Form 2 Application for Factory License with 24x7 Shift Exemption Schedule",
                    "Approved Factory Architectural & Machinery Blueprint",
                    "Night Shift Transportation & Security Arrangement Protocols for Female Employees",
                    "Staff Shift Roster and Overtime Register",
                ],
                application_steps=[
                    "Online submission via TS-iPASS single window system",
                    "Factory plan scrutiny by Joint Chief Inspector of Factories",
                    "Issuance of Factory Licence endorsed for Continuous Process Operations",
                ],
                timeline="Prior to commercial shift commencement",
                statutory_fee="Statutory factory fee based on connected electrical load (480 kW+ / 18 MW tier)",
                facts_used=["operates_24x7=True", "direct_employees=190", "state=TELANGANA"],
                evidence_records=[
                    {
                        "evidence_id": "EV-TS-DISH-SHIFT-EXEMPT",
                        "source_title": "Telangana Factories Rules, 1950",
                        "authority": "Directorate of Factories, Telangana",
                        "locator": "Rule 84 — Continuous Process Exemption Schedules",
                        "excerpt": "Work on computer server infrastructure and data communications facilities is exempted from daily working hour limits under continuous process conditions.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://ipass.telangana.gov.in/",
                    }
                ],
            ),

            # 9. EPF Registration
            DemoRequirementItem(
                requirement_id="REQ-EPF-REGISTRATION",
                name="Employees' Provident Fund (EPF) Registration",
                authority="Employees' Provident Fund Organisation (EPFO)",
                jurisdiction="CENTRAL",
                domain="LABOR",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory social security provident fund registration under the EPF Act, 1952.",
                why_it_applies="Company employs 190 direct engineering and operational personnel (>20 statutory threshold).",
                statutory_act="Employees' Provident Funds and Miscellaneous Provisions Act, 1952",
                required_documents=[
                    "PAN Card and Certificate of Incorporation",
                    "Proof of Hyderabad Registered Office and Facility Premises",
                    "Monthly wage and salary registers",
                ],
                application_steps=[
                    "Online registration through Unified Shram Suvidha portal",
                    "Instant generation of EPF Establishment Code",
                ],
                timeline="Within 30 days of crossing statutory headcount threshold",
                statutory_fee="Nil government registration fee",
                facts_used=["employees=190"],
                evidence_records=[
                    {
                        "evidence_id": "EV-EPF-CLOUDAXIS",
                        "source_title": "EPF and Miscellaneous Provisions Act, 1952",
                        "authority": "Employees' Provident Fund Organisation",
                        "locator": "Section 1(3)(b)",
                        "excerpt": "This Act applies to every establishment employing twenty or more persons.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://epfindia.gov.in/",
                    }
                ],
            ),

            # 10. ESI Registration
            DemoRequirementItem(
                requirement_id="REQ-ESI-REGISTRATION",
                name="Employees' State Insurance (ESI) Registration",
                authority="Employees' State Insurance Corporation (ESIC)",
                jurisdiction="CENTRAL",
                domain="LABOR",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory social security health insurance coverage under ESI Act, 1948 for eligible technicians and facility support personnel.",
                why_it_applies="Company employs direct operational workforce in Hyderabad (an ESI-implemented district).",
                statutory_act="Employees' State Insurance Act, 1948",
                required_documents=[
                    "PAN Card and Address Proof of the Establishment",
                    "List of employees with date of joining and salary details",
                ],
                application_steps=[
                    "Online registration on ESIC / Shram Suvidha portal",
                    "Generation of 17-digit ESI Employer Code",
                ],
                timeline="Within 15 days of crossing applicability threshold",
                statutory_fee="Nil government registration fee",
                facts_used=["employees=190", "location=Hyderabad"],
                evidence_records=[
                    {
                        "evidence_id": "EV-ESI-CLOUDAXIS",
                        "source_title": "Employees' State Insurance Act, 1948",
                        "authority": "Employees' State Insurance Corporation",
                        "locator": "Section 2(12)",
                        "excerpt": "This Act applies to all establishments where ten or more persons are employed.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://esic.gov.in/",
                    }
                ],
            ),

            # 11. POSH Internal Committee
            DemoRequirementItem(
                requirement_id="REQ-POSH-INTERNAL-COMMITTEE",
                name="Internal Committee for Prevention of Sexual Harassment (POSH)",
                authority="Ministry of Women and Child Development",
                jurisdiction="CENTRAL",
                domain="EMPLOYMENT_SAFETY",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory constitution of an Internal Committee under the Sexual Harassment of Women at Workplace Act, 2013.",
                why_it_applies="Workforce of 190 personnel exceeds the statutory threshold of 10 employees.",
                statutory_act="Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013",
                required_documents=[
                    "Formal Order of IC Constitution signed by Managing Director",
                    "CV and Acceptance Letter of External Independent Woman Member",
                    "Annual POSH Return Form for submission to District Collector, Hyderabad",
                ],
                application_steps=[
                    "Appoint senior woman employee as Presiding Officer",
                    "Appoint minimum two employee members and one independent external member",
                    "Submit annual compliance return to District Officer",
                ],
                timeline="Immediate statutory establishment obligation",
                statutory_fee="Nil government fee",
                facts_used=["employees=190"],
                evidence_records=[
                    {
                        "evidence_id": "EV-POSH-CLOUDAXIS",
                        "source_title": "Sexual Harassment of Women at Workplace Act, 2013",
                        "authority": "Ministry of Women and Child Development",
                        "locator": "Section 4(1)",
                        "excerpt": "Every employer of a workplace shall, by an order in writing, constitute a Committee to be known as the Internal Committee.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://wcd.nic.in/",
                    }
                ],
            ),

            # 12. CGWA Groundwater NOC for Cooling Towers (NEEDS_INFORMATION)
            DemoRequirementItem(
                requirement_id="REQ-CGWA-COOLING-GROUNDWATER",
                name="CGWA Groundwater Extraction NOC for Chiller Cooling Plant",
                authority="Central Ground Water Authority / State Ground Water Dept",
                jurisdiction="CENTRAL",
                domain="ENVIRONMENT",
                status=ApplicabilityStatus.NEEDS_INFORMATION,
                description="Mandatory permission under CGWA guidelines for high-volume groundwater abstraction supporting evaporative cooling chiller towers.",
                why_it_applies="Unresolved whether data centre cooling tower makeup water is supplied exclusively via municipal/industrial utility pipeline (HMWSSB) or extracted from on-site deep borewells.",
                statutory_act="Environment (Protection) Act, 1986 & CGWA Guidelines 2020",
                required_documents=[
                    "Water Balance Diagram detailing cooling tower evaporative loss and blowdown volume",
                    "Hydrogeological Aquifer Yield Report for on-site borewells",
                    "Rainwater Harvesting and Recharge Shaft Construction Plan",
                ],
                application_steps=[
                    "Online application submission on CGWA NOC portal",
                    "Inspection by District Ground Water Officer",
                ],
                timeline="Needs verification (Contingent on cooling water source)",
                statutory_fee="Groundwater abstraction charges per m3 based on category of assessment unit",
                missing_facts=["cooling_water_source", "borewell_extraction_litres_per_day"],
                evidence_records=[
                    {
                        "evidence_id": "EV-CGWA-COOLING",
                        "source_title": "CGWA Guidelines for Ground Water Extraction, 2020",
                        "authority": "Central Ground Water Authority",
                        "locator": "Clause 2.0 — Commercial Entities",
                        "excerpt": "Commercial and industrial infrastructure facilities extracting ground water for cooling systems shall obtain mandatory NOC from CGWA.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://cgwa-noc.gov.in/",
                    }
                ],
            ),

            # 13. DoT IP-1 Infrastructure Provider Registration (NEEDS_INFORMATION)
            DemoRequirementItem(
                requirement_id="REQ-DOT-ODSP-REGISTRATION",
                name="DoT Infrastructure Provider Category-I (IP-1) Registration",
                authority="Department of Telecommunications (DoT)",
                jurisdiction="CENTRAL",
                domain="TELECOM",
                status=ApplicabilityStatus.NEEDS_INFORMATION,
                description="Registration under Section 4 of the Indian Telegraph Act, 1885 for establishing, maintaining, and leasing passive telecom infrastructure (dark fiber, ducts, towers, colocation space).",
                why_it_applies="Unresolved whether the data centre leases dark fiber lines, conduit ducts, and antenna tower space to licensed telecom service providers under an IP-1 registration.",
                statutory_act="Indian Telegraph Act, 1885 & DoT Guidelines for Infrastructure Provider Category-I",
                required_documents=[
                    "Application in prescribed format to Assistant Director General, DoT",
                    "Net Worth Certificate (minimum ₹2.5 Crore) certified by Statutory Auditor",
                    "Memorandum and Articles of Association indicating passive infrastructure leasing",
                ],
                application_steps=[
                    "Online application on Saral Sanchar portal of Department of Telecommunications",
                    "Document verification and scrutiny by DoT Licensing Division",
                    "Issuance of IP-1 Registration Certificate",
                ],
                timeline="Needs verification (Contingent on fiber/duct leasing to external telcos)",
                statutory_fee="₹5,000 application processing fee",
                missing_facts=["leases_dark_fiber_to_telcos", "operates_telecom_ducts"],
                evidence_records=[
                    {
                        "evidence_id": "EV-DOT-IP1",
                        "source_title": "DoT Guidelines for Infrastructure Provider Category-I (IP-1)",
                        "authority": "Department of Telecommunications",
                        "locator": "Paragraph 1 — Scope of IP-1 Registration",
                        "excerpt": "IP-1 registered entities are authorized to establish and maintain passive infrastructure such as Dark Fibres, Right of Way, Duct Space and Towers for leasing to licensees.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://saralsanchar.gov.in/",
                    }
                ],
            ),

            # 14. B2C Consumer Social App / Personal Data Platform (NOT_APPLICABLE)
            DemoRequirementItem(
                requirement_id="REQ-MEITY-DPDP-CONSUMER-PLATFORM",
                name="DPDP Significant Data Fiduciary Mandate for B2C Consumer Platforms",
                authority="Data Protection Board of India / MeitY",
                jurisdiction="CENTRAL",
                domain="DATA_PROTECTION",
                status=ApplicabilityStatus.NOT_APPLICABLE,
                description="Significant Data Fiduciary obligations (child data protections, independent data audits, algorithmic impact assessments) mandatory for high-volume B2C consumer social media platforms.",
                why_it_applies="Not applicable because CloudAxis is a physical colocation and enterprise data centre infrastructure facility, not a consumer social media or retail platform.",
                statutory_act="Digital Personal Data Protection Act, 2023 (Section 10)",
                facts_used=["is_consumer_b2c_platform=False", "business_model=DATA_CENTRE_COLOCATION"],
                evidence_records=[
                    {
                        "evidence_id": "EV-DPDP-SEC10-EXCLUSION",
                        "source_title": "Digital Personal Data Protection Act, 2023 — Section 10",
                        "authority": "Ministry of Electronics & IT",
                        "locator": "Section 10 — Significant Data Fiduciary Classification",
                        "excerpt": "The Central Government may notify any Data Fiduciary as a Significant Data Fiduciary based on volume of personal data processed, risk of harm to Data Principal, and impact on electoral democracy.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://www.meity.gov.in/",
                    }
                ],
            ),

            # 15. FSSAI Central Food License (NOT_APPLICABLE)
            DemoRequirementItem(
                requirement_id="REQ-FSSAI-CENTRAL-LICENCE",
                name="FSSAI Central Food Safety License",
                authority="Food Safety and Standards Authority of India (FSSAI)",
                jurisdiction="CENTRAL",
                domain="FOOD",
                status=ApplicabilityStatus.NOT_APPLICABLE,
                description="Central food manufacturing, storage, and distribution licence under Section 31 of FSS Act, 2006.",
                why_it_applies="Not applicable because operating a mission-critical commercial data centre facility involves zero food, beverage, or nutraceutical operations.",
                statutory_act="Food Safety and Standards Act, 2006 (Section 31)",
                facts_used=["is_food_business=False", "is_data_centre=True"],
                evidence_records=[
                    {
                        "evidence_id": "EV-FSSAI-SEC31-EXCLUSION",
                        "source_title": "Food Safety and Standards Act, 2006",
                        "authority": "Food Safety and Standards Authority of India",
                        "locator": "Section 31 — Licensing and registration of food business",
                        "excerpt": "No person shall commence or carry on any food business except under a licence.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://foscos.fssai.gov.in/",
                    }
                ],
            ),
        ]
