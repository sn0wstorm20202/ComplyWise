/**
 * ComplyWise — Centralized BIS Compliance Mock Data
 * Realistic Indian industrial standards, QCOs, statutory filings, and compliance metrics.
 * Designed for immediate PPT/Demo presentation with clean API replacement boundaries.
 */

export interface CompanyInfo {
  name: string;
  bisRegistration: string;
  sector: string;
  location: string;
  scale: string;
  officer: string;
  role: string;
  lastSync: string;
}

export interface DashboardMetrics {
  complianceHealth: number; // 82%
  actionRequired: number; // 3
  upcomingDeadlines: number; // 4
  documentsCount: number; // 11
  applicableRequirements: number; // 18
  conformingCount: number; // 15
  auditReadinessScore: number; // 88%
  surveillanceAuditDate: string; // 14 Jun 2026
  surveillanceDaysLeft: number; // 96
}

export interface PriorityAction {
  id: string;
  requirement_id: string;
  standard_code: string;
  title: string;
  authority: string;
  category: string;
  status: "ACTION_NEEDED" | "APPLICABLE" | "NEEDS_INFORMATION" | "CONFLICT_REVIEW";
  urgency: "HIGH" | "MEDIUM" | "LOW";
  deadline: string;
  days_remaining: number;
  summary: string;
  clause_ref?: string;
  action_cta: string;
  target_view: string;
}

export interface UpcomingDeadline {
  id: string;
  requirement_id: string;
  title: string;
  authority: string;
  due_date: string;
  days_remaining: number;
  basis: string;
  status: "URGENT" | "UPCOMING" | "SCHEDULED";
  standard_code?: string;
}

export interface RegulatoryChange {
  id: string;
  gazette_no: string;
  authority: string;
  title: string;
  date: string;
  effective_date: string;
  impact: string;
  impact_level: "HIGH" | "MEDIUM" | "INFO";
  category: string;
  summary: string;
  affected_standards: string[];
  verified: boolean;
  source_url: string;
}

export interface WorkflowStep {
  number: number;
  name: string;
  status: "COMPLETED" | "IN_PROGRESS" | "WAITING_FOR_USER" | "WAITING";
  date?: string;
}

export interface WorkflowItem {
  id: string;
  title: string;
  authority: string;
  standard: string;
  total_steps: number;
  current_step: number;
  current_step_name: string;
  status: "IN_PROGRESS" | "WAITING_FOR_USER" | "SUBMITTED" | "COMPLETED";
  steps: WorkflowStep[];
  blocker?: string | null;
  last_updated: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  code: string;
  authority: string;
  category: "Statutory Proof" | "Testing Evidence" | "Factory Audit" | "Technical Dossier" | "Legal Ownership" | "Environmental";
  status: "VERIFIED" | "NEEDS_REVIEW" | "ISSUE" | "UPLOADED" | "PROCESSING";
  file_format: string;
  file_size: string;
  last_updated: string;
  valid_until?: string;
  clause_linked: string;
  notes?: string;
}

export interface StandardItem {
  id: string;
  code: string;
  year: string;
  title: string;
  authority: string;
  is_mandatory: boolean;
  qco_order?: string;
  scheme: string;
  total_clauses: number;
  applicable_clauses: number;
  testing_parameters: string[];
  last_amendment: string;
  status: "APPLICABLE" | "COMPLIANT" | "RENEWAL_DUE";
}

export interface BISAgentPreset {
  id: string;
  question: string;
  category: string;
  answer: string;
  clauses_cited: { standard: string; clause: string; title: string }[];
  regulatory_source: string;
  provenance_verified: boolean;
  key_takeaway: string;
}

export const companyInfo: CompanyInfo = {
  name: "Apex Industrial Electro-Mechanicals Ltd.",
  bisRegistration: "CM/L-8492019",
  sector: "Electrical Accessories & Industrial Power Components",
  location: "Plot 42, Sector 8, IMT Manesar, Gurugram, Haryana - 122050",
  scale: "Medium Enterprise (MSME: UDYAM-HR-05-0029182)",
  officer: "Dr. Vikramaditya Sharma",
  role: "Head of Regulatory & Quality Assurance",
  lastSync: "Today, 10:45 AM IST",
};

