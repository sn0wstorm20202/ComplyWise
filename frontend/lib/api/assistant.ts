/**
 * AI Assistant API client
 *
 * Authority: TRD_v2.0 §30, PRD_v2.0 §24
 */

import { request } from "./client";
import { AssistantChatResponse } from "@/types";

export const assistantApi = {
  chat: (
    prompt: string,
    businessId?: string | null,
    assessmentId?: string | null,
    language?: string
  ): Promise<AssistantChatResponse> =>
    request<AssistantChatResponse>("/assistant/chat", {
      method: "POST",
      body: JSON.stringify({
        prompt,
        ...(businessId ? { business_id: businessId } : {}),
        ...(assessmentId ? { assessment_id: assessmentId } : {}),
        ...(language ? { language } : {}),
      }),
    }),
};
