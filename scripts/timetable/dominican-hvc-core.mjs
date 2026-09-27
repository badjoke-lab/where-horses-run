import { deriveBestAvailableRank } from './best-available-rank.mjs';
import { classifyAcquisitionCompletion } from './acquisition-completion.mjs';

export const HVC_TIMEZONE = 'America/Santo_Domingo';
export const HVC_AUTHORITY_ID = 'hipodromo-v-centenario';
export const HVC_SYSTEM_ID = 'hvc-racing-system';
export const HVC_SOURCE_ID = 'hvc-programme-calendar';
export const HVC_RACECOURSE_ID = 'dominican-republic--hipodromo-v-centenario';
export const HVC_PANFLETOS_URL = 'https://hvc.com.do/panfletos/';

const MONTHS = Object.freeze({
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
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

function normalize(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function absoluteUrl(href, baseUrl) {
  return new URL(decodeHtml(href), baseUrl).toString();
}

function pad(value) {
  return String(value).padStart(2, '0');
}

export function parseHvcPanfletosIndex(html, { baseUrl = HVC_PANFLETOS_URL } = {}) {
  if (typeof html !== 'string' || !html.trim()) throw new Error('HVC panfletos HTML must be non-empty');
  const results = [];
  const anchorRegex = /<a\b[^>]*href=["']([^"']+\.pdf(?:\?[^"']*)?)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(anchorRegex)) {
    const label = visibleText(match[2]);
    const contextStart = Math.max(0, (match.index ?? 0) - 500);
    const contextEnd = Math.min(html.length, (match.index ?? 0) + match[0].length + 500);
    const context = visibleText(html.slice(contextStart, contextEnd));
    const combined = (label + ' ' + context).replace(/\s+/g, ' ');
    const hit = combined.match(/Panfleto\s+Oficial\s+([A-Za-zÁÉÍÓÚÑáéíóúñ]+)\s+(20\d{2})/i);
    if (!hit) continue;
    const month = MONTHS[normalize(hit[1])];
    if (!month) continue;
    results.push({ year: Number(hit[2]), month, url: absoluteUrl(match[1], baseUrl), label: hit[0] });
  }
  return [...new Map(results.map((row) => [String(row.year) + '-' + String(row.month), row])).values()]
    .sort((a, b) => a.year - b.year || a.month - b.month);
}

export function parseHvcPanfletoText(text, { sourceUrl = null } = {}) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!/CARRERAS/i.test(clean)) throw new Error('HVC panfleto race fingerprint missing');
  const regex = /LLAMAD(?:A|AS)\s+PARA\s+LA[S]?\s+CARRERAS(?:\s+DEL)?\s+(?:SABADO|SÁBADO|MARTES)\s+(\d{1,2})\s+DE\s+([A-ZÁÉÍÓÚÑ]+)\s+(?:(?:DE|DEL)\s+)?(20\d{2})/giu;
  const rows = [];
  for (const match of clean.matchAll(regex)) {
    const month = MONTHS[normalize(match[2])];
    const day = Number(match[1]);
    const year = Number(match[3]);
    if (!month || !Number.isInteger(day) || day < 1 || day > 31) continue;
    rows.push({
      date: String(year) + '-' + pad(month) + '-' + pad(day),
      racecourse_id: HVC_RACECOURSE_ID,
      venue_name: 'Hipódromo V Centenario',
      source_url: sourceUrl,
    });
  }
  return [...new Map(rows.map((row) => [row.date + '|' + row.racecourse_id, row])).values()]
    .sort((a, b) => a.date.localeCompare(b.date));
}

function evidence(url, checkedAt) {
  return {
    source_id: HVC_SOURCE_ID,
    official_source_url: url,
    observed_at: checkedAt,
    successfully_verified_at: checkedAt,
    acquisition_method: 'automatic',
  };
}

export function buildHvcMeetingRecord(row, { checkedAt } = {}) {
  const meetingId = 'dominican-republic-hvc-' + row.date;
  const sourceEvidence = evidence(row.source_url, checkedAt);
  const record = {
    candidate_id: meetingId,
    meeting_id: meetingId,
    country_id: 'dominican-republic',
    authority_id: HVC_AUTHORITY_ID,
    racing_system_id: HVC_SYSTEM_ID,
    racecourse_id: HVC_RACECOURSE_ID,
    date: row.date,
    timezone: HVC_TIMEZONE,
    first_race_time_local: null,
    last_race_time_local: null,
    timetable_rows: [],
    source: {
      source_id: HVC_SOURCE_ID,
      official_url: row.source_url,
      checked_at: checkedAt,
      extraction_method: 'official_monthly_panfleto_pdf',
    },
    route_id: 'hvc-panfletos-monthly-pdf',
    confidence: 'high',
    review_status: 'needs_review',
    notes: 'Official Hipódromo V Centenario monthly Panfleto observation. This route establishes meeting date and physical racecourse only; no post time is inferred.',
    detail_observation: {
      status: 'not_applicable',
      evaluated_capability_rank: 'C',
      race_count: 0,
      calendar_url: row.source_url,
    },
    acquisition_attempt: {
      attempted_at: checkedAt,
      status: 'success',
      source_id: HVC_SOURCE_ID,
      route_id: 'hvc-panfletos-monthly-pdf',
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
