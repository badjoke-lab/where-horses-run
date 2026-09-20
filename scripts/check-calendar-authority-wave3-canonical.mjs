import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  acceptCanonicalObservationV1,
  mergeCanonicalTimetableRowsV1,
  normalizeStoredCanonicalV1,
  retainCurrentAcquisitionStateV1,
} from './timetable/canonical-acceptance.mjs';
import { classifyAcquisitionCompletion } from './timetable/acquisition-completion.mjs';
import {
  classifyJapanAcquisitionCompletion,
  deriveJapanBestAvailableRank,
} from './timetable/japan-zero-based-30d-core.mjs';

const profile = { technical_capability_rank: 'A+', supported_observation_ranks: ['C', 'B', 'B+', 'A', 'A+'] };
const sourceTrace = {
  source_id: 'fixture-source',
  route_id: null,
  source_status: 'verified',
  official_source_url: 'https://example.test/programme',
  source_label: null,
  extraction_method: 'adapter',
  source_snapshot_path: null,
  normalized_from_path: 'fixture',
};
const freshness = {
  last_checked_date: '2026-09-20',
  generated_at: '2026-09-20T10:00:00Z',
  stale_after_date: null,
  freshness_note: 'fixture',
};
const aPlusRows = [
  { label: 'Race 1', post_time_local: '10:00', race_name: 'One', distance_m: 1200, surface: 'Turf', course_label: 'A' },
  { label: 'Race 2', post_time_local: '10:30', race_name: 'Two', distance_m: 1400, surface: 'Turf', course_label: 'A' },
];
const previousMeeting = {
  meeting_id: 'fixture-2026-09-20',
  country_id: 'fixture-country',
  authority_id: 'fixture-authority',
  racing_system_id: 'fixture-system',
  racecourse_id: 'fixture-racecourse',
  date: '2026-09-20',
  timezone: 'UTC',
  capability_rank: 'A+',
  display_status: 'displayable',
  first_race_time_local: '10:00',
  last_race_time_local: '10:30',
  source_trace: sourceTrace,
  freshness,
  evidence_support: {
    timetable: {
      source_id: 'old-programme',
      official_source_url: 'https://example.test/old',
      observed_at: '2026-09-19T10:00:00Z',
      successfully_verified_at: '2026-09-19T10:00:00Z',
      acquisition_method: 'automatic',
    },
  },
};
const previousDetail = {
  meeting_id: previousMeeting.meeting_id,
  country_id: previousMeeting.country_id,
  authority_id: previousMeeting.authority_id,
  racecourse_id: previousMeeting.racecourse_id,
  date: previousMeeting.date,
  timezone: previousMeeting.timezone,
  capability_rank: 'A+',
  source_trace: sourceTrace,
  freshness,
  timetable_rows: aPlusRows,
};

const normalized = normalizeStoredCanonicalV1(previousMeeting, previousDetail);
assert.equal(normalized.meeting.capability_rank, 'A+');
assert.equal(normalized.detail.capability_rank, 'A+');

const currentFailure = classifyAcquisitionCompletion({
  capability_rank: 'B',
  detail_observation: { status: 'source_error' },
}, profile);
assert.equal(currentFailure.disposition, 'retry_required');

const weakCandidate = {
  meeting_id: previousMeeting.meeting_id,
  country_id: previousMeeting.country_id,
  authority_id: previousMeeting.authority_id,
  racing_system_id: previousMeeting.racing_system_id,
  racecourse_id: previousMeeting.racecourse_id,
  date: previousMeeting.date,
  timezone: previousMeeting.timezone,
  capability_rank: 'B',
  display_status: 'displayable',
  first_race_time_local: '10:05',
  last_race_time_local: null,
  source_trace: { ...sourceTrace, source_id: 'new-schedule' },
  freshness: { ...freshness, generated_at: '2026-09-20T11:00:00Z' },
};
const failedAttempt = {
  attempted_at: '2026-09-20T11:00:00Z',
  status: 'source_error',
  source_id: 'detail-route',
  error_code: 'fetch_failed',
};
const retained = acceptCanonicalObservationV1({
  previousMeeting,
  previousDetail,
  candidateMeeting: weakCandidate,
  candidateDetail: null,
  acquisitionCompletion: currentFailure,
  acquisitionAttempt: failedAttempt,
});
assert.equal(retained.decision, 'retained_stronger_evidence');
assert.equal(retained.meeting.capability_rank, 'A+');
assert.deepEqual(retained.detail.timetable_rows, aPlusRows);
assert.equal(retained.meeting.acquisition_completion.disposition, 'retry_required');
assert.deepEqual(retained.meeting.acquisition_attempt, failedAttempt);
assert.equal(
  retained.meeting.evidence_support.timetable.successfully_verified_at,
  '2026-09-19T10:00:00Z',
  'failed current attempt must not advance successful verification time',
);
assert.equal(retained.meeting.first_race_time_local, '10:00');
assert.equal(retained.meeting.last_race_time_local, '10:30');

