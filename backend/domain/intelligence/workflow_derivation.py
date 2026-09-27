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
from apps.applicability.models import DecisionRun
from apps.businesses.models import Business
from apps.knowledge.models import RequirementDefinition
from apps.schemes.engine.matcher import match_business_schemes
from apps.workflows.models import ComplianceCase
from domain.context.business_context import DerivedBusinessContext, build_business_context

logger = logging.getLogger(__name__)

# Enriched Procedural Workflow Templates with Official Portals, Steps, and Required Documents
ENRICHED_WORKFLOW_TEMPLATES: dict[str, dict[str, Any]] = {
    "FOOD": {
        "portal_name": "FoSCoS (Food Safety Compliance System)",
        "portal_url": "https://foscos.fssai.gov.in",
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
        "portal_url": "https://ocmms.nic.in",
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
        "portal_url": "https://dish.gov.in",
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
        "portal_name": "DGFT Directorate General of Foreign Trade Portal",
        "portal_url": "https://www.dgft.gov.in",
        "estimated_days": "1-3 Days",
        "required_documents": [
            "Company PAN Card Copy",
            "Certificate of Incorporation / Partnership Deed",
            "Bank Certificate / Cancelled Cheque with Pre-printed Account Name",
            "Director / Partner Aadhaar & DSC Credentials",
        ],
        "steps": [
            {
                "step_number": 1,
                "title": "Digital Signature (DSC) & Entity PAN Validation",
                "description": "Validate company PAN and registered authorized signatory credentials on the DGFT system.",
                "duration": "1 Day",
                "documents_required": ["Company PAN Card Copy", "Director Aadhaar & DSC"],
            },
            {
                "step_number": 2,
                "title": "Online Importer-Exporter Code (IEC) Application",
                "description": "Complete electronic IEC application form, link bank account verification, and remit statutory processing fee.",
                "duration": "1 Day",
                "documents_required": ["Pre-printed Bank Cancelled Cheque / Certificate"],
            },
            {
                "step_number": 3,
                "title": "Instant Automatic Allotment of 10-Digit IEC",
                "description": "System issues electronic IEC certificate automatically transmitted to ICEGATE for customs clearance.",
                "duration": "Instant",
                "documents_required": ["Electronic IEC Allotment Letter"],
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
                "title": "Product Sample Testing at BIS-Recognized Laboratory",
                "description": "Submit production samples to NABL-accredited BIS test laboratory for full parameter testing against applicable Indian Standard.",
                "duration": "15-25 Days",
                "documents_required": [
                    "NABL-Accredited Laboratory Test Reports",
                    "Product Technical Specification Sheet",
                ],
            },
            {
                "step_number": 2,
                "title": "Online Registration Filing on Manakonline",
                "description": "Upload test reports, factory profile, and authorized Indian representative undertaking via the BIS portal.",
                "duration": "2-3 Days",
                "documents_required": [
                    "Brand Name / Trademark Registration Certificate",
                    "Factory Layout Plan & Process Flow Chart",
                ],
            },
            {
                "step_number": 3,
                "title": "BIS Technical Scrutiny & Clarification",
                "description": "BIS technical committee reviews test data and manufacturing quality control manual.",
                "duration": "10-15 Days",
                "documents_required": ["Quality Control Manual & Calibration Log"],
            },
            {
                "step_number": 4,
                "title": "Grant of BIS Registration & Standard Mark Use",
                "description": "Receive unique R-number granting authority to affix the BIS Standard Mark prior to commercial dispatch.",
                "duration": "3-5 Days",
                "documents_required": ["Official BIS Registration Grant Letter (R-Number)"],
            },
        ],
    },
    "CYBERSECURITY": {
        "portal_name": "CERT-In Incident Reporting Portal",
        "portal_url": "https://www.cert-in.org.in",
        "estimated_days": "15-25 Days",
        "required_documents": [
            "Information Security Policy & Incident Escalation Matrix",
            "System Architecture & Firewall Configuration Topology",
            "NTP Server Synchronization Architecture Certification",
            "180-Day System Log Retention Architecture Proof",
        ],
        "steps": [
            {
                "step_number": 1,
                "title": "Log Architecture & 180-Day Secure Storage Setup",
                "description": "Configure Indian jurisdiction synchronized NTP clock sources and implement 180-day tamper-evident security log storage.",
                "duration": "5-7 Days",
                "documents_required": ["System Architecture Topology", "Log Retention Proof"],
            },
            {
                "step_number": 2,
                "title": "Incident Escalation Plan & Point of Contact Designation",
                "description": "Designate formal Point of Contact (PoC) and establish 6-hour mandatory cyber incident escalation procedure.",
                "duration": "3-5 Days",
                "documents_required": ["Information Security Policy & PoC Designation Letter"],
            },
            {
                "step_number": 3,
                "title": "Mandatory Incident Reporting Configuration with CERT-In",
                "description": "Register designated PoC details with CERT-In and establish authenticated API/reporting channel credentials.",
                "duration": "1-2 Days",
                "documents_required": ["CERT-In PoC Registration Undertaking"],
            },
            {
                "step_number": 4,
                "title": "Annual Cybersecurity Compliance & Audit Log Signoff",
                "description": "Conduct annual vulnerability assessment and maintain signed security audit records for regulatory inspection.",
                "duration": "2-3 Days",
                "documents_required": ["Annual Security Audit Signoff Certificate"],
            },
        ],
    },
    "DATA_PROTECTION": {
        "portal_name": "Data Protection Board of India Portal",
        "portal_url": "https://meity.gov.in/dpdp",
        "estimated_days": "20-30 Days",
        "required_documents": [
            "Personal Data Inventory & Processing Records (RoPA)",
            "Multilingual Privacy Notice & Consent Artifacts",
            "Data Protection Officer (DPO) Appointment Letter",
            "Grievance Redressal Architecture & 72-Hour Breach Escalation SOP",
        ],
        "steps": [
            {
                "step_number": 1,
                "title": "Data Mapping & Consent Management Architecture",
                "description": "Inventory all personal data collected from users, identify lawful processing purposes, and map data flows.",
                "duration": "7-10 Days",
                "documents_required": ["Record of Processing Activities (RoPA)"],
            },
            {
                "step_number": 2,
                "title": "Publish Multilingual Privacy Notices & Consent Workflows",
                "description": "Deploy clear privacy notices in English and Constitution Schedule VIII languages with granular consent capture.",
                "duration": "3-5 Days",
                "documents_required": ["Multilingual Privacy Notice & Consent Drafts"],
            },
            {
                "step_number": 3,
                "title": "DPO Designation & Grievance Redressal Mechanism",
                "description": "Establish accessible grievance redressal mechanism and appoint Data Protection Officer for India operations.",
                "duration": "2-4 Days",
                "documents_required": ["DPO Appointment Letter & Redressal Matrix"],
            },
            {
                "step_number": 4,
                "title": "Statutory Data Fiduciary Readiness & Compliance Log",
                "description": "Implement technical safeguards, reasonable security practices, and breach notification SOP to Data Protection Board.",
                "duration": "2-3 Days",
                "documents_required": ["DPDP Compliance Verification Signoff"],
            },
        ],
    },
    "INTERNAL_COMMITTEE": {
        "portal_name": "SHe-Box / Ministry of Women & Child Development",
        "portal_url": "https://shebox.wcd.gov.in",
        "estimated_days": "10-15 Days",
        "required_documents": [
            "Order of Constitution of Internal Committee (IC)",
            "External Member Bio & NGO / Legal Background Verification",
            "Internal POSH Policy Document & Code of Conduct",
            "Employee Awareness Workshop Attendance Sheets",
        ],
        "steps": [
            {
                "step_number": 1,
                "title": "Constitution of Internal Committee with External Expert",
                "description": "Formally constitute Internal Committee (IC) with Presiding Woman Officer, 50% women members, and an external NGO/legal expert.",
                "duration": "3-5 Days",
                "documents_required": ["Order of Constitution of Internal Committee (IC)"],
            },
            {
                "step_number": 2,
                "title": "POSH Policy Adoption & Employee Sensitization",
                "description": "Promulgate anti-harassment policy, display penal consequences prominently in premises, and conduct mandatory orientation.",
                "duration": "5-7 Days",
                "documents_required": ["POSH Policy Document & Employee Workshop Sheets"],
            },
            {
                "step_number": 3,
                "title": "Filing Annual Compliance Return with District Officer",
                "description": "Submit annual return detailing number of cases filed, investigated, and disposed to the District Officer by December 31.",
                "duration": "2-3 Days",
                "documents_required": ["Annual POSH Compliance Return Form"],
            },
        ],
    },
    "SCHEME": {
        "portal_name": "National MSME Portal / Champions Single Window",
        "portal_url": "https://champions.gov.in",
        "estimated_days": "20-35 Days",
        "required_documents": [
            "Udyam Registration Certificate",
            "Audited Financial Statements (Last 2 Years) / Income Tax Returns",
            "Detailed Project Report (DPR) / Machinery Quotations",
            "Bank Account Proof & Cancelled Cheque",
            "Promoter KYC & Category Endorsements",
        ],
        "steps": [
            {
                "step_number": 1,
                "title": "Eligibility Criteria & Documentation Audit",
                "description": "Verify enterprise MSME categorization, compile Udyam Registration, project report, and financial statements.",
                "duration": "3-5 Days",
                "documents_required": [
                    "Udyam Registration Certificate",
                    "Audited Financial Statements (Last 2 Years)",
                    "Detailed Project Report (DPR)",
                ],
            },
            {
                "step_number": 2,
                "title": "Online Scheme Application Submission on Official Portal",
                "description": "Submit electronic application on official portal and generate unique scheme tracking acknowledgement number.",
                "duration": "1-2 Days",
                "documents_required": ["Official Application Form & Quotations"],
            },
            {
                "step_number": 3,
                "title": "Nodal Authority & Financial Appraisal",
                "description": "Nodal department or scheduled commercial bank scrutinizes eligibility, project viability, and technical metrics.",
                "duration": "10-15 Days",
                "documents_required": ["Technical Feasibility & Bank Appraisal Notes"],
            },
            {
                "step_number": 4,
                "title": "Sanction Grant & Subsidy/Guarantee Issuance",
                "description": "Receive official sanction letter; subsidy credited to loan escrow / guarantee coverage activated.",
                "duration": "5-7 Days",
                "documents_required": ["Official Sanction / Guarantee Coverage Certificate"],
            },
        ],
    },
    "DEFAULT": {
        "portal_name": "National Single Window System (NSWS)",
        "portal_url": "https://www.nsws.gov.in",
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
                "title": "Approval & Certificate Issuance",
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
    if "POSH" in req_id or "SEXUAL" in req_id or "INTERNAL_COMMITTEE" in req_id:
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
    if context is None:
        context = build_business_context(business)

    latest_run = None
    if assessment_id:
        assessment = business.assessments.filter(pk=assessment_id).first()
        if assessment and assessment.decision_run:
            latest_run = assessment.decision_run
        elif assessment:
            latest_run = DecisionRun.objects.filter(assessment=assessment).prefetch_related("results").first()

    if latest_run is None:
        latest_run = (
            DecisionRun.objects.filter(business=business)
            .prefetch_related("results")
            .order_by("-created_at")
            .first()
        )

    # Load existing ComplianceCases for this business
    cases_by_req: dict[str, ComplianceCase] = {
        c.requirement_id_code: c
        for c in ComplianceCase.objects.filter(business=business).select_related(
            "requirement", "current_workflow_instance"
        ).prefetch_related("document_requirements")
    }

    workflows: list[dict[str, Any]] = []

    # 1. Derive from Evaluated Applicable Results (Compliance & Standards)
    if latest_run is not None:
        actionable_results = [
            r
            for r in latest_run.results.all()
            if r.status in {ApplicabilityStatus.APPLICABLE, ApplicabilityStatus.NEEDS_INFORMATION}
        ]

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

            template_key = _match_workflow_template(req_def)
            tmpl = ENRICHED_WORKFLOW_TEMPLATES.get(template_key, ENRICHED_WORKFLOW_TEMPLATES["DEFAULT"])

            portal_name = (req_def.metadata or {}).get("portal") or tmpl["portal_name"]
            portal_url = (req_def.metadata or {}).get("portal_url") or tmpl.get("portal_url", "")

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

    scheme_tmpl = ENRICHED_WORKFLOW_TEMPLATES["SCHEME"]

    for s in matched_schemes:
        scheme_code = s.get("scheme_code") or s.get("code") or f"SCHEME-{s.get('id', '')}"
        wf_id = f"WF::{scheme_code}"
        scheme_title = s.get("title") or s.get("name") or "Government Incentive Scheme"
        authority_name = s.get("authority") or "Ministry of MSME / Government of India"
        portal_url = s.get("portal_url") or s.get("action_url") or "https://champions.gov.in"
        portal_name = s.get("portal_name") or "Official MSME Scheme Portal"

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
            "prerequisites": "Valid MSME Udyam Registration & active bank account",
            "updated_at": case.updated_at.isoformat() if case and case.updated_at else timezone.now().isoformat(),
        })

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
        "disclaimer": "Clearance workflows are structured from statutory filing guidelines established by regulatory authorities.",
    }
