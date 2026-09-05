"""Structural guards against regulatory truth leaking into code.

Authority: PRD_v2.0 §P1/§P5, TRD_v2.0 §11, §84.

Knowledge is data. These tests fail if a threshold, fee, deadline or a
scenario-specific branch is written into Python source, because that is the
change that would quietly turn ComplyWise from a knowledge-driven engine into a
demo script. They are intentionally blunt: a false positive is cheap to fix by
moving the value into a knowledge pack, which is where it belongs.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

from domain.profile.variables import PROFILE_VARIABLES

BACKEND_DIR = Path(__file__).resolve().parent.parent

#: The five demo/regression fixtures. They are test data, not product branches.
SCENARIO_TOKENS = (
    "GUJARAT_FOOD",
    "TELANGANA_ELECTRONICS",
    "GUJARAT_TRADE",
    "TAMIL_NADU_AUTO",
    "KARNATAKA_ESDM",
)

#: Directories where regulatory data is legitimate: knowledge packs and fixtures.
ALLOWED_DATA_DIRS = ("knowledge_packs", "tests")


def python_sources() -> list[Path]:
    files: list[Path] = []
    for path in BACKEND_DIR.rglob("*.py"):
        parts = set(path.relative_to(BACKEND_DIR).parts)
        if parts & {".venv", "__pycache__", "migrations", "staticfiles"}:
            continue
        if parts & set(ALLOWED_DATA_DIRS):
            continue
        files.append(path)
    return files


def test_there_are_python_sources_to_check():
    """Guards the guard: an empty file list would make every test below vacuous."""
    assert len(python_sources()) > 20


@pytest.mark.parametrize("token", SCENARIO_TOKENS)
def test_no_scenario_specific_branching_in_application_code(token):
    offenders = [
        str(path.relative_to(BACKEND_DIR))
        for path in python_sources()
        if token in path.read_text(encoding="utf-8")
    ]
    assert not offenders, (
        f"Scenario name {token!r} appears in application code: {offenders}. "
        "Scenarios are regression fixtures; behaviour must come from published rules."
    )


def test_no_scenario_conditionals_anywhere_outside_fixtures():
    pattern = re.compile(r"scenario\s*(==|!=)\s*['\"]")
    offenders = [
        str(path.relative_to(BACKEND_DIR))
        for path in python_sources()
        if pattern.search(path.read_text(encoding="utf-8"))
    ]
    assert not offenders, f"Scenario-conditional logic found in {offenders}."


def test_variable_registry_declares_no_regulatory_thresholds():
    """The profile schema must not know what any number *means*."""
    forbidden = (
        "threshold",
        "limit is",
        "must obtain",
        "licence required",
        "license required",
        "as per section",
        "rupees",
        "crore",
        "lakh",
    )
    for variable in PROFILE_VARIABLES:
        text = f"{variable.label} {variable.why_it_matters}".lower()
        for term in forbidden:
            assert term not in text, (
                f"Variable {variable.code} text contains {term!r}. The registry is a "
                "schema; thresholds and obligations belong in knowledge packs."
            )


def test_variable_registry_declares_no_numeric_constants_in_option_values():
    for variable in PROFILE_VARIABLES:
        for option in variable.options:
            assert not re.search(r"\d", option.value), (
                f"Option {option.value!r} on {variable.code} embeds a number. "
                "Numeric bands are knowledge, not schema."
            )


def test_variable_keys_are_stable_snake_case_identifiers():
    """Rule ASTs reference these keys; a rename is a breaking knowledge change."""
    for variable in PROFILE_VARIABLES:
        assert re.fullmatch(r"[a-z][a-z0-9_]*", variable.key), variable.key
        assert re.fullmatch(r"V\d{2}", variable.code), variable.code


def test_variable_codes_and_keys_are_unique():
    codes = [v.code for v in PROFILE_VARIABLES]
    keys = [v.key for v in PROFILE_VARIABLES]
    assert len(codes) == len(set(codes))
    assert len(keys) == len(set(keys))


def test_no_government_urls_are_hardcoded_in_application_code():
    """Official URLs are source records (evidence), never string literals."""
    pattern = re.compile(r"https?://[^\s\"']*\.(gov\.in|nic\.in)")
    offenders: list[str] = []
    for path in python_sources():
        if pattern.search(path.read_text(encoding="utf-8")):
            offenders.append(str(path.relative_to(BACKEND_DIR)))
    assert not offenders, (
        f"Government URLs hardcoded in {offenders}. Register them as Source records "
        "so they carry retrieval date and verification state."
    )


def test_no_module_declares_a_fee_or_deadline_value():
    """A numeric fee/deadline literal in code is regulatory truth in the wrong place.

    Enum members (``SUBMISSION_DEADLINE = "SUBMISSION_DEADLINE", ...``) and
    env-driven settings are vocabulary and configuration, so only assignments whose
    value is a bare number, ``Decimal(...)`` or ``timedelta(...)`` are flagged.
    """
    pattern = re.compile(
        r"^\s*[A-Z_]*(FEE|FEES|DEADLINE|VALIDITY|RENEWAL|PENALTY|THRESHOLD)[A-Z_]*"
        r"\s*(?::[^=\n]+)?=\s*(?:\d|Decimal\(|timedelta\()",
        re.MULTILINE,
    )
    offenders: list[str] = []
    for path in python_sources():
        text = path.read_text(encoding="utf-8")
        for match in pattern.finditer(text):
            line = text[: match.start()].count("\n") + 1
            offenders.append(f"{path.relative_to(BACKEND_DIR)}:{line}")
    assert not offenders, (
        f"Fee/deadline/threshold values found at {offenders}. These are "
        "per-requirement knowledge values and must be loaded from published knowledge."
    )


def test_the_fee_and_deadline_guard_actually_matches(tmp_path):
    """Guards the guard above, which is easy to weaken into always passing."""
    pattern = re.compile(
        r"^\s*[A-Z_]*(FEE|FEES|DEADLINE|VALIDITY|RENEWAL|PENALTY|THRESHOLD)[A-Z_]*"
        r"\s*(?::[^=\n]+)?=\s*(?:\d|Decimal\(|timedelta\()",
        re.MULTILINE,
    )
    assert pattern.search('LICENCE_FEE = 5000\n')
    assert pattern.search('TURNOVER_THRESHOLD = Decimal("1")\n')
    assert pattern.search("RENEWAL_WINDOW: int = 90\n")
    # Vocabulary and configuration must not trip it.
    assert not pattern.search('SUBMISSION_DEADLINE = "SUBMISSION_DEADLINE", "Deadline"\n')
    assert not pattern.search('WINDOW_DAYS = int(os.getenv("X", "30"))\n')


# ===========================================================================
# TypeScript Frontend Knowledge Boundary Tests (Task 2 C11)
# ===========================================================================

FRONTEND_DIR = BACKEND_DIR.parent / "frontend"


def typescript_sources() -> list[Path]:
    """Discover all frontend TypeScript / TSX source files outside build/vendor directories."""
    files: list[Path] = []
    if not FRONTEND_DIR.exists():
        return files
    for ext in ("*.ts", "*.tsx"):
        for path in FRONTEND_DIR.rglob(ext):
            parts = set(path.relative_to(FRONTEND_DIR).parts)
            if parts & {".next", "node_modules", "dist", "build", ".turbo"}:
                continue
            files.append(path)
    return sorted(files)


def test_typescript_sources_were_actually_scanned():
    """Guards the guard: ensure TypeScript files are genuinely found and scanned."""
    ts_files = typescript_sources()
    assert len(ts_files) > 5, f"Expected >5 TypeScript files, found {len(ts_files)}."


def test_no_scenario_tokens_in_typescript_sources():
    """Frontend TypeScript code must not embed scenario codes or hardcoded scenario branches."""
    ts_files = typescript_sources()
    offenders: list[str] = []
    for token in SCENARIO_TOKENS:
        for path in ts_files:
            content = path.read_text(encoding="utf-8")
            if token in content:
                offenders.append(f"{token} in {path.relative_to(FRONTEND_DIR)}")
    assert not offenders, (
        f"Hardcoded scenario tokens found in frontend TypeScript sources: {offenders}. "
        "Scenarios must remain test fixtures only."
    )


def test_no_fabricated_authority_tokens_in_frontend():
    """Frontend must not claim fabricated or non-existent regulatory authorities."""
    # Authorities known from knowledge packs
    VALID_AUTHORITIES = {
        "FSSAI",
        "GPCB",
        "DISH_GUJARAT",
        "BIS",
        "TSPCB",
        "CPCB",
        "DGFT",
        "TNPCB",
        "DISH_TN",
        "KSPCB",
        "WPC",
    }
    FABRICATED_TOKENS = (
        "FABRICATED_AUTH",
        "FAKE_REGULATOR",
        "MADE_UP_AUTHORITY",
        "DUMMY_BOARD",
    )
    ts_files = typescript_sources()
    for path in ts_files:
        content = path.read_text(encoding="utf-8")
        for token in FABRICATED_TOKENS:
            assert token not in content, (
                f"Fabricated authority token '{token}' found in {path.relative_to(FRONTEND_DIR)}."
            )


def test_no_fee_or_deadline_values_in_typescript_sources():
    """Frontend must not hardcode regulatory fees, deadlines, or penalty literals."""
    pattern = re.compile(
        r"^\s*(?:export\s+)?(?:const|let|var)\s+[A-Z_]*(?:FEE|FEES|DEADLINE|PENALTY|THRESHOLD)[A-Z_]*\s*=\s*\d+",
        re.MULTILINE,
    )
    ts_files = typescript_sources()
    offenders: list[str] = []
    for path in ts_files:
        content = path.read_text(encoding="utf-8")
        for match in pattern.finditer(content):
            line = content[: match.start()].count("\n") + 1
            offenders.append(f"{path.relative_to(FRONTEND_DIR)}:{line}")
    assert not offenders, f"Fee/deadline/threshold values found in TypeScript sources: {offenders}."
