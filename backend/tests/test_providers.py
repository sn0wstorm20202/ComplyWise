"""Provider abstraction contract tests — offline, no vendor network calls.

Authority: TRD_v2.0 §4; milestone requirements §10-§12.

Verifies:
- the configured provider is selected through `LLM_PROVIDER` / `EMBEDDING_PROVIDER`;
- the three LLM providers (openai, gemini, grok) are all selectable;
- embeddings support openai and gemini only (xAI has no embeddings endpoint);
- an unrecognised provider name fails loudly (`UnknownProvider`);
- a missing key is a clean `ProviderNotConfigured`, never a crash or a silent
  fallback to another vendor;
- status reporting never includes key material;
- the assistant degrades honestly when no LLM key is configured.
"""

from __future__ import annotations

import pytest
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.evidence.models import Evidence, Source
from common.enums import SourceStatus, VerificationStatus
from domain.providers import (
    ChatMessage,
    EmbeddingProvider,
    LLMProvider,
    ProviderNotConfigured,
    UnknownProvider,
    get_embedding_provider,
    get_llm_provider,
    provider_status,
)
from domain.providers.gemini_provider import GeminiEmbeddingProvider, GeminiProvider
from domain.providers.grok_provider import GrokProvider
from domain.providers.openai_provider import OpenAIEmbeddingProvider, OpenAIProvider

# ---------------------------------------------------------------------------
# Selection
# ---------------------------------------------------------------------------


@override_settings(LLM_PROVIDER="openai")
def test_llm_provider_openai_selected():
    provider = get_llm_provider()
    assert isinstance(provider, OpenAIProvider)
    assert isinstance(provider, LLMProvider)
    assert provider.name == "openai"


@override_settings(LLM_PROVIDER="gemini")
def test_llm_provider_gemini_selected():
    assert isinstance(get_llm_provider(), GeminiProvider)


@override_settings(LLM_PROVIDER="grok")
def test_llm_provider_grok_selected():
    assert isinstance(get_llm_provider(), GrokProvider)


@override_settings(LLM_PROVIDER="  GEMINI  ")
def test_llm_provider_selection_is_case_and_space_tolerant():
    assert isinstance(get_llm_provider(), GeminiProvider)


@override_settings(EMBEDDING_PROVIDER="openai")
def test_embedding_provider_openai_selected():
    provider = get_embedding_provider()
    assert isinstance(provider, OpenAIEmbeddingProvider)
    assert isinstance(provider, EmbeddingProvider)


@override_settings(EMBEDDING_PROVIDER="gemini")
def test_embedding_provider_gemini_selected():
    assert isinstance(get_embedding_provider(), GeminiEmbeddingProvider)


# ---------------------------------------------------------------------------
# Rejection
# ---------------------------------------------------------------------------


@override_settings(LLM_PROVIDER="anthropic")
def test_unknown_llm_provider_rejected_loudly():
    with pytest.raises(UnknownProvider) as excinfo:
        get_llm_provider()
    assert "anthropic" in str(excinfo.value)


@override_settings(EMBEDDING_PROVIDER="grok")
def test_grok_rejected_as_embedding_provider():
    """xAI has no embeddings endpoint, so grok must not silently work here."""
    with pytest.raises(UnknownProvider):
        get_embedding_provider()


@override_settings(EMBEDDING_PROVIDER="nonsense")
def test_unknown_embedding_provider_rejected_loudly():
    with pytest.raises(UnknownProvider):
        get_embedding_provider()


# ---------------------------------------------------------------------------
# Missing keys — clean state, no crash, no silent vendor swap
# ---------------------------------------------------------------------------


@override_settings(
    LLM_PROVIDER="openai", OPENAI_API_KEY="", GEMINI_API_KEY="", GROK_API_KEY=""
)
def test_unconfigured_llm_providers_report_not_configured():
    for name in ("openai", "gemini", "grok"):
        provider = get_llm_provider(name)
        assert provider.is_configured is False
        assert provider.describe()["configured"] is False

        with pytest.raises(ProviderNotConfigured):
            provider.complete([ChatMessage(role="user", content="ping")])


