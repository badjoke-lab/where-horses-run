import { deriveBestAvailableRank } from './best-available-rank.mjs';

export const CHILE_TELETRAK_URL = 'https://teletrak.cl/';
export const CHILE_TELETRAK_SOURCE_ID = 'chile-teletrak-weekly-programme';
export const CHILE_TELETRAK_ADAPTER_ID = 'chile-teletrak-weekly-best-available-v1';
export const CHILE_TELETRAK_DETAIL_ADAPTER_ID = 'chile-teletrak-linked-programme-best-available-v1';
export const CHILE_TELETRAK_SYSTEM_ID = 'chile-teletrak-racing-system';
export const CHILE_TELETRAK_AUTHORITY_ID = 'teletrak-chile';
export const CHILE_TIMEZONE = 'America/Santiago';

const WEEKDAY_INDEX = Object.freeze({ DOM: 0, LUN: 1, MAR: 2, MIE: 3, JUE: 4, VIE: 5, SAB: 6 });
const DAY_TOKEN = /\b(LUN|MAR|MIE|JUE|VIE|SAB|DOM)\s+([0-3]?\d)\b/g;

const VENUES = Object.freeze([
  { canonical_label: 'Club Hípico de Concepción', normalized_label: 'club hipico de concepcion', racecourse_id: 'club-hipico-de-concepcion-racecourse' },
  { canonical_label: 'Club Hípico de Santiago', normalized_label: 'club hipico de santiago', racecourse_id: 'club-hipico-de-santiago-racecourse' },
  { canonical_label: 'Hipódromo Chile', normalized_label: 'hipodromo chile', racecourse_id: 'hipodromo-chile' },
  { canonical_label: 'Valparaíso Sporting Club', normalized_label: 'valparaiso sporting club', racecourse_id: 'valparaiso-sporting-club-racecourse' },
]);

