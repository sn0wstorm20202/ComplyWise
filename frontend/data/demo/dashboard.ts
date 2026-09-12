/**
 * ComplyWise — Industrial Dashboard Demo Data
 *
 * Grounded in realistic Indian statutory compliance metrics:
 * BIS licence verification, QCO surveillance, pollution control,
 * factory safety, and NABL accredited testing audit readiness.
 */

import { BusinessProfile } from "./business-profile";

export interface ComplianceHealth {
  percentage: number;
  compliantCount: number;
  inProgressCount: number;
  overdueCount: number;
  inProgressPercentage: number;
  overduePercentage: number;
  statusLabel: string;
}

export interface StatutoryRequirements {
  applicableCount: number;
  isStandardsRatio: string;
  mandatoryQcoCount: number;
  voluntaryCount: number;
}

export interface ActionTimelinePoint {
  day: string;
  count: number;
  isPeak?: boolean;
}

export interface ActionItem {
  id: string;
  requirementId: string;
  standardCode: string;
  title: string;
  authority: string;
  category: string;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  deadline: string;
  daysRemaining: number;
  summary: string;
  clauseRef: string;
  actionCta: string;
  targetView: "compliance" | "documents" | "workflows";
}

export interface ComplianceActions {
  openCount: number;
  changeFromLastWeek: string;
  highPriorityCount: number;
  totalCount: number;
  timeline: ActionTimelinePoint[];
  items: ActionItem[];
}

export interface ActivityDay {
  day: string;
  tasks: number;
  isHighlight: boolean;
  dateStr: string;
}

export interface ComplianceActivity {
  weeklyTasks: number;
  growthPercentage: string;
  maxTasks: number;
  daily: ActivityDay[];
}

export interface ComplianceDocuments {
  totalCount: number;
  onTrackCount: number;
  changeThisWeek: string;
  verifiedCount: number;
  underReviewCount: number;
  verifiedPercentage: number;
  underReviewPercentage: number;
}

export interface ComplianceCategoryStats {
  category: string;
  healthPercentage: number;
  compliantCount: number;
  inProgressCount: number;
  overdueCount: number;
  inProgressPercentage: number;
  overduePercentage: number;
}

export interface DashboardData {
  complianceHealth: ComplianceHealth;
  requirements: StatutoryRequirements;
  actions: ComplianceActions;
  activity: ComplianceActivity;
  documents: ComplianceDocuments;
  standards: {
    featured: {
      code: string;
      title: string;
      badge: string;
      description: string;
      authority: string;
      points: number[];
    };
    totalTracked: number;
  };
  categoryBreakdown: Record<string, ComplianceCategoryStats>;
}

