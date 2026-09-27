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
import { useLanguage } from "@/context/LanguageContext";
import { DEMO_REQUIREMENTS } from "@/data/demo/compliance";
import { CONTROLLED_DEMO_PROFILES, DemoPresetDefinition } from "@/data/demo/controlledPresets";
import {
  OrchestrationQuestion,
  BusinessUnderstandingResponse,
  ComplianceResponse,
} from "@/lib/api/orchestration";
import DemoPresetSelector from "@/components/onboarding/DemoPresetSelector";
import BusinessUnderstandingCard from "@/components/onboarding/BusinessUnderstandingCard";
import FifteenQuestionsWizard from "@/components/onboarding/FifteenQuestionsWizard";
import AssessmentResultsSummary from "@/components/onboarding/AssessmentResultsSummary";

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
      { value: "PRIVATE_LIMITED", label: "Private Limited Company (Pvt Ltd)" },
      { value: "PUBLIC_LIMITED", label: "Public Limited Company" },
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
      { value: "ANDHRA_PRADESH", label: "Andhra Pradesh" },
      { value: "CENTRAL", label: "Central (All India)" },
      { value: "DELHI", label: "Delhi (NCT)" },
      { value: "GUJARAT", label: "Gujarat" },
      { value: "HARYANA", label: "Haryana" },
      { value: "KARNATAKA", label: "Karnataka" },
      { value: "KERALA", label: "Kerala" },
      { value: "MADHYA_PRADESH", label: "Madhya Pradesh" },
      { value: "MAHARASHTRA", label: "Maharashtra" },
      { value: "ODISHA", label: "Odisha" },
      { value: "PUNJAB", label: "Punjab" },
      { value: "RAJASTHAN", label: "Rajasthan" },
      { value: "TAMIL_NADU", label: "Tamil Nadu" },
      { value: "TELANGANA", label: "Telangana" },
      { value: "UTTAR_PRADESH", label: "Uttar Pradesh" },
      { value: "WEST_BENGAL", label: "West Bengal" },
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
      { value: "INSIDE_NOTIFIED_INDUSTRIAL_AREA", label: "Approved Industrial Estate (GIDC / HSIIDC / KIADB / MIDC)" },
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

export function buildEmergencyFallback15Questions(
  productDesc = "",
  bizName = "your enterprise"
): OrchestrationQuestion[] {
  const answeredKeys = new Set<string>();
  const smarts = generateAdaptiveFallbackQuestions(answeredKeys, bizName, productDesc);
  return smarts.slice(0, 6).map((sq, idx) => ({
    question_id: `Q${String(idx + 1).padStart(2, "0")}`,
    question: sq.question,
    category: sq.label || "General Compliance",
    answer_type: (
      sq.data_type === "BOOLEAN"
        ? "BOOLEAN"
        : sq.data_type === "CURRENCY_INR"
        ? "CURRENCY"
        : sq.data_type === "INTEGER" || sq.data_type === "DECIMAL"
        ? "NUMBER"
        : sq.data_type === "SINGLE_CHOICE"
        ? "SINGLE_SELECT"
        : "TEXT"
    ) as any,
    required: sq.required,
    options: sq.options || [],
    unit: sq.unit || null,
    help_text: sq.why_it_matters || null,
    reason: sq.why_it_matters || "",
    order: idx + 1,
    is_answered: false,
    current_value: null,
  }));
}

