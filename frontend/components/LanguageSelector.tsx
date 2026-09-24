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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E2E8F0] dark:border-white/15 bg-white dark:bg-[#141A21] hover:bg-[#F8FAFD] dark:hover:bg-white/10 text-xs font-semibold text-[#0B1220] dark:text-[#F7F9FC] shadow-2xs transition-colors cursor-pointer select-none focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
      >
        <Globe className="h-3.5 w-3.5 text-[#475569] dark:text-[#A8B2BE] shrink-0" />
        <span className="font-sans">
          {compact ? activeLang.label : `Language: ${activeLang.label}`}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-[#475569] dark:text-[#A8B2BE] transition-transform duration-150 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Available Languages"
          className="absolute right-0 top-10 mt-1 w-48 rounded-2xl bg-white dark:bg-[#0E1318] border border-[#E2E8F0] dark:border-white/15 p-1.5 shadow-2xl z-50 text-xs text-[#0B1220] dark:text-[#F7F9FC] animate-in fade-in slide-in-from-top-2 duration-150 focus:outline-hidden"
        >
          <div className="px-2.5 py-1.5 text-xs font-bold tracking-wider uppercase text-[#475569] dark:text-[#A8B2BE] border-b border-[#F1F5F9] dark:border-white/10 mb-1">
            {t("language.selectorLabel")}
          </div>

          <div className="space-y-0.5">
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
                  className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[#0B1220] dark:bg-blue-600 text-white font-semibold"
                      : "hover:bg-[#F8FAFD] dark:hover:bg-white/10 text-[#334155] dark:text-[#D4DBE4] hover:text-[#0B1220] dark:hover:text-white"
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
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;
