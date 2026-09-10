/**
 * ComplyWise — Demo Government Concession Schemes & Benefits
 */

export interface GovernmentScheme {
  id: string;
  name: string;
  authority: string;
  subsidyType: string;
  eligibility: string;
  concessionPercent: number;
  estimatedAnnualSavings: number;
  turnaroundDays: number;
  status: "ACTIVE_ELIGIBLE" | "ENROLLED" | "APPLY_NOW";
  description: string;
  applicationUrl: string;
  prerequisites: string[];
}

export const DEMO_SCHEMES: GovernmentScheme[] = [
  {
    id: "sch-msme-bis-fee",
    name: "Ministry of MSME 50% BIS Marking Fee Concession",
    authority: "Ministry of MSME / BIS Joint Gazette Order",
    subsidyType: "Direct Fee Waiver",
    eligibility: "Micro and Small manufacturing enterprises with valid Udyam Registration.",
    concessionPercent: 50,
    estimatedAnnualSavings: 94400,
    turnaroundDays: 14,
    status: "ACTIVE_ELIGIBLE",
    description:
      "Statutory 50% discount on the annual minimum marking fee and 50% discount on renewal application fees payable to the Bureau of Indian Standards.",
    applicationUrl: "https://msme.gov.in/schemes/bis-fee-concession",
    prerequisites: [
      "Valid Udyam Registration Number (URN)",
      "Plant & machinery investment < ₹10 Crore",
      "Annual turnover < ₹50 Crore",
    ],
  },
  {
    id: "sch-nabl-testing-subsidy",
    name: "MSME Quality Certification Testing Subsidy Scheme",
    authority: "Development Commissioner MSME",
    subsidyType: "Testing Fee Reimbursement",
    eligibility: "Enterprises acquiring NABL accredited laboratory test reports for BIS certification.",
    concessionPercent: 75,
    estimatedAnnualSavings: 150000,
    turnaroundDays: 30,
    status: "APPLY_NOW",
    description:
      "Reimbursement of up to 75% of actual testing fees charged by NABL laboratories for initial type-testing and periodic surveillance renewals.",
    applicationUrl: "https://champions.gov.in",
    prerequisites: [
      "Receipts and test reports from NABL accredited testing laboratory",
      "Zero prior default on state government incentives",
    ],
  },
  {
    id: "sch-green-fast-track",
    name: "Green Industrial Units Expedited Fast-Track Inspection",
    authority: "DPIIT / State Industrial Development Corporations",
    subsidyType: "Expedited Timeline",
    eligibility: "Manufacturing units with valid ISO 14001 certification or zero-liquid discharge.",
    concessionPercent: 0,
    estimatedAnnualSavings: 60000,
    turnaroundDays: 30,
    status: "ENROLLED",
    description:
      "Prioritized 30-day factory surveillance audit and clearance window, bypassing standard 90-day queue.",
    applicationUrl: "https://dpiit.gov.in/green-fast-track",
    prerequisites: [
      "ISO 14001:2015 Environmental Management System Certification",
      "Consent to Operate (CTO) with Zero Liquid Discharge endorsement",
    ],
  },
];
