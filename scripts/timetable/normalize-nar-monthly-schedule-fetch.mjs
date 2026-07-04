import fs from 'node:fs';
import path from 'node:path';

const nativeFetch = globalThis.fetch;
const root = process.cwd();
const reportPath = path.join(root, 'data/generated/timetable/nar-monthly-collection-report.json');
const matrixPath = path.join(root, 'data/static/nar-flat-racecourse-compatibility-v1.json');
const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
const flatVenueCodes = new Set(matrix.records.map((record) => record.venue_code));
let scheduleMeetingLinks = [];

function decodeEntitiesDeep(value) {
  let current = String(value ?? '');
  for (let i = 0; i < 3; i += 1) {
    const next = current
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>');
    if (next === current) break;
    current = next;
  }
  return current;
}

function queryValueCaseInsensitive(url, key) {
  const target = key.toLowerCase();
  for (const [name, value] of url.searchParams.entries()) {
    if (name.toLowerCase() === target) return value;
  }
  return null;
}

function extractRaceListLiterals(rawHtml) {
  const candidates = new Set();
  const patterns = [
    /(?:https?:\/\/www\.keiba\.go\.jp)?\/KeibaWeb\/TodayRaceInfo\/RaceList\?[^"'<>\s]+/gi,
    /(?:\.\.\/|\.\/|\/)?TodayRaceInfo\/RaceList\?[^"'<>\s]+/gi,
    /["']([^"']*RaceList\?[^"']+)["']/gi,
  ];

  for (const pattern of patterns) {
    for (const match of rawHtml.matchAll(pattern)) {
      const literal = decodeEntitiesDeep(match[1] ?? match[0]);
      try {
        const url = new URL(literal, 'https://www.keiba.go.jp/KeibaWeb/MonthlyConveneInfo/');
        if (!/\/TodayRaceInfo\/RaceList$/i.test(url.pathname)) continue;
        const venueCode = queryValueCaseInsensitive(url, 'k_babaCode')?.padStart(2, '0');
        const rawDate = queryValueCaseInsensitive(url, 'k_raceDate');
        if (!venueCode || !rawDate || !flatVenueCodes.has(venueCode)) continue;
        const date = rawDate.replaceAll('/', '-');
        const canonical = new URL('https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList');
        canonical.searchParams.set('k_babaCode', venueCode);
        canonical.searchParams.set('k_raceDate', date.replaceAll('-', '/'));
        candidates.add(canonical.toString());
      } catch {
        // Ignore malformed literals; the collector validates the canonicalized set.
      }
    }
  }

  return [...candidates].sort();
}

function requestedBoundary(argv) {
  let month = '2026-07';
  let throughDate = null;
  for (const value of argv) {
    if (/^\d{4}-\d{2}$/.test(value)) month = value;
    else if (value.startsWith('--month=')) month = value.slice('--month='.length);
    else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) throughDate = value;
    else if (value.startsWith('--through-date=')) throughDate = value.slice('--through-date='.length);
  }
  return { month, throughDate };
}

function linkDate(url) {
  return new URL(url).searchParams.get('k_raceDate')?.replaceAll('/', '-') ?? null;
}

const boundary = requestedBoundary(process.argv.slice(2));

globalThis.fetch = async (input, init) => {
  const response = await nativeFetch(input, init);
  const requestUrl = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
  if (!requestUrl.includes('/MonthlyConveneInfo/MonthlyConveneInfoTop')) return response;

  const body = Buffer.from(await response.arrayBuffer());
  const rawHtml = body.toString('latin1');
  scheduleMeetingLinks = extractRaceListLiterals(rawHtml)
    .filter((url) => {
      const date = linkDate(url);
      if (!date || !date.startsWith(boundary.month)) return false;
      return !boundary.throughDate || date <= boundary.throughDate;
    });

  const syntheticAnchors = scheduleMeetingLinks
    .map((url) => `<a href="${url.replaceAll('&', '&amp;')}"></a>`)
    .join('\n');
  const normalizedBody = Buffer.from(`<html><body>\n${syntheticAnchors}\n</body></html>\n`, 'utf8');
  const normalizedArrayBuffer = normalizedBody.buffer.slice(
    normalizedBody.byteOffset,
    normalizedBody.byteOffset + normalizedBody.byteLength,
  );

  return {
    ok: response.ok,
    status: response.status,
    url: response.url,
    arrayBuffer: async () => normalizedArrayBuffer,
  };
};

await import('./collect-nar-monthly-candidates.mjs');

if (!fs.existsSync(reportPath)) throw new Error('NAR monthly collection report was not written.');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
if (scheduleMeetingLinks.length > 0 && report.meetings_discovered === 0) {
  throw new Error(`Monthly schedule contains ${scheduleMeetingLinks.length} in-scope RaceList links inside the requested boundary, but collector discovered zero meetings.`);
}
if (report.meetings_discovered !== scheduleMeetingLinks.length) {
  throw new Error(`Monthly schedule link count mismatch: normalized=${scheduleMeetingLinks.length} collector=${report.meetings_discovered}.`);
}
console.log(`[nar-monthly] normalized in-scope schedule RaceList links: ${scheduleMeetingLinks.length}`);
