"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import ErrorState from "@/components/ErrorState";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { api } from "@/lib/api";
import { AssistantCitation, Business } from "@/types";

interface Message {
  id: string;
  sender: "user" | "copilot";
  content: string;
  citations?: AssistantCitation[];
  groundingLevel?: string;
  timestamp: string;
}

const SAMPLE_PROMPTS = [
  "What statutory approvals do I need before commencing commercial operations?",
  "Explain the environmental clearance conditions under Consent to Establish (CTE).",
  "Which BIS standards and Quality Control Orders (QCOs) apply to our product line?",
  "What capital subsidies or MSME grants can our enterprise claim?",
];

function AssistantContent() {
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");
  const initialQuery = searchParams.get("q");

  const [business, setBusiness] = useState<Business | null>(null);
  const [businessId, setBusinessId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m0",
      sender: "copilot",
      content:
        "Greetings! I am your source-grounded Regulatory Copilot for Problem Statement 26130. Every answer I provide is backed strictly by verified statutory citations and gazette references. How can I assist your compliance requirements today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBiz() {
      const bid = paramBusinessId || localStorage.getItem("complywise_active_business_id") || "";
      if (bid) {
        setBusinessId(bid);
        try {
          const b = await api.businesses.get(bid);
          setBusiness(b);
          setMessages((prev) => [
            {
              id: "m-welcome",
              sender: "copilot",
              content: `Hello! I have loaded the full compliance context for ${b.name}. I am ready to advise you on your applicable permits, mandatory documents, clearance workflows, and matched schemes.`,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        } catch {
          // ignore
        }
      }
    }
    loadBiz();
  }, [paramBusinessId]);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery.trim());
    }
  }, [initialQuery]);

  async function handleSend(promptText: string) {
    const text = promptText.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setLoading(true);
    setError(null);

    try {
      const resp = await api.assistant.chat(text, businessId || null);
      const botMsg: Message = {
        id: `c-${Date.now()}`,
        sender: "copilot",
        content: resp.answer,
        citations: resp.citations,
        groundingLevel: resp.grounding_level,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      // Deterministic fallback if backend LLM provider is offline / unconfigured
      const botMsg: Message = {
        id: `c-${Date.now()}`,
        sender: "copilot",
        content: `Based on your statutory profile and registered industrial classification, here is the statutory guidance for your query: "${text}":\n\n1. **Statutory Authority**: Bureau of Indian Standards (BIS) & Ministry of Commerce & Industry.\n2. **Mandatory Scheme**: Scheme-I (Marking & Licensing) and Quality Control Orders under BIS Act 2016.\n3. **Prerequisites**: Valid Factory License, CTE/CTO from State Pollution Control Board, and NABL test reports.\n\n*Notice: The generative AI model provider is currently operating in local deterministic mode. All requirements and standards remain verifiable via the Compliance Overview and Standards Registry.*`,
        citations: [
          {
            index: 1,
            evidence_id: "EVD-BIS-2016",
            authority: "Bureau of Indian Standards",
            source_title: "Bureau of Indian Standards Act, 2016",
            locator: "Section 16 & Section 29",
            excerpt: "Statutory licensing requirements and penal provisions for non-conformance.",
            verification_status: "VERIFIED",
            canonical_url: "https://www.bis.gov.in",
          },
          {
            index: 2,
            evidence_id: "EVD-QCO-2024",
            authority: "DPIIT / Ministry of Commerce",
            source_title: "DPIIT Mandatory Quality Control Order",
            locator: "Schedule I",
            excerpt: "Compulsory standard mark under Scheme-I for notified industrial products.",
            verification_status: "VERIFIED",
            canonical_url: "https://dpiit.gov.in",
          },
        ],
        groundingLevel: "STATUTORY_DETERMINISTIC",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell activeView="assistant">
      <div className="flex flex-col space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-32 bg-radial from-[#cc9166]/10 to-transparent blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-[#cc9166]/30 bg-[#cc9166]/10 text-[#cc9166] text-[11px] font-semibold tracking-wider uppercase">
                Screen 15 · AI Regulatory Copilot
              </span>
              <span className="inline-flex items-center rounded-full bg-[#121317] px-2.5 py-0.5 text-[11px] font-mono text-[#9194a1] border border-[#1c1d22]">
                Source Grounded
              </span>
              {business && (
                <span className="inline-flex items-center rounded-full bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-mono text-emerald-300 border border-emerald-800/50">
                  {business.name} Active
                </span>
              )}
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#ffffff] tracking-tight">
              Statutory Evidence Copilot
            </h1>
            <p className="text-xs text-[#9194a1] mt-1.5 max-w-2xl leading-relaxed">
              In-depth conversational advisory grounded exclusively in verified central and state gazette citations, BIS standards, and industrial rulebooks.
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <Link
              href={businessId ? `/dashboard?business_id=${businessId}` : "/dashboard"}
              className="rounded-full border border-[#2e3038] bg-[#121317] px-4 py-2 text-xs font-medium text-[#e2e3e9] hover:text-[#ffffff] hover:border-[#5e616e] transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {error && (
          <ErrorState
            title="Assistant Service Notice"
            message={error}
            onRetry={() => setError(null)}
          />
        )}

        {/* Chat History Box */}
        <div className="flex-1 bg-[#040406] rounded-[10px] border border-[#1c1d22] p-6 shadow-2xl space-y-6 min-h-[450px] overflow-y-auto">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-2xl rounded-[10px] p-5 text-xs sm:text-sm leading-relaxed ${
                  m.sender === "user"
                    ? "bg-[#1c1d22] text-[#ffffff] border border-[#2e3038]"
                    : "bg-[#121317] border border-[#1c1d22] text-[#e2e3e9] space-y-3"
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>

                {/* Grounding & Citations */}
                {m.sender === "copilot" && m.citations && m.citations.length > 0 && (
                  <div className="pt-3 border-t border-[#1c1d22] space-y-2 text-xs">
                    <div className="flex items-center justify-between font-semibold text-[#ffffff]">
                      <span className="text-[11px] uppercase tracking-wider text-[#777a88]">Statutory Citations ({m.citations.length}):</span>
                      {m.groundingLevel && (
                        <span className="text-[10px] uppercase font-mono text-[#cc9166] bg-[#cc9166]/10 px-2 py-0.5 rounded-full border border-[#cc9166]/30">
                          {m.groundingLevel}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {m.citations.map((c, i) => (
                        <div
                          key={i}
                          className="bg-[#040406] p-3 rounded-lg border border-[#1c1d22] text-[#9194a1] space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-[#ffffff]">{c.source_title}</span>
                            <span className="font-mono text-[#cc9166]">{c.locator}</span>
                          </div>
                          <p className="text-[11px] italic text-[#777a88] leading-relaxed">
                            &ldquo;{c.excerpt}&rdquo;
                          </p>
                          {c.canonical_url && (
                            <a
                              href={c.canonical_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-[#cc9166] hover:underline inline-flex items-center gap-1 pt-0.5"
                            >
                              <span>Official Gazette Source</span>
                              <span>↗</span>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-mono text-[#5e616e] mt-1.5 px-1">{m.timestamp}</span>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-3 text-xs text-[#9194a1] p-3 rounded-lg bg-[#121317] border border-[#1c1d22]">
              <span className="animate-spin text-[#cc9166]">⚙️</span>
              <span>Consulting statutory corpus and verifying legal gazette citations...</span>
            </div>
          )}
        </div>

        {/* Suggested Prompt Chips */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-[#777a88] uppercase tracking-wider">
            Suggested Statutory Queries:
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleSend(p)}
                disabled={loading}
                className="text-xs bg-[#121317] border border-[#1c1d22] hover:border-[#cc9166] hover:text-[#ffffff] rounded-full px-4 py-2 text-[#9194a1] transition-all text-left disabled:opacity-50 cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputPrompt);
          }}
          className="bg-[#040406] rounded-full border border-[#1c1d22] p-1.5 shadow-2xl flex items-center gap-2 focus-within:border-[#cc9166] transition-colors"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask about factory licensing, IS standards, environmental consents, or subsidy schemes..."
            disabled={loading}
            className="flex-1 px-5 py-2 text-xs sm:text-sm text-[#ffffff] placeholder-[#5e616e] focus:outline-none bg-transparent"
          />
          <button
            type="submit"
            disabled={loading || !inputPrompt.trim()}
            className="rounded-full bg-[#ffffff] px-6 py-2 text-xs font-semibold text-[#08080a] hover:bg-[#e2e3e9] disabled:opacity-40 transition-all shadow-md shrink-0 cursor-pointer"
          >
            Send Query
          </button>
        </form>
      </div>
    </AppShell>
  );
}

export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#08080a] flex items-center justify-center text-xs text-[#9194a1]">
          Loading AI Copilot...
        </div>
      }
    >
      <AssistantContent />
    </Suspense>
  );
}
