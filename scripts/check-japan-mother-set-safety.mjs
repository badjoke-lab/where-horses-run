import assert from 'node:assert/strict';
import {
  assessMotherSetCompleteness,
  canReconcileMeetingAbsence,
  mergeOfficialPositiveEvidence,
  requiredMotherSetSourcesForMeeting,
} from './timetable/japan-mother-set-safety.mjs';

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
assert.throws(() => mergeOfficialPositiveEvidence([base], [{ ...base, racecourse_id: 'oi-racecourse' }]), /identity conflict/);

const required = ['a', 'b'];
assert.equal(assessMotherSetCompleteness([{ source_id: 'a', completeness: 'complete' }, { source_id: 'b', completeness: 'complete' }], required).complete, true);
const failed = assessMotherSetCompleteness([{ source_id: 'a', completeness: 'complete' }, { source_id: 'b', completeness: 'failed' }], required);
assert.equal(failed.complete, false);
assert.deepEqual(failed.incomplete_source_ids, ['b']);
const missing = assessMotherSetCompleteness([{ source_id: 'a', completeness: 'complete' }], required);
assert.equal(missing.complete, false);
assert.deepEqual(missing.missing_source_ids, ['b']);

const sourceRows = [
  { source_id: 'jra-racing-calendar-programme', completeness: 'partial' },
  { source_id: 'nar-monthly-convene-info', completeness: 'complete' },
  { source_id: 'banei-official-schedule', completeness: 'complete' },
  { source_id: 'nankankeiba-south-kanto-calendar', completeness: 'complete' },
  { source_id: 'iwatekeiba-official-calendar', completeness: 'complete' },
  { source_id: 'hyogo-urban-keiba-official-calendar', completeness: 'complete' },
  { source_id: 'tokai-region-joint-official-calendar', completeness: 'complete' },
  { source_id: 'hokkaido-keiba-official-calendar', completeness: 'complete' },
  { source_id: 'kanazawa-keiba-official-calendar', completeness: 'complete' },
  { source_id: 'kochi-keiba-official-calendar', completeness: 'complete' },
  { source_id: 'saga-keiba-official-calendar', completeness: 'complete' },
];
assert.deepEqual(requiredMotherSetSourcesForMeeting(base), ['nar-monthly-convene-info', 'nankankeiba-south-kanto-calendar']);
assert.equal(canReconcileMeetingAbsence(base, sourceRows), true);

const cases = [
  ['iwatekeiba-official-calendar', { ...base, meeting_id: 'nar-morioka-racecourse-2026-09-07', racecourse_id: 'morioka-racecourse' }],
  ['hyogo-urban-keiba-official-calendar', { ...base, meeting_id: 'nar-sonoda-racecourse-2026-09-09', racecourse_id: 'sonoda-racecourse' }],
  ['tokai-region-joint-official-calendar', { ...base, meeting_id: 'nar-nagoya-racecourse-2026-09-14', racecourse_id: 'nagoya-racecourse' }],
  ['tokai-region-joint-official-calendar', { ...base, meeting_id: 'nar-kasamatsu-racecourse-2026-09-22', racecourse_id: 'kasamatsu-racecourse' }],
  ['hokkaido-keiba-official-calendar', { ...base, meeting_id: 'nar-monbetsu-racecourse-2026-09-08', racecourse_id: 'monbetsu-racecourse' }],
  ['kanazawa-keiba-official-calendar', { ...base, meeting_id: 'nar-kanazawa-racecourse-2026-09-06', racecourse_id: 'kanazawa-racecourse' }],
  ['kochi-keiba-official-calendar', { ...base, meeting_id: 'nar-kochi-racecourse-2026-09-05', racecourse_id: 'kochi-racecourse' }],
  ['saga-keiba-official-calendar', { ...base, meeting_id: 'nar-saga-racecourse-2026-09-05', racecourse_id: 'saga-racecourse' }],
];
for (const [sourceId, meeting] of cases) {
  assert.deepEqual(requiredMotherSetSourcesForMeeting(meeting), ['nar-monthly-convene-info', sourceId]);
  assert.equal(canReconcileMeetingAbsence(meeting, sourceRows), true);
  assert.equal(canReconcileMeetingAbsence(meeting, sourceRows.map((row) => row.source_id === sourceId ? { ...row, completeness: 'partial' } : row)), false);
}
assert.equal(requiredMotherSetSourcesForMeeting({ ...base, meeting_id: 'nar-kitami-racecourse-2026-09-05', racecourse_id: 'kitami-racecourse' }), null);
assert.equal(canReconcileMeetingAbsence({ meeting_id: 'jra-nakayama-racecourse-2026-09-12', authority_id: 'jra', racecourse_id: 'nakayama-racecourse' }, sourceRows), false);
assert.equal(canReconcileMeetingAbsence({ meeting_id: 'banei-obihiro-racecourse-2026-09-06', authority_id: 'banei-tokachi', racecourse_id: 'obihiro-racecourse' }, sourceRows), true);
console.log('JAPAN_MOTHER_SET_SAFETY: pass');
