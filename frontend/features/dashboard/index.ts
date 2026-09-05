/**
 * Dashboard Feature Module
 *
 * Authority: TRD_v2.0 §6, PRD_v2.0 §13
 * Read aggregation across readiness, actions, due soon, on track, and updates.
 */

export interface DashboardMetrics {
  complianceReadinessPercent: number;
  actionRequiredCount: number;
  dueSoonCount: number;
  onTrackCount: number;
  benefitsIdentified: number;
}
