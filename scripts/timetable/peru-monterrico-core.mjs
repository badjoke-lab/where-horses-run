import { deriveBestAvailableRank } from './best-available-rank.mjs';

export const PERU_MONTERRICO_SOURCE_ID = 'monterrico-upcoming-programmes';
export const PERU_MONTERRICO_SYSTEM_ID = 'peru-monterrico-programme-system';
export const PERU_MONTERRICO_AUTHORITY_ID = 'hipodromo-de-monterrico';
export const PERU_MONTERRICO_RACECOURSE_ID = 'monterrico-racecourse';
export const PERU_MONTERRICO_TIMEZONE = 'America/Lima';
export const PERU_MONTERRICO_PROGRAMME_URL = 'https://hipodromodemonterrico.com.pe/carreras-proximos-programas';
export const PERU_MONTERRICO_ENTRY_PROGRAMME_URL = 'https://hipodromodemonterrico.com.pe/programa-de-entradas';
export const PERU_MONTERRICO_DATE_API_PREFIX = 'https://hipodromodemonterrico.com.pe/api/general/carreras/general/programas/fecha/';

const MONTHS = { enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,julio:7,agosto:8,septiembre:9,setiembre:9,octubre:10,noviembre:11,diciembre:12 };

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}
function text(value) {
  return decodeHtml(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function normalized(value) {
  return text(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
function reunionId(value, key='') {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 10000) return null;
  const k = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  return /reunion/.test(k) || (k === 'id' && n >= 100000) ? n : null;
}
export function extractMonterricoReunionIds(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Monterrico date API payload must be an object');
  if (!Object.hasOwn(payload, 'reuniones')) throw new Error('Monterrico date API fingerprint missing reuniones');
  const rows = Array.isArray(payload.reuniones) ? payload.reuniones : Object.values(payload.reuniones ?? {});
  const ids = [];
  for (const row of rows) {
    if (row == null) continue;
    if (typeof row !== 'object') {
      const id = reunionId(row, 'reunion');
      if (id) ids.push(id);
      continue;
    }
    const preferred = ['id_reunion','idReunion','idreunion','reunion_id','reunionId'];
    let found = null;
    for (const key of preferred) {
      const id = reunionId(row[key], key);
      if (id) { found = id; break; }
    }
    if (!found) {
      for (const [key,value] of Object.entries(row)) {
        const id = reunionId(value, key);
        if (id) { found = id; break; }
      }
    }
    if (found) ids.push(found);
  }
  const unique = [...new Set(ids)];
  if (rows.length && !unique.length) throw new Error('Monterrico date API exposed reunion rows without a resolvable reunion id');
  return unique;
}
const SHORT_MONTHS = { ene:1,feb:2,mar:3,abr:4,may:5,jun:6,jul:7,ago:8,sep:9,set:9,oct:10,nov:11,dic:12 };

function compactProgrammeDate(value) {
  const m = text(value).match(/\b(\d{1,2})\s*(Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Set|Oct|Nov|Dic)\s*(\d{2}|20\d{2})\b/i);
  if (!m) return null;
  const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  const month = SHORT_MONTHS[m[2].toLowerCase()];
  if (!month) return null;
  return String(year) + '-' + String(month).padStart(2,'0') + '-' + String(Number(m[1])).padStart(2,'0');
}

export function extractMonterricoEntryProgrammeLinks(html) {
  if (typeof html !== 'string' || !html.trim()) throw new Error('Monterrico entry programme HTML must be non-empty');
  const found = [];
  let lastDate = null;
  for (const rowMatch of String(html).matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const raw = rowMatch[1];
    const rowDate = compactProgrammeDate(raw);
    if (rowDate) lastDate = rowDate;
    if (!lastDate) continue;
    for (const hrefMatch of raw.matchAll(/href\s*=\s*["']([^"']*carreras-proximos-programas[^"']*id_reunion=(\d+)[^"']*)["']/gi)) {
      const reunionId = Number(hrefMatch[2]);
      if (!Number.isInteger(reunionId) || reunionId < 10000) continue;
      const href = decodeHtml(hrefMatch[1]);
      const programmeUrl = new URL(href, PERU_MONTERRICO_ENTRY_PROGRAMME_URL).toString();
      found.push({ date:lastDate, reunion_id:reunionId, programme_url:programmeUrl });
    }
  }
  const unique = new Map();
  for (const row of found) unique.set(row.date + '|' + row.reunion_id, row);
  return [...unique.values()].sort((a,b)=>a.date.localeCompare(b.date) || a.reunion_id-b.reunion_id);
}

function meetingDate(html) {
  const value = normalized(html);
  const m = value.match(/reunion\s+n\s*[°º]?\s*\d+\s+hipodromo de monterrico,\s*(?:lunes|martes|miercoles|jueves|viernes|sabado|domingo)\s+(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+del\s+ano\s+(20\d{2})/i);
  if (!m) return null;
  return m[3] + '-' + String(MONTHS[m[2]]).padStart(2,'0') + '-' + String(Number(m[1])).padStart(2,'0');
}
function cells(row) {
  return [...String(row).matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m => text(m[1]));
}
export function parseMonterricoProgrammeHtml(html, { expectedDate=null }={}) {
  if (typeof html !== 'string' || !html.trim()) throw new Error('Monterrico programme HTML must be non-empty');
  if (!/Hip[oó]dromo de Monterrico/i.test(text(html)) || !/Reuni[oó]n/i.test(text(html))) throw new Error('Monterrico programme fingerprint missing meeting identity');
  const date = meetingDate(html);
  if (!date) throw new Error('Monterrico programme meeting date could not be parsed');
  if (expectedDate && date !== expectedDate) throw new Error('Monterrico programme date mismatch: expected ' + expectedDate + ', found ' + date);
  const found = [];
  for (const rowMatch of String(html).matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const c = cells(rowMatch[1]);
    if (c.length < 4) continue;
    const n = c[0].match(/^(\d{1,2})\s*(?:ª|a|°|º)?$/i);
    const time = c[1]?.trim();
    const distance = Number(String(c[3] ?? '').replace(/[^0-9]/g,''));
    if (!n || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || distance < 100) continue;
    found.push({ number:Number(n[1]), label:'Race ' + Number(n[1]), post_time_local:time, race_name:c[2]?.trim() || undefined, distance_m:distance });
  }
  found.sort((a,b)=>a.number-b.number);
  if (found.length < 2 || found.some((r,i)=>r.number !== i+1)) throw new Error('Monterrico programme did not expose a complete race table');
  if (found.some((r,i)=>i>0 && r.post_time_local <= found[i-1].post_time_local)) throw new Error('Monterrico programme post times are not strictly increasing');
  return { meeting_date:date, timetable_rows:found.map(({number,...r})=>r) };
}
function evidence(url, checkedAt) {
  return { source_id:PERU_MONTERRICO_SOURCE_ID, official_source_url:url, observed_at:checkedAt, successfully_verified_at:checkedAt, acquisition_method:'automatic' };
}
export function buildMonterricoMeetingRecord({ date,reunionId,programmeHtml,checkedAt }) {
  const url = PERU_MONTERRICO_PROGRAMME_URL + '?id_reunion=' + encodeURIComponent(reunionId);
  const parsed = parseMonterricoProgrammeHtml(programmeHtml, { expectedDate:date });
  const record = {
    candidate_id:'peru-' + PERU_MONTERRICO_RACECOURSE_ID + '-' + date,
    meeting_id:'peru-' + PERU_MONTERRICO_RACECOURSE_ID + '-' + date,
    country_id:'peru', authority_id:PERU_MONTERRICO_AUTHORITY_ID, racing_system_id:PERU_MONTERRICO_SYSTEM_ID,
    racecourse_id:PERU_MONTERRICO_RACECOURSE_ID, date, timezone:PERU_MONTERRICO_TIMEZONE,
    first_race_time_local:parsed.timetable_rows[0].post_time_local,
    last_race_time_local:parsed.timetable_rows.at(-1).post_time_local,
    timetable_rows:parsed.timetable_rows,
    source:{ source_id:PERU_MONTERRICO_SOURCE_ID, official_url:url, checked_at:checkedAt, extraction_method:'official_programme_html' },
    route_id:'monterrico-date-api-to-programme-html', confidence:'high', review_status:'needs_review',
    detail_observation:{ status:'available', evaluated_capability_rank:'A', race_count:parsed.timetable_rows.length, programme_url:url },
    acquisition_attempt:{ attempted_at:checkedAt, status:'success', source_id:PERU_MONTERRICO_SOURCE_ID, route_id:'monterrico-date-api-to-programme-html', error_code:null }
  };
  const e = evidence(url, checkedAt);
  record.evidence_support = { meeting_identity:e, meeting_date:e, race_times:e, timetable:e, race_names:e, distances:e };
  return { ...record, capability_rank:deriveBestAvailableRank(record, record.timetable_rows) };
}
export function buildMonterricoFallbackRecord({ date,reunionId,checkedAt,status='source_error',errorCode='programme_detail_unavailable' }) {
  const url = PERU_MONTERRICO_PROGRAMME_URL + '?id_reunion=' + encodeURIComponent(reunionId);
  const record = {
    candidate_id:'peru-' + PERU_MONTERRICO_RACECOURSE_ID + '-' + date,
    meeting_id:'peru-' + PERU_MONTERRICO_RACECOURSE_ID + '-' + date,
    country_id:'peru', authority_id:PERU_MONTERRICO_AUTHORITY_ID, racing_system_id:PERU_MONTERRICO_SYSTEM_ID,
    racecourse_id:PERU_MONTERRICO_RACECOURSE_ID, date, timezone:PERU_MONTERRICO_TIMEZONE,
    first_race_time_local:null, last_race_time_local:null, timetable_rows:[],
    source:{ source_id:PERU_MONTERRICO_SOURCE_ID, official_url:url, checked_at:checkedAt, extraction_method:'date_api_meeting_identity' },
    route_id:'monterrico-date-api-to-programme-html', confidence:'high', review_status:'needs_review',
    detail_observation:{ status, race_count:0, programme_url:url, error_code:errorCode },
    acquisition_attempt:{ attempted_at:checkedAt, status:status === 'not_published' ? 'pending_publication':'source_error', source_id:PERU_MONTERRICO_SOURCE_ID, route_id:'monterrico-date-api-to-programme-html', error_code:errorCode }
  };
  const e=evidence(url, checkedAt);
  record.evidence_support={ meeting_identity:e, meeting_date:e };
  return { ...record, capability_rank:deriveBestAvailableRank(record, []) };
}