export const dashboardMetrics: DashboardMetrics = {
  complianceHealth: 82,
  actionRequired: 3,
  upcomingDeadlines: 4,
  documentsCount: 11,
  applicableRequirements: 18,
  conformingCount: 15,
  auditReadinessScore: 88,
  surveillanceAuditDate: "14 Jun 2026",
  surveillanceDaysLeft: 96,
};

export const priorityActions: PriorityAction[] = [
  {
    id: "act-1",
    requirement_id: "REQ-BIS-1293",
    standard_code: "IS 1293:2019",
    title: "Mandatory Type-Test Certificate Renewal",
    authority: "Bureau of Indian Standards",
    category: "Testing & Laboratory",
    status: "ACTION_NEEDED",
    urgency: "HIGH",
    deadline: "14 May 2026",
    days_remaining: 14,
    summary: "Clause 13.2 (Endurance under normal conditions) & Clause 18 (Temperature Rise) test reports have crossed the 3-year renewal interval. NABL re-testing is mandatory.",
    clause_ref: "IS 1293:2019 §13.2, §18",
    action_cta: "View Testing Requirements",
    target_view: "compliance",
  },
  {
    id: "act-2",
    requirement_id: "REQ-QCO-2024-EA",
    standard_code: "QCO S.O. 1421(E)",
    title: "Factory Audit Evidence Dossier Submission",
    authority: "DPIIT / BIS",
    category: "Quality Control Order",
    status: "ACTION_NEEDED",
    urgency: "HIGH",
    deadline: "28 May 2026",
    days_remaining: 28,
    summary: "Submit updated calibration logs and revised Quality Assurance Plan (QAP) for domestic manufacturing lines producing 16A 3-pin plugs under Gazette S.O. 1421(E).",
    clause_ref: "Gazette Order S.O. 1421(E) §3(1)",
    action_cta: "Upload Calibration Logs",
    target_view: "documents",
  },
  {
    id: "act-3",
    requirement_id: "REQ-BIS-FORM-VI",
    standard_code: "BIS Act 2016 §15",
    title: "Form VI Annual Production & Marking Statement",
    authority: "Bureau of Indian Standards",
    category: "Statutory Reporting",
    status: "ACTION_NEEDED",
    urgency: "MEDIUM",
    deadline: "12 Jun 2026",
    days_remaining: 43,
    summary: "Annual declaration of total production quantity, ISI standard marks applied, and advance marking fee reconciliation for FY 2025-26 via Manakonline.",
    clause_ref: "BIS Conformity Assessment Reg. 2018, Reg 8",
    action_cta: "Review Filing Workflow",
    target_view: "workflows",
  },
];

export const upcomingDeadlines: UpcomingDeadline[] = [
  {
    id: "dl-1",
    requirement_id: "REQ-BIS-1293",
    title: "IS 1293 Laboratory Type-Test Renewal",
    authority: "BIS",
    due_date: "14 May 2026",
    days_remaining: 14,
    basis: "BIS Conformity Assessment Regulations 2018 (Scheme I, Para 7)",
    status: "URGENT",
    standard_code: "IS 1293:2019",
  },
  {
    id: "dl-2",
    requirement_id: "REQ-QCO-2024",
    title: "Factory Audit Evidence Dossier Submission",
    authority: "DPIIT",
    due_date: "28 May 2026",
    days_remaining: 28,
    basis: "Electrical Accessories (Quality Control) Order, 2024",
    status: "UPCOMING",
    standard_code: "S.O. 1421(E)",
  },
  {
    id: "dl-3",
    requirement_id: "REQ-HSPCB-CTO",
    title: "Pollution Control Board Consent-to-Operate Renewal",
    authority: "HSPCB",
    due_date: "24 Jun 2026",
    days_remaining: 45,
    basis: "Water (Prevention & Control) Act 1974 §25 & Air Act 1981 §21",
    status: "SCHEDULED",
  },
  {
    id: "dl-4",
    requirement_id: "REQ-BIS-FORM-VI",
    title: "Form VI Annual Production & Marking Statement",
    authority: "BIS",
    due_date: "09 Jul 2026",
    days_remaining: 60,
    basis: "Bureau of Indian Standards (Conformity Assessment) Reg §15",
    status: "SCHEDULED",
    standard_code: "Form VI",
  },
];

