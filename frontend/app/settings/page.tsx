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
        <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-32 bg-radial from-[#cc9166]/10 to-transparent blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#cc9166]/30 bg-[#cc9166]/10 text-[#cc9166] text-[11px] font-semibold tracking-wider uppercase mb-2">
              System Configuration
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#ffffff] tracking-tight">
              Compliance & Engine Settings
            </h1>
            <p className="text-xs text-[#9194a1] mt-1.5 max-w-2xl leading-relaxed">
              Configure statutory rule evaluation engine parameters, audit cadence, and advance warning thresholds.
            </p>
          </div>
        </div>

        {savedNotice && (
          <div className="p-4 rounded-[10px] bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 font-semibold flex items-center gap-2 shadow-lg">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>Configuration parameters synchronized and active!</span>
          </div>
        )}

        {/* Engine Settings */}
        <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-2 border-b border-[#1c1d22] pb-4">
            <Cpu className="h-4 w-4 text-[#cc9166]" />
            <h2 className="text-xs font-semibold text-[#ffffff] uppercase tracking-wider">
              Statutory Decision Engine Logic
            </h2>
          </div>

          <div className="space-y-5 text-xs">
            <div>
              <div className="font-serif text-base text-[#ffffff]">Evaluation Logic Model</div>
              <p className="text-[#9194a1] mt-1">
                ComplyWise operates strictly under deterministic 3-valued AST logic (TRUE · FALSE · UNKNOWN).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setEngineMode("deterministic")}
                  className={`p-4 rounded-[10px] border text-left transition-all cursor-pointer ${
                    engineMode === "deterministic"
                      ? "bg-[#1c140d] border-[#cc9166] text-[#ffffff] shadow-[0_0_15px_rgba(204,145,102,0.15)]"
                      : "bg-[#121317] border-[#1c1d22] text-[#9194a1] hover:border-[#2e3038]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-[#ffffff]">Deterministic AST (Statutory Strict)</span>
                    {engineMode === "deterministic" && <Check className="h-4 w-4 text-[#cc9166]" />}
                  </div>
                  <p className="font-normal text-[11px] text-[#777a88] mt-1.5 leading-relaxed">
                    Guaranteed verifiable citations; zero hallucination. Rules compile directly to statutory clause trees.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setEngineMode("hybrid")}
                  className={`p-4 rounded-[10px] border text-left transition-all cursor-pointer ${
                    engineMode === "hybrid"
                      ? "bg-[#1c140d] border-[#cc9166] text-[#ffffff] shadow-[0_0_15px_rgba(204,145,102,0.15)]"
                      : "bg-[#121317] border-[#1c1d22] text-[#9194a1] hover:border-[#2e3038]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-[#ffffff]">Hybrid AST + Copilot Advisory</span>
                    {engineMode === "hybrid" && <Check className="h-4 w-4 text-[#cc9166]" />}
                  </div>
                  <p className="font-normal text-[11px] text-[#777a88] mt-1.5 leading-relaxed">
                    Deterministic statutory verification paired with contextual natural language advisory notes.
                  </p>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-[#1c1d22]">
              <div className="font-serif text-base text-[#ffffff]">Automated Audit Cadence</div>
              <p className="text-[#9194a1] mt-1">Frequency of background reconciliation against national gazette feeds.</p>
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
                        ? "bg-[#ffffff] text-[#08080a] font-semibold shadow-md"
                        : "bg-[#121317] border border-[#1c1d22] text-[#9194a1] hover:text-[#ffffff] hover:border-[#2e3038]"
                    }`}
                  >
                    {cad.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#1c1d22]">
              <div className="font-serif text-base text-[#ffffff]">Renewal Warning Threshold</div>
              <p className="text-[#9194a1] mt-1">
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
                        ? "bg-[#cc9166] text-black font-semibold shadow-[0_0_10px_rgba(204,145,102,0.3)]"
                        : "bg-[#121317] border border-[#1c1d22] text-[#9194a1] hover:text-[#ffffff]"
                    }`}
                  >
                    {days} Days Advance
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-[#1c1d22] flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                resetToDefault();
                alert("Reset demo business profile to baseline!");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2e3038] text-xs font-medium text-[#9194a1] hover:text-[#ffffff] hover:bg-[#121317] cursor-pointer transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Demo Data</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 rounded-full bg-[#cc9166] text-black text-xs font-semibold hover:bg-[#d99f75] transition-all cursor-pointer shadow-[0_0_15px_rgba(204,145,102,0.25)]"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
