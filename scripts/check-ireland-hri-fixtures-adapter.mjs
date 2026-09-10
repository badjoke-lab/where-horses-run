import fs from 'node:fs';
import assert from 'node:assert/strict';
import { buildIrelandHriCandidate, parseIrelandHriFixtureText, resolveIrelandHriRacecourseId } from './timetable/ireland-hri-fixtures-core.mjs';
import { deriveBestAvailableRank } from './timetable/best-available-rank.mjs';

const fixturePath = new URL('../data/fixtures/ireland-hri-fixture-list-observed-v1.txt', import.meta.url);
const text = fs.readFileSync(fixturePath, 'utf8');
const parsed = parseIrelandHriFixtureText(text, { startDate: '2026-09-10', endDateExclusive: '2026-10-10' });
assert.equal(parsed.unknown_venues.length, 0);
assert.equal(parsed.parse_failures.length, 0);
assert.equal(parsed.source_warnings.length, 1);
assert.deepEqual(parsed.source_warnings[0], {
  code: 'known_source_weekday_mismatch',
  date: '2026-10-04',
  source_weekday: 'Sat',
  calendar_weekday: 'Sun',
  venue_label: 'Curragh',
  reason: 'HRI 2026 Tipperary-change revision moved the Curragh fixture from 3 October to 4 October.',
});
assert.equal(parsed.records.length, 41);
assert.deepEqual(parsed.records[0], { date: '2026-09-10', venue_label: 'Laytown', racecourse_id: 'ireland--laytown', source_flags: ['E'] });
assert(parsed.records.some((row) => row.date === '2026-10-04' && row.racecourse_id === 'ireland--curragh'));
assert(!parsed.records.some((row) => row.date === '2026-10-03' && row.racecourse_id === 'ireland--curragh'));
assert.equal(parsed.records.at(-1).date, '2026-10-09');
assert.equal(parsed.records.at(-1).racecourse_id, 'ireland--dundalk');
assert.equal(resolveIrelandHriRacecourseId('Cork'), 'ireland--cork-mallow');
assert.equal(resolveIrelandHriRacecourseId('Down Royal'), 'ireland--down-royal');

const { candidate, diagnostics } = buildIrelandHriCandidate({ text, checkedAt: '2026-09-10T06:00:00Z', startDate: '2026-09-10', endDateExclusive: '2026-10-10' });
assert.equal(diagnostics.records_emitted, 41);
assert.equal(diagnostics.source_warnings.length, 1);
assert(candidate.records.every((record) => record.capability_rank === 'C'));
assert(candidate.records.every((record) => record.first_race_time_local === null && record.last_race_time_local === null));
assert(candidate.records.every((record) => record.timetable_rows.length === 0));
assert.equal(candidate.collection_target_rank, 'best_available');

const synthetic = structuredClone(candidate.records[0]);
synthetic.first_race_time_local = '13:20';
assert.equal(deriveBestAvailableRank(synthetic), 'B');
synthetic.last_race_time_local = '17:05';
assert.equal(deriveBestAvailableRank(synthetic), 'B+');
synthetic.timetable_rows = [{ label: 'Race 1', post_time_local: '13:20' }, { label: 'Race 2', post_time_local: '14:00' }];
assert.equal(deriveBestAvailableRank(synthetic), 'A');

const unexpectedMismatch = text.replace('Thu 10 Laytown (e)', 'Fri 10 Laytown (e)');
const unexpected = parseIrelandHriFixtureText(unexpectedMismatch, { startDate: '2026-09-10', endDateExclusive: '2026-09-11' });
assert(unexpected.parse_failures.some((failure) => failure.code === 'weekday_mismatch' && failure.date === '2026-09-10' && failure.venue_label === 'Laytown'));
assert(unexpected.parse_failures.some((failure) => failure.code === 'no_records_in_requested_window'));

console.log('IRELAND_HRI_FIXTURE_ADAPTER: pass');
