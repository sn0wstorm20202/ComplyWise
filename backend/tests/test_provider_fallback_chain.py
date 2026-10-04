"""Real provider boundary tests; HTTP is mocked, rotation itself is not."""
import io
import json
import urllib.error
from unittest.mock import patch

import pytest
from django.test import override_settings

from domain.providers import ChatMessage, get_llm_provider
from domain.providers.base import ProviderError, ProviderNotConfigured, ProviderResponseError
from domain.providers.gemini_provider import _cooldowns, reset_pool_state
from domain.providers.http import post_json
from domain.providers.telemetry import telemetry_tracker


MESSAGES = [ChatMessage("user", "synthetic business context")]
GEMINI_OK = {"candidates": [{"content": {"parts": [{"text": '{"ok": true}'}]}}],
             "usageMetadata": {"promptTokenCount": 12, "candidatesTokenCount": 4, "totalTokenCount": 16}}
OPENAI_OK = {"choices": [{"message": {"content": '{"ok": true}'}, "finish_reason": "stop"}],
             "usage": {"prompt_tokens": 12, "completion_tokens": 4, "total_tokens": 16}}


@pytest.fixture(autouse=True)
def isolated_chain():
    reset_pool_state()
    telemetry_tracker.reset()
    with (override_settings(LLM_PROVIDER="gemini", GEMINI_API_KEY="slot-one",
            GEMINI_API_KEYS=["slot-two", "slot-three"], GEMINI_MODEL="synthetic-model",
            GEMINI_KEY_COOLDOWN_SECONDS=60, OPENAI_API_KEY="sk-unit-" + "x" * 32,
            OPENAI_MODEL="synthetic-openai-model")):
        yield
    reset_pool_state()
    telemetry_tracker.reset()


@pytest.mark.parametrize("failures", [0, 1, 2])
def test_ordered_gemini_success_exhausts_only_necessary_slots(failures):
    errors = [ProviderError("transport failed", failure_type="rate_limit") for _ in range(failures)]
    with (patch("domain.providers.gemini_provider.post_json", side_effect=[*errors, GEMINI_OK]) as gemini,
         patch("domain.providers.openai_provider.post_json") as openai):
        result = get_llm_provider().complete(MESSAGES, workflow="chain_test")
    assert result.provider == "gemini"
    assert [c.kwargs["headers"]["x-goog-api-key"] for c in gemini.call_args_list] == ["slot-one", "slot-two", "slot-three"][:failures+1]
    openai.assert_not_called()
    records = telemetry_tracker._records
    assert [r.provider_slot for r in records] == list(range(1, failures+2))
    assert records[-1].status == "SUCCESS" and records[-1].total_tokens == 16
    assert all(key not in repr([r.to_dict() for r in records]) for key in ["slot-one", "slot-two", "slot-three"])


def test_all_gemini_fail_then_openai_is_final_success():
    with (patch("domain.providers.gemini_provider.post_json", side_effect=ProviderError("outage")) as gemini,
         patch("domain.providers.openai_provider.post_json", return_value=OPENAI_OK) as openai):
        result = get_llm_provider().complete(MESSAGES, workflow="chain_test", assessment_id="assessment")
    assert gemini.call_count == 3 and openai.call_count == 1
    assert result.provider == "openai"
    assert [r.provider for r in telemetry_tracker._records] == ["gemini"] * 3 + ["openai"]
    assert telemetry_tracker._records[-1].fallback is True


def test_all_providers_fail_once_without_recursion():
    with (patch("domain.providers.gemini_provider.post_json", side_effect=ProviderError("Gemini down")) as gemini,
         patch("domain.providers.openai_provider.post_json", side_effect=ProviderError("OpenAI down")) as openai):
        with pytest.raises(ProviderError, match="OpenAI down"):
            get_llm_provider().complete(MESSAGES)
    assert gemini.call_count == 3 and openai.call_count == 1


@pytest.mark.parametrize("response", [{}, {"candidates": [{"content": {"parts": []}}]},
                                     {"candidates": [{"content": {"parts": [{"text": "not JSON"}]}}]}])
def test_unusable_response_uses_next_gemini_slot(response):
    with patch("domain.providers.gemini_provider.post_json", side_effect=[response, GEMINI_OK]) as gemini:
        result = get_llm_provider().complete(MESSAGES, response_format={"type": "json_object"})
    assert result.provider == "gemini" and gemini.call_count == 2
    assert telemetry_tracker._records[0].failure_type == "malformed_response"


def test_requested_schema_validation_happens_inside_fallback_boundary():
    def validate(text):
        if json.loads(text).get("ok") is not True:
            raise ValueError("missing application field")
    bad = {"candidates": [{"content": {"parts": [{"text": '{"other": true}'}]}}]}
    with patch("domain.providers.gemini_provider.post_json", side_effect=[bad, GEMINI_OK]) as gemini:
        result = get_llm_provider().complete(MESSAGES, response_validator=validate)
    assert result.text == '{"ok": true}' and gemini.call_count == 2


def test_failed_slot_temporarily_skipped_on_next_request():
    with patch("domain.providers.gemini_provider.post_json", side_effect=[ProviderError("429", failure_type="rate_limit"), GEMINI_OK, GEMINI_OK]) as gemini:
        provider = get_llm_provider()
        provider.complete(MESSAGES)
        provider.complete(MESSAGES)
    assert [c.kwargs["headers"]["x-goog-api-key"] for c in gemini.call_args_list] == ["slot-one", "slot-two", "slot-two"]


