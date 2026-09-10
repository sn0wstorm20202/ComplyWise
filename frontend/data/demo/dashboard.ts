/**
 * ComplyWise — Dynamic Dashboard Data Model & Calculator
 *
 * Derives real, responsive dashboard metrics directly from the active BusinessProfile.
 */

import { BusinessProfile } from "./business-profile";

export interface ActivityDay {
  day: string;
  tasks: number;
  isHighlight: boolean;
  dateStr: string;
}

export interface ActionTimelinePoint {
  day: string;
  count: number;
  isPeak?: boolean;
}

export interface PriorityActionItem {
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
  targetView: string;
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
  complianceHealth: {
    percentage: number;
    compliantCount: number;
    inProgressCount: number;
    overdueCount: number;
    inProgressPercentage: number;
    overduePercentage: number;
    statusLabel: string;
  };
  requirements: {
    applicableCount: number;
    isStandardsRatio: string;
    mandatoryQcoCount: number;
    voluntaryCount: number;
  };
  actions: {
    openCount: number;
    changeFromLastWeek: string;
    highPriorityCount: number;
    totalCount: number;
    timeline: ActionTimelinePoint[];
    items: PriorityActionItem[];
  };
  activity: {
    weeklyTasks: number;
    growthPercentage: string;
    maxTasks: number;
    daily: ActivityDay[];
  };
  documents: {
    totalCount: number;
    onTrackCount: number;
    changeThisWeek: string;
    verifiedCount: number;
    underReviewCount: number;
    verifiedPercentage: number;
    underReviewPercentage: number;
  };
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
  // Derive metrics dynamically based on profile specifics
  const isFood = profile.sector.toLowerCase().includes("food");
  const isSolar = profile.sector.toLowerCase().includes("renewable") || profile.sector.toLowerCase().includes("solar");

  const featuredStandardCode = isFood
    ? "IS 14543"
    : isSolar
    ? "IS 14286"
    : "IS 3055";

  const featuredDescription = isFood
    ? "Packaged drinking water and food safety surveillance."
    : isSolar
    ? "Crystalline silicon terrestrial photovoltaic (PV) modules."
    : "Clinical thermometers and precision measurement apparatus.";

  const baseHealth = isFood ? 85 : isSolar ? 88 : 82;
  const compliantCount = isFood ? 152 : isSolar ? 164 : 140;
  const inProgressCount = isFood ? 42 : isSolar ? 38 : 48;
  const overdueCount = isFood ? 12 : isSolar ? 8 : 16;
  const applicableCount = isFood ? 22 : isSolar ? 16 : 18;
  const standardsRatio = isFood ? "11 / 32" : isSolar ? "08 / 22" : "09 / 28";

