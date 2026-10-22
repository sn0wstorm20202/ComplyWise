"""Read-only comparisons of captured decisions; never re-evaluate during a read."""
from __future__ import annotations

from copy import deepcopy

from apps.applicability.snapshots import coverage_for_run
from apps.requirements.presentation import evidence_citations
from domain.profile.variables import get_variable

UNCERTAIN = {"NEEDS_INFORMATION", "UNVERIFIED", "CONFLICT_REVIEW"}


def evidence_summary(citations, *, mode=None, pinned=True, reference_count=0):
    """Dates describe the source record, never the date this screen was opened."""
    reviewed = sum(bool((c.get("source") or {}).get("reviewed")) for c in citations)
    status = ("DEMO_EXAMPLE" if mode == "DEMO" else "LEGACY_UNPINNED" if not pinned
              else "NO_RECORDED_PASSAGE" if not citations else "REVIEWED_RECORD"
              if reviewed == len(citations) else "REVIEW_NEEDED")
    return {
        "status": status, "recorded_passages": len(citations), "reviewed_passages": reviewed,
        "missing_references": max(0, reference_count - len(citations)),
        "sources": [{"evidence_id": c["evidence_id"], "title": c.get("source_title"),
                     "url": c.get("canonical_url"),
                     "verification_status": c.get("verification_status"),
                     **{k: (c.get("source") or {}).get(k) for k in
                        ("publication_date", "effective_date", "retrieved_at")}} for c in citations],
        "completion_status": "NOT_VERIFIED_BY_APPLICABILITY",
    }


def row_provenance(result, evidence, run):
    citations = evidence_citations(result.evidence_refs or [], evidence)
    return evidence_summary(citations, mode=run.evaluation_manifest.get("mode"),
                            pinned=bool(run.evaluation_manifest),
                            reference_count=len(result.evidence_refs or []))


def run_card(run):
    cir = run.cir_snapshot or {}
    return {"run_id": str(run.id), "assessment_id": str(run.assessment_id) if run.assessment_id else None,
            "title": run.assessment.title if run.assessment else f"Profile v{run.profile_version.version}",
            "profile_version": run.profile_version.version, "evaluated_at": run.created_at.isoformat(),
            "evaluation_date": run.evaluation_date.isoformat(),
            "mode": run.evaluation_manifest.get("mode", "LEGACY_UNPINNED"),
            "content_hash": cir.get("content_hash"), "knowledge_fingerprint": cir.get("knowledge_fingerprint"),
            "coverage": coverage_for_run(run)}


def run_provenance(run, results):
    from apps.applicability.snapshots import snapshot_models
    _, evidence = snapshot_models(run.evaluation_manifest) if run.evaluation_manifest else ({}, {})
    rows = {r.requirement_id: row_provenance(r, evidence, run) for r in results}
    sources = {s["evidence_id"]: s for row in rows.values() for s in row["sources"]}
    return {"coverage": coverage_for_run(run), "evaluation_date": run.evaluation_date.isoformat(),
            "mode": run.evaluation_manifest.get("mode", "LEGACY_UNPINNED"),
            "requirements_without_passages": sum(not row["recorded_passages"] for row in rows.values()),
            "requirements_needing_review": sum(r.status in UNCERTAIN for r in results),
            "source_dates_missing": sum(not s["publication_date"] for s in sources.values()),
            "sources": list(sources.values()), "rows": rows,
            "completion_status": "NOT_VERIFIED_BY_APPLICABILITY"}


def trace_facts(trace):
    facts = {}
    if isinstance(trace, dict):
        facts.update(trace.get("variables_used") or {})
        for value in trace.values():
            if isinstance(value, (list, dict)):
                facts.update(trace_facts(value))
    elif isinstance(trace, list):
        for value in trace:
            facts.update(trace_facts(value))
    return facts


def decision_rows(run):
    from apps.applicability.snapshots import snapshot_models
    _, evidence = snapshot_models(run.evaluation_manifest) if run.evaluation_manifest else ({}, {})
    traces = {r.requirement_id: r for r in run.results.all()}
    rows = {}
    for decision in run.cir_snapshot.get("determinations", []):
        result = traces.get(decision["requirement_id"])
        trace = result.explanation_trace if result else {}
        evaluations = [{"rule_id": e.get("rule_id"), "version": e.get("version"),
                        "truth_value": e.get("truth_value"), "trace": e.get("trace", {})}
                       for e in trace.get("evaluations", [])]
        rows[decision["requirement_id"]] = {
            "status": decision["status"], "title": decision["title"],
            "explanation": decision.get("explanation"),
            "reason": trace.get("evidence_reason") or trace.get("reason"),
            "facts_used": trace_facts(trace), "rule_evaluations": evaluations,
            "evidence": row_provenance(result, evidence, run) if result else evidence_summary([], pinned=False),
        }
    return rows


def compare_runs(before, after):
    if before.business_id != after.business_id:
        raise ValueError("Choose two saved runs belonging to the same business.")
    if not before.cir_snapshot or not after.cir_snapshot:
        raise ValueError("Both runs need sealed decision records. Existing archives are not rewritten by this view.")
    old = before.evaluation_manifest.get("profile", before.profile_version.variables)
    new = after.evaluation_manifest.get("profile", after.profile_version.variables)
    changes = []
    for key in sorted(set(old) | set(new)):
        left, right = old.get(key, {}), new.get(key, {})
        if left.get("value") != right.get("value") or left.get("origin") != right.get("origin"):
            definition = get_variable(key)
            changes.append({"key": key, "label": definition.label if definition else key.replace("_", " "),
                            "before": deepcopy(left), "after": deepcopy(right)})
    a, b = decision_rows(before), decision_rows(after)
    changed_keys = {c["key"] for c in changes}
    rows = []
    for key in sorted(set(a) | set(b)):
        left, right = a.get(key), b.get(key)
        status_changed = (left or {}).get("status") != (right or {}).get("status")
        used = set((left or {}).get("facts_used", {})) | set((right or {}).get("facts_used", {}))
        rows.append({"requirement_id": key, "title": (right or left)["title"],
                     "before": left, "after": right, "status_changed": status_changed,
                     "changed_facts_used": sorted(used & changed_keys),
                     "needs_attention": any(r and r["status"] in UNCERTAIN for r in (left, right))})
    rows.sort(key=lambda r: (not r["status_changed"], not r["changed_facts_used"], not r["needs_attention"], r["title"]))
    same_knowledge = bool(before.evaluation_manifest.get("catalogue_hash")) and all(
        before.evaluation_manifest.get(k) == after.evaluation_manifest.get(k)
        for k in ("catalogue_hash", "evaluator_version", "mode", "evaluation_date"))
    return {"business_id": str(before.business_id), "business_name": before.business.name,
            "before": run_card(before), "after": run_card(after), "fact_changes": changes, "requirements": rows,
            "same_evaluation_context": same_knowledge,
            "interpretation": ("The recorded catalogue, evaluator, mode and evaluation date match. The trace shows which changed facts were read; this is not proof of a single cause."
                               if same_knowledge else "Evaluation context differs or was not captured. Changes may reflect rules, sources, evaluation date or business facts; do not attribute them only to facts."),
            "status_changes": sum(r["status_changed"] for r in rows),
            "uncertain_rows": sum(r["needs_attention"] for r in rows)}
