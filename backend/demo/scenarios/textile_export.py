"""Scenario 3: SilkRoute Exports Pvt. Ltd.

Location: Tiruppur, Tamil Nadu
Profile: Apparel export house (buys finished garments from third-party manufacturers, exports to Europe and Middle East)
Non-manufacturing: DOES NOT operate a factory. DOES NOT dye garments. No wet processing, bleaching, or chemical effluent.
Facility: 22,000 sq ft commercial export warehouse (quality control inspection, barcoding, export carton packaging)
Workforce: 48 employees (QC inspectors, packing staff, export-documentation team, logistics coordinators)
Partners: Freight forwarders, customs house agents (CHA), third-party logistics (3PL)
Turnover: Approximately ₹32 Crore

Classification: Textile/apparel export business WITHOUT MANUFACTURING
CRITICAL INVARIANT: Explicitly suppress factory, dyeing/effluent, and manufacturing boiler obligations!
"""

from __future__ import annotations

import re
from typing import Any

from common.enums import ApplicabilityStatus
from .base import DemoRequirementItem, DemoScenario


class TextileExportScenario(DemoScenario):
    scenario_id = "SILKROUTE_TEXTILE_EXPORT_DEMO"
    name = "SilkRoute Exports (Apparel Export House - Tamil Nadu)"
    description = "Non-manufacturing apparel export house and warehouse in Tiruppur, Tamil Nadu."

    def matches(self, business_name: str, context: dict[str, Any]) -> bool:
        name_lower = business_name.lower()
        if "silkroute" in name_lower or "silk route" in name_lower:
            return True

        desc_parts = [
            business_name,
            str(context.get("product_description") or ""),
            str(context.get("primary_activity") or ""),
            str(context.get("sector") or ""),
        ]
        combined = " ".join(desc_parts).lower()

        is_garment_export = bool(
            re.search(r"\b(garment export|apparel export|textile export|export house|finished garments|buys finished)\b", combined)
        )
        is_non_mfg = bool(
            re.search(r"\b(without manufacturing|does not manufacture|does not operate a factory|no dyeing|no factory)\b", combined)
            or not re.search(r"\b(spinning mill|weaving mill|dyeing plant|fabric manufacturing plant)\b", combined)
        )

        return is_garment_export and is_non_mfg

    def get_requirements(self, context: dict[str, Any]) -> list[DemoRequirementItem]:
        return [
            # 1. DGFT Importer-Exporter Code (IEC)
            DemoRequirementItem(
                requirement_id="REQ-DGFT-IEC",
                name="Importer-Exporter Code (IEC) & DGFT Electronic Registration",
                authority="Directorate General of Foreign Trade (DGFT)",
                jurisdiction="CENTRAL",
                domain="TRADE",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory 10-digit PAN-based Importer-Exporter Code issued by DGFT required for customs clearance of commercial outbound apparel shipments.",
                why_it_applies="Commercial export of finished garments to buyers in Europe and the Middle East requires an active Importer-Exporter Code under the Foreign Trade Policy.",
                statutory_act="Foreign Trade (Development and Regulation) Act, 1992 & Foreign Trade Policy 2023",
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
                timeline="Prior to first export customs filing (Immediate automated issuance)",
                statutory_fee="₹500 online application processing fee",
                facts_used=["exports_overseas=True", "markets=['Europe', 'Middle East']", "turnover=32_crore"],
                evidence_records=[
                    {
                        "evidence_id": "EV-DGFT-SEC7",
                        "source_title": "Foreign Trade (Development and Regulation) Act, 1992",
                        "authority": "Directorate General of Foreign Trade",
                        "locator": "Section 7 — Importer-exporter code number",
                        "excerpt": "No person shall make any import or export except under an Importer-exporter Code Number granted by the Director General.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://dgft.gov.in/CP/?opt=iec-service",
                    }
                ],
            ),

            # 2. AEPC Registration-cum-Membership Certificate (RCMC)
            DemoRequirementItem(
                requirement_id="REQ-AEPC-RCMC",
                name="Apparel Export Promotion Council (AEPC) Registration (RCMC)",
                authority="Apparel Export Promotion Council (AEPC) / Ministry of Textiles",
                jurisdiction="CENTRAL",
                domain="TRADE",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory Registration-cum-Membership Certificate (RCMC) issued by AEPC required to claim Duty Drawback, RoSCTL, and export incentives under Foreign Trade Policy.",
                why_it_applies="Exporting ready-made garments (RMG) from Tiruppur requires valid registration with AEPC as a Merchant Exporter to access customs export benefits.",
                statutory_act="Foreign Trade Policy 2023 (Chapter 2, Para 2.55) & Ministry of Textiles Resolution",
                required_documents=[
                    "Self-certified copy of active IEC Certificate",
                    "Banker's Certificate on prescribed AEPC format certifying financial standing",
                    "Memorandum and Articles of Association / Partnership Deed",
                    "Declaration confirming Merchant Exporter status (non-manufacturing)",
                ],
                application_steps=[
                    "Online membership application submission via DGFT Common Digital Platform / AEPC portal",
                    "Remittance of annual membership subscription fee based on turnover bracket",
                    "Digital verification and electronic issuance of Form RCMC",
                ],
                timeline="10-15 working days prior to shipping bill benefit claims",
                statutory_fee="₹8,000 to ₹12,000 annual membership fee based on export turnover bracket",
                facts_used=["is_merchant_exporter=True", "commodity=finished_garments", "turnover=32_crore"],
                evidence_records=[
                    {
                        "evidence_id": "EV-AEPC-RCMC-FTP",
                        "source_title": "Foreign Trade Policy 2023 — Chapter 2",
                        "authority": "Ministry of Commerce and Industry",
                        "locator": "Paragraph 2.55 — Registration-cum-Membership Certificate",
                        "excerpt": "Any person applying for an authorisation to import or export, or for any other benefit or concession under this Policy, shall furnish an RCMC granted by the competent authority.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://www.aepcindia.com/",
                    }
                ],
            ),

            # 3. Customs ICEGATE & AEO-T1 Registration
            DemoRequirementItem(
                requirement_id="REQ-CUSTOMS-ICEGATE-EDIS",
                name="Customs ICEGATE Registration & Authorized Economic Operator Verification",
                authority="Central Board of Indirect Taxes and Customs (CBIC)",
                jurisdiction="CENTRAL",
                domain="TRADE",
                status=ApplicabilityStatus.APPLICABLE,
                description="Electronic Data Interchange (EDI) registration on ICEGATE portal for filing electronic shipping bills and Authorized Economic Operator (AEO-T1) tier verification.",
                why_it_applies="Clearing ocean and air freight container consignments through Tuticorin and Chennai ports requires authorized customs broker linkage on ICEGATE.",
                statutory_act="Customs Act, 1962 (Section 50) & Customs Electronic Data Interchange System Rules",
                required_documents=[
                    "Authorized Dealer (AD) Code letter issued by company bank",
                    "Customs Broker Authorization Letter / Power of Attorney",
                    "Valid Class 3 Digital Signature Certificate for Customs Broker/Director",
                    "GSTIN Registration Certificate and cancelled corporate cheque",
                ],
                application_steps=[
                    "Register bank AD Code and IFSC at port of export (Tuticorin Sea / Chennai Air)",
                    "Link authorized Customs House Agent (CHA) on ICEGATE user profile",
                    "Digital signature token registration for automated e-Sanchit document clearance",
                ],
                timeline="Within 7 working days prior to first container stuffing",
                statutory_fee="Nil government registration fee",
                facts_used=["freight_destinations=['Europe', 'Middle East']", "clears_via_ports=True"],
                evidence_records=[
                    {
                        "evidence_id": "EV-CUSTOMS-SEC50",
                        "source_title": "Customs Act, 1962",
                        "authority": "Central Board of Indirect Taxes and Customs",
                        "locator": "Section 50 — Entry of goods for exportation",
                        "excerpt": "The exporter of any goods shall present to the proper officer a shipping bill or a bill of export in the prescribed form electronically.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://www.icegate.gov.in/",
                    }
                ],
            ),

            # 4. Legal Metrology Pre-Packer / Exporter Registration
            DemoRequirementItem(
                requirement_id="REQ-LEGAL-METROLOGY-PACKER",
                name="Legal Metrology Pre-Packer & Exporter Registration (Rule 27)",
                authority="Department of Consumer Affairs / Legal Metrology Controller",
                jurisdiction="CENTRAL",
                domain="STANDARDS",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory registration as a pre-packer and exporter of packaged commodities under Rule 27 of the Legal Metrology (Packaged Commodities) Rules, 2011.",
                why_it_applies="Packing ready-made apparel into retail export boxes, polybags, and barcode-labeled shipping cartons at the 22,000 sq ft Tiruppur warehouse requires statutory packer registration.",
                statutory_act="Legal Metrology Act, 2009 & Legal Metrology (Packaged Commodities) Rules, 2011",
                required_documents=[
                    "Application in Form I under Rule 27",
                    "Specimen copy of export carton labeling and garment barcode tags",
                    "Warehouse Lease Agreement and Proof of Commercial Occupancy",
                    "List of apparel items packaged for export (shirts, trousers, knitwear)",
                ],
                application_steps=[
                    "Submit online application via National Legal Metrology portal (e-LM)",
                    "Upload label artworks demonstrating mandatory pre-pack disclosures",
                    "Remit statutory registration fee and obtain electronic Registration Certificate",
                ],
                timeline="Prior to commercial packing of retail consignments",
                statutory_fee="₹500 statutory registration fee",
                facts_used=["operates_warehouse=True", "performs_packing=True", "facility_area=22000_sqft"],
                evidence_records=[
                    {
                        "evidence_id": "EV-LM-RULE27-SILK",
                        "source_title": "Legal Metrology (Packaged Commodities) Rules, 2011",
                        "authority": "Department of Consumer Affairs",
                        "locator": "Rule 27 — Registration of manufacturers, packers and importers",
                        "excerpt": "Every individual, firm or company which pre-packs or imports any commodity for sale or distribution shall make an application for the registration of his name and complete address.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://lm.doca.gov.in/",
                    }
                ],
            ),

            # 5. Tamil Nadu Shops & Establishments Registration
            DemoRequirementItem(
                requirement_id="REQ-TN-SHOPS-ESTABLISHMENTS",
                name="Tamil Nadu Shops & Commercial Establishments Registration",
                authority="Department of Labour, Government of Tamil Nadu",
                jurisdiction="TAMIL_NADU",
                domain="COMMERCIAL_REGISTRATION",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory registration under Tamil Nadu Shops and Establishments Act, 1947 for commercial export office and non-factory warehouse premises.",
                why_it_applies="Operating a 22,000 sq ft commercial warehouse and corporate export office in Tiruppur with 48 employees requires statutory commercial establishment registration.",
                statutory_act="Tamil Nadu Shops and Establishments Act, 1947 & Tamil Nadu Shops and Establishments Rules",
                required_documents=[
                    "Form I Registration Application signed by designated Director",
                    "Registered Commercial Lease Agreement for Tiruppur Warehouse",
                    "Employee Register with designations, working hours, and wage details",
                    "Property Tax Receipt / Commercial Occupancy Proof",
                ],
                application_steps=[
                    "Online registration through Tamil Nadu Department of Labour portal",
                    "Self-certification of working conditions and weekly holiday schedule",
                    "Instant issuance of Registration Certificate",
                ],
                timeline="Within 30 days of commencing commercial operations at the warehouse",
                statutory_fee="₹1,500 based on workforce size tier (20-50 employees)",
                facts_used=["location=Tiruppur", "state=TAMIL_NADU", "employees=48", "is_factory=False"],
                evidence_records=[
                    {
                        "evidence_id": "EV-TN-SHOPS-ACT",
                        "source_title": "Tamil Nadu Shops and Establishments Act, 1947",
                        "authority": "Department of Labour, Tamil Nadu",
                        "locator": "Section 4 — Registration of establishments",
                        "excerpt": "Every employer of an establishment shall make an application for registration to the Inspector within thirty days of the date on which the establishment begins to function.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://labour.tn.gov.in/",
                    }
                ],
            ),

            # 6. EPF Registration
            DemoRequirementItem(
                requirement_id="REQ-EPF-REGISTRATION",
                name="Employees' Provident Fund (EPF) Registration",
                authority="Employees' Provident Fund Organisation (EPFO)",
                jurisdiction="CENTRAL",
                domain="LABOR",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory provident fund registration under the Employees' Provident Funds and Miscellaneous Provisions Act, 1952.",
                why_it_applies="Workforce of 48 personnel (QC inspectors, packers, documentation staff) exceeds the statutory threshold of 20 employees.",
                statutory_act="Employees' Provident Funds and Miscellaneous Provisions Act, 1952",
                required_documents=[
                    "PAN Card and Certificate of Incorporation",
                    "Proof of Principal Place of Business in Tiruppur",
                    "Monthly wage register showing salary details of 48 employees",
                ],
                application_steps=[
                    "Online registration through Unified Shram Suvidha Portal",
                    "Electronic verification via Digital Signature Certificate (DSC)",
                    "Generation of EPF Establishment Code",
                ],
                timeline="Within 30 days of crossing 20 employees",
                statutory_fee="Nil government registration fee",
                facts_used=["employees=48"],
                evidence_records=[
                    {
                        "evidence_id": "EV-EPF-SILK",
                        "source_title": "EPF and Miscellaneous Provisions Act, 1952",
                        "authority": "Employees' Provident Fund Organisation",
                        "locator": "Section 1(3)(b)",
                        "excerpt": "This Act applies to every establishment employing twenty or more persons.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://epfindia.gov.in/",
                    }
                ],
            ),

            # 7. ESI Registration
            DemoRequirementItem(
                requirement_id="REQ-ESI-REGISTRATION",
                name="Employees' State Insurance (ESI) Registration",
                authority="Employees' State Insurance Corporation (ESIC)",
                jurisdiction="CENTRAL",
                domain="LABOR",
                status=ApplicabilityStatus.APPLICABLE,
                description="Social security and health insurance coverage under the ESI Act, 1948 for warehouse packing and support personnel.",
                why_it_applies="Company employs 48 staff in Tiruppur (an ESI-implemented district) with eligible workers earning wages under ₹21,000/month.",
                statutory_act="Employees' State Insurance Act, 1948",
                required_documents=[
                    "PAN Card and Address Proof of the Establishment",
                    "List of employees with date of joining and gross salary breakdown",
                    "Corporate Bank Account Details",
                ],
                application_steps=[
                    "Online establishment registration on ESIC / Shram Suvidha portal",
                    "Instant generation of 17-digit ESI Employer Code",
                ],
                timeline="Within 15 days of crossing applicability threshold",
                statutory_fee="Nil government registration fee",
                facts_used=["employees=48", "location=Tiruppur"],
                evidence_records=[
                    {
                        "evidence_id": "EV-ESI-SILK",
                        "source_title": "Employees' State Insurance Act, 1948",
                        "authority": "Employees' State Insurance Corporation",
                        "locator": "Section 2(12)",
                        "excerpt": "This Act applies to all establishments where ten or more persons are employed.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://esic.gov.in/",
                    }
                ],
            ),

            # 8. POSH Internal Committee
            DemoRequirementItem(
                requirement_id="REQ-POSH-INTERNAL-COMMITTEE",
                name="Internal Committee for Prevention of Sexual Harassment (POSH)",
                authority="Ministry of Women and Child Development",
                jurisdiction="CENTRAL",
                domain="EMPLOYMENT_SAFETY",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory constitution of an Internal Committee under the Sexual Harassment of Women at Workplace Act, 2013.",
                why_it_applies="Employing 48 personnel across administrative, QC, and warehouse packing divisions exceeds the statutory minimum of 10 employees.",
                statutory_act="Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013",
                required_documents=[
                    "Formal Order of IC Constitution signed by Managing Director",
                    "CV and Acceptance Letter of External Independent Woman Member",
                    "Annual POSH Return Form for submission to District Collector, Tiruppur",
                ],
                application_steps=[
                    "Appoint senior woman employee as Presiding Officer",
                    "Appoint minimum two employee members and one independent external member",
                    "Submit annual compliance return to District Officer",
                ],
                timeline="Immediate statutory establishment obligation",
                statutory_fee="Nil government fee",
                facts_used=["employees=48"],
                evidence_records=[
                    {
                        "evidence_id": "EV-POSH-SILK",
                        "source_title": "Sexual Harassment of Women at Workplace Act, 2013",
                        "authority": "Ministry of Women and Child Development",
                        "locator": "Section 4(1)",
                        "excerpt": "Every employer of a workplace shall, by an order in writing, constitute a Committee to be known as the Internal Committee.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://wcd.nic.in/",
                    }
                ],
            ),

            # 9. EU REACH / Chemical Substance Compliance (NEEDS_INFORMATION)
            DemoRequirementItem(
                requirement_id="REQ-REACH-OEKO-TEX-EU-COMPLIANCE",
                name="EU REACH Regulation & OEKO-TEX Standard 100 Chemical Verification",
                authority="European Chemicals Agency (ECHA) / DGFT",
                jurisdiction="CENTRAL",
                domain="TRADE",
                status=ApplicabilityStatus.NEEDS_INFORMATION,
                description="Mandatory verification that third-party manufactured garments comply with EU REACH restricted substance lists (Annex XVII: azo dyes, nickel release, formaldehyde, phthalates).",
                why_it_applies="Unresolved whether third-party fabric suppliers provide verified OEKO-TEX Standard 100 certificates or independent laboratory batch test reports required by European retail buyers.",
                statutory_act="EU REACH Regulation (EC No 1907/2006) & Foreign Trade Policy Export Quality Directives",
                required_documents=[
                    "Third-Party Manufacturer OEKO-TEX Standard 100 / GOTS Certificates",
                    "Accredited Laboratory (NABL / ISO 17025) Chemical Test Reports",
                    "EU Buyer Specific Restricted Substances List (RSL) Declarations",
                ],
                application_steps=[
                    "Audit third-party manufacturer chemical management documentation",
                    "Obtain batch-level testing reports prior to container stuffing",
                ],
                timeline="Needs verification (Contingent on EU buyer chemical audit protocol)",
                statutory_fee="Commercial laboratory chemical testing fees per garment style",
                missing_facts=["supplier_chemical_testing_certificates", "eu_buyer_rsl_specifications"],
                evidence_records=[
                    {
                        "evidence_id": "EV-REACH-ANNEX-XVII",
                        "source_title": "EU REACH Regulation (EC 1907/2006)",
                        "authority": "European Chemicals Agency",
                        "locator": "Annex XVII — Restrictions on the manufacture, placing on the market and use of dangerous substances",
                        "excerpt": "Azo dyes which may cleave to aromatic amines shall not be used in textile articles which may come into direct and prolonged contact with human skin.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://echa.europa.eu/",
                    }
                ],
            ),

            # 10. Tamil Nadu Fire Services Warehouse NOC (NEEDS_INFORMATION)
            DemoRequirementItem(
                requirement_id="REQ-TN-FIRE-NOC-WAREHOUSE",
                name="Tamil Nadu Fire and Rescue Services Commercial Warehouse NOC",
                authority="Tamil Nadu Fire and Rescue Services Department (TNFRS)",
                jurisdiction="TAMIL_NADU",
                domain="SAFETY",
                status=ApplicabilityStatus.NEEDS_INFORMATION,
                description="Statutory Fire Safety Compliance Certificate under Tamil Nadu Fire Service Act, 1985 for commercial storage warehouse exceeding 15,000 sq ft.",
                why_it_applies="Unresolved whether the 22,000 sq ft warehouse holds an existing multi-occupant industrial estate fire clearance or requires an individual standalone Fire NOC.",
                statutory_act="Tamil Nadu Fire Service Act, 1985 & National Building Code of India (Part 4)",
                required_documents=[
                    "Warehouse Architectural Plan showing storage aisle width and fire exit routes",
                    "Fire Extinguisher, Hose Reel, and Yard Hydrant Layout Drawing",
                    "Underground Water Storage Tank capacity certificate (>50,000 Litres)",
                ],
                application_steps=[
                    "Submit online application on TNFRS portal",
                    "Physical inspection by Divisional Fire Officer",
                ],
                timeline="Needs verification (Contingent on host building fire clearance status)",
                statutory_fee="Statutory inspection fee based on built-up floor area",
                missing_facts=["host_building_fire_noc_status", "stacking_height_meters"],
                evidence_records=[
                    {
                        "evidence_id": "EV-TNFRS-ACT-SEC13",
                        "source_title": "Tamil Nadu Fire Service Act, 1985",
                        "authority": "Tamil Nadu Fire and Rescue Services",
                        "locator": "Section 13 — Precautions against fire",
                        "excerpt": "The owner or occupier of commercial storage premises shall take such precautions against fire as may be prescribed.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://www.tnfrs.tn.gov.in/",
                    }
                ],
            ),

            # 11. Tamil Nadu Factory License (NOT_APPLICABLE) - CRITICAL INVARIANT
            DemoRequirementItem(
                requirement_id="REQ-TN-FACTORIES-ACT-MFG",
                name="Tamil Nadu Factories Rules - Factory Manufacturing License",
                authority="Directorate of Industrial Safety and Health (DISH), Tamil Nadu",
                jurisdiction="TAMIL_NADU",
                domain="MANUFACTURING",
                status=ApplicabilityStatus.NOT_APPLICABLE,
                description="Factory plan approval and manufacturing licence under Section 6 of the Factories Act, 1948.",
                why_it_applies="Not applicable because SilkRoute Exports is a pure merchant exporter operating a commercial warehouse and does NOT manufacture, weave, or stitch garments.",
                statutory_act="Factories Act, 1948 (Section 2(m)) & Tamil Nadu Factories Rules, 1950",
                facts_used=["is_manufacturing=False", "is_factory=False", "business_model=MERCHANT_EXPORTER"],
                evidence_records=[
                    {
                        "evidence_id": "EV-TN-FACTORY-EXCLUSION",
                        "source_title": "Factories Act, 1948 — Section 2(m)",
                        "authority": "Ministry of Labour and Employment",
                        "locator": "Section 2(m) — Manufacturing Process Requirement",
                        "excerpt": "Factory means any premises where a manufacturing process is being carried on with or without the aid of power.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://dish.tn.gov.in/",
                    }
                ],
            ),

            # 12. TNPCB Dyeing & Bleaching Consent (NOT_APPLICABLE) - CRITICAL INVARIANT
            DemoRequirementItem(
                requirement_id="REQ-TNPCB-CTO-DYEING-BLEACHING",
                name="TNPCB Red Category Consent for Textile Dyeing & Bleaching (ZLD)",
                authority="Tamil Nadu Pollution Control Board (TNPCB)",
                jurisdiction="TAMIL_NADU",
                domain="ENVIRONMENT",
                status=ApplicabilityStatus.NOT_APPLICABLE,
                description="Red Category industrial consent and Zero Liquid Discharge (ZLD) effluent treatment mandate under Water and Air Acts.",
                why_it_applies="Not applicable because the company does NOT operate dyeing, bleaching, washing, or wet processing facilities. The warehouse generates zero trade effluent.",
                statutory_act="Water (Prevention and Control of Pollution) Act, 1974 & Environment (Protection) Act, 1986",
                facts_used=["does_dyeing=False", "generates_trade_effluent=False", "is_wet_processor=False"],
                evidence_records=[
                    {
                        "evidence_id": "EV-TNPCB-DYEING-ZLD-EXCLUSION",
                        "source_title": "TNPCB Comprehensive Guidelines on Textile Dyeing Units",
                        "authority": "Tamil Nadu Pollution Control Board",
                        "locator": "Clause 1.2 — Applicability to wet textile processing",
                        "excerpt": "Consent and Zero Liquid Discharge (ZLD) mandates apply exclusively to textile units undertaking wet chemical processing, bleaching, and dyeing.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://tnpcb.gov.in/",
                    }
                ],
            ),

            # 13. Boiler Registration (NOT_APPLICABLE) - CRITICAL INVARIANT
            DemoRequirementItem(
                requirement_id="REQ-IBR-BOILER-TEXTILE",
                name="Indian Boiler Regulations (IBR) High-Pressure Steam Boiler License",
                authority="Directorate of Boilers, Tamil Nadu / Central Boilers Board",
                jurisdiction="TAMIL_NADU",
                domain="SAFETY",
                status=ApplicabilityStatus.NOT_APPLICABLE,
                description="Registration and statutory annual steam inspection for industrial steam boilers exceeding 25 litres capacity.",
                why_it_applies="Not applicable because the commercial packing warehouse operates no industrial boilers, autoclaves, or steam generation equipment.",
                statutory_act="Boilers Act, 1923 & Indian Boiler Regulations, 1950",
                facts_used=["has_boiler=False", "operates_steam_equipment=False"],
                evidence_records=[
                    {
                        "evidence_id": "EV-BOILERS-ACT-EXCLUSION",
                        "source_title": "Boilers Act, 1923",
                        "authority": "Central Boilers Board",
                        "locator": "Section 6 — Prohibition of use of unregistered or uncertificated boiler",
                        "excerpt": "Save as otherwise expressly provided in this Act, no owner of a boiler shall use the boiler unless it has been registered.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://dpiit.gov.in/",
                    }
                ],
            ),

            # 14. Textiles Committee Cess on Fabric Manufacturers (NOT_APPLICABLE)
            DemoRequirementItem(
                requirement_id="REQ-TEXTILES-COMMITTEE-CESS-PRODUCER",
                name="Textiles Committee Cess on Indigenous Fabric Manufacturers",
                authority="Textiles Committee, Ministry of Textiles",
                jurisdiction="CENTRAL",
                domain="TRADE",
                status=ApplicabilityStatus.NOT_APPLICABLE,
                description="Statutory cess levied on primary manufacturers of textiles and textile machinery under Section 5A of the Textiles Committee Act, 1963.",
                why_it_applies="Not applicable because SilkRoute Exports is a trading export house that buys finished garments, and is not a primary manufacturer of cloth or yarn.",
                statutory_act="Textiles Committee Act, 1963 (Section 5A)",
                facts_used=["is_cloth_producer=False", "is_yarn_manufacturer=False"],
                evidence_records=[
                    {
                        "evidence_id": "EV-TEXTILES-CESS-EXCLUSION",
                        "source_title": "Textiles Committee Act, 1963 — Section 5A",
                        "authority": "Textiles Committee",
                        "locator": "Section 5A — Imposition of cess on textiles manufactured in India",
                        "excerpt": "There shall be levied and collected as a cess a duty of excise on all textiles manufactured in India by the manufacturer of such textiles.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://textilescommittee.nic.in/",
                    }
                ],
            ),
        ]
