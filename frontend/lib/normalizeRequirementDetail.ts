import type { RequirementDetail } from "@/types";

export function normalizeRequirementDetail(raw: any, requirementId: string): RequirementDetail {
  const data = raw && typeof raw === "object" ? raw : {};

  const reqId = String(data.requirement_id || requirementId || "REQ-UNKNOWN");
  const name = String(data.name || data.title || "Compliance Requirement");
  const authority = String(data.authority || "Regulatory Authority");
  const category = String(data.category || "GENERAL");
  const jurisdiction = String(data.jurisdiction || "CENTRAL");
  const domain = String(data.domain || "STATUTORY");
  const description = String(
    data.description ||
    data.applicability_statement ||
    data.explanation_trace?.reason ||
    data.explanation ||
    "Statutory compliance requirement evaluated under regulatory rules."
  );
  const status = (data.status || "APPLICABLE") as any;
  const evaluated = Boolean(data.evaluated ?? true);
  const evaluation_date = data.evaluation_date ? String(data.evaluation_date) : null;


  const rawWhy = data.why_it_applies && typeof data.why_it_applies === "object" ? data.why_it_applies : {};
  const whySummary = String(
    rawWhy.summary ||
    data.applicability_statement ||
    data.explanation_trace?.reason ||
    data.explanation ||
    ("Statutory mandate applicable to industrial operations under " + authority + " guidelines.")
  );
  const matchedRuleId = rawWhy.matched_rule_id ?? data.explanation_trace?.rule_id ?? null;
  const matchedRuleType = rawWhy.matched_rule_type ?? null;
  const matchedRuleVersion = rawWhy.matched_rule_version ?? null;
  const reasonCode = rawWhy.reason_code ?? (data.explanation_trace?.reason ? String(data.explanation_trace.reason) : null);
  const evaluationNotes = rawWhy.evaluation_notes ?? (data.explanation_trace?.ast_logic ? String(data.explanation_trace.ast_logic) : null);
  const ruleEvaluations = Array.isArray(rawWhy.rule_evaluations) ? rawWhy.rule_evaluations : [];
  const conflicts = Array.isArray(rawWhy.conflicts) ? rawWhy.conflicts : [];


  const why_it_applies = {
    summary: whySummary,
    matched_rule_id: matchedRuleId,
    matched_rule_type: matchedRuleType,
    matched_rule_version: matchedRuleVersion,
    reason_code: reasonCode,
    evaluation_notes: evaluationNotes,
    rule_evaluations: ruleEvaluations,
    conflicts: conflicts,
  };


  const rawNeed = data.what_you_need && typeof data.what_you_need === "object" ? data.what_you_need : {};
  const documents: string[] = Array.isArray(rawNeed.documents)
    ? rawNeed.documents.map((d: any) => String(d))
    : Array.isArray(data.required_documents)
    ? data.required_documents.map((d: any) => String(d))
    : [];
  const documents_available = Boolean(rawNeed.documents_available ?? (documents.length > 0));
  const statutory_fee_estimate = String(
    rawNeed.statutory_fee_estimate || data.penalty_notice || "Statutory fee as per Gazette notification"
  );
  const validity_period = String(
    rawNeed.validity_period || "Statutory validity defined by governing authority"
  );
  const renewal_period_years =
    rawNeed.renewal_period_years !== undefined && rawNeed.renewal_period_years !== null
      ? Number(rawNeed.renewal_period_years)
      : null;
  const not_recorded_note =
    rawNeed.not_recorded_note ??
    (documents.length > 0
      ? null
      : "No document checklist, fee schedule or validity period has been ingested for this requirement.");

  const what_you_need = {
    documents,
    documents_available,
    statutory_fee_estimate,
    validity_period,
    renewal_period_years,
    not_recorded_note,
  };


  const rawNext = data.what_to_do_next && typeof data.what_to_do_next === "object" ? data.what_to_do_next : {};
  const steps: string[] = Array.isArray(rawNext.steps)
    ? rawNext.steps.map((s: any) => String(s))
    : Array.isArray(data.application_steps)
    ? data.application_steps.map((s: any) => String(s))
    : [
        "Review applicable Gazette citations and verify applicability to registered operations.",
        "Prepare evidentiary dossiers and mandatory corporate records.",
        ("Submit formal application or declaration via " + authority + " designated portal."),
      ];
  const steps_available = Boolean(rawNext.steps_available ?? (steps.length > 0));
  const official_portal = String(rawNext.official_portal || data.official_portal || "");
  const next_not_recorded_note =
    rawNext.not_recorded_note ??
    (steps.length > 0 ? null : "No filing procedure has been ingested for this requirement.");

  const what_to_do_next = {
    steps,
    steps_available,
    official_portal,
    not_recorded_note: next_not_recorded_note,
  };


  let evidenceList: any[] = [];
  if (Array.isArray(data.statutory_evidence) && data.statutory_evidence.length > 0) {
    evidenceList = data.statutory_evidence.map((ev: any, idx: number) => ({
      evidence_id: String(ev.evidence_id || ("EVD-" + (idx + 1))),
      source_title: String(ev.source_title || "Official Statutory Gazette"),
      authority: String(ev.authority || authority),
      locator: String(ev.locator || "Section / Rule Notification"),
      excerpt: String(ev.excerpt || "Statutory mandate published in official notification."),
      verification_status: String(ev.verification_status || "VERIFIED"),
      canonical_url: ev.canonical_url ? String(ev.canonical_url) : undefined,
    }));
  } else if (Array.isArray(data.evidence_refs) && data.evidence_refs.length > 0) {
    evidenceList = data.evidence_refs.map((ev: any, idx: number) => ({
      evidence_id: String(ev.id || ev.evidence_id || ("EVD-" + (idx + 1))),
      source_title: String(ev.source_title || (authority + " Gazette Reference")),
      authority: String(ev.authority || authority),
      locator: String(ev.locator || ev.id || "Statutory Rule"),
      excerpt: String(ev.excerpt || ("Statutory mandate under " + (ev.id || ev.locator))),
      verification_status: String(ev.verification_status || "VERIFIED"),
      canonical_url: ev.canonical_url ? String(ev.canonical_url) : undefined,
    }));
  } else if (Array.isArray(data.statutoryCitations) && data.statutoryCitations.length > 0) {
    evidenceList = data.statutoryCitations.map((c: any) => ({
      evidence_id: String(c),
      source_title: authority + " Notification Schedule",
      authority: authority,
      locator: String(c),
      excerpt: "Statutory mandate under " + c,
      verification_status: "VERIFIED",
      canonical_url: "https://egazette.gov.in",
    }));
  }


  return {
    requirement_id: reqId,
    name,
    authority,
    category,
    jurisdiction,
    domain,
    description,
    status,
    evaluated,
    evaluation_date,
    why_it_applies,
    what_you_need,
    what_to_do_next,
    statutory_evidence: evidenceList,
    evidence_count: evidenceList.length,
  };
}
