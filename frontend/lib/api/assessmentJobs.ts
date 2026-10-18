import { ApiError, request } from "./client";

export type JobStage = "BUSINESS_UNDERSTANDING" | "REGULATORY_DISCOVERY" | "COMPLIANCE_SYNTHESIS";
interface AssessmentJob<T> {
  job_id: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
  retry_after_seconds: number;
  result: T | null;
  error: { code: string; message: string } | null;
}

/** The same input resumes the persisted operation after a page reload or lost response. */
export async function runAssessmentJob<T>(runId: string, stage: JobStage,
  legacy: () => Promise<T>, options?: { force_refresh?: boolean }): Promise<T> {
  let job: AssessmentJob<T>;
  try {
    job = await request<AssessmentJob<T>>(`assessments/${runId}/jobs/`, {
      method: "POST",
      headers: options?.force_refresh ? { "Idempotency-Key": crypto.randomUUID() } : undefined,
      body: JSON.stringify({ stage, force_refresh: options?.force_refresh ?? false }),
    });
  } catch (error) {
    // Only an explicit deployment capability response permits the old path.
    // A network failure must never start a second, synchronous operation.
    if (error instanceof ApiError && error.code === "ASYNC_DISABLED") return legacy();
    throw error;
  }
  const deadline = Date.now() + 15 * 60_000;
  while (job.status === "QUEUED" || job.status === "RUNNING") {
    if (Date.now() >= deadline) {
      throw new ApiError("OPERATION_PENDING", "Your assessment is still processing. Return to this assessment to check again.", 202);
    }
    await new Promise(resolve => setTimeout(resolve, Math.max(1, Math.min(10, job.retry_after_seconds || 2)) * 1000));
    job = await request<AssessmentJob<T>>(`assessments/${runId}/jobs/${job.job_id}/`);
  }
  if (job.status === "FAILED") {
    throw new ApiError(job.error?.code || "STAGE_FAILED", job.error?.message || "Assessment processing failed.", 503);
  }
  if (job.status !== "SUCCEEDED" || job.result === null) {
    throw new ApiError("INVALID_JOB_RESULT", "The assessment returned an incomplete result.", 502);
  }
  return job.result;
}
