"use client";

import React, { useState } from "react";
import AppShell from "@/components/AppShell";
import { useBusinessContext } from "@/context/BusinessContext";
import {
  Folder,
  ChevronRight,
  Sliders,
  Shield,
  Bell,
  Database,
  RefreshCw,
  Check,
  Cpu,
} from "lucide-react";

export default function SettingsPage() {
  const { resetToDefault } = useBusinessContext();
  const [engineMode, setEngineMode] = useState("deterministic");
  const [evaluationFrequency, setEvaluationFrequency] = useState("weekly");
  const [alertThreshold, setAlertThreshold] = useState("30");
  const [savedNotice, setSavedNotice] = useState(false);

  function handleSave() {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  }

  return (
    <AppShell activeView="settings">
      <div className="space-y-6 pb-6 select-none max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 text-[11px] font-semibold tracking-wider uppercase mb-2">
              System Configuration
            </div>
            <h1 className="font-sans font-bold text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
              Compliance &amp; Engine Settings
            </h1>
            <p className="text-xs text-[#64748B] mt-1.5 max-w-2xl leading-relaxed">
              Configure statutory rule evaluation engine parameters, audit cadence, and advance warning thresholds.
            </p>
          </div>
        </div>

        {savedNotice && (
          <div className="p-4 rounded-[10px] bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold flex items-center gap-2 shadow-2xs">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>Configuration parameters synchronized and active!</span>
          </div>
        )}

        {/* Engine Settings */}
        <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-6 sm:p-8 shadow-2xs space-y-6">
          <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-4">
            <Cpu className="h-4 w-4 text-amber-600" />
            <h2 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
              Statutory Decision Engine Logic
            </h2>
          </div>

          <div className="space-y-5 text-xs">
            <div>
              <div className="font-sans font-bold text-base text-[#0F172A]">Evaluation Logic Model</div>
              <p className="text-[#64748B] mt-1">
                ComplyWise operates strictly under deterministic 3-valued AST logic (TRUE · FALSE · UNKNOWN).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setEngineMode("deterministic")}
                  className={`p-4 rounded-[10px] border text-left transition-all cursor-pointer ${
                    engineMode === "deterministic"
                      ? "bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/50 text-[#0F172A] shadow-2xs"
                      : "bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#0F172A]">Deterministic AST (Statutory Strict)</span>
                    {engineMode === "deterministic" && <Check className="h-4 w-4 text-amber-600" />}
                  </div>
                  <p className="font-normal text-[11px] text-[#64748B] mt-1.5 leading-relaxed">
                    Guaranteed verifiable citations; zero hallucination. Rules compile directly to statutory clause trees.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setEngineMode("hybrid")}
                  className={`p-4 rounded-[10px] border text-left transition-all cursor-pointer ${
                    engineMode === "hybrid"
                      ? "bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/50 text-[#0F172A] shadow-2xs"
                      : "bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#0F172A]">Hybrid AST + Copilot Advisory</span>
                    {engineMode === "hybrid" && <Check className="h-4 w-4 text-amber-600" />}
                  </div>
                  <p className="font-normal text-[11px] text-[#64748B] mt-1.5 leading-relaxed">
                    Deterministic statutory verification paired with contextual natural language advisory notes.
                  </p>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0]">
              <div className="font-sans font-bold text-base text-[#0F172A]">Automated Audit Cadence</div>
              <p className="text-[#64748B] mt-1">Frequency of background reconciliation against national gazette feeds.</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { label: "Daily Sync", val: "daily" },
                  { label: "Weekly Audit (Standard)", val: "weekly" },
                  { label: "On Gazette Publication Only", val: "gazette" },
                ].map((cad) => (
                  <button
                    key={cad.val}
                    type="button"
                    onClick={() => setEvaluationFrequency(cad.val)}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      evaluationFrequency === cad.val
                        ? "bg-[#0F172A] text-white font-semibold shadow-2xs"
                        : "bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50"
                    }`}
                  >
                    {cad.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0]">
              <div className="font-sans font-bold text-base text-[#0F172A]">Renewal Warning Threshold</div>
              <p className="text-[#64748B] mt-1">
                Advance alert window before laboratory re-test certificates or industrial licenses expire.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {["14", "30", "60", "90"].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setAlertThreshold(days)}
                    className={`px-4 py-2 rounded-full text-xs font-mono transition-all cursor-pointer ${
                      alertThreshold === days
                        ? "bg-[#0F172A] text-white font-semibold shadow-2xs"
                        : "bg-white border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50"
                    }`}
                  >
                    {days} Days Advance
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-[#E2E8F0] flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                resetToDefault();
                alert("Reset demo business profile to baseline!");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#E2E8F0] text-xs font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 cursor-pointer transition-colors shadow-2xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Demo Data</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 rounded-full bg-[#0F172A] text-white text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer shadow-2xs"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
