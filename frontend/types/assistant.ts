import type { VerificationStatus } from "./status";

// ---------------------------------------------------------------------------
// Assistant / AI Copilot (apps/assistant)
// ---------------------------------------------------------------------------

export interface AssistantCitation {
  /** 1-based index the answer text cites as `[n]`. */
  index: number;
  evidence_id: string;
  authority: string;
  source_title: string;
  locator: string;
  excerpt: string;
  verification_status: VerificationStatus;
  canonical_url: string;
}

/**
 * How much weight an answer carries.
 *
 * - `GROUNDED_IN_CITED_EVIDENCE` — a model summarised the citations below.
 * - `NO_MATCHING_EVIDENCE` — nothing in the knowledge base matched; no answer.
 * - `CITATIONS_ONLY_NO_LLM_CONFIGURED` — citations found, no model configured.
 * - `CITATIONS_ONLY_LLM_UNAVAILABLE` — citations found, the model call failed.
 */
export type AssistantGroundingLevel =
  | "GROUNDED_IN_CITED_EVIDENCE"
  | "NO_MATCHING_EVIDENCE"
  | "CITATIONS_ONLY_NO_LLM_CONFIGURED"
  | "CITATIONS_ONLY_LLM_UNAVAILABLE";

export interface AssistantChatResponse {
  prompt: string;
  answer: string;
  citations: AssistantCitation[];
  citation_count: number;
  grounding_level: AssistantGroundingLevel;
  /** False when `answer` is a status message rather than a generated summary. */
  answer_generated: boolean;
  disclaimer: string;
  /** Present only when a model generated the prose. */
  generated_by?: { provider: string; model: string };
  provider_note?: string;
}

