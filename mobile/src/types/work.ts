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
