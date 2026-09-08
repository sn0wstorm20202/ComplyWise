"""Adaptive Smart Question Planner.

Authority: Milestone Task — Objective 2; PRD_v2.0 §10, §11; TRD_v2.0 §8, §12.

Plans high-information questions tailored specifically to a business's operational reality,
products, and industry to uncover statutory compliances, support schemes, and technical standards.
Maps every question to a canonical variable (V01-V19).
Supports iterative rounds with deterministic stopping conditions and links to Assessment instances.
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
from domain.providers.base import ChatMessage
from apps.businesses.models import Business
from apps.knowledge.models import RequirementDefinition, RuleVersion
from apps.onboarding.models import SmartQuestionInstance, SmartQuestionPlan

logger = logging.getLogger(__name__)

MIN_QUESTIONS_PER_ROUND = 6
MAX_QUESTIONS_PER_ROUND = 10
MAX_ROUNDS = 2

QUESTION_PLANNER_SYSTEM_PROMPT = """You are an expert industrial compliance and regulatory intake planner for ComplyWise.
Your task is to generate 7 to 10 high-value intake questions tailored precisely to what this specific business actually manufactures, processes, or operates.

THE CORE PHILOSOPHY:
You must NOT produce a generic static checklist. You must understand the specific industry, product categories, operating scale, and manufacturing/service processes of THIS business.
Frame questions so that a founder immediately recognizes they are tailored to their specific operational reality:
- Medical device manufacturing: talk about cleanrooms, sterilization, bio-medical waste, electronic components, clinical quality certifications, export markets.
- Food processing: talk about processing lines, food safety, water potability, boiler steam, cold chain storage, agricultural inputs, packaging.
- Precision engineering / automotive: talk about CNC machines, machining coolants, metal plating, hazardous waste, OEM supply chain, ISO/IATF standards.
- Other sectors: tailor directly to their products, factory scale, discharges, and trade intents.

CRITICAL RULES:
1. Every question MUST map to one of the provided CANDIDATE_VARIABLE_KEYS using its exact variable_id.
2. Do NOT invent unrecognized variable IDs.
3. Do NOT ask for information that is already known in KNOWN_VARIABLES.
4. Frame questions in natural, professional, founder-friendly conversational English.
5. Provide a clear reason explaining why this question matters for statutory compliance, government incentives/subsidies (schemes), or technical standards/certifications.
6. Target approximately 7 to 10 high-value questions (minimum 6, maximum 10).
7. Return ONLY a valid JSON object matching the contract below.