export function getDashboardData(profile: BusinessProfile): DashboardData {
  const name = (profile.businessName || "").toLowerCase();
  const desc = (
    (profile as any).productDescription ||
    profile.activities?.join(" ") ||
    profile.sector ||
    ""
  ).toLowerCase();

  const isAero = name.includes("aeroharvest") || desc.includes("drone") || desc.includes("hydroponic");
  const isRenew = name.includes("renewcell") || desc.includes("recycl") || desc.includes("polymer") || desc.includes("circular");
  const isAarohan = name.includes("aarohan") || desc.includes("millet") || desc.includes("bioharvest") || desc.includes("biogas");
  const isBattery = name.includes("ganesh") || desc.includes("battery pack") || desc.includes("bess") || desc.includes("energy-storage");
  const isMedTech = name.includes("bluepeak") || desc.includes("medtech") || desc.includes("diagnostic") || desc.includes("microfluidic");

  // 1. AeroHarvest AgriTech
  if (isAero) {
    return {
      complianceHealth: {
        percentage: 88,
        compliantCount: 158,
        inProgressCount: 36,
        overdueCount: 12,
        inProgressPercentage: 8,
        overduePercentage: 4,
        statusLabel: "Airworthy / Audit Ready",
      },
      requirements: {
        applicableCount: 17,
        isStandardsRatio: "04 / 17",
        mandatoryQcoCount: 10,
        voluntaryCount: 7,
      },
      actions: {
        openCount: 4,
        changeFromLastWeek: "↑ 3 from last week",
        highPriorityCount: 9,
        totalCount: 15,
        timeline: [
          { day: "Mon", count: 3 },
          { day: "Tue", count: 2 },
          { day: "Wed", count: 4 },
          { day: "Thu", count: 5, isPeak: true },
          { day: "Fri", count: 3 },
          { day: "Sat", count: 2 },
          { day: "Sun", count: 2 },
        ],
        items: [
          {
            id: "act-1",
            requirementId: "REQ-DGCA-DRONE-01",
            standardCode: "DGCA Drone Rules 2021",
            title: "DGCA Type Certificate Submission for Agri-Drone Spray Payloads",
            authority: "Directorate General of Civil Aviation",
            category: "Aviation Safety",
            urgency: "HIGH",
            deadline: "20 May 2026",
            daysRemaining: 18,
            summary: "Digital sky registration and autonomous geofencing fail-safe testing report submission.",
            clauseRef: "Drone Rules 2021 §8 & §12",
            actionCta: "Upload Flight Test Dossier",
            targetView: "compliance",
          },
          {
            id: "act-2",
            requirementId: "REQ-CIBRC-BIO-02",
            standardCode: "Insecticides Act 1968 §9",
            title: "Hydroponic Botanical Extract Bio-Pesticide Clearance",
            authority: "Central Insecticides Board (CIB&RC)",
            category: "Agrochemical",
            urgency: "HIGH",
            deadline: "02 Jun 2026",
            daysRemaining: 31,
            summary: "Periodic toxicity residue report and bio-efficacy evaluation under NABL testing guidelines.",
            clauseRef: "Insecticides Rules 1971 Sch IV",
            actionCta: "Review Residue Report",
            targetView: "documents",
          },
          {
            id: "act-3",
            requirementId: "REQ-BIS-CRS-BATTERY",
            standardCode: "IS 16046 (Part 2):2018",
            title: "BIS CRS Registration for High-Discharge Drone Batteries",
            authority: "Bureau of Indian Standards",
            category: "Electronics Safety",
            urgency: "MEDIUM",
            deadline: "18 Jun 2026",
            daysRemaining: 47,
            summary: "Secondary sealed lithium cells mandatory registration under MeitY CRO Scheme.",
            clauseRef: "IS 16046-2 Clause 8.2",
            actionCta: "Schedule Cell Test",
            targetView: "workflows",
          },
        ],
      },
      activity: {
        weeklyTasks: 215,
        growthPercentage: "+38%",
        maxTasks: 100,
        daily: [
          { day: "Mon", tasks: 32, isHighlight: false, dateStr: "20 Jan" },
          { day: "Tue", tasks: 48, isHighlight: false, dateStr: "21 Jan" },
          { day: "Wed", tasks: 42, isHighlight: false, dateStr: "22 Jan" },
          { day: "Thu", tasks: 68, isHighlight: true, dateStr: "23 Jan" },
          { day: "Fri", tasks: 55, isHighlight: false, dateStr: "24 Jan" },
          { day: "Sat", tasks: 36, isHighlight: false, dateStr: "25 Jan" },
          { day: "Sun", tasks: 34, isHighlight: false, dateStr: "26 Jan" },
        ],
      },
      documents: {
        totalCount: 15,
        onTrackCount: 15,
        changeThisWeek: "5 this week",
        verifiedCount: 11,
        underReviewCount: 4,
        verifiedPercentage: 73,
        underReviewPercentage: 27,
      },
      standards: {
        featured: {
          code: "DGCA Rules / IS 15885",
          title: "Agri-Drone Airworthiness",
          badge: "★ DGCA Certified",
          description: "Unmanned Aircraft Systems airworthiness standards, flight controllers, and automated payload calibration.",
          authority: "Directorate General of Civil Aviation",
          points: [25, 30, 35, 42, 50, 58, 65, 72, 80, 88, 92, 95],
        },
        totalTracked: 19,
      },
      categoryBreakdown: {
        Overall: {
          category: "Overall",
          healthPercentage: 88,
          compliantCount: 158,
          inProgressCount: 36,
          overdueCount: 12,
          inProgressPercentage: 8,
          overduePercentage: 4,
        },
        "DGCA Drone Airworthiness": {
          category: "DGCA Drone Airworthiness",
          healthPercentage: 91,
          compliantCount: 64,
          inProgressCount: 10,
          overdueCount: 3,
          inProgressPercentage: 6,
          overduePercentage: 3,
        },
        "Agrochemical & Nutrients": {
          category: "Agrochemical & Nutrients",
          healthPercentage: 84,
          compliantCount: 48,
          inProgressCount: 14,
          overdueCount: 5,
          inProgressPercentage: 11,
          overduePercentage: 5,
        },
        "Facility Fire & Hazardous Storage": {
          category: "Facility Fire & Hazardous Storage",
          healthPercentage: 89,
          compliantCount: 46,
          inProgressCount: 12,
          overdueCount: 4,
          inProgressPercentage: 7,
          overduePercentage: 4,
        },
      },
    };
  }

  // 2. ReNewCell Circular Materials
  if (isRenew) {
    return {
      complianceHealth: {
        percentage: 89,
        compliantCount: 172,
        inProgressCount: 28,
        overdueCount: 8,
        inProgressPercentage: 7,
        overduePercentage: 4,
        statusLabel: "CPCB Authorized / Clean Audit",
      },
      requirements: {
        applicableCount: 17,
        isStandardsRatio: "05 / 17",
        mandatoryQcoCount: 13,
        voluntaryCount: 4,
      },
      actions: {
        openCount: 3,
        changeFromLastWeek: "↑ 1 from last week",
        highPriorityCount: 7,
        totalCount: 14,
        timeline: [
          { day: "Mon", count: 1 },
          { day: "Tue", count: 2 },
          { day: "Wed", count: 4, isPeak: true },
          { day: "Thu", count: 3 },
          { day: "Fri", count: 3 },
          { day: "Sat", count: 1 },
          { day: "Sun", count: 2 },
        ],
        items: [
          {
            id: "act-1",
            requirementId: "REQ-CPCB-EPR-BATT",
            standardCode: "BWMR 2022 §11",
            title: "CPCB Portal Recycler Authorization & Material Recovery Declaration",
            authority: "Central Pollution Control Board",
            category: "EPR Mandate",
            urgency: "HIGH",
            deadline: "15 May 2026",
            daysRemaining: 15,
            summary: "Minimum 70% cobalt & nickel recovery threshold certification under Battery Waste Rules.",
            clauseRef: "Battery Waste Management Rules 2022 §11",
            actionCta: "Upload Recovery Audit",
            targetView: "compliance",
          },
          {
            id: "act-2",
            requirementId: "REQ-SPCB-CTO-02",
            standardCode: "Water Act 1974 §25",
            title: "Consent to Operate (CTO) Effluent Discharge Re-Validation",
            authority: "Maharashtra Pollution Control Board",
            category: "Environmental Protection",
            urgency: "HIGH",
            deadline: "30 May 2026",
            daysRemaining: 30,
            summary: "Zero Liquid Discharge (ZLD) effluent parameters and pH neutralizer logs submission.",
            clauseRef: "Water (P&CP) Act 1974 §25/26",
            actionCta: "Submit ZLD Logs",
            targetView: "documents",
          },
          {
            id: "act-3",
            requirementId: "REQ-HAZ-MANIFEST",
            standardCode: "Hazardous Waste Rules 2016",
            title: "Form 10 Hazardous Waste Manifest Reconciliation",
            authority: "Ministry of Environment, Forest & CC",
            category: "Hazardous Cargo",
            urgency: "MEDIUM",
            deadline: "22 Jun 2026",
            daysRemaining: 51,
            summary: "Inter-state black mass transport manifest matching and TSDF landfill certificates.",
            clauseRef: "HWM Rules 2016 Form 10",
            actionCta: "Review Manifests",
            targetView: "workflows",
          },
        ],
      },
      activity: {
        weeklyTasks: 164,
        growthPercentage: "+19%",
        maxTasks: 100,
        daily: [
          { day: "Mon", tasks: 22, isHighlight: false, dateStr: "20 Jan" },
          { day: "Tue", tasks: 34, isHighlight: false, dateStr: "21 Jan" },
          { day: "Wed", tasks: 58, isHighlight: true, dateStr: "22 Jan" },
          { day: "Thu", tasks: 40, isHighlight: false, dateStr: "23 Jan" },
          { day: "Fri", tasks: 46, isHighlight: false, dateStr: "24 Jan" },
          { day: "Sat", tasks: 28, isHighlight: false, dateStr: "25 Jan" },
          { day: "Sun", tasks: 26, isHighlight: false, dateStr: "26 Jan" },
        ],
      },
      documents: {
        totalCount: 9,
        onTrackCount: 9,
        changeThisWeek: "2 this week",
        verifiedCount: 7,
        underReviewCount: 2,
        verifiedPercentage: 78,
        underReviewPercentage: 22,
      },
      standards: {
        featured: {
          code: "BWMR 2022 / IS 16046",
          title: "Battery Waste Recycling",
          badge: "★ CPCB Registered",
          description: "Extended Producer Responsibility (EPR) recycling targets and material recovery protocols for secondary lithium cells.",
          authority: "Central Pollution Control Board",
          points: [20, 26, 34, 45, 55, 68, 76, 85, 90],
        },
        totalTracked: 16,
      },
      categoryBreakdown: {
        Overall: {
          category: "Overall",
          healthPercentage: 89,
          compliantCount: 172,
          inProgressCount: 28,
          overdueCount: 8,
          inProgressPercentage: 7,
          overduePercentage: 4,
        },
        "CPCB Battery Waste Rules (EPR)": {
          category: "CPCB Battery Waste Rules (EPR)",
          healthPercentage: 92,
          compliantCount: 68,
          inProgressCount: 8,
          overdueCount: 2,
          inProgressPercentage: 5,
          overduePercentage: 3,
        },
        "Secondary Polymer Recycling": {
          category: "Secondary Polymer Recycling",
          healthPercentage: 87,
          compliantCount: 54,
          inProgressCount: 11,
          overdueCount: 3,
          inProgressPercentage: 9,
          overduePercentage: 4,
        },
        "Pollution Control (Air & Water Act)": {
          category: "Pollution Control (Air & Water Act)",
          healthPercentage: 88,
          compliantCount: 50,
          inProgressCount: 9,
          overdueCount: 3,
          inProgressPercentage: 8,
          overduePercentage: 4,
        },
      },
    };
  }

  // 3. Aarohan BioHarvest Foods
  if (isAarohan) {
    return {
      complianceHealth: {
        percentage: 91,
        compliantCount: 188,
        inProgressCount: 32,
        overdueCount: 8,
        inProgressPercentage: 6,
        overduePercentage: 3,
        statusLabel: "FSSAI / NPOP Compliant",
      },
      requirements: {
        applicableCount: 17,
        isStandardsRatio: "05 / 17",
        mandatoryQcoCount: 14,
        voluntaryCount: 8,
      },
      actions: {
        openCount: 5,
        changeFromLastWeek: "↑ 4 from last week",
        highPriorityCount: 12,
        totalCount: 28,
        timeline: [
          { day: "Mon", count: 2 },
          { day: "Tue", count: 4 },
          { day: "Wed", count: 3 },
          { day: "Thu", count: 5 },
          { day: "Fri", count: 6, isPeak: true },
          { day: "Sat", count: 3 },
          { day: "Sun", count: 2 },
        ],
        items: [
          {
            id: "act-1",
            requirementId: "REQ-FSSAI-CENTRAL-01",
            standardCode: "FSS Act 2006 §31",
            title: "FSSAI Central Manufacturing License Audit & Microbial Test Dossier",
            authority: "Food Safety & Standards Authority of India",
            category: "Food Safety",
            urgency: "HIGH",
            deadline: "10 May 2026",
            daysRemaining: 10,
            summary: "NABL microbiological screening for sprouted millet ready-to-eat breakfast cereal lines.",
            clauseRef: "FSS (Licensing & Registration) Reg 2011",
            actionCta: "Schedule FSSAI Audit",
            targetView: "compliance",
          },
          {
            id: "act-2",
            requirementId: "REQ-NPOP-ORG-02",
            standardCode: "NPOP Appendix 1",
            title: "NPOP Organic Certification & Farm Gate Traceability Dossier",
            authority: "APEDA / Ministry of Commerce",
            category: "Organic Certification",
            urgency: "HIGH",
            deadline: "24 May 2026",
            daysRemaining: 24,
            summary: "Raw millet procurement batch records and non-GMO residue certifications.",
            clauseRef: "National Programme for Organic Production §3.2",
            actionCta: "Upload Organic Batches",
            targetView: "documents",
          },
          {
            id: "act-3",
            requirementId: "REQ-LMPC-PACK-03",
            standardCode: "LMPC Rules 2011",
            title: "Legal Metrology Packaged Commodity Front-of-Pack Label Compliance",
            authority: "Department of Consumer Affairs",
            category: "Statutory Labeling",
            urgency: "MEDIUM",
            deadline: "15 Jun 2026",
            daysRemaining: 44,
            summary: "Net weight declarations, MRP printing and consumer care statutory coordinates verification.",
            clauseRef: "Legal Metrology (Packaged Commodities) Rule 6",
            actionCta: "Verify Packaging Label",
            targetView: "workflows",
          },
        ],
      },
      activity: {
        weeklyTasks: 278,
        growthPercentage: "+45%",
        maxTasks: 100,
        daily: [
          { day: "Mon", tasks: 38, isHighlight: false, dateStr: "20 Jan" },
          { day: "Tue", tasks: 54, isHighlight: false, dateStr: "21 Jan" },
          { day: "Wed", tasks: 62, isHighlight: false, dateStr: "22 Jan" },
          { day: "Thu", tasks: 75, isHighlight: false, dateStr: "23 Jan" },
          { day: "Fri", tasks: 96, isHighlight: true, dateStr: "24 Jan" },
          { day: "Sat", tasks: 48, isHighlight: false, dateStr: "25 Jan" },
          { day: "Sun", tasks: 42, isHighlight: false, dateStr: "26 Jan" },
        ],
      },
      documents: {
        totalCount: 35,
        onTrackCount: 35,
        changeThisWeek: "8 this week",
        verifiedCount: 26,
        underReviewCount: 9,
        verifiedPercentage: 74,
        underReviewPercentage: 26,
      },
      standards: {
        featured: {
          code: "FSSAI / IS 11536",
          title: "Processed Cereal Foods",
          badge: "★ FSSAI Certified",
          description: "Manufacturing, fortified nutritional standards, and hygienic packaging for ready-to-eat millet products.",
          authority: "Food Safety & Standards Authority of India",
          points: [30, 42, 55, 68, 78, 85, 92, 96],
        },
        totalTracked: 35,
      },
      categoryBreakdown: {
        Overall: {
          category: "Overall",
          healthPercentage: 91,
          compliantCount: 188,
          inProgressCount: 32,
          overdueCount: 8,
          inProgressPercentage: 6,
          overduePercentage: 3,
        },
        "FSSAI Central License & Safety": {
          category: "FSSAI Central License & Safety",
          healthPercentage: 95,
          compliantCount: 82,
          inProgressCount: 6,
          overdueCount: 1,
          inProgressPercentage: 4,
          overduePercentage: 1,
        },
        "NPOP Organic Standards": {
          category: "NPOP Organic Standards",
          healthPercentage: 89,
          compliantCount: 58,
          inProgressCount: 14,
          overdueCount: 4,
          inProgressPercentage: 8,
          overduePercentage: 3,
        },
        "Food Contact Packaging & Labeling": {
          category: "Food Contact Packaging & Labeling",
          healthPercentage: 89,
          compliantCount: 48,
          inProgressCount: 12,
          overdueCount: 3,
          inProgressPercentage: 7,
          overduePercentage: 4,
        },
      },
    };
  }

  // 4. Shree Ganesh Foods (Lithium Battery Packs for BESS)
  if (isBattery) {
    return {
      complianceHealth: {
        percentage: 85,
        compliantCount: 162,
        inProgressCount: 40,
        overdueCount: 14,
        inProgressPercentage: 9,
        overduePercentage: 6,
        statusLabel: "AIS 156 / CEA BESS Verified",
      },
      requirements: {
        applicableCount: 17,
        isStandardsRatio: "04 / 17",
        mandatoryQcoCount: 12,
        voluntaryCount: 6,
      },
      actions: {
        openCount: 3,
        changeFromLastWeek: "↑ 2 from last week",
        highPriorityCount: 8,
        totalCount: 18,
        timeline: [
          { day: "Mon", count: 2 },
          { day: "Tue", count: 4, isPeak: true },
          { day: "Wed", count: 3 },
          { day: "Thu", count: 3 },
          { day: "Fri", count: 4 },
          { day: "Sat", count: 2 },
          { day: "Sun", count: 2 },
        ],
        items: [
          {
            id: "act-1",
            requirementId: "REQ-AIS156-AMDT3",
            standardCode: "AIS 156 Amdt 3",
            title: "Thermal Runaway Containment & Thermal Propagation Testing",
            authority: "Automotive Research Association of India (ARAI)",
            category: "Electrical Safety",
            urgency: "HIGH",
            deadline: "18 May 2026",
            daysRemaining: 18,
            summary: "Phase 2 multi-cell thermal propagation containment and acoustic alarm validation dossier.",
            clauseRef: "AIS 156 Phase 2 Clause 6.1",
            actionCta: "Submit ARAI Test Data",
            targetView: "compliance",
          },
          {
            id: "act-2",
            requirementId: "REQ-CEA-BESS-GRID",
            standardCode: "CEA Tech Standards 2019",
            title: "Grid-Scale Energy Storage Inverter Synchronization Clearance",
            authority: "Central Electricity Authority",
            category: "Grid Interconnection",
            urgency: "HIGH",
            deadline: "05 Jun 2026",
            daysRemaining: 34,
            summary: "Power quality harmonics, anti-islanding protection and reactive power dispatch validation.",
            clauseRef: "CEA Technical Standards §9(2)",
            actionCta: "Upload CEA Dossier",
            targetView: "documents",
          },
          {
            id: "act-3",
            requirementId: "REQ-BWMR-PRODUCER",
            standardCode: "BWMR 2022 §4",
            title: "CPCB Producer Extended Producer Responsibility (EPR) Registration",
            authority: "Central Pollution Control Board",
            category: "Battery Waste Rules",
            urgency: "MEDIUM",
            deadline: "25 Jun 2026",
            daysRemaining: 54,
            summary: "Annual EPR liability calculation based on kWh capacity introduced into the market.",
            clauseRef: "BWMR 2022 Schedule II",
            actionCta: "Review EPR Calculation",
            targetView: "workflows",
          },
        ],
      },
      activity: {
        weeklyTasks: 198,
        growthPercentage: "+27%",
        maxTasks: 100,
        daily: [
          { day: "Mon", tasks: 28, isHighlight: false, dateStr: "20 Jan" },
          { day: "Tue", tasks: 56, isHighlight: true, dateStr: "21 Jan" },
          { day: "Wed", tasks: 44, isHighlight: false, dateStr: "22 Jan" },
          { day: "Thu", tasks: 48, isHighlight: false, dateStr: "23 Jan" },
          { day: "Fri", tasks: 62, isHighlight: false, dateStr: "24 Jan" },
          { day: "Sat", tasks: 34, isHighlight: false, dateStr: "25 Jan" },
          { day: "Sun", tasks: 28, isHighlight: false, dateStr: "26 Jan" },
        ],
      },
      documents: {
        totalCount: 14,
        onTrackCount: 14,
        changeThisWeek: "4 this week",
        verifiedCount: 10,
        underReviewCount: 4,
        verifiedPercentage: 71,
        underReviewPercentage: 29,
      },
      standards: {
        featured: {
          code: "AIS 156 / IS 16046",
          title: "BESS Battery Safety",
          badge: "★ ARAI Verified",
          description: "Traction and energy storage lithium pack safety, BMS overcharge cutoff & environmental endurance.",
          authority: "Ministry of Heavy Industries / BIS",
          points: [22, 28, 36, 48, 58, 70, 82, 90],
        },
        totalTracked: 18,
      },
      categoryBreakdown: {
        Overall: {
          category: "Overall",
          healthPercentage: 85,
          compliantCount: 162,
          inProgressCount: 40,
          overdueCount: 14,
          inProgressPercentage: 9,
          overduePercentage: 6,
        },
        "BESS Electrical Safety (AIS 156)": {
          category: "BESS Electrical Safety (AIS 156)",
          healthPercentage: 88,
          compliantCount: 68,
          inProgressCount: 12,
          overdueCount: 4,
          inProgressPercentage: 7,
          overduePercentage: 5,
        },
        "Thermal Management & BMS": {
          category: "Thermal Management & BMS",
          healthPercentage: 82,
          compliantCount: 52,
          inProgressCount: 16,
          overdueCount: 6,
          inProgressPercentage: 11,
          overduePercentage: 7,
        },
        "Battery Waste EPR & Factory Act": {
          category: "Battery Waste EPR & Factory Act",
          healthPercentage: 86,
          compliantCount: 42,
          inProgressCount: 12,
          overdueCount: 4,
          inProgressPercentage: 8,
          overduePercentage: 6,
        },
      },
    };
  }

  // 5. BluePeak MedTech Devices
  if (isMedTech) {
    return {
      complianceHealth: {
        percentage: 93,
        compliantCount: 192,
        inProgressCount: 24,
        overdueCount: 6,
        inProgressPercentage: 5,
        overduePercentage: 2,
        statusLabel: "CDSCO / ISO 13485 Certified",
      },
      requirements: {
        applicableCount: 17,
        isStandardsRatio: "05 / 17",
        mandatoryQcoCount: 15,
        voluntaryCount: 5,
      },
      actions: {
        openCount: 4,
        changeFromLastWeek: "↑ 2 from last week",
        highPriorityCount: 10,
        totalCount: 22,
        timeline: [
          { day: "Mon", count: 3 },
          { day: "Tue", count: 4 },
          { day: "Wed", count: 5, isPeak: true },
          { day: "Thu", count: 3 },
          { day: "Fri", count: 4 },
          { day: "Sat", count: 2 },
          { day: "Sun", count: 1 },
        ],
        items: [
          {
            id: "act-1",
            requirementId: "REQ-CDSCO-MD5-IVD",
            standardCode: "MDR 2017 Form MD-5",
            title: "CDSCO Form MD-5 In-Vitro Diagnostic Manufacturing License Audit",
            authority: "Central Drugs Standard Control Organisation",
            category: "Medical Device Rules",
            urgency: "HIGH",
            deadline: "12 May 2026",
            daysRemaining: 12,
            summary: "Medical device technical file review and cleanroom airflow validation for IVD test cassettes.",
            clauseRef: "Medical Devices Rules 2017 Fifth Schedule",
            actionCta: "Upload Technical Dossier",
            targetView: "compliance",
          },
          {
            id: "act-2",
            requirementId: "REQ-ISO13485-AUDIT",
            standardCode: "ISO 13485:2016",
            title: "ISO 13485:2016 Medical Quality Management System Audit",
            authority: "National Accreditation Board (NABCB)",
            category: "Quality Standard",
            urgency: "HIGH",
            deadline: "28 May 2026",
            daysRemaining: 28,
            summary: "Corrective and Preventive Action (CAPA) logs and risk management file ISO 14971 evaluation.",
            clauseRef: "ISO 13485:2016 Clause 7.3 & 8.5",
            actionCta: "Review CAPA Logs",
            targetView: "documents",
          },
          {
            id: "act-3",
            requirementId: "REQ-BIO-COMPAT-03",
            standardCode: "ISO 10993-1:2018",
            title: "Microfluidic Cartridge Biocompatibility & Shelf-Life Study",
            authority: "NABL Accredited Medical Testing Lab",
            category: "Clinical Safety",
            urgency: "MEDIUM",
            deadline: "16 Jun 2026",
            daysRemaining: 45,
            summary: "Accelerated aging study data and chemical characterization of cartridge reagents.",
            clauseRef: "ISO 10993 Biological Evaluation §4.2",
            actionCta: "Schedule Lab Testing",
            targetView: "workflows",
          },
        ],
      },
      activity: {
        weeklyTasks: 224,
        growthPercentage: "+31%",
        maxTasks: 100,
        daily: [
          { day: "Mon", tasks: 45, isHighlight: false, dateStr: "20 Jan" },
          { day: "Tue", tasks: 52, isHighlight: false, dateStr: "21 Jan" },
          { day: "Wed", tasks: 64, isHighlight: true, dateStr: "22 Jan" },
          { day: "Thu", tasks: 58, isHighlight: false, dateStr: "23 Jan" },
          { day: "Fri", tasks: 60, isHighlight: false, dateStr: "24 Jan" },
          { day: "Sat", tasks: 32, isHighlight: false, dateStr: "25 Jan" },
          { day: "Sun", tasks: 25, isHighlight: false, dateStr: "26 Jan" },
        ],
      },
      documents: {
        totalCount: 18,
        onTrackCount: 18,
        changeThisWeek: "6 this week",
        verifiedCount: 14,
        underReviewCount: 4,
        verifiedPercentage: 78,
        underReviewPercentage: 22,
      },
      standards: {
        featured: {
          code: "CDSCO MDR / ISO 13485",
          title: "In-Vitro Diagnostics",
          badge: "★ CDSCO Approved",
          description: "Point-of-care microfluidic diagnostic devices, Class B IVD reagents & ISO Class 8 cleanroom standards.",
          authority: "Central Drugs Standard Control Organisation",
          points: [35, 45, 58, 70, 80, 88, 94, 98],
        },
        totalTracked: 22,
      },
      categoryBreakdown: {
        Overall: {
          category: "Overall",
          healthPercentage: 93,
          compliantCount: 192,
          inProgressCount: 24,
          overdueCount: 6,
          inProgressPercentage: 5,
          overduePercentage: 2,
        },
        "CDSCO Medical Device Rules": {
          category: "CDSCO Medical Device Rules",
          healthPercentage: 96,
          compliantCount: 84,
          inProgressCount: 6,
          overdueCount: 1,
          inProgressPercentage: 3,
          overduePercentage: 1,
        },
        "ISO 13485 Cleanroom Quality": {
          category: "ISO 13485 Cleanroom Quality",
          healthPercentage: 91,
          compliantCount: 60,
          inProgressCount: 10,
          overdueCount: 3,
          inProgressPercentage: 6,
          overduePercentage: 3,
        },
        "Diagnostic Readers (IS 13252)": {
          category: "Diagnostic Readers (IS 13252)",
          healthPercentage: 92,
          compliantCount: 48,
          inProgressCount: 8,
          overdueCount: 2,
          inProgressPercentage: 5,
          overduePercentage: 3,
        },
      },
    };
  }

  // 6. Default / Eastern Smart Devices Pvt. Ltd. (Smart Electricity Meters & IoT)
  return {
    complianceHealth: {
      percentage: 82,
      compliantCount: 140,
      inProgressCount: 48,
      overdueCount: 16,
      inProgressPercentage: 10,
      overduePercentage: 8,
      statusLabel: "IS 16444 / Audit Ready",
    },
    requirements: {
      applicableCount: 17,
      isStandardsRatio: "06 / 17",
      mandatoryQcoCount: 12,
      voluntaryCount: 5,
    },
    actions: {
      openCount: 3,
      changeFromLastWeek: "↑ 2 from last week",
      highPriorityCount: 8,
      totalCount: 17,
      timeline: [
        { day: "Mon", count: 2 },
        { day: "Tue", count: 1 },
        { day: "Wed", count: 3, isPeak: true },
        { day: "Thu", count: 2 },
        { day: "Fri", count: 4 },
        { day: "Sat", count: 2 },
        { day: "Sun", count: 3 },
      ],
      items: [
        {
          id: "act-1",
          requirementId: "REQ-BIS-16444-01",
          standardCode: "IS 16444 (Part 1):2015",
          title: "IS 16444:2015 Type-Test Certificate & Meter Firmware Renewal",
          authority: "Bureau of Indian Standards",
          category: "Testing & Laboratory",
          urgency: "HIGH",
          deadline: "14 May 2026",
          daysRemaining: 14,
          summary: "Periodic meter accuracy calibration and RF mesh communication protocol verification under IS 16444.",
          clauseRef: "IS 16444:2015 Clause 13.2 & 18",
          actionCta: "Schedule NABL Re-Test",
          targetView: "compliance",
        },
        {
          id: "act-2",
          requirementId: "REQ-QCO-METERS",
          standardCode: "QCO S.O. 1421(E)",
          title: "Quality Assurance Plan (QAP) Submission for Smart Meter Assembly Lines",
          authority: "DPIIT / BIS",
          category: "Quality Control Order",
          urgency: "HIGH",
          deadline: "28 May 2026",
          daysRemaining: 28,
          summary: "Submit updated calibration logs and revised SMT soldering inspection protocols under Gazette S.O. 1421(E).",
          clauseRef: "Gazette Order S.O. 1421(E) §3(1)",
          actionCta: "Upload Calibration Dossier",
          targetView: "documents",
        },
        {
          id: "act-3",
          requirementId: "REQ-BIS-FORM-VI",
          standardCode: "BIS Act 2016 §15",
          title: "Form VI Annual Marking Statement & Fee Reconciliation",
          authority: "Bureau of Indian Standards",
          category: "Statutory Reporting",
          urgency: "MEDIUM",
          deadline: "30 Jun 2026",
          daysRemaining: 45,
          summary: "Annual marking fee reconciliation and total ISI-marked smart meter production volume declaration.",
          clauseRef: "BIS Conformity Reg 2018 Sch II",
          actionCta: "Review Form VI Statement",
          targetView: "workflows",
        },
      ],
    },
    activity: {
      weeklyTasks: 186,
      growthPercentage: "+24%",
      maxTasks: 100,
      daily: [
        { day: "Mon", tasks: 24, isHighlight: false, dateStr: "20 Jan" },
        { day: "Tue", tasks: 38, isHighlight: false, dateStr: "21 Jan" },
        { day: "Wed", tasks: 52, isHighlight: true, dateStr: "22 Jan" },
        { day: "Thu", tasks: 44, isHighlight: false, dateStr: "23 Jan" },
        { day: "Fri", tasks: 60, isHighlight: false, dateStr: "24 Jan" },
        { day: "Sat", tasks: 32, isHighlight: false, dateStr: "25 Jan" },
        { day: "Sun", tasks: 28, isHighlight: false, dateStr: "26 Jan" },
      ],
    },
    documents: {
      totalCount: 13,
      onTrackCount: 13,
      changeThisWeek: "4 this week",
      verifiedCount: 9,
      underReviewCount: 4,
      verifiedPercentage: 69,
      underReviewPercentage: 31,
    },
    standards: {
      featured: {
        code: "IS 16444:2015",
        title: "Smart Electricity Meters",
        badge: "★ BIS Mandated",
        description: "A.C. Static Direct Connected Watt-Hour Smart Meters for Advanced Metering Infrastructure (AMI).",
        authority: "Bureau of Indian Standards",
        points: [18, 24, 32, 45, 56, 68, 79, 88, 94],
      },
      totalTracked: 17,
    },
    categoryBreakdown: {
      Overall: {
        category: "Overall",
        healthPercentage: 82,
        compliantCount: 140,
        inProgressCount: 48,
        overdueCount: 16,
        inProgressPercentage: 10,
        overduePercentage: 8,
      },
      "Smart Metering (IS 16444)": {
        category: "Smart Metering (IS 16444)",
        healthPercentage: 85,
        compliantCount: 56,
        inProgressCount: 18,
        overdueCount: 5,
        inProgressPercentage: 11,
        overduePercentage: 4,
      },
      "PCB Assembly & Cleanroom": {
        category: "PCB Assembly & Cleanroom",
        healthPercentage: 90,
        compliantCount: 42,
        inProgressCount: 8,
        overdueCount: 3,
        inProgressPercentage: 6,
        overduePercentage: 4,
      },
      "Hazardous Waste & Battery EPR": {
        category: "Hazardous Waste & Battery EPR",
        healthPercentage: 74,
        compliantCount: 42,
        inProgressCount: 22,
        overdueCount: 8,
        inProgressPercentage: 16,
        overduePercentage: 10,
      },
    },
  };
}
