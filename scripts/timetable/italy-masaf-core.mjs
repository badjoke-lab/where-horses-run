import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const ITALY_TIMEZONE = 'Europe/Rome';
export const ITALY_AUTHORITY_ID = 'masaf';
export const ITALY_SOURCE_ID = 'masaf-calendar-2026';
export const ITALY_GALLOP_SYSTEM_ID = 'italy-masaf-gallop-system';
export const ITALY_TROT_SYSTEM_ID = 'italy-masaf-trot-system';
export const ITALY_NORMATIVE_INDEX_URL = 'https://www.masaf.gov.it/flex/cm/pages/ServeBLOB.php/L/IT/IDPagina/6174?YY=2026';

const MONTHS = Object.freeze({
  GENNAIO: 1, FEBBRAIO: 2, MARZO: 3, APRILE: 4, MAGGIO: 5, GIUGNO: 6,
  LUGLIO: 7, AGOSTO: 8, SETTEMBRE: 9, OTTOBRE: 10, NOVEMBRE: 11, DICEMBRE: 12,
});

const VENUES = Object.freeze({
  TO: ['italy--ippodromo-stupinigi', 'Ippodromo Stupinigi'],
  MI: ['italy--ippodromo-san-siro', 'Ippodromo San Siro'],
  VA: ['italy--ippodromo-le-bettole', 'Ippodromo Le Bettole'],
  ALB: ['italy--ippodromo-dei-fiori', 'Ippodromo dei Fiori'],
  ME: ['italy--ippodromo-di-maia', 'Ippodromo di Maia'],
  TV: ['italy--ippodromo-s-artemio', 'Ippodromo S. Artemio'],
  PD: ['italy--ippodromo-breda', 'Ippodromo Breda'],
  BO: ['italy--ippodromo-dell-arcoveggio', 'Ippodromo dell’Arcoveggio'],
  MO: ['italy--ippodromo-la-ghirlandina', 'Ippodromo La Ghirlandina'],
  CE: ['italy--ippodromo-del-savio', 'Ippodromo del Savio'],
  FI: ['italy--ippodromo-del-visarno', 'Ippodromo del Visarno'],
  MTC: ['italy--ippodromo-sesana', 'Ippodromo Sesana'],
  PI: ['italy--ippodromo-san-rossore', 'Ippodromo San Rossore'],
  LI: ['italy--ippodromo-federico-caprilli', 'Ippodromo Federico Caprilli'],
  MTG: ['italy--ippodromo-s-paolo', 'Ippodromo S. Paolo'],
  COR: ['italy--ippodromo-martini', 'Ippodromo Martini'],
  RM: ['italy--ippodromo-di-roma-capannelle', 'Ippodromo di Roma Capannelle'],
  TC: ['italy--ippodromo-dei-marsi', 'Ippodromo dei Marsi'],
  NA: ['italy--ippodromo-di-agnano', 'Ippodromo di Agnano'],
  SCD: ['italy--ippodromo-del-garigliano', 'Ippodromo del Garigliano'],
  AV: ['italy--ippodromo-cirigliano', 'Ippodromo Cirigliano'],
  PTC: ['italy--ippodromo-valentinia', 'Ippodromo Valentinia'],
  CDS: ['italy--ippodromo-dei-sauri', 'Ippodromo dei Sauri'],
  TA: ['italy--ippodromo-paolo-sesto', 'Ippodromo Paolo Sesto'],
  CAS: ['italy--ippodromo-euroitalia', 'Ippodromo Euroitalia'],
  PA: ['italy--ippodromo-la-favorita', 'Ippodromo La Favorita'],
  SR: ['italy--ippodromo-del-mediterraneo', 'Ippodromo del Mediterraneo'],
  CHI: ['italy--ippodromo-don-meloni', 'Ippodromo Don Meloni'],
  SS: ['italy--ippodromo-pinna', 'Ippodromo Pinna'],
});

