"use client";
import Link from "next/link";
import { ArrowRight, FileText, GitFork } from "lucide-react";
import type { ComplianceRequirementItem } from "@/types";
import StatusBadge from "../StatusBadge";
import Disclosure from "./Disclosure";
import { sanitizeExternalUrl } from "@/lib/url";

export default function RequirementCard({ requirement: req, businessId, assessmentId, onInspect }: { requirement: ComplianceRequirementItem; businessId: string | null; assessmentId?: string | null; onInspect: () => void }) {
  const params = new URLSearchParams();
  if (businessId) params.set("business_id", businessId);
  if (assessmentId) params.set("assessment_id", assessmentId);
  const query = params.size ? `?${params}` : "";
  const contextual = req.result_origin === "LLM_FALLBACK_RESULT";
  const source = sanitizeExternalUrl(req.source_url || req.citations?.[0]?.canonical_url);
  return <article className="ui-object">
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4"><div className="min-w-0"><p className="ui-eyebrow mb-2">{req.authority}</p><h2 className="text-lg font-semibold">{req.name}</h2><p className="text-sm text-[var(--ui-secondary)] mt-2 max-w-3xl line-clamp-2">{req.description}</p></div><StatusBadge status={req.status === "APPLICABLE" ? "REQUIRED" : req.status} size="md" /></div>
    {contextual && <p className="mt-3 text-xs text-[var(--ui-secondary)]">Planning guidance · confirm the relevant requirements before acting.{req.source_reference && ` Context: ${req.source_reference}`}</p>}
    <div className="mt-4"><Disclosure title="Why it applies · evidence & next steps">
      <div className="space-y-5">
        <div><p className="text-sm text-[var(--ui-secondary)]">{req.description || "Open the assessment trace to review the business facts behind this requirement."}</p><button className="text-xs text-[var(--ui-sage)] font-medium mt-2" onClick={onInspect}>Inspect assessment trace →</button></div>
        <dl className="grid gap-4 sm:grid-cols-3 text-xs"><div><dt className="ui-eyebrow">Jurisdiction</dt><dd className="mt-1">{req.jurisdiction}</dd></div><div><dt className="ui-eyebrow">Category</dt><dd className="mt-1">{req.category}</dd></div><div><dt className="ui-eyebrow">Requirement</dt><dd className="font-mono mt-1 break-all">{req.requirement_id}</dd></div></dl>
        {req.citations?.map((citation,index) => <blockquote key={citation.evidence_id || index} className="border-l-2 border-[var(--ui-sage-soft)] pl-4 hover:bg-[var(--ui-sage-faint)] transition-colors"><p className="text-sm">{citation.excerpt}</p><footer className="text-xs text-[var(--ui-secondary)] mt-2">{citation.source_title} · {citation.locator} · {citation.verification_status}</footer></blockquote>)}
        <div className="flex flex-wrap gap-3"><Link className="ui-button" href={`/documents${query}`}><FileText size={16} />Required documents</Link><Link className="ui-button" href={`/workflows${query}${query ? "&" : "?"}requirement_id=${encodeURIComponent(req.requirement_id)}`}><GitFork size={16} />Open workflow</Link>{source && <a className="ui-button" href={source} target="_blank" rel="noopener noreferrer">View source ↗</a>}</div>
      </div>
    </Disclosure></div>
    <div className="flex justify-end pt-4"><Link className="ui-button ui-button-primary" href={`/compliance/${encodeURIComponent(req.requirement_id)}${query}`}>{req.status === "NEEDS_INFORMATION" ? "Review missing information" : "Review requirement"}<ArrowRight size={16} /></Link></div>
  </article>;
}
