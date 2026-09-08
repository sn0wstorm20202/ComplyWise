"""Service health checks.

Authority: TRD_v2.0 §31 (`/health`), §64 (operational readiness).

Two distinct questions:

- **liveness** (`/health`) — is the process up and able to answer?
- **readiness** (`/health/ready`) — are its dependencies actually usable?

The readiness payload reports *whether* an integration is configured, never the
value of any credential. `DATABASE_URL`, API keys and connection strings are
never echoed (TRD_v2.0 §62).
"""

from __future__ import annotations

import logging
from typing import Any

from django.conf import settings
from django.db import connection

logger = logging.getLogger("complywise.health")

OK = "ok"
DEGRADED = "degraded"
UNAVAILABLE = "unavailable"
NOT_CONFIGURED = "not_configured"


def check_database() -> dict[str, Any]:
    """Verify the database answers a trivial query."""
    result: dict[str, Any] = {
        "engine": "postgresql" if settings.DATABASE_IS_POSTGRES else "sqlite",
        "is_target_engine": settings.DATABASE_IS_POSTGRES,
    }
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
    except Exception as exc:  # noqa: BLE001 - any driver error means unavailable
        logger.warning("Database health check failed: %s", exc.__class__.__name__)
        result["status"] = UNAVAILABLE
        # Class name only: an exception message can contain the DSN.
        result["error"] = exc.__class__.__name__
        return result

    result["status"] = OK if settings.DATABASE_IS_POSTGRES else DEGRADED
    if not settings.DATABASE_IS_POSTGRES:
        result["note"] = (
            "Running on the local SQLite fallback. Set DATABASE_URL to the "
            "Supabase PostgreSQL connection string for the target configuration."
        )
    return result


def check_pgvector() -> dict[str, Any]:
    """Report whether the vector extension is present.

    Only meaningful on PostgreSQL. On SQLite this is reported as unavailable
    rather than pretended to be fine.
    """
    if not settings.DATABASE_IS_POSTGRES:
        return {
            "status": UNAVAILABLE,
            "note": "pgvector requires PostgreSQL; the SQLite fallback cannot provide it.",
        }
    if not settings.ENABLE_PGVECTOR:
        return {"status": NOT_CONFIGURED, "note": "ENABLE_PGVECTOR is off."}
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT extname FROM pg_extension WHERE extname = 'vector'")
            installed = cursor.fetchone() is not None
    except Exception as exc:  # noqa: BLE001
        logger.warning("pgvector health check failed: %s", exc.__class__.__name__)
        return {"status": UNAVAILABLE, "error": exc.__class__.__name__}
    return {"status": OK if installed else NOT_CONFIGURED, "installed": installed}


KNOWLEDGE_FILE_EXTENSIONS = frozenset({".json", ".yaml", ".yml"})


