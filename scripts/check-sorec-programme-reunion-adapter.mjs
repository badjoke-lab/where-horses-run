import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  SOREC_ADAPTER_ID,
  SOREC_PROGRAMME_REUNION_URL,
  buildSorecProgrammeCandidate,
  parseSorecProgrammeReunionHtml,
  resolveSorecRacecourseId,
} from './timetable/sorec-programme-reunion-core.mjs';
import { deriveBestAvailableRank } from './timetable/best-available-rank.mjs';

const fixturePath = 'data/fixtures/sorec-programme-reunion-observed-table-v1.html';
const html = fs.readFileSync(fixturePath, 'utf8');

const expectedVenues = new Map([
  ['Casablanca', 'casablanca-anfa-racecourse'],
  ['Meknes', 'meknes-racecourse'],
  ['Meknès', 'meknes-racecourse'],
  ['Marrakech', 'marrakech-racecourse'],
  ['Rabat', 'rabat-racecourse'],
  ['Settat', 'settat-racecourse'],
  ['El jadida', 'el-jadida-racecourse'],
  ['Khemisset', 'khemisset-racecourse'],
]);
for (const [label, racecourseId] of expectedVenues) assert.equal(resolveSorecRacecourseId(label), racecourseId, label);
assert.equal(resolveSorecRacecourseId('Unknown Venue'), null);

const parsed = parseSorecProgrammeReunionHtml(html, {
  startDate: '2026-08-30',
  endDateExclusive: '2026-09-10',
});
assert.equal(parsed.records.length, 7);
assert.equal(parsed.unknown_venues.length, 0);
assert.equal(parsed.parse_failures.length, 0);
assert.deepEqual(parsed.records.map((row) => row.date), [
  '2026-08-30',
  '2026-09-03',
  '2026-09-05',
  '2026-09-06',
  '2026-09-07',
  '2026-09-08',
  '2026-09-09',
]);

const built = buildSorecProgrammeCandidate({
  html,
  checkedAt: '2026-09-09T12:00:00Z',
  startDate: '2026-09-05',
  endDateExclusive: '2026-09-10',
});
assert.equal(built.candidate.schema_version, 'timetable-candidate-v1');
assert.equal(built.candidate.adapter_id, SOREC_ADAPTER_ID);
assert.equal(built.candidate.source_id, 'sorec-programme-reunion');
assert.equal(built.candidate.collection_target_rank, 'best_available');
assert.equal(built.candidate.records.length, 5);
for (const record of built.candidate.records) {
  assert.equal(record.country_id, 'morocco');
  assert.equal(record.authority_id, 'sorec');
  assert.equal(record.racing_system_id, 'sorec-racing-information-system');
  assert.equal(record.timezone, 'Africa/Casablanca');
  assert.equal(record.capability_rank, deriveBestAvailableRank(record, record.timetable_rows));
  assert.equal(record.first_race_time_local, null);
  assert.equal(record.last_race_time_local, null);
  assert.deepEqual(record.timetable_rows, []);
  assert.equal(record.source.official_url, SOREC_PROGRAMME_REUNION_URL);
  assert.equal(record.review_status, 'needs_review');
}

assert.equal(deriveBestAvailableRank({ first_race_time_local: '12:00', timetable_rows: [] }), 'B');
assert.equal(deriveBestAvailableRank({ first_race_time_local: '12:00', last_race_time_local: '17:00', timetable_rows: [] }), 'B+');
assert.equal(deriveBestAvailableRank({ timetable_rows: [
  { label: 'Race 1', post_time_local: '12:00' },
  { label: 'Race 2', post_time_local: '12:30' },
] }), 'A');

const coreSource = fs.readFileSync('scripts/timetable/sorec-programme-reunion-core.mjs', 'utf8');
const runnerSource = fs.readFileSync('scripts/timetable/run-sorec-official-window.mjs', 'utf8');
assert.match(coreSource, /deriveBestAvailableRank/, 'SOREC adapter must derive rank from evidence');
assert.doesNotMatch(coreSource, /buildSorecRankCCandidate|rank-c-v1|capability_rank:\s*['"]C['"]/, 'SOREC adapter must not hard-code a C rank');
assert.doesNotMatch(runnerSource, /public_rank_ceiling|capability_rank:\s*['"]C['"]/, 'SOREC runner must not impose a source-local public/rank ceiling');
assert.match(runnerSource, /collection_target_rank:\s*['"]best_available['"]/, 'SOREC runner must target best available rank');

const unknown = html.replace('<td>Khemisset</td>', '<td>Unmapped Official Venue</td>');
const unknownParsed = parseSorecProgrammeReunionHtml(unknown, {
  startDate: '2026-09-09',
  endDateExclusive: '2026-09-10',
});
assert.equal(unknownParsed.records.length, 0);
assert.deepEqual(unknownParsed.unknown_venues, [{ date: '2026-09-09', venue_label: 'Unmapped Official Venue' }]);

const missingVenue = html.replace('<tr><td>09/09/2026</td><td>Khemisset</td>', '<tr><td>09/09/2026</td><td></td>');
const missingParsed = parseSorecProgrammeReunionHtml(missingVenue, {
  startDate: '2026-09-09',
  endDateExclusive: '2026-09-10',
});
assert.equal(missingParsed.records.length, 0);
assert.deepEqual(missingParsed.parse_failures, [{ code: 'missing_venue', date: '2026-09-09' }]);

assert.throws(() => parseSorecProgrammeReunionHtml('<html>not the source</html>'), /fingerprint/);

console.log('SOREC_PROGRAMME_REUNION_ADAPTER: pass');
console.log(`FIXTURE_RECORDS: ${parsed.records.length}`);
console.log(`CURRENT_OBSERVATION_RANK: ${built.candidate.records[0]?.capability_rank ?? 'none'}`);
console.log('BEST_AVAILABLE_RANK_PATH: pass');
console.log('UNKNOWN_VENUE_FAIL_CLOSED: pass');
console.log('PARSE_FAILURE_FAIL_CLOSED: pass');
