"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import StatusBadge from "@/components/StatusBadge";
import Disclosure from "@/components/product/Disclosure";
import { useBusinessContext } from "@/context/BusinessContext";
import { api } from "@/lib/api";
import type { DocumentItem } from "@/types";
export default function DocumentDetailPage({ params }: { params: Promise<{id:string}> }) {
  const { id } = use(params);
  const { activeBusinessId } = useBusinessContext();
  const [document,setDocument] = useState<DocumentItem | null>(null);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [error,setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setDocument(null); setError(null);
    if(!activeBusinessId) { setLoading(false); return; }
    setLoading(true);
    api.documents.list(activeBusinessId).then(response => { if(active) setDocument(response.documents.find(item => item.id === id || item.code === id) || null); }).catch(() => { if(active) setError("We couldn't load this document."); }).finally(() => { if(active) setLoading(false); });
    return () => { active = false; };
  },[id,activeBusinessId]);
  async function togglePortal() {
    if(!document || !activeBusinessId) return;
    setSaving(true); setError(null);
    const next = !document.portal_uploaded;
    try { await api.documents.updatePortalStatus(activeBusinessId,document.id,next); setDocument({...document,portal_uploaded:next}); const key = "complywise_portal_uploaded_" + activeBusinessId; const saved = JSON.parse(localStorage.getItem(key) || "{}"); localStorage.setItem(key,JSON.stringify({...saved,[document.id]:next})); }
    catch { setError("The filing status wasn't saved. Please try again."); }
    finally { setSaving(false); }
  }
  const query = activeBusinessId ? "?business_id=" + encodeURIComponent(activeBusinessId) : "";
  return <AppShell activeView="documents"><div className="max-w-4xl space-y-8">
    <Link className="text-sm text-[var(--ui-secondary)]" href={"/documents" + query}>← Document vault</Link>
    {error && <ErrorState message={error} onRetry={() => setError(null)} />}
    {loading ? <LoadingSkeleton count={3} /> : !document ? <div className="ui-object ui-empty"><h1 className="text-2xl">This document isn't available.</h1><p>Choose a business and return to its document vault.</p><Link className="ui-button mt-5" href={"/documents" + query}>Open vault →</Link></div> : <>
      <header><div className="flex items-center justify-between gap-4 mb-3"><p className="ui-eyebrow">{document.authority}</p><StatusBadge status={document.status} size="md" /></div><h1 className="text-3xl">{document.name}</h1><p className="text-sm text-[var(--ui-secondary)] mt-3">{document.category}</p></header>
      <section className="ui-object"><h2 className="font-semibold mb-4">What to do next</h2><p className="text-sm text-[var(--ui-secondary)]">{document.notes || "Review the requirement, then upload the evidence you need."}</p><div className="flex flex-wrap gap-3 mt-5"><Link className="ui-button ui-button-primary" href={"/documents" + query}>Manage document →</Link><Link className="ui-button" href={"/compliance/" + encodeURIComponent(document.requirement_id) + query}>View requirement →</Link></div></section>
      <section className="ui-object"><label className="flex items-center justify-between gap-4"><span><span className="font-medium block">Filed with the authority</span><span className="text-xs text-[var(--ui-secondary)]">Record a submission you have made on the official portal.</span></span><input className="h-5 w-5" type="checkbox" checked={Boolean(document.portal_uploaded)} disabled={saving} onChange={togglePortal} /></label><p role="status" className="text-xs text-[var(--ui-sage)] mt-3">{saving ? "Saving…" : document.portal_uploaded ? "Marked as filed. This is your record of submission." : "Not marked as filed."}</p></section>
      <Disclosure title="Statutory basis & document details"><dl className="grid gap-5 sm:grid-cols-2 text-sm"><div><dt className="ui-eyebrow">Requirement</dt><dd className="mt-1">{document.requirement_name || document.requirement_id}</dd></div><div><dt className="ui-eyebrow">Valid until</dt><dd className="mt-1">{document.valid_until || document.expiry_date || "Not recorded"}</dd></div><div><dt className="ui-eyebrow">Reference</dt><dd className="font-mono text-xs mt-1 break-all">{document.code || document.id}</dd></div><div><dt className="ui-eyebrow">Checking status</dt><dd className="mt-1">{document.prevalidation_status?.replaceAll("_"," ") || "Not yet checked"}</dd></div></dl></Disclosure>
    </>}
  </div></AppShell>;
}
