/**
 * Dashboard Summary and Intelligence types
 * Authority: PRD_v2.0 §14, TRD_v2.0 §30
 */

export interface PriorityAction {
  requirement_id: string;
  requirement_name: string;
  authority: string;
  status: string;
  category: string;
  action_type: string;
  evidence_count: number;
}

export interface UpcomingDeadline {
  requirement_id: string;
  title: string;
  authority: string;
  due_date: string;
  days_remaining: number;
  event_type: string;
  action_url?: string;
}

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

export interface DashboardSummary {
  business_id: string;
  business_name: string;
  assessment_id?: string | null;
  assessment_number: number;
  assessment_title?: string | null;
  assessment_status?: string | null;
  has_evaluation: boolean;
  profile_version?: number | null;
  compliance_readiness: number | null;
  metrics: DashboardMetrics;
  priority_actions: PriorityAction[];
  upcoming_deadlines: UpcomingDeadline[];
  category_breakdown: Record<string, number>;
  jurisdiction_breakdown: Record<string, number>;
  recent_updates: unknown[];
  recent_updates_available: boolean;
  coverage: {
    status: string;
    details?: string;
  };
}
