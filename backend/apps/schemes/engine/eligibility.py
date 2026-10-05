"""Evaluate declared scheme predicates; relevance alone never proves eligibility."""
import re
from datetime import date

from domain.evaluation.evaluator import evaluate_ast
from domain.evaluation.truth import FALSE, TRUE, UNKNOWN
from domain.rules.ast import AstValidationError


def assessment_facts(context):
    facts = dict(context.raw_variables or {})
    facts.update({"state": context.state, "jurisdiction": context.state,
                  "msme_scale": context.msme_scale, "lifecycle_stage": context.lifecycle_stage})
    for name in ("annual_turnover", "plant_machinery_investment", "total_worker_count"):
        value = getattr(context, name)
        if value is not None:
            facts[name] = value
    trade = context.trade_intent
    if "exports" not in facts and trade in {"NONE", "IMPORT_ONLY", "EXPORT_ONLY", "IMPORT_AND_EXPORT"}:
        facts["exports"] = trade in {"EXPORT_ONLY", "IMPORT_AND_EXPORT"}
    if "imports" not in facts and trade in {"NONE", "IMPORT_ONLY", "EXPORT_ONLY", "IMPORT_AND_EXPORT"}:
        facts["imports"] = trade in {"IMPORT_ONLY", "IMPORT_AND_EXPORT"}
    # These records describe enterprises, never residential households.
    facts.setdefault("applicant_type", "BUSINESS")
    return facts


