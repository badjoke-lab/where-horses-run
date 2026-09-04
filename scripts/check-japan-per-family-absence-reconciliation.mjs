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
  { source_id: 'kanazawa-keiba-official-calendar', completeness: 'complete' },
  { source_id: 'kochi-keiba-official-calendar', completeness: 'complete' },
  { source_id: 'saga-keiba-official-calendar', completeness: 'complete' },
];

const rows = {
  jra: { meeting_id: 'jra-nakayama-racecourse-2026-09-12', country_id: 'japan', date: '2026-09-12', authority_id: 'jra', racecourse_id: 'nakayama-racecourse' },
  southKanto: { meeting_id: 'nar-kawasaki-racecourse-2026-09-07', country_id: 'japan', date: '2026-09-07', authority_id: 'nar-local-government-racing', racecourse_id: 'kawasaki-racecourse' },
  iwate: { meeting_id: 'nar-morioka-racecourse-2026-09-07', country_id: 'japan', date: '2026-09-07', authority_id: 'nar-local-government-racing', racecourse_id: 'morioka-racecourse' },
  hyogo: { meeting_id: 'nar-sonoda-racecourse-2026-09-09', country_id: 'japan', date: '2026-09-09', authority_id: 'nar-local-government-racing', racecourse_id: 'sonoda-racecourse' },
  tokaiNagoya: { meeting_id: 'nar-nagoya-racecourse-2026-09-14', country_id: 'japan', date: '2026-09-14', authority_id: 'nar-local-government-racing', racecourse_id: 'nagoya-racecourse' },
  tokaiKasamatsu: { meeting_id: 'nar-kasamatsu-racecourse-2026-09-22', country_id: 'japan', date: '2026-09-22', authority_id: 'nar-local-government-racing', racecourse_id: 'kasamatsu-racecourse' },
  hokkaido: { meeting_id: 'nar-monbetsu-racecourse-2026-09-08', country_id: 'japan', date: '2026-09-08', authority_id: 'nar-local-government-racing', racecourse_id: 'monbetsu-racecourse' },
  kanazawa: { meeting_id: 'nar-kanazawa-racecourse-2026-09-06', country_id: 'japan', date: '2026-09-06', authority_id: 'nar-local-government-racing', racecourse_id: 'kanazawa-racecourse' },
  kochi: { meeting_id: 'nar-kochi-racecourse-2026-09-05', country_id: 'japan', date: '2026-09-05', authority_id: 'nar-local-government-racing', racecourse_id: 'kochi-racecourse' },
  saga: { meeting_id: 'nar-saga-racecourse-2026-09-07', country_id: 'japan', date: '2026-09-07', authority_id: 'nar-local-government-racing', racecourse_id: 'saga-racecourse' },
  historicalOtherNar: { meeting_id: 'nar-kitami-racecourse-2026-09-07', country_id: 'japan', date: '2026-09-07', authority_id: 'nar-local-government-racing', racecourse_id: 'kitami-racecourse' },
  banei: { meeting_id: 'banei-obihiro-racecourse-2026-09-06', country_id: 'japan', date: '2026-09-06', authority_id: 'banei-tokachi', racecourse_id: 'obihiro-racecourse' },
};

assert.deepEqual(requiredMotherSetSourcesForMeeting(rows.jra), ['jra-racing-calendar-programme']);
assert.deepEqual(requiredMotherSetSourcesForMeeting(rows.southKanto), ['nar-monthly-convene-info', 'nankankeiba-south-kanto-calendar']);
assert.deepEqual(requiredMotherSetSourcesForMeeting(rows.iwate), ['nar-monthly-convene-info', 'iwatekeiba-official-calendar']);
assert.deepEqual(requiredMotherSetSourcesForMeeting(rows.hyogo), ['nar-monthly-convene-info', 'hyogo-urban-keiba-official-calendar']);
for (const tokai of [rows.tokaiNagoya, rows.tokaiKasamatsu]) assert.deepEqual(requiredMotherSetSourcesForMeeting(tokai), ['nar-monthly-convene-info', 'tokai-region-joint-official-calendar']);
assert.deepEqual(requiredMotherSetSourcesForMeeting(rows.hokkaido), ['nar-monthly-convene-info', 'hokkaido-keiba-official-calendar']);
assert.deepEqual(requiredMotherSetSourcesForMeeting(rows.kanazawa), ['nar-monthly-convene-info', 'kanazawa-keiba-official-calendar']);
assert.deepEqual(requiredMotherSetSourcesForMeeting(rows.kochi), ['nar-monthly-convene-info', 'kochi-keiba-official-calendar']);
assert.deepEqual(requiredMotherSetSourcesForMeeting(rows.saga), ['nar-monthly-convene-info', 'saga-keiba-official-calendar']);
assert.equal(requiredMotherSetSourcesForMeeting(rows.historicalOtherNar), null);
assert.deepEqual(requiredMotherSetSourcesForMeeting(rows.banei), ['banei-official-schedule']);

