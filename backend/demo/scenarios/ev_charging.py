"""Scenario 1: VoltGrid Mobility Services Pvt. Ltd.

Location: Mumbai, Maharashtra (with charging stations in Mumbai, Pune, Nashik)
Profile: EV charging network operator (85 public EV charging stations, AC + DC fast chargers at malls, offices, petrol stations, highways)
Non-manufacturing: Does NOT manufacture chargers or vehicles. Operates cloud charging-management platform.
Workforce: 64 employees
Customer Data: Processes customer payment information
Contracts: Utility contracts with DISCOMs (MSEDCL, Tata Power, Adani Electricity) and commercial host premises
Turnover: Approximately ₹18 Crore

Classification: EV charging / energy infrastructure operator
NOT: Vehicle manufacturer, charger manufacturer, or generic SaaS.
"""

from __future__ import annotations

import re
from typing import Any

from common.enums import ApplicabilityStatus
from .base import DemoRequirementItem, DemoScenario


class EvChargingScenario(DemoScenario):
    scenario_id = "VOLTGRID_EV_CHARGING_DEMO"
    name = "VoltGrid Mobility Services (EV Charging Operator - Maharashtra)"
    description = "Public EV charging station network operator across Maharashtra."

    def matches(self, business_name: str, context: dict[str, Any]) -> bool:
        name_lower = business_name.lower()
        if "voltgrid" in name_lower or "volt grid" in name_lower:
            return True

        desc_parts = [
            business_name,
            str(context.get("product_description") or ""),
            str(context.get("primary_activity") or ""),
            str(context.get("sector") or ""),
        ]
        combined = " ".join(desc_parts).lower()

        is_ev_charging = bool(
            re.search(r"\b(ev charging|charging station|charging network|public charger|fast charger|charging point)\b", combined)
        )
        is_not_vehicle_mfg = not bool(
            re.search(r"\b(electric vehicle manufacturer|vehicle assembly|oem|car manufacturer|scooter manufacturer)\b", combined)
        )

        return is_ev_charging and is_not_vehicle_mfg

    def get_requirements(self, context: dict[str, Any]) -> list[DemoRequirementItem]:
        return [
            # 1. CEA Technical Standards & Safety Regulations for EV Charging Stations, 2023
            DemoRequirementItem(
                requirement_id="REQ-CEA-EV-SAFETY-STANDARDS",
                name="CEA Safety Standards & Electrical Inspection for EV Charging Stations",
                authority="Central Electricity Authority (CEA) / Chief Electrical Inspectorate",
                jurisdiction="CENTRAL",
                domain="ELECTRICAL_SAFETY",
                status=ApplicabilityStatus.APPLICABLE,
                description="Compliance with CEA (Measures relating to Safety and Electric Supply) Amendment Regulations, 2023 for public EV charging infrastructure.",
                why_it_applies="Operating 85 commercial AC/DC fast charging stations requires mandatory safety interlocks, RCD protection, earth fault detection, and statutory pre-energisation electrical inspection.",
                statutory_act="Central Electricity Authority (Measures relating to Safety and Electric Supply) Regulations, 2023 (Regulation 31A & 31B)",
                required_documents=[
                    "Electrical Single Line Diagram (SLD) signed by Chartered Electrical Engineer",
                    "Earthing Resistance Test Reports (< 1 Ohm) for every station point",
                    "Equipment Test Certificates (Type Approval & Ingress Protection IP54/IP55)",
                    "Emergency Power Disconnect & Surge Protection Device (SPD) Schematic",
                ],
                application_steps=[
                    "Site electrical layout and protection scheme design verification",
                    "Installation of dual-redundant earthing pits and residual current breakers",
                    "Online submission of safety compliance file to State Chief Electrical Inspectorate (CEI)",
                    "Physical safety inspection, energisation certificate issuance, and compliance stamping",
                ],
                timeline="Prior to commercial commissioning of each charging station",
                statutory_fee="₹1,000 to ₹3,500 inspection fee per charging station according to capacity tier",
                facts_used=["operates_ev_charging=True", "station_count=85", "has_fast_chargers=True"],
                evidence_records=[
                    {
                        "evidence_id": "EV-CEA-EV-2023",
                        "source_title": "CEA (Measures relating to Safety and Electric Supply) Amendment Regulations, 2023",
                        "authority": "Central Electricity Authority",
                        "locator": "Regulation 31A — Safety provisions for Electric Vehicle Charging Stations",
                        "excerpt": "Every Electric Vehicle Charging Station shall be inspected and tested by the Electrical Inspector before energisation and periodic inspection shall be carried out annually.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://cea.nic.in/",
                    }
                ],
            ),

            # 2. DISCOM EV Charging Tariff & Connection
            DemoRequirementItem(
                requirement_id="REQ-DISCOM-EV-TARIFF-CONNECTION",
                name="DISCOM Dedicated EV Charging Tariff & HT/LT Power Sanction",
                authority="MSEDCL / Tata Power / MERC",
                jurisdiction="MAHARASHTRA",
                domain="ENERGY_INFRASTRUCTURE",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory power sanction under MERC concessional Electric Vehicle Charging Station (EVCS) tariff category with dedicated metering infrastructure.",
                why_it_applies="Operating commercial public charging hubs across Mumbai, Pune, and Nashik requires dedicated commercial HT/LT connections under MERC Order Case No. 322 of 2019.",
                statutory_act="Maharashtra Electricity Regulatory Commission (MERC) Multi-Year Tariff Regulations & Electricity Act, 2003",
                required_documents=[
                    "Land Lease / Right-of-Way Permission Agreement with Site Host",
                    "Sanctioned Connected Load Application Form for each location",
                    "DISCOM NOC and Metering Compartment Layout Blueprint",
                    "Company PAN Card and Certificate of Incorporation",
                ],
                application_steps=[
                    "Online connection application via MSEDCL / Tata Power distribution portal",
                    "Distribution network feasibility study and load estimation by division engineer",
                    "Payment of service line charges and development charges",
                    "Installation of bidirectional smart meter and commercial tariff activation",
                ],
                timeline="30-45 working days per station installation",
                statutory_fee="Prescribed DISCOM service connection deposit based on contracted kVA load",
                facts_used=["state=MAHARASHTRA", "locations=['Mumbai', 'Pune', 'Nashik']", "connected_to_grid=True"],
                evidence_records=[
                    {
                        "evidence_id": "EV-MERC-EVCS-TARIFF",
                        "source_title": "MERC Tariff Order for Public EV Charging Stations",
                        "authority": "Maharashtra Electricity Regulatory Commission",
                        "locator": "MERC Rate Schedule — Public EV Charging Stations Category",
                        "excerpt": "A dedicated concessional tariff category is established for public EV charging stations without cross-subsidy surcharge on green power procurement.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://www.mahadiscom.in/",
                    }
                ],
            ),

            # 3. Municipal Corporation Public Charging NOC
            DemoRequirementItem(
                requirement_id="REQ-MUNICIPAL-PUBLIC-CHARGING-NOC",
                name="Municipal Corporation Trade Permission & Public Charging NOC",
                authority="MCGM (Mumbai) / PMC (Pune) / NMC (Nashik)",
                jurisdiction="MAHARASHTRA",
                domain="LOCAL_GOVERNANCE",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory municipal permission and right-of-way NOC under Section 390 of the MMC Act for public utility installations on commercial premises.",
                why_it_applies="Stations installed at shopping malls, commercial plazas, and public highways require municipal clearance to ensure non-obstruction of public vehicular right-of-way.",
                statutory_act="Mumbai Municipal Corporation (MMC) Act, 1888 & Maharashtra Municipal Corporations Act",
                required_documents=[
                    "Host Property No-Objection Certificate (NOC) and Registered Lease Deed",
                    "Station Site Plan detailing ingress/egress and fire-engine driveway clearance",
                    "Property Tax clearance receipt of the host commercial establishment",
                    "Electrical Safety Layout Drawing",
                ],
                application_steps=[
                    "Submission of public charging station installation intimation on municipal portal",
                    "Ward-level inspection for fire tender movement and traffic safety",
                    "Issuance of Municipal Trade Permission / Structural NOC",
                ],
                timeline="21 working days per municipal jurisdiction",
                statutory_fee="Annual trade license fee per municipal schedule",
                facts_used=["public_accessible_stations=85", "host_premises=['malls', 'offices', 'highways']"],
                evidence_records=[
                    {
                        "evidence_id": "EV-MCGM-EV-NOC",
                        "source_title": "MCGM Guidelines for Public EV Charging Infrastructure",
                        "authority": "Municipal Corporation of Greater Mumbai",
                        "locator": "Circular No. MCGM/B&F/EV/2022",
                        "excerpt": "Installation of public EV chargers in malls and parking lots requires intimation and municipal right-of-way safety clearance.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://portal.mcgm.gov.in/",
                    }
                ],
            ),

            # 4. PESO Petrol Pump Co-location Clearance
            DemoRequirementItem(
                requirement_id="REQ-PESO-PETROL-PUMP-CHARGER-NOC",
                name="PESO Clearance for EV Chargers within Retail Petroleum Outlets",
                authority="Petroleum & Explosives Safety Organization (PESO)",
                jurisdiction="CENTRAL",
                domain="SAFETY",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory safety clearance and hazardous area zone classification under Petroleum Rules 2002 for EV charging points installed at petrol pumps.",
                why_it_applies="Charging stations installed at operational petrol stations must maintain statutory safety setback distances (minimum 6 metres from fuel dispensers and 15 metres from vent pipes).",
                statutory_act="Petroleum Act, 1934 & Petroleum Rules, 2002",
                required_documents=[
                    "Retail Outlet Hazardous Area Classification Layout Drawing (Zone 1 / Zone 2 boundaries)",
                    "Flameproof / Weatherproof Certification for electrical switchgear adjacent to forecourt",
                    "Oil Marketing Company (OMC) Joint Safety Audit Report",
                    "Automatic Safety Isolation & Emergency Stop Interlock Schematic",
                ],
                application_steps=[
                    "Joint site survey with retail petroleum licensee (OMC) and PESO technical team",
                    "Submission of amended station layout drawing via PESO online portal",
                    "Physical inspection by Controller of Explosives and statutory endorsement",
                ],
                timeline="30-45 days for petrol pump co-located charging bays",
                statutory_fee="₹2,000 layout endorsement fee per retail outlet",
                facts_used=["chargers_installed_at_petrol_stations=True"],
                evidence_records=[
                    {
                        "evidence_id": "EV-PESO-EV-GUIDELINES",
                        "source_title": "PESO Safety Guidelines for EV Charging at Retail Outlets",
                        "authority": "Petroleum & Explosives Safety Organization",
                        "locator": "Notification No. R.4(2)108/EV/2021",
                        "excerpt": "Electric vehicle charging points shall be located beyond the hazardous area Zone 2 and shall not obstruct hazardous petroleum dispensing activities.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://peso.gov.in/",
                    }
                ],
            ),

            # 5. DPDP Act & Payment Data Compliance
            DemoRequirementItem(
                requirement_id="REQ-DPDP-CUSTOMER-PAYMENT-DATA",
                name="DPDP Act & RBI Payment Aggregator Tokenization Compliance",
                authority="Data Protection Board of India / MeitY / RBI",
                jurisdiction="CENTRAL",
                domain="DATA_PROTECTION",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory obligations as Data Fiduciary under DPDP Act 2023 and RBI guidelines on card-on-file tokenization for charging session payments.",
                why_it_applies="Cloud charging-management platform collects user location data, vehicle registration numbers, credit/debit card payment details, and charging session telemetry.",
                statutory_act="Digital Personal Data Protection Act, 2023 & RBI Guidelines on Payment Aggregators (PA/PG)",
                required_documents=[
                    "Platform Privacy Policy & Customer Consent Architecture Notice",
                    "PCI-DSS Level 1 / Level 2 Compliance Certificate from Cert-In empanelled auditor",
                    "Data Protection Impact Assessment (DPIA) for Mobile App & Cloud Telemetry",
                    "Data Breach Incident Response Plan and Redressal Mechanism",
                ],
                application_steps=[
                    "Implementation of purpose-limited customer consent on mobile charging app",
                    "Implementation of card tokenization avoiding raw card data retention",
                    "Appointment of Data Protection Officer (DPO) and grievance redressal mechanism",
                ],
                timeline="Continuous statutory operational obligation",
                statutory_fee="Statutory audit and penetration testing fees",
                facts_used=["operates_cloud_platform=True", "collects_customer_payment_info=True"],
                evidence_records=[
                    {
                        "evidence_id": "EV-DPDP-SEC8",
                        "source_title": "Digital Personal Data Protection Act, 2023",
                        "authority": "Ministry of Electronics & IT",
                        "locator": "Section 8 — General obligations of Data Fiduciary",
                        "excerpt": "A Data Fiduciary shall implement appropriate technical and organisational measures to ensure compliance with this Act and protect personal data in its possession.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://www.meity.gov.in/content/digital-personal-data-protection-act-2023",
                    }
                ],
            ),

            # 6. Maharashtra Shops & Establishments
            DemoRequirementItem(
                requirement_id="REQ-MAHA-SHOPS-ESTABLISHMENT",
                name="Maharashtra Shops & Commercial Establishments Registration",
                authority="Department of Labour, Maharashtra",
                jurisdiction="MAHARASHTRA",
                domain="COMMERCIAL_REGISTRATION",
                status=ApplicabilityStatus.APPLICABLE,
                description="Registration of central operations office and regional network control centers under Maharashtra Shops & Establishments Act 2017.",
                why_it_applies="Operating commercial office premises and network monitoring centers in Mumbai with 64 employees requires statutory registration.",
                statutory_act="Maharashtra Shops and Establishments (Regulation of Employment and Conditions of Service) Act, 2017",
                required_documents=[
                    "Certificate of Incorporation and Memorandum of Association",
                    "Premises Lease Agreement and Electricity Bill",
                    "List of Employees with designations and wage registers",
                ],
                application_steps=[
                    "Online registration submission on Aaple Sarkar portal",
                    "Self-declaration and fee payment",
                    "Electronic issuance of Form F Registration Certificate",
                ],
                timeline="Within 60 days of commencing commercial operations (Immediate online issuance)",
                statutory_fee="₹1,000 to ₹5,000 based on workforce headcount",
                facts_used=["state=MAHARASHTRA", "headquarters=Mumbai", "employees=64"],
                evidence_records=[
                    {
                        "evidence_id": "EV-MH-SHOPS-ACT",
                        "source_title": "Maharashtra Shops and Establishments Act, 2017",
                        "authority": "Department of Labour, Maharashtra",
                        "locator": "Section 6 — Registration of Establishments",
                        "excerpt": "Every employer of an establishment employing ten or more workers shall apply for registration in the prescribed form within sixty days.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://lms.mahaonline.gov.in/",
                    }
                ],
            ),

            # 7. EPF Registration
            DemoRequirementItem(
                requirement_id="REQ-EPF-REGISTRATION",
                name="Employees' Provident Fund (EPF) Registration",
                authority="Employees' Provident Fund Organisation (EPFO)",
                jurisdiction="CENTRAL",
                domain="LABOR",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory social security provident fund registration under the Employees' Provident Funds and Miscellaneous Provisions Act, 1952.",
                why_it_applies="Company employs 64 personnel, exceeding the statutory 20-employee threshold.",
                statutory_act="Employees' Provident Funds and Miscellaneous Provisions Act, 1952",
                required_documents=[
                    "PAN Card and Certificate of Incorporation",
                    "Bank Account Statement with pre-printed corporate name",
                    "Monthly wage register showing salary details of 64 employees",
                ],
                application_steps=[
                    "Online registration through Unified Shram Suvidha Portal",
                    "Electronic verification via Digital Signature Certificate (DSC)",
                    "Instant generation of EPF Establishment Code",
                ],
                timeline="Within 30 days of crossing 20 employees (Immediate online issuance)",
                statutory_fee="Nil government registration fee",
                facts_used=["employees=64"],
                evidence_records=[
                    {
                        "evidence_id": "EV-EPFO-SEC1",
                        "source_title": "EPF and Miscellaneous Provisions Act, 1952",
                        "authority": "Employees' Provident Fund Organisation",
                        "locator": "Section 1(3)(b)",
                        "excerpt": "This Act applies to every establishment employing twenty or more persons.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://epfindia.gov.in/",
                    }
                ],
            ),

            # 8. ESI Registration
            DemoRequirementItem(
                requirement_id="REQ-ESI-REGISTRATION",
                name="Employees' State Insurance (ESI) Registration",
                authority="Employees' State Insurance Corporation (ESIC)",
                jurisdiction="CENTRAL",
                domain="LABOR",
                status=ApplicabilityStatus.APPLICABLE,
                description="Social security and health insurance coverage under the Employees' State Insurance Act, 1948 for employees with monthly wages up to ₹21,000.",
                why_it_applies="Workforce of 64 field technicians, maintenance staff, and support engineers operates in an ESI-notified district (Mumbai/Pune/Nashik).",
                statutory_act="Employees' State Insurance Act, 1948",
                required_documents=[
                    "PAN Card and Address Proof of the Establishment",
                    "List of employees with date of joining and gross salary breakdown",
                    "Corporate Bank Account Details",
                ],
                application_steps=[
                    "Online establishment registration on ESIC / Shram Suvidha portal",
                    "DSC authentication by designated Director",
                    "Generation of 17-digit ESI Employer Code",
                ],
                timeline="Within 15 days of crossing applicability threshold (Immediate online issuance)",
                statutory_fee="Nil government registration fee",
                facts_used=["employees=64", "locations=['Mumbai', 'Pune', 'Nashik']"],
                evidence_records=[
                    {
                        "evidence_id": "EV-ESIC-SEC2",
                        "source_title": "Employees' State Insurance Act, 1948",
                        "authority": "Employees' State Insurance Corporation",
                        "locator": "Section 2(12)",
                        "excerpt": "This Act applies to all establishments where ten or more persons are employed.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://esic.gov.in/",
                    }
                ],
            ),

            # 9. POSH Internal Committee
            DemoRequirementItem(
                requirement_id="REQ-POSH-INTERNAL-COMMITTEE",
                name="Internal Committee for Prevention of Sexual Harassment (POSH)",
                authority="Ministry of Women and Child Development",
                jurisdiction="CENTRAL",
                domain="EMPLOYMENT_SAFETY",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory constitution of an Internal Committee (IC) under the Sexual Harassment of Women at Workplace Act, 2013.",
                why_it_applies="Company employs 64 staff, exceeding the statutory minimum of 10 employees.",
                statutory_act="Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013",
                required_documents=[
                    "Formal Order of IC Constitution signed by Managing Director",
                    "CV and Acceptance Letter of External Independent Woman Member",
                    "Annual POSH Return Form for submission to District Officer",
                ],
                application_steps=[
                    "Appoint senior woman employee as Presiding Officer",
                    "Appoint minimum two employee members and one independent external member",
                    "File annual compliance report with the District Officer by January 31",
                ],
                timeline="Immediate statutory establishment obligation",
                statutory_fee="Nil government fee",
                facts_used=["employees=64"],
                evidence_records=[
                    {
                        "evidence_id": "EV-POSH-SEC4",
                        "source_title": "Sexual Harassment of Women at Workplace Act, 2013",
                        "authority": "Ministry of Women and Child Development",
                        "locator": "Section 4(1)",
                        "excerpt": "Every employer of a workplace shall, by an order in writing, constitute a Committee to be known as the Internal Committee.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://wcd.nic.in/",
                    }
                ],
            ),

            # 10. CEIG Substation Inspection (NEEDS_INFORMATION)
            DemoRequirementItem(
                requirement_id="REQ-CEIG-SUBSTATION-INSPECTION",
                name="CEIG Statutory Approval for Dedicated HT Substation / Transformers",
                authority="Chief Electrical Inspector to Government (CEIG)",
                jurisdiction="MAHARASHTRA",
                domain="ELECTRICAL_SAFETY",
                status=ApplicabilityStatus.NEEDS_INFORMATION,
                description="Statutory inspection and approval under Central Electricity Authority Regulations for dedicated step-down transformers (>33 kV / 11 kV) installed at highway high-capacity charging hubs.",
                why_it_applies="Unresolved whether high-capacity highway hubs operate dedicated captive distribution transformers or draw standard low-tension commercial power from the local distribution utility.",
                statutory_act="Central Electricity Authority (Measures relating to Safety and Electric Supply) Regulations, 2023 (Regulation 43)",
                required_documents=[
                    "Transformer Test Certificates (IS 2026/IS 1180)",
                    "Substation earthing layout drawings",
                ],
                application_steps=[
                    "Submit formal application to CEIG Maharashtra",
                    "Site inspection by Electrical Inspector",
                ],
                timeline="Needs verification (Contingent on transformer ownership status)",
                statutory_fee="₹5,000 to ₹15,000 per transformer based on kVA rating",
                missing_facts=["owns_dedicated_transformers", "transformer_capacity_kva"],
                evidence_records=[
                    {
                        "evidence_id": "EV-CEIG-RULE43",
                        "source_title": "CEA Safety Regulations 2023 — Regulation 43",
                        "authority": "Chief Electrical Inspectorate",
                        "locator": "Regulation 43 — Approval of high and extra-high voltage installations",
                        "excerpt": "No high or extra-high voltage installation shall be commissioned without statutory inspection and approval in writing of the Electrical Inspector.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://cei.maharashtra.gov.in/",
                    }
                ],
            ),

            # 11. Battery Energy Storage System Authorization (NEEDS_INFORMATION)
            DemoRequirementItem(
                requirement_id="REQ-CPCB-BATTERY-WASTE-BESS",
                name="CPCB Battery Waste Management Authorization for BESS",
                authority="Central Pollution Control Board",
                jurisdiction="CENTRAL",
                domain="ENVIRONMENT",
                status=ApplicabilityStatus.NEEDS_INFORMATION,
                description="Bulk consumer EPR authorization under Battery Waste Management Rules, 2022 if Battery Energy Storage Systems (BESS) are co-located at charging stations for peak-load shaving.",
                why_it_applies="Unresolved whether fast-charging highway stations incorporate stationary battery storage arrays for buffering grid power.",
                statutory_act="Battery Waste Management Rules, 2022 (Rule 4 & Rule 10)",
                required_documents=[
                    "Battery pack manufacturer and chemistry specifications",
                    "Annual recycling return declaration",
                ],
                application_steps=[
                    "Online registration on CPCB centralized battery portal",
                ],
                timeline="Needs verification (Contingent on stationary battery buffer usage)",
                statutory_fee="Statutory registration fee per CPCB schedule",
                missing_facts=["has_co_located_battery_storage", "battery_chemistry_bess"],
                evidence_records=[
                    {
                        "evidence_id": "EV-CPCB-BWMR-2022",
                        "source_title": "Battery Waste Management Rules, 2022",
                        "authority": "Ministry of Environment, Forest and Climate Change",
                        "locator": "Rule 4 — Responsibilities of Consumer",
                        "excerpt": "Bulk consumers of industrial batteries shall ensure that used batteries are handed over only to registered entities and annual returns are filed.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://eprbattery.cpcb.gov.in/",
                    }
                ],
            ),

            # 12. CMVR Vehicle Type Approval (NOT_APPLICABLE)
            DemoRequirementItem(
                requirement_id="REQ-CMVR-TYPE-APPROVAL-VEHICLE",
                name="CMVR / AIS Type Approval for Electric Vehicle Manufacturing",
                authority="Automotive Research Association of India (ARAI) / MoRTH",
                jurisdiction="CENTRAL",
                domain="AUTOMOTIVE_STANDARDS",
                status=ApplicabilityStatus.NOT_APPLICABLE,
                description="Mandatory vehicle homologation, safety crash testing, and AIS-038/AIS-156 type approval under Central Motor Vehicles Rules.",
                why_it_applies="Not applicable because VoltGrid is an EV charging infrastructure operator and does not manufacture or assemble electric vehicles.",
                statutory_act="Central Motor Vehicles Rules, 1989 (Rule 126)",
                facts_used=["is_vehicle_manufacturer=False", "business_model=EV_CHARGING_OPERATOR"],
                evidence_records=[
                    {
                        "evidence_id": "EV-CMVR-RULE126",
                        "source_title": "Central Motor Vehicles Rules, 1989",
                        "authority": "Ministry of Road Transport and Highways",
                        "locator": "Rule 126 — Prototype testing of motor vehicles",
                        "excerpt": "Every manufacturer of a motor vehicle shall submit the prototype to a testing agency specified by the Central Government.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://morth.nic.in/",
                    }
                ],
            ),

            # 13. BIS CRS EV Charger Manufacturing (NOT_APPLICABLE)
            DemoRequirementItem(
                requirement_id="REQ-BIS-CRS-EV-CHARGER-MFG",
                name="BIS Compulsory Registration Scheme (CRS) for EV Charger Manufacturing",
                authority="Bureau of Indian Standards",
                jurisdiction="CENTRAL",
                domain="STANDARDS",
                status=ApplicabilityStatus.NOT_APPLICABLE,
                description="Factory certification and laboratory test conformity (IS 17017 Part 1 & Part 21) mandatory for entities manufacturing EV supply equipment.",
                why_it_applies="Not applicable because VoltGrid procures certified commercial chargers from third-party OEMs and does not manufacture electrical charging hardware.",
                statutory_act="Bureau of Indian Standards Act, 2016 & Electronics & IT Goods (Compulsory Registration) Order",
                facts_used=["is_charger_manufacturer=False", "procures_certified_hardware=True"],
                evidence_records=[
                    {
                        "evidence_id": "EV-BIS-IS17017",
                        "source_title": "IS 17017 (Part 1): Electric Vehicle Conductive Charging System",
                        "authority": "Bureau of Indian Standards",
                        "locator": "Clause 1 — Scope of manufacturing standard",
                        "excerpt": "This standard applies to EV supply equipment for charging electric road vehicles manufactured for commercial sale.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://bis.gov.in/",
                    }
                ],
            ),

            # 14. MPCB Factory Consent to Operate (NOT_APPLICABLE)
            DemoRequirementItem(
                requirement_id="REQ-MPCB-CTO-FACTORY",
                name="MPCB Industrial Consent to Operate (Factory Manufacturing)",
                authority="Maharashtra Pollution Control Board",
                jurisdiction="MAHARASHTRA",
                domain="ENVIRONMENT",
                status=ApplicabilityStatus.NOT_APPLICABLE,
                description="Industrial pollution consent under Water and Air Acts required for operating industrial factories, boilers, or chemical effluent units.",
                why_it_applies="Not applicable because operating public electric vehicle charging stations is classified under White Category / non-polluting infrastructure exempted from industrial manufacturing consents.",
                statutory_act="Water (Prevention and Control of Pollution) Act, 1974 & Air (Prevention and Control of Pollution) Act, 1981",
                facts_used=["is_manufacturing=False", "is_industrial_factory=False"],
                evidence_records=[
                    {
                        "evidence_id": "EV-MPCB-WHITE-CAT",
                        "source_title": "CPCB Harmonized Classification of Industrial Sectors",
                        "authority": "Central Pollution Control Board",
                        "locator": "White Category Schedule",
                        "excerpt": "Electric vehicle charging stations are non-polluting commercial utilities categorized under White Category not requiring Consent to Establish/Operate.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://ecmpcb.mpcb.gov.in/",
                    }
                ],
            ),
        ]
