"""xAI Grok LLM provider — TRD_v2.0 §4.

Grok exposes an OpenAI-compatible chat-completions endpoint, so the request and
response shapes match `OpenAIProvider`. It is still a separate class rather than a
base-URL flag on the OpenAI one: they authenticate with different keys, version
independently, and collapsing them would make a Grok-only API change require editing
the OpenAI provider.

No `GrokEmbeddingProvider`: xAI publishes no embeddings endpoint, so offering one
would be a stub that fails at runtime. `EMBEDDING_PROVIDER` accepts openai and gemini.
"""

from __future__ import annotations

from django.conf import settings

from .base import (
    ChatMessage,
    CompletionResult,
    LLMProvider,
    ProviderError,
    ProviderNotConfigured,
)
from .http import post_json

CHAT_URL = "https://api.x.ai/v1/chat/completions"


class GrokProvider(LLMProvider):
    name = "grok"

    @property
    def model(self) -> str:
        return getattr(settings, "GROK_MODEL", "") or ""

    @property
    def is_configured(self) -> bool:
        return bool(getattr(settings, "GROK_API_KEY", "") and self.model)

    def complete(
        self,
        messages: list[ChatMessage],
        *,
        temperature: float = 0.0,
        max_output_tokens: int | None = None,
    ) -> CompletionResult:
        key = getattr(settings, "GROK_API_KEY", "") or ""
        if not key:
            raise ProviderNotConfigured(self.name, "GROK_API_KEY")
        if not self.model:
            raise ProviderNotConfigured(self.name, "GROK_MODEL")

        payload: dict[str, object] = {
            "model": self.model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "temperature": temperature,
        }
        if max_output_tokens is not None:
            payload["max_tokens"] = max_output_tokens

        data = post_json(
            CHAT_URL,
            payload,
            headers={"Authorization": f"Bearer {key}"},
            provider=self.name,
        )

        choices = data.get("choices") or []
        if not choices:
            raise ProviderError(f"{self.name} returned no completion choices.")
        text = (choices[0].get("message") or {}).get("content")
        if not isinstance(text, str):
            raise ProviderError(f"{self.name} returned a completion without text content.")

        return CompletionResult(
            text=text,
            provider=self.name,
            model=self.model,
            usage=data.get("usage") or {},
            raw_finish_reason=choices[0].get("finish_reason"),
        )
