"""OpenAI LLM and embedding providers — TRD_v2.0 §4.

Endpoints: Chat Completions and Embeddings. Model names come from settings
(`OPENAI_MODEL`, `OPENAI_EMBEDDING_MODEL`) so a model change never touches code.
"""

from __future__ import annotations

import logging

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

CHAT_URL = "https://api.openai.com/v1/chat/completions"
EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings"


logger = logging.getLogger(__name__)


import os


def is_valid_openai_key(key: str | None) -> bool:
    if not key or not isinstance(key, str):
        return False
    k = key.strip()
    if not k.startswith("sk-") or len(k) < 20:
        return False
    if "*" in k:
        return False  # Masked preview string (e.g. sk-test-*************-key)
    lower = k.lower()
    if lower.startswith("sk-test") or any(
        dummy in lower
        for dummy in [
            "testkey", "test-key", "custom-header", "dummy", "placeholder",
            "fake", "your_openai_api_key", "change-this", "example"
        ]
    ):
        return False
    return True


def _api_key() -> str:
    key = getattr(settings, "OPENAI_API_KEY", "") or os.getenv("OPENAI_API_KEY", "") or ""
    return key.strip()


def _auth_headers(provider: str, custom_key: str | None = None) -> dict[str, str]:
    key = (custom_key or _api_key()).strip()
    if not is_valid_openai_key(key):
        raise ProviderNotConfigured(provider, "OPENAI_API_KEY (valid live key required)")
    return {"Authorization": f"Bearer {key}"}


class OpenAIProvider(LLMProvider):
    name = "openai"

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        self._custom_api_key = api_key.strip() if api_key else None
        self._custom_model = model.strip() if model else None

    def get_api_key(self) -> str:
        if self._custom_api_key:
            return self._custom_api_key
        return _api_key()

    @property
    def model(self) -> str:
        if self._custom_model:
            return self._custom_model
        configured = (getattr(settings, "OPENAI_MODEL", "") or os.getenv("OPENAI_MODEL", "") or "").strip()
        if not configured or configured in {"gpt-5.6-luna", "gpt-5", "luna"}:
            return "gpt-4o-mini"
        return configured

    @property
    def is_configured(self) -> bool:
        return bool(is_valid_openai_key(self.get_api_key()) and self.model)

    def complete(
        self,
        messages: list[ChatMessage],
        *,
        temperature: float = 0.0,
        max_output_tokens: int | None = None,
        response_format: dict[str, str] | None = None,
    ) -> CompletionResult:
        headers = _auth_headers(self.name, self.get_api_key())
        if not self.model:
            raise ProviderNotConfigured(self.name, "OPENAI_MODEL")

        payload: dict[str, object] = {
            "model": self.model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
        }
        if response_format is not None:
            payload["response_format"] = response_format

        is_reasoning_model = any(
            frag in self.model.lower()
            for frag in ("o1", "o3", "o4")
        )
        if is_reasoning_model:
            payload["reasoning_effort"] = "low"
            if max_output_tokens is not None:
                payload["max_completion_tokens"] = max(max_output_tokens, 8000)
        else:
            payload["temperature"] = temperature
            if max_output_tokens is not None:
                payload["max_tokens"] = max_output_tokens

        try:
            data = post_json(CHAT_URL, payload, headers=headers, provider=self.name)
        except ProviderError as exc:
            gemini_key = getattr(settings, "GEMINI_API_KEY", "") or ""
            if gemini_key and not getattr(self, "_is_fallback", False):
                try:
                    from .gemini_provider import GeminiProvider
                    fallback = GeminiProvider()
                    if fallback.is_configured:
                        fallback._is_fallback = True
                        logger.warning("OpenAI failed (%s), failing over to Gemini (%s)", exc, fallback.model)
                        return fallback.complete(
                            messages,
                            temperature=temperature,
                            max_output_tokens=max_output_tokens,
                        )
                except Exception as fallback_exc:
                    logger.warning("Gemini fallback also failed: %s", fallback_exc)
            raise

        choices = data.get("choices") or []
        if not choices:
            raise ProviderError(f"{self.name} returned no completion choices.")
        message = choices[0].get("message") or {}
        text = message.get("content")
        if not isinstance(text, str):
            raise ProviderError(f"{self.name} returned a completion without text content.")

        return CompletionResult(
            text=text,
            provider=self.name,
            model=self.model,
            usage=data.get("usage") or {},
            raw_finish_reason=choices[0].get("finish_reason"),
        )


class OpenAIEmbeddingProvider(EmbeddingProvider):
    name = "openai"

    @property
    def model(self) -> str:
        return getattr(settings, "OPENAI_EMBEDDING_MODEL", "") or ""

    @property
    def is_configured(self) -> bool:
        return bool(_api_key() and self.model)

    def embed(self, texts: list[str]) -> EmbeddingResult:
        headers = _auth_headers(self.name)
        if not self.model:
            raise ProviderNotConfigured(self.name, "OPENAI_EMBEDDING_MODEL")

        data = post_json(
            EMBEDDINGS_URL,
            {"model": self.model, "input": texts},
            headers=headers,
            provider=self.name,
        )
        items = data.get("data") or []
        # Ordering is by the returned index, not by arrival: the caller relies on
        # vectors[i] corresponding to texts[i].
        vectors = [
            item["embedding"]
            for item in sorted(items, key=lambda entry: entry.get("index", 0))
            if isinstance(item.get("embedding"), list)
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
