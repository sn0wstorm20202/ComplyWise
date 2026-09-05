"""Three-valued logic invariants.

The single most important test file in the foundation. If ``UNKNOWN`` can become
``FALSE``, the product reports "not applicable" for something it simply never
asked about — the exact failure mode PRD_v2.0 §P4 forbids.
"""

from __future__ import annotations

import itertools

import pytest

from common.enums import UNCERTAIN_APPLICABILITY_STATUSES, ApplicabilityStatus
from domain.evaluation import truth
from domain.evaluation.truth import FALSE, TRUE, UNKNOWN, TruthValue

ALL_VALUES = (TRUE, FALSE, UNKNOWN)


def test_boolean_coercion_is_refused():
    """`if value:` must be impossible, not merely discouraged."""
    for value in ALL_VALUES:
        with pytest.raises(TypeError):
            bool(value)
        with pytest.raises(TypeError):
            if value:  # noqa: SIM103
                pass


def test_from_optional_lifts_none_to_unknown():
    assert truth.from_optional(None) is UNKNOWN
    assert truth.from_optional(True) is TRUE
    assert truth.from_optional(False) is FALSE


@pytest.mark.parametrize(
    ("left", "right", "expected"),
    [
        (TRUE, TRUE, TRUE),
        (TRUE, FALSE, FALSE),
        (TRUE, UNKNOWN, UNKNOWN),
        (FALSE, FALSE, FALSE),
        (FALSE, UNKNOWN, FALSE),
        (UNKNOWN, UNKNOWN, UNKNOWN),
    ],
)
def test_conjunction_truth_table(left, right, expected):
    assert truth.and_(left, right) is expected
    assert truth.and_(right, left) is expected  # commutative


@pytest.mark.parametrize(
    ("left", "right", "expected"),
    [
        (TRUE, TRUE, TRUE),
        (TRUE, FALSE, TRUE),
        (TRUE, UNKNOWN, TRUE),
        (FALSE, FALSE, FALSE),
        (FALSE, UNKNOWN, UNKNOWN),
        (UNKNOWN, UNKNOWN, UNKNOWN),
    ],
)
def test_disjunction_truth_table(left, right, expected):
    assert truth.or_(left, right) is expected
    assert truth.or_(right, left) is expected


def test_negation_preserves_unknown():
    assert truth.not_(TRUE) is FALSE
    assert truth.not_(FALSE) is TRUE
    # Not knowing something is not the same as knowing its opposite.
    assert truth.not_(UNKNOWN) is UNKNOWN


def test_unknown_is_never_produced_as_false_by_negation_chains():
    value = UNKNOWN
    for _ in range(5):
        value = truth.not_(value)
        assert value is UNKNOWN


def test_all_of_and_any_of_over_iterables():
    assert truth.all_of([TRUE, TRUE]) is TRUE
    assert truth.all_of([TRUE, UNKNOWN]) is UNKNOWN
    assert truth.all_of([UNKNOWN, FALSE]) is FALSE
    assert truth.any_of([FALSE, UNKNOWN]) is UNKNOWN
    assert truth.any_of([FALSE, FALSE]) is FALSE
    assert truth.any_of([UNKNOWN, TRUE]) is TRUE


def test_empty_conjunction_and_disjunction_are_identities():
    assert truth.all_of([]) is TRUE
    assert truth.any_of([]) is FALSE


def test_no_operator_turns_unknown_input_into_false_output():
    """Exhaustive sweep: with any UNKNOWN present, FALSE requires a real FALSE.

    Kleene conjunction may return FALSE despite an UNKNOWN operand — but only
    because some operand is genuinely FALSE. This asserts no operator manufactures
    a FALSE out of ignorance alone.
    """
    for combo in itertools.product(ALL_VALUES, repeat=3):
        if UNKNOWN not in combo:
            continue
        if truth.all_of(combo) is FALSE:
            assert FALSE in combo
        if truth.any_of(combo) is FALSE:
            assert FALSE in combo

    # With only TRUE and UNKNOWN present, FALSE is unreachable.
    for combo in itertools.product((TRUE, UNKNOWN), repeat=3):
        assert truth.all_of(combo) is not FALSE
        assert truth.any_of(combo) is not FALSE


def test_truth_values_serialise_as_their_names():
    assert str(TRUE) == "TRUE"
    assert TruthValue("UNKNOWN") is UNKNOWN


def test_applicability_statuses_cover_uncertainty_explicitly():
    """The status vocabulary must have somewhere to put "we don't know"."""
    assert set(ApplicabilityStatus.values) == {
        "APPLICABLE",
        "NOT_APPLICABLE",
        "NEEDS_INFORMATION",
        "CONFLICT_REVIEW",
        "UNVERIFIED",
    }
    assert ApplicabilityStatus.NOT_APPLICABLE not in UNCERTAIN_APPLICABILITY_STATUSES
    assert ApplicabilityStatus.NEEDS_INFORMATION in UNCERTAIN_APPLICABILITY_STATUSES
    assert ApplicabilityStatus.CONFLICT_REVIEW in UNCERTAIN_APPLICABILITY_STATUSES
    assert ApplicabilityStatus.UNVERIFIED in UNCERTAIN_APPLICABILITY_STATUSES


