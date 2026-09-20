import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildHkjcDetailArtifacts,
  classifyHkjcDetailObservation,
} from './timetable/hkjc-detail-artifact-core.mjs';
import { buildHkjcLiveBestAvailableArtifacts } from './timetable/hkjc-live-best-available-core.mjs';
import {
  buildKraDetailObservation,
  buildKraMeetingObservation,
  kraSourceStatusesHaveFailure,
} from './timetable/kra-todayrace-core.mjs';

const hkRows = [
  {
    race_number: 1,
    label: 'Race 1',
    post_time_local: '12:00',
    race_name: 'Opening',
    distance_m: 1200,
    surface: 'Turf',
    course_label: 'A Course',
  },
  {
    race_number: 2,
    label: 'Race 2',
    post_time_local: '12:35',
    race_name: 'Feature',
    distance_m: 1400,
    surface: null,
    course_label: null,
  },
];

const hkClassified = classifyHkjcDetailObservation({
  race_observations: hkRows,
  meeting_complete: true,
});
assert.equal(hkClassified.rank, 'A');
assert.equal(hkClassified.timetable_rows[0].race_name, 'Opening');
assert.equal(hkClassified.timetable_rows[0].distance_m, 1200);
assert.equal(hkClassified.timetable_rows[1].race_name, 'Feature');
assert.equal(hkClassified.timetable_rows[1].distance_m, 1400);
assert.equal('surface' in hkClassified.timetable_rows[1], false);

const failedArtifacts = buildHkjcDetailArtifacts({
  startDate: '2026-09-20',
  endDateExclusive: '2026-09-21',
  generatedAt: '2026-09-20T10:00:00Z',
  batchId: 'wave2-hkjc-source-error',
  campaignId: 'wave2-hkjc-source-error',
  jobId: 'wave2-hkjc-source-error',
  meetingInputs: [{
    meeting: {
      meeting_id: 'hkjc-sha-tin-racecourse-2026-09-20',
      racecourse_id: 'sha-tin-racecourse',
      date: '2026-09-20',
    },
    meeting_complete: true,
    page_results: [
      {
        race_number: 1,
        requested_url: 'https://racing.hkjc.com/en-us/local/information/racecard?racedate=2026-09-20&Racecourse=ST&RaceNo=1',
        final_url: 'https://racing.hkjc.com/en-us/local/information/racecard?racedate=2026-09-20&Racecourse=ST&RaceNo=1',
        ok: true,
        status: 200,
        body: 'Race 1 - Opening\\nSunday, September 20, 2026, Sha Tin, 12:00\\nTurf, "A" Course, 1200M',
      },
      {
        race_number: 2,
        requested_url: 'https://racing.hkjc.com/en-us/local/information/racecard?racedate=2026-09-20&Racecourse=ST&RaceNo=2',
        final_url: 'https://racing.hkjc.com/en-us/local/information/racecard?racedate=2026-09-20&Racecourse=ST&RaceNo=2',
        ok: true,
        status: 200,
        body: 'Race 2 - Feature\\nSunday, September 20, 2026, Sha Tin, 12:35\\nTurf, "A" Course, 1400M',
      },
      {
        race_number: 3,
        requested_url: 'https://racing.hkjc.com/en-us/local/information/racecard?racedate=2026-09-20&Racecourse=ST&RaceNo=3',
        final_url: 'https://racing.hkjc.com/en-us/local/information/racecard?racedate=2026-09-20&Racecourse=ST&RaceNo=3',
        ok: false,
        status: 503,
        error_code: 'source_unavailable',
        error_message: 'fixture source failure',
      },
    ],
  }],
});
assert.equal(failedArtifacts.candidate.records[0].capability_rank, 'B+');
assert.equal(failedArtifacts.coverage.source_errors.length, 1);
assert.equal(failedArtifacts.report.meeting_reports[0].source_error_count, 1);

const scheduleRecord = {
  candidate_id: 'candidate-hkjc-sha-tin-racecourse-2026-09-20',
  meeting_id: 'hkjc-sha-tin-racecourse-2026-09-20',
  country_id: 'hong-kong',
  authority_id: 'hkjc',
  racing_system_id: 'hong-kong-hkjc-system',
  racecourse_id: 'sha-tin-racecourse',
  date: '2026-09-20',
  timezone: 'Asia/Hong_Kong',
  capability_rank: 'A',
  first_race_time_local: '12:00',
  last_race_time_local: '12:35',
  timetable_rows: [
    { label: 'Race 1', post_time_local: '12:00' },
    { label: 'Race 2', post_time_local: '12:35' },
  ],
  source: {
    source_id: 'hkjc-fixture-list',
    official_url: 'https://racing.hkjc.com/racing/information/English/Racing/Fixture.aspx',
    checked_at: '2026-09-20T10:00:00Z',
    extraction_method: 'adapter_candidate',
  },
  confidence: 'high',
  review_status: 'needs_review',
  notes: 'fixture',
};
const scheduleArtifacts = {
  candidate: { records: [scheduleRecord], review: { status: 'needs_review' } },
  coverage: { source_errors: [], coverage_claim: 'partial' },
  manifest: { batch_id: 'wave2-hkjc-live' },
};
const normalized = {
  generated_at: '2026-09-20T10:00:00Z',
  records: [{
    date: '2026-09-20',
    racecourse_id: 'sha-tin-racecourse',
    capability_rank: 'A',
    first_race_time_local: '12:00',
    last_race_time_local: '12:35',
    official_source_url: 'https://racing.hkjc.com/en-us/local/information/racecard?racedate=2026-09-20&Racecourse=ST&RaceNo=1',
  }],
};
const details = {
  details: [{
    meeting_id: scheduleRecord.meeting_id,
    timetable_rows: [
      { label: 'Race 1', post_time_local: '12:00', race_name: 'Opening', distance_m: 1200 },
      { label: 'Race 2', post_time_local: '12:35', race_name: 'Feature' },
    ],
  }],
};

