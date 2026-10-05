// ---------------------------------------------------------------------------
// Calendar (apps/calendar)
// ---------------------------------------------------------------------------

/**
 * A date with a statutory basis. Currently only renewal cycles qualify: `basis`
 * cites where the cycle length came from. No penalty field — none is held.
 */
export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "STATUTORY_RENEWAL_CYCLE";
  authority: string;
  status: string;
  days_remaining: number;
  basis: string;
  anchored_on: string;
}