OUTPUT FORMAT (JSON ONLY, NO MARKDOWN, NO CODEBLOCKS):
{
  "personalization_summary": "Tailored intake questions formulated for <Business Name> based on its <activity> in <State>.",
  "questions": [
    {
      "question_id": "Q_connected_power_load",
      "question_text": "What is the anticipated connected electrical power load (in HP) for your manufacturing machinery and facilities?",
      "variable_id": "connected_power_load",
      "answer_type": "DECIMAL",
      "allowed_values": [],
      "priority": 1,
      "information_gain": 0.95,
      "reason": "Determines factory registration thresholds under the Factories Act and power sanction approvals from the state electricity board.",
      "domains": ["COMPLIANCE", "STANDARDS"]
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


def _build_context_driven_fallback_questions(
    context: DerivedBusinessContext,
    candidate_keys: list[str],
    var_frequency: Counter[str],
) -> list[dict[str, Any]]:
    """Generate dynamic, context-tailored questions when LLM is unavailable or unconfigured.

    Inspects the actual product description, industry hint, and operational keywords
    to synthesize tailored questions without hardcoding company names.
    """
    desc = (getattr(context, "product_description", "") or "").lower()
    ind = (getattr(context, "industry_hint", "") or "").lower()
    activity = (getattr(context, "primary_activity", "") or "").lower()
    combined_text = f"{desc} {ind} {activity}".strip()

    # Semantic sector detection from product description and activity keywords
    is_medtech = any(w in combined_text for w in ["med", "device", "surgical", "health", "diagnostic", "biomed", "implant", "clinical", "hospital", "pharma"])
    is_food = any(w in combined_text for w in ["food", "fruit", "beverage", "snack", "dehydrat", "dairy", "bakery", "spice", "agro", "grain", "tea", "coffee", "meat", "fish", "edible", "juice"])
    is_auto_machining = any(w in combined_text for w in ["auto", "machin", "metal", "cnc", "precision", "gear", "component", "fastener", "casting", "forging", "tool", "engine", "vehicle"])
    is_electronics = any(w in combined_text for w in ["electron", "pcb", "semiconductor", "sensor", "iot", "circuit", "battery", "hardware", "telecom"])
    is_chemical = any(w in combined_text for w in ["chem", "paint", "polymer", "resin", "solvent", "fertilizer", "pesticide", "coating"])

    sector_label = (
        "medical device manufacturing" if is_medtech
        else "food and agro processing" if is_food
        else "precision engineering and automotive manufacturing" if is_auto_machining
        else "electronics and hardware assembly" if is_electronics
        else "chemical and materials processing" if is_chemical
        else "industrial operations"
    )

    tailored_map: dict[str, dict[str, Any]] = {
        "annual_turnover": {
            "question_text": (
                f"What is your anticipated annual turnover from {sector_label} (in INR)?"
                if (is_medtech or is_food or is_auto_machining or is_electronics)
                else "What is your projected or current annual business turnover (in INR)?"
            ),
            "reason": "Turnover determines statutory licensing brackets (e.g. Central vs State authority), MSME enterprise scale, and GST filing thresholds.",
            "domains": ["COMPLIANCE", "SCHEMES"],
            "priority": 1,
            "information_gain": 0.95,
        },
        "connected_power_load": {
            "question_text": (
                "What is the anticipated connected electrical power load (in HP) for your cleanroom, production lines, and testing equipment?" if is_medtech else
                "What is the anticipated connected electrical power load (in HP) for your food processing machinery, refrigeration, and cold chain?" if is_food else
                "What is the connected electrical power load (in HP) for your CNC machine tools, compressors, and shop-floor equipment?" if is_auto_machining else
                "What is the connected electrical power load (in HP) for your surface mount technology (SMT) and testing lines?" if is_electronics else
                "What is the anticipated connected electrical power load (in HP) for your facility?"
            ),
            "reason": "Connected electrical load determines registration thresholds under state Factory Acts and Pollution Control Board consent categories.",
            "domains": ["COMPLIANCE", "STANDARDS"],
            "priority": 1,
            "information_gain": 0.93,
        },
        "effluent_emission_generation": {
            "question_text": (
                "Will your manufacturing, component cleaning, or sterilization processes produce liquid trade effluent or air emissions?" if is_medtech else
                "Will your food processing operations generate wash water, processing trade effluent, or boiler emissions?" if is_food else
                "Will your machining operations produce liquid trade effluent, coolant discharge, or exhaust emissions?" if is_auto_machining else
                "Will your facility generate industrial trade effluent, chemical rinse water, or air emissions?"
            ),
            "reason": "Discharges and emissions mandate Consent to Establish (CTE) and Consent to Operate (CTO) from the State Pollution Control Board under Water & Air Acts.",
            "domains": ["COMPLIANCE"],
            "priority": 1,
            "information_gain": 0.92,
        },
        "hazardous_waste_generation": {
            "question_text": (
                "Will your facility generate hazardous or bio-medical waste (such as chemical solvents, sterilization residues, or electronic scrap)?" if is_medtech else
                "Will your facility generate or handle hazardous chemical waste (e.g. industrial refrigerants or chemical cleaning agents)?" if is_food else
                "Will your operations generate hazardous waste (such as spent cutting oils, chemical sludge, or metal treatment residues)?" if is_auto_machining else
                "Will your electronic assembly produce hazardous waste like solder dross, spent flux, or chemical cleaners?" if is_electronics else
                "Will your operations store, use, or generate hazardous waste materials?"
            ),
            "reason": "Hazardous waste handling requires dedicated statutory authorization under CPCB/SPCB Hazardous Waste Management Rules.",
            "domains": ["COMPLIANCE", "STANDARDS"],
            "priority": 2,
            "information_gain": 0.90,
        },
        "total_worker_count": {
            "question_text": (
                "What is your anticipated total workforce (including biomedical engineers, cleanroom technicians, and support staff)?" if is_medtech else
                "What is your anticipated total workforce (including food handlers, machine operators, and quality supervisors)?" if is_food else
                "What is your total workforce count on the manufacturing shop floor and facility?" if is_auto_machining else
                "What is the total number of workers employed at your premises?"
            ),
            "reason": "Workforce size determines applicability of the Factories Act (thresholds at 10 or 20 workers), EPF, and ESI employee social security registrations.",
            "domains": ["COMPLIANCE", "SCHEMES"],
            "priority": 2,
            "information_gain": 0.88,
        },
        "contract_worker_count": {
            "question_text": (
                "Do you plan to engage contract personnel for packaging, logistics, cleanroom maintenance, or facility security?" if is_medtech else
                "Do you plan to engage contract labour for seasonal food packing, warehousing, or facility sanitation?" if is_food else
                "Do you plan to engage contract workers for machining support, component handling, or shop-floor logistics?" if is_auto_machining else
                "Do you plan to engage contract workers or third-party staffing for operations?"
            ),
            "reason": "Engaging contract labour triggers principal employer registration under the Contract Labour (Regulation and Abolition) Act once statutory thresholds are reached.",
            "domains": ["COMPLIANCE"],
            "priority": 3,
            "information_gain": 0.84,
        },
        "import_export_intent": {
            "question_text": (
                "Do you plan to export finished medical devices to overseas markets or import specialized medical-grade raw materials?" if is_medtech else
                "Do you plan to export processed food products to international buyers or import specialized food ingredients?" if is_food else
                "Do you plan to export manufactured precision components or import specialized alloy tooling?" if is_auto_machining else
                "Do you plan to engage in international cross-border trade (importing raw materials or exporting finished products)?"
            ),
            "reason": "Cross-border trade mandates an Importer-Exporter Code (IEC) from DGFT, customs duty authorizations, and unlocks export incentive schemes.",
            "domains": ["COMPLIANCE", "SCHEMES", "STANDARDS"],
            "priority": 2,
            "information_gain": 0.91,
        },
        "export_destination": {
            "question_text": (
                "Which destination countries or regions do you plan to export to (e.g. US, European Union, Southeast Asia, Middle East)?"
            ),
            "reason": "Specific destination jurisdictions require harmonized technical standards, country-specific testing dossiers, and quality certifications.",
            "domains": ["STANDARDS", "SCHEMES"],
            "priority": 3,
            "information_gain": 0.82,
        },
        "industrial_zone_status": {
            "question_text": (
                f"Is your {sector_label} facility located inside a notified industrial area / technology park or outside?"
            ),
            "reason": "Zoning status affects municipal trade approvals, pollution board siting restrictions, and state industrial policy capital subsidies.",
            "domains": ["COMPLIANCE", "SCHEMES"],
            "priority": 3,
            "information_gain": 0.85,
        },
        "ecommerce_operations": {
            "question_text": (
                "Will you sell products directly to consumers or business clients through online platforms or digital e-commerce channels?"
            ),
            "reason": "Digital sales introduce Legal Metrology e-commerce declarations, consumer protection mandates, and multi-state GST tax registrations.",
            "domains": ["COMPLIANCE"],
            "priority": 4,
            "information_gain": 0.80,
        },
        "multi_state_operations": {
            "question_text": (
                "Do you plan to operate manufacturing, warehousing, or sales facilities across more than one Indian state?"
            ),
            "reason": "Inter-state presence determines Central versus State regulatory jurisdiction and triggers multi-state GST and regulatory compliance registrations.",
            "domains": ["COMPLIANCE"],
            "priority": 4,
            "information_gain": 0.81,
        },
    }

    fallback_items: list[dict[str, Any]] = []
    for k in candidate_keys:
        var_def = get_variable(k)
        if not var_def:
            continue

        if k in tailored_map:
            t = tailored_map[k]
            fallback_items.append({
                "question_id": f"Q_{k}",
                "variable_id": k,
                "question_text": t["question_text"],
                "answer_type": str(var_def.data_type),
                "allowed_values": [opt.value for opt in var_def.options] if var_def.options else [],
                "priority": t.get("priority", 2),
                "information_gain": t.get("information_gain", 0.85),
                "reason": t["reason"],
                "domains": t.get("domains", ["COMPLIANCE"]),
            })
        else:
            label = var_def.label
            if label.lower().startswith("generates ") or label.lower().startswith("sells ") or label.lower().startswith("operates "):
                q_text = f"Does your enterprise {label.lower()}?"
            elif not label.endswith("?"):
                q_text = f"What is your enterprise's {label.lower()}?"
            else:
                q_text = label

            fallback_items.append({
                "question_id": f"Q_{k}",
                "variable_id": k,
                "question_text": q_text,
                "answer_type": str(var_def.data_type),
                "allowed_values": [opt.value for opt in var_def.options] if var_def.options else [],
                "priority": 1 if (var_def.default_relevance == Relevance.CORE or var_frequency.get(k, 0) > 0) else 3,
                "information_gain": 0.90 if var_frequency.get(k, 0) > 0 else 0.75,
                "reason": var_def.why_it_matters or "Statutory classification variable for industrial compliance and approvals.",
                "domains": ["COMPLIANCE"],
            })

    return fallback_items


def plan_adaptive_smart_questions(
    business: Business,
    round_number: int = 1,
    assessment_id: str | None = None,
) -> dict[str, Any]:
    """Dynamically plan adaptive smart questions for a business.

    Uses LLM question planning with rich structured context and fallback heuristics.
    Maps questions strictly to canonical profile variables (V01-V19).
    """
    context = build_business_context(business)

    # Resolve assessment if passed
    assessment = None
    if assessment_id:
        assessment = business.assessments.filter(pk=assessment_id).first()
    if assessment is None:
        assessment = business.assessments.order_by("-assessment_number").first()

    # Candidate requirements for business jurisdiction (matching code, name, and raw state)
    reqs_query = RequirementDefinition.objects.filter(status=KnowledgeStatus.PUBLISHED)
    jurisdictions = {"CENTRAL"}
    if context.state:
        jurisdictions.add(context.state)
    if context.state_name:
        jurisdictions.add(context.state_name)
        jurisdictions.add(context.state_name.upper())
    raw_st = str(context.raw_variables.get("state") or "").strip()
    if raw_st:
        jurisdictions.add(raw_st)
        jurisdictions.add(raw_st.upper())
    reqs_query = reqs_query.filter(jurisdiction__in=list(jurisdictions))

    candidate_req_ids = set(reqs_query.values_list("requirement_id", flat=True))
    candidate_rules = RuleVersion.objects.filter(
        requirement__requirement_id__in=candidate_req_ids,
        status=KnowledgeStatus.PUBLISHED,
    )

    var_frequency: Counter[str] = Counter()
    for rule in candidate_rules:
        for rv in _extract_ast_variables(rule.condition_ast):
            var_frequency[rv] += 1

    # 1. Missing variables referenced in candidate published rules
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

    # Combine candidate variables in strict precedence order
    candidate_keys = list(dict.fromkeys(missing_rule_vars + unanswered_branching + unanswered_core_vars))

    # Stopping condition: No missing variables or max rounds exhausted
    if not candidate_keys or round_number > MAX_ROUNDS:
        reason = "ROUNDS_EXHAUSTED" if round_number > MAX_ROUNDS else "ALL_CRITICAL_VARIABLES_SATISFIED"
        plan, _ = SmartQuestionPlan.objects.get_or_create(
            business=business,
            round_number=round_number,
            defaults={"status": "COMPLETED", "stopping_reason": reason, "assessment": assessment},
        )
        if assessment and not assessment.question_plan:
            assessment.question_plan = plan
            assessment.save(update_fields=["question_plan"])

        return {
            "business_id": str(business.id),
            "business_name": business.name,
            "assessment_id": str(assessment.id) if assessment else None,
            "round": round_number,
            "status": "COMPLETED",
            "stopping_reason": reason,
            "personalization_header": f"Assessment complete for {business.name}",
            "personalization_subtitle": "All necessary profile details have been collected.",
            "questions": [],
            "total_questions": 0,
            "total_missing": len(context.missing_variable_keys),
            "known_variables_count": len(context.known_variable_keys),
            "context_summary": context.as_dict(),
        }

    # Prepare structured candidate variable specifications for LLM input
    var_specs = []
    for k in candidate_keys:
        var_def = get_variable(k)
        if var_def:
            var_specs.append({
                "variable_id": var_def.key,
                "label": var_def.label,
                "data_type": str(var_def.data_type),
                "why_it_matters": var_def.why_it_matters,
                "options": [opt.value for opt in var_def.options] if var_def.options else [],
                "rule_dependency_count": var_frequency.get(k, 0),
            })

    known_vars_summary = {
        k: context.raw_variables.get(k)
        for k in context.known_variable_keys
    }

    planned_items: list[dict[str, Any]] = []
    personalization_summary = f"Questions tailored to: {business.name}"

    provider = get_llm_provider()
    if provider.is_configured:
        prompt = f"""BUSINESS PROFILE CONTEXT:
Business Name: {business.name}
Legal Constitution: {context.legal_constitution or 'Not specified'}
State / Jurisdiction: {context.state_name} ({context.state})
District: {context.district or 'Not specified'}
Primary Activity: {context.primary_activity or 'Manufacturing / Processing'}
Products / Activity Description:
{context.product_description}

Enterprise Scale (MSMED Act): {context.msme_scale}
Industry Sector / Tags: {context.industry_hint or 'Industrial operations'}

KNOWN VARIABLES (DO NOT ASK FOR THESE):
{json.dumps(known_vars_summary, indent=2)}

CANDIDATE MISSING VARIABLES TO CHOOSE FROM:
{json.dumps(var_specs, indent=2)}

Formulate approximately 7 to 10 high-value questions (minimum 6, maximum {MAX_QUESTIONS_PER_ROUND}) tailored specifically to this business's operational reality."""

        try:
            res = provider.complete(
                [
                    ChatMessage(role="system", content=QUESTION_PLANNER_SYSTEM_PROMPT),
                    ChatMessage(role="user", content=prompt),
                ],
                temperature=0.1,
                max_output_tokens=2000,
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
            personalization_summary = parsed.get("personalization_summary") or personalization_summary
            raw_qs = parsed.get("questions", [])

            valid_keys_set = set(candidate_keys)
            seen_vars: set[str] = set()

            for item in raw_qs:
                var_key = item.get("variable_id") or item.get("variable_key")
                if not var_key or var_key not in valid_keys_set or var_key in seen_vars:
                    continue
                seen_vars.add(var_key)

                # Validate domains
                domains = item.get("domains")
                if not isinstance(domains, list) or not domains:
                    domains = ["COMPLIANCE"]
                domains = [d for d in domains if d in {"COMPLIANCE", "SCHEMES", "STANDARDS"}] or ["COMPLIANCE"]

                planned_items.append({
                    "question_id": item.get("question_id") or f"Q_{var_key}",
                    "variable_key": var_key,
                    "question_text": str(item.get("question_text", "")).strip(),
                    "why_it_matters": str(item.get("reason", "")).strip() or str(item.get("why_it_matters", "")).strip(),
                    "reason": str(item.get("reason", "")).strip(),
                    "domains": domains,
                    "priority": item.get("priority", 1),
                    "information_gain": float(item.get("information_gain", 0.90)),
                })
        except Exception as e:
            logger.warning("LLM question planning failed, using dynamic context fallback: %s", e)

    # Fallback to dynamic context-driven question generation if LLM was unavailable or returned insufficient items
    if len(planned_items) < MIN_QUESTIONS_PER_ROUND:
        logger.info("Using context-driven dynamic question fallback for %s", business.name)
        fallback_items = _build_context_driven_fallback_questions(context, candidate_keys, var_frequency)

        existing_keys = {item["variable_key"] for item in planned_items}
        for fb in fallback_items:
            vk = fb["variable_id"]
            if vk not in existing_keys:
                planned_items.append({
                    "question_id": fb["question_id"],
                    "variable_key": vk,
                    "question_text": fb["question_text"],
                    "why_it_matters": fb["reason"],
                    "reason": fb["reason"],
                    "domains": fb["domains"],
                    "priority": fb["priority"],
                    "information_gain": fb["information_gain"],
                })
                existing_keys.add(vk)
            if len(planned_items) >= MAX_QUESTIONS_PER_ROUND:
                break

    # Guarantee that candidate rule-dependent variables are included in planned items
    existing_keys = {item["variable_key"] for item in planned_items}
    for mk in missing_rule_vars:
        if mk not in existing_keys:
            fb = next((f for f in _build_context_driven_fallback_questions(context, [mk], var_frequency) if f["variable_id"] == mk), None)
            if fb:
                planned_items.insert(0, {
                    "question_id": fb["question_id"],
                    "variable_key": mk,
                    "question_text": fb["question_text"],
                    "why_it_matters": fb["reason"],
                    "reason": fb["reason"],
                    "domains": fb["domains"],
                    "priority": fb["priority"],
                    "information_gain": fb["information_gain"],
                })
                existing_keys.add(mk)

    # Cap at MAX_QUESTIONS_PER_ROUND
    planned_items = planned_items[:MAX_QUESTIONS_PER_ROUND]

    # Create SmartQuestionPlan and SmartQuestionInstances in DB
    plan = SmartQuestionPlan.objects.create(
        business=business,
        assessment=assessment,
        round_number=round_number,
        status="ACTIVE",
    )

    if assessment:
        assessment.question_plan = plan
        assessment.save(update_fields=["question_plan"])

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
            question_id=item.get("question_id", f"Q_{k}"),
            variable_key=k,
            question_text=item.get("question_text", var_def.label),
            why_it_matters=item.get("why_it_matters", var_def.why_it_matters),
            reason=item.get("reason", item.get("why_it_matters", "")),
            domains=item.get("domains", ["COMPLIANCE"]),
            data_type=str(var_def.data_type),
            options=resolve_variable_options(var_def),
            unit=var_def.unit or "",
            priority=str(item.get("priority", "1")),
            information_gain=float(item.get("information_gain", 1.0)),
            rule_dependency_count=var_frequency.get(k, 0),
        )
        instances.append(q_inst)

        output_questions.append({
            "id": str(q_inst.id),
            "question_id": q_inst.question_id,
            "code": var_def.code,
            "key": k,
            "variable_key": k,
            "variable_id": k,
            "label": var_def.label,
            "question": q_inst.question_text,
            "question_text": q_inst.question_text,
            "data_type": q_inst.data_type,
            "answer_type": q_inst.data_type,
            "why_it_matters": q_inst.why_it_matters,
            "reason": q_inst.reason,
            "domains": q_inst.domains,
            "unit": q_inst.unit,
            "options": q_inst.options,
            "allowed_values": [opt["value"] if isinstance(opt, dict) else opt for opt in q_inst.options],
            "current_value": context.raw_variables.get(k),
            "priority": q_inst.priority,
            "information_gain": q_inst.information_gain,
            "required": var_def.default_relevance == Relevance.CORE,
            "rule_dependency_count": q_inst.rule_dependency_count,
        })

    sector_name = context.industry_hint or "manufacturing and commercial"
    return {
        "business_id": str(business.id),
        "business_name": business.name,
        "assessment_id": str(assessment.id) if assessment else None,
        "plan_id": str(plan.id),
        "round": round_number,
        "status": "ACTIVE",
        "personalization_header": f"Questions tailored to: {business.name}",
        "personalization_subtitle": f"Based on your {sector_name} activity, we need a few more details to build your comprehensive compliance, schemes, and standards plan.",
        "personalization_summary": personalization_summary,
        "questions": output_questions,
        "total_questions": len(output_questions),
        "total_missing": len(context.missing_variable_keys),
        "known_variables_count": len(context.known_variable_keys),
        "context_summary": context.as_dict(),
    }
