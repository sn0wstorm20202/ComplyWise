"""Google Gemini LLM and embedding providers — TRD_v2.0 §4.

Uses the Generative Language REST API. Two vendor conventions are mapped here so
they never reach domain code: Gemini takes the system prompt in a separate
`system_instruction` field rather than as a message, and it names the assistant role
`model` rather than `assistant`.
"""

from __future__ import annotations

import logging
import json
import hashlib
import threading
import time
import uuid
from typing import Any

from django.conf import settings

from .base import (
    ChatMessage,
    CompletionResult,
    EmbeddingProvider,
    EmbeddingResult,
    LLMProvider,
    ProviderError,
    ProviderNotConfigured,
    ProviderResponseError,
)
from .http import post_json
from .telemetry import telemetry_tracker

logger = logging.getLogger(__name__)

API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models"


def _api_key() -> str:
    return getattr(settings, "GEMINI_API_KEY", "") or ""


def _api_keys() -> list[str]:
    pool = getattr(settings, "GEMINI_API_KEYS", []) or []
    if isinstance(pool, str):
        pool = pool.split(",")
    return list(dict.fromkeys(key.strip() for key in [_api_key(), *pool] if isinstance(key, str) and key.strip()))


# Only key digests live in the cooldown map; secrets are never telemetry labels.
_cooldowns: dict[str, float] = {}
_cooldown_lock = threading.Lock()
_rotation_cursor = 0
_pool_identity = ()


def _ordered_slots(keys):
    """Rotate healthy starting slots atomically; attempts remain bounded to N."""
    global _rotation_cursor, _pool_identity
    digests = tuple(hashlib.sha256(key.encode()).hexdigest() for key in keys)
    with _cooldown_lock:
        if digests != _pool_identity:
            _pool_identity = digests
            _rotation_cursor = 0
        eligible = [i for i in range(len(keys)) if _cooldowns.get(digests[i], 0) <= time.monotonic()]
        if not eligible:
            return []
        ordered = sorted(eligible, key=lambda i: (i - _rotation_cursor) % len(keys))
        _rotation_cursor = (ordered[0] + 1) % len(keys)
        return [(i + 1, keys[i], digests[i]) for i in ordered]


def reset_pool_state():
    """Used by isolated tests and diagnostics, never to bypass production quota."""
    global _rotation_cursor, _pool_identity
    with _cooldown_lock:
        _cooldowns.clear()
        _rotation_cursor = 0
        _pool_identity = ()


def _require_key(provider: str) -> str:
    keys = _api_keys()
    key = keys[0] if keys else ""
    if not key:
        raise ProviderNotConfigured(provider, "GEMINI_API_KEY")
    return key


