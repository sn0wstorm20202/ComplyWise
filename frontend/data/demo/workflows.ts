/**
 * ComplyWise — Demo Statutory Workflows & Multi-Stage Pipelines
 */

export interface WorkflowStageNode {
  id: string;
  number: number;
  name: string;
  status: "COMPLETED" | "IN_PROGRESS" | "PENDING" | "BLOCKED";
  description: string;
  assignedTo: string;
  updatedAt?: string;
  estimatedCompletion?: string;
  actionCta?: string;
  checklist?: { label: string; done: boolean }[];
}

export interface StatutoryWorkflow {
  id: string;
  title: string;
  standardCode: string;
  authority: string;
  status: "IN_PROGRESS" | "WAITING_FOR_USER" | "SUBMITTED" | "COMPLETED";
  currentStageIndex: number;
  totalStages: number;
  lastUpdated: string;
  dueDate: string;
  blocker?: string | null;
  stages: WorkflowStageNode[];
}

export const DEMO_WORKFLOWS: StatutoryWorkflow[] = [
  {
    id: "wf-bis-lic-renewal",
    title: "BIS Scheme-I Certification & ISI Mark License Renewal",
    standardCode: "IS 1293:2019",
    authority: "Bureau of Indian Standards",
    status: "IN_PROGRESS",
    currentStageIndex: 2, // 0-indexed, so Stage 3 "Review" is active
    totalStages: 7,
    lastUpdated: "Today, 10:15 AM",
    dueDate: "14 May 2026",
    blocker: "Awaiting NABL accredited endurance test report re-validation.",
    stages: [
      {
        id: "stage-1",
        number: 1,
        name: "Requirement",
        status: "COMPLETED",
        description: "Statutory applicability identified under DPIIT mandatory QCO Gazette Order S.O. 1421(E).",
        assignedTo: "Automated Engine",
        updatedAt: "10 Jan 2025",
        checklist: [
          { label: "Check HS Code 85366910 against QCO schedule", done: true },
          { label: "Verify manufacturer jurisdiction & factory address", done: true },
        ],
      },
      {
        id: "stage-2",
        number: 2,
        name: "Documents",
        status: "COMPLETED",
        description: "Statutory evidence dossier compiled: factory lease, machinery list, and laboratory instruments.",
        assignedTo: "Dr. Vikramaditya Sharma",
        updatedAt: "18 Jan 2025",
        checklist: [
          { label: "Upload Factory License & DISH Registration", done: true },
          { label: "Upload Quality Assurance Plan Rev 4.2", done: true },
          { label: "Upload In-house testing equipment calibration logs", done: true },
        ],
      },
      {
        id: "stage-3",
        number: 3,
        name: "Review",
        status: "IN_PROGRESS",
        description: "Internal regulatory audit of test parameters prior to formal portal submission.",
        assignedTo: "QA Technical Lead",
        updatedAt: "Today, 10:15 AM",
        estimatedCompletion: "24 Jan 2025",
        actionCta: "Review Pre-Submission Audit",
        checklist: [
          { label: "Cross-check Clause 13.2 Endurance test parameters", done: true },
          { label: "Validate Clause 18 Temperature Rise threshold", done: false },
          { label: "Confirm TM authorization for ISI device mark", done: true },
        ],
      },
      {
        id: "stage-4",
        number: 4,
        name: "Application",
        status: "PENDING",
        description: "Generation of Form-I application dossier for Manakonline portal submission.",
        assignedTo: "Regulatory Officer",
        estimatedCompletion: "02 Feb 2025",
        actionCta: "Draft Form-I Application",
        checklist: [
          { label: "Generate digitally signed Form-I payload", done: false },
          { label: "Calculate statutory application & audit inspection fees", done: false },
        ],
      },
      {
        id: "stage-5",
        number: 5,
        name: "Submission",
        status: "PENDING",
        description: "Formal electronic filing on BIS portal with e-challan payment receipt.",
        assignedTo: "Legal Signatory",
        estimatedCompletion: "10 Feb 2025",
      },
      {
        id: "stage-6",
        number: 6,
        name: "Processing",
        status: "PENDING",
        description: "Factory physical surveillance inspection by BIS Empanelled Inspecting Officer.",
        assignedTo: "BIS Inspecting Officer",
        estimatedCompletion: "28 Feb 2025",
      },
      {
        id: "stage-7",
        number: 7,
        name: "Complete",
        status: "PENDING",
        description: "Endorsement of renewed CM/L license certificate with valid QR-code.",
        assignedTo: "Bureau of Indian Standards",
        estimatedCompletion: "15 Mar 2025",
      },
    ],
  },
  {
    id: "wf-epr-clearance",
    title: "CPCB Extended Producer Responsibility (EPR) Annual Filing",
    standardCode: "E-Waste Rules 2022",
    authority: "Central Pollution Control Board",
    status: "WAITING_FOR_USER",
    currentStageIndex: 1,
    totalStages: 5,
    lastUpdated: "Yesterday, 3:45 PM",
    dueDate: "30 Jun 2026",
    stages: [
      {
        id: "epr-1",
        number: 1,
        name: "Requirement",
        status: "COMPLETED",
        description: "Annual recycling target determined based on 2-year moving sales volume.",
        assignedTo: "Automated Engine",
      },
      {
        id: "epr-2",
        number: 2,
        name: "Documents",
        status: "IN_PROGRESS",
        description: "Reconciliation of EPR recycling credit certificates from registered recyclers.",
        assignedTo: "Operations Lead",
        actionCta: "Upload Recycling Credit Certificates",
      },
      {
        id: "epr-3",
        number: 3,
        name: "Review",
        status: "PENDING",
        description: "Environmental auditor validation of mass-balance records.",
        assignedTo: "Environmental Auditor",
      },
      {
        id: "epr-4",
        number: 4,
        name: "Submission",
        status: "PENDING",
        description: "CPCB EPR Portal annual return filing.",
        assignedTo: "Compliance Officer",
      },
      {
        id: "epr-5",
        number: 5,
        name: "Complete",
        status: "PENDING",
        description: "Issuance of annual EPR compliance acknowledgment slip.",
        assignedTo: "CPCB Regional Office",
      },
    ],
  },
];
