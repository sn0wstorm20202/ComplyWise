/**
 * Dashboard Feature Module
 *
 * Authority: TRD_v2.0 §6, PRD_v2.0 §13
 * Read aggregation across readiness, actions, due soon, on track, and updates.
 *
 * The canonical dashboard shapes live in `@/types` (verified against the
 * backend by backend/tests/test_status_contract.py); this barrel keeps feature
 * imports pointed at that single contract instead of a parallel one.
 */

export type {
  DashboardMetrics,
  DashboardSummary,
  PriorityAction,
  StatutoryDeadline,
} from "@/types";
