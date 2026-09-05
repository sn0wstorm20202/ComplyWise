"""Three-valued evaluation primitives.

Authority: PRD_v2.0 §17.3 / §P4, TRD_v2.0 §13, §84 invariant 2.

This module exists in Task 1, before the evaluator itself, because
``UNKNOWN -> FALSE`` is the failure mode that would quietly destroy the
product's core promise. Anything that needs boolean logic over profile data
must route through here rather than using Python's ``and``/``or``, which treat
"missing" as falsey.

Truth tables::

    TRUE  AND TRUE    -> TRUE      TRUE  OR UNKNOWN -> TRUE
    TRUE  AND FALSE   -> FALSE     FALSE OR UNKNOWN -> UNKNOWN
    TRUE  AND UNKNOWN -> UNKNOWN   NOT TRUE         -> FALSE
    FALSE AND UNKNOWN -> FALSE     NOT UNKNOWN      -> UNKNOWN
"""

from __future__ import annotations

from enum import StrEnum
from typing import Any, Iterable


class TruthValue(StrEnum):
    TRUE = "TRUE"
    FALSE = "FALSE"
    UNKNOWN = "UNKNOWN"

    def __bool__(self) -> bool:  # pragma: no cover - guard, not behaviour
        """Refuse implicit truthiness.

        ``if value:`` on an UNKNOWN would silently mean "not applicable". Callers
        must compare explicitly, e.g. ``value is TruthValue.TRUE``.
        """
        raise TypeError(
            "TruthValue must not be used in a boolean context. "
            "Compare explicitly against TruthValue.TRUE / FALSE / UNKNOWN."
        )


TRUE = TruthValue.TRUE
FALSE = TruthValue.FALSE
UNKNOWN = TruthValue.UNKNOWN


def to_truth_value(value: Any) -> TruthValue:
    """Normalize supported representations to canonical TruthValue.

    Preserves strict typing:
    - TruthValue: returned directly.
    - bool: True -> TRUE, False -> FALSE.
    - str: "TRUE" -> TRUE, "FALSE" -> FALSE, "UNKNOWN" -> UNKNOWN (case-insensitive, trimmed).
    - Invalid strings raise ValueError.
    - All other types (int, float, list, dict, None, etc.) raise TypeError to prevent
      silent coercion.
    """
    if isinstance(value, TruthValue):
        return value
    if isinstance(value, bool):
        return TRUE if value else FALSE
    if isinstance(value, str):
        cleaned = value.strip().upper()
        if cleaned == "TRUE":
            return TRUE
        if cleaned == "FALSE":
            return FALSE
        if cleaned == "UNKNOWN":
            return UNKNOWN
        raise ValueError(
            f"Invalid truth value representation: {value!r}. "
            "Expected 'TRUE', 'FALSE', or 'UNKNOWN'."
        )
    raise TypeError(
        f"Unsupported operand type for TruthValue: {type(value).__name__}. "
        "Expected TruthValue, bool, or canonical string ('TRUE', 'FALSE', 'UNKNOWN')."
    )


def from_optional(value: bool | None | TruthValue | str) -> TruthValue:
    """Lift an optional boolean or value. `None` means "we were not told", not "no"."""
    if value is None:
        return UNKNOWN
    return to_truth_value(value)


def and_(*values: TruthValue | str | bool) -> TruthValue:
    """Kleene conjunction. One FALSE decides the result; otherwise UNKNOWN wins."""
    seen_unknown = False
    for raw in values:
        val = to_truth_value(raw)
        if val == FALSE:
            return FALSE
        if val == UNKNOWN:
            seen_unknown = True
    return UNKNOWN if seen_unknown else TRUE


def or_(*values: TruthValue | str | bool) -> TruthValue:
    """Kleene disjunction. One TRUE decides the result; otherwise UNKNOWN wins."""
    seen_unknown = False
    for raw in values:
        val = to_truth_value(raw)
        if val == TRUE:
            return TRUE
        if val == UNKNOWN:
            seen_unknown = True
    return UNKNOWN if seen_unknown else FALSE


def not_(value: TruthValue | str | bool) -> TruthValue:
    """Kleene negation. NOT UNKNOWN remains UNKNOWN."""
    val = to_truth_value(value)
    if val == UNKNOWN:
        return UNKNOWN
    return FALSE if val == TRUE else TRUE


def all_of(values: Iterable[TruthValue | str | bool]) -> TruthValue:
    return and_(*values)


def any_of(values: Iterable[TruthValue | str | bool]) -> TruthValue:
    return or_(*values)