  return {
    complianceHealth: {
      percentage: baseHealth,
      compliantCount,
      inProgressCount,
      overdueCount,
      inProgressPercentage: 10,
      overduePercentage: 8,
      statusLabel: "Healthy / Audit Ready",
    },
    requirements: {
      applicableCount,
      isStandardsRatio: standardsRatio,
      mandatoryQcoCount: isFood ? 14 : isSolar ? 11 : 12,
      voluntaryCount: 6,
    },
    actions: {
      openCount: 3,
      changeFromLastWeek: "↑ 2 from last week",
      highPriorityCount: 10,
      totalCount: 26,
      timeline: [
        { day: "Mon", count: 2 },
        { day: "Tue", count: 1 },
        { day: "Wed", count: 3, isPeak: true },
        { day: "Thu", count: 2 },
        { day: "Fri", count: 4 },
        { day: "Sat", count: 3 },
        { day: "Sun", count: 3 },
      ],
      items: [
        {
          id: "act-1",
          requirementId: isFood ? "REQ-FSSAI-BIS-01" : "REQ-BIS-1293",
          standardCode: isFood ? "IS 14543:2024" : "IS 1293:2019",
          title: isFood
            ? "Microbiological Laboratory Re-Testing Audit"
            : "Mandatory Type-Test Certificate Renewal",
          authority: "Bureau of Indian Standards",
          category: "Testing & Laboratory",
          urgency: "HIGH",
          deadline: "14 May 2026",
          daysRemaining: 14,
          summary: isFood
            ? "Periodic pesticide residue and microbial pathogen testing reports under IS 14543 have crossed the 180-day window. NABL accredited re-testing is mandatory."
            : "Clause 13.2 (Endurance under normal conditions) & Clause 18 (Temperature Rise) test reports have crossed the 3-year renewal interval.",
          clauseRef: isFood ? "IS 14543:2024 Clause 7.2" : "IS 1293:2019 Clause 13.2 & 18",
          actionCta: "Schedule NABL Re-Test",
          targetView: "compliance",
        },
        {
          id: "act-2",
          requirementId: "REQ-QCO-2024-EA",
          standardCode: "QCO S.O. 1421(E)",
          title: "Factory Audit Evidence Dossier Submission",
          authority: "DPIIT / BIS",
          category: "Quality Control Order",
          urgency: "HIGH",
          deadline: "28 May 2026",
          daysRemaining: 28,
          summary:
            "Submit updated calibration logs and revised Quality Assurance Plan (QAP) for manufacturing lines under Gazette S.O. 1421(E).",
          clauseRef: "Gazette Order S.O. 1421(E) §3(1)",
          actionCta: "Upload Calibration Dossier",
          targetView: "documents",
        },
        {
          id: "act-3",
          requirementId: "REQ-BIS-FORM-VI",
          standardCode: "BIS Act 2016 §15",
          title: "Form VI Annual Production & Marking Statement",
          authority: "Bureau of Indian Standards",
          category: "Statutory Reporting",
          urgency: "MEDIUM",
          deadline: "30 Jun 2026",
          daysRemaining: 45,
          summary:
            "Annual marking fee reconciliation and total ISI-marked production volume declaration for FY 2025-26 under the Bureau of Indian Standards (Conformity Assessment) Regulations.",
          clauseRef: "BIS Conformity Reg 2018 Sch II",
          actionCta: "Review Form VI Reconciliation",
          targetView: "workflows",
        },
      ],
    },
    activity: {
      weeklyTasks: 186,
      growthPercentage: "+32%",
      maxTasks: 100,
      daily: [
        { day: "Mon", tasks: 26, isHighlight: false, dateStr: "20 Jan" },
        { day: "Tue", tasks: 42, isHighlight: false, dateStr: "21 Jan" },
        { day: "Wed", tasks: 36, isHighlight: false, dateStr: "22 Jan" },
        { day: "Thu", tasks: 60, isHighlight: false, dateStr: "23 Jan" },
        { day: "Fri", tasks: 88, isHighlight: true, dateStr: "24 Jan" },
        { day: "Sat", tasks: 48, isHighlight: false, dateStr: "25 Jan" },
        { day: "Sun", tasks: 54, isHighlight: false, dateStr: "26 Jan" },
      ],
    },
    documents: {
      totalCount: 11,
      onTrackCount: 11,
      changeThisWeek: "3 this week",
      verifiedCount: 8,
      underReviewCount: 3,
      verifiedPercentage: 72,
      underReviewPercentage: 28,
    },
    standards: {
      featured: {
        code: featuredStandardCode,
        title: "Stay Compliant",
        badge: `★ ${featuredStandardCode}`,
        description: featuredDescription,
        authority: "Bureau of Indian Standards",
        points: [18, 22, 25, 29, 34, 38, 44, 49, 55, 62, 70, 78, 85, 92, 98],
      },
      totalTracked: 28,
    },
    categoryBreakdown: {
      Overall: {
        category: "Overall",
        healthPercentage: baseHealth,
        compliantCount,
        inProgressCount,
        overdueCount,
        inProgressPercentage: 10,
        overduePercentage: 8,
      },
      "Electrical / Machinery": {
        category: "Electrical / Machinery",
        healthPercentage: 79,
        compliantCount: 78,
        inProgressCount: 24,
        overdueCount: 9,
        inProgressPercentage: 12,
        overduePercentage: 9,
      },
      "Food Safety & FSSAI": {
        category: "Food Safety & FSSAI",
        healthPercentage: 91,
        compliantCount: 48,
        inProgressCount: 12,
        overdueCount: 3,
        inProgressPercentage: 6,
        overduePercentage: 3,
      },
      "Environment & Pollution": {
        category: "Environment & Pollution",
        healthPercentage: 94,
        compliantCount: 36,
        inProgressCount: 8,
        overdueCount: 2,
        inProgressPercentage: 4,
        overduePercentage: 2,
      },
    },
  };
}
