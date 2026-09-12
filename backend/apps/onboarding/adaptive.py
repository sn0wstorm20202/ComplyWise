"""AST-aware Adaptive Dependency & Unresolved Condition Analyzer.

Authority: ComplyWise Architectural Directive:
"MINIMUM USER INPUT -> MAXIMUM REGULATORY INTELLIGENCE"
DETERMINISTIC RULE ENGINE = AUTHORITY.
LLM = ASSISTANT FOR QUESTION WORDING / CLASSIFICATION.

This module provides AST-level dynamic dependency analysis over RuleVersion conditions.
It evaluates rule ASTs against the current business context using three-valued logic
(TRUE / FALSE / UNKNOWN) and determines:
1. Whether a rule is already decisively resolved (TRUE or FALSE).
2. Whether a rule remains UNKNOWN.
3. Which missing variables are *decision-relevant* (i.e. can actually change the outcome).
4. Which variables are *irrelevant* because another branch already determines the outcome
   (e.g., AND with a FALSE child, or OR with a TRUE child).
5. Deterministic relevance ranking across all unresolved rules based on actual regulatory impact.

Zero hardcoding of industry sectors: purely driven by RuleVersion.condition_ast.
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any, Iterable

from common.enums import KnowledgeStatus
from domain.evaluation.evaluator import evaluate_ast
from domain.evaluation.truth import FALSE, TRUE, UNKNOWN, TruthValue
from domain.jurisdictions.resolver import normalize_jurisdiction
from domain.rules.ast import validate_ast


@dataclass(frozen=True)
class AdaptiveTrace:
    """Trace node capturing AST evaluation and variable relevance at each subtree."""

    op: str
    result: TruthValue
    unresolved_variables: frozenset[str]
    relevant_variables: frozenset[str]
    notes: tuple[str, ...] = ()
    children: tuple[AdaptiveTrace, ...] = ()

    def to_dict(self) -> dict[str, Any]:
        data: dict[str, Any] = {
            "op": self.op,
            "result": str(self.result),
            "unresolved_variables": sorted(self.unresolved_variables),
            "relevant_variables": sorted(self.relevant_variables),
        }
        if self.notes:
            data["notes"] = list(self.notes)
        if self.children:
            data["children"] = [c.to_dict() for c in self.children]
        return data


@dataclass(frozen=True)
class NodeAnalysis:
    """Analysis result for a single AST node."""

    result: TruthValue
    is_decisive: bool
    unresolved_variables: frozenset[str]
    relevant_variables: frozenset[str]
    trace: AdaptiveTrace


@dataclass(frozen=True)
class RuleAnalysis:
    """Analysis result for a single RuleVersion condition."""

    rule_id: str
    requirement_id: str
    domain: str
    jurisdiction: str
    result: TruthValue
    is_decisive: bool
    unresolved_variables: frozenset[str]
    relevant_variables: frozenset[str]
    trace: AdaptiveTrace


@dataclass(frozen=True)
class KnowledgeBaseAnalysis:
    """Aggregated analysis across all candidate published rules for a business context."""

    total_rules_inspected: int
    resolved_true_count: int
    resolved_false_count: int
    unresolved_count: int
    rule_analyses: tuple[RuleAnalysis, ...]
    unresolved_rules: tuple[RuleAnalysis, ...]
    variable_impact: dict[str, int]
    ranked_variables: tuple[str, ...]
    variable_rules_map: dict[str, list[str]]


def is_variable_missing(key: str, context: dict[str, Any]) -> bool:
    """Check if variable `key` is missing or unprovided in context."""
    if key not in context:
        return True
    val = context[key]
    if val is None:
        return True
    if isinstance(val, str) and not val.strip():
        return True
    return False


def normalize_context(context: Any) -> dict[str, Any]:
    """Normalize various context representations into a canonical key -> value dictionary.

    Supports:
    - DerivedBusinessContext
    - Dict with direct values {"state": "GUJARAT"}
    - Dict with profile entry wrappers {"state": {"value": "GUJARAT"}}
    - Business model instance (builds DerivedBusinessContext)
    """
    if context is None:
        return {}

    # DerivedBusinessContext instance
    if hasattr(context, "raw_variables") and isinstance(context.raw_variables, dict):
        d: dict[str, Any] = dict(context.raw_variables)
        if hasattr(context, "state") and context.state:
            d["state"] = context.state
        if hasattr(context, "product_description") and context.product_description:
            d["product_description"] = context.product_description
        if hasattr(context, "annual_turnover") and context.annual_turnover is not None:
            d["annual_turnover"] = context.annual_turnover
        if hasattr(context, "plant_machinery_investment") and context.plant_machinery_investment is not None:
            d["plant_machinery_investment"] = context.plant_machinery_investment
        if hasattr(context, "total_worker_count") and context.total_worker_count is not None:
            d["total_worker_count"] = context.total_worker_count
        if hasattr(context, "contract_worker_count") and context.contract_worker_count is not None:
            d["contract_worker_count"] = context.contract_worker_count
        if hasattr(context, "connected_power_load") and context.connected_power_load is not None:
            d["connected_power_load"] = context.connected_power_load
        if hasattr(context, "effluent_emission_generation") and context.effluent_emission_generation is not None:
            d["effluent_emission_generation"] = context.effluent_emission_generation
        if hasattr(context, "hazardous_waste_generation") and context.hazardous_waste_generation is not None:
            d["hazardous_waste_generation"] = context.hazardous_waste_generation
        if hasattr(context, "ecommerce_operations") and context.ecommerce_operations is not None:
            d["ecommerce_operations"] = context.ecommerce_operations
        if hasattr(context, "multi_state_operations") and context.multi_state_operations is not None:
            d["multi_state_operations"] = context.multi_state_operations
        if hasattr(context, "trade_intent") and context.trade_intent:
            d["import_export_intent"] = context.trade_intent
        return d

    # Business model instance
    if hasattr(context, "current_profile") and hasattr(context, "assessments"):
        from domain.context.business_context import build_business_context
        ctx = build_business_context(context)
        return normalize_context(ctx)

    if isinstance(context, dict):
        d = {}
        for k, v in context.items():
            if isinstance(v, dict) and "value" in v:
                d[k] = v["value"]
            else:
                d[k] = v
        # Normalize state if present
        if "state" in d and d["state"] and isinstance(d["state"], str):
            norm_st = normalize_jurisdiction(d["state"])
            if norm_st:
                d["state"] = norm_st
        return d

    return {}


def extract_ast_variables(node: Any) -> set[str]:
    """Recursively collect all variable keys referenced in an AST subtree."""
    found: set[str] = set()
    if isinstance(node, dict):
        if "var" in node and isinstance(node["var"], str) and node["var"].strip():
            found.add(node["var"].strip())
        for v in node.values():
            found.update(extract_ast_variables(v))
    elif isinstance(node, list):
        for item in node:
            found.update(extract_ast_variables(item))
    return found


def _extract_leaf_variables(node: dict[str, Any]) -> set[str]:
    """Extract variable keys referenced directly by a leaf node."""
    vars_found: set[str] = set()
    if "var" in node and isinstance(node["var"], str) and node["var"].strip():
        vars_found.add(node["var"].strip())
    if "left" in node and isinstance(node["left"], dict) and "var" in node["left"]:
        v = node["left"]["var"]
        if isinstance(v, str) and v.strip():
            vars_found.add(v.strip())
    if "right" in node and isinstance(node["right"], dict) and "var" in node["right"]:
        v = node["right"]["var"]
        if isinstance(v, str) and v.strip():
            vars_found.add(v.strip())
    return vars_found


def analyze_ast_node(node: dict[str, Any], context: Any) -> NodeAnalysis:
    """Recursively analyze an AST node against context.

    Evaluates the node's three-valued truth value (using domain.evaluation.evaluator)
    and dynamically derives decision-relevant missing variables based on Kleene logic.
    """
    validate_ast(node)
    ctx_dict = normalize_context(context)
    op = node["op"].upper()

    # --------------------------------------------------------------------------
    # Compound Boolean: NOT
    # --------------------------------------------------------------------------
    if op == "NOT":
        child_node = node.get("arg") if "arg" in node else node["args"][0]
        child_analysis = analyze_ast_node(child_node, ctx_dict)
        unresolved = child_analysis.unresolved_variables

        if child_analysis.result == TRUE:
            result = FALSE
            relevant: frozenset[str] = frozenset()
            notes = ("NOT TRUE -> FALSE. Branch resolved.",)
        elif child_analysis.result == FALSE:
            result = TRUE
            relevant = frozenset()
            notes = ("NOT FALSE -> TRUE. Branch resolved.",)
        else:
            result = UNKNOWN
            relevant = child_analysis.relevant_variables
            notes = ("NOT UNKNOWN -> UNKNOWN. Child variables remain decision-relevant.",)

        trace = AdaptiveTrace(
            op=op,
            result=result,
            unresolved_variables=unresolved,
            relevant_variables=relevant,
            notes=notes,
            children=(child_analysis.trace,),
        )
        return NodeAnalysis(
            result=result,
            is_decisive=(result != UNKNOWN),
            unresolved_variables=unresolved,
            relevant_variables=relevant,
            trace=trace,
        )

    # --------------------------------------------------------------------------
    # Compound Boolean: AND
    # --------------------------------------------------------------------------
    if op == "AND":
        args = node.get("args", [])
        child_analyses = [analyze_ast_node(child, ctx_dict) for child in args]

        all_unresolved: set[str] = set()
        for ca in child_analyses:
            all_unresolved.update(ca.unresolved_variables)

        # Kleene Conjunction:
        # If ANY child is FALSE -> AND is FALSE.
        # Downstream/other sibling branches cannot change this; their missing variables are irrelevant.
        has_false = any(ca.result == FALSE for ca in child_analyses)
        all_true = all(ca.result == TRUE for ca in child_analyses)

        notes_list: list[str] = []
        if has_false:
            result = FALSE
            relevant = frozenset()
            notes_list.append("At least one child evaluated to FALSE -> AND resolved to FALSE. Sibling variables pruned.")
        elif all_true:
            result = TRUE
            relevant = frozenset()
            notes_list.append("All children evaluated to TRUE -> AND resolved to TRUE.")
        else:
            result = UNKNOWN
            # Only children that are currently UNKNOWN have decision-relevant variables
            rel_set: set[str] = set()
            for ca in child_analyses:
                if ca.result == UNKNOWN:
                    rel_set.update(ca.relevant_variables)
            relevant = frozenset(rel_set)
            notes_list.append("No child is FALSE and at least one is UNKNOWN -> AND is UNKNOWN. Unresolved children are relevant.")

        trace = AdaptiveTrace(
            op=op,
            result=result,
            unresolved_variables=frozenset(all_unresolved),
            relevant_variables=relevant,
            notes=tuple(notes_list),
            children=tuple(ca.trace for ca in child_analyses),
        )
        return NodeAnalysis(
            result=result,
            is_decisive=(result != UNKNOWN),
            unresolved_variables=frozenset(all_unresolved),
            relevant_variables=relevant,
            trace=trace,
        )

    # --------------------------------------------------------------------------
    # Compound Boolean: OR
    # --------------------------------------------------------------------------
    if op == "OR":
        args = node.get("args", [])
        child_analyses = [analyze_ast_node(child, ctx_dict) for child in args]

        all_unresolved = set()
        for ca in child_analyses:
            all_unresolved.update(ca.unresolved_variables)

        # Kleene Disjunction:
        # If ANY child is TRUE -> OR is TRUE.
        # Other sibling branches cannot change this; their missing variables are irrelevant.
        has_true = any(ca.result == TRUE for ca in child_analyses)
        all_false = all(ca.result == FALSE for ca in child_analyses)

        notes_list = []
        if has_true:
            result = TRUE
            relevant = frozenset()
            notes_list.append("At least one child evaluated to TRUE -> OR resolved to TRUE. Other branches pruned.")
        elif all_false:
            result = FALSE
            relevant = frozenset()
            notes_list.append("All children evaluated to FALSE -> OR resolved to FALSE.")
        else:
            result = UNKNOWN
            # Only children that are currently UNKNOWN have decision-relevant variables
            # (Children that already evaluated to FALSE cannot save the OR, only UNKNOWN ones can)
            rel_set = set()
            for ca in child_analyses:
                if ca.result == UNKNOWN:
                    rel_set.update(ca.relevant_variables)
            relevant = frozenset(rel_set)
            notes_list.append("No child is TRUE and at least one is UNKNOWN -> OR is UNKNOWN. Unresolved children are relevant.")

        trace = AdaptiveTrace(
            op=op,
            result=result,
            unresolved_variables=frozenset(all_unresolved),
            relevant_variables=relevant,
            notes=tuple(notes_list),
            children=tuple(ca.trace for ca in child_analyses),
        )
        return NodeAnalysis(
            result=result,
            is_decisive=(result != UNKNOWN),
            unresolved_variables=frozenset(all_unresolved),
            relevant_variables=relevant,
            trace=trace,
        )

    # --------------------------------------------------------------------------
    # Leaf Primitive: Comparison, Classification, Existence
    # --------------------------------------------------------------------------
    node_vars = _extract_leaf_variables(node)
    unresolved_leaf_vars = {v for v in node_vars if is_variable_missing(v, ctx_dict)}

    # Authoritative evaluation via deterministic evaluator
    eval_result, eval_trace = evaluate_ast(node, ctx_dict)
    notes_list = list(eval_trace.notes)

    if eval_result == UNKNOWN:
        # Leaf condition is unresolved because one or more variable operands are missing
        # (If missing vars exist, they are decision-relevant)
        relevant = frozenset(unresolved_leaf_vars)
        if unresolved_leaf_vars:
            notes_list.append(f"Leaf operator {op} unresolved due to missing variables: {sorted(unresolved_leaf_vars)}")
        else:
            notes_list.append(f"Leaf operator {op} returned UNKNOWN due to type or domain mismatch.")
    else:
        # Leaf condition is decisively TRUE or FALSE
        relevant = frozenset()
        notes_list.append(f"Leaf operator {op} decisively resolved to {eval_result}.")

    trace = AdaptiveTrace(
        op=op,
        result=eval_result,
        unresolved_variables=frozenset(unresolved_leaf_vars),
        relevant_variables=relevant,
        notes=tuple(notes_list),
        children=(),
    )
    return NodeAnalysis(
        result=eval_result,
        is_decisive=(eval_result != UNKNOWN),
        unresolved_variables=frozenset(unresolved_leaf_vars),
        relevant_variables=relevant,
        trace=trace,
    )


def analyze_rule(rule: Any, context: Any) -> RuleAnalysis:
    """Analyze a single RuleVersion or rule dictionary condition against context."""
    ast = rule.condition_ast if hasattr(rule, "condition_ast") else rule.get("condition_ast", rule)
    rule_id = getattr(rule, "rule_id", "") or (rule.get("rule_id", "") if isinstance(rule, dict) else "")
    domain = getattr(rule, "domain", "") or (rule.get("domain", "") if isinstance(rule, dict) else "")
    jurisdiction = getattr(rule, "jurisdiction", "") or (rule.get("jurisdiction", "") if isinstance(rule, dict) else "")

    req_id = ""
    if hasattr(rule, "requirement") and rule.requirement:
        req_id = getattr(rule.requirement, "requirement_id", "")
    elif isinstance(rule, dict) and "requirement_id" in rule:
        req_id = rule["requirement_id"]

    node_res = analyze_ast_node(ast, context)

    return RuleAnalysis(
        rule_id=rule_id,
        requirement_id=req_id,
        domain=domain,
        jurisdiction=jurisdiction,
        result=node_res.result,
        is_decisive=node_res.is_decisive,
        unresolved_variables=node_res.unresolved_variables,
        relevant_variables=node_res.relevant_variables,
        trace=node_res.trace,
    )


def analyze_candidate_rules(
    rules: Iterable[Any],
    context: Any,
) -> KnowledgeBaseAnalysis:
    """Analyze all candidate rules against context.

    Computes deterministic variable relevance ranking based on how many
    unresolved rules each missing variable can potentially resolve.
    """
    rule_analyses: list[RuleAnalysis] = []
    unresolved_rules: list[RuleAnalysis] = []
    resolved_true = 0
    resolved_false = 0

    var_impact_counter: Counter[str] = Counter()
    var_rules_map: dict[str, list[str]] = {}

    for r in rules:
        analysis = analyze_rule(r, context)
        rule_analyses.append(analysis)

        if analysis.result == TRUE:
            resolved_true += 1
        elif analysis.result == FALSE:
            resolved_false += 1
        else:
            unresolved_rules.append(analysis)
            # Aggregate decision-relevant variables across unresolved rules
            for var_key in analysis.relevant_variables:
                var_impact_counter[var_key] += 1
                var_rules_map.setdefault(var_key, []).append(analysis.rule_id)

    # Canonical variable ordering preference for deterministic tie-breaking
    from domain.profile.variables import PROFILE_VARIABLES
    canon_order = {pv.key: idx for idx, pv in enumerate(PROFILE_VARIABLES)}

    # Rank variables by number of unresolved rules impacted (descending), then canonical order, then alphabetically
    ranked = tuple(
        var
        for var, _ in sorted(
            var_impact_counter.items(),
            key=lambda item: (-item[1], canon_order.get(item[0], 999), item[0]),
        )
    )

    return KnowledgeBaseAnalysis(
        total_rules_inspected=len(rule_analyses),
        resolved_true_count=resolved_true,
        resolved_false_count=resolved_false,
        unresolved_count=len(unresolved_rules),
        rule_analyses=tuple(rule_analyses),
        unresolved_rules=tuple(unresolved_rules),
        variable_impact=dict(var_impact_counter),
        ranked_variables=ranked,
        variable_rules_map=var_rules_map,
    )
