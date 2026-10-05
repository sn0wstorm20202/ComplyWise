import type { AssessmentStatus, WorkspaceRequirementStatus } from "./status";

// ---------------------------------------------------------------------------
// Dashboard Types (apps/dashboard/services.py)
// ---------------------------------------------------------------------------

/**
 * Counts derived from the latest DecisionRun.
 *
 * Every count is nullable: before an evaluation exists the value is unknown, and
 * rendering 0 would assert "no requirements apply to you". Show "Not yet
 * calculated" for null. `benefits_count` is always null until scheme eligibility
 * is evaluated by a rule.
 */
export interface DashboardMetrics {
  applicable_count: number | null;
  action_required_count: number | null;
  due_soon_count: number | null;
  benefits_count: number | null;
  needs_information_count: number | null;
  conflict_review_count: number | null;
  unverified_count: number | null;
  not_applicable_count: number | null;
  total_evaluated: number;
}

export interface PriorityAction {
  requirement_id: string;
  requirement_name: string;
  authority: string;
  status: WorkspaceRequirementStatus;
  category: string;
  /** Derived from `status`, not a separate severity judgement. */
  action_type: string;
  evidence_count: number;
  source_url?: string;
  portal_url?: string;
  portal_name?: string;
}

/**
 * A renewal cycle stated by published knowledge. Only emitted for requirements
 * whose metadata records `renewal_period_years`; the platform does not infer
 * filing due dates it has no statutory basis for, and carries no penalty data.
 */
export interface StatutoryDeadline {
  requirement_id: string;
  title: string;
  due_date: string;
  days_remaining: number;
  type: "STATUTORY_RENEWAL_CYCLE";
  status: "UPCOMING";
  /** Human-readable citation of where the cycle length came from. */
  basis: string;
  anchored_on: string;
}

export interface DashboardSummary {
  widgets?: {
    activity: { weeklyTasks: number; growthPercentage: string; maxTasks: number; daily: Array<{day: string; tasks: number; isHighlight: boolean; dateStr: string}> };
    documents: { totalCount: number; onTrackCount: number; changeThisWeek: string; verifiedPercentage: number; underReviewPercentage: number };
    cases: Record<string, { category: string; healthPercentage: number; compliantCount: number; inProgressCount: number; overdueCount: number; inProgressPercentage: number; overduePercentage: number }>;
    recent_activity: Array<{id: string; event: string; case: string; recorded_at: string}>;
  };
  business_id: string;
  business_name: string;
  assessment_id?: string | null;
  assessment_number?: number;
  assessment_title?: string | null;
  assessment_status?: AssessmentStatus | null;
  has_evaluation: boolean;
  latest_run_id?: string;
  evaluation_date?: string;
  profile_version: number | null;
  /** Share of requirements the engine could determine. Null before evaluation. */
  compliance_readiness: number | null;
  /** Honest label for the readiness number, e.g. "Assessment completeness". */
  readiness_label?: string;
  /** Backend sentence explaining exactly what the readiness number measures. */
  readiness_basis?: string;
  metrics: DashboardMetrics;
  priority_actions: PriorityAction[];
  upcoming_deadlines: StatutoryDeadline[];
  /** Requirement count keyed by category, e.g. `{ LICENCE: 4, CONSENT: 2 }`. */
  category_breakdown: Record<string, number>;
  jurisdiction_breakdown: Record<string, number>;
  total_documents_needed?: number;
  total_workflows_count?: number;
  schemes_preview?: Array<{ id: string; name: string; title?: string; authority: string; benefit_type?: string; benefit?: string; benefit_summary?: string }>;
  standards_preview?: Array<{ standard_code?: string; title: string; authority: string; is_mandatory?: boolean }>;
  /** Always empty: no regulatory-change ingestion exists yet. */
  recent_updates: never[];
  recent_updates_available: boolean;
}

