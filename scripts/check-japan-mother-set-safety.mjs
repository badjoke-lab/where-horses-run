import assert from 'node:assert/strict';
import { assessMotherSetCompleteness, mergeOfficialPositiveEvidence } from './timetable/japan-mother-set-safety.mjs';

const base = {
  meeting_id: 'nar-kawasaki-racecourse-2026-09-07',
  date: '2026-09-07',
  authority_id: 'nar-local-government-racing',
  racecourse_id: 'kawasaki-racecourse',
};
const merged = mergeOfficialPositiveEvidence(
  [{ ...base, source_id: 'nar-monthly-convene-info', venue_code: '21' }],
  [{ ...base, source_id: 'nankankeiba-south-kanto-calendar' }],
);
assert.equal(merged.length, 1);
assert.equal(merged[0].source_id, 'nar-monthly-convene-info');
assert.equal(merged[0].venue_code, '21');
assert.throws(() => mergeOfficialPositiveEvidence(
  [base],
  [{ ...base, racecourse_id: 'oi-racecourse' }],
), /identity conflict/);

const required = ['a', 'b'];
assert.equal(assessMotherSetCompleteness([
  { source_id: 'a', completeness: 'complete' },
  { source_id: 'b', completeness: 'complete' },
], required).complete, true);
const failed = assessMotherSetCompleteness([
  { source_id: 'a', completeness: 'complete' },
  { source_id: 'b', completeness: 'failed' },
], required);
assert.equal(failed.complete, false);
assert.deepEqual(failed.incomplete_source_ids, ['b']);
const missing = assessMotherSetCompleteness([{ source_id: 'a', completeness: 'complete' }], required);
assert.equal(missing.complete, false);
assert.deepEqual(missing.missing_source_ids, ['b']);
console.log('JAPAN_MOTHER_SET_SAFETY: pass');
