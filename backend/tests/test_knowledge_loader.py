"""Unit and integration tests for hardened KnowledgePackLoader.

Authority: TRD_v2.0 §27; PRD_v2.0 §1; Task 2 C8 Audit Corrections.

Verifies:
1. Missing statuses default to DRAFT and UNVERIFIED.
2. Reviewer statuses (REJECTED, CONFLICTING) preserved on reload unless force_status=True.
3. Schema validation strictly rejects unknown keys (additionalProperties: false).
4. Duplicate IDs across packs fail the load.
5. Dangling evidence references raise actionable errors.
6. Unknown AST variables outside canonical V01-V19 registry raise errors.
7. Non-ISO malformed dates raise errors (never silently coerced to None).
8. Loader error messages explicitly name the pack directory and file name.
9. Orphan rules without valid requirements raise actionable errors.
"""

from __future__ import annotations

import json
from pathlib import Path
import pytest

from common.enums import KnowledgeStatus, SourceStatus, VerificationStatus
from apps.evidence.models import Evidence, Source
from apps.knowledge.loader import KnowledgePackLoader, KnowledgePackLoaderError
from apps.knowledge.models import RequirementDefinition, RuleVersion


def _write_pack_files(
    pack_dir: Path,
    sources: list[dict] | None = None,
    evidence: list[dict] | None = None,
    requirements: list[dict] | None = None,
    rules: list[dict] | None = None,
) -> None:
    pack_dir.mkdir(parents=True, exist_ok=True)
    if sources is not None:
        (pack_dir / "sources.json").write_text(json.dumps(sources), encoding="utf-8")
    if evidence is not None:
        (pack_dir / "evidence.json").write_text(json.dumps(evidence), encoding="utf-8")
    if requirements is not None:
        (pack_dir / "requirements.json").write_text(json.dumps(requirements), encoding="utf-8")
    if rules is not None:
        (pack_dir / "rules.json").write_text(json.dumps(rules), encoding="utf-8")


@pytest.fixture
def minimal_valid_pack(tmp_path: Path) -> Path:
    pack = tmp_path / "valid_pack"
    sources = [
        {
            "source_id": "SRC-VALID-01",
            "authority": "TEST_AUTH",
            "title": "Test Source",
        }
    ]
    evidence = [
        {
            "evidence_id": "EVD-VALID-01",
            "source_id": "SRC-VALID-01",
            "locator": "Sec 1",
            "excerpt": "Excerpt",
            "verification_status": "VERIFIED",
        }
    ]
    requirements = [
        {
            "requirement_id": "REQ-VALID-01",
            "name": "Valid Req",
            "authority": "TEST_AUTH",
            "jurisdiction": "CENTRAL",
            "domain": "FOOD",
            "status": "PUBLISHED",
            "evidence_refs": ["EVD-VALID-01"],
        }
    ]
    rules = [
        {
            "rule_id": "RULE-VALID-01",
            "version": 1,
            "domain": "FOOD",
            "jurisdiction": "CENTRAL",
            "requirement_id": "REQ-VALID-01",
            "status": "PUBLISHED",
            "condition_ast": {
                "op": "EQ",
                "left": {"var": "state"},
                "right": "GUJARAT",
            },
            "result": "APPLICABLE",
            "evidence_refs": ["EVD-VALID-01"],
        }
    ]
    _write_pack_files(pack, sources, evidence, requirements, rules)
    return pack


