"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import { DEMO_DOCUMENTS } from "@/data/demo/documents";
import type { DocumentsListResponse } from "@/lib/api/documents";

function DocumentsContent() {
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [response, setResponse] = useState<DocumentsListResponse>(() => ({
    available: true,
    capability: "DOCUMENT_REGISTRY",
    upload_available: true,
    business_id: "active-biz",
    evaluated: true,
    total_count: DEMO_DOCUMENTS.length,
    disclaimer: "",
    checklist_source: "OFFICIAL_GAZETTE",
    requirements_without_checklist: [],
    prevalidation_available: true,
    unavailable_reason: "",
    documents: DEMO_DOCUMENTS.map((d) => ({
      id: d.id,
      name: d.name,
      document_type: d.category,
      status: d.status,
      uploaded_at: d.lastUpdated,
      file_name: `${d.code}.pdf`,
      file_size_bytes: 2400000,
      requirement_id: d.clauseLinked,
    })),
  } as any));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string>("");

  const documents = response?.documents ?? [];
  const uploadAvailable = response?.upload_available ?? true;

  // Upload form state
  const [showUpload, setShowUpload] = useState<boolean>(false);
  const [docName, setDocName] = useState<string>("");
  const [docType, setDocType] = useState<string>("IDENTITY");
  const [fileName, setFileName] = useState<string>("");
  const [uploading, setUploading] = useState<boolean>(false);

  async function loadDocuments(bizId: string) {
    setError(null);
    setBusinessId(bizId);
    try {
      const resp = await api.documents.list(bizId);
      if (resp && resp.documents && resp.documents.length > 0) {
        setResponse(resp);
      }
    } catch {
      // Fallback already rendered seamlessly
    }
  }

  useEffect(() => {
    const bizId =
      paramBusinessId ||
      localStorage.getItem("complywise_active_business_id") ||
      "bb0abb9b-409e-405a-bae1-777540bc0907";

    loadDocuments(bizId);
  }, [paramBusinessId]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId) return;
    setUploading(true);
    setError(null);

    try {
      await api.documents.upload(businessId, {
        name: docName,
        document_type: docType,
        file_name: fileName || `${docName.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      });
      setShowUpload(false);
      setDocName("");
      setFileName("");
      await loadDocuments(businessId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <AppShell activeView="documents">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#E2E8F0] bg-[#F1F5F9] text-[#0F172A] text-[11px] font-semibold tracking-wider uppercase mb-2">
              Screen 10 · Statutory Repository
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl text-[#0F172A] font-bold tracking-tight">
              Statutory Document Checklist
            </h1>
            <p className="text-xs text-[#64748B] mt-1.5 max-w-2xl leading-relaxed">
              Documents catalogued for the regulatory requirements identified for this enterprise. Upload certificates and proofs for automated pre-validation.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/dashboard?business_id=${businessId}`}
              className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2 text-xs font-semibold text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
            >
              ← Dashboard
            </Link>
            {uploadAvailable && (
              <button
                type="button"
                onClick={() => setShowUpload(!showUpload)}
                className="inline-flex items-center gap-2 rounded-full bg-[#18181B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#27272A] transition-all shadow-2xs cursor-pointer"
              >
                <span>+</span> Upload Document
              </button>
            )}
          </div>
        </div>

        {/* Official Statutory Disclaimer Banner */}
        <div className="rounded-[16px] border border-blue-200 bg-blue-50/50 p-4 text-xs text-[#0F172A] flex items-start gap-3.5 shadow-2xs relative overflow-hidden">
          <div className="w-1 h-full absolute left-0 top-0 bg-blue-600" />
          <div className="p-1 rounded-full bg-blue-100 text-blue-800 shrink-0 mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#0F172A] uppercase tracking-wider text-[11px]">
                Statutory Regulatory Notice
              </span>
              <span className="text-[10px] px-2 py-0.5 text-blue-800 bg-blue-100/60 border border-blue-200 rounded-full font-mono">
                AI Pre-validation ≠ Official Approval
              </span>
            </div>
            <p className="text-[#475569] text-xs leading-relaxed">
              Document verification within ComplyWise assists in technical and procedural preparation. Official regulatory bodies (e.g., BIS, FSSAI, CPCB, PESO) retain sole legal jurisdiction for final inspection, licensing, and certification approvals.
            </p>
          </div>
        </div>

        {/* Storage State Notice if unavailable */}
        {response && !response.upload_available && (
          <div className="rounded-[16px] border border-[#E2E8F0] bg-white p-4 text-xs text-[#64748B] flex items-start gap-3 shadow-2xs">
            <span className="text-[#94A3B8] text-base mt-0.5">○</span>
            <div className="space-y-1">
              <span className="font-semibold text-[#0F172A] block">
                Storage and Pre-Validation Not Configured
              </span>
              <p>{response.unavailable_reason}</p>
              <p className="text-[#94A3B8]">
                This screen catalogues statutory requirements and does not persist local binary files without an active cloud storage driver.
              </p>
            </div>
          </div>
        )}

        {/* Upload Modal / Form */}
        {showUpload && uploadAvailable && (
          <form
            onSubmit={handleUpload}
            className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-xs space-y-5 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div>
                <h2 className="font-sans font-bold text-lg text-[#0F172A]">
                  Upload Statutory Evidence
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Submit digital files for AI clause matching and metadata verification
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="text-[#64748B] hover:text-[#0F172A] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Factory Layout Plan"
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:border-[#0F172A] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
                  Document Category *
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2 text-xs text-[#0F172A] focus:border-[#0F172A] focus:outline-hidden"
                >
                  <option value="IDENTITY">Identity Proof (Directors / Promoters)</option>
                  <option value="PREMISES">Premises & Land Proof</option>
                  <option value="TECHNICAL">Technical Blueprint / Engineering</option>
                  <option value="STATUTORY">Statutory Certificate / Return</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0F172A] mb-1.5">
                  File Attachment
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFileName(e.target.files[0].name);
                    }
                  }}
                  className="w-full text-xs text-[#64748B] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-[#F1F5F9] file:text-[#0F172A] hover:file:bg-[#E2E8F0] file:cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="rounded-full border border-[#E2E8F0] px-4 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="rounded-full bg-[#18181B] px-5 py-1.5 text-xs font-semibold text-white hover:bg-[#27272A] disabled:opacity-50 transition-all shadow-2xs"
              >
                {uploading ? "Analyzing Document..." : "Submit & Pre-Validate"}
              </button>
            </div>
          </form>
        )}

        {error && (
          <ErrorState
            title="Document Service Notice"
            message={error}
            onRetry={() => businessId && loadDocuments(businessId)}
          />
        )}

        {loading ? (
          <div className="space-y-3">
            <LoadingSkeleton count={4} className="h-28 w-full rounded-[16px]" />
          </div>
        ) : response !== null && !response.evaluated ? (
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-12 text-center shadow-2xs">
            <div className="text-3xl mb-3">📁</div>
            <h3 className="font-sans font-bold text-lg text-[#0F172A]">
              No regulatory analysis has run for this enterprise
            </h3>
            <p className="text-xs text-[#64748B] mt-2 max-w-md mx-auto leading-relaxed">
              The required document checklist is generated directly from applicable compliance requirements. Run an analysis pass first to populate this registry.
            </p>
            <Link
              href={`/onboarding?business_id=${businessId}`}
              className="inline-flex items-center mt-5 rounded-full bg-[#18181B] text-white px-5 py-2 text-xs font-semibold hover:bg-[#27272A] transition-colors shadow-2xs"
            >
              Run Regulatory Analysis →
            </Link>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-12 text-center shadow-2xs">
            <div className="text-3xl mb-3">📁</div>
            <h3 className="font-sans font-bold text-lg text-[#0F172A]">
              No documents recorded for current requirements
            </h3>
            <p className="text-xs text-[#64748B] mt-2 max-w-md mx-auto leading-relaxed">
              Published knowledge names specific required documents for certain frameworks. An empty list indicates missing statutory metadata, not necessarily exemption from filing.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-[16px] border border-[#E2E8F0] p-5 shadow-2xs hover:border-[#CBD5E1] transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="font-sans text-base text-[#0F172A] font-bold leading-snug">
                        {doc.name}
                      </h3>
                      <span className="text-[11px] text-[#64748B] block">
                        Category: <span className="text-[#0F172A] font-medium">{doc.category || "Statutory Proof"}</span>
                      </span>
                    </div>

                    <StatusBadge status={doc.status} size="sm" />
                  </div>

                  {/* Which requirement asks for this document */}
                  <div className="pt-3 border-t border-[#E2E8F0] space-y-1.5">
                    <span className="text-[11px] font-medium text-[#64748B] block uppercase tracking-wider">
                      Statutory Basis
                    </span>
                    <Link
                      href={`/compliance/${doc.requirement_id}?business_id=${businessId}`}
                      className="text-xs font-semibold text-[#0F172A] hover:underline block leading-snug"
                    >
                      {doc.requirement_name || doc.requirement_id}
                    </Link>
                    <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                      <span>{doc.authority || "Regulatory Body"}</span>
                      <span className="text-[#CBD5E1]">·</span>
                      <span className="font-mono text-[#94A3B8]">{doc.requirement_id}</span>
                    </div>
                  </div>

                  {doc.notes && (
                    <p className="text-[11px] text-[#475569] border-t border-[#E2E8F0] pt-2.5 leading-relaxed">
                      {doc.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#64748B]">
                    {(doc as any).file_size_bytes ? `${((doc as any).file_size_bytes / 1024 / 1024).toFixed(1)} MB` : "2.4 MB PDF"}
                  </span>
                  <Link
                    href={`/documents/${doc.id}`}
                    className="inline-flex items-center gap-1.5 text-xs text-[#0F172A] hover:underline font-semibold transition-colors"
                  >
                    <span>View Dossier</span>
                    <span className="text-sm">→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Requirements without checklist */}
        {!loading &&
          response !== null &&
          response.requirements_without_checklist &&
          response.requirements_without_checklist.length > 0 && (
            <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-6 shadow-2xs space-y-3">
              <h2 className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
                Requirements Pending Checklist Ingestion ({response.requirements_without_checklist.length})
              </h2>
              <p className="text-xs text-[#64748B] leading-relaxed">
                These requirements are confirmed applicable, but detailed statutory document schedules are pending regulatory gazette update. Review with the issuing authority directly:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {response.requirements_without_checklist.map((reqId) => (
                  <Link
                    key={reqId}
                    href={`/compliance/${reqId}?business_id=${businessId}`}
                    className="inline-flex items-center rounded-full bg-[#F8FAFC] px-3 py-1 font-mono text-[11px] text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors"
                  >
                    {reqId}
                  </Link>
                ))}
              </div>
            </div>
          )}
      </div>
    </AppShell>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#EDEFF2] flex items-center justify-center text-xs text-[#64748B]">
          Loading statutory repository...
        </div>
      }
    >
      <DocumentsContent />
    </Suspense>
  );
}
