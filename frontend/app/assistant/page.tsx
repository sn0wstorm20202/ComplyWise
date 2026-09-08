"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate regulatory response.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-600 tracking-wide uppercase">
                Screen 15 · AI Regulatory Copilot
              </span>
              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">
                Source Grounded
              </span>
              {business && (
                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  {business.name} Context Active
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 mt-1">
              Statutory Evidence Copilot
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Natural language regulatory advice strictly anchored in verified central and state statutory citations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={businessId ? `/dashboard?business_id=${businessId}` : "/dashboard"}
              className="rounded-lg border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
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
        <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6 min-h-[450px] overflow-y-auto">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  m.sender === "user"
                    ? "bg-indigo-600 text-white shadow-xs rounded-br-xs"
                    : "bg-slate-50 border border-slate-200/80 text-slate-800 rounded-bl-xs space-y-3"
                }`}
              >
                <div className="whitespace-pre-wrap">{m.content}</div>

                {/* Grounding & Citations */}
                {m.sender === "copilot" && m.citations && m.citations.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-700">
                      <span>Statutory Citations ({m.citations.length}):</span>
                      {m.groundingLevel && (
                        <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {m.groundingLevel}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {m.citations.map((c, i) => (
                        <div
                          key={i}
                          className="bg-white p-2.5 rounded-lg border border-slate-200/90 text-slate-600 space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                            <span>{c.source_title}</span>
                            <span className="font-mono text-indigo-600">{c.locator}</span>
                          </div>
                          <p className="text-[11px] italic text-slate-500">
                            &ldquo;{c.excerpt}&rdquo;
                          </p>
                          {c.canonical_url && (
                            <a
                              href={c.canonical_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-indigo-600 hover:underline block pt-0.5"
                            >
                              Official Gazette Source ↗
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 p-2">
              <span className="animate-spin text-indigo-600">⚙️</span>
              <span>Consulting statutory knowledge base and official citations...</span>
            </div>
          )}
        </div>

        {/* Suggested Prompt Chips */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Suggested Prompts:
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleSend(p)}
                disabled={loading}
                className="text-xs bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-lg px-3 py-1.5 text-slate-700 transition-all text-left disabled:opacity-50"
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
          className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask anything about statutory compliance, permits, documents, or subsidies..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm focus:outline-none bg-transparent"
          />
          <button
            type="submit"
            disabled={loading || !inputPrompt.trim()}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs"
          >
            Send
          </button>
        </form>
      </main>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
          Loading AI Copilot...
        </div>
      }
    >
      <AssistantContent />
    </Suspense>
  );
}
