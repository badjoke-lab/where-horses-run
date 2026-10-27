/**
 * PORPROV XV 2026 / Berkuda Pacu: bounded event-window facts only.
 * A date range belongs to one sporting event; never expand it into race-meeting dates.
 * This module returns no meeting observations by design.
 */
export function visibleText(html) {
  return String(html ?? '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:nbsp|#160);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseBerkudaPacuEventWindow(html) {
  const text = visibleText(html);
  // Require the fixed 2026 sport-specific heading, its adjacent date range,
  // and the named physical racecourse in the same bounded page segment.
  const heading = /\bJadwal\s+Berkuda\s+Pacu\b/i.exec(text);
  const nearby = heading ? text.slice(heading.index, heading.index + 350) : '';
  const raceCategory = Boolean(heading);
  const dateRange = /\b0?7\s+Nov(?:ember)?\s+2026\s*[-–]\s*0?8\s+Nov(?:ember)?\s+2026\b/i.test(nearby);
  const venue = /\bVenue\s*:\s*Pacuan\s+Kuda\s+Legok\s*Jawa\b/i.test(nearby);
  const sourceScopeConfirmed = raceCategory && dateRange && venue;
  return {
    raceCategory,
    dateRange,
    venue,
    sourceScopeConfirmed,
    eventWindowDates: sourceScopeConfirmed ? ['2026-11-07', '2026-11-08'] : [],
    individualRaceDaysConfirmed: false,
    meetingRecords: [],
    publicationReady: false,
    publicationBlocker: 'event_range_is_not_day_specific_fixture',
  };
}
