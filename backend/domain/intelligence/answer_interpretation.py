"""Answer Collection & Structured Interpretation for ComplyWise Assessment Orchestration.

Authority: Milestone Step 02 Specification; PRD_v2.0 §10, §11; TRD_v2.0 §4, §8, §30.

Guarantees:
1. Validates, type-coerces, and persists user answers one-by-one or in batch.
2. Answering questions does NOT trigger question regeneration or unnecessary paid LLM calls.
3. Structured answer interpretation extracts factual compliance attributes:
   - Numerical thresholds (workers, load, investment, turnover, capacity)
   - Boolean flags (contract labor, hazardous waste, DG set, EPR plastic, export)
   - Categorical choices (siting, clinker/food/electronics processes)
4. Fact extraction only: strictly NEVER declares legal applicability or statutory conclusions.
"""

from __future__ import annotations

import json
import logging
import re
import time
from decimal import Decimal
from typing import Any

from django.conf import settings

from apps.businesses.models import Business
from apps.onboarding.models import SmartQuestionInstance, SmartQuestionPlan
from domain.providers.base import ChatMessage, ProviderError
from domain.providers.registry import get_llm_provider
from domain.intelligence.orchestration import (
    AssessmentRun,
    OrchestrationError,
    StageInputInvalid,
    StructuredOutputInvalid,
)
from domain.intelligence.questionnaire import QuestionAnswerType, SmartQuestion

logger = logging.getLogger(__name__)


def coerce_and_validate_answer(
    answer_type: str,
    raw_val: Any,
    options: list[dict[str, str]] | None = None,
) -> Any:
    """Type-coerce and validate an answer according to its QuestionAnswerType."""
    if raw_val is None:
        raise StageInputInvalid("Answer value cannot be null.")

    user_explanation: str | None = None
    target_val = raw_val
    if isinstance(raw_val, dict) and "value" in raw_val:
        target_val = raw_val.get("value")
        expl = raw_val.get("explanation")
        if expl and str(expl).strip():
            user_explanation = str(expl).strip()

    if target_val is None:
        raise StageInputInvalid("Answer value cannot be null.")

    atype = answer_type.upper()
    validated_val: Any = None

    if atype == QuestionAnswerType.BOOLEAN.value:
        if isinstance(target_val, bool):
            validated_val = target_val
        else:
            s = str(target_val).strip().lower()
            if s in {"true", "yes", "y", "1"}:
                validated_val = True
            elif s in {"false", "no", "n", "0"}:
                validated_val = False
            else:
                raise StageInputInvalid(f"Invalid boolean value: '{target_val}'. Expected True or False.")

    elif atype in {QuestionAnswerType.NUMBER.value, QuestionAnswerType.PERCENTAGE.value}:
        if options:
            valid_vals = {str(opt.get("value", "")).strip().upper() for opt in options if isinstance(opt, dict)}
            valid_labels = {str(opt.get("label", "")).strip().upper() for opt in options if isinstance(opt, dict)}
            if str(target_val).strip().upper() in valid_vals or str(target_val).strip().upper() in valid_labels:
                validated_val = str(target_val).strip()
        if validated_val is None:
            try:
                # Strip commas or unit suffixes
                cleaned = re.sub(r"[^\d.-]", "", str(target_val)).strip()
                num = float(cleaned)
                if atype == QuestionAnswerType.PERCENTAGE.value:
                    if num < 0 or num > 100:
                        raise StageInputInvalid(f"Percentage must be between 0 and 100: {num}")
                validated_val = int(num) if num.is_integer() else num
            except (ValueError, TypeError) as exc:
                if str(target_val).strip():
                    validated_val = str(target_val).strip()
                else:
                    raise StageInputInvalid(f"Invalid number: '{target_val}'") from exc

    elif atype == QuestionAnswerType.CURRENCY.value:
        try:
            cleaned = re.sub(r"[^\d.-]", "", str(target_val)).strip()
            num = float(cleaned)
            validated_val = int(num) if num.is_integer() else num
        except (ValueError, TypeError) as exc:
            if str(target_val).strip():
                validated_val = str(target_val).strip()
            else:
                raise StageInputInvalid(f"Invalid currency amount: '{target_val}'") from exc

    elif atype == QuestionAnswerType.SINGLE_SELECT.value:
        str_val = str(target_val).strip()
        if options:
            valid_vals = {str(opt.get("value", "")).strip().upper() for opt in options if isinstance(opt, dict)}
            valid_labels = {str(opt.get("label", "")).strip().upper() for opt in options if isinstance(opt, dict)}
            if str_val.upper() in valid_vals:
                validated_val = str_val
            else:
                for opt in options:
                    if isinstance(opt, dict) and str(opt.get("label", "")).strip().upper() == str_val.upper():
                        validated_val = opt.get("value")
                        break
            if validated_val is None:
                if not str_val:
                    raise StageInputInvalid("Selected option cannot be empty.")
                validated_val = str_val
        else:
            validated_val = str_val

    elif atype == QuestionAnswerType.MULTI_SELECT.value:
        if isinstance(target_val, list):
            vals = [str(v).strip() for v in target_val if str(v).strip()]
        else:
            vals = [str(target_val).strip()]
        if not vals:
            raise StageInputInvalid("Multi-select value cannot be empty.")
        validated_val = vals

    else:
        # TEXT / DATE / other
        s = str(target_val).strip()
        if not s:
            raise StageInputInvalid("Text answer cannot be empty.")
        validated_val = s

    if user_explanation:
        return {"value": validated_val, "explanation": user_explanation}
    return validated_val


