"use client";
import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { useBusinessContext } from "@/context/BusinessContext";
import { api } from "@/lib/api";
import { sanitizeExternalUrl } from "@/lib/url";
import type { StandardItem } from "@/types";
import { DEMO_STANDARDS } from "@/data/demo/standards";
export default function StandardDetailPage({ params }: { params: Promise<{id:string}> }) {
  const { id } = use(params);
  const { activeBusinessId, activeAssessmentId, isDemoMode } = useBusinessContext();
  const searchParams = useSearchParams();
  const businessId = searchParams.get("business_id") || activeBusinessId;
  const assessmentId = searchParams.get("assessment_id") || (businessId === activeBusinessId ? activeAssessmentId : null);
  const [standard,setStandard] = useState<StandardItem | null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(null); setStandard(null);
    api.standards.search("",businessId || undefined,assessmentId || undefined).then(response => { if(active) setStandard(response.standards.find(item => item.requirement_id === id) || null); }).catch(() => { if(active) setError("We couldn't load this standard."); }).finally(() => { if(active) setLoading(false); });
    return () => { active = false; };
  },[id,businessId,assessmentId]);
  const sample = isDemoMode ? DEMO_STANDARDS.find(item => item.id === id || item.code === id.replaceAll("-"," ")) : null;
  return <AppShell activeView="standards"><div className="max-w-4xl space-y-8">
    <Link href="/standards" className="text-sm text-[var(--ui-secondary)]">← Standards</Link>
    {loading ? <LoadingSkeleton count={3} /> : standard ? <>
      <header><p className="ui-eyebrow mb-3">{standard.authority} · {standard.jurisdiction}</p><h1 className="text-3xl">{standard.title}</h1><p className="text-sm text-[var(--ui-secondary)] mt-4">{standard.description}</p></header>
      <section className="ui-object"><h2 className="font-semibold">Basis & relevance</h2><p className="text-sm mt-2">{standard.why_it_matters || "See the saved assessment decision and its evidence."}</p><p className="text-sm mt-2">{standard.result_origin === "LLM_FALLBACK_RESULT" ? "Contextual quality planning; no reviewed standard or mandatory status established." : standard.is_mandatory === true ? "Mandatory within the recorded rule scope." : standard.is_mandatory === false ? "Voluntary." : "Mandatory status not recorded."}</p>{standard.source_reference && <p className="text-sm mt-2">Contextual source/authority: {standard.source_reference}</p>}{standard.rule_version_id && <p className="font-mono text-xs mt-2">Rule version: {standard.rule_version_id}</p>}</section>
      <section><h2 className="font-semibold mb-4">Relevant clauses & evidence</h2>{standard.citations?.length ? standard.citations.map((citation,index) => <article key={citation.evidence_id || index} className="ui-object"><div className="flex justify-between gap-4"><h3 className="font-medium">{citation.source_title}</h3><span className="ui-eyebrow">{citation.verification_status}</span></div><p className="font-mono text-xs text-[var(--ui-secondary)] mt-2">{citation.locator}</p><blockquote className="border-l-2 border-[var(--ui-sage-soft)] pl-4 my-4">{citation.excerpt}</blockquote>{sanitizeExternalUrl(citation.canonical_url) && <a className="ui-button" href={sanitizeExternalUrl(citation.canonical_url)!} target="_blank" rel="noopener noreferrer">View source ↗</a>}</article>) : <p className="text-sm text-[var(--ui-secondary)]">No source clauses are linked to this standard yet.</p>}</section>
      <footer className="font-mono text-xs text-[var(--ui-muted)]">{standard.requirement_id} · {standard.domain}</footer>
    </> : sample ? <article className="ui-object"><p className="ui-eyebrow">Sample standard</p><h1 className="text-3xl mt-3">{sample.code}: {sample.title}</h1><p className="mt-4">{sample.description}</p></article> : error ? <ErrorState message={error} onRetry={() => window.location.reload()} /> : <div className="ui-object ui-empty"><h1 className="text-2xl">This standard isn't available.</h1><p>Return to standards to find a current source-linked requirement.</p><Link href="/standards" className="ui-button mt-5">Browse standards →</Link></div>}
  </div></AppShell>;
}