export const regulatoryChanges: RegulatoryChange[] = [
  {
    id: "reg-1",
    gazette_no: "S.O. 1421(E)",
    authority: "Ministry of Commerce & Industry (DPIIT)",
    title: "Electrical Accessories (Quality Control) Amendment Order, 2025",
    date: "02 Apr 2026",
    effective_date: "01 Jul 2026",
    impact: "Direct Impact",
    impact_level: "HIGH",
    category: "Mandatory QCO",
    summary: "Mandates Standard Mark (ISI) for 3-pin fused plugs under IS 1293:2019 with revised temperature rise test thresholds. Small & medium enterprises must submit updated test dossiers by 30 Jun 2026.",
    affected_standards: ["IS 1293:2019", "IS 302-1:2024"],
    verified: true,
    source_url: "https://egazette.gov.in/WriteReadData/2025/258912.pdf",
  },
  {
    id: "reg-2",
    gazette_no: "CMD-III/16:IS 302",
    authority: "Bureau of Indian Standards (CMD-III)",
    title: "Revised Testing Laboratory Guidelines for Household Heating Appliances",
    date: "18 Mar 2026",
    effective_date: "Immediate",
    impact: "Operational Impact",
    impact_level: "MEDIUM",
    category: "Technical Circular",
    summary: "Harmonizes safety testing clauses with IEC 60335-1 Ed 6.0. In-house test benches must update digital insulation resistance and leakage current calibration logs.",
    affected_standards: ["IS 302-1:2024"],
    verified: true,
    source_url: "https://bis.gov.in/cmd-circulars/CMD-III-16.pdf",
  },
  {
    id: "reg-3",
    gazette_no: "Notif. 48/2026-MSME",
    authority: "Ministry of MSME",
    title: "Scheme IV Simplified Certification Procedure Extension for MSMEs",
    date: "28 Feb 2026",
    effective_date: "01 Apr 2026",
    impact: "Benefit / Subsidy",
    impact_level: "INFO",
    category: "Government Scheme",
    summary: "Extends 80% subsidy on BIS marking fees and expedited 30-day factory inspection timeline for Medium Enterprises registered under Udyam portal.",
    affected_standards: ["All BIS Scheme I Licences"],
    verified: true,
    source_url: "https://msme.gov.in/schemes/bis-subsidy-2026",
  },
];

export const workflows: WorkflowItem[] = [
  {
    id: "wf-1",
    title: "BIS Certification Scheme I (Standard Mark - ISI)",
    authority: "Bureau of Indian Standards",
    standard: "IS 1293:2019",
    total_steps: 5,
    current_step: 3,
    current_step_name: "Laboratory Sample Testing",
    status: "IN_PROGRESS",
    steps: [
      { number: 1, name: "Application & Documentation", status: "COMPLETED", date: "12 Feb 2026" },
      { number: 2, name: "Preliminary Factory Audit", status: "COMPLETED", date: "04 Mar 2026" },
      { number: 3, name: "Laboratory Sample Testing", status: "IN_PROGRESS", date: "In Progress" },
      { number: 4, name: "Scrutiny & Grant of License", status: "WAITING" },
      { number: 5, name: "Production Marking Release", status: "WAITING" },
    ],
    blocker: "Awaiting NABL test report for Clause 18 (Temperature Rise)",
    last_updated: "Yesterday, 16:40 IST",
  },
  {
    id: "wf-2",
    title: "Extended Producer Responsibility (EPR) Clearance",
    authority: "Central Pollution Control Board (CPCB)",
    standard: "E-Waste Management Rules 2022",
    total_steps: 4,
    current_step: 2,
    current_step_name: "Auditor Verification Review",
    status: "WAITING_FOR_USER",
    steps: [
      { number: 1, name: "CPCB Portal Registration", status: "COMPLETED", date: "15 Jan 2026" },
      { number: 2, name: "Auditor Verification Review", status: "WAITING_FOR_USER", date: "Action Needed" },
      { number: 3, name: "PRO Agreement Scrutiny", status: "WAITING" },
      { number: 4, name: "EPR Certificate Issuance", status: "WAITING" },
    ],
    blocker: "Action Required: Upload authorized recycler agreement Annexure B",
    last_updated: "3 days ago",
  },
  {
    id: "wf-3",
    title: "State Factory License Triennial Renewal",
    authority: "Directorate of Industrial Safety & Health (DISH)",
    standard: "Factories Act 1948 §6",
    total_steps: 4,
    current_step: 4,
    current_step_name: "Final Endorsement",
    status: "SUBMITTED",
    steps: [
      { number: 1, name: "Challan Fee Remittance", status: "COMPLETED", date: "02 Feb 2026" },
      { number: 2, name: "Connected Power & Plant Audit", status: "COMPLETED", date: "20 Feb 2026" },
      { number: 3, name: "Safety Inspector Site Inspection", status: "COMPLETED", date: "15 Mar 2026" },
      { number: 4, name: "Final Endorsement", status: "IN_PROGRESS", date: "Under Review" },
    ],
    blocker: null,
    last_updated: "5 days ago",
  },
];

