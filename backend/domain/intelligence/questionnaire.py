"""Assessment-scoped compact questionnaire lifecycle.

The onboarding planner selects zero to five unresolved facts. This adapter maps
its typed candidates to the orchestration contract and persists the existing plan
without replacing its dependency metadata. Historical imports are re-exported
for callers and regression tests; they are not the active planning path.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from apps.businesses.models import Business
from apps.onboarding.models import SmartQuestionInstance, SmartQuestionPlan
from domain.providers.registry import get_llm_provider

from .business_understanding import BusinessUnderstandingResult
from .orchestration import AssessmentRun, OrchestrationContext
from .question_fallbacks import (
    generate_emergency_15_questions as generate_emergency_15_questions,
)
from .question_fallbacks import (
    generate_emergency_questions as generate_emergency_questions,
)
from .question_types import (
    QuestionAnswerType as QuestionAnswerType,
)
from .question_types import (
    QuestionOption as QuestionOption,
)
from .question_types import (
    SmartQuestion as SmartQuestion,
)
from .question_validation import (
    sanitize_question_reason as sanitize_question_reason,
)
from .question_validation import (
    validate_and_normalize_questions as validate_and_normalize_questions,
)

logger = logging.getLogger(__name__)


class QuestionnaireEngine:
    """Persist the active compact intake plan for an assessment."""

    def __init__(self, provider: Any = None) -> None:

        self._provider = provider

    def get_provider(self) -> Any:

        if self._provider is not None:
            return self._provider

        return get_llm_provider()

    def generate_questionnaire(self, context, run, understanding=None):
        """Ask 0â€“5 gaps tied to unresolved published rules or source planning."""

        from apps.onboarding.planner import plan_adaptive_smart_questions

        business = Business.objects.get(pk=context.business_id)

        cached = run.stage_metadata.get("question_generation", {})

        if cached.get("question_policy_version") == 5:
            return [SmartQuestion(**q) for q in cached.get("questions", [])]

        plan = plan_adaptive_smart_questions(business, assessment_id=run.run_id)

        questions = []

        for index, item in enumerate(plan.get("questions", [])[:5], 1):
            options = [
                {
                    "value": str(o.get("value", o.get("label", ""))),
                    "label": str(o.get("label", o.get("value", ""))),
                }
                if isinstance(o, dict)
                else {"value": str(o), "label": str(o)}
                for o in item.get("options", [])
            ]

            answer_type = str(item.get("data_type") or item.get("answer_type") or "TEXT").upper()
            from apps.onboarding.question_policy import TYPE_MAP

            answer_type = TYPE_MAP.get(answer_type, answer_type)

            if options and answer_type not in {"BOOLEAN", "MULTI_SELECT"}:
                answer_type = "SINGLE_SELECT"

            questions.append(
                SmartQuestion(
                    question_id=item.get("question_id", f"Q{index:02d}").upper(),
                    question=item["question_text"],
                    category=(item.get("domains") or ["Business details"])[0],
                    answer_type=answer_type,
                    required=True,
                    options=options,
                    reason=item.get("reason")
                    or item.get("why_it_matters")
                    or "Refines a relevant source search.",
                    help_text=item.get("why_it_matters"),
                    unit=item.get("unit"),
                    order=index,
                    variable_key=item.get("variable_key", ""),
                    affected_rules=item.get("source_decision_refs", []),
                    fact_key=item.get("fact_key", ""),
                    reason_code=item.get("reason_code", ""),
                    source_decision_refs=item.get("source_decision_refs", []),
                    already_known=False,
                    suggested_answer=item.get("suggested_answer"),
                    suggested_answer_origin=item.get("suggested_answer_origin", "NONE"),
                )
            )

        self._persist_questionnaire(questions, context, run, understanding)

        return questions

    def _persist_questionnaire(
        self,
        questions: list[SmartQuestion],
        context: OrchestrationContext,
        run: AssessmentRun,
        understanding: BusinessUnderstandingResult | None,
    ) -> None:

        # Always update run metadata first

        try:
            state = dict(run.stage_metadata)

            state["question_generation"] = {
                "questions": [q.to_dict() for q in questions],
                "count": len(questions),
                "question_policy_version": 5,
                "generated_at": time.time(),
            }

            run.stage_metadata = state

            run.save()

            logger.info("Persisted compact questions in metadata for assessment run %s", run.run_id)

        except Exception as meta_exc:
            logger.exception("Could not save questions to run stage_metadata: %s", meta_exc)

        try:
            biz = Business.objects.filter(pk=context.business_id).first()

            if not biz:
                return

            plan, _ = SmartQuestionPlan.objects.get_or_create(
                business=biz,
                assessment=run.assessment,
                defaults={
                    "status": "ACTIVE",
                    "business_summary": understanding.primary_activity
                    if understanding
                    else context.raw_business_description,
                    "regulatory_search_intent": {
                        "domains": understanding.likely_regulatory_domains if understanding else [],
                    },
                    "information_gaps": understanding.important_unknowns if understanding else [],
                },
            )

            # Planner owns persisted instances; do not delete its dependency metadata.
            if plan.questions.exists():
                for q in questions:
                    plan.questions.filter(variable_key=q.variable_key).update(
                        question_id=q.question_id
                    )
                return

            # Persist each question instance

            SmartQuestionInstance.objects.filter(plan=plan).delete()

            instances = []

            for q in questions:
                instances.append(
                    SmartQuestionInstance(
                        plan=plan,
                        business=biz,
                        question_id=q.question_id,
                        variable_key=q.variable_key or q.question_id.lower(),
                        question_text=q.question,
                        why_it_matters=q.help_text or "",
                        reason=q.reason,
                        expected_discovery_impact=q.reason,
                        domains=[q.category],
                        data_type=q.answer_type,
                        options=q.options,
                        unit=q.unit or "",
                        priority="HIGH",
                        is_answered=False,
                    )
                )

            SmartQuestionInstance.objects.bulk_create(instances)

            logger.info(
                "Persisted compact questions to SmartQuestionPlan for assessment run %s", run.run_id
            )

        except Exception as p_exc:
            logger.exception("Could not persist question set to database: %s", p_exc)
