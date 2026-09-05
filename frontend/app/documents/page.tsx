"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import { DocumentItem, DocumentStatus } from "@/types";

function DocumentsContent() {
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [businessId, setBusinessId] = useState<string>("");

  // Upload modal / inline form state
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
      setDocuments(resp.documents);
      setBusinessId(bizId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load documents.");
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
            setLoading(false);
          }
        } catch {
          setLoading(false);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-indigo-600 tracking-wide uppercase">
              Screen 10 · Statutory Repository
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 mt-1">
              Document Vault & AI Pre-Validation
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Evidentiary proofs for industrial approvals, consent applications, and statutory returns.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard?business_id=${businessId}`}
              className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ← Dashboard
            </Link>
            <button
              type="button"
              onClick={() => setShowUpload(!showUpload)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
            >
              + Upload Document
            </button>
          </div>
        </div>

        {/* Mandatory Statutory AI Pre-Validation Disclaimer */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-start gap-3">
          <span className="text-base font-bold text-amber-600">ℹ️</span>
          <div>
            <span className="font-bold">Statutory Verification Notice:</span> AI pre-validation assists document preparation and completeness review. Final legal admissibility and statutory acceptance are determined solely by the competent regulatory authority.
          </div>
        </div>

        {/* Upload Form Modal / Accordion */}
        {showUpload && (
          <form
            onSubmit={handleUpload}
            className="bg-white rounded-2xl border border-indigo-200 p-6 shadow-xs space-y-4"
          >
            <h2 className="text-sm font-bold text-slate-900">
              Upload New Statutory Document
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Factory Layout Plan"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Category *
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="IDENTITY">Identity Proof</option>
                  <option value="PREMISES">Premises & Land Proof</option>
                  <option value="TECHNICAL">Technical Blueprint / Engineering</option>
                  <option value="STATUTORY">Statutory Certificate / Return</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  File Attachment
                </label>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFileName(e.target.files[0].name);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
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
            <LoadingSkeleton count={5} className="h-20 w-full" />
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
            <div className="text-2xl">📁</div>
            <h3 className="text-sm font-bold text-slate-900 mt-2">
              No Statutory Documents Uploaded Yet
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload registration proofs, lease deeds, or blueprints to initiate pre-validation.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-300 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {doc.id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 pt-1">{doc.name}</h3>
                    <span className="text-[11px] text-slate-500">
                      Category: {doc.category}
                    </span>
                  </div>

                  <StatusBadge status={doc.status} size="sm" />
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">AI Check:</span>
                    <span
                      className={`font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                        doc.prevalidation_status === "PASS"
                          ? "bg-emerald-50 text-emerald-700"
                          : doc.prevalidation_status === "NEEDS_REVIEW"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {doc.prevalidation_status}
                    </span>
                  </div>

                  {doc.notes && (
                    <span className="text-[11px] text-slate-500 truncate max-w-[140px]" title={doc.notes}>
                      {doc.notes}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
          Loading documents...
        </div>
      }
    >
      <DocumentsContent />
    </Suspense>
  );
}
