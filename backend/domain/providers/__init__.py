"""AI provider abstraction — TRD_v2.0 §4; PRD_v2.0 §P3, §P4.

Two interfaces, selected by environment variable:

* `LLMProvider` — text generation. `LLM_PROVIDER` = openai | gemini | grok.
* `EmbeddingProvider` — vector embeddings. `EMBEDDING_PROVIDER` = openai | gemini.

Domain code depends on the interface, never on a vendor SDK, so switching provider
is a configuration change. It is also *only* a configuration change: no provider
participates in an applicability decision. Rules are evaluated deterministically by
`ApplicabilityEngine` against published knowledge, and swapping the LLM cannot alter
a status, a matched rule, or an evidence chain (PRD_v2.0 §P4).

A provider whose key is absent is not an error at import time. Every provider reports
`is_configured`, and calling an unconfigured one raises `ProviderNotConfigured`, which
the API layer renders as an honest "not configured" state rather than a crash.
"""

from __future__ import annotations

from .base import (
    ChatMessage,
    CompletionResult,
    EmbeddingProvider,
    EmbeddingResult,
    LLMProvider,
    ProviderError,
    ProviderNotConfigured,
    UnknownProvider,
)
from .registry import (
    EMBEDDING_PROVIDERS,
    LLM_PROVIDERS,
    embedding_provider_status,
    get_embedding_provider,
    get_llm_provider,
    llm_provider_status,
    provider_status,
)

__all__ = [
    "ChatMessage",
    "CompletionResult",
    "EMBEDDING_PROVIDERS",
    "EmbeddingProvider",
    "EmbeddingResult",
    "LLMProvider",
    "LLM_PROVIDERS",
    "ProviderError",
    "ProviderNotConfigured",
    "UnknownProvider",
    "embedding_provider_status",
    "get_embedding_provider",
    "get_llm_provider",
    "llm_provider_status",
    "provider_status",
]
