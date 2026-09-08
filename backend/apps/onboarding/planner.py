"""Adaptive Smart Question Planner.

Authority: Milestone Task — Part A; PRD_v2.0 §10, §11; TRD_v2.0 §8, §12.

Plans the minimum number of high-information questions needed to reduce
material regulatory uncertainty. Maps every question to a canonical variable (V01-V19).
Supports iterative rounds with deterministic stopping conditions.
"""

from __future__ import annotations

import json
import logging
from collections import Counter
from typing import Any

from common.enums import KnowledgeStatus
from domain.context.business_context import DerivedBusinessContext, build_business_context
from domain.profile.variables import (
    PROFILE_VARIABLES,
    Relevance,
    get_variable,
    resolve_variable_options,
)
from domain.providers import get_llm_provider
from domain.providers.base import ChatMessage, ProviderError
from apps.businesses.models import Business
from apps.knowledge.models import RequirementDefinition, RuleVersion
from apps.onboarding.models import SmartQuestionInstance, SmartQuestionPlan

logger = logging.getLogger(__name__)

MAX_QUESTIONS_PER_ROUND = 9
MAX_ROUNDS = 2

QUESTION_PLANNER_SYSTEM_PROMPT = """You are an expert industrial compliance intake planner.
Your goal is to select 7 to 9 high-information questions needed to determine which statutory regulations and licences apply to this specific business.

RULES:
1. Every question MUST map directly to one of the provided CANDIDATE_VARIABLE_KEYS.
2. Do NOT invent new variable keys.
3. Frame each question clearly in natural, conversational, professional English tailored to the business's industry, products, and scale.
4. Explain why the variable matters for statutory classification in simple founder-friendly terms.
5. Prioritize variables that drive statutory thresholds (power load, emissions, hazardous waste, workforce count, trade intent, industrial zone).
6. Do NOT ask for information that is already known.

OUTPUT FORMAT:
Return a JSON object:
{
  "questions": [
    {
      "variable_key": "connected_power_load",
      "question_text": "What is the anticipated connected electrical power load (in HP) for your processing machinery?",
      "why_it_matters": "Connected electrical load determines registration thresholds under state Factory Acts and Pollution Control Board consents.",
      "priority": "HIGH",
      "information_gain": 0.95
    }
  ]
}
"""


def _extract_ast_variables(node: Any) -> set[str]:
    found: set[str] = set()
    if isinstance(node, dict):
        if "var" in node and isinstance(node["var"], str):
            found.add(node["var"].strip())
        for v in node.values():
            found.update(_extract_ast_variables(v))
    elif isinstance(node, list):
        for item in node:
            found.update(_extract_ast_variables(item))
    return found


