import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const REVALIDATION_PATH = 'docs/timetable-source-tests/03-turkey/revalidation-2026-08-11.json';
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

function detectRaceMarkers(html) {
  const markers = new Set();
  const expressions = [
    /(?:^|[>\s])([1-9]|1\d|2\d)\.\s*Koşu/giu,
    /(?:^|[>\s])([1-9]|1\d|2\d)\.\s*Kosu/giu,
  ];
  for (const expression of expressions) {
    for (const match of html.matchAll(expression)) markers.add(Number(match[1]));
  }
  return [...markers].sort((a, b) => a - b);
}

async function probeTarget(baseUrl, target) {
  const url = new URL(baseUrl);
  url.searchParams.set('QueryParameter_Tarih', formatTjkDate(revalidation.current_observation.annual_observation_date));
  url.searchParams.set('SehirAdi', target.racecourse);
  url.searchParams.set('SehirId', target.city_id);

  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'WhereHorsesRun-source-verification/1.0',
    },
  });
  const body = await response.text();
  const finalUrl = new URL(response.url);
  const normalized = normalizeText(body);
  const requestedVenue = target.racecourse.normalize('NFKC').toLocaleLowerCase('tr-TR');
  const dotDate = formatDotDate(revalidation.current_observation.annual_observation_date);
  const slashDate = formatTjkDate(revalidation.current_observation.annual_observation_date);
  const contentType = response.headers.get('content-type') ?? '';
  const raceMarkers = detectRaceMarkers(body);

  const checks = {
    http_ok: response.ok,
    html_response: contentType.toLowerCase().includes('text/html'),
    official_host: finalUrl.hostname === 'www.tjk.org' || finalUrl.hostname === 'tjk.org',
    current_route: finalUrl.pathname === '/TR/YarisSever/Info/Page/GunlukYarisProgrami',
    requested_city_id_preserved: finalUrl.searchParams.get('SehirId') === String(target.city_id),
    requested_city_name_present: normalized.includes(requestedVenue),
    requested_date_present: body.includes(dotDate) || body.includes(slashDate),
    programme_marker_present: /Yarış Programı|Yaris Programi/iu.test(body),
    nontrivial_body: Buffer.byteLength(body, 'utf8') > 10_000,
  };

  return {
    racecourse: target.racecourse,
    city_id: String(target.city_id),
    observation_date: revalidation.current_observation.annual_observation_date,
    expected_annual_race_rows: target.race_rows,
    requested_url: url.toString(),
    final_url: response.url,
    http_status: response.status,
    content_type: contentType,
    response_bytes: Buffer.byteLength(body, 'utf8'),
    body_sha256: crypto.createHash('sha256').update(body).digest('hex'),
    race_markers_detected: raceMarkers,
    checks,
    verified: Object.values(checks).every(Boolean),
  };
}

const { output } = parseArgs(process.argv.slice(2));
assert.equal(revalidation.status, 'verified_with_route_change');
assert.equal(revalidation.official_sources.daily_programme_current, 'https://www.tjk.org/TR/YarisSever/Info/Page/GunlukYarisProgrami');
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

const targets = revalidation.current_observation.annual_meetings_observed;
const results = [];
for (const target of targets) {
  results.push(await probeTarget(revalidation.official_sources.daily_programme_current, target));
}

const summary = {
  schema_version: 'tjk-parameterized-body-probe-v1',
  source_revalidation: REVALIDATION_PATH,
  source_id: 'tjk-daily-programme',
  authority_id: 'turkiye-jokey-kulubu',
  observation_date: revalidation.current_observation.annual_observation_date,
  probe_scope: 'parameterized-body-verification-only',
  repository_write: false,
  canonical_write: false,
  public_projection_write: false,
  raw_body_retained: false,
  results,
  all_verified: results.every((result) => result.verified),
};

fs.writeFileSync(output, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));

if (!summary.all_verified) {
  console.error('TJK parameterized body verification did not pass for every reviewed target.');
  process.exit(1);
}