const partialRows = [
  { label: 'Race 1', post_time_local: '10:02', race_name: 'One updated' },
  { label: 'Race 2', post_time_local: '10:32' },
];
const mergedRows = mergeCanonicalTimetableRowsV1(aPlusRows, partialRows);
assert.equal(mergedRows[0].post_time_local, '10:02');
assert.equal(mergedRows[0].race_name, 'One updated');
assert.equal(mergedRows[0].distance_m, 1200);
assert.equal(mergedRows[1].race_name, 'Two');
assert.equal(mergedRows[1].surface, 'Turf');

const partialCandidate = {
  ...weakCandidate,
  capability_rank: 'A',
  first_race_time_local: '10:02',
  last_race_time_local: '10:32',
};
const partialDetail = {
  ...previousDetail,
  capability_rank: 'A',
  source_trace: { ...sourceTrace, source_id: 'partial-programme' },
  timetable_rows: partialRows,
};
const merged = acceptCanonicalObservationV1({
  previousMeeting,
  previousDetail,
  candidateMeeting: partialCandidate,
  candidateDetail: partialDetail,
  acquisitionCompletion: classifyAcquisitionCompletion({
    capability_rank: 'A',
    detail_observation: { status: 'available', evaluated_capability_rank: 'A' },
  }, profile),
});
assert.equal(merged.meeting.capability_rank, 'A+');
assert.equal(merged.detail.timetable_rows[0].race_name, 'One updated');
assert.equal(merged.detail.timetable_rows[0].distance_m, 1200);
assert.equal(merged.detail.timetable_rows[1].race_name, 'Two');
assert.equal(merged.meeting.first_race_time_local, '10:02');
assert.equal(merged.meeting.last_race_time_local, '10:32');

const correctionRows = [
  { label: 'Race 1', post_time_local: '10:10' },
  { label: 'Race 2', post_time_local: '10:40' },
];
const correction = acceptCanonicalObservationV1({
  previousMeeting,
  previousDetail,
  candidateMeeting: {
    ...weakCandidate,
    capability_rank: 'A',
    first_race_time_local: '10:10',
    last_race_time_local: '10:40',
  },
  candidateDetail: {
    ...previousDetail,
    capability_rank: 'A',
    timetable_rows: correctionRows,
  },
  explicitCorrection: true,
});
assert.equal(correction.decision, 'authoritative_replacement');
assert.equal(correction.meeting.capability_rank, 'A');
assert.deepEqual(correction.detail.timetable_rows, correctionRows);

const fieldCorrection = acceptCanonicalObservationV1({
  previousMeeting,
  previousDetail,
  candidateMeeting: { ...previousMeeting },
  candidateDetail: {
    ...previousDetail,
    timetable_rows: [
      { ...aPlusRows[0] },
      { ...aPlusRows[1], distance_m: 1500 },
    ],
  },
  evidenceChanges: [{
    target: { meeting_id: previousMeeting.meeting_id, scope: 'field', field: 'distance', race_label: 'Race 2' },
    action: 'correct',
    reason_type: 'official_correction',
    reason: 'Official correction notice.',
    evidence: {
      source_id: 'correction',
      official_source_url: 'https://example.test/correction',
      observed_at: '2026-09-20T12:00:00Z',
      successfully_verified_at: '2026-09-20T12:00:00Z',
      acquisition_method: 'automatic',
    },
  }],
});
assert.equal(fieldCorrection.detail.timetable_rows[0].distance_m, 1200);
assert.equal(fieldCorrection.detail.timetable_rows[1].distance_m, 1500);
assert.equal(fieldCorrection.detail.timetable_rows[1].race_name, 'Two');

const retainedState = retainCurrentAcquisitionStateV1(previousMeeting, {
  acquisitionCompletion: currentFailure,
  acquisitionAttempt: failedAttempt,
});
assert.equal(retainedState.meeting.capability_rank, 'A+');
assert.equal(retainedState.meeting.acquisition_completion.disposition, 'retry_required');

assert.equal(
  classifyAcquisitionCompletion({
    capability_rank: 'A+',
    detail_observation: { status: 'source_error' },
  }, profile).disposition,
  'retry_required',
  'A+ evidence must not hide a current-cycle source failure',
);
assert.equal(classifyJapanAcquisitionCompletion({
  capabilityRank: 'A+',
  outcome: 'acquisition_failed',
  reason: 'fixture failure',
}).disposition, 'retry_required');
assert.equal(deriveJapanBestAvailableRank(previousMeeting, aPlusRows), 'A+');

for (const [file, expected] of [
  ['scripts/timetable/apply-official-rolling-observations.mjs', 'acceptCanonicalObservationV1'],
  ['scripts/timetable/japan-zero-based-30d-core.mjs', 'acceptCanonicalObservationV1'],
  ['scripts/timetable/apply-reviewed-calendar-observations.mjs', 'acceptCanonicalObservationV1'],
]) {
  const source = fs.readFileSync(file, 'utf8');
  assert.match(source, new RegExp(expected), `${file} must route canonical acceptance through the shared Wave 3 authority`);
}

console.log('CALENDAR_AUTHORITY_WAVE3_CANONICAL: pass');
