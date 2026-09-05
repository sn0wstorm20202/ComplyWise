"""Knowledge Pack Loader.

Authority: TRD_v2.0 §27; PRD_v2.0 §1; Task 2 C8 Audit Corrections.

Loads versioned JSON knowledge packs into Source, Evidence, RequirementDefinition,
and RuleVersion models with strict AST, schema, referential, and duplicate validation.
"""

from __future__ import annotations

import datetime
import json
from pathlib import Path
from typing import Any

from django.conf import settings
from django.db import transaction
import jsonschema

from common.enums import KnowledgeStatus, RuleType, SourceStatus, VerificationStatus
from domain.profile.variables import get_variable
from domain.rules.ast import validate_ast
from apps.evidence.models import Evidence, Source
from apps.knowledge.models import RequirementDefinition, RuleVersion

SCHEMAS_DIR = Path(__file__).resolve().parent / "schemas"


class KnowledgePackLoaderError(Exception):
    """Raised when a knowledge pack fails schema, duplicate, referential, or date validation."""


def _load_schema(schema_filename: str) -> dict[str, Any]:
    schema_path = SCHEMAS_DIR / schema_filename
    if not schema_path.exists():
        raise KnowledgePackLoaderError(f"Internal error: Schema file '{schema_filename}' not found.")
    return json.loads(schema_path.read_text(encoding="utf-8"))


SOURCES_SCHEMA = _load_schema("sources.json")
EVIDENCE_SCHEMA = _load_schema("evidence.json")
REQUIREMENTS_SCHEMA = _load_schema("requirements.json")
RULES_SCHEMA = _load_schema("rules.json")


def extract_ast_variables(node: Any) -> set[str]:
    """Recursively collect all variable names referenced in an AST."""
    variables: set[str] = set()
    if not isinstance(node, dict):
        return variables

    if "var" in node and isinstance(node["var"], str) and node["var"].strip():
        variables.add(node["var"].strip())

    if "left" in node:
        variables.update(extract_ast_variables(node["left"]))
    if "right" in node:
        variables.update(extract_ast_variables(node["right"]))
    if "arg" in node:
        variables.update(extract_ast_variables(node["arg"]))
    if "args" in node and isinstance(node["args"], list):
        for arg in node["args"]:
            variables.update(extract_ast_variables(arg))

    return variables


def _parse_strict_date(
    val: Any,
    pack_name: str,
    file_name: str,
    field_name: str,
    record_id: str,
) -> datetime.date | None:
    """Parse date strictly. Non-empty invalid dates must raise KnowledgePackLoaderError."""
    if val is None or val == "":
        return None
    if isinstance(val, datetime.date):
        return val
    try:
        return datetime.date.fromisoformat(str(val).strip())
    except (ValueError, TypeError) as exc:
        raise KnowledgePackLoaderError(
            f"Pack '{pack_name}', file '{file_name}': Record '{record_id}' field '{field_name}' "
            f"has invalid non-empty date '{val}'. Expected ISO format (YYYY-MM-DD)."
        ) from exc


