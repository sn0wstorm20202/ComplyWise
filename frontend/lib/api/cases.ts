/**
 * Compliance Cases & Workflow API Client
 *
 * Authority: Architectural Specification §1-§40
 */

import { request } from "./client";
import type {
  AdminCasesSummary,
  ApplicationFormItem,
  BusinessCasesResponse,
  CaseRequirementDispositionItem,
  ComplianceCaseDetail,
  ComplianceCaseItem,
  DeadlineItem,
  DocumentRequirementItem,
  DocumentReviewItem,
  DocumentSubmissionItem,
  ExternalApplicationStatusItem,
  FormSubmissionItem,
  ReviewPacket,
  WorkflowEventItem,
} from "../../types";


export const casesApi = {
  /**
   * Get all compliance cases for a business.
   */
  async getCases(businessId: string, assessmentId?: string): Promise<BusinessCasesResponse> {
    const url = assessmentId
      ? `/businesses/${businessId}/cases?assessment_id=${encodeURIComponent(assessmentId)}`
      : `/businesses/${businessId}/cases`;
    return request<BusinessCasesResponse>(url);
  },

  /**
   * Manually trigger generation of compliance cases for APPLICABLE requirements.
   */
  async generateCases(
    businessId: string,
    assessmentId?: string
  ): Promise<{ message: string; total_cases: number; cases: ComplianceCaseItem[] }> {
    return request<{ message: string; total_cases: number; cases: ComplianceCaseItem[] }>(
      `/businesses/${businessId}/cases/generate`,
      {
        method: "POST",
        body: JSON.stringify({ assessment_id: assessmentId }),
      }
    );
  },

  /**
   * Get full details of a specific compliance case.
   */
  async getCase(caseId: string): Promise<ComplianceCaseDetail> {
    return request<ComplianceCaseDetail>(`/cases/${caseId}`);
  },

  /**
   * Trigger a workflow transition edge on a compliance case.
   */
  async triggerTransition(
    caseId: string,
    eventCode: string,
    payload?: Record<string, any>,
    notes?: string
  ): Promise<{ message: string; new_step: string; case: ComplianceCaseDetail; event: WorkflowEventItem }> {
    return request<{ message: string; new_step: string; case: ComplianceCaseDetail; event: WorkflowEventItem }>(
      `/cases/${caseId}/transition`,
      {
        method: "POST",
        body: JSON.stringify({ event_code: eventCode, payload, notes }),
      }
    );
  },

  /**
   * Get the chronological audit event timeline for a case.
   */
  async getTimeline(caseId: string): Promise<WorkflowEventItem[]> {
    return request<WorkflowEventItem[]>(`/cases/${caseId}/timeline`);
  },

  /**
   * Get application form template and existing submissions for a case.
   */
  async getForm(
    caseId: string
  ): Promise<{ form: ApplicationFormItem | null; submissions: FormSubmissionItem[]; latest_submission: FormSubmissionItem | null }> {
    return request<{ form: ApplicationFormItem | null; submissions: FormSubmissionItem[]; latest_submission: FormSubmissionItem | null }>(
      `/cases/${caseId}/form`
    );
  },

  /**
   * Submit statutory application form for a case.
   */
  async submitForm(
    caseId: string,
    formData: Record<string, any>
  ): Promise<{ message: string; submission: FormSubmissionItem; case: ComplianceCaseDetail }> {
    return request<{ message: string; submission: FormSubmissionItem; case: ComplianceCaseDetail }>(
      `/cases/${caseId}/form`,
      {
        method: "POST",
        body: JSON.stringify({ form_data: formData }),
      }
    );
  },

  /**
   * Record official government portal status for a case.
   */
  async recordExternalStatus(
    caseId: string,
    payload: {
      portal_name?: string;
      status_code: string;
      application_reference_number?: string;
      portal_remarks?: string;
    }
  ): Promise<{ message: string; status_record: ExternalApplicationStatusItem; case: ComplianceCaseDetail }> {
    return request<{ message: string; status_record: ExternalApplicationStatusItem; case: ComplianceCaseDetail }>(
      `/cases/${caseId}/external-status`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  /**
   * Upload a versioned document file with genuine OCR & AI precheck.
   */
  async uploadDocument(
    caseId: string,
    documentRequirementId: string,
    file: File,
    metadata?: Record<string, any>
  ): Promise<{
    message: string;
    submission: DocumentSubmissionItem;
    review: DocumentReviewItem;
    document_requirement: DocumentRequirementItem;
    case: ComplianceCaseDetail;
    verification: any;
  }> {
    const formData = new FormData();
    formData.append("file", file);
    if (metadata) {
      Object.entries(metadata).forEach(([k, v]) => {
        formData.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
      });
    }

    return request<{
      message: string;
      submission: DocumentSubmissionItem;
      review: DocumentReviewItem;
      document_requirement: DocumentRequirementItem;
      case: ComplianceCaseDetail;
      verification: any;
    }>(`/cases/${caseId}/documents/${documentRequirementId}/upload`, {
      method: "POST",
      body: formData,
    });
  },

  /**
   * Compliance Officer review of a document submission (APPROVE / QUERY / REJECT).
   */
  async reviewSubmission(
    submissionId: string,
    action: "APPROVE" | "QUERY" | "REJECT",
    comments?: string,
    findings?: any[]
  ): Promise<{
    message: string;
    review: DocumentReviewItem;
    submission: DocumentSubmissionItem;
    case: ComplianceCaseDetail;
  }> {
    return request<{
      message: string;
      review: DocumentReviewItem;
      submission: DocumentSubmissionItem;
      case: ComplianceCaseDetail;
    }>(`/documents/submissions/${submissionId}/review`, {
      method: "POST",
      body: JSON.stringify({
        action,
        comments,
        findings,
      }),
    });
  },

  /**
   * Admin workspace summary metrics across all cases.
   */
  async getAdminSummary(): Promise<AdminCasesSummary> {
    return request<AdminCasesSummary>("/admin/cases/summary");
  },

  /**
   * Admin compliance officer review queue.
   */
  async getAdminReviewQueue(params?: {
    status?: string;
    priority?: string;
  }): Promise<{ queue_count: number; cases: ComplianceCaseItem[] }> {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.priority) query.append("priority", params.priority);
    const qs = query.toString();
    return request<{ queue_count: number; cases: ComplianceCaseItem[] }>(
      qs ? `/admin/cases/review-queue?${qs}` : "/admin/cases/review-queue"
    );
  },

  /**
   * Full admin cases list with status, priority, and search filters.
   */
  async getAdminCases(params?: {
    status?: string;
    priority?: string;
    search?: string;
  }): Promise<{ total_count: number; cases: ComplianceCaseItem[] }> {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.priority) query.append("priority", params.priority);
    if (params?.search) query.append("search", params.search);
    const qs = query.toString();
    return request<{ total_count: number; cases: ComplianceCaseItem[] }>(
      qs ? `/admin/cases?${qs}` : "/admin/cases"
    );
  },

  /**
   * Admin assigns or escalates review task on a case.
   */
  async assignCase(
    caseId: string,
    assignedAdminId?: string,
    priority?: string,
    action: "ASSIGN" | "CLAIM" | "RELEASE" | "ESCALATE" = "ASSIGN"
  ): Promise<{ message: string; case: ComplianceCaseDetail }> {
    return request<{ message: string; case: ComplianceCaseDetail }>(
      `/admin/cases/${caseId}/assign`,
      {
        method: "POST",
        body: JSON.stringify({ assigned_admin_id: assignedAdminId, priority, action }),
      }
    );
  },

  /**
   * Compliance Officer approves case scrutiny.
   */
  async adminApprove(
    caseId: string,
    remarks?: string,
    submissionId?: string,
    expectedWorkflowVersion?: number
  ): Promise<{ message: string; case: ComplianceCaseDetail; review_id: string }> {
    return request<{ message: string; case: ComplianceCaseDetail; review_id: string }>(
      `/admin/cases/${caseId}/approve`,
      {
        method: "POST",
        body: JSON.stringify({
          remarks,
          submission_id: submissionId,
          expected_workflow_version: expectedWorkflowVersion,
        }),
      }
    );
  },

  /**
   * Compliance Officer raises query requiring user correction.
   */
  async adminQuery(
    caseId: string,
    reason: string,
    requiredAction: string,
    submissionId?: string,
    expectedWorkflowVersion?: number
  ): Promise<{ message: string; case: ComplianceCaseDetail; review_id: string }> {
    return request<{ message: string; case: ComplianceCaseDetail; review_id: string }>(
      `/admin/cases/${caseId}/query`,
      {
        method: "POST",
        body: JSON.stringify({
          reason,
          required_action: requiredAction,
          submission_id: submissionId,
          expected_workflow_version: expectedWorkflowVersion,
        }),
      }
    );
  },

  /**
   * Compliance Officer rejects application.
   */
  async adminReject(
    caseId: string,
    reason: string,
    submissionId?: string,
    expectedWorkflowVersion?: number
  ): Promise<{ message: string; case: ComplianceCaseDetail; review_id: string }> {
    return request<{ message: string; case: ComplianceCaseDetail; review_id: string }>(
      `/admin/cases/${caseId}/reject`,
      {
        method: "POST",
        body: JSON.stringify({
          reason,
          submission_id: submissionId,
          expected_workflow_version: expectedWorkflowVersion,
        }),
      }
    );
  },

  /**
   * User responds to a raised query.
   */
  async respondQuery(
    caseId: string,
    notes: string
  ): Promise<{ message: string; case: ComplianceCaseDetail }> {
    return request<{ message: string; case: ComplianceCaseDetail }>(
      `/cases/${caseId}/respond-query`,
      {
        method: "POST",
        body: JSON.stringify({ notes }),
      }
    );
  },

  /**
   * Unified 360-degree review packet for Compliance Officer Scrutiny Desk.
   */
  async getReviewPacket(caseId: string): Promise<ReviewPacket> {
    return request<ReviewPacket>(`/admin/cases/${caseId}/packet`);
  },

  /**
   * List statutory vs admin requirement dispositions for a case.
   */
  async getRequirements(caseId: string): Promise<{
    case_id: string;
    case_number: string;
    dispositions: CaseRequirementDispositionItem[];
    catalog_requirements: Array<{
      requirement_id: string;
      name: string;
      authority: string;
      category: string;
      risk_level?: string;
    }>;
  }> {
    return request(`/admin/cases/${caseId}/requirements`);
  },

  /**
   * Confirm requirement as REQUIRED.
   */
  async confirmRequirement(
    caseId: string,
    requirementCode: string,
    reason?: string
  ): Promise<{ message: string; disposition: CaseRequirementDispositionItem }> {
    return request(`/admin/cases/${caseId}/requirements/${encodeURIComponent(requirementCode)}/confirm`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Mark requirement as NOT_REQUIRED (requires mandatory rationale).
   */
  async markNotRequired(
    caseId: string,
    requirementCode: string,
    reason: string
  ): Promise<{ message: string; disposition: CaseRequirementDispositionItem }> {
    return request(`/admin/cases/${caseId}/requirements/${encodeURIComponent(requirementCode)}/not-required`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Admin attach additional requirement from catalog.
   */
  async addRequirement(
    caseId: string,
    requirementCode: string,
    reason?: string
  ): Promise<{ message: string; disposition: CaseRequirementDispositionItem }> {
    return request(`/admin/cases/${caseId}/requirements/add`, {
      method: "POST",
      body: JSON.stringify({ requirement_id_code: requirementCode, reason }),
    });
  },

  /**
   * Get all deadlines for a case (user view).
   */
  async getCaseDeadlines(caseId: string): Promise<{ count: number; deadlines: DeadlineItem[] }> {
    return request(`/cases/${caseId}/deadlines`);
  },

  /**
   * Get all deadlines for a case (admin view).
   */
  async getAdminCaseDeadlines(caseId: string): Promise<{ count: number; deadlines: DeadlineItem[] }> {
    return request(`/admin/cases/${caseId}/deadlines`);
  },

  /**
   * Create a deadline for a case.
   */
  async createDeadline(
    caseId: string,
    payload: {
      title: string;
      due_at: string;
      description?: string;
      priority?: string;
      notes?: string;
      reminder_policy?: Record<string, any>;
      email_notification_enabled?: boolean;
      calendar_notification_enabled?: boolean;
      in_app_notification_enabled?: boolean;
    }
  ): Promise<{ message: string; deadline: DeadlineItem }> {
    return request(`/admin/cases/${caseId}/deadlines`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update deadline details or extend due date.
   */
  async updateDeadline(
    deadlineId: string,
    payload: Partial<DeadlineItem>
  ): Promise<{ message: string; deadline: DeadlineItem }> {
    return request(`/admin/deadlines/${deadlineId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  /**
   * Cancel a deadline.
   */
  async cancelDeadline(
    deadlineId: string,
    reason?: string
  ): Promise<{ message: string; deadline: DeadlineItem }> {
    return request(`/admin/deadlines/${deadlineId}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Trigger immediate multi-channel alert dispatch for a deadline.
   */
  async sendDeadlineAlert(
    deadlineId: string,
    notes?: string
  ): Promise<{ message: string; result: any }> {
    return request(`/admin/deadlines/${deadlineId}/send-alert`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  },
};

export default casesApi;

