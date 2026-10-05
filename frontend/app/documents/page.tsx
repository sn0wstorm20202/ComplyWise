"use client";
import UploadProgress from "@/components/product/UploadProgress";
import Overlay from "@/components/product/Overlay";
import Disclosure from "@/components/product/Disclosure";

import React, { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Upload,
  FileText,
  Check,
  X,
  ExternalLink,
  Filter,
  Sparkles,
  ScanText,
  Key,
  Zap,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import { DEMO_DOCUMENTS } from "@/data/demo/documents";
import type { DocumentsListResponse } from "@/lib/api/documents";
import {
  type DocumentVerificationResult,
  type DocumentVerificationInput,
} from "@/lib/verification/documentVerifier";
import { useLanguage } from "@/context/LanguageContext";
import { useBusinessContext } from "@/context/BusinessContext";

function DocumentsContent() {
  const { t } = useLanguage();
  const { activeBusinessId, activeAssessmentId, isDemoMode } = useBusinessContext();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");

  const [response, setResponse] = useState<DocumentsListResponse>(() => ({
    available: true,
    capability: "DOCUMENT_REGISTRY",
    upload_available: true,
    business_id: "active-biz",
    evaluated: true,
    total_count: 0,
    disclaimer: "",
    checklist_source: "OFFICIAL_GAZETTE",
    requirements_without_checklist: [],
    prevalidation_available: true,
    unavailable_reason: "",
    documents: [],
  } as any));

  const requestVersion = useRef(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string>("");

  // Tracking manual portal uploads: { [docId: string]: boolean }
  const [portalUploadedMap, setPortalUploadedMap] = useState<Record<string, boolean>>({});
  const [portalSaving, setPortalSaving] = useState<Record<string, boolean>>({});

  // Filter: ALL | UPLOADED | NOT_UPLOADED
  const [portalFilter, setPortalFilter] = useState<"ALL" | "UPLOADED" | "NOT_UPLOADED">("ALL");

  // Software Verification state
  const [showUpload, setShowUpload] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [selectedDocForUpload, setSelectedDocForUpload] = useState<any | null>(null);

  // Upload & Verification form fields
  const [docName, setDocName] = useState<string>("");
  const [docCategory, setDocCategory] = useState<string>("Statutory Proof");
  const [docAuthority, setDocAuthority] = useState<string>("");
  const [docRequirementId, setDocRequirementId] = useState<string>("");
  const [docReferenceNumber, setDocReferenceNumber] = useState<string>("");
  const [docValidUntil, setDocValidUntil] = useState<string>("");
  const [fileObject, setFileObject] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");

  // Verification result modal state
  const [activeVerificationResult, setActiveVerificationResult] = useState<{
    result: DocumentVerificationResult;
    docData: any;
    isNewUpload: boolean;
  } | null>(null);
  const [verificationProgressStep, setVerificationProgressStep] = useState<number>(0);

  // Load persisted document and filing states for the selected assessment.
  useEffect(() => {
    const bizId =
      paramBusinessId ||
      activeBusinessId ||
      (typeof window !== "undefined" ? localStorage.getItem("complywise_active_business_id") : null);

    ++requestVersion.current;
    setShowUpload(false); setSelectedDocForUpload(null); setActiveVerificationResult(null);
    setPortalSaving({}); setUploading(false); setVerificationProgressStep(0);
    if (!bizId) { setBusinessId(""); setResponse(previous => ({...previous, documents: [], total_count: 0})); setLoading(false); return; }
    setBusinessId(bizId);

    // Reset previous company's documents immediately
    if (!isDemoMode) {
      setResponse({
        available: true,
        capability: "DOCUMENT_REGISTRY",
        upload_available: true,
        business_id: bizId,
        evaluated: true,
        total_count: 0,
        disclaimer: "",
        checklist_source: "OFFICIAL_GAZETTE",
        requirements_without_checklist: [],
        prevalidation_available: true,
        unavailable_reason: "",
        documents: [],
      } as any);
    }

    setPortalUploadedMap({});

    loadDocuments(bizId);
    return () => { ++requestVersion.current; };

  }, [paramBusinessId, activeBusinessId, activeAssessmentId, searchParams]);

  async function loadDocuments(bizId: string) {
    const version = ++requestVersion.current;
    const current = () => requestVersion.current === version;
    setLoading(true);
    setError(null);
    try {
      const resp = await api.documents.list(bizId, searchParams.get("assessment_id") || (bizId === activeBusinessId ? activeAssessmentId : undefined) || undefined);
      if (!current()) return;
      if (resp && resp.documents) {
        setResponse(resp);
      }
    } catch {
      if (!current()) return;
      setError("We couldn't load your documents. Please try again.");
      if (!isDemoMode) {
        setResponse({
          available: true,
          capability: "DOCUMENT_REGISTRY",
          upload_available: true,
          business_id: bizId,
          evaluated: true,
          total_count: 0,
          disclaimer: "",
          checklist_source: "OFFICIAL_GAZETTE",
          requirements_without_checklist: [],
          prevalidation_available: true,
          unavailable_reason: "",
          documents: [],
        } as any);
      }
    } finally { if (current()) setLoading(false); }
  }

  // Toggle manual official portal upload checkbox
  async function handleTogglePortalUploaded(docId: string) {
    if (!businessId || portalSaving[docId]) return;
    const version = requestVersion.current;
    const previous = portalUploadedMap[docId] ?? Boolean(response.documents.find(doc => doc.id === docId)?.portal_uploaded);
    const nextState = !previous;
    const updated = {
      ...portalUploadedMap,
      [docId]: nextState,
    };
    setPortalUploadedMap(updated);
    setPortalSaving(values => ({...values, [docId]: true}));

    try {
      await api.documents.updatePortalStatus(businessId, docId, nextState, searchParams.get("assessment_id") || (businessId === activeBusinessId ? activeAssessmentId : undefined) || undefined);
    } catch {
      if (version !== requestVersion.current) return;
      setPortalUploadedMap(values => ({...values, [docId]: previous}));
      setError("Your filing status wasn't saved. Please try again.");
    } finally {
      if (version === requestVersion.current) setPortalSaving(values => ({...values, [docId]: false}));
    }
  }

  // Pre-fill upload modal for a specific statutory document requirement
  function openUploadForDocument(doc: any) {
    setSelectedDocForUpload(doc);
    setDocName(doc.name || "");
    setDocCategory(doc.category || doc.document_type || "Statutory Proof");
    setDocAuthority(doc.authority || "Regulatory Authority");
    setDocRequirementId(doc.requirement_id || doc.clause_linked || doc.clauseLinked || "Statutory Clause");
    setDocReferenceNumber((doc as any).code || "");
    setDocValidUntil((doc as any).valid_until || (doc as any).validUntil || "");
    setFileName(doc.file_name || "");
    setFileObject(null);
    setShowUpload(true);
  }

  // Execute Systematic Software Verification Layer
  async function handleRunVerificationAndUpload(e: React.FormEvent) {
    e.preventDefault();
    const version = requestVersion.current;
    setError(null);

    const actualFileName = fileObject ? fileObject.name : (fileName || "");
    if (!fileObject && !actualFileName) {
      setError("Please attach a document file for verification (PDF, HTML, DOCX, or Image).");
      return;
    }

    setUploading(true);

    let clientExtractedText = "";
    if (fileObject && (fileObject.type.includes("text") || fileObject.name.endsWith(".txt") || fileObject.name.endsWith(".html") || fileObject.name.endsWith(".htm"))) {
      try {
        clientExtractedText = await fileObject.text();
      } catch {
        // Non-blocking file reading
      }
    }
    if (version !== requestVersion.current) return;

    const verificationInput: DocumentVerificationInput = {
      name: docName,
      category: docCategory,
      authority: docAuthority,
      requirement_id: docRequirementId,
      requirement_name: docRequirementId,
      requirement_authority: docAuthority,
      reference_number: docReferenceNumber,
      valid_until: docValidUntil,
      file_name: actualFileName,
      file_size_bytes: fileObject ? fileObject.size : selectedDocForUpload?.file_size_bytes,
      extracted_text: clientExtractedText,
    };

    setVerificationProgressStep(1);

    // A successful result must include the persisted document and server checks.
    let verification: DocumentVerificationResult;
    setVerificationProgressStep(2);

    let backendResp: any = null;
    const targetBizId = businessId;
    if (!targetBizId) { setError("Select a business before uploading a document."); setUploading(false); setVerificationProgressStep(0); return; }

    // Attempt backend verification API with real file attachment
    try {
      backendResp = await api.documents.upload(
        targetBizId,
        {
          document_id: selectedDocForUpload?.id,
          assessment_id: searchParams.get("assessment_id") || (businessId === activeBusinessId ? activeAssessmentId : undefined) || undefined,
          name: docName,
          category: docCategory,
          document_type: docCategory,
          authority: docAuthority,
          requirement_id: docRequirementId,
          reference_number: docReferenceNumber,
          valid_until: docValidUntil,
          file_name: verificationInput.file_name || "document.pdf",
          file_size_bytes: verificationInput.file_size_bytes,
        },
        fileObject
      );
      if (version !== requestVersion.current) return;
      if (!backendResp?.document?.id || !backendResp?.verification?.checks) {
        setError("We didn't receive a complete upload confirmation. Check your document vault before retrying.");
        setUploading(false);
        setVerificationProgressStep(0);
        return;
      }
      verification = backendResp.verification;
    } catch {
      if (version !== requestVersion.current) return;
      setError("Your document wasn't uploaded. Please try again; your selected file is still available.");
      setUploading(false);
      setVerificationProgressStep(0);
      return;
    }

    setUploading(false);
    setVerificationProgressStep(0);

    const docPayload = {
      id: backendResp.document.id,
      name: backendResp?.document?.name || docName,
      category: backendResp?.document?.category || docCategory,
      authority: backendResp?.document?.authority || docAuthority,
      requirement_id: docRequirementId,
      requirement_name: docRequirementId,
      file_name: verificationInput.file_name,
      file_size_bytes: verificationInput.file_size_bytes,
      valid_until: backendResp?.document?.valid_until || docValidUntil,
      code: backendResp?.document?.code || docReferenceNumber,
      status: verification.status,
      verification,
    };

    setActiveVerificationResult({
      result: verification,
      docData: docPayload,
      isNewUpload: !selectedDocForUpload,
    });
  }

  function closeVerificationResult() {
    setActiveVerificationResult(null);
    if (businessId) void loadDocuments(businessId);
  }

  // Show the server-persisted document in the local vault.
  function handleAcceptVerification() {
    if (!activeVerificationResult) return;
    const { docData, isNewUpload } = activeVerificationResult;

    setResponse((prev: any) => {
      if (!prev) return prev;
      let updatedDocs = [...(prev.documents || [])];
      const existingIdx = updatedDocs.findIndex((d) => d.id === docData.id);
      if (existingIdx !== -1) {
        updatedDocs[existingIdx] = {
          ...updatedDocs[existingIdx],
          ...docData,
        };
      } else if (isNewUpload) {
        updatedDocs = [docData, ...updatedDocs];
      }
      return {
        ...prev,
        documents: updatedDocs,
        total_count: updatedDocs.length,
      };
    });

    setActiveVerificationResult(null);
    setShowUpload(false);
    setSelectedDocForUpload(null);
    setDocName("");
    setFileName("");
    setFileObject(null);
  }

  const rawDocuments = response?.documents ?? [];
  const uploadAvailable = Boolean(businessId) && (response?.upload_available ?? true);

  // Compute computed documents with manual portal upload state
  const documentsWithPortalState = rawDocuments.map((doc) => {
    const isPortalUploaded = portalUploadedMap[doc.id] ?? Boolean(doc.portal_uploaded);
    return {
      ...doc,
      isPortalUploaded,
      displayStatus: isPortalUploaded ? "UPLOADED" : doc.status === "UPLOADED" ? "NOT_UPLOADED" : doc.status,
    };
  });

  const totalDocuments = documentsWithPortalState.length;
  const uploadedCount = documentsWithPortalState.filter((d) => d.isPortalUploaded).length;
  const pendingCount = totalDocuments - uploadedCount;
  const portalCompletionPercent = totalDocuments > 0 ? Math.round((uploadedCount / totalDocuments) * 100) : 0;

  // Filtered documents
  const filteredDocuments = documentsWithPortalState.filter((d) => {
    if (portalFilter === "UPLOADED") return d.isPortalUploaded;
    if (portalFilter === "NOT_UPLOADED") return !d.isPortalUploaded;
    return true;
  });

  return (
    <AppShell activeView="documents">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[var(--ui-border)] bg-[var(--ui-inset)] text-[var(--ui-text)] text-[11px] font-semibold tracking-wider uppercase mb-2">
              {t("common.appName")} · {t("documents.title")}
            </div>
            <h1 className="font-sans text-2xl sm:text-3xl text-[var(--ui-text)] font-bold tracking-tight">
              {t("documents.title")}
            </h1>
            <p className="text-xs text-[var(--ui-secondary)] mt-1.5 max-w-2xl leading-relaxed">
              Documents and preparation checklists for your saved business assessment.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/dashboard?business_id=${businessId}`}
              className="rounded-full border border-[var(--ui-border)] bg-[var(--ui-bg)] px-4 py-2 text-xs font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-inset)] transition-colors"
            >
              ← {t("navigation.dashboard")}
            </Link>

            {uploadAvailable && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDocForUpload(null);
                  setDocName("");
                  setDocCategory("Statutory Proof");
                  setDocAuthority("");
                  setDocRequirementId("");
                  setDocReferenceNumber("");
                  setDocValidUntil("");
                  setFileName("");
                  setFileObject(null);
                  setShowUpload(!showUpload);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--ui-text)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--ui-text)] transition-all shadow-2xs cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>{t("documents.uploadDocument")}</span>
              </button>
            )}
          </div>
        </div>

        {/* Official Statutory Disclaimer Banner with Verification Layer Notice */}
        <div className="rounded-[16px] border border-[var(--ui-sage-soft)] bg-[var(--ui-info-soft)]/50 p-4 text-xs text-[var(--ui-text)] flex items-start gap-3.5 shadow-2xs relative overflow-hidden">
          <div className="w-1 h-full absolute left-0 top-0 bg-[var(--ui-text)]" />
          <div className="p-1 rounded-full bg-[var(--ui-info-soft)] text-[var(--ui-info)] shrink-0 mt-0.5">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[var(--ui-text)] uppercase tracking-wider text-[11px]">
                Upload · Check · Review
              </span>
              <span className="text-[10px] px-2 py-0.5 text-[var(--ui-info)] bg-[var(--ui-info-soft)]/60 border border-[var(--ui-sage-soft)] rounded-full font-mono font-medium">
                Document checks
              </span>
            </div>
            <p className="text-[var(--ui-secondary)] text-xs leading-relaxed">
              Upload your evidence, review the checks, then address anything that needs attention. A document check supports your preparation; the authority makes the final licensing decision.
            </p>
          </div>
        </div>

        {/* Official Portal Filing Progress & Filter Tracker */}
        <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text)]">
                  Official Portal Filing Status
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--ui-inset)] border border-[var(--ui-border)] text-[var(--ui-secondary)] font-mono">
                  {uploadedCount} of {totalDocuments} Uploaded ({portalCompletionPercent}%)
                </span>
              </div>
              <p className="text-xs text-[var(--ui-secondary)]">
                Check the box on any document to mark it as already filed on official government portals (FoSCoS, Parivesh, DISH, Manakonline) to keep track of your statutory submissions.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[var(--ui-bg)] border border-[var(--ui-border)] rounded-xl self-start sm:self-auto text-xs">
              <button
                type="button"
                onClick={() => setPortalFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  portalFilter === "ALL"
                    ? "bg-[var(--ui-text)] text-white shadow-2xs font-semibold"
                    : "text-[var(--ui-secondary)] hover:text-[var(--ui-text)]"
                }`}
              >
                All ({totalDocuments})
              </button>
              <button
                type="button"
                onClick={() => setPortalFilter("UPLOADED")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${
                  portalFilter === "UPLOADED"
                    ? "bg-[var(--ui-sage)] text-white shadow-2xs font-semibold"
                    : "text-[var(--ui-secondary)] hover:text-[var(--ui-sage)]"
                }`}
              >
                <Check className="h-3 w-3" />
                <span>Uploaded on Portal ({uploadedCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setPortalFilter("NOT_UPLOADED")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  portalFilter === "NOT_UPLOADED"
                    ? "bg-[var(--ui-text)] text-white shadow-2xs font-semibold"
                    : "text-[var(--ui-secondary)] hover:text-[var(--ui-text)]"
                }`}
              >
                Not Uploaded ({pendingCount})
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[var(--ui-inset)] rounded-full h-2 overflow-hidden">
            <div
              className="bg-[var(--ui-sage)] h-2 rounded-full transition-all duration-300"
              style={{ width: `${portalCompletionPercent}%` }}
            />
          </div>
        </div>

        {/* Upload and Verification Form */}
        {showUpload && uploadAvailable && (
          <form
            onSubmit={handleRunVerificationAndUpload}
            className="bg-white rounded-[16px] border border-[var(--ui-border-strong)] p-6 shadow-xs space-y-5 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between border-b border-[var(--ui-border)] pb-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h2 className="font-sans font-bold text-lg text-[var(--ui-text)]">
                    {selectedDocForUpload ? `Upload & Verify: ${selectedDocForUpload.name}` : t("documents.uploadDocument")}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--ui-info-soft)] text-[var(--ui-info)] border border-[var(--ui-sage-soft)] flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>Document checks</span>
                  </span>
                </div>
                <p className="text-xs text-[var(--ui-secondary)]">
                  Add the document and its reference details. Review the checks before using it in a submission.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="text-[var(--ui-secondary)] hover:text-[var(--ui-text)] text-sm p-1 rounded-md"
              >
                <span aria-label="Close upload form">✕</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--ui-text)] mb-1.5">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={docName}
                  aria-label="Document name"
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Factory Layout Plan & DISH Endorsement"
                  className="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3.5 py-2 text-xs text-[var(--ui-text)] placeholder-[var(--ui-muted)] focus:border-[var(--ui-text)] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ui-text)] mb-1.5">
                  Document Category *
                </label>
                <select
                  value={docCategory}
                  aria-label="Document category"
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3.5 py-2 text-xs text-[var(--ui-text)] focus:border-[var(--ui-text)] focus:outline-hidden"
                >
                  <option value="Statutory Proof">Statutory Proof</option>
                  <option value="Testing Evidence">Testing Evidence</option>
                  <option value="Factory Audit">Factory Audit</option>
                  <option value="Technical Dossier">Technical Dossier</option>
                  <option value="Environmental">Environmental Clearance</option>
                  <option value="Legal Ownership">Legal Ownership</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ui-text)] mb-1.5">
                  Associated Compliance Requirement *
                </label>
                <input
                  type="text"
                  required
                  value={docRequirementId}
                  aria-label="Requirement reference"
                  onChange={(e) => setDocRequirementId(e.target.value)}
                  placeholder="e.g. Factories Act 1948 §6 or IS 1293:2019"
                  className="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3.5 py-2 text-xs text-[var(--ui-text)] placeholder-[var(--ui-muted)] focus:border-[var(--ui-text)] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ui-text)] mb-1.5">
                  Issuing Regulatory Authority *
                </label>
                <input
                  type="text"
                  required
                  value={docAuthority}
                  aria-label="Issuing authority"
                  onChange={(e) => setDocAuthority(e.target.value)}
                  placeholder="e.g. DISH, FSSAI, SPCB, BIS"
                  className="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3.5 py-2 text-xs text-[var(--ui-text)] placeholder-[var(--ui-muted)] focus:border-[var(--ui-text)] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ui-text)] mb-1.5">
                  Certificate / Registration Reference # *
                </label>
                <input
                  type="text"
                  required
                  value={docReferenceNumber}
                  aria-label="Document reference number"
                  onChange={(e) => setDocReferenceNumber(e.target.value)}
                  placeholder="e.g. FAC-LIC-2024-881"
                  className="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3.5 py-2 text-xs text-[var(--ui-text)] placeholder-[var(--ui-muted)] focus:border-[var(--ui-text)] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ui-text)] mb-1.5">
                  Valid Until / Date of Expiry *
                </label>
                <input
                  type="date"
                  required
                  value={docValidUntil}
                  aria-label="Valid until"
                  onChange={(e) => setDocValidUntil(e.target.value)}
                  className="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3.5 py-2 text-xs text-[var(--ui-text)] focus:border-[var(--ui-text)] focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-[var(--ui-text)] mb-1.5">
                  File Attachment (Blueprints, Test Reports, and Factory Layouts mandate PDF format) *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    aria-label="Document file"
                    required={!fileName && !fileObject}
                    accept=".pdf,.png,.jpg,.jpeg,.tiff,.docx,.html,.htm,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const f = e.target.files[0];
                        setFileObject(f);
                        setFileName(f.name);
                      }
                    }}
                    className="w-full text-xs text-[var(--ui-secondary)] file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[var(--ui-text)] file:text-white hover:file:bg-[var(--ui-text)] file:cursor-pointer"
                  />
                  {fileName && (
                    <span className="text-xs text-[var(--ui-text)] font-mono shrink-0">
                      {fileName} {fileObject ? `(${(fileObject.size / 1024 / 1024).toFixed(1)} MB)` : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stepped Progress Indicator during verification */}
            {uploading && (
              <UploadProgress stage={verificationProgressStep} />
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="rounded-full border border-[var(--ui-border)] px-4 py-2 text-xs font-medium text-[var(--ui-secondary)] hover:bg-[var(--ui-bg)]"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--ui-text)] px-5 py-2 text-xs font-semibold text-white hover:bg-[var(--ui-text)] disabled:opacity-50 transition-all shadow-2xs cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{uploading ? (t("common.submitting") || "Verifying Document...") : "Submit & Run Software Verification"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Software Verification Result Modal */}
        {activeVerificationResult && (
          <Overlay open onClose={closeVerificationResult} title="Document verification result">
            <div className="bg-white rounded-[20px] border border-[var(--ui-border-strong)] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between border-b border-[var(--ui-border)] pb-4">
                <div className="space-y-1">
                  <p className="text-xs text-[var(--ui-secondary)]">Preliminary checks support preparation. A reviewer must confirm this document.</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-[var(--ui-text)]">
                      Your document check
                    </h2>
                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-bold font-mono ${
                        activeVerificationResult.result.overall_status === "PASSED"
                          ? "bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] border border-[var(--ui-sage-soft)]"
                          : activeVerificationResult.result.overall_status === "WARNING"
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-rose-100 text-rose-800 border border-rose-300"
                      }`}
                    >
                      {activeVerificationResult.result.overall_status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--ui-secondary)]">
                    Document: <strong className="text-[var(--ui-text)]">{activeVerificationResult.docData.name}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeVerificationResult}
                  aria-label="Close document check"
                  className="p-1 text-[var(--ui-secondary)] hover:text-[var(--ui-text)] rounded-md text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Irrelevant / Random Document Flag Alert */}
              {activeVerificationResult.result.irrelevant_document_flag && (
                <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-400 text-rose-950 space-y-2.5 shadow-xs">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
                    <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                    <span>This document needs a closer look.</span>
                  </div>
                  <div className="text-xs font-semibold text-rose-900 bg-white/80 p-3 rounded-lg border border-rose-200 leading-relaxed">
                    {activeVerificationResult.result.flag_message}
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    The checks found a possible mismatch with the requirement. Review the explanation and provide the relevant supporting record.
                  </p>
                </div>
              )}

              <section><h3 className="font-semibold mb-2">Next step</h3>{activeVerificationResult.result.recommendations?.length ? <ul className="list-disc pl-5 text-sm text-[var(--ui-secondary)] space-y-2">{activeVerificationResult.result.recommendations.map((item,index) => <li key={index}>{item}</li>)}</ul> : <p className="text-sm text-[var(--ui-secondary)]">Review the checks and keep this record in your document vault.</p>}</section>
              <Disclosure title="Document checks · supporting detail">
              <div className="p-3.5 rounded-xl bg-[var(--ui-bg)] border border-[var(--ui-border)] text-xs text-[var(--ui-secondary)] flex items-center justify-between">
                <p>This result reflects document checks. Official filing and reviewer decisions are tracked separately.</p>
              </div>

              {/* LLM Compliance Scan & Regulatory Analysis (Necessity & Correctness) */}
              {activeVerificationResult.result.llm_scan_analysis && (
                <div className="rounded-xl border border-[var(--ui-sage-soft)] bg-gradient-to-br from-[var(--ui-info-soft)]/70 to-[var(--ui-sage-faint)]/40 p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[var(--ui-sage-soft)]/80 pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[var(--ui-info)]" />
                      <h3 className="text-sm font-bold text-[var(--ui-text)]">
                        Requirement match
                      </h3>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                        activeVerificationResult.result.llm_scan_analysis.compliance_verdict === "COMPLIANT"
                          ? "bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] border border-[var(--ui-sage-soft)]"
                          : activeVerificationResult.result.llm_scan_analysis.compliance_verdict === "IRRELEVANT"
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {activeVerificationResult.result.llm_scan_analysis.compliance_verdict}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* 1. Document Necessity */}
                    <div className="bg-white/90 p-3.5 rounded-xl border border-[var(--ui-sage-soft)] space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--ui-text)]">
                          1. Is document necessary for compliance?
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            activeVerificationResult.result.llm_scan_analysis.is_necessary
                              ? "bg-[var(--ui-sage-faint)] text-[var(--ui-sage)] border border-[var(--ui-sage-soft)]"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {activeVerificationResult.result.llm_scan_analysis.necessity_verdict}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--ui-secondary)] leading-relaxed">
                        {activeVerificationResult.result.llm_scan_analysis.necessity_rationale}
                      </p>
                    </div>

                    {/* 2. Document Correctness */}
                    <div className="bg-white/90 p-3.5 rounded-xl border border-[var(--ui-sage-soft)] space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--ui-text)]">
                          2. Is document correct for compliance?
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            activeVerificationResult.result.llm_scan_analysis.is_correct
                              ? "bg-[var(--ui-sage-faint)] text-[var(--ui-sage)] border border-[var(--ui-sage-soft)]"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {activeVerificationResult.result.llm_scan_analysis.correctness_verdict}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--ui-secondary)] leading-relaxed">
                        {activeVerificationResult.result.llm_scan_analysis.correctness_assessment}
                      </p>
                    </div>
                  </div>

                  {activeVerificationResult.result.llm_scan_analysis.llm_summary && (
                    <div className="text-xs text-[var(--ui-secondary)] bg-white/70 p-3 rounded-lg border border-[var(--ui-sage-soft)] flex items-start gap-2">
                      <span className="font-semibold text-[var(--ui-text)] shrink-0">Scan Summary:</span>
                      <span className="leading-relaxed">{activeVerificationResult.result.llm_scan_analysis.llm_summary}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 4 Systematic Verification Checks Breakdown */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--ui-text)]">
                  Document checks
                </h3>

                {/* Check 1: File Type Required for Compliance */}
                <div className="p-4 rounded-xl border border-[var(--ui-border)] bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {activeVerificationResult.result.checks.file_type.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-[var(--ui-sage)]" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-rose-600" />
                      )}
                      <span className="text-xs font-bold text-[var(--ui-text)]">
                        1. Compliance-Specific File Type & Extension
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        activeVerificationResult.result.checks.file_type.passed
                          ? "bg-[var(--ui-sage-faint)] text-[var(--ui-sage)] border border-[var(--ui-sage-soft)]"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {activeVerificationResult.result.checks.file_type.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--ui-secondary)] pl-6">
                    {activeVerificationResult.result.checks.file_type.message}
                  </p>
                  {activeVerificationResult.result.checks.file_type.issues.length > 0 && (
                    <ul className="pl-10 list-disc text-xs text-rose-700 space-y-0.5">
                      {activeVerificationResult.result.checks.file_type.issues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Check 2: Mandatory Field Completeness */}
                <div className="p-4 rounded-xl border border-[var(--ui-border)] bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {activeVerificationResult.result.checks.field_completeness.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-[var(--ui-sage)]" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-rose-600" />
                      )}
                      <span className="text-xs font-bold text-[var(--ui-text)]">
                        2. Mandatory Statutory Fields Completeness
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        activeVerificationResult.result.checks.field_completeness.passed
                          ? "bg-[var(--ui-sage-faint)] text-[var(--ui-sage)] border border-[var(--ui-sage-soft)]"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {activeVerificationResult.result.checks.field_completeness.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--ui-secondary)] pl-6">
                    {activeVerificationResult.result.checks.field_completeness.message}
                  </p>
                  {activeVerificationResult.result.checks.field_completeness.issues.length > 0 && (
                    <ul className="pl-10 list-disc text-xs text-rose-700 space-y-0.5">
                      {activeVerificationResult.result.checks.field_completeness.issues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Check 3: Format & Expiry Compliance */}
                <div className="p-4 rounded-xl border border-[var(--ui-border)] bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {activeVerificationResult.result.checks.format_and_expiry.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-[var(--ui-sage)]" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-rose-600" />
                      )}
                      <span className="text-xs font-bold text-[var(--ui-text)]">
                        3. Statutory Prescribed Format & Expiry Date Compliance
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        activeVerificationResult.result.checks.format_and_expiry.passed
                          ? activeVerificationResult.result.checks.format_and_expiry.status === "WARNING"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-[var(--ui-sage-faint)] text-[var(--ui-sage)] border border-[var(--ui-sage-soft)]"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {activeVerificationResult.result.checks.format_and_expiry.status}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--ui-secondary)] pl-6">
                    {activeVerificationResult.result.checks.format_and_expiry.message}
                  </p>
                  {activeVerificationResult.result.checks.format_and_expiry.issues.length > 0 && (
                    <ul className="pl-10 list-disc text-xs text-rose-700 space-y-0.5">
                      {activeVerificationResult.result.checks.format_and_expiry.issues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  )}
                  {activeVerificationResult.result.checks.format_and_expiry.warnings.length > 0 && (
                    <ul className="pl-10 list-disc text-xs text-amber-700 space-y-0.5">
                      {activeVerificationResult.result.checks.format_and_expiry.warnings.map((warn, idx) => (
                        <li key={idx}>{warn}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Check 4: AI Pre-Validation & OCR Relevance */}
                <div className="p-4 rounded-xl border border-[var(--ui-border)] bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {activeVerificationResult.result.checks.ai_relevance.passed ? (
                        <Sparkles className="h-4 w-4 text-[var(--ui-info)]" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-rose-600" />
                      )}
                      <span className="text-xs font-bold text-[var(--ui-text)]">
                        4. AI Pre-Validation & OCR Relevance Analysis
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {["LIVE_OPENAI_COMPLETION", "LIVE_PROVIDER_COMPLETION"].includes(activeVerificationResult.result.checks.ai_relevance.ai_call_status || "") ||
                      ["LIVE_OPENAI_COMPLETION", "LIVE_PROVIDER_COMPLETION"].includes(activeVerificationResult.result.llm_scan_analysis?.ai_call_status || "") ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] border border-[var(--ui-sage-soft)] flex items-center gap-1">
                          <Zap className="h-3 w-3 text-[var(--ui-sage)]" />
                          <span>Automated interpretation</span>
                        </span>
                      ) : activeVerificationResult.result.checks.ai_relevance.ai_call_status === "OPENAI_ERROR" ||
                        activeVerificationResult.result.llm_scan_analysis?.ai_call_status === "OPENAI_ERROR" ? (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          Preliminary file checks
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--ui-inset)] text-[var(--ui-secondary)] border border-[var(--ui-border-strong)]">
                          Preliminary file checks
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          activeVerificationResult.result.checks.ai_relevance.passed
                            ? "bg-[var(--ui-info-soft)] text-[var(--ui-info)] border border-[var(--ui-sage-soft)]"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {activeVerificationResult.result.checks.ai_relevance.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--ui-secondary)] pl-6 leading-relaxed">
                    {activeVerificationResult.result.checks.ai_relevance.message}
                  </p>

                  {/* OpenAI Notice or Error Banner if applicable */}
                  {(activeVerificationResult.result.checks.ai_relevance.ai_notice ||
                    activeVerificationResult.result.llm_scan_analysis?.ai_notice) && (
                    <div className="ml-6 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 leading-snug">
                      <span className="font-semibold">AI Provider Notice: </span>
                      {activeVerificationResult.result.checks.ai_relevance.ai_notice ||
                        activeVerificationResult.result.llm_scan_analysis?.ai_notice}
                    </div>
                  )}

                  {/* Two-Column LLM Scan Analysis: Necessity & Correctness */}
                  {activeVerificationResult.result.llm_scan_analysis && (
                    <div className="ml-6 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[var(--ui-text)] uppercase tracking-wide">
                            Statutory Necessity
                          </span>
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm ${
                              activeVerificationResult.result.llm_scan_analysis.is_necessary
                                ? "bg-[var(--ui-sage-soft)] text-[var(--ui-sage)]"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {activeVerificationResult.result.llm_scan_analysis.necessity_verdict}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--ui-secondary)] leading-snug">
                          {activeVerificationResult.result.llm_scan_analysis.necessity_rationale}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-[var(--ui-bg)] border border-[var(--ui-border)] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[var(--ui-text)] uppercase tracking-wide">
                            Statutory Correctness
                          </span>
                          <span
                            className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm ${
                              activeVerificationResult.result.llm_scan_analysis.is_correct
                                ? "bg-[var(--ui-sage-soft)] text-[var(--ui-sage)]"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {activeVerificationResult.result.llm_scan_analysis.correctness_verdict}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--ui-secondary)] leading-snug">
                          {activeVerificationResult.result.llm_scan_analysis.correctness_assessment}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeVerificationResult.result.checks.ai_relevance.issues.length > 0 && (
                    <ul className="pl-10 list-disc text-xs text-rose-700 space-y-0.5">
                      {activeVerificationResult.result.checks.ai_relevance.issues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              </Disclosure>
              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--ui-border)]">
                <button
                  type="button"
                  onClick={closeVerificationResult}
                  className="rounded-full border border-[var(--ui-border)] px-4 py-2 text-xs font-semibold text-[var(--ui-secondary)] hover:bg-[var(--ui-bg)]"
                >
                  Close result
                </button>
                <button
                  type="button"
                  onClick={handleAcceptVerification}
                  className="rounded-full bg-[var(--ui-text)] px-5 py-2 text-xs font-semibold text-white hover:bg-[var(--ui-text)] transition-all shadow-2xs"
                >
                  Return to document vault
                </button>
              </div>
            </div>
          </Overlay>
        )}

        {error && (
          <ErrorState
            title={error}
            message={error}
            onRetry={() => businessId && loadDocuments(businessId)}
          />
        )}

        {loading ? (
          <div className="space-y-3">
            <LoadingSkeleton count={4} className="h-28 w-full rounded-[16px]" />
          </div>
        ) : error ? null : filteredDocuments.length === 0 ? (
          <div className="bg-white rounded-[16px] border border-[var(--ui-border)] p-12 text-center shadow-2xs">
            <div className="text-3xl mb-3">📁</div>
            <h3 className="font-sans font-bold text-lg text-[var(--ui-text)]">
              {portalFilter === "UPLOADED"
                ? "No documents marked as uploaded on official portals yet"
                : portalFilter === "NOT_UPLOADED"
                ? "All catalogued documents have been marked as uploaded!"
                : "No documents recorded for current requirements"}
            </h3>
            <p className="font-sans text-xs text-[var(--ui-secondary)] mt-1 max-w-md mx-auto">
              {portalFilter === "UPLOADED"
                ? "No documents marked as uploaded on official portals yet"
                : portalFilter === "NOT_UPLOADED"
                ? "All catalogued documents have been marked as uploaded!"
                : "The required document checklist is generated directly from applicable compliance requirements. Run an analysis pass first to populate this registry."}
            </p>
            {rawDocuments.length === 0 && (
              <Link
                href={`/onboarding?business_id=${businessId}`}
                className="inline-flex items-center mt-5 rounded-full bg-[var(--ui-text)] text-white px-5 py-2 text-xs font-semibold hover:bg-[var(--ui-text)] transition-colors shadow-2xs"
              >
                Run Regulatory Analysis →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc: any) => {
              const isUploaded = doc.isPortalUploaded;
              return (
                <div
                  key={doc.id}
                  className={`bg-white rounded-[16px] border p-5 shadow-2xs transition-all space-y-4 flex flex-col justify-between ${
                    isUploaded
                      ? "border-[var(--ui-sage-soft)] hover:border-[var(--ui-sage-soft)]"
                      : "border-[var(--ui-border)] hover:border-[var(--ui-border-strong)]"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <h3 className="font-sans text-base text-[var(--ui-text)] font-bold leading-snug">
                          {doc.name}
                        </h3>
                        <span className="text-[11px] text-[var(--ui-secondary)] block">
                          Category: <span className="text-[var(--ui-text)] font-medium">{doc.category || doc.document_type || "Statutory Proof"}</span>
                        </span>
                      </div>

                      {/* Display Status Badge */}
                      <StatusBadge
                        status={isUploaded ? "UPLOADED" : doc.status}
                        size="sm"
                      />
                    </div>

                    {/* Official Portal Tracking Checkbox Option */}
                    <div className="p-2.5 rounded-xl bg-[var(--ui-bg)] border border-[var(--ui-border)] flex items-center justify-between">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isUploaded}
                          disabled={portalSaving[doc.id]}
                          onChange={() => void handleTogglePortalUploaded(doc.id)}
                          className="h-4 w-4 rounded border-[var(--ui-border-strong)] text-[var(--ui-text)] focus:ring-[var(--ui-text)] cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-[var(--ui-text)]">
                          {isUploaded ? "Uploaded on Official Portal" : "Mark as Uploaded on Portal"}
                        </span>
                      </label>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          isUploaded
                            ? "bg-[var(--ui-sage-soft)] text-[var(--ui-sage)] border border-[var(--ui-sage-soft)]"
                            : "bg-[var(--ui-inset)] text-[var(--ui-secondary)] border border-[var(--ui-border)]"
                        }`}
                      >
                        {isUploaded ? "FILED" : "NOT UPLOADED"}
                      </span>
                    </div>

                    {/* Which requirement asks for this document */}
                    <div className="pt-2 border-t border-[var(--ui-border)] space-y-1.5">
                      <span className="text-[11px] font-medium text-[var(--ui-secondary)] block uppercase tracking-wider">
                        {doc.category === "PLANNING_CHECKLIST" ? "Planning basis" : "Requirement basis"}
                      </span>
                      <Link
                        href={`/compliance/${doc.requirement_id || doc.clauseLinked}?business_id=${businessId}${(searchParams.get("assessment_id") || (businessId === activeBusinessId ? activeAssessmentId : undefined)) ? `&assessment_id=${searchParams.get("assessment_id") || activeAssessmentId}` : ""}`}
                        className="text-xs font-semibold text-[var(--ui-text)] hover:underline block leading-snug"
                      >
                        {doc.requirement_name || doc.requirement_id || doc.clauseLinked}
                      </Link>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--ui-secondary)]">
                        <span>{doc.authority || (doc.category === "PLANNING_CHECKLIST" ? "Contextual preparation guidance" : "Authority not recorded")}</span>
                        <span className="text-[var(--ui-border-strong)]">·</span>
                        <span className="font-mono text-[var(--ui-muted)]">{doc.code || doc.requirement_id}</span>
                      </div>
                    </div>

                    {doc.notes && (
                      <p className="text-[11px] text-[var(--ui-secondary)] border-t border-[var(--ui-border)] pt-2.5 leading-relaxed">
                        {doc.notes}
                      </p>
                    )}
                  </div>

                  {/* Bottom Actions: View Dossier & Upload/Verify */}
                  <div className="pt-3 border-t border-[var(--ui-border)] flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-[var(--ui-secondary)]">
                      {doc.file_size_bytes ? `${(doc.file_size_bytes / 1024 / 1024).toFixed(1)} MB` : "No file size recorded"}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openUploadForDocument(doc)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--ui-text)] hover:text-[var(--ui-info)] px-2.5 py-1 rounded-full border border-[var(--ui-border)] hover:bg-[var(--ui-bg)] transition-colors"
                        title="Upload file and run software verification"
                      >
                        <Upload className="h-3 w-3" />
                        <span>Verify</span>
                      </button>

                      <Link
                        href={`/documents/${doc.id}`}
                        className="inline-flex items-center gap-1 text-xs text-[var(--ui-text)] hover:underline font-semibold transition-colors"
                      >
                        <span>{t("common.viewDetails")}</span>
                        <span className="text-sm">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
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
        <div className="min-h-screen bg-[var(--ui-bg)] flex items-center justify-center text-xs text-[var(--ui-secondary)]">
          Loading statutory repository...
        </div>
      }
    >
      <DocumentsContent />
    </Suspense>
  );
}
