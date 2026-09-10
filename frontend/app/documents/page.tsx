"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import type { DocumentsListResponse } from "@/lib/api/documents";

function DocumentsContent() {
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // The whole response is held: the checklist is only part of it. `evaluated`,
  // `upload_available` and `requirements_without_checklist` each change what this
  // screen is allowed to claim, and none of them can be inferred from the list.
  const [response, setResponse] = useState<DocumentsListResponse | null>(null);
  const [businessId, setBusinessId] = useState<string>("");

  const documents = response?.documents ?? [];
  const uploadAvailable = response?.upload_available ?? false;

  // Upload form state. Retained rather than deleted: the form is gated on
  // `upload_available`, so it becomes reachable the moment storage is wired.
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
    <AppShell activeView="documents">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-indigo-600 tracking-wide uppercase">
              Screen 10 · Statutory Repository
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 mt-1">
              Statutory Document Checklist
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Documents named by published knowledge for the requirements the engine
              found applicable to this business.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard?business_id=${businessId}`}
              className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ← Dashboard
            </Link>
            {/* Gated on the backend flag. Offering an upload control that silently
                discards a statutory document is worse than not offering one. */}
            {uploadAvailable && (
              <button
                type="button"
                onClick={() => setShowUpload(!showUpload)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
              >
                + Upload Document
              </button>
            )}
          </div>
        </div>

        {/* Storage state. Stated up front so the checklist is not read as a vault. */}
        {response && !response.upload_available && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600 flex items-start gap-3">
            <span className="text-base text-slate-400">○</span>
            <div className="space-y-1">
              <span className="font-bold text-slate-900 block">
                Storage and pre-validation are not configured
              </span>
              <p>{response.unavailable_reason}</p>
              <p className="text-slate-500">
                This screen lists what each applicable requirement asks for. It does not
                hold files.
              </p>
            </div>
          </div>
        )}

        {/* Disclaimer as served by the backend, not as written in the UI. */}
        {response?.disclaimer && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-start gap-3">
            <span className="text-base font-bold text-amber-600">ℹ️</span>
            <div>
              <span className="font-bold">Statutory Verification Notice:</span>{" "}
              {response.disclaimer}
            </div>
          </div>
        )}

        {/* Upload Form Modal / Accordion */}
        {showUpload && uploadAvailable && (
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
        ) : response !== null && !response.evaluated ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
            <div className="text-2xl">📁</div>
            <h3 className="text-sm font-bold text-slate-900 mt-2">
              No analysis has run for this business yet
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
              The checklist is derived from the requirements found applicable. Run a
              regulatory analysis first and the documents each one names will appear here.
            </p>
            <Link
              href={`/onboarding?business_id=${businessId}`}
              className="inline-flex items-center mt-4 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Run regulatory analysis
            </Link>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
            <div className="text-2xl">📁</div>
            <h3 className="text-sm font-bold text-slate-900 mt-2">
              No document list is recorded for your applicable requirements
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
              Published knowledge names the required documents for some requirements and
              not others. An empty checklist means that metadata has not been ingested,
              not that no documents are needed.
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
                    <h3 className="text-sm font-bold text-slate-900">{doc.name}</h3>
                    <span className="text-[11px] text-slate-500 block">
                      Category: {doc.category}
                    </span>
                  </div>

                  <StatusBadge status={doc.status} size="sm" />
                </div>

                {/* Which requirement asks for this document. Without it the checklist
                    is a list of paperwork with no statutory basis. */}
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Required for:
                  </span>
                  <Link
                    href={`/compliance/${doc.requirement_id}?business_id=${businessId}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline block leading-snug"
                  >
                    {doc.requirement_name}
                  </Link>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span>{doc.authority}</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-mono">{doc.requirement_id}</span>
                  </div>
                </div>

                {doc.notes && (
                  <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                    {doc.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Applicable requirements whose document list is not held. A gap in
            knowledge, and one the user should be able to see rather than infer. */}
        {!loading &&
          response !== null &&
          response.requirements_without_checklist.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                No document list recorded ({response.requirements_without_checklist.length})
              </h2>
              <p className="text-xs text-slate-500">
                These requirements apply to your business, but published knowledge does not
                name the documents they need. Check the issuing authority directly.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {response.requirements_without_checklist.map((reqId) => (
                  <Link
                    key={reqId}
                    href={`/compliance/${reqId}?business_id=${businessId}`}
                    className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-700"
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
          Loading documents...
        </div>
      }
    >
      <DocumentsContent />
    </Suspense>
  );
}
