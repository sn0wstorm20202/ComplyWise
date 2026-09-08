"""Google Gemini LLM and embedding providers — TRD_v2.0 §4.

Uses the Generative Language REST API. Two vendor conventions are mapped here so
they never reach domain code: Gemini takes the system prompt in a separate
`system_instruction` field rather than as a message, and it names the assistant role
`model` rather than `assistant`.
"""

from __future__ import annotations

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
)
from .http import post_json

API_ROOT = "https://generativelanguage.googleapis.com/v1beta/models"


def _api_key() -> str:
    return getattr(settings, "GEMINI_API_KEY", "") or ""


def _require_key(provider: str) -> str:
    key = _api_key()
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
        return bool(_api_key() and self.model)

    def complete(
        self,
        messages: list[ChatMessage],
        *,
        temperature: float = 0.0,
        max_output_tokens: int | None = None,
    ) -> CompletionResult:
        key = _require_key(self.name)
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
        )

        candidates = data.get("candidates") or []
        if not candidates:
            raise ProviderError(f"{self.name} returned no candidates.")
        parts = (candidates[0].get("content") or {}).get("parts") or []
        text = "".join(part.get("text", "") for part in parts if isinstance(part, dict))
        if not text:
            raise ProviderError(f"{self.name} returned a candidate without text content.")

        usage_raw = data.get("usageMetadata") or {}
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
