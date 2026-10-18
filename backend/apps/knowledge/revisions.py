"""Select dated procedural releases in one batch, without rewriting catalogue identity."""
from copy import copy, deepcopy
from .models import RequirementRevision


def project_requirements(requirements, evaluation_date):
    revisions = list(RequirementRevision.objects.filter(requirement_id__in=[r.pk for r in requirements]))
    grouped = {}
    for revision in revisions:
        grouped.setdefault(revision.requirement_id, []).append(revision)
    projected = []
    selections = {}
    for requirement in requirements:
        definition = copy(requirement)
        definition.metadata = deepcopy(requirement.metadata)
        history = [r for r in grouped.get(requirement.pk, []) if r.status in {"PUBLISHED", "SUPERSEDED", "ARCHIVED"}]
        # Supersession is an ordered release timeline. An expired/withdrawn
        # newest release never silently revives an older open-ended one.
        selected = next((r for r in history if r.effective_from <= evaluation_date), None)
        definition._revision_available = not history or bool(selected and selected.status == "PUBLISHED"
            and (selected.effective_until is None or selected.effective_until >= evaluation_date))
        definition._versioned_requirement = bool(history)
        selections[requirement.requirement_id] = str(selected.pk) if selected else None
        if history:
            definition.metadata = deepcopy(selected.metadata) if definition._revision_available else {}
            definition.description = selected.description if definition._revision_available else ""
            definition.evidence_refs = list(selected.evidence_refs) if definition._revision_available else []
            if selected:
                definition.name = selected.name
        projected.append(definition)
    return projected, revisions, selections
