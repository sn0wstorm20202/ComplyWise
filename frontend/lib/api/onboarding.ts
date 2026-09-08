/**
 * Onboarding API client
 *
 * Authority: TRD_v2.0 §30, PRD_v2.0 §10–14
 */

import { request } from "./client";
import {
  SmartQuestionsResponse,
  SmartQuestionAnswerPayload,
  SmartQuestionAnswerResponse,
  ProductsActivitiesPayload,
  ProductsActivitiesResponse,
  OnboardingStatus,
} from "@/types";

export const onboardingApi = {
  getQuestions: (businessId: string, assessmentId?: string): Promise<SmartQuestionsResponse> => {
    const url = assessmentId
      ? `/businesses/${businessId}/onboarding/questions?assessment_id=${assessmentId}`
      : `/businesses/${businessId}/onboarding/questions`;
    return request<SmartQuestionsResponse>(url);
  },

  submitAnswers: (
    businessId: string,
    payload: SmartQuestionAnswerPayload & { assessment_id?: string }
  ): Promise<SmartQuestionAnswerResponse> =>
    request<SmartQuestionAnswerResponse>(`/businesses/${businessId}/onboarding/answers`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  saveProductsActivities: (
    businessId: string,
    payload: ProductsActivitiesPayload & { assessment_id?: string }
  ): Promise<ProductsActivitiesResponse> =>
    request<ProductsActivitiesResponse>(
      `/businesses/${businessId}/onboarding/products-activities`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ),

  getStatus: (businessId: string, assessmentId?: string): Promise<OnboardingStatus> => {
    const url = assessmentId
      ? `/businesses/${businessId}/onboarding/status?assessment_id=${assessmentId}`
      : `/businesses/${businessId}/onboarding/status`;
    return request<OnboardingStatus>(url);
  },
};
