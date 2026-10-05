"""Negative business activities must not become positive discovery terms."""

import pytest

from domain.context.activity_text import strip_negations


@pytest.mark.parametrize(
    ("description", "expected"),
    [
        ("", ""),
        ("Software consulting and data hosting", "Software consulting and data hosting"),
        ("No physical manufacturing; software consulting", "; software consulting"),
        ("Does not store chemicals. General warehousing", ". General warehousing"),
        ("Without industrial boilers\nFood preparation", "Food preparation"),
    ],
)
def test_negative_activity_clauses_preserve_separate_positive_operations(description, expected):
    assert " ".join(strip_negations(description).split()) == expected
