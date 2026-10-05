import type { ApplicabilityStatus, DecisionRunStatus } from "./status";

// ---------------------------------------------------------------------------
// Applicability & Decisions (apps/applicability/serializers.py)
// ---------------------------------------------------------------------------

export interface DecisionResult {
  id: string;
  requirement_id: string;
  requirement_name: string;
  status: ApplicabilityStatus;
  explanation_trace: Record<string, unknown>;
  evidence_refs: Array<Record<string, unknown>>;
  created_at: string;
}

export interface DecisionRun {
  id: string;
  business: string;
  profile_version: string;
  profile_version_number: number;
  status: DecisionRunStatus;
  evaluation_date: string;
  created_at: string;
  results: DecisionResult[];
}

