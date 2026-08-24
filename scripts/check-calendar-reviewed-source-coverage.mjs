import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  extendContiguousSourceHorizon,
  loadCalendarReviewedSourceCoverageV1,
  reviewedCompleteCoverageWindowsForSystem,
} from './timetable/load-calendar-reviewed-source-coverage.mjs';

const root = process.cwd();
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-reviewed-source-coverage-'));
const statePath = path.join(tempDir, 'live-state.json');
const planPath = path.join(tempDir, 'due-plan.json');
const asOf = '2026-08-24T00:45:00Z';

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} exited with ${result.status}`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

try {
  const coverage = loadCalendarReviewedSourceCoverageV1(root);
  const hkjcRecords = coverage.records.filter((record) => record.system_id === 'hong-kong-hkjc-system');
  if (hkjcRecords.length !== 1) throw new Error(`expected exactly one reviewed HKJC source coverage record, got ${hkjcRecords.length}`);

  const record = hkjcRecords[0];
  if (record.source_id !== 'hkjc-fixture-list') throw new Error('HKJC reviewed coverage source differs');
  if (record.coverage_claim !== 'source_window_complete') throw new Error('HKJC reviewed coverage claim differs');
  if (record.records_discovered !== 0) throw new Error('HKJC reviewed empty window must keep records_discovered=0');
  if (record.observed_scope.start_date !== '2026-09-21' || record.observed_scope.end_date_exclusive !== '2026-09-22') {
    throw new Error('HKJC reviewed coverage scope differs');
  }
  if (record.observed_scope.timezone !== 'Asia/Hong_Kong') throw new Error('HKJC reviewed coverage timezone differs');
  if (record.source_observation.pr_number !== 559) throw new Error('HKJC reviewed coverage must reference PR #559');
  if (record.source_observation.run_id !== 'due-job-plan-2026-08-23-due-hong-kong-hkjc-season-wake-up-001-run-001') {
    throw new Error('HKJC reviewed coverage run_id differs');
  }
  if (record.source_observation.blob_sha !== '1a4db8eb3557fa832372dc697fbe3bcd0ec492d2') {
    throw new Error('HKJC reviewed coverage source observation blob differs');
  }
  if (record.unresolved_dates.length !== 0 || record.unresolved_meeting_ids.length !== 0 || record.source_errors.length !== 0) {
    throw new Error('HKJC reviewed complete coverage must remain fully resolved and error-free');
  }

  const reviewedWindows = reviewedCompleteCoverageWindowsForSystem(coverage, 'hong-kong-hkjc-system', asOf);
  if (reviewedWindows.length !== 1) throw new Error(`expected one eligible reviewed HKJC empty window, got ${reviewedWindows.length}`);
  if (extendContiguousSourceHorizon('2026-09-21', reviewedWindows) !== '2026-09-22') {
    throw new Error('reviewed HKJC empty window must extend the contiguous source horizon through September 21');
  }
  if (extendContiguousSourceHorizon('2026-09-21', [{
    kind: 'date_window', start_date: '2026-09-22', end_date_exclusive: '2026-09-23', timezone: 'Asia/Hong_Kong',
  }]) !== '2026-09-21') {
    throw new Error('non-contiguous reviewed coverage must not bridge an unknown date');
  }
  if (extendContiguousSourceHorizon('2026-09-21', [
    { kind: 'date_window', start_date: '2026-09-21', end_date_exclusive: '2026-09-22', timezone: 'Asia/Hong_Kong' },
    { kind: 'date_window', start_date: '2026-09-22', end_date_exclusive: '2026-09-24', timezone: 'Asia/Hong_Kong' },
  ]) !== '2026-09-24') {
    throw new Error('contiguous reviewed windows must extend transitively');
  }

  const syntheticNonEmpty = {
    records: [{
      system_id: 'hong-kong-hkjc-system',
      checked_at: '2026-08-23T15:10:02.542Z',
      reviewed_at: '2026-08-24T00:42:00Z',
      coverage_claim: 'source_window_complete',
      records_discovered: 1,
      observed_scope: {
        kind: 'date_window',
        start_date: '2026-09-21',
        end_date_exclusive: '2026-09-22',
        timezone: 'Asia/Hong_Kong',
      },
    }],
  };
  if (reviewedCompleteCoverageWindowsForSystem(syntheticNonEmpty, 'hong-kong-hkjc-system', asOf).length !== 0) {
    throw new Error('non-empty reviewed source windows must not suppress missing public meeting coverage');
  }

  const publicMeetings = readJson(path.join(root, 'data/generated/timetable/public/meeting-list.json'));
  const fakeSeptember21 = publicMeetings.meetings.filter((meeting) => meeting.authority_id === 'hkjc' && meeting.date === '2026-09-21');
  if (fakeSeptember21.length !== 0) throw new Error('reviewed empty coverage must not create a public HKJC September 21 meeting');

  run(process.execPath, [
    'scripts/timetable/build-calendar-live-planner-state.mjs',
    `--as-of=${asOf}`,
    '--window-days=30',
    `--output=${statePath}`,
  ]);

  const state = readJson(statePath);
  const hkjc = state.system_states.find((entry) => entry.system_id === 'hong-kong-hkjc-system');
  if (!hkjc) throw new Error('HKJC planner state missing');
  if (hkjc.source_visible_horizon_end_exclusive !== '2026-09-22') {
    throw new Error(`HKJC planner horizon should include reviewed empty September 21 coverage, got ${hkjc.source_visible_horizon_end_exclusive}`);
  }
  if (hkjc.coverage_gaps.length !== 1
    || hkjc.coverage_gaps[0].start_date !== '2026-09-22'
    || hkjc.coverage_gaps[0].end_date_exclusive !== '2026-09-23') {
    throw new Error(`HKJC remaining coverage gap should begin after the reviewed empty day: ${JSON.stringify(hkjc.coverage_gaps)}`);
  }

  run(process.execPath, [
    'scripts/timetable/plan-calendar-due-jobs.mjs',
    `--state=${statePath}`,
    `--output=${planPath}`,
  ]);

  const plan = readJson(planPath);
  const hkjcJobs = plan.collection_plan.jobs.filter((job) => job.system_id === 'hong-kong-hkjc-system');
  if (hkjcJobs.length !== 1) throw new Error(`expected exactly one remaining HKJC wake-up job, got ${hkjcJobs.length}`);
  const hkjcScope = hkjcJobs[0].requested_scope;
  if (hkjcScope.start_date !== '2026-09-22' || hkjcScope.end_date_exclusive !== '2026-09-23') {
    throw new Error(`HKJC next job must start after reviewed empty September 21: ${JSON.stringify(hkjcScope)}`);
  }
  if (hkjcScope.start_date <= '2026-09-21' && '2026-09-21' < hkjcScope.end_date_exclusive) {
    throw new Error('HKJC September 21 must not be reacquired after reviewed empty coverage is persisted');
  }
  if (plan.scheduler_boundary.automatic_approval !== false
    || plan.scheduler_boundary.automatic_promotion !== false
    || plan.scheduler_boundary.automatic_publication !== false
    || plan.scheduler_boundary.automatic_deployment !== false) {
    throw new Error('planner publication safety boundary changed');
  }

  console.log(JSON.stringify({
    reviewed_hkjc_window: record.observed_scope,
    records_discovered: record.records_discovered,
    planner_horizon_end_exclusive: hkjc.source_visible_horizon_end_exclusive,
    next_hkjc_scope: hkjcScope,
    fake_meetings_created: fakeSeptember21.length,
  }));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
