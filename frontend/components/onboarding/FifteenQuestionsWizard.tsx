"use client";
import { ProductMotion } from "@/components/product/ProductMotion";

import React, { useState, useEffect, useRef } from "react";
import { OrchestrationQuestion } from "@/lib/api/orchestration";
import {
  Check,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Calendar,
  IndianRupee,
  Percent,
} from "lucide-react";

interface FifteenQuestionsWizardProps {
  questions: OrchestrationQuestion[];
  activeQuestionIndex: number;
  onSelectQuestionIndex: (idx: number) => void;
  onAnswerSubmitted: (questionId: string, value: any) => Promise<void>;
  onPrefillAllAnswers?: () => Promise<void>;
  hasPresetAnswers?: boolean;
  presetName?: string;
  onCompleteQuestions: () => void | Promise<void>;
  onBackToProducts: () => void;
  loading?: boolean;
}

export default function FifteenQuestionsWizard({
  questions,
  activeQuestionIndex,
  onSelectQuestionIndex,
  onAnswerSubmitted,
  onPrefillAllAnswers,
  hasPresetAnswers = false,
  presetName = "Selected Profile",
  onCompleteQuestions,
  onBackToProducts,
  loading = false,
}: FifteenQuestionsWizardProps) {
  const currentQ = questions[activeQuestionIndex];
  const [currentValue, setCurrentValue] = useState<any>(() => {
    const raw = currentQ?.current_value ?? currentQ?.suggested_answer;
    if (raw && typeof raw === "object" && "value" in raw) {
      return raw.value;
    }
    return raw ?? "";
  });
  const [currentExplanation, setCurrentExplanation] = useState<string>(() => {
    const raw = currentQ?.current_value;
    if (raw && typeof raw === "object" && "explanation" in raw) {
      return raw.explanation || "";
    }
    return "";
  });
  const [saving, setSaving] = useState<boolean>(false);
  const submissionInFlight = useRef(false);
  const [error, setError] = useState<string | null>(null);

  // Sync current value and explanation whenever active question changes
  useEffect(() => {
    if (currentQ) {
      const raw = currentQ.current_value ?? currentQ.suggested_answer;
      if (raw && typeof raw === "object" && "value" in raw) {
        setCurrentValue(raw.value !== undefined && raw.value !== null ? raw.value : "");
        setCurrentExplanation(raw.explanation || "");
      } else {
        setCurrentValue(raw !== undefined && raw !== null ? raw : "");
        setCurrentExplanation("");
      }
      setError(null);
    }
  }, [currentQ, activeQuestionIndex]);

  if (!currentQ || questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[var(--ui-border)] p-8 text-center space-y-4">
        <p className="text-sm font-semibold text-[var(--ui-secondary)]">
          Loading compliance questions...
        </p>
      </div>
    );
  }

  const answeredCount = questions.filter((q) => q.is_answered).length;
  const isLastQuestion = activeQuestionIndex === questions.length - 1;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  async function handleSaveCurrentAndGo(targetIdx?: number) {
    if (submissionInFlight.current) return;
    setError(null);
    const finalExplanation = currentExplanation.trim();
    let effectiveValue = currentValue;

    // If user provided custom explanation text, use it as answer even if no radio option was selected
    if ((effectiveValue === null || effectiveValue === undefined || effectiveValue === "" || effectiveValue === "OTHER") && finalExplanation) {
      effectiveValue = finalExplanation;
    }

    if (effectiveValue === null || effectiveValue === undefined || effectiveValue === "") {
      if (targetIdx !== undefined) {
        onSelectQuestionIndex(targetIdx);
        return;
      }
      if (currentQ.required) {
        setError("Please provide an answer or enter your custom response below before advancing.");
        return;
      }
    }

    const submissionPayload = finalExplanation
      ? { value: effectiveValue, explanation: finalExplanation, custom_text: finalExplanation }
      : effectiveValue;

    submissionInFlight.current = true;
    setSaving(true);
    try {
      await onAnswerSubmitted(currentQ.question_id, submissionPayload);
      if (targetIdx !== undefined) {
        onSelectQuestionIndex(targetIdx);
      } else if (!isLastQuestion) {
        onSelectQuestionIndex(activeQuestionIndex + 1);
      } else {
        await onCompleteQuestions();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save answer. Please try again.");
    } finally {
      submissionInFlight.current = false;
      setSaving(false);
    }
  }

  return (
    <ProductMotion stateKey={activeQuestionIndex} className="bg-white rounded-2xl border border-[var(--ui-border)] p-6 sm:p-8 shadow-2xs space-y-6">
      {/* Top Header with Progress and Step Navigator */}
      <div className="border-b border-[var(--ui-border)] pb-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[var(--ui-sage-soft)] text-[var(--ui-sage)]">
                {currentQ.category || "General Compliance"}
              </span>
              <span className="text-xs font-semibold text-[var(--ui-secondary)]">
                Question {activeQuestionIndex + 1} of {questions.length}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--ui-text)]">
              Only answer what changes the answer.
            </h2>
            <p className="text-xs text-[var(--ui-secondary)] mt-0.5">
              We're filling in the details that matter for your business.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[var(--ui-inset)] text-[var(--ui-text)] border border-[var(--ui-border)]">
              {answeredCount} / {questions.length} Answered ({Math.round((answeredCount / questions.length) * 100)}%)
            </span>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div role="progressbar" aria-label="Building your business context" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100} className="w-full bg-[var(--ui-inset)] h-2 rounded-full overflow-hidden">
          <div
            className="bg-[var(--ui-sage)] h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 15 Circular Step Pills */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
          {questions.map((q, idx) => {
            const isActive = idx === activeQuestionIndex;
            const isDone = q.is_answered;
            return (
              <button
                key={q.question_id || idx}
                type="button"
                onClick={() => handleSaveCurrentAndGo(idx)}
                title={`Question ${idx + 1}: ${q.question}`}
                className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full text-xs font-bold flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-[var(--ui-sage)] text-white ring-3 ring-[var(--ui-sage-soft)]"
                    : isDone
                    ? "bg-[var(--ui-sage)] text-white hover:bg-[var(--ui-sage)]"
                    : "bg-[var(--ui-inset)] text-[var(--ui-secondary)] hover:bg-[var(--ui-inset)]"
                }`}
              >
                {isDone && !isActive ? (
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                ) : (
                  idx + 1
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Question Body */}
      <div className="rounded-2xl border border-[var(--ui-border)] bg-[var(--ui-bg)]/50 p-6 space-y-5">
        {/* Question Text */}
        <div className="space-y-1.5">
          <h3 className="text-lg sm:text-xl font-bold text-[var(--ui-text)] leading-snug">
            {currentQ.question}
          </h3>
        </div>
        {!currentQ.is_answered && currentQ.suggested_answer_origin === "STARTER_PROFILE" && currentQ.suggested_answer !== null && currentQ.suggested_answer !== undefined && (
          <p className="text-xs text-[var(--ui-sage)]" role="status">Suggested from your starting profile — change it if needed, then save to confirm.</p>
        )}

        {/* "Why We Ask This" Contextual Explanation */}
        {(currentQ.help_text || currentQ.reason) && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)]/60 text-xs text-[var(--ui-sage)]">
            <HelpCircle className="h-4 w-4 text-[var(--ui-sage)] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">Why We Ask This: </span>
              <span>{currentQ.help_text || currentQ.reason}</span>
            </div>
          </div>
        )}

        {/* Dynamic Rich Typed Answer Input Control */}
        <div className="pt-2">
          {/* TYPE: BOOLEAN */}
          {currentQ.answer_type === "BOOLEAN" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <button
                type="button"
                onClick={() => setCurrentValue(true)}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  currentValue === true
                    ? "border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)] text-[var(--ui-sage)] ring-2 ring-[var(--ui-sage-soft)]/20 shadow-xs"
                    : "border-[var(--ui-border)] bg-white hover:border-[var(--ui-sage-soft)] text-[var(--ui-secondary)]"
                }`}
              >
                <div className="flex items-center gap-2.5 font-bold text-sm">
                  <CheckCircle2
                    className={`h-5 w-5 ${
                      currentValue === true ? "text-[var(--ui-sage)]" : "text-[var(--ui-muted)]"
                    }`}
                  />
                  <span>Yes</span>
                </div>
                {currentValue === true && (
                  <span className="h-2 w-2 rounded-full bg-[var(--ui-sage)]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setCurrentValue(false)}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  currentValue === false
                    ? "border-[var(--ui-border-strong)] bg-[var(--ui-text)] text-white shadow-xs"
                    : "border-[var(--ui-border)] bg-white hover:border-[var(--ui-border-strong)] text-[var(--ui-secondary)]"
                }`}
              >
                <div className="flex items-center gap-2.5 font-bold text-sm">
                  <XCircle
                    className={`h-5 w-5 ${
                      currentValue === false ? "text-white" : "text-[var(--ui-muted)]"
                    }`}
                  />
                  <span>No</span>
                </div>
                {currentValue === false && (
                  <span className="h-2 w-2 rounded-full bg-white" />
                )}
              </button>
            </div>
          )}

          {/* TYPE: NUMBER */}
          {currentQ.answer_type === "NUMBER" && (
            <div className="max-w-xs space-y-1.5">
              <div className="relative rounded-xl border border-[var(--ui-border-strong)] bg-white shadow-2xs focus-within:border-[var(--ui-sage-soft)] focus-within:ring-1 focus-within:ring-[var(--ui-sage-soft)]">
                <input
                  type="number"
                  min="0"
                  value={currentValue === "" ? "" : currentValue}
                  onChange={(e) =>
                    setCurrentValue(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="Enter numeric quantity"
                  className="w-full px-3.5 py-2.5 text-base font-semibold text-[var(--ui-text)] rounded-xl outline-none"
                />
                {currentQ.unit && (
                  <span className="absolute right-3 top-2.5 text-xs font-semibold text-[var(--ui-secondary)] bg-[var(--ui-inset)] px-2 py-0.5 rounded">
                    {currentQ.unit}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TYPE: SINGLE_SELECT */}
          {currentQ.answer_type === "SINGLE_SELECT" && (
            <div className="space-y-2.5 max-w-xl">
              {[
                ...(currentQ.options || []),
                ...((currentQ.options || []).some((o) => o.value === "OTHER" || o.value.toLowerCase().includes("other"))
                  ? []
                  : [{ value: "OTHER", label: "Other / Custom Specification (describe below)" }]),
              ].map((opt) => {
                const isSelected = currentValue === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCurrentValue(opt.value)}
                    className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)]/70 text-[var(--ui-sage)] font-bold ring-2 ring-[var(--ui-sage-soft)]/20 shadow-xs"
                        : "border-[var(--ui-border)] bg-white hover:border-[var(--ui-sage-soft)] text-[var(--ui-secondary)]"
                    }`}
                  >
                    <span className="text-sm">{opt.label}</span>
                    <span
                      className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? "border-[var(--ui-sage-soft)] bg-[var(--ui-sage)] text-white"
                          : "border-[var(--ui-border-strong)]"
                      }`}
                    >
                      {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* TYPE: MULTI_SELECT */}
          {currentQ.answer_type === "MULTI_SELECT" && (
            <div className="space-y-2.5 max-w-xl">
              {(currentQ.options || []).map((opt) => {
                const selectedArr: string[] = Array.isArray(currentValue)
                  ? currentValue
                  : typeof currentValue === "string" && currentValue
                  ? [currentValue]
                  : [];
                const isSelected = selectedArr.includes(opt.value);

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setCurrentValue(selectedArr.filter((v) => v !== opt.value));
                      } else {
                        setCurrentValue([...selectedArr, opt.value]);
                      }
                    }}
                    className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-[var(--ui-sage-soft)] bg-[var(--ui-sage-faint)]/70 text-[var(--ui-sage)] font-bold ring-2 ring-[var(--ui-sage-soft)]/20 shadow-xs"
                        : "border-[var(--ui-border)] bg-white hover:border-[var(--ui-sage-soft)] text-[var(--ui-secondary)]"
                    }`}
                  >
                    <span className="text-sm">{opt.label}</span>
                    <span
                      className={`h-4 w-4 rounded-md border flex items-center justify-center ${
                        isSelected
                          ? "border-[var(--ui-sage-soft)] bg-[var(--ui-sage)] text-white"
                          : "border-[var(--ui-border-strong)]"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* TYPE: CURRENCY */}
          {currentQ.answer_type === "CURRENCY" && (
            <div className="max-w-xs relative rounded-xl border border-[var(--ui-border-strong)] bg-white shadow-2xs focus-within:border-[var(--ui-sage-soft)] focus-within:ring-1 focus-within:ring-[var(--ui-sage-soft)]">
              <span className="absolute left-3.5 top-2.5 text-[var(--ui-secondary)] font-bold">
                <IndianRupee className="h-4 w-4 inline" />
              </span>
              <input
                type="number"
                min="0"
                value={currentValue === "" ? "" : currentValue}
                onChange={(e) =>
                  setCurrentValue(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="Amount in INR"
                className="w-full pl-9 pr-3.5 py-2.5 text-base font-semibold text-[var(--ui-text)] rounded-xl outline-none"
              />
            </div>
          )}

          {/* TYPE: PERCENTAGE */}
          {currentQ.answer_type === "PERCENTAGE" && (
            <div className="max-w-xs relative rounded-xl border border-[var(--ui-border-strong)] bg-white shadow-2xs focus-within:border-[var(--ui-sage-soft)] focus-within:ring-1 focus-within:ring-[var(--ui-sage-soft)]">
              <input
                type="number"
                min="0"
                max="100"
                value={currentValue === "" ? "" : currentValue}
                onChange={(e) =>
                  setCurrentValue(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="Percentage"
                className="w-full px-3.5 py-2.5 text-base font-semibold text-[var(--ui-text)] rounded-xl outline-none"
              />
              <span className="absolute right-3.5 top-2.5 text-[var(--ui-secondary)] font-bold">
                <Percent className="h-4 w-4 inline" />
              </span>
            </div>
          )}

          {/* TYPE: DATE */}
          {currentQ.answer_type === "DATE" && (
            <div className="max-w-xs relative rounded-xl border border-[var(--ui-border-strong)] bg-white shadow-2xs focus-within:border-[var(--ui-sage-soft)] focus-within:ring-1 focus-within:ring-[var(--ui-sage-soft)]">
              <input
                type="date"
                value={String(currentValue ?? "")}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-semibold text-[var(--ui-text)] rounded-xl outline-none"
              />
            </div>
          )}

          {/* TYPE: TEXT */}
          {currentQ.answer_type === "TEXT" && (
            <div className="max-w-lg">
              <textarea
                rows={3}
                value={String(currentValue ?? "")}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="Provide details..."
                className="w-full p-3.5 rounded-xl border border-[var(--ui-border-strong)] bg-white text-sm text-[var(--ui-text)] placeholder-slate-400 outline-none focus:border-[var(--ui-sage-soft)] focus:ring-1 focus:ring-[var(--ui-sage-soft)] shadow-2xs"
              />
            </div>
          )}
        </div>

        {/* Optional Context/Description Input */}
        {currentQ.answer_type !== "TEXT" && (
          <div className="pt-3 border-t border-[var(--ui-border)]/80 space-y-1.5">
            <label className="block text-xs font-semibold text-[var(--ui-secondary)]">
              Have specific context or details? Explain in your own words (optional):
            </label>
            <textarea
              rows={2}
              value={currentExplanation}
              onChange={(e) => setCurrentExplanation(e.target.value)}
              placeholder="Add a detail that helps explain your answer."
              className="w-full p-2.5 rounded-xl border border-[var(--ui-border)] bg-white text-xs text-[var(--ui-text)] placeholder-slate-400 outline-none focus:border-[var(--ui-sage-soft)] focus:ring-1 focus:ring-[var(--ui-sage-soft)] shadow-2xs"
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Fast Demo Prefill Banner */}
      {hasPresetAnswers && onPrefillAllAnswers && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-xs text-amber-950 font-medium">
              Demo Preset Active: <strong className="font-bold">{presetName}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={onPrefillAllAnswers}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>⚡ Prefill All Verified Answers</span>
          </button>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="pt-4 border-t border-[var(--ui-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onBackToProducts}
            className="rounded-full border border-[var(--ui-border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--ui-secondary)] hover:bg-[var(--ui-bg)] transition-colors cursor-pointer shadow-2xs"
          >
            ← Products
          </button>
          {activeQuestionIndex > 0 && (
            <button
              type="button"
              onClick={() => onSelectQuestionIndex(activeQuestionIndex - 1)}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--ui-border-strong)] bg-white px-4 py-2 text-xs font-semibold text-[var(--ui-secondary)] hover:bg-[var(--ui-bg)] transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>
          )}
        </div>

        <button
          type="button"
          disabled={saving || loading}
          onClick={() => handleSaveCurrentAndGo()}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--ui-text)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--ui-text)] disabled:opacity-50 transition-colors shadow-2xs cursor-pointer w-full sm:w-auto"
        >
          <span>
            {saving
              ? "Saving Answer..."
              : isLastQuestion || answeredCount === questions.length
              ? "Analyze Regulatory Compliance →"
              : "Save & Next Question →"}
          </span>
          {!isLastQuestion && answeredCount < questions.length && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </ProductMotion>
  );
}
