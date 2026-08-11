import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const REVALIDATION_PATH = 'docs/timetable-source-tests/03-turkey/revalidation-2026-08-12.json';
const CURRENT_PAGE_PATH = '/TR/YarisSever/Info/Page/GunlukYarisProgrami';
const VENUE_DETAIL_PATH = '/TR/YarisSever/Info/Sehir/GunlukYarisProgrami';
const revalidation = JSON.parse(fs.readFileSync(REVALIDATION_PATH, 'utf8'));

function parseArgs(argv) {
  const index = argv.indexOf('--output');
  if (index === -1 || !argv[index + 1]) throw new Error('missing --output');
  return { output: path.resolve(argv[index + 1]) };
}

function formatDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  assert.ok(match, `invalid date: ${isoDate}`);
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function normalizeText(value) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#x130;|&#304;/gi, 'İ')
    .replace(/&#x131;|&#305;/gi, 'ı')
    .normalize('NFKC')
    .toLocaleLowerCase('tr-TR');
}

function visibleText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectRaceSchedule(html) {
  const text = visibleText(html);
  const byRace = new Map();
  const pattern = /(?:^|\s)0*([1-9]|1\d|2\d)\s*\.\s*(?:Koşu|Kosu|KOŞU)\s*:?[\s-]*([01]?\d|2[0-3])[.:]([0-5]\d)\b/giu;
  for (const match of text.matchAll(pattern)) {
    const raceNumber = Number(match[1]);
    const time = `${String(Number(match[2])).padStart(2, '0')}:${match[3]}`;
    if (!byRace.has(raceNumber)) byRace.set(raceNumber, new Set());
    byRace.get(raceNumber).add(time);
  }
  const conflicts = [];
  const schedule = [];
  for (const [raceNumber, times] of [...byRace.entries()].sort(([a], [b]) => a - b)) {
    if (times.size !== 1) {
      conflicts.push(raceNumber);
      continue;
    }
    schedule.push({ race_number: raceNumber, post_time_local: [...times][0] });
  }
  return { schedule, conflicts };
}

function extractLinks(html, baseUrl) {
  const decoded = html.replace(/&amp;/gi, '&');
  const urls = new Set();
  const pattern = /(?:href|data-url)\s*=\s*["']([^"']+)["']/giu;
  for (const match of decoded.matchAll(pattern)) {
    try {
      urls.add(new URL(match[1], baseUrl).toString());
    } catch {
      // Ignore malformed links.
    }
  }
  return [...urls];
}

function makeLandingUrl(target) {
  const url = new URL(revalidation.official_sources.daily_programme_landing);
  url.searchParams.set('QueryParameter_Tarih', formatDate(revalidation.current_observation.programme_date));
  url.searchParams.set('SehirAdi', target.racecourse);
  url.searchParams.set('SehirId', target.city_id);
  return url;
}

function findVenueDetailLink(links, target) {
  const date = formatDate(revalidation.current_observation.programme_date);
  const venue = target.racecourse.normalize('NFKC').toLocaleLowerCase('tr-TR');
  return links.find((value) => {
    const url = new URL(value);
    return url.pathname.toLocaleLowerCase('tr-TR') === VENUE_DETAIL_PATH.toLocaleLowerCase('tr-TR')
      && url.searchParams.get('SehirId') === String(target.city_id)
      && url.searchParams.get('QueryParameter_Tarih') === date
      && (url.searchParams.get('SehirAdi') ?? '').normalize('NFKC').toLocaleLowerCase('tr-TR') === venue;
  }) ?? null;
}

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'WhereHorsesRun-source-verification/1.0',
    },
  });
  const body = await response.text();
  return { response, body, finalUrl: new URL(response.url) };
}

function safeMeta(fetchResult) {
  return {
    final_url: fetchResult.response.url,
    http_status: fetchResult.response.status,
    content_type: fetchResult.response.headers.get('content-type') ?? '',
    response_bytes: Buffer.byteLength(fetchResult.body, 'utf8'),
    body_sha256: crypto.createHash('sha256').update(fetchResult.body).digest('hex'),
  };
}

