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
  channel: "GOOGLE_CALENDAR" | "EMAIL";
  status: "DELIVERED" | "SIMULATED" | "FAILED" | "PENDING";
  language: string;
  subject_or_title: string;
  recipient: string;
  created_at: string;
  details: Record<string, unknown>;
}

export interface DeadlineNotificationsResponse {
  count: number;
  notifications: DeadlineNotificationRecord[];
}

export const calendarApi = {
  list: (businessId: string, assessmentId?: string): Promise<CalendarListResponse> =>
    request<CalendarListResponse>(
      assessmentId
        ? `/businesses/${businessId}/calendar?assessment_id=${assessmentId}`
        : `/businesses/${businessId}/calendar`
    ),

  listNotifications: (businessId: string): Promise<DeadlineNotificationsResponse> =>
    request<DeadlineNotificationsResponse>(`/businesses/${businessId}/calendar/notifications`),
};
