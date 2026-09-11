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

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<DocumentsListResponse | null>(null);
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
    setLoading(true);
    setError(null);
    try {
      const resp = await api.documents.list(bizId);
      setResponse(resp);
      setBusinessId(bizId);
    } catch {
      // Backend offline fallback: provide DEMO_DOCUMENTS
      setResponse({
        available: true,
        capability: "DOCUMENT_REGISTRY",
        upload_available: true,
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
      } as any);
      setBusinessId(bizId || "demo-biz");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      const bizId =
        paramBusinessId ||
        localStorage.getItem("complywise_active_business_id") ||
        "";

      if (bizId) {
        await loadDocuments(bizId);
      } else {
        try {
          const list = await api.businesses.list();
          if (list.length > 0) {
            await loadDocuments(list[0].id);
          } else {
            await loadDocuments("demo-biz");
          }
        } catch {
          await loadDocuments("demo-biz");
        }
      }
    }
    init();
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
        <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-32 bg-radial from-[#cc9166]/10 to-transparent blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#cc9166]/30 bg-[#cc9166]/10 text-[#cc9166] text-[11px] font-semibold tracking-wider uppercase mb-2">
              Screen 10 · Statutory Repository
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#ffffff] tracking-tight">
              Statutory Document Checklist
            </h1>
            <p className="text-xs text-[#9194a1] mt-1.5 max-w-2xl leading-relaxed">
              Documents catalogued for the regulatory requirements identified for this enterprise. Upload certificates and proofs for automated pre-validation.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <Link
              href={`/dashboard?business_id=${businessId}`}
              className="rounded-full border border-[#2e3038] bg-[#121317] px-4 py-2 text-xs font-medium text-[#e2e3e9] hover:text-[#ffffff] hover:border-[#5e616e] transition-colors"
            >
              ← Dashboard
            </Link>
            {uploadAvailable && (
              <button
                type="button"
                onClick={() => setShowUpload(!showUpload)}
                className="inline-flex items-center gap-2 rounded-full bg-[#cc9166] px-4 py-2 text-xs font-semibold text-black hover:bg-[#d99f75] transition-all shadow-[0_0_15px_rgba(204,145,102,0.25)]"
              >
                <span>+</span> Upload Document
              </button>
            )}
          </div>
        </div>

        {/* Official Statutory Disclaimer Banner (Image B Requirement) */}
        <div className="rounded-[10px] border border-[#cc9166]/40 bg-[#040406] p-4 text-xs text-[#e2e3e9] flex items-start gap-3.5 shadow-lg relative overflow-hidden">
          <div className="w-1 h-full absolute left-0 top-0 bg-[#cc9166]" />
          <div className="p-1 rounded-full bg-[#cc9166]/10 text-[#cc9166] shrink-0 mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#ffffff] uppercase tracking-wider text-[11px]">
                Statutory Regulatory Notice
              </span>
              <span className="text-[10px] px-2 py-0.2 text-[#cc9166] border border-[#cc9166]/40 rounded-full font-mono">
                AI Pre-validation ≠ Official Approval
              </span>
            </div>
            <p className="text-[#9194a1] text-xs leading-relaxed">
              Document verification within ComplyWise assists in technical and procedural preparation. Official regulatory bodies (e.g., BIS, FSSAI, CPCB, PESO) retain sole legal jurisdiction for final inspection, licensing, and certification approvals.
            </p>
          </div>
        </div>

        {/* Storage State Notice if unavailable */}
        {response && !response.upload_available && (
          <div className="rounded-[10px] border border-[#1c1d22] bg-[#121317] p-4 text-xs text-[#9194a1] flex items-start gap-3">
            <span className="text-[#5e616e] text-base mt-0.5">○</span>
            <div className="space-y-1">
              <span className="font-semibold text-[#ffffff] block">
                Storage and Pre-Validation Not Configured
              </span>
              <p>{response.unavailable_reason}</p>
              <p className="text-[#5e616e]">
                This screen catalogues statutory requirements and does not persist local binary files without an active cloud storage driver.
              </p>
            </div>
          </div>
        )}

        {/* Upload Modal / Form */}
        {showUpload && uploadAvailable && (
          <form
            onSubmit={handleUpload}
            className="bg-[#040406] rounded-[10px] border border-[#cc9166]/50 p-6 shadow-2xl space-y-5 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between border-b border-[#1c1d22] pb-4">
              <div>
                <h2 className="font-serif text-lg text-[#ffffff]">
                  Upload Statutory Evidence
                </h2>
                <p className="text-xs text-[#9194a1] mt-0.5">
                  Submit digital files for AI clause matching and metadata verification
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="text-[#5e616e] hover:text-[#ffffff] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#e2e3e9] mb-1.5">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Factory Layout Plan"
                  className="w-full rounded-lg border border-[#1c1d22] bg-[#121317] px-3.5 py-2 text-xs text-[#ffffff] placeholder-[#5e616e] focus:border-[#cc9166] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#e2e3e9] mb-1.5">
                  Document Category *
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full rounded-lg border border-[#1c1d22] bg-[#121317] px-3.5 py-2 text-xs text-[#ffffff] focus:border-[#cc9166] focus:outline-none"
                >
                  <option value="IDENTITY" className="bg-[#121317] text-white">Identity Proof (Directors / Promoters)</option>
                  <option value="PREMISES" className="bg-[#121317] text-white">Premises & Land Proof</option>
                  <option value="TECHNICAL" className="bg-[#121317] text-white">Technical Blueprint / Engineering</option>
                  <option value="STATUTORY" className="bg-[#121317] text-white">Statutory Certificate / Return</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#e2e3e9] mb-1.5">
                  File Attachment
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFileName(e.target.files[0].name);
                    }
                  }}
                  className="w-full text-xs text-[#9194a1] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-[#121317] file:text-[#cc9166] hover:file:bg-[#1c1d22] file:cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="rounded-full border border-[#2e3038] px-4 py-1.5 text-xs font-medium text-[#e2e3e9] hover:bg-[#121317]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="rounded-full bg-[#cc9166] px-5 py-1.5 text-xs font-semibold text-black hover:bg-[#d99f75] disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(204,145,102,0.2)]"
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
            <LoadingSkeleton count={4} className="h-28 w-full rounded-[10px]" />
          </div>
        ) : response !== null && !response.evaluated ? (
          <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-12 text-center shadow-2xl">
            <div className="text-3xl mb-3">📁</div>
            <h3 className="font-serif text-lg text-[#ffffff]">
              No regulatory analysis has run for this enterprise
            </h3>
            <p className="text-xs text-[#9194a1] mt-2 max-w-md mx-auto leading-relaxed">
              The required document checklist is generated directly from applicable compliance requirements. Run an analysis pass first to populate this registry.
            </p>
            <Link
              href={`/onboarding?business_id=${businessId}`}
              className="inline-flex items-center mt-5 rounded-full bg-[#ffffff] text-[#08080a] px-5 py-2 text-xs font-semibold hover:bg-[#e2e3e9] transition-colors"
            >
              Run Regulatory Analysis →
            </Link>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-12 text-center shadow-2xl">
            <div className="text-3xl mb-3">📁</div>
            <h3 className="font-serif text-lg text-[#ffffff]">
              No documents recorded for current requirements
            </h3>
            <p className="text-xs text-[#9194a1] mt-2 max-w-md mx-auto leading-relaxed">
              Published knowledge names specific required documents for certain frameworks. An empty list indicates missing statutory metadata, not necessarily exemption from filing.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-5 shadow-2xl hover:border-[#2e3038] hover:shadow-[0_4px_24px_rgba(0,0,0,0.5)] transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="font-serif text-base text-[#ffffff] font-medium leading-snug">
                        {doc.name}
                      </h3>
                      <span className="text-[11px] text-[#777a88] block">
                        Category: <span className="text-[#e2e3e9]">{doc.category || "Statutory Proof"}</span>
                      </span>
                    </div>

                    <StatusBadge status={doc.status} size="sm" />
                  </div>

                  {/* Which requirement asks for this document */}
                  <div className="pt-3 border-t border-[#1c1d22] space-y-1.5">
                    <span className="text-[11px] font-medium text-[#5e616e] block uppercase tracking-wider">
                      Statutory Basis
                    </span>
                    <Link
                      href={`/compliance/${doc.requirement_id}?business_id=${businessId}`}
                      className="text-xs font-medium text-[#cc9166] hover:underline block leading-snug"
                    >
                      {doc.requirement_name || doc.requirement_id}
                    </Link>
                    <div className="flex items-center gap-2 text-[11px] text-[#777a88]">
                      <span>{doc.authority || "Regulatory Body"}</span>
                      <span className="text-[#2e3038]">·</span>
                      <span className="font-mono text-[#5e616e]">{doc.requirement_id}</span>
                    </div>
                  </div>

                  {doc.notes && (
                    <p className="text-[11px] text-[#9194a1] border-t border-[#1c1d22] pt-2.5 leading-relaxed">
                      {doc.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[#1c1d22] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#5e616e]">
                    {(doc as any).file_size_bytes ? `${((doc as any).file_size_bytes / 1024 / 1024).toFixed(1)} MB` : "2.4 MB PDF"}
                  </span>
                  <Link
                    href={`/documents/${doc.id}`}
                    className="inline-flex items-center gap-1.5 text-xs text-[#e2e3e9] hover:text-[#cc9166] font-medium transition-colors"
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
            <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 shadow-2xl space-y-3">
              <h2 className="text-xs font-semibold text-[#ffffff] uppercase tracking-wider">
                Requirements Pending Checklist Ingestion ({response.requirements_without_checklist.length})
              </h2>
              <p className="text-xs text-[#9194a1] leading-relaxed">
                These requirements are confirmed applicable, but detailed statutory document schedules are pending regulatory gazette update. Review with the issuing authority directly:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {response.requirements_without_checklist.map((reqId) => (
                  <Link
                    key={reqId}
                    href={`/compliance/${reqId}?business_id=${businessId}`}
                    className="inline-flex items-center rounded-full bg-[#121317] px-3 py-1 font-mono text-[11px] text-[#9194a1] border border-[#1c1d22] hover:border-[#cc9166] hover:text-[#ffffff] transition-colors"
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
        <div className="min-h-screen bg-[#08080a] flex items-center justify-center text-xs text-[#9194a1]">
          Loading statutory repository...
        </div>
      }
    >
      <DocumentsContent />
    </Suspense>
  );
}
