/**
 * ComplyWise — Demo Compliance Requirements & Mandates
 */

export interface ComplianceRequirement {
  id: string;
  code: string;
  title: string;
  authority: string;
  category: "STANDARD" | "FOOD" | "ENVIRONMENT" | "LABOUR" | "REGISTRATION";
  status: "APPLICABLE" | "COMPLIANT" | "NEEDS_INFORMATION" | "UNVERIFIED" | "NOT_APPLICABLE";
  urgency: "HIGH" | "MEDIUM" | "LOW";
  penaltyNotice: string;
  effectiveDate: string;
  enforcingQco: string;
  totalClauses: number;
  compliantClauses: number;
  actionRequired: string;
  statutoryCitations: string[];
  explanation: string;
}

export const DEMO_REQUIREMENTS: ComplianceRequirement[] = [
  {
    id: "REQ-BIS-1293",
    code: "IS 1293:2019",
    title: "Plugs and Socket-Outlets of Rated Voltage up to 250V and Rated Current up to 16A",
    authority: "Bureau of Indian Standards",
    category: "STANDARD",
    status: "APPLICABLE",
    urgency: "HIGH",
    penaltyNotice: "Section 29 BIS Act 2016 (Fine up to ₹5,00,000 or imprisonment up to 2 years)",
    effectiveDate: "01 Dec 2020",
    enforcingQco: "Electrical Accessories (Quality Control) Order, 2020",
    totalClauses: 32,
    compliantClauses: 28,
    actionRequired: "Clause 13.2 Endurance & Clause 18 Temperature Rise 3-year NABL Renewal",
    statutoryCitations: [
      "BIS Act 2016 §16(1)",
      "Gazette S.O. 1421(E) DPIIT Notification",
      "IS 1293:2019 Table 4 & Clause 13.2",
    ],
    explanation:
      "Your registered business activities include manufacturing or assembling electrical switchgear, sockets, or apparatus. Under DPIIT mandatory QCO S.O. 1421(E), no person shall manufacture, import, distribute, or sell plugs and socket-outlets without the Standard Mark.",
  },
  {
    id: "REQ-QCO-2024-EA",
    code: "QCO S.O. 1421(E)",
    title: "Factory Audit Evidence Dossier & QAP Rev 4.2",
    authority: "DPIIT / Ministry of Commerce",
    category: "STANDARD",
    status: "APPLICABLE",
    urgency: "HIGH",
    penaltyNotice: "Cancellation of CM/L license and customs import seizure",
    effectiveDate: "15 Jan 2024",
    enforcingQco: "DPIIT Technical Regulations Directorate",
    totalClauses: 14,
    compliantClauses: 11,
    actionRequired: "Submit updated calibration logs & Quality Assurance Plan before annual audit",
    statutoryCitations: [
      "BIS (Conformity Assessment) Regulations 2018 Regulation 6",
      "Scheme I Schedule II Clause 4(b)",
    ],
    explanation:
      "All licensees under Scheme-I must maintain an approved Scheme of Inspection and Testing (SIT) and submit calibration verification logs for laboratory test instruments.",
  },
  {
    id: "REQ-BIS-FORM-VI",
    code: "BIS Act 2016 §15",
    title: "Form VI Annual Production & Marking Statement Reconciliation",
    authority: "Bureau of Indian Standards",
    category: "REGISTRATION",
    status: "APPLICABLE",
    urgency: "MEDIUM",
    penaltyNotice: "Statutory late fee penalty of 18% p.a. + suspension of marking rights",
    effectiveDate: "Annual (Due 30 Jun)",
    enforcingQco: "BIS Finance & Licensing Guidelines",
    totalClauses: 8,
    compliantClauses: 6,
    actionRequired: "Reconcile unit volumes marked with Standard Mark for FY 2025-26",
    statutoryCitations: [
      "BIS Rules 2018 Rule 11",
      "Conformity Assessment Regulations Form VI",
    ],
    explanation:
      "Licensees are legally obligated to declare exact quantities produced and marked under each license, calculated against the minimum marking fee threshold.",
  },
  {
    id: "REQ-FSSAI-BIS-01",
    code: "IS 14543:2024",
    title: "Packaged Drinking Water (Other than Natural Mineral Water)",
    authority: "FSSAI & BIS Dual Enforcement",
    category: "FOOD",
    status: "APPLICABLE",
    urgency: "HIGH",
    penaltyNotice: "Immediate stop-production order under Food Safety and Standards Act §31",
    effectiveDate: "01 Jan 2024",
    enforcingQco: "Food Safety and Standards (Prohibition and Restrictions on Sales) Regulations",
    totalClauses: 44,
    compliantClauses: 39,
    actionRequired: "Complete 180-day batch microbial test report and submit for surveillance review",
    statutoryCitations: [
      "FSS Act 2006 §31",
      "FSSAI Notification F.No. 1-100/Standards/SP(L&C/A)/FSSAI-2021",
      "IS 14543:2024 Clause 7",
    ],
    explanation:
      "Packaged drinking water is subject to mandatory dual certification under both FSSAI and BIS Scheme-I. No manufacturing or distribution is permissible without dual license numbers.",
  },
  {
    id: "REQ-ENV-PCB-01",
    code: "Water & Air Acts",
    title: "State Pollution Control Board Consent-to-Operate (CTO) Renewal",
    authority: "State Pollution Control Board (SPCB / CPCB)",
    category: "ENVIRONMENT",
    status: "COMPLIANT",
    urgency: "LOW",
    penaltyNotice: "Disconnection of industrial electricity / water supply under Water Act §33A",
    effectiveDate: "Valid until 31 Mar 2027",
    enforcingQco: "Air (Prevention and Control of Pollution) Act 1981 §21",
    totalClauses: 18,
    compliantClauses: 18,
    actionRequired: "All consent conditions currently verified. Annual environmental statement due in Sept.",
    statutoryCitations: [
      "Water (Prevention & Control of Pollution) Act 1974 §25",
      "Air Act 1981 §21",
      "Environment (Protection) Rules 1986 Form V",
    ],
    explanation:
      "All designated manufacturing facilities within orange/green category must maintain a valid Consent to Operate and submit annual effluent and stack emission monitoring reports.",
  },
  {
    id: "REQ-LABOUR-FAC-01",
    code: "Factories Act 1948",
    title: "Annual Factory License Renewal & Form 2 Return",
    authority: "State Directorate of Industrial Safety & Health (DISH)",
    category: "LABOUR",
    status: "COMPLIANT",
    urgency: "LOW",
    penaltyNotice: "Court summons to Occupier / Factory Manager under §92",
    effectiveDate: "Valid until 31 Dec 2026",
    enforcingQco: "State Factories Rules & Industrial Safety Code",
    totalClauses: 22,
    compliantClauses: 22,
    actionRequired: "Maintain safety committee minutes and machinery inspection registers.",
    statutoryCitations: [
      "Factories Act 1948 §6 & §7",
      "State Factories Rules Form 2",
    ],
    explanation:
      "Factories employing more than 20 workers with power must register and maintain valid endorsement with the State Chief Inspector of Factories.",
  },
];
