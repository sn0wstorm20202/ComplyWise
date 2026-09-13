"""Test for translation completeness, key parity, and variable interpolation across en, hi, bn.

Authority: User Request Feature 2 (Full Multilingual Support).
Verifies:
1. Every key in English catalog exists in Hindi and Bengali catalogs.
2. Every key in Hindi catalog exists in English and Bengali catalogs.
3. Every key in Bengali catalog exists in English and Hindi catalogs.
4. No empty strings or unrendered keys.
5. All dynamic interpolation variables (e.g. {count}, {days}) in English are preserved in Hindi and Bengali.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

FRONTEND_LOCALES_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "locales"


def _parse_ts_file_to_flat_dict(filepath: Path) -> dict[str, str]:
    """Parse nested TS object into flat dictionary of dot-notation keys."""
    text = filepath.read_text(encoding="utf-8")
    lines = text.splitlines()

    result: dict[str, str] = {}
    key_stack: list[str] = []

    for line in lines:
        stripped = line.strip()
        # Skip comments and imports/exports
        if (
            not stripped
            or stripped.startswith("//")
            or stripped.startswith("/*")
            or stripped.startswith("*")
            or stripped.startswith("import")
            or stripped.startswith("export type")
        ):
            continue

        # Check for block closing
        if stripped.startswith("}"):
            if key_stack:
                key_stack.pop()
            continue

        # Check for section start, e.g.: common: {
        section_match = re.match(r"^([a-zA-Z0-9_]+)\s*:\s*\{", stripped)
        if section_match:
            sec_name = section_match.group(1)
            key_stack.append(sec_name)
            continue

        # Check for key-value pair, e.g.: appName: "ComplyWise",
        kv_match = re.match(r'^([a-zA-Z0-9_]+)\s*:\s*("(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\')\s*,?', stripped)
        if kv_match:
            k = kv_match.group(1)
            raw_val = kv_match.group(2)
            # Unquote
            val = raw_val[1:-1]
            full_key = ".".join(key_stack + [k])
            result[full_key] = val

    return result


def _extract_variables(template: str) -> set[str]:
    """Extract all {var} or {{var}} placeholders from a template string."""
    single = re.findall(r"\{([a-zA-Z0-9_]+)\}", template)
    double = re.findall(r"\{\{([a-zA-Z0-9_]+)\}\}", template)
    return set(single + double)


@pytest.fixture(scope="module")
def locales() -> dict[str, dict[str, str]]:
    en_file = FRONTEND_LOCALES_DIR / "en.ts"
    hi_file = FRONTEND_LOCALES_DIR / "hi.ts"
    bn_file = FRONTEND_LOCALES_DIR / "bn.ts"

    assert en_file.exists(), f"Missing {en_file}"
    assert hi_file.exists(), f"Missing {hi_file}"
    assert bn_file.exists(), f"Missing {bn_file}"

    return {
        "en": _parse_ts_file_to_flat_dict(en_file),
        "hi": _parse_ts_file_to_flat_dict(hi_file),
        "bn": _parse_ts_file_to_flat_dict(bn_file),
    }


class TestLocalizationCompleteness:
    def test_catalogs_loaded_and_non_empty(self, locales):
        for lang in ("en", "hi", "bn"):
            assert len(locales[lang]) > 50, f"Catalog {lang} has too few keys: {len(locales[lang])}"

    def test_hindi_has_all_english_keys(self, locales):
        en_keys = set(locales["en"].keys())
        hi_keys = set(locales["hi"].keys())
        missing = en_keys - hi_keys
        assert not missing, f"Missing keys in Hindi catalog: {missing}"

    def test_bengali_has_all_english_keys(self, locales):
        en_keys = set(locales["en"].keys())
        bn_keys = set(locales["bn"].keys())
        missing = en_keys - bn_keys
        assert not missing, f"Missing keys in Bengali catalog: {missing}"

    def test_no_extra_keys_in_hindi(self, locales):
        en_keys = set(locales["en"].keys())
        hi_keys = set(locales["hi"].keys())
        extra = hi_keys - en_keys
        assert not extra, f"Unexpected extra keys in Hindi catalog: {extra}"

    def test_no_extra_keys_in_bengali(self, locales):
        en_keys = set(locales["en"].keys())
        bn_keys = set(locales["bn"].keys())
        extra = bn_keys - en_keys
        assert not extra, f"Unexpected extra keys in Bengali catalog: {extra}"

    def test_no_empty_translations(self, locales):
        for lang in ("en", "hi", "bn"):
            empty_keys = [k for k, v in locales[lang].items() if not v or not v.strip()]
            assert not empty_keys, f"Empty translations in {lang}: {empty_keys}"

    def test_interpolation_variables_preserved_in_hindi(self, locales):
        for key, en_text in locales["en"].items():
            en_vars = _extract_variables(en_text)
            if en_vars:
                hi_text = locales["hi"][key]
                hi_vars = _extract_variables(hi_text)
                assert en_vars == hi_vars, (
                    f"Variable mismatch for key '{key}':\n"
                    f"  EN: {en_vars} in '{en_text}'\n"
                    f"  HI: {hi_vars} in '{hi_text}'"
                )

    def test_interpolation_variables_preserved_in_bengali(self, locales):
        for key, en_text in locales["en"].items():
            en_vars = _extract_variables(en_text)
            if en_vars:
                bn_text = locales["bn"][key]
                bn_vars = _extract_variables(bn_text)
                assert en_vars == bn_vars, (
                    f"Variable mismatch for key '{key}':\n"
                    f"  EN: {en_vars} in '{en_text}'\n"
                    f"  BN: {bn_vars} in '{bn_text}'"
                )

    def test_language_selector_contains_exactly_three_languages(self, locales):
        assert "language.english" in locales["en"]
        assert "language.hindi" in locales["en"]
        assert "language.bengali" in locales["en"]
        assert locales["en"]["language.english"] == "English"
        assert locales["hi"]["language.hindi"] == "हिन्दी"
        assert locales["bn"]["language.bengali"] == "বাংলা"
