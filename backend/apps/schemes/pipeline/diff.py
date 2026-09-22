"""Scheme Version Diff & Validation Engine.

Authority: User Specification — "Diff & Validate: When a change is detected,
we diff the new data against the previous version. The system can highlight
what fields changed. A human (or QA process) reviews the differences."
"""

from __future__ import annotations

import json
from typing import Any

from apps.schemes.models import SchemeVersion
from .parser import ExtractedSchemeCandidate


def compute_scheme_diff(
    previous_version: SchemeVersion,
    candidate: ExtractedSchemeCandidate,
) -> dict[str, Any]:
    """Computes field-by-field differences between previous immutable version and new extraction."""
    changes: dict[str, dict[str, Any]] = {}

    comparisons = [
        ("title", previous_version.title, candidate.title),
        ("authority", previous_version.authority, candidate.authority),
        ("jurisdiction", previous_version.jurisdiction, candidate.jurisdiction),
        ("benefit_type", previous_version.benefit_type, candidate.benefit_type),
        ("benefit_summary", previous_version.benefit_summary, candidate.benefit_summary),
        ("eligibility_statement", previous_version.eligibility_statement, candidate.eligibility_statement),
        ("application_route", previous_version.application_route, candidate.application_route),
        ("application_url", previous_version.application_url, candidate.application_url),
        ("evidence_snippet", previous_version.evidence_snippet, candidate.evidence_snippet),
        ("effective_from", str(previous_version.effective_from or ""), str(candidate.effective_from or "")),
        ("effective_to", str(previous_version.effective_to or ""), str(candidate.effective_to or "")),
    ]

    for field_name, old_val, new_val in comparisons:
        old_clean = (old_val or "").strip()
        new_clean = (new_val or "").strip()
        if old_clean != new_clean:
            changes[field_name] = {"old": old_clean, "new": new_clean}

    # Compare structured JSON fields (sectors, scale_match)
    if sorted(previous_version.sectors or []) != sorted(candidate.sectors or []):
        changes["sectors"] = {"old": previous_version.sectors, "new": candidate.sectors}

    if sorted(previous_version.scale_match or []) != sorted(candidate.scale_match or []):
        changes["scale_match"] = {"old": previous_version.scale_match, "new": candidate.scale_match}

    return {
        "has_changes": bool(changes),
        "changed_fields": list(changes.keys()),
        "changes": changes,
        "previous_version": previous_version.version_number,
    }


def compute_scheme_content_hash(candidate: ExtractedSchemeCandidate) -> str:
    """Computes deterministic SHA-256 fingerprint for candidate metadata."""
    import hashlib

    canonical_repr = json.dumps(
        {
            "code": candidate.scheme_code,
            "title": candidate.title,
            "authority": candidate.authority,
            "jurisdiction": candidate.jurisdiction,
            "benefit_type": candidate.benefit_type,
            "benefit_summary": candidate.benefit_summary,
            "eligibility_statement": candidate.eligibility_statement,
            "sectors": sorted(candidate.sectors),
            "scale_match": sorted(candidate.scale_match),
            "effective_from": str(candidate.effective_from or ""),
            "effective_to": str(candidate.effective_to or ""),
            "application_url": candidate.application_url,
        },
        sort_keys=True,
    )
    return hashlib.sha256(canonical_repr.encode("utf-8")).hexdigest()