export const documents: DocumentItem[] = [
  {
    id: "doc-1",
    name: "Factory License Endorsement",
    code: "DOC-FL-2024",
    authority: "DISH Haryana",
    category: "Statutory Proof",
    status: "VERIFIED",
    file_format: "PDF",
    file_size: "2.4 MB",
    last_updated: "15 Mar 2026",
    valid_until: "31 Dec 2026",
    clause_linked: "Factories Act 1948 §6",
    notes: "Site plan and machinery power ratings verified by state inspector.",
  },
  {
    id: "doc-2",
    name: "NABL Type-Test Report (IS 1293:2019)",
    code: "DOC-TR-1293-A",
    authority: "ERDA Vadodara (NABL Accredited)",
    category: "Testing Evidence",
    status: "NEEDS_REVIEW",
    file_format: "PDF",
    file_size: "5.1 MB",
    last_updated: "10 Feb 2026",
    valid_until: "14 May 2026",
    clause_linked: "IS 1293:2019 Cl. 13.2 & 18",
    notes: "Type test renewal cycle due in 14 days. Re-testing scheduled with lab.",
  },
  {
    id: "doc-3",
    name: "Quality Assurance Plan (QAP) Rev 4.2",
    code: "DOC-QAP-2026",
    authority: "Internal / BIS CMD",
    category: "Factory Audit",
    status: "VERIFIED",
    file_format: "PDF",
    file_size: "1.8 MB",
    last_updated: "22 Mar 2026",
    valid_until: "Permanent",
    clause_linked: "Scheme I STI Guidelines",
    notes: "Includes Scheme of Testing and Inspection (STI) sampling frequencies.",
  },
  {
    id: "doc-4",
    name: "Process Flowchart & Factory Machinery Layout",
    code: "DOC-PFC-001",
    authority: "BIS Scheme I",
    category: "Technical Dossier",
    status: "VERIFIED",
    file_format: "PDF",
    file_size: "3.7 MB",
    last_updated: "18 Jan 2026",
    valid_until: "Permanent",
    clause_linked: "BIS Form V Part II",
    notes: "Pin insertion, injection molding, crimping, and high-voltage test line layout.",
  },
  {
    id: "doc-5",
    name: "Calibration Certificates for High-Voltage Test Rig",
    code: "DOC-CAL-HV-24",
    authority: "National Physical Laboratory / NABL",
    category: "Testing Evidence",
    status: "ISSUE",
    file_format: "PDF",
    file_size: "890 KB",
    last_updated: "02 Nov 2024",
    valid_until: "01 Nov 2025 (Expired)",
    clause_linked: "IS 1293 Cl. 16 Dielectric Rig",
    notes: "Certificate expired 5 months ago. Re-calibration must be performed before next audit.",
  },
  {
    id: "doc-6",
    name: "Registered Trademark Certificate (Brand APEX-CON)",
    code: "DOC-TM-8491",
    authority: "Trade Marks Registry India",
    category: "Legal Ownership",
    status: "VERIFIED",
    file_format: "PDF",
    file_size: "640 KB",
    last_updated: "10 Jan 2025",
    valid_until: "14 Oct 2032",
    clause_linked: "BIS Act 2016 §14 Trademark Rights",
    notes: "Class 9 electrical plugs and socket connectors registered under brand name.",
  },
  {
    id: "doc-7",
    name: "MSME Udyam Registration Certificate",
    code: "UDYAM-HR-05-0029182",
    authority: "Ministry of MSME",
    category: "Statutory Proof",
    status: "VERIFIED",
    file_format: "PDF",
    file_size: "420 KB",
    last_updated: "05 Apr 2025",
    valid_until: "Permanent",
    clause_linked: "Public Procurement & Subsidies",
    notes: "Medium manufacturing enterprise qualification. Eligible for 80% fee rebate.",
  },
  {
    id: "doc-8",
    name: "Pollution Control Board Consent-to-Operate (CTO)",
    code: "DOC-CTO-HSPCB-21",
    authority: "HSPCB Gurugram",
    category: "Environmental",
    status: "VERIFIED",
    file_format: "PDF",
    file_size: "1.2 MB",
    last_updated: "18 Jun 2023",
    valid_until: "24 Jun 2026",
    clause_linked: "Water Act §25 / Air Act §21",
    notes: "Valid for electroplating and plastic injection moulding operations.",
  },
  {
    id: "doc-9",
    name: "BIS Advance Marking Fee Payment Challan",
    code: "DOC-CHAL-BIS-26",
    authority: "Bureau of Indian Standards",
    category: "Statutory Proof",
    status: "VERIFIED",
    file_format: "PDF",
    file_size: "310 KB",
    last_updated: "02 Feb 2026",
    valid_until: "31 Mar 2027",
    clause_linked: "BIS Reg 2018 First Schedule",
    notes: "₹1,18,000 paid towards FY 2026-27 annual marking fee.",
  },
  {
    id: "doc-10",
    name: "In-House Quality Testing Laboratory Logbook",
    code: "DOC-LAB-LOG-Q1",
    authority: "Internal QA Department",
    category: "Testing Evidence",
    status: "UPLOADED",
    file_format: "XLSX",
    file_size: "4.5 MB",
    last_updated: "Yesterday, 17:15 IST",
    valid_until: "Quarterly",
    clause_linked: "Scheme of Testing and Inspection (STI)",
    notes: "Daily routine tests logged: dimensions, contact resistance, and flashover test.",
  },
  {
    id: "doc-11",
    name: "BIS Form V Grant of License Application Dossier",
    code: "DOC-FORM-V-DOSS",
    authority: "Bureau of Indian Standards",
    category: "Technical Dossier",
    status: "PROCESSING",
    file_format: "ZIP",
    file_size: "14.2 MB",
    last_updated: "28 Mar 2026",
    valid_until: "In Evaluation",
    clause_linked: "BIS Conformity Assessment Reg. 2018",
    notes: "Complete technical file submitted online. Awaiting BIS scrutiny verification.",
  },
];

