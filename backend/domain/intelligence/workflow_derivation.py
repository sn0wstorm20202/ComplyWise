"""Dynamic statutory workflow derivation engine.

Authority: PRD_v2.0 §19; TRD_v2.0 §30; Milestone Parts 6, 23, 24.

Derives sequential, dependency-aware clearance workflows covering:
1. Mandatory Statutory Compliance (FSSAI, Pollution CTE/CTO, Factory, Labor, DGFT, Cyber, Data Protection).
2. Quality & Industrial Standards (BIS CRS / ISI Mark Certification, ISO Standards).
3. Government Schemes & Subsidies (MSME Udyam, CGTMSE, ZED Certification, Cluster Development).
4. Full database synchronization: reads and syncs persistent step progress from ComplianceCase.
"""

from __future__ import annotations

import logging
from typing import Any

from django.utils import timezone

from common.enums import ApplicabilityStatus, CaseStatus
from apps.applicability.models import DecisionResult, DecisionRun
from apps.businesses.models import Business
from apps.knowledge.models import RequirementDefinition
from apps.schemes.engine.matcher import match_business_schemes
from apps.workflows.models import ComplianceCase
from domain.context.business_context import DerivedBusinessContext, build_business_context
from knowledge_packs.catalogs import STATUTORY_PORTALS

logger = logging.getLogger(__name__)

