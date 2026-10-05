import type { RequirementDetail } from "@/types";

export function normalizeRequirementDetail(raw: any, requirementId: string): RequirementDetail {
  const data = raw && typeof raw === "object" ? raw : {};

  const reqId = String(data.requirement_id || requirementId || "REQ-UNKNOWN");
  const name = String(data.name || data.title || "Compliance Requirement");
  const authority = String(data.authority || "Regulatory Authority");
  const category = String(data.category || "GENERAL");
  const jurisdiction = String(data.jurisdiction || "Not provided");
  const domain = String(data.domain || "STATUTORY");
  const description = String(
    data.description ||
    data.applicability_statement ||
    data.explanation_trace?.reason ||
    data.explanation ||
    "No requirement description is recorded yet."
  );
  const status = (data.status || "UNVERIFIED") as any;
  const evaluated = Boolean(data.evaluated ?? Boolean(data.status));
  const evaluation_date = data.evaluation_date ? String(data.evaluation_date) : null;


  const rawWhy = data.why_it_applies && typeof data.why_it_applies === "object" ? data.why_it_applies : {};
  const whySummary = String(
    rawWhy.summary ||
    data.applicability_statement ||
    data.explanation_trace?.reason ||
    data.explanation ||
    "No applicability explanation is recorded yet."
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
    rawNeed.statutory_fee_estimate || "Not recorded"
  );
  const validity_period = String(
    rawNeed.validity_period || "Not recorded"
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
    ...rawNeed,
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
    : [];
  const steps_available = Boolean(rawNext.steps_available ?? (steps.length > 0));
  const resolvedPortal = rawNext.official_portal || rawNext.portal_url || data.official_portal || data.portal_url || "";
  const official_portal = String(resolvedPortal || "");
  const next_not_recorded_note =
    rawNext.not_recorded_note ??
    (steps.length > 0 ? null : "No filing procedure has been ingested for this requirement.");

  const what_to_do_next = {
    ...rawNext,
    steps,
    steps_available,
    official_portal,
    not_recorded_note: next_not_recorded_note,
  };


  let evidenceList: any[] = [];
  if (Array.isArray(data.statutory_evidence) && data.statutory_evidence.length > 0) {
    evidenceList = data.statutory_evidence.map((ev: any, idx: number) => ({
      evidence_id: String(ev.evidence_id || ("EVD-" + (idx + 1))),
      source_title: String(ev.source_title || "Source not recorded"),
      authority: String(ev.authority || authority),
      locator: String(ev.locator || "Section / Rule Notification"),
      excerpt: String(ev.excerpt || "Source passage not recorded."),
      verification_status: String(ev.verification_status || "UNVERIFIED"),
      canonical_url: String(ev.canonical_url || ""),
    }));
  } else if (Array.isArray(data.evidence_refs) && data.evidence_refs.length > 0) {
    evidenceList = data.evidence_refs.map((ev: any, idx: number) => ({
      evidence_id: String(ev.id || ev.evidence_id || ("EVD-" + (idx + 1))),
      source_title: String(ev.source_title || "Source not recorded"),
      authority: String(ev.authority || authority),
      locator: String(ev.locator || ev.id || "Statutory Rule"),
      excerpt: String(ev.excerpt || "Source passage not recorded."),
      verification_status: String(ev.verification_status || "UNVERIFIED"),
      canonical_url: String(ev.canonical_url || ""),
    }));
  } else if (Array.isArray(data.statutoryCitations) && data.statutoryCitations.length > 0) {
    evidenceList = data.statutoryCitations.map((c: any) => ({
      evidence_id: String(c),
      source_title: "Source not recorded",
      authority: authority,
      locator: String(c),
      excerpt: "Source passage not recorded.",
      verification_status: "UNVERIFIED",
      canonical_url: "",
    }));
  }


  return {
    ...data,
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
