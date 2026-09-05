/**
 * Calendar API client
 *
 * Authority: TRD_v2.0 §30, PRD_v2.0 §20
 */

import { request } from "./client";
import { CalendarEvent } from "@/types";

export interface CalendarListResponse {
  business_id: string;
  events: CalendarEvent[];
}

export const calendarApi = {
  list: (businessId: string): Promise<CalendarListResponse> =>
    request<CalendarListResponse>(`/businesses/${businessId}/calendar`),
};
