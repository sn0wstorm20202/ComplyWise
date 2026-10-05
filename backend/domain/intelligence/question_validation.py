"""Normalization of historical question responses; the active planner owns gap selection."""

from __future__ import annotations

from typing import Any

from .orchestration import StructuredOutputInvalid
from .question_types import QuestionAnswerType, SmartQuestion

LEGAL_CONCLUSION_TERMS = [
    "triggers mandatory",
    "is legally required",
    "is applicable",
    "must obtain",
    "the company must",
    "the business must",
    "is exempt from",
    "is exempt",
    "mandatory license",
    "mandatory statutory",
    "is illegal",
    "mandates",
    "requires mandatory",
    "triggers",
]


def sanitize_question_reason(reason: str, category: str) -> str:
    """Ensure question reason contains factual/contextual explanation rather than legal conclusions."""

    r_lower = reason.lower()

    for term in LEGAL_CONCLUSION_TERMS:
        if term in r_lower:
            clean_cat = category.strip().lower() if category else "operational"

            return f"This helps determine which {clean_cat} requirements may be relevant to your facility."

    return reason


def validate_and_normalize_questions(raw_questions: list[dict[str, Any]]) -> list[SmartQuestion]:
    """Validate 5-6 question list against quality guards."""

    if not isinstance(raw_questions, list):
        raise StructuredOutputInvalid("Generated questions must be a list.")

    if not (4 <= len(raw_questions) <= 16):
        raise StructuredOutputInvalid(
            f"Generated questions count must be between 5 and 15, received {len(raw_questions)}."
        )

    seen_ids: set[str] = set()

    seen_texts: set[str] = set()

    validated: list[SmartQuestion] = []

    valid_types = {t.value for t in QuestionAnswerType}

    for idx, item in enumerate(raw_questions, start=1):
        if not isinstance(item, dict):
            raise StructuredOutputInvalid(f"Question at index {idx} is not an object.")

        qid = str(item.get("question_id") or f"Q{idx:02d}").strip().upper()

        if qid in seen_ids:
            qid = f"Q{idx:02d}"

        seen_ids.add(qid)

        q_text = str(item.get("question") or "").strip()

        if len(q_text) < 8:
            raise StructuredOutputInvalid(f"Question text too short at index {idx}: '{q_text}'")

        norm_text = q_text.lower().replace(" ", "").replace("?", "")

        if norm_text in seen_texts:
            raise StructuredOutputInvalid(f"Duplicate question detected: '{q_text}'")

        seen_texts.add(norm_text)

        category = str(item.get("category") or "Operations").strip().title()

        raw_type = str(item.get("answer_type") or "TEXT").strip().upper()

        answer_type = raw_type if raw_type in valid_types else QuestionAnswerType.TEXT.value

        required = bool(item.get("required", True))

        raw_options = item.get("options") or []

        options: list[dict[str, str]] = []

        if answer_type in {
            QuestionAnswerType.SINGLE_SELECT.value,
            QuestionAnswerType.MULTI_SELECT.value,
        }:
            if isinstance(raw_options, list):
                for opt in raw_options:
                    if isinstance(opt, dict):
                        val = str(opt.get("value") or opt.get("label") or "").strip()

                        lbl = str(opt.get("label") or opt.get("value") or "").strip()

                        if val:
                            options.append({"value": val, "label": lbl or val})

                    elif isinstance(opt, str) and opt.strip():
                        options.append({"value": opt.strip(), "label": opt.strip()})

            if len(options) < 2:
                # Default generic options for select type if missing

                options = [{"value": "YES", "label": "Yes"}, {"value": "NO", "label": "No"}]

        else:
            options = []

        unit = item.get("unit")

        unit_str = str(unit).strip() if unit and str(unit).strip() else None

        help_text = item.get("help_text")

        help_str = str(help_text).strip() if help_text and str(help_text).strip() else None

        raw_reason = str(
            item.get("reason")
            or "This helps determine which requirements may be relevant to your facility."
        ).strip()

        reason = sanitize_question_reason(raw_reason, category)

        validated.append(
            SmartQuestion(
                question_id=qid,
                question=q_text,
                category=category,
                answer_type=answer_type,
                required=required,
                options=options,
                unit=unit_str,
                help_text=help_str,
                reason=reason,
                order=idx,
            )
        )

    return validated
