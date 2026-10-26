import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const PANAMA_TIMEZONE = 'America/Panama';
export const PANAMA_AUTHORITY_ID = 'hipica-de-panama';
export const PANAMA_SYSTEM_ID = 'presidente-remon-racing-system';
export const PANAMA_SOURCE_ID = 'presidente-remon-programa-oficial';
export const PANAMA_RACECOURSE_ID = 'panama--hipodromo-presidente-remon';
export const PANAMA_PROGRAMME_URL = 'https://www.hipodromo.com/index.php/calendario/categoria/programa-oficial/';
export const PANAMA_ALL_EVENTS_CALENDAR_URL = 'https://www.hipodromo.com/index.php/calendario/';

const MONTHS = Object.freeze({
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
});

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

function normalized(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function pad(value) {
  return String(value).padStart(2, '0');
}

export function parsePanamaProgrammePage(html, { sourceUrl = PANAMA_PROGRAMME_URL } = {}) {
  if (typeof html !== 'string' || !html.trim()) {
    throw new Error('Panama Programa Oficial HTML must be non-empty');
  }
  const text = visibleText(html);
  if (!/Programa\s+Ofici(?:al|l)/i.test(text)) {
    throw new Error('Panama Programa Oficial fingerprint missing');
  }

  // The official calendar currently contains both "Programa Oficial" and the
  // source typo "Programa Oficil". It also has one "6 d septiembre" title.
  // Parse the event title only; the adjacent 08:00-17:00 event/operating hours
  // are intentionally ignored and must never become race times.
  const regex = /Programa\s+Ofici(?:al|l)\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+\s+(\d{1,2})\s+(?:de|d)\s+([A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)\s+de\s+(20\d{2})/giu;
  const rows = [];
  for (const match of text.matchAll(regex)) {
    const month = MONTHS[normalized(match[2])];
    const day = Number(match[1]);
    const year = Number(match[3]);
    if (!month || !Number.isInteger(day) || day < 1 || day > 31) continue;
    rows.push({
      date: `${year}-${pad(month)}-${pad(day)}`,
      racecourse_id: PANAMA_RACECOURSE_ID,
      venue_name: 'Hipódromo Presidente Remón',
      source_title: match[0],
      source_url: sourceUrl,
    });
  }

  const unique = new Map();
  for (const row of rows) unique.set(`${row.date}|${row.racecourse_id}`, row);
  return [...unique.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// Preserve one C-level observation per real date/venue even when the operator
// lists its own event in multiple calendar feeds. Never infer a meeting from a
// provisional, forecast, horse-weight, training or operating-hours event.
export function mergePanamaProgrammeRows(...groups) {
  const unique = new Map();
  for (const group of groups) {
    for (const row of group) {
      const key = `${row.date}|${row.racecourse_id}`;
      if (!unique.has(key)) unique.set(key, row);
    }
  }
  return [...unique.values()].sort((a,b)=>a.date.localeCompare(b.date));
}

// A second first-party calendar page is necessary because official programmes
// have been assigned to the operator's wrong category. Partial HTML access
// must never be reported as an unqualified complete source-visible horizon.
export function classifyPanamaPageCoverage(sourcePages, sourceVisibleRows) {
  const successfulPages = sourcePages.filter(page => page.status === 'success').length;
  if (successfulPages === 0) {
    return { status: 'network_error', coverage_claim: 'acquisition_failed_preserve_verified_state' };
  }
  if (sourceVisibleRows === 0) {
    return { status: 'parse_error', coverage_claim: 'acquisition_failed_preserve_verified_state' };
  }
  if (successfulPages < sourcePages.length) {
    return { status: 'success', coverage_claim: 'source_visible_partial' };
  }
  return { status: 'success', coverage_claim: 'official_source_visible_horizon' };
}

// Restrict reconciliation to positive programme titles within a bounded date window.
export function panamaBoundedWindow(asOf, forwardDays, lookbackDays = 0) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(asOf)) throw new Error('invalid Panama as-of date format');
  if (!Number.isInteger(forwardDays) || forwardDays < 1 || forwardDays > 62) throw new Error('invalid Panama forward days');
  if (!Number.isInteger(lookbackDays) || lookbackDays < 0 || lookbackDays > 7) throw new Error('invalid Panama lookback days');
  const move = (date, amount) => {
    const value = new Date(date + 'T00:00:00Z');
    if (Number.isNaN(value.valueOf()) || value.toISOString().slice(0, 10) !== date) {
      throw new Error('invalid Panama calendar date');
    }
    value.setUTCDate(value.getUTCDate() + amount);
    return value.toISOString().slice(0, 10);
  };
  return {
    start_date: move(asOf, -lookbackDays),
    forward_start_date: asOf,
    end_date_exclusive: move(asOf, forwardDays),
    days: forwardDays + lookbackDays,
    lookback_days: lookbackDays,
  };
}

function evidence(url, checkedAt) {
  return {
    source_id: PANAMA_SOURCE_ID,
    official_source_url: url,
    observed_at: checkedAt,
    successfully_verified_at: checkedAt,
    acquisition_method: 'automatic',
  };
}

export function buildPanamaMeetingRecord(row, { checkedAt } = {}) {
  const meetingId = `panama-presidente-remon-${row.date}`;
  const e = evidence(row.source_url ?? PANAMA_PROGRAMME_URL, checkedAt);
  const record = {
    candidate_id: meetingId,
    meeting_id: meetingId,
    country_id: 'panama',
    authority_id: PANAMA_AUTHORITY_ID,
    racing_system_id: PANAMA_SYSTEM_ID,
    racecourse_id: PANAMA_RACECOURSE_ID,
    date: row.date,
    timezone: PANAMA_TIMEZONE,
    first_race_time_local: null,
    last_race_time_local: null,
    timetable_rows: [],
    source: {
      source_id: PANAMA_SOURCE_ID,
      official_url: row.source_url ?? PANAMA_PROGRAMME_URL,
      checked_at: checkedAt,
      extraction_method: 'official_programa_oficial_calendar_html',
    },
    route_id: 'presidente-remon-programa-oficial-category-html',
    confidence: 'high',
    review_status: 'needs_review',
    notes: 'Official Hipódromo Presidente Remón Programa Oficial event observation. The calendar confirms meeting date and physical racecourse only. Calendar/event operating hours are not race post times and are not retained.',
    detail_observation: {
      status: 'not_applicable',
      evaluated_capability_rank: 'C',
      race_count: 0,
      calendar_url: row.source_url ?? PANAMA_PROGRAMME_URL,
    },
    acquisition_attempt: {
      attempted_at: checkedAt,
      status: 'success',
      source_id: PANAMA_SOURCE_ID,
      route_id: 'presidente-remon-programa-oficial-category-html',
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
