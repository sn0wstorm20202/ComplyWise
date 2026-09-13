/**
 * Calendar API client
 *
 * Authority: TRD_v2.0 §30, PRD_v2.0 §20
 *
 * Only dates with a statutory basis are returned — currently renewal cycles read
 * from published requirement metadata. `not_covered` names the date classes that
 * are not ingested, so the screen can say what it does not know instead of
 * presenting itself as a complete statutory calendar.
 */

import { request } from "./client";
import { CalendarEvent } from "@/types";

export interface CalendarListResponse {
  business_id: string;
  events: CalendarEvent[];
  count: number;
  /** Date classes this response can contain. */
  covers: string[];
  /** Date classes with no knowledge source, e.g. `PENALTY_EXPOSURE`. */
  not_covered: string[];
  not_covered_reason: string;
}

export interface DeadlineNotificationRecord {
  id: string;
  requirement_id: string;
  deadline_date: string;
  offset_days: number;
  channel: "GOOGLE_CALENDAR" | "EMAIL" | "IN_APP";
  status: "DELIVERED" | "SIMULATED" | "FAILED" | "PENDING" | "RETRYING";
  event_type: "UPCOMING" | "OVERDUE" | "ESCALATION";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  language: string;
  subject_or_title: string;
  recipient: string;
  is_read: boolean;
  read_at: string | null;
  attempt_count: number;
  failure_reason: string;
  provider: string;
  created_at: string;
  details: Record<string, unknown>;
}

export interface DeadlineNotificationsResponse {
  count: number;
  notifications: DeadlineNotificationRecord[];
}

export interface NotificationSummaryResponse {
  total: number;
  unread_count: number;
  urgent_count: number;
  overdue_count: number;
  upcoming_count: number;
  by_priority: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  by_channel: {
    GOOGLE_CALENDAR: number;
    EMAIL: number;
    IN_APP: number;
  };
}

export interface NotificationPreferenceResponse {
  email_enabled: boolean;
  calendar_enabled: boolean;
  in_app_enabled: boolean;
  language: "en" | "hi" | "bn";
  message?: string;
}

export interface NotificationFilterParams {
  channel?: "GOOGLE_CALENDAR" | "EMAIL" | "IN_APP";
  status?: "DELIVERED" | "SIMULATED" | "FAILED" | "PENDING" | "RETRYING";
  is_read?: boolean;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  event_type?: "UPCOMING" | "OVERDUE" | "ESCALATION";
  limit?: number;
}

export interface NotificationSyncResponse {
  message: string;
  dispatched_count: number;
  skipped_idempotent_count: number;
  failed_count: number;
  results: Array<Record<string, unknown>>;
}

export const calendarApi = {
  list: (businessId: string, assessmentId?: string): Promise<CalendarListResponse> =>
    request<CalendarListResponse>(
      assessmentId
        ? `/businesses/${businessId}/calendar?assessment_id=${assessmentId}`
        : `/businesses/${businessId}/calendar`
    ),

  sync: (
    businessId: string,
    options?: { check_overdue?: boolean; include_in_app?: boolean; policy?: string }
  ): Promise<NotificationSyncResponse> =>
    request<NotificationSyncResponse>(
      `/businesses/${businessId}/calendar/sync`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options || { check_overdue: true, include_in_app: true }),
      }
    ),

  listNotifications: (
    businessId: string,
    filters?: NotificationFilterParams
  ): Promise<DeadlineNotificationsResponse> => {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (filters?.channel) params.channel = filters.channel;
    if (filters?.status) params.status = filters.status;
    if (filters?.is_read !== undefined) params.is_read = filters.is_read;
    if (filters?.priority) params.priority = filters.priority;
    if (filters?.event_type) params.event_type = filters.event_type;
    if (filters?.limit) params.limit = filters.limit;

    return request<DeadlineNotificationsResponse>(
      `/businesses/${businessId}/calendar/notifications`,
      { params }
    );
  },

  markRead: (
    businessId: string,
    notificationId: string
  ): Promise<{ id: string; is_read: boolean; read_at: string; message: string }> =>
    request<{ id: string; is_read: boolean; read_at: string; message: string }>(
      `/businesses/${businessId}/calendar/notifications/${notificationId}/read`,
      { method: "PATCH" }
    ),

  markAllRead: (
    businessId: string
  ): Promise<{ updated_count: number; read_at: string; message: string }> =>
    request<{ updated_count: number; read_at: string; message: string }>(
      `/businesses/${businessId}/calendar/notifications/read-all`,
      { method: "POST" }
    ),

  getSummary: (businessId: string): Promise<NotificationSummaryResponse> =>
    request<NotificationSummaryResponse>(
      `/businesses/${businessId}/calendar/notifications/summary`
    ),

  getPreferences: (businessId: string): Promise<NotificationPreferenceResponse> =>
    request<NotificationPreferenceResponse>(
      `/businesses/${businessId}/calendar/preferences`
    ),

  updatePreferences: (
    businessId: string,
    prefs: Partial<NotificationPreferenceResponse>
  ): Promise<NotificationPreferenceResponse> =>
    request<NotificationPreferenceResponse>(
      `/businesses/${businessId}/calendar/preferences`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      }
    ),
};
