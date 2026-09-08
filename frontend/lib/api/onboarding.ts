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
  getQuestions: (businessId: string): Promise<SmartQuestionsResponse> =>
    request<SmartQuestionsResponse>(`/businesses/${businessId}/onboarding/questions`),

  submitAnswers: (
    businessId: string,
    payload: SmartQuestionAnswerPayload
  ): Promise<SmartQuestionAnswerResponse> =>
    request<SmartQuestionAnswerResponse>(`/businesses/${businessId}/onboarding/answers`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  saveProductsActivities: (
    businessId: string,
    payload: ProductsActivitiesPayload
  ): Promise<ProductsActivitiesResponse> =>
    request<ProductsActivitiesResponse>(
      `/businesses/${businessId}/onboarding/products-activities`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ),

  getStatus: (businessId: string): Promise<OnboardingStatus> =>
    request<OnboardingStatus>(`/businesses/${businessId}/onboarding/status`),
};
