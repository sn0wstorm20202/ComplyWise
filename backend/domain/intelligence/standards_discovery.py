"""Business matches come only from persisted deterministic decisions and verified evidence."""
from apps.applicability.models import DecisionRun
from apps.evidence.models import Evidence
from apps.knowledge.models import RequirementDefinition
from common.enums import KnowledgeStatus, SourceStatus, VerificationStatus


def discover_business_standards(business, context=None, assessment_id=None):
    runs = DecisionRun.objects.filter(business=business)
    if assessment_id:
        runs = runs.filter(assessment_id=assessment_id)
    run = runs.order_by("-created_at").first()
    standards = []
    if run:
        results = {r.requirement_id: r for r in run.results.filter(status="APPLICABLE")}
        definitions = RequirementDefinition.objects.filter(requirement_id__in=results,
            category__iexact="STANDARD", status=KnowledgeStatus.PUBLISHED)
        for req in definitions:
            result = results[req.requirement_id]
            refs = [ref.get("evidence_id") if isinstance(ref, dict) else ref for ref in result.evidence_refs]
            evidence = list(Evidence.objects.filter(evidence_id__in=refs,
                verification_status=VerificationStatus.VERIFIED, source__status=SourceStatus.ACTIVE).select_related("source"))
            if not evidence:
                continue
            standards.append({"standard_code": req.requirement_id, "title": req.name,
                "authority": req.authority, "jurisdiction": req.jurisdiction, "domain": req.domain,
                "description": req.description, "why_it_matters": "Matched by the published rule for this saved profile.",
                "nature": req.category, "is_mandatory": (req.metadata or {}).get("is_mandatory"),
                "source_url": evidence[0].source.canonical_url,
                "citations": [{"evidence_id": ev.evidence_id, "authority": ev.source.authority,
                    "source_title": ev.source.title, "locator": ev.locator, "excerpt": ev.excerpt,
                    "verification_status": ev.verification_status, "canonical_url": ev.source.canonical_url} for ev in evidence],
                "decision_result_id": str(result.id), "rule_version_id": str(result.rule_version_id) if result.rule_version_id else None})
    from domain.intelligence.workspace_guidance import get_workspace
    known_titles = {s["title"].casefold() for s in standards}
    for item in get_workspace(business, assessment_id)["standards"]:
        if item["title"].casefold() not in known_titles:
            standards.append({**item, "standard_code": item["id"], "authority": item["authority_or_regulator"],
                "jurisdiction": "", "domain": "QUALITY", "nature": "QUALITY_PLANNING",
                "why_it_matters": item["why_it_may_apply"], "decision_result_id": None, "rule_version_id": None})
    reviewed = len([item for item in standards if item.get("rule_version_id")])
    return {"business_id": str(business.id), "standards": standards, "total_standards_found": len(standards),
        "assessment_id": str(run.assessment_id) if run else str(assessment_id) if assessment_id else None,
        "reviewed_match_count": reviewed,
        "scope_status": "MATCHED" if reviewed else "PARTIAL_SCOPE" if run else "ASSESSMENT_REQUIRED",
        "scope_note": "No reviewed standards matched this assessment within the currently supported knowledge scope. Additional product or quality review may be needed." if not reviewed else "Matches are limited to reviewed requirements for this saved assessment.",
        "disclaimer": "Only saved assessments against published rules and verified evidence are matched. This is not a complete BIS/QCO catalogue."}
