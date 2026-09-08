"""OpenAI LLM and embedding providers — TRD_v2.0 §4.

Endpoints: Chat Completions and Embeddings. Model names come from settings
(`OPENAI_MODEL`, `OPENAI_EMBEDDING_MODEL`) so a model change never touches code.
"""

from __future__ import annotations

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


def _api_key() -> str:
    return getattr(settings, "OPENAI_API_KEY", "") or ""


def _auth_headers(provider: str) -> dict[str, str]:
    key = _api_key()
    if not key:
        raise ProviderNotConfigured(provider, "OPENAI_API_KEY")
    return {"Authorization": f"Bearer {key}"}


class OpenAIProvider(LLMProvider):
    name = "openai"

    @property
    def model(self) -> str:
        return getattr(settings, "OPENAI_MODEL", "") or ""

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
        headers = _auth_headers(self.name)
        if not self.model:
            raise ProviderNotConfigured(self.name, "OPENAI_MODEL")

        payload: dict[str, object] = {
            "model": self.model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "temperature": temperature,
        }
        if max_output_tokens is not None:
            payload["max_completion_tokens"] = max_output_tokens

        data = post_json(CHAT_URL, payload, headers=headers, provider=self.name)

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
