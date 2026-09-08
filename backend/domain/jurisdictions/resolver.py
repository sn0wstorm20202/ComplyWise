"""Data-driven jurisdiction normalizer and alias resolver.

Authority: TRD_v2.0 §10, §14; Task 2 C4 Audit Corrections.

Invariant: NO hardcoded state or territory mappings exist in Python source code.
All canonical codes and aliases are loaded dynamically from knowledge-pack data:
`backend/knowledge_packs/jurisdictions/jurisdictions.json`.
"""

from __future__ import annotations

import json
from pathlib import Path
import re
from typing import Any

from django.conf import settings


def _clean_token(token: str) -> str:
    """Lowercase and normalize whitespace and punctuation for fuzzy alias matching."""
    cleaned = token.strip().lower()
    cleaned = re.sub(r"[\s_-]+", " ", cleaned)
    return cleaned


class JurisdictionRegistry:
    """In-memory cache of canonical jurisdictions loaded from knowledge data."""

    _alias_map: dict[str, str] = {}
    _canonical_codes: set[str] = set()
    _display_names: dict[str, str] = {}
    _loaded: bool = False

    @classmethod
    def load(cls, file_path: Path | None = None) -> None:
        path = file_path or (settings.KNOWLEDGE_PACKS_DIR / "jurisdictions" / "jurisdictions.json")
        if not path.exists():
            return

        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return

        cls._alias_map = {}
        cls._canonical_codes = set()
        cls._display_names = {}

        for item in data:
            code = item.get("code")
            if not code or not isinstance(code, str):
                continue
            canonical = code.strip().upper()
            cls._canonical_codes.add(canonical)
            cls._alias_map[_clean_token(canonical)] = canonical

            name = item.get("name")
            if name and isinstance(name, str):
                cls._alias_map[_clean_token(name)] = canonical
                cls._display_names[canonical] = name.strip()

            for alias in item.get("aliases", []):
                if isinstance(alias, str) and alias.strip():
                    cls._alias_map[_clean_token(alias)] = canonical

        cls._loaded = True

    @classmethod
    def normalize(cls, val: Any) -> str | None:
        """Normalize an input jurisdiction string to its canonical code.

        Returns canonical code (e.g. 'TAMIL_NADU', 'CENTRAL') if resolvable,
        or None if input is empty, null, or unresolvable.
        """
        if not cls._loaded:
            cls.load()

        if val is None:
            return None

        raw = str(val).strip()
        if not raw:
            return None

        cleaned = _clean_token(raw)
        return cls._alias_map.get(cleaned)

    @classmethod
    def is_canonical(cls, code: str) -> bool:
        if not cls._loaded:
            cls.load()
        return code.strip().upper() in cls._canonical_codes

    @classmethod
    def all_jurisdictions(cls) -> list[dict[str, str]]:
        """Every canonical jurisdiction, for rendering a selector.

        The frontend must not carry its own list of states: a jurisdiction the
        knowledge base has never heard of cannot be normalised, so offering it
        would let a user pick a value that silently resolves to nothing.
        """
        if not cls._loaded:
            cls.load()
        return [
            {"code": code, "name": cls._display_names.get(code, code)}
            for code in sorted(cls._canonical_codes)
        ]


def normalize_jurisdiction(val: Any) -> str | None:
    """Normalize input jurisdiction string using data-driven knowledge registry."""
    return JurisdictionRegistry.normalize(val)
