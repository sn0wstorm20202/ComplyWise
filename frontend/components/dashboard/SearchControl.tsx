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
      className={`h-9 w-9 rounded-[8px] bg-[#17191C] hover:bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[#A1A1AA] hover:text-[#F5F5F3] transition-colors cursor-pointer ${className}`}
    >
      <Search className="h-4 w-4" />
    </button>
  );
}

export default SearchControl;
