"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import { AssistantCitation } from "@/types";

interface Message {
  id: string;
  sender: "user" | "copilot";
  content: string;
  citations?: AssistantCitation[];
  groundingLevel?: string;
  timestamp: string;
}

const SAMPLE_PROMPTS = [
  "Do I need an FSSAI state licence or central licence for ₹8.5 Cr turnover?",
  "What are the consent to establish requirements for industrial effluent?",
  "Which BIS standards are mandatory for IT equipment and power modules?",
];

export default function AssistantPage() {
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
      const resp = await api.assistant.chat(text);
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
              href="/dashboard"
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
              } space-y-2`}
            >
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-600">
                  {m.sender === "user" ? "You" : "ComplyWise Copilot"}
                </span>
                <span>·</span>
                <span>{m.timestamp}</span>
              </div>

              <div
                className={`rounded-2xl p-4 max-w-2xl text-xs sm:text-sm leading-relaxed ${
                  m.sender === "user"
                    ? "bg-indigo-600 text-white rounded-tr-xs shadow-xs"
                    : "bg-slate-50 text-slate-900 border border-slate-200/80 rounded-tl-xs shadow-2xs"
                }`}
              >
                {m.content}
              </div>

              {/* Citations Card Trace */}
              {m.citations && m.citations.length > 0 && (
                <div className="w-full max-w-2xl space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Statutory Evidence Citations ({m.citations.length})
                  </span>
                  <div className="space-y-2">
                    {m.citations.map((c, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-indigo-700">
                            {c.source_title} ({c.authority})
                          </span>
                          <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                            {c.verification_status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-700 font-mono bg-slate-50 p-2 rounded border border-slate-100">
                          {c.locator}: &ldquo;{c.excerpt}&rdquo;
                        </div>
                        {c.canonical_url && (
                          <div className="flex justify-end">
                            <a
                              href={c.canonical_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                            >
                              Official Reference ↗
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 max-w-md">
              <div className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
              <span className="text-xs text-slate-600 font-medium">
                Searching statutory evidence and formulating legal guidance...
              </span>
            </div>
          )}
        </div>

        {/* Prompt Suggestions */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-500">
            Suggested Statutory Queries:
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(p)}
                disabled={loading}
                className="text-left rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 disabled:opacity-50 transition-colors shadow-2xs"
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
          className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs flex items-center gap-2"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Ask any statutory question (e.g. FSSAI threshold, pollution consent, factory returns)..."
            disabled={loading}
            className="flex-1 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !inputPrompt.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs"
          >
            <span>Ask</span>
            <span>→</span>
          </button>
        </form>
      </main>
    </div>
  );
}