@override_settings(
    EMBEDDING_PROVIDER="openai", OPENAI_API_KEY="", GEMINI_API_KEY=""
)
def test_unconfigured_embedding_providers_raise_not_configured():
    for name in ("openai", "gemini"):
        provider = get_embedding_provider(name)
        assert provider.is_configured is False
        with pytest.raises(ProviderNotConfigured):
            provider.embed(["hello"])


@override_settings(GEMINI_API_KEY="test-key", GEMINI_MODEL="gemini-3.1-flash-lite")
def test_configured_provider_reports_model_without_key_material():
    provider = get_llm_provider("gemini")
    assert provider.is_configured is True
    description = provider.describe()
    assert description == {
        "provider": "gemini",
        "model": "gemini-3.1-flash-lite",
        "configured": True,
    }
    assert "test-key" not in repr(description)


@override_settings(
    LLM_PROVIDER="gemini",
    EMBEDDING_PROVIDER="gemini",
    GEMINI_API_KEY="super-secret-key",
    OPENAI_API_KEY="",
    GROK_API_KEY="",
)
def test_provider_status_reports_state_without_secret_values():
    report = provider_status()
    assert report["llm"]["selected"] == "gemini"
    assert report["llm"]["status"] == "ok"
    assert set(report["llm"]["supported"]) == {"openai", "gemini", "grok"}
    assert set(report["embedding"]["supported"]) == {"openai", "gemini"}
    assert "super-secret-key" not in repr(report)


@override_settings(LLM_PROVIDER="bogus")
def test_provider_status_marks_invalid_selection():
    assert provider_status()["llm"]["status"] == "invalid"


@override_settings(LLM_PROVIDER="openai", OPENAI_API_KEY="")
def test_provider_status_marks_missing_key_not_configured():
    report = provider_status()
    assert report["llm"]["selected"] == "openai"
    assert report["llm"]["status"] == "not_configured"


# ---------------------------------------------------------------------------
# Application behaviour through the abstraction
# ---------------------------------------------------------------------------


@pytest.mark.django_db
@override_settings(LLM_PROVIDER="not-a-provider")
def test_assistant_view_returns_503_on_invalid_provider():
    """An invalid provider name must surface as a clear 503, never a 500 crash."""
    user = User.objects.create_user(
        email="provider.test@example.com", password="TestPass123!", full_name="P T"
    )
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(
        "/api/v1/assistant/chat", {"prompt": "what licences apply?"}, format="json"
    )
    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert response.data["error"]["code"] == "PROVIDER_MISCONFIGURED"


@pytest.mark.django_db
@override_settings(LLM_PROVIDER="openai", OPENAI_API_KEY="", GEMINI_API_KEY="", GROK_API_KEY="")
def test_assistant_degrades_to_citations_without_llm_key():
    """With evidence present but no LLM key, the assistant returns the citations
    it found and states that no summary was generated — it does not invent one."""
    from apps.assistant.services import answer_question

    source = Source.objects.create(
        source_id="SRC-TEST-PROV-01",
        title="Synthetic Test Gazette",
        authority="TESTAUTHORITY",
        status=SourceStatus.ACTIVE,
    )
    Evidence.objects.create(
        evidence_id="EVD-TEST-PROV-01",
        source=source,
        locator="Section 1",
        excerpt="quixotic zephyr umbrella lantern medallion",
        verification_status=VerificationStatus.VERIFIED,
    )

    result = answer_question("quixotic zephyr umbrella lantern medallion")
    assert result["answer_generated"] is False
    assert result["grounding_level"] == "CITATIONS_ONLY_NO_LLM_CONFIGURED"
    assert len(result["citations"]) >= 1
    assert result["citations"][0]["evidence_id"] == "EVD-TEST-PROV-01"


@pytest.mark.django_db
def test_assistant_without_matching_evidence_makes_no_claim():
    from apps.assistant.services import answer_question

    result = answer_question("unrelated query with no matching evidence in store")
    assert result["answer_generated"] is False
    assert result["grounding_level"] == "NO_MATCHING_EVIDENCE"
    assert result["citations"] == []
