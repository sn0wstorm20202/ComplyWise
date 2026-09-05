"""Unit tests for AST condition validation and deterministic evaluation.

Authority: TRD_v2.0 §12, §13, §14; PRD_v2.0 §P3, §P4, §P5.

Invariants verified:
1. Missing decision-critical inputs produce UNKNOWN, never FALSE.
2. Three-valued logic conforms to Kleene logic truth tables.
3. Numeric comparisons are exact across float/int/Decimal/string representations.
4. Invalid AST schemas raise AstValidationError without code execution.
5. Evaluation traces capture variable accesses and intermediate sub-results.
"""

from __future__ import annotations

from decimal import Decimal
import pytest

from domain.evaluation.evaluator import evaluate_ast
from domain.evaluation.truth import FALSE, TRUE, UNKNOWN
from domain.rules.ast import AstValidationError, validate_ast


# ===========================================================================
# 1. AST Validation Tests
# ===========================================================================

def test_ast_validation_rejects_non_dict():
    with pytest.raises(AstValidationError, match="AST node must be a dict"):
        validate_ast("not a dict")
    with pytest.raises(AstValidationError, match="AST node must be a dict"):
        validate_ast([{"op": "EQ"}])


def test_ast_validation_rejects_missing_op():
    with pytest.raises(AstValidationError, match="missing string 'op' field"):
        validate_ast({"left": 1, "right": 2})


def test_ast_validation_rejects_unsupported_op():
    with pytest.raises(AstValidationError, match="Unsupported AST operator: 'EXEC'"):
        validate_ast({"op": "EXEC", "code": "import os"})


def test_ast_validation_boolean_args():
    with pytest.raises(AstValidationError, match="requires a non-empty list of 'args'"):
        validate_ast({"op": "AND", "args": []})

    with pytest.raises(AstValidationError, match="requires a non-empty list of 'args'"):
        validate_ast({"op": "OR", "args": "not-a-list"})

    with pytest.raises(AstValidationError, match="Operator NOT requires 'arg'"):
        validate_ast({"op": "NOT"})


def test_ast_validation_comparison_operands():
    with pytest.raises(AstValidationError, match="requires 'left' and 'right' operands"):
        validate_ast({"op": "EQ", "left": 1})

    with pytest.raises(AstValidationError, match="Variable reference must have non-empty string 'var'"):
        validate_ast({"op": "EQ", "left": {"var": ""}, "right": 5})

    with pytest.raises(AstValidationError, match="Variable reference must have non-empty string 'var'"):
        validate_ast({"op": "EQ", "left": {"var": 123}, "right": 5})


def test_ast_validation_existence_operands():
    with pytest.raises(AstValidationError, match="requires string 'var' attribute"):
        validate_ast({"op": "EXISTS", "key": "state"})

    with pytest.raises(AstValidationError, match="requires string 'var' attribute"):
        validate_ast({"op": "MISSING"})


# ===========================================================================
# 2. Boolean Logic & Kleene Three-Valued Logic Tests
# ===========================================================================

def test_ast_evaluator_and_kleene():
    # TRUE and TRUE -> TRUE
    ast_true = {
        "op": "AND",
        "args": [
            {"op": "EQ", "left": 1, "right": 1},
            {"op": "EQ", "left": "a", "right": "a"},
        ],
    }
    res, trace = evaluate_ast(ast_true, {})
    assert res == TRUE
    assert trace.result == TRUE

    # TRUE and UNKNOWN -> UNKNOWN
    ast_unk = {
        "op": "AND",
        "args": [
            {"op": "EQ", "left": 1, "right": 1},
            {"op": "EQ", "left": {"var": "missing_var"}, "right": 10},
        ],
    }
    res, trace = evaluate_ast(ast_unk, {})
    assert res == UNKNOWN

    # FALSE and UNKNOWN -> FALSE (short-circuit in Kleene: false with anything is false)
    ast_false = {
        "op": "AND",
        "args": [
            {"op": "EQ", "left": 1, "right": 2},
            {"op": "EQ", "left": {"var": "missing_var"}, "right": 10},
        ],
    }
    res, trace = evaluate_ast(ast_false, {})
    assert res == FALSE


