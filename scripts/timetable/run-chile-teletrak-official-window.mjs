import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  CHILE_TELETRAK_AUTHORITY_ID,
  CHILE_TELETRAK_SOURCE_ID,
  CHILE_TELETRAK_SYSTEM_ID,
  CHILE_TELETRAK_URL,
  CHILE_TIMEZONE,
  buildChileTeletrakCandidate,
  enrichChileTeletrakCandidateWithProgrammeResults,
  parseChileTeletrakProgrammeText,
} from './chile-teletrak-weekly-core.mjs';

function arg(name, fallback = null) {
  const inline = process.argv.find((value) => value.startsWith(`--${name}=`));
  return inline ? inline.slice(name.length + 3) : fallback;
}

function localDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: CHILE_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function plusDays(date, count) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}

function decodeHtml(value) {
  return String(value ?? '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)));
}

function htmlToText(html) {
  return decodeHtml(html)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/tr>|<\/li>|<\/h\d>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .trim();
}

async function fetchOfficialHtml() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(CHILE_TELETRAK_URL, {
      headers: { 'user-agent': 'WhereHorsesRun/1.0 (+https://whr.badjoke-lab.com/)', accept: 'text/html,application/xhtml+xml' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Teletrak Chile weekly homepage returned HTTP ${response.status}`);
    return await response.text();
  } finally { clearTimeout(timer); }
}

async function extractPdfText(bytes) {
  const pdf = await getDocument({ data: bytes, disableWorker: true }).promise;
  const lines = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    let line = '';
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const value = item.str.replace(/\s+/g, ' ').trim();
      if (value) line += `${line ? ' ' : ''}${value}`;
      if (item.hasEOL && line) { lines.push(line); line = ''; }
    }
    if (line) lines.push(line);
  }
  return lines.join('\n');
}

async function fetchProgrammeText(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; public timetable acquisition)',
      accept: 'application/pdf,text/html,application/xhtml+xml,*/*;q=0.8',
      'accept-language': 'es-CL,es;q=0.9,en;q=0.7',
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Chile programme returned HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') ?? '';
  if (/pdf/i.test(contentType) || /\.pdf(?:\?|$)/i.test(response.url)) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    return { text: await extractPdfText(bytes), final_url: response.url, content_type: contentType, document_kind: 'pdf' };
  }
  if (/html/i.test(contentType) || !contentType) {
    const html = await response.text();
    return { text: htmlToText(html), final_url: response.url, content_type: contentType, document_kind: 'html' };
  }
  throw new Error(`Chile programme returned unsupported content type ${contentType}`);
}

const output = arg('output');
const days = Number(arg('days', '30'));
const startDate = arg('as-of', localDate());
const fixture = arg('fixture');
if (!output) throw new Error('--output=<path> is required');
if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error('--as-of must be YYYY-MM-DD');
if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('--days must be 1..62');

const endDateExclusive = plusDays(startDate, days);
const generatedAt = new Date().toISOString();
const html = fixture ? fs.readFileSync(path.resolve(fixture), 'utf8') : await fetchOfficialHtml();
const { candidate: scheduleCandidate, diagnostics } = buildChileTeletrakCandidate({ html, checkedAt: generatedAt, startDate, endDateExclusive });
if (diagnostics.unknown_venues.length > 0) throw new Error(`Chile Teletrak unknown domestic meeting card(s): ${JSON.stringify(diagnostics.unknown_venues)}`);
if (diagnostics.parse_failures.length > 0) throw new Error(`Chile Teletrak parse failure(s): ${JSON.stringify(diagnostics.parse_failures)}`);

const programmeResults = {};
const detailDiagnostics = [];
for (const record of scheduleCandidate.records) {
  if (!record.programme_url) {
    detailDiagnostics.push({ date: record.date, racecourse_id: record.racecourse_id, status: 'not_published', programme_url: null });
    continue;
  }
  const key = `${record.date}/${record.racecourse_id}`;
  try {
    const fetched = await fetchProgrammeText(record.programme_url);
    const parsed = parseChileTeletrakProgrammeText(fetched.text, { racecourseId: record.racecourse_id });
    if (parsed.status !== 'available') {
      programmeResults[key] = { status: 'source_error', error_code: 'programme_parse_failed' };
      detailDiagnostics.push({ date: record.date, racecourse_id: record.racecourse_id, status: 'source_error', error_code: 'programme_parse_failed', programme_url: record.programme_url, final_url: fetched.final_url, document_kind: fetched.document_kind, programme_format: parsed.format });
      continue;
    }
    programmeResults[key] = parsed;
    detailDiagnostics.push({ date: record.date, racecourse_id: record.racecourse_id, status: 'available', programme_url: record.programme_url, final_url: fetched.final_url, document_kind: fetched.document_kind, programme_format: parsed.format, race_count: parsed.timetable_rows.length });
  } catch (error) {
    programmeResults[key] = { status: 'source_error', error_code: 'programme_fetch_failed' };
    detailDiagnostics.push({ date: record.date, racecourse_id: record.racecourse_id, status: 'source_error', error_code: 'programme_fetch_failed', programme_url: record.programme_url, error: String(error?.message ?? error) });
  }
}

const candidate = enrichChileTeletrakCandidateWithProgrammeResults(scheduleCandidate, { resultsByMeeting: programmeResults, checkedAt: generatedAt });
const rankCounts = Object.fromEntries(['C', 'B', 'B+', 'A', 'A+'].map((rank) => [rank, candidate.records.filter((record) => record.capability_rank === rank).length]));
const detailStatusCounts = Object.fromEntries(['available', 'not_published', 'source_error'].map((status) => [status, candidate.records.filter((record) => record.detail_observation?.status === status).length]));
const artifact = {
  schema_version: 'chile-teletrak-official-window-candidates-v2', generated_at: generatedAt, country_id: 'chile', authority_id: CHILE_TELETRAK_AUTHORITY_ID,
  racing_system_id: CHILE_TELETRAK_SYSTEM_ID, timezone: CHILE_TIMEZONE, source_id: CHILE_TELETRAK_SOURCE_ID,
  collection_target_rank: 'best_available', raw_body_retained: false,
  discovery: { method: 'official_teletrak_weekly_homepage_plus_linked_programmes', schedule_source_id: CHILE_TELETRAK_SOURCE_ID, schedule_source_url: CHILE_TELETRAK_URL, detail_source_id: CHILE_TELETRAK_SOURCE_ID, source_card_count: diagnostics.source_card_count, rank_counts: rankCounts, detail_status_counts: detailStatusCounts },
  window: { start_date: startDate, end_date_exclusive: endDateExclusive, days, coverage_claim: 'source_visible_partial', coverage_note: 'Teletrak exposes a rolling weekly domestic meeting view and links official programme material when published. Source-linked programmes are evaluated through A. Meetings whose programme link is not yet published remain valid lower-rank observations with pending detail; retrieval/parser failures remain explicit retry states.' },
  records: candidate.records,
  diagnostics: { ...diagnostics, programme_detail: detailDiagnostics },
};
const absolute = path.resolve(output);
fs.mkdirSync(path.dirname(absolute), { recursive: true });
fs.writeFileSync(absolute, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({ output, source_url: CHILE_TELETRAK_URL, source_card_count: diagnostics.source_card_count, start_date: startDate, end_date_exclusive: endDateExclusive, meetings_emitted: artifact.records.length, rank_counts: rankCounts, detail_status_counts: detailStatusCounts, programme_detail: detailDiagnostics, unknown_venues: diagnostics.unknown_venues.length, parse_failures: diagnostics.parse_failures.length, collection_target_rank: artifact.collection_target_rank, coverage_claim: artifact.window.coverage_claim }));
