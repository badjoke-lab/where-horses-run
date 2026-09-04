import assert from 'node:assert/strict';
import {
  canReconcileMeetingAbsence,
  requiredMotherSetSourcesForMeeting,
} from './timetable/japan-mother-set-safety.mjs';

const completeness = [
  { source_id: 'jra-racing-calendar-programme', completeness: 'partial' },
  { source_id: 'nar-monthly-convene-info', completeness: 'complete' },
  { source_id: 'banei-official-schedule', completeness: 'complete' },
  { source_id: 'nankankeiba-south-kanto-calendar', completeness: 'complete' },
];

const rows = {
  jra: {
    meeting_id: 'jra-nakayama-racecourse-2026-09-12',
    authority_id: 'jra',
    racecourse_id: 'nakayama-racecourse',
  },
  southKanto: {
    meeting_id: 'nar-kawasaki-racecourse-2026-09-07',
    authority_id: 'nar-local-government-racing',
    racecourse_id: 'kawasaki-racecourse',
  },
  otherNar: {
    meeting_id: 'nar-morioka-racecourse-2026-09-07',
    authority_id: 'nar-local-government-racing',
    racecourse_id: 'morioka-racecourse',
  },
  banei: {
    meeting_id: 'banei-obihiro-racecourse-2026-09-06',
    authority_id: 'banei-tokachi',
    racecourse_id: 'obihiro-racecourse',
  },
};

assert.deepEqual(requiredMotherSetSourcesForMeeting(rows.jra), ['jra-racing-calendar-programme']);
assert.deepEqual(requiredMotherSetSourcesForMeeting(rows.southKanto), [
  'nar-monthly-convene-info',
  'nankankeiba-south-kanto-calendar',
]);
assert.equal(requiredMotherSetSourcesForMeeting(rows.otherNar), null);
assert.deepEqual(requiredMotherSetSourcesForMeeting(rows.banei), ['banei-official-schedule']);

assert.equal(canReconcileMeetingAbsence(rows.jra, completeness), false);
assert.equal(canReconcileMeetingAbsence(rows.southKanto, completeness), true);
assert.equal(canReconcileMeetingAbsence(rows.otherNar, completeness), false);
assert.equal(canReconcileMeetingAbsence(rows.banei, completeness), true);

const southKantoPartial = completeness.map((row) => row.source_id === 'nankankeiba-south-kanto-calendar'
  ? { ...row, completeness: 'partial' }
  : row);
assert.equal(canReconcileMeetingAbsence(rows.southKanto, southKantoPartial), false);

console.log('JAPAN_PER_FAMILY_ABSENCE_RECONCILIATION: pass');
