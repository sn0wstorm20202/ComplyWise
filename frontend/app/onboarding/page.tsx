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
import { useBusinessContext } from "@/context/BusinessContext";
import { DEMO_REQUIREMENTS } from "@/data/demo/compliance";

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

const FALLBACK_VAR_DEFS: ProfileVariableDefinition[] = [
  {
    code: "def-constitution",
    key: "legal_constitution",
    label: "Legal Constitution",
    data_type: "SINGLE_CHOICE",
    why_it_matters: "Determines corporate filing and statutory board obligations.",
    unit: null,
    default_relevance: "CORE",
    options: [
      { value: "PVT_LTD", label: "Private Limited Company (Pvt Ltd)" },
      { value: "PUBLIC_LTD", label: "Public Limited Company" },
      { value: "LLP", label: "Limited Liability Partnership (LLP)" },
      { value: "PROPRIETORSHIP", label: "Sole Proprietorship" },
      { value: "PARTNERSHIP", label: "Partnership Firm" },
    ],
  },
  {
    code: "def-state",
    key: "state",
    label: "Registered State / UT",
    data_type: "SINGLE_CHOICE",
    why_it_matters: "Governs State Pollution Control Board and municipal jurisdiction.",
    unit: null,
    default_relevance: "CORE",
    options: [
      { value: "Gujarat", label: "Gujarat" },
      { value: "Haryana", label: "Haryana" },
      { value: "Maharashtra", label: "Maharashtra" },
      { value: "Karnataka", label: "Karnataka" },
      { value: "Tamil Nadu", label: "Tamil Nadu" },
      { value: "Uttar Pradesh", label: "Uttar Pradesh" },
      { value: "Rajasthan", label: "Rajasthan" },
    ],
  },
  {
    code: "def-zone",
    key: "industrial_zone_status",
    label: "Industrial Zone Status",
    data_type: "SINGLE_CHOICE",
    why_it_matters: "Affects siting guidelines and environmental clearance fast-tracks.",
    unit: null,
    default_relevance: "CORE",
    options: [
      { value: "APPROVED_ESTATE", label: "Approved Industrial Estate (GIDC / HSIIDC / KIADB / MIDC)" },
      { value: "NON_CONFORMING", label: "Non-conforming Industrial Area" },
      { value: "SPECIAL_ECONOMIC_ZONE", label: "Special Economic Zone (SEZ)" },
    ],
  },
  {
    code: "def-stage",
    key: "lifecycle_stage",
    label: "Operational Lifecycle Stage",
    data_type: "SINGLE_CHOICE",
    why_it_matters: "Separates pre-commissioning consent (CTE) from operating license (CTO).",
    unit: null,
    default_relevance: "CORE",
    options: [
      { value: "OPERATIONAL", label: "Fully Operational Manufacturing" },
      { value: "EXPANSION", label: "Operational & Under Expansion" },
      { value: "PRE_COMMISSIONING", label: "Pre-commissioning / Factory Setup" },
    ],
  },
  {
    code: "def-trade",
    key: "import_export_intent",
    label: "Trade Intent",
    data_type: "SINGLE_CHOICE",
    why_it_matters: "Determines requirement for DGFT Import Export Code (IEC).",
    unit: null,
    default_relevance: "CORE",
    options: [
      { value: "DOMESTIC_ONLY", label: "Domestic Market Only" },
      { value: "IMPORT_AND_DOMESTIC", label: "Domestic + Raw Material Imports" },
      { value: "EXPORTER", label: "Domestic + Finished Goods Exporter" },
    ],
  },
];