def evaluate_declared_eligibility(version, facts, *, today=None):
    """Return state, matched facts and gaps from stored machine predicates.

    Textual restrictions are used only to veto/downgrade, never to claim that all
    eligibility conditions were met. Only a declared AST can establish that.
    """
    today = today or date.today()
    if (version.effective_from and today < version.effective_from) or (version.effective_to and today > version.effective_to):
        return "EXPIRED_OR_NOT_CURRENT", {}, ["application_window"]
    criteria = version.eligibility_criteria or {}
    if not isinstance(criteria, dict):
        return "NEEDS_REVIEW", {}, ["invalid_eligibility_predicate"]
    ast = criteria.get("eligibility_ast") or criteria.get("condition_ast") or criteria.get("ast")
    ast_truth, used, unresolved = None, {}, []
    if ast:
        try:
            truth, trace = evaluate_ast(ast, facts)
        except (AstValidationError, TypeError, ValueError):
            return "NEEDS_REVIEW", {}, ["invalid_eligibility_predicate"]
        def visit(node):
            used.update(node.variables_used)
            for child in node.children:
                visit(child)
        visit(trace)
        if truth == FALSE:
            return "NOT_ELIGIBLE", used, []
        if truth == UNKNOWN:
            unresolved.extend(key for key, value in used.items() if value is None)
        ast_truth = truth

    restrictions = {
        "exports": "exports", "requires_exports": "exports", "requires_udyam": "udyam_registered",
        "is_manufacturing": "is_manufacturing", "new_unit": "is_new_unit",
        "applicant_type": "applicant_type", "product_type": "product_type",
        "unit_stage": "lifecycle_stage", "lifecycle_stage": "lifecycle_stage",
    }
    for criterion, fact_key in restrictions.items():
        if criterion not in criteria:
            continue
        expected = criteria[criterion]
        actual = facts.get(fact_key)
        used[fact_key] = actual
        truth, _ = evaluate_ast({"op": "IN" if isinstance(expected, list) else "EQ",
                                  "left": {"var": fact_key}, "right": expected}, facts)
        if truth == FALSE:
            return "NOT_ELIGIBLE", used, []
        if truth == UNKNOWN:
            unresolved.append(fact_key)
    for criterion, fact_key, op in (
        ("min_investment", "plant_machinery_investment", "GTE"),
        ("max_investment", "plant_machinery_investment", "LTE"),
        ("turnover_cap", "annual_turnover", "LTE"),
        ("min_turnover", "annual_turnover", "GTE"),
        ("min_employees", "total_worker_count", "GTE"),
        ("max_employees", "total_worker_count", "LTE"),
    ):
        if criterion not in criteria:
            continue
        used[fact_key] = facts.get(fact_key)
        try:
            truth, _ = evaluate_ast({"op": op, "left": {"var": fact_key}, "right": criteria[criterion]}, facts)
        except (AstValidationError, TypeError, ValueError):
            unresolved.append(fact_key)
            continue
        if truth == FALSE:
            return "NOT_ELIGIBLE", used, []
        if truth == UNKNOWN:
            unresolved.append(fact_key)
    for criterion, fact_key in (("activities", "primary_activity"), ("required_certifications", "certifications"), ("eligible_states", "state")):
        expected = criteria.get(criterion)
        if not expected:
            continue
        if not isinstance(expected, list) or not all(isinstance(value, str) for value in expected):
            unresolved.append(fact_key)
            continue
        actual = facts.get(fact_key)
        used[fact_key] = actual
        if actual is None:
            unresolved.append(fact_key)
        elif criterion == "required_certifications":
            values = actual if isinstance(actual, list) else [actual]
            if not {str(value).casefold() for value in expected}.issubset({str(value).casefold() for value in values}):
                return "NOT_ELIGIBLE", used, []
        else:
            if criterion == "eligible_states":
                from domain.jurisdictions.resolver import normalize_jurisdiction
                expected = [normalize_jurisdiction(value) or value for value in expected]
            if str(actual).casefold() not in {str(value).casefold() for value in expected}:
                return "NOT_ELIGIBLE", used, []

    text = (version.eligibility_statement or "").casefold()
    # Preserve explicit restrictions in older records without inventing a
    # positive AST from prose. Human review must encode remaining conditions.
    if re.search(r"\b(?:households?|residential premises|residential consumers)\b", text) and not re.search(r"\b(?:businesses|enterprises|commercial|industrial)\b", text):
        return "NOT_ELIGIBLE", {**used, "applicant_type": "BUSINESS"}, []
    exporter_only = (re.search(r"\b(?:only|exclusively)\s+(?:for\s+)?(?:\w+\s+){0,3}exporters?\b", text)
        or re.search(r"\b(?:manufacturer|merchant|registered|direct|eligible)\s+exporters?\b", text)
        or re.search(r"\b(?:enterprises?|businesses?|units?|msmes?)\b.*\b(?:positive export turnover|exporting goods|shipping goods.*\bindia\b)", text))
    if exporter_only and facts.get("exports") is False and not re.search(r"\b(?:domestic|non.exporters?)\b", text):
        return "NOT_ELIGIBLE", {**used, "exports": False}, []
    if re.search(r"(?:setting up\s+(?:a\s+)?new|new\s+(?:micro[ -]|manufacturing\s+|industrial\s+|service\s+)*(?:units?|enterprises?|projects?))", text) and not re.search(r"\b(?:existing|expan\w+)\b", text):
        if str(facts.get("lifecycle_stage", "")).upper() in {"OPERATING", "OPERATIONAL", "EXISTING"}:
            return "NOT_ELIGIBLE", {**used, "lifecycle_stage": facts["lifecycle_stage"]}, []
        if not facts.get("lifecycle_stage"):
            unresolved.append("lifecycle_stage")
    if unresolved or ast_truth == UNKNOWN:
        return "NEEDS_REVIEW", used, list(dict.fromkeys(unresolved))
    # Merely restating sector/state/MSME similarity in an AST is still broad
    # candidate filtering, not a complete eligibility determination.
    specific = set(used) - {"state", "jurisdiction", "msme_scale", "is_manufacturing", "primary_activity", "product_description"}
    return "EVIDENCE_SUPPORTED" if ast_truth == TRUE and specific else "CANDIDATE", used, []
