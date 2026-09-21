"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageCode } from "@/locales";

interface LanguageSelectorProps {
  className?: string;
  compact?: boolean;
  dark?: boolean;
}

export function LanguageSelector({ className = "", compact = false, dark = false }: LanguageSelectorProps) {
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
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-2xs transition-colors cursor-pointer select-none focus:outline-hidden focus:ring-1 ${
          dark
            ? "border border-white/10 bg-[#101419]/90 hover:bg-[#151A1F] text-slate-200 focus:ring-white/20"
            : "border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-[#0F172A] focus:ring-slate-400"
        }`}
      >
        <Globe className={`h-3.5 w-3.5 shrink-0 ${dark ? "text-slate-400" : "text-[#64748B]"}`} />
        <span className="font-sans">
          {compact ? activeLang.label : `Language: ${activeLang.label}`}
        </span>
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-150 ${dark ? "text-slate-400" : "text-[#64748B]"} ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Available Languages"
          className={`absolute right-0 top-10 mt-1 w-44 rounded-[12px] p-1.5 shadow-2xl z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150 focus:outline-hidden ${
            dark
              ? "bg-[#101419] border border-white/12 text-slate-200"
              : "bg-white border border-[#E2E8F0] text-[#0F172A]"
          }`}
        >
          <div className={`px-2.5 py-1 text-[10px] font-semibold tracking-wider uppercase border-b mb-1 ${
            dark ? "text-slate-400 border-white/10" : "text-[#94A3B8] border-[#F1F5F9]"
          }`}>
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
                    ? dark
                      ? "bg-white text-[#06080A] font-medium"
                      : "bg-[#0F172A] text-white font-medium"
                    : dark
                      ? "hover:bg-white/10 text-slate-300 hover:text-white"
                      : "hover:bg-[#F8FAFC] text-[#334155] hover:text-[#0F172A]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-sans">{option.label}</span>
                </div>
                {isSelected ? (
                  <Check className={`h-3.5 w-3.5 shrink-0 ${dark ? "text-[#06080A]" : "text-white"}`} />
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
