"use client";

import React, { useEffect, useState } from "react";
import { Search, X, BookOpen, FileText, Scale, ArrowRight, ShieldCheck } from "lucide-react";
import { standards, documents, regulatoryChanges } from "@/lib/mockData";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTo?: (view: string) => void;
}

export function SearchModal({ isOpen, onClose, onNavigateTo }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Keyboard shortcut listener: Escape to close, Ctrl+K/Cmd+K to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredStandards = standards.filter(
    (s) =>
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDocs = documents.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRegs = regulatoryChanges.filter(
    (r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.gazette_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasResults =
    filteredStandards.length > 0 || filteredDocs.length > 0 || filteredRegs.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#08080a]/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[#121317] rounded-[10px] shadow-2xl border border-[#1c1d22] overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[#1c1d22] gap-3">
          <Search className="h-4 w-4 text-[#777a88] shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search standards, clauses, documents..."
            autoFocus
            className="w-full text-xs text-[#ffffff] placeholder:text-[#5e616e] focus:outline-none bg-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-[#777a88] hover:text-[#ffffff] p-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[11px] font-mono text-[#777a88] hover:text-[#ffffff] bg-[#1c1d22] border border-[#2e3038] px-2 py-0.5 rounded-[4px] cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {!hasResults ? (
            <div className="py-12 text-center text-[#777a88]">
              No matching standards, clauses, or documents found for &quot;{searchTerm}&quot;.
            </div>
          ) : (
            <>
              {/* Standards Category */}
              {filteredStandards.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold text-[#cc9166] uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="h-3 w-3 text-[#cc9166]" />
                    <span>Standards & Quality Control Orders</span>
                  </div>
                  <div className="space-y-1">
                    {filteredStandards.slice(0, 3).map((std) => (
                      <div
                        key={std.id}
                        onClick={() => {
                          onClose();
                          if (onNavigateTo) onNavigateTo("standards");
                        }}
                        className="flex items-center justify-between p-2.5 rounded-[8px] hover:bg-[#1c1d22] cursor-pointer border border-transparent hover:border-[#2e3038] transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#cc9166]">
                              {std.code}
                            </span>
                            <span className="text-[#ffffff] font-medium truncate">
                              {std.title}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#9194a1]">
                            {std.authority} · {std.scheme}
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-[#777a88] shrink-0 ml-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents Category */}
              {filteredDocs.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold text-[#cc9166] uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-3 w-3 text-[#cc9166]" />
                    <span>Statutory Documents</span>
                  </div>
                  <div className="space-y-1">
                    {filteredDocs.slice(0, 3).map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => {
                          onClose();
                          if (onNavigateTo) onNavigateTo("documents");
                        }}
                        className="flex items-center justify-between p-2.5 rounded-[8px] hover:bg-[#1c1d22] cursor-pointer border border-transparent hover:border-[#2e3038] transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-[#ffffff] truncate">
                            {doc.name}
                          </div>
                          <div className="text-[10px] text-[#9194a1]">
                            {doc.code} · {doc.authority} · {doc.status}
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-[#777a88] shrink-0 ml-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regulatory Updates Category */}
              {filteredRegs.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold text-[#cc9166] uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="h-3 w-3 text-[#cc9166]" />
                    <span>Gazette Orders & Circulars</span>
                  </div>
                  <div className="space-y-1">
                    {filteredRegs.slice(0, 2).map((reg) => (
                      <div
                        key={reg.id}
                        onClick={() => {
                          onClose();
                          if (onNavigateTo) onNavigateTo("updates");
                        }}
                        className="flex items-center justify-between p-2.5 rounded-[8px] hover:bg-[#1c1d22] cursor-pointer border border-transparent hover:border-[#2e3038] transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-[#cc9166] bg-[#1c1d22] px-1.5 py-0.5 rounded">
                              {reg.gazette_no}
                            </span>
                            <span className="font-medium text-[#ffffff] truncate">
                              {reg.title}
                            </span>
                          </div>
                          <div className="text-[10px] text-[#9194a1]">
                            {reg.authority} · Effective: {reg.effective_date}
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-[#777a88] shrink-0 ml-2" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-[#040406] border-t border-[#1c1d22] flex items-center justify-between text-[11px] text-[#777a88]">
          <span>Search spans 18 standards, 11 documents & 3 gazette orders</span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
}

export default SearchModal;
