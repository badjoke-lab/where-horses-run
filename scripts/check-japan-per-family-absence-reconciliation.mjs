import assert from 'node:assert/strict';
import {
  canReconcileMeetingAbsence,
  requiredMotherSetSourcesForMeeting,
  selectPublicAbsenceReconciliation,
} from './timetable/japan-mother-set-safety.mjs';

const completeness = [
  { source_id: 'jra-racing-calendar-programme', completeness: 'partial' },
  { source_id: 'nar-monthly-convene-info', completeness: 'complete' },
  { source_id: 'banei-official-schedule', completeness: 'complete' },
  { source_id: 'nankankeiba-south-kanto-calendar', completeness: 'complete' },
  { source_id: 'iwatekeiba-official-calendar', completeness: 'complete' },
  { source_id: 'hyogo-urban-keiba-official-calendar', completeness: 'complete' },
  { source_id: 'tokai-region-joint-official-calendar', completeness: 'complete' },
  { source_id: 'hokkaido-keiba-official-calendar', completeness: 'complete' },
];

const rows = {
  jra: { meeting_id: 'jra-nakayama-racecourse-2026-09-12', country_id: 'japan', date: '2026-09-12', authority_id: 'jra', racecourse_id: 'nakayama-racecourse' },
  southKanto: { meeting_id: 'nar-kawasaki-racecourse-2026-09-07', country_id: 'japan', date: '2026-09-07', authority_id: 'nar-local-government-racing', racecourse_id: 'kawasaki-racecourse' },
  iwate: { meeting_id: 'nar-morioka-racecourse-2026-09-07', country_id: 'japan', date: '2026-09-07', authority_id: 'nar-local-government-racing', racecourse_id: 'morioka-racecourse' },
  hyogo: { meeting_id: 'nar-sonoda-racecourse-2026-09-09', country_id: 'japan', date: '2026-09-09', authority_id: 'nar-local-government-racing', racecourse_id: 'sonoda-racecourse' },
  tokaiNagoya: { meeting_id: 'nar-nagoya-racecourse-2026-09-14', country_id: 'japan', date: '2026-09-14', authority_id: 'nar-local-government-racing', racecourse_id: 'nagoya-racecourse' },
  tokaiKasamatsu: { meeting_id: 'nar-kasamatsu-racecourse-2026-09-22', country_id: 'japan', date: '2026-09-22', authority_id: 'nar-local-government-racing', racecourse_id: 'kasamatsu-racecourse' },
  hokkaido: { meeting_id: 'nar-monbetsu-racecourse-2026-09-08', country_id: 'japan', date: '2026-09-08', authority_id: 'nar-local-government-racing', racecourse_id: 'monbetsu-racecourse' },
  otherNar: { meeting_id: 'nar-kanazawa-racecourse-2026-09-07', country_id: 'japan', date: '2026-09-07', authority_id: 'nar-local-government-racing', racecourse_id: 'kanazawa-racecourse' },
  banei: { meeting_id: 'banei-obihiro-racecourse-2026-09-06', country_id: 'japan', date: '2026-09-06', authority_id: 'banei-tokachi', racecourse_id: 'obihiro-racecourse' },
};

assert.deepEqual(requiredMotherSetSourcesForMeeting(rows.jra), ['jra-racing-calendar-programme']);
assert.deepEqual(requiredMotherSetSourcesForMeeting(rows.southKanto), ['nar-monthly-convene-info', 'nankankeiba-south-kanto-calendar']);
assert.deepEqual(requiredMotherSetSourcesForMeeting(rows.iwate), ['nar-monthly-convene-info', 'iwatekeiba-official-calendar']);
assert.deepEqual(requiredMotherSetSourcesForMeeting(rows.hyogo), ['nar-monthly-convene-info', 'hyogo-urban-keiba-official-calendar']);
for (const tokai of [rows.tokaiNagoya, rows.tokaiKasamatsu]) {
  assert.deepEqual(requiredMotherSetSourcesForMeeting(tokai), ['nar-monthly-convene-info', 'tokai-region-joint-official-calendar']);
}
assert.deepEqual(requiredMotherSetSourcesForMeeting(rows.hokkaido), ['nar-monthly-convene-info', 'hokkaido-keiba-official-calendar']);
assert.equal(requiredMotherSetSourcesForMeeting(rows.otherNar), null);
assert.deepEqual(requiredMotherSetSourcesForMeeting(rows.banei), ['banei-official-schedule']);

