import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const ESTONIA_TIMEZONE = 'Europe/Tallinn';
export const ESTONIA_AUTHORITY_ID = 'estonian-trotting-union';
export const ESTONIA_SYSTEM_ID = 'tuula-trotting-system';
export const ESTONIA_SOURCE_ID = 'hipodroom-2026-calendar-context';
export const ESTONIA_RACECOURSE_ID = 'estonia--tuula-hipodroom';
export const ESTONIA_CALENDAR_URL = 'https://hipodroom.ee/2026-aasta-urituste-kalender/';

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

export function visibleText(html) {
  return decodeHtml(String(html ?? ''))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function looksLikeRacingContext(context) {
  const normalized = context.toLowerCase();
  if (/traavivõistluseid\s+ei\s+toimu/.test(normalized)) return false;
  return /traavivõist|avavõist|derby|kriteerium|baby\s+race|hipodroomi\s+.*perepäev/.test(normalized);
}

export function parseEstoniaAnnualCalendar(html, { sourceUrl = ESTONIA_CALENDAR_URL } = {}) {
  if (typeof html !== 'string' || !html.trim()) throw new Error('Estonia Hipodroom calendar HTML must be non-empty');
  const text = visibleText(html);
  if (!/2026\.\s*aasta\s+ürituste\s+kalender/i.test(text)) throw new Error('Estonia 2026 calendar fingerprint missing');

  const rows = [];
  const regex = /(\d{1,2})\.(\d{1,2})\.(20\d{2})/g;
  for (const match of text.matchAll(regex)) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);
    if (!Number.isInteger(day) || day < 1 || day > 31 || !Number.isInteger(month) || month < 1 || month > 12) continue;
    const index = match.index ?? 0;
    const context = text.slice(Math.max(0, index - 180), Math.min(text.length, index + 60));
    if (!looksLikeRacingContext(context)) continue;
    rows.push({
      date: String(year) + '-' + pad(month) + '-' + pad(day),
      racecourse_id: ESTONIA_RACECOURSE_ID,
      venue_name: 'Tuula Hipodroom',
      source_url: sourceUrl,
      source_context: context,
    });
  }
  return [...new Map(rows.map((row) => [row.date + '|' + row.racecourse_id, row])).values()]
    .sort((a, b) => a.date.localeCompare(b.date));
}

function evidence(url, checkedAt) {
  return {
    source_id: ESTONIA_SOURCE_ID,
    official_source_url: url,
    observed_at: checkedAt,
    successfully_verified_at: checkedAt,
    acquisition_method: 'automatic',
  };
}

export function buildEstoniaMeetingRecord(row, { checkedAt } = {}) {
  const meetingId = 'estonia-tuula-' + row.date;
  const sourceEvidence = evidence(row.source_url, checkedAt);
  const record = {
    candidate_id: meetingId,
    meeting_id: meetingId,
    country_id: 'estonia',
    authority_id: ESTONIA_AUTHORITY_ID,
    racing_system_id: ESTONIA_SYSTEM_ID,
    racecourse_id: ESTONIA_RACECOURSE_ID,
    date: row.date,
    timezone: ESTONIA_TIMEZONE,
    first_race_time_local: null,
    last_race_time_local: null,
    timetable_rows: [],
    source: {
      source_id: ESTONIA_SOURCE_ID,
      official_url: row.source_url,
      checked_at: checkedAt,
      extraction_method: 'official_annual_event_calendar_html',
    },
    route_id: 'hipodroom-2026-event-calendar-html',
    confidence: 'high',
    review_status: 'needs_review',
    notes: 'Official Hipodroom 2026 event calendar observation for Tuula. The route publishes meeting date and physical racecourse only at rank C. Explicit non-racing calendar entries are excluded.',
    detail_observation: {
      status: 'not_applicable',
      evaluated_capability_rank: 'C',
      race_count: 0,
      calendar_url: row.source_url,
    },
    acquisition_attempt: {
      attempted_at: checkedAt,
      status: 'success',
      source_id: ESTONIA_SOURCE_ID,
      route_id: 'hipodroom-2026-event-calendar-html',
      error_code: null,
    },
    evidence_support: {
      meeting_identity: sourceEvidence,
      meeting_date: sourceEvidence,
    },
  };
  const capability_rank = deriveBestAvailableRank(record, []);
  record.acquisition_completion = classifyAcquisitionCompletion(
    { ...record, capability_rank },
    { technical_capability_rank: 'C' },
  );
  return { ...record, capability_rank };
}
