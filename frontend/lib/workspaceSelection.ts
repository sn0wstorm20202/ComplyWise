import type { UserProfileHome, AssessmentSummary } from "@/types";

export async function selectWorkspaceAssessment(
  businessId: string, workspace: UserProfileHome["workspace"], cachedAssessment: string | null,
  listAssessments: (businessId: string) => Promise<AssessmentSummary[]>,
): Promise<string | null> {
  // The server already authorized and validated this exact business/assessment pair.
  if (workspace?.active_business_id === businessId && workspace.active_assessment_id) {
    return workspace.active_assessment_id;
  }
  const assessments = await listAssessments(businessId);
  return assessments.find(assessment => assessment.id === cachedAssessment)?.id || assessments[0]?.id || null;
}