const equalRank = buildHkjcLiveBestAvailableArtifacts({
  scheduleArtifacts,
  normalized,
  details,
  refreshReport: { statuses: [] },
}).candidate.records[0];
assert.equal(equalRank.capability_rank, 'A');
assert.equal(equalRank.detail_observation.status, 'available');
assert.equal(equalRank.detail_observation.evaluated_capability_rank, 'A+');
assert.equal(equalRank.timetable_rows[0].race_name, 'Opening');
assert.equal(equalRank.timetable_rows[0].distance_m, 1200);
assert.equal(equalRank.timetable_rows[1].race_name, 'Feature');

const sourceError = buildHkjcLiveBestAvailableArtifacts({
  scheduleArtifacts,
  normalized,
  details,
  refreshReport: {
    statuses: [{
      meeting_date: '2026-09-20',
      racecourse_id: 'sha-tin-racecourse',
      race_number: 2,
      status: 'network_error',
      failure_reason: 'fixture network failure',
    }],
  },
}).candidate.records[0];
assert.equal(sourceError.capability_rank, 'A');
assert.equal(sourceError.detail_observation.status, 'source_error');
assert.equal('evaluated_capability_rank' in sourceError.detail_observation, false);
assert.equal(sourceError.timetable_rows[0].race_name, 'Opening');
assert.equal(sourceError.timetable_rows[0].distance_m, 1200);

const kraRows = [
  { race_number: 1, post_time_local: '11:00', distance_m: 1200, race_description: 'Busan opener', sources: ['today-race'] },
  { race_number: 2, post_time_local: '11:30', sources: ['weekly-start-times'] },
];
const kraObservation = buildKraMeetingObservation({
  meetingId: 'kra-busan-gyeongnam-racecourse-2026-09-20',
  date: '2026-09-20',
  racecourseId: 'busan-gyeongnam-racecourse',
  meetCode: '3',
  rows: kraRows,
  checkedAt: '2026-09-20T10:00:00Z',
  sourceStatuses: [{ source: 'today-race', status: 'success' }],
});
assert.equal(kraObservation.capability_rank, 'A');
assert.equal(kraObservation.timetable_rows[0].distance_m, 1200);
assert.equal(kraObservation.timetable_rows[0].race_name, 'Busan opener');
assert.equal('distance_m' in kraObservation.timetable_rows[1], false);

assert.equal(kraSourceStatusesHaveFailure([{ status: 'success' }]), false);
assert.equal(kraSourceStatusesHaveFailure([{ status: 'success' }, { status: 'network_error' }]), true);

const kraAvailable = buildKraDetailObservation({
  detail: kraObservation,
  collectedStatus: 'success',
});
assert.equal(kraAvailable.status, 'available');
assert.equal(kraAvailable.evaluated_capability_rank, 'A+');

const kraPartialFailure = buildKraDetailObservation({
  detail: { ...kraObservation, source_statuses: [{ status: 'success' }, { status: 'network_error' }] },
  collectedStatus: 'success',
});
assert.equal(kraPartialFailure.status, 'source_error');
assert.equal('evaluated_capability_rank' in kraPartialFailure, false);

const kraUnavailable = buildKraDetailObservation({
  detail: null,
  collectedStatus: 'timeout',
});
assert.equal(kraUnavailable.status, 'source_error');
assert.equal('evaluated_capability_rank' in kraUnavailable, false);

const normalizerSource = fs.readFileSync('scripts/timetable/normalize-hkjc-racecards.mjs', 'utf8');
assert.doesNotMatch(
  normalizerSource,
  /timetable_rows:\s*rows\.map\(\(row\) => capabilityRank === 'A\+'/,
  'HKJC normalizer must not discard individually verified metadata merely because the meeting remains rank A',
);
assert.match(
  normalizerSource,
  /row\.race_name \? \{ race_name: row\.race_name \}/,
  'HKJC normalizer must preserve available race-name metadata independently of meeting rank',
);

const kraRunnerSource = fs.readFileSync('scripts/timetable/run-kra-official-window.mjs', 'utf8');
assert.match(kraRunnerSource, /buildKraDetailObservation/, 'KRA official-window runner must use source-failure-aware detail observation classification');

console.log('CALENDAR_AUTHORITY_WAVE2_PRODUCERS: pass');