@pytest.mark.django_db
def test_pack_without_status_loads_as_draft(tmp_path: Path):
    """Omitting status in JSON must default to DRAFT and UNVERIFIED."""
    pack = tmp_path / "draft_defaults_pack"
    sources = [
        {
            "source_id": "SRC-DRAFT-01",
            "authority": "DRAFT_AUTH",
            "title": "Draft Source",
        }
    ]
    evidence = [
        {
            "evidence_id": "EVD-DRAFT-01",
            "source_id": "SRC-DRAFT-01",
            "locator": "Sec 2",
            "excerpt": "Draft excerpt",
            # verification_status omitted
        }
    ]
    requirements = [
        {
            "requirement_id": "REQ-DRAFT-01",
            "name": "Draft Req",
            "authority": "DRAFT_AUTH",
            "jurisdiction": "CENTRAL",
            "domain": "FOOD",
            # status omitted
            "evidence_refs": ["EVD-DRAFT-01"],
        }
    ]
    rules = [
        {
            "rule_id": "RULE-DRAFT-01",
            "version": 1,
            "domain": "FOOD",
            "jurisdiction": "CENTRAL",
            "requirement_id": "REQ-DRAFT-01",
            # status omitted
            "condition_ast": {
                "op": "EQ",
                "left": {"var": "state"},
                "right": "GUJARAT",
            },
            "result": "APPLICABLE",
            "evidence_refs": ["EVD-DRAFT-01"],
        }
    ]
    _write_pack_files(pack, sources, evidence, requirements, rules)

    loader = KnowledgePackLoader(tmp_path)
    loader.load_pack_from_dir(pack)

    req = RequirementDefinition.objects.get(requirement_id="REQ-DRAFT-01")
    assert req.status == KnowledgeStatus.DRAFT

    rule = RuleVersion.objects.get(rule_id="RULE-DRAFT-01")
    assert rule.status == KnowledgeStatus.DRAFT

    ev = Evidence.objects.get(evidence_id="EVD-DRAFT-01")
    assert ev.verification_status == VerificationStatus.UNVERIFIED


@pytest.mark.django_db
def test_reload_preserves_reviewer_status(minimal_valid_pack: Path, tmp_path: Path):
    """Reloading a pack must not overwrite human reviewer decisions (REJECTED, CONFLICTING) without --force-status."""
    loader = KnowledgePackLoader(tmp_path)
    loader.load_pack_from_dir(minimal_valid_pack)

    # Reviewer marks requirement as REJECTED and evidence as CONFLICTING
    req = RequirementDefinition.objects.get(requirement_id="REQ-VALID-01")
    req.status = KnowledgeStatus.REJECTED
    req.save()

    ev = Evidence.objects.get(evidence_id="EVD-VALID-01")
    ev.verification_status = VerificationStatus.CONFLICTING
    ev.save()

    # Normal reload: reviewer status must be preserved
    loader.load_pack_from_dir(minimal_valid_pack, force_status=False)
    req.refresh_from_db()
    ev.refresh_from_db()
    assert req.status == KnowledgeStatus.REJECTED
    assert ev.verification_status == VerificationStatus.CONFLICTING

    # Reload with force_status=True: resets to pack declaration
    loader.load_pack_from_dir(minimal_valid_pack, force_status=True)
    req.refresh_from_db()
    ev.refresh_from_db()
    assert req.status == KnowledgeStatus.PUBLISHED
    assert ev.verification_status == VerificationStatus.VERIFIED


@pytest.mark.django_db
def test_unknown_key_is_rejected(tmp_path: Path):
    """JSON schema with additionalProperties: false must reject typo or unknown keys."""
    pack = tmp_path / "bad_keys_pack"
    sources = [
        {
            "source_id": "SRC-BAD-01",
            "authority": "TEST",
            "title": "Test",
            "totally_made_up_key": "not_allowed",
        }
    ]
    _write_pack_files(pack, sources=sources)

    loader = KnowledgePackLoader(tmp_path)
    with pytest.raises(KnowledgePackLoaderError) as exc_info:
        loader.load_pack_from_dir(pack)

    assert "sources.json" in str(exc_info.value)
    assert "Schema validation error" in str(exc_info.value)


@pytest.mark.django_db
def test_duplicate_ids_across_packs_raise(tmp_path: Path):
    """Duplicate IDs across packs in a batch load must raise KnowledgePackLoaderError."""
    pack1 = tmp_path / "pack1"
    pack2 = tmp_path / "pack2"

    sources = [{"source_id": "SRC-DUP-01", "authority": "AUTH1", "title": "Src 1"}]
    _write_pack_files(pack1, sources=sources, rules=[])
    _write_pack_files(pack2, sources=sources, rules=[])

    loader = KnowledgePackLoader(tmp_path)
    with pytest.raises(KnowledgePackLoaderError) as exc_info:
        loader.load_all_packs()

    assert "Duplicate source_id 'SRC-DUP-01'" in str(exc_info.value)


