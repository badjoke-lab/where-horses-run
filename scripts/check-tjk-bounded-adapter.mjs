import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadTjkBoundedCandidate } from './timetable/tjk-bounded-adapter.mjs';

const committed = JSON.parse(fs.readFileSync('data/candidates/tjk-bounded-reviewed-fixture-v1.json', 'utf8'));
const first = loadTjkBoundedCandidate();
const second = loadTjkBoundedCandidate();

assert.deepEqual(first, second, 'TJK bounded adapter must be deterministic');
assert.deepEqual(first, committed, 'committed TJK candidate differs from deterministic adapter output');
assert.equal(first.schema_version, 'timetable-candidate-v1');
assert.equal(first.adapter_id, 'tjk-bounded-reviewed-fixture-v1');
assert.equal(first.country_id, 'turkey');
assert.equal(first.authority_id, 'turkiye-jokey-kulubu');
assert.equal(first.source_id, 'tjk-daily-programme');
assert.equal(first.technical_capability_rank, 'A+');
assert.equal(first.publication_ceiling, 'A');
assert.equal(first.publication_effect, 'none');
assert.equal(first.review.status, 'pending');
assert.equal(first.review.promotion_target, 'separate-human-reviewed-unit');
assert.equal(first.records.length, 3, 'expected three bounded fixture meetings');
assert.equal(first.fixture_evidence.race_count, 23, 'expected 23 bounded fixture races');

const expectedCounts = new Map([
  ['adana-racecourse', 7],
  ['antalya-racecourse', 9],
  ['izmir-racecourse', 7],
]);
const forbiddenKeyFragments = [
  'horse', 'runner', 'participant', 'jockey', 'trainer', 'weight', 'odds', 'bet',
  'result', 'payout', 'prediction', 'stream', 'raw_html', 'raw_body', 'full_racecard',
];

function walkKeys(value, trail = []) {
  if (Array.isArray(value)) return value.forEach((entry, index) => walkKeys(entry, [...trail, String(index)]));
  if (!value || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) {
    const normalized = key.toLowerCase();
    assert.ok(!forbiddenKeyFragments.some((fragment) => normalized.includes(fragment)), `forbidden TJK candidate key: ${[...trail, key].join('.')}`);
    walkKeys(entry, [...trail, key]);
  }
}

const seen = new Set();
for (const record of first.records) {
  assert.ok(!seen.has(record.meeting_id), `duplicate TJK meeting_id: ${record.meeting_id}`);
  seen.add(record.meeting_id);
  assert.equal(record.country_id, 'turkey');
  assert.equal(record.authority_id, 'turkiye-jokey-kulubu');
  assert.equal(record.racing_system_id, 'tjk-national-racing-system');
  assert.equal(record.timezone, 'Europe/Istanbul');
  assert.equal(record.capability_rank, 'A+', 'reviewed fixed-three fixture should retain technical A+ capability');
  assert.equal(record.publication_ceiling, 'A', 'candidate public ceiling must remain A');
  assert.equal(record.review_status, 'pending');
  assert.equal(record.source.source_id, 'tjk-daily-programme');
  assert.equal(record.source.extraction_method, 'reviewed_deterministic_fixture');
  assert.ok(record.source.official_url.includes('/TR/YarisSever/Info/Page/GunlukYarisProgrami?'), 'candidate must use current TJK Info/Page route');
  assert.ok(!record.source.official_url.includes('/Info/Sehir/'), 'superseded TJK Info/Sehir route leaked into candidate');
  const url = new URL(record.source.official_url);
  for (const parameter of ['SehirId', 'QueryParameter_Tarih', 'SehirAdi']) {
    assert.ok(url.searchParams.has(parameter), `missing TJK daily parameter ${parameter}`);
  }
  assert.equal(record.timetable_rows.length, expectedCounts.get(record.racecourse_id), `unexpected race count for ${record.racecourse_id}`);
  record.timetable_rows.forEach((row, index) => {
    assert.equal(row.race_number, index + 1, `non-contiguous Race 1-N for ${record.meeting_id}`);
    assert.match(row.post_time_local, /^\d{2}:\d{2}$/, `invalid post time for ${record.meeting_id}`);
    assert.ok(Number.isInteger(row.distance_m) && row.distance_m > 0, `invalid distance for ${record.meeting_id}`);
    assert.ok(typeof row.surface === 'string' && row.surface.length > 0, `missing surface for ${record.meeting_id}`);
  });
  assert.equal(record.first_race_time_local, record.timetable_rows[0].post_time_local);
  assert.equal(record.last_race_time_local, record.timetable_rows.at(-1).post_time_local);
}
walkKeys(first);

const serialized = JSON.stringify(first).toLowerCase();
for (const fragment of ['/info/sehir/', 'raw_html', 'raw_body', 'direct_stream_url']) {
  assert.ok(!serialized.includes(fragment), `forbidden TJK candidate content: ${fragment}`);
}

console.log('TJK_BOUNDED_ADAPTER: pass');
console.log('CANDIDATE_MEETINGS: 3');
console.log('CANDIDATE_RACES: 23');
console.log('TECHNICAL_CAPABILITY: A+');
console.log('PUBLIC_CEILING: A');
console.log('PUBLICATION_EFFECT: none');
