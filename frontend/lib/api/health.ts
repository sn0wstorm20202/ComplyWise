/**
 * Health API module
 *
 * Authority: TRD_v2.0 §30, FRONTEND_INSTRUCTIONS.md §4
 */

import { request } from "./client";
import { HealthData, ReadinessData } from "@/types";

export const healthApi = {
  /** Check API liveness */
  get: () => request<HealthData>("/health"),

  /** Check full dependency readiness (database, pgvector, knowledge packs, integrations) */
  ready: () => request<ReadinessData>("/health/ready"),
};