# Enriched Procedural Workflow Templates with Official Portals, Steps, and Required Documents
ENRICHED_WORKFLOW_TEMPLATES: dict[str, dict[str, Any]] = {
    "FOOD": {
        "portal_name": "FoSCoS (Food Safety Compliance System)",
        "portal_url": STATUTORY_PORTALS["FOSCOS"],
        "estimated_days": "30-45 Days",
        "required_documents": [
            "Food Safety Management System (FSMS) Plan",
            "Premises Lease Agreement / Ownership Deed",
            "Facility Layout Blueprint & Equipment List",
            "Water Potability Test Report from NABL Accredited Lab",
            "Authorized Signatory Identification & Food Safety Officer Declaration",
        ],
        "steps": [
            {
                "step_number": 1,
                "title": "Compile FSMS & Premises Documentation",
                "description": "Prepare Food Safety Management System plan, facility layout blueprint, water test report, and list of food handling machinery.",
                "duration": "7-10 Days",
                "documents_required": [
                    "Food Safety Management System (FSMS) Plan",
                    "Facility Layout Blueprint",
                    "Water Potability Test Report",
                ],
            },
            {
                "step_number": 2,
                "title": "Online Application Submission via FoSCoS",
                "description": "Submit Form B on FoSCoS portal with designated Food Business Operator details and pay prescribed statutory fee.",
                "duration": "1-2 Days",
                "documents_required": ["Premises Lease Agreement / Ownership Deed"],
            },
            {
                "step_number": 3,
                "title": "Departmental Scrutiny & Query Response",
                "description": "FSSAI Designated Officer scrutinizes application. Address any clarifications or document requisitions within 30 days.",
                "duration": "10-15 Days",
                "documents_required": ["Additional Clarification Evidence (if queried)"],
            },
            {
                "step_number": 4,
                "title": "Pre-Licensing Site Inspection",
                "description": "Food Safety Officer conducts on-site inspection of processing facility to verify sanitary and hygienic requirements.",
                "duration": "7-14 Days",
                "documents_required": ["Equipment Calibration & Sanitary Log"],
            },
            {
                "step_number": 5,
                "title": "Grant & Download of FSSAI License",
                "description": "Upon approval, digitally signed 14-digit FSSAI License is issued for immediate display at processing premises.",
                "duration": "2-3 Days",
                "documents_required": ["Official FSSAI License Certificate"],
            },
        ],
    },
    "ENVIRONMENT": {
        "portal_name": "State Pollution Control Board OCMMS / XGN Portal",
        "portal_url": STATUTORY_PORTALS["OCMMS"],
        "estimated_days": "45-60 Days",
        "required_documents": [
            "Detailed Project Report (DPR) with Capital Investment",
            "Industrial Water Balance Diagram",
            "Effluent Treatment Plant (ETP) / APCM Engineering Design",
            "Site Topographical Plan & Buffer Distance Proof",
            "Chartered Accountant Capital Investment Certificate",
        ],
        "steps": [
            {
                "step_number": 1,
                "title": "Environmental Baseline & ETP Scheme Preparation",
                "description": "Finalize Detailed Project Report (DPR), industrial water balance diagram, and Effluent Treatment Plant (ETP) / APCM design.",
                "duration": "10-14 Days",
                "documents_required": [
                    "Detailed Project Report (DPR)",
                    "Industrial Water Balance Diagram",
                    "ETP / APCM Design Blueprint",
                ],
            },
            {
                "step_number": 2,
                "title": "Consent to Establish (CTE) Application Submission",
                "description": "File CTE application online through state SPCB single-window portal with capital investment declarations and fee payment.",
                "duration": "1-2 Days",
                "documents_required": ["CA Gross Capital Investment Certificate"],
            },
            {
                "step_number": 3,
                "title": "Regional Officer Siting & Technical Scrutiny",
                "description": "PCB Regional Officer inspects proposed industrial site to confirm buffer distance from residential areas and water bodies.",
                "duration": "15-20 Days",
                "documents_required": ["Site Topographical Map & Land Title"],
            },
            {
                "step_number": 4,
                "title": "Issuance of Consent to Establish (CTE)",
                "description": "Board issues CTE containing pollution control conditions to be installed during facility construction.",
                "duration": "7-10 Days",
                "documents_required": ["Official CTE Order Copy"],
            },
            {
                "step_number": 5,
                "title": "Post-Construction Consent to Operate (CTO) Filing",
                "description": "After ETP erection and trial run notification, apply for CTO prior to beginning commercial production.",
                "duration": "20-30 Days",
                "documents_required": ["ETP Commissioning Report & Treated Effluent Analysis"],
            },
        ],
    },
    "LABOR": {
        "portal_name": "Directorate of Industrial Safety & Health (DISH) Single Window",
        "portal_url": STATUTORY_PORTALS["DISH"],
        "estimated_days": "30-40 Days",
        "required_documents": [
            "Architectural Factory Building Plans (Signed by Draughtsman)",
            "Machinery Layout & Electric Motor HP Schedule",
            "Chartered Engineer Structural Stability Certificate",
            "Fire Department Provisional NOC",
            "Worker Welfare & First-Aid Policy Declaration",
        ],
        "steps": [
            {
                "step_number": 1,
                "title": "Factory Building Plan & Machinery Layout Submission",
                "description": "Submit architectural drawings and electric motor HP distribution to the Chief Inspector of Factories for plan approval.",
                "duration": "10-14 Days",
                "documents_required": [
                    "Architectural Factory Building Plans",
                    "Machinery Layout & Motor HP Schedule",
                ],
            },
            {
                "step_number": 2,
                "title": "Structural Stability & Fire Safety Certification",
                "description": "Obtain structural stability endorsement from chartered engineer and Fire Department provisional NOC.",
                "duration": "7-10 Days",
                "documents_required": [
                    "Chartered Engineer Structural Stability Certificate",
                    "Fire Department Provisional NOC",
                ],
            },
            {
                "step_number": 3,
                "title": "Notice of Occupation Filing (Form 1 / Form 2)",
                "description": "Submit statutory Notice of Occupation and Factory License registration application at least 15 days before factory operation.",
                "duration": "1-2 Days",
                "documents_required": ["Form 1 / Form 2 Notice of Occupation"],
            },
            {
                "step_number": 4,
                "title": "Factory Inspector Joint Safety Verification",
                "description": "Factory Inspector conducts shop-floor safety audit checking ventilation, machine guarding, and worker welfare amenities.",
                "duration": "10-15 Days",
                "documents_required": ["Safety Committee Minutes & Welfare Facilities Checklist"],
            },
            {
                "step_number": 5,
                "title": "Grant of Factory License",
                "description": "Issuance of renewable Factory License under Section 6 of the Factories Act.",
                "duration": "3-5 Days",
                "documents_required": ["Official Factory License Certificate"],
            },
        ],
    },
    "TRADE": {
        "portal_name": "DGFT IEC Online Service Portal",
        "portal_url": STATUTORY_PORTALS["DGFT"],
        "estimated_days": "2-4 Days",
        "required_documents": [
            "Company PAN Card Copy",
            "Certificate of Incorporation / LLP Agreement",
            "Pre-printed Bank Cancelled Cheque / Bank Certificate (PFMS Validated)",
            "Director / Partner Aadhaar, PAN & Class 3 Digital Signature (DSC)",
            "Registered Office Address Proof (Electricity Bill / Lease Agreement)",
        ],
        "steps": [
            {
                "step_number": 1,
                "title": "Digital Credentials & Entity Identity Validation",
                "description": "Validate company PAN, corporate identification number (CIN/LLPIN), and Class 3 Digital Signature Certificate (DSC) credentials for designated authorized signatory.",
                "duration": "1 Day",
                "documents_required": ["Company PAN Card Copy", "Director / Signatory DSC & Aadhaar"],
            },
            {
                "step_number": 2,
                "title": "DGFT Single Sign-On (SSO) Portal Registration",
                "description": "Create entity profile on DGFT unified portal, link authorized signatory email and mobile with OTP verification, and connect corporate PAN.",
                "duration": "1 Day",
                "documents_required": ["Certificate of Incorporation / LLP Agreement"],
            },
            {
                "step_number": 3,
                "title": "Electronic ANF-2A Application Filing & Bank Verification",
                "description": "Complete electronic Importer-Exporter Code application form (ANF-2A), input IFSC & account number, and upload pre-printed cancelled cheque for automated bank account validation.",
                "duration": "1 Day",
                "documents_required": ["Pre-printed Bank Cancelled Cheque / Bank Certificate"],
            },
            {
                "step_number": 4,
                "title": "Statutory Processing Fee Remittance via Bharatkosh",
                "description": "Remit statutory application fee of ₹500 via non-tax receipt portal (Bharatkosh payment gateway) and generate transaction confirmation.",
                "duration": "Instant",
                "documents_required": ["Bharatkosh Payment Transaction Receipt"],
            },
            {
                "step_number": 5,
                "title": "Instant Electronic IEC Issuance & ICEGATE Integration",
                "description": "System generates 10-digit alphanumeric e-IEC allotment letter and automatically transmits credentials to ICEGATE customs clearing servers.",
                "duration": "Instant",
                "documents_required": ["Official Electronic IEC Certificate"],
            },
            {
                "step_number": 6,
                "title": "Annual Mandatory IEC Status Verification",
                "description": "Undertake mandatory electronic annual verification and confirmation of entity details on the DGFT dashboard between April and June as mandated under FTP Para 2.05.",
                "duration": "Annual",
                "documents_required": ["Annual IEC Electronic Confirmation Certificate"],
            },
        ],
    },
    "STANDARD": {
        "portal_name": "BIS Manakonline Portal",
        "portal_url": "https://www.manakonline.in",
        "estimated_days": "30-60 Days",
        "required_documents": [
            "NABL-Accredited Test Laboratory Test Reports",
            "Manufacturing Machinery & In-house Test Equipment Calibration Records",
            "Quality Control Personnel Qualifications & Organogram",
            "Brand Name / Trademark Registration Certificate",
            "Factory Layout Plan & Process Flow Chart",
        ],
        "steps": [
            {
                "step_number": 1,
                "title": "Applicable Indian Standard Identification & Gap Analysis",
                "description": "Determine applicable IS specification standard code, review technical parameters, and execute manufacturing quality control gap analysis.",
                "duration": "7-10 Days",
                "documents_required": ["Technical Product Specification Sheet"],
            },
            {
                "step_number": 2,
                "title": "Product Sample Testing at BIS-Recognized / NABL Laboratory",
                "description": "Submit production samples to NABL-accredited BIS test laboratory for full parameter testing against applicable Indian Standard.",
                "duration": "15-25 Days",
                "documents_required": [
                    "NABL-Accredited Laboratory Test Reports",
                    "Sample Dispatch Chain-of-Custody Record",
                ],
            },
            {
                "step_number": 3,
                "title": "Online Registration Application Filing on Manakonline",
                "description": "Upload test reports, factory profile, quality assurance manual, and authorized Indian representative undertaking via the BIS portal.",
                "duration": "2-3 Days",
                "documents_required": [
                    "Brand Name / Trademark Registration Certificate",
                    "Factory Layout Plan & Process Flow Chart",
                ],
            },
            {
                "step_number": 4,
                "title": "BIS Technical Scrutiny & Query Clarification",
                "description": "BIS technical evaluation committee reviews test data, testing equipment calibration logs, and manufacturing quality control manual.",
                "duration": "10-15 Days",
                "documents_required": ["Quality Control Manual & Calibration Log"],
            },
            {
                "step_number": 5,
                "title": "Grant of BIS Registration & Standard Mark Use",
                "description": "Receive unique R-number / ISI license granting statutory authority to affix the BIS Standard Mark prior to commercial dispatch.",
                "duration": "3-5 Days",
                "documents_required": ["Official BIS Registration Grant Letter (R-Number)"],
            },
        ],
    },
    "CYBERSECURITY": {
        "portal_name": "CERT-In Official Directives & Reporting Desk",
        "portal_url": "https://www.cert-in.org.in/directions2022.htm",
        "estimated_days": "15-25 Days",
        "required_documents": [
            "Information Security Policy & Incident Escalation Matrix",
            "System Architecture & Firewall Configuration Topology",
            "NTP Server Synchronization Architecture Certification",
            "180-Day System Log Retention Architecture Proof",
            "Point of Contact (PoC) Nomination Undertaking to CERT-In",
        ],
        "steps": [
            {
                "step_number": 1,
                "title": "Mandatory NTP Clock Synchronization Setup",
                "description": "Synchronize all ICT system clocks, routers, firewalls, and server infrastructure with National Physical Laboratory (NPL) or NIC Network Time Protocol (NTP) servers.",
                "duration": "2-3 Days",
                "documents_required": ["NTP Synchronization Architecture Verification Certificate"],
            },
            {
                "step_number": 2,
                "title": "180-Day Secure & Tamper-Evident Log Storage Architecture",
                "description": "Deploy immutable, domestic log retention pipeline maintaining system, firewall, database, and authentication logs securely within Indian jurisdiction for rolling 180 days.",
                "duration": "5-7 Days",
                "documents_required": ["System Architecture Topology", "Log Retention Pipeline Proof"],
            },
            {
                "step_number": 3,
                "title": "Information Security Policy & 6-Hour Escalation SOP",
                "description": "Adopt internal cybersecurity policy, categorize 20 types of cybersecurity incidents specified under CERT-In directives, and codify mandatory 6-hour incident escalation SOP.",
                "duration": "3-5 Days",
                "documents_required": ["Information Security Policy Document", "6-Hour Incident Escalation SOP"],
            },
            {
                "step_number": 4,
                "title": "Formal Point of Contact (PoC) Designation & CERT-In Registration",
                "description": "Designate formal Point of Contact (Chief Information Security Officer / Legal Counsel) and submit registration details via the CERT-In reporting desk.",
                "duration": "1-2 Days",
                "documents_required": ["Point of Contact (PoC) Nomination Undertaking to CERT-In"],
            },
            {
                "step_number": 5,
                "title": "Incident Reporting Drills & Mock Response Verification",
                "description": "Conduct mock incident reporting trial verifying reporting channels (incident@cert-in.org.in and online portal) and incident ticketing response.",
                "duration": "2-3 Days",
                "documents_required": ["Mock Incident Simulation & Incident Drill Report"],
            },
            {
                "step_number": 6,
                "title": "Annual Cybersecurity Vulnerability Assessment & Signoff",
                "description": "Engage CERT-In empaneled security auditor to execute annual Vulnerability Assessment & Penetration Testing (VAPT) and archive signed audit certificates.",
                "duration": "5-7 Days",
                "documents_required": ["Annual Security Audit Signoff Certificate"],
            },
        ],
    },
    "DATA_PROTECTION": {
        "portal_name": "MeitY Digital Personal Data Protection Act Portal",
        "portal_url": STATUTORY_PORTALS["DPDP"],
        "estimated_days": "20-30 Days",
        "required_documents": [
            "Personal Data Inventory & Processing Records (RoPA)",
            "Multilingual Itemized Privacy Notice & Consent Artifacts",
            "Data Protection Officer (DPO) Appointment Letter",
            "Grievance Redressal Architecture & 72-Hour Breach Escalation SOP",
            "Data Processing Agreements (DPAs) with Sub-processors and Cloud Vendors",
        ],
        "steps": [
            {
                "step_number": 1,
                "title": "Data Inventory Mapping & RoPA Formulation",
                "description": "Catalog all digital personal data collected across web, mobile, and API interfaces, specify lawful processing purpose, and formulate formal Record of Processing Activities (RoPA).",
                "duration": "7-10 Days",
                "documents_required": ["Record of Processing Activities (RoPA)"],
            },
            {
                "step_number": 2,
                "title": "Deploy Multilingual Itemized Privacy Notices",
                "description": "Draft and publish clear, itemized privacy notices in English and Constitution Eighth Schedule languages detailing personal data categories, purposes, and user rights.",
                "duration": "3-5 Days",
                "documents_required": ["Multilingual Privacy Notice & Consent Drafts"],
            },
            {
                "step_number": 3,
                "title": "Granular Consent Management & Withdrawal Mechanism",
                "description": "Implement affirmative, verifiable consent capture workflows ensuring consent is free, specific, informed, unconditional, and unambiguous with easy withdrawal options.",
                "duration": "5-7 Days",
                "documents_required": ["Consent Flow Specification & User Opt-in Screenshots"],
            },
            {
                "step_number": 4,
                "title": "Designation of Data Protection Officer (DPO) & Redressal Mechanism",
                "description": "Appoint Data Protection Officer based in India, publish official contact details, and establish accessible 72-hour grievance resolution mechanism for Data Principals.",
                "duration": "2-4 Days",
                "documents_required": ["DPO Appointment Letter & Redressal Matrix"],
            },
            {
                "step_number": 5,
                "title": "Data Security Safeguards & Breach Escalation SOP",
                "description": "Enforce reasonable security safeguards including end-to-end encryption, role-based access control, and 72-hour mandatory breach notification SOP to Data Protection Board.",
                "duration": "3-5 Days",
                "documents_required": ["Technical Security Safeguards Audit & Breach SOP"],
            },
            {
                "step_number": 6,
                "title": "Sub-Processor Vendor Audits & Periodic DPIA Reviews",
                "description": "Execute compliant Data Processing Agreements (DPAs) with third-party cloud infrastructure providers and conduct periodic Data Protection Impact Assessments (DPIA).",
                "duration": "5-7 Days",
                "documents_required": ["Executed Third-Party Data Processing Agreements (DPAs)"],
            },
        ],
    },
    "INTERNAL_COMMITTEE": {
        "portal_name": "Ministry of Women & Child Development (POSH Guidelines)",
        "portal_url": STATUTORY_PORTALS["POSH"],
        "estimated_days": "10-20 Days",
        "required_documents": [
            "Order of Constitution of Internal Committee (IC)",
            "External Member Bio & NGO / Legal Background Verification",
            "Internal POSH Policy Document & Code of Conduct",
            "Employee Sensitization Workshop Attendance & Completion Logs",
            "Annual POSH Compliance Return Form",
        ],
        "steps": [
            {
                "step_number": 1,
                "title": "Constitution of Internal Committee (IC) by Formal Board Order",
                "description": "Pass formal Board resolution constituting Internal Committee with Presiding Officer woman at senior management level, at least 50% women members, and an independent external expert.",
                "duration": "3-5 Days",
                "documents_required": ["Order of Constitution of Internal Committee (IC)"],
            },
            {
                "step_number": 2,
                "title": "Promulgation of Gender-Neutral POSH Policy & Notice Displays",
                "description": "Adopt workplace anti-harassment policy, document grievance procedures, and display penal consequences and IC member contacts prominently across premises and virtual channels.",
                "duration": "3-5 Days",
                "documents_required": ["POSH Policy Document & Code of Conduct"],
            },
            {
                "step_number": 3,
                "title": "Mandatory Employee Sensitization Workshops & Orientation",
                "description": "Conduct structured orientation sessions for all employees on appropriate workplace behavior, rights, and redressal mechanisms, preserving signed attendance logs.",
                "duration": "5-7 Days",
                "documents_required": ["Employee Sensitization Workshop Attendance & Completion Logs"],
            },
            {
                "step_number": 4,
                "title": "IC Capacity Building & Inquiry Procedure Formalization",
                "description": "Train IC members on principles of natural justice, 90-day time-bound inquiry procedures, confidentiality safeguards, and conciliation protocols.",
                "duration": "3-5 Days",
                "documents_required": ["IC Training Minutes & Inquiry Procedure Manual"],
            },
            {
                "step_number": 5,
                "title": "Annual Compliance Return Filing with District Officer",
                "description": "Compile annual report detailing complaints received, investigated, and disposed, and submit official compliance return to District Officer (DO) by December 31.",
                "duration": "2-3 Days",
                "documents_required": ["Annual POSH Compliance Return Form"],
            },
        ],
    },
    "SCHEME": {
        "portal_name": "Official Government Scheme Portal",
        "portal_url": STATUTORY_PORTALS["STARTUP_INDIA"],
        "estimated_days": "20-35 Days",
        "required_documents": [
            "Udyam Registration Certificate / DPIIT Recognition Certificate",
            "Audited Financial Statements (Last 2 Years) / Income Tax Returns",
            "Detailed Project Report (DPR) / Technical Pitch Deck & Quotations",
            "Bank Account Proof & Cancelled Cheque (PFMS Linked)",
            "Promoter KYC & Shareholding Pattern Declaration",
        ],
        "steps": [
            {
                "step_number": 1,
                "title": "Scheme Eligibility Audit & Categorization Verification",
                "description": "Verify enterprise categorization, validate DPIIT / Udyam registration credentials, and check scheme eligibility guidelines.",
                "duration": "3-5 Days",
                "documents_required": [
                    "Udyam Registration Certificate / DPIIT Recognition Certificate",
                    "Audited Financial Statements (Last 2 Years)",
                ],
            },
            {
                "step_number": 2,
                "title": "Detailed Project Report (DPR) & Budgetary Milestone Assembly",
                "description": "Formulate comprehensive project proposal, milestone-based fund utilization projection, and itemized cost quotations for eligible expenditure.",
                "duration": "5-7 Days",
                "documents_required": [
                    "Detailed Project Report (DPR) / Technical Pitch Deck & Quotations",
                    "Promoter KYC & Shareholding Pattern Declaration",
                ],
            },
            {
                "step_number": 3,
                "title": "Online Scheme Application Submission on Official Portal",
                "description": "Submit electronic application on designated ministry portal (e.g. Startup India Seed Fund, MSME Innovative, CGTMSE) and generate official tracking number.",
                "duration": "1-2 Days",
                "documents_required": ["Official Application Submission Acknowledgement"],
            },
            {
                "step_number": 4,
                "title": "Departmental Technical Screening & Presentation",
                "description": "Present project roadmap before Technical Advisory Committee / Incubator Selection Committee and address queries regarding innovation and scalability.",
                "duration": "10-15 Days",
                "documents_required": ["Committee Presentation Deck & Query Clarifications"],
            },
            {
                "step_number": 5,
                "title": "In-Principle Sanction & Grant Agreement Execution",
                "description": "Receive formal sanction order, execute grant/guarantee agreement, and link dedicated escrow bank account for milestone disbursements.",
                "duration": "5-7 Days",
                "documents_required": ["Official Sanction Letter & Executed Grant Agreement"],
            },
            {
                "step_number": 6,
                "title": "Disbursement Tracking, Utilization Certification & Reporting",
                "description": "Submit Chartered Accountant Utilization Certificate (UC) and project milestone progress reports to release disbursement tranches.",
                "duration": "Ongoing",
                "documents_required": ["CA Utilization Certificate & Milestone Progress Report"],
            },
        ],
    },
    "DEFAULT": {
        "portal_name": "National Single Window System (NSWS)",
        "portal_url": STATUTORY_PORTALS["NSWS"],
        "estimated_days": "15-30 Days",
        "required_documents": [
            "Proof of Entity Incorporation",
            "Address Proof & Premises Possession Documents",
            "Statutory Declarations & Authorizations",
            "Authorized Signatory Identification",
        ],
        "steps": [
            {
                "step_number": 1,
                "title": "Statutory Documentation Preparation",
                "description": "Assemble corporate incorporation records, address proofs, and technical specifications.",
                "duration": "5-7 Days",
                "documents_required": ["Entity Incorporation Certificate", "Premises Lease / Title"],
            },
            {
                "step_number": 2,
                "title": "Online Application Submission via Portal",
                "description": "Submit application through official department portal and obtain acknowledgement receipt.",
                "duration": "1-2 Days",
                "documents_required": ["Departmental Application Form"],
            },
            {
                "step_number": 3,
                "title": "Departmental Scrutiny & Query Resolution",
                "description": "Track application status and promptly respond to any departmental requisitions.",
                "duration": "7-14 Days",
                "documents_required": ["Requisition Clarification Response"],
            },
            {
                "step_number": 4,
                "title": "Technical Inspection & Compliance Review",
                "description": "Undergo statutory departmental review and resolve any operational compliance notes.",
                "duration": "5-10 Days",
                "documents_required": ["Inspection Compliance Report"],
            },
            {
                "step_number": 5,
                "title": "Approval & Clearance Certificate Issuance",
                "description": "Download digitally authenticated approval certificate.",
                "duration": "2-3 Days",
                "documents_required": ["Statutory Clearance Certificate"],
            },
        ],
    },
}