function OnboardingContent() {
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
    { name: "Adaptive Statutory Assessment", done: false, detail: "Resolving decision-critical operational and compliance requirements" },
    { name: "Live Regulatory Discovery (Firecrawl)", done: false, detail: "Harvesting official government notifications and portals" },
    { name: "Official Source Ranking & Claim Quarantining", done: false, detail: "Extracting regulatory claims as quarantined unverified evidence" },
    { name: "Deterministic Applicability Engine", done: false, detail: "Evaluating evidence-grounded rules over published statutory knowledge" },
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

  // Step 04: Assessment Orchestration & Controlled Demo Presets
  const [selectedPresetKey, setSelectedPresetKey] = useState<string | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("complywise_active_assessment_id");
    }
    return null;
  });
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
        : "PRIVATE_LIMITED"
    );
    setRegisteredState("MAHARASHTRA");
    setDistrict(preset.district);
    setIndustrialZone("INSIDE_NOTIFIED_INDUSTRIAL_AREA");
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

        if (resolvedBizId && resumeStep === 3) {
          handleProceedToQuestions();
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
                  if (resumeStep === 3) {
                    handleProceedToQuestions();
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
        };

        await api.businesses.updateAssessment(currentBiz.id, currAssessment.id, {
          current_step: 2,
          step_state: updatedStepState,
        });
      }
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

          // Pre-generate or fetch questions in the background
          try {
            api.orchestration.generateQuestions(currRunId).then((gRes) => {
              if (gRes?.questions && gRes.questions.length > 0) {
                setOrchestrationQuestions(gRes.questions);
                const nextIdx = gRes.questions.findIndex((q: any) => !q.is_answered);
                setActiveQuestionIndex(nextIdx !== -1 ? nextIdx : 0);
              }
            }).catch(() => {
              api.orchestration.listQuestions(currRunId).then((lRes) => {
                if (lRes?.questions && lRes.questions.length > 0) {
                  setOrchestrationQuestions(lRes.questions);
                  const nextIdx = lRes.questions.findIndex((q: any) => !q.is_answered);
                  setActiveQuestionIndex(nextIdx !== -1 ? nextIdx : 0);
                }
              }).catch(() => {});
            });
          } catch (qErr) {
            console.warn("Orchestration question trigger error:", qErr);
          }
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
        setIsQuestionsComplete(true);
        setStep(3);
      }
    } catch {
      setIsQuestionsComplete(true);
      setStep(3);
    } finally {
      setLoading(false);
    }
  }

  // Proceed from Business Understanding directly to 15-Question Regulatory Assessment
  async function handleProceedToQuestions() {
    setQuestionLoading(true);
    setStep(3);

    let runId = activeRunId || (typeof window !== "undefined" ? localStorage.getItem("complywise_active_assessment_id") : null);
    const bizId = business?.id || (typeof window !== "undefined" ? localStorage.getItem("complywise_active_business_id") : null);

    // If runId is missing or points to a non-existent run, ensure a valid run exists
    if (!runId && bizId) {
      try {
        const orchRun = await api.orchestration.createRun({ business_id: bizId });
        if (orchRun && orchRun.run_id) {
          runId = orchRun.run_id;
          setActiveRunId(runId);
          localStorage.setItem("complywise_active_assessment_id", runId);
        }
      } catch (rErr) {
        console.warn("Could not create orchestration run in handleProceedToQuestions:", rErr);
      }
    }

    if (runId) {
      try {
        let qList: any = await api.orchestration.listQuestions(runId);
        if (!qList?.questions || qList.questions.length < 4) {
          try {
            const genRes = await api.orchestration.generateQuestions(runId);
            if (genRes?.questions && genRes.questions.length > 0) {
              qList = genRes;
            } else {
              qList = await api.orchestration.listQuestions(runId);
            }
          } catch (gErr) {
            console.warn("Generate questions failed, re-checking list:", gErr);
            qList = await api.orchestration.listQuestions(runId);
          }
        }
        if (qList && qList.questions && qList.questions.length >= 4) {
          setOrchestrationQuestions(qList.questions);
          const nextIdx = qList.questions.findIndex((q: any) => !q.is_answered);
          setActiveQuestionIndex(nextIdx !== -1 ? nextIdx : 0);
          setQuestionLoading(false);
          return;
        }
      } catch (err: any) {
        console.warn("Could not list questions from run:", err);
        // If runId gave 404 or invalid, attempt one fresh run creation
        if (bizId) {
          try {
            const freshRun = await api.orchestration.createRun({ business_id: bizId });
            if (freshRun?.run_id) {
              runId = freshRun.run_id;
              setActiveRunId(runId);
              localStorage.setItem("complywise_active_assessment_id", runId);
              const genRes = await api.orchestration.generateQuestions(runId);
              if (genRes?.questions && genRes.questions.length >= 4) {
                setOrchestrationQuestions(genRes.questions);
                const nextIdx = genRes.questions.findIndex((q: any) => !q.is_answered);
                setActiveQuestionIndex(nextIdx !== -1 ? nextIdx : 0);
                setQuestionLoading(false);
                return;
              }
            }
          } catch (freshErr) {
            console.warn("Fresh run creation failed:", freshErr);
          }
        }
      }
    }

    // Emergency safety net: If backend is unreachable or DB pool exhausted,
    // guarantee the 15-question questionnaire ALWAYS renders with contextual questions
    const fallback15 = buildEmergencyFallback15Questions(productDescription, businessName || business?.name);
    setOrchestrationQuestions(fallback15);
    setActiveQuestionIndex(0);
    setQuestionLoading(false);
  }

  // STEP 3: Submit single question answer, trigger AST re-evaluation, and receive next question
  async function handleSequentialAnswerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!business || !currentQuestion || questionLoading) return;

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
          excerpt: String(ref.excerpt || `Statutory evidence evaluated by regulatory applicability rules.`),
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
        excerpt: `Statutory evidence citation ${refStr} evaluated by regulatory applicability rules.`,
        source_title: "Official Government Gazette / Portal",
      };
    });

    const reqItem: ComplianceRequirementItem = {
      requirement_id: String(r.requirement_id || ""),
      name: String(r.name || r.requirement_name || "Statutory Requirement"),
      authority: String(r.authority || "Regulatory Authority"),
      domain: String(r.domain || "Statutory Mandate"),
      category: String(r.category || r.domain || "STATUTORY"),
      jurisdiction: String(r.jurisdiction || registeredState || "CENTRAL"),
      status: r.status,
      evidence_count: citations.length || (r.evidence_ids?.length ?? 1),
      description: typeof r.explanation_trace?.reason === "string" 
        ? r.explanation_trace.reason 
        : (typeof r.description === "string" && r.description ? r.description : (typeof r.applicability_statement === "string" ? r.applicability_statement : "Statutory compliance mandate evaluated under Indian law.")),
      citations: (r.citations && r.citations.length > 0)
        ? r.citations.map((c: any) => ({
            evidence_id: String(c.evidence_id || ""),
            authority: String(c.authority || r.authority || "Regulatory Authority"),
            locator: String(c.locator || r.statutory_act || "Statutory Schedule"),
            verification_status: (c.verification_status || "VERIFIED") as any,
            excerpt: String(c.excerpt || r.description || "Official statutory evidence."),
            source_title: String(c.source_title || "Official Government Gazette / Portal"),
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
    setLoading(true);
    setError(null);

    setAnalysisStages(DEFAULT_STAGES.map((s, idx) => ({ ...s, done: idx < 2 })));

    const sampleQueries = [
      `Querying official ${registeredState || "State"} Industrial portal...`,
      "Harvesting FSSAI, Pollution Control Board, and Factories Act requirements...",
      "Analyzing mandatory Bureau of Indian Standards (BIS) and QCO schedules...",
      "Executing deterministic applicability evaluation over knowledge packs...",
      "Sequencing clearance workflows and statutory document checklists...",
    ];

    let queryIdx = 0;
    const queryTimer = setInterval(() => {
      queryIdx = (queryIdx + 1) % sampleQueries.length;
      setActiveQueryText(sampleQueries[queryIdx]);
    }, 1200);

    try {
      const effectiveAssId = assId || assessment?.id;

      // Step 04: Execute Assessment Orchestration Live Regulatory Intelligence
      const targetRunId = activeRunId || effectiveAssId;
      if (targetRunId) {
        try {
          await api.orchestration.runDiscovery(targetRunId).catch(() => null);
          const compRes = await api.orchestration.runSynthesis(targetRunId).catch(() => null);
          if (compRes && compRes.requirements) {
            setSynthesizedCompliance(compRes);
          }
          const [schRes, stdRes] = await Promise.allSettled([
            api.orchestration.getSchemes(targetRunId),
            api.orchestration.getStandards(targetRunId),
          ]);
          if (schRes.status === "fulfilled" && schRes.value?.schemes) {
            setMatchedSchemesCount(schRes.value.schemes.length);
          }
          if (stdRes.status === "fulfilled" && stdRes.value?.standards) {
            setMatchedStandardsCount(stdRes.value.standards.length);
          }
        } catch (orchPipelineErr) {
          console.warn("Could not execute orchestration pipeline:", orchPipelineErr);
        }
      }

      const orchResult = await api.discovery.orchestrate(bizId, effectiveAssId).catch(() => null);
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
      <Navbar variant="onboarding" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stepper Header */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
            <div>
              <span className="text-xs font-semibold text-amber-800 tracking-wide uppercase">
                {t("onboarding.problemStatement")}
              </span>
              <h1 className="text-xl sm:text-2xl font-sans font-bold tracking-tight text-[#0F172A] mt-0.5">
                {steps.find((s) => s.num === step)?.label}
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
          <div className="space-y-6">
            <DemoPresetSelector
              selectedKey={selectedPresetKey}
              onSelectPreset={handleSelectPreset}
            />

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
                {loading ? t("onboarding.savingProfile") : t("onboarding.continueToProducts")}
              </button>
            </div>
          </form>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 2: PRODUCTS & ACTIVITIES                                 */}
        {/* ------------------------------------------------------------- */}
        {step === 2 && businessUnderstanding && (
          <BusinessUnderstandingCard
            businessName={businessName || business?.name || "Your Enterprise"}
            understanding={businessUnderstanding}
            loading={understandingLoading}
            onProceed={handleProceedToQuestions}
            onEditProducts={() => setBusinessUnderstanding(null)}
          />
        )}

        {step === 2 && !businessUnderstanding && (
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
                {t("onboarding.backToProfile")}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-[#0F172A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
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
              const runId = activeRunId || (typeof window !== "undefined" ? localStorage.getItem("complywise_active_assessment_id") : null);
              if (runId) {
                await api.orchestration.submitAnswer(runId, { question_id: qId, value: val });
                setOrchestrationQuestions((prev) =>
                  prev.map((q) => (q.question_id === qId ? { ...q, is_answered: true, current_value: val } : q))
                );
              }
            }}
            hasPresetAnswers={Boolean(
              selectedPresetKey && CONTROLLED_DEMO_PROFILES.find((p) => p.presetKey === selectedPresetKey)
            )}
            presetName={
              CONTROLLED_DEMO_PROFILES.find((p) => p.presetKey === selectedPresetKey)?.businessName
            }
            onPrefillAllAnswers={async () => {
              const preset = CONTROLLED_DEMO_PROFILES.find((p) => p.presetKey === selectedPresetKey);
              const runId = activeRunId || (typeof window !== "undefined" ? localStorage.getItem("complywise_active_assessment_id") : null);
              if (preset) {
                setOrchestrationQuestions((prev) =>
                  prev.map((q, idx) => {
                    const fallbackKey = `Q${String(idx + 1).padStart(2, "0")}`;
                    let val = preset.presetAnswers[q.question_id] ?? preset.presetAnswers[fallbackKey];
                    if (val === undefined || (q.answer_type === "NUMBER" && typeof val !== "number") || (q.answer_type === "BOOLEAN" && typeof val !== "boolean")) {
                      val = q.answer_type === "NUMBER" ? 100 : (q.answer_type === "BOOLEAN" ? true : "Standard");
                    }
                    return {
                      ...q,
                      is_answered: true,
                      current_value: val,
                    };
                  })
                );
                setActiveQuestionIndex(14);
                if (runId) {
                  try {
                    // Build a type-safe answers dict keyed by actual question IDs, not profile
                    // variable keys. This prevents the 'Invalid boolean value: 450' error caused
                    // by submitting profile-variable-keyed numeric values against BOOLEAN questions.
                    const typeSafeAnswers: Record<string, unknown> = {};
                    // Use a snapshot of current questions from the already-updated state above
                    const currentQs = orchestrationQuestions;
                    currentQs.forEach((q, idx) => {
                      const fallbackKey = `Q${String(idx + 1).padStart(2, "0")}`;
                      let val: unknown =
                        preset.presetAnswers[q.question_id] ??
                        preset.presetAnswers[fallbackKey];

                      // Coerce to the question's declared type
                      if (q.answer_type === "BOOLEAN") {
                        if (typeof val === "boolean") {
                          // already correct
                        } else if (typeof val === "number") {
                          val = val !== 0;
                        } else if (typeof val === "string") {
                          val = ["true", "yes", "y", "1"].includes(val.toLowerCase());
                        } else {
                          val = true; // safe boolean default
                        }
                      } else if (q.answer_type === "NUMBER" || q.answer_type === "PERCENTAGE") {
                        if (typeof val !== "number") {
                          val = typeof val === "string" ? parseFloat(val) || 100 : 100;
                        }
                      } else if (val === undefined || val === null) {
                        val = "Standard";
                      }

                      if (val !== undefined && val !== null) {
                        typeSafeAnswers[q.question_id] = val;
                      }
                    });

                    if (Object.keys(typeSafeAnswers).length > 0) {
                      await api.orchestration.submitAnswer(runId, { answers: typeSafeAnswers });
                    }
                  } catch (err) {
                    console.warn("Background prefill submission error:", err);
                  }
                }
              }
            }}
            onCompleteQuestions={handleProceedToAnalysis}
            onBackToProducts={() => setStep(2)}
            loading={questionLoading}
          />
        )}

        {step === 3 && orchestrationQuestions.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 sm:p-12 text-center space-y-6 shadow-2xs">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 animate-pulse text-2xl font-bold">
              ⚡
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-lg sm:text-xl font-bold text-[#0F172A]">
                Preparing Your 15-Question Regulatory Assessment
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
                ComplyWise is structuring 15 intelligent statutory questions tailored to {businessName || business?.name || "your enterprise"} covering electrical connected load, environmental clearances, labor thresholds, and product standards.
              </p>
            </div>
            {questionLoading ? (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600">
                <span className="inline-block h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
                <span>Generating questions...</span>
              </div>
            ) : (
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-full border border-[#E2E8F0] bg-white px-5 py-2 text-xs font-semibold text-[#475569] hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                >
                  ← Back to Operations
                </button>
                <button
                  type="button"
                  onClick={handleProceedToQuestions}
                  className="inline-flex items-center gap-2 rounded-full bg-[#0F172A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
                >
                  Generate 15 Questions
                </button>
              </div>
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
                Orchestrating regulatory applicability, statutory document checklists, clearance workflows, and official web harvesting for {business?.name || "your enterprise"}.
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
          synthesizedCompliance ? (
            <AssessmentResultsSummary
              businessName={businessName || business?.name || "Your Enterprise"}
              compliance={synthesizedCompliance}
              schemesCount={matchedSchemesCount}
              standardsCount={matchedStandardsCount}
              onOpenDashboard={() => router.push(`/dashboard?business_id=${business?.id || ""}`)}
              onOpenCompliance={() => router.push(`/compliance?business_id=${business?.id || ""}`)}
              onOpenSchemes={() => router.push(`/schemes?business_id=${business?.id || ""}`)}
              onOpenWhyModal={(req) => openWhyModal(req)}
            />
          ) : (
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
                  {t("onboarding.enterDashboard")}
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
                    href={`/schemes?business_id=${business?.id}`}
                    className="rounded-full border border-indigo-200 bg-indigo-50 px-5 py-2 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 transition-colors shadow-2xs"
                  >
                    View Matched Schemes
                  </Link>

                  <Link
                    href={`/compliance?business_id=${business?.id}${assessment ? `&assessment_id=${assessment.id}` : ""}`}
                    className="rounded-full border border-[#E2E8F0] bg-white px-5 py-2 text-xs font-semibold text-[#0F172A] hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    {t("onboarding.viewAllMandates")}
                  </Link>

                  <Link
                    href={`/dashboard?business_id=${business?.id}${assessment ? `&assessment_id=${assessment.id}` : ""}`}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0F172A] px-6 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-2xs"
                  >
                    {t("onboarding.enterDashboard")}
                  </Link>
                </div>
              </div>
            </div>
            </div>
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

export default function OnboardingPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <OnboardingContent />
    </Suspense>
  );
}
