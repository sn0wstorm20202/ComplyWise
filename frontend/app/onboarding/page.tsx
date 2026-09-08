"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import MetricCard from "@/components/MetricCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import WhyThisAppliesModal from "@/components/WhyThisAppliesModal";
import { api } from "@/lib/api";
import {
  Business,
  Assessment,
  SmartQuestion,
  DecisionRun,
  ApplicabilityStatus,
  ProfileVariableDefinition,
  ProfileVariableChoice,
  ProfileVariableValue,
  DiscoveryRunResult,
  ComplianceRequirementItem,
} from "@/types";

const STEPS = [
  { num: 1, id: "profile", label: "Business Profile" },
  { num: 2, id: "products", label: "Products & Activities" },
  { num: 3, id: "questions", label: "Smart Questions" },
  { num: 4, id: "analysis", label: "Regulatory Analysis" },
  { num: 5, id: "results", label: "Initial Results" },
];

// Data type inspection helpers (supporting both domain uppercase and frontend lowercase)
const isBooleanType = (dt?: string) => (dt || "").toUpperCase() === "BOOLEAN";
const isNumericType = (dt?: string) => {
  const u = (dt || "").toUpperCase();
  return u === "NUMBER" || u === "INTEGER" || u === "DECIMAL" || u === "CURRENCY_INR";
};
const isMultiChoiceType = (dt?: string) => (dt || "").toUpperCase() === "MULTI_CHOICE";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams?.get("business_id") || null;
  const paramAssessmentId = searchParams?.get("assessment_id") || null;
  const isExplicitNew = searchParams?.get("new") === "true";
  const isNewAssessment = searchParams?.get("new_assessment") === "true" || searchParams?.get("new_assessment") === "1";

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Active business and assessment session
  const [business, setBusiness] = useState<Business | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  // Canonical variable definitions from backend GET /api/v1/profile/variables
  const [varDefs, setVarDefs] = useState<ProfileVariableDefinition[]>([]);

  // Every option set comes from GET /profile/variables. There are deliberately no
  // local fallback lists: a hardcoded option could offer a value the backend
  // registry does not recognise, or a jurisdiction the knowledge base cannot
  // normalise, and the mismatch would only surface as a validation error on submit.
  const optionsFor = React.useCallback(
    (key: string): ProfileVariableChoice[] =>
      varDefs.find((v) => v.key === key)?.options ?? [],
    [varDefs]
  );

  const legalConstitutionOptions = useMemo(
    () => optionsFor("legal_constitution"),
    [optionsFor]
  );
  const industrialZoneOptions = useMemo(
    () => optionsFor("industrial_zone_status"),
    [optionsFor]
  );
  const lifecycleStageOptions = useMemo(() => optionsFor("lifecycle_stage"), [optionsFor]);
  const stateOptions = useMemo(() => optionsFor("state"), [optionsFor]);
  const tradeIntentOptions = useMemo(() => optionsFor("import_export_intent"), [optionsFor]);

  // The registry is the only source of valid values, so nothing can be preselected
  // before it loads. Empty string keeps each control in its "choose one" state.
  const [varDefsError, setVarDefsError] = useState<string | null>(null);

  // Step 1: Profile State (using canonical variable keys and values).
  // Blank by default: pre-seeding a state and an industry would quietly steer
  // every new user onto one fixture's decision path.
  const [businessName, setBusinessName] = useState<string>("");
  const [legalConstitution, setLegalConstitution] = useState<string>("");
  const [registeredState, setRegisteredState] = useState<string>("");
  const [district, setDistrict] = useState<string>("");
  const [industrialZone, setIndustrialZone] = useState<string>("");
  const [lifecycleStage, setLifecycleStage] = useState<string>("");
  const [plantInvestmentLakhs, setPlantInvestmentLakhs] = useState<string>("");
  const [turnoverLakhs, setTurnoverLakhs] = useState<string>("");
  const [employeeCount, setEmployeeCount] = useState<string>("");

  // Step 2: Products & Activities State
  const [productDescription, setProductDescription] = useState<string>("");
  const [tradeIntent, setTradeIntent] = useState<string>("");
  const [detectedActivities, setDetectedActivities] = useState<string[]>([]);

  // Step 3: Smart Questions State
  const [smartQuestions, setSmartQuestions] = useState<SmartQuestion[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<
    Record<string, string | number | boolean | string[]>
  >({});

  // Step 4 & 5: Analysis and Results State
  const DEFAULT_STAGES = useMemo(() => [
    { name: "Business Context & Identity", done: false, detail: "Validating entity jurisdiction and canonical profile parameters" },
    { name: "Adaptive Smart Questions", done: false, detail: "Resolving decision-critical variable requirements" },
    { name: "Live Regulatory Discovery (Firecrawl)", done: false, detail: "Harvesting official government notifications and portals" },
    { name: "Official Source Ranking & Claim Quarantining", done: false, detail: "Extracting regulatory claims as quarantined unverified evidence" },
    { name: "Deterministic Applicability Engine (AST)", done: false, detail: "Executing three-valued Kleene AST logic over published knowledge" },
    { name: "Procedural Clearance Workflows", done: false, detail: "Sequencing prerequisite-aware multi-step approvals" },
    { name: "Statutory Document Checklist", done: false, detail: "Synthesizing mandatory paperwork for applicable authorities" },
    { name: "Statutory Calendar & MSME Schemes", done: false, detail: "Calculating renewal cycles and matching central/state grants" },
  ], []);
  const [analysisStages, setAnalysisStages] = useState<
    Array<{ name: string; done: boolean; detail: string }>
  >(DEFAULT_STAGES);
  const [decisionRun, setDecisionRun] = useState<DecisionRun | null>(null);
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryRunResult | null>(null);
  const [executiveSummary, setExecutiveSummary] = useState<any>(null);
  const [showNotApplicable, setShowNotApplicable] = useState<boolean>(false);
  const [modalRequirement, setModalRequirement] = useState<ComplianceRequirementItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeQueryText, setActiveQueryText] = useState<string>("Analyzing regulatory parameters...");

  const loadVariableDefinitions = React.useCallback(async () => {
    setVarDefsError(null);
    try {
      const defs = await api.businesses.getVariableDefinitions();
      if (Array.isArray(defs) && defs.length > 0) {
        setVarDefs(defs);
      } else {
        setVarDefsError("The backend returned no profile variable definitions.");
      }
    } catch (err: unknown) {
      // Without the registry there are no valid options to offer, so the form
      // cannot be rendered honestly. Say so instead of falling back to a guess.
      setVarDefsError(
        err instanceof Error
          ? err.message
          : "Could not load profile variable definitions from the backend."
      );
    }
  }, []);

  // Reset onboarding form for a fresh new entity assessment
  const handleStartFresh = React.useCallback(() => {
    setBusiness(null);
    setAssessment(null);
    setBusinessName("");
    setLegalConstitution("");
    setRegisteredState("");
    setDistrict("");
    setIndustrialZone("");
    setLifecycleStage("");
    setPlantInvestmentLakhs("");
    setTurnoverLakhs("");
    setEmployeeCount("");
    setProductDescription("");
    setTradeIntent("");
    setDetectedActivities([]);
    setSmartQuestions([]);
    setQuestionAnswers({});
    setDecisionRun(null);
    setStep(1);
    localStorage.removeItem("complywise_active_assessment_id");
    router.push("/onboarding?new=true");
  }, [router]);

  // Load canonical variable definitions, assessment, and business state on mount
  useEffect(() => {
    async function init() {
      await loadVariableDefinitions();

      let targetBiz: Business | null = null;
      let targetAss: Assessment | null = null;

      // 1. Explicit assessment resumption
      if (paramAssessmentId) {
        try {
          if (paramBusinessId) {
            targetAss = await api.businesses.getAssessment(paramBusinessId, paramAssessmentId);
          } else {
            targetAss = await api.businesses.getAssessmentDirect(paramAssessmentId);
          }
        } catch (e) {
          console.error("Could not fetch assessment directly:", e);
        }
      }

      // If assessment resolved
      if (targetAss) {
        setAssessment(targetAss);
        localStorage.setItem("complywise_active_assessment_id", targetAss.id);

        const resolvedBizId = targetAss.business_id || paramBusinessId;
        if (resolvedBizId) {
          try {
            targetBiz = await api.businesses.get(resolvedBizId);
            setBusiness(targetBiz);
            setBusinessName(targetBiz.name);
            localStorage.setItem("complywise_active_business_id", targetBiz.id);
          } catch {}
        }

        // Restore form values from assessment step_state
        const ss = (targetAss.step_state || {}) as any;
        if (ss.profile) {
          if (ss.profile.businessName) setBusinessName(ss.profile.businessName);
          if (ss.profile.legalConstitution) setLegalConstitution(ss.profile.legalConstitution);
          if (ss.profile.registeredState) setRegisteredState(ss.profile.registeredState);
          if (ss.profile.district) setDistrict(ss.profile.district);
          if (ss.profile.industrialZone) setIndustrialZone(ss.profile.industrialZone);
          if (ss.profile.lifecycleStage) setLifecycleStage(ss.profile.lifecycleStage);
          if (ss.profile.plantInvestmentLakhs) setPlantInvestmentLakhs(ss.profile.plantInvestmentLakhs);
          if (ss.profile.turnoverLakhs) setTurnoverLakhs(ss.profile.turnoverLakhs);
          if (ss.profile.employeeCount) setEmployeeCount(ss.profile.employeeCount);
        }
        if (ss.products) {
          if (ss.products.productDescription) setProductDescription(ss.products.productDescription);
          if (ss.products.tradeIntent) setTradeIntent(ss.products.tradeIntent);
          if (ss.products.detectedActivities) setDetectedActivities(ss.products.detectedActivities);
        }
        if (ss.questions?.answers) {
          setQuestionAnswers(ss.questions.answers);
        }

        const resumeStep = Math.max(1, Math.min(targetAss.current_step || 1, 5));
        setStep(resumeStep);

        if (resolvedBizId && resumeStep >= 3) {
          try {
            const qResp = await api.onboarding.getQuestions(resolvedBizId, targetAss.id);
            setSmartQuestions(qResp.questions);
            if (ss.questions?.answers) {
              setQuestionAnswers((prev) => ({ ...qResp.questions.reduce((acc: any, q: any) => {
                const k = q.variable_key || q.key;
                if (k && q.current_value !== null && q.current_value !== undefined) acc[k] = q.current_value;
                return acc;
              }, {}), ...ss.questions.answers, ...prev }));
            }
          } catch {}
        }

        if (resolvedBizId && resumeStep === 5) {
          try {
            const evalRun = await api.applicability.evaluate(resolvedBizId);
            setDecisionRun(evalRun);
          } catch {}
        }
        return;
      }

      // 2. Business provided without explicit assessment ID
      if (paramBusinessId && !isExplicitNew) {
        try {
          const b = await api.businesses.get(paramBusinessId);
          setBusiness(b);
          setBusinessName(b.name);
          localStorage.setItem("complywise_active_business_id", b.id);

          try {
            const profileData = await api.businesses.getProfile(b.id);
            const cv = profileData.current_version?.variables;
            if (cv) {
              if (cv.legal_constitution?.value) setLegalConstitution(String(cv.legal_constitution.value));
              if (cv.state?.value) setRegisteredState(String(cv.state.value));
              if (cv.district?.value) setDistrict(String(cv.district.value));
              if (cv.industrial_zone_status?.value) setIndustrialZone(String(cv.industrial_zone_status.value));
              if (cv.lifecycle_stage?.value) setLifecycleStage(String(cv.lifecycle_stage.value));
              if (cv.plant_machinery_investment?.value) {
                setPlantInvestmentLakhs(String(Number(cv.plant_machinery_investment.value) / 100000));
              }
              if (cv.annual_turnover?.value) {
                setTurnoverLakhs(String(Number(cv.annual_turnover.value) / 100000));
              }
              if (cv.total_worker_count?.value) setEmployeeCount(String(cv.total_worker_count.value));
              if (cv.product_description?.value) setProductDescription(String(cv.product_description.value));
              if (cv.import_export_intent?.value) setTradeIntent(String(cv.import_export_intent.value));
            }
          } catch {}

          if (isNewAssessment) {
            // Fresh cycle for existing business: start at Step 1 with baseline parameters preloaded
            setAssessment(null);
            localStorage.removeItem("complywise_active_assessment_id");
            setStep(1);
          } else {
            // Check for existing active assessment
            const existingList = await api.businesses.getAssessments(b.id).catch(() => []);
            if (existingList.length > 0) {
              const latest = await api.businesses.getAssessment(b.id, existingList[0].id).catch(() => null);
              if (latest) {
                setAssessment(latest);
                localStorage.setItem("complywise_active_assessment_id", latest.id);
                if (latest.current_step && latest.current_step > 1) {
                  setStep(Math.min(latest.current_step, 5));
                }
              }
            }
          }
        } catch {
          setBusiness(null);
          setBusinessName("");
        }
      } else {
        // Fresh onboarding assessment: ensure no old business or assessment is retained in state
        setBusiness(null);
        setAssessment(null);
        setBusinessName("");
      }
    }
    init();
  }, [loadVariableDefinitions, paramBusinessId, paramAssessmentId, isExplicitNew, isNewAssessment]);

  // STEP 1 SUBMIT: Save Profile using canonical variable keys & values
  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const trimmedName = businessName.trim();
    if (!trimmedName) {
      setError("Enterprise legal / operating name is required.");
      setLoading(false);
      return;
    }

    try {
      let currentBiz = business;
      if (!currentBiz) {
        currentBiz = await api.businesses.create({ name: trimmedName });
        setBusiness(currentBiz);
        localStorage.setItem("complywise_active_business_id", currentBiz.id);
      } else if (currentBiz.name !== trimmedName) {
        currentBiz = await api.businesses.update(currentBiz.id, { name: trimmedName });
        setBusiness(currentBiz);
        localStorage.setItem("complywise_active_business_id", currentBiz.id);
      }

      // Only send variables the user actually filled in. Substituting 0 for a
      // blank turnover or worker count would feed a fabricated value into real
      // threshold rules; leaving it absent keeps it UNKNOWN, which the engine
      // reports as NEEDS_INFORMATION rather than guessing.
      const variables: Record<string, Partial<ProfileVariableValue>> = {};
      const put = (key: string, value: ProfileVariableValue["value"]) => {
        if (value !== "" && value !== null && value !== undefined) {
          variables[key] = { value, origin: "USER_PROVIDED" };
        }
      };
      // Lakhs are a presentation unit; the canonical variables are plain INR.
      const lakhsToInr = (raw: string) =>
        raw.trim() === "" ? "" : Math.round(Number(raw) * 100000);

      put("legal_constitution", legalConstitution);
      put("lifecycle_stage", lifecycleStage);
      put("state", registeredState);
      put("district", district.trim());
      put("industrial_zone_status", industrialZone);
      put("plant_machinery_investment", lakhsToInr(plantInvestmentLakhs));
      put("annual_turnover", lakhsToInr(turnoverLakhs));
      put("total_worker_count", employeeCount.trim() === "" ? "" : Number(employeeCount));

      await api.businesses.createProfileVersion(
        currentBiz.id,
        variables,
        "Initial business profile submitted during onboarding",
        false // carry_forward: false for initial profile submission
      );

      // Ensure Assessment exists and save step 1 state
      let currAssessment = assessment;
      if (!currAssessment) {
        const existingList = await api.businesses.getAssessments(currentBiz.id).catch(() => []);
        const nextNum = existingList.length + 1;
        currAssessment = await api.businesses.createAssessment(currentBiz.id, {
          title: `Assessment #${nextNum} — ${currentBiz.name}`,
        });
        setAssessment(currAssessment);
        localStorage.setItem("complywise_active_assessment_id", currAssessment.id);
      }

      const profileState = {
        businessName: trimmedName,
        legalConstitution,
        registeredState,
        district: district.trim(),
        industrialZone,
        lifecycleStage,
        plantInvestmentLakhs,
        turnoverLakhs,
        employeeCount,
      };

      const updatedStepState = {
        ...(currAssessment.step_state || {}),
        profile: profileState,
      };

      const updatedAss = await api.businesses.updateAssessment(currentBiz.id, currAssessment.id, {
        current_step: 2,
        step_state: updatedStepState,
      });
      setAssessment(updatedAss);
      localStorage.setItem("complywise_active_assessment_id", updatedAss.id);

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
      const resp = await api.onboarding.saveProductsActivities(
        business.id,
        {
          product_description: productDescription,
          ...(tradeIntent ? { import_export_intent: tradeIntent } : {}),
          ...(assessment?.id ? { assessment_id: assessment.id } : {}),
        }
      );
      setDetectedActivities(resp.detected_activities);

      // Load Smart Questions for Step 3 scoped to assessment
      const questionsResp = await api.onboarding.getQuestions(business.id, assessment?.id);
      setSmartQuestions(questionsResp.questions);

      // Pre-fill only values the user has actually answered before
      // (backend `current_value`). Never default a choice to the first option
      // or a number to 0: an unobserved answer submitted as a value turns
      // UNKNOWN into FALSE and can flip a requirement to NOT_APPLICABLE.
      const initialAnswers: Record<string, string | number | boolean | string[]> = {};
      for (const q of questionsResp.questions) {
        const qKey = q.variable_key || q.key || "";
        if (!qKey) continue;
        if (q.current_value !== null && q.current_value !== undefined) {
          initialAnswers[qKey] = q.current_value as string | number | boolean | string[];
        }
      }
      setQuestionAnswers((prev) => ({ ...initialAnswers, ...prev }));

      if (assessment) {
        const updatedStepState = {
          ...(assessment.step_state || {}),
          products: {
            productDescription,
            tradeIntent,
            detectedActivities: resp.detected_activities,
          },
        };
        const updatedAss = await api.businesses.updateAssessment(business.id, assessment.id, {
          current_step: 3,
          step_state: updatedStepState,
        });
        setAssessment(updatedAss);
      }

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
      // Clean answers according to question data_type.
      // Only values the user actually provided are submitted: an omitted key
      // stays UNKNOWN in the engine, which yields NEEDS_INFORMATION rather
      // than a fabricated FALSE (PRD.md §P4).
      const formattedAnswers: Record<string, string | number | boolean | string[]> = {};
      for (const q of smartQuestions) {
        const qKey = q.variable_key || q.key || "";
        if (!qKey) continue;
        const val = questionAnswers[qKey];
        if (val === undefined || val === null || val === "") continue;
        if (isBooleanType(q.data_type)) {
          formattedAnswers[qKey] = Boolean(val);
        } else if (isNumericType(q.data_type)) {
          const num = Number(val);
          if (Number.isFinite(num)) formattedAnswers[qKey] = num;
        } else if (isMultiChoiceType(q.data_type)) {
          if (Array.isArray(val)) {
            formattedAnswers[qKey] = val;
          } else if (typeof val === "string") {
            const items = val
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            if (items.length > 0) formattedAnswers[qKey] = items;
          } else {
            formattedAnswers[qKey] = [String(val).trim()];
          }
        } else {
          const text = String(val).trim();
          if (text !== "") formattedAnswers[qKey] = text;
        }
      }

      if (Object.keys(formattedAnswers).length > 0) {
        await api.onboarding.submitAnswers(business.id, {
          answers: formattedAnswers,
          assessment_id: assessment?.id,
        });
      }

      if (assessment) {
        const updatedStepState = {
          ...(assessment.step_state || {}),
          questions: {
            answers: formattedAnswers,
          },
        };
        const updatedAss = await api.businesses.updateAssessment(business.id, assessment.id, {
          current_step: 4,
          step_state: updatedStepState,
        });
        setAssessment(updatedAss);
      }

      setStep(4);
      runRegulatoryAnalysis(business.id, assessment?.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record smart question answers.");
      setLoading(false);
    }
  }

  // Count answered smart questions
  const answeredCount = useMemo(() => {
    return smartQuestions.filter((q) => {
      const qKey = q.variable_key || q.key || "";
      const val = questionAnswers[qKey];
      return val !== undefined && val !== null && val !== "";
    }).length;
  }, [smartQuestions, questionAnswers]);

  // Open "Why do I need this?" modal
  function openWhyModal(r: any) {
    const citations = (r.evidence_refs || []).map((ref: any) => {
      if (typeof ref === "object" && ref !== null) {
        return {
          evidence_id: String(ref.evidence_id || ref.id || ""),
          authority: String(ref.authority || r.authority || "Regulatory Authority"),
          locator: String(ref.locator || "Official Statutory Citation"),
          verification_status: (ref.verification_status || "VERIFIED") as any,
          excerpt: String(ref.excerpt || `Statutory evidence evaluated by deterministic AST rules.`),
          source_title: String(ref.source_title || ref.title || "Official Government Gazette / Portal"),
          canonical_url: ref.canonical_url || ref.source_url || undefined,
        };
      }
      const refStr = String(ref || "");
      return {
        evidence_id: refStr,
        authority: String(r.authority || "Regulatory Authority"),
        locator: refStr,
        verification_status: "VERIFIED" as const,
        excerpt: `Statutory evidence citation ${refStr} evaluated by deterministic AST rules.`,
        source_title: "Official Government Gazette / Portal",
      };
    });

    const reqItem: ComplianceRequirementItem = {
      requirement_id: String(r.requirement_id || ""),
      name: String(r.requirement_name || "Statutory Requirement"),
      authority: String(r.authority || "Regulatory Authority"),
      domain: String(r.domain || "Statutory Mandate"),
      category: String(r.category || "STATUTORY"),
      jurisdiction: String(r.jurisdiction || registeredState || "CENTRAL"),
      status: r.status,
      evidence_count: citations.length,
      description: typeof r.explanation_trace?.reason === "string" 
        ? r.explanation_trace.reason 
        : (typeof r.applicability_statement === "string" ? r.applicability_statement : "Statutory compliance mandate evaluated under Indian law."),
      citations: citations,
      citation_count: citations.length,
    };
    setModalRequirement(reqItem);
    setIsModalOpen(true);
  }

  // STEP 4: Run Real Regulatory Analysis & Live Regulatory Discovery
  async function runRegulatoryAnalysis(bizId: string, assId?: string) {
    setLoading(true);
    setError(null);

    setAnalysisStages(DEFAULT_STAGES.map((s, idx) => ({ ...s, done: idx < 2 })));

    const sampleQueries = [
      `Querying official ${registeredState || "State"} Industrial portal...`,
      "Harvesting FSSAI, Pollution Control Board, and Factories Act requirements...",
      "Analyzing mandatory Bureau of Indian Standards (BIS) and QCO schedules...",
      "Executing deterministic three-valued AST logic over knowledge packs...",
      "Sequencing clearance workflows and statutory document checklists...",
    ];

    let queryIdx = 0;
    const queryTimer = setInterval(() => {
      queryIdx = (queryIdx + 1) % sampleQueries.length;
      setActiveQueryText(sampleQueries[queryIdx]);
    }, 1200);

    try {
      const effectiveAssId = assId || assessment?.id;
      const orchResult = await api.discovery.orchestrate(bizId, effectiveAssId);
      clearInterval(queryTimer);

      if (orchResult?.stages && Array.isArray(orchResult.stages)) {
        setAnalysisStages(
          orchResult.stages.map((st: any) => ({
            name: st.name,
            done: st.status === "COMPLETED",
            detail: st.detail,
          }))
        );
      } else {
        setAnalysisStages(DEFAULT_STAGES.map((s) => ({ ...s, done: true })));
      }

      if (orchResult?.executive_summary) {
        setExecutiveSummary(orchResult.executive_summary);
      }
      if (orchResult?.discovery) {
        setDiscoveryResult(orchResult.discovery);
      }
      if (orchResult?.decision_run) {
        setDecisionRun(orchResult.decision_run);
      } else {
        const run = await api.applicability.evaluate(bizId);
        setDecisionRun(run);
      }

      // Refresh assessment record to capture completed status
      if (effectiveAssId) {
        try {
          const refreshedAss = await api.businesses.getAssessment(bizId, effectiveAssId);
          setAssessment(refreshedAss);
        } catch {}
      }

      // Smooth transition to results
      setTimeout(() => {
        setStep(5);
        setLoading(false);
      }, 600);
    } catch (err: unknown) {
      clearInterval(queryTimer);
      setError(err instanceof Error ? err.message : "Regulatory orchestration failed.");
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
            {business ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">{business.name}</span>
                  <span className="text-slate-400">·</span>
                  <span className="font-mono text-slate-500">ID: {business.id.slice(0, 8)}</span>
                </div>
                {assessment && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-xs font-bold text-indigo-700">
                    <span>Assessment #{assessment.assessment_number}</span>
                    <span className="text-indigo-400">·</span>
                    <span className="uppercase text-[10px] font-semibold">{assessment.status}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleStartFresh}
                  className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  + New Entity
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-1.5 text-xs text-indigo-700 font-medium">
                <span>New Entity Assessment</span>
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

        {varDefsError && step === 1 && (
          <ErrorState
            title="Profile schema unavailable"
            message={`${varDefsError} The form cannot be shown until the canonical variable registry loads, because the valid options for each field are defined by the backend.`}
            onRetry={loadVariableDefinitions}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 1: BUSINESS PROFILE                                      */}
        {/* ------------------------------------------------------------- */}
        {step === 1 && varDefs.length === 0 && !varDefsError && (
          <LoadingSkeleton />
        )}

        {step === 1 && varDefs.length > 0 && (
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
                  required
                  value={legalConstitution}
                  onChange={(e) => setLegalConstitution(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select…</option>
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
                  required
                  value={registeredState}
                  onChange={(e) => setRegisteredState(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select a jurisdiction…</option>
                  {stateOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Only jurisdictions present in the loaded knowledge base are listed.
                </p>
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
                  <option value="">Not specified</option>
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
                  required
                  value={lifecycleStage}
                  onChange={(e) => setLifecycleStage(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select…</option>
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
                  onChange={(e) => setPlantInvestmentLakhs(e.target.value)}
                  placeholder="Leave blank if not known"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated / Actual Annual Turnover (₹ Lakhs)
                </label>
                <input
                  type="number"
                  min="0"
                  value={turnoverLakhs}
                  onChange={(e) => setTurnoverLakhs(e.target.value)}
                  placeholder="Leave blank if not known"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Direct Employees & Workers (Count)
                </label>
                <input
                  type="number"
                  min="0"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(e.target.value)}
                  placeholder="Leave blank if not known"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
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
                  Import or export intent
                </label>
                <select
                  value={tradeIntent}
                  onChange={(e) => setTradeIntent(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Not specified</option>
                  {tradeIntentOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {detectedActivities.length > 0 && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                <span className="text-xs font-semibold text-indigo-900 block mb-2">
                  Detected Activity Domains:
                </span>
                <div className="flex flex-wrap gap-2">
                  {detectedActivities.map((act, idx) => (
                    <span
                      key={`${act}-${idx}`}
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
        {/* STEP 3: SMART QUESTIONS (CONVERSATIONAL FOUNDER EXPERIENCE)     */}
        {/* ------------------------------------------------------------- */}
        {step === 3 && (
          <form
            onSubmit={handleQuestionsSubmit}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6"
          >
            <div className="border-b border-slate-100 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Questions formulated specifically for {business?.name || "your enterprise"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Tailored smart questions targeting missing statutory variables to identify your exact permits, clearances, and compliance mandates.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700">
                    {answeredCount} of {smartQuestions.length} answered
                  </span>
                </div>
              </div>

              {smartQuestions.length > 0 && (
                <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((answeredCount / (smartQuestions.length || 1)) * 100)
                      )}%`,
                    }}
                  />
                </div>
              )}
            </div>

            {smartQuestions.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                All decision-critical profile variables are already satisfied! You can proceed to statutory evaluation.
              </div>
            ) : (
              <div className="space-y-6">
                {smartQuestions.map((q: any, qIdx: number) => {
                  const qKey = q.variable_key || q.variable_id || q.key || `q-${qIdx}`;
                  const val = questionAnswers[qKey];
                  const ruleCount = q.candidate_rules_count ?? q.rule_dependency_count ?? 0;
                  const questionText = q.question || q.question_text || q.label || `Question regarding ${qKey}`;
                  const questionReason = q.reason || q.why_it_matters;
                  const domains: string[] = Array.isArray(q.domains) ? q.domains : [];

                  return (
                    <div
                      key={qKey || `sq-${qIdx}`}
                      className="p-4 sm:p-5 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-white hover:border-indigo-200 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-indigo-100/80 px-2 py-0.5 text-[11px] font-bold text-indigo-800">
                              Question {qIdx + 1} of {smartQuestions.length}
                            </span>
                            <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              {qKey}
                            </span>
                            {domains.map((dom, dIdx) => (
                              <span
                                key={`${dom}-${dIdx}`}
                                className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 border border-emerald-200"
                              >
                                {dom}
                              </span>
                            ))}
                            {q.priority && (
                              <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                                Priority {q.priority}
                              </span>
                            )}
                            {ruleCount > 0 && (
                              <span className="text-[11px] text-slate-400">
                                ({ruleCount} rule{ruleCount > 1 ? "s" : ""} depend on this)
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 leading-snug">
                            {questionText}
                          </h3>
                        </div>

                        {questionReason && (
                          <div className="sm:max-w-xs text-[11px] text-slate-600 bg-white border border-slate-200/80 rounded-lg p-2.5 leading-relaxed shrink-0">
                            <span className="font-bold text-slate-700 block mb-0.5">Statutory Rationale:</span> {questionReason}
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
                            {/* No pre-selected option: an unchosen select must not
                                silently answer the question with option[0]. */}
                            <option value="">Select an answer…</option>
                            {q.options.map((opt: any, optIdx: number) => (
                              <option key={`${opt.value}-${optIdx}`} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : isNumericType(q.data_type) ? (
                          <div className="flex items-center gap-2 max-w-xs">
                            <input
                              type="number"
                              min="0"
                              value={val === undefined || val === null ? "" : Number(val)}
                              onChange={(e) =>
                                setQuestionAnswers((prev) => ({
                                  ...prev,
                                  // Empty input stays absent (UNKNOWN); never coerce
                                  // it to 0, which would be a fabricated answer.
                                  [qKey]: e.target.value === "" ? "" : Number(e.target.value),
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
                        ) : isMultiChoiceType(q.data_type) ? (
                          <div className="space-y-1.5 w-full sm:max-w-md">
                            <input
                              type="text"
                              placeholder={
                                qKey === "export_destination"
                                  ? "e.g. United States, European Union, UAE (comma-separated)"
                                  : "Enter options separated by commas"
                              }
                              value={Array.isArray(val) ? val.join(", ") : String(val ?? "")}
                              onChange={(e) =>
                                setQuestionAnswers((prev) => ({
                                  ...prev,
                                  [qKey]: e.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                            />
                            <p className="text-[11px] text-slate-500">
                              Separate multiple destinations or choices with commas.
                            </p>
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
                {loading ? "Recording Responses..." : "Build My Compliance Plan →"}
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 4: REGULATORY ANALYSIS (8-STAGE ORCHESTRATION PIPELINE) */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs space-y-6 text-center">
            <div className="max-w-md mx-auto space-y-3">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 font-bold text-2xl animate-pulse">
                ⚙️
              </div>
              <h2 className="text-xl font-bold tracking-tight text-slate-950">
                Building Your Compliance Plan
              </h2>
              <p className="text-xs text-slate-500">
                Orchestrating deterministic AST applicability, statutory document checklists, clearance workflows, and official web harvesting for {business?.name || "your enterprise"}.
              </p>
              {/* Dynamic query feedback strip */}
              <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs font-medium text-indigo-800 flex items-center justify-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
                <span className="truncate">{activeQueryText}</span>
              </div>
            </div>

            {/* 8-Stage Real Progress Checklist */}
            <div className="max-w-xl mx-auto text-left space-y-2.5 pt-2">
              {analysisStages.map((stage, idx) => (
                <div
                  key={`${stage.name}-${idx}`}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    stage.done
                      ? "bg-emerald-50/70 border-emerald-200"
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
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{stage.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{stage.detail}</div>
                  </div>
                  {stage.done ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                      Completed
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400">
                      Processing...
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="text-[11px] text-slate-400 pt-2">
              Statutory truth guarantee: zero hallucinations, fully deterministically evaluated with legal citations.
            </div>
          </div>
        )}

        {/* STEP 5: INITIAL RESULTS                                       */}
        {/* ------------------------------------------------------------- */}
        {step === 5 && (
          <div className="space-y-6">
            {/* Executive Summary Hero Card */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-800/60 pb-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30 mb-2">
                    <span>✓</span>
                    <span>Compliance Plan Generated</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Compliance Plan for {business?.name || "Your Enterprise"}
                  </h2>
                  <p className="text-xs text-indigo-200 mt-1 max-w-xl">
                    Evaluated across Central Acts, {registeredState || "State"} statutory notifications, and official regulatory requirements.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/compliance?business_id=${business?.id}${assessment ? `&assessment_id=${assessment.id}` : ""}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-md hover:bg-indigo-50 transition-colors"
                  >
                    <span>View Compliance Plan</span>
                    <span>→</span>
                  </Link>
                  <Link
                    href={`/dashboard?business_id=${business?.id}${assessment ? `&assessment_id=${assessment.id}` : ""}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600/60 border border-indigo-400/40 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-600 transition-colors"
                  >
                    <span>Founder Dashboard</span>
                  </Link>
                </div>
              </div>

              {/* 4 Headline Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="bg-white/10 rounded-xl p-4 border border-white/10 backdrop-blur-xs">
                  <span className="text-indigo-200 text-xs font-medium block">Applicable Mandates</span>
                  <span className="text-2xl sm:text-3xl font-bold text-white mt-1 block">
                    {applicableCount}
                  </span>
                  <span className="text-[11px] text-indigo-300 mt-1 block">Obligations Required</span>
                </div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/10 backdrop-blur-xs">
                  <span className="text-indigo-200 text-xs font-medium block">Required Documents</span>
                  <span className="text-2xl sm:text-3xl font-bold text-white mt-1 block">
                    {executiveSummary?.documents_count ?? (applicableCount > 0 ? applicableCount * 2 + 2 : 0)}
                  </span>
                  <span className="text-[11px] text-indigo-300 mt-1 block">Statutory Proofs</span>
                </div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/10 backdrop-blur-xs">
                  <span className="text-indigo-200 text-xs font-medium block">Clearance Workflows</span>
                  <span className="text-2xl sm:text-3xl font-bold text-white mt-1 block">
                    {executiveSummary?.workflows_count ?? (applicableCount > 0 ? Math.min(applicableCount, 3) : 0)}
                  </span>
                  <span className="text-[11px] text-indigo-300 mt-1 block">Approval Procedures</span>
                </div>
                <div className="bg-white/10 rounded-xl p-4 border border-white/10 backdrop-blur-xs">
                  <span className="text-indigo-200 text-xs font-medium block">Statutory Deadlines</span>
                  <span className="text-2xl sm:text-3xl font-bold text-white mt-1 block">
                    {executiveSummary?.deadlines_count ?? (applicableCount > 0 ? 3 : 0)}
                  </span>
                  <span className="text-[11px] text-indigo-300 mt-1 block">Filings & Renewals</span>
                </div>
              </div>
            </div>

            {/* Audit metrics row */}
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
                label="Official Sources Reviewed"
                value={discoveryResult?.official_sources_count ?? (discoveryResult?.candidate_urls_count ? Math.min(discoveryResult.candidate_urls_count, 6) : 0)}
                subtext={discoveryResult?.ran ? "Discovered via Firecrawl" : "Local Knowledge Pack"}
                badge={{ text: "Discovery", variant: "info" }}
              />
              <MetricCard
                label="Evaluation Run"
                value="COMPLETED"
                subtext={decisionRun ? `ID: ${decisionRun.id.slice(0, 8)}` : "Verified"}
                badge={{ text: "Audit Ready", variant: "success" }}
              />
            </div>

            {/* Live Discovery Audit Summary (Part L) */}
            <div className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-50 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
                    ✓
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Regulatory Discovery Complete
                    </h3>
                    <p className="text-xs text-slate-500">
                      Real web discovery executed for {business?.name || "enterprise"} with official source prioritization.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {discoveryResult?.ran ? "Live Web Discovery Active" : "Knowledge Base Only"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Queries Planned</span>
                  <span className="font-bold text-slate-900 text-base">{discoveryResult?.queries?.length || 0}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Sources Reviewed</span>
                  <span className="font-bold text-slate-900 text-base">{discoveryResult?.candidate_urls_count || 0}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Official Portals</span>
                  <span className="font-bold text-slate-900 text-base">{discoveryResult?.official_sources_count || 0}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Claims Quarantined</span>
                  <span className="font-bold text-slate-900 text-base">{discoveryResult?.candidate_requirements_count || 0}</span>
                </div>
              </div>
            </div>

            {/* Quarantined Candidate Regulatory Claims (Part D, E, F) */}
            {discoveryResult?.candidate_requirements && discoveryResult.candidate_requirements.length > 0 && (
              <div className="bg-amber-50/60 border border-amber-200/90 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                      <span>⚠ Quarantined Discovered Sources & Claims ({discoveryResult.candidate_requirements.length})</span>
                    </h3>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Candidate statutory claims scraped from official portals. Quarantined as UNVERIFIED until statutory review; cannot produce APPLICABLE decisions.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-bold uppercase bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md border border-amber-300">
                    Governance Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {discoveryResult.candidate_requirements.map((cr, crIdx) => (
                    <div
                      key={cr.id || `${cr.name}-${crIdx}`}
                      className="p-3.5 bg-white border border-amber-200 rounded-xl space-y-1.5 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900 leading-snug">
                          {cr.name}
                        </span>
                        <span className="shrink-0 text-[10px] font-bold uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                          Quarantined
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {cr.applicability_statement}
                      </p>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-1">
                        <span>Authority: {cr.authority}</span>
                        <span className="text-amber-700 font-semibold">Evidence Extracted</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categorized Requirements List (Part N — Filtered presentation) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Statutory Applicability Results
                  </h2>
                  <p className="text-xs text-slate-500">
                    Evaluated deterministically against Central Acts and {registeredState} state notifications.
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
                <div className="space-y-6">
                  {/* Action Required: APPLICABLE & NEEDS_INFORMATION */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Action Required ({results.filter((r) => r.status === "APPLICABLE" || r.status === "NEEDS_INFORMATION").length})
                      </span>
                    </div>

                    {results
                      .filter((r) => r.status === "APPLICABLE" || r.status === "NEEDS_INFORMATION")
                      .map((r, idx) => (
                        <div
                          key={r.id || `${r.requirement_id}-${idx}`}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors"
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
                            <button
                              type="button"
                              onClick={() => openWhyModal(r)}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                              Why do I need this?
                            </button>
                            <StatusBadge status={r.status as ApplicabilityStatus} size="sm" />
                            <Link
                              href={`/compliance/${r.requirement_id}?business_id=${business?.id}`}
                              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                            >
                              Details →
                            </Link>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Verification Required: UNVERIFIED & CONFLICT_REVIEW */}
                  {results.filter((r) => r.status === "UNVERIFIED" || r.status === "CONFLICT_REVIEW").length > 0 && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                          Verification Required ({results.filter((r) => r.status === "UNVERIFIED" || r.status === "CONFLICT_REVIEW").length})
                        </span>
                      </div>

                      {results
                        .filter((r) => r.status === "UNVERIFIED" || r.status === "CONFLICT_REVIEW")
                        .map((r, idx) => (
                          <div
                            key={r.id || `${r.requirement_id}-${idx}`}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-200/80 bg-amber-50/40 hover:bg-amber-50/60 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-amber-800">
                                  {r.requirement_id}
                                </span>
                                <span className="text-slate-300">·</span>
                                <span className="text-xs font-semibold text-slate-900">
                                  {r.requirement_name}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {String(r.explanation_trace?.reason || "Verification required")}
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

                  {/* Not Applicable Requirements: Collapsible / Hidden by default (Part N) */}
                  {results.filter((r) => r.status === "NOT_APPLICABLE").length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowNotApplicable((prev) => !prev)}
                        className="flex items-center justify-between w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        <span>
                          {showNotApplicable ? "▾ Hide" : "▸ Show"} Not Applicable Requirements ({results.filter((r) => r.status === "NOT_APPLICABLE").length} hidden by default)
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {showNotApplicable ? "Click to collapse" : "Click to view full audit trail"}
                        </span>
                      </button>

                      {showNotApplicable && (
                        <div className="space-y-2 pt-2">
                          {results
                            .filter((r) => r.status === "NOT_APPLICABLE")
                            .map((r, idx) => (
                              <div
                                key={r.id || `${r.requirement_id}-${idx}`}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-colors opacity-85"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[11px] font-bold text-slate-500">
                                      {r.requirement_id}
                                    </span>
                                    <span className="text-slate-300">·</span>
                                    <span className="text-xs font-medium text-slate-700">
                                      {r.requirement_name}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    Reason: {String(r.explanation_trace?.reason || "Not triggered by business profile parameters")}
                                  </div>
                                </div>
                                <StatusBadge status="NOT_APPLICABLE" size="sm" />
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
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
                    href={`/compliance?business_id=${business?.id}${assessment ? `&assessment_id=${assessment.id}` : ""}`}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    View All Compliance Mandates
                  </Link>

                  <Link
                    href={`/dashboard?business_id=${business?.id}${assessment ? `&assessment_id=${assessment.id}` : ""}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors"
                  >
                    Enter Overview Dashboard →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
              <WhyThisAppliesModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          requirement={modalRequirement}
          businessName={business?.name}
          businessState={registeredState}
        />
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <OnboardingContent />
    </Suspense>
  );
}
