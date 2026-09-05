/**
 * Onboarding Feature Module
 *
 * Authority: TRD_v2.0 §6, PRD_v2.0 §10
 * Screen flow: Welcome -> Business Profile -> Products & Activities -> Smart Questions -> Analysis -> Results
 */

export const ONBOARDING_STEPS = [
  { id: "welcome", title: "Welcome" },
  { id: "profile", title: "Business Profile" },
  { id: "products", title: "Products & Activities" },
  { id: "questions", title: "Smart Questions" },
  { id: "analysis", title: "Regulatory Analysis" },
  { id: "results", title: "Initial Results" },
] as const;
