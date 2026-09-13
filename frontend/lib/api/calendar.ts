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

export const calendarApi = {
  list: (businessId: string, assessmentId?: string): Promise<CalendarListResponse> =>
    request<CalendarListResponse>(
      assessmentId
        ? `/businesses/${businessId}/calendar?assessment_id=${assessmentId}`
        : `/businesses/${businessId}/calendar`
    ),
};
