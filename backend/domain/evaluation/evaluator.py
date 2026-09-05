"""Deterministic AST condition evaluator with three-valued logic and trace capture.

Authority: TRD_v2.0 §12, §13, §14; PRD_v2.0 §P3, §P4, §P5; Task 2 C7 Audit Corrections.

Key Invariants:
1. Missing decision-relevant variable MUST resolve to UNKNOWN, never silently to FALSE.
2. Type mismatches produce UNKNOWN, never FALSE or unhandled exceptions.
3. Three-valued logic (TRUE, FALSE, UNKNOWN) strictly follows Kleene logic via domain.evaluation.truth.
4. Numeric comparisons use exact Decimal arithmetic for currency, power, and workers.
5. An explanation trace records every variable accessed, condition checked, and sub-result.
6. No dynamic code execution (eval, exec) is used.
"""

from __future__ import annotations

from decimal import Decimal, InvalidOperation
from typing import Any

from domain.evaluation.truth import (
    FALSE,
    TRUE,
    UNKNOWN,
    TruthValue,
    and_,
    not_,
    or_,
)
from domain.rules.ast import validate_ast


class EvaluationTrace:
    """Detailed audit trace of an evaluation run."""

    def __init__(self, node: dict[str, Any]) -> None:
        self.node = node
        self.op = node.get("op", "").upper()
        self.result: TruthValue = UNKNOWN
        self.variables_used: dict[str, Any] = {}
        self.children: list[EvaluationTrace] = []
        self.notes: list[str] = []

    def to_dict(self) -> dict[str, Any]:
        data: dict[str, Any] = {
            "op": self.op,
            "result": str(self.result),
            "variables_used": self.variables_used,
        }
        if self.notes:
            data["notes"] = self.notes
        if self.children:
            data["children"] = [c.to_dict() for c in self.children]
        return data


def evaluate_ast(
    node: dict[str, Any],
    context: dict[str, Any],
) -> tuple[TruthValue, EvaluationTrace]:
    """Evaluate condition AST `node` against `context` dictionary.

    Returns `(result, trace)`.
    `context` is a dict mapping variable keys (e.g. 'state', 'annual_turnover')
    to their values (or profile entry dicts with 'value' key).
    """
    validate_ast(node)
    trace = EvaluationTrace(node)
    result = _eval_node(node, context, trace)
    trace.result = result
    return result, trace


def _resolve_operand(operand: Any, context: dict[str, Any], trace: EvaluationTrace) -> tuple[Any, bool]:
    """Resolve an operand value.

    Returns (value, is_variable).
    If it's a variable reference {"var": "key"}, looks up in context.
    If the key is missing from context or its value is None, returns (None, True).
    """
    if isinstance(operand, dict) and "var" in operand:
        var_key = operand["var"]
        is_known = var_key in context
        raw_val = context.get(var_key)
        # Handle both raw value and profile entry dict {"value": ...}
        if isinstance(raw_val, dict) and "value" in raw_val:
            val = raw_val["value"]
        else:
            val = raw_val

        trace.variables_used[var_key] = val
        if not is_known or val is None:
            return None, True
        return val, True

    # Literal value
    return operand, False


def _to_decimal_if_numeric(value: Any) -> Decimal | None:
    if value is None or isinstance(value, (bool, dict, list, tuple, set)):
        return None
    if isinstance(value, (int, Decimal)):
        return Decimal(str(value))
    if isinstance(value, str):
        cleaned = value.strip()
        try:
            return Decimal(cleaned)
        except InvalidOperation:
            return None
    return None


def _to_normalized_set(val: Any) -> tuple[set[Any] | None, set[str], bool]:
    """Normalize operand into a set with case-insensitivity and type tracking.

    Returns (set_of_items, set_of_kinds, is_valid).
    If operand is a dict or contains unhashable/incompatible types, returns (None, set(), False).
    """
    if val is None or isinstance(val, dict):
        return None, set(), False

    items = val if isinstance(val, (list, tuple, set)) else [val]
    normalized: set[Any] = set()
    kinds: set[str] = set()
    for item in items:
        if isinstance(item, dict) or isinstance(item, (list, tuple, set)):
            return None, set(), False
        if isinstance(item, bool):
            normalized.add(item)
            kinds.add("bool")
        elif isinstance(item, (int, Decimal)):
            normalized.add(Decimal(str(item)))
            kinds.add("num")
        elif isinstance(item, str):
            normalized.add(item.strip().upper())
            kinds.add("str")
        else:
            return None, set(), False
    return normalized, kinds, True


