import { deriveBestAvailableRank } from './best-available-rank.mjs';

export const CHILE_TELETRAK_URL = 'https://teletrak.cl/';
export const CHILE_TELETRAK_SOURCE_ID = 'chile-teletrak-weekly-programme';
export const CHILE_TELETRAK_ADAPTER_ID = 'chile-teletrak-weekly-best-available-v2';
export const CHILE_TELETRAK_SYSTEM_ID = 'chile-teletrak-racing-system';
export const CHILE_TELETRAK_AUTHORITY_ID = 'teletrak-chile';
export const CHILE_TIMEZONE = 'America/Santiago';

const WEEKDAY_INDEX = Object.freeze({ DOM: 0, LUN: 1, MAR: 2, MIE: 3, JUE: 4, VIE: 5, SAB: 6 });
const DAY_TOKEN = /\b(LUN|MAR|MIE|JUE|VIE|SAB|DOM)\s+([0-3]?\d)\b/g;

const VENUES = Object.freeze([
  { canonical_label: 'Club Hípico de Concepción', normalized_label: 'club hipico de concepcion', racecourse_id: 'club-hipico-de-concepcion-racecourse' },
  { canonical_label: 'Club Hípico de Santiago', normalized_label: 'club hipico de santiago', racecourse_id: 'club-hipico-de-santiago-racecourse' },
  { canonical_label: 'Hipódromo Chile', normalized_label: 'hipodromo chile', racecourse_id: 'hipodromo-chile-racecourse' },
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
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function htmlToAnnotatedText(html) {
  const links = [];
  let annotated = String(html).replace(/<a\b([^>]*)>/gi, (tag, attributes) => {
    const href = attributes.match(/\bhref\s*=\s*(["'])(.*?)\1/i)?.[2] ?? null;
    if (!href) return ' ';
    const index = links.push(decodeEntities(href).trim()) - 1;
    return ` LINKREF${index} `;
  });
  annotated = annotated.replace(/<img\b[^>]*\balt\s*=\s*(["'])(.*?)\1[^>]*>/gi, (_, _quote, alt) => ` ${alt} `);
  return {
    text: decodeEntities(annotated).replace(/<br\s*\/?\s*>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    links,
  };
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

function resolveProgrammeUrl(rawHref) {
  if (!rawHref || rawHref === '#' || /^javascript:/i.test(rawHref)) return null;
  try {
    const url = new URL(rawHref, CHILE_TELETRAK_URL);
    if (url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

function programmeUrlFromSegment(segment, links) {
  const candidates = [...segment.matchAll(/LINKREF(\d+)/g)]
    .map((match) => resolveProgrammeUrl(links[Number(match[1])]))
    .filter(Boolean);
  if (!candidates.length) return null;
  return candidates.find((url) => /\.pdf(?:$|[?#])/i.test(url)) ?? candidates[0];
}

export function resolveChileTeletrakRacecourseId(label) {
  const normalized = normalize(label);
  return VENUES.find((venue) => normalized.includes(venue.normalized_label))?.racecourse_id ?? null;
}

export function parseChileTeletrakWeeklyHtml(html, { referenceDate, startDate = null, endDateExclusive = null } = {}) {
  if (typeof html !== 'string' || html.trim() === '') throw new Error('Chile Teletrak source body must be non-empty HTML');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(referenceDate ?? '')) throw new Error('referenceDate must be YYYY-MM-DD');
  const annotated = htmlToAnnotatedText(html);
  const normalized = normalize(annotated.text).toUpperCase();
  if (!/SEMANA DE CARRERAS/i.test(annotated.text) || !/TELETRAK/i.test(annotated.text)) throw new Error('Chile Teletrak weekly fingerprint missing Semana de carreras / Teletrak');
  const dayMatches = [...normalized.matchAll(DAY_TOKEN)];
  if (!dayMatches.length) throw new Error('Chile Teletrak weekly fingerprint missing day cards');
  const records = [];
  const unknownVenues = [];
  const parseFailures = [];
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
    const programmeUrl = programmeUrlFromSegment(segment, annotated.links);
    for (const venue of matchedVenues) {
      const key = `${date}/${venue.racecourse_id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      records.push({ date, venue_label: venue.canonical_label, racecourse_id: venue.racecourse_id, programme_url: programmeUrl });
    }
  }
  records.sort((a, b) => a.date.localeCompare(b.date) || a.racecourse_id.localeCompare(b.racecourse_id));
  return { records, unknown_venues: unknownVenues, parse_failures: parseFailures, source_card_count: dayMatches.length };
}

function cleanRaceName(value) {
  return String(value ?? '').replace(/\s+/g, ' ').replace(/[.;,:-]+$/g, '').trim();
}

export function parseChileOfficialProgrammeText(text) {
  if (typeof text !== 'string' || text.trim() === '') throw new Error('Chile programme text must be non-empty');
  const headerPattern = /(^|\n|\s)(\d{1,2}:\d{2})\s+aprox\.?\s+([\d.]+)\s*Mts\.?/gi;
  const matches = [...text.matchAll(headerPattern)];
  const rows = [];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? text.length;
    const block = text.slice(start, end);
    const nameMatch = block.match(/\bPREMIO:\s*([^\r\n]+)/i);
    const raceName = cleanRaceName(nameMatch?.[1] ?? '');
    const distanceM = Number(String(match[3]).replaceAll('.', ''));
    const postTime = match[2].padStart(5, '0');
    if (!raceName || !Number.isInteger(distanceM) || distanceM < 400 || distanceM > 5000) continue;
    rows.push({
      label: `Race ${rows.length + 1}`,
      post_time_local: postTime,
      race_name: raceName,
      distance_m: distanceM,
    });
  }
  return rows;
}

export function enrichChileRecordWithProgramme(record, { text, programmeUrl }) {
  const rows = parseChileOfficialProgrammeText(text);
  if (!rows.length) return null;
  const enriched = {
    ...record,
    first_race_time_local: rows[0].post_time_local,
    last_race_time_local: rows.at(-1).post_time_local,
    timetable_rows: rows,
    programme_url: programmeUrl ?? record.programme_url ?? null,
    source: {
      ...record.source,
      source_id: 'chile-teletrak-linked-official-programme',
      official_url: programmeUrl ?? record.programme_url ?? record.source?.official_url ?? CHILE_TELETRAK_URL,
      extraction_method: 'linked_programme_detail',
    },
    notes: `${record.notes ?? ''} Linked programme detail normalized for race rows.`.trim(),
  };
  return { ...enriched, capability_rank: deriveBestAvailableRank(enriched, enriched.timetable_rows) };
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
      first_race_time_local: null, last_race_time_local: null, timetable_rows: [], programme_url: row.programme_url,
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
      review: { status: 'needs_review', reviewed_at: null, reviewer: null, summary: 'Teletrak weekly discovery is followed by linked programme-detail acquisition whenever the programme is published; lower ranks remain eligible for retry on every refresh.', promotion_target: null },
    },
    diagnostics: { source_card_count: parsed.source_card_count, records_emitted: records.length, unknown_venues: parsed.unknown_venues, parse_failures: parsed.parse_failures },
  };
}
