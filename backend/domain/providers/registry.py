"""Provider selection from configuration — TRD_v2.0 §4.

`get_llm_provider()` and `get_embedding_provider()` are the only ways domain code
obtains a provider. Neither reads a vendor SDK, and neither falls back silently: an
unrecognised name raises `UnknownProvider` so a typo in `LLM_PROVIDER` surfaces as a
clear configuration error rather than as unexplained OpenAI traffic.

Providers are constructed lazily and hold no client state — they read the key from
settings on each call — so a registry entry for a provider with no key configured is
harmless. Only calling it fails, and it fails with `ProviderNotConfigured`.
"""

from __future__ import annotations

from typing import Any, Callable

from django.conf import settings

from .base import EmbeddingProvider, LLMProvider, UnknownProvider
from .gemini_provider import GeminiEmbeddingProvider, GeminiProvider
from .grok_provider import GrokProvider
from .openai_provider import OpenAIEmbeddingProvider, OpenAIProvider

#: Recognised LLM providers. Adding one is a registry entry plus a class.
LLM_PROVIDERS: dict[str, Callable[[], LLMProvider]] = {
    "openai": OpenAIProvider,
    "gemini": GeminiProvider,
    "grok": GrokProvider,
}

#: Recognised embedding providers. No Grok entry: xAI has no embeddings endpoint.
EMBEDDING_PROVIDERS: dict[str, Callable[[], EmbeddingProvider]] = {
    "openai": OpenAIEmbeddingProvider,
    "gemini": GeminiEmbeddingProvider,
}


def _configured_name(setting: str, default: str) -> str:
    return (getattr(settings, setting, "") or default).strip().lower()


def get_llm_provider(name: str | None = None) -> LLMProvider:
    """Return the configured LLM provider.

    `name` overrides `settings.LLM_PROVIDER`, which exists for tests and for
    admin tooling that needs to probe a specific provider.
    """
    selected = (name or _configured_name("LLM_PROVIDER", "gemini")).strip().lower()
    factory = LLM_PROVIDERS.get(selected)
    if factory is None:
        raise UnknownProvider(selected, "LLM", list(LLM_PROVIDERS))
    return factory()


def get_embedding_provider(name: str | None = None) -> EmbeddingProvider:
    """Return the configured embedding provider."""
    selected = (name or _configured_name("EMBEDDING_PROVIDER", "gemini")).strip().lower()
    factory = EMBEDDING_PROVIDERS.get(selected)
    if factory is None:
        raise UnknownProvider(selected, "embedding", list(EMBEDDING_PROVIDERS))
    return factory()


def _status(
    kind: str,
    selected: str,
    registry: dict[str, Callable[[], Any]],
) -> dict[str, Any]:
    """Configuration state for one provider kind, with no secret values.

    Reports every registered provider, not only the selected one, so an operator
    can see which alternatives are ready without editing configuration to find out.
    """
    if selected not in registry:
        return {
            "selected": selected,
            "status": "invalid",
            "error": (
                f"'{selected}' is not a recognised {kind} provider. "
                f"Supported: {', '.join(sorted(registry))}."
            ),
            "supported": sorted(registry),
            "available": {},
        }

    available = {name: factory().describe() for name, factory in sorted(registry.items())}
    active = available[selected]
    return {
        "selected": selected,
        "model": active["model"],
        # "not_configured" rather than "unavailable": the deployment is coherent,
        # the operator simply has not supplied this provider's key. Optional
        # providers are expected to be absent.
        "status": "ok" if active["configured"] else "not_configured",
        "supported": sorted(registry),
        "available": available,
    }


def llm_provider_status() -> dict[str, Any]:
    return _status("LLM", _configured_name("LLM_PROVIDER", "gemini"), LLM_PROVIDERS)


def embedding_provider_status() -> dict[str, Any]:
    return _status(
        "embedding", _configured_name("EMBEDDING_PROVIDER", "gemini"), EMBEDDING_PROVIDERS
    )


def provider_status() -> dict[str, Any]:
    """Combined provider state for the readiness endpoint.

    Contains no key material — only booleans and model names — so it is safe to
    return over the API (TRD_v2.0 §62).
    """
    return {"llm": llm_provider_status(), "embedding": embedding_provider_status()}
