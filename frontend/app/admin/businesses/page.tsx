"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import type { Business } from "@/types";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Filter,
  History,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";

function AdminBusinessesDirectoryContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Quick Overview Drawer State
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [overviewData, setOverviewData] = useState<any | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"compliances" | "documents" | "profile">("compliances");

  useEffect(() => {
    loadBusinesses();
  }, []);

  async function loadBusinesses() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.businesses.getAdminBusinesses();
      setBusinesses(res.businesses || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load businesses directory.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenQuickView(businessId: string) {
    setSelectedBusinessId(businessId);
    setDrawerLoading(true);
    setDrawerTab("compliances");
    try {
      const data = await api.businesses.getAdminBusinessOverview(businessId);
      setOverviewData(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load business details.");
    } finally {
      setDrawerLoading(false);
    }
  }

  function copyBusinessId(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filteredBusinesses = businesses.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const ownerEmail = (b as any).owner_email || "";
    const stateStr = b.state || "";
    const distStr = b.district || "";
    return (
      b.name.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      ownerEmail.toLowerCase().includes(q) ||
      stateStr.toLowerCase().includes(q) ||
      distStr.toLowerCase().includes(q)
    );
  });

  return (
    <AdminShell activeTab="businesses">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300">
                Centralized Business Directory
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Multi-Tenant Enterprise Overview
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mt-1">
              Businesses & Profile Mandates
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Inspect onboarded enterprises across all user accounts by authoritative <strong>Business ID</strong>. Review declared profile versions, verify statutory mandates, and scrutinize uploaded evidence.
            </p>
          </div>

          <button
            onClick={loadBusinesses}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Directory
          </button>
        </div>

        {/* Global Loading / Error */}
        {loading && <LoadingSkeleton count={6} />}
        {error && <ErrorState message={error} onRetry={loadBusinesses} />}

        {!loading && !error && (
          <>
            {/* Search & Filter Bar */}
            <div className="p-4 rounded-2xl border border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Business ID, Enterprise Name, Owner Account Email, or State..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="text-xs font-semibold text-muted-foreground shrink-0">
                Showing {filteredBusinesses.length} of {businesses.length} Businesses Across Accounts
              </div>
            </div>

            {/* Businesses Showcase Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBusinesses.map((b) => {
                const ownerEmail = (b as any).owner_email || "System Account";
                const ownerName = (b as any).owner_name || "";
                const casesCount = (b as any).cases_count || 0;
                const docsCount = (b as any).documents_count || 0;
                const pendingCount = (b as any).pending_reviews_count || 0;
                const hasPending = pendingCount > 0;

                return (
                  <div
                    key={b.id}
                    className="rounded-2xl border border-border bg-card p-5 hover:border-purple-300 dark:hover:border-purple-800 transition-all shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top Badges & Business ID */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                          <Building2 className="w-5 h-5" />
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 justify-end">
                          <span className="font-mono text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded font-semibold">
                            Profile v{b.profile_version || 1}
                          </span>
                          {hasPending && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-950/70 px-2 py-0.5 rounded flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              {pendingCount} Review{pendingCount > 1 ? "s" : ""} Needed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Business Name */}
                      <h3 className="font-bold text-base text-foreground mt-3 line-clamp-1">
                        {b.name}
                      </h3>

                      {/* Business ID Box with One-Click Copy */}
                      <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/60">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                            BUSINESS ID:
                          </span>
                          <span className="font-mono text-[11px] font-semibold text-foreground truncate">
                            {b.id}
                          </span>
                        </div>
                        <button
                          onClick={(e) => copyBusinessId(b.id, e)}
                          title="Copy Business ID"
                          className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                        >
                          {copiedId === b.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Owner Account & Operational Footprint */}
                      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="font-medium text-foreground truncate" title={ownerEmail}>
                            Account: <span className="font-semibold">{ownerEmail}</span>
                            {ownerName ? ` (${ownerName})` : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                          <span>
                            {b.district ? `${b.district}, ` : ""}
                            {b.state || "Maharashtra"}
                          </span>
                        </div>
                      </div>

                      {/* Metrics Snapshot */}
                      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
                        <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
                          <span className="block text-[10px] text-muted-foreground font-semibold">COMPLIANCES</span>
                          <span className="font-bold text-foreground text-sm">{casesCount} Mandates</span>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
                          <span className="block text-[10px] text-muted-foreground font-semibold">EVIDENCE</span>
                          <span className="font-bold text-foreground text-sm">{docsCount} Uploads</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Controls */}
                    <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenQuickView(b.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Quick Drawer
                      </button>

                      <Link
                        href={`/admin?business_id=${b.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18181B] hover:bg-[#27272A] text-white text-xs font-semibold shadow-sm transition-colors"
                      >
                        <span>Scrutiny Cockpit</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Quick View Drawer Modal */}
        {selectedBusinessId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
              {/* Header */}
              <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground leading-none">
                      {overviewData?.business?.name || "Business Command Desk"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <span>ID: <code className="font-mono">{selectedBusinessId}</code></span>
                      &bull;
                      <span>Account: <strong className="text-foreground">{overviewData?.business?.owner_email}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin?business_id=${selectedBusinessId}`}
                    className="px-3.5 py-1.5 bg-[#18181B] text-white text-xs font-semibold rounded-xl hover:bg-[#27272A] shadow-sm transition-colors"
                  >
                    Open Scrutiny Cockpit &rarr;
                  </Link>
                  <button
                    onClick={() => setSelectedBusinessId(null)}
                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="px-5 border-b border-border flex items-center gap-4 bg-background">
                <button
                  onClick={() => setDrawerTab("compliances")}
                  className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                    drawerTab === "compliances"
                      ? "border-purple-600 text-purple-600 dark:text-purple-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Compliances ({overviewData?.compliance_cases?.length || 0})
                </button>
                <button
                  onClick={() => setDrawerTab("documents")}
                  className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                    drawerTab === "documents"
                      ? "border-purple-600 text-purple-600 dark:text-purple-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Uploaded Documents ({overviewData?.uploaded_documents?.length || 0})
                </button>
                <button
                  onClick={() => setDrawerTab("profile")}
                  className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
                    drawerTab === "profile"
                      ? "border-purple-600 text-purple-600 dark:text-purple-400"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  Profile Declarations (v{overviewData?.profile?.version_number || 1})
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {drawerLoading ? (
                  <div className="py-12 text-center space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                    <p className="text-xs text-muted-foreground">Loading business command overview...</p>
                  </div>
                ) : (
                  <>
                    {/* TAB 1: COMPLIANCES */}
                    {drawerTab === "compliances" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Statutory compliance requirements evaluated specifically for this enterprise based on their declared Profile variables.
                          </p>
                        </div>

                        {overviewData?.compliance_cases?.length === 0 ? (
                          <div className="p-8 text-center border border-dashed rounded-xl text-xs text-muted-foreground">
                            No compliance cases generated for this business yet.
                          </div>
                        ) : (
                          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                            {overviewData?.compliance_cases?.map((c: any) => (
                              <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs hover:bg-muted/20">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-foreground">{c.case_number}</span>
                                    <span className="text-[10px] font-bold uppercase text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-1.5 py-0.2 rounded">
                                      {c.authority}
                                    </span>
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded">
                                      MANDATED
                                    </span>
                                  </div>
                                  <h4 className="font-bold text-sm text-foreground">{c.requirement_name}</h4>
                                  <p className="text-[11px] text-muted-foreground leading-relaxed max-w-xl">
                                    <strong className="text-foreground">Why Mandated:</strong> {c.mandate_basis}
                                  </p>
                                </div>

                                <div className="flex sm:flex-col items-end gap-2 shrink-0">
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-foreground">
                                    {c.status_code.replace(/_/g, " ")}
                                  </span>
                                  <Link
                                    href={`/admin/cases/${c.id}`}
                                    className="px-3 py-1 bg-foreground text-background text-xs font-semibold rounded-lg hover:bg-foreground/90 transition-colors"
                                  >
                                    Scrutiny Desk &rarr;
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 2: UPLOADED DOCUMENTS */}
                    {drawerTab === "documents" && (
                      <div className="space-y-4">
                        <p className="text-xs text-muted-foreground">
                          All evidence certificates, blueprints, and forms uploaded by this user account across their compliance cases.
                        </p>

                        {overviewData?.uploaded_documents?.length === 0 ? (
                          <div className="p-8 text-center border border-dashed rounded-xl text-xs text-muted-foreground">
                            No documents uploaded by this business yet.
                          </div>
                        ) : (
                          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                            {overviewData?.uploaded_documents?.map((d: any) => (
                              <div key={d.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs hover:bg-muted/20">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-muted rounded">
                                      v{d.version_number}
                                    </span>
                                    <span className="font-bold text-foreground">{d.file_name}</span>
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                      ({(d.file_size_bytes / 1024).toFixed(1)} KB)
                                    </span>
                                  </div>
                                  <p className="text-muted-foreground text-[11px]">
                                    Requirement: <strong className="text-foreground">{d.requirement_name}</strong> &bull; Case: <code className="font-mono">{d.case_number}</code>
                                  </p>
                                  <p className="text-[10px] text-muted-foreground font-mono">
                                    SHA-256: {d.checksum ? d.checksum.slice(0, 16) + "..." : "None"} &bull; Uploaded {new Date(d.uploaded_at).toLocaleString()}
                                  </p>
                                </div>

                                <div className="flex sm:flex-col items-end gap-2 shrink-0">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    d.status_code === "INTERNAL_HUMAN_APPROVED"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : d.status_code === "INTERNAL_HUMAN_QUERY"
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-blue-100 text-blue-800"
                                  }`}>
                                    {d.status_code.replace(/_/g, " ")}
                                  </span>
                                  <Link
                                    href={`/admin/cases/${d.case_id}`}
                                    className="px-3 py-1 border border-border text-xs font-semibold rounded-lg hover:bg-muted"
                                  >
                                    Scrutinize &rarr;
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 3: PROFILE DECLARATIONS */}
                    {drawerTab === "profile" && (
                      <div className="space-y-4">
                        <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-900/60 text-xs">
                          <span className="font-bold text-purple-900 dark:text-purple-300">
                            Active Profile Version: v{overviewData?.profile?.version_number || 1}
                          </span>
                          <p className="text-muted-foreground mt-0.5">
                            {overviewData?.profile?.change_note || "System onboarding profile initialization."}
                          </p>
                        </div>

                        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden max-h-96 overflow-y-auto">
                          {overviewData?.profile?.answered_variables?.map((v: any) => (
                            <div key={v.key} className="p-3 flex items-center justify-between gap-4 text-xs hover:bg-muted/20">
                              <div>
                                <span className="font-semibold text-foreground block">{v.label}</span>
                                <span className="text-[10px] text-muted-foreground font-mono">key: {v.key}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-foreground font-mono">
                                  {typeof v.value === "boolean" ? (v.value ? "Yes" : "No") : String(v.value)}
                                  {v.unit ? ` ${v.unit}` : ""}
                                </span>
                                <span className="block text-[10px] text-muted-foreground">
                                  {v.origin}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

export default function AdminBusinessesDirectoryPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center text-sm font-mono">
          Loading Directory...
        </div>
      }
    >
      <AdminBusinessesDirectoryContent />
    </React.Suspense>
  );
}
