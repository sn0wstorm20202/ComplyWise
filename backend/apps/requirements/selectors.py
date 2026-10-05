"""Batch-read requirement definitions and referenced evidence for decision output."""

from __future__ import annotations

from collections.abc import Sequence
from typing import TYPE_CHECKING

from apps.evidence.models import Evidence
from apps.knowledge.models import RequirementDefinition

if TYPE_CHECKING:
    from apps.applicability.models import DecisionResult


def load_requirement_evidence(
    decisions: Sequence[DecisionResult],
) -> tuple[dict[str, RequirementDefinition], dict[str, Evidence]]:
    requirement_ids = [decision.requirement_id for decision in decisions]
    definitions = {
        definition.requirement_id: definition
        for definition in RequirementDefinition.objects.filter(requirement_id__in=requirement_ids)
    }
    evidence_ids = set()
    for decision in decisions:
        for reference in decision.evidence_refs or []:
            evidence_id = reference.get("evidence_id") if isinstance(reference, dict) else reference
            if evidence_id:
                evidence_ids.add(str(evidence_id))
    evidence = {
        record.evidence_id: record
        for record in Evidence.objects.filter(evidence_id__in=evidence_ids).select_related("source")
    }
    return definitions, evidence
