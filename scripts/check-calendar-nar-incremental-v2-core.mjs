import {
  aggregateScheduleAwareRuns,
  batchPaths,
  buildScheduleAwareArtifacts,
  parseIncrementalV2Args,
} from './timetable/nar-incremental-v2-core.mjs';
import { reconcileDetailBlockerRetries } from './timetable/nar-incremental-v2-reconcile.mjs';

const errors = [];
const fail = (message) => errors.push(message);

const matrixRecords = [
  { venue_code: '10', racecourse_id: 'morioka-racecourse', name_en: 'Morioka', name_ja: '盛岡' },
  { venue_code: '21', racecourse_id: 'kawasaki-racecourse', name_en: 'Kawasaki', name_ja: '川崎' },
];

function scheduleMeeting(record, date) {
  return {
    meeting_id: `nar-${record.racecourse_id}-${date}`,
    venue_code: record.venue_code,
    racecourse_id: record.racecourse_id,
    racecourse_name_en: record.name_en,
    racecourse_name_ja: record.name_ja,
    date,
    timezone: 'Asia/Tokyo',
    schedule_marker: '●',
    race_list_url: `https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList?k_babaCode=${record.venue_code}&k_raceDate=${date.replaceAll('-', '%2F')}`,
    race_list_linked_from_schedule: false,
    official_schedule_url: 'https://www.keiba.go.jp/KeibaWeb/MonthlyConveneInfo/MonthlyConveneInfoTop?k_month=7&k_year=2026',
  };
}

function detailCandidate(record, date) {
  return {
    schema_version: 'nar-monthly-meeting-candidate-v1',
    candidate_id: `nar-${record.racecourse_id}-${date}`,
    work_id: 'WHR-CAL-JAPAN-NAR-A-PLUS',
    country_id: 'japan',
    authority_id: 'nar-local-government-racing',
    racing_system_id: 'japan-nar-system',
    racecourse_id: record.racecourse_id,
    racecourse_name_en: record.name_en,
    racecourse_name_ja: record.name_ja,
    venue_code: record.venue_code,
    date,
    timezone: 'Asia/Tokyo',
    source: {},
    meeting_completeness: { all_a_plus_fields_complete: true },
    timetable_rows: [],
    review: { status: 'needs_review', promotion_eligible: false },
  };
}

function blocker(record, date, status) {
  return {
    venue_code: record.venue_code,
    racecourse_id: record.racecourse_id,
    date,
    status,
    blockers: [{ reason: 'synthetic' }],
    list_http_status: 200,
    list_final_url: 'https://www.keiba.go.jp/',
  };
}

function monthRun({ schedule = [], details = [], blockers = [] }) {
  return {
    schedule: {
      schema_version: 'nar-schedule-observation-scratch-v1',
      generated_at: '2026-07-07T12:00:00.000Z',
      work_id: 'WHR-CAL-JAPAN-NAR-A-PLUS',
      target_month: '2026-07',
      collection_mode: 'date_window',
      official_schedule_url: 'https://www.keiba.go.jp/KeibaWeb/MonthlyConveneInfo/MonthlyConveneInfoTop?k_month=7&k_year=2026',
      source_http_status: 200,
      source_encoding: 'utf-8',
      racecourses_checked: 14,
      meetings_scheduled: schedule.length,
      detail_targets: schedule.length,
      meetings: schedule,
    },
    candidates: {
      schema_version: 'nar-monthly-meeting-candidates-v1',
      meetings: details,
      blockers,
    },
    report: {
      schema_version: 'nar-monthly-collection-report-v1',
      official_schedule_url: 'https://www.keiba.go.jp/KeibaWeb/MonthlyConveneInfo/MonthlyConveneInfoTop?k_month=7&k_year=2026',
    },
  };
}

const dateArgs = parseIncrementalV2Args([
  '--batch-id=july-window-test-001',
  '--start-date=2026-07-06',
  '--end-date-exclusive=2026-07-10',
  '--checked-at=2026-07-07T12:00:00.000Z',
], matrixRecords);

const expectedPaths = batchPaths('july-window-test-001');
if (!expectedPaths.candidates.includes('/july-window-test-001/')) fail('batch-specific candidate path differs.');
if (dateArgs.batchId !== 'july-window-test-001') fail('batch ID parsing differs.');

