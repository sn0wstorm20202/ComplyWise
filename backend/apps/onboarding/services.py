"""Dynamic Onboarding & Smart Questions Service.

Authority: Milestone Task — Part A, Part B; PRD_v2.0 §10.3, §10.4, §11; TRD_v2.0 §8, §12.

100% DATA-DRIVEN:
- Identifies missing decision-critical variables directly from published rules in the knowledge base.
- Integrates with SmartQuestionPlanner for AI-assisted question planning and ranking.
- Questions ask only what can materially alter the compliance outcome.
- Answers create immutable BusinessProfileVersion records preserving provenance.
"""

from __future__ import annotations

from typing import Any

from common.enums import KnowledgeStatus, VariableOrigin
from domain.rules.ast import CLASSIFICATION_OPS
from domain.jurisdictions.resolver import normalize_jurisdiction
from domain.profile.variables import (
    PROFILE_VARIABLES,
    Relevance,
    coerce_value,
    get_variable,
    resolve_variable_options,
)
from apps.accounts.models import User
from apps.businesses.models import Business, BusinessProfileVersion
from apps.knowledge.models import RuleVersion
from apps.onboarding.models import SmartQuestionInstance, SmartQuestionPlan
from apps.onboarding.planner import plan_adaptive_smart_questions

#: The profile variable holding the user's free-text activity description.
ACTIVITY_TEXT_VARIABLE = "product_description"

#: Operators whose right operand is a literal term matched against free text.
TEXT_MATCH_OPERATORS = CLASSIFICATION_OPS


def get_dynamic_smart_questions(
    business: Business,
    round_number: int = 1,
    assessment_id: str | None = None,
    batch_size: int | None = None,
) -> dict[str, Any]:
    """Generate dynamic smart questions for decision-critical missing variables.

    Uses SmartQuestionPlanner to assess candidate published rules and formulate
    adaptive questions tailored to the business and assessment.
    """
    return plan_adaptive_smart_questions(
        business,
        round_number=round_number,
        assessment_id=assessment_id,
        batch_size=batch_size,
    )


def get_next_smart_question(
    business: Business,
    assessment_id: str | None = None,
) -> dict[str, Any] | None:
    """Retrieve the single highest-value decision-relevant question needed next."""
    from apps.onboarding.planner import get_next_adaptive_question
    return get_next_adaptive_question(business, assessment_id=assessment_id)


def submit_sequential_smart_question_answer(
    *,
    business: Business,
    variable_key: str,
    answer_value: Any,
    user: User | None = None,
    assessment_id: str | None = None,
) -> dict[str, Any]:
    """Execute true sequential adaptive loop:
    Answer -> Save immutable BusinessProfileVersion -> Re-evaluate AST rules -> Next question.
    """
    new_profile = save_smart_question_answers(
        business=business,
        answers={variable_key: answer_value},
        user=user,
        assessment_id=assessment_id,
        change_note=f"Sequential adaptive answer for '{variable_key}'",
    )
    next_q = get_next_smart_question(business, assessment_id=assessment_id)
    return {
        "profile_version": new_profile.version,
        "answered_variable": variable_key,
        "next_question": next_q,
        "question": next_q,
        "is_complete": (next_q is None),
    }