@pytest.mark.parametrize(
    ("val", "expected"),
    [
        ("TRUE", TRUE),
        ("FALSE", FALSE),
        ("UNKNOWN", UNKNOWN),
        ("true", TRUE),
        ("false", FALSE),
        ("unknown", UNKNOWN),
        (" True ", TRUE),
        (" false\n", FALSE),
        (True, TRUE),
        (False, FALSE),
        (TRUE, TRUE),
        (FALSE, FALSE),
        (UNKNOWN, UNKNOWN),
    ],
)
def test_to_truth_value_normalization(val, expected):
    assert truth.to_truth_value(val) is expected


@pytest.mark.parametrize(
    "invalid_str",
    ["", "MAYBE", "Trueish", "1", "0", "None", "null", "undefined", "yes", "no"],
)
def test_to_truth_value_invalid_strings_raise_value_error(invalid_str):
    with pytest.raises(ValueError):
        truth.to_truth_value(invalid_str)


@pytest.mark.parametrize(
    "invalid_type",
    [1, 0, 1.0, 0.0, [], [True], {}, {"val": "TRUE"}, object()],
)
def test_to_truth_value_invalid_types_raise_type_error(invalid_type):
    with pytest.raises(TypeError):
        truth.to_truth_value(invalid_type)


def test_string_operands_in_not():
    """Audit Finding A1 regression: string UNKNOWN must never invert to TRUE."""
    assert truth.not_("UNKNOWN") is UNKNOWN
    assert truth.not_("unknown") is UNKNOWN
    assert truth.not_("TRUE") is FALSE
    assert truth.not_("true") is FALSE
    assert truth.not_("FALSE") is TRUE
    assert truth.not_("false") is TRUE


def test_string_operands_in_and():
    """Audit Finding A1 regression: string operands in conjunction."""
    assert truth.and_("TRUE", "UNKNOWN") is UNKNOWN
    assert truth.and_("UNKNOWN", "TRUE") is UNKNOWN
    assert truth.and_("FALSE", "UNKNOWN") is FALSE
    assert truth.and_("UNKNOWN", "FALSE") is FALSE
    assert truth.and_("UNKNOWN", "UNKNOWN") is UNKNOWN
    assert truth.and_("TRUE", "TRUE") is TRUE
    assert truth.and_("TRUE", "FALSE") is FALSE


def test_string_operands_in_or():
    """Audit Finding A1 regression: string operands in disjunction."""
    assert truth.or_("TRUE", "UNKNOWN") is TRUE
    assert truth.or_("UNKNOWN", "TRUE") is TRUE
    assert truth.or_("FALSE", "UNKNOWN") is UNKNOWN
    assert truth.or_("UNKNOWN", "FALSE") is UNKNOWN
    assert truth.or_("UNKNOWN", "UNKNOWN") is UNKNOWN
    assert truth.or_("FALSE", "FALSE") is FALSE


def test_nested_expressions_with_mixed_operand_types():
    """Nested logic combining TruthValue, bool, and string operands."""
    # (TRUE and UNKNOWN) or FALSE -> UNKNOWN or FALSE -> UNKNOWN
    expr1 = truth.or_(truth.and_(TRUE, "UNKNOWN"), False)
    assert expr1 is UNKNOWN

    # not(FALSE or UNKNOWN) -> not(UNKNOWN) -> UNKNOWN
    expr2 = truth.not_(truth.or_("false", UNKNOWN))
    assert expr2 is UNKNOWN

    # (TRUE and TRUE) and (not(FALSE) or UNKNOWN) -> TRUE and (TRUE or UNKNOWN) -> TRUE and TRUE -> TRUE
    expr3 = truth.and_(
        truth.and_("true", True),
        truth.or_(truth.not_("false"), "unknown"),
    )
    assert expr3 is TRUE

    # not((TRUE and UNKNOWN) and TRUE) -> not(UNKNOWN and TRUE) -> not(UNKNOWN) -> UNKNOWN
    expr4 = truth.not_(truth.and_(truth.and_("TRUE", UNKNOWN), True))
    assert expr4 is UNKNOWN

    # (FALSE and UNKNOWN) or (not(TRUE) and UNKNOWN) -> FALSE or (FALSE and UNKNOWN) -> FALSE or FALSE -> FALSE
    expr5 = truth.or_(
        truth.and_("FALSE", "UNKNOWN"),
        truth.and_(truth.not_("TRUE"), "UNKNOWN"),
    )
    assert expr5 is FALSE

