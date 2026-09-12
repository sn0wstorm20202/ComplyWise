/**
 * ComplyWise — Demo Regulatory Updates & Gazette Notifications
 */

export interface RegulatoryUpdate {
  id: string;
  gazetteNo: string;
  authority: string;
  title: string;
  publishDate: string;
  effectiveDate: string;
  impactLevel: "HIGH" | "MEDIUM" | "INFO";
  category: "Quality Control Order" | "Standard Revision" | "Enforcement Guideline" | "Concession Scheme";
  summary: string;
  affectedStandards: string[];
  verified: boolean;
  sourceUrl: string;
  keyRequirements: string[];
}

export const DEMO_REGULATORY_UPDATES: RegulatoryUpdate[] = [
  {
    id: "reg-01",
    gazetteNo: "CG-DL-E-15012025-259182",
    authority: "DPIIT / Ministry of Commerce and Industry",
    title: "Electrical Accessories (Quality Control) Amendment Order, 2025",
    publishDate: "15 Jan 2025",
    effectiveDate: "01 Jul 2025",
    impactLevel: "HIGH",
    category: "Quality Control Order",
    summary:
      "DPIIT mandates updated testing protocol for 16A domestic plugs under IS 1293:2019. Micro & Small enterprises are granted a 6-month transitional grace period till 01 Jul 2025.",
    affectedStandards: ["IS 1293:2019", "IS 3854:1997", "IS 60884-1"],
    verified: true,
    sourceUrl: "https://egazette.gov.in/WriteReadData/2025/259182.pdf",
    keyRequirements: [
      "All units must transition to revised Table 4 glow-wire endurance test limits.",
      "Customs authority instructed to inspect batch test certificates for all port consignments.",
      "Micro units (investment < ₹1 Cr) eligible for testing fee subsidy under PM-Vishwakarma scheme.",
    ],
  },
  {
    id: "reg-02",
    gazetteNo: "BIS-CMD-CIR-2025-04",
    authority: "Bureau of Indian Standards (CMD-I)",
    title: "Simplification of Guidelines for Grant of License via Fast-Track Self-Declaration",
    publishDate: "08 Jan 2025",
    effectiveDate: "Immediate (08 Jan 2025)",
    impactLevel: "MEDIUM",
    category: "Enforcement Guideline",
    summary:
      "License processing duration reduced from 90 days to 30 days for MSME manufacturing units with prior ISO 9001:2015 certification and valid NABL test reports.",
    affectedStandards: ["Scheme-I (All Product Standards)"],
    verified: true,
    sourceUrl: "https://www.bis.gov.in/circulars/cmd1/fasttrack-jan2025.pdf",
    keyRequirements: [
      "Factory inspection scheduled within 30 days of online application submission.",
      "No physical file movement required; all verification through Manakonline portal.",
    ],
  },
  {
    id: "reg-03",
    gazetteNo: "CPCB-B-29016-EPR-2024",
    authority: "Central Pollution Control Board",
    title: "Enforcement of Penalty Framework for Non-Fulfillment of FY 2024-25 EPR Targets",
    publishDate: "20 Dec 2024",
    effectiveDate: "31 Mar 2025",
    impactLevel: "HIGH",
    category: "Enforcement Guideline",
    summary:
      "Environmental compensation levy of ₹5,000 per metric tonne imposed on electronic equipment manufacturers failing to retire certified recycling credits.",
    affectedStandards: ["E-Waste Management Rules 2022", "Schedule I Item 17"],
    verified: true,
    sourceUrl: "https://cpcb.nic.in/epr-penalties-2024.pdf",
    keyRequirements: [
      "Mandatory reconciliation of EPR portal ledger by 31 March 2025.",
      "Bank guarantees forfeited if shortfall exceeds 15% of annual assigned target.",
    ],
  },
  {
    id: "reg-04",
    gazetteNo: "MSME-PMR-2024-88",
    authority: "Ministry of Micro, Small and Medium Enterprises",
    title: "50% Marking Fee Concession for Women-Owned and SC/ST Enterprises under BIS Scheme",
    publishDate: "02 Dec 2024",
    effectiveDate: "Immediate",
    impactLevel: "INFO",
    category: "Concession Scheme",
    summary:
      "Special reimbursement package providing 50% rebate on annual minimum marking fees and 80% subsidy on NABL product testing charges for eligible enterprises.",
    affectedStandards: ["BIS (Conformity Assessment) Regulations Schedule II"],
    verified: true,
    sourceUrl: "https://msme.gov.in/schemes/bis-concession-2024.pdf",
    keyRequirements: [
      "Must hold valid Udyam certificate with verified proprietorship / majority shareholding.",
      "Claims processed directly through the MSME Champions Portal within 45 days.",
    ],
  },
];