async function probeTarget(target) {
  const landingUrl = makeLandingUrl(target);
  const landing = await fetchText(landingUrl);
  const landingLinks = extractLinks(landing.body, landing.finalUrl);
  const detailLink = findVenueDetailLink(landingLinks, target);
  const venue = target.racecourse.normalize('NFKC').toLocaleLowerCase('tr-TR');
  const landingVerified = landing.response.ok
    && landing.finalUrl.pathname.toLocaleLowerCase('tr-TR') === CURRENT_PAGE_PATH.toLocaleLowerCase('tr-TR')
    && normalizeText(landing.body).includes(venue)
    && detailLink !== null;

  let detail = null;
  if (detailLink) {
    const fetched = await fetchText(new URL(detailLink));
    const detected = detectRaceSchedule(fetched.body);
    const scheduleMatches = detected.conflicts.length === 0
      && JSON.stringify(detected.schedule) === JSON.stringify(target.race_schedule);
    detail = {
      ...safeMeta(fetched),
      requested_url: detailLink,
      race_schedule: detected.schedule,
      race_schedule_conflicts: detected.conflicts,
      route_verified: fetched.response.ok
        && fetched.finalUrl.pathname.toLocaleLowerCase('tr-TR') === VENUE_DETAIL_PATH.toLocaleLowerCase('tr-TR')
        && fetched.finalUrl.searchParams.get('SehirId') === String(target.city_id)
        && normalizeText(fetched.body).includes(venue),
      schedule_matches_reviewed_evidence: scheduleMatches,
      verified: fetched.response.ok && scheduleMatches,
    };
  }

  return {
    racecourse: target.racecourse,
    city_id: String(target.city_id),
    programme_date: revalidation.current_observation.programme_date,
    expected_race_count: target.race_count,
    expected_first_post_time_local: target.first_post_time_local,
    expected_last_post_time_local: target.last_post_time_local,
    landing: {
      ...safeMeta(landing),
      requested_url: landingUrl.toString(),
      current_venue_detail_link_present: detailLink !== null,
      verified: landingVerified,
    },
    venue_detail: detail,
    verified: landingVerified && detail?.verified === true,
  };
}

const { output } = parseArgs(process.argv.slice(2));
assert.equal(revalidation.schema_version, 'tjk-source-revalidation-v2');
assert.equal(revalidation.status, 'verified_with_page_discovered_venue_detail');
assert.equal(revalidation.public_ceiling, 'A');
assert.equal(revalidation.current_observation.parameterized_daily_body_verified, true);
assert.equal(revalidation.route_topology.landing_route, CURRENT_PAGE_PATH);
assert.equal(revalidation.route_topology.venue_detail_route, VENUE_DETAIL_PATH);
assert.equal(revalidation.current_observation.meetings.length, 2);
assert.deepEqual(revalidation.current_observation.meetings.map((row) => [row.racecourse, row.city_id, row.race_count]), [
  ['Ankara', '5', 9],
  ['Kocaeli', '9', 9],
]);

const repoRoot = path.resolve('.');
assert.ok(!output.startsWith(`${repoRoot}${path.sep}`), 'probe output must stay outside repository');
fs.mkdirSync(path.dirname(output), { recursive: true });

const results = [];
for (const target of revalidation.current_observation.meetings) results.push(await probeTarget(target));

const summary = {
  schema_version: 'tjk-current-programme-probe-v1',
  source_revalidation: REVALIDATION_PATH,
  authority_id: revalidation.authority_id,
  programme_date: revalidation.current_observation.programme_date,
  repository_write: false,
  canonical_write: false,
  public_projection_write: false,
  raw_body_retained: false,
  results,
  all_verified: results.every((result) => result.verified),
};
fs.writeFileSync(output, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
if (!summary.all_verified) process.exit(1);
