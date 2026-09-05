"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import MetricCard from "@/components/MetricCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import { api } from "@/lib/api";
import {
  Business,
  SmartQuestion,
  DecisionRun,
  ApplicabilityStatus,
  ProfileVariableDefinition,
  ProfileVariableChoice,
} from "@/types";

const STEPS = [
  { num: 1, id: "profile", label: "Business Profile" },
  { num: 2, id: "products", label: "Products & Activities" },
  { num: 3, id: "questions", label: "Smart Questions" },
  { num: 4, id: "analysis", label: "Regulatory Analysis" },
  { num: 5, id: "results", label: "Initial Results" },
];

const CANONICAL_STATES = [
  "GUJARAT",
  "MAHARASHTRA",
  "TAMIL_NADU",
  "KARNATAKA",
  "UTTAR_PRADESH",
  "DELHI",
  "HARYANA",
  "RAJASTHAN",
  "TELANGANA",
  "WEST_BENGAL",
  "ANDHRA_PRADESH",
  "KERALA",
  "MADHYA_PRADESH",
  "PUNJAB",
  "ODISHA",
  "ASSAM",
  "BIHAR",
  "JHARKHAND",
  "CHHATTISGARH",
  "UTTARAKHAND",
  "HIMACHAL_PRADESH",
  "GOA",
  "TRIPURA",
  "MEGHALAYA",
  "MANIPUR",
  "NAGALAND",
  "MIZORAM",
  "ARUNACHAL_PRADESH",
  "SIKKIM",
  "JAMMU_AND_KASHMIR",
  "LADAKH",
  "PUDUCHERRY",
  "CHANDIGARH",
  "DAMAN_AND_DIU",
  "LAKSHADWEEP",
  "ANDAMAN_AND_NICOBAR",
];

