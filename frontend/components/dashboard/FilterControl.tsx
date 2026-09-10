"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterControlProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  labelPrefix?: string;
  className?: string;
}

export function FilterControl({
  options,
  value,
  onChange,
  icon,
  labelPrefix,
  className = "",
}: FilterControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#f1f5f9] hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors cursor-pointer border border-transparent hover:border-slate-300/60"
      >
        {icon}
        {labelPrefix && <span className="text-slate-400 font-normal">{labelPrefix}:</span>}
        <span>{selectedOption?.label || value}</span>
        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-40 min-w-[180px] bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white font-bold"
                    : "hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FilterControl;
