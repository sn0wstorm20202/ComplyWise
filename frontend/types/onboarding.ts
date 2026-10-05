import type { BusinessProfileVersion } from "./businesses";

// ---------------------------------------------------------------------------
// Onboarding Types (apps/onboarding/serializers.py)
// ---------------------------------------------------------------------------

export interface SmartQuestionChoice {
  value: string;
  label: string;
}

export interface SmartQuestion {
  /** Registry code, e.g. "V07". */
  code: string;
  /** Machine key; identical to `variable_key`. */
  key: string;
  variable_key: string;
  label: string;
  /** Ready-to-render prompt generated from the variable label. */
  question: string;
  question_text?: string;
  data_type: string;
  why_it_matters: string;
  reason?: string;
  expected_discovery_impact?: string;
  unit: string | null;
  options: SmartQuestionChoice[];
  current_value?: string | number | boolean | string[] | null;
  /** True when the variable is a CORE profile variable. */
  required: boolean;
  /** How many candidate published rules reference this variable. */
  rule_dependency_count: number;
  candidate_rules_count: number;
}

/** GET /businesses/{id}/onboarding/questions (apps/onboarding/services.py). */
export interface SmartQuestionsResponse {
  business_id: string;
  business_name: string;
  questions: SmartQuestion[];
  /** Number of decision-critical variables still unanswered. */
  total_missing: number;
  known_variables_count: number;
  /** Rule-referenced variables with no profile definition (knowledge drift). */
  unresolvable_variables: string[];
}

/** GET /businesses/{id}/onboarding/questions/next & POST /questions/next response. */
export interface SequentialQuestionResponse {
  is_complete: boolean;
  question?: SmartQuestion | null;
  next_question?: SmartQuestion | null;
  profile_version?: number;
  answered_variable?: string;
}

export interface SequentialAnswerPayload {
  variable_key: string;
  value: string | number | boolean | string[];
  answer_value?: string | number | boolean | string[];
  assessment_id?: string;
}

/** POST /businesses/{id}/onboarding/answers response body. */
export interface SmartQuestionAnswerResponse {
  message: string;
  profile_version: BusinessProfileVersion;
}

export interface SmartQuestionAnswerPayload {
  answers: Record<string, string | number | boolean | string[]>;
}

export interface ProductsActivitiesPayload {
  product_description: string;
  /**
   * Canonical value of the `import_export_intent` variable. Deliberately a plain
   * string rather than a literal union: the valid values are served by
   * GET /profile/variables, and duplicating them here would let the two drift.
   * Omit the field entirely when the user did not answer.
   */
  import_export_intent?: string;
}

export interface ProductsActivitiesResponse {
  profile_version: number;
  product_description: string;
  import_export_intent: string | null;
  /** Published-knowledge activity terms found in the description (may be empty). */
  detected_activities: string[];
}

/**
 * Onboarding progress as reported by GET /businesses/{id}/onboarding/status
 * (apps/onboarding/views.py). Field names are the backend's; do not rename.
 */
export interface OnboardingStatus {
  business_id: string;
  business_name: string;
  has_profile: boolean;
  profile_version: number | null;
  has_products: boolean;
  variables_count: number;
  has_evaluation: boolean;
  latest_run_id: string | null;
  current_step: number;
}

