"""Comprehensive Unit Tests for AST-aware Adaptive Dependency Analyzer.

Validates:
1. AND with first FALSE (short-circuits downstream questions).
2. AND with UNKNOWN branches (aggregates relevant missing variables).
3. OR with first TRUE (short-circuits sibling branches).
4. OR with FALSE + UNKNOWN (prunes FALSE branch, asks only UNKNOWN).
5. Nested AND/OR logic.
6. NOT + UNKNOWN, NOT + TRUE, NOT + FALSE.
7. Missing variable producing UNKNOWN and decision-relevant candidate.
8. Incompatible variable types handled safely without exceptions.
9. State mismatch short-circuiting downstream questions (e.g. MH business for Gujarat factory rule).
10. Multiple rules sharing the same variable (annual_turnover priority boost).
11. A rule with no missing variables (decisively resolves with empty relevant variables).
12. Multiple unresolved rules with different relevant variables and deterministic ranking.
13. Actual knowledge pack rule structures (Gujarat food, Karnataka ESDM, Tamil Nadu auto).
"""

from __future__ import annotations

from decimal import Decimal
import pytest

from apps.onboarding.adaptive import (
    analyze_ast_node,
    analyze_candidate_rules,
    analyze_rule,
    extract_ast_variables,
    is_variable_missing,
    normalize_context,
)
from domain.evaluation.truth import FALSE, TRUE, UNKNOWN


# ------------------------------------------------------------------------------
# 1. AND with first FALSE
# ------------------------------------------------------------------------------
def test_and_with_first_false_short_circuits():
    """AND(A, B, C) where A=FALSE, B=UNKNOWN, C=UNKNOWN -> result=FALSE, relevant=empty."""
    node = {
        "op": "AND",
        "args": [
            {"op": "EQ", "left": {"var": "state"}, "right": "GUJARAT"},
            {"op": "GTE", "left": {"var": "total_worker_count"}, "right": 10},
            {"op": "GT", "left": {"var": "connected_power_load"}, "right": 0},
        ],
    }
    context = {"state": "MAHARASHTRA"}  # worker_count and power_load are missing

    analysis = analyze_ast_node(node, context)

    assert analysis.result == FALSE
    assert analysis.is_decisive is True
    # Downstream variables must NOT be marked decision-relevant!
    assert analysis.relevant_variables == frozenset()
    # Unresolved variables across the subtree are recorded for audit
    assert "total_worker_count" in analysis.unresolved_variables
    assert "connected_power_load" in analysis.unresolved_variables


# ------------------------------------------------------------------------------
# 2. AND with UNKNOWN branches
# ------------------------------------------------------------------------------
def test_and_with_unknown_branches_aggregates_relevant_variables():
    """AND(A, B, C) where A=TRUE, B=UNKNOWN, C=UNKNOWN -> result=UNKNOWN, relevant={B, C}."""
    node = {
        "op": "AND",
        "args": [
            {"op": "EQ", "left": {"var": "state"}, "right": "GUJARAT"},
            {"op": "GTE", "left": {"var": "total_worker_count"}, "right": 10},
            {"op": "GT", "left": {"var": "connected_power_load"}, "right": 0},
        ],
    }
    context = {"state": "GUJARAT"}  # A is TRUE, B & C are missing

    analysis = analyze_ast_node(node, context)

    assert analysis.result == UNKNOWN
    assert analysis.is_decisive is False
    assert analysis.relevant_variables == frozenset({"total_worker_count", "connected_power_load"})


# ------------------------------------------------------------------------------
# 3. OR with first TRUE
# ------------------------------------------------------------------------------
def test_or_with_first_true_short_circuits():
    """OR(A, B) where A=TRUE, B=UNKNOWN -> result=TRUE, relevant=empty."""
    node = {
        "op": "OR",
        "args": [
            {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "FOOD"},
            {"op": "EQ", "left": {"var": "effluent_emission_generation"}, "right": True},
        ],
    }
    context = {"product_description": "Packaged organic food products"}  # effluent missing

    analysis = analyze_ast_node(node, context)

    assert analysis.result == TRUE
    assert analysis.is_decisive is True
    # Effluent question is completely unnecessary because product already satisfies the OR!
    assert analysis.relevant_variables == frozenset()


