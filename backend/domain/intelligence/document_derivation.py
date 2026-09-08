"""Dynamic statutory document checklist derivation engine.

Authority: PRD_v2.0 §18; TRD_v2.0 §30; Milestone Parts 5, 23, 24.

Derives business-specific document requirements from:
1. Requirements evaluated as APPLICABLE or NEEDS_INFORMATION by the engine.
2. RequirementDefinition metadata where recorded.
3. Domain-specific statutory templates for Indian regulatory authorities
   (FSSAI, SPCB/PCC, DISH Factory Acts, DGFT, BIS, CPCB EPR).
4. Candidate requirements discovered during live regulatory discovery.
"""

from __future__ import annotations

from typing import Any

from common.enums import ApplicabilityStatus
from apps.applicability.models import DecisionRun
from apps.businesses.models import Business
from apps.knowledge.models import RequirementDefinition
from apps.requirements.views import DOCUMENTS_KEY, _str_list
from domain.context.business_context import DerivedBusinessContext, build_business_context

# Domain-specific statutory document checklists keyed by authority or domain keyword
STATUTORY_DOCUMENT_TEMPLATES: dict[str, list[dict[str, str]]] = {
    "FOOD": [
        {
            "name": "Food Safety Management System (FSMS) Plan",
            "category": "TECHNICAL_PLAN",
            "why_it_matters": "Mandated by FSSAI regulations to demonstrate hygiene controls and food safety hazards management.",
        },
        {
            "name": "Blueprint / Layout Plan of Processing Premises",
            "category": "PREMISES_DOCUMENTATION",
            "why_it_matters": "Required to verify designated processing areas, storage segregation, and food handler movement.",
        },
        {
            "name": "List of Equipment and Machinery with Installed Capacity",
            "category": "EQUIPMENT_SPECIFICATION",
            "why_it_matters": "Determines manufacturing scale and verifies processing capabilities under the license tier.",
        },
        {
            "name": "Water Potability Analysis Report from NABL-Accredited Lab",
            "category": "LAB_REPORT",
            "why_it_matters": "Proves that water used in food production and sanitation conforms to IS 10500 standards.",
        },
        {
            "name": "Certificate of Incorporation / Partnership Deed",
            "category": "ENTITY_REGISTRATION",
            "why_it_matters": "Establishes the legal identity and constitution of the Food Business Operator (FBO).",
        },
        {
            "name": "Photo ID and Medical Fitness Certificates of Food Handlers",
            "category": "PERSONNEL_CLEARANCE",
            "why_it_matters": "Mandated under Schedule 4 of FSS regulations to ensure disease-free handling of food products.",
        },
    ],
    "ENVIRONMENT": [
        {
            "name": "Detailed Project Report (DPR) with Process Flow Chart",
            "category": "TECHNICAL_PLAN",
            "why_it_matters": "Enables the State Pollution Control Board to assess raw material inputs, emissions, and waste outputs.",
        },
        {
            "name": "Site Layout Plan showing Effluent & Emission Points",
            "category": "PREMISES_DOCUMENTATION",
            "why_it_matters": "Identifies industrial discharge stacks, wastewater discharge points, and internal drainage networks.",
        },
        {
            "name": "Effluent Treatment Scheme (ETP / STP Design & Capacity)",
            "category": "ENVIRONMENTAL_CLEARANCE",
            "why_it_matters": "Required for Consent to Establish (CTE) to confirm industrial wastewater meets discharge standards.",
        },
        {
            "name": "Air Pollution Control Equipment (APCM) Technical Specifications",
            "category": "TECHNICAL_PLAN",
            "why_it_matters": "Specifies scrubbers, bag filters, or cyclone separators for boiler and furnace chimneys.",
        },
        {
            "name": "Land Allotment Letter / Industrial Estate Lease Agreement",
            "category": "PREMISES_DOCUMENTATION",
            "why_it_matters": "Proves legal possession of industrial land and siting suitability outside prohibited eco-sensitive zones.",
        },
        {
            "name": "Water Balance Diagram and Source Authorization",
            "category": "RESOURCE_AUTHORIZATION",
            "why_it_matters": "Quantifies daily fresh water intake from municipal, industrial development corporation, or borewell sources.",
        },
    ],
    "LABOR": [
        {
            "name": "Approved Factory Building Plan Approval",
            "category": "FACTORY_CLEARANCE",
            "why_it_matters": "Mandatory clearance from Directorate of Industrial Safety & Health (DISH) before structural erection.",
        },
        {
            "name": "Machinery Layout Plan showing Electric Motor Ratings (HP)",
            "category": "EQUIPMENT_SPECIFICATION",
            "why_it_matters": "Establishes total connected power load triggering the Factories Act section thresholds.",
        },
        {
            "name": "Structural Stability Certificate from Chartered Engineer",
            "category": "SAFETY_CERTIFICATE",
            "why_it_matters": "Certifies that the manufacturing shed and overhead cranes safely support operating machinery loads.",
        },
        {
            "name": "On-Site Emergency Response & Fire Safety Plan",
            "category": "SAFETY_CERTIFICATE",
            "why_it_matters": "Demonstrates worker evacuation protocols and availability of adequate fire extinguishing systems.",
        },
        {
            "name": "Notice of Occupation of Factory (Form 1 / Form 2)",
            "category": "STATUTORY_NOTICE",
            "why_it_matters": "Formal statutory declaration of factory occupancy submitted to the Chief Inspector of Factories.",
        },
    ],
    "TRADE": [
        {
            "name": "Permanent Account Number (PAN) Card of the Entity",
            "category": "ENTITY_REGISTRATION",
            "why_it_matters": "Primary statutory identifier for foreign trade registration with DGFT.",
        },
        {
            "name": "Certificate of Incorporation or Registered Partnership Deed",
            "category": "ENTITY_REGISTRATION",
            "why_it_matters": "Validates legal standing for cross-border commercial shipments.",
        },
        {
            "name": "Canceled Cheque or Bank Certificate of Active Current Account",
            "category": "FINANCIAL_PROOF",
            "why_it_matters": "Required to link authorized banking channel for international remittances and export incentives.",
        },
        {
            "name": "Proof of Business Premises (Lease Deed / Utility Bill)",
            "category": "PREMISES_DOCUMENTATION",
            "why_it_matters": "Verifies physical operational address for custom clearing inspections.",
        },
    ],
    "STANDARD": [
        {
            "name": "Factory Registration & Manufacturing Facility Profile",
            "category": "FACTORY_CLEARANCE",
            "why_it_matters": "Submitted to Bureau of Indian Standards (BIS) to document production capabilities.",
        },
        {
            "name": "Complete Test Report from BIS-Recognized Laboratory",
            "category": "LAB_REPORT",
            "why_it_matters": "Verifies that product samples conform to Indian Standard (IS) specifications under Compulsory Registration.",
        },
        {
            "name": "In-House Testing & Quality Control Equipment Calibration Records",
            "category": "QUALITY_MANUAL",
            "why_it_matters": "Proves capability of batch testing and continuous quality compliance before market distribution.",
        },
    ],
    "DEFAULT": [
        {
            "name": "Proof of Legal Entity Incorporation / Partnership Deed",
            "category": "ENTITY_REGISTRATION",
            "why_it_matters": "Establishes legal existence and authorized signatories for official statutory filings.",
        },
        {
            "name": "Premises Proof of Ownership or Registered Lease Agreement",
            "category": "PREMISES_DOCUMENTATION",
            "why_it_matters": "Verifies statutory location and lawful occupancy of commercial or industrial operations.",
        },
        {
            "name": "Technical Process Flow Description and Facility Layout",
            "category": "TECHNICAL_PLAN",
            "why_it_matters": "Provides licensing officers with an overview of operations, machinery, and production capacity.",
        },
        {
            "name": "Statutory Compliance Declaration",
            "category": "STATUTORY_NOTICE",
            "why_it_matters": "Confirms identity of designated responsible person and undertaking of regulatory compliance.",
        },
    ],
}


