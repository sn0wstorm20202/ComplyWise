"""Deterministic evaluation (TRD_v2.0 §13-§17).

`truth` provides the three-valued primitives and is live from Task 1 because
`UNKNOWN` must never degrade to `FALSE`. The AST evaluator, precedence
resolution and explanation-trace builder arrive in Task 2.
"""

from .truth import FALSE, TRUE, UNKNOWN, TruthValue, and_, any_of, all_of, from_optional, not_, or_, to_truth_value

__all__ = [
    "TruthValue",
    "TRUE",
    "FALSE",
    "UNKNOWN",
    "and_",
    "or_",
    "not_",
    "all_of",
    "any_of",
    "from_optional",
    "to_truth_value",
]
