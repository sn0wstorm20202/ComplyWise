"""Safe LLM Telemetry, Usage Tracking, and Cost Guardrails.

Tracks model invocations, token consumption, prompt cache performance, and estimated costs
without EVER logging API keys, passwords, credentials, prompts, or sensitive business data.
"""

from __future__ import annotations

import logging
import os
import time
from dataclasses import asdict, dataclass, field
from typing import Any

from django.conf import settings

logger = logging.getLogger(__name__)

# Official Per-1M-Tokens Pricing (USD) as of 2026
# (input_per_1m, cached_input_per_1m, output_per_1m, reasoning_per_1m)
MODEL_PRICING: dict[str, tuple[float, float, float, float]] = {
    # GPT-5.6 / Luna
    "gpt-5.6-luna": (0.20, 0.02, 1.20, 1.20),
    "gpt-5.6": (0.20, 0.02, 1.20, 1.20),
    "luna": (0.20, 0.02, 1.20, 1.20),
    # GPT-4o-mini
    "gpt-4o-mini": (0.15, 0.075, 0.60, 0.60),
    # GPT-4o
    "gpt-4o": (2.50, 1.25, 10.00, 10.00),
    # o3-mini / o1-mini
    "o3-mini": (1.10, 0.55, 4.40, 4.40),
    "o1-mini": (1.10, 0.55, 4.40, 4.40),
    "o1": (15.00, 7.50, 60.00, 60.00),
    # Gemini models
    "gemini-2.5-flash": (0.075, 0.01875, 0.30, 0.30),
    "gemini-1.5-flash": (0.075, 0.01875, 0.30, 0.30),
    "gemini-3.1-flash-lite": (0.05, 0.0125, 0.20, 0.20),
}

DEFAULT_PRICING: tuple[float, float, float, float] = (0.20, 0.02, 1.20, 1.20)


def calculate_cost_usd(
    model: str,
    *,
    input_tokens: int,
    cached_input_tokens: int = 0,
    output_tokens: int = 0,
    reasoning_tokens: int = 0,
) -> float:
    """Calculate estimated cost in USD based on official token pricing."""
    pricing = MODEL_PRICING.get(model.lower(), DEFAULT_PRICING)
    input_rate, cached_rate, output_rate, reasoning_rate = pricing

    uncached_input = max(0, input_tokens - cached_input_tokens)
    cost = (
        (uncached_input * input_rate)
        + (cached_input_tokens * cached_rate)
        + (output_tokens * output_rate)
        + (reasoning_tokens * reasoning_rate)
    ) / 1_000_000.0

    return round(cost, 7)