# ------------------------------------------------------------------------------
# 4. OR with FALSE + UNKNOWN
# ------------------------------------------------------------------------------
def test_or_with_false_and_unknown_prunes_false():
    """OR(A, B) where A=FALSE, B=UNKNOWN -> result=UNKNOWN, relevant={B}."""
    node = {
        "op": "OR",
        "args": [
            {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "FOOD"},
            {"op": "EQ", "left": {"var": "effluent_emission_generation"}, "right": True},
        ],
    }
    context = {"product_description": "Electronics manufacturing"}  # not food; effluent missing

    analysis = analyze_ast_node(node, context)

    assert analysis.result == UNKNOWN
    assert analysis.is_decisive is False
    # Only effluent is decision-relevant; food is already FALSE
    assert analysis.relevant_variables == frozenset({"effluent_emission_generation"})


def test_or_with_multiple_false_and_one_unknown():
    """OR(A, B, C) where A=FALSE, B=FALSE, C=UNKNOWN -> result=UNKNOWN, relevant={C}."""
    node = {
        "op": "OR",
        "args": [
            {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "FOOD"},
            {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "BEVERAGE"},
            {"op": "EQ", "left": {"var": "effluent_emission_generation"}, "right": True},
        ],
    }
    context = {"product_description": "Textile spinning mill"}

    analysis = analyze_ast_node(node, context)

    assert analysis.result == UNKNOWN
    assert analysis.relevant_variables == frozenset({"effluent_emission_generation"})


# ------------------------------------------------------------------------------
# 5. Nested AND/OR
# ------------------------------------------------------------------------------
def test_nested_and_or_logic():
    """AND(state == GUJARAT, OR(effluent == True, product CONTAINS 'FOOD'))."""
    node = {
        "op": "AND",
        "args": [
            {"op": "EQ", "left": {"var": "state"}, "right": "GUJARAT"},
            {
                "op": "OR",
                "args": [
                    {"op": "EQ", "left": {"var": "effluent_emission_generation"}, "right": True},
                    {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "FOOD"},
                ],
            },
        ],
    }

    # Case 5a: State is Maharashtra -> outer AND is FALSE immediately
    res_mh = analyze_ast_node(node, {"state": "MAHARASHTRA"})
    assert res_mh.result == FALSE
    assert res_mh.relevant_variables == frozenset()

    # Case 5b: State is Gujarat, product contains FOOD -> resolved TRUE
    res_guj_food = analyze_ast_node(node, {"state": "GUJARAT", "product_description": "Processed food snacks"})
    assert res_guj_food.result == TRUE
    assert res_guj_food.relevant_variables == frozenset()

    # Case 5c: State is Gujarat, product is AUTO (not FOOD), effluent missing -> UNKNOWN, asks effluent
    res_guj_auto = analyze_ast_node(node, {"state": "GUJARAT", "product_description": "Automotive engine parts"})
    assert res_guj_auto.result == UNKNOWN
    assert res_guj_auto.relevant_variables == frozenset({"effluent_emission_generation"})

    # Case 5d: State is Gujarat, product missing, effluent missing -> UNKNOWN, asks both
    res_guj_empty = analyze_ast_node(node, {"state": "GUJARAT"})
    assert res_guj_empty.result == UNKNOWN
    assert res_guj_empty.relevant_variables == frozenset({"effluent_emission_generation", "product_description"})


# ------------------------------------------------------------------------------
# 6. NOT operator
# ------------------------------------------------------------------------------
def test_not_operator():
    """NOT(A) follows Kleene negation."""
    node = {
        "op": "NOT",
        "arg": {"op": "EQ", "left": {"var": "multi_state_operations"}, "right": True},
    }

    # Unknown
    res_unknown = analyze_ast_node(node, {})
    assert res_unknown.result == UNKNOWN
    assert res_unknown.relevant_variables == frozenset({"multi_state_operations"})

    # True child -> NOT is False
    res_true = analyze_ast_node(node, {"multi_state_operations": True})
    assert res_true.result == FALSE
    assert res_true.relevant_variables == frozenset()

    # False child -> NOT is True
    res_false = analyze_ast_node(node, {"multi_state_operations": False})
    assert res_false.result == TRUE
    assert res_false.relevant_variables == frozenset()


# ------------------------------------------------------------------------------
# 7. Missing variable
# ------------------------------------------------------------------------------
def test_missing_variable_produces_unknown_and_relevant():
    """Comparison on missing variable yields UNKNOWN and marks variable relevant."""
    node = {"op": "GTE", "left": {"var": "annual_turnover"}, "right": 1200000}
    analysis = analyze_ast_node(node, {})
    assert analysis.result == UNKNOWN
    assert analysis.relevant_variables == frozenset({"annual_turnover"})