class KnowledgePackLoader:
    """Loads and validates JSON knowledge packs from disk into the database."""

    def __init__(self, packs_dir: Path | None = None) -> None:
        self.packs_dir = packs_dir or settings.KNOWLEDGE_PACKS_DIR

    def _validate_with_schema(
        self,
        data: Any,
        schema: dict[str, Any],
        pack_name: str,
        file_name: str,
    ) -> None:
        """Validate parsed JSON data against strict JSON schema with additionalProperties: false."""
        try:
            jsonschema.validate(instance=data, schema=schema)
        except jsonschema.ValidationError as exc:
            path_str = " -> ".join(str(p) for p in exc.path) if exc.path else "root"
            raise KnowledgePackLoaderError(
                f"Pack '{pack_name}', file '{file_name}': Schema validation error at [{path_str}]: {exc.message}"
            ) from exc

    def _read_json_file(self, file_path: Path, pack_name: str) -> Any:
        """Read and parse JSON file with actionable error on decode error."""
        try:
            return json.loads(file_path.read_text(encoding="utf-8"))
        except Exception as exc:
            raise KnowledgePackLoaderError(
                f"Pack '{pack_name}', file '{file_path.name}': Malformed JSON: {exc}"
            ) from exc

    @transaction.atomic
    def load_pack_from_dir(
        self,
        pack_dir: Path,
        force_status: bool = False,
        dry_run: bool = False,
    ) -> dict[str, int]:
        """Load and validate a single pack directory."""
        pack_name = pack_dir.name
        counts = {"sources": 0, "evidence": 0, "requirements": 0, "rules": 0}

        # In-memory indices for referential and duplicate checks in this pack
        pack_sources: list[dict[str, Any]] = []
        pack_evidence: list[dict[str, Any]] = []
        pack_requirements: list[dict[str, Any]] = []
        pack_rules: list[dict[str, Any]] = []

        # 1. Sources (sources.json)
        sources_file = pack_dir / "sources.json"
        if sources_file.exists():
            data = self._read_json_file(sources_file, pack_name)
            self._validate_with_schema(data, SOURCES_SCHEMA, pack_name, "sources.json")
            pack_sources = data

        # 2. Evidence (evidence.json)
        evidence_file = pack_dir / "evidence.json"
        if evidence_file.exists():
            data = self._read_json_file(evidence_file, pack_name)
            self._validate_with_schema(data, EVIDENCE_SCHEMA, pack_name, "evidence.json")
            pack_evidence = data

        # 3. Requirements (requirements.json)
        reqs_file = pack_dir / "requirements.json"
        if reqs_file.exists():
            data = self._read_json_file(reqs_file, pack_name)
            self._validate_with_schema(data, REQUIREMENTS_SCHEMA, pack_name, "requirements.json")
            pack_requirements = data

        # 4. Rules (rules.json)
        rules_file = pack_dir / "rules.json"
        if rules_file.exists():
            data = self._read_json_file(rules_file, pack_name)
            self._validate_with_schema(data, RULES_SCHEMA, pack_name, "rules.json")
            pack_rules = data

        # Duplicate checking within this pack
        seen_src = set()
        for s in pack_sources:
            sid = s["source_id"]
            if sid in seen_src:
                raise KnowledgePackLoaderError(
                    f"Pack '{pack_name}', file 'sources.json': Duplicate source_id '{sid}'."
                )
            seen_src.add(sid)

        seen_evd = set()
        for e in pack_evidence:
            eid = e["evidence_id"]
            if eid in seen_evd:
                raise KnowledgePackLoaderError(
                    f"Pack '{pack_name}', file 'evidence.json': Duplicate evidence_id '{eid}'."
                )
            seen_evd.add(eid)

        seen_req = set()
        for r in pack_requirements:
            rid = r["requirement_id"]
            if rid in seen_req:
                raise KnowledgePackLoaderError(
                    f"Pack '{pack_name}', file 'requirements.json': Duplicate requirement_id '{rid}'."
                )
            seen_req.add(rid)

        seen_rul = set()
        for r in pack_rules:
            key = (r["rule_id"], r.get("version", 1))
            if key in seen_rul:
                raise KnowledgePackLoaderError(
                    f"Pack '{pack_name}', file 'rules.json': Duplicate rule_id '{key[0]}' version {key[1]}."
                )
            seen_rul.add(key)

        # Referential checks
        # Check that evidence references valid source
        known_sources = set(seen_src) | set(Source.objects.values_list("source_id", flat=True))
        for e in pack_evidence:
            if e["source_id"] not in known_sources:
                raise KnowledgePackLoaderError(
                    f"Pack '{pack_name}', file 'evidence.json': Evidence '{e['evidence_id']}' "
                    f"references missing source '{e['source_id']}'."
                )

        # Check requirements evidence_refs
        known_evidence = set(seen_evd) | set(Evidence.objects.values_list("evidence_id", flat=True))
        for r in pack_requirements:
            for ref in r.get("evidence_refs", []):
                if ref not in known_evidence:
                    raise KnowledgePackLoaderError(
                        f"Pack '{pack_name}', file 'requirements.json': Requirement '{r['requirement_id']}' "
                        f"references missing evidence '{ref}'."
                    )

        # Check rules: requirement exists, evidence exists, variables are canonical V01-V19
        known_requirements = set(seen_req) | set(RequirementDefinition.objects.values_list("requirement_id", flat=True))
        for r in pack_rules:
            rid = r["requirement_id"]
            if rid not in known_requirements:
                raise KnowledgePackLoaderError(
                    f"Pack '{pack_name}', file 'rules.json': Rule '{r['rule_id']}' "
                    f"references orphan requirement '{rid}' which does not exist."
                )
            for ref in r.get("evidence_refs", []):
                if ref not in known_evidence:
                    raise KnowledgePackLoaderError(
                        f"Pack '{pack_name}', file 'rules.json': Rule '{r['rule_id']}' "
                        f"has dangling evidence reference '{ref}'."
                    )

            # AST validation & AST canonical variable checking
            try:
                validate_ast(r["condition_ast"])
            except Exception as exc:
                raise KnowledgePackLoaderError(
                    f"Pack '{pack_name}', file 'rules.json': Rule '{r['rule_id']}' AST invalid: {exc}"
                ) from exc

            ast_vars = extract_ast_variables(r["condition_ast"])
            for var_name in ast_vars:
                if get_variable(var_name) is None:
                    raise KnowledgePackLoaderError(
                        f"Pack '{pack_name}', file 'rules.json': Rule '{r['rule_id']}' "
                        f"references unknown AST variable '{var_name}' not in canonical V01-V19 registry."
                    )

        # Strict date validation on all records
        for s in pack_sources:
            _parse_strict_date(s.get("publication_date"), pack_name, "sources.json", "publication_date", s["source_id"])
            _parse_strict_date(s.get("effective_date"), pack_name, "sources.json", "effective_date", s["source_id"])

        for e in pack_evidence:
            _parse_strict_date(e.get("effective_from"), pack_name, "evidence.json", "effective_from", e["evidence_id"])
            _parse_strict_date(e.get("effective_until"), pack_name, "evidence.json", "effective_until", e["evidence_id"])

        for r in pack_rules:
            _parse_strict_date(r.get("effective_from"), pack_name, "rules.json", "effective_from", r["rule_id"])
            _parse_strict_date(r.get("effective_until"), pack_name, "rules.json", "effective_until", r["rule_id"])

        if dry_run:
            return {
                "sources": len(pack_sources),
                "evidence": len(pack_evidence),
                "requirements": len(pack_requirements),
                "rules": len(pack_rules),
            }

        # Write records with reviewer status preservation and safe defaults
        # 1. Sources
        for item in pack_sources:
            sid = item["source_id"]
            existing = Source.objects.filter(source_id=sid).first()
            status = item.get("status", SourceStatus.ACTIVE)
            if existing and not force_status and existing.status in (SourceStatus.WITHDRAWN, SourceStatus.SUPERSEDED):
                status = existing.status

            Source.objects.update_or_create(
                source_id=sid,
                defaults={
                    "authority": item["authority"],
                    "title": item["title"],
                    "source_type": item.get("source_type", "REGULATION"),
                    "canonical_url": item.get("canonical_url", ""),
                    "publication_date": _parse_strict_date(item.get("publication_date"), pack_name, "sources.json", "publication_date", sid),
                    "effective_date": _parse_strict_date(item.get("effective_date"), pack_name, "sources.json", "effective_date", sid),
                    "status": status,
                    "content_hash": item.get("content_hash", ""),
                    "metadata": item.get("metadata", {}),
                },
            )
            counts["sources"] += 1

        # 2. Evidence
        for item in pack_evidence:
            eid = item["evidence_id"]
            existing = Evidence.objects.filter(evidence_id=eid).first()
            # Default verification is UNVERIFIED (C8)
            ver_status = item.get("verification_status", VerificationStatus.UNVERIFIED)
            if existing and not force_status and existing.verification_status in (VerificationStatus.CONFLICTING, VerificationStatus.UNVERIFIED):
                ver_status = existing.verification_status

            source = Source.objects.get(source_id=item["source_id"])
            Evidence.objects.update_or_create(
                evidence_id=eid,
                defaults={
                    "source": source,
                    "locator": item.get("locator", ""),
                    "excerpt": item.get("excerpt", ""),
                    "structured_fact": item.get("structured_fact", {}),
                    "verification_status": ver_status,
                    "effective_from": _parse_strict_date(item.get("effective_from"), pack_name, "evidence.json", "effective_from", eid),
                    "effective_until": _parse_strict_date(item.get("effective_until"), pack_name, "evidence.json", "effective_until", eid),
                },
            )
            counts["evidence"] += 1

        # 3. Requirements
        for item in pack_requirements:
            rid = item["requirement_id"]
            existing = RequirementDefinition.objects.filter(requirement_id=rid).first()
            # Default status is DRAFT (C8)
            req_status = item.get("status", KnowledgeStatus.DRAFT)
            if existing and not force_status and existing.status in (KnowledgeStatus.REJECTED, KnowledgeStatus.UNDER_REVIEW):
                req_status = existing.status

            RequirementDefinition.objects.update_or_create(
                requirement_id=rid,
                defaults={
                    "name": item["name"],
                    "category": item.get("category", "LICENCE"),
                    "authority": item["authority"],
                    "jurisdiction": item["jurisdiction"],
                    "domain": item["domain"],
                    "description": item.get("description", ""),
                    "status": req_status,
                    "evidence_refs": item.get("evidence_refs", []),
                    "metadata": item.get("metadata", {}),
                },
            )
            counts["requirements"] += 1

        # 4. Rules
        for item in pack_rules:
            rule_id = item["rule_id"]
            version = item.get("version", 1)
            existing = RuleVersion.objects.filter(rule_id=rule_id, version=version).first()
            # Default status is DRAFT (C8)
            rule_status = item.get("status", KnowledgeStatus.DRAFT)
            if existing and not force_status and existing.status in (KnowledgeStatus.REJECTED, KnowledgeStatus.UNDER_REVIEW):
                rule_status = existing.status

            requirement = RequirementDefinition.objects.get(requirement_id=item["requirement_id"])
            RuleVersion.objects.update_or_create(
                rule_id=rule_id,
                version=version,
                defaults={
                    "domain": item.get("domain", requirement.domain),
                    "jurisdiction": item.get("jurisdiction", requirement.jurisdiction),
                    "rule_type": item.get("rule_type", RuleType.NORMAL),
                    "effective_from": _parse_strict_date(item.get("effective_from"), pack_name, "rules.json", "effective_from", rule_id),
                    "effective_until": _parse_strict_date(item.get("effective_until"), pack_name, "rules.json", "effective_until", rule_id),
                    "status": rule_status,
                    "requirement": requirement,
                    "condition_ast": item["condition_ast"],
                    "result": item.get("result", "APPLICABLE"),
                    "evidence_refs": item.get("evidence_refs", []),
                },
            )
            counts["rules"] += 1

        return counts

    def load_all_packs(
        self,
        force_status: bool = False,
        dry_run: bool = False,
    ) -> dict[str, Any]:
        """Scan knowledge_packs directory recursively and load all pack folders with global duplicate detection."""
        total_counts = {"sources": 0, "evidence": 0, "requirements": 0, "rules": 0, "packs_loaded": 0}
        if not self.packs_dir.exists():
            return total_counts

        candidate_dirs = sorted([
            p for p in self.packs_dir.rglob("*")
            if p.is_dir() and ((p / "rules.json").exists() or (p / "requirements.json").exists())
        ])

        # Global duplicate check across all packs
        global_sources: dict[str, str] = {}
        global_evidence: dict[str, str] = {}
        global_requirements: dict[str, str] = {}
        global_rules: dict[tuple[str, int], str] = {}

        for p_dir in candidate_dirs:
            pack_name = p_dir.name
            src_f = p_dir / "sources.json"
            if src_f.exists():
                data = self._read_json_file(src_f, pack_name)
                self._validate_with_schema(data, SOURCES_SCHEMA, pack_name, "sources.json")
                for s in data:
                    sid = s["source_id"]
                    if sid in global_sources:
                        raise KnowledgePackLoaderError(
                            f"Pack '{pack_name}', file 'sources.json': Duplicate source_id '{sid}' "
                            f"already defined in pack '{global_sources[sid]}'."
                        )
                    global_sources[sid] = pack_name

            evd_f = p_dir / "evidence.json"
            if evd_f.exists():
                data = self._read_json_file(evd_f, pack_name)
                self._validate_with_schema(data, EVIDENCE_SCHEMA, pack_name, "evidence.json")
                for e in data:
                    eid = e["evidence_id"]
                    if eid in global_evidence:
                        raise KnowledgePackLoaderError(
                            f"Pack '{pack_name}', file 'evidence.json': Duplicate evidence_id '{eid}' "
                            f"already defined in pack '{global_evidence[eid]}'."
                        )
                    global_evidence[eid] = pack_name

            req_f = p_dir / "requirements.json"
            if req_f.exists():
                data = self._read_json_file(req_f, pack_name)
                self._validate_with_schema(data, REQUIREMENTS_SCHEMA, pack_name, "requirements.json")
                for r in data:
                    rid = r["requirement_id"]
                    if rid in global_requirements:
                        raise KnowledgePackLoaderError(
                            f"Pack '{pack_name}', file 'requirements.json': Duplicate requirement_id '{rid}' "
                            f"already defined in pack '{global_requirements[rid]}'."
                        )
                    global_requirements[rid] = pack_name

            rul_f = p_dir / "rules.json"
            if rul_f.exists():
                data = self._read_json_file(rul_f, pack_name)
                self._validate_with_schema(data, RULES_SCHEMA, pack_name, "rules.json")
                for r in data:
                    key = (r["rule_id"], r.get("version", 1))
                    if key in global_rules:
                        raise KnowledgePackLoaderError(
                            f"Pack '{pack_name}', file 'rules.json': Duplicate rule_id '{key[0]}' "
                            f"version {key[1]} already defined in pack '{global_rules[key]}'."
                        )
                    global_rules[key] = pack_name

        # Perform atomic batch load
        with transaction.atomic():
            for p_dir in candidate_dirs:
                pack_counts = self.load_pack_from_dir(
                    p_dir,
                    force_status=force_status,
                    dry_run=dry_run,
                )
                total_counts["packs_loaded"] += 1
                for k in ("sources", "evidence", "requirements", "rules"):
                    total_counts[k] += pack_counts[k]

            if dry_run:
                transaction.set_rollback(True)

        return total_counts
