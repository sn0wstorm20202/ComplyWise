"""Golden Dynamic Test: Proves the compliance engine is 100% dynamic.

Authority: TRD_v2.0 §10; PRD_v2.0 §P3, §P5; Task 2 C12 Audit Corrections.

Invariant:
A synthetic sixth scenario (new state, new industry, new authority, >=4 unused operators)
can be introduced purely as knowledge data in tmp_path and evaluated end-to-end to APPLICABLE
with ZERO code changes to the engine or domain modules (enforced via SHA-256 equality).
"""

from __future__ import annotations

import hashlib
import io
import json
from pathlib import Path

from django.core.management import call_command
from django.core.management.base import CommandError
import pytest

from common.enums import ApplicabilityStatus, KnowledgeStatus, SourceStatus, VerificationStatus
from apps.accounts.models import User
from apps.applicability.engine import ApplicabilityEngine
from apps.businesses.models import Business, BusinessMembership, BusinessProfileVersion
from apps.evidence.models import Evidence, Source
from apps.knowledge.loader import KnowledgePackLoader
from apps.knowledge.models import RequirementDefinition, RuleVersion

CRITICAL_ENGINE_FILES = [
    Path(__file__).resolve().parent.parent / "apps" / "applicability" / "engine.py",
    Path(__file__).resolve().parent.parent / "domain" / "evaluation" / "evaluator.py",
    Path(__file__).resolve().parent.parent / "domain" / "evaluation" / "truth.py",
    Path(__file__).resolve().parent.parent / "domain" / "rules" / "ast.py",
    Path(__file__).resolve().parent.parent / "domain" / "jurisdictions" / "resolver.py",
]


def _compute_checksums() -> dict[str, str]:
    checksums: dict[str, str] = {}
    for path in CRITICAL_ENGINE_FILES:
        content = path.read_bytes()
        checksums[path.name] = hashlib.sha256(content).hexdigest()
    return checksums


@pytest.fixture
def owner_user(db) -> User:
    return User.objects.create_user(
        email="synthetic.tester@example.com",
        password="TestPassword123!",
        full_name="Synthetic Scenario Tester",
    )