def check_knowledge_packs() -> dict[str, Any]:
    """Report on the knowledge pack directory.

    Verifies actual knowledge files exist and are syntactically valid JSON.
    An empty directory or directories containing zero knowledge files is reported
    as not_configured. It is never assumed non-empty (TRD_v2.0 §64).
    """
    path = settings.KNOWLEDGE_PACKS_DIR
    if not path.exists():
        return {
            "status": NOT_CONFIGURED,
            "pack_count": 0,
            "file_count": 0,
            "packs": [],
            "note": "Knowledge pack directory does not exist.",
        }

    valid_packs: list[str] = []
    total_files = 0
    malformed_files: list[str] = []

    # Find all directories within path that directly contain knowledge files
    candidate_dirs: list[Path] = []
    if any(f.is_file() and f.suffix.lower() in KNOWLEDGE_FILE_EXTENSIONS for f in path.iterdir()):
        candidate_dirs.append(path)
    for entry in sorted(path.rglob("*")):
        if entry.is_dir() and not entry.name.startswith("."):
            if any(f.is_file() and f.suffix.lower() in KNOWLEDGE_FILE_EXTENSIONS for f in entry.iterdir()):
                candidate_dirs.append(entry)

    for p_dir in candidate_dirs:
        pack_files = [
            f for f in p_dir.iterdir()
            if f.is_file() and f.suffix.lower() in KNOWLEDGE_FILE_EXTENSIONS
        ]
        for f in pack_files:
            total_files += 1
            if f.suffix.lower() == ".json":
                try:
                    import json
                    json.loads(f.read_text(encoding="utf-8"))
                except Exception:
                    malformed_files.append(f"{p_dir.name}/{f.name}")

        valid_packs.append(p_dir.name)

    if malformed_files:
        return {
            "status": DEGRADED,
            "pack_count": len(valid_packs),
            "file_count": total_files,
            "packs": valid_packs,
            "malformed_count": len(malformed_files),
            "note": f"Malformed knowledge files detected in packs: {', '.join(malformed_files[:5])}",
        }

    if total_files == 0 or not valid_packs:
        return {
            "status": NOT_CONFIGURED,
            "pack_count": 0,
            "file_count": 0,
            "packs": [],
            "note": "No knowledge files found in knowledge pack directory.",
        }

    return {
        "status": OK,
        "pack_count": len(valid_packs),
        "file_count": total_files,
        "packs": valid_packs,
    }


def check_integrations() -> dict[str, Any]:
    """Booleans only — whether each integration has been given credentials.

    Never the values. `firecrawl_api_key` in particular is server-side only and
    must not reach the frontend in any form beyond this boolean (§13).
    """
    return {
        "openai_api_key": bool(settings.OPENAI_API_KEY),
        "openai_model": bool(settings.OPENAI_MODEL),
        "openai_embedding_model": bool(settings.OPENAI_EMBEDDING_MODEL),
        "gemini_api_key": bool(settings.GEMINI_API_KEY),
        "gemini_model": bool(settings.GEMINI_MODEL),
        "gemini_embedding_model": bool(settings.GEMINI_EMBEDDING_MODEL),
        "grok_api_key": bool(settings.GROK_API_KEY),
        "grok_model": bool(settings.GROK_MODEL),
        "azure_storage": bool(settings.AZURE_STORAGE_CONNECTION_STRING),
        "firecrawl_api_key": bool(settings.FIRECRAWL_API_KEY),
    }


def check_providers() -> dict[str, Any]:
    """Report which AI provider is selected and whether it is usable.

    An unconfigured provider is `not_configured`, not an error: the compliance
    engine is deterministic and runs without any AI credential. An unrecognised
    `LLM_PROVIDER` value is reported as `invalid`, because that is a deployment
    mistake rather than an optional feature being off.
    """
    # Imported here rather than at module scope: this module is imported by
    # settings-adjacent code paths, and the registry reads Django settings.
    from domain.providers import provider_status

    return provider_status()


def liveness_payload() -> dict[str, Any]:
    return {
        "status": OK,
        "service": "complywise-api",
        "version": settings.COMPLYWISE_VERSION,
        "api_version": "v1",
    }


def readiness_payload() -> tuple[dict[str, Any], bool]:
    """Return `(payload, is_ready)`.

    Readiness requires the database. Optional integrations being unconfigured
    degrades the report but does not make the service unready — the foundation is
    expected to run before any AI credential exists.
    """
    database = check_database()
    checks = {
        "database": database,
        "pgvector": check_pgvector(),
        "knowledge_packs": check_knowledge_packs(),
        "integrations": check_integrations(),
        "providers": check_providers(),
    }
    is_ready = database.get("status") in {OK, DEGRADED}
    overall = OK if database.get("status") == OK else (DEGRADED if is_ready else UNAVAILABLE)
    payload = {
        "status": overall,
        "service": "complywise-api",
        "version": settings.COMPLYWISE_VERSION,
        "checks": checks,
    }
    return payload, is_ready