def test_explicit_openai_primary_preserves_reverse_fallback_interface():
    with (override_settings(LLM_PROVIDER="openai"),
         patch("domain.providers.openai_provider.post_json", side_effect=ProviderError("outage")) as openai,
         patch("domain.providers.gemini_provider.post_json", return_value=GEMINI_OK) as gemini):
        result = get_llm_provider().complete(MESSAGES, workflow="understanding", assessment_id="assessment",
                                           response_format={"type": "json_object"})
    assert result.provider == "gemini" and openai.call_count == gemini.call_count == 1


def test_no_credentials_is_controlled_not_configured():
    with override_settings(GEMINI_API_KEY="", GEMINI_API_KEYS=[], OPENAI_API_KEY=""):
        with pytest.raises(ProviderNotConfigured):
            get_llm_provider().complete(MESSAGES)


def test_invalid_application_request_is_not_retried_across_keys():
    with (patch("domain.providers.gemini_provider.post_json", side_effect=ProviderError("400", failure_type="invalid_request")) as gemini,
         patch("domain.providers.openai_provider.post_json") as openai):
        with pytest.raises(ProviderError):
            get_llm_provider().complete(MESSAGES)
    assert gemini.call_count == 1
    openai.assert_not_called()


@pytest.mark.parametrize("code,kind", [(401, "authentication"), (403, "authentication"), (429, "rate_limit"), (503, "provider_unavailable"), (400, "invalid_request")])
def test_transport_classification_never_exposes_vendor_body(code, kind):
    error = urllib.error.HTTPError("https://provider.invalid", code, "error", {},
                                  io.BytesIO(b'{"error":{"message":"credential-and-business-data"}}'))
    with patch("urllib.request.urlopen", side_effect=error), pytest.raises(ProviderError) as caught:
        post_json("https://provider.invalid", {}, headers={}, provider="synthetic", max_retries=0)
    assert caught.value.failure_type == kind and caught.value.status_code == code
    assert "credential-and-business-data" not in str(caught.value)


def test_transport_timeout_classified_for_rotation():
    with patch("urllib.request.urlopen", side_effect=TimeoutError()), pytest.raises(ProviderError) as caught:
        post_json("https://provider.invalid", {}, headers={}, provider="synthetic", max_retries=0)
    assert caught.value.failure_type == "timeout"


def test_legacy_numbered_gemini_environment_keys_are_loaded_without_count_assumptions():
    import os
    import subprocess
    import sys
    env = {key:value for key,value in os.environ.items() if not key.startswith("GEMINI_API")}
    env.update(GEMINI_API_KEY="synthetic-primary", GEMINI_API1="synthetic-one",
               GEMINI_API2="synthetic-two", GEMINI_API12="synthetic-twelve",
               GEMINI_API_KEY_3="synthetic-two")
    process = subprocess.run([sys.executable,"-c", "import config.settings; from domain.providers.gemini_provider import _api_keys; print(len(_api_keys()))"],
        env={**env,"DJANGO_SETTINGS_MODULE":"config.settings"}, capture_output=True,text=True,check=True)
    assert process.stdout.strip() == "4"


def test_healthy_requests_rotate_across_three_slots():
    with patch("domain.providers.gemini_provider.post_json", return_value=GEMINI_OK) as gemini:
        for _ in range(4):
            get_llm_provider().complete(MESSAGES)
    assert [c.kwargs["headers"]["x-goog-api-key"] for c in gemini.call_args_list] == ["slot-one", "slot-two", "slot-three", "slot-one"]
    assert all(not r.fallback and r.attempt == 1 for r in telemetry_tracker._records)


def test_cooldown_slots_rejoin_after_expiry():
    with patch("domain.providers.gemini_provider.time.monotonic", return_value=100), patch("domain.providers.gemini_provider.post_json", side_effect=[ProviderError("quota", failure_type="quota"), GEMINI_OK]) as gemini:
        get_llm_provider().complete(MESSAGES)
    with patch("domain.providers.gemini_provider.time.monotonic", return_value=161), patch("domain.providers.gemini_provider.post_json", return_value=GEMINI_OK) as gemini:
        for _ in range(3): get_llm_provider().complete(MESSAGES)
    assert "slot-one" in [c.kwargs["headers"]["x-goog-api-key"] for c in gemini.call_args_list]


def test_failure_attempts_do_not_consume_logical_call_budget_before_openai(settings):
    settings.MAX_LLM_CALLS_PER_ASSESSMENT = 1
    settings.MAX_ESTIMATED_COST_PER_ASSESSMENT = 10
    with patch("domain.providers.gemini_provider.post_json", side_effect=ProviderError("quota",failure_type="quota")), patch("domain.providers.openai_provider.post_json",return_value=OPENAI_OK) as openai:
        result=get_llm_provider().complete(MESSAGES,assessment_id="logical-budget-test")
    assert result.provider == "openai" and openai.call_count == 1
    records=[r for r in telemetry_tracker._records if r.assessment_id == "logical-budget-test"]
    assert len(records) == 4 and len({r.logical_request_id for r in records}) == 1
    with pytest.raises(ProviderError) as caught:
        get_llm_provider().complete(MESSAGES,assessment_id="logical-budget-test")
    assert caught.value.failure_type == "budget"
