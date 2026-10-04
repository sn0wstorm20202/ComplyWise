"""Case Service aggregating full business context, user tasks, and case execution data.

Authority: Architectural Specification §8, §9, §40, §41, §42.
Enforces:
1. Complete Case Context Aggregation (Business context, why applicable, evidence, workflow).
2. Definitive answer to the User's question: "What must I do right now?"
"""

from __future__ import annotations

import logging
from typing import Any

from common.enums import CaseStatus, WorkflowStepType
from apps.workflows.models import ComplianceCase

logger = logging.getLogger(__name__)


class CaseService:
    """Aggregates rich context, calculates current user task, and prepares case models."""

    @classmethod
    def get_business_context(cls, case: ComplianceCase) -> dict[str, Any]:
        """Derive readable business context profile for admin and user workspaces."""
        business = case.business
        profile_ver = case.profile_version or getattr(business, "current_profile", None)
        variables = profile_ver.variables if profile_ver else {}

        def get_val(var_name: str, fallback: str = "Not Specified") -> Any:
            var_data = variables.get(var_name)
            if isinstance(var_data, dict):
                val = var_data.get("value")
                return val if val is not None else fallback
            return var_data if var_data is not None else fallback

        state = get_val("state")
        district = get_val("district")
        industry = get_val("sector", get_val("nature_of_business"))
        product = get_val("product_description")
        workers = get_val("total_worker_count")
        power = get_val("connected_power_load")
        investment = get_val("plant_machinery_investment")
        turnover = get_val("annual_turnover")
        haz_substances = get_val("uses_hazardous_substances", None)
        haz_waste = get_val("hazardous_waste_generation", None)

        # Assemble full answered variables list with metadata for deep scrutiny
        answered_vars = []
        try:
            from domain.profile.variables import PROFILE_VARIABLES
            var_map = {v.key: v for v in PROFILE_VARIABLES}
        except Exception:
            var_map = {}

        for k, v in variables.items():
            if isinstance(v, dict):
                val = v.get("value")
                origin = v.get("origin", "USER_PROVIDED")
                recorded_at = v.get("recorded_at")
            else:
                val = v
                origin = "USER_PROVIDED"
                recorded_at = None

            if val is not None:
                def_obj = var_map.get(k)
                label = def_obj.label if def_obj else k.replace("_", " ").title()
                unit = def_obj.unit if def_obj else None
                answered_vars.append({
                    "key": k,
                    "label": label,
                    "value": val,
                    "origin": origin,
                    "unit": unit,
                    "recorded_at": recorded_at,
                })

        return {
            "business_name": business.name,
            "state": state,
            "district": district,
            "business_type": industry,
            "product": product,
            "workers": workers,
            "power_load": power if ("KW" in str(power).upper() or "HP" in str(power).upper()) else f"{power} KW",
            "profile_version": profile_ver.version if profile_ver else 1,
            "profile_version_id": str(profile_ver.id) if profile_ver else None,
            "profile_change_note": profile_ver.change_note if profile_ver else "",
            "profile_created_at": profile_ver.created_at.isoformat() if (profile_ver and hasattr(profile_ver, "created_at")) else None,
            "investment": investment,
            "turnover": turnover,
            "uses_hazardous_substances": haz_substances,
            "generates_hazardous_waste": haz_waste,
            "answered_variables": answered_vars,
        }

    @classmethod
    def get_why_applicable_summary(cls, case: ComplianceCase) -> str:
        """Derive explanation of why this requirement is applicable."""
        if case.requirement and case.requirement.description:
            return case.requirement.description

        meta = case.metadata or {}
        if meta.get("applicability_reason"):
            return meta["applicability_reason"]

        return f"Statutory requirement mandated under {case.requirement_id_code} for active operational profile."

    @classmethod
    def get_current_user_task(cls, case: ComplianceCase) -> dict[str, Any]:
        """Compute the exact action the user must perform right now (§40, §41)."""
        status_code = case.status_code
        step_inst = case.current_workflow_instance.current_step if case.current_workflow_instance else None
        step_type = step_inst.step_type if step_inst else WorkflowStepType.DOCUMENT_COLLECTION

        # Check if latest review was a query
        latest_query = case.human_reviews.filter(decision="QUERY").first()
        query_reason = latest_query.reason if latest_query else ""
        query_action = latest_query.required_action if latest_query else ""

        if status_code == CaseStatus.ACTION_REQUIRED:
            desc = query_reason or "Compliance officer requested a corrected document."
            if query_action:
                desc += f" Required action: {query_action}"
            return {
                "action_type": "CORRECT_DOCUMENT",
                "title": "Action Required: Upload Corrected Document",
                "description": desc,
                "is_action_required": True,
                "button_label": "Upload Corrected Document",
            }

        if step_type == WorkflowStepType.DOCUMENT_COLLECTION:
            # Check document completion
            doc_reqs = case.document_requirements.all()
            missing_count = sum(1 for d in doc_reqs if not d.latest_submission)
            if missing_count > 0:
                return {
                    "action_type": "UPLOAD_DOCUMENT",
                    "title": f"Upload Mandated Statutory Documents ({missing_count} remaining)",
                    "description": "Please upload all required certificates, blueprints, or declarations to proceed.",
                    "is_action_required": True,
                    "button_label": "Upload Documents",
                }
            return {
                "action_type": "WAITING_REVIEW",
                "title": "Documents Submitted",
                "description": "All mandated documents are uploaded and awaiting AI verification.",
                "is_action_required": False,
                "button_label": None,
            }

        if step_type == WorkflowStepType.DOCUMENT_REVIEW:
            return {
                "action_type": "WAITING_REVIEW",
                "title": "Automated AI Pre-check In Progress",
                "description": "Document OCR extraction, clarity checks, and statutory cross-referencing in progress.",
                "is_action_required": False,
                "button_label": None,
            }

        if step_type == WorkflowStepType.HUMAN_REVIEW:
            return {
                "action_type": "WAITING_REVIEW",
                "title": "Compliance Officer Scrutiny In Progress",
                "description": "No action required from you right now. An assigned compliance officer is reviewing your application.",
                "is_action_required": False,
                "button_label": None,
            }

        if step_type == WorkflowStepType.FORM_PREPARATION:
            return {
                "action_type": "COMPLETE_FORM",
                "title": "Complete Statutory Application Form",
                "description": "Your documents have been approved internally. Fill out and verify the statutory application details.",
                "is_action_required": True,
                "button_label": "Complete Form",
            }

        if step_type == WorkflowStepType.EXTERNAL_PROCESSING:
            latest_ext = case.external_statuses.first()
            ref_str = f" Ref #{latest_ext.application_reference_number}" if latest_ext and latest_ext.application_reference_number else ""
            return {
                "action_type": "GOVERNMENT_PROCESSING",
                "title": f"Official Authority Scrutiny Active{ref_str}",
                "description": "Your statutory filing is submitted to the government portal. Processing status is being monitored.",
                "is_action_required": False,
                "button_label": None,
            }

        if step_type == WorkflowStepType.COMPLETION:
            return {
                "action_type": "COMPLETED",
                "title": "Compliance Clearance Active",
                "description": "Statutory approval successfully granted. Renewal calendar cycles have been scheduled.",
                "is_action_required": False,
                "button_label": None,
            }

        if step_type == WorkflowStepType.REJECTION or status_code == CaseStatus.REJECTED:
            return {
                "action_type": "REJECTED",
                "title": "Application Rejected / Clearance Denied",
                "description": "Statutory clearance was rejected during scrutiny. Review remarks and consider re-filing.",
                "is_action_required": False,
                "button_label": None,
            }

        return {
            "action_type": "UNKNOWN",
            "title": "Case Active",
            "description": "Case is in progress.",
            "is_action_required": False,
            "button_label": None,
        }
