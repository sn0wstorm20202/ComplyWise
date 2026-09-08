"""Provider interfaces and error types — TRD_v2.0 §4.

The interfaces are deliberately narrow. An LLM in this system summarises, drafts and
answers questions over text that has already been retrieved and cited; it does not
decide applicability, so the interface offers no hook for returning a status, a rule
match or a requirement list. Keeping the surface this small is what stops a provider
from quietly becoming the compliance decision-maker (PRD_v2.0 §P4, §9A.6).
"""

from __future__ import annotations

import abc
from dataclasses import dataclass, field
from typing import Any, Literal

#: Roles accepted by every provider. Vendor-specific role names are mapped inside
#: the concrete provider, never leaked to callers.
Role = Literal["system", "user", "assistant"]


class ProviderError(RuntimeError):
    """Base class for provider failures."""


class ProviderNotConfigured(ProviderError):
    """Raised when a provider is selected but its credentials are absent.

    Distinct from a transport failure: the caller can render "not configured"
    instead of "the request failed", which are different facts for the user.
    """

    def __init__(self, provider: str, missing: str) -> None:
        self.provider = provider
        self.missing = missing
        super().__init__(
            f"Provider '{provider}' is not configured: {missing} is not set. "
            f"Set it in the environment, or select a different provider."
        )


class UnknownProvider(ProviderError):
    """Raised when the configured provider name is not recognised.

    Fails loudly rather than falling back to a default: silently substituting a
    different provider than the operator asked for hides a deployment mistake.
    """

    def __init__(self, name: str, kind: str, supported: list[str]) -> None:
        self.name = name
        self.kind = kind
        self.supported = supported
        super().__init__(
            f"Unknown {kind} provider '{name}'. Supported: {', '.join(sorted(supported))}."
        )


@dataclass(frozen=True)
class ChatMessage:
    role: Role
    content: str


@dataclass(frozen=True)
class CompletionResult:
    """A generated completion plus the provenance needed to report it honestly."""

    text: str
    provider: str
    model: str
    #: Token usage when the vendor reports it. Absent rather than estimated.
    usage: dict[str, int] = field(default_factory=dict)
    raw_finish_reason: str | None = None


@dataclass(frozen=True)
class EmbeddingResult:
    vectors: list[list[float]]
    provider: str
    model: str
    dimensions: int


class LLMProvider(abc.ABC):
    """Text generation behind a vendor-neutral interface."""

    #: Stable identifier used in configuration and in reported provenance.
    name: str = ""

    @property
    @abc.abstractmethod
    def model(self) -> str:
        """Configured model name. Configuration, never hardcoded in domain code."""

    @property
    @abc.abstractmethod
    def is_configured(self) -> bool:
        """True when this provider has the credentials it needs to be called."""

    @abc.abstractmethod
    def complete(
        self,
        messages: list[ChatMessage],
        *,
        temperature: float = 0.0,
        max_output_tokens: int | None = None,
    ) -> CompletionResult:
        """Generate a completion.

        Raises `ProviderNotConfigured` when credentials are missing, and
        `ProviderError` on transport or API failure.
        """

    def describe(self) -> dict[str, Any]:
        """Non-secret configuration state, safe to return from a health endpoint.

        Never includes the key itself, or any prefix of it: a boolean is all a
        caller needs to know (TRD_v2.0 §62).
        """
        return {
            "provider": self.name,
            "model": self.model,
            "configured": self.is_configured,
        }


class EmbeddingProvider(abc.ABC):
    """Vector embeddings behind a vendor-neutral interface."""

    name: str = ""

    @property
    @abc.abstractmethod
    def model(self) -> str:
        ...

    @property
    @abc.abstractmethod
    def is_configured(self) -> bool:
        ...

    @abc.abstractmethod
    def embed(self, texts: list[str]) -> EmbeddingResult:
        """Embed one or more texts.

        Raises `ProviderNotConfigured` when credentials are missing, and
        `ProviderError` on transport or API failure.
        """

    def describe(self) -> dict[str, Any]:
        return {
            "provider": self.name,
            "model": self.model,
            "configured": self.is_configured,
        }