@dataclass
class LLMCallRecord:
    provider: str
    model: str
    workflow: str
    call_type: str
    attempt: int
    input_tokens: int
    cached_input_tokens: int
    output_tokens: int
    reasoning_tokens: int
    total_tokens: int
    estimated_cost_usd: float
    latency_ms: float
    status: str  # "SUCCESS" | "ERROR"
    error_message: str | None = None
    assessment_id: str | None = None
    business_id: str | None = None
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class LLMTelemetryTracker:
    """In-memory telemetry and budget tracking for LLM invocations."""

    def __init__(self) -> None:
        self._records: list[LLMCallRecord] = []
        self._max_history = 1000

    def record_call(
        self,
        *,
        provider: str,
        model: str,
        workflow: str = "unknown",
        call_type: str = "completion",
        attempt: int = 1,
        usage: dict[str, Any] | None = None,
        latency_ms: float = 0.0,
        status: str = "SUCCESS",
        error_message: str | None = None,
        assessment_id: str | None = None,
        business_id: str | None = None,
    ) -> LLMCallRecord:
        usage = usage or {}
        input_tokens = int(usage.get("prompt_tokens") or 0)
        output_tokens = int(usage.get("completion_tokens") or 0)
        total_tokens = int(usage.get("total_tokens") or (input_tokens + output_tokens))

        prompt_details = usage.get("prompt_tokens_details") or {}
        cached_input_tokens = int(prompt_details.get("cached_tokens") or 0)

        completion_details = usage.get("completion_tokens_details") or {}
        reasoning_tokens = int(completion_details.get("reasoning_tokens") or 0)

        cost_usd = calculate_cost_usd(
            model,
            input_tokens=input_tokens,
            cached_input_tokens=cached_input_tokens,
            output_tokens=output_tokens,
            reasoning_tokens=reasoning_tokens,
        )

        rec = LLMCallRecord(
            provider=provider,
            model=model,
            workflow=workflow,
            call_type=call_type,
            attempt=attempt,
            input_tokens=input_tokens,
            cached_input_tokens=cached_input_tokens,
            output_tokens=output_tokens,
            reasoning_tokens=reasoning_tokens,
            total_tokens=total_tokens,
            estimated_cost_usd=cost_usd,
            latency_ms=round(latency_ms, 2),
            status=status,
            error_message=error_message,
            assessment_id=str(assessment_id) if assessment_id else None,
            business_id=str(business_id) if business_id else None,
        )

        self._records.append(rec)
        if len(self._records) > self._max_history:
            self._records.pop(0)

        logger.info(
            "LLM Telemetry: workflow=%s model=%s status=%s tokens=(in:%d, cached:%d, out:%d, reason:%d) cost=$%.6f latency=%.1fms",
            workflow,
            model,
            status,
            input_tokens,
            cached_input_tokens,
            output_tokens,
            reasoning_tokens,
            cost_usd,
            latency_ms,
        )

        return rec

    def check_guardrails(self, assessment_id: str | None) -> tuple[bool, str | None]:
        """Check if an assessment has reached its configured LLM call / token / cost limits."""
        if not assessment_id:
            return True, None

        max_calls = getattr(settings, "MAX_LLM_CALLS_PER_ASSESSMENT", 5)
        max_cost = getattr(settings, "MAX_ESTIMATED_COST_PER_ASSESSMENT", 0.05)
        max_tokens = getattr(settings, "MAX_TOTAL_TOKENS_PER_ASSESSMENT", 25000)

        matching = [r for r in self._records if r.assessment_id == str(assessment_id)]
        total_calls = len(matching)
        total_cost = sum(r.estimated_cost_usd for r in matching)
        total_toks = sum(r.total_tokens for r in matching)

        if total_calls >= max_calls:
            msg = f"Assessment {assessment_id} reached max LLM call limit ({total_calls}/{max_calls})."
            logger.warning("Cost Guardrail Exceeded: %s", msg)
            return False, msg

        if total_cost >= max_cost:
            msg = f"Assessment {assessment_id} reached max cost limit (${total_cost:.4f}/${max_cost:.4f})."
            logger.warning("Cost Guardrail Exceeded: %s", msg)
            return False, msg

        if total_toks >= max_tokens:
            msg = f"Assessment {assessment_id} reached max token limit ({total_toks}/{max_tokens})."
            logger.warning("Cost Guardrail Exceeded: %s", msg)
            return False, msg

        return True, None

    def get_summary(self, assessment_id: str | None = None) -> dict[str, Any]:
        """Retrieve aggregated metrics for an assessment or entire session."""
        records = self._records
        if assessment_id:
            records = [r for r in records if r.assessment_id == str(assessment_id)]

        total_calls = len(records)
        total_input = sum(r.input_tokens for r in records)
        total_cached = sum(r.cached_input_tokens for r in records)
        total_output = sum(r.output_tokens for r in records)
        total_reasoning = sum(r.reasoning_tokens for r in records)
        total_cost = sum(r.estimated_cost_usd for r in records)

        return {
            "total_calls": total_calls,
            "total_input_tokens": total_input,
            "total_cached_tokens": total_cached,
            "cache_hit_rate": round(total_cached / total_input, 4) if total_input > 0 else 0.0,
            "total_output_tokens": total_output,
            "total_reasoning_tokens": total_reasoning,
            "total_tokens": total_input + total_output,
            "total_cost_usd": round(total_cost, 6),
            "workflows": {
                wf: len([r for r in records if r.workflow == wf])
                for wf in set(r.workflow for r in records)
            },
        }

    def reset(self) -> None:
        self._records.clear()


# Global Singleton Telemetry Tracker
telemetry_tracker = LLMTelemetryTracker()
