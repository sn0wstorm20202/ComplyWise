"""Source updates are review events, never automatic legal rule replacements."""
from apps.evidence.models import Source
from apps.knowledge.models import RuleVersion
from apps.applicability.models import DecisionResult
from .models import SourceChange


def record_source_change(source):
    previous = Source.objects.filter(canonical_url=source.canonical_url).exclude(pk=source.pk).order_by("-created_at").first()
    if not previous or previous.content_hash == source.content_hash:
        return None
    refs = set(previous.evidence_records.values_list("evidence_id", flat=True))
    affected_rules = [rule for rule in RuleVersion.objects.filter(status="PUBLISHED").select_related("requirement")
                      if refs.intersection(rule.evidence_refs or [])]
    identifiers = [rule.requirement.requirement_id for rule in affected_rules]
    affected_runs = list(DecisionResult.objects.filter(requirement_id__in=identifiers).values_list("decision_run_id", flat=True).distinct())
    change, _ = SourceChange.objects.get_or_create(previous_source=previous, new_source=source, defaults={
        "affected_rule_ids":[str(rule.pk) for rule in affected_rules],
        "affected_decision_run_ids":[str(identifier) for identifier in affected_runs]})
    return change