const m1 = scheduleMeeting(matrixRecords[0], '2026-07-06');
const m2 = scheduleMeeting(matrixRecords[0], '2026-07-08');
const m3 = scheduleMeeting(matrixRecords[1], '2026-07-09');
const aggregate = aggregateScheduleAwareRuns([
  monthRun({
    schedule: [m1, m2, m3],
    details: [detailCandidate(matrixRecords[0], '2026-07-06')],
    blockers: [
      blocker(matrixRecords[0], '2026-07-08', 'parser_failure'),
      blocker(matrixRecords[1], '2026-07-09', 'source_unavailable'),
    ],
  }),
], dateArgs.checkedAt);

if (aggregate.detailCandidates.length !== 1) fail('A+ detail candidate count differs.');
if (aggregate.scheduleCandidates.length !== 2) fail('C schedule candidate count differs.');
if (aggregate.scheduleCandidates.some((candidate) => candidate.schedule_state !== 'scheduled_pending_details')) fail('future schedule candidates must be scheduled_pending_details.');

const artifacts = reconcileDetailBlockerRetries(
  buildScheduleAwareArtifacts({ parsedArgs: dateArgs, aggregate, checkedAt: dateArgs.checkedAt }),
  aggregate,
);
if (artifacts.coverage.coverage_claim !== 'source_window_complete') fail('complete schedule window claim differs.');
if (artifacts.coverage.source_errors.length !== 0) fail('future detail pending must not become source error.');
if (artifacts.coverage.unresolved_meeting_ids.length !== 2) fail('future pending meeting retry count differs.');
if (artifacts.retries.reason_counts.scheduled_pending_details !== 2) fail('future pending reason count differs.');
if (artifacts.candidates.detail_candidates[0].candidate_rank !== 'A+') fail('detail candidate rank must be A+.');
if (artifacts.candidates.schedule_candidates.some((candidate) => candidate.capability_rank !== 'C')) fail('schedule candidates must be C.');

const pastArgs = parseIncrementalV2Args([
  '--batch-id=past-retry-test-001',
  '--start-date=2026-07-05',
  '--end-date-exclusive=2026-07-06',
  '--checked-at=2026-07-07T12:00:00.000Z',
], matrixRecords);
const pastAggregate = aggregateScheduleAwareRuns([
  monthRun({
    schedule: [scheduleMeeting(matrixRecords[1], '2026-07-05')],
    blockers: [blocker(matrixRecords[1], '2026-07-05', 'parser_failure')],
  }),
], pastArgs.checkedAt);
const pastArtifacts = reconcileDetailBlockerRetries(
  buildScheduleAwareArtifacts({ parsedArgs: pastArgs, aggregate: pastAggregate, checkedAt: pastArgs.checkedAt }),
  pastAggregate,
);
if (pastArtifacts.candidates.schedule_candidates[0]?.schedule_state !== 'detail_retry_required') fail('past missing detail must require retry.');
if (pastArtifacts.coverage.source_errors.length !== 1) fail('past parser failure must be a source error.');

const selectedArgs = parseIncrementalV2Args([
  '--batch-id=selected-retry-test-001',
  '--meeting-id=nar-kawasaki-racecourse-2026-07-09',
  '--checked-at=2026-07-07T12:00:00.000Z',
], matrixRecords);
const selectedAggregate = aggregateScheduleAwareRuns([
  monthRun({
    schedule: [],
    blockers: [blocker(matrixRecords[1], '2026-07-09', 'parser_failure')],
  }),
], selectedArgs.checkedAt);
let selectedArtifacts = buildScheduleAwareArtifacts({ parsedArgs: selectedArgs, aggregate: selectedAggregate, checkedAt: selectedArgs.checkedAt });
selectedArtifacts = reconcileDetailBlockerRetries(selectedArtifacts, selectedAggregate);
if (!selectedArtifacts.coverage.unresolved_meeting_ids.includes('nar-kawasaki-racecourse-2026-07-09')) fail('selected unconfirmed detail blocker missing from unresolved IDs.');
if (selectedArtifacts.retries.reason_counts.selected_detail_retry_required !== 1) fail('selected retry reason count differs.');

if (errors.length) {
  console.error(`CALENDAR_NAR_INCREMENTAL_V2_CORE: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_NAR_INCREMENTAL_V2_CORE: pass');
console.log('IMMUTABLE_BATCH_PATHS: pass');
console.log('FUTURE_SCHEDULE_TO_C: pass');
console.log('AVAILABLE_DETAIL_TO_A_PLUS: pass');
console.log('PAST_DETAIL_FAILURE_TO_RETRY: pass');
console.log('SELECTED_UNCONFIRMED_RETRY: pass');
