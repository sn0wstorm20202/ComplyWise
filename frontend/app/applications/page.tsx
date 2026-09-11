"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import StatusBadge from "@/components/StatusBadge";
import {
  FileCheck,
  ExternalLink,
  Clock,
  Building,
  ShieldCheck,
  Search,
  Filter,
  AlertCircle,
} from "lucide-react";
import { useBusinessContext } from "@/context/BusinessContext";

interface ApplicationRecord {
  id: string;
  referenceNumber: string;
  requirementName: string;
  authority: string;
  portalName: string;
  portalUrl: string;
  submittedDate: string;
  lastUpdated: string;
  status: "SUBMITTED" | "UNDER_SCRUTINY" | "DOCUMENTS_REQUESTED" | "APPROVED";
  officerRemark: string;
  prevalidationStatus: "PASS" | "NEEDS_REVIEW";
}

const DEMO_APPLICATIONS: ApplicationRecord[] = [
  {
    id: "app-1",
    referenceNumber: "NSWS-2026-KA-4921",
    requirementName: "WPC Equipment Type Approval (ETA)",
    authority: "WPC (DoT)",
    portalName: "Saral Sanchar Portal",
    portalUrl: "https://saralsanchar.gov.in",
    submittedDate: "2026-08-14",
    lastUpdated: "2026-09-02",
    status: "UNDER_SCRUTINY",
    officerRemark: "RF test report parameters under technical review by nodal officer.",
    prevalidationStatus: "PASS",
  },
  {
    id: "app-2",
    referenceNumber: "BIS-CRS-2026-8812",
    requirementName: "BIS Compulsory Registration Scheme (CRS) — IS 13252",
    authority: "Bureau of Indian Standards",
    portalName: "Manakonline / CRS Portal",
    portalUrl: "https://www.crsbis.in",
    submittedDate: "2026-08-20",
    lastUpdated: "2026-09-08",
    status: "DOCUMENTS_REQUESTED",
    officerRemark: "Upload updated factory quality manual and PCB component layout schedule.",
    prevalidationStatus: "NEEDS_REVIEW",
  },
  {
    id: "app-3",
    referenceNumber: "DGFT-IEC-0992381",
    requirementName: "Importer-Exporter Code (IEC)",
    authority: "Directorate General of Foreign Trade",
    portalName: "DGFT Unified Portal",
    portalUrl: "https://www.dgft.gov.in",
    submittedDate: "2026-09-01",
    lastUpdated: "2026-09-04",
    status: "APPROVED",
    officerRemark: "Electronic IEC issued with electronic DSC signature.",
    prevalidationStatus: "PASS",
  },
];

function ApplicationsContent() {
  const { profile } = useBusinessContext();
  const [filter, setFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filtered = DEMO_APPLICATIONS.filter((app) => {
    if (filter !== "ALL" && app.status !== filter) return false;
    if (
      searchTerm &&
      !app.requirementName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !app.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !app.authority.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <AppShell activeView="workflows">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-amber-800 tracking-wide uppercase">
                Statutory Filings · {profile.businessName}
              </span>
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                Official Portal Handoff Tracking
              </span>
            </div>
            <h1 className="text-2xl font-sans font-bold tracking-tight text-[#0F172A] mt-1">
              Applications &amp; Portal Filings
            </h1>
            <p className="text-xs text-[#64748B] mt-0.5">
              Live status tracking for applications submitted to official government single-window portals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E2E8F0] text-[11px] text-[#475569] shadow-2xs font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Demo Portal Sync Active
            </span>
          </div>
        </div>

        {/* Regulatory Boundary Notice (Image B Contract) */}
        <div className="bg-amber-50/50 border border-amber-200/80 rounded-[10px] p-4 flex items-start gap-3 text-xs">
          <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-[#334155] leading-relaxed">
            <strong className="text-[#0F172A] font-semibold">Statutory Jurisdiction Boundary: </strong>
            ComplyWise pre-validates application dossiers and tracks submission milestones.
            Official license grants, query notices, and statutory approvals are issued solely by
            respective government departments (BIS, WPC, DGFT, State PCB).
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-[#E2E8F0] text-xs shadow-2xs">
            {["ALL", "SUBMITTED", "UNDER_SCRUTINY", "DOCUMENTS_REQUESTED", "APPROVED"].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                  filter === st
                    ? "bg-[#0F172A] text-white shadow-2xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                {st.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search reference # or authority..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-full bg-white border border-[#E2E8F0] pl-8 pr-4 py-1.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:border-amber-500 focus:outline-none shadow-2xs"
            />
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {filtered.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-[10px] border border-[#E2E8F0] p-5 shadow-2xs hover:border-slate-300 transition-colors space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {app.referenceNumber}
                    </span>
                    <span className="text-xs text-[#64748B] flex items-center gap-1 font-medium">
                      <Building className="h-3 w-3" />
                      {app.authority}
                    </span>
                  </div>
                  <h3 className="text-base font-sans font-bold text-[#0F172A]">
                    {app.requirementName}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#64748B]">
                    <span>Portal: <strong className="text-[#0F172A] font-semibold">{app.portalName}</strong></span>
                    <span>·</span>
                    <span>Submitted: {app.submittedDate}</span>
                    <span>·</span>
                    <span>Updated: {app.lastUpdated}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      app.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : app.status === "DOCUMENTS_REQUESTED"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                  >
                    {app.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* Officer Remark & Pre-validation strip */}
              <div className="bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#64748B] block">
                    Official Scrutiny Note
                  </span>
                  <p className="text-[#1E293B] mt-0.5 leading-relaxed">{app.officerRemark}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-[#64748B]">
                    Pre-validation:{" "}
                    <strong
                      className={
                        app.prevalidationStatus === "PASS"
                          ? "text-emerald-700 font-semibold"
                          : "text-amber-700 font-semibold"
                      }
                    >
                      {app.prevalidationStatus}
                    </strong>
                  </span>
                  <a
                    href={app.portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline"
                  >
                    <span>Open Govt Portal</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]" />}>
      <ApplicationsContent />
    </Suspense>
  );
}
