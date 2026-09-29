"""Scenario 2: ApexBuild Infrastructure Pvt. Ltd.

Location: Jaipur, Rajasthan (3 active construction sites across Rajasthan)
Profile: Civil construction and infrastructure contractor (commercial buildings, industrial sheds, roads, government infrastructure)
Workforce: 280 employees (permanent site engineers + contract workers and inter-state migrant labour)
Equipment: Excavators, cranes, concrete mixers, transit mixers, earthmovers
Operations: Subcontractor management, on-site bulk diesel storage, temporary electrical installations, significant material procurement
Turnover: Approximately ₹95 Crore

Classification: Construction / infrastructure contractor
NOT: Factory / industrial manufacturing merely because heavy machinery exists.
"""

from __future__ import annotations

import re
from typing import Any

from common.enums import ApplicabilityStatus
from .base import DemoRequirementItem, DemoScenario


class ConstructionScenario(DemoScenario):
    scenario_id = "APEXBUILD_CONSTRUCTION_DEMO"
    name = "ApexBuild Infrastructure (Construction Contractor - Rajasthan)"
    description = "Civil construction and infrastructure contractor across Rajasthan."

    def matches(self, business_name: str, context: dict[str, Any]) -> bool:
        name_lower = business_name.lower()
        if "apexbuild" in name_lower or "apex build" in name_lower:
            return True

        desc_parts = [
            business_name,
            str(context.get("product_description") or ""),
            str(context.get("primary_activity") or ""),
            str(context.get("sector") or ""),
        ]
        combined = " ".join(desc_parts).lower()

        is_construction = bool(
            re.search(r"\b(civil construction|infrastructure contractor|building contractor|construction site|commercial buildings|road construction)\b", combined)
        )
        is_not_permanent_factory = not bool(
            re.search(r"\b(cement factory|brick kiln manufacturing|steel rolling mill|equipment manufacturing plant)\b", combined)
        )

        return is_construction and is_not_permanent_factory

    def get_requirements(self, context: dict[str, Any]) -> list[DemoRequirementItem]:
        return [
            # 1. BOCW Act Site Registration
            DemoRequirementItem(
                requirement_id="REQ-BOCW-REGISTRATION",
                name="BOCW Act Construction Site Establishment Registration",
                authority="Rajasthan Department of Labour / BOCW Board",
                jurisdiction="RAJASTHAN",
                domain="CONSTRUCTION_SAFETY",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory registration of each active construction site employing 10 or more building workers under Section 7 of the BOCW Act, 1996.",
                why_it_applies="ApexBuild operates 3 active construction project sites in Rajasthan employing 280 workers, requiring individual establishment registration with the statutory Registering Officer.",
                statutory_act="Building and Other Construction Workers (Regulation of Employment and Conditions of Service) Act, 1996",
                required_documents=[
                    "Form I Application for Registration of Establishment",
                    "Principal Contractor Work Award Agreement & Estimated Construction Cost Schedule",
                    "List of Building Workers with designations, trade categories, and wages",
                    "Site Safety Plan, Emergency Evacuation Blueprint, and First-Aid Room Layout",
                ],
                application_steps=[
                    "Online application submission through Rajasthan Labour Department portal",
                    "Upload of structural drawings, site boundary plan, and work order copy",
                    "Statutory fee remittance via Rajasthan e-Gras treasury portal",
                    "Issuance of Form II Certificate of Registration for each project site",
                ],
                timeline="Within 60 days of site mobilization / commencement of excavation",
                statutory_fee="₹500 to ₹2,500 per site based on maximum worker strength",
                facts_used=["operates_construction_sites=True", "active_sites=3", "total_workers=280"],
                evidence_records=[
                    {
                        "evidence_id": "EV-BOCW-SEC7",
                        "source_title": "Building and Other Construction Workers Act, 1996",
                        "authority": "Ministry of Labour and Employment",
                        "locator": "Section 7 — Registration of establishments",
                        "excerpt": "Every employer in relation to an establishment to which this Act applies shall make an application to the registering officer for the registration of such establishment.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://labour.rajasthan.gov.in/",
                    }
                ],
            ),

            # 2. BOCW Welfare Cess Assessment & Remittance
            DemoRequirementItem(
                requirement_id="REQ-BOCW-WELFARE-CESS",
                name="BOCW Welfare Cess Assessment & Monthly Remittance (1% Cost)",
                authority="Rajasthan Building & Other Construction Workers Welfare Board",
                jurisdiction="RAJASTHAN",
                domain="LABOR_WELFARE",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory assessment and electronic remittance of 1% Building and Other Construction Workers' Welfare Cess on total construction project cost.",
                why_it_applies="Annual turnover of ₹95 Crore across civil infrastructure and commercial building contracts incurs statutory 1% cess obligations for worker social security.",
                statutory_act="Building and Other Construction Workers' Welfare Cess Act, 1996 & Cess Rules, 1998",
                required_documents=[
                    "Form I Return of Estimated Cost of Construction",
                    "Architect / Chartered Engineer Cost Estimate Certificate",
                    "Running Account (RA) Bills and Monthly Progress Reports",
                    "Treasury Challan receipts evidencing 1% deduction / deposit",
                ],
                application_steps=[
                    "File Form I intimation of construction cost within 30 days of site commencement",
                    "Remit 1% cess on each running bill or advance stages via designated treasury portal",
                    "Submit final completion cost assessment within 30 days of project conclusion",
                ],
                timeline="Payable on each running account bill or within 30 days of assessment",
                statutory_fee="1% of the total cost of construction incurred (excluding land cost)",
                facts_used=["turnover=95_crore", "nature_of_work=civil_construction"],
                evidence_records=[
                    {
                        "evidence_id": "EV-BOCW-CESS-SEC3",
                        "source_title": "BOCW Welfare Cess Act, 1996",
                        "authority": "Ministry of Labour and Employment",
                        "locator": "Section 3 — Levy and collection of cess",
                        "excerpt": "There shall be levied and collected a cess for the purposes of the Building and Other Construction Workers (Regulation of Employment and Conditions of Service) Act, 1996, at the rate of one per cent of the cost of construction incurred by an employer.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://shramsuvidha.gov.in/",
                    }
                ],
            ),

            # 3. Contract Labour (CLRA) Principal Employer Registration
            DemoRequirementItem(
                requirement_id="REQ-CLRA-PRINCIPAL-EMPLOYER",
                name="Contract Labour (CLRA) Principal Employer Registration",
                authority="Office of Chief Labour Commissioner / Rajasthan Labour Dept",
                jurisdiction="RAJASTHAN",
                domain="LABOR",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory registration as Principal Employer under Section 7 of the Contract Labour (Regulation and Abolition) Act, 1970 for engaging subcontractors.",
                why_it_applies="ApexBuild utilizes specialized labour subcontractors across 3 sites engaging contract workers exceeding the statutory threshold of 20.",
                statutory_act="Contract Labour (Regulation and Abolition) Act, 1970 & Rajasthan Contract Labour Rules",
                required_documents=[
                    "Form I Application for Registration of Establishment as Principal Employer",
                    "Subcontractor Agreements & Scope of Work specifications",
                    "List of licensed labour contractors with respective license numbers and worker counts",
                    "Company Certificate of Incorporation and PAN Card",
                ],
                application_steps=[
                    "Online registration on unified Shram Suvidha Portal",
                    "Issue Form V (Certificate of Employment) to each licensed labour contractor",
                    "Inspection and electronic issuance of Principal Employer Registration Certificate",
                ],
                timeline="Prior to deployment of contract labour on active sites",
                statutory_fee="₹1,000 to ₹5,000 based on aggregate contract workforce",
                facts_used=["uses_subcontractors=True", "has_contract_workers=True", "workers=280"],
                evidence_records=[
                    {
                        "evidence_id": "EV-CLRA-SEC7",
                        "source_title": "Contract Labour (Regulation and Abolition) Act, 1970",
                        "authority": "Ministry of Labour and Employment",
                        "locator": "Section 7 — Registration of certain establishments",
                        "excerpt": "Every principal employer of an establishment to which this Act applies shall make an application to the registering officer in the prescribed manner for registration of the establishment.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://shramsuvidha.gov.in/",
                    }
                ],
            ),

            # 4. Inter-State Migrant Workmen Act Registration
            DemoRequirementItem(
                requirement_id="REQ-INTER-STATE-MIGRANT-WORKMEN",
                name="Inter-State Migrant Workmen (ISMW) Establishment Registration",
                authority="Ministry of Labour and Employment / Rajasthan Labour Dept",
                jurisdiction="CENTRAL",
                domain="LABOR",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory registration under Section 6 of the Inter-State Migrant Workmen Act, 1979 for employing 5 or more migrant workers from other States.",
                why_it_applies="Construction project workforce includes migrant construction artisans and masonry labourers mobilized from neighboring States (UP, Bihar, MP).",
                statutory_act="Inter-State Migrant Workmen (Regulation of Employment and Conditions of Service) Act, 1979",
                required_documents=[
                    "Form I Application for Registration under ISMW Act",
                    "Details of labour contractor recruiting workmen from other States",
                    "Displacement allowance and home-journey journey fare payment registers",
                    "Suitable residential accommodation and sanitary facility inspection compliance",
                ],
                application_steps=[
                    "Online application via Shram Suvidha Portal",
                    "Verification of migrant worker welfare facilities (drinking water, crèche, first-aid)",
                    "Issuance of ISMW Registration Certificate",
                ],
                timeline="Within 30 days of mobilizing inter-state migrant workmen",
                statutory_fee="₹500 to ₹2,000 according to migrant worker strength tier",
                facts_used=["engages_migrant_labour=True", "workforce_size=280"],
                evidence_records=[
                    {
                        "evidence_id": "EV-ISMW-SEC6",
                        "source_title": "Inter-State Migrant Workmen Act, 1979",
                        "authority": "Ministry of Labour and Employment",
                        "locator": "Section 6 — Prohibition against employment of inter-State migrant workmen without registration",
                        "excerpt": "No principal employer of an establishment shall employ inter-State migrant workmen unless a certificate of registration in respect of such establishment issued under this Act is in force.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://shramsuvidha.gov.in/",
                    }
                ],
            ),

            # 5. RSPCB C&D Waste Management & Dust Mitigation Consent
            DemoRequirementItem(
                requirement_id="REQ-RSPCB-CD-WASTE-RULES",
                name="RSPCB Construction & Demolition (C&D) Waste Management Plan",
                authority="Rajasthan State Pollution Control Board (RSPCB)",
                jurisdiction="RAJASTHAN",
                domain="ENVIRONMENT",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory waste management plan submission and air pollution dust mitigation measures under Construction and Demolition Waste Management Rules, 2016.",
                why_it_applies="Generating substantial excavation spoils, concrete rubble, and demolition waste across 3 active sites in Jaipur and adjoining districts requires statutory dust control and authorized recycling disposal.",
                statutory_act="Construction and Demolition Waste Management Rules, 2016 & Environment (Protection) Act, 1986",
                required_documents=[
                    "Comprehensive Waste Management Plan detailing generation quantities and disposal route",
                    "Agreement with Municipal Corporation authorized C&D waste processing facility",
                    "Site Dust Suppression Plan (anti-smog guns, green barrier netting, water sprinkling logs)",
                    "Transportation Plan for covered vehicles carrying excavation earth and debris",
                ],
                application_steps=[
                    "Formulate site-specific C&D waste management plan per MoEFCC guidelines",
                    "Submit plan to RSPCB and local urban municipal authority prior to major earthworks",
                    "Maintain daily logs of waste segregation and green barrier containment",
                ],
                timeline="Prior to site excavation and major structural civil works",
                statutory_fee="Prescribed municipal processing fee based on estimated metric tonnes of debris",
                facts_used=["operates_heavy_machinery=True", "active_sites=3", "sector=CIVIL_CONSTRUCTION"],
                evidence_records=[
                    {
                        "evidence_id": "EV-RSPCB-CDWMR",
                        "source_title": "Construction and Demolition Waste Management Rules, 2016",
                        "authority": "Ministry of Environment, Forest and Climate Change",
                        "locator": "Rule 4 — Duties of waste generator",
                        "excerpt": "Every waste generator shall keep the construction and demolition waste within the premise and submit a comprehensive waste management plan to the local authority.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://environment.rajasthan.gov.in/",
                    }
                ],
            ),

            # 6. CEA Safety Code for Temporary Construction Electrical Installations
            DemoRequirementItem(
                requirement_id="REQ-CEA-TEMPORARY-ELECTRICAL-CONSTRUCTION",
                name="CEA Safety Compliance for Temporary Construction Electrical Systems",
                authority="Central Electricity Authority / Rajasthan Electrical Inspectorate",
                jurisdiction="CENTRAL",
                domain="ELECTRICAL_SAFETY",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory safety compliance under CEA Regulations for temporary power distribution, diesel generator connections, and electrical switchboards on active construction sites.",
                why_it_applies="Operating tower cranes, concrete batching mixers, submersible dewatering pumps, and site welding installations using temporary power feeds requires high-sensitivity 30mA ELCBs and earthing validation.",
                statutory_act="Central Electricity Authority (Measures relating to Safety and Electric Supply) Regulations, 2023 (Regulation 34 & 37)",
                required_documents=[
                    "Temporary Power Distribution Single Line Diagram (SLD) signed by Licensed Electrical Contractor",
                    "Earth Pit Resistance Inspection Records (< 2 Ohms) across all site distribution boxes",
                    "ELCB / RCCB 30mA Trip Test Calibration Certificates",
                    "Temporary Site Lighting & Armoured Cable Trenching Blueprint",
                ],
                application_steps=[
                    "Installation of weatherproof, lockable distribution boards with 30mA residual current devices",
                    "Monthly periodic safety audit and megger testing by qualified electrical supervisor",
                    "Submission of electrical safety test return to State Electrical Inspector",
                ],
                timeline="Immediate upon electrical grid / DG connection at active sites",
                statutory_fee="₹1,500 inspection fee per site distribution installation",
                facts_used=["has_temporary_electrical_installations=True", "operates_cranes_mixers=True"],
                evidence_records=[
                    {
                        "evidence_id": "EV-CEA-CONSTRUCTION-ELEC",
                        "source_title": "CEA Safety Regulations 2023 — Regulation 34",
                        "authority": "Central Electricity Authority",
                        "locator": "Regulation 34 — Construction sites and temporary installations",
                        "excerpt": "All temporary electrical installations at building operations and works of engineering construction shall be protected by residual current devices of sensitivity not exceeding 30 mA.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://cea.nic.in/",
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
                description="Mandatory social security provident fund registration under the EPF Act, 1952 covering permanent engineering cadre and eligible direct site staff.",
                why_it_applies="Company employs 280 personnel across engineering, management, and site operations (>20 statutory threshold).",
                statutory_act="Employees' Provident Funds and Miscellaneous Provisions Act, 1952",
                required_documents=[
                    "PAN Card and Certificate of Incorporation",
                    "Proof of Principal Place of Business in Jaipur",
                    "Monthly wage and salary disbursement sheets",
                ],
                application_steps=[
                    "Electronic registration on unified Shram Suvidha portal",
                    "DSC authentication by designated Director",
                    "Issuance of EPF Establishment Code",
                ],
                timeline="Within 30 days of crossing statutory headcount threshold",
                statutory_fee="Nil government registration fee",
                facts_used=["employees=280"],
                evidence_records=[
                    {
                        "evidence_id": "EV-EPF-APEX",
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
                description="Statutory social security health insurance coverage under ESI Act, 1948 for eligible site personnel earning gross wages up to ₹21,000 per month.",
                why_it_applies="ApexBuild operates in Jaipur (notified under ESI scheme) employing site staff and support personnel.",
                statutory_act="Employees' State Insurance Act, 1948",
                required_documents=[
                    "PAN Card and Address Proof of the Establishment",
                    "List of employees with date of joining and salary details",
                    "Corporate Bank Account Details",
                ],
                application_steps=[
                    "Online establishment registration on ESIC / Shram Suvidha portal",
                    "Instant generation of 17-digit ESI Employer Code",
                ],
                timeline="Within 15 days of crossing applicability threshold",
                statutory_fee="Nil government registration fee",
                facts_used=["employees=280", "location=Jaipur"],
                evidence_records=[
                    {
                        "evidence_id": "EV-ESI-APEX",
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
                description="Mandatory constitution of an Internal Committee under the Sexual Harassment of Women at Workplace Act, 2013 across corporate and site offices.",
                why_it_applies="Company employs 280 workers, requiring formal IC constitution and annual reporting to the District Officer in Jaipur.",
                statutory_act="Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013",
                required_documents=[
                    "Formal Order of IC Constitution signed by Managing Director",
                    "CV and Acceptance Letter of External Independent Woman Member",
                    "Annual POSH Return Form for submission to District Collector / Officer",
                ],
                application_steps=[
                    "Appoint senior woman employee as Presiding Officer",
                    "Appoint minimum two employee members and one independent external member",
                    "File annual compliance report with the District Officer by January 31",
                ],
                timeline="Immediate statutory establishment obligation",
                statutory_fee="Nil government fee",
                facts_used=["employees=280"],
                evidence_records=[
                    {
                        "evidence_id": "EV-POSH-APEX",
                        "source_title": "Sexual Harassment of Women at Workplace Act, 2013",
                        "authority": "Ministry of Women and Child Development",
                        "locator": "Section 4(1)",
                        "excerpt": "Every employer of a workplace shall, by an order in writing, constitute a Committee to be known as the Internal Committee.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://wcd.nic.in/",
                    }
                ],
            ),

            # 10. PESO Class B Bulk Diesel Storage License (NEEDS_INFORMATION)
            DemoRequirementItem(
                requirement_id="REQ-PESO-PETROLEUM-CLASS-B-DIESEL",
                name="PESO Bulk Petroleum Class B (Diesel) Storage License",
                authority="Petroleum & Explosives Safety Organization (PESO)",
                jurisdiction="CENTRAL",
                domain="SAFETY",
                status=ApplicabilityStatus.NEEDS_INFORMATION,
                description="Licence in Form XIV/XV under Petroleum Rules 2002 for storage of Petroleum Class B (High Speed Diesel) exceeding 2,500 L on active construction sites.",
                why_it_applies="Unresolved whether on-site mobile bowsers or aboveground diesel storage tanks for heavy earthmovers and generators exceed the statutory 2,500 L unlicensed exemption limit.",
                statutory_act="Petroleum Act, 1934 & Petroleum Rules, 2002 (Rule 116 & Rule 141)",
                required_documents=[
                    "Form VII / Form VIII Application to Chief Controller of Explosives",
                    "Tank fabrication test certificate (IS 2825 / BS EN 12285) with safety dike bund wall calculation",
                    "Safety distance layout drawing showing 3-metre clearance from site boundaries",
                ],
                application_steps=[
                    "Submit online application on PESO portal with tank design drawings",
                    "Construct containment dike wall capable of holding 110% of tank capacity",
                    "Inspection by PESO Controller of Explosives and licence grant",
                ],
                timeline="Needs verification (Contingent on aggregate on-site diesel storage volume)",
                statutory_fee="₹2,500 to ₹10,000 depending on storage tank volume (L)",
                missing_facts=["on_site_diesel_storage_litres", "storage_tank_type"],
                evidence_records=[
                    {
                        "evidence_id": "EV-PESO-DIESEL-RULE116",
                        "source_title": "Petroleum Rules, 2002",
                        "authority": "Petroleum & Explosives Safety Organization",
                        "locator": "Rule 116 — Storage of Petroleum Class B",
                        "excerpt": "No licence shall be required for storage of Petroleum Class B in quantity not exceeding two thousand five hundred litres, if it is stored in accordance with these rules.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://peso.gov.in/",
                    }
                ],
            ),

            # 11. CGWA Construction Dewatering NOC (NEEDS_INFORMATION)
            DemoRequirementItem(
                requirement_id="REQ-CGWA-GROUNDWATER-DEWATERING",
                name="CGWA Groundwater Extraction / Construction Dewatering NOC",
                authority="Central Ground Water Authority / State Ground Water Authority",
                jurisdiction="CENTRAL",
                domain="ENVIRONMENT",
                status=ApplicabilityStatus.NEEDS_INFORMATION,
                description="Mandatory permission under CGWA guidelines for temporary groundwater dewatering during deep foundation, basement, or subterranean infrastructure works in Rajasthan.",
                why_it_applies="Unresolved whether active commercial building sites require deep dewatering or on-site borewell pumping in water-stressed/critical hydrological assessment units in Rajasthan.",
                statutory_act="Environment (Protection) Act, 1986 & CGWA Guidelines for Ground Water Extraction, 2020",
                required_documents=[
                    "Hydrogeological Dewatering Assessment Report by certified hydrogeologist",
                    "Comprehensive rainwater harvesting and artificial aquifer recharge layout plan",
                    "Digital water flow meter installation specification with telemetry",
                ],
                application_steps=[
                    "Online submission through CGWA NOC portal",
                    "Scrutiny by District Level Ground Water Authority",
                ],
                timeline="Needs verification (Contingent on site dewatering requirements)",
                statutory_fee="Groundwater abstraction and restoration charges based on m3/day tier",
                missing_facts=["requires_foundation_dewatering", "groundwater_extraction_volume"],
                evidence_records=[
                    {
                        "evidence_id": "EV-CGWA-DEWATERING-2020",
                        "source_title": "CGWA Guidelines for Ground Water Extraction, 2020",
                        "authority": "Central Ground Water Authority",
                        "locator": "Clause 2.1 — Commercial and Infrastructure Dewatering Projects",
                        "excerpt": "NOC for ground water extraction is mandatory for all infrastructure dewatering projects in over-exploited, critical, and semi-critical assessment units.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://cgwa-noc.gov.in/",
                    }
                ],
            ),

            # 12. RSPCB Captive Batching / Hot Mix Plant Consent (NEEDS_INFORMATION)
            DemoRequirementItem(
                requirement_id="REQ-RSPCB-HOT-MIX-WMM-PLANT",
                name="RSPCB Consent to Establish / Operate for Captive Batching Plant",
                authority="Rajasthan State Pollution Control Board",
                jurisdiction="RAJASTHAN",
                domain="ENVIRONMENT",
                status=ApplicabilityStatus.NEEDS_INFORMATION,
                description="Consent to Establish (CTE) and Consent to Operate (CTO) under Air & Water Acts if captive wet-mix macadam (WMM) or ready-mix concrete (RMC) batching plants are erected on-site.",
                why_it_applies="Unresolved whether ready-mix concrete is purchased from commercial third-party suppliers or manufactured in captive site batching plants.",
                statutory_act="Air (Prevention and Control of Pollution) Act, 1981 & Water (Prevention and Control of Pollution) Act, 1974",
                required_documents=[
                    "Batching plant capacity specifications (m3/hr) and bag-filter dust collector design",
                    "Effluent settling pond schematic for transit mixer washout water recycling",
                ],
                application_steps=[
                    "Online application via RSPCB MIS portal",
                    "Inspection by regional pollution control officer",
                ],
                timeline="Needs verification (Contingent on captive batching plant erection)",
                statutory_fee="Statutory consent fee per RSPCB capital investment scale",
                missing_facts=["operates_captive_rmc_plant", "batching_plant_capacity"],
                evidence_records=[
                    {
                        "evidence_id": "EV-RSPCB-RMC-CONSENT",
                        "source_title": "RSPCB Industry Categorization Schedule",
                        "authority": "Rajasthan State Pollution Control Board",
                        "locator": "Orange Category — Ready Mix Concrete and Batching Plants",
                        "excerpt": "Establishment of captive concrete batching or hot mix plants requires Consent to Establish with water recycling settling tanks and dust filters.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://environment.rajasthan.gov.in/",
                    }
                ],
            ),

            # 13. Factories Act License (NOT_APPLICABLE)
            DemoRequirementItem(
                requirement_id="REQ-RAJASTHAN-FACTORIES-ACT",
                name="Rajasthan Factories Rules - Industrial Factory Manufacturing License",
                authority="Chief Inspector of Factories & Boilers, Rajasthan",
                jurisdiction="RAJASTHAN",
                domain="MANUFACTURING",
                status=ApplicabilityStatus.NOT_APPLICABLE,
                description="Factory plan approval and manufacturing licence under Section 6 & 7 of the Factories Act, 1948 for permanent manufacturing premises.",
                why_it_applies="Not applicable because construction sites are temporary operational premises governed exclusively under the Building and Other Construction Workers (BOCW) Act, 1996 and are expressly excluded from the Factories Act.",
                statutory_act="Factories Act, 1948 (Section 2(m)) & BOCW Act, 1996 (Section 2(d))",
                facts_used=["is_manufacturing_factory=False", "is_construction_contractor=True"],
                evidence_records=[
                    {
                        "evidence_id": "EV-FACTORIES-ACT-EXCLUSION",
                        "source_title": "Factories Act, 1948 — Section 2(m)",
                        "authority": "Ministry of Labour and Employment",
                        "locator": "Section 2(m) — Definition of Factory",
                        "excerpt": "Factory does not include a mine subject to the operation of the Mines Act, 1952, or a railway running shed, or a construction site governed by the BOCW Act.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://rajfab.rajasthan.gov.in/",
                    }
                ],
            ),

            # 14. Plastic Packaging EPR (NOT_APPLICABLE)
            DemoRequirementItem(
                requirement_id="REQ-CPCB-EPR-PLASTIC",
                name="CPCB Extended Producer Responsibility (EPR) for Plastic Packaging",
                authority="Central Pollution Control Board",
                jurisdiction="CENTRAL",
                domain="ENVIRONMENT",
                status=ApplicabilityStatus.NOT_APPLICABLE,
                description="Mandatory plastic packaging collection, recycling targets, and annual filings under Plastic Waste Management Rules, 2016 for Brand Owners, Producers, and Importers.",
                why_it_applies="Not applicable because civil engineering and infrastructure contractors procure bulk construction raw materials and do not package retail commodities in single-use plastic.",
                statutory_act="Plastic Waste Management Rules, 2016 (Schedule II)",
                facts_used=["is_brand_owner_packer=False", "business_model=CIVIL_CONSTRUCTION"],
                evidence_records=[
                    {
                        "evidence_id": "EV-CPCB-EPR-PLASTIC-EXCLUSION",
                        "source_title": "Plastic Waste Management (Amendment) Rules, 2022",
                        "authority": "Central Pollution Control Board",
                        "locator": "Schedule II — Guidelines on Extended Producer Responsibility for Plastic Packaging",
                        "excerpt": "These guidelines apply to Producers, Importers, Brand Owners and Plastic Waste Processors of plastic packaging.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://eprplastic.cpcb.gov.in/",
                    }
                ],
            ),
        ]
