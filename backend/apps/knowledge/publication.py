"""Publication gate: dated, executable examples checked by the real AST evaluator."""
from copy import deepcopy
from datetime import date
from domain.rules.ast import validate_ast
from domain.evaluation.evaluator import evaluate_ast


def validate_procedural_metadata(value):
    if not isinstance(value, dict):
        raise ValueError("Reviewed procedural information must be an object.")
    allowed = {"required_documents", "application_steps", "statutory_fee", "validity_period", "deadline_notes"}
    if set(value) - allowed:
        raise ValueError("Unsupported procedural fields. Scope, mandate and jurisdiction changes require a separate knowledge review.")
    for key, entry in value.items():
        if key in {"required_documents", "application_steps"}:
            if not isinstance(entry, list) or len(entry) > 100 or any(not isinstance(item, str) or not item.strip() or len(item) > 2000 for item in entry):
                raise ValueError(f"{key} must contain at most 100 non-empty text entries.")
        elif not isinstance(entry, str) or len(entry) > 4000:
            raise ValueError(f"{key} must be text of at most 4000 characters.")
    return deepcopy(value)


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