class GeminiProvider(LLMProvider):
    name = "gemini"

    @property
    def model(self) -> str:
        return getattr(settings, "GEMINI_MODEL", "") or ""

    @property
    def is_configured(self) -> bool:
        return bool(_api_keys() and self.model)

    def complete(
        self, messages: list[ChatMessage], *, temperature: float = 0.0,
        max_output_tokens: int | None = None, **kwargs: Any,
    ) -> CompletionResult:
        kwargs.setdefault("logical_request_id", uuid.uuid4().hex)
        keys = _api_keys()
        last_error = ProviderNotConfigured(self.name, "GEMINI_API_KEY / GEMINI_API_KEYS")
        allowed, reason = telemetry_tracker.check_guardrails(kwargs.get("assessment_id"), kwargs.get("logical_request_id"))
        if not allowed:
            raise ProviderError("Assessment provider budget reached.", failure_type="budget")
        for attempt, (slot, key, digest) in enumerate(_ordered_slots(keys), start=1):
            started = time.perf_counter()
            try:
                result = self._complete_once(messages, key=key, temperature=temperature,
                    max_output_tokens=max_output_tokens, **kwargs)
            except ProviderError as exc:
                last_error = exc
                telemetry_tracker.record_call(provider=self.name, model=self.model,
                    workflow=kwargs.get("workflow", "general"), attempt=attempt, provider_slot=slot,
                    fallback=attempt > 1 or getattr(self, "_is_fallback", False), status="ERROR",
                    failure_type=exc.failure_type, error_message=f"{self.name}: {exc.failure_type}",
                    latency_ms=(time.perf_counter()-started)*1000,
                    assessment_id=kwargs.get("assessment_id"), business_id=kwargs.get("business_id"), logical_request_id=kwargs.get("logical_request_id"))
                if exc.failure_type in {"invalid_request", "budget"}:
                    raise
                if exc.failure_type in {"authentication", "quota", "rate_limit", "network", "timeout", "provider_unavailable"}:
                    with _cooldown_lock:
                        _cooldowns[digest] = time.monotonic() + max(0, getattr(settings, "GEMINI_KEY_COOLDOWN_SECONDS", 60))
                continue
            telemetry_tracker.record_call(provider=self.name, model=self.model,
                workflow=kwargs.get("workflow", "general"), attempt=attempt, provider_slot=slot,
                fallback=attempt > 1 or getattr(self, "_is_fallback", False), usage={
                    "prompt_tokens": result.usage.get("promptTokenCount", 0),
                    "completion_tokens": result.usage.get("candidatesTokenCount", 0),
                    "total_tokens": result.usage.get("totalTokenCount", 0)},
                latency_ms=(time.perf_counter()-started)*1000,
                assessment_id=kwargs.get("assessment_id"), business_id=kwargs.get("business_id"), logical_request_id=kwargs.get("logical_request_id"))
            return result
        # The selected Gemini path ends at OpenAI. Reverse fallback cannot cycle.
        if not getattr(self, "_is_fallback", False):
            from .openai_provider import OpenAIProvider
            fallback = OpenAIProvider()
            if fallback.is_configured:
                fallback._is_fallback = True
                return fallback.complete(messages, temperature=temperature,
                    max_output_tokens=max_output_tokens, **kwargs)
        raise last_error

    def _complete_once(
        self,
        messages: list[ChatMessage],
        *,
        key: str,
        temperature: float = 0.0,
        max_output_tokens: int | None = None,
        **kwargs: Any,
    ) -> CompletionResult:
        if not self.model:
            raise ProviderNotConfigured(self.name, "GEMINI_MODEL")

        # System turns are hoisted out of the conversation: Gemini rejects a
        # "system" role inside `contents`.
        system_parts = [m.content for m in messages if m.role == "system"]
        contents = [
            {
                "role": "model" if m.role == "assistant" else "user",
                "parts": [{"text": m.content}],
            }
            for m in messages
            if m.role != "system"
        ]

        generation_config: dict[str, Any] = {"temperature": temperature}
        if max_output_tokens is not None:
            generation_config["maxOutputTokens"] = max_output_tokens
        if (kwargs.get("response_format") or {}).get("type") == "json_object":
            generation_config["responseMimeType"] = "application/json"

        payload: dict[str, Any] = {
            "contents": contents,
            "generationConfig": generation_config,
        }
        if system_parts:
            payload["system_instruction"] = {"parts": [{"text": "\n\n".join(system_parts)}]}

        # The key travels as a header rather than a query parameter so it cannot
        # be captured in a proxy access log (TRD_v2.0 §62).
        data = post_json(
                f"{API_ROOT}/{self.model}:generateContent",
                payload,
                headers={"x-goog-api-key": key},
                provider=self.name,
                max_retries=0,
            )

        candidates = data.get("candidates") or []
        if not candidates:
            raise ProviderResponseError(f"{self.name} returned no candidates.")
        if not isinstance(candidates, list) or not isinstance(candidates[0], dict):
            raise ProviderResponseError(f"{self.name} returned an invalid candidate.")
        if candidates[0].get("finishReason") in {"SAFETY", "BLOCKLIST", "PROHIBITED_CONTENT", "RECITATION"}:
            raise ProviderError(f"{self.name} could not produce usable content.", failure_type="unusable_output")
        content = candidates[0].get("content") or {}
        parts = content.get("parts", []) if isinstance(content, dict) else []
        if not isinstance(parts, list):
            raise ProviderResponseError(f"{self.name} returned invalid content parts.")
        text = "".join(part["text"] for part in parts if isinstance(part, dict) and isinstance(part.get("text"), str))
        if not text:
            raise ProviderResponseError(f"{self.name} returned a candidate without text content.")
        if kwargs.get("response_format", {}).get("type") == "json_object":
            cleaned = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            try:
                if not isinstance(json.loads(cleaned), dict):
                    raise ValueError()
            except ValueError:
                raise ProviderResponseError(f"{self.name} returned invalid structured output.") from None
        validator = kwargs.get("response_validator")
        if validator:
            try:
                validator(text)
            except (ValueError, ProviderError):
                raise ProviderError(f"{self.name} response failed the requested schema.", failure_type="schema_failure") from None

        usage_raw = data.get("usageMetadata") or {}
        if not isinstance(usage_raw, dict):
            raise ProviderResponseError(f"{self.name} returned invalid usage metadata.")
        usage = {k: v for k, v in usage_raw.items() if isinstance(v, int)}

        return CompletionResult(
            text=text,
            provider=self.name,
            model=self.model,
            usage=usage,
            raw_finish_reason=candidates[0].get("finishReason"),
        )


class GeminiEmbeddingProvider(EmbeddingProvider):
    name = "gemini"

    @property
    def model(self) -> str:
        return getattr(settings, "GEMINI_EMBEDDING_MODEL", "") or ""

    @property
    def is_configured(self) -> bool:
        return bool(_api_key() and self.model)

    def embed(self, texts: list[str]) -> EmbeddingResult:
        key = _require_key(self.name)
        if not self.model:
            raise ProviderNotConfigured(self.name, "GEMINI_EMBEDDING_MODEL")

        # `batchEmbedContents` preserves input order, which the caller relies on.
        payload = {
            "requests": [
                {"model": f"models/{self.model}", "content": {"parts": [{"text": text}]}}
                for text in texts
            ]
        }
        data = post_json(
            f"{API_ROOT}/{self.model}:batchEmbedContents",
            payload,
            headers={"x-goog-api-key": key},
            provider=self.name,
        )

        embeddings = data.get("embeddings") or []
        vectors = [
            item["values"]
            for item in embeddings
            if isinstance(item, dict) and isinstance(item.get("values"), list)
        ]
        if len(vectors) != len(texts):
            raise ProviderError(
                f"{self.name} returned {len(vectors)} embeddings for {len(texts)} inputs."
            )

        return EmbeddingResult(
            vectors=vectors,
            provider=self.name,
            model=self.model,
            dimensions=len(vectors[0]) if vectors else 0,
        )
