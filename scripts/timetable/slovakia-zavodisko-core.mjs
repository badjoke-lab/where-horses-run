import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const SLOVAKIA_TIMEZONE = 'Europe/Bratislava';
export const SLOVAKIA_AUTHORITY_ID = 'zavodisko';
export const SLOVAKIA_SYSTEM_ID = 'slovakia-zavodisko-system';
export const SLOVAKIA_SOURCE_ID = 'zavodisko-2026-calendar';
export const SLOVAKIA_CALENDAR_URL = 'https://zavodisko.sk/terminy-dostihov-2026/';

const VENUE_ALIASES = Object.freeze({
  bratislava: 'bratislava-racecourse',
  surany: 'surany-racecourse',
  topolcianky: 'topolcianky-racecourse',
  senica: 'senica-racecourse',
});

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&aacute;/gi, 'á')
    .replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú')
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

function normalized(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  return normalized(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-+/g, '-');
}

function pad(value) {
  return String(value).padStart(2, '0');
}

export function resolveSlovakiaRacecourseId(label) {
  const slug = slugify(label);
  return VENUE_ALIASES[slug] ?? `${slug}-racecourse`;
}

export function parseSlovakiaCalendarPage(html, { sourceUrl = SLOVAKIA_CALENDAR_URL } = {}) {
  if (typeof html !== 'string' || !html.trim()) {
    throw new Error('Slovakia calendar HTML must be non-empty');
  }
  const text = visibleText(html);
  if (!/Term[ií]ny dostihov 2026/i.test(text)) {
    throw new Error('Slovakia 2026 calendar fingerprint missing');
  }

  const weekday = '(?:pondelok|utorok|streda|štvrtok|piatok|sobota|nedeľa)';
  const regex = new RegExp(
    '(\\d{1,2})\\.\\s*dostihov(?:ý|y)\\s*deň\\s+' +
    '(.+?)\\s+' +
    '(?:NOVÝ\\s+TERMÍN\\s*-\\s*)?' +
    weekday +
    '\\s+(\\d{1,2})\\.(\\d{1,2})\\.(20\\d{2})\\s+' +
    'Miesto:\\s*(.+?)\\s+Čas:\\s*(\\d{1,2}):(\\d{2})',
    'giu',
  );

  const records = [];
  for (const match of text.matchAll(regex)) {
    const date = `${match[5]}-${pad(match[4])}-${pad(match[3])}`;
    const venueLabel = match[6].trim();
    records.push({
      meeting_number: Number(match[1]),
      meeting_title: match[2].trim(),
      date,
      venue_label: venueLabel,
      racecourse_id: resolveSlovakiaRacecourseId(venueLabel),
      first_race_time_local: `${pad(match[7])}:${match[8]}`,
      source_url: sourceUrl,
    });
  }

  const deduped = new Map();
  for (const row of records) {
    deduped.set(`${row.date}/${row.racecourse_id}`, row);
  }
  return [...deduped.values()].sort((a, b) => (
    a.date.localeCompare(b.date) || a.racecourse_id.localeCompare(b.racecourse_id)
  ));
}

function evidence(url, checkedAt) {
  return {
    source_id: SLOVAKIA_SOURCE_ID,
    official_source_url: url,
    observed_at: checkedAt,
    successfully_verified_at: checkedAt,
    acquisition_method: 'automatic',
  };
}

export function buildSlovakiaMeetingRecord(row, { checkedAt } = {}) {
  const meetingId = `slovakia-${row.racecourse_id}-${row.date}`;
  const e = evidence(row.source_url ?? SLOVAKIA_CALENDAR_URL, checkedAt);
  const record = {
    candidate_id: meetingId,
    meeting_id: meetingId,
    country_id: 'slovakia',
    authority_id: SLOVAKIA_AUTHORITY_ID,
    racing_system_id: SLOVAKIA_SYSTEM_ID,
    racecourse_id: row.racecourse_id,
    date: row.date,
    timezone: SLOVAKIA_TIMEZONE,
    first_race_time_local: row.first_race_time_local,
    last_race_time_local: null,
    timetable_rows: [],
    source: {
      source_id: SLOVAKIA_SOURCE_ID,
      official_url: row.source_url ?? SLOVAKIA_CALENDAR_URL,
      checked_at: checkedAt,
      extraction_method: 'official_zavodisko_2026_calendar_html',
    },
    route_id: 'zavodisko-2026-calendar-html',
    confidence: 'high',
    review_status: 'needs_review',
    notes: `Official Závodisko calendar observation; meeting ${row.meeting_number}; source venue label: ${row.venue_label}. First-race time is official; final-race/per-race times are not inferred.`,
    detail_observation: {
      status: 'available',
      evaluated_capability_rank: 'B',
      race_count: 0,
      calendar_url: row.source_url ?? SLOVAKIA_CALENDAR_URL,
    },
    acquisition_attempt: {
      attempted_at: checkedAt,
      status: 'success',
      source_id: SLOVAKIA_SOURCE_ID,
      route_id: 'zavodisko-2026-calendar-html',
      error_code: null,
    },
    evidence_support: {
      meeting_identity: e,
      meeting_date: e,
      race_times: e,
    },
  };

  const capability_rank = deriveBestAvailableRank(record, []);
  record.acquisition_completion = classifyAcquisitionCompletion(
    { ...record, capability_rank },
    { technical_capability_rank: 'B+' },
  );
  return { ...record, capability_rank };
}
