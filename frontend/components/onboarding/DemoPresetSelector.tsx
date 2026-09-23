"use client";

import React from "react";
import { CONTROLLED_DEMO_PROFILES, DemoPresetDefinition } from "@/data/demo/controlledPresets";
import { Check, Sparkles } from "lucide-react";

interface DemoPresetSelectorProps {
  selectedKey: string | null;
  onSelectPreset: (preset: DemoPresetDefinition) => void;
}

export default function DemoPresetSelector({
  selectedKey,
  onSelectPreset,
}: DemoPresetSelectorProps) {
  return (
    <div className="mb-6 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Fast-Track Demo Scenarios</span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-[#0F172A] mt-0.5">
            Select a Pre-Configured Industry Profile
          </h3>
          <p className="text-xs text-[#64748B]">
            Click any scenario to auto-fill verified business variables, location, and operational data.
          </p>
        </div>
        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100/80 px-2.5 py-1 rounded-full self-start sm:self-auto">
          5 Verified Presets
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {CONTROLLED_DEMO_PROFILES.map((preset) => {
          const isSelected = selectedKey === preset.presetKey;
          return (
            <button
              key={preset.presetKey}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className={`relative flex flex-col justify-between text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50/80 shadow-xs ring-2 ring-indigo-500/20"
                  : "border-[#E2E8F0] bg-white hover:border-indigo-300 hover:bg-slate-50/80"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="inline-block text-[10px] font-bold text-indigo-800 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                    {preset.badge}
                  </span>
                  {isSelected && (
                    <span className="h-4 w-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-[#0F172A] line-clamp-1 leading-snug">
                  {preset.businessName}
                </h4>
                <p className="text-[11px] text-[#64748B] line-clamp-2 mt-1 leading-relaxed">
                  {preset.tagline}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-[#64748B]">
                <span>{preset.district}, {preset.state}</span>
                <span className="font-semibold text-slate-700">{preset.employeeCount} staff</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