def _match_workflow_template(req_def: RequirementDefinition) -> str:
    dom = (req_def.domain or "").upper()
    cat = (req_def.category or "").upper()
    auth = (req_def.authority or "").upper()
    req_id = req_def.requirement_id.upper()

    if "FOOD" in dom or "FSSAI" in auth or "FOOD" in req_id:
        return "FOOD"
    if "ENVIRONMENT" in dom or "POLLUTION" in dom or "PCB" in auth or "CPCB" in auth or "SPCB" in auth or "EPR" in req_id:
        return "ENVIRONMENT"
    if "LABOR" in dom or "FACTORY" in dom or "DISH" in auth or "SHOPS" in req_id:
        return "LABOR"
    if "TRADE" in dom or "DGFT" in auth or "CUSTOM" in dom or "IEC" in req_id:
        return "TRADE"
    if "STANDARD" in cat or "STANDARD" in dom or "BIS" in auth or "CRS" in req_id or "METROLOGY" in req_id:
        return "STANDARD"
    if "CYBER" in dom or "CERT-IN" in req_id or "CERTIN" in req_id or "CERT" in auth:
        return "CYBERSECURITY"
    if "DPDP" in req_id or "DATA" in dom:
        return "DATA_PROTECTION"
    if "POSH" in req_id or "SEXUAL" in req_id or "INTERNAL_COMMITTEE" in req_id or "INTERNAL COMMITTEE" in req_id:
        return "INTERNAL_COMMITTEE"
    return "DEFAULT"