class AnswerInterpreter:
    """Manages answer ingestion, persistence, and structured fact extraction."""

    def record_answer(
        self,
        run: AssessmentRun,
        question_id: str,
        raw_value: Any,
    ) -> dict[str, Any]:
        """Record an answer for a specific question without making an LLM call."""
        qid = question_id.strip().upper()

        # Find question definition in stage metadata or database
        q_meta = run.stage_metadata.get("question_generation", {}).get("questions", [])
        matched_q = next((q for q in q_meta if q.get("question_id") == qid), None)
        if not matched_q:
            digits = re.sub(r"\D", "", qid)
            alt_qid = f"Q{int(digits):02d}" if digits.isdigit() else qid
            matched_q = next((q for q in q_meta if q.get("question_id") == alt_qid), None)

        plan = SmartQuestionPlan.objects.filter(assessment=run.assessment).first()
        inst = None
        if plan:
            inst = SmartQuestionInstance.objects.filter(plan=plan, question_id=qid).first()
            if not inst:
                digits = re.sub(r"\D", "", qid)
                alt_qid = f"Q{int(digits):02d}" if digits.isdigit() else qid
                inst = SmartQuestionInstance.objects.filter(plan=plan, question_id=alt_qid).first()

        answer_type = (inst.data_type if inst and inst.data_type else None) or (matched_q.get("answer_type") if matched_q else "TEXT")
        options = (inst.options if inst and inst.options else None) or (matched_q.get("options") if matched_q else [])

        normalized_value = coerce_and_validate_answer(answer_type, raw_value, options)

        # Update database SmartQuestionInstance if it exists
        plan = SmartQuestionPlan.objects.filter(assessment=run.assessment).first()
        if plan:
            inst = SmartQuestionInstance.objects.filter(plan=plan, question_id=qid).first()
            if inst:
                inst.is_answered = True
                inst.answer_value = normalized_value
                inst.status = "ANSWERED"
                inst.save(update_fields=["is_answered", "answer_value", "status"])

        # Update run state answers
        state = dict(run.stage_metadata)
        answers = dict(state.get("answers") or {})
        answers[qid] = normalized_value
        state["answers"] = answers
        run.stage_metadata = state
        run.save()

        # Calculate progress
        total_questions = len(q_meta) or 15
        answered_count = len(answers)
        is_complete = answered_count >= total_questions

        # Find next unanswered question
        next_q = None
        for q in q_meta:
            if q.get("question_id") not in answers:
                next_q = q
                break

        return {
            "question_id": qid,
            "saved_value": normalized_value,
            "answered_count": answered_count,
            "total_questions": total_questions,
            "is_complete": is_complete,
            "next_question": next_q,
        }

    def interpret_answers_to_facts(
        self,
        questions: list[dict[str, Any]],
        answers: dict[str, Any],
    ) -> list[dict[str, Any]]:
        """Extract structured facts from accumulated answers (Deterministic + Pattern Normalization).

        Guarantees:
        - Extracts factual business attributes with origin tracking.
        - Strict fact extraction only (no legal conclusions).
        """
        extracted_facts: list[dict[str, Any]] = []

        q_by_id = {q.get("question_id"): q for q in questions if isinstance(q, dict)}

        for qid, val in answers.items():
            actual_val = val
            user_explanation = None
            if isinstance(val, dict) and "value" in val:
                actual_val = val.get("value")
                user_explanation = val.get("explanation")

            if user_explanation:
                extracted_facts.append({
                    "key": f"{qid.lower()}_user_note",
                    "value": user_explanation,
                    "source": "USER_EXPLANATION",
                    "confidence": "EXPLICIT",
                })

            q_info = q_by_id.get(qid, {})
            q_text = (q_info.get("question") or "").lower()
            category = (q_info.get("category") or "").lower()

            # Connected Power Load
            if "connected" in q_text and ("load" in q_text or "power" in q_text or "hp" in q_text):
                try:
                    num_val = float(str(val).replace(",", "").strip())
                    extracted_facts.append({
                        "key": "connected_power_load",
                        "value": num_val,
                        "source": "USER_ANSWER",
                        "confidence": "EXPLICIT",
                    })
                except Exception:
                    pass

            # Total Workforce
            elif "total" in q_text and ("employee" in q_text or "worker" in q_text or "staff" in q_text or "workforce" in q_text):
                try:
                    str_v = str(actual_val).upper()
                    if "BELOW_10" in str_v or "<10" in str_v or "1 TO 9" in str_v:
                        num_val = 5
                    elif "10_TO_19" in str_v or "10-19" in str_v or "10 TO 19" in str_v:
                        num_val = 15
                    elif "20_TO_49" in str_v or "20-49" in str_v:
                        num_val = 30
                    elif "50_PLUS" in str_v or "50+" in str_v:
                        num_val = 60
                    else:
                        num_val = int(float(str(actual_val).replace(",", "").strip()))
                    extracted_facts.append({
                        "key": "total_worker_count",
                        "value": num_val,
                        "source": "USER_ANSWER",
                        "confidence": "EXPLICIT",
                    })
                except Exception:
                    pass

            # Contract Labor
            elif "contract" in q_text and ("worker" in q_text or "labor" in q_text or "labour" in q_text):
                b_val = bool(val)
                extracted_facts.append({
                    "key": "has_contract_workers",
                    "value": b_val,
                    "source": "USER_ANSWER",
                    "confidence": "EXPLICIT",
                })

            # Plant & Machinery Investment
            elif ("plant" in q_text or "machinery" in q_text or "equipment" in q_text) and "investment" in q_text:
                try:
                    num_val = float(str(val).replace(",", "").strip())
                    extracted_facts.append({
                        "key": "plant_machinery_investment",
                        "value": num_val,
                        "source": "USER_ANSWER",
                        "confidence": "EXPLICIT",
                    })
                except Exception:
                    pass

            # Turnover
            elif "turnover" in q_text or "revenue" in q_text:
                try:
                    str_v = str(actual_val).upper()
                    if "UP_TO_12_LAKHS" in str_v:
                        num_val = 1_000_000.0
                    elif "BELOW_20_LAKHS" in str_v:
                        num_val = 1_500_000.0
                    elif "12_LAKHS_TO_20_CRORE" in str_v or "20_LAKHS_TO_1_5_CRORE" in str_v:
                        num_val = 15_000_000.0
                    elif "ABOVE_20_CRORE" in str_v:
                        num_val = 250_000_000.0
                    else:
                        num_val = float(str(actual_val).replace(",", "").strip())
                    extracted_facts.append({
                        "key": "annual_turnover",
                        "value": num_val,
                        "source": "USER_ANSWER",
                        "confidence": "EXPLICIT",
                    })
                except Exception:
                    pass

            # Siting / Industrial Estate
            elif "industrial" in q_text and ("estate" in q_text or "zone" in q_text or "premises" in q_text or "where" in q_text):
                extracted_facts.append({
                    "key": "industrial_zone_status",
                    "value": str(val),
                    "source": "USER_ANSWER",
                    "confidence": "EXPLICIT",
                })

            # DG Set Captive Power
            elif "generator" in q_text or "dg set" in q_text:
                extracted_facts.append({
                    "key": "operates_dg_set",
                    "value": bool(val),
                    "source": "USER_ANSWER",
                    "confidence": "EXPLICIT",
                })

            # Hazardous Waste
            elif "hazardous" in q_text and ("waste" in q_text or "sludge" in q_text or "spent" in q_text):
                extracted_facts.append({
                    "key": "hazardous_waste_generation",
                    "value": bool(val),
                    "source": "USER_ANSWER",
                    "confidence": "EXPLICIT",
                })

            # Trade / Import / Export Scope
            elif "trade" in q_text or "export" in q_text or "cross-border" in q_text or "import" in q_text:
                str_val = str(val).upper()
                is_exp = "EXPORT" in str_val or val is True
                is_imp = "IMPORT" in str_val
                trade_intent = "IMPORT_AND_EXPORT" if (is_exp and is_imp) else ("EXPORT_ONLY" if is_exp else ("IMPORT_ONLY" if is_imp else "DOMESTIC_ONLY"))
                extracted_facts.append({
                    "key": "trade_intent",
                    "value": trade_intent,
                    "source": "USER_ANSWER",
                    "confidence": "EXPLICIT",
                })
                extracted_facts.append({
                    "key": "export_intent",
                    "value": is_exp,
                    "source": "USER_ANSWER",
                    "confidence": "EXPLICIT",
                })

            # Plastic Packaging / EPR
            elif "plastic" in q_text or "packaging" in q_text or "epr" in q_text:
                extracted_facts.append({
                    "key": "plastic_packaging_used",
                    "value": bool(val),
                    "source": "USER_ANSWER",
                    "confidence": "EXPLICIT",
                })

            # Effluent / Water Consumption
            elif "effluent" in q_text or "water" in q_text or "discharge" in q_text or "etp" in q_text:
                if isinstance(val, (int, float)):
                    extracted_facts.append({
                        "key": "daily_water_consumption_kld",
                        "value": float(val),
                        "source": "USER_ANSWER",
                        "confidence": "EXPLICIT",
                    })
                extracted_facts.append({
                    "key": "effluent_generation",
                    "value": bool(val) if isinstance(val, bool) else (val != "0" and val != 0),
                    "source": "USER_ANSWER",
                    "confidence": "EXPLICIT",
                })

            # Boiler
            elif "boiler" in q_text or "steam" in q_text:
                extracted_facts.append({
                    "key": "operates_boiler",
                    "value": bool(val),
                    "source": "USER_ANSWER",
                    "confidence": "EXPLICIT",
                })

            # Generic fallback fact tracking
            extracted_facts.append({
                "key": f"answer_{qid.lower()}",
                "value": val,
                "source": "USER_ANSWER",
                "confidence": "EXPLICIT",
            })

        return extracted_facts
