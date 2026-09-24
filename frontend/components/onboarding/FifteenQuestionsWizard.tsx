"use client";

import React, { useState, useEffect } from "react";
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
  onCompleteQuestions: () => void;
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
    return currentQ?.current_value ?? "";
  });
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync current value whenever active question changes
  useEffect(() => {
    if (currentQ) {
      setCurrentValue(
        currentQ.current_value !== undefined && currentQ.current_value !== null
          ? currentQ.current_value
          : ""
      );
      setError(null);
    }
  }, [currentQ, activeQuestionIndex]);

  if (!currentQ || questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center space-y-4">
        <p className="text-sm font-semibold text-[#64748B]">
          Loading compliance questions...
        </p>
      </div>
    );
  }

  const answeredCount = questions.filter((q) => q.is_answered).length;
  const isLastQuestion = activeQuestionIndex === questions.length - 1;
  const progressPercent = Math.round(((activeQuestionIndex + 1) / questions.length) * 100);

  async function handleSaveCurrentAndGo(targetIdx?: number) {
    setError(null);
    if (answeredCount === questions.length && (isLastQuestion || targetIdx === undefined)) {
      onCompleteQuestions();
      return;
    }
    if (currentValue === null || currentValue === undefined || currentValue === "") {
      if (targetIdx !== undefined) {
        onSelectQuestionIndex(targetIdx);
        return;
      }
      if (currentQ.required) {
        setError("Please provide an answer before advancing.");
        return;
      }
    }

    setSaving(true);
    try {
      await onAnswerSubmitted(currentQ.question_id, currentValue);
      if (targetIdx !== undefined) {
        onSelectQuestionIndex(targetIdx);
      } else if (!isLastQuestion) {
        onSelectQuestionIndex(activeQuestionIndex + 1);
      } else {
        onCompleteQuestions();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save answer. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-2xs space-y-6">
      {/* Top Header with Progress and Step Navigator */}
      <div className="border-b border-[#E2E8F0] pb-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-indigo-100 text-indigo-800">
                {currentQ.category || "General Compliance"}
              </span>
              <span className="text-xs font-semibold text-[#64748B]">
                Question {activeQuestionIndex + 1} of {questions.length}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">
              Your 15 Compliance Questions
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              15-Question Statutory Assessment tailored to your operations
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
              {answeredCount} / {questions.length} Answered ({Math.round((answeredCount / questions.length) * 100)}%)
            </span>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
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
                    ? "bg-indigo-600 text-white ring-3 ring-indigo-200"
                    : isDone
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 space-y-5">
        {/* Question Text */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-400">
            <span>#{currentQ.question_id}</span>
            <span>•</span>
            <span className="uppercase">{currentQ.answer_type}</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] leading-snug">
            {currentQ.question}
          </h3>
        </div>

        {/* "Why We Ask This" Contextual Explanation */}
        {(currentQ.help_text || currentQ.reason) && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/60 text-xs text-indigo-950">
            <HelpCircle className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
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
                    ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs"
                    : "border-slate-200 bg-white hover:border-emerald-300 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2.5 font-bold text-sm">
                  <CheckCircle2
                    className={`h-5 w-5 ${
                      currentValue === true ? "text-emerald-600" : "text-slate-400"
                    }`}
                  />
                  <span>Yes, Applicable / Active</span>
                </div>
                {currentValue === true && (
                  <span className="h-2 w-2 rounded-full bg-emerald-600" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setCurrentValue(false)}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  currentValue === false
                    ? "border-slate-800 bg-slate-900 text-white shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-400 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2.5 font-bold text-sm">
                  <XCircle
                    className={`h-5 w-5 ${
                      currentValue === false ? "text-white" : "text-slate-400"
                    }`}
                  />
                  <span>No, Not Applicable</span>
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
              <div className="relative rounded-xl border border-slate-300 bg-white shadow-2xs focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                <input
                  type="number"
                  min="0"
                  value={currentValue === "" ? "" : currentValue}
                  onChange={(e) =>
                    setCurrentValue(e.target.value === "" ? "" : Number(e.target.value))
                  }
                  placeholder="Enter numeric quantity"
                  className="w-full px-3.5 py-2.5 text-base font-semibold text-[#0F172A] rounded-xl outline-none"
                />
                {currentQ.unit && (
                  <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {currentQ.unit}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* TYPE: SINGLE_SELECT */}
          {currentQ.answer_type === "SINGLE_SELECT" && (
            <div className="space-y-2.5 max-w-xl">
              {(currentQ.options || []).map((opt) => {
                const isSelected = currentValue === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCurrentValue(opt.value)}
                    className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs"
                        : "border-slate-200 bg-white hover:border-indigo-300 text-slate-700"
                    }`}
                  >
                    <span className="text-sm">{opt.label}</span>
                    <span
                      className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-300"
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
                        ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-500/20 shadow-xs"
                        : "border-slate-200 bg-white hover:border-indigo-300 text-slate-700"
                    }`}
                  >
                    <span className="text-sm">{opt.label}</span>
                    <span
                      className={`h-4 w-4 rounded-md border flex items-center justify-center ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-300"
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
            <div className="max-w-xs relative rounded-xl border border-slate-300 bg-white shadow-2xs focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
              <span className="absolute left-3.5 top-2.5 text-slate-500 font-bold">
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
                className="w-full pl-9 pr-3.5 py-2.5 text-base font-semibold text-[#0F172A] rounded-xl outline-none"
              />
            </div>
          )}

          {/* TYPE: PERCENTAGE */}
          {currentQ.answer_type === "PERCENTAGE" && (
            <div className="max-w-xs relative rounded-xl border border-slate-300 bg-white shadow-2xs focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
              <input
                type="number"
                min="0"
                max="100"
                value={currentValue === "" ? "" : currentValue}
                onChange={(e) =>
                  setCurrentValue(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="Percentage"
                className="w-full px-3.5 py-2.5 text-base font-semibold text-[#0F172A] rounded-xl outline-none"
              />
              <span className="absolute right-3.5 top-2.5 text-slate-500 font-bold">
                <Percent className="h-4 w-4 inline" />
              </span>
            </div>
          )}

          {/* TYPE: DATE */}
          {currentQ.answer_type === "DATE" && (
            <div className="max-w-xs relative rounded-xl border border-slate-300 bg-white shadow-2xs focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
              <input
                type="date"
                value={String(currentValue ?? "")}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-semibold text-[#0F172A] rounded-xl outline-none"
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
                className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-sm text-[#0F172A] placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-2xs"
              />
            </div>
          )}
        </div>

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
            <span>⚡ Prefill All 15 Verified Answers</span>
          </button>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onBackToProducts}
            className="rounded-full border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-semibold text-[#475569] hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
          >
            ← Products
          </button>
          {activeQuestionIndex > 0 && (
            <button
              type="button"
              onClick={() => onSelectQuestionIndex(activeQuestionIndex - 1)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
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
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0F172A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer w-full sm:w-auto"
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
    </div>
  );
}
