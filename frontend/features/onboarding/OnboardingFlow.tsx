"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import ErrorState from "@/components/ErrorState";
import WhyThisAppliesModal from "@/components/WhyThisAppliesModal";
import { api } from "@/lib/api";
import {
  Business,
  Assessment,
  DecisionRun,
  ProfileVariableDefinition,
  ProfileVariableChoice,
  ProfileVariableValue,
  DiscoveryRunResult,
  ComplianceRequirementItem,
} from "@/types";
import { useBusinessContext } from "@/context/BusinessContext";
import { useLanguage } from "@/context/LanguageContext";
import { DemoPresetDefinition } from "@/data/demo/controlledPresets";
import {
  OrchestrationQuestion,
  BusinessUnderstandingResponse,
  ComplianceResponse,
} from "@/lib/api/orchestration";
import { STARTER_SUGGESTIONS } from "@/data/businessStarters";
import BusinessUnderstandingCard from "@/components/onboarding/BusinessUnderstandingCard";
import FifteenQuestionsWizard from "@/components/onboarding/FifteenQuestionsWizard";
import AssessmentResultsSummary from "@/components/onboarding/AssessmentResultsSummary";

import BusinessProfileStep from "./BusinessProfileStep";
import AssessmentProgress from "./AssessmentProgress";
import AssessmentDecisionResults from "./AssessmentDecisionResults";
import { FALLBACK_VAR_DEFS } from "./profileDefaults";


