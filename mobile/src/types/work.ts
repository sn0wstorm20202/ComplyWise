/**
 * Work boundary types (Documents, Workflows, Calendar)
 * Authority: PRD_v2.0 §18, §19, §20
 */

export interface BusinessDocument {
  requirement_id: string;
  requirement_name: string;
  authority: string;
  document_name: string;
  status: 'PENDING' | 'UPLOADED' | 'NOT_CONFIGURED';
  mandatory?: boolean;
}

export interface DocumentsResponse {
  business_id: string;
  documents: BusinessDocument[];
  prevalidation_disclaimer: string;
  total_required: number;
}

export interface WorkflowStageNode {
  id: string;
  number: number;
  name: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'BLOCKED';
  description: string;
  assignedTo: string;
  updatedAt?: string;
  estimatedCompletion?: string;
  actionCta?: string;
  checklist?: { label: string; done: boolean }[];
}

export interface StatutoryWorkflow {
  id: string;
  title: string;
  standardCode: string;
  authority: string;
  status: 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'SUBMITTED' | 'COMPLETED';
  currentStageIndex: number;
  totalStages: number;
  lastUpdated: string;
  dueDate: string;
  blocker?: string | null;
  stages: WorkflowStageNode[];
}

export interface WorkflowStep {
  step_number: number;
  title: string;
  description: string;
  is_completed: boolean;
  status?: string;
}

export interface BusinessWorkflow {
  id: string;
  requirement_id: string;
  title: string;
  authority: string;
  status: string;
  steps: WorkflowStep[];
  portal_url?: string;
}

export interface WorkflowsResponse {
  business_id: string;
  workflows: BusinessWorkflow[];
  note?: string;
}

export interface CalendarEvent {
  id: string;
  requirement_id: string;
  title: string;
  authority: string;
  event_type: 'RENEWAL' | 'FILING' | 'AUDIT' | 'DEADLINE';
  due_date: string;
  days_remaining: number;
  status: 'DUE_SOON' | 'UPCOMING' | 'OVERDUE';
}

export interface CalendarResponse {
  business_id: string;
  events: CalendarEvent[];
  note?: string;
}

export interface DocumentVerificationCheck {
  title?: string;
  name?: string;
  passed: boolean;
  status?: string;
  message?: string;
  details?: string;
  issues?: string[];
  warnings?: string[];
}

export interface DocumentVerificationResult {
  verified: boolean;
  overall_status: 'PASSED' | 'WARNING' | 'FAILED';
  status: 'VERIFIED' | 'NEEDS_REVIEW' | 'ISSUE';
  timestamp?: string;
  irrelevant_document_flag?: boolean;
  flag_message?: string;
  llm_scan_analysis?: {
    is_necessary?: boolean;
    necessity_verdict?: string;
    necessity_rationale?: string;
    is_correct?: boolean;
    correctness_verdict?: string;
    correctness_assessment?: string;
    compliance_verdict?: string;
    confidence_score?: number;
    llm_summary?: string;
    ai_engine?: string;
    ai_notice?: string;
  };
  checks?: {
    file_type?: DocumentVerificationCheck;
    field_completeness?: DocumentVerificationCheck;
    format_and_expiry?: DocumentVerificationCheck;
    ai_relevance?: DocumentVerificationCheck;
  };
  recommendations?: string[];
}

export interface DocumentItem {
  id: string;
  name: string;
  title?: string;
  category?: string;
  document_type?: string;
  authority: string;
  requirement_id?: string;
  requirement_name?: string;
  status: 'VERIFIED' | 'NEEDS_REVIEW' | 'ISSUE' | 'ACTION_NEEDED' | 'CRITICAL' | 'READY' | 'UPLOADED' | 'NOT_UPLOADED';
  prevalidation_status?: 'PASS' | 'NEEDS_REVIEW' | 'FAIL';
  file_name?: string;
  file_size_bytes?: number;
  file_type?: string;
  updated_at?: string;
  purpose?: string;
  portal_uploaded?: boolean;
  verification?: DocumentVerificationResult;
}

export interface ComplianceNotification {
  id: string;
  requirement_id: string;
  deadline_date: string;
  offset_days: number;
  channel: string;
  status: string;
  language?: string;
  subject_or_title: string;
  recipient: string;
  created_at: string;
  details?: string;
  is_read?: boolean;
}

export interface NotificationsResponse {
  count: number;
  notifications: ComplianceNotification[];
}

export interface NotificationsSummaryResponse {
  unread_count: number;
  urgent_count: number;
}

