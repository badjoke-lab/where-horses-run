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

// Ordinary empty/unverified values must not erase accepted evidence.
const emptyValueMerge = acceptCanonicalObservationV1({
  previousMeeting,
  previousDetail,
  candidateMeeting: { ...partialCandidate },
  candidateDetail: {
    ...partialDetail,
    timetable_rows: [
      { label: 'Race 1', post_time_local: '10:02', race_name: '' },
      { label: 'Race 2', post_time_local: '10:32', race_name: '' },
    ],
  },
});
assert.equal(emptyValueMerge.meeting.capability_rank, 'A+');
assert.equal(emptyValueMerge.detail.timetable_rows[0].race_name, 'One');
assert.equal(emptyValueMerge.detail.timetable_rows[1].race_name, 'Two');

// A single-race observation must preserve established row order and unrelated rows.
const raceTwoOnly = mergeCanonicalTimetableRowsV1(aPlusRows, [
  { label: 'Race 2', distance_m: 1500 },
]);
assert.deepEqual(raceTwoOnly.map((row) => row.label), ['Race 1', 'Race 2']);
assert.equal(raceTwoOnly[0].distance_m, 1200);
assert.equal(raceTwoOnly[1].distance_m, 1500);

const targetedEvidence = [{
  target: { meeting_id: previousMeeting.meeting_id, scope: 'field', field: 'distance', race_label: 'Race 2' },
  action: 'correct',
  reason_type: 'official_correction',
  reason: 'Race 2 distance corrected.',
  evidence: {
    source_id: 'targeted-correction',
    official_source_url: 'https://example.test/targeted-correction',
    observed_at: '2026-09-20T12:00:00Z',
    successfully_verified_at: '2026-09-20T12:00:00Z',
    acquisition_method: 'automatic',
  },
}];
const targetedPartial = acceptCanonicalObservationV1({
  previousMeeting,
  previousDetail,
  candidateMeeting: { ...weakCandidate },
  candidateDetail: {
    meeting_id: previousMeeting.meeting_id,
    timetable_rows: [{ label: 'Race 2', distance_m: 1500 }],
  },
  evidenceChanges: targetedEvidence,
});
assert.equal(targetedPartial.detail.timetable_rows[0].distance_m, 1200);
assert.equal(targetedPartial.detail.timetable_rows[1].distance_m, 1500);
assert.equal(targetedPartial.detail.timetable_rows[1].race_name, 'Two');
assert.deepEqual(targetedPartial.meeting.evidence_changes, targetedEvidence);
assert.deepEqual(targetedPartial.detail.evidence_changes, targetedEvidence);

// Targeted invalidation may lower rank but must retain unrelated canonical detail evidence.
const threeRows = [
  { label: 'Race 1', post_time_local: '10:00', race_name: 'One', distance_m: 1200, surface: 'Turf', course_label: 'A' },
  { label: 'Race 2', post_time_local: '10:30', race_name: 'Two', distance_m: 1400, surface: 'Turf', course_label: 'A' },
  { label: 'Race 3', post_time_local: '11:00', race_name: 'Three', distance_m: 1600, surface: 'Turf', course_label: 'A' },
];
const threeMeeting = { ...previousMeeting, first_race_time_local: '10:00', last_race_time_local: '11:00' };
const threeDetail = { ...previousDetail, timetable_rows: threeRows };
const invalidatedTime = acceptCanonicalObservationV1({
  previousMeeting: threeMeeting,
  previousDetail: threeDetail,
  candidateMeeting: { ...threeMeeting },
  candidateDetail: { meeting_id: threeMeeting.meeting_id, timetable_rows: [{ label: 'Race 2' }] },
  evidenceChanges: [{
    target: { meeting_id: threeMeeting.meeting_id, scope: 'field', field: 'race_time', race_label: 'Race 2' },
    action: 'invalidate',
    reason_type: 'official_retraction',
    reason: 'Race 2 post time withdrawn.',
    evidence: {
      source_id: 'time-retraction',
      official_source_url: 'https://example.test/time-retraction',
      observed_at: '2026-09-20T12:30:00Z',
      successfully_verified_at: '2026-09-20T12:30:00Z',
      acquisition_method: 'automatic',
    },
  }],
});
assert.equal(invalidatedTime.meeting.capability_rank, 'B+');
assert.ok(invalidatedTime.detail, 'lower-rank targeted invalidation must retain unrelated detail evidence');
assert.equal(invalidatedTime.detail.timetable_rows[0].race_name, 'One');
assert.equal(invalidatedTime.detail.timetable_rows[1].race_name, 'Two');
assert.equal(invalidatedTime.detail.timetable_rows[2].race_name, 'Three');
assert.equal('post_time_local' in invalidatedTime.detail.timetable_rows[1], false);

