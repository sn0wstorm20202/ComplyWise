/**
 * AI Assistant types
 * Authority: PRD_v2.0 §24, TRD_v2.0 §4
 */

export interface Citation {
  evidence_id: string;
  source_title: string;
  authority: string;
  locator: string;
  excerpt: string;
  verification_status: string;
  canonical_url?: string;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
  isLoading?: boolean;
}

export interface AssistantResponse {
  answer: string;
  citations: Citation[];
  model_used?: string;
  retrieval_query?: string;
}
