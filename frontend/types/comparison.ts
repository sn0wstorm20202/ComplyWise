export interface EvidenceSummary {
  status: string; recorded_passages: number; reviewed_passages: number; missing_references: number;
  completion_status: string;
  sources: Array<{ evidence_id: string; title?: string | null; url?: string | null;
    verification_status?: string; publication_date?: string | null;
    effective_date?: string | null; retrieved_at?: string | null }>;
}
export interface RunCard {
  run_id: string; assessment_id: string | null; title: string; profile_version: number;
  evaluated_at: string; evaluation_date: string; mode: string; content_hash: string | null;
  knowledge_fingerprint: string | null;
  coverage: { message: string; status: string; is_exhaustive: boolean };
}
export interface DecisionSide {
  title: string; status: string; explanation: string; reason: string | null;
  facts_used: Record<string, unknown>;
  rule_evaluations: Array<{ rule_id: string; version: number; truth_value: string; trace: Record<string, unknown> }>;
  evidence: EvidenceSummary;
}
export type HistoryRunCard = Omit<RunCard, "coverage">;
export interface AssessmentComparison {
  business_id: string; business_name: string; before: RunCard; after: RunCard;
  fact_changes: Array<{key: string; label: string; before: {value?: unknown; origin?: string}; after: {value?: unknown; origin?: string}}>;
  requirements: Array<{requirement_id: string; title: string; before: DecisionSide | null; after: DecisionSide | null;
    status_changed: boolean; changed_facts_used: string[]; needs_attention: boolean}>;
  interpretation: string; same_evaluation_context: boolean; status_changes: number; uncertain_rows: number;
}
export interface AssessmentProvenance {
  coverage: RunCard["coverage"]; evaluation_date: string; mode: string;
  requirements_without_passages: number; requirements_needing_review: number; source_dates_missing: number;
  sources: EvidenceSummary["sources"]; rows: Record<string, EvidenceSummary>; completion_status: string;
}
