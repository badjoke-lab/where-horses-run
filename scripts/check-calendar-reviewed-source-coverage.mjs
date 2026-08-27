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
const asOf = '2026-08-24T04:00:00Z';

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} exited with ${result.status}`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assertReviewedEmptyRecord(record, expected) {
  if (!record) throw new Error(`missing reviewed HKJC source coverage record for ${expected.start_date}`);
  if (record.source_id !== 'hkjc-fixture-list') throw new Error(`HKJC reviewed coverage source differs for ${expected.start_date}`);
  if (record.coverage_claim !== 'source_window_complete') throw new Error(`HKJC reviewed coverage claim differs for ${expected.start_date}`);
  if (record.records_discovered !== 0) throw new Error(`HKJC reviewed empty window must keep records_discovered=0 for ${expected.start_date}`);
  if (record.observed_scope.start_date !== expected.start_date
    || record.observed_scope.end_date_exclusive !== expected.end_date_exclusive) {
    throw new Error(`HKJC reviewed coverage scope differs for ${expected.start_date}`);
  }
  if (record.observed_scope.timezone !== 'Asia/Hong_Kong') throw new Error(`HKJC reviewed coverage timezone differs for ${expected.start_date}`);
  if (record.source_observation.pr_number !== 559) throw new Error(`HKJC reviewed coverage must reference PR #559 for ${expected.start_date}`);
  if (record.source_observation.run_id !== expected.run_id) throw new Error(`HKJC reviewed coverage run_id differs for ${expected.start_date}`);
  if (record.source_observation.blob_sha !== expected.blob_sha) throw new Error(`HKJC reviewed coverage source observation blob differs for ${expected.start_date}`);
  if (record.unresolved_dates.length !== 0 || record.unresolved_meeting_ids.length !== 0 || record.source_errors.length !== 0) {
    throw new Error(`HKJC reviewed complete coverage must remain fully resolved and error-free for ${expected.start_date}`);
  }
}

try {
  const coverage = loadCalendarReviewedSourceCoverageV1(root);
  const hkjcRecords = coverage.records
    .filter((record) => record.system_id === 'hong-kong-hkjc-system')
    .sort((left, right) => left.observed_scope.start_date.localeCompare(right.observed_scope.start_date));
  if (hkjcRecords.length !== 2) throw new Error(`expected exactly two reviewed HKJC source coverage records, got ${hkjcRecords.length}`);

  assertReviewedEmptyRecord(hkjcRecords[0], {
    start_date: '2026-09-21',
    end_date_exclusive: '2026-09-22',
    run_id: 'due-job-plan-2026-08-23-due-hong-kong-hkjc-season-wake-up-001-run-001',
    blob_sha: '1a4db8eb3557fa832372dc697fbe3bcd0ec492d2',
  });
  assertReviewedEmptyRecord(hkjcRecords[1], {
    start_date: '2026-09-22',
    end_date_exclusive: '2026-09-23',
    run_id: 'due-job-plan-2026-08-24-due-hong-kong-hkjc-season-wake-up-001-run-001',
    blob_sha: 'c3625107fc6cfb601b7ddc2a18d1e961437d7fa5',
  });

  const reviewedWindows = reviewedCompleteCoverageWindowsForSystem(coverage, 'hong-kong-hkjc-system', asOf);
  if (reviewedWindows.length !== 2) throw new Error(`expected two eligible reviewed HKJC empty windows, got ${reviewedWindows.length}`);
  if (extendContiguousSourceHorizon('2026-09-21', reviewedWindows) !== '2026-09-23') {
    throw new Error('reviewed HKJC empty windows must extend the contiguous source horizon through September 22');
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
  const fakeReviewedEmptyMeetings = publicMeetings.meetings.filter((meeting) => meeting.authority_id === 'hkjc'
    && (meeting.date === '2026-09-21' || meeting.date === '2026-09-22'));
  if (fakeReviewedEmptyMeetings.length !== 0) {
    throw new Error(`reviewed empty coverage must not create public HKJC September 21/22 meetings: ${JSON.stringify(fakeReviewedEmptyMeetings)}`);
  }

  run(process.execPath, [
    'scripts/timetable/build-calendar-live-planner-state.mjs',
    `--as-of=${asOf}`,
    '--window-days=30',
    `--output=${statePath}`,
  ]);

  const state = readJson(statePath);
  const hkjc = state.system_states.find((entry) => entry.system_id === 'hong-kong-hkjc-system');
  if (!hkjc) throw new Error('HKJC planner state missing');
  if (hkjc.source_visible_horizon_end_exclusive !== '2026-09-24') {
    throw new Error(`HKJC planner horizon should include reviewed September 21/22 empty coverage and September 23 fixture, got ${hkjc.source_visible_horizon_end_exclusive}`);
  }
  if (hkjc.coverage_gaps.length !== 0) {
    throw new Error(`HKJC 30-day planning window should be fully covered after reviewed empty September 21/22: ${JSON.stringify(hkjc.coverage_gaps)}`);
  }

  run(process.execPath, [
    'scripts/timetable/plan-calendar-due-jobs.mjs',
    `--state=${statePath}`,
    `--output=${planPath}`,
  ]);

  const plan = readJson(planPath);
  const hkjcJobs = plan.collection_plan.jobs.filter((job) => job.system_id === 'hong-kong-hkjc-system');
  if (hkjcJobs.length !== 0) throw new Error(`HKJC must not schedule another wake-up job inside the fully reviewed 30-day window: ${JSON.stringify(hkjcJobs)}`);
  if (plan.scheduler_boundary.automatic_approval !== false
    || plan.scheduler_boundary.automatic_promotion !== false
    || plan.scheduler_boundary.automatic_publication !== false
    || plan.scheduler_boundary.automatic_deployment !== false) {
    throw new Error('planner publication safety boundary changed');
  }

  console.log(JSON.stringify({
    reviewed_hkjc_windows: hkjcRecords.map((record) => record.observed_scope),
    planner_horizon_end_exclusive: hkjc.source_visible_horizon_end_exclusive,
    remaining_hkjc_coverage_gaps: hkjc.coverage_gaps.length,
    next_hkjc_job: null,
    fake_meetings_created: fakeReviewedEmptyMeetings.length,
  }));
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
