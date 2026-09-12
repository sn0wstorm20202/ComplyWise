"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, ArrowRight } from "lucide-react";

interface DashboardAssistantCardProps {
  onNavigateToView: (view: string) => void;
}

export function DashboardAssistantCard({
  onNavigateToView,
}: DashboardAssistantCardProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const suggestions = [
    "Which standard applies to my product?",
    "What documents are required for BIS certification?",
    "Suggest a BIS recognized lab for testing",
    "Explain IS 374:2019 in simple words",
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/ai-assistant?q=${encodeURIComponent(query.trim())}`);
  }

  function handleSelectSuggestion(text: string) {
    router.push(`/ai-assistant?q=${encodeURIComponent(text)}`);
  }

  return (
    <div className="slash-card p-5 flex flex-col justify-between select-none">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1c1d22]">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-[#cc9166]/10 border border-[#cc9166]/20 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-[#cc9166]" />
            </div>
            <h2 className="text-sm font-semibold text-[#ffffff] tracking-tight">
              AI Assistant
            </h2>
          </div>

          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#121317] border border-[#1c1d22] text-[#cc9166]">
            Source Grounded
          </span>
        </div>

        {/* Message Bubble */}
        <div className="mt-3.5 p-3 rounded-[10px] bg-[#121317] border border-[#1c1d22] text-xs text-[#e2e3e9]">
          <p>
            Hello! I&apos;m your BIS AI Assistant. How can I help you today?
          </p>
        </div>

        {/* Suggestion Chips */}
        <div className="mt-3 space-y-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSelectSuggestion(s)}
              className="w-full text-left px-2.5 py-1.5 rounded-[8px] bg-[#08080a] hover:bg-[#121317] border border-[#1c1d22] hover:border-[#cc9166]/30 text-[11px] text-[#9194a1] hover:text-[#ffffff] transition-all truncate block cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="mt-4 pt-3 border-t border-[#1c1d22]">
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your question..."
            className="w-full text-xs text-[#ffffff] placeholder:text-[#5e616e] bg-[#121317] border border-[#1c1d22] rounded-full pl-3.5 pr-10 py-2 focus:outline-none focus:border-[#cc9166]"
          />
          <button
            type="submit"
            disabled={!query.trim()}
            className="absolute right-1.5 h-7 w-7 rounded-full bg-[#ffffff] hover:bg-white/90 disabled:opacity-30 flex items-center justify-center text-[#000000] transition-colors cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default DashboardAssistantCard;