assert.equal(canReconcileMeetingAbsence(rows.jra, completeness), false);
assert.equal(canReconcileMeetingAbsence(rows.southKanto, completeness), true);
assert.equal(canReconcileMeetingAbsence(rows.iwate, completeness), true);
assert.equal(canReconcileMeetingAbsence(rows.hyogo, completeness), true);
assert.equal(canReconcileMeetingAbsence(rows.tokaiNagoya, completeness), true);
assert.equal(canReconcileMeetingAbsence(rows.tokaiKasamatsu, completeness), true);
assert.equal(canReconcileMeetingAbsence(rows.hokkaido, completeness), true);
assert.equal(canReconcileMeetingAbsence(rows.otherNar, completeness), false);
assert.equal(canReconcileMeetingAbsence(rows.banei, completeness), true);

const selection = selectPublicAbsenceReconciliation({
  publicMeetings: [
    rows.jra, rows.southKanto, rows.iwate, rows.hyogo, rows.tokaiNagoya,
    rows.tokaiKasamatsu, rows.hokkaido, rows.otherNar, rows.banei,
    { ...rows.southKanto, meeting_id: 'nar-kawasaki-racecourse-2026-09-08', date: '2026-09-08' },
    { ...rows.southKanto, meeting_id: 'nar-kawasaki-racecourse-2026-09-09', date: '2026-09-09' },
  ],
  officialMeetingIds: new Set(['nar-kawasaki-racecourse-2026-09-09']),
  rangeDates: new Set(['2026-09-06', '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-12', '2026-09-14', '2026-09-22']),
  sourceCompletenessRows: completeness,
});
assert.deepEqual(selection.removed_meeting_ids, [
  'banei-obihiro-racecourse-2026-09-06',
  'nar-kasamatsu-racecourse-2026-09-22',
  'nar-kawasaki-racecourse-2026-09-07',
  'nar-kawasaki-racecourse-2026-09-08',
  'nar-monbetsu-racecourse-2026-09-08',
  'nar-morioka-racecourse-2026-09-07',
  'nar-nagoya-racecourse-2026-09-14',
  'nar-sonoda-racecourse-2026-09-09',
]);
assert.deepEqual(selection.preserved_meeting_ids, [
  'jra-nakayama-racecourse-2026-09-12',
  'nar-kanazawa-racecourse-2026-09-07',
]);

const hyogoPartial = completeness.map((row) => row.source_id === 'hyogo-urban-keiba-official-calendar' ? { ...row, completeness: 'partial' } : row);
assert.equal(canReconcileMeetingAbsence(rows.hyogo, hyogoPartial), false);
const partialSelection = selectPublicAbsenceReconciliation({
  publicMeetings: [rows.hyogo, rows.iwate, rows.banei],
  officialMeetingIds: [],
  rangeDates: ['2026-09-06', '2026-09-07', '2026-09-09'],
  sourceCompletenessRows: hyogoPartial,
});
assert.deepEqual(partialSelection.removed_meeting_ids, ['banei-obihiro-racecourse-2026-09-06', 'nar-morioka-racecourse-2026-09-07']);
assert.deepEqual(partialSelection.preserved_meeting_ids, ['nar-sonoda-racecourse-2026-09-09']);

const tokaiPartial = completeness.map((row) => row.source_id === 'tokai-region-joint-official-calendar' ? { ...row, completeness: 'partial' } : row);
assert.equal(canReconcileMeetingAbsence(rows.tokaiNagoya, tokaiPartial), false);
assert.equal(canReconcileMeetingAbsence(rows.tokaiKasamatsu, tokaiPartial), false);
const tokaiPartialSelection = selectPublicAbsenceReconciliation({
  publicMeetings: [rows.tokaiNagoya, rows.tokaiKasamatsu, rows.iwate],
  officialMeetingIds: [],
  rangeDates: ['2026-09-07', '2026-09-14', '2026-09-22'],
  sourceCompletenessRows: tokaiPartial,
});
assert.deepEqual(tokaiPartialSelection.removed_meeting_ids, ['nar-morioka-racecourse-2026-09-07']);
assert.deepEqual(tokaiPartialSelection.preserved_meeting_ids, ['nar-kasamatsu-racecourse-2026-09-22', 'nar-nagoya-racecourse-2026-09-14']);

const hokkaidoPartial = completeness.map((row) => row.source_id === 'hokkaido-keiba-official-calendar' ? { ...row, completeness: 'partial' } : row);
assert.equal(canReconcileMeetingAbsence(rows.hokkaido, hokkaidoPartial), false);
const hokkaidoPartialSelection = selectPublicAbsenceReconciliation({
  publicMeetings: [rows.hokkaido, rows.iwate],
  officialMeetingIds: [],
  rangeDates: ['2026-09-07', '2026-09-08'],
  sourceCompletenessRows: hokkaidoPartial,
});
assert.deepEqual(hokkaidoPartialSelection.removed_meeting_ids, ['nar-morioka-racecourse-2026-09-07']);
assert.deepEqual(hokkaidoPartialSelection.preserved_meeting_ids, ['nar-monbetsu-racecourse-2026-09-08']);

console.log('JAPAN_PER_FAMILY_ABSENCE_RECONCILIATION: pass');