def test_ast_evaluator_or_kleene():
    # TRUE or UNKNOWN -> TRUE
    ast_true = {
        "op": "OR",
        "args": [
            {"op": "EQ", "left": 1, "right": 1},
            {"op": "EQ", "left": {"var": "missing_var"}, "right": 10},
        ],
    }
    res, trace = evaluate_ast(ast_true, {})
    assert res == TRUE

    # FALSE or UNKNOWN -> UNKNOWN
    ast_unk = {
        "op": "OR",
        "args": [
            {"op": "EQ", "left": 1, "right": 2},
            {"op": "EQ", "left": {"var": "missing_var"}, "right": 10},
        ],
    }
    res, trace = evaluate_ast(ast_unk, {})
    assert res == UNKNOWN


def test_ast_evaluator_not_kleene():
    # NOT TRUE -> FALSE
    ast_not_true = {"op": "NOT", "arg": {"op": "EQ", "left": 1, "right": 1}}
    assert evaluate_ast(ast_not_true, {})[0] == FALSE

    # NOT FALSE -> TRUE
    ast_not_false = {"op": "NOT", "arg": {"op": "EQ", "left": 1, "right": 2}}
    assert evaluate_ast(ast_not_false, {})[0] == TRUE

    # NOT UNKNOWN -> UNKNOWN
    ast_not_unk = {"op": "NOT", "arg": {"op": "EQ", "left": {"var": "missing"}, "right": 1}}
    assert evaluate_ast(ast_not_unk, {})[0] == UNKNOWN


# ===========================================================================
# 3. Comparison Operators Tests (EQ, NEQ, GT, GTE, LT, LTE, IN, NOT_IN)
# ===========================================================================

def test_ast_evaluator_equality():
    ctx = {"state": "Gujarat", "count": 10, "empty": None}

    # String case-insensitivity
    ast_eq_str = {"op": "EQ", "left": {"var": "state"}, "right": "GUJARAT"}
    assert evaluate_ast(ast_eq_str, ctx)[0] == TRUE

    ast_eq_str_diff = {"op": "EQ", "left": {"var": "state"}, "right": "Karnataka"}
    assert evaluate_ast(ast_eq_str_diff, ctx)[0] == FALSE

    # Numeric equality across types (int and Decimal string)
    ast_eq_num = {"op": "EQ", "left": {"var": "count"}, "right": "10.0"}
    assert evaluate_ast(ast_eq_num, ctx)[0] == TRUE

    # Missing variable -> UNKNOWN
    ast_eq_missing = {"op": "EQ", "left": {"var": "absent"}, "right": "Gujarat"}
    assert evaluate_ast(ast_eq_missing, ctx)[0] == UNKNOWN

    # Null variable -> UNKNOWN
    ast_eq_null = {"op": "EQ", "left": {"var": "empty"}, "right": "Gujarat"}
    assert evaluate_ast(ast_eq_null, ctx)[0] == UNKNOWN


def test_ast_evaluator_inequality():
    ctx = {"state": "Gujarat", "num": 5}
    ast_neq = {"op": "NEQ", "left": {"var": "state"}, "right": "Maharashtra"}
    assert evaluate_ast(ast_neq, ctx)[0] == TRUE

    ast_neq_same = {"op": "NEQ", "left": {"var": "num"}, "right": 5}
    assert evaluate_ast(ast_neq_same, ctx)[0] == FALSE


def test_ast_evaluator_numeric_inequalities():
    ctx = {"turnover": "1500000", "workers": 25}

    # GT
    assert evaluate_ast({"op": "GT", "left": {"var": "turnover"}, "right": 1200000}, ctx)[0] == TRUE
    assert evaluate_ast({"op": "GT", "left": {"var": "turnover"}, "right": 2000000}, ctx)[0] == FALSE

    # GTE
    assert evaluate_ast({"op": "GTE", "left": {"var": "workers"}, "right": 25}, ctx)[0] == TRUE
    assert evaluate_ast({"op": "GTE", "left": {"var": "workers"}, "right": 30}, ctx)[0] == FALSE

    # LT
    assert evaluate_ast({"op": "LT", "left": {"var": "workers"}, "right": 50}, ctx)[0] == TRUE
    assert evaluate_ast({"op": "LT", "left": {"var": "workers"}, "right": 20}, ctx)[0] == FALSE

    # LTE
    assert evaluate_ast({"op": "LTE", "left": {"var": "workers"}, "right": 25}, ctx)[0] == TRUE
    assert evaluate_ast({"op": "LTE", "left": {"var": "workers"}, "right": 10}, ctx)[0] == FALSE


