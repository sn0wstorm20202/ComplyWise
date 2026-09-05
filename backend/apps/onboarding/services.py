"""Dynamic Onboarding & Smart Questions Service.

Authority: PRD_v2.0 §10.3, §10.4, §11; TRD_v2.0 §8, §12.

100% DATA-DRIVEN:
- Identifies missing decision-critical variables directly from published rules in the knowledge base.
- Zero hardcoded scenario branches (no `if state == 'Gujarat'`, no `if scenario == ...`).
- Questions ask only what can materially alter the compliance outcome.
- Answers create immutable BusinessProfileVersion records preserving provenance.
"""

from __future__ import annotations

from collections import Counter
from typing import Any

from common.enums import KnowledgeStatus, VariableOrigin
from domain.jurisdictions.resolver import normalize_jurisdiction
from domain.profile.variables import (
    PROFILE_VARIABLES,
    Relevance,
    coerce_value,
    get_variable,
)
from apps.accounts.models import User
from apps.businesses.models import Business, BusinessProfileVersion
from apps.knowledge.models import RequirementDefinition, RuleVersion


def extract_ast_variables(node: Any) -> set[str]:
    """Recursively extract all variable keys referenced in an AST node."""
    found: set[str] = set()
    if isinstance(node, dict):
        if "var" in node and isinstance(node["var"], str):
            found.add(node["var"].strip())
        for v in node.values():
            found.update(extract_ast_variables(v))
    elif isinstance(node, list):
        for item in node:
            found.update(extract_ast_variables(item))
    return found


def get_dynamic_smart_questions(business: Business) -> dict[str, Any]:
    """Generate dynamic smart questions for decision-critical missing variables.

    Inspects all candidate published requirements and rules matching the business's
    jurisdiction and identifies which variables are referenced in AST conditions
    but not yet answered in the business profile.
    """
    profile = business.current_profile
    answered_vars: dict[str, Any] = {}
    if profile and profile.variables:
        for k, v in profile.variables.items():
            if isinstance(v, dict) and v.get("value") is not None and str(v.get("value")).strip() != "":
                answered_vars[k] = v.get("value")

    # Determine business jurisdiction
    raw_state = answered_vars.get("state")
    canonical_state = normalize_jurisdiction(raw_state) if raw_state else None

    # Determine candidate published requirements
    reqs_query = RequirementDefinition.objects.filter(status=KnowledgeStatus.PUBLISHED)
    if canonical_state:
        reqs_query = reqs_query.filter(jurisdiction__in=["CENTRAL", canonical_state])
    else:
        reqs_query = reqs_query.filter(jurisdiction="CENTRAL")

    candidate_req_ids = set(reqs_query.values_list("requirement_id", flat=True))

    # Find all published rules for candidate requirements
    candidate_rules = RuleVersion.objects.filter(
        requirement__requirement_id__in=candidate_req_ids,
        status=KnowledgeStatus.PUBLISHED,
    )

    # Count variable occurrences in candidate rule ASTs
    var_frequency: Counter[str] = Counter()
    for rule in candidate_rules:
        rule_vars = extract_ast_variables(rule.condition_ast)
        for rv in rule_vars:
            var_frequency[rv] += 1

    # Missing decision-critical variables: referenced in rules but not answered
    missing_rule_vars = {var_key for var_key in var_frequency if var_key not in answered_vars}

    # Also include any un-answered CORE profile variables (e.g. legal_constitution, state)
    unanswered_core_vars = {
        pv.key
        for pv in PROFILE_VARIABLES
        if pv.default_relevance == Relevance.CORE and pv.key not in answered_vars
    }

    all_missing_keys = missing_rule_vars | unanswered_core_vars

    questions: list[dict[str, Any]] = []
    for key in all_missing_keys:
        var_def = get_variable(key)
        if var_def is None:
            continue

        # Format question prompt naturally if possible
        label = var_def.label
        if label.lower().startswith("generates ") or label.lower().startswith("sells ") or label.lower().startswith("operates "):
            prompt = f"Does your business {label.lower()}?"
        elif not label.endswith("?"):
            prompt = f"What is your {label.lower()}?"
        else:
            prompt = label

        questions.append(
            {
                "code": var_def.code,
                "key": var_def.key,
                "variable_key": var_def.key,
                "label": var_def.label,
                "question": prompt,
                "data_type": str(var_def.data_type),
                "why_it_matters": var_def.why_it_matters,
                "unit": var_def.unit,
                "options": [{"value": o.value, "label": o.label} for o in var_def.options],
                "required": var_def.default_relevance == Relevance.CORE,
                "rule_dependency_count": var_frequency.get(var_def.key, 0),
                "candidate_rules_count": var_frequency.get(var_def.key, 0),
            }
        )

    # Sort: required (core) first, then by rule dependency count descending, then code
    questions.sort(
        key=lambda q: (
            0 if q["required"] else 1,
            -q["rule_dependency_count"],
            q["code"],
        )
    )

    return {
        "business_id": str(business.id),
        "business_name": business.name,
        "questions": questions,
        "total_missing": len(questions),
        "known_variables_count": len(answered_vars),
    }


