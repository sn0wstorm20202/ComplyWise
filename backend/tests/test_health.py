"""Health endpoint contract.

Also asserts the endpoints do not leak credentials, which is a hard requirement
(TRD_v2.0 §62) and easy to regress by adding a "helpful" debug field.
"""

from __future__ import annotations

import json

import pytest
from django.urls import reverse

pytestmark = pytest.mark.django_db


def test_liveness_is_public_and_enveloped(api_client):
    response = api_client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"data", "meta"}
    assert body["data"]["status"] == "ok"
    assert body["data"]["service"] == "complywise-api"
    assert body["data"]["api_version"] == "v1"


def test_liveness_available_under_api_version_prefix(api_client):
    unversioned = api_client.get("/health").json()["data"]
    versioned = api_client.get("/api/v1/health").json()["data"]
    assert unversioned == versioned


def test_health_urls_are_reversible():
    assert reverse("health") == "/health"
    assert reverse("api-v1:health") == "/api/v1/health"


def test_readiness_reports_each_dependency(api_client):
    response = api_client.get("/api/v1/health/ready")
    assert response.status_code in (200, 503)
    checks = response.json()["data"]["checks"]
    assert set(checks) == {"database", "pgvector", "knowledge_packs", "integrations"}
    # The database check must have actually run a query, not been assumed.
    assert checks["database"]["status"] in {"ok", "degraded", "unavailable"}


def test_readiness_declares_when_engine_is_not_the_target(api_client, settings):
    """The SQLite fallback must announce itself rather than pass silently."""
    checks = api_client.get("/api/v1/health/ready").json()["data"]["checks"]
    assert checks["database"]["is_target_engine"] is settings.DATABASE_IS_POSTGRES
    if not settings.DATABASE_IS_POSTGRES:
        assert checks["database"]["status"] == "degraded"
        assert "DATABASE_URL" in checks["database"]["note"]
        # pgvector must never be reported as available without PostgreSQL.
        assert checks["pgvector"]["status"] == "unavailable"


def test_readiness_reports_integrations_as_booleans_only(api_client, settings):
    settings.OPENAI_API_KEY = "sk-not-a-real-key-abcdefghijklmnop"
    settings.AZURE_STORAGE_CONNECTION_STRING = "AccountKey=not-a-real-key-1234567890"

    raw = json.dumps(api_client.get("/api/v1/health/ready").json())

    integrations = api_client.get("/api/v1/health/ready").json()["data"]["checks"]["integrations"]
    assert integrations["openai_api_key"] is True
    assert integrations["azure_storage"] is True
    # The values themselves must not appear anywhere in the payload.
    assert "sk-not-a-real-key" not in raw
    assert "AccountKey" not in raw


def test_readiness_does_not_invent_knowledge_packs(api_client, settings, tmp_path):
    """With zero knowledge files in the directory, status must be not_configured."""
    settings.KNOWLEDGE_PACKS_DIR = tmp_path
    packs = api_client.get("/api/v1/health/ready").json()["data"]["checks"]["knowledge_packs"]
    assert packs["status"] == "not_configured"
    assert packs["pack_count"] == 0
    assert packs["file_count"] == 0
    assert "No knowledge files found" in packs["note"]


def test_readiness_detects_repository_knowledge_packs(api_client):
    """With real repository knowledge packs, readiness reports status ok with discovered packs."""
    packs = api_client.get("/api/v1/health/ready").json()["data"]["checks"]["knowledge_packs"]
    assert packs["status"] == "ok"
    assert packs["pack_count"] >= 5
    assert packs["file_count"] >= 15


def test_readiness_with_valid_knowledge_pack(api_client, settings, tmp_path):
    """When valid knowledge files exist, readiness reports status ok with file counts."""
    pack_dir = tmp_path / "gujarat_food"
    pack_dir.mkdir()
    rule_file = pack_dir / "rules.json"
    rule_file.write_text('{"rules": [{"id": "RULE-01"}]}', encoding="utf-8")

    settings.KNOWLEDGE_PACKS_DIR = tmp_path

    packs = api_client.get("/api/v1/health/ready").json()["data"]["checks"]["knowledge_packs"]
    assert packs["status"] == "ok"
    assert packs["pack_count"] == 1
    assert packs["file_count"] == 1
    assert packs["packs"] == ["gujarat_food"]


def test_readiness_with_malformed_knowledge_pack(api_client, settings, tmp_path):
    """When a knowledge pack has malformed JSON, readiness reports degraded."""
    pack_dir = tmp_path / "corrupted_pack"
    pack_dir.mkdir()
    bad_file = pack_dir / "invalid.json"
    bad_file.write_text("{ unquoted_json: invalid ", encoding="utf-8")

    settings.KNOWLEDGE_PACKS_DIR = tmp_path

    packs = api_client.get("/api/v1/health/ready").json()["data"]["checks"]["knowledge_packs"]
    assert packs["status"] == "degraded"
    assert packs["pack_count"] == 1
    assert packs["file_count"] == 1
    assert packs["malformed_count"] == 1
    assert "Malformed knowledge files" in packs["note"]


def test_readiness_with_nonexistent_directory(api_client, settings, tmp_path):
    """When knowledge pack directory does not exist, status is not_configured."""
    settings.KNOWLEDGE_PACKS_DIR = tmp_path / "nonexistent_dir"

    packs = api_client.get("/api/v1/health/ready").json()["data"]["checks"]["knowledge_packs"]
    assert packs["status"] == "not_configured"
    assert packs["pack_count"] == 0
    assert packs["file_count"] == 0
    assert "does not exist" in packs["note"]