export const standards: StandardItem[] = [
  {
    id: "std-1",
    code: "IS 1293:2019",
    year: "2019",
    title: "Plugs and socket-outlets for household and similar purposes of rated voltage up to and including 250 V",
    authority: "Bureau of Indian Standards",
    is_mandatory: true,
    qco_order: "Electrical Accessories (QCO) Order 2024, S.O. 1421(E)",
    scheme: "Scheme I (ISI Mark)",
    total_clauses: 32,
    applicable_clauses: 18,
    testing_parameters: [
      "Dimensions & Interchangeability (Cl. 9)",
      "Protection Against Electric Shock (Cl. 10)",
      "Temperature Rise at 16A (Cl. 18)",
      "Endurance Testing at 10,000 cycles (Cl. 13.2)",
      "Resistance to Heat, Fire and Tracking (Cl. 23)",
    ],
    last_amendment: "Amendment No. 2 (Nov 2024)",
    status: "RENEWAL_DUE",
  },
  {
    id: "std-2",
    code: "IS 302-1:2024",
    year: "2024",
    title: "Safety of household and similar electrical appliances — Part 1: General requirements",
    authority: "Bureau of Indian Standards",
    is_mandatory: true,
    qco_order: "Electrical Appliances (Quality Control) Order 2023",
    scheme: "Scheme I (ISI Mark)",
    total_clauses: 48,
    applicable_clauses: 24,
    testing_parameters: [
      "Leakage Current and Electric Strength at Operating Temp (Cl. 13)",
      "Moisture Resistance & Ingress Protection (Cl. 15)",
      "Abnormal Operation & Thermal Cutoff (Cl. 19)",
      "Stability and Mechanical Hazards (Cl. 20)",
    ],
    last_amendment: "Harmonized with IEC 60335-1 Ed 6.0",
    status: "COMPLIANT",
  },
  {
    id: "std-3",
    code: "IS 13252 (Part 1):2010",
    year: "2010",
    title: "Information Technology Equipment — Safety — Part 1: General Requirements",
    authority: "MeitY / BIS",
    is_mandatory: true,
    qco_order: "Electronics and Information Technology Goods (Compulsory Registration) Order 2021",
    scheme: "Scheme II (Compulsory Registration Scheme - CRS)",
    total_clauses: 41,
    applicable_clauses: 14,
    testing_parameters: [
      "Power Supply Isolation (Cl. 2.1)",
      "SELV Circuit Safety (Cl. 2.2)",
      "Flammability of Materials (Cl. 4.7)",
      "Creepage Distances and Clearances (Cl. 2.10)",
    ],
    last_amendment: "Amendment No. 4 (2023)",
    status: "COMPLIANT",
  },
  {
    id: "std-4",
    code: "IS 15885 (Part 2/Sec 13)",
    year: "2012",
    title: "Lamp Controlgear — Part 2: Particular Requirements: Section 13 DC or AC Supplied Electronic Controlgear for LED Modules",
    authority: "Ministry of Power / BIS",
    is_mandatory: true,
    qco_order: "LED Products (Quality Control) Order 2022",
    scheme: "Scheme II (CRS Registration)",
    total_clauses: 29,
    applicable_clauses: 11,
    testing_parameters: [
      "Thermal Endurance & Insulation (Cl. 12)",
      "Fault Condition Testing (Cl. 14)",
      "Harmonics & Power Factor Compliance",
    ],
    last_amendment: "Reaffirmed 2022",
    status: "COMPLIANT",
  },
  {
    id: "std-5",
    code: "IS 9873 (Part 1):2019",
    year: "2019",
    title: "Safety of Toys — Part 1: Safety Aspects Related to Mechanical and Physical Properties",
    authority: "Bureau of Indian Standards",
    is_mandatory: false,
    scheme: "Voluntary Assessment",
    total_clauses: 22,
    applicable_clauses: 0,
    testing_parameters: [
      "Sharp Edges & Points (Cl. 4.5)",
      "Small Parts Ingestion Test (Cl. 4.4)",
    ],
    last_amendment: "Reaffirmed 2024",
    status: "APPLICABLE",
  },
];

