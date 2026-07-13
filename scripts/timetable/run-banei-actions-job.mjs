import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { buildBaneiActionsArtifactsV1 } from './banei-actions-executor-core.mjs';

const root = process.cwd();
const args = new Map(process.argv.slice(2).map((arg) => {
  const index = arg.indexOf('=');
  return index === -1 ? [arg, true] : [arg.slice(0, index), arg.slice(index + 1)];
}));
const executionPath = args.get('--execution');
if (!executionPath) throw new Error('--execution=<path> is required');
const checkOnly = args.has('--check-only');
const fixturePath = args.get('--fixture');
const execution = JSON.parse(fs.readFileSync(path.resolve(root, executionPath), 'utf8'));

if (execution.schema_version !== 'calendar-runner-execution-v1') throw new Error('Banei execution schema mismatch');
if (execution.system_id !== 'japan-banei-system') throw new Error('Banei Actions executor requires japan-banei-system');
if (execution.runner_used !== 'github_actions') throw new Error('Banei Actions executor requires github_actions runner');
if (execution.executor_id !== 'banei-schedule-detail-actions') throw new Error('Banei Actions executor_id mismatch');
if (!['date_window', 'selected_meetings'].includes(execution.collection_mode)) {
  throw new Error(`Banei Actions executor does not support ${execution.collection_mode}`);
}

function runNode(script, scriptArgs) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${script} exited with status ${result.status}`);
}

function readJson(absoluteOrRelativePath) {
  return JSON.parse(fs.readFileSync(path.resolve(root, absoluteOrRelativePath), 'utf8'));
}

function writeJson(relativePath, value) {
  const absolute = path.resolve(root, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
}

function nextMonth(month) {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + 1);
  return date.toISOString().slice(0, 7);
}

function executionTargetMonth(value) {
  if (value.collection_mode === 'date_window') {
    const { start_date: startDate, end_date_exclusive: endDateExclusive, timezone } = value.requested_scope ?? {};
    if (timezone !== 'Asia/Tokyo') throw new Error('Banei date-window timezone must be Asia/Tokyo');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate ?? '') || !/^\d{4}-\d{2}-\d{2}$/.test(endDateExclusive ?? '')) {
      throw new Error('Banei date-window scope requires valid start and exclusive end dates');
    }
    const month = startDate.slice(0, 7);
    const monthStart = `${month}-01`;
    const monthEndExclusive = `${nextMonth(month)}-01`;
    if (startDate < monthStart || endDateExclusive > monthEndExclusive || startDate >= endDateExclusive) {
      throw new Error('Banei date-window Job must remain within one calendar month');
    }
    return month;
  }
  const meetingIds = value.requested_scope?.meeting_ids ?? [];
  if (!Array.isArray(meetingIds) || meetingIds.length === 0) throw new Error('Banei selected-meeting scope is empty');
  const months = [...new Set(meetingIds.map((meetingId) => meetingId.match(/-(\d{4}-\d{2})-\d{2}$/)?.[1]))];
  if (months.some((month) => !month) || months.length !== 1) {
    throw new Error('Banei selected-meeting Job must remain within one calendar month');
  }
  return months[0];
}

let scheduleInput;
let detailCandidate;
let detailCoverage;
let detailReport;
let tempRoot = null;

try {
  if (fixturePath) {
    const fixture = readJson(fixturePath);
    if (fixture.schema_version !== 'calendar-banei-actions-executor-fixture-v1') {
      throw new Error('Banei Actions executor fixture schema mismatch');
    }
    scheduleInput = fixture.schedule_input;
    const scenario = fixture.scenarios?.find((entry) => entry.collection_mode === execution.collection_mode);
    if (!scenario) throw new Error(`Banei fixture scenario missing for ${execution.collection_mode}`);
    detailCandidate = scenario.detail_candidate;
    detailCoverage = scenario.detail_coverage;
    detailReport = scenario.detail_report;
  } else {
    const targetMonth = executionTargetMonth(execution);
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-banei-actions-'));
    const scheduleCandidatePath = path.join(tempRoot, 'schedule-candidate.json');
    const scheduleReportPath = path.join(tempRoot, 'schedule-report.json');
    runNode('scripts/timetable/collect-banei-full-month-calendar.mjs', [
      `--target-month=${targetMonth}`,
      `--candidate-output=${scheduleCandidatePath}`,
      `--report-output=${scheduleReportPath}`,
    ]);
    scheduleInput = readJson(scheduleCandidatePath);
    if (scheduleInput.target_month !== targetMonth) throw new Error('Banei collected schedule month differs from execution month');

    const detailRoot = path.join(tempRoot, 'detail');
    const collectorArgs = [
      `--input=${scheduleCandidatePath}`,
      `--batch-id=${execution.batch_id}`,
      `--output-root=${detailRoot}`,
      '--delay-ms=140',
    ];
    if (execution.collection_mode === 'date_window') {
      collectorArgs.push(`--start-date=${execution.requested_scope.start_date}`);
      collectorArgs.push(`--end-date-exclusive=${execution.requested_scope.end_date_exclusive}`);
    } else {
      collectorArgs.push(`--meeting-ids=${execution.requested_scope.meeting_ids.join(',')}`);
    }
    runNode('scripts/timetable/collect-banei-detail-window.mjs', collectorArgs);
    detailCandidate = readJson(path.join(detailRoot, 'candidate.json'));
    detailCoverage = readJson(path.join(detailRoot, 'coverage-observation.json'));
    detailReport = readJson(path.join(detailRoot, 'collection-report.json'));
  }

  const artifacts = buildBaneiActionsArtifactsV1({
    execution,
    schedule_input: scheduleInput,
    detail_candidate: detailCandidate,
    detail_coverage: detailCoverage,
    detail_report: detailReport,
  });

  const outputRoot = `data/generated/timetable/actions-multi-job/${execution.batch_id}`;
  if (!checkOnly) {
    writeJson(path.join(outputRoot, 'candidates.json'), artifacts.candidate);
    writeJson(path.join(outputRoot, 'coverage-observation.json'), artifacts.coverage_observation);
    writeJson(path.join(outputRoot, 'result-manifest.json'), artifacts.result_manifest);
    writeJson(path.join(outputRoot, 'review-queue.json'), artifacts.review_queue);
    writeJson(path.join(outputRoot, 'collection-report.json'), artifacts.collection_report);
  }

  console.log(JSON.stringify({
    batch_id: execution.batch_id,
    target_month: scheduleInput.target_month ?? null,
    collection_mode: execution.collection_mode,
    records_discovered: artifacts.result_manifest.records_discovered,
    records_updated: artifacts.result_manifest.records_updated,
    rank_counts: artifacts.result_manifest.rank_counts,
    coverage_claim: artifacts.result_manifest.coverage_claim,
    unresolved_meeting_count: artifacts.result_manifest.unresolved_meeting_ids.length,
    source_error_count: artifacts.result_manifest.source_errors.length,
    review_state: artifacts.review_queue.entries[0]?.review_state ?? null,
    publication_effect: artifacts.collection_report.publication_effect,
    check_only: checkOnly,
  }));
} finally {
  if (tempRoot) fs.rmSync(tempRoot, { recursive: true, force: true });
}
