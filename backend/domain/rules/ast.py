"""Rule AST definition and structural validator.

Authority: TRD_v2.0 §12; PRD_v2.0 §P3; Task 2 C10 Audit Hardening.

Operators:
- Boolean: AND, OR, NOT
- Comparison: EQ, NEQ, GT, GTE, LT, LTE, IN, NOT_IN
- Existence: EXISTS, MISSING
- Classification: CONTAINS, MATCHES_CLASSIFICATION, INTERSECTS

Rules are data; AST validation ensures no invalid expression can be published.
No eval(), exec() or dynamic code generation is permitted.
"""

from __future__ import annotations

from typing import Any

MAX_AST_DEPTH = 32


class AstValidationError(ValueError):
    """Raised when a condition AST structure or operator is invalid."""


BOOLEAN_OPS = frozenset({"AND", "OR", "NOT"})
COMPARISON_OPS = frozenset({"EQ", "NEQ", "GT", "GTE", "LT", "LTE", "IN", "NOT_IN"})
EXISTENCE_OPS = frozenset({"EXISTS", "MISSING"})
CLASSIFICATION_OPS = frozenset({"CONTAINS", "MATCHES_CLASSIFICATION", "INTERSECTS"})
ALL_OPS = BOOLEAN_OPS | COMPARISON_OPS | EXISTENCE_OPS | CLASSIFICATION_OPS


def validate_ast(node: Any, depth: int = 1) -> None:
    """Validate that `node` is a well-formed AST dictionary and canonicalize operator case.

    Raises AstValidationError on any structural defect, unknown operator,
    invalid operand schema, float literal, sub-expression operand, or depth > 32.
    """
    if depth > MAX_AST_DEPTH:
        raise AstValidationError(
            f"AST depth {depth} exceeds maximum allowed depth of {MAX_AST_DEPTH}."
        )

    if not isinstance(node, dict):
        raise AstValidationError(f"AST node must be a dict, got {type(node).__name__}: {node!r}")

    op_raw = node.get("op")
    if not isinstance(op_raw, str):
        raise AstValidationError(f"AST node missing string 'op' field: {node!r}")

    op = op_raw.strip().upper()
    if op not in ALL_OPS:
        raise AstValidationError(f"Unsupported AST operator: {op_raw!r}. Allowed: {sorted(ALL_OPS)}")

    # Operator canonicalisation in-place
    node["op"] = op

    if op in {"AND", "OR"}:
        args = node.get("args")
        if not isinstance(args, list) or len(args) < 1:
            raise AstValidationError(f"Operator {op} requires a non-empty list of 'args': {node!r}")
        for child in args:
            validate_ast(child, depth=depth + 1)

    elif op == "NOT":
        if "arg" not in node and "args" not in node:
            raise AstValidationError("Operator NOT requires 'arg' or single-element 'args'.")
        if "arg" in node:
            validate_ast(node["arg"], depth=depth + 1)
        else:
            args = node.get("args")
            if not isinstance(args, list) or len(args) != 1:
                raise AstValidationError("Operator NOT with 'args' must have exactly one element.")
            validate_ast(args[0], depth=depth + 1)

    elif op in COMPARISON_OPS or op in CLASSIFICATION_OPS:
        if "left" not in node or "right" not in node:
            raise AstValidationError(f"Binary operator {op} requires 'left' and 'right' operands.")
        _validate_operand(node["left"])
        _validate_operand(node["right"])

    elif op in EXISTENCE_OPS:
        if "var" not in node or not isinstance(node["var"], str):
            raise AstValidationError(f"Existence operator {op} requires string 'var' attribute.")


def _validate_operand(operand: Any) -> None:
    # Float literals are strictly forbidden in AST operands
    if isinstance(operand, float):
        raise AstValidationError(
            f"Float literals are forbidden in AST operands: {operand!r}. "
            "Use integer, string, or Decimal representation."
        )

    if isinstance(operand, dict):
        # Sub-expression operands are strictly rejected (e.g. {"op": "EQ", ...})
        if "op" in operand:
            raise AstValidationError(
                f"Nested sub-expressions with 'op' are forbidden as operands: {operand!r}"
            )
        if "var" in operand:
            if not isinstance(operand["var"], str) or not operand["var"].strip():
                raise AstValidationError(f"Variable reference must have non-empty string 'var': {operand!r}")
            return
        raise AstValidationError(f"Invalid dict operand schema: {operand!r}")

    if isinstance(operand, list):
        for item in operand:
            if isinstance(item, float):
                raise AstValidationError(f"Float literals are forbidden in list operands: {item!r}")
            if isinstance(item, dict) and "op" in item:
                raise AstValidationError(f"Nested sub-expressions forbidden in list operands: {item!r}")
        return

    # Literals (int, bool, str, None)
    if isinstance(operand, (str, int, bool)) or operand is None:
        return

    raise AstValidationError(f"Invalid operand: {operand!r} of type {type(operand).__name__}")
