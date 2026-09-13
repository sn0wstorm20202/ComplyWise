"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import { AssistantCitation, Business, BisQueryResponse } from "@/types";
import { AnswerabilityBadge } from "@/components/assistant/AnswerabilityBadge";
import { ClaimDecompositionCard } from "@/components/assistant/ClaimDecompositionCard";
import { EvidenceCitationCard } from "@/components/assistant/EvidenceCitationCard";
import { ServiceDegradedAlert } from "@/components/assistant/ServiceDegradedAlert";
import { useLanguage } from "@/context/LanguageContext";

interface Message {
  id: string;
  sender: "user" | "copilot";
  content: string;
  citations?: AssistantCitation[];
  groundingLevel?: string;
  timestamp: string;
  bisResponse?: BisQueryResponse;
}

const SAMPLE_PROMPTS = [
  "What statutory approvals do I need before commencing commercial operations?",
  "Explain the environmental clearance conditions under Consent to Establish (CTE).",
  "Which BIS standards and Quality Control Orders (QCOs) apply to our product line?",
  "What capital subsidies or MSME grants can our enterprise claim?",
];

function renderMessageContent(content: string) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\[\d+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-[#0F172A]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (/^\[\d+\]$/.test(part)) {
        return (
          <span
            key={i}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300/80 align-baseline"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={`sp-${idx}`} className="h-1" />);
      return;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <div
          key={`h-${idx}`}
          className="font-bold text-xs sm:text-sm text-[#0F172A] mt-2 mb-1 border-b border-slate-200/80 pb-0.5 flex items-center gap-1.5"
        >
          {trimmed.replace(/^###\s*/, "")}
        </div>
      );
      return;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <div key={`b-${idx}`} className="flex items-start gap-2 pl-1.5 text-xs sm:text-sm text-[#334155] leading-relaxed">
          <span className="text-amber-600 font-bold shrink-0 mt-0.5">•</span>
          <span className="flex-1">{parseInline(trimmed.slice(2))}</span>
        </div>
      );
      return;
    }

    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`n-${idx}`} className="flex items-start gap-2 pl-1.5 text-xs sm:text-sm text-[#334155] leading-relaxed">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold shrink-0 mt-0.5 border border-amber-200">
            {numMatch[1]}
          </span>
          <span className="flex-1">{parseInline(numMatch[2])}</span>
        </div>
      );
      return;
    }

    elements.push(
      <p key={`p-${idx}`} className="text-xs sm:text-sm text-[#334155] leading-relaxed">
        {parseInline(trimmed)}
      </p>
    );
  });

  return <div className="space-y-1">{elements}</div>;
}