def save_smart_question_answers(
    *,
    business: Business,
    answers: dict[str, Any],
    user: User | None = None,
    assessment_id: str | None = None,
    change_note: str = "Smart questions answered during onboarding",
) -> BusinessProfileVersion:
    """Save answered variables into a new immutable BusinessProfileVersion."""
    cleaned_entries: dict[str, dict[str, Any]] = {}

    for key, raw_value in answers.items():
        if raw_value is None or (isinstance(raw_value, str) and not raw_value.strip()):
            continue
        var_def = get_variable(key)
        if var_def is not None:
            coerced = coerce_value(var_def, raw_value)
            if coerced is None:
                continue
            if var_def.key == "state" and isinstance(coerced, str):
                canonical = normalize_jurisdiction(coerced)
                if canonical:
                    coerced = canonical

            val_to_store = str(coerced) if var_def.data_type in {"DECIMAL", "CURRENCY_INR"} else coerced
            cleaned_entries[var_def.key] = BusinessProfileVersion.build_entry(
                value=val_to_store,
                origin=VariableOrigin.USER_PROVIDED,
            )
        else:
            # Dynamic discovery context field (non-canonical)
            cleaned_entries[key] = BusinessProfileVersion.build_entry(
                value=raw_value,
                origin=VariableOrigin.USER_PROVIDED,
            )

        # Mark corresponding SmartQuestionInstance as answered
        SmartQuestionInstance.objects.filter(
            business=business,
            variable_key=key,
            is_answered=False,
        ).update(is_answered=True, answer_value=raw_value)

    if not cleaned_entries:
        current = business.current_profile
        if current:
            if assessment_id:
                assessment = business.assessments.filter(pk=assessment_id).first()
                if assessment and not assessment.profile_version:
                    assessment.profile_version = current
                    assessment.save(update_fields=["profile_version", "updated_at"])
            return current

    # Carry forward existing variables from the current version
    current_profile = business.current_profile
    next_version = (current_profile.version + 1) if current_profile else 1
    merged_variables: dict[str, dict[str, Any]] = dict(current_profile.variables) if current_profile else {}
    merged_variables.update(cleaned_entries)

    new_profile = BusinessProfileVersion.objects.create(
        business=business,
        version=next_version,
        variables=merged_variables,
        change_note=change_note,
        created_by=user,
    )

    # Link profile version to assessment if passed
    if assessment_id:
        assessment = business.assessments.filter(pk=assessment_id).first()
        if assessment:
            assessment.profile_version = new_profile
            state = dict(assessment.step_state or {})
            state.setdefault("answers", {})
            state["answers"].update(answers)
            if "discovery_context" not in state:
                state["discovery_context"] = {}
            for k, v in answers.items():
                if get_variable(k) is None:
                    state["discovery_context"][k] = v
            assessment.step_state = state
            if assessment.current_step < 5:
                assessment.current_step = 5
            assessment.save(update_fields=["profile_version", "step_state", "current_step", "updated_at"])

    # Check active question plans and mark completed if all questions answered
    for plan in SmartQuestionPlan.objects.filter(business=business, status="ACTIVE"):
        unanswered_count = plan.questions.filter(is_answered=False).count()
        if unanswered_count == 0:
            plan.status = "COMPLETED"
            plan.stopping_reason = "ALL_ROUND_QUESTIONS_ANSWERED"
            plan.save(update_fields=["status", "stopping_reason"])

    return new_profile


def _collect_text_probes(node: Any, variable_key: str) -> set[str]:
    """Collect the literal strings a rule AST tests `variable_key` against."""
    probes: set[str] = set()
    if isinstance(node, dict):
        if node.get("op") in TEXT_MATCH_OPERATORS:
            left = node.get("left")
            right = node.get("right")
            if isinstance(left, dict) and left.get("var") == variable_key and isinstance(right, str):
                cleaned = right.strip()
                if cleaned:
                    probes.add(cleaned)
        for value in node.values():
            probes.update(_collect_text_probes(value, variable_key))
    elif isinstance(node, list):
        for item in node:
            probes.update(_collect_text_probes(item, variable_key))
    return probes


def detect_activity_keywords(text: str) -> list[str]:
    """Report which published-knowledge activity terms occur in the user's text."""
    haystack = text.upper()

    probes: set[str] = set()
    for rule in RuleVersion.objects.filter(status=KnowledgeStatus.PUBLISHED).only("condition_ast"):
        probes.update(_collect_text_probes(rule.condition_ast, ACTIVITY_TEXT_VARIABLE))

    # Longest-first so a match on "AUTOMOTIVE" is not also reported as "AUTO".
    matched: list[str] = []
    for probe in sorted(probes, key=lambda p: (-len(p), p)):
        upper = probe.upper()
        if upper in haystack and not any(upper in seen for seen in matched):
            matched.append(upper)

    return sorted(matched)


def save_products_and_activities(
    *,
    business: Business,
    product_description: str,
    import_export_intent: str | None = None,
    user: User | None = None,
    assessment_id: str | None = None,
) -> dict[str, Any]:
    """Persist user's natural-language product/activity input and return detected hints."""
    answers: dict[str, Any] = {
        "product_description": product_description.strip(),
    }
    if import_export_intent:
        answers["import_export_intent"] = import_export_intent.strip()

    new_profile = save_smart_question_answers(
        business=business,
        answers=answers,
        user=user,
        assessment_id=assessment_id,
        change_note="Products and activities updated",
    )
    detected_tags = detect_activity_keywords(product_description)

    if assessment_id:
        assessment = business.assessments.filter(pk=assessment_id).first()
        if assessment:
            state = dict(assessment.step_state)
            state["product_description"] = product_description.strip()
            if import_export_intent:
                state["import_export_intent"] = import_export_intent.strip()
            assessment.step_state = state
            if assessment.current_step < 4:
                assessment.current_step = 4
            assessment.save(update_fields=["step_state", "current_step", "updated_at"])

    return {
        "profile_version": new_profile.version,
        "product_description": product_description.strip(),
        "import_export_intent": import_export_intent,
        "detected_activities": detected_tags,
    }
