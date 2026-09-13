/**
 * Onboarding and Smart Questions types
 * Authority: PRD_v2.0 §10, TRD_v2.0 §8
 */

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface SmartQuestion {
  code: string;
  key: string;
  label: string;
  question_text?: string;
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
    | 'ENUM'
    | 'MULTI_SELECT';
  why_it_matters: string;
  options?: QuestionOption[];
  unit?: string | null;
  current_value?: unknown;
  help_text?: string;
  placeholder?: string;
}

export interface SmartQuestionPlan {
  round: number;
  status: 'ACTIVE' | 'COMPLETED' | 'EMPTY';
  questions: SmartQuestion[];
  message?: string;
}

export interface OnboardingStatus {
  business_id: string;
  business_name: string;
  assessment_id?: string | null;
  assessment_number?: number | null;
  has_profile: boolean;
  profile_version?: number | null;
  has_products: boolean;
  variables_count: number;
  has_evaluation: boolean;
  latest_run_id?: string | null;
  current_step: number;
  step_state?: Record<string, unknown>;
}

export interface EvaluateResponse {
  decision_run_id: string;
  evaluation_date: string;
  total_rules_evaluated: number;
  applicable_count: number;
  action_required_count?: number;
  status: string;
}