def plan_adaptive_smart_questions(
    business: Business,
    round_number: int = 1,
) -> dict[str, Any]:
    """Dynamically plan adaptive smart questions for a business."""
    context = build_business_context(business)

    # Candidate requirements for business jurisdiction
    reqs_query = RequirementDefinition.objects.filter(status=KnowledgeStatus.PUBLISHED)
    if context.state:
        reqs_query = reqs_query.filter(jurisdiction__in=["CENTRAL", context.state])
    else:
        reqs_query = reqs_query.filter(jurisdiction="CENTRAL")

    candidate_req_ids = set(reqs_query.values_list("requirement_id", flat=True))
    candidate_rules = RuleVersion.objects.filter(
        requirement__requirement_id__in=candidate_req_ids,
        status=KnowledgeStatus.PUBLISHED,
    )

    var_frequency: Counter[str] = Counter()
    for rule in candidate_rules:
        for rv in _extract_ast_variables(rule.condition_ast):
            var_frequency[rv] += 1

    # 1. Missing variables referenced in candidate published rules (highest priority)
    missing_rule_vars = sorted(
        [k for k in var_frequency if k in context.missing_variable_keys],
        key=lambda k: var_frequency[k],
        reverse=True,
    )

    # 2. Key statutory threshold & branching variables
    branching_priority = [
        "annual_turnover",
        "total_worker_count",
        "connected_power_load",
        "effluent_emission_generation",
        "import_export_intent",
        "industrial_zone_status",
        "contract_worker_count",
        "ecommerce_operations",
        "multi_state_operations",
        "export_destination",
    ]
    unanswered_branching = [
        k for k in branching_priority if k in context.missing_variable_keys
    ]

    # 3. Unanswered core profile variables
    unanswered_core_vars = [
        pv.key
        for pv in PROFILE_VARIABLES
        if pv.default_relevance == Relevance.CORE and pv.key in context.missing_variable_keys
    ]

    # Combine candidate variables: rule-dependent first, then branching, then core
    candidate_keys = list(dict.fromkeys(missing_rule_vars + unanswered_branching + unanswered_core_vars))

    # Stopping condition 1: No missing variables or no candidate keys
    if not candidate_keys or round_number > MAX_ROUNDS:
        reason = "ROUNDS_EXHAUSTED" if round_number > MAX_ROUNDS else "ALL_CRITICAL_VARIABLES_SATISFIED"
        plan, _ = SmartQuestionPlan.objects.get_or_create(
            business=business,
            round_number=round_number,
            defaults={"status": "COMPLETED", "stopping_reason": reason},
        )
        return {
            "business_id": str(business.id),
            "business_name": business.name,
            "round": round_number,
            "status": "COMPLETED",
            "stopping_reason": reason,
            "questions": [],
            "total_questions": 0,
            "total_missing": len(context.missing_variable_keys),
            "known_variables_count": len(context.known_variable_keys),
            "context_summary": context.as_dict(),
        }

    # Prepare candidate variable specifications
    var_specs = []
    for k in candidate_keys:
        var_def = get_variable(k)
        if var_def:
            var_specs.append({
                "key": var_def.key,
                "label": var_def.label,
                "data_type": str(var_def.data_type),
                "why_it_matters": var_def.why_it_matters,
                "rule_dependency_count": var_frequency.get(k, 0),
            })

    # Attempt LLM-assisted question formulation and ranking
    planned_items: list[dict[str, Any]] = []
    provider = get_llm_provider()
    if provider.is_configured:
        prompt = f"""BUSINESS CONTEXT:
{context.to_llm_summary()}

CANDIDATE_VARIABLE_KEYS AND DEFINITIONS:
{json.dumps(var_specs, indent=2)}

Select the most critical 7 to {MAX_QUESTIONS_PER_ROUND} variables to ask about for this business."""

        try:
            res = provider.complete(
                [
                    ChatMessage(role="system", content=QUESTION_PLANNER_SYSTEM_PROMPT),
                    ChatMessage(role="user", content=prompt),
                ],
                temperature=0.0,
                max_output_tokens=1500,
            )
            content = res.text.strip()
            if content.startswith("```"):
                lines = content.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                content = "\n".join(lines).strip()
            parsed = json.loads(content)
            raw_qs = parsed.get("questions", [])
            valid_keys_set = set(candidate_keys)
            for item in raw_qs:
                k = item.get("variable_key")
                if k in valid_keys_set:
                    planned_items.append(item)
        except Exception as e:
            logger.warning("LLM question planning failed, falling back to deterministic planning: %s", e)

    # Fallback to deterministic sector-tailored phrasing if LLM failed or returned insufficient questions
    if len(planned_items) < 5:
        desc_lower = (context.product_description or "").lower()
        is_food = any(w in desc_lower for w in ["food", "fruit", "beverage", "snack", "dehydrat", "dairy", "bakery", "spice"])
        is_auto_machining = any(w in desc_lower for w in ["auto", "machin", "metal", "cnc", "precision", "gear", "component", "fastener"])

        tailored_questions: dict[str, tuple[str, str]] = {
            "annual_turnover": (
                "What is your anticipated annual turnover from food product sales (in INR)?" if is_food else
                "What is your projected annual turnover from precision manufacturing operations (in INR)?" if is_auto_machining else
                "What is your projected or current annual business turnover (in INR)?",
                "Turnover determines statutory licensing brackets (e.g. FSSAI Central vs State) and MSME enterprise scale.",
            ),
            "connected_power_load": (
                "What is the anticipated connected electrical power load (in HP) for your processing machinery and cold storage?" if is_food else
                "What is the connected electrical power load (in HP) for your CNC machinery and shop-floor equipment?" if is_auto_machining else
                "What is the anticipated connected electrical power load (in HP) for your facility?",
                "Connected electrical load determines registration thresholds under state Factory Acts and Pollution Control Board consents.",
            ),
            "effluent_emission_generation": (
                "Will your food processing operations generate wash water, trade effluent, or boiler emissions?" if is_food else
                "Will your metal machining operations produce liquid trade effluent, coolant discharge, or air emissions?" if is_auto_machining else
                "Will your facility generate industrial trade effluent or air emissions?",
                "Discharges and emissions determine whether environmental Consent to Establish (CTE) from the Pollution Control Board is required.",
            ),
            "hazardous_waste_generation": (
                "Will your facility store or generate hazardous chemical waste (e.g. industrial refrigerants or sanitizing agents)?" if is_food else
                "Will your operations generate hazardous waste (such as spent cutting fluids, oily rags, or chemical sludge)?" if is_auto_machining else
                "Will your operations store, use, or generate hazardous waste materials?",
                "Hazardous waste handling requires dedicated statutory authorization under CPCB/SPCB Hazardous Waste Management Rules.",
            ),
            "total_worker_count": (
                "What is your anticipated total workforce (including food handlers, operators, and administrative staff)?" if is_food else
                "What is your total workforce count on the manufacturing shop floor?" if is_auto_machining else
                "What is the total number of workers employed at your premises?",
                "Workforce size determines applicability of the Factories Act, EPF, and ESI registrations.",
            ),
            "contract_worker_count": (
                "Do you plan to engage contract labour for packaging, loading, or facility maintenance?",
                "Contract labour engagement triggers registration requirements under the Contract Labour (Regulation and Abolition) Act.",
            ),
            "import_export_intent": (
                "Do you plan to export finished goods to international markets or import raw materials?",
                "Cross-border shipments mandate an Importer-Exporter Code (IEC) from DGFT and customs clearances.",
            ),
            "industrial_zone_status": (
                "Is your processing facility located inside a notified industrial area / agro-processing park or outside?" if is_food else
                "Is your precision machining plant situated inside a notified industrial park (e.g. IDCO estate) or outside?" if is_auto_machining else
                "Is your facility situated inside an approved industrial estate or outside?",
                "Zoning status affects local municipal approvals, environmental siting criteria, and state capital subsidies.",
            ),
            "ecommerce_operations": (
                "Will you sell products directly to consumers through online channels or e-commerce marketplaces?",
                "E-commerce sales introduce legal metrology e-commerce declarations and state GST registrations.",
            ),
            "multi_state_operations": (
                "Do you plan to operate manufacturing, storage, or distribution facilities in more than one Indian state?",
                "Multi-state operations determine whether Central licenses (e.g. Central FSSAI) or state-level registrations apply.",
            ),
            "export_destination": (
                "Which target export markets or countries do you plan to ship your products to (e.g. US, EU, UAE)?",
                "Destination markets determine international product certifications, sanitary/phytosanitary standards, and testing dossiers.",
            ),
        }

        fallback_items = []
        for spec in var_specs[:MAX_QUESTIONS_PER_ROUND]:
            k = spec["key"]
            var_def = get_variable(k)
            if not var_def:
                continue

            if k in tailored_questions:
                q_text, q_why = tailored_questions[k]
            else:
                label = var_def.label
                if label.lower().startswith("generates ") or label.lower().startswith("sells ") or label.lower().startswith("operates "):
                    q_text = f"Does your business {label.lower()}?"
                elif not label.endswith("?"):
                    q_text = f"What is your {label.lower()}?"
                else:
                    q_text = label
                q_why = var_def.why_it_matters

            fallback_items.append({
                "variable_key": k,
                "question_text": q_text,
                "why_it_matters": q_why,
                "priority": "HIGH" if var_def.default_relevance == Relevance.CORE or var_frequency.get(k, 0) > 0 else "MEDIUM",
                "information_gain": 1.0 if var_frequency.get(k, 0) > 0 else 0.8,
            })
        planned_items = fallback_items

    # Limit to MAX_QUESTIONS_PER_ROUND
    planned_items = planned_items[:MAX_QUESTIONS_PER_ROUND]

    # Create SmartQuestionPlan and SmartQuestionInstances in DB
    plan = SmartQuestionPlan.objects.create(
        business=business,
        round_number=round_number,
        status="ACTIVE",
    )

    instances: list[SmartQuestionInstance] = []
    output_questions: list[dict[str, Any]] = []

    for item in planned_items:
        k = item["variable_key"]
        var_def = get_variable(k)
        if not var_def:
            continue

        q_inst = SmartQuestionInstance.objects.create(
            plan=plan,
            business=business,
            variable_key=k,
            question_text=item.get("question_text", var_def.label),
            why_it_matters=item.get("why_it_matters", var_def.why_it_matters),
            data_type=str(var_def.data_type),
            options=resolve_variable_options(var_def),
            unit=var_def.unit or "",
            priority=item.get("priority", "HIGH"),
            information_gain=float(item.get("information_gain", 1.0)),
            rule_dependency_count=var_frequency.get(k, 0),
        )
        instances.append(q_inst)
        output_questions.append({
            "id": str(q_inst.id),
            "code": var_def.code,
            "key": k,
            "variable_key": k,
            "label": var_def.label,
            "question": q_inst.question_text,
            "data_type": q_inst.data_type,
            "why_it_matters": q_inst.why_it_matters,
            "unit": q_inst.unit,
            "options": q_inst.options,
            "current_value": context.raw_variables.get(k),
            "priority": q_inst.priority,
            "information_gain": q_inst.information_gain,
            "required": var_def.default_relevance == Relevance.CORE,
            "rule_dependency_count": q_inst.rule_dependency_count,
        })

    return {
        "business_id": str(business.id),
        "business_name": business.name,
        "plan_id": str(plan.id),
        "round": round_number,
        "status": "ACTIVE",
        "questions": output_questions,
        "total_questions": len(output_questions),
        "total_missing": len(context.missing_variable_keys),
        "known_variables_count": len(context.known_variable_keys),
        "context_summary": context.as_dict(),
    }
