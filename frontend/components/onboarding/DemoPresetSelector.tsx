"use client";

import React from "react";
import { DemoPresetDefinition } from "@/data/demo/controlledPresets";
import { BUSINESS_STARTERS } from "@/data/businessStarters";
import { Check, Sparkles } from "lucide-react";

interface DemoPresetSelectorProps {
  selectedKey: string | null;
  onStartOwn: () => void;
  onSelectPreset: (preset: DemoPresetDefinition) => void;
}

export default function DemoPresetSelector({
  selectedKey,
  onSelectPreset,
  onStartOwn,
}: DemoPresetSelectorProps) {
  return (
    <div className="mb-6 rounded-2xl border border-[var(--ui-sage-soft)] bg-gradient-to-br from-[var(--ui-sage-faint)]/70 via-white to-[var(--ui-bg)] p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ui-sage)] uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Starting profiles</span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-[var(--ui-text)] mt-0.5">
            Choose a starting point
          </h3>
          <p className="text-xs text-[var(--ui-secondary)]">
            We've prepared a starting profile. You can change anything before continuing.
          </p>
        </div>
        <span className="text-[11px] font-semibold text-[var(--ui-sage)] bg-[var(--ui-sage-soft)]/80 px-2.5 py-1 rounded-full self-start sm:self-auto">
          Optional
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {BUSINESS_STARTERS.map((preset) => {
          const isSelected = selectedKey === preset.presetKey;
          return (
            <button
              key={preset.presetKey}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectPreset(preset)}
              className={`relative flex flex-col justify-between text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? "border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)]/80 shadow-xs ring-2 ring-[var(--ui-sage-soft)]/20"
                  : "border-[var(--ui-border)] bg-white hover:border-[var(--ui-sage-soft)] hover:bg-[var(--ui-bg)]/80"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="inline-block text-[10px] font-bold text-[var(--ui-sage)] bg-[var(--ui-sage-soft)]/70 px-2 py-0.5 rounded-full">
                    {preset.badge}
                  </span>
                  {isSelected && (
                    <span className="h-4 w-4 rounded-full bg-[var(--ui-sage)] text-white flex items-center justify-center shrink-0">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-[var(--ui-text)] line-clamp-1 leading-snug">
                  {preset.businessName}
                </h4>
                <p className="text-[11px] text-[var(--ui-secondary)] line-clamp-2 mt-1 leading-relaxed">
                  {preset.tagline}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-[var(--ui-border)] flex items-center justify-between text-[10px] text-[var(--ui-secondary)]">
                <span>{preset.district}, {preset.state}</span>
                <span className="font-semibold text-[var(--ui-secondary)]">{preset.employeeCount} staff</span>
              </div>
            </button>
          );
        })}
      </div>
      <button type="button" className="ui-button mt-4" onClick={onStartOwn}>Start from my own business →</button>
    </div>
  );
}