export default function OnboardingFlow() {
  const router = useRouter();
  const { updateProfile } = useBusinessContext();
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const paramBusinessId = searchParams?.get("business_id") || null;
  const paramAssessmentId = searchParams?.get("assessment_id") || null;
  const isExplicitNew = searchParams?.get("new") === "true";
  const isNewAssessment = searchParams?.get("new_assessment") === "true" || searchParams?.get("new_assessment") === "1";

  const steps = useMemo(() => [
    { num: 1, id: "profile", label: t("onboarding.step1") },
    { num: 2, id: "products", label: t("onboarding.step2") },
    { num: 3, id: "questions", label: t("onboarding.step3") },
    { num: 4, id: "analysis", label: t("onboarding.step4") },
    { num: 5, id: "results", label: t("onboarding.step5") },
  ], [t]);

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
  const [questionLoading, setQuestionLoading] = useState<boolean>(false);

  // Step 4 & 5: Analysis and Results State
  const [analysisStages, setAnalysisStages] = useState<
    Array<{ name: string; done: boolean; detail: string }>
  >([]);
  const analysisInFlight = useRef(false);
  const [decisionRun, setDecisionRun] = useState<DecisionRun | null>(null);
  const [discoveryResult, setDiscoveryResult] = useState<DiscoveryRunResult | null>(null);
  const [executiveSummary, setExecutiveSummary] = useState<any>(null);
  const [showNotApplicable, setShowNotApplicable] = useState<boolean>(false);
  const [modalRequirement, setModalRequirement] = useState<ComplianceRequirementItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeQueryText, setActiveQueryText] = useState<string>("Analyzing regulatory parameters...");

  // Step 04: Assessment Orchestration & Controlled Demo Presets
  const [selectedPresetKey, setSelectedPresetKey] = useState<string | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [businessUnderstanding, setBusinessUnderstanding] = useState<BusinessUnderstandingResponse | null>(null);
  const [understandingLoading, setUnderstandingLoading] = useState<boolean>(false);
  const [orchestrationQuestions, setOrchestrationQuestions] = useState<OrchestrationQuestion[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [synthesizedCompliance, setSynthesizedCompliance] = useState<ComplianceResponse | null>(null);
  const [matchedSchemesCount, setMatchedSchemesCount] = useState<number>(0);
  const [matchedStandardsCount, setMatchedStandardsCount] = useState<number>(0);

  const handleSelectPreset = React.useCallback((preset: DemoPresetDefinition) => {
    setSelectedPresetKey(preset.presetKey);
    setBusinessName(preset.businessName);
    setLegalConstitution(
      preset.businessType.includes("Private Limited")
        ? "PRIVATE_LIMITED"
        : preset.businessType.includes("Public Limited")
        ? "PUBLIC_LIMITED"
        : preset.businessType.includes("Partnership")
        ? "PARTNERSHIP"
        : "PROPRIETORSHIP"
    );
    setRegisteredState(preset.state.toUpperCase().replaceAll(" ", "_"));
    setDistrict(preset.district);
    setIndustrialZone(preset.industrialZoneStatus);
    setLifecycleStage("OPERATIONAL");
    setPlantInvestmentLakhs(String(preset.plantInvestmentLakhs));
    setTurnoverLakhs(String(preset.annualTurnoverLakhs));
    setEmployeeCount(String(preset.employeeCount));
    setProductDescription(preset.productDescription || "");
    setTradeIntent(
      preset.exports
        ? "EXPORT_ONLY"
        : preset.activities.some((a) => a.toLowerCase().includes("import"))
        ? "IMPORT_ONLY"
        : "NONE"
    );
    setStep(1);
  }, []);

  const loadVariableDefinitions = React.useCallback(async () => {
    setVarDefsError(null);
    try {
      const defs = await api.businesses.getVariableDefinitions();
      if (Array.isArray(defs) && defs.length > 0) {
        setVarDefs(defs);
      } else {
        setVarDefs(FALLBACK_VAR_DEFS);
      }
    } catch {
      // Backend offline: use canonical variable definitions for standalone demo mode
      setVarDefs(FALLBACK_VAR_DEFS);
    }
  }, []);

  // Reset onboarding form for a fresh new entity assessment
  const handleStartFresh = React.useCallback(() => {
    setBusiness(null);
    setAssessment(null);
    setActiveRunId(null);
    setSelectedPresetKey(null);
    setBusinessUnderstanding(null);
    setOrchestrationQuestions([]);
    setSynthesizedCompliance(null);
    setDiscoveryResult(null);
    setExecutiveSummary(null);
    setMatchedSchemesCount(0);
    setMatchedStandardsCount(0);
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
    setDecisionRun(null);
    setStep(1);
    localStorage.removeItem("complywise_active_assessment_id");
    router.push("/onboarding?new=true");
  }, [router]);

  // React development effects can replay. One initialization per route context
  // prevents two simultaneous GETs from generating the same question plan.
  const initializedContext = useRef<string | null>(null);
  // Load canonical variable definitions, assessment, and business state on mount
  useEffect(() => {
    const contextKey = JSON.stringify([paramBusinessId, paramAssessmentId, isExplicitNew, isNewAssessment]);
    if (initializedContext.current === contextKey) return;
    initializedContext.current = contextKey;
    // A selected route is a new assessment context, even when this component stays mounted.
    setActiveRunId(null);
    setAssessment(null);
    setBusiness(null);
    setOrchestrationQuestions([]);
    setSynthesizedCompliance(null);
    setDecisionRun(null);
    setDiscoveryResult(null);
    setExecutiveSummary(null);
    setBusinessUnderstanding(null);
    setMatchedSchemesCount(0);
    setMatchedStandardsCount(0);
    setSelectedPresetKey(null);
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
    setLoading(false);
    setError(null);
    setStep(1);
    async function init() {
      await loadVariableDefinitions();
      if (initializedContext.current !== contextKey) return;

      let targetBiz: Business | null = null;
      let targetAss: Assessment | null = null;

      // 1. Explicit assessment resumption
      const effectiveAssId =
        paramAssessmentId ||
        (!isExplicitNew && !isNewAssessment && typeof window !== "undefined"
          ? localStorage.getItem("complywise_active_assessment_id")
          : null);

      if (effectiveAssId) {
        try {
          if (paramBusinessId) {
            targetAss = await api.businesses.getAssessment(paramBusinessId, effectiveAssId);
          } else {
            targetAss = await api.businesses.getAssessmentDirect(effectiveAssId);
          }
        } catch (e) {
          console.error("Could not fetch assessment directly:", e);
        }
      }

      // If assessment resolved
      if (targetAss) {
        if (initializedContext.current !== contextKey) return;
        setAssessment(targetAss);
        setActiveRunId(targetAss.id);
        localStorage.setItem("complywise_active_assessment_id", targetAss.id);

        const resolvedBizId = targetAss.business_id || paramBusinessId;
        if (resolvedBizId) {
          try {
            targetBiz = await api.businesses.get(resolvedBizId);
            if (initializedContext.current !== contextKey) return;
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

        const resumeStep = Math.max(1, Math.min(targetAss.current_step || 1, 5));
        setStep(resumeStep);

        if (resolvedBizId && resumeStep === 3) {
          handleProceedToQuestions(resolvedBizId, targetAss.id);
        }

        if (resolvedBizId && resumeStep === 5) {
          try {
            if (targetAss.decision_run_id) {
              const evalRun = await api.applicability.getDecision(resolvedBizId, targetAss.decision_run_id);
              if (initializedContext.current === contextKey) setDecisionRun(evalRun);
            }
          } catch {}
        }
        return;
      }

      // 2. Business provided without explicit assessment ID
      if (paramBusinessId && !isExplicitNew) {
        try {
          const b = await api.businesses.get(paramBusinessId);
          if (initializedContext.current !== contextKey) return;
          setBusiness(b);
          setBusinessName(b.name);
          localStorage.setItem("complywise_active_business_id", b.id);

          try {
            const profileData = await api.businesses.getProfile(b.id);
            if (initializedContext.current !== contextKey) return;
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
            setActiveRunId(null);
            localStorage.removeItem("complywise_active_assessment_id");
            setStep(1);
          } else {
            // Check for existing active assessment
            const existingList = await api.businesses.getAssessments(b.id).catch(() => []);
            if (existingList.length > 0) {
              const latest = await api.businesses.getAssessment(b.id, existingList[0].id).catch(() => null);
              if (initializedContext.current !== contextKey) return;
              if (latest) {
                setAssessment(latest);
                setActiveRunId(latest.id);
                localStorage.setItem("complywise_active_assessment_id", latest.id);
                if (latest.current_step && latest.current_step > 1) {
                  const resumeStep = Math.min(latest.current_step, 5);
                  setStep(resumeStep);
                  if (resumeStep === 3) {
                    handleProceedToQuestions(b.id, latest.id);
                  }
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
        setActiveRunId(null);
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

      // Ensure Assessment exists and save step 1 state (IDEMPOTENT: reuse existing IN_PROGRESS assessment)
      let currAssessment = assessment;
      if (!currAssessment) {
        const existingList = await api.businesses.getAssessments(currentBiz.id).catch(() => []);
        // Reuse an existing IN_PROGRESS or DRAFT assessment instead of creating a duplicate
        const existingActive = (existingList as any[]).find(
          (a: any) => a.status === "IN_PROGRESS" || a.status === "DRAFT"
        );
        if (existingActive) {
          currAssessment = existingActive;
        } else {
          const nextNum = existingList.length + 1;
          currAssessment = await api.businesses.createAssessment(currentBiz.id, {
            title: `Assessment #${nextNum} — ${currentBiz.name}`,
          });
        }
        if (currAssessment) {
          setAssessment(currAssessment);
          localStorage.setItem("complywise_active_assessment_id", currAssessment.id);
        }
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

      if (currAssessment) {
        const updatedStepState = {
          ...(currAssessment.step_state || {}),
          profile: profileState,
          starting_profile: selectedPresetKey ? { key: selectedPresetKey, suggestions: STARTER_SUGGESTIONS[selectedPresetKey] || {} } : null,
        };

        await api.businesses.updateAssessment(currentBiz.id, currAssessment.id, {
          current_step: 2,
          step_state: updatedStepState,
        });
      }
      updateProfile({
        businessName: trimmedName,
        businessType: legalConstitution || "Not provided",
        state: registeredState || "Not provided",
        district: district.trim() || "Not provided",
        location: [district.trim(), registeredState].filter(Boolean).join(", ") || "Not provided",
        employeeCount: employeeCount.trim() === "" ? 0 : Number(employeeCount),
        annualTurnoverLakhs: turnoverLakhs ? Number(turnoverLakhs) : 0,
        plantInvestmentLakhs: plantInvestmentLakhs ? Number(plantInvestmentLakhs) : 0,
        industrialZoneStatus: industrialZone || "Not provided",
        lifecycleStage: lifecycleStage || "Not provided",
      });

      setStep(2);
    } catch {
      setError("Your business profile wasn't saved. Your details are preserved; please try again.");
    } finally {
      setLoading(false);
    }
  }

  // STEP 2 SUBMIT: Save Products & Activities
  async function handleProductsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    updateProfile({
      activities: productDescription
        ? [productDescription]
        : [],
    });

    try {
      let activeBiz = business;
      if (!activeBiz) {
        const storedBizId = localStorage.getItem("complywise_active_business_id");
        if (storedBizId) {
          try {
            activeBiz = await api.businesses.get(storedBizId);
            setBusiness(activeBiz);
          } catch {}
        }
      }

      if (activeBiz) {
        const resp = await api.onboarding.saveProductsActivities(
          activeBiz.id,
          {
            product_description: productDescription,
            ...(tradeIntent ? { import_export_intent: tradeIntent } : {}),
            ...(assessment?.id ? { assessment_id: assessment.id } : {}),
          }
        );
        setDetectedActivities(resp.detected_activities);

        // Step 04: Initialize Assessment Orchestration Run & AI Business Understanding
        let currRunId = activeRunId;
        try {
          const orchRun = await api.orchestration.createRun({ business_id: activeBiz.id });
          if (orchRun && orchRun.run_id) {
            currRunId = orchRun.run_id;
            setActiveRunId(currRunId);
            localStorage.setItem("complywise_active_assessment_id", currRunId);
          }
        } catch (rErr) {
          console.warn("Could not create orchestration run:", rErr);
        }

        let gotUnderstanding = false;
        if (currRunId) {
          try {
            setUnderstandingLoading(true);
            const under = await api.orchestration.understand(currRunId);
            if (
              under &&
              (under.business_summary ||
                under.primary_activity ||
                under.operational_activities ||
                under.operational_characteristics ||
                under.business_type)
            ) {
              setBusinessUnderstanding({
                ...under,
                business_summary: under.business_summary || under.primary_activity,
                operational_activities:
                  under.operational_activities ||
                  under.operational_characteristics ||
                  under.products,
                identified_sector: under.identified_sector || under.business_type,
                risk_categories:
                  under.risk_categories || under.likely_regulatory_domains,
              });
              gotUnderstanding = true;
            }
          } catch (uErr) {
            console.warn("AI understanding error:", uErr);
          } finally {
            setUnderstandingLoading(false);
          }

          // The question-list endpoint prepares once when the owner continues.
          // Avoid a concurrent background generation racing that same request.

        }



        if (assessment) {
          const updatedStepState = {
            ...(assessment.step_state || {}),
            products: {
              productDescription,
              tradeIntent,
              detectedActivities: resp.detected_activities,
            },
          };
          const updatedAss = await api.businesses.updateAssessment(activeBiz.id, assessment.id, {
            current_step: gotUnderstanding ? 2 : 3,
            step_state: updatedStepState,
          });
          setAssessment(updatedAss);
        }

        // If AI understanding briefing is available, stay on Step 2 to show briefing, otherwise advance to 3
        if (!gotUnderstanding) {
          handleProceedToQuestions();
        }
      } else {
        setError("Save your business profile before continuing. Your description is preserved.");
      }
    } catch {
      setError("Your business activities weren't saved. Please try again; your description is preserved.");
    } finally {
      setLoading(false);
    }
  }

  // Proceed from business understanding to adaptive questions
  async function handleProceedToQuestions(resumeBusinessId?: string, resumeRunId?: string) {
    if (questionLoading) return;
    setQuestionLoading(true);
    setError(null);
    setStep(3);
    try {
      const bizId = resumeBusinessId || business?.id;
      if (!bizId) throw new Error("Save your business profile before continuing.");
      let runId = resumeRunId || activeRunId || assessment?.id;
      if (!runId) {
        const run = await api.orchestration.createRun({ business_id: bizId });
        runId = run.run_id;
        setActiveRunId(runId);
      }
      if (!runId) throw new Error("Your assessment could not be opened. Please retry.");
      const qList = await api.orchestration.listQuestions(runId);
      if (!Array.isArray(qList?.questions)) throw new Error("Your questions could not be prepared. Please retry.");
      const questions = qList.questions.slice(0, 5);
      setOrchestrationQuestions(questions);
      const nextIdx = questions.findIndex((q: any) => !q.is_answered);
      if (questions.length === 0 || nextIdx === -1) {
        setStep(4);
        await runRegulatoryAnalysis(bizId, runId);
      } else {
        setActiveQuestionIndex(nextIdx);
      }
    } catch (err: any) {
      setError(err?.message || "We couldn't prepare your questions. Your details are saved; please retry.");
    } finally {
      setQuestionLoading(false);
    }
  }

  // STEP 3: Complete questions and transition to statutory evaluation
  async function handleProceedToAnalysis() {
    if (analysisInFlight.current) return;
    if (!business) { setError("Save your business profile before continuing."); return; }
    try {
      const assessmentId = activeRunId || assessment?.id;
      if (!assessmentId) throw new Error("Your assessment could not be opened. Please retry.");
      await api.businesses.updateAssessment(business.id, assessmentId, { current_step: 4 });
      setStep(4);
      await runRegulatoryAnalysis(business.id, assessmentId);
    } catch (err: any) {
      setError(err?.message || "We couldn't save your progress. Please retry.");
    }
  }

  // Open "Why do I need this?" modal
  function openWhyModal(r: any) {
    const citations = (r.evidence_refs || []).map((ref: any) => {
      if (typeof ref === "object" && ref !== null) {
        return {
          evidence_id: String(ref.evidence_id || ref.id || ""),
          authority: String(ref.authority || r.authority || "Regulatory Authority"),
          locator: String(ref.locator || "Official Statutory Citation"),
          verification_status: (ref.verification_status || "UNVERIFIED") as any,
          excerpt: String(ref.excerpt || "Source passage not recorded."),
          source_title: String(ref.source_title || ref.title || "Source not recorded"),
          canonical_url: ref.canonical_url || ref.source_url || undefined,
        };
      }
      const refStr = String(ref || "");
      return {
        evidence_id: refStr,
        authority: String(r.authority || "Regulatory Authority"),
        locator: refStr,
        verification_status: "UNVERIFIED" as const,
        excerpt: "Source passage not recorded.",
        source_title: "Source not recorded",
      };
    });

    const reqItem: ComplianceRequirementItem = {
      requirement_id: String(r.requirement_id || ""),
      result_origin: r.result_origin,
      source_reference: r.source_reference,
      name: String(r.name || r.requirement_name || "Statutory Requirement"),
      authority: String(r.authority || "Regulatory Authority"),
      domain: String(r.domain || "Statutory Mandate"),
      category: String(r.category || r.domain || "STATUTORY"),
      jurisdiction: String(r.jurisdiction || "Not provided"),
      status: r.status,
      evidence_count: citations.length || (r.evidence_ids?.length ?? 0),
      description: typeof r.explanation_trace?.reason === "string" 
        ? r.explanation_trace.reason 
        : (typeof r.description === "string" && r.description ? r.description : (typeof r.applicability_statement === "string" ? r.applicability_statement : "Statutory compliance mandate evaluated under Indian law.")),
      citations: (r.citations && r.citations.length > 0)
        ? r.citations.map((c: any) => ({
            evidence_id: String(c.evidence_id || ""),
            authority: String(c.authority || r.authority || "Regulatory Authority"),
            locator: String(c.locator || r.statutory_act || "Statutory Schedule"),
            verification_status: (c.verification_status || "UNVERIFIED") as any,
            excerpt: String(c.excerpt || "Source passage not recorded."),
            source_title: String(c.source_title || "Source not recorded"),
            canonical_url: c.canonical_url,
          }))
        : citations,
      citation_count: (r.citations && r.citations.length > 0) ? r.citations.length : citations.length,
      applicable_facts: r.applicable_facts,
      missing_facts: r.missing_facts,
      action_summary: r.action_summary,
      portal_url: r.portal_url,
      portal_name: r.portal_name,
    } as any;
    setModalRequirement(reqItem);
    setIsModalOpen(true);
  }

  // STEP 4: Run Real Regulatory Analysis & Live Regulatory Discovery
  async function runRegulatoryAnalysis(bizId: string, assId?: string) {
    if (analysisInFlight.current) return;
    analysisInFlight.current = true;
    const routeContext = initializedContext.current;
    const contextIsCurrent = () => initializedContext.current === routeContext;
    setLoading(true);
    setError(null);

    setAnalysisStages([]);

    setActiveQueryText("Checking requirements against your business information…");

    try {
      const effectiveAssId = assId || assessment?.id;

      // Step 04: Execute Assessment Orchestration Live Regulatory Intelligence
      const targetRunId = assId || activeRunId || effectiveAssId;
      if (targetRunId) {
        try {
          setActiveQueryText("Finding and reviewing relevant official sources…");
          await api.orchestration.runDiscovery(targetRunId); // Partial capture is a normal backend result; failed requests preserve inputs.
          if (!contextIsCurrent()) return;
          setAnalysisStages([{ name: "Source discovery", done: true, detail: "Discovery response received; source coverage may be partial." }]);
          setActiveQueryText("Checking your saved facts against available rules and evidence…");
          const compRes = await api.orchestration.runSynthesis(targetRunId);
          if (!contextIsCurrent()) return;
          if (compRes && compRes.requirements) {
            setSynthesizedCompliance(compRes);
          }
          setActiveQueryText("Reviewing standards and scheme matches…");
          const [schRes, stdRes] = await Promise.allSettled([
            api.orchestration.getSchemes(targetRunId),
            api.orchestration.getStandards(targetRunId),
          ]);
          if (!contextIsCurrent()) return;
          if (schRes.status === "fulfilled" && schRes.value?.schemes) {
            setMatchedSchemesCount(schRes.value.schemes.length);
          }
          if (stdRes.status === "fulfilled" && stdRes.value?.standards) {
            setMatchedStandardsCount(stdRes.value.standards.length);
          }
        } catch (orchPipelineErr) {
          throw orchPipelineErr;
        }
      }

      setActiveQueryText("Building your assessment workspace from the saved analysis…");
      const orchResult = await api.discovery.orchestrate(bizId, targetRunId || effectiveAssId, false);
      if (!contextIsCurrent()) return;
      const workspaceCompliance = await api.compliance.list(bizId, { assessment_id: targetRunId || effectiveAssId });
      if (!contextIsCurrent()) return;
      setSynthesizedCompliance({ requirements: workspaceCompliance.requirements as any, summary: {
        total_applicable: workspaceCompliance.requirements.filter(r => r.status === "APPLICABLE").length,
        total_needs_info: workspaceCompliance.requirements.filter(r => r.status === "NEEDS_INFORMATION").length,
        total_not_applicable: workspaceCompliance.requirements.filter(r => r.status === "NOT_APPLICABLE").length,
      } });

      if (orchResult?.stages && Array.isArray(orchResult.stages)) {
        setAnalysisStages(
          orchResult.stages.map((st: any) => ({
            name: st.name,
            done: st.status === "COMPLETED",
            detail: st.detail,
          }))
        );
      } else {
        setAnalysisStages([]);
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
        throw new Error("The saved assessment result was not returned. Please retry.");
      }

      // Refresh assessment record to capture completed status
      if (effectiveAssId) {
        try {
          const refreshedAss = await api.businesses.getAssessment(bizId, effectiveAssId);
          if (!contextIsCurrent()) return;
          setAssessment(refreshedAss);
        } catch {}
      }

      setStep(5);
      setLoading(false);
    } catch {
      if (!contextIsCurrent()) return;
      setError("We couldn't complete your assessment. Your answers are preserved; please try again.");
      setStep(3);
      setLoading(false);
    } finally {
      analysisInFlight.current = false;
    }
  }

  return (
    <div className="ui-onboarding min-h-screen bg-[var(--ui-bg)] text-[var(--ui-text)] flex flex-col font-sans">
      <Navbar variant="onboarding" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stepper Header */}
        <div className="bg-white rounded-2xl border border-[var(--ui-border)] p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--ui-border)] pb-4">
            <div>
              <span className="ui-eyebrow">
                Building your business context
              </span>
              <h1 className="text-xl sm:text-2xl font-sans font-bold tracking-tight text-[var(--ui-text)] mt-0.5">
                {step === 1 ? "Let's understand your business." : steps.find((s) => s.num === step)?.label}
              </h1>
            </div>
            {business ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2 rounded-full bg-[var(--ui-inset)] border border-[var(--ui-border)] px-3 py-1.5 text-xs text-[var(--ui-secondary)]">
                  <span className="font-semibold text-[var(--ui-text)]">{business.name}</span>
                  <span className="text-[var(--ui-muted)]">·</span>
                  <span className="font-mono text-[var(--ui-secondary)]">ID: {business.id.slice(0, 8)}</span>
                </div>
                {assessment && (
                  <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
                    <span>Assessment #{assessment.assessment_number}</span>
                    <span className="text-amber-400">·</span>
                    <span className="uppercase text-[10px] font-semibold">{assessment.status}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleStartFresh}
                  className="rounded-full border border-[var(--ui-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--ui-text)] hover:bg-[var(--ui-bg)] transition-colors cursor-pointer shadow-2xs"
                >
                  {t("onboarding.newEntity")}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-800 font-semibold">
                <span>{t("onboarding.newEntityAssessment")}</span>
              </div>
            )}
          </div>

          {/* Stepper Dots & Links */}
          <nav aria-label="Progress" className="mt-6">
            <ol className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
              {steps.map((s) => {
                const isCurrent = s.num === step;
                const isCompleted = s.num < step;
                return (
                  <li key={s.id} className="relative">
                    <button
                      type="button"
                      disabled={s.num > step}
                      aria-current={isCurrent ? "step" : undefined}
                      onClick={() => s.num < step && setStep(s.num)}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all ${
                        isCurrent
                          ? "bg-[var(--ui-sage-faint)] border border-[var(--ui-sage-soft)] shadow-2xs"
                          : isCompleted
                          ? "hover:bg-[var(--ui-bg)] cursor-pointer border border-transparent"
                          : "opacity-40 cursor-not-allowed border border-transparent"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isCurrent
                            ? "bg-[var(--ui-text)] text-white shadow-2xs"
                            : isCompleted
                            ? "bg-[var(--ui-sage)] text-white"
                            : "bg-[var(--ui-inset)] border border-[var(--ui-border)] text-[var(--ui-muted)]"
                        }`}
                      >
                        {isCompleted ? "✓" : s.num}
                      </span>
                      <span className={`text-xs font-semibold truncate ${isCurrent || isCompleted ? "text-[var(--ui-text)]" : "text-[var(--ui-muted)]"}`}>
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
            title="We couldn't complete this step."
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
          <BusinessProfileStep
            fields={{ businessName, legalConstitution, registeredState, district, industrialZone, lifecycleStage, plantInvestmentLakhs, turnoverLakhs, employeeCount }}
            options={{ legalConstitutionOptions, stateOptions, industrialZoneOptions, lifecycleStageOptions }}
            selectedPresetKey={selectedPresetKey}
            loading={loading}
            handleProfileSubmit={handleProfileSubmit}
            handleSelectPreset={handleSelectPreset}
            onStartOwn={() => { setSelectedPresetKey(null); setBusinessName(""); setProductDescription(""); setEmployeeCount(""); setTurnoverLakhs(""); setPlantInvestmentLakhs(""); setDistrict(""); setRegisteredState(""); setLegalConstitution(""); setIndustrialZone(""); setLifecycleStage(""); setTradeIntent("NONE"); }}
            onChange={(field, value) => ({ businessName: setBusinessName, legalConstitution: setLegalConstitution, registeredState: setRegisteredState, district: setDistrict, industrialZone: setIndustrialZone, lifecycleStage: setLifecycleStage, plantInvestmentLakhs: setPlantInvestmentLakhs, turnoverLakhs: setTurnoverLakhs, employeeCount: setEmployeeCount })[field](value)}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 2: PRODUCTS & ACTIVITIES                                 */}
        {/* ------------------------------------------------------------- */}
        {step === 2 && businessUnderstanding && (
          <BusinessUnderstandingCard
            businessName={businessName || business?.name || "Your Enterprise"}
            understanding={businessUnderstanding}
            loading={understandingLoading}
            onProceed={() => handleProceedToQuestions()}
            onEditProducts={() => setBusinessUnderstanding(null)}
          />
        )}

        {step === 2 && !businessUnderstanding && (
          <form
            onSubmit={handleProductsSubmit}
            className="bg-white rounded-2xl border border-[var(--ui-border)] p-6 sm:p-8 shadow-2xs space-y-6"
          >
            <div className="border-b border-[var(--ui-border)] pb-4">
              <h2 className="text-base font-sans font-bold text-[var(--ui-text)]">
                What does your business do?
              </h2>
              <p className="text-xs text-[var(--ui-secondary)] mt-1">
                Tell us what you make, sell or provide. We’ll use those details to find the relevant requirements and ask only when something important is missing.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--ui-secondary)] mb-1.5">
                  Describe your products, services and daily operations *
                </label>
                <textarea
                  required
                  rows={5}
                  value={productDescription}
                  aria-label="Business activities"
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="For example: We make and package snacks, store ingredients at our facility, and supply shops across Maharashtra."
                  className="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] p-3 text-sm text-[var(--ui-text)] placeholder-[var(--ui-muted)] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed"
                />
                <p className="text-[11px] text-[var(--ui-secondary)] mt-1">
                  Include where you operate, who you supply and any manufacturing, storage or trade activities.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ui-secondary)] mb-1.5">
                  Import or export intent
                </label>
                <select
                  value={tradeIntent}
                  aria-label="Import or export intent"
                  onChange={(e) => setTradeIntent(e.target.value)}
                  className="w-full rounded-lg border border-[var(--ui-border)] bg-[var(--ui-bg)] px-3.5 py-2.5 text-sm text-[var(--ui-text)] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                >
                  <option value="" className="bg-white text-[var(--ui-secondary)]">Not specified</option>
                  {tradeIntentOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white text-[var(--ui-text)]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {detectedActivities.length > 0 && (
              <div className="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-4">
                <span className="text-xs font-semibold text-[var(--ui-text)] block mb-2">
                  Activities identified:
                </span>
                <div className="flex flex-wrap gap-2">
                  {detectedActivities.map((act, idx) => (
                    <span
                      key={`${act}-${idx}`}
                      className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200"
                    >
                      {act}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-[var(--ui-border)]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-full border border-[var(--ui-border)] bg-white px-5 py-2 text-xs font-semibold text-[var(--ui-secondary)] hover:bg-[var(--ui-bg)] transition-colors cursor-pointer shadow-2xs"
              >
                {t("onboarding.backToProfile")}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--ui-text)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--ui-text)] disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
              >
                {loading ? t("onboarding.analyzingOperations") : t("onboarding.generateQuestions")}
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 3: SEQUENTIAL ADAPTIVE STATUTORY QUESTIONING             */}
        {/* ------------------------------------------------------------- */}
        {step === 3 && orchestrationQuestions.length > 0 && (
          <FifteenQuestionsWizard
            questions={orchestrationQuestions}
            activeQuestionIndex={activeQuestionIndex}
            onSelectQuestionIndex={(idx) => {
              setActiveQuestionIndex(idx);
            }}
            onAnswerSubmitted={async (qId, val) => {
              const runId = activeRunId || assessment?.id;
              if (!runId) throw new Error("Your assessment could not be opened. Please retry.");
              await api.orchestration.submitAnswer(runId, { question_id: qId, value: val });
              setOrchestrationQuestions((prev) =>
                prev.map((q) => (q.question_id === qId ? { ...q, is_answered: true, current_value: val } : q))
              );
            }}
            onCompleteQuestions={handleProceedToAnalysis}
            onBackToProducts={() => setStep(2)}
            loading={questionLoading}
          />
        )}

        {step === 3 && orchestrationQuestions.length === 0 && (
          <div className="bg-white rounded-2xl border border-[var(--ui-border)] p-8 sm:p-12 text-center space-y-6 shadow-2xs">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--ui-sage-faint)] border border-[var(--ui-sage-soft)] text-[var(--ui-sage)] animate-pulse text-2xl font-bold">
              ⚡
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--ui-text)]">
                Only the details that matter
              </h2>
              <p className="text-xs sm:text-sm text-[var(--ui-secondary)] leading-relaxed">
                We’re checking which missing details would change the requirements or next steps for {businessName || business?.name || "your business"}.
              </p>
            </div>
            {questionLoading ? (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[var(--ui-sage)]">
                <span className="inline-block h-2 w-2 rounded-full bg-[var(--ui-sage)] animate-ping" />
                <span>Generating questions...</span>
              </div>
            ) : (
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-full border border-[var(--ui-border)] bg-white px-5 py-2 text-xs font-semibold text-[var(--ui-secondary)] hover:bg-[var(--ui-bg)] transition-colors shadow-2xs cursor-pointer"
                >
                  ← Back to Operations
                </button>
                <button
                  type="button"
                  onClick={() => handleProceedToQuestions()}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--ui-text)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--ui-text)] transition-colors shadow-2xs cursor-pointer"
                >
                  Prepare questions
                </button>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 4: REGULATORY ANALYSIS (8-STAGE ORCHESTRATION PIPELINE) */}
        {step === 4 && (
          <AssessmentProgress businessName={business?.name} activeQueryText={activeQueryText} analysisStages={analysisStages} />
        )}

        {/* STEP 5: INITIAL RESULTS                                       */}
        {/* ------------------------------------------------------------- */}
        {step === 5 && (
          synthesizedCompliance ? (
            <AssessmentResultsSummary
              businessName={businessName || business?.name || "Your Enterprise"}
              compliance={synthesizedCompliance}
              schemesCount={matchedSchemesCount}
              standardsCount={matchedStandardsCount}
              onOpenDashboard={() => router.push(`/dashboard?business_id=${business?.id || ""}&assessment_id=${activeRunId || assessment?.id || ""}`)}
              onOpenCompliance={() => router.push(`/compliance?business_id=${business?.id || ""}&assessment_id=${activeRunId || assessment?.id || ""}`)}
              onOpenSchemes={() => router.push(`/schemes?business_id=${business?.id || ""}&assessment_id=${activeRunId || assessment?.id || ""}`)}
              onOpenWhyModal={(req) => openWhyModal(req)}
            />
          ) : (
            <AssessmentDecisionResults business={business} assessment={assessment}
              registeredState={registeredState} decisionRun={decisionRun}
              discoveryResult={discoveryResult} executiveSummary={executiveSummary}
              showNotApplicable={showNotApplicable}
              onToggleNotApplicable={() => setShowNotApplicable((previous) => !previous)}
              onRefineQuestions={() => setStep(3)} openWhyModal={openWhyModal}
            />
          )
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
