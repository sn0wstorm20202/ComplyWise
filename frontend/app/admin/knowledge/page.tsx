"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/AdminShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import Overlay from "@/components/product/Overlay";
import { request } from "@/lib/api/client";

type Candidate = { id: string; business_name: string; title: string; description: string; authority: string;
  jurisdiction: string; source_url: string | null; source_title: string; excerpt: string; status: string; content_hash: string };

export default function KnowledgeReviewPage() {
  const [rows, setRows] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [reason, setReason] = useState("");
  const [requirementId, setRequirementId] = useState("");
  const [ruleId, setRuleId] = useState("");
  const [ast, setAst] = useState("");
  const [saving, setSaving] = useState(false);
  const [decision, setDecision] = useState("RETURN_FOR_REVIEW");
  const [reviewError, setReviewError] = useState<string | null>(null);
  async function load() {
    setLoading(true); setError(null);
    try { const result = await request<{ candidates: Candidate[] }>("/admin/knowledge"); setRows(result.candidates); }
    catch (err) { setError(err instanceof Error ? err.message : "Couldn't load source reviews."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function review(e: React.FormEvent) {
    e.preventDefault(); if (!selected || saving) return;
    setSaving(true); setReviewError(null);
    try {
      await request(`/admin/knowledge/${selected.id}/review`, { method: "POST", body: JSON.stringify({
        decision, reason, requirement_id: requirementId, rule_id: ruleId,
        ...(decision === "PUBLISH" ? { condition_ast: JSON.parse(ast) } : {}),
      }) });
      setSelected(null); await load();
    } catch (err) { setReviewError(err instanceof Error ? err.message : "Couldn't save this review."); }
    finally { setSaving(false); }
  }
  return <AdminShell><div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
    <header><p className="ui-eyebrow">Knowledge review</p><h1 className="mt-3 text-3xl">Review the source. Record the rule.</h1><p className="text-sm text-[var(--ui-secondary)] mt-3">Check the captured passage and its applicability condition before publishing. Every decision is recorded.</p></header>
    {loading ? <LoadingSkeleton count={4} /> : error ? <ErrorState message={error} onRetry={() => void load()} /> : rows.length ? rows.map(row => <article key={row.id} className="ui-object flex flex-col sm:flex-row justify-between gap-4">
      <div><p className="ui-eyebrow">{row.business_name} · {row.jurisdiction}</p><h2 className="text-base mt-2">{row.title}</h2><p className="text-xs text-[var(--ui-secondary)] mt-2">{row.authority}</p></div>
      <button className="ui-button self-start" onClick={() => { setSelected(row); setReason(""); setRequirementId(""); setRuleId(""); setAst(""); setDecision("RETURN_FOR_REVIEW"); setReviewError(null); }}>Review passage →</button>
    </article>) : <div className="ui-object"><h2>No source reviews waiting.</h2><p className="text-sm text-[var(--ui-secondary)] mt-2">Captured regulatory claims appear here for review.</p></div>}
    <Overlay open={Boolean(selected)} onClose={() => { if (!saving) setSelected(null); }} title="Source and applicability review" drawer>
      {selected && <form onSubmit={review} className="space-y-5">
        <h2 className="text-xl">{selected.title}</h2><p className="text-sm text-[var(--ui-secondary)]">{selected.description}</p>
        <blockquote className="ui-object bg-[var(--ui-sage-faint)] text-sm leading-relaxed">{selected.excerpt || "No passage captured. Return this claim for review."}</blockquote>
        {selected.source_url && <a className="text-sm text-[var(--ui-sage)] underline" href={selected.source_url} target="_blank" rel="noopener noreferrer">Open captured source ↗</a>}
        <p className="text-xs break-all text-[var(--ui-muted)]">Content version: {selected.content_hash}</p>
        <label className="block text-sm">Decision<select className="ui-input mt-2 w-full" value={decision} onChange={e => setDecision(e.target.value)}><option value="RETURN_FOR_REVIEW">Return for review</option><option value="PUBLISH">Verify passage and publish rule</option></select></label>
        {decision === "PUBLISH" && <><label className="block text-sm">Catalogue requirement identifier<input className="ui-input mt-2 w-full" required value={requirementId} onChange={e => setRequirementId(e.target.value)} /></label><label className="block text-sm">Rule identifier<input className="ui-input mt-2 w-full" required value={ruleId} onChange={e => setRuleId(e.target.value)} /></label><label className="block text-sm">Reviewed applicability condition (JSON)<textarea className="ui-input font-mono mt-2 w-full min-h-40" required value={ast} onChange={e => setAst(e.target.value)} /></label><p className="text-xs text-[var(--ui-secondary)]">Use saved business-variable keys and the rule engine’s supported operators. The condition must follow the source passage.</p></>}
        <label className="block text-sm">Reason<textarea className="ui-input mt-2 w-full min-h-24" required value={reason} onChange={e => setReason(e.target.value)} /></label>
        {reviewError && <p role="alert" className="text-sm text-[var(--ui-danger)]">{reviewError}</p>}
        <button disabled={saving} className="ui-button ui-button-primary">{saving ? "Saving review…" : "Save review"}</button>
      </form>}
    </Overlay>
  </div></AdminShell>;
}
