"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CalendarCheck,
  Building,
  Flag,
  FileText,
  User,
  AlertCircle,
  X,
} from "lucide-react";
import type { AdminScrutinyData } from "@/types";
import { calendarApi } from "@/lib/api/calendar";

interface AdminCalendarTabProps {
  data: AdminScrutinyData;
  onRefresh?: () => void;
}

export function AdminCalendarTab({ data, onRefresh }: AdminCalendarTabProps) {
  const [filterType, setFilterType] = useState<"ALL" | "STATUTORY" | "ADMIN">("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  // Add deadline form state
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState<"CRITICAL" | "HIGH" | "MEDIUM" | "LOW">("HIGH");
  const [requirementIdCode, setRequirementIdCode] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const statutoryEvents = data.calendar.statutory_events || [];
  const adminDeadlines = data.calendar.admin_deadlines || [];

  // Combine both sources with unified format
  const combinedList = [
    ...statutoryEvents.map((e) => ({
      id: e.id || e.event_id || Math.random().toString(),
      title: e.title || e.event_name,
      due_at: e.due_date || e.due_at,
      priority: e.priority || "MEDIUM",
      source: "STATUTORY",
      authority: e.authority || "Statutory Regulator",
      requirement_id_code: e.requirement_id || e.requirement_code || "",
      description: e.description || e.recurring_cycle || "",
      notes: e.statutory_reference || "",
      created_by: "Statutory Law",
      status: e.status || "PENDING",
    })),
    ...adminDeadlines.map((d) => ({
      id: d.id,
      title: d.title,
      due_at: d.due_at,
      priority: d.priority || "HIGH",
      source: "ADMINISTRATIVE",
      authority: "Compliance Officer",
      requirement_id_code: d.requirement_id_code || "",
      description: d.description || "",
      notes: d.notes || "",
      created_by: d.created_by || "Admin",
      status: d.status || "PENDING",
    })),
  ].sort((a, b) => {
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });

  const filteredList = combinedList.filter((item) => {
    if (filterType === "STATUTORY") return item.source === "STATUTORY";
    if (filterType === "ADMIN") return item.source === "ADMINISTRATIVE";
    return true;
  });

  const now = new Date();
  const overdueCount = combinedList.filter((item) => new Date(item.due_at) < now).length;
  const criticalCount = combinedList.filter((item) => item.priority === "CRITICAL").length;

  const handleCreateDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueAt) {
      setFormError("Title and Due Date are mandatory.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      await calendarApi.createAdminBusinessDeadline(data.business.id, {
        title,
        due_at: new Date(dueAt).toISOString(),
        priority,
        requirement_id_code: requirementIdCode || undefined,
        description: description || undefined,
        notes: notes || undefined,
      });

      setFormSuccess("Administrative deadline successfully registered.");
      setTimeout(() => {
        setShowAddModal(false);
        setTitle("");
        setDueAt("");
        setDescription("");
        setNotes("");
        setFormSuccess(null);
        if (onRefresh) onRefresh();
      }, 700);
    } catch (err: any) {
      setFormError(err.message || "Failed to create administrative deadline.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <CalendarIcon className="w-3 h-3 mr-1" />
                Statutory &amp; Administrative Timeline
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {combinedList.length} Scheduled Filings
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#0F172A]">
              Statutory Calendar &amp; Imposed Deadlines
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Unified compliance timeline combining automated statutory return cycles and
              officer-mandated rectification dates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowAddModal(true);
                setFormError(null);
                setFormSuccess(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#18181B] text-white hover:bg-[#27272A] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Impose Deadline</span>
            </button>
          </div>
        </div>

        {/* Counter cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Deadlines
            </div>
            <div className="text-lg font-bold text-[#0F172A] mt-0.5">{combinedList.length}</div>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
              Statutory Returns
            </div>
            <div className="text-lg font-bold text-blue-700 mt-0.5">
              {statutoryEvents.length}
            </div>
          </div>
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
            <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">
              Imposed by Officer
            </div>
            <div className="text-lg font-bold text-indigo-700 mt-0.5">
              {adminDeadlines.length}
            </div>
          </div>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
            <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
              Critical / Overdue
            </div>
            <div className="text-lg font-bold text-rose-700 mt-0.5">
              {criticalCount + overdueCount}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === "ALL"
                ? "bg-[#18181B] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Events ({combinedList.length})
          </button>
          <button
            onClick={() => setFilterType("STATUTORY")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === "STATUTORY"
                ? "bg-[#18181B] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Statutory Recurring ({statutoryEvents.length})
          </button>
          <button
            onClick={() => setFilterType("ADMIN")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === "ADMIN"
                ? "bg-[#18181B] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Administrative Directives ({adminDeadlines.length})
          </button>
        </div>
      </div>

      {/* Timeline List */}
      {filteredList.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">No Deadlines Scheduled</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            No active statutory returns or administrative directives match this filter. Use &quot;Impose
            Deadline&quot; to issue a formal rectification date.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((item) => {
            const dueDate = new Date(item.due_at);
            const isOverdue = dueDate < now;
            const diffDays = Math.ceil(
              (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            const isCritical = item.priority === "CRITICAL";
            const isHigh = item.priority === "HIGH";
            const isStatutory = item.source === "STATUTORY";

            return (
              <div
                key={item.id}
                className="bg-white border border-[#E2E8F0] hover:border-slate-300 rounded-2xl p-5 shadow-sm transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left Column: Date & Details */}
                  <div className="flex items-start gap-4">
                    {/* Date Block */}
                    <div
                      className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                        isOverdue
                          ? "bg-rose-50 border-rose-200 text-rose-700"
                          : isCritical
                          ? "bg-amber-50 border-amber-200 text-amber-700"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {dueDate.toLocaleString("en-US", { month: "short" })}
                      </span>
                      <span className="text-lg font-bold leading-none mt-0.5">
                        {dueDate.getDate()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {isStatutory ? (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            Statutory Return
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Administrative Directive
                          </span>
                        )}

                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            isCritical
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : isHigh
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {item.priority}
                        </span>

                        {item.requirement_id_code && (
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {item.requirement_id_code}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-[#0F172A] leading-snug">
                        {item.title}
                      </h3>

                      {item.description && (
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {item.authority}
                        </span>
                        {item.notes && (
                          <span className="italic text-slate-500 border-l border-slate-200 pl-2">
                            {item.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Relative Remaining Days & Status */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {isOverdue ? (
                      <span className="inline-flex items-center text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                        Overdue by {Math.abs(diffDays)} days
                      </span>
                    ) : diffDays === 0 ? (
                      <span className="inline-flex items-center text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        Due Today
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        Due in {diffDays} days
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400">
                      Issuer: {item.created_by}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Administrative Deadline Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">
                  Impose Administrative Deadline
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record an official deadline for document filing or statutory rectification.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeadline} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Directive Title / Obligation *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Rectify PCB Air Consent application"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#18181B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueAt}
                    onChange={(e) => setDueAt(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#18181B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#18181B]"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Related Requirement ID (Optional)
                </label>
                <input
                  type="text"
                  value={requirementIdCode}
                  onChange={(e) => setRequirementIdCode(e.target.value)}
                  placeholder="e.g. EP-001 or FACT-003"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#18181B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Instructions
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Instructions for the enterprise owner..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#18181B]"
                />
              </div>

              {formSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#18181B] text-white hover:bg-[#27272A] disabled:opacity-50 transition-colors shadow-sm"
                >
                  {submitting ? "Saving..." : "Save Directive"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
