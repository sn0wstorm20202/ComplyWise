"""Scenario 5: Sahaya Microfinance Services Ltd.

Location: Lucknow, Uttar Pradesh (34 operational branch offices across UP districts)
Profile: Microfinance and retail financial services company (small-ticket loans, income-generating credit to individual borrowers and micro-enterprises)
Scale: Annual loan disbursements of approximately ₹160 Crore
Workforce: ~420 employees (branch loan officers, field collection agents, risk analysts, credit operations)
Digital Operations: Field tablet/mobile app for customer onboarding and biometric e-KYC; banking and payment gateway integrations
Non-manufacturing: Strictly financial services and lending operations; zero physical manufacturing or chemical processing.

Classification: Microfinance / regulated financial services
NOT: Generic SaaS, generic retail, or industrial manufacturing.
"""

from __future__ import annotations

import re
from typing import Any

from common.enums import ApplicabilityStatus
from .base import DemoRequirementItem, DemoScenario


class MicrofinanceScenario(DemoScenario):
    scenario_id = "SAHAYA_MICROFINANCE_DEMO"
    name = "Sahaya Microfinance (Regulated Financial Services - Uttar Pradesh)"
    description = "Microfinance lending and financial inclusion company across Uttar Pradesh."

    def matches(self, business_name: str, context: dict[str, Any]) -> bool:
        name_lower = business_name.lower()
        if "sahaya" in name_lower or "microfinance" in name_lower or "sahaya microfinance" in name_lower:
            return True

        desc_parts = [
            business_name,
            str(context.get("product_description") or ""),
            str(context.get("primary_activity") or ""),
            str(context.get("sector") or ""),
        ]
        combined = " ".join(desc_parts).lower()

        is_microfinance = bool(
            re.search(r"\b(microfinance|micro-finance|small-ticket loans|micro-enterprise lending|loan disbursement|credit scoring|field collection agents)\b", combined)
        )
        is_not_mfg = not bool(
            re.search(r"\b(manufacturing|factory|processing plant|production line|machinery)\b", combined)
        )

        return is_microfinance and is_not_mfg

    def get_requirements(self, context: dict[str, Any]) -> list[DemoRequirementItem]:
        return [
            # 1. FIU-IND PMLA Reporting Entity Registration
            DemoRequirementItem(
                requirement_id="REQ-FIU-IND-PMLA-REPORTING",
                name="FIU-IND Reporting Entity Registration & PMLA Compliance",
                authority="Financial Intelligence Unit - India (FIU-IND)",
                jurisdiction="CENTRAL",
                domain="ANTI_MONEY_LAUNDERING",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory registration as a Reporting Entity under the Prevention of Money Laundering Act, 2002 (PMLA) and appointment of a Principal Officer for suspicious transaction reporting.",
                why_it_applies="Disbursing ₹160 Crore in microfinance loans and collecting loan repayments through 34 branch offices mandates statutory cash transaction (CTR) and suspicious transaction (STR) electronic filing on FINnet 2.0.",
                statutory_act="Prevention of Money Laundering Act, 2002 (Section 12) & PMLA (Maintenance of Records) Rules, 2005",
                required_documents=[
                    "FIU-IND Reporting Entity Registration Form on FINnet 2.0 portal",
                    "Board Resolution appointing Designated Director and Principal Officer",
                    "Anti-Money Laundering (AML) & Counter Financing of Terrorism (CFT) Board Policy",
                    "Customer Due Diligence (CDD) and Enhanced Due Diligence (EDD) Standard Operating Procedures",
                ],
                application_steps=[
                    "Submit Reporting Entity registration on FINnet 2.0 gateway",
                    "Verify credentials of Principal Officer and Designated Director",
                    "Obtain unique FIU-IND Reporting Entity ID (RE ID) and configure XML upload channel",
                    "Submit monthly Cash Transaction Reports (CTR) by 15th of succeeding month",
                ],
                timeline="Within 30 days of commencing commercial lending operations",
                statutory_fee="Nil government registration fee",
                facts_used=["is_lending_entity=True", "loan_disbursement=160_crore", "branches=34"],
                evidence_records=[
                    {
                        "evidence_id": "EV-FIU-PMLA-SEC12",
                        "source_title": "Prevention of Money Laundering Act, 2002",
                        "authority": "Financial Intelligence Unit - India",
                        "locator": "Section 12 — Reporting entity to maintain records",
                        "excerpt": "Every reporting entity shall maintain a record of all transactions and furnish to the Director information relating to such transactions within the prescribed time.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://fiumudra.gov.in/",
                    }
                ],
            ),

            # 2. CERSAI Security Interest Electronic Registration
            DemoRequirementItem(
                requirement_id="REQ-CERSAI-SECURITY-FILING",
                name="CERSAI Security Interest & Asset Charge Electronic Registration",
                authority="Central Registry of Securitisation Asset Reconstruction (CERSAI)",
                jurisdiction="CENTRAL",
                domain="FINANCIAL_REGULATION",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory electronic filing of security interests, micro-hypothecations, and equitable charges on borrower assets within 30 days under Chapter IV-A of SARFAESI Act.",
                why_it_applies="Lending institutions creating charges, hypothecations on micro-enterprise assets, or promissory security agreements must register security interests on the central portal to prevent fraudulent double-pledging.",
                statutory_act="Securitisation and Reconstruction of Financial Assets and Enforcement of Security Interest Act, 2002 (SARFAESI Act, Chapter IV-A)",
                required_documents=[
                    "CERSAI Entity Registration Form and Board Authorisation",
                    "Specimen Loan Agreement and Deed of Hypothecation / Security Pledge",
                    "Digital Signature Certificate of Authorised CERSAI Signatory",
                ],
                application_steps=[
                    "One-time institutional entity onboarding on CERSAI electronic portal",
                    "Upload loan and asset hypothecation records in batch format within 30 days of disbursement",
                    "Obtain statutory CERSAI Security Interest ID for each secured lending transaction",
                ],
                timeline="Within 30 days of loan sanction / hypothecation agreement execution",
                statutory_fee="₹10 to ₹100 per transaction depending on loan quantum tier",
                facts_used=["operates_micro_enterprise_loans=True", "turnover_disbursement=160_crore"],
                evidence_records=[
                    {
                        "evidence_id": "EV-CERSAI-SEC23",
                        "source_title": "SARFAESI Act, 2002 — Section 23",
                        "authority": "Central Registry of Securitisation (CERSAI)",
                        "locator": "Section 23 — Filing of transactions of securitisation and creation of security interest",
                        "excerpt": "The particulars of every transaction of creation of security interest shall be filed with the Central Registrar within thirty days after the date of such transaction.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://www.cersai.org.in/",
                    }
                ],
            ),

            # 3. Credit Information Companies (CICRA) Mandatory Reporting
            DemoRequirementItem(
                requirement_id="REQ-CIC-CREDIT-REPORTING",
                name="Credit Information Companies (CICRA) Monthly Borrower Data Reporting",
                authority="Reserve Bank of India / Credit Information Companies (CIBIL/Equifax)",
                jurisdiction="CENTRAL",
                domain="FINANCIAL_REGULATION",
                status=ApplicabilityStatus.APPLICABLE,
                description="Mandatory institutional membership and monthly credit data submission to all four RBI-authorised Credit Information Companies (CIBIL, Equifax, Experian, CRIF High Mark) under CICRA 2005.",
                why_it_applies="Extending credit across 34 branches requires statutory pre-disbursal credit check verification to enforce RBI microfinance borrower indebtedness caps (maximum allowable monthly debt-to-income ratio).",
                statutory_act="Credit Information Companies (Regulation) Act, 2005 (Section 15 & 17) & RBI Directives",
                required_documents=[
                    "Institutional Membership Agreement with CIBIL, Equifax, Experian, and CRIF High Mark",
                    "Standardized Credit Bureau Reporting Data Format (TUDF / CIR Format) specifications",
                    "Customer Credit Information Consent Clause in Loan Application Kit",
                ],
                application_steps=[
                    "Execute institutional data sharing agreements with all four licensed CICs",
                    "Automate real-time API credit score pulls during field loan origination",
                    "Submit monthly comprehensive borrower repayment and default ledger by 10th of every month",
                ],
                timeline="Pre-disbursal verification and monthly reporting cycle",
                statutory_fee="Annual institutional bureau membership and per-inquiry commercial inquiry fee",
                facts_used=["is_microfinance_lender=True", "uses_credit_scoring=True", "branches=34"],
                evidence_records=[
                    {
                        "evidence_id": "EV-CICRA-SEC15",
                        "source_title": "Credit Information Companies (Regulation) Act, 2005",
                        "authority": "Reserve Bank of India",
                        "locator": "Section 15 — Obligation of credit institutions to become members",
                        "excerpt": "Every credit institution shall become a member of at least one credit information company within three months of its incorporation.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://www.cibil.com/",
                    }
                ],
            ),

            # 4. DPDP Act & Financial KYC Data Fiduciary Mandate
            DemoRequirementItem(
                requirement_id="REQ-DPDP-FINANCIAL-KYC-DATA",
                name="DPDP Act & Aadhaar e-KYC Data Fiduciary Compliance",
                authority="Data Protection Board of India / MeitY / UIDAI",
                jurisdiction="CENTRAL",
                domain="DATA_PROTECTION",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory obligations as Data Fiduciary under DPDP Act 2023 and UIDAI Aadhaar Regulations governing collection, processing, and encrypted storage of biometric/e-KYC data.",
                why_it_applies="Field tablet app onboards hundreds of micro-borrowers daily, capturing Aadhaar numbers, biometric impressions, bank account proofs, and household geo-tag telemetry.",
                statutory_act="Digital Personal Data Protection Act, 2023 & Aadhaar (Targeted Delivery of Financial Subsidies) Act, 2016",
                required_documents=[
                    "Multilingual Borrower Consent Architecture Form (Hindi and regional languages)",
                    "Aadhaar e-KYC Masking and Vault Architecture Documentation (UIDAI Circular compliance)",
                    "Board Approved Customer Data Protection & Cyber Resilience Policy",
                    "Record of Processing Activities (ROPA) for mobile lending app and branch servers",
                ],
                application_steps=[
                    "Implement multi-lingual voice/text consent notice in field onboarding tablet application",
                    "Deploy mandatory Aadhaar number masking (storing only first 8 masked digits in local logs)",
                    "Implement end-to-end payload encryption between branch tablets and central cloud database",
                ],
                timeline="Continuous statutory operational obligation",
                statutory_fee="Statutory cybersecurity audit and penetration testing fees",
                facts_used=["collects_customer_kyc=True", "uses_mobile_app=True", "onboards_borrowers=True"],
                evidence_records=[
                    {
                        "evidence_id": "EV-DPDP-FIN-SEC8",
                        "source_title": "Digital Personal Data Protection Act, 2023",
                        "authority": "Ministry of Electronics & IT",
                        "locator": "Section 8 — Obligations of Data Fiduciary",
                        "excerpt": "A Data Fiduciary shall protect personal data in its possession or under its control by taking reasonable security safeguards to prevent personal data breach.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://www.meity.gov.in/content/digital-personal-data-protection-act-2023",
                    }
                ],
            ),

            # 5. RBI Digital Lending Guidelines & Fair Practices Code
            DemoRequirementItem(
                requirement_id="REQ-RBI-DIGITAL-LENDING-GUIDELINES",
                name="RBI Digital Lending Guidelines & Key Fact Statement (KFS) Mandate",
                authority="Reserve Bank of India (RBI)",
                jurisdiction="CENTRAL",
                domain="FINANCIAL_REGULATION",
                status=ApplicabilityStatus.APPLICABLE,
                description="Adherence to RBI Regulatory Framework for Digital Lending and Master Direction on Fair Practices Code (FPC) governing transparent loan pricing, Key Fact Statements (KFS), and ethical recovery conduct.",
                why_it_applies="Originating loans via digital mobile applications and deploying 420 field collection agents requires strict compliance with RBI directives prohibiting coercive recovery and mandating standardized Annual Percentage Rate (APR) disclosures.",
                statutory_act="Reserve Bank of India Act, 1934 & RBI Digital Lending Directions 2022 (DOR.CRE.REC.66/21.07.001/2022-23)",
                required_documents=[
                    "Standardized Key Fact Statement (KFS) template detailing all-inclusive APR and processing fees",
                    "Code of Conduct for Field Collection Agents & Borrowing Group Recovery Protocols",
                    "Grievance Redressal Mechanism Policy & Nodal Grievance Redressal Officer appointment",
                    "Direct Disbursal & Direct Repayment Flow Confirmation (no third-party pool accounts)",
                ],
                application_steps=[
                    "Integrate automated Key Fact Statement (KFS) generation into mobile onboarding app",
                    "Establish strict operating hours for field agents (09:00 AM to 06:00 PM only per RBI code)",
                    "Publish borrower grievance escalation matrix conspicuously across all 34 branch offices",
                ],
                timeline="Continuous operational mandate across all 34 branch operations",
                statutory_fee="Nil statutory filing fee",
                facts_used=["uses_mobile_app=True", "field_collection_agents=True", "branches=34"],
                evidence_records=[
                    {
                        "evidence_id": "EV-RBI-DLG-2022",
                        "source_title": "RBI Guidelines on Digital Lending, 2022",
                        "authority": "Reserve Bank of India",
                        "locator": "Paragraph 4 — Key Fact Statement (KFS)",
                        "excerpt": "Regulated Entities shall provide a Key Fact Statement to the borrower before the execution of the loan agreement, containing all-inclusive costs such as APR.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://www.rbi.org.in/",
                    }
                ],
            ),

            # 6. UP Shops & Establishments Multi-Branch Registration
            DemoRequirementItem(
                requirement_id="REQ-UP-SHOPS-ESTABLISHMENTS-BRANCHES",
                name="Uttar Pradesh Shops & Commercial Establishments Branch Registrations",
                authority="Department of Labour, Government of Uttar Pradesh",
                jurisdiction="UTTAR_PRADESH",
                domain="COMMERCIAL_REGISTRATION",
                status=ApplicabilityStatus.APPLICABLE,
                description="Statutory registration under Uttar Pradesh Dookan Aur Vanijya Adhishthan Adhiniyam, 1962 for central headquarters in Lucknow and all 34 district branch offices.",
                why_it_applies="Operating 34 physical commercial branch offices across UP districts employing 420 personnel requires individual establishment registration certificates.",
                statutory_act="Uttar Pradesh Dookan Aur Vanijya Adhishthan Adhiniyam, 1962 (Section 4-B & 4-C)",
                required_documents=[
                    "Form 'Kha' Application for Registration of Commercial Establishment",
                    "Registered Commercial Lease Deeds for each of the 34 branch office premises",
                    "Branch Employee Register detailing working hours, spread-over, and weekly rest days",
                    "Treasury Challan receipts evidencing statutory fee deposit per branch",
                ],
                application_steps=[
                    "Online registration submission via Uttar Pradesh Labour Department Dookan portal",
                    "Upload lease documentation and branch staff rolls for each district location",
                    "Download Form 'Ga' Registration Certificates for display at each branch premises",
                ],
                timeline="Within 30 days of opening each branch office",
                statutory_fee="₹500 to ₹2,000 per branch based on employee headcount per location",
                facts_used=["state=UTTAR_PRADESH", "branches=34", "employees=420", "headquarters=Lucknow"],
                evidence_records=[
                    {
                        "evidence_id": "EV-UP-SHOPS-ACT",
                        "source_title": "UP Dookan Aur Vanijya Adhishthan Adhiniyam, 1962",
                        "authority": "Department of Labour, Uttar Pradesh",
                        "locator": "Section 4-B — Registration of commercial establishments",
                        "excerpt": "Every owner of a shop or commercial establishment shall apply for registration of his establishment within the prescribed time.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://uplabour.gov.in/",
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
                description="Mandatory provident fund registration under the EPF Act, 1952 covering branch managers, field loan officers, and collection agents.",
                why_it_applies="Workforce of 420 employees substantially exceeds the statutory threshold of 20 employees.",
                statutory_act="Employees' Provident Funds and Miscellaneous Provisions Act, 1952",
                required_documents=[
                    "PAN Card and Certificate of Incorporation",
                    "Lucknow Head Office Commercial Address Proof",
                    "Consolidated monthly wage sheets across all 34 branch offices",
                ],
                application_steps=[
                    "Electronic registration on unified Shram Suvidha portal",
                    "DSC authentication by designated Director",
                    "Issuance of centralized EPF Establishment Code with sub-codes for branches",
                ],
                timeline="Within 30 days of crossing statutory headcount threshold",
                statutory_fee="Nil government registration fee",
                facts_used=["employees=420"],
                evidence_records=[
                    {
                        "evidence_id": "EV-EPF-SAHAYA",
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
                description="Social security health insurance under ESI Act, 1948 for field collection agents and junior branch executives earning gross wages up to ₹21,000/month.",
                why_it_applies="Company employs 420 personnel across ESI-notified urban and semi-urban centers in Uttar Pradesh.",
                statutory_act="Employees' State Insurance Act, 1948",
                required_documents=[
                    "PAN Card and Address Proof of Principal Place of Business",
                    "Consolidated employee roster with date of appointment and wage breakdown",
                    "Corporate Bank Account Details",
                ],
                application_steps=[
                    "Online registration on ESIC / Shram Suvidha portal",
                    "Instant generation of 17-digit ESI Employer Code",
                ],
                timeline="Within 15 days of crossing applicability threshold",
                statutory_fee="Nil government registration fee",
                facts_used=["employees=420", "state=UTTAR_PRADESH"],
                evidence_records=[
                    {
                        "evidence_id": "EV-ESI-SAHAYA",
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
                description="Mandatory constitution of Internal Committees under the Sexual Harassment of Women at Workplace Act, 2013 with regional representation across branch clusters.",
                why_it_applies="Employing 420 staff across 34 branches requires formal IC constitution and annual report filing with District Officers.",
                statutory_act="Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013",
                required_documents=[
                    "Formal Order of IC Constitution signed by Managing Director",
                    "CV and Acceptance Letter of External Independent Woman Member",
                    "Annual POSH Return Form for submission to District Magistrate, Lucknow",
                ],
                application_steps=[
                    "Appoint senior woman executive as Presiding Officer",
                    "Appoint regional IC members for eastern and western UP branch clusters",
                    "Submit annual compliance returns to respective District Officers by January 31",
                ],
                timeline="Immediate statutory establishment obligation",
                statutory_fee="Nil government fee",
                facts_used=["employees=420"],
                evidence_records=[
                    {
                        "evidence_id": "EV-POSH-SAHAYA",
                        "source_title": "Sexual Harassment of Women at Workplace Act, 2013",
                        "authority": "Ministry of Women and Child Development",
                        "locator": "Section 4(1)",
                        "excerpt": "Every employer of a workplace shall, by an order in writing, constitute a Committee to be known as the Internal Committee.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://wcd.nic.in/",
                    }
                ],
            ),

            # 10. RBI NBFC-MFI Certificate of Registration (NEEDS_INFORMATION)
            DemoRequirementItem(
                requirement_id="REQ-RBI-NBFC-MFI-COR",
                name="RBI Certificate of Registration (CoR) as NBFC-MFI",
                authority="Reserve Bank of India (Department of Non-Banking Supervision)",
                jurisdiction="CENTRAL",
                domain="FINANCIAL_REGULATION",
                status=ApplicabilityStatus.NEEDS_INFORMATION,
                description="Statutory Certificate of Registration (CoR) under Section 45-IA of the RBI Act, 1934 to commence and carry on the business of a Non-Banking Financial Company - Microfinance Institution (NBFC-MFI).",
                why_it_applies="Unresolved whether Sahaya operates under a direct NBFC-MFI licence issued by RBI (requiring minimum Net Owned Funds of ₹10 Crore and 75% qualifying assets) or as a Section 8 Microfinance company or Banking Business Correspondent (BC) entity.",
                statutory_act="Reserve Bank of India Act, 1934 (Section 45-IA) & Master Direction - RBI (Regulatory Framework for Microfinance Loans) Directions, 2022",
                required_documents=[
                    "Certified copy of Certificate of Incorporation and MOA/AOA showing microfinance lending object clause",
                    "Audited Net Owned Fund (NOF) Certificate (minimum ₹10 Crore / ₹5 Crore for NE region)",
                    "Fit and Proper Declarations, Banker Reports, and CIBIL CIR of all Directors",
                    "Business Plan detailing 3-year financial projections and branch expansion plan",
                ],
                application_steps=[
                    "Submit online application on RBI COSMOS / CMS supervisory portal",
                    "Submit physical dossier to Regional Office of Department of Non-Banking Supervision (DNBS), Lucknow",
                    "Attend supervisory interview with RBI Chief General Manager and obtain CoR",
                ],
                timeline="Needs verification (Contingent on entity's exact corporate/licensing structure)",
                statutory_fee="Statutory application processing fee per RBI schedule",
                missing_facts=["nbfc_mfi_registration_type", "net_owned_funds_crore", "deposit_taking_status"],
                evidence_records=[
                    {
                        "evidence_id": "EV-RBI-SEC45IA",
                        "source_title": "Reserve Bank of India Act, 1934",
                        "authority": "Reserve Bank of India",
                        "locator": "Section 45-IA — Requirement of registration and net owned fund",
                        "excerpt": "No non-banking financial company shall commence or carry on the business of a non-banking financial institution without obtaining a certificate of registration issued under this Chapter.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://cms.rbi.org.in/",
                    }
                ],
            ),

            # 11. IRDAI Microinsurance Corporate Agency (NEEDS_INFORMATION)
            DemoRequirementItem(
                requirement_id="REQ-IRDAI-CORPORATE-AGENT-MICROINSURANCE",
                name="IRDAI Corporate Agent (Composite) License for Credit-Life Microinsurance",
                authority="Insurance Regulatory and Development Authority of India (IRDAI)",
                jurisdiction="CENTRAL",
                domain="FINANCIAL_REGULATION",
                status=ApplicabilityStatus.NEEDS_INFORMATION,
                description="Statutory licence under IRDAI (Registration of Corporate Agents) Regulations, 2015 to solicit, distribute, and service bundled credit-life microinsurance policies for borrower loan protection.",
                why_it_applies="Unresolved whether bundled microinsurance (credit shield / term life covering loan balances upon borrower demise) is distributed directly through branch agents.",
                statutory_act="Insurance Regulatory and Development Authority of India Act, 1999 & IRDAI Corporate Agents Regulations, 2015",
                required_documents=[
                    "Corporate Agency Application in Form A on IRDAI BAP portal",
                    "Tie-up Agreement with licensed Life & General Insurance Companies",
                    "Principal Officer IRDAI Certification Examination Passing Certificate",
                ],
                application_steps=[
                    "Submit online application via IRDAI Business Analytics Project portal",
                    "Scrutiny of corporate governance and customer servicing track record",
                    "Issuance of Corporate Agent License",
                ],
                timeline="Needs verification (Contingent on credit-life microinsurance distribution)",
                statutory_fee="₹10,000 application fee + ₹25,000 registration fee",
                missing_facts=["distributes_microinsurance", "has_corporate_agent_tieup"],
                evidence_records=[
                    {
                        "evidence_id": "EV-IRDAI-CORP-AGENT",
                        "source_title": "IRDAI (Registration of Corporate Agents) Regulations, 2015",
                        "authority": "Insurance Regulatory and Development Authority of India",
                        "locator": "Regulation 3 — Registration required",
                        "excerpt": "No person shall act as a corporate agent for an insurer without obtaining a certificate of registration from the Authority under these regulations.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://bap.irdai.gov.in/",
                    }
                ],
            ),

            # 12. UP Factories Act (NOT_APPLICABLE)
            DemoRequirementItem(
                requirement_id="REQ-UP-FACTORIES-ACT",
                name="Uttar Pradesh Factories Rules - Industrial Factory License",
                authority="Directorate of Factories, Uttar Pradesh",
                jurisdiction="UTTAR_PRADESH",
                domain="MANUFACTURING",
                status=ApplicabilityStatus.NOT_APPLICABLE,
                description="Factory plan approval and manufacturing licence under Section 6 of the Factories Act, 1948.",
                why_it_applies="Not applicable because Sahaya Microfinance operates non-banking financial service branch offices and carries out zero manufacturing or factory activities.",
                statutory_act="Factories Act, 1948 (Section 2(m)) & UP Factories Rules",
                facts_used=["is_manufacturing=False", "is_financial_services=True"],
                evidence_records=[
                    {
                        "evidence_id": "EV-UP-FACTORIES-EXCLUSION",
                        "source_title": "Factories Act, 1948",
                        "authority": "Ministry of Labour and Employment",
                        "locator": "Section 2(m) — Manufacturing Process Definition",
                        "excerpt": "A factory premises requires carrying on of an industrial manufacturing process with or without the aid of power.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://uplabour.gov.in/",
                    }
                ],
            ),

            # 13. UPPCB Industrial Consent (NOT_APPLICABLE)
            DemoRequirementItem(
                requirement_id="REQ-UPPCB-CONSENT-POLLUTION",
                name="UPPCB Industrial Consent to Establish / Operate (CTO)",
                authority="Uttar Pradesh Pollution Control Board (UPPCB)",
                jurisdiction="UTTAR_PRADESH",
                domain="ENVIRONMENT",
                status=ApplicabilityStatus.NOT_APPLICABLE,
                description="Industrial environmental consent under Water and Air Acts mandatory for polluting industrial plants, boilers, and hazardous discharge facilities.",
                why_it_applies="Not applicable because commercial microfinance branch offices are non-industrial commercial establishments that generate zero industrial effluent or process emissions.",
                statutory_act="Water (Prevention and Control of Pollution) Act, 1974 & Air (Prevention and Control of Pollution) Act, 1981",
                facts_used=["generates_industrial_effluent=False", "is_commercial_office=True"],
                evidence_records=[
                    {
                        "evidence_id": "EV-UPPCB-EXCLUSION",
                        "source_title": "CPCB Harmonized Classification of Industrial Sectors",
                        "authority": "Central Pollution Control Board",
                        "locator": "Commercial Establishments Exemption",
                        "excerpt": "Financial service offices and commercial branch networks are exempted from industrial consent requirements under Water and Air Acts.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://uppcb.com/",
                    }
                ],
            ),

            # 14. DGFT IEC Code (NOT_APPLICABLE)
            DemoRequirementItem(
                requirement_id="REQ-DGFT-IEC-DOMESTIC",
                name="DGFT Importer-Exporter Code (Cross-Border Trade)",
                authority="Directorate General of Foreign Trade (DGFT)",
                jurisdiction="CENTRAL",
                domain="TRADE",
                status=ApplicabilityStatus.NOT_APPLICABLE,
                description="10-digit mandatory code for commercial import and export of physical commodities and cross-border commercial transactions.",
                why_it_applies="Not applicable because Sahaya Microfinance conducts strictly domestic microfinance lending operations within Uttar Pradesh and engages in no cross-border commodity trade.",
                statutory_act="Foreign Trade (Development and Regulation) Act, 1992",
                facts_used=["is_cross_border_trader=False", "operates_domestically=True"],
                evidence_records=[
                    {
                        "evidence_id": "EV-DGFT-EXCLUSION-MFI",
                        "source_title": "Foreign Trade Policy 2023",
                        "authority": "Directorate General of Foreign Trade",
                        "locator": "Chapter 2 — General Provisions Regarding Imports and Exports",
                        "excerpt": "IEC is mandatory only for entities undertaking import or export of goods and cross-border specified services.",
                        "verification_status": "VERIFIED",
                        "canonical_url": "https://dgft.gov.in/",
                    }
                ],
            ),
        ]
