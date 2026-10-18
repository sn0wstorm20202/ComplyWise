"""Publication gate: dated, executable examples checked by the real AST evaluator."""
from copy import deepcopy
from datetime import date
from domain.rules.ast import validate_ast
from domain.evaluation.evaluator import evaluate_ast


def validate_publication(ast, effective_from, effective_until, examples):
    ast = deepcopy(ast)
    validate_ast(ast)
    try:
        start = date.fromisoformat(str(effective_from))
        end = date.fromisoformat(str(effective_until)) if effective_until else None
    except ValueError as exc:
        raise ValueError("A valid effective-from date is required; use YYYY-MM-DD.") from exc
    if end and end < start:
        raise ValueError("Effective-until must not precede effective-from.")
    if not isinstance(examples, list) or not 3 <= len(examples) <= 100:
        raise ValueError("Supply 3–100 executable examples including positive, negative and missing-fact cases.")
    kinds = set()
    def variables(node):
        if isinstance(node, dict):
            return ({node["var"]} if isinstance(node.get("var"), str) else set()).union(*(variables(v) for v in node.values()))
        if isinstance(node, list):
            return set().union(*(variables(v) for v in node))
        return set()
    required_variables = variables(ast)
    checked = []
    for example in examples:
        if not isinstance(example, dict) or not isinstance(example.get("facts"), dict):
            raise ValueError("Every example needs a facts object.")
        kind = example.get("kind")
        expected = example.get("expected_truth")
        if not isinstance(kind, str) or kind not in {"positive", "negative", "missing"}:
            raise ValueError("Example kind must be positive, negative or missing.")
        if not isinstance(expected, str) or expected not in {"TRUE", "FALSE", "UNKNOWN"}:
            raise ValueError("Example expected_truth must be TRUE, FALSE or UNKNOWN.")
        truth, trace = evaluate_ast(deepcopy(ast), example["facts"])
        if str(truth) != expected:
            raise ValueError(f"Example {len(checked) + 1} failed: expected {expected}, evaluated {truth}.")
        if kind == "positive" and expected != "TRUE":
            raise ValueError("A positive example must evaluate TRUE.")
        if kind == "negative" and expected != "FALSE":
            raise ValueError("A negative example must evaluate FALSE.")
        if kind == "missing" and not any(example["facts"].get(key) is None for key in required_variables):
            raise ValueError("The missing-fact example must omit a variable used by the rule.")
        kinds.add(kind)
        checked.append({"kind":kind, "facts":example["facts"], "expected_truth":expected})
    if not {"positive", "negative", "missing"}.issubset(kinds):
        raise ValueError("Positive, negative and missing-fact examples are required.")
    return ast, start, end, checked
