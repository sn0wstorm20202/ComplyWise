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
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Folder className="h-3.5 w-3.5 text-slate-400" />
            <span>Home Page</span>
            <ChevronRight className="h-3 w-3 text-slate-300" />
            <span className="text-slate-600 font-semibold">Settings</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            System & Compliance Settings
          </h1>
          <p className="text-xs text-slate-500">
            Configure statutory rule evaluation engine, alert thresholds, and tenant parameters.
          </p>
        </div>

        {savedNotice && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>Configuration changes saved and active!</span>
          </div>
        )}

        {/* Engine Settings */}
        <div className="bg-white rounded-[28px] border border-slate-200/70 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Cpu className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Statutory Decision Engine
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="font-bold text-slate-900 text-sm">Evaluation Mode</div>
              <p className="text-slate-500 mt-0.5">
                ComplyWise operates strictly under deterministic 3-valued AST logic (TRUE · FALSE · UNKNOWN).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setEngineMode("deterministic")}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    engineMode === "deterministic"
                      ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-200 text-indigo-950 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Deterministic AST (Statutory Safe)</span>
                    {engineMode === "deterministic" && <Check className="h-4 w-4 text-indigo-600" />}
                  </div>
                  <p className="font-normal text-[11px] text-slate-500 mt-1">
                    Guaranteed verifiable citations; zero hallucination.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setEngineMode("hybrid")}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    engineMode === "hybrid"
                      ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-200 text-indigo-950 font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Hybrid AST + Copilot Explanations</span>
                    {engineMode === "hybrid" && <Check className="h-4 w-4 text-indigo-600" />}
                  </div>
                  <p className="font-normal text-[11px] text-slate-500 mt-1">
                    Deterministic legal gates with natural language insights.
                  </p>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="font-bold text-slate-900 text-sm">Automated Evaluation Cadence</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { label: "Daily Synchronization", val: "daily" },
                  { label: "Weekly Audit (Standard)", val: "weekly" },
                  { label: "On Gazette Publication Only", val: "gazette" },
                ].map((cad) => (
                  <button
                    key={cad.val}
                    type="button"
                    onClick={() => setEvaluationFrequency(cad.val)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      evaluationFrequency === cad.val
                        ? "bg-[#0f172a] text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {cad.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="font-bold text-slate-900 text-sm">Statutory Renewal Warning Threshold</div>
              <p className="text-slate-500 mt-0.5">
                Minimum advance notice before laboratory test certificates or licenses trigger urgent notifications.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {["14", "30", "60", "90"].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setAlertThreshold(days)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      alertThreshold === days
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    {days} Days Advance
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                resetToDefault();
                alert("Reset demo business profile to baseline!");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Demo Data</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 rounded-full bg-[#0f172a] text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
