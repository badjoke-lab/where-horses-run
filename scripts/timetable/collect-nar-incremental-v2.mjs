import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  aggregateScheduleAwareRuns,
  buildScheduleAwareArtifacts,
  parseIncrementalV2Args,
  unresolvedDatesForGroup,
} from './nar-incremental-v2-core.mjs';
import { parseMeetingId } from './nar-incremental-core.mjs';

const root = process.cwd();
const matrixPath = 'data/static/nar-flat-racecourse-compatibility-v1.json';
const scratchCandidatePath = 'data/candidates/nar-monthly-meeting-candidates.json';
const scratchReportPath = 'data/generated/timetable/nar-monthly-collection-report.json';
const scratchSchedulePath = 'data/generated/timetable/nar-schedule-observation-scratch.json';
const matrix = JSON.parse(fs.readFileSync(path.join(root, matrixPath), 'utf8'));
const parsedArgs = parseIncrementalV2Args(process.argv.slice(2), matrix.records);
const checkedAt = parsedArgs.checkedAt ?? new Date().toISOString();

function run(command, args) {
  console.log(`$ ${command} ${args.join(' ')}`);
  execFileSync(command, args, { cwd: root, stdio: 'inherit' });
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function writeJson(relativePath, value) {
  const absolute = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
}

function snapshot(relativePath) {
  const absolute = path.join(root, relativePath);
  return fs.existsSync(absolute) ? fs.readFileSync(absolute) : null;
}

function restore(relativePath, buffer) {
  const absolute = path.join(root, relativePath);
  if (buffer === null) {
    if (fs.existsSync(absolute)) fs.unlinkSync(absolute);
    return;
  }
  fs.writeFileSync(absolute, buffer);
}

function safeMessage(error) {
  return String(error?.message ?? error).replace(/\s+/g, ' ').slice(0, 450);
}

function groupUnresolvedDates(group) {
  if (parsedArgs.collectionMode === 'date_window') return unresolvedDatesForGroup(group);
  return [...new Set((group.meetingIds ?? []).map((meetingId) => parseMeetingId(meetingId, matrix.records).date))].sort();
}

function monthArgs(group) {
  if (parsedArgs.collectionMode === 'date_window') {
    return [
      `--month=${group.month}`,
      `--start-date=${group.startDate}`,
      `--end-date-exclusive=${group.endDateExclusive}`,
    ];
  }
  return [
    `--month=${group.month}`,
    `--meeting-ids=${group.meetingIds.join(',')}`,
  ];
}

function assertImmutableOutputs() {
  if (parsedArgs.dryRun) return;
  const existing = Object.values(parsedArgs.paths).filter((relativePath) => fs.existsSync(path.join(root, relativePath)));
  if (existing.length) {
    throw new Error(`Batch output already exists and is immutable: ${existing.join(', ')}`);
  }
}

function collectMonthRuns() {
  const runs = [];
  const candidateBefore = snapshot(scratchCandidatePath);
  const reportBefore = snapshot(scratchReportPath);
  const scheduleBefore = snapshot(scratchSchedulePath);

  try {
    for (const group of parsedArgs.monthGroups) {
      console.log(`\n[NAR incremental v2] schedule/detail month=${group.month}`);
      try {
        run(process.execPath, [
          'scripts/timetable/normalize-nar-schedule-aware-month.mjs',
          ...monthArgs(group),
        ]);
        runs.push({
          schedule: readJson(scratchSchedulePath),
          candidates: readJson(scratchCandidatePath),
          report: readJson(scratchReportPath),
        });
      } catch (error) {
        const message = safeMessage(error);
        console.error(`[NAR incremental v2] month=${group.month} failed: ${message}`);
        runs.push({
          error: {
            code: 'other',
            scope_ref: `month-${group.month}`,
            message: `NAR schedule/detail month collection failed for ${group.month}: ${message}`,
            unresolved_dates: groupUnresolvedDates(group),
          },
        });
      }
    }
  } finally {
    restore(scratchCandidatePath, candidateBefore);
    restore(scratchReportPath, reportBefore);
    restore(scratchSchedulePath, scheduleBefore);
  }

  return runs;
}

assertImmutableOutputs();
const monthRuns = collectMonthRuns();
const aggregate = aggregateScheduleAwareRuns(monthRuns, checkedAt);
const artifacts = buildScheduleAwareArtifacts({ parsedArgs, aggregate, checkedAt });

if (parsedArgs.dryRun) {
  console.log(JSON.stringify({ report: artifacts.report, coverage: artifacts.coverage, retries: artifacts.retries }, null, 2));
} else {
  writeJson(parsedArgs.paths.candidates, artifacts.candidates);
  writeJson(parsedArgs.paths.report, artifacts.report);
  writeJson(parsedArgs.paths.coverage, artifacts.coverage);
  writeJson(parsedArgs.paths.retries, artifacts.retries);
}

console.log(JSON.stringify({
  batch_id: parsedArgs.batchId,
  collection_mode: parsedArgs.collectionMode,
  requested_scope: parsedArgs.requestedScope,
  scheduled_meetings: artifacts.report.scheduled_meetings,
  complete_detail_candidates: artifacts.report.complete_detail_candidates,
  schedule_only_candidates: artifacts.report.schedule_only_candidates,
  detail_blockers: artifacts.report.detail_blockers,
  schedule_errors: artifacts.report.schedule_errors,
  coverage_claim: artifacts.coverage.coverage_claim,
  unresolved_dates: artifacts.coverage.unresolved_dates.length,
  unresolved_meeting_ids: artifacts.coverage.unresolved_meeting_ids.length,
  output_paths: parsedArgs.paths,
  publication_effect: artifacts.report.publication_effect,
}, null, 2));
