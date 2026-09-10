"use client";

import React, { useEffect } from "react";
import { Search } from "lucide-react";

export interface SearchControlProps {
  onOpenSearch: () => void;
  className?: string;
}

export function SearchControl({ onOpenSearch, className = "" }: SearchControlProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenSearch();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenSearch]);

  return (
    <button
      type="button"
      aria-label="Quick Search"
      title="Search BIS standards and compliance mandates (Cmd+K)"
      onClick={onOpenSearch}
      className={`h-10 w-10 rounded-full bg-white hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer ${className}`}
    >
      <Search className="h-4 w-4" />
    </button>
  );
}

export default SearchControl;