const HEADER_ALIASES = Object.freeze({
  CES: 'CE', CE: 'CE', MCT: 'MTC', MTC: 'MTC', LIV: 'LI', LI: 'LI', CDS: 'CDS',
});

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function visibleText(value) {
  return decodeHtml(String(value ?? '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function absoluteMasafUrl(href, base = 'https://www.masaf.gov.it/') {
  const decoded = decodeHtml(href);
  return new URL(decoded, base).toString();
}

function pad(value) { return String(value).padStart(2, '0'); }

export function normalizeItalyVenueCode(value) {
  const raw = String(value ?? '').trim().toUpperCase().replace(/[^A-Z]/g, '');
  return HEADER_ALIASES[raw] ?? raw;
}

export function resolveItalyRacecourse(code) {
  const normalized = normalizeItalyVenueCode(code);
  const row = VENUES[normalized];
  if (!row) throw new Error(`Unknown MASAF venue code: ${code}`);
  return { venue_code: normalized, racecourse_id: row[0], venue_label: row[1] };
}

export function parseItalyMasafLatestCalendarPageUrl(html, { baseUrl = ITALY_NORMATIVE_INDEX_URL } = {}) {
  const candidates = [];
  for (const match of String(html ?? '').matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const text = visibleText(match[2]);
    if (!/modifica del calendario delle corse ippiche per l['’]anno 2026/i.test(text)) continue;
    const date = text.match(/(\d{2})\/(\d{2})\/(2026)/);
    if (!date) continue;
    candidates.push({
      iso: `${date[3]}-${date[2]}-${date[1]}`,
      url: absoluteMasafUrl(match[1], baseUrl),
    });
  }
  candidates.sort((a, b) => b.iso.localeCompare(a.iso));
  if (!candidates.length) throw new Error('MASAF 2026 calendar amendment page not discovered');
  return candidates[0];
}

export function parseItalyMasafCalendarAttachmentUrl(html, { baseUrl } = {}) {
  const candidates = [];
  for (const match of String(html ?? '').matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const text = visibleText(match[2]);
    if (!/ALLEGATO\s*(?:n\.?\s*)?1\b/i.test(text)) continue;
    if (!/Calendario (?:nazionale delle )?corse ippiche.*2026/i.test(text)) continue;
    candidates.push(absoluteMasafUrl(match[1], baseUrl));
  }
  if (!candidates.length) throw new Error('MASAF calendar attachment not discovered');
  return candidates[0];
}

function monthFromItems(items) {
  const joined = items.map((item) => item.str).join(' ').replace(/\s+/g, ' ').toUpperCase();
  const found = Object.keys(MONTHS).find((name) => joined.includes(`GIORNATE DI CORSE DI ${name}`));
  return found ? MONTHS[found] : null;
}

function itemPoint(item) {
  return {
    str: String(item?.str ?? '').trim(),
    x: Number(item?.x ?? item?.transform?.[4]),
    y: Number(item?.y ?? item?.transform?.[5]),
  };
}

function median(values) {
  const ordered = [...values].sort((a, b) => a - b);
  if (!ordered.length) return null;
  const mid = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[mid] : (ordered[mid - 1] + ordered[mid]) / 2;
}

function systemsForRaceCode(code) {
  const token = String(code ?? '').toUpperCase();
  if (token.startsWith('T')) return [ITALY_TROT_SYSTEM_ID];
  if (token.startsWith('G') || token.startsWith('O')) return [ITALY_GALLOP_SYSTEM_ID];
  if (token.startsWith('M')) return [ITALY_TROT_SYSTEM_ID, ITALY_GALLOP_SYSTEM_ID];
  return [];
}

export function parseItalyMasafCalendarPages(pages, { year = 2026, sourceUrl } = {}) {
  const records = [];
  const parse_failures = [];
  const unknown_venues = [];

  for (const page of pages ?? []) {
    const items = (page.items ?? []).map(itemPoint).filter((item) => item.str && Number.isFinite(item.x) && Number.isFinite(item.y));
    const month = monthFromItems(items);
    if (!month) continue;

    const ggCandidates = items.filter((item) => item.str.toUpperCase() === 'GG');
    if (!ggCandidates.length) {
      parse_failures.push({ code: 'gg_header_missing', page_number: page.page_number, month });
      continue;
    }
    const gg = ggCandidates.sort((a, b) => b.y - a.y)[0];

    const headers = [];
    for (const item of items) {
      if (Math.abs(item.y - gg.y) > 5) continue;
      const code = normalizeItalyVenueCode(item.str);
      if (!VENUES[code]) continue;
      headers.push({ code, x: item.x, y: item.y });
    }
    const uniqueHeaders = [...new Map(headers.map((row) => [row.code, row])).values()].sort((a, b) => a.x - b.x);
    if (uniqueHeaders.length < 20) {
      parse_failures.push({ code: 'venue_header_incomplete', page_number: page.page_number, month, header_count: uniqueHeaders.length });
      continue;
    }

    const gaps = uniqueHeaders.slice(1).map((row, index) => row.x - uniqueHeaders[index].x).filter((value) => value > 0);
    const xTolerance = Math.max(5, (median(gaps) ?? 12) * 0.52);
    const dayRows = items
      .map((item) => ({ ...item, match: item.str.match(/^(\d{1,2})(?:\s+(?:lun|mar|mer|gio|ven|sab|dom))?$/i) }))
      .filter((item) => item.match && Math.abs(item.x - gg.x) < 28)
      .map((item) => ({ day: Number(item.match[1]), y: item.y, x: item.x }))
      .filter((row) => row.day >= 1 && row.day <= 31);

    if (!dayRows.length) {
      parse_failures.push({ code: 'day_rows_missing', page_number: page.page_number, month });
      continue;
    }

    for (const item of items) {
      const token = item.str.toUpperCase().replace(/\s+/g, '');
      if (!/^(?:T|G|O|M)[A-Z]*$/.test(token)) continue;
      if (Math.abs(item.y - gg.y) <= 6) continue;
      const dayRow = dayRows.reduce((best, row) => {
        const distance = Math.abs(item.y - row.y);
        return !best || distance < best.distance ? { row, distance } : best;
      }, null);
      if (!dayRow || dayRow.distance > 4.5) continue;
      const header = uniqueHeaders.reduce((best, row) => {
        const distance = Math.abs(item.x - row.x);
        return !best || distance < best.distance ? { row, distance } : best;
      }, null);
      if (!header || header.distance > xTolerance) continue;

      let venue;
      try { venue = resolveItalyRacecourse(header.row.code); }
      catch {
        unknown_venues.push({ page_number: page.page_number, month, day: dayRow.row.day, venue_code: header.row.code, race_code: token });
        continue;
      }
      const date = `${year}-${pad(month)}-${pad(dayRow.row.day)}`;
      for (const system_id of systemsForRaceCode(token)) {
        records.push({
          date,
          system_id,
          racecourse_id: venue.racecourse_id,
          venue_code: venue.venue_code,
          venue_label: venue.venue_label,
          race_code: token,
          discipline: token.startsWith('O') ? 'obstacle' : token.startsWith('T') ? 'trot' : token.startsWith('G') ? 'gallop' : 'mixed',
          source_url: sourceUrl,
        });
      }
    }
  }

  const deduped = new Map();
  for (const row of records) {
    const key = `${row.system_id}/${row.date}/${row.racecourse_id}`;
    const existing = deduped.get(key);
    if (existing) {
      existing.race_code = [...new Set(`${existing.race_code},${row.race_code}`.split(','))].join(',');
      if (existing.discipline !== row.discipline) existing.discipline = 'mixed';
    } else {
      deduped.set(key, { ...row });
    }
  }

  return {
    records: [...deduped.values()].sort((a, b) => a.date.localeCompare(b.date) || a.racecourse_id.localeCompare(b.racecourse_id) || a.system_id.localeCompare(b.system_id)),
    parse_failures,
    unknown_venues,
  };
}

function evidence(url, checkedAt) {
  return {
    source_id: ITALY_SOURCE_ID,
    official_source_url: url,
    observed_at: checkedAt,
    successfully_verified_at: checkedAt,
    acquisition_method: 'automatic',
  };
}

export function buildItalyMasafMeetingRecord(row, { checkedAt } = {}) {
  if (![ITALY_GALLOP_SYSTEM_ID, ITALY_TROT_SYSTEM_ID].includes(row.system_id)) {
    throw new Error(`Unsupported Italy system: ${row.system_id}`);
  }
  const systemToken = row.system_id === ITALY_TROT_SYSTEM_ID ? 'trot' : 'gallop';
  const meetingId = `italy-masaf-${systemToken}-${row.racecourse_id}-${row.date}`;
  const e = evidence(row.source_url, checkedAt);
  const record = {
    candidate_id: meetingId,
    meeting_id: meetingId,
    country_id: 'italy',
    authority_id: ITALY_AUTHORITY_ID,
    racing_system_id: row.system_id,
    racecourse_id: row.racecourse_id,
    date: row.date,
    timezone: ITALY_TIMEZONE,
    first_race_time_local: null,
    last_race_time_local: null,
    timetable_rows: [],
    source: {
      source_id: ITALY_SOURCE_ID,
      official_url: row.source_url,
      checked_at: checkedAt,
      extraction_method: 'official_masaf_national_calendar_pdf',
    },
    route_id: 'masaf-national-calendar-pdf',
    confidence: 'high',
    review_status: 'needs_review',
    notes: `Official MASAF 2026 national calendar observation; venue code ${row.venue_code}; source race-day code ${row.race_code}; discipline ${row.discipline}. This source establishes date and physical racecourse only; first-race and per-race post times are not inferred.`,
    detail_observation: {
      status: 'not_applicable',
      evaluated_capability_rank: 'C',
      race_count: 0,
      venue_code: row.venue_code,
      schedule_code: row.race_code,
      discipline: row.discipline,
    },
    acquisition_attempt: {
      attempted_at: checkedAt,
      status: 'success',
      source_id: ITALY_SOURCE_ID,
      route_id: 'masaf-national-calendar-pdf',
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
