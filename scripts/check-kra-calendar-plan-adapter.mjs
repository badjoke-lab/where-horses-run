import assert from 'node:assert/strict';
import { loadKraRankCCandidate } from './timetable/kra-calendar-plan-adapter.mjs';

const first = loadKraRankCCandidate();
const second = loadKraRankCCandidate();
assert.deepEqual(first, second, 'KRA candidate generation must be deterministic');
assert.equal(first.schema_version, 'timetable-candidate-v1');
assert.equal(first.country_id, 'south-korea');
assert.equal(first.authority_id, 'korea-racing-authority');
assert.equal(first.source_id, 'kra-2026-racing-operation-overview');
assert.equal(first.candidate_window.start_date, '2026-08-07');
assert.equal(first.candidate_window.end_date_exclusive, '2026-09-07');
assert.equal(first.records.length, 32, 'expected 32 KRA meeting candidates');
assert.equal(first.review.status, 'pending');
assert.equal(first.review.reviewed_at, null);

const expectedVenueCounts = new Map([
  ['seoul-racecourse', 11],
  ['busan-gyeongnam-racecourse', 10],
  ['jeju-racecourse', 11]
]);
const actualVenueCounts = new Map();
const seen = new Set();
const forbiddenFragments = ['horse', 'jockey', 'trainer', 'odds', 'result', 'payout', 'prediction', 'stream', 'raw_html', 'raw_body'];

function walkKeys(value, trail = []) {
  if (Array.isArray(value)) return value.forEach((entry, index) => walkKeys(entry, [...trail, String(index)]));
  if (!value || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) {
    const normalized = key.toLowerCase();
    assert.ok(!forbiddenFragments.some((fragment) => normalized.includes(fragment)), `forbidden candidate key ${[...trail, key].join('.')}`);
    walkKeys(entry, [...trail, key]);
  }
}

for (const record of first.records) {
  assert.ok(!seen.has(record.meeting_id), `duplicate meeting ${record.meeting_id}`);
  seen.add(record.meeting_id);
  actualVenueCounts.set(record.racecourse_id, (actualVenueCounts.get(record.racecourse_id) ?? 0) + 1);
  assert.equal(record.capability_rank, 'C');
  assert.equal(record.racing_system_id, 'kra-national-racing-system');
  assert.equal(record.source.source_id, first.source_id);
  assert.equal(record.source.extraction_method, 'reviewed_snapshot');
  assert.equal(record.first_race_time_local, null);
  assert.equal(record.last_race_time_local, null);
  assert.deepEqual(record.timetable_rows, []);
  assert.equal(record.review_status, 'pending');
  assert.equal(record.country_id, 'south-korea');
  assert.equal(record.authority_id, 'korea-racing-authority');
  assert.equal(record.timezone, 'Asia/Seoul');
  assert.ok(record.date >= '2026-08-07' && record.date < '2026-09-07');
}
assert.deepEqual(actualVenueCounts, expectedVenueCounts);
assert.ok(first.records.some((record) => record.racecourse_id === 'seoul-racecourse' && record.date === '2026-08-17'));
assert.ok(first.records.some((record) => record.racecourse_id === 'jeju-racecourse' && record.date === '2026-08-17'));
assert.ok(!first.records.some((record) => record.racecourse_id === 'busan-gyeongnam-racecourse' && record.date === '2026-08-17'));
walkKeys(first);

console.log('KRA_CALENDAR_PLAN_ADAPTER: pass');
console.log(`CANDIDATE_MEETINGS: ${first.records.length}`);
console.log('VENUES: seoul-racecourse=11 busan-gyeongnam-racecourse=10 jeju-racecourse=11');
console.log('PROMOTION_CONTRACT_ALIGNMENT: kra-national-racing-system/reviewed_snapshot');
console.log('PUBLICATION_EFFECT: none');