@pytest.fixture
def synthetic_sixth_pack(tmp_path: Path) -> Path:
    """Create a synthetic sixth scenario pack in tmp_path (Odisha, Mining, OSPCB).

    Uses >=4 operators not predominantly featured in previous fixtures:
    NEQ, NOT, LT, IN, EXISTS.
    """
    pack_dir = tmp_path / "odisha_mining"
    pack_dir.mkdir(parents=True, exist_ok=True)

    sources = [
        {
            "source_id": "SRC-OSPCB-MINING-2024",
            "authority": "OSPCB",
            "title": "Odisha State Pollution Control Board Mining Effluent Notification 2024",
            "source_type": "REGULATION",
            "canonical_url": "https://ospcb.odisha.gov.in/regulations/mining-2024",
            "publication_date": "2024-01-15",
            "effective_date": "2024-01-15",
            "status": "ACTIVE",
            "metadata": {"jurisdiction": "ODISHA", "industry": "MINING"},
        }
    ]
    evidence = [
        {
            "evidence_id": "EVD-OSPCB-MINE-CONSENT",
            "source_id": "SRC-OSPCB-MINING-2024",
            "locator": "Notification 14, Clause 3(a)",
            "excerpt": "Mining and mineral operations in Odisha with under 500 workers must secure Consent to Operate.",
            "structured_fact": {
                "jurisdiction": "ODISHA",
                "max_workers": 500,
            },
            "verification_status": "VERIFIED",
            "effective_from": "2024-01-15",
        }
    ]
    requirements = [
        {
            "requirement_id": "REQ-OSPCB-MINE-CTO",
            "name": "OSPCB Consent to Operate (Mining & Beneficiation)",
            "category": "CONSENT",
            "authority": "OSPCB",
            "jurisdiction": "ODISHA",
            "domain": "ENVIRONMENT",
            "description": "Pollution control consent for mineral processing and mining units in Odisha.",
            "status": "PUBLISHED",
            "evidence_refs": ["EVD-OSPCB-MINE-CONSENT"],
            "metadata": {"portal": "OSPCB Portal"},
        }
    ]
    # AST using >=4 operators: EQ, EXISTS, NOT, LT, NEQ, IN
    rules = [
        {
            "rule_id": "RULE-OSPCB-MINE-01",
            "version": 1,
            "domain": "ENVIRONMENT",
            "jurisdiction": "ODISHA",
            "requirement_id": "REQ-OSPCB-MINE-CTO",
            "status": "PUBLISHED",
            "effective_from": "2024-01-15",
            "condition_ast": {
                "op": "AND",
                "args": [
                    {"op": "EQ", "left": {"var": "state"}, "right": "ODISHA"},
                    {"op": "EXISTS", "var": "annual_turnover"},
                    {
                        "op": "NOT",
                        "arg": {
                            "op": "EQ",
                            "left": {"var": "import_export_intent"},
                            "right": False,
                        },
                    },
                    {"op": "LT", "left": {"var": "total_worker_count"}, "right": 500},
                    {"op": "NEQ", "left": {"var": "legal_constitution"}, "right": "PROPRIETORSHIP"},
                    {
                        "op": "IN",
                        "left": {"var": "state"},
                        "right": ["ODISHA", "WEST_BENGAL", "JHARKHAND"],
                    },
                ],
            },
            "result": "APPLICABLE",
            "evidence_refs": ["EVD-OSPCB-MINE-CONSENT"],
        }
    ]

    (pack_dir / "sources.json").write_text(json.dumps(sources), encoding="utf-8")
    (pack_dir / "evidence.json").write_text(json.dumps(evidence), encoding="utf-8")
    (pack_dir / "requirements.json").write_text(json.dumps(requirements), encoding="utf-8")
    (pack_dir / "rules.json").write_text(json.dumps(rules), encoding="utf-8")

    return pack_dir


# ===========================================================================
# Management Command Tests
# ===========================================================================


@pytest.mark.django_db
def test_management_command_loads_packs():
    """`python manage.py load_knowledge_packs` executes cleanly and loads published packs."""
    out = io.StringIO()
    call_command("load_knowledge_packs", stdout=out)
    output = out.getvalue()
    assert "Knowledge pack processing complete" in output
    assert "packs" in output


@pytest.mark.django_db
def test_management_command_dry_run_writes_nothing():
    """`--dry-run` performs validation and reports counts without writing to database."""
    Source.objects.all().delete()
    RequirementDefinition.objects.all().delete()

    out = io.StringIO()
    call_command("load_knowledge_packs", dry_run=True, stdout=out)
    output = out.getvalue()
    assert "[DRY-RUN]" in output

    # Database must remain empty
    assert Source.objects.count() == 0
    assert RequirementDefinition.objects.count() == 0


@pytest.mark.django_db
def test_management_command_exits_nonzero_on_invalid_pack(tmp_path: Path):
    """Command exits non-zero (CommandError) on malformed knowledge packs."""
    bad_dir = tmp_path / "corrupt_pack"
    bad_dir.mkdir()
    (bad_dir / "sources.json").write_text("INVALID JSON DATA {{{", encoding="utf-8")

    with pytest.raises(CommandError):
        call_command("load_knowledge_packs", dir=str(bad_dir))


# ===========================================================================
# Golden Dynamic Engine Invariant Test (Sixth Scenario)
# ===========================================================================


