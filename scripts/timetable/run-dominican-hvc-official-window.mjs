import fs from 'node:fs';
import path from 'node:path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import {
  HVC_AUTHORITY_ID,
  HVC_PANFLETOS_URL,
  HVC_SOURCE_ID,
  HVC_SYSTEM_ID,
  HVC_TIMEZONE,
  buildHvcMeetingRecord,
  parseHvcPanfletosIndex,
  parseHvcPanfletoText,
} from './dominican-hvc-core.mjs';

function arg(name, fallback = null) {
  const prefix = '--' + name + '=';
  const value = process.argv.find((item) => item.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
}

function plusDays(date, count) {
  const value = new Date(date + 'T00:00:00Z');
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}

function localDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: HVC_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return values.year + '-' + values.month + '-' + values.day;
}

function monthKeysBetween(start, endExclusive) {
  const output = [];
  const value = new Date(start.slice(0, 7) + '-01T00:00:00Z');
  const end = new Date(endExclusive + 'T00:00:00Z');
  while (value < end) {
    output.push({ year: value.getUTCFullYear(), month: value.getUTCMonth() + 1 });
    value.setUTCMonth(value.getUTCMonth() + 1);
  }
  return output;
}

function write(file, value) {
  const target = path.resolve(file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(value, null, 2) + '\n');
}

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
      accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5',
      'accept-language': 'es-DO,es;q=0.9,en;q=0.6',
    },
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  return { text: await response.text(), url: response.url || url };
}

async function fetchPdfText(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)',
      accept: 'application/pdf,*/*;q=0.8',
      'accept-language': 'es-DO,es;q=0.9,en;q=0.6',
    },
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length < 4 || String.fromCharCode(...bytes.slice(0, 4)) !== '%PDF') {
    throw new Error('HVC Panfleto response is not PDF');
  }
  const pdf = await getDocument({ data: bytes, disableWorker: true }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.filter((item) => 'str' in item).map((item) => item.str).join(' '));
  }
  return pages.join(' ');
}

function rankCounts(records) {
  return Object.fromEntries(['C', 'B', 'B+', 'A', 'A+'].map((rank) => [rank, records.filter((record) => record.capability_rank === rank).length]));
}

function completionCounts(records) {
  return Object.fromEntries(
    ['promoted', 'complete_current_best_available', 'pending_publication', 'retry_required', 'implementation_gap', 'not_applicable']
      .map((name) => [name, records.filter((record) => record.acquisition_completion?.disposition === name).length]),
  );
}

const output = arg('output');
const days = Number(arg('days', '30'));
const start = arg('as-of', localDate());
if (!output) throw new Error('--output=<path> is required');
if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) throw new Error('--as-of must be YYYY-MM-DD');
if (!Number.isInteger(days) || days < 1 || days > 62) throw new Error('--days must be 1..62');
const end = plusDays(start, days);
const generatedAt = new Date().toISOString();

const sourceErrors = [];
const parseFailures = [];
const sourceWarnings = [];
let rows = [];
let indexUrl = HVC_PANFLETOS_URL;
const documents = [];

try {
  const index = await fetchText(HVC_PANFLETOS_URL);
  indexUrl = index.url;
  const links = parseHvcPanfletosIndex(index.text, { baseUrl: index.url });
  for (const monthKey of monthKeysBetween(start, end)) {
    const link = links.find((item) => item.year === monthKey.year && item.month === monthKey.month);
    if (!link) {
      sourceWarnings.push({ code: 'monthly_panfleto_not_published', year: monthKey.year, month: monthKey.month });
      continue;
    }
    try {
      const text = await fetchPdfText(link.url);
      const parsed = parseHvcPanfletoText(text, { sourceUrl: link.url });
      rows.push(...parsed);
      documents.push({ year: monthKey.year, month: monthKey.month, url: link.url, meetings: parsed.length });
    } catch (error) {
      parseFailures.push({
        year: monthKey.year,
        month: monthKey.month,
        source_url: link.url,
        error: String(error?.message ?? error),
      });
    }
  }
} catch (error) {
  sourceErrors.push({
    stage: 'hvc_panfletos_index',
    source_url: HVC_PANFLETOS_URL,
    error: String(error?.message ?? error),
  });
}

rows = [...new Map(
  rows
    .filter((row) => row.date >= start && row.date < end)
    .map((row) => [row.date + '|' + row.racecourse_id, row]),
).values()].sort((a, b) => a.date.localeCompare(b.date));

const records = rows.map((row) => buildHvcMeetingRecord(row, { checkedAt: generatedAt }));
const attemptStatus = sourceErrors.length ? 'network_error' : (parseFailures.length ? 'partial_success' : 'success');

const artifact = {
  schema_version: 'dominican-hvc-official-window-candidates-v1',
  generated_at: generatedAt,
  country_id: 'dominican-republic',
  authority_id: HVC_AUTHORITY_ID,
  racing_system_id: HVC_SYSTEM_ID,
  timezone: HVC_TIMEZONE,
  source_id: HVC_SOURCE_ID,
  collection_target_rank: 'best_available',
  raw_body_retained: false,
  acquisition_attempt: {
    attempted_at: generatedAt,
    status: attemptStatus,
    source_id: HVC_SOURCE_ID,
    route_id: 'hvc-panfletos-monthly-pdf',
    error_code: sourceErrors.length ? 'panfletos_index_fetch_failed' : (parseFailures.length ? 'monthly_panfleto_parse_failed' : null),
  },
  discovery: {
    method: 'official_panfletos_index_plus_monthly_pdf',
    index_url: indexUrl,
    documents,
    rank_counts: rankCounts(records),
    completion_counts: completionCounts(records),
  },
  window: {
    start_date: start,
    end_date_exclusive: end,
    days,
    coverage_claim: sourceErrors.length
      ? 'acquisition_failed_preserve_verified_state'
      : 'official_monthly_panfleto_source_visible_horizon',
    coverage_note: 'Official monthly HVC Panfletos define source-visible meeting dates for Hipódromo V Centenario. Missing future monthly material is not evidence of non-running. No race times are inferred.',
  },
  records,
  diagnostics: {
    source_errors: sourceErrors,
    parse_failures: parseFailures,
    unknown_venues: [],
    source_warnings: sourceWarnings,
  },
};

write(output, artifact);
console.log(JSON.stringify({
  output,
  start_date: start,
  end_date_exclusive: end,
  documents,
  meetings_emitted: records.length,
  dates: records.map((record) => record.date),
  rank_counts: rankCounts(records),
  completion_counts: completionCounts(records),
  source_errors: sourceErrors.length,
  parse_failures: parseFailures.length,
  source_warnings: sourceWarnings.length,
  raw_body_retained: false,
}));
