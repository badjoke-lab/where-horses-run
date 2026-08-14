import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const SCHEMA = 'tjk_current_future_candidate_batch.v1';
export const ENTRY_URL = 'https://www.tjk.org/TR/Kurumsal/Info/Page/GunlukYarisProgrami';
export const TIMEZONE = 'Europe/Istanbul';
const MAX_INDEX_PAGES = 14;

function decodeHtml(value) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function textContent(value) {
  return decodeHtml(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

export function extractAnchors(html) {
  const anchors = [];
  const pattern = /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(pattern)) {
    anchors.push({ href: decodeHtml(match[2].trim()), text: textContent(match[3]) });
  }
  return anchors;
}

export function turkeyDate(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const map = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

export function parseTjkDate(value) {
  if (!value) return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, day, month, year] = match;
  const iso = `${year}-${month}-${day}`;
  const check = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(check.getTime())) return null;
  if (check.toISOString().slice(0, 10) !== iso) return null;
  return iso;
}

function isTjkHost(url) {
  return url.protocol === 'https:' && url.hostname.toLowerCase() === 'www.tjk.org';
}

export function isProgrammeCityUrl(url) {
  return isTjkHost(url) && /\/Info\/Sehir\/GunlukYarisProgrami$/i.test(url.pathname);
}

function isProgrammeIndexUrl(url) {
  return isTjkHost(url) && /\/Info\/Page\/GunlukYarisProgrami$/i.test(url.pathname);
}

function dateFromUrl(url) {
  return parseTjkDate(url.searchParams.get('QueryParameter_Tarih'));
}

function domesticAnchor(anchor) {
  return anchor.text && !/\(\s*YD\s*\d*\s*\)/i.test(anchor.text) && anchor.text.toLocaleLowerCase('tr-TR') !== 'karma';
}

export function discoverFromIndexHtml(html, pageUrl, today) {
  const candidates = [];
  const futureIndexUrls = [];

  for (const anchor of extractAnchors(html)) {
    let url;
    try {
      url = new URL(anchor.href, pageUrl);
    } catch {
      continue;
    }

    const date = dateFromUrl(url);
    if (!date || date < today) continue;

    if (isProgrammeIndexUrl(url)) {
      futureIndexUrls.push(url.href);
      continue;
    }

    if (!isProgrammeCityUrl(url) || !domesticAnchor(anchor)) continue;
    const racecourse = url.searchParams.get('SehirAdi');
    const racecourseId = url.searchParams.get('SehirId');
    if (!racecourse || !racecourseId) continue;

    candidates.push({
      candidate_id: `tjk-${date}-${racecourseId}`,
      source: 'tjk',
      country: 'Turkey',
      date,
      racecourse,
      racecourse_source_id: racecourseId,
      source_url: url.href,
      provenance: {
        discovered_from: pageUrl,
        discovered_href: anchor.href,
        discovery_method: 'official_programme_index_anchor',
      },
    });
  }

  return { candidates, futureIndexUrls: [...new Set(futureIndexUrls)] };
}

async function fetchHtml(url, fetchImpl) {
  const response = await fetchImpl(url, {
    method: 'GET',
    redirect: 'follow',
    headers: { accept: 'text/html,application/xhtml+xml' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`TJK index fetch failed: HTTP ${response.status}`);
  return response.text();
}

export async function collectCandidateBatch({ fetchImpl = fetch, now = new Date(), entryUrl = ENTRY_URL } = {}) {
  const today = turkeyDate(now);
  const retrievedAt = now.toISOString();
  const queue = [entryUrl];
  const visited = new Set();
  const records = [];

  while (queue.length && visited.size < MAX_INDEX_PAGES) {
    const pageUrl = queue.shift();
    if (visited.has(pageUrl)) continue;
    visited.add(pageUrl);
    const html = await fetchHtml(pageUrl, fetchImpl);
    const discovered = discoverFromIndexHtml(html, pageUrl, today);
    records.push(...discovered.candidates);
    for (const nextUrl of discovered.futureIndexUrls) {
      if (!visited.has(nextUrl)) queue.push(nextUrl);
    }
  }

  const byId = new Map();
  for (const record of records) {
    if (!byId.has(record.candidate_id)) byId.set(record.candidate_id, record);
  }

  const candidates = [...byId.values()].sort((a, b) => a.date.localeCompare(b.date) || a.racecourse.localeCompare(b.racecourse, 'tr'));
  return {
    schema: SCHEMA,
    source: 'tjk',
    country: 'Turkey',
    timezone: TIMEZONE,
    entry_url: entryUrl,
    retrieved_at: retrievedAt,
    effective_today: today,
    raw_body_retained: false,
    disposition: {
      target: 'candidate_only',
      requires_review: true,
      canonical_write: false,
      public_write: false,
    },
    discovery: {
      method: 'official_programme_index_anchors_only',
      index_pages_fetched: visited.size,
    },
    candidates,
  };
}

function parseArgs(argv) {
  const outputArg = argv.find((arg) => arg.startsWith('--output='));
  const outputIndex = argv.indexOf('--output');
  const output = outputArg?.slice('--output='.length) || (outputIndex >= 0 ? argv[outputIndex + 1] : null);
  if (!output) throw new Error('Usage: node scripts/timetable/tjk-current-future-candidates.mjs --output <path>');
  return { output };
}

async function main() {
  const { output } = parseArgs(process.argv.slice(2));
  const artifact = await collectCandidateBatch();
  const absolute = path.resolve(output);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(JSON.stringify({ output, candidates: artifact.candidates.length, effective_today: artifact.effective_today }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
