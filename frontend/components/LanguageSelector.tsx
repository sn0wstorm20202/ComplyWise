"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageCode } from "@/locales";

interface LanguageSelectorProps {
  className?: string;
  compact?: boolean;
}

export function LanguageSelector({ className = "", compact = false }: LanguageSelectorProps) {
  const { language, setLanguage, supportedLanguages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Current active language label
  const activeLang = supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select Language"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-semibold text-[#0F172A] shadow-2xs transition-colors cursor-pointer select-none focus:outline-hidden focus:ring-1 focus:ring-slate-400`}
      >
        <Globe className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
        <span className="font-sans">
          {compact ? activeLang.label : `Language: ${activeLang.label}`}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-[#64748B] transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Available Languages"
          className="absolute right-0 top-10 mt-1 w-44 rounded-[12px] bg-white border border-[#E2E8F0] p-1.5 shadow-xl z-50 text-xs text-[#0F172A] animate-in fade-in slide-in-from-top-2 duration-150 focus:outline-hidden"
        >
          <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase text-[#94A3B8] border-b border-[#F1F5F9] mb-1">
            {t("language.selectorLabel")}
          </div>

          {supportedLanguages.map((option) => {
            const isSelected = option.code === language;
            return (
              <button
                key={option.code}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setLanguage(option.code as LanguageCode);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-[8px] flex items-center justify-between text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#0F172A] text-white font-medium"
                    : "hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-sans">{option.label}</span>
                </div>
                {isSelected ? (
                  <Check className="h-3.5 w-3.5 text-white shrink-0" />
                ) : (
                  <span className="w-3.5" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
