import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const SWEDEN_TIMEZONE = 'Europe/Stockholm';
export const SWEDEN_AUTHORITY_ID = 'svensk-galopp';
export const SWEDEN_SYSTEM_ID = 'sweden-svensk-galopp-system';
export const SWEDEN_SOURCE_ID = 'svensk-galopp-calendar';
export const SWEDEN_CALENDAR_URL = 'https://www.svenskgalopp.se/kalendarium/';
export const SWEDEN_CALENDAR_PDF_URL = 'https://www.svenskgalopp.se/documents/3491/T%C3%A4vlingskalender_2026.pdf';

const MONTHS = Object.freeze({
  APRIL: 4,
  MAJ: 5,
  JUNI: 6,
  JULI: 7,
  AUGUSTI: 8,
  SEPTEMBER: 9,
  OKTOBER: 10,
  NOVEMBER: 11,
  DECEMBER: 12,
});

const VENUES = Object.freeze({
  'Bro Park': 'bro-park-racecourse',
  'Jägersro': 'jagersro-galopp-racecourse',
  'Göteborg': 'goteborg-galopp-racecourse',
  'Gärdet': 'gardet-racecourse',
  'Strömsholm': 'stromsholm-racecourse',
});

function pad(value) {
  return String(value).padStart(2, '0');
}

export function resolveSwedenRacecourseId(label) {
  const id = VENUES[String(label ?? '').trim()];
  if (!id) throw new Error(`Unknown Svensk Galopp venue: ${label}`);
  return id;
}

export function parseSwedenCalendarText(text, { year = 2026, sourceUrl = SWEDEN_CALENDAR_PDF_URL } = {}) {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Sweden calendar text must be non-empty');
  }
  if (!/Tävlingsdagar\s+2026/i.test(text)) {
    throw new Error('Svensk Galopp 2026 calendar fingerprint missing');
  }

  let month = null;
  const rows = [];
  const parse_failures = [];
  const lines = text.split(/\r?\n/).map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean);

  for (const line of lines) {
    if (MONTHS[line]) {
      month = MONTHS[line];
      continue;
    }
    if (!month) continue;

    const match = line.match(/^(\d{1,2})\s+\p{L}+\s+(TBA|\d{1,2}[.:]\d{2})\s+(Bro Park|Jägersro|Göteborg|Gärdet|Strömsholm)\s+(.+)$/u);
    if (!match) {
      if (/^\d{1,2}\s+\p{L}+\s+/u.test(line)) {
        parse_failures.push({ code: 'calendar_row_unparsed', source_text: line });
      }
      continue;
    }

    const day = Number(match[1]);
    const venue_label = match[3];
    rows.push({
      date: `${year}-${pad(month)}-${pad(day)}`,
      venue_label,
      racecourse_id: resolveSwedenRacecourseId(venue_label),
      published_event_time_local: match[2] === 'TBA' ? null : match[2].replace('.', ':'),
      event_label: match[4].trim(),
      source_url: sourceUrl,
    });
  }

  const deduped = new Map();
  for (const row of rows) deduped.set(`${row.date}/${row.racecourse_id}`, row);

  return {
    records: [...deduped.values()].sort((a, b) => a.date.localeCompare(b.date) || a.racecourse_id.localeCompare(b.racecourse_id)),
    parse_failures,
  };
}

function evidence(url, checkedAt) {
  return {
    source_id: SWEDEN_SOURCE_ID,
    official_source_url: url,
    observed_at: checkedAt,
    successfully_verified_at: checkedAt,
    acquisition_method: 'automatic',
  };
}

export function buildSwedenMeetingRecord(row, { checkedAt } = {}) {
  const meetingId = `sweden-${row.racecourse_id}-${row.date}`;
  const e = evidence(row.source_url ?? SWEDEN_CALENDAR_PDF_URL, checkedAt);
  const record = {
    candidate_id: meetingId,
    meeting_id: meetingId,
    country_id: 'sweden',
    authority_id: SWEDEN_AUTHORITY_ID,
    racing_system_id: SWEDEN_SYSTEM_ID,
    racecourse_id: row.racecourse_id,
    date: row.date,
    timezone: SWEDEN_TIMEZONE,
    first_race_time_local: null,
    last_race_time_local: null,
    timetable_rows: [],
    source: {
      source_id: SWEDEN_SOURCE_ID,
      official_url: row.source_url ?? SWEDEN_CALENDAR_PDF_URL,
      checked_at: checkedAt,
      extraction_method: 'official_svensk_galopp_2026_calendar_pdf',
    },
    route_id: 'svensk-galopp-2026-calendar-pdf',
    confidence: 'high',
    review_status: 'needs_review',
    notes: `Official Svensk Galopp 2026 race-day calendar observation; source venue label: ${row.venue_label}; event: ${row.event_label}. Calendar event time ${row.published_event_time_local ?? 'TBA'} is retained only as source context and is not promoted to first-race time without an explicit Första starttid source.`,
    detail_observation: {
      status: 'not_applicable',
      evaluated_capability_rank: 'C',
      race_count: 0,
      calendar_url: SWEDEN_CALENDAR_URL,
      published_event_time_local: row.published_event_time_local,
    },
    acquisition_attempt: {
      attempted_at: checkedAt,
      status: 'success',
      source_id: SWEDEN_SOURCE_ID,
      route_id: 'svensk-galopp-2026-calendar-pdf',
      error_code: null,
    },
    evidence_support: {
      meeting_identity: e,
      meeting_date: e,
    },
  };

  const capability_rank = deriveBestAvailableRank(record, []);
  record.acquisition_completion = classifyAcquisitionCompletion(
    { ...record, capability_rank },
    { technical_capability_rank: 'C' },
  );
  return { ...record, capability_rank };
}
