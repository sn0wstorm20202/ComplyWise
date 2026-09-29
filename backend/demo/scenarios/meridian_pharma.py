"""Flagship Demo Scenario: Meridian Pharma Formulations Pvt. Ltd.

Location: Hyderabad, Telangana
Profile: Oral solid dosage pharmaceutical formulations (tablets, capsules, granulation, coating, QC lab)
Workforce: 164 (112 permanent, 52 contract, 41 women)
Connected Load: 480 kW, 500 kVA DG set
Facility: ~95,000 sq ft
Water: 38,000 L/day with industrial wastewater treatment system
Turnover: ₹42 Crore
Procurement: Selected overseas suppliers (raw materials)

Authority: SELECTION DEMO SPECIFICATION Part 1 & MERIDIAN PHARMA FLAGSHIP SPECIFICATION
"""

from __future__ import annotations

import re
from typing import Any

from common.enums import ApplicabilityStatus
from .base import DemoRequirementItem, DemoScenario


class MeridianPharmaScenario(DemoScenario):
    scenario_id = "MERIDIAN_PHARMA_DEMO"
    name = "Meridian Pharma Formulations (Pharma Mfg - Telangana)"
    description = "Oral solid dosage pharmaceutical manufacturing unit in Hyderabad, Telangana."

    def matches(self, business_name: str, context: dict[str, Any]) -> bool:
        """Deterministic matching based on canonical business facts."""
        name_lower = business_name.lower()
        if "meridian" in name_lower and ("pharma" in name_lower or "formulation" in name_lower):
            return True

        state = str(context.get("state") or "").upper().strip()
        is_telangana = state in ("TELANGANA", "TG")

        desc_parts = [
            business_name,
            str(context.get("product_description") or ""),
            str(context.get("primary_activity") or ""),
            str(context.get("sector") or ""),
        ]
        combined = " ".join(desc_parts).lower()

        is_pharma_mfg = bool(
            re.search(r"\b(pharma|pharmaceutical|tablet|capsule|solid dosage|formulation|drug manufacturing)\b", combined)
            and re.search(r"\b(manufacturing|formulations|plant|factory|granulation)\b", combined)
        )

        return is_telangana and is_pharma_mfg

    def get_requirements(self, context: dict[str, Any]) -> list[DemoRequirementItem]:
        return [
            # 1. Drug Manufacturing License (Form 25 / Form 28)
            DemoRequirementItem(
                requirement_id="REQ-CDSCO-DCA-DRUG-MFG-LICENCE",
                name="Drug Manufacturing License (Form 25 / Form 28)",
                authority="Telangana Drugs Control Administration (DCA) / CDSCO",
                jurisdiction="TELANGANA",
                domain="PHARMACEUTICALS",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory licence to manufacture for sale or distribution of allopathic drugs (oral solid dosage formulations: tablets and capsules) under Section 18(c) of the Drugs and Cosmetics Act, 1940.",
                why_it_applies="Manufacturing finished oral solid dosage formulations (tablets, capsules, granulation, coating) at Hyderabad requires a valid Form 25/28 manufacturing licence issued by the State Licensing Authority.",
                statutory_act="Drugs and Cosmetics Act, 1940 & Drugs and Cosmetics Rules, 1945 (Part VII)",
                required_documents=[
                    "Form 24 / Form 27 Application with Treasury Challan",
                    "Approved Factory & Quality Control Laboratory Blueprint",
                    "Site Master File (SMF) per PIC/S / WHO-GMP layout standards",
                    "List of Manufacturing & Testing Machinery / Equipment",
                    "Appointment and Consent of Approved Technical Staff (B.Pharm/M.Pharm)",
                ],
                application_steps=[
                    "Online application and document submission via TS-iPASS / DCA Sugam portal",
                    "Document scrutiny and fee verification by Assistant Director of Drugs Control",
                    "Joint physical pre-licence site inspection by State DCA and CDSCO drug inspectors",
                    "Issuance of Form 25 / Form 28 Drug Manufacturing Licence endorsement",
                ],
                timeline="Prior to commercial manufacturing operations (45-60 days statutory window)",
                statutory_fee="₹7,500 application fee + ₹1,500 inspection fee per product category",
                facts_used=["is_manufacturing=True", "state=TELANGANA", "product_description=Oral solid dosage formulations"],
                evidence_records=[
                    {
                        "evidence_id": "EV-DCA-TS-SEC18C",
                        "source_title": "Drugs and Cosmetics Act, 1940 — Section 18(c)",
                        "authority": "Telangana Drugs Control Administration",
                        "locator": "Section 18(c), Read with Rule 69 & 71",
                        "excerpt": "No person shall manufacture for sale or for distribution any drug except under, and in accordance with the conditions of, a licence issued for such purpose under this Chapter.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://cdscomdonline.gov.in/",
                    }
                ],
            ),

            # 2. Schedule M GMP Adherence
            DemoRequirementItem(
                requirement_id="REQ-SCHEDULE-M-GMP",
                name="Good Manufacturing Practices (Revised Schedule M Compliance)",
                authority="Drugs Controller General of India (CDSCO) / TS DCA",
                jurisdiction="CENTRAL",
                domain="PHARMACEUTICALS",
                status=ApplicabilityStatus.NEEDS_INFORMATION,
                description="Adherence to Revised Schedule M Good Manufacturing Practices (GMP) and Quality Risk Management (QRM) standards prescribed under the Drugs and Cosmetics Rules, 1945.",
                why_it_applies="Annual turnover of ₹42 Crore brings the facility within the mandatory Revised Schedule M upgrade timeline. Detailed HVAC validation and self-inspection records are required.",
                statutory_act="Drugs and Cosmetics Rules, 1945 (Revised Schedule M, Gazette Notification G.S.R. 922(E))",
                required_documents=[
                    "Quality Manual & Pharmacovigilance Standard Operating Procedures",
                    "HVAC Qualification & Environmental Monitoring Protocols (Grade D / Controlled Areas)",
                    "Water Purification System (Purified Water / WFI) Validation Dossier",
                    "Equipment DQ, IQ, OQ, PQ Validation Master Plan (VMP)",
                    "Batch Manufacturing & Packaging Records (BMR / BPR)",
                ],
                application_steps=[
                    "Internal Quality Risk Management (QRM) & Gap Assessment",
                    "HVAC & Purified Water Generation validation audit",
                    "Submission of Revised Schedule M compliance declaration to DCA / CDSCO",
                    "Joint regulatory validation inspection and GMP Certificate issuance",
                ],
                timeline="Needs verification (Upgrade milestone subject to current validation status)",
                statutory_fee="Statutory inspection fee per Schedule M-III guidelines",
                missing_facts=["Current GMP validation audit report and Schedule M certification upgrade status need verification."],
                facts_used=["annual_turnover=₹42 Crore", "is_manufacturing=True", "product_description=Oral solid dosage"],
                evidence_records=[
                    {
                        "evidence_id": "EV-CDSCO-SCHED-M",
                        "source_title": "Ministry of Health and Family Welfare Notification G.S.R. 922(E)",
                        "authority": "Central Drugs Standard Control Organization",
                        "locator": "Drugs and Cosmetics (Amendment) Rules, 2023 — Schedule M",
                        "excerpt": "Manufacturers with turnover of less than two hundred and fifty crore rupees shall comply with the revised Good Manufacturing Practices requirements within twelve months from the date of publication.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://cdsco.gov.in/",
                    }
                ],
            ),

            # 3. Telangana Factory License & Plan Approval
            DemoRequirementItem(
                requirement_id="REQ-TS-FACTORY-LICENSE",
                name="Telangana Factory License & Plan Approval",
                authority="Directorate of Factories, Telangana",
                jurisdiction="TELANGANA",
                domain="MANUFACTURING",
                status=ApplicabilityStatus.APPLICABLE,
                description="Factory building plan approval, registration, and grant of factory operating licence under Section 6 & 7 of the Factories Act, 1948 and Telangana Factories Rules, 1950.",
                why_it_applies="The facility operates with 164 workers and 480 kW connected electrical load, exceeding the statutory threshold of 10 workers with power under Section 2(m)(i) of the Factories Act.",
                statutory_act="Factories Act, 1948 (Section 6 & 7) & Telangana Factories Rules, 1950",
                required_documents=[
                    "Factory Layout Drawing and Machinery Installation Schedule (Form 1)",
                    "Structural Stability Certificate certified by a Chartered Structural Engineer",
                    "Form 2 Application for Factory Registration and Grant of License",
                    "Sanctioned Electrical Load Clearance (480 kW / 643 HP from TSSPDCL)",
                    "List of Plant Directors, Managing Agent, and Factory Manager Appointment",
                ],
                application_steps=[
                    "Online submission of factory layout plans and drawings via TS-iPASS",
                    "Scrutiny by Inspector of Factories and Departmental Mechanical Engineer",
                    "Online payment of statutory factory licensing fee based on workforce and HP load",
                    "Physical pre-commissioning safety inspection and grant of Factory License in Form 4",
                ],
                timeline="Prior to operational commencement and worker induction",
                statutory_fee="₹24,000 annually based on 164 workers and 480 kW (643.69 HP) connected load",
                facts_used=["total_worker_count=164", "connected_power_load=480 kW", "state=TELANGANA"],
                evidence_records=[
                    {
                        "evidence_id": "EV-TS-FACTORIES-ACT",
                        "source_title": "Factories Act, 1948 — Section 2(m)(i)",
                        "authority": "Directorate of Factories, Telangana",
                        "locator": "Section 2(m)(i) & Section 6",
                        "excerpt": "'factory' means any premises wherein ten or more workers are working and in any part of which a manufacturing process is being carried on with the aid of power.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://ipass.telangana.gov.in/",
                    }
                ],
            ),

            # 4. TSPCB Consent to Establish (CTE)
            DemoRequirementItem(
                requirement_id="REQ-TSPCB-CTE",
                name="TSPCB Consent to Establish (CTE)",
                authority="Telangana State Pollution Control Board (TSPCB)",
                jurisdiction="TELANGANA",
                domain="ENVIRONMENT",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory environmental clearance to establish an industrial manufacturing plant under Section 25 of the Water (Prevention and Control of Pollution) Act, 1974 and Section 21 of the Air Act, 1981.",
                why_it_applies="Pharmaceutical formulation units generating 38,000 L/day effluent are classified under Red/Orange industrial category requiring pre-establishment environmental consent.",
                statutory_act="Water Act, 1974 (Section 25) & Air Act, 1981 (Section 21)",
                required_documents=[
                    "Detailed Manufacturing Process Flowchart & Material Balance Sheet",
                    "Effluent Treatment Plant (ETP) Engineering Drawing and Process Design",
                    "Ambient Air Quality & Stack Emission Baseline Monitoring Report",
                    "Site Location Plan & TS-iPASS Combined Application Form (CAF)",
                ],
                application_steps=[
                    "Online filing of Combined Application Form via TS-iPASS single-window portal",
                    "Technical review by TSPCB Zonal / Regional Environmental Engineer",
                    "Presentation before the State Consent Appraisal Committee (CAC)",
                    "Issuance of formal Consent to Establish (CTE) order with environmental stipulations",
                ],
                timeline="Prior to start of any site construction or machinery erection",
                statutory_fee="Scale-based capital investment fee (₹42 Cr turnover bracket)",
                facts_used=["is_manufacturing=True", "state=TELANGANA", "water_consumption=38,000 L/day"],
                evidence_records=[
                    {
                        "evidence_id": "EV-TSPCB-WATER-ACT-25",
                        "source_title": "Water (Prevention & Control of Pollution) Act, 1974",
                        "authority": "Telangana State Pollution Control Board",
                        "locator": "Section 25(1)",
                        "excerpt": "No person shall, without the previous consent of the State Board, establish or take any steps to establish any industry, operation or process which is likely to discharge sewage or trade effluent.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://tspcb.cgg.gov.in/",
                    }
                ],
            ),

            # 5. TSPCB Consent to Operate (CTO)
            DemoRequirementItem(
                requirement_id="REQ-TSPCB-CTO",
                name="TSPCB Consent to Operate (CTO)",
                authority="Telangana State Pollution Control Board (TSPCB)",
                jurisdiction="TELANGANA",
                domain="ENVIRONMENT",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory permission to commence industrial discharge, emissions, and commercial manufacturing operations under the Water Act, 1974 and Air Act, 1981.",
                why_it_applies="Operational pharmaceutical formulation facility with 38,000 L/day water consumption, industrial wastewater treatment system, and 500 kVA DG set.",
                statutory_act="Water Act, 1974 & Air Act, 1981 (Read with Environment (Protection) Act, 1986)",
                required_documents=[
                    "Compliance Report on stipulations in Consent to Establish (CTE)",
                    "Effluent Treatment Plant (ETP) Commissioning & Treated Effluent Analysis Report",
                    "Acoustic Enclosure & Stack Height Compliance for 500 kVA Diesel Generator Set",
                    "Hazardous Chemical Storage Safety Manifest & Spill Containment Plan",
                ],
                application_steps=[
                    "Online application via TSPCB Online Consent Management & Monitoring System (OCMMS)",
                    "Physical verification and grab sampling of treated wastewater by Board Analysts",
                    "Evaluation of compliance against prescribed discharge standards (BOD, COD, TDS)",
                    "Grant of Consent to Operate (CTO) valid for a 5-year operating period",
                ],
                timeline="Prior to commercial formulation and effluent discharge commencement",
                statutory_fee="Annual statutory fee determined by gross fixed capital assets",
                facts_used=["is_manufacturing=True", "water_consumption=38,000 L/day", "dg_set=500 kVA"],
                evidence_records=[
                    {
                        "evidence_id": "EV-TSPCB-CTO-WATER",
                        "source_title": "Water Act 1974 & Air Act 1981 Consent Mandate",
                        "authority": "Telangana State Pollution Control Board",
                        "locator": "Section 25/26 (Water) & Section 21 (Air)",
                        "excerpt": "No person shall operate any industrial plant in an air pollution control area or discharge trade effluent without obtaining consent to operate from the State Board.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://tspcb.cgg.gov.in/",
                    }
                ],
            ),

            # 6. TSPCB Hazardous Waste Authorization
            DemoRequirementItem(
                requirement_id="REQ-TSPCB-HAZARDOUS-WASTE",
                name="Hazardous & Other Wastes Management Authorization",
                authority="Telangana State Pollution Control Board (TSPCB)",
                jurisdiction="TELANGANA",
                domain="ENVIRONMENT",
                status=ApplicabilityStatus.NEEDS_INFORMATION,
                description="Statutory authorization for generation, collection, storage, transport, and disposal of hazardous waste under Rule 6 of Hazardous and Other Wastes Rules, 2016.",
                why_it_applies="Pharma formulation processes generate spent solvents, QC laboratory chemical residues, expired raw materials, and ETP sludge.",
                statutory_act="Hazardous and Other Wastes (Management and Transboundary Movement) Rules, 2016",
                required_documents=[
                    "Form 1 Application for Grant of Hazardous Waste Authorization",
                    "Agreement with Approved Treatment, Storage and Disposal Facility (TSDF Dundigal/Hyderabad)",
                    "Hazardous Waste Dedicated Storage Area Layout with Impervious Flooring",
                    "Emergency Preparedness & Spill Response Disaster Management Plan",
                ],
                application_steps=[
                    "Execution of statutory membership agreement with authorized common TSDF",
                    "Online Form 1 filing on TSPCB OCMMS portal",
                    "Inspection of hazardous waste storage yard by Board inspecting officers",
                    "Issuance of Form 2 Authorization with approved annual generation quotas",
                ],
                timeline="Needs verification (Exact hazardous waste streams and TSDF membership details needed)",
                statutory_fee="Prescribed application processing fee under HOWM Rules",
                missing_facts=["Exact hazardous waste categories, chemical inventory, and TSDF membership details need verification."],
                facts_used=["is_manufacturing=True", "product_description=Oral solid dosage", "qc_lab=True"],
                evidence_records=[
                    {
                        "evidence_id": "EV-HOWM-RULES-2016",
                        "source_title": "Hazardous and Other Wastes Rules, 2016",
                        "authority": "Ministry of Environment, Forest and Climate Change / TSPCB",
                        "locator": "Rule 6(1)",
                        "excerpt": "Every occupier of the facility who is engaged in handling, generation, collection, storage, packaging, transportation, use, treatment, processing, recycling, recovery, pre-processing, co-processing, utilisation, offering for sale, transfer or disposal of the hazardous and other wastes shall make an application in Form 1 to the State Pollution Control Board for grant of authorisation.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://tspcb.cgg.gov.in/",
                    }
                ],
            ),

            # 7. Telangana Fire Safety NOC
            DemoRequirementItem(
                requirement_id="REQ-TS-FIRE-NOC",
                name="Telangana Fire Safety NOC (Occupancy Certificate)",
                authority="Telangana State Disaster Response and Fire Services Department",
                jurisdiction="TELANGANA",
                domain="SAFETY",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory Fire Safety Certificate and No Objection Certificate (NOC) for industrial manufacturing premises under Section 13 of the Telangana Fire Services Act, 1999.",
                why_it_applies="The manufacturing facility occupies approximately 95,000 sq ft, exceeding the 500 sq m mandatory fire safety clearance threshold under the National Building Code (Part IV) and State Fire Regulations.",
                statutory_act="Telangana Fire Services Act, 1999 (Read with NBC 2016 Part 4)",
                required_documents=[
                    "Fire Fighting Layout Plan showing Hydrants, Hose Reels, and Sprinkler Grid",
                    "Underground & Overhead Dedicated Fire Water Tank Capacity Drawings",
                    "Electrical Safety Certificate and DG Set Automatic Changeover Schematics",
                    "Emergency Evacuation Plan & Fire Extinguisher Placement Chart (ABC / CO2 type)",
                ],
                application_steps=[
                    "Online application submission via TS-iPASS single-window system",
                    "Site inspection by District Fire Officer (DFO) to verify pressure and pump flow rates",
                    "Operational testing of emergency fire pumps and automatic alarm panel",
                    "Issuance of Fire Safety No Objection Certificate (Occupancy NOC)",
                ],
                timeline="Prior to facility occupancy and commercial production",
                statutory_fee="Statutory scrutiny fee calculated per square metre of built-up area",
                facts_used=["facility_area=95,000 sq ft", "state=TELANGANA", "is_manufacturing=True"],
                evidence_records=[
                    {
                        "evidence_id": "EV-TS-FIRE-ACT-13",
                        "source_title": "Telangana Fire Services Act, 1999",
                        "authority": "Telangana State Disaster Response and Fire Services Department",
                        "locator": "Section 13",
                        "excerpt": "Any person proposing to construct a building of more than 500 square metres in area for commercial or industrial purposes shall obtain a No Objection Certificate from the Director General of Fire Services.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://fire.telangana.gov.in/",
                    }
                ],
            ),

            # 8. Groundwater Extraction NOC
            DemoRequirementItem(
                requirement_id="REQ-WALTA-GROUNDWATER-NOC",
                name="Groundwater Extraction NOC (WALTA / CGWA)",
                authority="Telangana Ground Water Department / CGWA",
                jurisdiction="TELANGANA",
                domain="ENVIRONMENT",
                status=ApplicabilityStatus.NEEDS_INFORMATION,
                description="Mandatory permission to abstract groundwater for industrial formulation and utility cooling under the Telangana Water, Land and Trees Act (WALTA) and CGWA Guidelines.",
                why_it_applies="Daily water consumption of 38,000 litres/day for manufacturing oral solid dosages, QC washing, cooling towers, and boiler operations.",
                statutory_act="Telangana Water, Land and Trees Act, 2002 (WALTA) & CGWA Notification No. S.O. 3289(E)",
                required_documents=[
                    "Comprehensive Hydrogeological Assessment Report prepared by Accredited Hydrogeologist",
                    "Digital Water Flow Meter (Telemetry-enabled) Calibration Certificate",
                    "Rainwater Harvesting System (RWHS) & Artificial Recharge Design Blueprint",
                    "Water Balance Audit Sheet demonstrating recycling and reuse in utilities",
                ],
                application_steps=[
                    "Online submission of application on CGWA / WALTA portal",
                    "Ground inspection of borewell site and telemetry meter verification",
                    "Assessment of groundwater assessment unit category (Safe, Semi-Critical, Critical)",
                    "Grant of formal Groundwater Abstraction No Objection Certificate",
                ],
                timeline="Needs verification (Borewell extraction source and water supply arrangement needed)",
                statutory_fee="Groundwater abstraction charges based on volumetric extraction tariff",
                missing_facts=["Groundwater borewell extraction status, telemetry meter, and municipal supply ratio need verification."],
                facts_used=["water_consumption=38,000 L/day", "state=TELANGANA"],
                evidence_records=[
                    {
                        "evidence_id": "EV-CGWA-WALTA-NOC",
                        "source_title": "Central Ground Water Authority Guidelines / WALTA Act",
                        "authority": "Central Ground Water Authority & TS Ground Water Department",
                        "locator": "CGWA Notification S.O. 3289(E) Section 4",
                        "excerpt": "All existing and new industrial users abstracting ground water shall obtain No Objection Certificate from Central Ground Water Authority or State Ground Water Authority.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://cgwa-noc.gov.in/",
                    }
                ],
            ),

            # 9. Importer-Exporter Code (DGFT)
            DemoRequirementItem(
                requirement_id="REQ-DGFT-IEC",
                name="Importer-Exporter Code (IEC)",
                authority="Directorate General of Foreign Trade (DGFT)",
                jurisdiction="CENTRAL",
                domain="TRADE",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory 10-character business identification code mandatory for commercial import of active pharmaceutical ingredients (APIs) and excipients under Section 7 of the Foreign Trade (Development and Regulation) Act, 1992.",
                why_it_applies="Meridian Pharma procures raw materials and specialized pharmaceutical excipients from selected overseas suppliers, requiring mandatory customs clearance registration.",
                statutory_act="Foreign Trade (Development and Regulation) Act, 1992 (Section 7)",
                required_documents=[
                    "Company Permanent Account Number (PAN) Card",
                    "Certificate of Incorporation from Ministry of Corporate Affairs (MCA)",
                    "Bank Account Certificate / Cancelled Cheque with pre-printed company name",
                    "Valid Class 3 Digital Signature Certificate (DSC) or Director Aadhaar OTP",
                ],
                application_steps=[
                    "Log into DGFT Online Portal and initiate IEC application",
                    "Enter company PAN, incorporation details, and bank account validation",
                    "Aadhaar OTP / DSC e-signature verification",
                    "Instant automated electronic issuance of Importer-Exporter Code (IEC) certificate",
                ],
                timeline="Prior to customs clearance of overseas raw material consignments (Immediate)",
                statutory_fee="₹500 online application processing fee",
                facts_used=["procurement=Selected overseas suppliers", "raw_materials=Overseas procurement"],
                evidence_records=[
                    {
                        "evidence_id": "EV-DGFT-FTP-SEC7",
                        "source_title": "Foreign Trade Policy / FTDR Act 1992",
                        "authority": "Directorate General of Foreign Trade",
                        "locator": "Section 7, FTDR Act 1992",
                        "excerpt": "No person shall make any import or export except under an Importer-exporter Code Number granted by the Director-General or the officer authorised by the Director-General in this behalf.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://dgft.gov.in/CP/?opt=iec-service",
                    }
                ],
            ),

            # 10. Legal Metrology Packaged Commodities Registration
            DemoRequirementItem(
                requirement_id="REQ-LEGAL-METROLOGY-PACKER",
                name="Legal Metrology Packaged Commodities Registration (Rule 27)",
                authority="Department of Consumer Affairs / Legal Metrology",
                jurisdiction="CENTRAL",
                domain="STANDARDS",
                status=ApplicabilityStatus.APPLICABLE,
                description="Registration of pre-packaged finished pharmaceutical formulations as manufacturer and packer under Rule 27 of the Legal Metrology (Packaged Commodities) Rules, 2011.",
                why_it_applies="Packaging finished tablets and capsules into blister packs, strips, and cartons distributed commercially in India requires mandatory labelling declaration compliance.",
                statutory_act="Legal Metrology Act, 2009 & Legal Metrology (Packaged Commodities) Rules, 2011 (Rule 27)",
                required_documents=[
                    "Specimen Package Artwork showing mandatory declarations (Name, MRP, Mfg Date, Net Qty)",
                    "Drug Manufacturing License copy issued by State DCA",
                    "Factory License and Certificate of Incorporation",
                    "Authorized Signatory KYC and Director Identification Details",
                ],
                application_steps=[
                    "Online filing of application under Rule 27 on Legal Metrology portal (e-Maapadan)",
                    "Verification of mandatory statutory declarations and font size ratios",
                    "Online fee payment of registration charges",
                    "Issuance of Certificate of Registration as Manufacturer / Packer",
                ],
                timeline="Prior to primary/secondary packaging and commercial distribution",
                statutory_fee="₹500 statutory registration fee",
                facts_used=["is_manufacturing=True", "packaging=primary/secondary pharmaceutical packaging"],
                evidence_records=[
                    {
                        "evidence_id": "EV-LEGAL-METROLOGY-RULE27",
                        "source_title": "Legal Metrology (Packaged Commodities) Rules, 2011",
                        "authority": "Department of Consumer Affairs",
                        "locator": "Rule 27",
                        "excerpt": "Every individual, firm, Hindu undivided family, society, company or corporation who or which pre-packs or imports any commodity for sale, distribution or delivery shall make an application to the Director or Controller for the registration of his or its name and complete address.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://lm.doca.gov.in/",
                    }
                ],
            ),

            # 11. CPCB Extended Producer Responsibility (EPR) for Plastic Packaging
            DemoRequirementItem(
                requirement_id="REQ-CPCB-EPR-PLASTIC",
                name="CPCB Extended Producer Responsibility (EPR) for Plastic Packaging",
                authority="Central Pollution Control Board (CPCB)",
                jurisdiction="CENTRAL",
                domain="ENVIRONMENT",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory registration and recycling obligation for brand owners and manufacturers utilizing plastic packaging materials under the Plastic Waste Management Rules, 2016.",
                why_it_applies="Primary (blister foil backing, PVC/PVDC) and secondary pharmaceutical packaging involves rigid and flexible plastic packaging components.",
                statutory_act="Plastic Waste Management Rules, 2016 (Schedule II - EPR Guidelines)",
                required_documents=[
                    "Annual Plastic Packaging Consumption Audit categorized by Category I, II, III, IV",
                    "Agreements with Registered Plastic Waste Processors / Recyclers",
                    "PAN, GSTIN, and Factory Registration Certificates",
                    "State PCB Consent to Operate (CTO) endorsement copy",
                ],
                application_steps=[
                    "Registration on centralized CPCB EPR Portal as Brand Owner / Producer",
                    "Declaration of annual plastic packaging procurement tonnage",
                    "Submission of recycling target fulfillment plan via registered recyclers",
                    "Issuance of CPCB EPR Registration Certificate",
                ],
                timeline="Mandatory annual compliance reporting",
                statutory_fee="Volume-based registration and processing fee on CPCB portal",
                facts_used=["packaging=blister/carton packaging", "waste=packaging waste"],
                evidence_records=[
                    {
                        "evidence_id": "EV-CPCB-EPR-PLASTIC-GUIDELINES",
                        "source_title": "Plastic Waste Management Rules, 2016 — Schedule II",
                        "authority": "Central Pollution Control Board",
                        "locator": "Schedule II, Clause 6",
                        "excerpt": "The Brand Owner shall register on the centralised portal developed by Central Pollution Control Board and fulfil Extended Producer Responsibility targets for plastic packaging.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://cpcbeprplastic.in/",
                    }
                ],
            ),

            # 12. Employees' Provident Fund (EPF) Registration
            DemoRequirementItem(
                requirement_id="REQ-EPF-REGISTRATION",
                name="Employees' Provident Fund (EPF) Registration",
                authority="Employees' Provident Fund Organisation (EPFO)",
                jurisdiction="CENTRAL",
                domain="LABOR",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory social security and retirement benefit scheme registration under Section 1(3) of the Employees' Provident Funds and Miscellaneous Provisions Act, 1952.",
                why_it_applies="Total workforce of 164 individuals (112 permanent and 52 contract workers) exceeds the statutory threshold of 20 employees under Section 1(3)(a).",
                statutory_act="Employees' Provident Funds and Miscellaneous Provisions Act, 1952",
                required_documents=[
                    "Company Certificate of Incorporation and Memorandum of Association",
                    "Permanent Account Number (PAN) Card & GSTIN",
                    "Cancelled Cheque and Bank Account Passbook",
                    "Register of Workers with Date of Joining and Wage Structures",
                ],
                application_steps=[
                    "Online registration on Shram Suvidha / EPFO Portal",
                    "Automated electronic verification and generation of establishment EPF Code",
                    "Monthly electronic challan return (ECR) generation and provident fund deposit",
                ],
                timeline="Within 30 days of crossing 20 employees (Active obligation)",
                statutory_fee="Statutory employer contribution (12% of basic wage + administrative charges)",
                facts_used=["total_worker_count=164", "permanent_workers=112", "contract_workers=52"],
                evidence_records=[
                    {
                        "evidence_id": "EV-EPFO-SEC1-3",
                        "source_title": "Employees' Provident Funds Act, 1952",
                        "authority": "Employees' Provident Fund Organisation",
                        "locator": "Section 1(3)(a)",
                        "excerpt": "This Act applies to every establishment which is a factory engaged in any industry specified in Schedule I and in which twenty or more persons are employed.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://shramsuvidha.gov.in/",
                    }
                ],
            ),

            # 13. Employees' State Insurance (ESI) Registration
            DemoRequirementItem(
                requirement_id="REQ-ESI-REGISTRATION",
                name="Employees' State Insurance (ESI) Registration",
                authority="Employees' State Insurance Corporation (ESIC)",
                jurisdiction="CENTRAL",
                domain="LABOR",
                status=ApplicabilityStatus.APPLICABLE,
                description="Comprehensive healthcare and social insurance registration under Section 2-A of the Employees' State Insurance Act, 1948.",
                why_it_applies="Factory establishment in Hyderabad employing 164 workers with wages eligible under statutory ESI wage threshold (up to ₹21,000/month).",
                statutory_act="Employees' State Insurance Act, 1948",
                required_documents=[
                    "Factory Operating Licence and Incorporation Certificate",
                    "Employee Muster Roll and Monthly Wage Register",
                    "Bank Account Verification and Director Identity Proof",
                    "List of Contract Labour Staff engaged via Contractors",
                ],
                application_steps=[
                    "Online registration through Ministry of Labour Shram Suvidha portal",
                    "Instant generation of 17-digit ESIC Employer Code Number",
                    "Employee insurance registration and generation of digital Pehchan Cards",
                ],
                timeline="Within 15 days of becoming applicable",
                statutory_fee="Statutory monthly contribution (3.25% employer + 0.75% employee)",
                facts_used=["total_worker_count=164", "state=TELANGANA", "district=Hyderabad"],
                evidence_records=[
                    {
                        "evidence_id": "EV-ESIC-ACT-SEC2A",
                        "source_title": "Employees' State Insurance Act, 1948",
                        "authority": "Employees' State Insurance Corporation",
                        "locator": "Section 2-A",
                        "excerpt": "Every factory or establishment to which this Act applies shall be registered within such time and in such manner as may be specified in the regulations made in this behalf.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://shramsuvidha.gov.in/",
                    }
                ],
            ),

            # 14. POSH Internal Committee
            DemoRequirementItem(
                requirement_id="REQ-POSH-INTERNAL-COMMITTEE",
                name="Internal Committee for Prevention of Sexual Harassment at Workplace (POSH)",
                authority="Appropriate Government under POSH Act, 2013",
                jurisdiction="CENTRAL",
                domain="EMPLOYMENT_SAFETY",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory constitution of an Internal Committee (IC) under Section 4 of the Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013.",
                why_it_applies="The company employs 41 female workers across operations, QC laboratories, and administration, exceeding the statutory requirement of 10 employees.",
                statutory_act="Sexual Harassment of Women at Workplace Act, 2013 (Section 4)",
                required_documents=[
                    "Formal Office Order Constituting the Internal Committee (IC)",
                    "Appointment and Consent Letter of External NGO / Independent Legal Member",
                    "Company Prevention of Sexual Harassment Policy displayed on Notice Boards",
                    "Annual POSH Report format for submission to the District Officer",
                ],
                application_steps=[
                    "Drafting formal executive order designating Presiding Officer (senior woman employee)",
                    "Selecting at least two employee members committed to women's causes",
                    "Formally engaging an external independent member from an NGO or legal background",
                    "Displaying penal consequences and IC composition in Telugu and English on factory noticeboards",
                ],
                timeline="Immediate statutory requirement upon commencing operations",
                statutory_fee="Nil (Internal compliance)",
                facts_used=["women_workers=41", "total_worker_count=164"],
                evidence_records=[
                    {
                        "evidence_id": "EV-POSH-ACT-SEC4",
                        "source_title": "Sexual Harassment of Women at Workplace Act, 2013",
                        "authority": "Ministry of Women and Child Development",
                        "locator": "Section 4(1)",
                        "excerpt": "Every employer of a workplace shall, by an order in writing, constitute a Committee to be known as the 'Internal Complaints Committee': Provided that where the offices or administrative units of the workplace are located at different places or divisional or sub-divisional level, the Internal Committee shall be constituted at all administrative units or offices.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://wcd.nic.in/",
                    }
                ],
            ),

            # 15. Not Applicable items clearly evaluated
            DemoRequirementItem(
                requirement_id="REQ-FSSAI-CENTRAL-LICENCE",
                name="FSSAI Central Food License",
                authority="Food Safety and Standards Authority of India (FSSAI)",
                jurisdiction="CENTRAL",
                domain="FOOD",
                status=ApplicabilityStatus.NOT_APPLICABLE,
                description="Mandatory food business operator license under Section 31 of Food Safety and Standards Act, 2006.",
                why_it_applies="This requirement is NOT APPLICABLE because Meridian Pharma manufactures oral solid dosage pharmaceutical drugs, not food products or dietary supplements.",
                statutory_act="Food Safety and Standards Act, 2006",
                facts_used=["product_description=Oral solid dosage formulations", "sector=PHARMACEUTICAL"],
            ),
            DemoRequirementItem(
                requirement_id="REQ-BIS-CRS-SMART-METER",
                name="BIS Compulsory Registration Scheme (CRS) Smart Meter",
                authority="Bureau of Indian Standards (BIS)",
                jurisdiction="CENTRAL",
                domain="ELECTRONICS",
                status=ApplicabilityStatus.NOT_APPLICABLE,
                description="Compulsory BIS registration for electronic smart meters under CRO Order.",
                why_it_applies="This requirement is NOT APPLICABLE because the business manufactures pharmaceutical drug formulations, not electronics or smart meters.",
                statutory_act="Bureau of Indian Standards Act, 2016",
                facts_used=["sector=PHARMACEUTICAL"],
            ),
            DemoRequirementItem(
                requirement_id="REQ-CPCB-EPR-EWASTE",
                name="EPR Authorization for E-Waste",
                authority="Central Pollution Control Board (CPCB)",
                jurisdiction="CENTRAL",
                domain="ELECTRONICS",
                status=ApplicabilityStatus.NOT_APPLICABLE,
                description="Extended Producer Responsibility authorization for electronic and electrical equipment under E-Waste Rules.",
                why_it_applies="This requirement is NOT APPLICABLE because the company does not produce or distribute electrical or electronic equipment.",
                statutory_act="E-Waste (Management) Rules, 2022",
                facts_used=["sector=PHARMACEUTICAL"],
            ),
            DemoRequirementItem(
                requirement_id="REQ-WPC-ETA",
                name="WPC Equipment Type Approval (ETA)",
                authority="Wireless Planning and Coordination Wing (WPC DOT)",
                jurisdiction="CENTRAL",
                domain="ELECTRONICS",
                status=ApplicabilityStatus.NOT_APPLICABLE,
                description="Equipment Type Approval for wireless RF equipment operating in de-licensed frequency bands.",
                why_it_applies="This requirement is NOT APPLICABLE because the company does not import or manufacture wireless radio transmitters or telecommunication hardware.",
                statutory_act="Indian Telegraph Act, 1885",
                facts_used=["sector=PHARMACEUTICAL"],
            ),
        ]