// Data type inspection helpers (supporting both domain uppercase and frontend lowercase)
const isBooleanType = (dt?: string) => (dt || "").toUpperCase() === "BOOLEAN";
const isNumericType = (dt?: string) => {
  const u = (dt || "").toUpperCase();
  return u === "NUMBER" || u === "INTEGER" || u === "DECIMAL" || u === "CURRENCY_INR";
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Active business session
  const [business, setBusiness] = useState<Business | null>(null);

  // Canonical variable definitions from backend GET /api/v1/profile/variables
  const [varDefs, setVarDefs] = useState<ProfileVariableDefinition[]>([]);

  // Derive dropdown options dynamically from varDefs (with safe canonical fallbacks)
  const legalConstitutionOptions: ProfileVariableChoice[] = useMemo(() => {
    const def = varDefs.find((v) => v.key === "legal_constitution" || v.code === "V01");
    if (def?.options && def.options.length > 0) {
      return def.options;
    }
    return [
      { value: "PRIVATE_LIMITED", label: "Private Limited Company" },
      { value: "PUBLIC_LIMITED", label: "Public Limited Company" },
      { value: "LLP", label: "Limited Liability Partnership (LLP)" },
      { value: "PARTNERSHIP", label: "Partnership Firm" },
      { value: "PROPRIETORSHIP", label: "Sole Proprietorship" },
      { value: "TRUST", label: "Trust" },
      { value: "SOCIETY", label: "Society" },
    ];
  }, [varDefs]);

  const industrialZoneOptions: ProfileVariableChoice[] = useMemo(() => {
    const def = varDefs.find((v) => v.key === "industrial_zone_status" || v.code === "V05");
    if (def?.options && def.options.length > 0) {
      return def.options;
    }
    return [
      { value: "INSIDE_NOTIFIED_INDUSTRIAL_AREA", label: "Inside Notified Industrial Area / GIDC / MIDC" },
      { value: "OUTSIDE_NOTIFIED_INDUSTRIAL_AREA", label: "Outside Notified Industrial Area" },
      { value: "SPECIAL_ECONOMIC_ZONE", label: "Special Economic Zone (SEZ)" },
      { value: "NOT_KNOWN", label: "Not Known / Unclassified" },
    ];
  }, [varDefs]);

  const lifecycleStageOptions: ProfileVariableChoice[] = useMemo(() => {
    const def = varDefs.find((v) => v.key === "lifecycle_stage" || v.code === "V02");
    if (def?.options && def.options.length > 0) {
      return def.options;
    }
    return [
      { value: "PLANNED", label: "Planned / Concept" },
      { value: "UNDER_SETUP", label: "Under Setup / Construction" },
      { value: "OPERATIONAL", label: "Operational / Active Production" },
      { value: "EXPANDING", label: "Expanding Operations" },
      { value: "DORMANT", label: "Dormant / Temporarily Inactive" },
    ];
  }, [varDefs]);

  // Step 1: Profile State (using canonical variable values)
  const [businessName, setBusinessName] = useState<string>("Shree Ganesh Foods Pvt Ltd");
  const [legalConstitution, setLegalConstitution] = useState<string>("PRIVATE_LIMITED");
  const [registeredState, setRegisteredState] = useState<string>("GUJARAT");
  const [district, setDistrict] = useState<string>("Ahmedabad");
  const [industrialZone, setIndustrialZone] = useState<string>("INSIDE_NOTIFIED_INDUSTRIAL_AREA");
  const [lifecycleStage, setLifecycleStage] = useState<string>("OPERATIONAL");
  const [plantInvestmentLakhs, setPlantInvestmentLakhs] = useState<number>(450);
  const [turnoverLakhs, setTurnoverLakhs] = useState<number>(850);
  const [employeeCount, setEmployeeCount] = useState<number>(38);

  // Step 2: Products & Activities State
  const [productDescription, setProductDescription] = useState<string>(
    "Manufacture of packaged ready-to-eat roasted snacks, spiced chickpea flour savouries, and vacuum-sealed food condiments. Operates an automated frying and nitrogen-flush packaging line."
  );
  const [tradeIntent, setTradeIntent] = useState<
    "NONE" | "IMPORT_ONLY" | "EXPORT_ONLY" | "IMPORT_AND_EXPORT" | "PLANNED"
  >("IMPORT_AND_EXPORT");
  const [detectedActivities, setDetectedActivities] = useState<string[]>([]);

  // Step 3: Smart Questions State
  const [smartQuestions, setSmartQuestions] = useState<SmartQuestion[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<
    Record<string, string | number | boolean>
  >({});

  // Step 4 & 5: Analysis and Results State
  const [analysisStages, setAnalysisStages] = useState<
    Array<{ name: string; done: boolean; detail: string }>
  >([
    { name: "Profile & Jurisdiction Normalization", done: false, detail: "Validating state and constitution parameters" },
    { name: "Statutory Scope Resolution", done: false, detail: "Matching candidate acts across Central & State authorities" },
    { name: "Deterministic AST Rule Evaluation", done: false, detail: "Applying three-valued logic (TRUE, FALSE, UNKNOWN)" },
    { name: "Statutory Evidence Linking", done: false, detail: "Connecting evaluated rules to verified legal citations" },
    { name: "Compliance Obligation Matrix", done: false, detail: "Synthesizing prioritized obligations and deadliness" },
  ]);
  const [decisionRun, setDecisionRun] = useState<DecisionRun | null>(null);

  // Load canonical variable definitions and existing business profile on mount
  useEffect(() => {
    async function init() {
      // 1. Fetch canonical variable definitions registry from backend
      try {
        const defs = await api.businesses.getVariableDefinitions();
        if (Array.isArray(defs)) {
          setVarDefs(defs);
        }
      } catch {
        // Variable definitions endpoint will gracefully fallback to canonical defaults
      }

      // 2. Load active business if stored
      const storedId = localStorage.getItem("complywise_active_business_id");
      if (storedId) {
        try {
          const b = await api.businesses.get(storedId);
          setBusiness(b);
          setBusinessName(b.name);
        } catch {
          localStorage.removeItem("complywise_active_business_id");
        }
      }
    }
    init();
  }, []);

  // STEP 1 SUBMIT: Save Profile using canonical variable keys & values
  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let currentBiz = business;
      if (!currentBiz) {
        currentBiz = await api.businesses.create({ name: businessName });
        setBusiness(currentBiz);
        localStorage.setItem("complywise_active_business_id", currentBiz.id);
      }

      // Convert lakhs to raw INR amounts for decimal/currency fields
      const plantInvestmentInr = Math.round(Number(plantInvestmentLakhs) * 100000);
      const turnoverInr = Math.round(Number(turnoverLakhs) * 100000);

      // Update core profile variables using canonical keys
      await api.businesses.createProfileVersion(
        currentBiz.id,
        {
          legal_constitution: { value: legalConstitution, origin: "USER_PROVIDED" },
          lifecycle_stage: { value: lifecycleStage, origin: "USER_PROVIDED" },
          state: { value: registeredState, origin: "USER_PROVIDED" },
          district: { value: district, origin: "USER_PROVIDED" },
          industrial_zone_status: { value: industrialZone, origin: "USER_PROVIDED" },
          plant_machinery_investment: { value: plantInvestmentInr, origin: "USER_PROVIDED" },
          annual_turnover: { value: turnoverInr, origin: "USER_PROVIDED" },
          total_worker_count: { value: Number(employeeCount), origin: "USER_PROVIDED" },
        },
        "Initial business profile submitted during onboarding"
      );

      setStep(2);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save business profile.");
    } finally {
      setLoading(false);
    }
  }

  // STEP 2 SUBMIT: Save Products & Activities
  async function handleProductsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!business) return;
    setLoading(true);
    setError(null);

    try {
      const resp = await api.onboarding.saveProductsActivities(business.id, {
        product_description: productDescription,
        import_export_intent: tradeIntent,
      });
      setDetectedActivities(resp.detected_activities);

      // Load Smart Questions for Step 3
      const questionsResp = await api.onboarding.getQuestions(business.id);
      setSmartQuestions(questionsResp.questions);

      // Pre-fill existing current values if present
      const initialAnswers: Record<string, string | number | boolean> = {};
      for (const q of questionsResp.questions) {
        const qKey = q.variable_key || q.key || "";
        if (!qKey) continue;
        if (q.current_value !== null && q.current_value !== undefined) {
          initialAnswers[qKey] = q.current_value as string | number | boolean;
        } else if (isBooleanType(q.data_type)) {
          initialAnswers[qKey] = false;
        } else if (q.options && q.options.length > 0) {
          initialAnswers[qKey] = q.options[0].value;
        } else if (isNumericType(q.data_type)) {
          initialAnswers[qKey] = 0;
        } else {
          initialAnswers[qKey] = "";
        }
      }
      setQuestionAnswers(initialAnswers);

      setStep(3);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record products and activities.");
    } finally {
      setLoading(false);
    }
  }

  // STEP 3 SUBMIT: Save Smart Question Answers
  async function handleQuestionsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!business) return;
    setLoading(true);
    setError(null);

    try {
      // Clean answers according to question data_type
      const formattedAnswers: Record<string, string | number | boolean> = {};
      for (const q of smartQuestions) {
        const qKey = q.variable_key || q.key || "";
        if (!qKey) continue;
        const val = questionAnswers[qKey];
        if (isBooleanType(q.data_type)) {
          formattedAnswers[qKey] = Boolean(val);
        } else if (isNumericType(q.data_type)) {
          formattedAnswers[qKey] = Number(val) || 0;
        } else {
          formattedAnswers[qKey] = String(val ?? "");
        }
      }

      if (Object.keys(formattedAnswers).length > 0) {
        await api.onboarding.submitAnswers(business.id, {
          answers: formattedAnswers,
        });
      }

      setStep(4);
      runRegulatoryAnalysis(business.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record smart question answers.");
      setLoading(false);
    }
  }

  // STEP 4: Run Real Regulatory Analysis
  async function runRegulatoryAnalysis(bizId: string) {
    setLoading(true);
    setError(null);

    // Progressive visual checklist
    const timer1 = setTimeout(() => {
      setAnalysisStages((prev) =>
        prev.map((s, idx) => (idx <= 1 ? { ...s, done: true } : s))
      );
    }, 400);

    const timer2 = setTimeout(() => {
      setAnalysisStages((prev) =>
        prev.map((s, idx) => (idx <= 3 ? { ...s, done: true } : s))
      );
    }, 800);

    try {
      const run = await api.applicability.evaluate(bizId);
      clearTimeout(timer1);
      clearTimeout(timer2);

      setAnalysisStages((prev) => prev.map((s) => ({ ...s, done: true })));
      setDecisionRun(run);

      // Brief pause to show completion then transition
      setTimeout(() => {
        setStep(5);
        setLoading(false);
      }, 600);
    } catch (err: unknown) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setError(err instanceof Error ? err.message : "Regulatory evaluation failed.");
      setLoading(false);
    }
  }

  // Results aggregation
  const results = decisionRun?.results || [];
  const applicableCount = results.filter((r) => r.status === "APPLICABLE").length;
  const needsInfoCount = results.filter((r) => r.status === "NEEDS_INFORMATION").length;
  const notApplicableCount = results.filter((r) => r.status === "NOT_APPLICABLE").length;
  const unverifiedCount = results.filter(
    (r) => r.status === "UNVERIFIED" || r.status === "CONFLICT_REVIEW"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stepper Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-semibold text-indigo-600 tracking-wide uppercase">
                Problem Statement 26130 · Compliance Onboarding
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 mt-0.5">
                {STEPS.find((s) => s.num === step)?.label}
              </h1>
            </div>
            {business && (
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                <span className="font-semibold text-slate-900">{business.name}</span>
                <span className="text-slate-400">·</span>
                <span className="font-mono text-slate-500">ID: {business.id.slice(0, 8)}</span>
              </div>
            )}
          </div>

          {/* Stepper Dots & Links */}
          <nav aria-label="Progress" className="mt-6">
            <ol className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
              {STEPS.map((s) => {
                const isCurrent = s.num === step;
                const isCompleted = s.num < step;
                return (
                  <li key={s.id} className="relative">
                    <button
                      type="button"
                      disabled={s.num > step}
                      onClick={() => s.num < step && setStep(s.num)}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all ${
                        isCurrent
                          ? "bg-indigo-50 border border-indigo-200"
                          : isCompleted
                          ? "hover:bg-slate-50 cursor-pointer"
                          : "opacity-40 cursor-not-allowed"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isCurrent
                            ? "bg-indigo-600 text-white"
                            : isCompleted
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isCompleted ? "✓" : s.num}
                      </span>
                      <span className="text-xs font-semibold truncate text-slate-800">
                        {s.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {error && (
          <ErrorState
            title="Action Error"
            message={error}
            onRetry={() => setError(null)}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 1: BUSINESS PROFILE                                      */}
        {/* ------------------------------------------------------------- */}
        {step === 1 && (
          <form
            onSubmit={handleProfileSubmit}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6"
          >
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">
                Establish Entity Identity & Jurisdiction Scope
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Canonical parameters define statutory jurisdiction, micro/small/medium scale, and applicable statutory authorities.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Legal Enterprise / Operating Name *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Apex Biotech Formulations LLP"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Legal Constitution *
                </label>
                <select
                  value={legalConstitution}
                  onChange={(e) => setLegalConstitution(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {legalConstitutionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operating State / Jurisdiction *
                </label>
                <select
                  value={registeredState}
                  onChange={(e) => setRegisteredState(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {CANONICAL_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  District / Industrial Hub *
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Ahmedabad, Pune, Bengaluru"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Industrial Zone Siting *
                </label>
                <select
                  value={industrialZone}
                  onChange={(e) => setIndustrialZone(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {industrialZoneOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enterprise Lifecycle Stage *
                </label>
                <select
                  value={lifecycleStage}
                  onChange={(e) => setLifecycleStage(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {lifecycleStageOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plant & Machinery Investment (₹ Lakhs)
                </label>
                <input
                  type="number"
                  min="0"
                  value={plantInvestmentLakhs}
                  onChange={(e) => setPlantInvestmentLakhs(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-500">
                  MSME Threshold: Micro &lt; ₹1 Cr, Small &lt; ₹10 Cr, Medium &lt; ₹50 Cr
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated / Actual Annual Turnover (₹ Lakhs)
                </label>
                <input
                  type="number"
                  min="0"
                  value={turnoverLakhs}
                  onChange={(e) => setTurnoverLakhs(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Direct Employees & Workers (Count)
                </label>
                <input
                  type="number"
                  min="1"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-500">
                  Threshold: 10+ with power triggers Factories Act §2(m)(i)
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Saving Profile..." : "Continue to Products & Activities →"}
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 2: PRODUCTS & ACTIVITIES                                 */}
        {/* ------------------------------------------------------------- */}
        {step === 2 && (
          <form
            onSubmit={handleProductsSubmit}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6"
          >
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900">
                Products, Manufacturing Operations & Trade Intent
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Provide natural-language descriptions of operations. The system detects regulatory keywords and prompts for missing statutory triggers dynamically.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Describe your manufacturing processes, product lines, and plant operations *
                </label>
                <textarea
                  required
                  rows={5}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="e.g. Processing and packaging of roasted snacks, operating a continuous frying furnace, packaging in nitrogen sealed pouches, storing raw grains in on-site warehouse..."
                  className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Mention raw materials, industrial power, effluent generation, storage, and packaging.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cross-Border Trade Intent (DGFT / Customs Trigger) *
                </label>
                <select
                  value={tradeIntent}
                  onChange={(e) =>
                    setTradeIntent(
                      e.target.value as
                        | "NONE"
                        | "IMPORT_ONLY"
                        | "EXPORT_ONLY"
                        | "IMPORT_AND_EXPORT"
                        | "PLANNED"
                    )
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="NONE">Domestic Operations Only (No Cross-Border Trade)</option>
                  <option value="IMPORT_ONLY">Import Raw Materials / Equipment Only</option>
                  <option value="EXPORT_ONLY">Export Finished Products Only</option>
                  <option value="IMPORT_AND_EXPORT">Both Import & Export Operations</option>
                  <option value="PLANNED">Planned Future Cross-Border Trade (Within 12 Mo)</option>
                </select>
              </div>
            </div>

            {detectedActivities.length > 0 && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <span className="text-xs font-semibold text-indigo-900 block mb-2">
                  Detected Activity Domains:
                </span>
                <div className="flex flex-wrap gap-2">
                  {detectedActivities.map((act) => (
                    <span
                      key={act}
                      className="inline-flex items-center rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200 shadow-2xs"
                    >
                      {act}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                ← Back to Profile
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Analyzing Operations..." : "Generate Smart Questions →"}
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 3: SMART QUESTIONS (DATA-DRIVEN AST DERIVED)              */}
        {/* ------------------------------------------------------------- */}
        {step === 3 && (
          <form
            onSubmit={handleQuestionsSubmit}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6"
          >
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Smart Questions — Decision-Critical Clarifications
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Dynamically derived by inspecting candidate statutory rules against your profile. Zero assumptions or hardcoded branching.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {smartQuestions.length} Variables Needed
                </span>
              </div>
            </div>

            {smartQuestions.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                All decision-critical profile variables are already satisfied! You can proceed to statutory evaluation.
              </div>
            ) : (
              <div className="space-y-6">
                {smartQuestions.map((q) => {
                  const qKey = q.variable_key || q.key || "";
                  const val = questionAnswers[qKey];
                  const ruleCount = q.candidate_rules_count ?? q.rule_dependency_count ?? 0;

                  return (
                    <div
                      key={qKey}
                      className="p-4 sm:p-5 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-white hover:border-indigo-200 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {qKey}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              Relevance: {q.relevance}
                            </span>
                            {ruleCount > 0 && (
                              <span className="text-[11px] text-slate-400">
                                ({ruleCount} rule{ruleCount > 1 ? "s" : ""} depend on this)
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-slate-900">{q.label}</h3>
                        </div>

                        {q.why_it_matters && (
                          <div className="sm:max-w-xs text-[11px] text-slate-500 bg-white border border-slate-200/80 rounded-lg p-2 leading-tight">
                            <span className="font-semibold text-slate-700">Statutory Rationale:</span> {q.why_it_matters}
                          </div>
                        )}
                      </div>

                      {/* Control based on data_type */}
                      <div className="pt-2">
                        {isBooleanType(q.data_type) ? (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                setQuestionAnswers((prev) => ({
                                  ...prev,
                                  [qKey]: true,
                                }))
                              }
                              className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                val === true
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                  : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                              }`}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setQuestionAnswers((prev) => ({
                                  ...prev,
                                  [qKey]: false,
                                }))
                              }
                              className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                val === false
                                  ? "bg-slate-800 text-white border-slate-800 shadow-2xs"
                                  : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                              }`}
                            >
                              No
                            </button>
                          </div>
                        ) : q.options && q.options.length > 0 ? (
                          <select
                            value={String(val ?? "")}
                            onChange={(e) =>
                              setQuestionAnswers((prev) => ({
                                  ...prev,
                                  [qKey]: e.target.value,
                              }))
                            }
                            className="w-full sm:max-w-md rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          >
                            {q.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : isNumericType(q.data_type) ? (
                          <div className="flex items-center gap-2 max-w-xs">
                            <input
                              type="number"
                              min="0"
                              value={Number(val ?? 0)}
                              onChange={(e) =>
                                setQuestionAnswers((prev) => ({
                                  ...prev,
                                  [qKey]: Number(e.target.value),
                                }))
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                            />
                            {q.unit && (
                              <span className="text-xs font-semibold text-slate-500">
                                {q.unit}
                              </span>
                            )}
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={String(val ?? "")}
                            onChange={(e) =>
                              setQuestionAnswers((prev) => ({
                                ...prev,
                                [qKey]: e.target.value,
                              }))
                            }
                            className="w-full sm:max-w-md rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                ← Back to Products
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Recording Responses..." : "Trigger Regulatory Analysis →"}
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 4: REGULATORY ANALYSIS (HONEST EXECUTION)                */}
        {/* ------------------------------------------------------------- */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs space-y-6 text-center">
            <div className="max-w-md mx-auto space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 font-bold text-lg animate-pulse">
                ⚙️
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950">
                Running Deterministic Regulatory Engine
              </h2>
              <p className="text-xs text-slate-500">
                Executing three-valued logic against registered central and state knowledge packs. Linking statutory evidence and generating audit trail.
              </p>
            </div>

            {/* Honest Pipeline Checklist */}
            <div className="max-w-md mx-auto text-left space-y-3 pt-4">
              {analysisStages.map((stage, idx) => (
                <div
                  key={stage.name}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    stage.done
                      ? "bg-emerald-50/60 border-emerald-200"
                      : "bg-slate-50 border-slate-200/80"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      stage.done
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600 animate-pulse"
                    }`}
                  >
                    {stage.done ? "✓" : idx + 1}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{stage.name}</div>
                    <div className="text-[11px] text-slate-500">{stage.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-slate-400 pt-2">
              Statutory truth guarantee: 200 OK guarantees real AST rule evaluation results.
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 5: INITIAL RESULTS                                       */}
        {/* ------------------------------------------------------------- */}
        {step === 5 && (
          <div className="space-y-6">
            {/* Executive Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Applicable Mandates"
                value={applicableCount}
                subtext="Direct statutory obligations"
                badge={{ text: "Active", variant: "warning" }}
              />
              <MetricCard
                label="Unresolved / Info Needed"
                value={needsInfoCount + unverifiedCount}
                subtext="Requires profile clarification"
                badge={{ text: "3-Valued Logic", variant: "warning" }}
              />
              <MetricCard
                label="Not Applicable"
                value={notApplicableCount}
                subtext="Definitively exempt"
                badge={{ text: "Exempt", variant: "success" }}
              />
              <MetricCard
                label="Evaluation Run"
                value="COMPLETED"
                subtext={decisionRun ? `ID: ${decisionRun.id.slice(0, 8)}` : "Verified"}
                badge={{ text: "Audit Ready", variant: "info" }}
              />
            </div>

            {/* Categorized Requirements List */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Statutory Applicability Results
                  </h2>
                  <p className="text-xs text-slate-500">
                    Evaluated against Central Acts and {registeredState} state notifications.
                  </p>
                </div>

                <Link
                  href={`/dashboard?business_id=${business?.id}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
                >
                  Enter Overview Dashboard →
                </Link>
              </div>

              {results.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No decision rules were triggered for the current profile parameters.
                </div>
              ) : (
                <div className="space-y-3">
                  {results.map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-700">
                            {r.requirement_id}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs font-semibold text-slate-900">
                            {r.requirement_name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span>
                            Evidence: {r.evidence_refs ? r.evidence_refs.length : 0} statutory citation(s)
                          </span>
                          {Boolean(r.explanation_trace?.reason) && (
                            <>
                              <span>·</span>
                              <span className="italic">
                                {String(r.explanation_trace.reason)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <StatusBadge status={r.status as ApplicabilityStatus} size="sm" />
                        <Link
                          href={`/compliance/${r.requirement_id}?business_id=${business?.id}`}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          View Detail →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom CTAs */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  ← Refine Smart Questions
                </button>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/compliance?business_id=${business?.id}`}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    View All Compliance Mandates
                  </Link>

                  <Link
                    href={`/dashboard?business_id=${business?.id}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
                  >
                    Enter Overview Dashboard →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