def derive_business_workflows(
    business: Business,
    context: DerivedBusinessContext | None = None,
    assessment_id: str | None = None,
) -> dict[str, Any]:
    """Derive prioritized statutory workflow roadmaps for a business.
    
    Includes Compliance requirements, Standards, and Government Schemes.
    Synchronizes step completion and progress directly with the database.
    """
    import re
    from knowledge_packs.catalogs import resolve_statutory_portal

    if context is None:
        context = build_business_context(business)

    latest_run = None
    if assessment_id:
        assessment = business.assessments.filter(pk=assessment_id).first()
        if assessment and assessment.decision_run:
            latest_run = assessment.decision_run
        elif assessment:
            latest_run = DecisionRun.objects.filter(assessment=assessment).prefetch_related("results").first()

    if latest_run is None and not assessment_id:
        latest_run = (
            DecisionRun.objects.filter(business=business)
            .prefetch_related("results")
            .order_by("-created_at")
            .first()
        )

    # A reused profile does not make progress interchangeable across assessments.
    cases = ComplianceCase.objects.filter(business=business)
    if assessment_id:
        cases = cases.filter(assessment_id=assessment_id)
        if assessment:
            cases = cases.filter(profile_version_id=assessment.profile_version_id)
    cases_by_req: dict[str, ComplianceCase] = {
        c.requirement_id_code: c
        for c in cases.select_related(
            "requirement", "current_workflow_instance"
        ).prefetch_related("document_requirements")
    }

    workflows: list[dict[str, Any]] = []

    # 1. Derive from Evaluated Applicable Results (Compliance & Standards)
    if latest_run is not None:
        raw_results = [
            r
            for r in latest_run.results.all()
            if r.status in {ApplicabilityStatus.APPLICABLE, ApplicabilityStatus.NEEDS_INFORMATION}
        ]

        from types import SimpleNamespace
        from apps.workflows.services.disposition_service import reviewer_assigned_requirements
        present = {result.requirement_id for result in raw_results}
        for assigned in reviewer_assigned_requirements(business, assessment_id, latest_run.profile_version_id):
            if assigned["user_action_required"] and assigned["requirement_id"] not in present:
                raw_results.append(SimpleNamespace(requirement_id=assigned["requirement_id"],
                    requirement_name=assigned["name"], status="SUGGESTED", result_origin="HUMAN_REVIEW_RESULT"))

        # Non-manufacturing / Software / SaaS guard:
        # Software companies never need factory licenses or pollution board consents
        desc_parts = [business.name]
        if business.current_profile and business.current_profile.variables:
            vars_dict = business.current_profile.variables
            for k in ["product_description", "sector", "nature_of_business", "primary_business_activity"]:
                val = vars_dict.get(k)
                if isinstance(val, dict):
                    desc_parts.append(str(val.get("value") or ""))
                elif val:
                    desc_parts.append(str(val))
        desc_lower = " ".join(desc_parts).lower()
        is_pure_software = bool(re.search(r"\b(software|saas|platform|app|web|digital|pre-visualization|film pre-visualization|consulting|it services|agency)\b", desc_lower)) and not any(hw in desc_lower for hw in ["hardware manufacturing", "assembly plant", "fabrication plant", "physical manufacturing"])

        seen_canonical = set()
        actionable_results = []
        for r in raw_results:
            req_id_upper = r.requirement_id.upper()
            req_name_upper = r.requirement_name.upper()
            combined = f"{req_id_upper} {req_name_upper}"

            # Prune industrial manufacturing requirements for pure software/SaaS
            # Published applicability decisions already evaluated these facts.
            # A keyword guard must not override an authoritative saved result.

            # Canonical deduplication (e.g. REQ-CERT-IN-CYBERSECURITY-DIRECTIVES vs REQ-CERTIN-CYBERSECURITY-DIRECTIVES)
            canon = req_id_upper.replace("-", "").replace("_", "")
            if canon in seen_canonical:
                logger.info("Deduplication Guard pruned duplicate workflow requirement %s (%s)", r.requirement_name, r.requirement_id)
                continue
            seen_canonical.add(canon)
            actionable_results.append(r)

        req_defs = {
            rd.requirement_id: rd
            for rd in RequirementDefinition.objects.filter(
                requirement_id__in=[r.requirement_id for r in actionable_results]
            )
        }

        priority_order = {
            "TRADE": 1,
            "FOOD": 2,
            "ENVIRONMENT": 3,
            "LABOR": 4,
            "CYBERSECURITY": 5,
            "DATA_PROTECTION": 6,
            "INTERNAL_COMMITTEE": 7,
            "STANDARD": 8,
            "DEFAULT": 9,
        }

        sorted_results = sorted(
            actionable_results,
            key=lambda r: priority_order.get(
                _match_workflow_template(req_defs.get(r.requirement_id) or RequirementDefinition(requirement_id="")),
                99
            )
        )

        for result in sorted_results:
            req_def = req_defs.get(result.requirement_id)
            if req_def is None:
                continue

            # Historical standard decisions receive the same product-scope gate
            # as the standards/compliance read APIs, without changing the record.
            if (req_def.category.strip().upper() == "STANDARD"
                    and isinstance(result, DecisionResult)):
                from apps.requirements.presentation import decision_presentation
                display_status, _ = decision_presentation(result, req_def)
                if display_status not in {ApplicabilityStatus.APPLICABLE, ApplicabilityStatus.NEEDS_INFORMATION}:
                    continue

            template_key = _match_workflow_template(req_def)
            recorded_workflow = (req_def.metadata or {}).get("workflow") or {}
            if isinstance(recorded_workflow, dict) and recorded_workflow.get("steps"):
                tmpl = {"steps": recorded_workflow["steps"], "estimated_days": recorded_workflow.get("estimated_duration"),
                        "required_documents": (req_def.metadata or {}).get("required_documents", [])}
            else:
                # Existing procedural templates contain unsupported fixed fees,
                # form names and timelines. Preserve them for later review, but
                # use a clearly practical plan unless knowledge records a procedure.
                tmpl = {"estimated_days": None, "required_documents": [], "steps": [
                    {"title": "Confirm the applicable route", "description": "Review the linked requirement with the relevant authority."},
                    {"title": "Prepare business and premises information", "description": "Confirm the information requested for your situation."},
                    {"title": "Complete the relevant process", "description": "Follow the authority's current instructions, where required."},
                    {"title": "Record the outcome and follow-up", "description": "Save the outcome and any validity or renewal details actually supplied."}]}

            raw_portal = (req_def.metadata or {}).get("portal") or (req_def.metadata or {}).get("portal_url")
            resolved_portal = resolve_statutory_portal(
                authority=req_def.authority or "",
                requirement_name=result.requirement_name,
                requirement_id=result.requirement_id,
                raw_portal=raw_portal,
            )
            if not raw_portal:
                resolved_portal = {"name": "", "url": None}
            portal_name = resolved_portal["name"]
            portal_url = resolved_portal["url"]

            # Check if this requirement belongs to STANDARDS category
            is_standard = (
                template_key == "STANDARD"
                or (req_def.category or "").upper() == "STANDARD"
                or "STANDARD" in (req_def.category or "").upper()
                or "BIS" in (req_def.authority or "").upper()
            )
            category_label = "STANDARD" if is_standard else "COMPLIANCE"

            # Check persistent state in ComplianceCase
            case = cases_by_req.get(result.requirement_id)
            wf_state = case.metadata.get("workflow_state", {}) if case else {}
            saved_steps = wf_state.get("steps", {})

            # Document requirements
            raw_docs = []
            if req_def.metadata:
                raw_docs = req_def.metadata.get("documents") or req_def.metadata.get("required_documents") or []
            if not raw_docs:
                raw_docs = tmpl.get("required_documents", [])

            formatted_docs = [
                d if isinstance(d, str) else d.get("name", str(d))
                for d in raw_docs
            ]

            formatted_steps = []
            completed_steps_count = 0
            for idx, s in enumerate(tmpl["steps"], start=1):
                step_num = s.get("step_number", idx)
                step_key = str(step_num)

                saved_step = saved_steps.get(step_key, {})
                if saved_step.get("status"):
                    step_status = saved_step["status"]
                elif idx == 1:
                    step_status = "READY"
                else:
                    step_status = "NOT_STARTED"

                if step_status == "COMPLETED":
                    completed_steps_count += 1

                formatted_steps.append({
                    "step": step_num,
                    "step_number": step_num,
                    "title": s["title"],
                    "description": s.get("description", ""),
                    "duration": s.get("duration", ""),
                    "status": step_status,
                    "documents_required": s.get("documents_required", []),
                    "portal_url": portal_url,
                    "user_reference": saved_step.get("user_reference", ""),
                    "notes": saved_step.get("notes", ""),
                    "completed_at": saved_step.get("completed_at"),
                })

            total_steps = len(formatted_steps)
            progress_percent = int((completed_steps_count / max(total_steps, 1)) * 100) if total_steps > 0 else 0

            # Determine active stage
            current_step = 1
            for st in formatted_steps:
                if st["status"] != "COMPLETED":
                    current_step = st["step_number"]
                    break
            else:
                current_step = total_steps

            # Determine overall workflow status
            if completed_steps_count == total_steps and total_steps > 0:
                overall_status = "COMPLETED"
            elif completed_steps_count > 0 or any(st["status"] == "IN_PROGRESS" for st in formatted_steps):
                overall_status = "IN_PROGRESS"
            else:
                overall_status = "NOT_STARTED"

            workflows.append({
                "id": f"WF::{result.requirement_id}",
                "requirement_id": result.requirement_id,
                "case_id": str(case.id) if case else None,
                "case_number": case.case_number if case else None,
                "category": category_label,
                "domain": req_def.domain or "GENERAL",
                "title": result.requirement_name,
                "result_origin": getattr(result, "result_origin", "DETERMINISTIC_KB_RESULT"),
                "authority": req_def.authority or "Regulatory Authority",
                "portal_name": portal_name,
                "portal_url": portal_url,
                "estimated_duration": tmpl["estimated_days"],
                "total_steps": total_steps,
                "current_step": current_step,
                "current_step_title": formatted_steps[current_step - 1]["title"] if formatted_steps else "Step 1",
                "progress_percent": progress_percent,
                "status": overall_status,
                "documents_required": formatted_docs,
                "steps": formatted_steps,
                "prerequisites": "Corporate identity & premises confirmation",
                "updated_at": case.updated_at.isoformat() if case and case.updated_at else timezone.now().isoformat(),
            })

    # 2. Derive Applicable Government Schemes
    try:
        schemes_res = match_business_schemes(business, context=context, assessment_id=assessment_id)
        matched_schemes = schemes_res.get("schemes", [])
    except Exception as exc:
        logger.debug("Failed to discover schemes for workflows: %s", exc)
        matched_schemes = []

    scheme_tmpl = {"estimated_days": None, "required_documents": [], "steps": [
        {"title": "Review the support area", "description": "Check the current scheme information and business fit."},
        {"title": "Confirm eligibility and requested information", "description": "Confirm criteria with the administering authority."},
        {"title": "Prepare and track the next step", "description": "Record the application or enquiry outcome, where relevant."}]}

    for s in matched_schemes:
        scheme_code = s.get("scheme_code") or s.get("code") or f"SCHEME-{s.get('id', '')}"
        wf_id = f"WF::{scheme_code}"
        scheme_title = s.get("title") or s.get("name") or "Government Incentive Scheme"
        authority_name = s.get("authority") or "Ministry of MSME / Government of India"
        raw_portal = s.get("portal_url") or s.get("action_url")
        resolved_scheme_portal = resolve_statutory_portal(
            authority=authority_name,
            requirement_name=scheme_title,
            requirement_id=scheme_code,
            raw_portal=raw_portal,
        )
        portal_url = resolved_scheme_portal["url"]
        if not raw_portal:
            portal_url = None
        portal_name = resolved_scheme_portal["name"]

        case = cases_by_req.get(scheme_code)
        wf_state = case.metadata.get("workflow_state", {}) if case else {}
        saved_steps = wf_state.get("steps", {})

        formatted_steps = []
        completed_steps_count = 0
        for idx, step_def in enumerate(scheme_tmpl["steps"], start=1):
            step_num = step_def.get("step_number", idx)
            step_key = str(step_num)

            saved_step = saved_steps.get(step_key, {})
            if saved_step.get("status"):
                step_status = saved_step["status"]
            elif idx == 1:
                step_status = "READY"
            else:
                step_status = "NOT_STARTED"

            if step_status == "COMPLETED":
                completed_steps_count += 1

            formatted_steps.append({
                "step": step_num,
                "step_number": step_num,
                "title": step_def["title"],
                "description": step_def.get("description", ""),
                "duration": step_def.get("duration", ""),
                "status": step_status,
                "documents_required": step_def.get("documents_required", []),
                "portal_url": portal_url,
                "user_reference": saved_step.get("user_reference", ""),
                "notes": saved_step.get("notes", ""),
                "completed_at": saved_step.get("completed_at"),
            })

        total_steps = len(formatted_steps)
        progress_percent = int((completed_steps_count / max(total_steps, 1)) * 100) if total_steps > 0 else 0

        current_step = 1
        for st in formatted_steps:
            if st["status"] != "COMPLETED":
                current_step = st["step_number"]
                break
        else:
            current_step = total_steps

        if completed_steps_count == total_steps and total_steps > 0:
            overall_status = "COMPLETED"
        elif completed_steps_count > 0 or any(st["status"] == "IN_PROGRESS" for st in formatted_steps):
            overall_status = "IN_PROGRESS"
        else:
            overall_status = "NOT_STARTED"

        workflows.append({
            "id": wf_id,
            "requirement_id": scheme_code,
            "case_id": str(case.id) if case else None,
            "case_number": case.case_number if case else None,
            "category": "SCHEME",
            "domain": "GOVERNMENT_INCENTIVES",
            "title": scheme_title,
            "authority": authority_name,
            "portal_name": portal_name,
            "portal_url": portal_url,
            "estimated_duration": scheme_tmpl["estimated_days"],
            "total_steps": total_steps,
            "current_step": current_step,
            "current_step_title": formatted_steps[current_step - 1]["title"] if formatted_steps else "Step 1",
            "progress_percent": progress_percent,
            "status": overall_status,
            "documents_required": scheme_tmpl["required_documents"],
            "steps": formatted_steps,
            "prerequisites": "Confirm the current eligibility criteria and requested information.",
            "updated_at": case.updated_at.isoformat() if case and case.updated_at else timezone.now().isoformat(),
        })

    from domain.intelligence.workspace_guidance import get_workspace
    for item in get_workspace(business, assessment_id)["workflows"]:
        steps = [{"step_number": i, "title": title, "description": "", "status": "PENDING",
                  "action_type": "PREPARATION", "portal_url": None, "required_documents": []}
                 for i, title in enumerate(item["steps"], 1)]
        cases = ComplianceCase.objects.filter(business=business, requirement_id_code=item["requirement_id"])
        if assessment_id:
            cases = cases.filter(assessment_id=assessment_id)
            if assessment:
                cases = cases.filter(profile_version_id=assessment.profile_version_id)
        case = cases.order_by("-created_at").first()
        saved = ((case.metadata or {}).get("workflow_state") or {}).get("steps", {}) if case else {}
        for step in steps:
            step.update(saved.get(str(step["step_number"]), {}))
        complete = sum(step["status"] == "COMPLETED" for step in steps)
        current_step = next((step["step_number"] for step in steps if step["status"] != "COMPLETED"), len(steps))
        wf_status = "COMPLETED" if complete == len(steps) else "IN_PROGRESS" if complete or any(step["status"] == "IN_PROGRESS" for step in steps) else "NOT_STARTED"
        workflows.append({**item, "steps": steps, "case_id": str(case.id) if case else None, "case_number": case.case_number if case else None,
            "category": "COMPLIANCE", "domain": "PLANNING", "authority": item["authority_or_regulator"],
            "portal_url": None, "portal_name": "", "estimated_duration": None,
            "total_steps": len(steps), "current_step": current_step, "current_step_title": steps[current_step - 1]["title"],
            "progress_percent": round(100 * complete / len(steps)), "status": wf_status, "documents_required": [],
            "prerequisites": "Confirm the applicable route with the relevant authority.", "updated_at": None})

    # Summary metrics
    total_wf = len(workflows)
    compliance_count = sum(1 for w in workflows if w["category"] == "COMPLIANCE")
    standards_count = sum(1 for w in workflows if w["category"] == "STANDARD")
    schemes_count = sum(1 for w in workflows if w["category"] == "SCHEME")
    completed_count = sum(1 for w in workflows if w["status"] == "COMPLETED")
    in_progress_count = sum(1 for w in workflows if w["status"] == "IN_PROGRESS")
    not_started_count = sum(1 for w in workflows if w["status"] == "NOT_STARTED")
    overall_progress = int(sum(w["progress_percent"] for w in workflows) / max(total_wf, 1)) if total_wf > 0 else 0

    return {
        "business_id": str(business.id),
        "business_name": business.name,
        "available": True,
        "evaluated": latest_run is not None,
        "count": total_wf,
        "total_workflows": total_wf,
        "summary": {
            "total_workflows": total_wf,
            "compliance_count": compliance_count,
            "standards_count": standards_count,
            "schemes_count": schemes_count,
            "completed_count": completed_count,
            "in_progress_count": in_progress_count,
            "not_started_count": not_started_count,
            "overall_progress": overall_progress,
        },
        "workflows": workflows,
        "source": "STATUTORY_PROCEDURE_MAPPING",
        "disclaimer": "Practical planning steps alongside recorded procedures. Confirm filing details with the relevant authority.",
    }