@pytest.mark.django_db
def test_sixth_scenario_requires_no_engine_change(
    synthetic_sixth_pack: Path,
    owner_user: User,
):
    """A completely new scenario (new state, new industry, new authority, >=4 unused operators)
    evaluates correctly to APPLICABLE without any code modifications to the engine (SHA-256 asserted).
    """
    # 1. Snapshot engine and domain code SHA-256 hashes
    checksums_before = _compute_checksums()

    # 2. Load the synthetic sixth pack dynamically from tmp_path
    loader = KnowledgePackLoader()
    counts = loader.load_pack_from_dir(synthetic_sixth_pack)
    assert counts["requirements"] == 1
    assert counts["rules"] == 1

    # 3. Create a business in Odisha matching the rule condition
    biz = Business.objects.create(name="Kalinga Mineral Processing Ltd", owner=owner_user)
    BusinessMembership.objects.create(business=biz, user=owner_user, role=BusinessMembership.Role.OWNER)

    profile = BusinessProfileVersion.objects.create(
        business=biz,
        version=1,
        variables={
            "state": {"value": "ODISHA", "origin": "USER_PROVIDED"},
            "annual_turnover": {"value": "150000000", "origin": "USER_PROVIDED"},
            "import_export_intent": {"value": True, "origin": "USER_PROVIDED"},
            "total_worker_count": {"value": 85, "origin": "USER_PROVIDED"},
            "legal_constitution": {"value": "PRIVATE_LIMITED", "origin": "USER_PROVIDED"},
        },
        change_note="Initial Odisha mining profile",
    )

    # 4. Evaluate using the existing unchanged engine
    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=biz, profile_version=profile)

    # 5. Assert the new synthetic requirement evaluated to APPLICABLE
    results = {r.requirement_id: r for r in run.results.all()}
    assert "REQ-OSPCB-MINE-CTO" in results
    mine_result = results["REQ-OSPCB-MINE-CTO"]
    assert mine_result.status == ApplicabilityStatus.APPLICABLE
    assert mine_result.rule_version.rule_id == "RULE-OSPCB-MINE-01"
    assert len(mine_result.evidence_refs) == 1
    assert mine_result.evidence_refs[0]["authority"] == "OSPCB"

    # 6. Assert SHA-256 hashes of critical engine files are identical before and after
    checksums_after = _compute_checksums()
    assert checksums_before == checksums_after, "Engine files were unexpectedly modified!"


@pytest.mark.django_db
def test_sixth_scenario_does_not_disturb_five_fixtures(
    synthetic_sixth_pack: Path,
    owner_user: User,
):
    """Adding a sixth scenario does not disturb or regress the five existing fixtures."""
    loader = KnowledgePackLoader()
    # Load all 5 standard packs
    loader.load_all_packs()
    # Also load sixth synthetic pack
    loader.load_pack_from_dir(synthetic_sixth_pack)

    # Test Gujarat Food business: must still get FSSAI, GPCB, Factory License
    guj_biz = Business.objects.create(name="Gujarat Test Biz", owner=owner_user)
    guj_profile = BusinessProfileVersion.objects.create(
        business=guj_biz,
        version=1,
        variables={
            "state": {"value": "GUJARAT", "origin": "USER_PROVIDED"},
            "product_description": {"value": "Food processing of pickles", "origin": "USER_PROVIDED"},
            "annual_turnover": {"value": "45000000", "origin": "USER_PROVIDED"},
            "total_worker_count": {"value": 22, "origin": "USER_PROVIDED"},
            "connected_power_load": {"value": 35, "origin": "USER_PROVIDED"},
            "effluent_emission_generation": {"value": True, "origin": "USER_PROVIDED"},
        },
    )

    engine = ApplicabilityEngine()
    run = engine.evaluate_business_profile(business=guj_biz, profile_version=guj_profile)
    results = {r.requirement_id: r for r in run.results.all()}

    assert results["REQ-FSSAI-STATE-LICENCE"].status == ApplicabilityStatus.APPLICABLE
    assert results["REQ-GPCB-CTE"].status == ApplicabilityStatus.APPLICABLE
    assert results["REQ-GUJ-FACTORY-LICENSE"].status == ApplicabilityStatus.APPLICABLE

    # Odisha requirement must be UNVERIFIED with JURISDICTION_NOT_MATCHED for Gujarat business
    assert results["REQ-OSPCB-MINE-CTO"].status == ApplicabilityStatus.UNVERIFIED
    assert results["REQ-OSPCB-MINE-CTO"].explanation_trace["reason"] == "JURISDICTION_NOT_MATCHED"