def test_ast_evaluator_in_and_not_in():
    ctx = {"industry": "Food Processing"}

    ast_in = {"op": "IN", "left": {"var": "industry"}, "right": ["Textiles", "FOOD PROCESSING", "Chemicals"]}
    assert evaluate_ast(ast_in, ctx)[0] == TRUE

    ast_in_absent = {"op": "IN", "left": {"var": "industry"}, "right": ["Automobile", "Software"]}
    assert evaluate_ast(ast_in_absent, ctx)[0] == FALSE

    ast_not_in = {"op": "NOT_IN", "left": {"var": "industry"}, "right": ["Automobile", "Software"]}
    assert evaluate_ast(ast_not_in, ctx)[0] == TRUE


# ===========================================================================
# 4. Existence Operators Tests (EXISTS, MISSING)
# ===========================================================================

def test_ast_evaluator_exists_and_missing():
    ctx = {"has_boiler": True, "null_var": None}

    # EXISTS
    assert evaluate_ast({"op": "EXISTS", "var": "has_boiler"}, ctx)[0] == TRUE
    assert evaluate_ast({"op": "EXISTS", "var": "null_var"}, ctx)[0] == FALSE
    assert evaluate_ast({"op": "EXISTS", "var": "unseen_var"}, ctx)[0] == FALSE

    # MISSING
    assert evaluate_ast({"op": "MISSING", "var": "has_boiler"}, ctx)[0] == FALSE
    assert evaluate_ast({"op": "MISSING", "var": "null_var"}, ctx)[0] == TRUE
    assert evaluate_ast({"op": "MISSING", "var": "unseen_var"}, ctx)[0] == TRUE


# ===========================================================================
# 5. Classification & Set Operators (CONTAINS, MATCHES_CLASSIFICATION, INTERSECTS)
# ===========================================================================

def test_ast_evaluator_contains():
    ctx = {
        "products": ["Fruit Jams", "Packaged Juices"],
        "description": "Manufacturing fruit pulp and jams in industrial estate",
    }

    # List contains
    assert evaluate_ast({"op": "CONTAINS", "left": {"var": "products"}, "right": "fruit jams"}, ctx)[0] == TRUE
    assert evaluate_ast({"op": "CONTAINS", "left": {"var": "products"}, "right": "Steel Pipes"}, ctx)[0] == FALSE

    # String contains
    assert evaluate_ast({"op": "CONTAINS", "left": {"var": "description"}, "right": "industrial estate"}, ctx)[0] == TRUE
    assert evaluate_ast({"op": "CONTAINS", "left": {"var": "description"}, "right": "offshore drilling"}, ctx)[0] == FALSE


def test_ast_evaluator_matches_classification():
    ctx = {"nic_code": "10300", "pollution_category": "ORANGE"}

    assert evaluate_ast({"op": "MATCHES_CLASSIFICATION", "left": {"var": "pollution_category"}, "right": "orange"}, ctx)[0] == TRUE
    assert evaluate_ast({"op": "MATCHES_CLASSIFICATION", "left": {"var": "pollution_category"}, "right": "red"}, ctx)[0] == FALSE


def test_ast_evaluator_intersects():
    ctx = {
        "activities": ["manufacturing", "packaging", "storage"],
        "single_activity": "manufacturing",
    }

    assert evaluate_ast({"op": "INTERSECTS", "left": {"var": "activities"}, "right": ["packaging", "export"]}, ctx)[0] == TRUE
    assert evaluate_ast({"op": "INTERSECTS", "left": {"var": "activities"}, "right": ["mining", "refining"]}, ctx)[0] == FALSE
    assert evaluate_ast({"op": "INTERSECTS", "left": {"var": "single_activity"}, "right": ["manufacturing", "logistics"]}, ctx)[0] == TRUE