@pytest.mark.django_db
def test_dangling_evidence_ref_raises(tmp_path: Path):
    """Rule referencing evidence that does not exist must raise KnowledgePackLoaderError."""
    pack = tmp_path / "dangling_pack"
    sources = [{"source_id": "SRC-DANGLING", "authority": "AUTH", "title": "Title"}]
    requirements = [
        {
            "requirement_id": "REQ-DANGLING",
            "name": "Req",
            "authority": "AUTH",
            "jurisdiction": "CENTRAL",
            "domain": "FOOD",
            "evidence_refs": [],
        }
    ]
    rules = [
        {
            "rule_id": "RULE-DANGLING",
            "requirement_id": "REQ-DANGLING",
            "condition_ast": {"op": "EQ", "left": {"var": "state"}, "right": "GUJARAT"},
            "evidence_refs": ["EVD-NON-EXISTENT-999"],
        }
    ]
    _write_pack_files(pack, sources=sources, requirements=requirements, rules=rules)

    loader = KnowledgePackLoader(tmp_path)
    with pytest.raises(KnowledgePackLoaderError) as exc_info:
        loader.load_pack_from_dir(pack)

    assert "has dangling evidence reference 'EVD-NON-EXISTENT-999'" in str(exc_info.value)


@pytest.mark.django_db
def test_unknown_ast_variable_raises(tmp_path: Path):
    """Rule referencing variable outside canonical V01-V19 registry must raise KnowledgePackLoaderError."""
    pack = tmp_path / "unknown_var_pack"
    sources = [{"source_id": "SRC-VAR", "authority": "AUTH", "title": "Title"}]
    requirements = [
        {
            "requirement_id": "REQ-VAR",
            "name": "Req",
            "authority": "AUTH",
            "jurisdiction": "CENTRAL",
            "domain": "FOOD",
        }
    ]
    rules = [
        {
            "rule_id": "RULE-VAR",
            "requirement_id": "REQ-VAR",
            "condition_ast": {
                "op": "EQ",
                "left": {"var": "fabricated_unregistered_variable_123"},
                "right": "YES",
            },
        }
    ]
    _write_pack_files(pack, sources=sources, requirements=requirements, rules=rules)

    loader = KnowledgePackLoader(tmp_path)
    with pytest.raises(KnowledgePackLoaderError) as exc_info:
        loader.load_pack_from_dir(pack)

    assert "unknown AST variable 'fabricated_unregistered_variable_123'" in str(exc_info.value)


@pytest.mark.django_db
def test_non_iso_date_raises(tmp_path: Path):
    """Non-empty invalid dates such as '01/04/2026' must raise KnowledgePackLoaderError, not become None."""
    pack = tmp_path / "bad_date_pack"
    sources = [
        {
            "source_id": "SRC-DATE-01",
            "authority": "AUTH",
            "title": "Title",
            "effective_date": "01/04/2026",  # Malformed, not ISO
        }
    ]
    _write_pack_files(pack, sources=sources)

    loader = KnowledgePackLoader(tmp_path)
    with pytest.raises(KnowledgePackLoaderError) as exc_info:
        loader.load_pack_from_dir(pack)

    assert "has invalid non-empty date '01/04/2026'" in str(exc_info.value)


@pytest.mark.django_db
def test_loader_error_message_names_pack_and_file(tmp_path: Path):
    """Loader error messages must name both the pack directory and the specific file."""
    pack = tmp_path / "special_pack_name_xyz"
    sources = [
        {
            "source_id": "SRC-XYZ",
            "authority": "AUTH",
            "title": "Title",
            "bad_field": 123,
        }
    ]
    _write_pack_files(pack, sources=sources)

    loader = KnowledgePackLoader(tmp_path)
    with pytest.raises(KnowledgePackLoaderError) as exc_info:
        loader.load_pack_from_dir(pack)

    err = str(exc_info.value)
    assert "special_pack_name_xyz" in err
    assert "sources.json" in err


@pytest.mark.django_db
def test_orphan_rule_raises_actionable_error(tmp_path: Path):
    """Rule referencing a non-existent requirement must raise an actionable orphan error."""
    pack = tmp_path / "orphan_rule_pack"
    rules = [
        {
            "rule_id": "RULE-ORPHAN-01",
            "requirement_id": "REQ-NONEXISTENT-ORPHAN",
            "condition_ast": {"op": "EQ", "left": {"var": "state"}, "right": "GUJARAT"},
        }
    ]
    _write_pack_files(pack, rules=rules)

    loader = KnowledgePackLoader(tmp_path)
    with pytest.raises(KnowledgePackLoaderError) as exc_info:
        loader.load_pack_from_dir(pack)

    assert "references orphan requirement 'REQ-NONEXISTENT-ORPHAN'" in str(exc_info.value)
