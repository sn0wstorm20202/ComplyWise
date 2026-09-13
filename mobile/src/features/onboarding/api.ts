/**
 * Onboarding API Service
 * Authority: PRD_v2.0 §10, TRD_v2.0 §8, §30
 */

import { client } from '../../api/client';
import {
  EvaluateResponse,
  OnboardingStatus,
  SmartQuestionPlan,
} from '../../types/onboarding';

export const onboardingApi = {
  getQuestions: async (
    businessId: string,
    round = 1,
    assessmentId?: string
  ): Promise<SmartQuestionPlan> => {
    return client.get<SmartQuestionPlan>(
      `businesses/${businessId}/onboarding/questions`,
      {
        params: {
          round,
          ...(assessmentId ? { assessment_id: assessmentId } : {}),
        },
      }
    );
  },

  submitAnswers: async (
    businessId: string,
    answers: Record<string, unknown>,
    assessmentId?: string
  ): Promise<{
    message: string;
    has_more_questions: boolean;
    next_round?: SmartQuestionPlan;
  }> => {
    return client.post(
      `businesses/${businessId}/onboarding/answers`,
      {
        answers,
        ...(assessmentId ? { assessment_id: assessmentId } : {}),
      }
    );
  },

  submitProductsActivities: async (
    businessId: string,
    productDescription: string,
    importExportIntent?: string,
    assessmentId?: string
  ): Promise<unknown> => {
    return client.post(
      `businesses/${businessId}/onboarding/products-activities`,
      {
        product_description: productDescription,
        ...(importExportIntent ? { import_export_intent: importExportIntent } : {}),
        ...(assessmentId ? { assessment_id: assessmentId } : {}),
      }
    );
  },

  getStatus: async (
    businessId: string,
    assessmentId?: string
  ): Promise<OnboardingStatus> => {
    return client.get<OnboardingStatus>(
      `businesses/${businessId}/onboarding/status`,
      {
        params: assessmentId ? { assessment_id: assessmentId } : undefined,
      }
    );
  },

  evaluate: async (businessId: string): Promise<EvaluateResponse> => {
    return client.post<EvaluateResponse>(`businesses/${businessId}/evaluate`);
  },
};