# ===========================================================================
# 6. Critical Uncertainty Invariant
# ===========================================================================

def test_ast_evaluator_missing_critical_variable_invariant():
    """Missing decision-critical variable must NEVER evaluate to FALSE.
    
    If a rule requires turnover >= 1,200,000 and the business has not answered turnover,
    the rule evaluation must be UNKNOWN, not FALSE.
    """
    ctx_without_turnover = {"state": "Gujarat"}
    rule_ast = {
        "op": "AND",
        "args": [
            {"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
            {"op": "GTE", "left": {"var": "annual_turnover"}, "right": 1200000},
        ],
    }

    result, trace = evaluate_ast(rule_ast, ctx_without_turnover)
    assert result == UNKNOWN, f"Expected UNKNOWN for missing turnover, got {result}"
    assert "annual_turnover" in trace.children[1].variables_used
    assert trace.children[1].result == UNKNOWN


# ===========================================================================
# 7. Trace Detail Verification
# ===========================================================================

def test_ast_evaluator_trace_structure():
    ctx = {"state": "Gujarat", "workers": 20}
    ast = {
        "op": "AND",
        "args": [
            {"op": "EQ", "left": {"var": "state"}, "right": "Gujarat"},
            {"op": "GTE", "left": {"var": "workers"}, "right": 10},
        ],
    }
    result, trace = evaluate_ast(ast, ctx)
    assert result == TRUE
    trace_dict = trace.to_dict()

    assert trace_dict["op"] == "AND"
    assert trace_dict["result"] == "TRUE"
    assert len(trace_dict["children"]) == 2
    assert trace_dict["children"][0]["op"] == "EQ"
    assert trace_dict["children"][0]["variables_used"] == {"state": "Gujarat"}
    assert trace_dict["children"][1]["op"] == "GTE"
    assert trace_dict["children"][1]["variables_used"] == {"workers": 20}


# ===========================================================================
# 8. C7 & C10 Evaluator & AST Hardening Tests
# ===========================================================================


def test_deeply_nested_ast_rejected_not_recursion_error():
    """Depth > 32 must raise AstValidationError, never RecursionError."""
    # Build tree of depth 35
    curr = {"op": "EQ", "left": 1, "right": 1}
    for _ in range(35):
        curr = {"op": "AND", "args": [curr]}

    with pytest.raises(AstValidationError, match="exceeds maximum allowed depth"):
        validate_ast(curr)


def test_subexpression_operand_rejected():
    """Nested comparison sub-expressions as operands must be rejected."""
    bad_ast = {
        "op": "EQ",
        "left": {
            "op": "EQ",
            "left": 1,
            "right": 1,
        },
        "right": True,
    }
    with pytest.raises(AstValidationError, match="Nested sub-expressions with 'op' are forbidden"):
        validate_ast(bad_ast)


def test_float_operand_rejected():
    """Float literals in operands must be rejected; Decimal/integer/string required."""
    bad_ast = {
        "op": "GTE",
        "left": {"var": "annual_turnover"},
        "right": 12.5,
    }
    with pytest.raises(AstValidationError, match="Float literals are forbidden"):
        validate_ast(bad_ast)


def test_operator_case_canonicalised():
    """Lowercase operator strings like 'eq', 'and' must be canonicalized to uppercase."""
    node = {
        "op": "and",
        "args": [
            {"op": "eq", "left": {"var": "state"}, "right": "Gujarat"},
        ],
    }
    validate_ast(node)
    assert node["op"] == "AND"
    assert node["args"][0]["op"] == "EQ"


def test_intersects_is_case_insensitive():
    """INTERSECTS operator must be case-insensitive."""
    ast = {
        "op": "INTERSECTS",
        "left": {"var": "activities"},
        "right": ["MANUFACTURING", "TRADE"],
    }
    res, _ = evaluate_ast(ast, {"activities": ["manufacturing", "logistics"]})
    assert res == TRUE


def test_intersects_unhashable_operand_is_unknown():
    """INTERSECTS with unhashable operands (dicts, lists of dicts) returns UNKNOWN, never raises TypeError."""
    ast = {
        "op": "INTERSECTS",
        "left": {"var": "unhashable_list"},
        "right": ["manufacturing"],
    }
    res, _ = evaluate_ast(ast, {"unhashable_list": [{"key": "val"}, 123]})
    assert res == UNKNOWN


@pytest.mark.parametrize(
    "op",
    [
        "AND", "OR", "NOT", "EQ", "NEQ", "GT", "GTE", "LT", "LTE",
        "IN", "NOT_IN", "EXISTS", "MISSING", "CONTAINS", "INTERSECTS",
    ],
)
def test_fifteen_operator_type_mismatch_returns_unknown_or_valid(op):
    """The 15 operators must never crash with unhandled exception or return FALSE on type mismatches.

    Tested across operand types: int, str, list, dict, None.
    """
    type_samples = {
        "int": 42,
        "str": "text_val",
        "list": [1, 2, 3],
        "dict": {"key": "value"},
        "none": None,
    }

    for t1_name, v1 in type_samples.items():
        for t2_name, v2 in type_samples.items():
            # Build validly shaped AST referencing variables for operands
            ctx: dict[str, Any] = {}
            if v1 is not None:
                ctx["x"] = v1
            if v2 is not None:
                ctx["y"] = v2

            if op in ("AND", "OR"):
                ast = {"op": op, "args": [{"op": "EQ", "left": {"var": "x"}, "right": {"var": "y"}}]}
            elif op == "NOT":
                ast = {"op": "NOT", "arg": {"op": "EQ", "left": {"var": "x"}, "right": {"var": "y"}}}
            elif op in ("EXISTS", "MISSING"):
                ast = {"op": op, "var": "x"}
            else:
                ast = {"op": op, "left": {"var": "x"}, "right": {"var": "y"}}

            # Evaluate AST: must NOT raise an unhandled exception
            try:
                res, _ = evaluate_ast(ast, ctx)
                assert res in (TRUE, FALSE, UNKNOWN)

                # If variable is missing for binary operators, must return UNKNOWN
                if op not in ("EXISTS", "MISSING"):
                    if v1 is None or v2 is None:
                        assert res == UNKNOWN, f"{op} with missing operand must produce UNKNOWN, got {res}"

                # For comparison operators with mismatched incompatible types (e.g. dict vs int, list vs int),
                # result must be UNKNOWN, never FALSE.
                if op in ("GT", "GTE", "LT", "LTE"):
                    if not (isinstance(v1, int) and isinstance(v2, int)):
                        assert res == UNKNOWN, f"Operator {op} for {t1_name} and {t2_name} produced {res}, expected UNKNOWN"

                elif op in ("IN", "NOT_IN"):
                    if not isinstance(v2, list) or isinstance(v1, dict):
                        assert res == UNKNOWN, f"Operator {op} for {t1_name} and {t2_name} produced {res}, expected UNKNOWN"

                elif op == "CONTAINS":
                    if not isinstance(v1, (str, list)):
                        assert res == UNKNOWN, f"CONTAINS for {t1_name} and {t2_name} produced {res}, expected UNKNOWN"
                    elif isinstance(v1, str) and not isinstance(v2, str):
                        assert res == UNKNOWN, f"CONTAINS for {t1_name} and {t2_name} produced {res}, expected UNKNOWN"

                elif op == "INTERSECTS":
                    if isinstance(v1, dict) or isinstance(v2, dict) or v1 is None or v2 is None:
                        assert res == UNKNOWN, f"INTERSECTS for {t1_name} and {t2_name} produced {res}, expected UNKNOWN"
                    elif (isinstance(v1, int) and isinstance(v2, str)) or (isinstance(v1, str) and isinstance(v2, int)):
                        assert res == UNKNOWN, f"INTERSECTS across {t1_name} and {t2_name} produced {res}, expected UNKNOWN"

            except Exception as exc:
                pytest.fail(f"Operator {op} crashed on operands ({t1_name}, {t2_name}): {exc}")

