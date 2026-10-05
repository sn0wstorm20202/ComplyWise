import type { AssessmentStatus, VariableOrigin, VariableRelevance } from "./status";

// ---------------------------------------------------------------------------
// Business & Profile Models (apps/businesses/serializers.py)
// ---------------------------------------------------------------------------

export interface Business {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile_version: number | null;
  state?: string;
  district?: string;
  active_profile_version_number?: number;
  current_profile_version?: number;
  legal_structure?: string;
  business_type?: string;
  owner_id?: string;
  owner_email?: string;
  owner_name?: string;
  cases_count?: number;
  documents_count?: number;
  pending_reviews_count?: number;
}

export interface ProfileVariableValue {
  value: string | number | boolean | string[] | null;
  origin: VariableOrigin;
  confidence: number | null;
  derived_from: string[];
  recorded_at: string;
}

export interface BusinessProfileVersion {
  id: string;
  business: string;
  version: number;
  variables: Record<string, ProfileVariableValue>;
  change_note: string;
  created_at: string;
  created_by_email: string | null;
  missing_core_variables: string[];
}

export interface ProfileVariableChoice {
  value: string;
  label: string;
}

export interface ProfileVariableDefinition {
  code: string;
  key: string;
  label: string;
  data_type: string;
  why_it_matters: string;
  unit: string | null;
  default_relevance: VariableRelevance;
  options: ProfileVariableChoice[];
}

export interface BusinessProfileData {
  business_id: string;
  current_version: BusinessProfileVersion | null;
  variable_definitions: ProfileVariableDefinition[];
  missing_core_variables: string[];
}

export interface AssessmentSummary {
  id: string;
  business_id: string;
  business_name: string;
  assessment_number: number;
  title: string;
  status: AssessmentStatus;
  current_step: number;
  readiness_score?: number | null;
  requirements_count?: number;
  profile_version_id?: string | null;
  profile_version_number?: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  summary: {
    total_requirements_evaluated?: number;
    requirements_identified?: number;
    requirements_action_needed?: number;
    documents_count?: number;
    workflows_count?: number;
    schemes_count?: number;
    standards_count?: number;
    upcoming_deadlines?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface Assessment extends AssessmentSummary {
  created_by_email?: string | null;
  profile_version_id: string | null;
  profile_version_number: number | null;
  profile_variables?: Record<string, { value: unknown; origin?: string }>;
  decision_run_id: string | null;
  discovery_run_id: string | null;
  question_plan_id: string | null;
  step_state: Record<string, any>;
}

export interface BusinessSummary {
  id: string;
  name: string;
  is_active?: boolean;
  state?: string | null;
  state_name?: string | null;
  district?: string | null;
  industry?: string | null;
  msme_scale?: string | null;
  turnover?: string | null;
  latest_profile_version?: number | null;
  profile_version?: number | null;
  product_description?: string | null;
  assessment_count: number;
  latest_assessment?: AssessmentSummary | null;
  last_assessed_at?: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

export interface UserProfileHome {
  user: {
    id: string;
    email: string;
    full_name: string;
  };
  businesses: BusinessSummary[];
  recent_assessments: AssessmentSummary[];
  total_businesses: number;
  total_assessments: number;
}

