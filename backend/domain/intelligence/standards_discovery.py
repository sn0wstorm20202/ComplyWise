"""Business matches come only from persisted deterministic decisions and verified evidence."""
from apps.applicability.models import DecisionRun
from apps.evidence.models import Evidence
from apps.evidence.presentation import evidence_projection, source_projection
from apps.knowledge.models import RequirementDefinition
from apps.requirements.presentation import standard_mandatory_status
from common.enums import KnowledgeStatus, SourceStatus, VerificationStatus


def discover_business_standards(business, context=None, assessment_id=None):
    assessment = (business.assessments.filter(pk=assessment_id).first() if assessment_id
                  else business.assessments.order_by("-assessment_number").first())
    # A later mutable business profile must never replace this assessment's facts.
    run = None
    if assessment and assessment.profile_version_id:
        runs = DecisionRun.objects.filter(business=business, assessment=assessment,
                                         profile_version_id=assessment.profile_version_id)
        run = runs.filter(pk=assessment.decision_run_id).first() if assessment.decision_run_id else runs.order_by("-created_at").first()
    standards = []
    if run:
        results = {r.requirement_id: r for r in run.results.filter(status="APPLICABLE")}
        definitions = RequirementDefinition.objects.filter(requirement_id__in=results,
            category__iexact="STANDARD", status=KnowledgeStatus.PUBLISHED)
        for req in definitions:
            result = results[req.requirement_id]
            from apps.applicability.engine import _confirmed_product_scope
            trace = result.explanation_trace or {}
            matched_ast = result.rule_version.condition_ast if result.rule_version else None
            if not (any(_confirmed_product_scope(entry.get("trace") or {}, matched_ast) for entry in trace.get("evaluations", [])
                        if entry.get("truth_value") == "TRUE" and result.rule_version
                        and entry.get("rule_id") == result.rule_version.rule_id and entry.get("version") == result.rule_version.version)
                    or _confirmed_product_scope(trace.get("scope_evaluation") or {}, (req.metadata or {}).get("scope_ast"))):
                # Historical broad-text decisions are not grandfathered into a
                # reviewed product standard by the read projection.
                continue
            refs = [ref.get("evidence_id") if isinstance(ref, dict) else ref for ref in result.evidence_refs]
            evidence = list(Evidence.objects.filter(evidence_id__in=refs,
                verification_status=VerificationStatus.VERIFIED, source__status=SourceStatus.ACTIVE).select_related("source"))
            if not evidence:
                continue
            mandatory = standard_mandatory_status(result, req)
            matched_facts = {}
            def collect(trace, facts):
                facts.update(trace.get("variables_used") or {})
                for child in trace.get("children", []):
                    collect(child, facts)
            for evaluation in (result.explanation_trace or {}).get("evaluations", []):
                if evaluation.get("truth_value") == "TRUE":
                    collect(evaluation.get("trace") or {}, matched_facts)
            if trace.get("scope_evaluation", {}).get("result") == "TRUE":
                collect(trace["scope_evaluation"], matched_facts)
            basis = "; ".join(f"{key.replace('_', ' ')}: {value}" for key, value in matched_facts.items() if value is not None)
            citations = [evidence_projection(ev) for ev in evidence]
            standards.append({"standard_code": req.requirement_id, "title": req.name,
                "authority": req.authority, "jurisdiction": req.jurisdiction, "domain": req.domain,
                "description": req.description, "why_it_matters": "Matched by the published rule using this assessment's recorded facts" + (": " + basis if basis else "."),
                "nature": req.category, "is_mandatory": mandatory,
                "status": "REVIEWED_APPLICABLE", "result_origin": "DETERMINISTIC_KB_RESULT",
                "matched_facts": list(matched_facts), "matched_fact_values": matched_facts,
                "source_url": citations[0]["canonical_url"], "source": source_projection(evidence[0].source, evidence[0]),
                "citations": citations, "evidence": citations,
                "decision_result_id": str(result.id), "rule_version_id": str(result.rule_version_id) if result.rule_version_id else None})
    from domain.intelligence.workspace_guidance import get_workspace
    known_titles = {s["title"].casefold() for s in standards}
    for item in get_workspace(business, assessment_id)["standards"]:
        if item["title"].casefold() not in known_titles:
            standards.append({**item, "standard_code": item["id"], "authority": item["authority_or_regulator"],
                "jurisdiction": "", "domain": "QUALITY", "nature": "QUALITY_PLANNING",
                "why_it_matters": item["why_it_may_apply"], "decision_result_id": None, "rule_version_id": None,
                "status": "CONTEXTUAL", "source": None, "evidence": [], "matched_facts": []})
    reviewed = len([item for item in standards if item.get("rule_version_id")])
    return {"business_id": str(business.id), "standards": standards, "total_standards_found": len(standards),
        "assessment_id": str(run.assessment_id) if run else str(assessment_id) if assessment_id else None,
        "reviewed_match_count": reviewed,
        "scope_status": "MATCHED" if reviewed else "PARTIAL_SCOPE" if run else "ASSESSMENT_REQUIRED",
        "scope_note": "No reviewed standards matched this assessment within the currently supported knowledge scope. Additional product or quality review may be needed." if not reviewed else "Matches are limited to reviewed requirements for this saved assessment.",
        "disclaimer": "Only saved assessments against published rules and verified evidence are matched. This is not a complete BIS/QCO catalogue."}
