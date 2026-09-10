import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  IRELAND_HRI_AUTHORITY_ID,
  IRELAND_HRI_DETAIL_SOURCE_ID,
  IRELAND_HRI_PDF_URLS,
  IRELAND_HRI_RACECARD_MONTH_ENDPOINT,
  IRELAND_HRI_RACECARDS_URL,
  IRELAND_HRI_SOURCE_ID,
  IRELAND_HRI_SYSTEM_ID,
  IRELAND_TIMEZONE,
  buildIrelandHriCandidate,
  enrichIrelandHriCandidateWithRacecards,
  parseIrelandHriRacecardMonthHtml,
} from './ireland-hri-fixtures-core.mjs';

function arg(name, fallback = null) {
  const inline = process.argv.find((value) => value.startsWith(`--${name}=`));
  return inline ? inline.slice(name.length + 3) : fallback;
}

function localDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: IRELAND_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function plusDays(date, count) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}

async function fetchOfficialPdf() {
  let lastError = null;
  for (const url of IRELAND_HRI_PDF_URLS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(url, {
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
          accept: 'application/pdf,*/*;q=0.8',
        },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HRI fixture PDF returned HTTP ${response.status}`);
      const contentType = response.headers.get('content-type') ?? '';
      if (!/pdf/i.test(contentType)) throw new Error(`HRI fixture source did not return PDF (${contentType || 'unknown content-type'})`);
      return { bytes: new Uint8Array(await response.arrayBuffer()), url };
    } catch (error) {
      lastError = new Error(`${url}: ${error.message}`);
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError ?? new Error('No HRI fixture PDF URL was available');
}

async function fetchRacecardMonth(month) {
  const url = new URL(IRELAND_HRI_RACECARD_MONTH_ENDPOINT);
  url.searchParams.set('Month', `${month}-01`);
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
      accept: 'text/html,application/xhtml+xml',
      'accept-language': 'en-IE,en;q=0.9',
      'x-requested-with': 'XMLHttpRequest',
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HRI racecard month returned HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') ?? '';
  if (!/html/i.test(contentType)) throw new Error(`HRI racecard month did not return HTML (${contentType || 'unknown content-type'})`);
  return { html: await response.text(), url: url.href };
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

const output = arg('output');
const days = Number(arg('days', '30'));
const startDate = arg('as-of', localDate());
const fixture = arg('fixture');
if (!output) throw new Error('--output=<path> is required');
if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) throw new Error('--as-of must be YYYY-MM-DD');
if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('--days must be 1..62');

const endDateExclusive = plusDays(startDate, days);
const generatedAt = new Date().toISOString();
let text;
let sourceUrl;
if (fixture) {
  text = fs.readFileSync(path.resolve(fixture), 'utf8');
  sourceUrl = IRELAND_HRI_PDF_URLS[0];
} else {
  const fetched = await fetchOfficialPdf();
  text = await extractPdfText(fetched.bytes);
  sourceUrl = fetched.url;
}
const { candidate: scheduleCandidate, diagnostics } = buildIrelandHriCandidate({ text, checkedAt: generatedAt, startDate, endDateExclusive, sourceUrl });
if (diagnostics.unknown_venues.length > 0) throw new Error(`HRI unknown racecourse label(s): ${JSON.stringify(diagnostics.unknown_venues)}`);
if (diagnostics.parse_failures.length > 0) throw new Error(`HRI fixture parse failure(s): ${JSON.stringify(diagnostics.parse_failures)}`);

const months = [...new Set(scheduleCandidate.records.map((record) => record.date.slice(0, 7)))].sort();
const racecardMeetings = [];
const sourceErrorsByMonth = {};
const racecardDiagnostics = [];
for (const month of months) {
  try {
    const fetched = await fetchRacecardMonth(month);
    const parsed = parseIrelandHriRacecardMonthHtml(fetched.html);
    if (parsed.unknown_venues.length > 0 || parsed.parse_failures.length > 0) {
      sourceErrorsByMonth[month] = { code: 'racecard_month_parse_failed' };
      racecardDiagnostics.push({ month, source_url: fetched.url, status: 'parser_failure', unknown_venues: parsed.unknown_venues, parse_failures: parsed.parse_failures });
      continue;
    }
    racecardMeetings.push(...parsed.meetings);
    racecardDiagnostics.push({ month, source_url: fetched.url, status: 'available', meetings: parsed.meetings.length, meetings_with_races: parsed.meetings.filter((meeting) => meeting.races.length > 0).length });
  } catch (error) {
    sourceErrorsByMonth[month] = { code: 'racecard_month_fetch_failed' };
    racecardDiagnostics.push({ month, source_url: `${IRELAND_HRI_RACECARD_MONTH_ENDPOINT}?Month=${month}-01`, status: 'source_error', error: String(error?.message ?? error) });
  }
}

const candidate = enrichIrelandHriCandidateWithRacecards(scheduleCandidate, {
  meetings: racecardMeetings,
  sourceErrorsByMonth,
  checkedAt: generatedAt,
  detailSourceUrl: IRELAND_HRI_RACECARDS_URL,
});
const rankCounts = Object.fromEntries(['C', 'B', 'B+', 'A', 'A+'].map((rank) => [rank, candidate.records.filter((record) => record.capability_rank === rank).length]));
const detailStatusCounts = Object.fromEntries(['available', 'not_published', 'source_error'].map((status) => [status, candidate.records.filter((record) => record.detail_observation?.status === status).length]));
const artifact = {
  schema_version: 'ireland-hri-official-window-candidates-v2', generated_at: generatedAt, country_id: 'ireland', authority_id: IRELAND_HRI_AUTHORITY_ID, racing_system_id: IRELAND_HRI_SYSTEM_ID, timezone: IRELAND_TIMEZONE, source_id: IRELAND_HRI_SOURCE_ID, detail_source_id: IRELAND_HRI_DETAIL_SOURCE_ID, collection_target_rank: 'best_available', raw_body_retained: false,
  discovery: { method: 'official_hri_annual_fixture_pdf_plus_monthly_racecards', schedule_source_id: IRELAND_HRI_SOURCE_ID, schedule_source_url: sourceUrl, detail_source_id: IRELAND_HRI_DETAIL_SOURCE_ID, detail_source_url: IRELAND_HRI_RACECARDS_URL, fixture_line_count: diagnostics.fixture_line_count, months_evaluated: months, rank_counts: rankCounts, detail_status_counts: detailStatusCounts },
  window: { start_date: startDate, end_date_exclusive: endDateExclusive, days, coverage_claim: 'official_annual_fixture_list_plus_racecard_detail_window', coverage_note: 'HRI annual fixtures provide meeting discovery. The official HRI racecard month endpoint is evaluated for every source month in the requested window; published race rows promote evidence to A, unpublished rows remain valid C with pending detail, and retrieval/parser failures remain explicit retry states.' },
  records: candidate.records,
  diagnostics: { ...diagnostics, racecard_months: racecardDiagnostics },
};
const absolute = path.resolve(output);
fs.mkdirSync(path.dirname(absolute), { recursive: true });
fs.writeFileSync(absolute, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({ output, source_url: sourceUrl, detail_source_url: IRELAND_HRI_RACECARDS_URL, start_date: startDate, end_date_exclusive: endDateExclusive, meetings_emitted: artifact.records.length, rank_counts: rankCounts, detail_status_counts: detailStatusCounts, racecard_months: racecardDiagnostics, unknown_venues: diagnostics.unknown_venues.length, parse_failures: diagnostics.parse_failures.length, collection_target_rank: artifact.collection_target_rank, coverage_claim: artifact.window.coverage_claim }));