# ------------------------------------------------------------------------------
# 8. Wrong / incompatible variable type
# ------------------------------------------------------------------------------
def test_incompatible_variable_type_handled_safely():
    """Non-numeric string for numeric GT yields UNKNOWN, does not crash, no relevant vars."""
    node = {"op": "GT", "left": {"var": "connected_power_load"}, "right": 0}
    context = {"connected_power_load": "not_a_number"}
    analysis = analyze_ast_node(node, context)
    assert analysis.result == UNKNOWN
    # The variable is NOT missing (it was supplied), so it's not marked as an unsupplied question
    assert analysis.relevant_variables == frozenset()


# ------------------------------------------------------------------------------
# 9. State mismatch short-circuiting downstream questions
# ------------------------------------------------------------------------------
def test_state_mismatch_short_circuits_downstream():
    """Gujarat factory rule with worker & power requirements resolves FALSE for TN."""
    guj_factory_ast = {
        "op": "AND",
        "args": [
            {"op": "EQ", "left": {"var": "state"}, "right": "GUJARAT"},
            {"op": "GTE", "left": {"var": "total_worker_count"}, "right": 10},
            {"op": "GT", "left": {"var": "connected_power_load"}, "right": 0},
        ],
    }
    context = {"state": "TAMIL_NADU"}
    analysis = analyze_ast_node(guj_factory_ast, context)
    assert analysis.result == FALSE
    assert analysis.relevant_variables == frozenset()


# ------------------------------------------------------------------------------
# 10. Multiple rules sharing the same variable
# ------------------------------------------------------------------------------
def test_multiple_rules_sharing_variable_boosts_impact():
    """Variables needed across multiple unresolved rules receive higher impact scores."""
    rule_fssai = {
        "rule_id": "RULE-FSSAI-01",
        "domain": "FOOD",
        "jurisdiction": "CENTRAL",
        "condition_ast": {
            "op": "AND",
            "args": [
                {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "FOOD"},
                {"op": "GTE", "left": {"var": "annual_turnover"}, "right": 1200000},
            ],
        },
    }
    rule_msme = {
        "rule_id": "RULE-MSME-01",
        "domain": "GENERAL",
        "jurisdiction": "CENTRAL",
        "condition_ast": {
            "op": "LTE",
            "left": {"var": "annual_turnover"},
            "right": 50000000,
        },
    }
    rule_factory = {
        "rule_id": "RULE-FACTORY-01",
        "domain": "LABOR",
        "jurisdiction": "CENTRAL",
        "condition_ast": {
            "op": "GTE",
            "left": {"var": "total_worker_count"},
            "right": 10,
        },
    }

    context = {"product_description": "Dehydrated organic food products"}
    # annual_turnover is missing (needed by rule_fssai and rule_msme)
    # total_worker_count is missing (needed only by rule_factory)

    kb_analysis = analyze_candidate_rules([rule_fssai, rule_msme, rule_factory], context)

    assert kb_analysis.unresolved_count == 3
    assert kb_analysis.variable_impact["annual_turnover"] == 2
    assert kb_analysis.variable_impact["total_worker_count"] == 1
    # annual_turnover must rank FIRST because it impacts 2 unresolved rules vs 1
    assert kb_analysis.ranked_variables[0] == "annual_turnover"
    assert kb_analysis.ranked_variables[1] == "total_worker_count"


# ------------------------------------------------------------------------------
# 11. Rule with no missing variables
# ------------------------------------------------------------------------------
def test_rule_with_no_missing_variables_is_decisive():
    """All variables provided -> rule evaluates decisively to TRUE or FALSE with 0 relevant vars."""
    node = {
        "op": "AND",
        "args": [
            {"op": "EQ", "left": {"var": "state"}, "right": "GUJARAT"},
            {"op": "GTE", "left": {"var": "total_worker_count"}, "right": 10},
        ],
    }
    context_true = {"state": "GUJARAT", "total_worker_count": 15}
    res_true = analyze_ast_node(node, context_true)
    assert res_true.result == TRUE
    assert res_true.is_decisive is True
    assert res_true.relevant_variables == frozenset()

    context_false = {"state": "GUJARAT", "total_worker_count": 5}
    res_false = analyze_ast_node(node, context_false)
    assert res_false.result == FALSE
    assert res_false.is_decisive is True
    assert res_false.relevant_variables == frozenset()