export const bisAgentPresets: BISAgentPreset[] = [
  {
    id: "pre-1",
    question: "What are the mandatory testing clauses and temperature rise thresholds under IS 1293:2019?",
    category: "Technical Standards",
    answer: "Under Indian Standard IS 1293:2019 for domestic plugs and socket-outlets, the primary safety clauses include Clause 9 (Interchangeability), Clause 10 (Electric Shock Protection), Clause 13.2 (Endurance), and Clause 18 (Temperature Rise).\n\nPer Clause 18.2, for 16A rated accessories, the temperature rise at terminals shall not exceed 45 K when tested at 1.1 times rated test current. For 6A rated plugs, maximum terminal temperature rise is capped at 30 K. Renewal of type test reports is required triennially through a NABL-accredited laboratory recognized by BIS.",
    clauses_cited: [
      { standard: "IS 1293:2019", clause: "Clause 18.2", title: "Terminal Temperature Rise Limit" },
      { standard: "IS 1293:2019", clause: "Clause 13.2", title: "Endurance Cycle Testing" },
      { standard: "QCO S.O. 1421(E)", clause: "Section 3(1)", title: "Mandatory Bureau Certification" },
    ],
    regulatory_source: "Bureau of Indian Standards Act 2016 & Electrical Accessories QCO 2024",
    provenance_verified: true,
    key_takeaway: "Your 16A accessories must maintain terminal rise under 45 K; test reports older than 36 months must be re-executed before the 14 May deadline.",
  },
  {
    id: "pre-2",
    question: "Does the Electrical Accessories QCO 2024 apply to imported power components?",
    category: "Regulatory Applicability",
    answer: "Yes. Under Section 3(2) of Gazette Notification S.O. 1421(E), all electrical plugs, sockets, and appliance couplers manufactured domestically or imported into the customs territory of India must bear the Standard Mark (ISI mark) under Scheme I of Schedule II of the BIS (Conformity Assessment) Regulations, 2018.\n\nForeign manufacturers must obtain certification via the Foreign Manufacturers Certification Scheme (FMCS) prior to customs clearance. Goods without valid FMCS license certificates cannot be cleared at Indian ports of entry.",
    clauses_cited: [
      { standard: "S.O. 1421(E)", clause: "Section 3(2)", title: "Application to Imported Goods" },
      { standard: "BIS FMCS Guidelines", clause: "Scheme I Schedule II", title: "Foreign Manufacturer Licensing" },
    ],
    regulatory_source: "Department for Promotion of Industry and Internal Trade (DPIIT), Gazette of India",
    provenance_verified: true,
    key_takeaway: "Imports cannot clear Indian customs without active FMCS registration and stamped ISI marks on product packaging.",
  },
  {
    id: "pre-3",
    question: "What documents must be included in the Factory Audit Quality Assurance Plan (QAP)?",
    category: "Audit & Documentation",
    answer: "A conforming Quality Assurance Plan (QAP) under BIS Scheme I requires six primary sections:\n1. Incoming raw material testing protocol (copper purity, poly-carbonate flammability test)\n2. In-process inspection stages and sampling frequency (crimping pull-force test)\n3. Final routine test log (high-voltage flashover at 2000V AC, earth continuity)\n4. Instrument calibration schedules with traceable NABL test reports\n5. Non-conforming material rejection and segregation procedure\n6. Scheme of Testing and Inspection (STI) adherence table.",
    clauses_cited: [
      { standard: "BIS STI/1293/6", clause: "Section 2", title: "Scheme of Testing and Inspection" },
      { standard: "BIS Form V Part II", clause: "Annexure C", title: "Factory Quality Plan Architecture" },
    ],
    regulatory_source: "Bureau of Indian Standards Central Marks Department (CMD-I)",
    provenance_verified: true,
    key_takeaway: "Ensure high-voltage rig calibration certificates (currently flagged with an issue) are renewed prior to audit submission.",
  },
  {
    id: "pre-4",
    question: "Can our medium enterprise claim the 80% BIS marking fee concession under MSME schemes?",
    category: "Schemes & Incentives",
    answer: "Yes. Under Ministry of MSME Notification 48/2026 read with BIS Notification CMD-I/MSME-Rebate, registered Medium Manufacturing Enterprises with valid Udyam certificates (UDYAM-HR-05-0029182) are eligible for an 80% concession on annual BIS marking fees, as well as a 50% concession on application and factory audit fees.\n\nTo claim, upload your Udyam registration along with CA-certified turnover certificate on the Manakonline portal during annual Form VI filing.",
    clauses_cited: [
      { standard: "Notif. 48/2026-MSME", clause: "Clause 4", title: "Scale-Based Marking Fee Subsidies" },
      { standard: "BIS Financial Reg. 2021", clause: "First Schedule Note 3", title: "MSME Fee Schedule" },
    ],
    regulatory_source: "Ministry of Micro, Small and Medium Enterprises & BIS Finance Wing",
    provenance_verified: true,
    key_takeaway: "Your active Udyam registration saves approximately ₹94,400 on annual renewal fees.",
  },
];