def _eval_node(node: dict[str, Any], context: dict[str, Any], trace: EvaluationTrace) -> TruthValue:
    op = node["op"].upper()

    # -----------------------------------------------------------------------
    # Boolean Operators
    # -----------------------------------------------------------------------
    if op == "AND":
        child_results = []
        for child_node in node.get("args", []):
            child_trace = EvaluationTrace(child_node)
            child_res = _eval_node(child_node, context, child_trace)
            child_trace.result = child_res
            trace.children.append(child_trace)
            child_results.append(child_res)
        return and_(*child_results)

    if op == "OR":
        child_results = []
        for child_node in node.get("args", []):
            child_trace = EvaluationTrace(child_node)
            child_res = _eval_node(child_node, context, child_trace)
            child_trace.result = child_res
            trace.children.append(child_trace)
            child_results.append(child_res)
        return or_(*child_results)

    if op == "NOT":
        child_node = node.get("arg") if "arg" in node else node["args"][0]
        child_trace = EvaluationTrace(child_node)
        child_res = _eval_node(child_node, context, child_trace)
        child_trace.result = child_res
        trace.children.append(child_trace)
        return not_(child_res)

    # -----------------------------------------------------------------------
    # Existence Operators
    # -----------------------------------------------------------------------
    if op == "EXISTS":
        var_key = node["var"]
        has_key = var_key in context
        raw_val = context.get(var_key)
        val = raw_val["value"] if isinstance(raw_val, dict) and "value" in raw_val else raw_val
        trace.variables_used[var_key] = val
        return TRUE if (has_key and val is not None) else FALSE

    if op == "MISSING":
        var_key = node["var"]
        has_key = var_key in context
        raw_val = context.get(var_key)
        val = raw_val["value"] if isinstance(raw_val, dict) and "value" in raw_val else raw_val
        trace.variables_used[var_key] = val
        return TRUE if (not has_key or val is None) else FALSE

    # -----------------------------------------------------------------------
    # Binary Comparison & Classification Operators
    # -----------------------------------------------------------------------
    left_val, left_is_var = _resolve_operand(node["left"], context, trace)
    right_val, right_is_var = _resolve_operand(node["right"], context, trace)

    # Invariant: If a variable operand is missing (None), comparison produces UNKNOWN
    if (left_is_var and left_val is None) or (right_is_var and right_val is None):
        trace.notes.append("Decision-critical variable is missing or null -> UNKNOWN")
        return UNKNOWN

    # Check for numeric comparison
    left_dec = _to_decimal_if_numeric(left_val)
    right_dec = _to_decimal_if_numeric(right_val)
    both_numeric = left_dec is not None and right_dec is not None

    if op in {"EQ", "NEQ"}:
        # Incompatible types -> UNKNOWN (never silent FALSE)
        if isinstance(left_val, bool) or isinstance(right_val, bool):
            if not (isinstance(left_val, bool) and isinstance(right_val, bool)):
                trace.notes.append(f"Type mismatch: cannot compare bool with non-bool ({left_val!r} vs {right_val!r})")
                return UNKNOWN
            is_eq = (left_val == right_val)
            return (TRUE if is_eq else FALSE) if op == "EQ" else (TRUE if not is_eq else FALSE)

        if both_numeric:
            is_eq = (left_dec == right_dec)
            return (TRUE if is_eq else FALSE) if op == "EQ" else (TRUE if not is_eq else FALSE)

        if isinstance(left_val, str) and isinstance(right_val, str):
            is_eq = (left_val.strip().upper() == right_val.strip().upper())
            return (TRUE if is_eq else FALSE) if op == "EQ" else (TRUE if not is_eq else FALSE)

        if isinstance(left_val, list) and isinstance(right_val, list):
            left_norm = [x.strip().upper() if isinstance(x, str) else x for x in left_val]
            right_norm = [x.strip().upper() if isinstance(x, str) else x for x in right_val]
            is_eq = (left_norm == right_norm)
            return (TRUE if is_eq else FALSE) if op == "EQ" else (TRUE if not is_eq else FALSE)

        trace.notes.append(
            f"Type mismatch for {op}: {type(left_val).__name__} and {type(right_val).__name__} are incompatible"
        )
        return UNKNOWN

    if op in {"GT", "GTE", "LT", "LTE"}:
        if not both_numeric:
            trace.notes.append(f"Cannot perform {op} on non-numeric operands: {left_val!r} and {right_val!r}")
            return UNKNOWN

        if op == "GT":
            return TRUE if left_dec > right_dec else FALSE
        if op == "GTE":
            return TRUE if left_dec >= right_dec else FALSE
        if op == "LT":
            return TRUE if left_dec < right_dec else FALSE
        if op == "LTE":
            return TRUE if left_dec <= right_dec else FALSE

    if op in {"IN", "NOT_IN"}:
        if not isinstance(right_val, (list, tuple, set)):
            trace.notes.append(f"{op} operator right operand must be a list/set, got {type(right_val).__name__}")
            return UNKNOWN
        if isinstance(left_val, dict):
            trace.notes.append(f"{op} operator left operand cannot be a dict")
            return UNKNOWN

        if isinstance(left_val, str):
            target = left_val.strip().upper()
            found = False
            for item in right_val:
                if isinstance(item, str) and item.strip().upper() == target:
                    found = True
                    break
            return (TRUE if found else FALSE) if op == "IN" else (TRUE if not found else FALSE)

        if left_dec is not None:
            found = False
            for item in right_val:
                item_dec = _to_decimal_if_numeric(item)
                if item_dec is not None and item_dec == left_dec:
                    found = True
                    break
            return (TRUE if found else FALSE) if op == "IN" else (TRUE if not found else FALSE)

        if isinstance(left_val, bool):
            found = any(isinstance(item, bool) and item == left_val for item in right_val)
            return (TRUE if found else FALSE) if op == "IN" else (TRUE if not found else FALSE)

        trace.notes.append(f"Incompatible left operand type for {op}: {type(left_val).__name__}")
        return UNKNOWN

    if op == "CONTAINS":
        if isinstance(left_val, str):
            if not isinstance(right_val, str):
                trace.notes.append(f"CONTAINS on string requires string right operand, got {type(right_val).__name__}")
                return UNKNOWN
            return TRUE if right_val.strip().upper() in left_val.strip().upper() else FALSE

        if isinstance(left_val, (list, tuple, set)):
            if isinstance(right_val, dict) or right_val is None:
                trace.notes.append("CONTAINS does not support dict/None right operand")
                return UNKNOWN
            if isinstance(right_val, str):
                target = right_val.strip().upper()
                matching_items = [x for x in left_val if isinstance(x, str)]
                if not matching_items:
                    trace.notes.append("CONTAINS type mismatch: collection contains no string elements")
                    return UNKNOWN
                return TRUE if any(x.strip().upper() == target for x in matching_items) else FALSE
            right_dec = _to_decimal_if_numeric(right_val)
            if right_dec is not None:
                matching_items = [x for x in left_val if _to_decimal_if_numeric(x) is not None]
                if not matching_items:
                    trace.notes.append("CONTAINS type mismatch: collection contains no numeric elements")
                    return UNKNOWN
                return TRUE if any(_to_decimal_if_numeric(x) == right_dec for x in matching_items) else FALSE
            if isinstance(right_val, bool):
                matching_items = [x for x in left_val if isinstance(x, bool)]
                if not matching_items:
                    trace.notes.append("CONTAINS type mismatch: collection contains no boolean elements")
                    return UNKNOWN
                return TRUE if any(x == right_val for x in matching_items) else FALSE
            trace.notes.append(f"CONTAINS unsupported right operand type in list: {type(right_val).__name__}")
            return UNKNOWN

        trace.notes.append(f"CONTAINS incompatible left operand: {type(left_val).__name__}")
        return UNKNOWN

    if op == "MATCHES_CLASSIFICATION":
        if not isinstance(right_val, str):
            trace.notes.append(f"MATCHES_CLASSIFICATION requires string tag, got {type(right_val).__name__}")
            return UNKNOWN
        target = right_val.strip().upper()
        if isinstance(left_val, str):
            return TRUE if left_val.strip().upper() == target else FALSE
        if isinstance(left_val, (list, tuple, set)):
            found = any(isinstance(x, str) and x.strip().upper() == target for x in left_val)
            return TRUE if found else FALSE
        trace.notes.append(f"MATCHES_CLASSIFICATION incompatible left operand: {type(left_val).__name__}")
        return UNKNOWN

    if op == "INTERSECTS":
        left_set, left_kinds, left_ok = _to_normalized_set(left_val)
        right_set, right_kinds, right_ok = _to_normalized_set(right_val)
        if not left_ok or not right_ok or left_set is None or right_set is None:
            trace.notes.append(
                f"INTERSECTS operand type incompatible or unhashable: {type(left_val).__name__}, {type(right_val).__name__}"
            )
            return UNKNOWN
        # Type mismatch: if sets share no common type domain, return UNKNOWN (TRD_v2.0 §14, C7)
        if not (left_kinds & right_kinds):
            trace.notes.append(
                f"INTERSECTS operand types incompatible: {left_kinds} vs {right_kinds}"
            )
            return UNKNOWN
        return TRUE if bool(left_set & right_set) else FALSE

    trace.notes.append(f"Unhandled operator: {op}")
    return UNKNOWN