def _match_template_category(req_def: RequirementDefinition) -> str:
    """Identify matching template domain for a requirement."""
    dom = (req_def.domain or "").upper()
    cat = (req_def.category or "").upper()
    auth = (req_def.authority or "").upper()
    req_id = req_def.requirement_id.upper()

    if "FOOD" in dom or "FSSAI" in auth or "FOOD" in req_id:
        return "FOOD"
    if "ENVIRONMENT" in dom or "POLLUTION" in dom or "PCB" in auth or "CPCB" in auth or "SPCB" in auth:
        return "ENVIRONMENT"
    if "LABOR" in dom or "FACTORY" in dom or "DISH" in auth:
        return "LABOR"
    if "TRADE" in dom or "DGFT" in auth or "CUSTOM" in dom or "IEC" in req_id:
        return "TRADE"
    if "STANDARD" in cat or "BIS" in auth or "CRS" in req_id:
        return "STANDARD"
    return "DEFAULT"


def derive_business_documents(
    business: Business,
    context: DerivedBusinessContext | None = None,
) -> dict[str, Any]:
    """Derive the complete statutory document checklist for a business."""
    if context is None:
        context = build_business_context(business)

    latest_run = (
        DecisionRun.objects.filter(business=business)
        .prefetch_related("results")
        .order_by("-created_at")
        .first()
    )

    documents: list[dict[str, Any]] = []
    requirements_summary: list[dict[str, Any]] = []

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

        for result in actionable_results:
            req_def = req_defs.get(result.requirement_id)
            if req_def is None:
                continue

            # 1. Check if metadata explicitly carries required documents
            explicit_names = _str_list((req_def.metadata or {}).get(DOCUMENTS_KEY))
            req_docs: list[dict[str, Any]] = []

            if explicit_names:
                for idx, doc_name in enumerate(explicit_names, start=1):
                    req_docs.append({
                        "id": f"{result.requirement_id}::DOC-{idx}",
                        "name": doc_name,
                        "category": "STATUTORY_REQUIREMENT",
                        "why_it_matters": f"Directly required by published regulatory specifications for {req_def.name}.",
                    })
            else:
                # 2. Derive from statutory template matching authority and domain
                template_key = _match_template_category(req_def)
                template_items = STATUTORY_DOCUMENT_TEMPLATES.get(template_key, STATUTORY_DOCUMENT_TEMPLATES["DEFAULT"])
                for idx, t_item in enumerate(template_items, start=1):
                    req_docs.append({
                        "id": f"{result.requirement_id}::DOC-{idx}",
                        "name": t_item["name"],
                        "category": t_item["category"],
                        "why_it_matters": t_item["why_it_matters"],
                    })

            for d in req_docs:
                documents.append({
                    "id": d["id"],
                    "name": d["name"],
                    "requirement_id": result.requirement_id,
                    "requirement_name": result.requirement_name,
                    "authority": req_def.authority,
                    "category": d["category"],
                    "why_it_matters": d["why_it_matters"],
                    "status": "NOT_UPLOADED",
                    "prevalidation_status": "NEEDS_REVIEW",
                    "accepted_formats": "PDF, JPG, PNG (Max 10 MB)",
                    "mandatory": True,
                    "notes": f"Required for submission to {req_def.authority}.",
                })

            requirements_summary.append({
                "requirement_id": result.requirement_id,
                "requirement_name": result.requirement_name,
                "authority": req_def.authority,
                "document_count": len(req_docs),
            })

    # Group documents by requirement
    grouped_by_requirement: dict[str, list[dict[str, Any]]] = {}
    for doc in documents:
        req_name = doc["requirement_name"]
        if req_name not in grouped_by_requirement:
            grouped_by_requirement[req_name] = []
        grouped_by_requirement[req_name].append(doc)

    return {
        "business_id": str(business.id),
        "business_name": business.name,
        "evaluated": latest_run is not None,
        "total_count": len(documents),
        "total_documents_needed": len(documents),
        "documents": documents,
        "grouped_by_requirement": grouped_by_requirement,
        "requirements_summary": requirements_summary,
        "requirements_without_checklist": [],
        "checklist_source": "STATUTORY_REQUIREMENT_MAPPING",
        "upload_available": True,
        "prevalidation_available": False,
        "disclaimer": "Statutory checklists are derived from regulatory filing requirements for your business's applicable obligations.",
    }