assert.equal(canReconcileMeetingAbsence(rows.jra, completeness), false);
for (const row of [rows.southKanto, rows.iwate, rows.hyogo, rows.tokaiNagoya, rows.tokaiKasamatsu, rows.hokkaido, rows.kanazawa, rows.kochi, rows.saga, rows.banei]) assert.equal(canReconcileMeetingAbsence(row, completeness), true);
assert.equal(canReconcileMeetingAbsence(rows.historicalOtherNar, completeness), false);

const selection = selectPublicAbsenceReconciliation({
  publicMeetings: [rows.jra, rows.southKanto, rows.iwate, rows.hyogo, rows.tokaiNagoya, rows.tokaiKasamatsu, rows.hokkaido, rows.kanazawa, rows.kochi, rows.saga, rows.historicalOtherNar, rows.banei],
  officialMeetingIds: new Set(),
  rangeDates: new Set(['2026-09-05', '2026-09-06', '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-12', '2026-09-14', '2026-09-22']),
  sourceCompletenessRows: completeness,
});
assert.deepEqual(selection.removed_meeting_ids, [
  'banei-obihiro-racecourse-2026-09-06',
  'nar-kanazawa-racecourse-2026-09-06',
  'nar-kasamatsu-racecourse-2026-09-22',
  'nar-kawasaki-racecourse-2026-09-07',
  'nar-kochi-racecourse-2026-09-05',
  'nar-monbetsu-racecourse-2026-09-08',
  'nar-morioka-racecourse-2026-09-07',
  'nar-nagoya-racecourse-2026-09-14',
  'nar-saga-racecourse-2026-09-07',
  'nar-sonoda-racecourse-2026-09-09',
]);
assert.deepEqual(selection.preserved_meeting_ids, ['jra-nakayama-racecourse-2026-09-12', 'nar-kitami-racecourse-2026-09-07']);

for (const [sourceId, targetRow] of [
  ['hyogo-urban-keiba-official-calendar', rows.hyogo],
  ['tokai-region-joint-official-calendar', rows.tokaiNagoya],
  ['hokkaido-keiba-official-calendar', rows.hokkaido],
  ['kanazawa-keiba-official-calendar', rows.kanazawa],
  ['kochi-keiba-official-calendar', rows.kochi],
  ['saga-keiba-official-calendar', rows.saga],
]) {
  const partial = completeness.map((row) => row.source_id === sourceId ? { ...row, completeness: 'partial' } : row);
  assert.equal(canReconcileMeetingAbsence(targetRow, partial), false);
}

const sagaPartial = completeness.map((row) => row.source_id === 'saga-keiba-official-calendar' ? { ...row, completeness: 'partial' } : row);
const sagaPartialSelection = selectPublicAbsenceReconciliation({
  publicMeetings: [rows.saga, rows.iwate],
  officialMeetingIds: [],
  rangeDates: ['2026-09-07'],
  sourceCompletenessRows: sagaPartial,
});
assert.deepEqual(sagaPartialSelection.removed_meeting_ids, ['nar-morioka-racecourse-2026-09-07']);
assert.deepEqual(sagaPartialSelection.preserved_meeting_ids, ['nar-saga-racecourse-2026-09-07']);

console.log('JAPAN_PER_FAMILY_ABSENCE_RECONCILIATION: pass');
