"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import Overlay from "@/components/product/Overlay";
import { request } from "@/lib/api/client";

type Candidate = { id: string; business_name: string; title: string; description: string; authority: string;
  jurisdiction: string; source_url: string | null; source_title: string; excerpt: string; status: string; content_hash: string; document_requirements?: string[] };

type SourceChange = { id: string; source_url: string; source_title: string; affected_rule_count: number;
  affected_decision_run_count: number; previous_hash: string; new_hash: string; status: string };

export default function KnowledgeReviewPage() {
  const [rows, setRows] = useState<Candidate[]>([]);
  const [changes, setChanges] = useState<SourceChange[]>([]);
  const [selectedChange, setSelectedChange] = useState<SourceChange | null>(null);
  const [changeOutcome, setChangeOutcome] = useState("UPDATE_REQUIRED");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [reason, setReason] = useState("");
  const [requirementId, setRequirementId] = useState("");
  const [ruleId, setRuleId] = useState("");
  const [ast, setAst] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveUntil, setEffectiveUntil] = useState("");
  const [examples, setExamples] = useState("");
  const [procedural, setProcedural] = useState("{}");
  const [saving, setSaving] = useState(false);
  const [decision, setDecision] = useState("RETURN_FOR_REVIEW");
  const [notice, setNotice] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  async function load() {
    setLoading(true); setError(null);
    try { const result = await request<{ candidates: Candidate[]; source_changes: SourceChange[] }>("/admin/knowledge"); setRows(result.candidates); setChanges(result.source_changes || []); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't load source reviews."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function reassess(change: SourceChange) {
    if (saving) return;
    setSaving(true); setReviewError(null);
    try {
      const result = await request<{ job_ids: string[]; busy_assessment_ids: string[] }>(`/admin/knowledge/source-changes/${change.id}/reassess`, { method: "POST" });
      setNotice(`${result.job_ids.length} reassessment operations recorded. ${result.busy_assessment_ids.length} assessments are busy; retry those after processing finishes.`);
      setSelectedChange(null); await load();
    } catch (err) { setReviewError(err instanceof Error ? err.message : "Couldn't schedule reassessment."); }
    finally { setSaving(false); }
  }
  async function reviewChange(e: React.FormEvent) {
    e.preventDefault(); if (!selectedChange || saving) return;
    setSaving(true); setReviewError(null);
    try {
      await request(`/admin/knowledge/source-changes/${selectedChange.id}/review`, { method: "POST",
        body: JSON.stringify({ decision: changeOutcome, reason }) });
      setSelectedChange(null); await load();
    } catch (err) { setReviewError(err instanceof Error ? err.message : "Couldn't save this review."); }
    finally { setSaving(false); }
  }
  async function review(e: React.FormEvent) {
    e.preventDefault(); if (!selected || saving) return;
    setSaving(true); setReviewError(null);
    try {
      await request(`/admin/knowledge/${selected.id}/review`, { method: "POST", body: JSON.stringify({
        decision, reason, requirement_id: requirementId, rule_id: ruleId,
        ...(decision === "PUBLISH" ? { condition_ast: JSON.parse(ast), effective_from: effectiveFrom,
          effective_until: effectiveUntil || null, examples: JSON.parse(examples), procedural_metadata: JSON.parse(procedural) } : {}),
      }) });
      setSelected(null); await load();
    } catch (err) { setReviewError(err instanceof Error ? err.message : "Couldn't save this review."); }
    finally { setSaving(false); }
  }
  return <AdminShell><div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
    <header><p className="ui-eyebrow">Knowledge review</p><h1 className="mt-3 text-3xl">Review the source. Record the rule.</h1><p className="text-sm text-[var(--ui-secondary)] mt-3">Check the captured passage and its applicability condition before publishing. Every decision is recorded.</p></header>
    {notice && <p role="status" className="ui-object">{notice}</p>}
    {changes.map(change => <article key={change.id} className="ui-object space-y-3">
      <p className="ui-eyebrow">Source changed · {change.status === "UPDATE_REQUIRED" ? "Rule update required" : "Review pending"}</p>
      <h2>{change.source_title}</h2><p className="text-sm text-[var(--ui-secondary)]">{change.affected_rule_count} rules and {change.affected_decision_run_count} recorded decision runs may be affected. Saved assessments retain their original evidence.</p>
      <button className="ui-button" onClick={() => { setSelectedChange(change); setReason(""); setChangeOutcome("UPDATE_REQUIRED"); setReviewError(null); }}>Review source change →</button>
    </article>)}
    {loading ? <LoadingSkeleton count={4} /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : rows.length ? rows.map(row => <article key={row.id} className="ui-object flex flex-col sm:flex-row justify-between gap-4">
      <div><p className="ui-eyebrow">{row.business_name} · {row.jurisdiction}</p><h2 className="text-base mt-2">{row.title}</h2><p className="text-xs text-[var(--ui-secondary)] mt-2">{row.authority}</p></div>
      <button className="ui-button self-start" onClick={() => { setSelected(row); setReason(""); setRequirementId(""); setRuleId(""); setAst(""); setEffectiveFrom(""); setEffectiveUntil(""); setExamples(""); setProcedural(JSON.stringify(row.document_requirements?.length ? { required_documents: row.document_requirements } : {}, null, 2)); setDecision("RETURN_FOR_REVIEW"); setReviewError(null); }}>Review passage →</button>
    </article>) : <div className="ui-object"><h2>No source reviews waiting.</h2><p className="text-sm text-[var(--ui-secondary)] mt-2">Captured regulatory claims appear here for review.</p></div>}
    <Overlay open={Boolean(selectedChange)} onClose={() => { if (!saving) setSelectedChange(null); }} title="Review source change" drawer>
      {selectedChange && <form onSubmit={reviewChange} className="space-y-5">
        <h2 className="text-xl">{selectedChange.source_title}</h2>
        <a className="text-sm underline" href={selectedChange.source_url} target="_blank" rel="noopener noreferrer">Open current source ↗</a>
        <p className="text-xs break-all">Previous capture: {selectedChange.previous_hash}</p>
        <p className="text-xs break-all">New capture: {selectedChange.new_hash}</p>
        <label className="block text-sm">Review outcome<select className="ui-input mt-2 w-full" value={changeOutcome} onChange={e => setChangeOutcome(e.target.value)}><option value="UPDATE_REQUIRED">Rule update required</option><option value="NO_RULE_CHANGE">No rule change needed</option></select></label>
        <label className="block text-sm">Reason<textarea className="ui-input mt-2 w-full min-h-24" required value={reason} onChange={e => setReason(e.target.value)} /></label>
        <p className="text-sm text-[var(--ui-secondary)]">Publish a reviewed rule version before reassessing affected businesses. This review preserves existing decisions.</p>
        {selectedChange.status === "UPDATE_REQUIRED" && <button type="button" disabled={saving} className="ui-button" onClick={() => void reassess(selectedChange)}>Schedule affected assessments</button>}
        {reviewError && <p role="alert">{reviewError}</p>}
        <button disabled={saving} className="ui-button ui-button-primary">{saving ? "Saving…" : "Save source review"}</button>
      </form>}
    </Overlay>
    <Overlay open={Boolean(selected)} onClose={() => { if (!saving) setSelected(null); }} title="Source and applicability review" drawer>
      {selected && <form onSubmit={review} className="space-y-5">
        <h2 className="text-xl">{selected.title}</h2><p className="text-sm text-[var(--ui-secondary)]">{selected.description}</p>
        <blockquote className="ui-object bg-[var(--ui-sage-faint)] text-sm leading-relaxed">{selected.excerpt || "No passage captured. Return this claim for review."}</blockquote>
        {selected.source_url && <a className="text-sm text-[var(--ui-sage)] underline" href={selected.source_url} target="_blank" rel="noopener noreferrer">Open captured source ↗</a>}
        <p className="text-xs break-all text-[var(--ui-muted)]">Content version: {selected.content_hash}</p>
        <label className="block text-sm">Decision<select className="ui-input mt-2 w-full" value={decision} onChange={e => setDecision(e.target.value)}><option value="RETURN_FOR_REVIEW">Return for review</option><option value="PUBLISH">Verify passage and publish rule</option></select></label>
        {decision === "PUBLISH" && <><label className="block text-sm">Catalogue requirement identifier<input className="ui-input mt-2 w-full" required value={requirementId} onChange={e => setRequirementId(e.target.value)} /></label><label className="block text-sm">Rule identifier<input className="ui-input mt-2 w-full" required value={ruleId} onChange={e => setRuleId(e.target.value)} /></label><label className="block text-sm">Reviewed applicability condition (JSON)<textarea className="ui-input font-mono mt-2 w-full min-h-40" required value={ast} onChange={e => setAst(e.target.value)} /></label><p className="text-xs text-[var(--ui-secondary)]">Use saved business-variable keys and the rule engine’s supported operators. The condition must follow the source passage.</p></>}
        <label className="block text-sm">Reason<textarea className="ui-input mt-2 w-full min-h-24" required value={reason} onChange={e => setReason(e.target.value)} /></label>
        {decision === "PUBLISH" && <fieldset className="space-y-4">
          <legend className="text-sm font-medium">Effective dates and rule verification</legend>
          <label className="block text-sm">Effective from<input type="date" required className="ui-input mt-2 w-full" value={effectiveFrom} onChange={e => setEffectiveFrom(e.target.value)} /></label>
          <label className="block text-sm">Effective until (if recorded)<input type="date" className="ui-input mt-2 w-full" value={effectiveUntil} onChange={e => setEffectiveUntil(e.target.value)} /></label>
          <label className="block text-sm">Reviewed procedural information (optional JSON)<textarea className="ui-input font-mono mt-2 w-full min-h-32" value={procedural} onChange={e => setProcedural(e.target.value)} /></label>
          <p className="text-xs text-[var(--ui-secondary)]">Supported fields: required_documents and application_steps (text lists), statutory_fee, validity_period and deadline_notes (text). Record only information supported by the source. Omitted fields retain the earlier effective version; an empty list explicitly clears a checklist. This information uses the effective dates above.</p>
          <label className="block text-sm">Executable review examples (JSON)<textarea required className="ui-input font-mono mt-2 w-full min-h-40" value={examples} onChange={e => setExamples(e.target.value)} /></label>
          <p className="text-xs text-[var(--ui-secondary)]">Provide positive, negative and missing-fact cases. Each needs kind, facts and expected_truth (TRUE, FALSE or UNKNOWN). The engine checks these before publication.</p>
        </fieldset>}
        {reviewError && <p role="alert" className="text-sm text-[var(--ui-danger)]">{reviewError}</p>}
        <button disabled={saving} className="ui-button ui-button-primary">{saving ? "Saving review…" : "Save review"}</button>
      </form>}
    </Overlay>
  </div></AdminShell>;
}