# ------------------------------------------------------------------------------
# 12. Multiple unresolved rules with different relevant variables
# ------------------------------------------------------------------------------
def test_multiple_unresolved_rules_deterministic_ranking():
    """Deterministic ranking orders variables by unresolved rule frequency."""
    rules = [
        {"rule_id": "R1", "condition_ast": {"op": "EQ", "left": {"var": "var_a"}, "right": 1}},
        {"rule_id": "R2", "condition_ast": {"op": "EQ", "left": {"var": "var_a"}, "right": 2}},
        {"rule_id": "R3", "condition_ast": {"op": "EQ", "left": {"var": "var_b"}, "right": 3}},
        {
            "rule_id": "R4",
            "condition_ast": {
                "op": "AND",
                "args": [
                    {"op": "EQ", "left": {"var": "var_a"}, "right": 4},
                    {"op": "EQ", "left": {"var": "var_c"}, "right": 5},
                ],
            },
        },
    ]
    context = {}  # All variables missing

    kb = analyze_candidate_rules(rules, context)
    assert kb.unresolved_count == 4
    assert kb.variable_impact["var_a"] == 3
    assert kb.variable_impact["var_b"] == 1
    assert kb.variable_impact["var_c"] == 1
    assert kb.ranked_variables[0] == "var_a"


# ------------------------------------------------------------------------------
# 13. Knowledge Pack Real-World Regressions
# ------------------------------------------------------------------------------
def test_gujarat_food_regression():
    """FSSAI state license rule from gujarat_food pack."""
    rule_fssai = {
        "rule_id": "RULE-FSSAI-STATE-01",
        "domain": "FOOD",
        "jurisdiction": "CENTRAL",
        "condition_ast": {
            "op": "AND",
            "args": [
                {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "FOOD"},
                {"op": "GTE", "left": {"var": "annual_turnover"}, "right": 1200000},
                {"op": "LTE", "left": {"var": "annual_turnover"}, "right": 200000000},
            ],
        },
    }

    # Food product without turnover -> only annual_turnover is asked
    ctx = {"product_description": "Processed fruit food snacks"}
    analysis = analyze_rule(rule_fssai, ctx)
    assert analysis.result == UNKNOWN
    assert analysis.relevant_variables == frozenset({"annual_turnover"})

    # Non-food product -> resolves FALSE immediately, turnover never asked!
    ctx_non_food = {"product_description": "Electronics semiconductor chip manufacturing"}
    analysis_non_food = analyze_rule(rule_fssai, ctx_non_food)
    assert analysis_non_food.result == FALSE
    assert analysis_non_food.relevant_variables == frozenset()


def test_karnataka_esdm_regression():
    """Karnataka ESDM pollution consent and WPC wireless rules."""
    kspcb_rule = {
        "rule_id": "RULE-KSPCB-CTE-01",
        "domain": "ELECTRONICS",
        "jurisdiction": "KARNATAKA",
        "condition_ast": {
            "op": "AND",
            "args": [
                {"op": "EQ", "left": {"var": "state"}, "right": "KARNATAKA"},
                {
                    "op": "OR",
                    "args": [
                        {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "ELECTRONIC"},
                        {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "ESDM"},
                        {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "SEMICONDUCTOR"},
                    ],
                },
            ],
        },
    }

    # If state is Karnataka and product is ESDM -> APPLICABLE (TRUE)
    ctx = {"state": "KARNATAKA", "product_description": "ESDM semiconductor fabrication"}
    res = analyze_rule(kspcb_rule, ctx)
    assert res.result == TRUE
    assert res.relevant_variables == frozenset()

    # If state is Gujarat -> FALSE immediately
    ctx_guj = {"state": "GUJARAT", "product_description": "ESDM semiconductor fabrication"}
    res_guj = analyze_rule(kspcb_rule, ctx_guj)
    assert res_guj.result == FALSE
    assert res_guj.relevant_variables == frozenset()


def test_wpc_wireless_or_branches():
    """Central WPC wireless ETA rule with multiple OR branches."""
    wpc_rule = {
        "rule_id": "RULE-WPC-ETA-01",
        "domain": "ELECTRONICS",
        "jurisdiction": "CENTRAL",
        "condition_ast": {
            "op": "OR",
            "args": [
                {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "WIRELESS"},
                {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "BLUETOOTH"},
                {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "WIFI"},
                {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "IOT"},
                {"op": "CONTAINS", "left": {"var": "product_description"}, "right": "RADIO"},
            ],
        },
    }

    # If product mentions Bluetooth -> resolves TRUE immediately
    ctx_bt = {"product_description": "Smart watch with Bluetooth low energy"}
    res_bt = analyze_rule(wpc_rule, ctx_bt)
    assert res_bt.result == TRUE
    assert res_bt.relevant_variables == frozenset()

    # If product is pure mechanical gear -> resolves FALSE
    ctx_gear = {"product_description": "High tensile steel mechanical gears"}
    res_gear = analyze_rule(wpc_rule, ctx_gear)
    assert res_gear.result == FALSE
    assert res_gear.relevant_variables == frozenset()
