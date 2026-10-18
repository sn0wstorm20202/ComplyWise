"""Capture the exact inputs read by the evaluator, independently of live catalogues."""
from __future__ import annotations

import hashlib
import json
from copy import deepcopy

import rfc8785
from django.conf import settings
from django.core.serializers.json import DjangoJSONEncoder
from django.forms.models import model_to_dict

EVALUATOR_VERSION = "engine2-2026-10-18.2"


def record(model):
    return json.loads(json.dumps({**model_to_dict(model), "id": str(model.pk)}, cls=DjangoJSONEncoder))


def captured_sources(evidence):
    from apps.ingestion.models import RetrievedDocument
    captures = RetrievedDocument.objects.filter(source_id__in={e.source_id for e in evidence}).only("source_id", "content_hash", "metadata", "retrieved_at")
    return {(capture.source_id, capture.content_hash): capture for capture in captures}


def evidence_record(evidence, captures):
    result = record(evidence)
    result["source"] = record(evidence.source)
    capture = captures.get((evidence.source_id, evidence.source.content_hash))
    result["source_capture"] = {"metadata": capture.metadata, "retrieved_at": capture.retrieved_at.isoformat()} if capture else None
    return result


def capture_manifest(run, requirements, rules, evidence, *, mode="PRODUCTION", catalogue_requirements=None,
                     requirement_revisions=(), selected_revisions=None):
    evidence = list(evidence)
    captures = captured_sources(evidence)
    payload = {
        "schema_version": 2,
        "mode": mode,
        "evaluator_version": EVALUATOR_VERSION,
        "release_version": settings.COMPLYWISE_VERSION,
        "evaluation_date": run.evaluation_date.isoformat(),
        "profile_version_id": str(run.profile_version_id),
        "profile": deepcopy(run.profile_version.variables),
        "requirements": {r.requirement_id: record(r) for r in requirements},
        "catalogue_requirements": {r.requirement_id: record(r) for r in (catalogue_requirements if catalogue_requirements is not None else requirements)},
        "requirement_revisions": {str(r.pk): record(r) for r in requirement_revisions},
        "selected_requirement_revisions": selected_revisions or {},
        "rules": {str(r.id): record(r) for r in rules},
        "evidence": {e.evidence_id: evidence_record(e, captures) for e in evidence},
    }
    payload["catalogue_hash"] = catalogue_hash(payload)
    payload["content_hash"] = "sha256:" + hashlib.sha256(rfc8785.dumps(payload)).hexdigest()
    run.evaluation_manifest = payload
    return payload


def catalogue_hash(manifest):
    data = {key: manifest[key] for key in ("requirements", "rules", "evidence")}
    data["requirements"] = manifest.get("catalogue_requirements", data["requirements"])
    data["requirement_revisions"] = manifest.get("requirement_revisions", {})
    return hashlib.sha256(rfc8785.dumps(data)).hexdigest()


def current_catalogue_hash():
    from apps.knowledge.models import RequirementDefinition, RequirementRevision, RuleVersion
    from apps.evidence.models import Evidence
    requirements = list(RequirementDefinition.objects.filter(status="PUBLISHED"))
    rules = list(RuleVersion.objects.filter(status="PUBLISHED", requirement__status="PUBLISHED"))
    revisions = list(RequirementRevision.objects.filter(requirement__status="PUBLISHED"))
    refs = {ref for obj in requirements + rules + revisions for ref in obj.evidence_refs or [] if isinstance(ref, str)}
    evidence = list(Evidence.objects.filter(evidence_id__in=refs).select_related("source"))
    captures = captured_sources(evidence)
    return catalogue_hash({"requirements":{r.requirement_id:record(r) for r in requirements},
        "rules":{str(r.id):record(r) for r in rules},
        "requirement_revisions":{str(r.pk):record(r) for r in revisions},
        "evidence":{e.evidence_id:evidence_record(e, captures) for e in evidence}})


def can_reuse(run, profile):
    from django.utils import timezone
    manifest = run.evaluation_manifest or {}
    if (run.status != "COMPLETED" or run.profile_version_id != profile.id
            or run.evaluation_date != timezone.localdate() or manifest.get("profile") != profile.variables):
        return False
    if manifest.get("mode") == "DEMO":
        return bool(getattr(settings, "COMPLYWISE_DEMO_MODE", False)) and manifest.get("evaluator_version") == EVALUATOR_VERSION
    return (not getattr(settings, "COMPLYWISE_DEMO_MODE", False)
            and manifest.get("evaluator_version") == EVALUATOR_VERSION
            and manifest.get("catalogue_hash") == current_catalogue_hash())


def snapshot_models(manifest):
    """Read-only in-memory Django objects retain existing presentation contracts."""
    from apps.evidence.models import Evidence, Source
    from apps.knowledge.models import RequirementDefinition, RuleVersion

    def hydrate(model, value):
        data = dict(value)
        for field in model._meta.concrete_fields:
            if field.is_relation and field.name in data:
                data[field.attname] = field.target_field.to_python(data.pop(field.name))
            if not field.is_relation and field.name in data and data[field.name] is not None:
                data[field.name] = field.to_python(data[field.name])
        return model(**data)

    definitions = {key: hydrate(RequirementDefinition, value) for key, value in manifest.get("requirements", {}).items()}
    evidences = {}
    for key, value in manifest.get("evidence", {}).items():
        data = dict(value)
        captured = data.pop("source_capture", None)
        source = hydrate(Source, data.pop("source"))
        source._recorded_capture = captured
        evidence = hydrate(Evidence, data)
        evidence.source = source
        evidences[key] = evidence
    rules = {key: hydrate(RuleVersion, value) for key, value in manifest.get("rules", {}).items()}
    for definition in definitions.values():
        definition._snapshot_rules = rules
        definition._snapshot_evidence = evidences
    return definitions, evidences


def coverage_for_run(run):
    manifest = run.evaluation_manifest if run else {}
    return {
        "status": "DEMO" if manifest.get("mode") == "DEMO" else "CATALOGUE_LIMITED",
        "is_exhaustive": False,
        "evaluated_requirement_count": len(manifest.get("requirements", {})),
        "knowledge_fingerprint": manifest.get("content_hash"),
        "message": "This assessment covers the recorded knowledge catalogue. It does not establish that every legal obligation has been identified.",
    }
