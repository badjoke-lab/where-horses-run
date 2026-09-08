import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  SOREC_ADAPTER_ID,
  SOREC_PROGRAMME_REUNION_URL,
  buildSorecRankCCandidate,
  parseSorecProgrammeReunionHtml,
  resolveSorecRacecourseId,
} from './timetable/sorec-programme-reunion-core.mjs';

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

const built = buildSorecRankCCandidate({
  html,
  checkedAt: '2026-09-09T12:00:00Z',
  startDate: '2026-09-05',
  endDateExclusive: '2026-09-10',
});
assert.equal(built.candidate.schema_version, 'timetable-candidate-v1');
assert.equal(built.candidate.adapter_id, SOREC_ADAPTER_ID);
assert.equal(built.candidate.source_id, 'sorec-programme-reunion');
assert.equal(built.candidate.records.length, 5);
for (const record of built.candidate.records) {
  assert.equal(record.country_id, 'morocco');
  assert.equal(record.authority_id, 'sorec');
  assert.equal(record.racing_system_id, 'sorec-racing-information-system');
  assert.equal(record.timezone, 'Africa/Casablanca');
  assert.equal(record.capability_rank, 'C');
  assert.equal(record.first_race_time_local, null);
  assert.equal(record.last_race_time_local, null);
  assert.deepEqual(record.timetable_rows, []);
  assert.equal(record.source.official_url, SOREC_PROGRAMME_REUNION_URL);
  assert.equal(record.review_status, 'needs_review');
}

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
console.log('RANK: C');
console.log('UNKNOWN_VENUE_FAIL_CLOSED: pass');
console.log('PARSE_FAILURE_FAIL_CLOSED: pass');
