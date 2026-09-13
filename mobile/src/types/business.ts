/**
 * Business and Assessment types
 * Authority: TRD_v2.0 §31, §32
 */

export interface Business {
  id: string;
  name: string;
  is_active: boolean;
  profile_version?: number | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessSummary extends Business {
  state?: string | null;
  district?: string | null;
  industry?: string | null;
  product_description?: string | null;
  assessment_count: number;
  latest_assessment?: AssessmentSummary | null;
  last_assessed_at?: string | null;
}

export interface AssessmentSummary {
  id: string;
  business_id: string;
  business_name: string;
  assessment_number: number;
  title: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED';
  current_step: number;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  profile_version_id?: string | null;
  profile_version_number?: number | null;
  decision_run_id?: string | null;
  discovery_run_id?: string | null;
  question_plan_id?: string | null;
  step_state?: Record<string, unknown>;
  summary?: Record<string, unknown>;
}

export interface VariableOption {
  value: string;
  label: string;
}

export interface VariableDefinition {
  code: string;
  key: string;
  label: string;
  data_type:
    | 'STRING'
    | 'TEXT'
    | 'LONG_TEXT'
    | 'INTEGER'
    | 'DECIMAL'
    | 'CURRENCY_INR'
    | 'BOOLEAN'
    | 'SINGLE_CHOICE'
    | 'MULTI_CHOICE'
    | 'DATE'
    | 'JURISDICTION'
    | 'ENUM';
  why_it_matters: string;
  unit?: string | null;
  default_relevance: string;
  options?: VariableOption[];
}

export interface VariableValueEntry {
  value: unknown;
  origin?: 'USER_PROVIDED' | 'DERIVED' | 'ASSUMED';
  confidence?: number | null;
  derived_from?: string[];
}

export interface BusinessProfileData {
  business_id: string;
  current_version?: {
    id: string;
    version: number;
    variables: Record<string, VariableValueEntry>;
    created_at: string;
    change_note?: string;
  } | null;
  variable_definitions: VariableDefinition[];
  missing_core_variables: string[];
}