function decodeEntities(value) {
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
    .replace(/&ntilde;/gi, 'ñ')
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function htmlToText(html) {
  const withImageLabels = String(html ?? '').replace(/<img\b[^>]*\balt\s*=\s*(["'])(.*?)\1[^>]*>/gi, (_, _quote, alt) => ` ${alt} `);
  return decodeEntities(withImageLabels).replace(/<br\s*\/?\s*>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalize(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[’']/g, ' ').replace(/\s+/g, ' ').trim();
}

function plusDays(date, count) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}

function resolveSourceDate({ weekday, dayOfMonth, referenceDate }) {
  const targetWeekday = WEEKDAY_INDEX[weekday];
  if (targetWeekday == null) return null;
  const matches = [];
  for (let offset = -7; offset <= 14; offset += 1) {
    const iso = plusDays(referenceDate, offset);
    const date = new Date(`${iso}T00:00:00Z`);
    if (date.getUTCDate() === dayOfMonth && date.getUTCDay() === targetWeekday) matches.push({ iso, offset });
  }
  if (!matches.length) return null;
  const future = matches.filter((entry) => entry.offset >= 0).sort((a, b) => a.offset - b.offset);
  return (future[0] ?? matches.sort((a, b) => Math.abs(a.offset) - Math.abs(b.offset))[0]).iso;
}

function inWindow(date, startDate, endDateExclusive) {
  return (!startDate || date >= startDate) && (!endDateExclusive || date < endDateExclusive);
}

function validProgrammeHref(rawHref) {
  const value = decodeEntities(rawHref).trim();
  if (!value || value === '#' || /^javascript:/i.test(value)) return null;
  if (/carrera\.programa_pdf|['"]?\s*\+\s*carrera\./i.test(value) || /%20\+%20/i.test(value)) return null;
  try {
    const url = new URL(value, CHILE_TELETRAK_URL);
    if (!/^https?:$/.test(url.protocol)) return null;
    return url.href;
  } catch {
    return null;
  }
}

function nearestProgrammeCardContext(html, anchorIndex) {
  const context = htmlToText(String(html).slice(Math.max(0, anchorIndex - 3200), anchorIndex));
  const normalized = normalize(context).toUpperCase();
  const dayMatches = [...normalized.matchAll(DAY_TOKEN)];
  const day = dayMatches.at(-1) ?? null;
  if (!day) return null;
  let nearestVenue = null;
  let venueIndex = -1;
  const lower = normalized.toLowerCase();
  for (const venue of VENUES) {
    const index = lower.lastIndexOf(venue.normalized_label);
    if (index > venueIndex) {
      venueIndex = index;
      nearestVenue = venue;
    }
  }
  if (!nearestVenue || venueIndex < day.index) return null;
  return { weekday: day[1], day_of_month: Number(day[2]), venue: nearestVenue };
}

export function extractChileTeletrakProgrammeLinks(html, { referenceDate } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(referenceDate ?? '')) throw new Error('referenceDate must be YYYY-MM-DD');
  const links = new Map();
  const conflicts = [];
  const anchorRe = /<a\b[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of String(html ?? '').matchAll(anchorRe)) {
    const label = normalize(htmlToText(match[4]));
    if (!/descargar programa/.test(label)) continue;
    const href = validProgrammeHref(match[1] ?? match[2] ?? match[3] ?? '');
    if (!href) continue;
    const context = nearestProgrammeCardContext(html, match.index ?? 0);
    if (!context) continue;
    const date = resolveSourceDate({ weekday: context.weekday, dayOfMonth: context.day_of_month, referenceDate });
    if (!date) continue;
    const key = `${date}/${context.venue.racecourse_id}`;
    const previous = links.get(key);
    if (previous && previous !== href) {
      conflicts.push({ code: 'multiple_programme_links', date, racecourse_id: context.venue.racecourse_id, urls: [previous, href] });
      continue;
    }
    links.set(key, href);
  }
  return { programme_links: links, conflicts };
}

function timeToMinutes(value) {
  const match = String(value).match(/^([0-2]?\d):([0-5]\d)$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23) return null;
  return hour * 60 + minute;
}

function normalizeTime(value) {
  const minutes = timeToMinutes(value);
  if (minutes == null) return null;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function validateScheduleTimes(times) {
  const normalized = [];
  const seen = new Set();
  for (const raw of times) {
    const value = normalizeTime(raw);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
  }
  if (normalized.length < 2) return null;
  for (let index = 1; index < normalized.length; index += 1) {
    if (timeToMinutes(normalized[index]) <= timeToMinutes(normalized[index - 1])) return null;
  }
  return normalized;
}

function numberedSchedule(text, regex) {
  const matches = [...String(text).matchAll(regex)].map((match) => ({ race: Number(match[1]), time: match[2] }));
  if (matches.length < 2) return null;
  const deduped = [];
  const seen = new Set();
  for (const row of matches) {
    if (seen.has(row.race)) continue;
    seen.add(row.race);
    deduped.push(row);
  }
  deduped.sort((a, b) => a.race - b.race);
  for (let index = 0; index < deduped.length; index += 1) {
    if (deduped[index].race !== index + 1) return null;
  }
  const times = validateScheduleTimes(deduped.map((row) => row.time));
  return times?.length === deduped.length ? times : null;
}

function rowsFromTimes(times) {
  return (times ?? []).map((postTime, index) => ({ label: `Race ${index + 1}`, post_time_local: postTime }));
}

export function parseChileTeletrakProgrammeText(text, { racecourseId } = {}) {
  if (typeof text !== 'string' || text.trim() === '') throw new Error('Chile programme text must be non-empty');
  let times = null;
  let format = null;

  if (racecourseId === 'hipodromo-chile') {
    times = validateScheduleTimes([...text.matchAll(/\b([0-2]?\d:[0-5]\d)\s+aprox\./gi)].map((match) => match[1]));
    format = 'hipodromo_chile_aprox_headers';
  } else if (racecourseId === 'club-hipico-de-santiago-racecourse') {
    times = numberedSchedule(text, /\b(\d{1,2})\s*ª\s+([0-2]?\d:[0-5]\d)\b/g);
    format = 'club_hipico_santiago_numbered_headers';
  } else if (racecourseId === 'club-hipico-de-concepcion-racecourse') {
    times = numberedSchedule(text, /\b(\d{1,2})\s*ª\s*c?\s*([0-2]?\d:[0-5]\d)\s*hrs?\.?/gi);
    if (!times) times = validateScheduleTimes([...text.matchAll(/\b([0-2]?\d:[0-5]\d)\s*hrs?\.?/gi)].map((match) => match[1]));
    format = 'club_hipico_concepcion_hrs_headers';
  } else if (racecourseId === 'valparaiso-sporting-club-racecourse') {
    times = numberedSchedule(text, /Carrera\s*:?\s*(\d{1,2})\s*ª[\s\S]{0,240}?Hora\s*:?\s*([0-2]?\d:[0-5]\d)\s*hrs?/gi);
    if (!times) times = validateScheduleTimes([...text.matchAll(/Hora\s*:?\s*([0-2]?\d:[0-5]\d)\s*hrs?/gi)].map((match) => match[1]));
    format = 'valparaiso_sporting_hora_headers';
  } else {
    throw new Error(`Unsupported Chile racecourse programme format: ${racecourseId ?? 'missing racecourse id'}`);
  }

  if (!times) return { status: 'parse_failure', format, timetable_rows: [] };
  return { status: 'available', format, timetable_rows: rowsFromTimes(times) };
}

export function resolveChileTeletrakRacecourseId(label) {
  const normalized = normalize(label);
  return VENUES.find((venue) => normalized.includes(venue.normalized_label))?.racecourse_id ?? null;
}

export function parseChileTeletrakWeeklyHtml(html, { referenceDate, startDate = null, endDateExclusive = null } = {}) {
  if (typeof html !== 'string' || html.trim() === '') throw new Error('Chile Teletrak source body must be non-empty HTML');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(referenceDate ?? '')) throw new Error('referenceDate must be YYYY-MM-DD');
  const visible = htmlToText(html);
  const normalized = normalize(visible).toUpperCase();
  if (!/SEMANA DE CARRERAS/i.test(visible) || !/TELETRAK/i.test(visible)) throw new Error('Chile Teletrak weekly fingerprint missing Semana de carreras / Teletrak');
  const dayMatches = [...normalized.matchAll(DAY_TOKEN)];
  if (!dayMatches.length) throw new Error('Chile Teletrak weekly fingerprint missing day cards');
  const programmeLinkResult = extractChileTeletrakProgrammeLinks(html, { referenceDate });
  const records = [];
  const unknownVenues = [];
  const parseFailures = [...programmeLinkResult.conflicts];
  const seen = new Set();
  for (let index = 0; index < dayMatches.length; index += 1) {
    const match = dayMatches[index];
    const segmentEnd = dayMatches[index + 1]?.index ?? normalized.length;
    const segment = normalized.slice(match.index + match[0].length, segmentEnd);
    const weekday = match[1];
    const dayOfMonth = Number(match[2]);
    const date = resolveSourceDate({ weekday, dayOfMonth, referenceDate });
    if (!date) { parseFailures.push({ code: 'unresolved_source_date', weekday, day_of_month: dayOfMonth }); continue; }
    if (!inWindow(date, startDate, endDateExclusive)) continue;
    if (/SIN CARRERAS/.test(segment)) continue;
    const matchedVenues = VENUES.filter((venue) => segment.toLowerCase().includes(venue.normalized_label));
    if (!matchedVenues.length) {
      if (/DESCARGAR PROGRAMA|VER DETALLES/.test(segment) && !/SIMULCASTING/.test(segment)) unknownVenues.push({ date, source_card: segment.slice(0, 180).trim() });
      continue;
    }
    for (const venue of matchedVenues) {
      const key = `${date}/${venue.racecourse_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      records.push({ date, venue_label: venue.canonical_label, racecourse_id: venue.racecourse_id, programme_url: programmeLinkResult.programme_links.get(key) ?? null });
    }
  }
  records.sort((a, b) => a.date.localeCompare(b.date) || a.racecourse_id.localeCompare(b.racecourse_id));
  return { records, unknown_venues: unknownVenues, parse_failures: parseFailures, source_card_count: dayMatches.length };
}

export function buildChileTeletrakCandidate({ html, checkedAt, startDate, endDateExclusive }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate ?? '')) throw new Error('startDate must be YYYY-MM-DD');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDateExclusive ?? '')) throw new Error('endDateExclusive must be YYYY-MM-DD');
  if (!(startDate < endDateExclusive)) throw new Error('Chile Teletrak candidate window must be non-empty');
  const checked = new Date(checkedAt);
  if (Number.isNaN(checked.getTime())) throw new Error('checkedAt must be an ISO date-time');
  const parsed = parseChileTeletrakWeeklyHtml(html, { referenceDate: startDate, startDate, endDateExclusive });
  const records = parsed.records.map((row) => {
    const meetingId = `chile-${row.racecourse_id}-${row.date}`;
    const record = {
      candidate_id: meetingId, meeting_id: meetingId, country_id: 'chile', authority_id: CHILE_TELETRAK_AUTHORITY_ID,
      racing_system_id: CHILE_TELETRAK_SYSTEM_ID, racecourse_id: row.racecourse_id, date: row.date, timezone: CHILE_TIMEZONE,
      programme_url: row.programme_url,
      first_race_time_local: null, last_race_time_local: null, timetable_rows: [],
      source: { source_id: CHILE_TELETRAK_SOURCE_ID, official_url: CHILE_TELETRAK_URL, checked_at: checked.toISOString(), extraction_method: 'adapter_candidate' },
      confidence: 'high', review_status: 'needs_review', notes: `Official Teletrak weekly domestic meeting observation; source venue label: ${row.venue_label}.`,
    };
    return { ...record, capability_rank: deriveBestAvailableRank(record, record.timetable_rows) };
  });
  return {
    candidate: {
      schema_version: 'timetable-candidate-v1', generated_at: checked.toISOString(), adapter_id: CHILE_TELETRAK_ADAPTER_ID,
      country_id: 'chile', authority_id: CHILE_TELETRAK_AUTHORITY_ID, source_id: CHILE_TELETRAK_SOURCE_ID,
      collection_target_rank: 'best_available', candidate_window: { start_date: startDate, end_date_exclusive: endDateExclusive, timezone: CHILE_TIMEZONE }, records,
      review: { status: 'needs_review', reviewed_at: null, reviewer: null, summary: 'Chile Teletrak weekly observations use centrally derived best-available rank. Real source-linked official programme documents are retained for same-cycle detail evaluation when published.', promotion_target: null },
    },
    diagnostics: { source_card_count: parsed.source_card_count, records_emitted: records.length, unknown_venues: parsed.unknown_venues, parse_failures: parsed.parse_failures },
  };
}

export function enrichChileTeletrakCandidateWithProgrammeResults(candidate, { resultsByMeeting = {}, checkedAt } = {}) {
  if (!candidate || !Array.isArray(candidate.records)) throw new Error('Chile Teletrak candidate.records must be an array');
  const checked = new Date(checkedAt);
  if (Number.isNaN(checked.getTime())) throw new Error('checkedAt must be an ISO date-time');
  const records = candidate.records.map((base) => {
    const key = `${base.date}/${base.racecourse_id}`;
    if (!base.programme_url) {
      return { ...base, detail_observation: { status: 'not_published', evaluated_capability_rank: null, race_count: 0, programme_url: null } };
    }
    const result = resultsByMeeting[key];
    if (!result || result.status !== 'available' || !Array.isArray(result.timetable_rows) || result.timetable_rows.length < 2) {
      return {
        ...base,
        detail_observation: { status: 'source_error', evaluated_capability_rank: null, race_count: 0, programme_url: base.programme_url, error_code: result?.error_code ?? 'programme_detail_unavailable' },
      };
    }
    const rows = result.timetable_rows;
    const enriched = {
      ...base,
      first_race_time_local: rows[0].post_time_local,
      last_race_time_local: rows.at(-1).post_time_local,
      timetable_rows: rows,
      source: { source_id: CHILE_TELETRAK_SOURCE_ID, official_url: base.programme_url, checked_at: checked.toISOString(), extraction_method: 'official_linked_programme_detail' },
      detail_observation: { status: 'available', evaluated_capability_rank: 'A', race_count: rows.length, programme_url: base.programme_url, programme_format: result.format ?? null },
      notes: `${base.notes} Teletrak-linked official programme detail acquired for ${rows.length} races.`,
    };
    return { ...enriched, capability_rank: deriveBestAvailableRank(enriched, rows) };
  });
  return { ...candidate, adapter_id: CHILE_TELETRAK_DETAIL_ADAPTER_ID, records };
}