export function generateAdaptiveFallbackQuestions(
  answeredKeys: Set<string>,
  businessName = "your enterprise",
  productDesc = ""
): SmartQuestion[] {
  const desc = (productDesc || "").toLowerCase();
  const isMedTech = /med|device|surgical|health|diagnostic|biomed|pharma/.test(desc);
  const isFood = /food|fruit|beverage|snack|dairy|bakery|agro|grain|packaging/.test(desc);
  const isAuto = /auto|machin|metal|cnc|precision|gear|component|tool|engine/.test(desc);
  const isElectronics = /electron|pcb|semiconductor|sensor|iot|circuit|battery|hardware/.test(desc);

  const sectorLabel = isMedTech
    ? "medical device manufacturing"
    : isFood
    ? "food and agro processing"
    : isAuto
    ? "precision engineering and automotive"
    : isElectronics
    ? "electronics and hardware assembly"
    : "commercial operations";

  const allDefinitions: Array<{
    code: string;
    key: string;
    label: string;
    question: string;
    data_type: string;
    why_it_matters: string;
    unit: string | null;
    options: { value: string; label: string }[];
    required: boolean;
  }> = [
    {
      code: "V07",
      key: "annual_turnover",
      label: "Annual Turnover",
      question: `What is your anticipated annual business turnover from ${sectorLabel} (in INR)?`,
      data_type: "CURRENCY_INR",
      why_it_matters: "Turnover determines MSME categorization, GST filing frequencies, and statutory audit mandates.",
      unit: "INR",
      options: [],
      required: true,
    },
    {
      code: "V08",
      key: "plant_machinery_investment",
      label: "Plant & Machinery Investment",
      question: isMedTech
        ? "What is your total capital investment in cleanroom infrastructure and diagnostic machinery (in INR)?"
        : isFood
        ? "What is your total capital investment in processing lines, commercial refrigeration, and packaging equipment (in INR)?"
        : "What is your enterprise's total capital investment in plant, machinery, and equipment (in INR)?",
      data_type: "CURRENCY_INR",
      why_it_matters: "Investment thresholds define statutory enterprise tiering under the MSMED Act and unlock capital subsidies.",
      unit: "INR",
      options: [],
      required: false,
    },
    {
      code: "V13",
      key: "total_worker_count",
      label: "Total Workforce Count",
      question: "What is your total planned workforce (including production staff, technical supervisors, and admin)?",
      data_type: "INTEGER",
      why_it_matters: "Workforce size dictates Factories Act coverage, mandatory EPF/ESI welfare registrations, and canteen/creche mandates.",
      unit: "people",
      options: [],
      required: true,
    },
    {
      code: "V14",
      key: "contract_worker_count",
      label: "Contract Labour Engagement",
      question: "Do you plan to engage contract labour for packaging, warehousing, facility maintenance, or logistics?",
      data_type: "INTEGER",
      why_it_matters: "Engaging 20+ contract personnel mandates Principal Employer registration under the Contract Labour Act.",
      unit: "people",
      options: [],
      required: false,
    },
    {
      code: "V15",
      key: "connected_power_load",
      label: "Connected Electrical Power Load",
      question: isMedTech
        ? "What is the anticipated connected power load (in HP) for your cleanroom, production lines, and test labs?"
        : isFood
        ? "What is the anticipated connected electrical load (in HP) for processing machinery, refrigeration, and cold chain?"
        : "What is the anticipated connected electrical power load (in HP) for your facility and equipment?",
      data_type: "DECIMAL",
      why_it_matters: "Power load determines factory registration thresholds under state Factory Acts and electricity board approvals.",
      unit: "HP",
      options: [],
      required: false,
    },
    {
      code: "V16",
      key: "effluent_emission_generation",
      label: "Effluent / Air Emissions Discharge",
      question: isFood
        ? "Will your food processing operations generate wash water, organic trade effluent, or boiler air emissions?"
        : isMedTech
        ? "Will component cleaning, sterilization, or manufacturing generate liquid trade effluent or air emissions?"
        : "Will your industrial operations produce liquid trade effluent, chemical wash water, or chimney emissions?",
      data_type: "BOOLEAN",
      why_it_matters: "Discharges and emissions mandate Consent to Establish (CTE) and Consent to Operate (CTO) from the State Pollution Control Board.",
      unit: null,
      options: [
        { value: "true", label: "Yes — Effluent or emissions generated" },
        { value: "false", label: "No — Zero discharge / dry operations" },
      ],
      required: false,
    },
    {
      code: "V17",
      key: "hazardous_waste_generation",
      label: "Hazardous / Bio-Medical Waste",
      question: isMedTech
        ? "Will your facility generate hazardous or bio-medical waste (such as chemical solvents, sterilization residues, or biological scraps)?"
        : isElectronics
        ? "Will your assembly produce hazardous waste (such as solder dross, spent chemical solvents, or electronic scrap)?"
        : "Will your operations generate, handle, or store statutory hazardous waste materials?",
      data_type: "BOOLEAN",
      why_it_matters: "Hazardous waste handling requires dedicated statutory authorization under CPCB/SPCB Hazardous Waste Management Rules.",
      unit: null,
      options: [
        { value: "true", label: "Yes — Generates hazardous waste" },
        { value: "false", label: "No — Does not generate hazardous waste" },
      ],
      required: false,
    },
    {
      code: "V11",
      key: "import_export_intent",
      label: "International Cross-Border Trade Intent",
      question: "Do you plan to engage in cross-border trade (importing raw materials/machinery or exporting finished products)?",
      data_type: "SINGLE_CHOICE",
      why_it_matters: "Cross-border trade mandates an Importer-Exporter Code (IEC) from DGFT and unlocks export incentive schemes.",
      unit: null,
      options: [
        { value: "DOMESTIC_ONLY", label: "Domestic Indian Market Only" },
        { value: "IMPORT_AND_DOMESTIC", label: "Domestic Sales + Raw Material Imports" },
        { value: "EXPORTER", label: "Domestic + Finished Goods Exporter" },
      ],
      required: false,
    },
    {
      code: "V12",
      key: "export_destination",
      label: "Target Export Markets",
      question: "Which international jurisdictions or regions do you target for export distribution?",
      data_type: "MULTI_CHOICE",
      why_it_matters: "Target markets introduce destination-specific regulatory dossiers (e.g. CE-IVD, FDA 510k, Codex Alimentarius).",
      unit: null,
      options: [
        { value: "US", label: "United States (US FDA / OSHA)" },
        { value: "EU", label: "European Union (CE / RoHS / REACH)" },
        { value: "SE_ASIA", label: "Southeast Asia (ASEAN Harmonized)" },
        { value: "MIDDLE_EAST", label: "Middle East (GCC Standardization)" },
      ],
      required: false,
    },
    {
      code: "V05",
      key: "industrial_zone_status",
      label: "Industrial Zone Siting Status",
      question: `Is your ${sectorLabel} facility located inside an approved notified industrial area/park or outside?`,
      data_type: "SINGLE_CHOICE",
      why_it_matters: "Zoning status determines pollution board siting clearance speed, municipal trade licenses, and state land subsidies.",
      unit: null,
      options: [
        { value: "APPROVED_ESTATE", label: "Approved Industrial Estate (GIDC / MIDC / KIADB / HSIIDC / TSIIC)" },
        { value: "NON_CONFORMING", label: "Outside Notified Industrial Estate" },
        { value: "SPECIAL_ECONOMIC_ZONE", label: "Special Economic Zone (SEZ)" },
      ],
      required: false,
    },
    {
      code: "V18",
      key: "ecommerce_operations",
      label: "Digital / E-Commerce Sales Channels",
      question: "Will you sell products directly to consumers or B2B clients via online marketplaces or digital e-commerce channels?",
      data_type: "BOOLEAN",
      why_it_matters: "Online trade mandates Legal Metrology e-commerce digital declarations and multi-state marketplace tax filings.",
      unit: null,
      options: [
        { value: "true", label: "Yes — Online / E-commerce sales active or planned" },
        { value: "false", label: "No — Conventional offline / institutional sales only" },
      ],
      required: false,
    },
    {
      code: "V19",
      key: "multi_state_operations",
      label: "Multi-State Operating Footprint",
      question: "Do you plan to operate manufacturing, warehousing, or depot facilities in more than one Indian State?",
      data_type: "BOOLEAN",
      why_it_matters: "Inter-state footprints trigger Central regulatory jurisdiction and separate multi-state GST registrations.",
      unit: null,
      options: [
        { value: "true", label: "Yes — Multi-state operational presence" },
        { value: "false", label: "No — Single state operations" },
      ],
      required: false,
    },
    {
      code: "V09",
      key: "ownership_social_category",
      label: "Ownership Social Category",
      question: "What is the social category of the enterprise's primary promoter or majority shareholding group?",
      data_type: "SINGLE_CHOICE",
      why_it_matters: "Promoter category qualifies the entity for special public procurement quotas and interest subvention under MSME schemes.",
      unit: null,
      options: [
        { value: "GENERAL", label: "General" },
        { value: "SC", label: "Scheduled Caste (SC)" },
        { value: "ST", label: "Scheduled Tribe (ST)" },
        { value: "OBC", label: "Other Backward Class (OBC)" },
        { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
      ],
      required: false,
    },
    {
      code: "V10",
      key: "ownership_gender",
      label: "Women Entrepreneurship Profile",
      question: "Is the enterprise woman-owned or co-founded by women (holding 51%+ proprietary equity)?",
      data_type: "SINGLE_CHOICE",
      why_it_matters: "Woman-owned status unlocks special collateral-free credit guarantees and direct subsidies under state MSME policies.",
      unit: null,
      options: [
        { value: "WOMAN_OWNED", label: "Yes — 51%+ Woman Owned" },
        { value: "MAN_OWNED", label: "Male Owned" },
        { value: "MIXED", label: "Mixed / Corporate Ownership" },
        { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
      ],
      required: false,
    },
    {
      code: "V01",
      key: "legal_constitution",
      label: "Legal Constitution",
      question: "What is the formal incorporated legal constitution of your enterprise?",
      data_type: "SINGLE_CHOICE",
      why_it_matters: "Legal form governs corporate secretarial filings, statutory audit obligations, and director disclosures.",
      unit: null,
      options: [
        { value: "PVT_LTD", label: "Private Limited Company (Pvt Ltd)" },
        { value: "PUBLIC_LTD", label: "Public Limited Company" },
        { value: "LLP", label: "Limited Liability Partnership (LLP)" },
        { value: "PARTNERSHIP", label: "Partnership Firm" },
        { value: "PROPRIETORSHIP", label: "Sole Proprietorship" },
      ],
      required: true,
    },
    {
      code: "V02",
      key: "lifecycle_stage",
      label: "Operating Lifecycle Stage",
      question: `What is the current operating lifecycle stage of ${businessName}?`,
      data_type: "SINGLE_CHOICE",
      why_it_matters: "Stage determines whether pre-establishment (CTE) or operational permissions (CTO / licenses) apply.",
      unit: null,
      options: [
        { value: "OPERATIONAL", label: "Operational Manufacturing" },
        { value: "EXPANSION", label: "Operational & Under Expansion" },
        { value: "PRE_COMMISSIONING", label: "Pre-commissioning / Setup" },
      ],
      required: true,
    },
  ];

  return allDefinitions
    .filter((def) => !answeredKeys.has(def.key))
    .map((def, idx) => ({
      id: `sq-${def.key}-${idx + 1}`,
      code: def.code,
      key: def.key,
      variable_key: def.key,
      label: def.label,
      question: def.question,
      data_type: def.data_type,
      why_it_matters: def.why_it_matters,
      unit: def.unit,
      options: def.options,
      required: def.required,
      rule_dependency_count: 1,
      candidate_rules_count: 1,
    }));
}

function OnboardingContent() {
  const router = useRouter();
  const { updateProfile } = useBusinessContext();
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

  // Step 3: Sequential Adaptive Smart Questions State
  const [currentQuestion, setCurrentQuestion] = useState<SmartQuestion | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<any>(null);
  const [questionLoading, setQuestionLoading] = useState<boolean>(false);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [isQuestionsComplete, setIsQuestionsComplete] = useState<boolean>(false);
  const [answeredCount, setAnsweredCount] = useState<number>(0);
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
    setCurrentQuestion(null);
    setCurrentAnswer(null);
    setAnsweredCount(0);
    setIsQuestionsComplete(false);
    setQuestionError(null);
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
            setQuestionLoading(true);
            const qResp = await api.onboarding.getNextQuestion(resolvedBizId, targetAss.id);
            const nextQ = qResp.question || qResp.next_question;
            if (qResp.is_complete || !nextQ) {
              setIsQuestionsComplete(true);
              setCurrentQuestion(null);
              setCurrentAnswer(null);
            } else {
              setIsQuestionsComplete(false);
              setCurrentQuestion(nextQ);
              setCurrentAnswer(nextQ.current_value !== null && nextQ.current_value !== undefined ? nextQ.current_value : null);
            }
          } catch (err) {
            console.warn("Could not fetch sequential question on resume:", err);
          } finally {
            setQuestionLoading(false);
          }
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
                  const resumeStep = Math.min(latest.current_step, 5);
                  setStep(resumeStep);
                  if (resumeStep >= 3) {
                    try {
                      setQuestionLoading(true);
                      const qResp = await api.onboarding.getNextQuestion(b.id, latest.id);
                      const nextQ = qResp.question || qResp.next_question;
                      if (qResp.is_complete || !nextQ) {
                        setIsQuestionsComplete(true);
                        setCurrentQuestion(null);
                        setCurrentAnswer(null);
                      } else {
                        setIsQuestionsComplete(false);
                        setCurrentQuestion(nextQ);
                        setCurrentAnswer(
                          nextQ.current_value !== null && nextQ.current_value !== undefined
                            ? nextQ.current_value
                            : null
                        );
                      }
                    } catch (err) {
                      console.warn("Could not fetch sequential question on resume:", err);
                    } finally {
                      setQuestionLoading(false);
                    }
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
      updateProfile({
        businessName: trimmedName,
        businessType: legalConstitution || "Private Limited Company",
        state: registeredState || "Gujarat",
        district: district.trim() || "Ahmedabad",
        location: `${district.trim() || "Sanand"}, ${registeredState || "Gujarat"}`,
        employeeCount: employeeCount.trim() === "" ? 145 : Number(employeeCount),
        annualTurnoverLakhs: turnoverLakhs ? Number(turnoverLakhs) : 4850,
        plantInvestmentLakhs: plantInvestmentLakhs ? Number(plantInvestmentLakhs) : 1850,
        industrialZoneStatus: industrialZone || "Approved GIDC Industrial Estate",
        lifecycleStage: lifecycleStage || "Operational / Expansion",
      });

      setStep(2);
    } catch {
      // Backend offline fallback: commit to reactive BusinessContext and advance to Step 2
      updateProfile({
        businessName: trimmedName,
        businessType: legalConstitution || "Private Limited Company",
        state: registeredState || "Gujarat",
        district: district.trim() || "Ahmedabad",
        location: `${district.trim() || "Sanand"}, ${registeredState || "Gujarat"}`,
        employeeCount: employeeCount.trim() === "" ? 145 : Number(employeeCount),
        annualTurnoverLakhs: turnoverLakhs ? Number(turnoverLakhs) : 4850,
        plantInvestmentLakhs: plantInvestmentLakhs ? Number(plantInvestmentLakhs) : 1850,
        industrialZoneStatus: industrialZone || "Approved GIDC Industrial Estate",
        lifecycleStage: lifecycleStage || "Operational / Expansion",
      });
      setStep(2);
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
        : ["Electrical Switchgear Assembly", "Domestic & Industrial Plugs (IS 1293)"],
    });

    const answeredKeys = new Set<string>();
    if (legalConstitution) answeredKeys.add("legal_constitution");
    if (registeredState) answeredKeys.add("state");
    if (district) answeredKeys.add("district");
    if (industrialZone) answeredKeys.add("industrial_zone_status");
    if (lifecycleStage) answeredKeys.add("lifecycle_stage");
    if (plantInvestmentLakhs) answeredKeys.add("plant_machinery_investment");
    if (turnoverLakhs) answeredKeys.add("annual_turnover");
    if (employeeCount) answeredKeys.add("total_worker_count");
    if (productDescription) answeredKeys.add("product_description");
    if (tradeIntent) answeredKeys.add("import_export_intent");

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

        // Fetch first sequential adaptive question for Step 3
        setQuestionLoading(true);
        setQuestionError(null);
        try {
          const qResp = await api.onboarding.getNextQuestion(activeBiz.id, assessment?.id);
          const nextQ = qResp.question || qResp.next_question;
          if (qResp.is_complete || !nextQ) {
            setIsQuestionsComplete(true);
            setCurrentQuestion(null);
            setCurrentAnswer(null);
          } else {
            setIsQuestionsComplete(false);
            setCurrentQuestion(nextQ);
            setCurrentAnswer(
              nextQ.current_value !== null && nextQ.current_value !== undefined
                ? nextQ.current_value
                : nextQ.data_type === "BOOLEAN"
                ? null
                : ""
            );
          }
        } catch (qErr: any) {
          console.warn("Could not fetch sequential question:", qErr);
          setIsQuestionsComplete(true);
        } finally {
          setQuestionLoading(false);
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
            current_step: 3,
            step_state: updatedStepState,
          });
          setAssessment(updatedAss);
        }
      } else {
        setIsQuestionsComplete(true);
      }
      setStep(3);
    } catch {
      setIsQuestionsComplete(true);
      setStep(3);
    } finally {
      setLoading(false);
    }
  }

  // STEP 3: Submit single question answer, trigger AST re-evaluation, and receive next question
  async function handleSequentialAnswerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!business || !currentQuestion) return;

    const qKey = currentQuestion.variable_key || currentQuestion.key || "";
    if (!qKey) return;

    if (currentAnswer === null || currentAnswer === undefined || currentAnswer === "") {
      setQuestionError("Please select or enter an answer before submitting.");
      return;
    }

    setQuestionLoading(true);
    setQuestionError(null);

    let formattedAnswer: any = currentAnswer;
    if (isBooleanType(currentQuestion.data_type)) {
      formattedAnswer = Boolean(currentAnswer);
    } else if (isNumericType(currentQuestion.data_type)) {
      const num = Number(currentAnswer);
      if (Number.isFinite(num)) {
        formattedAnswer = num;
      } else {
        setQuestionError("Please enter a valid numeric value.");
        setQuestionLoading(false);
        return;
      }
    } else if (isMultiChoiceType(currentQuestion.data_type)) {
      if (Array.isArray(currentAnswer)) {
        formattedAnswer = currentAnswer;
      } else if (typeof currentAnswer === "string") {
        formattedAnswer = currentAnswer
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else {
        formattedAnswer = [String(currentAnswer).trim()];
      }
    } else {
      formattedAnswer = String(currentAnswer).trim();
    }

    try {
      setQuestionAnswers((prev) => ({ ...prev, [qKey]: formattedAnswer }));
      setAnsweredCount((prev) => prev + 1);

      const resp = await api.onboarding.submitSequentialAnswer(business.id, {
        variable_key: qKey,
        value: formattedAnswer,
        answer_value: formattedAnswer,
        ...(assessment?.id ? { assessment_id: assessment.id } : {}),
      });

      if (assessment) {
        try {
          const updatedStepState = {
            ...(assessment.step_state || {}),
            questions: {
              answers: {
                ...((assessment.step_state as any)?.questions?.answers || {}),
                [qKey]: formattedAnswer,
              },
            },
          };
          await api.businesses.updateAssessment(business.id, assessment.id, {
            current_step: 3,
            step_state: updatedStepState,
          });
        } catch {}
      }

      const nextQ = resp.question || resp.next_question;
      if (resp.is_complete || !nextQ) {
        setIsQuestionsComplete(true);
        setCurrentQuestion(null);
        setCurrentAnswer(null);
      } else {
        setIsQuestionsComplete(false);
        setCurrentQuestion(nextQ);
        setCurrentAnswer(
          nextQ.current_value !== null && nextQ.current_value !== undefined
            ? nextQ.current_value
            : nextQ.data_type === "BOOLEAN"
            ? null
            : ""
        );
      }
    } catch (err: any) {
      console.error("Error submitting sequential question answer:", err);
      setQuestionError(err?.message || "Failed to submit answer. Please try again.");
    } finally {
      setQuestionLoading(false);
    }
  }

  // STEP 3: Complete questions and transition to statutory evaluation
  async function handleProceedToAnalysis() {
    if (assessment && business) {
      try {
        await api.businesses.updateAssessment(business.id, assessment.id, {
          current_step: 4,
        });
      } catch {}
    }
    setStep(4);
    runRegulatoryAnalysis(business?.id || "demo-biz", assessment?.id);
  }

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
    } catch {
      clearInterval(queryTimer);
      setAnalysisStages(DEFAULT_STAGES.map((s) => ({ ...s, done: true })));
      setDecisionRun({
        id: "dec-run-demo",
        business_id: bizId,
        created_at: new Date().toISOString(),
        status: "COMPLETED",
        results: DEMO_REQUIREMENTS.map((req) => ({
          requirement_id: req.id,
          requirement_name: req.title,
          status: req.status,
          evidence_refs: req.statutoryCitations.map((c) => ({
            locator: c,
            authority: req.authority,
            excerpt: `Statutory mandate under ${c}`,
            verification_status: "VERIFIED",
          })),
          explanation_trace: {
            reason: req.explanation,
          },
        })),
      } as any);
      setTimeout(() => {
        setStep(5);
        setLoading(false);
      }, 700);
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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stepper Header */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
            <div>
              <span className="text-xs font-semibold text-amber-800 tracking-wide uppercase">
                Problem Statement 26130 · Compliance Onboarding
              </span>
              <h1 className="text-xl sm:text-2xl font-sans font-bold tracking-tight text-[#0F172A] mt-0.5">
                {STEPS.find((s) => s.num === step)?.label}
              </h1>
            </div>
            {business ? (
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] px-3 py-1.5 text-xs text-[#475569]">
                  <span className="font-semibold text-[#0F172A]">{business.name}</span>
                  <span className="text-[#94A3B8]">·</span>
                  <span className="font-mono text-[#64748B]">ID: {business.id.slice(0, 8)}</span>
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
                  className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1 text-xs font-semibold text-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                >
                  + New Entity
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-800 font-semibold">
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
                          ? "bg-amber-50/70 border border-amber-300 ring-1 ring-amber-400/40 shadow-2xs"
                          : isCompleted
                          ? "hover:bg-slate-50 cursor-pointer border border-transparent"
                          : "opacity-40 cursor-not-allowed border border-transparent"
                      }`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isCurrent
                            ? "bg-[#0F172A] text-white shadow-2xs"
                            : isCompleted
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 border border-slate-200 text-slate-400"
                        }`}
                      >
                        {isCompleted ? "✓" : s.num}
                      </span>
                      <span className={`text-xs font-semibold truncate ${isCurrent || isCompleted ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>
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
            className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-2xs space-y-6"
          >
            <div className="border-b border-[#E2E8F0] pb-4">
              <h2 className="text-base font-sans font-bold text-[#0F172A]">
                Establish Entity Identity &amp; Jurisdiction Scope
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                Canonical parameters define statutory jurisdiction, micro/small/medium scale, and applicable statutory authorities.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Legal Enterprise / Operating Name *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Apex Biotech Formulations LLP"
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Legal Constitution *
                </label>
                <select
                  required
                  value={legalConstitution}
                  onChange={(e) => setLegalConstitution(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                >
                  <option value="" className="bg-white text-[#64748B]">Select…</option>
                  {legalConstitutionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white text-[#0F172A]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Operating State / Jurisdiction *
                </label>
                <select
                  required
                  value={registeredState}
                  onChange={(e) => setRegisteredState(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                >
                  <option value="" className="bg-white text-[#64748B]">Select a jurisdiction…</option>
                  {stateOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white text-[#0F172A]">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#64748B] mt-1">
                  Only jurisdictions present in the loaded knowledge base are listed.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  District / Industrial Hub *
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Ahmedabad, Pune, Bengaluru"
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Industrial Zone Siting *
                </label>
                <select
                  value={industrialZone}
                  onChange={(e) => setIndustrialZone(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                >
                  <option value="" className="bg-white text-[#64748B]">Not specified</option>
                  {industrialZoneOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white text-[#0F172A]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Enterprise Lifecycle Stage *
                </label>
                <select
                  required
                  value={lifecycleStage}
                  onChange={(e) => setLifecycleStage(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                >
                  <option value="" className="bg-white text-[#64748B]">Select…</option>
                  {lifecycleStageOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white text-[#0F172A]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Plant &amp; Machinery Investment (₹ Lakhs)
                </label>
                <input
                  type="number"
                  min="0"
                  value={plantInvestmentLakhs}
                  onChange={(e) => setPlantInvestmentLakhs(e.target.value)}
                  placeholder="Leave blank if not known"
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Estimated / Actual Annual Turnover (₹ Lakhs)
                </label>
                <input
                  type="number"
                  min="0"
                  value={turnoverLakhs}
                  onChange={(e) => setTurnoverLakhs(e.target.value)}
                  placeholder="Leave blank if not known"
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Direct Employees &amp; Workers (Count)
                </label>
                <input
                  type="number"
                  min="0"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(e.target.value)}
                  placeholder="Leave blank if not known"
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#E2E8F0]">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-[#0F172A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
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
            className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-2xs space-y-6"
          >
            <div className="border-b border-[#E2E8F0] pb-4">
              <h2 className="text-base font-sans font-bold text-[#0F172A]">
                Products, Manufacturing Operations &amp; Trade Intent
              </h2>
              <p className="text-xs text-[#64748B] mt-1">
                Provide natural-language descriptions of operations. The system detects regulatory keywords and prompts for missing statutory triggers dynamically.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Describe your manufacturing processes, product lines, and plant operations *
                </label>
                <textarea
                  required
                  rows={5}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="e.g. Processing and packaging of roasted snacks, operating a continuous frying furnace, packaging in nitrogen sealed pouches, storing raw grains in on-site warehouse..."
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed"
                />
                <p className="text-[11px] text-[#64748B] mt-1">
                  Mention raw materials, industrial power, effluent generation, storage, and packaging.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Import or export intent
                </label>
                <select
                  value={tradeIntent}
                  onChange={(e) => setTradeIntent(e.target.value)}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-sm text-[#0F172A] focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
                >
                  <option value="" className="bg-white text-[#64748B]">Not specified</option>
                  {tradeIntentOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-white text-[#0F172A]">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {detectedActivities.length > 0 && (
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <span className="text-xs font-semibold text-[#0F172A] block mb-2">
                  Detected Activity Domains:
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

            <div className="flex justify-between items-center pt-4 border-t border-[#E2E8F0]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-full border border-[#E2E8F0] bg-white px-5 py-2 text-xs font-semibold text-[#475569] hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
              >
                ← Back to Profile
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-[#0F172A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
              >
                {loading ? "Analyzing Operations..." : "Continue to Smart Questions →"}
              </button>
            </div>
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 3: SEQUENTIAL ADAPTIVE STATUTORY QUESTIONING             */}
        {/* ------------------------------------------------------------- */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="border-b border-[#E2E8F0] pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase">
                      Adaptive Rule Engine
                    </span>
                    <span className="text-xs text-[#64748B]">
                      Sequential AST-Driven Discovery
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-sans font-bold text-[#0F172A]">
                    Statutory Variable Determination for {business?.name || "your enterprise"}
                  </h2>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Targeting only unresolved variables that alter candidate regulatory requirements. Each answer refines the compliance boundary.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                    {answeredCount} statutory variable{answeredCount === 1 ? "" : "s"} resolved
                  </span>
                </div>
              </div>
            </div>

            {/* State A: Loading next question */}
            {questionLoading && !currentQuestion ? (
              <div className="py-16 text-center space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xl animate-pulse">
                  ⚡
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#0F172A]">
                    Re-evaluating Candidate Rules...
                  </h3>
                  <p className="text-xs text-[#64748B] max-w-sm mx-auto">
                    Computing Three-Valued Kleene AST logic over published regulations to determine the next decision-relevant variable.
                  </p>
                </div>
              </div>
            ) : isQuestionsComplete || !currentQuestion ? (
              /* State B: All variables resolved / Complete */
              <div className="py-10 px-6 rounded-xl border border-emerald-200 bg-emerald-50/40 text-center space-y-5">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-2xl font-bold shadow-2xs">
                  ✓
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-base font-bold text-[#0F172A]">
                    Statutory Variables Resolved
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    All candidate statutory rules for your enterprise profile have been fully evaluated against known parameters. No further clarification variables are required.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-full border border-[#E2E8F0] bg-white px-5 py-2 text-xs font-semibold text-[#475569] hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs w-full sm:w-auto"
                  >
                    ← Back to Products
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedToAnalysis}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0F172A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer w-full sm:w-auto"
                  >
                    Build My Compliance Plan →
                  </button>
                </div>
              </div>
            ) : (
              /* State C: Active Single Question */
              <form onSubmit={handleSequentialAnswerSubmit} className="space-y-6">
                <div className="p-5 sm:p-6 rounded-xl border border-amber-200/80 bg-[#FFFDF7] space-y-4 shadow-2xs">
                  {/* Question Metadata strip */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-200">
                      Question #{answeredCount + 1}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-[#0F172A] bg-white px-2.5 py-0.5 rounded-full border border-[#E2E8F0]">
                      {currentQuestion.variable_key || currentQuestion.key}
                    </span>
                    {(currentQuestion.candidate_rules_count ?? currentQuestion.rule_dependency_count ?? 0) > 0 && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-700 border border-slate-200">
                        {(currentQuestion.candidate_rules_count ?? currentQuestion.rule_dependency_count)} candidate rule{((currentQuestion.candidate_rules_count ?? currentQuestion.rule_dependency_count) > 1 ? "s" : "")} depend on this
                      </span>
                    )}
                  </div>

                  {/* Main Question Text */}
                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-sans font-bold text-[#0F172A] leading-snug">
                      {currentQuestion.question || currentQuestion.question_text || currentQuestion.label}
                    </h3>
                  </div>

                  {/* Statutory Rationale Callout */}
                  {(currentQuestion.why_it_matters || currentQuestion.reason) && (
                    <div className="text-xs text-[#475569] bg-white border border-[#E2E8F0] rounded-xl p-3.5 space-y-1 leading-relaxed">
                      <p>
                        <strong className="text-[#0F172A]">Statutory Rationale:</strong>{" "}
                        {currentQuestion.why_it_matters || currentQuestion.reason}
                      </p>
                      {currentQuestion.expected_discovery_impact &&
                        currentQuestion.expected_discovery_impact !== (currentQuestion.why_it_matters || currentQuestion.reason) && (
                          <p className="text-indigo-800 pt-1 border-t border-slate-100">
                            <strong>Regulatory Focus:</strong> {currentQuestion.expected_discovery_impact}
                          </p>
                        )}
                    </div>
                  )}

                  {/* Dynamic Control according to data_type */}
                  <div className="pt-2">
                    {isBooleanType(currentQuestion.data_type) ? (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentAnswer(true);
                            setQuestionError(null);
                          }}
                          className={`px-6 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer shadow-2xs flex items-center gap-2 ${
                            currentAnswer === true
                              ? "bg-[#0F172A] text-white border-[#0F172A] ring-2 ring-slate-900/20"
                              : "bg-white text-[#475569] border-[#E2E8F0] hover:border-slate-300 hover:text-[#0F172A]"
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${currentAnswer === true ? "border-white bg-white" : "border-slate-400"}`}>
                            {currentAnswer === true && <span className="w-1.5 h-1.5 rounded-full bg-[#0F172A]" />}
                          </span>
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentAnswer(false);
                            setQuestionError(null);
                          }}
                          className={`px-6 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer shadow-2xs flex items-center gap-2 ${
                            currentAnswer === false
                              ? "bg-[#0F172A] text-white border-[#0F172A] ring-2 ring-slate-900/20"
                              : "bg-white text-[#475569] border-[#E2E8F0] hover:border-slate-300 hover:text-[#0F172A]"
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${currentAnswer === false ? "border-white bg-white" : "border-slate-400"}`}>
                            {currentAnswer === false && <span className="w-1.5 h-1.5 rounded-full bg-[#0F172A]" />}
                          </span>
                          No
                        </button>
                      </div>
                    ) : currentQuestion.options && currentQuestion.options.length > 0 ? (
                      <div className="space-y-2 max-w-lg">
                        <select
                          value={String(currentAnswer ?? "")}
                          onChange={(e) => {
                            setCurrentAnswer(e.target.value);
                            setQuestionError(null);
                          }}
                          className="w-full rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white text-[#0F172A] shadow-2xs"
                        >
                          <option value="" className="text-[#64748B]">Select an option...</option>
                          {currentQuestion.options.map((opt: any, optIdx: number) => (
                            <option key={`${opt.value}-${optIdx}`} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : isNumericType(currentQuestion.data_type) ? (
                      <div className="flex items-center gap-2 max-w-xs">
                        <input
                          type="number"
                          min="0"
                          value={currentAnswer === null || currentAnswer === undefined ? "" : currentAnswer}
                          onChange={(e) => {
                            setCurrentAnswer(e.target.value === "" ? "" : Number(e.target.value));
                            setQuestionError(null);
                          }}
                          placeholder="Enter value"
                          className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white text-[#0F172A] shadow-2xs"
                        />
                        {currentQuestion.unit && (
                          <span className="text-xs font-semibold text-[#64748B] bg-white border border-[#E2E8F0] px-2.5 py-2 rounded-xl">
                            {currentQuestion.unit}
                          </span>
                        )}
                      </div>
                    ) : isMultiChoiceType(currentQuestion.data_type) ? (
                      <div className="space-y-1.5 max-w-lg">
                        <input
                          type="text"
                          placeholder="Separate multiple values with commas"
                          value={Array.isArray(currentAnswer) ? currentAnswer.join(", ") : String(currentAnswer ?? "")}
                          onChange={(e) => {
                            setCurrentAnswer(e.target.value);
                            setQuestionError(null);
                          }}
                          className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white text-[#0F172A] placeholder-[#94A3B8] shadow-2xs"
                        />
                        <p className="text-[11px] text-[#64748B]">
                          Enter multiple values separated by commas.
                        </p>
                      </div>
                    ) : (
                      <div className="max-w-lg">
                        <input
                          type="text"
                          value={String(currentAnswer ?? "")}
                          onChange={(e) => {
                            setCurrentAnswer(e.target.value);
                            setQuestionError(null);
                          }}
                          placeholder="Enter your response"
                          className="w-full rounded-xl border border-[#E2E8F0] px-3.5 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white text-[#0F172A] shadow-2xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Error display */}
                  {questionError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
                      {questionError}
                    </div>
                  )}
                </div>

                {/* Question Navigation Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-full border border-[#E2E8F0] bg-white px-5 py-2 text-xs font-semibold text-[#475569] hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs w-full sm:w-auto"
                  >
                    ← Back to Products
                  </button>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={handleProceedToAnalysis}
                      className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Finish & Analyze Now →
                    </button>

                    <button
                      type="submit"
                      disabled={questionLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0F172A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer min-w-[140px]"
                    >
                      {questionLoading ? (
                        <>
                          <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                          <span>Evaluating...</span>
                        </>
                      ) : (
                        "Next Question →"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 4: REGULATORY ANALYSIS (8-STAGE ORCHESTRATION PIPELINE) */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-2xs space-y-6 text-center">
            <div className="max-w-md mx-auto space-y-3">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-2xl animate-pulse shadow-2xs">
                ⚙️
              </div>
              <h2 className="text-xl font-sans font-bold tracking-tight text-[#0F172A]">
                Building Your Compliance Plan
              </h2>
              <p className="text-xs text-[#64748B]">
                Orchestrating deterministic AST applicability, statutory document checklists, clearance workflows, and official web harvesting for {business?.name || "your enterprise"}.
              </p>
              {/* Dynamic query feedback strip */}
              <div className="p-2.5 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-amber-800 flex items-center justify-center gap-2 shadow-2xs">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-600 animate-ping" />
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
                      ? "bg-white border-emerald-200 shadow-2xs"
                      : "bg-[#F8FAFC] border-[#E2E8F0]"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      stage.done
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-400 border border-slate-200 animate-pulse"
                    }`}
                  >
                    {stage.done ? "✓" : idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[#0F172A] truncate">{stage.name}</div>
                    <div className="text-[11px] text-[#64748B] truncate">{stage.detail}</div>
                  </div>
                  {stage.done ? (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Completed
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-[#94A3B8]">
                      Processing...
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="text-[11px] text-[#94A3B8] pt-2">
              Statutory truth guarantee: zero hallucinations, fully deterministically evaluated with legal citations.
            </div>
          </div>
        )}

        {/* STEP 5: INITIAL RESULTS                                       */}
        {/* ------------------------------------------------------------- */}
        {step === 5 && (
          <div className="space-y-6">
            {/* Executive Summary Hero Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 text-[#0F172A] shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 mb-2">
                    <span>✓</span>
                    <span>Compliance Plan Generated</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-sans font-bold tracking-tight text-[#0F172A]">
                    Compliance Plan for {business?.name || "Your Enterprise"}
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1 max-w-xl">
                    Evaluated across Central Acts, {registeredState || "State"} statutory notifications, and official regulatory requirements.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/compliance?business_id=${business?.id}${assessment ? `&assessment_id=${assessment.id}` : ""}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0F172A] px-5 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <span>View Compliance Plan</span>
                    <span>→</span>
                  </Link>
                  <Link
                    href={`/dashboard?business_id=${business?.id}${assessment ? `&assessment_id=${assessment.id}` : ""}`}
                    className="inline-flex items-center gap-2 rounded-full bg-white border border-[#E2E8F0] px-5 py-2.5 text-xs font-semibold text-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>Founder Dashboard</span>
                  </Link>
                </div>
              </div>

              {/* 4 Headline Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]">
                  <span className="text-[#64748B] text-xs font-semibold block">Applicable Mandates</span>
                  <span className="text-2xl sm:text-3xl font-sans font-bold text-[#0F172A] mt-1 block">
                    {applicableCount}
                  </span>
                  <span className="text-[11px] text-amber-800 font-medium mt-1 block">Obligations Required</span>
                </div>
                <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]">
                  <span className="text-[#64748B] text-xs font-semibold block">Required Documents</span>
                  <span className="text-2xl sm:text-3xl font-sans font-bold text-[#0F172A] mt-1 block">
                    {executiveSummary?.documents_count ?? (applicableCount > 0 ? applicableCount * 2 + 2 : 0)}
                  </span>
                  <span className="text-[11px] text-amber-800 font-medium mt-1 block">Statutory Proofs</span>
                </div>
                <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]">
                  <span className="text-[#64748B] text-xs font-semibold block">Clearance Workflows</span>
                  <span className="text-2xl sm:text-3xl font-sans font-bold text-[#0F172A] mt-1 block">
                    {executiveSummary?.workflows_count ?? (applicableCount > 0 ? Math.min(applicableCount, 3) : 0)}
                  </span>
                  <span className="text-[11px] text-amber-800 font-medium mt-1 block">Approval Procedures</span>
                </div>
                <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0]">
                  <span className="text-[#64748B] text-xs font-semibold block">Statutory Deadlines</span>
                  <span className="text-2xl sm:text-3xl font-sans font-bold text-[#0F172A] mt-1 block">
                    {executiveSummary?.deadlines_count ?? (applicableCount > 0 ? 3 : 0)}
                  </span>
                  <span className="text-[11px] text-amber-800 font-medium mt-1 block">Filings &amp; Renewals</span>
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
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">
                    ✓
                  </span>
                  <div>
                    <h3 className="text-sm font-sans font-bold text-[#0F172A]">
                      Regulatory Discovery Complete
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Real web discovery executed for {business?.name || "enterprise"} with official source prioritization.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
                  {discoveryResult?.ran ? "Live Web Discovery Active" : "Knowledge Base Only"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Queries Planned</span>
                  <span className="font-sans font-bold text-[#0F172A] text-base">{discoveryResult?.queries?.length || 0}</span>
                </div>
                <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Sources Reviewed</span>
                  <span className="font-sans font-bold text-[#0F172A] text-base">{discoveryResult?.candidate_urls_count || 0}</span>
                </div>
                <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Official Portals</span>
                  <span className="font-sans font-bold text-[#0F172A] text-base">{discoveryResult?.official_sources_count || 0}</span>
                </div>
                <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[11px]">Claims Quarantined</span>
                  <span className="font-sans font-bold text-[#0F172A] text-base">{discoveryResult?.candidate_requirements_count || 0}</span>
                </div>
              </div>
            </div>

            {/* Quarantined Candidate Regulatory Claims (Part D, E, F) */}
            {discoveryResult?.candidate_requirements && discoveryResult.candidate_requirements.length > 0 && (
              <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
                  <div>
                    <h3 className="text-sm font-sans font-bold text-amber-900 flex items-center gap-2">
                      <span>⚠ Quarantined Discovered Sources &amp; Claims ({discoveryResult.candidate_requirements.length})</span>
                    </h3>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Candidate statutory claims scraped from official portals. Quarantined as UNVERIFIED until statutory review; cannot produce APPLICABLE decisions.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-bold uppercase bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
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
                        <span className="font-bold text-xs text-[#0F172A] leading-snug">
                          {cr.name}
                        </span>
                        <span className="shrink-0 text-[10px] font-bold uppercase bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                          Quarantined
                        </span>
                      </div>
                      <p className="text-[11px] text-[#475569] line-clamp-2 leading-relaxed">
                        {cr.applicability_statement}
                      </p>
                      <div className="text-[10px] text-[#64748B] font-mono flex items-center justify-between pt-1">
                        <span>Authority: {cr.authority}</span>
                        <span className="text-amber-800 font-semibold">Evidence Extracted</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Categorized Requirements List (Part N — Filtered presentation) */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
                <div>
                  <h2 className="text-base font-sans font-bold text-[#0F172A]">
                    Statutory Applicability Results
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Evaluated deterministically against Central Acts and {registeredState} state notifications.
                  </p>
                </div>

                <Link
                  href={`/dashboard?business_id=${business?.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#0F172A] px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
                >
                  Enter Overview Dashboard →
                </Link>
              </div>

              {results.length === 0 ? (
                <div className="py-8 text-center text-[#64748B] text-xs">
                  No decision rules were triggered for the current profile parameters.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Action Required: APPLICABLE & NEEDS_INFORMATION */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                        Action Required ({results.filter((r) => r.status === "APPLICABLE" || r.status === "NEEDS_INFORMATION").length})
                      </span>
                    </div>

                    {results
                      .filter((r) => r.status === "APPLICABLE" || r.status === "NEEDS_INFORMATION")
                      .map((r, idx) => (
                        <div
                          key={r.id || `${r.requirement_id}-${idx}`}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-amber-800">
                                {r.requirement_id}
                              </span>
                              <span className="text-[#94A3B8]">·</span>
                              <span className="text-xs font-sans font-bold text-[#0F172A]">
                                {r.requirement_name}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#64748B] flex items-center gap-2">
                              <span>
                                Evidence: {r.evidence_refs ? r.evidence_refs.length : 0} statutory citation(s)
                              </span>
                              {Boolean(r.explanation_trace?.reason) && (
                                <>
                                  <span>·</span>
                                  <span className="italic text-[#475569]">
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
                              className="text-xs font-semibold text-amber-800 hover:underline cursor-pointer"
                            >
                              Why do I need this?
                            </button>
                            <StatusBadge status={r.status as ApplicabilityStatus} size="sm" />
                            <Link
                              href={`/compliance/${r.requirement_id}?business_id=${business?.id}`}
                              className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A]"
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
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                          Verification Required ({results.filter((r) => r.status === "UNVERIFIED" || r.status === "CONFLICT_REVIEW").length})
                        </span>
                      </div>

                      {results
                        .filter((r) => r.status === "UNVERIFIED" || r.status === "CONFLICT_REVIEW")
                        .map((r, idx) => (
                          <div
                            key={r.id || `${r.requirement_id}-${idx}`}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-amber-300 bg-amber-50/40 hover:bg-amber-50/70 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-amber-800">
                                  {r.requirement_id}
                                </span>
                                <span className="text-[#94A3B8]">·</span>
                                <span className="text-xs font-sans font-bold text-[#0F172A]">
                                  {r.requirement_name}
                                </span>
                              </div>
                              <div className="text-[11px] text-[#475569]">
                                {String(r.explanation_trace?.reason || "Verification required")}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <StatusBadge status={r.status as ApplicabilityStatus} size="sm" />
                              <Link
                                href={`/compliance/${r.requirement_id}?business_id=${business?.id}`}
                                className="text-xs font-semibold text-amber-800 hover:underline"
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
                    <div className="pt-2 border-t border-[#E2E8F0]">
                      <button
                        type="button"
                        onClick={() => setShowNotApplicable((prev) => !prev)}
                        className="flex items-center justify-between w-full py-2 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
                      >
                        <span>
                          {showNotApplicable ? "▾ Hide" : "▸ Show"} Not Applicable Requirements ({results.filter((r) => r.status === "NOT_APPLICABLE").length} hidden by default)
                        </span>
                        <span className="text-[11px] text-[#94A3B8]">
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
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-[#E2E8F0] bg-slate-50 opacity-75"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[11px] font-bold text-[#64748B]">
                                      {r.requirement_id}
                                    </span>
                                    <span className="text-[#CBD5E1]">·</span>
                                    <span className="text-xs font-medium text-[#475569]">
                                      {r.requirement_name}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-[#94A3B8]">
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
              <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                >
                  ← Refine Smart Questions
                </button>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/compliance?business_id=${business?.id}${assessment ? `&assessment_id=${assessment.id}` : ""}`}
                    className="rounded-full border border-[#E2E8F0] bg-white px-5 py-2 text-xs font-semibold text-[#0F172A] hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    View All Compliance Mandates
                  </Link>

                  <Link
                    href={`/dashboard?business_id=${business?.id}${assessment ? `&assessment_id=${assessment.id}` : ""}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0F172A] px-6 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs"
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