// Meeting identity/date corrections must remain coherent with retained detail identity.
const correctedDate = acceptCanonicalObservationV1({
  previousMeeting,
  previousDetail,
  candidateMeeting: { ...previousMeeting, date: '2026-09-21' },
  candidateDetail: null,
  evidenceChanges: [{
    target: { meeting_id: previousMeeting.meeting_id, scope: 'field', field: 'meeting_date' },
    action: 'correct',
    reason_type: 'official_correction',
    reason: 'Official meeting date correction.',
    evidence: {
      source_id: 'date-correction',
      official_source_url: 'https://example.test/date-correction',
      observed_at: '2026-09-20T13:00:00Z',
      successfully_verified_at: '2026-09-20T13:00:00Z',
      acquisition_method: 'automatic',
    },
  }],
});
assert.equal(correctedDate.meeting.date, '2026-09-21');
assert.equal(correctedDate.detail.date, '2026-09-21');

const withdrawnDetail = acceptCanonicalObservationV1({
  previousMeeting,
  previousDetail,
  candidateMeeting: { ...previousMeeting },
  candidateDetail: null,
  evidenceChanges: [{
    target: { meeting_id: previousMeeting.meeting_id, scope: 'detail' },
    action: 'invalidate',
    reason_type: 'official_retraction',
    reason: 'Programme detail retracted.',
    evidence: {
      source_id: 'detail-retraction',
      official_source_url: 'https://example.test/detail-retraction',
      observed_at: '2026-09-20T13:15:00Z',
      successfully_verified_at: '2026-09-20T13:15:00Z',
      acquisition_method: 'automatic',
    },
  }],
});
assert.equal(withdrawnDetail.detail, null);
assert.equal(withdrawnDetail.meeting.first_race_time_local, null);
assert.equal(withdrawnDetail.meeting.last_race_time_local, null);

// A represented failed attempt cannot authorize new provenance or source attribution.
const failedProvenanceCandidate = {
  ...previousMeeting,
  source_trace: { ...sourceTrace, source_id: 'failed-new-source' },
  evidence_support: {
    timetable: {
      source_id: 'failed-new-source',
      official_source_url: 'https://example.test/failed-new-source',
      observed_at: '2026-09-20T14:00:00Z',
      successfully_verified_at: '2026-09-20T14:00:00Z',
      acquisition_method: 'automatic',
    },
  },
};
const failedProvenance = acceptCanonicalObservationV1({
  previousMeeting,
  previousDetail,
  candidateMeeting: failedProvenanceCandidate,
  candidateDetail: { ...previousDetail, source_trace: failedProvenanceCandidate.source_trace },
  acquisitionCompletion: currentFailure,
  acquisitionAttempt: { ...failedAttempt, status: 'network_error' },
});
assert.equal(failedProvenance.meeting.source_trace.source_id, sourceTrace.source_id);
assert.equal(failedProvenance.detail.source_trace.source_id, sourceTrace.source_id);
assert.equal(failedProvenance.meeting.evidence_support.timetable.source_id, 'old-programme');
assert.equal(
  failedProvenance.meeting.evidence_support.timetable.successfully_verified_at,
  '2026-09-19T10:00:00Z',
);

assert.equal(
  classifyAcquisitionCompletion({
    capability_rank: 'A+',
    acquisition_attempt: { ...failedAttempt, status: 'network_error' },
  }, profile).disposition,
  'retry_required',
  'explicit attempt-only failure must override an otherwise terminal A+ completion',
);