def save_smart_question_answers(
    *,
    business: Business,
    answers: dict[str, Any],
    user: User | None = None,
    change_note: str = "Smart questions answered during onboarding",
) -> BusinessProfileVersion:
    """Save answered variables into a new immutable BusinessProfileVersion."""
    cleaned_entries: dict[str, dict[str, Any]] = {}

    for key, raw_value in answers.items():
        if raw_value is None or (isinstance(raw_value, str) and not raw_value.strip()):
            continue
        var_def = get_variable(key)
        if var_def is None:
            continue

        coerced = coerce_value(var_def, raw_value)
        if coerced is None:
            continue
        if var_def.key == "state" and isinstance(coerced, str):
            canonical = normalize_jurisdiction(coerced)
            if canonical:
                coerced = canonical

        # Preserve exact string representation for decimals to avoid precision loss
        val_to_store = str(coerced) if var_def.data_type in {"DECIMAL", "CURRENCY_INR"} else coerced

        cleaned_entries[var_def.key] = BusinessProfileVersion.build_entry(
            value=val_to_store,
            origin=VariableOrigin.USER_PROVIDED,
        )

    if not cleaned_entries:
        current = business.current_profile
        if current:
            return current

    # Carry forward existing variables from the current version
    current_profile = business.current_profile
    next_version = (current_profile.version + 1) if current_profile else 1
    merged_variables: dict[str, dict[str, Any]] = dict(current_profile.variables) if current_profile else {}
    merged_variables.update(cleaned_entries)

    new_profile = BusinessProfileVersion.objects.create(
        business=business,
        version=next_version,
        variables=merged_variables,
        change_note=change_note,
        created_by=user,
    )
    return new_profile


def detect_activity_keywords(text: str) -> list[str]:
    """Extract presentational detected activity keywords from natural language description.
    
    These are purely UI/presentational hints and NEVER substitute for backend AST evaluation.
    """
    t = text.lower()
    detected = []
    if any(w in t for w in ["food", "spice", "snack", "bakery", "juice", "fruit", "sauce", "pickle", "beverage", "dairy", "grain"]):
        detected.append("Food Processing")
    if any(w in t for w in ["electronic", "circuit", "pcb", "chip", "semiconductor", "sensor", "meter", "hardware"]):
        detected.append("Electronics & Hardware")
    if any(w in t for w in ["manufactur", "fabricat", "machin", "assembl", "factory", "plant", "produ"]):
        detected.append("Manufacturing")
    if any(w in t for w in ["trade", "trad", "wholesale", "retail", "distribut", "export", "import", "seller", "dealer"]):
        detected.append("Trading & Distribution")
    if any(w in t for w in ["auto", "vehicle", "component", "motor", "engine"]):
        detected.append("Automotive Components")
    if any(w in t for w in ["chemical", "pharma", "drug", "solvent", "dye"]):
        detected.append("Chemicals & Pharmaceuticals")
    if any(w in t for w in ["software", "saas", "it services", "digital"]):
        detected.append("Software & Information Technology")
    return detected or ["General Industrial Operations"]


def save_products_and_activities(
    *,
    business: Business,
    product_description: str,
    import_export_intent: str | None = None,
    user: User | None = None,
) -> dict[str, Any]:
    """Persist user's natural-language product/activity input and return detected hints."""
    answers: dict[str, Any] = {
        "product_description": product_description.strip(),
    }
    if import_export_intent:
        answers["import_export_intent"] = import_export_intent.strip()

    new_profile = save_smart_question_answers(
        business=business,
        answers=answers,
        user=user,
        change_note="Products and activities updated",
    )
    detected_tags = detect_activity_keywords(product_description)

    return {
        "profile_version": new_profile.version,
        "product_description": product_description.strip(),
        "import_export_intent": import_export_intent,
        "detected_activities": detected_tags,
    }
