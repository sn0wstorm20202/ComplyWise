"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  LanguageCode,
  LanguageMeta,
  SUPPORTED_LANGUAGES,
  translations,
} from "@/locales";

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  supportedLanguages: LanguageMeta[];
}

const STORAGE_KEY = "complywise_language";

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: string) => key,
  supportedLanguages: SUPPORTED_LANGUAGES,
});

function resolveKey(obj: Record<string, unknown> | null | undefined, keyPath: string): string | null {
  if (!obj) return null;
  const parts = keyPath.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }
  return typeof current === "string" ? current : null;
}

function interpolate(template: string, variables?: Record<string, string | number>): string {
  if (!variables) return template;
  let result = template;
  for (const [k, v] of Object.entries(variables)) {
    const valStr = String(v);
    // Replace {key}
    result = result.split(`{${k}}`).join(valStr);
    // Replace {{key}}
    result = result.split(`{{${k}}}`).join(valStr);
  }
  return result;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  // Restore saved language preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === "en" || saved === "hi" || saved === "bn")) {
        setLanguageState(saved as LanguageCode);
        document.documentElement.lang = saved;
      }
    } catch {
      // localStorage may be disabled or restricted
    }
  }, []);

  const setLanguage = useCallback((lang: LanguageCode) => {
    if (lang !== "en" && lang !== "hi" && lang !== "bn") return;
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, []);

  const t = useCallback(
    (key: string, variables?: Record<string, string | number>): string => {
      // 1. Look up in active language catalog
      const activeCatalog = translations[language] || translations["en"];
      let value = resolveKey(activeCatalog, key);

      // 2. Fallback to English catalog if missing
      if (!value && language !== "en") {
        value = resolveKey(translations["en"], key);
      }

      // 3. Fallback to raw key if not found
      if (!value) {
        return key;
      }

      // 4. Interpolate variables
      return interpolate(value, variables);
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
