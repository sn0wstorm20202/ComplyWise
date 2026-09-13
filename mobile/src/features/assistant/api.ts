/**
 * AI Assistant API Service
 * Authority: PRD_v2.0 §24, TRD_v2.0 §4
 */

import { client } from '../../api/client';
import { AssistantResponse } from '../../types/assistant';

export const assistantApi = {
  chat: async (
    prompt: string,
    businessId?: string,
    assessmentId?: string
  ): Promise<AssistantResponse> => {
    return client.post<AssistantResponse>('assistant/chat', {
      prompt,
      ...(businessId ? { business_id: businessId } : {}),
      ...(assessmentId ? { assessment_id: assessmentId } : {}),
    });
  },
};
