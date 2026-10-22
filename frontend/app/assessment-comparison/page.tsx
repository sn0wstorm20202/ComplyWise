"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import ErrorState from "@/components/ErrorState";
import { EvidenceSummaryView, recordedDate } from "@/components/product/AssessmentEvidence";
import { request } from "@/lib/api/client";
import { useBusinessContext } from "@/context/BusinessContext";
import type { AssessmentComparison, DecisionSide, HistoryRunCard } from "@/types/comparison";

function valueText(value: unknown): string {
  if (value === null || value === undefined) return "Unknown / not recorded";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}
function Side({ side }: { side: DecisionSide | null }) {
  if (!side) return <p className="text-sm">Not evaluated in this saved run. This does not mean not applicable.</p>;
  return <div className="space-y-2 min-w-0">
    <p className="font-semibold">{side.status.replaceAll("_", " ")}</p>
    <p className="text-sm">{side.explanation}</p>
    {side.reason && <p className="text-xs text-[var(--ui-secondary)]">Recorded reason: {side.reason.replaceAll("_", " ")}</p>}
    <details className="text-xs"><summary className="cursor-pointer">Facts and rules read by this decision</summary>
      <dl className="mt-2 space-y-1">{Object.entries(side.facts_used).map(([key, value]) => <div key={key}><dt className="inline font-semibold">{key.replaceAll("_", " ")}: </dt><dd className="inline">{valueText(value)}</dd></div>)}</dl>
      {!Object.keys(side.facts_used).length && <p>No variable-level trace was captured.</p>}
      {side.rule_evaluations.map((rule, index) => <p className="mt-2" key={`${rule.rule_id}-${index}`}>{rule.rule_id} v{rule.version} → {rule.truth_value}</p>)}
    </details>
    <EvidenceSummaryView evidence={side.evidence} />
  </div>;
}
function Comparison() {
  const params = useSearchParams();
  const router = useRouter();
  const { activeBusinessId } = useBusinessContext();
  const businessId = params.get("business_id") || activeBusinessId;
  const requestedBefore = params.get("before_run_id");
  const requestedAfter = params.get("after_run_id");
  const [runs, setRuns] = useState<HistoryRunCard[]>([]);
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [comparison, setComparison] = useState<AssessmentComparison | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("attention");
  const [walkthrough, setWalkthrough] = useState<{business_id: string; before_run_id: string | null; after_run_id: string | null} | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let disposed = false;
    request<{available: boolean; business_id: string; before_run_id: string | null; after_run_id: string | null}>("/assessment-walkthrough", {cache: "no-store"})
      .then(data => { if (!disposed && data.available) setWalkthrough(data); }).catch(() => {});
    return () => { disposed = true; };
  }, []);
  useEffect(() => {
    let disposed = false;
    setRuns([]); setBefore(""); setAfter(""); setComparison(null); setError("");
    if (!businessId) return;
    setLoading(true);
    request<{runs: HistoryRunCard[]; business_name: string; has_older_runs: boolean}>(`/businesses/${businessId}/decision-history`, {cache: "no-store"})
      .then(data => { if (!disposed) { setRuns(data.runs); setBusinessName(data.business_name);
        if ((requestedBefore && !data.runs.some(r => r.run_id === requestedBefore)) || (requestedAfter && !data.runs.some(r => r.run_id === requestedAfter))) {
          setError("The requested snapshots are unavailable in this business’s recent saved history. Choose an available snapshot."); return;
        }
        setBefore(requestedBefore || (data.runs.length > 1 ? data.runs[data.runs.length - 1].run_id : "")); setAfter(requestedAfter || data.runs[0]?.run_id || ""); } })
      .catch(() => { if (!disposed) setError("Saved assessment history could not be loaded. Your records have not been changed."); })
      .finally(() => { if (!disposed) setLoading(false); });
    return () => { disposed = true; };
  }, [businessId, retry, requestedBefore, requestedAfter]);
  useEffect(() => {
    let disposed = false;
    setComparison(null);
    if (!businessId || !before || !after) return;
    setLoading(true); setError("");
    request<AssessmentComparison>(`/businesses/${businessId}/compare/${before}/${after}`, {cache: "no-store"})
      .then(data => { if (!disposed) setComparison(data); })
      .catch(() => { if (!disposed) setError("The comparison is unavailable. Select two sealed decisions from this business and try again."); })
      .finally(() => { if (!disposed) setLoading(false); });
    return () => { disposed = true; };
  }, [businessId, before, after]);
  const rows = comparison?.requirements.filter(row => filter === "all" || row.status_changed || row.needs_attention) || [];
  return <AppShell activeView="dashboard"><div className="space-y-6">
    <header><p className="ui-eyebrow">Saved assessment history · {businessName}</p><h1 className="text-3xl mt-2">What changed, and why?</h1>
      <p className="text-sm text-[var(--ui-secondary)] mt-3">Compare recorded business facts and decisions. Selecting a snapshot reads history; it does not rerun or overwrite an assessment.</p>
      <div className="flex flex-wrap gap-3 mt-4"><Link className="ui-button" href={businessId ? `/dashboard?business_id=${businessId}` : "/dashboard"}>← Dashboard</Link>
        {walkthrough && <button className="ui-button" onClick={() => router.push(`/assessment-comparison?business_id=${walkthrough.business_id}${walkthrough.before_run_id ? `&before_run_id=${walkthrough.before_run_id}&after_run_id=${walkthrough.after_run_id}` : ""}`)}>Merchant export → manufacturing walkthrough</button>}</div>
    </header>
    {walkthrough?.business_id === businessId && <p role="note" className="ui-object text-sm">Fictional business facts, evaluated by the ordinary rule engine against the existing catalogue. Compare merchant export with manufacturing, then select “3 · Manufacturing · power information unknown” to see why uncertainty returns. No filing or approval is claimed.</p>}
    {error && <ErrorState message={error} onRetry={() => setRetry(value => value + 1)} />}
    <div className="grid gap-4 sm:grid-cols-2">{[["Before", before, setBefore], ["After", after, setAfter]].map(([label, selected, setter]) => <label key={String(label)} className="text-sm font-semibold">{String(label)}
      <select className="ui-input w-full mt-2" value={String(selected)} onChange={e => (setter as (v: string) => void)(e.target.value)}><option value="">Choose a saved snapshot</option>{runs.map(run => <option key={run.run_id} value={run.run_id}>{run.title || `Profile v${run.profile_version}`} · {recordedDate(run.evaluation_date)}</option>)}</select>
    </label>)}</div>
    <p role="status" className="text-sm text-[var(--ui-secondary)]">{loading ? "Reading saved decisions…" : runs.length < 2 ? "This business needs two sealed decisions to compare. Existing results stay available on its dashboard." : comparison ? `${comparison.status_changes} status changes · ${comparison.uncertain_rows} rows retain uncertainty` : "Choose two saved snapshots."}</p>
    {comparison && <>
      <section className="ui-object space-y-3"><h2 className="font-semibold">Reading this comparison</h2><p className="text-sm">{comparison.interpretation}</p>
        <p className="text-sm text-[var(--ui-secondary)]">{comparison.after.coverage.message}</p>
        <p className="text-xs">Before: {comparison.before.mode} · After: {comparison.after.mode}. A rule predicate being true is not sufficient when evidence or coverage is unresolved.</p>
        <details className="text-xs"><summary className="cursor-pointer">Immutable record references</summary><p className="mt-2 break-all">Before: {comparison.before.run_id} · {comparison.before.content_hash || "Hash not recorded"}</p><p className="break-all">After: {comparison.after.run_id} · {comparison.after.content_hash || "Hash not recorded"}</p></details>
      </section>
      <section><h2 className="text-xl mb-3">Changed business facts</h2><div className="overflow-x-auto"><table className="w-full text-sm text-left"><caption className="sr-only">Business facts in each saved profile</caption><thead><tr><th className="p-3">Fact</th><th className="p-3">Before</th><th className="p-3">After</th></tr></thead><tbody>{comparison.fact_changes.map(fact => <tr key={fact.key} className="border-t border-[var(--ui-border)]"><th scope="row" className="p-3">{fact.label}</th><td className="p-3">{valueText(fact.before.value)}<p className="text-xs">{fact.before.origin}</p></td><td className="p-3">{valueText(fact.after.value)}<p className="text-xs">{fact.after.origin}</p></td></tr>)}</tbody></table></div>{!comparison.fact_changes.length && <p>No recorded fact values or origins changed.</p>}</section>
      <section className="space-y-4"><div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl">Requirements & unresolved questions</h2><label className="text-sm">Show <select className="ui-input" value={filter} onChange={e => setFilter(e.target.value)}><option value="attention">Changes and uncertainty</option><option value="all">All recorded requirements</option></select></label></div>
        {rows.map(row => <article key={row.requirement_id} className="ui-object space-y-3"><h3 className="font-semibold">{row.title}</h3><p className="text-xs text-[var(--ui-secondary)]">{row.requirement_id}{row.status_changed ? " · Status changed" : " · Status retained"}{row.needs_attention ? " · Uncertainty retained" : ""}</p>
          {!!row.changed_facts_used.length && <p className="text-xs">Changed facts found in the recorded trace: {row.changed_facts_used.map(k => k.replaceAll("_", " ")).join(", ")}</p>}
          <div className="grid gap-6 sm:grid-cols-2"><div><h4 className="ui-eyebrow mb-2">Before</h4><Side side={row.before} /></div><div><h4 className="ui-eyebrow mb-2">After</h4><Side side={row.after} /></div></div>
        </article>)}
        {!rows.length && <p>No changes or unresolved results in this selection. Choose “All recorded requirements” to inspect retained decisions.</p>}
      </section>
    </>}
  </div></AppShell>;
}
export default function Page() { return <Suspense fallback={<p role="status">Loading comparison…</p>}><Comparison /></Suspense>; }