// Japan must persist a new explicit failed attempt while retaining stronger old evidence.
const japanMeeting = {
  meeting_id: 'japan-wave3-attempt-2026-09-20',
  date: '2026-09-20',
  authority_id: 'jra',
  racing_system_id: 'japan-jra-system',
  racecourse_id: 'tokyo-racecourse',
  official_source_url: 'https://jra.jp/',
};
const oldJapanAttempt = {
  attempted_at: '2026-09-19T10:00:00Z',
  status: 'success',
  source_id: 'jra-detail',
};
const newJapanAttempt = {
  attempted_at: '2026-09-20T10:00:00Z',
  status: 'network_error',
  source_id: 'jra-detail',
  error_code: 'fixture_failure',
};
const japanExistingMeeting = {
  ...previousMeeting,
  meeting_id: japanMeeting.meeting_id,
  country_id: 'japan',
  authority_id: 'jra',
  racing_system_id: 'japan-jra-system',
  racecourse_id: 'tokyo-racecourse',
  date: '2026-09-20',
  timezone: 'Asia/Tokyo',
  acquisition_attempt: oldJapanAttempt,
};
const japanExistingDetail = {
  ...previousDetail,
  meeting_id: japanMeeting.meeting_id,
  country_id: 'japan',
  authority_id: 'jra',
  racecourse_id: 'tokyo-racecourse',
  date: '2026-09-20',
  timezone: 'Asia/Tokyo',
};
const japanResult = await (async () => {
  const { runJapanZeroBased30d } = await import('./timetable/japan-zero-based-30d-core.mjs');
  return runJapanZeroBased30d({
    executionDate: '2026-09-20',
    attempts: 1,
    retryDelayMs: 0,
    checkedAt: '2026-09-20T10:00:00Z',
    adapters: {
      jra: {
        discover: async () => [japanMeeting],
        inspect: async () => ({
          status: 'acquisition_failed',
          reason: 'fixture_failure',
          acquisition_attempt: newJapanAttempt,
        }),
      },
      'nar-standard': { discover: async () => [], inspect: async () => ({ status: 'acquisition_failed' }) },
      banei: { discover: async () => [], inspect: async () => ({ status: 'acquisition_failed' }) },
    },
    loadExisting: () => ({
      canonical: [japanExistingMeeting],
      details: [japanExistingDetail],
      public: [],
      publicDetails: [],
    }),
  });
})();
const japanRetained = japanResult.canonical.find((row) => row.meeting_id === japanMeeting.meeting_id);
const japanReconciliation = japanResult.reconciliations.find((row) => row.meeting_id === japanMeeting.meeting_id);
assert.equal(japanRetained.capability_rank, 'A+');
assert.deepEqual(japanRetained.acquisition_attempt, newJapanAttempt);
assert.equal(japanRetained.acquisition_completion.disposition, 'retry_required');
assert.equal(japanRetained.acquisition_completion.observed_rank, 'C');
assert.equal(japanReconciliation.official_rank, 'C');

for (const legacyWriter of [
  'scripts/timetable/manual-refresh-jra.mjs',
  'scripts/timetable/refresh-jra.mjs',
  'scripts/timetable/build-canonical-timetable.mjs',
  'scripts/timetable/merge-hkjc-normalized-into-canonical.mjs',
]) {
  const source = fs.readFileSync(legacyWriter, 'utf8');
  assert.match(source, /WHR_ALLOW_LEGACY_CANONICAL_WRITE/, `${legacyWriter} must be explicitly quarantined from normal production canonical writes`);
}
assert.match(
  fs.readFileSync('scripts/timetable/pipeline-v1/promotion-core.mjs', 'utf8'),
  /acceptCanonicalObservationV1/,
  'pipeline-v1 promotion must delegate canonical acceptance to the shared authority',
);
assert.match(
  fs.readFileSync('scripts/timetable/apply-reviewed-calendar-observations.mjs', 'utf8'),
  /evidence_support: structuredClone\(record\.evidence_support\)/,
  'reviewed acceptance must preserve reviewed evidence support metadata',
);
assert.match(
  fs.readFileSync('scripts/timetable/apply-reviewed-calendar-observations.mjs', 'utf8'),
  /validateCalendarAuthorityMetadataV1/,
  'reviewed acceptance must validate authority metadata before applying it',
);

for (const [file, expected] of [
  ['scripts/timetable/apply-official-rolling-observations.mjs', 'acceptCanonicalObservationV1'],
  ['scripts/timetable/japan-zero-based-30d-core.mjs', 'acceptCanonicalObservationV1'],
  ['scripts/timetable/apply-reviewed-calendar-observations.mjs', 'acceptCanonicalObservationV1'],
]) {
  const source = fs.readFileSync(file, 'utf8');
  assert.match(source, new RegExp(expected), `${file} must route canonical acceptance through the shared Wave 3 authority`);
}

console.log('CALENDAR_AUTHORITY_WAVE3_CANONICAL: pass');
