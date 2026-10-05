"""Structured question and answer contracts shared by intake and interpretation."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from enum import StrEnum
from typing import Any


class QuestionAnswerType(StrEnum):
    TEXT = "TEXT"

    NUMBER = "NUMBER"

    BOOLEAN = "BOOLEAN"

    SINGLE_SELECT = "SINGLE_SELECT"

    MULTI_SELECT = "MULTI_SELECT"

    DATE = "DATE"

    CURRENCY = "CURRENCY"

    PERCENTAGE = "PERCENTAGE"


@dataclass
class QuestionOption:
    value: str

    label: str

    def to_dict(self) -> dict[str, str]:

        return {"value": self.value, "label": self.label}


@dataclass
class SmartQuestion:
    question_id: str

    question: str

    category: str

    answer_type: str

    required: bool

    options: list[dict[str, str]] = field(default_factory=list)

    unit: str | None = None

    help_text: str | None = None

    reason: str = ""

    order: int = 1

    variable_key: str = ""

    affected_rules: list[str] = field(default_factory=list)
    fact_key: str = ""
    reason_code: str = ""
    source_decision_refs: list[str] = field(default_factory=list)
    already_known: bool = False
    suggested_answer: Any = None
    suggested_answer_origin: str = "NONE"

    def to_dict(self) -> dict[str, Any]:

        return asdict(self)

    def to_frontend_dict(self) -> dict[str, Any]:
        """User-safe frontend representation without internal model or strategy leaks."""

        return {
            "question_id": self.question_id,
            "question": self.question,
            "category": self.category,
            "answer_type": self.answer_type,
            "required": self.required,
            "options": self.options,
            "unit": self.unit,
            "help_text": self.help_text,
            "reason": self.reason,
            "order": self.order,
            "variable_key": self.variable_key,
            "affected_rules": self.affected_rules,
            "fact_key": self.fact_key,
            "reason_code": self.reason_code,
            "source_decision_refs": self.source_decision_refs,
            "already_known": self.already_known,
            "suggested_answer": self.suggested_answer,
            "suggested_answer_origin": self.suggested_answer_origin,
        }
