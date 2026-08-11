import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const REVALIDATION_PATH = 'docs/timetable-source-tests/03-turkey/revalidation-2026-08-11.json';
const CURRENT_PAGE_PATH = '/TR/YarisSever/Info/Page/GunlukYarisProgrami';
const CURRENT_DATA_PATH = '/TR/YarisSever/Info/Data/GunlukYarisProgrami';
const revalidation = JSON.parse(fs.readFileSync(REVALIDATION_PATH, 'utf8'));

function parseArgs(argv) {
  const outputIndex = argv.indexOf('--output');
  if (outputIndex === -1 || !argv[outputIndex + 1]) {
    throw new Error('Usage: node scripts/timetable/tjk-parameterized-body-probe.mjs --output /tmp/.../summary.json');
  }
  return { output: path.resolve(argv[outputIndex + 1]) };
}

function formatTjkDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  assert.ok(match, `invalid ISO date: ${isoDate}`);
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function formatDotDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  assert.ok(match, `invalid ISO date: ${isoDate}`);
  return `${match[3]}.${match[2]}.${match[1]}`;
}

function normalizeText(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#x130;|&#304;/gi, 'İ')
    .replace(/&#x131;|&#305;/gi, 'ı')
    .replace(/&amp;/gi, '&')
    .normalize('NFKC')
    .toLocaleLowerCase('tr-TR');
}

function detectRaceMarkers(body) {
  const markers = new Set();
  const expressions = [
    /(?:^|[>\s"'])0*([1-9]|1\d|2\d)\s*\.\s*(?:Koşu|Kosu|KOŞU)/giu,
    /(?:Koşu|Kosu|KOŞU)\s*(?:No|Numarası|Numarasi)?\s*[:=-]?\s*0*([1-9]|1\d|2\d)/giu,
    /(?:race|kosu|koşu)(?:No|Number|Numarasi|Numarası|Id)?["']?\s*[:=]\s*["']?0*([1-9]|1\d|2\d)/giu,
  ];
  for (const expression of expressions) {
    for (const match of body.matchAll(expression)) markers.add(Number(match[1]));
  }
  return [...markers].sort((a, b) => a - b);
}

function detectTimeTokens(body) {
  return [...new Set([...body.matchAll(/\b(?:[01]\d|2[0-3]):[0-5]\d\b/g)].map((match) => match[0]))].sort();
}

function extractEndpointHints(html, pageUrl) {
  const decoded = html.replace(/&amp;/gi, '&').replace(/\\\//g, '/');
  const candidates = new Set();
  const expressions = [
    /https?:\/\/[^"'<>\s]+/giu,
    /\/TR\/YarisSever\/[^"'<>\s]+/giu,
  ];
  for (const expression of expressions) {
    for (const match of decoded.matchAll(expression)) {
      const raw = match[0].replace(/[),;]+$/g, '');
      if (!/(Gunluk|YarisProgram|YarışProgram|Query\/Data|Info\/Data|Programi)/iu.test(raw)) continue;
      try {
        candidates.add(new URL(raw, pageUrl).toString());
      } catch {
        // Ignore malformed hints.
      }
    }
  }
  return [...candidates].sort().slice(0, 50);
}

function withTargetParameters(baseUrl, target, extra = {}) {
  const url = new URL(baseUrl);
  url.searchParams.set('QueryParameter_Tarih', formatTjkDate(revalidation.current_observation.annual_observation_date));
  url.searchParams.set('SehirAdi', target.racecourse);
  url.searchParams.set('SehirId', target.city_id);
  for (const [key, value] of Object.entries(extra)) url.searchParams.set(key, value);
  return url;
}

async function fetchBody(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
      'user-agent': 'WhereHorsesRun-source-verification/1.0',
      'x-requested-with': 'XMLHttpRequest',
    },
  });
  const body = await response.text();
  return { response, body, finalUrl: new URL(response.url) };
}

function safeResponseSummary({ response, body, finalUrl }, expectedPath, target) {
  const raceMarkers = detectRaceMarkers(body);
  const timeTokens = detectTimeTokens(body);
  const contentType = response.headers.get('content-type') ?? '';
  const normalized = normalizeText(body);
  const requestedVenue = target.racecourse.normalize('NFKC').toLocaleLowerCase('tr-TR');
  const expectedRaceMarkers = Array.from({ length: target.race_rows }, (_, index) => index + 1);
  const contiguousExpectedRaces = raceMarkers.length === expectedRaceMarkers.length
    && raceMarkers.every((raceNumber, index) => raceNumber === expectedRaceMarkers[index]);
  const checks = {
    http_ok: response.ok,
    official_host: finalUrl.hostname === 'www.tjk.org' || finalUrl.hostname === 'tjk.org',
    expected_route: finalUrl.pathname === expectedPath,
    city_id_preserved: finalUrl.searchParams.get('SehirId') === String(target.city_id),
    venue_present: normalized.includes(requestedVenue),
    nonempty_body: Buffer.byteLength(body, 'utf8') > 500,
  };
  return {
    requested_url: null,
    final_url: response.url,
    http_status: response.status,
    content_type: contentType,
    response_bytes: Buffer.byteLength(body, 'utf8'),
    body_sha256: crypto.createHash('sha256').update(body).digest('hex'),
    race_markers_detected: raceMarkers,
    time_tokens_detected: timeTokens,
    checks,
    route_verified: Object.values(checks).every(Boolean),
    complete_race_1_n_verified: contiguousExpectedRaces,
  };
}

async function probeTarget(pageBaseUrl, target) {
  const pageUrl = withTargetParameters(pageBaseUrl, target);
  const pageFetch = await fetchBody(pageUrl);
  const pageNormalized = normalizeText(pageFetch.body);
  const pageSummary = safeResponseSummary(pageFetch, CURRENT_PAGE_PATH, target);
  pageSummary.requested_url = pageUrl.toString();
  pageSummary.date_present = pageFetch.body.includes(formatDotDate(revalidation.current_observation.annual_observation_date))
    || pageFetch.body.includes(formatTjkDate(revalidation.current_observation.annual_observation_date));
  pageSummary.programme_marker_present = /Yarış Programı|Yaris Programi/iu.test(pageFetch.body);
  pageSummary.endpoint_hints = extractEndpointHints(pageFetch.body, pageFetch.finalUrl);
  pageSummary.data_endpoint_hint_present = pageSummary.endpoint_hints.some((hint) => new URL(hint).pathname === CURRENT_DATA_PATH);
  pageSummary.shell_verified = pageSummary.route_verified
    && pageSummary.date_present
    && pageSummary.programme_marker_present
    && pageSummary.data_endpoint_hint_present;

  const dataBaseUrl = new URL(CURRENT_DATA_PATH, pageFetch.finalUrl.origin);
  const variants = [
    { id: 'same-parameters', extra: {} },
    { id: 'same-parameters-era-today', extra: { Era: 'today' } },
  ];
  const dataAttempts = [];
  for (const variant of variants) {
    const dataUrl = withTargetParameters(dataBaseUrl, target, variant.extra);
    const dataFetch = await fetchBody(dataUrl);
    const summary = safeResponseSummary(dataFetch, CURRENT_DATA_PATH, target);
    summary.requested_url = dataUrl.toString();
    summary.variant = variant.id;
    summary.date_present = dataFetch.body.includes(formatDotDate(revalidation.current_observation.annual_observation_date))
      || dataFetch.body.includes(formatTjkDate(revalidation.current_observation.annual_observation_date));
    summary.programme_body_verified = summary.route_verified && summary.complete_race_1_n_verified;
    dataAttempts.push(summary);
  }

  const successfulDataAttempt = dataAttempts.find((attempt) => attempt.programme_body_verified) ?? null;
  return {
    racecourse: target.racecourse,
    city_id: String(target.city_id),
    observation_date: revalidation.current_observation.annual_observation_date,
    expected_annual_race_rows: target.race_rows,
    page: pageSummary,
    data_attempts: dataAttempts,
    programme_data_verified: successfulDataAttempt !== null,
    successful_data_variant: successfulDataAttempt?.variant ?? null,
    verified: pageSummary.shell_verified && successfulDataAttempt !== null,
    page_contains_requested_venue: pageNormalized.includes(target.racecourse.normalize('NFKC').toLocaleLowerCase('tr-TR')),
  };
}

const { output } = parseArgs(process.argv.slice(2));
assert.equal(revalidation.status, 'verified_with_route_change');
assert.equal(new URL(revalidation.official_sources.daily_programme_current).pathname, CURRENT_PAGE_PATH);
assert.equal(revalidation.current_observation.current_day_daily_body_verified, false, 'probe should only run while the parameterized body remains unverified');
assert.equal(revalidation.current_observation.annual_observation_date, '2026-08-11');
assert.deepEqual(
  revalidation.current_observation.annual_meetings_observed.map(({ racecourse, city_id, race_rows }) => ({ racecourse, city_id, race_rows })),
  [
    { racecourse: 'Ankara', city_id: '5', race_rows: 7 },
    { racecourse: 'Kocaeli', city_id: '9', race_rows: 8 },
  ],
  'unexpected TJK revalidation probe targets',
);

const repoRoot = path.resolve('.');
assert.ok(!output.startsWith(`${repoRoot}${path.sep}`), 'TJK live probe output must stay outside the repository');
fs.mkdirSync(path.dirname(output), { recursive: true });

const results = [];
for (const target of revalidation.current_observation.annual_meetings_observed) {
  results.push(await probeTarget(revalidation.official_sources.daily_programme_current, target));
}

const summary = {
  schema_version: 'tjk-parameterized-body-probe-v2',
  source_revalidation: REVALIDATION_PATH,
  source_id: 'tjk-daily-programme',
  authority_id: 'turkiye-jokey-kulubu',
  observation_date: revalidation.current_observation.annual_observation_date,
  discovered_data_path: CURRENT_DATA_PATH,
  probe_scope: 'parameterized-page-and-data-verification',
  repository_write: false,
  canonical_write: false,
  public_projection_write: false,
  raw_body_retained: false,
  results,
  all_page_shells_verified: results.every((result) => result.page.shell_verified),
  all_programme_data_verified: results.every((result) => result.programme_data_verified),
  all_verified: results.every((result) => result.verified),
};

fs.writeFileSync(output, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));

if (!summary.all_verified) {
  console.error('TJK current page shell was verified, but complete Race 1-N programme data was not verified for every reviewed target.');
  process.exit(1);
}