function AssistantContent() {
  const { t, language } = useLanguage();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams.get("business_id");
  const initialQuery = searchParams.get("q");

  const [business, setBusiness] = useState<Business | null>(null);
  const [businessId, setBusinessId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m0",
      sender: "copilot",
      content: t("assistant.welcome"),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length <= 1) {
        return [
          {
            id: "m0",
            sender: "copilot",
            content: business
              ? t("assistant.welcomeWithBusiness", { businessName: business.name })
              : t("assistant.welcome"),
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ];
      }
      return prev;
    });
  }, [language, business, t]);

  useEffect(() => {
    async function loadBiz() {
      const bid = paramBusinessId || localStorage.getItem("complywise_active_business_id") || "";
      try {
        if (bid) {
          const b = await api.businesses.get(bid);
          setBusiness(b);
          setBusinessId(b.id);
          return;
        }
      } catch {
        // bid was invalid or not found, fall back to list
      }

      try {
        const list = await api.businesses.list();
        if (list && list.length > 0) {
          const b = list[0];
          setBusiness(b);
          setBusinessId(b.id);
          localStorage.setItem("complywise_active_business_id", b.id);
        }
      } catch {
        // ignore
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
      const resp = await api.assistant.chat(text, businessId || null, null, language);
      const botMsg: Message = {
        id: `c-${Date.now()}`,
        sender: "copilot",
        content: resp.answer,
        citations: resp.citations,
        groundingLevel: resp.grounding_level,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        bisResponse: resp.bis_response,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      // Deterministic offline guidance when assistant service is unreachable
      // RULE: Never claim VERIFIED or emit synthetic evidence IDs on connection failure.
      setError("Compliance intelligence service is temporarily unreachable. Displaying unverified offline guidance.");
      const botMsg: Message = {
        id: `c-${Date.now()}`,
        sender: "copilot",
        content: `### ⚠️ Service Offline Notice\nThe compliance assistant backend is temporarily unreachable. No claims in this response have been verified against official statutory registers.\n\n### General Advisory Principles\n- For manufacturing and industrial facilities, consult your local State Pollution Control Board (SPCB) for Consent to Establish/Operate guidelines.\n- For products subject to compulsory certification, check the official BIS portal (manakonline.in) directly.\n- Check factory safety and inspectorate requirements under the Factories Act 1948 with your state Directorate of Industrial Safety.\n\n*Please reconnect to the network or retry your query to receive verified citations.*`,
        citations: [],
        groundingLevel: "UNVERIFIED_OFFLINE",
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
        <div className="bg-white rounded-[10px] border border-[#E2E8F0] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 text-[11px] font-semibold tracking-wider uppercase">
                {t("assistant.title")}
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-mono text-slate-600 border border-slate-200">
                {t("common.verified")}
              </span>
              {business && (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-mono text-emerald-700 border border-emerald-200 font-medium">
                  {business.name} · {t("common.active")}
                </span>
              )}
            </div>
            <h1 className="font-sans font-bold text-2xl sm:text-3xl text-[#0F172A] tracking-tight">
              {t("assistant.title")}
            </h1>
            <p className="text-xs text-[#64748B] mt-1.5 max-w-2xl leading-relaxed">
              {t("assistant.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3 relative z-10 shrink-0">
            <Link
              href={businessId ? `/dashboard?business_id=${businessId}` : "/dashboard"}
              className="rounded-full border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-semibold text-[#0F172A] hover:bg-slate-50 transition-colors shadow-2xs"
            >
              ← {t("navigation.dashboard")}
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
        <div className="flex-1 bg-white rounded-[10px] border border-[#E2E8F0] p-6 shadow-2xs space-y-6 min-h-[450px] overflow-y-auto">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.sender === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-2xl rounded-2xl p-5 text-xs sm:text-sm leading-relaxed ${
                  m.sender === "user"
                    ? "bg-[#0F172A] text-white border border-slate-800 shadow-2xs"
                    : "bg-[#F8FAFC] border border-[#E2E8F0] text-[#1E293B] space-y-3"
                }`}
              >
                {/* BIS Answerability Header */}
                {m.sender === "copilot" && m.bisResponse && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80">
                    <AnswerabilityBadge
                      state={m.bisResponse.answerability}
                      decision={m.bisResponse.decision}
                    />
                    {m.bisResponse.temporal?.status && (
                      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        Standard Status: {m.bisResponse.temporal.status}
                      </span>
                    )}
                  </div>
                )}

                {/* Message Body or Degraded Alert */}
                {m.sender === "copilot" &&
                m.bisResponse &&
                (m.bisResponse.answerability === "SERVICE_UNAVAILABLE" ||
                  m.bisResponse.answerability === "SYSTEM_FAILURE") ? (
                  <ServiceDegradedAlert
                    message={m.bisResponse.answer}
                    correlationId={m.bisResponse.correlation_id}
                  />
                ) : m.sender === "user" ? (
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                ) : (
                  renderMessageContent(m.content)
                )}

                {/* BIS Claim-Level Entailment Decomposition */}
                {m.sender === "copilot" &&
                  m.bisResponse?.claims &&
                  m.bisResponse.claims.length > 0 && (
                    <div className="pt-2">
                      <ClaimDecompositionCard claims={m.bisResponse.claims} />
                    </div>
                  )}

                {/* BIS Verified Evidence Citations */}
                {m.sender === "copilot" &&
                  m.bisResponse?.citations &&
                  m.bisResponse.citations.length > 0 && (
                    <div className="pt-2">
                      <EvidenceCitationCard citations={m.bisResponse.citations} />
                    </div>
                  )}

                {/* General Statutory Citations (when BIS citations card is not active) */}
                {m.sender === "copilot" &&
                  (!m.bisResponse?.citations || m.bisResponse.citations.length === 0) &&
                  m.citations &&
                  m.citations.length > 0 && (
                    <div className="pt-3 border-t border-[#E2E8F0] space-y-2 text-xs">
                      <div className="flex items-center justify-between font-semibold text-[#0F172A]">
                        <span className="text-[11px] uppercase tracking-wider text-[#64748B]">
                          {t ? t("assistant.statutorySources") : "Statutory Citations"} ({m.citations.length}):
                        </span>
                        {m.groundingLevel && (
                          <span className="text-[10px] uppercase font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            {m.groundingLevel}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {m.citations.map((c, i) => (
                          <div
                            key={i}
                            className="bg-white p-3.5 rounded-xl border border-[#E2E8F0] shadow-2xs text-[#475569] space-y-1.5"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-semibold text-[#0F172A]">{c.source_title}</span>
                              <span className="font-mono text-amber-700 font-semibold">{c.locator}</span>
                            </div>
                            <p className="text-[11px] italic text-[#64748B] leading-relaxed">
                              &ldquo;{c.excerpt}&rdquo;
                            </p>
                            {c.canonical_url && (
                              <a
                                href={c.canonical_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-amber-700 hover:text-amber-800 font-medium inline-flex items-center gap-1 pt-0.5"
                              >
                                <span>{t ? t("assistant.officialGazetteSource") : "Official Gazette Source"}</span>
                                <span>↗</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
              <span className="text-[10px] font-mono text-[#94A3B8] mt-1.5 px-1">{m.timestamp}</span>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-3 text-xs text-[#64748B] p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <span className="animate-spin text-amber-600">⚙️</span>
              <span>{t("assistant.thinking")}</span>
            </div>
          )}
        </div>

        {/* Suggested Prompt Chips */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
            {t("assistant.suggestedQueries")}
          </span>
          <div className="flex flex-wrap gap-2">
            {[t("assistant.askPreset1"), t("assistant.askPreset2"), t("assistant.askPreset3")].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleSend(p)}
                disabled={loading}
                className="text-xs bg-white border border-[#E2E8F0] hover:border-amber-500 hover:text-[#0F172A] rounded-full px-4 py-2 text-[#64748B] transition-all text-left disabled:opacity-50 cursor-pointer shadow-2xs"
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
          className="bg-white rounded-full border border-[#E2E8F0] p-1.5 shadow-xs flex items-center gap-2 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/10 transition-colors"
        >
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder={t("assistant.promptPlaceholder")}
            disabled={loading}
            className="flex-1 px-5 py-2 text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none bg-transparent"
          />
          <button
            type="submit"
            disabled={loading || !inputPrompt.trim()}
            className="rounded-full bg-[#0F172A] px-6 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40 transition-all shadow-xs shrink-0 cursor-pointer"
          >
            {t("assistant.send")}
          </button>
        </form>
      </div>
    </AppShell>
  );
}

export default function AssistantPage() {
  const { t } = useLanguage();
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-xs text-[#64748B]">
          {t("common.loading")}
        </div>
      }
    >
      <AssistantContent />
    </Suspense>
  );
}
