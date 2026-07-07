import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  NAR_INCREMENTAL_PATHS,
  addDays,
  aggregateMonthlyScratch,
  buildIncrementalArtifacts,
  parseIncrementalArgs,
  parseMeetingId,
} from './nar-incremental-core.mjs';

const root = process.cwd();
const matrixPath = 'data/static/nar-flat-racecourse-compatibility-v1.json';
const scratchCandidatePath = 'data/candidates/nar-monthly-meeting-candidates.json';
const scratchReportPath = 'data/generated/timetable/nar-monthly-collection-report.json';
const matrix = JSON.parse(fs.readFileSync(path.join(root, matrixPath), 'utf8'));
const parsedArgs = parseIncrementalArgs(process.argv.slice(2), matrix.records);
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

function meetingIdOf(value) {
  if (value.candidate_id) return value.candidate_id;
  if (value.meeting_id) return value.meeting_id;
  if (value.racecourse_id && value.date) return `nar-${value.racecourse_id}-${value.date}`;
  return null;
}

function filterScratch(candidateSet, report, group) {
  const selectedIds = new Set(group.meetingIds ?? []);
  const inScope = (value) => {
    const id = meetingIdOf(value);
    if (parsedArgs.collectionMode === 'selected_meetings') return Boolean(id && selectedIds.has(id));
    return value.date >= group.startDate && value.date < group.endDateExclusive;
  };

  const meetings = (candidateSet.meetings ?? []).filter(inScope);
  const blockers = (candidateSet.blockers ?? []).filter(inScope);

  if (parsedArgs.collectionMode === 'selected_meetings') {
    const observed = new Set([...meetings, ...blockers].map(meetingIdOf).filter(Boolean));
    for (const meetingId of selectedIds) {
      if (observed.has(meetingId)) continue;
      const resolved = parseMeetingId(meetingId, matrix.records);
      blockers.push({
        venue_code: resolved.venue_code,
        racecourse_id: resolved.racecourse_id,
        date: resolved.date,
        status: 'not_observed',
        blockers: [{ reason: 'selected_meeting_not_observed_in_schedule_run' }],
        list_http_status: null,
        list_final_url: null,
      });
    }
  }

  return {
    candidates: { ...candidateSet, meetings, blockers },
    report: {
      ...report,
      meetings_discovered: meetings.length + blockers.length,
      complete_meeting_candidates: meetings.length,
      blocked_meetings: blockers.length,
    },
  };
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

function collectScratchRuns() {
  const runs = [];
  const candidateBefore = snapshot(scratchCandidatePath);
  const reportBefore = snapshot(scratchReportPath);
  try {
    for (const group of parsedArgs.monthGroups) {
      const throughDate = addDays(group.endDateExclusive, -1);
      console.log(`\n[NAR incremental] scratch month=${group.month} through=${throughDate}`);
      run(process.execPath, [
        'scripts/timetable/normalize-nar-monthly-schedule-fetch.mjs',
        `--month=${group.month}`,
        `--through-date=${throughDate}`,
        '--allow-blockers',
      ]);
      runs.push(filterScratch(readJson(scratchCandidatePath), readJson(scratchReportPath), group));
    }
  } finally {
    restore(scratchCandidatePath, candidateBefore);
    restore(scratchReportPath, reportBefore);
  }
  return runs;
}

const monthlyRuns = collectScratchRuns();
const aggregate = aggregateMonthlyScratch(monthlyRuns);
const artifacts = buildIncrementalArtifacts({ parsedArgs, aggregate, checkedAt });

if (parsedArgs.dryRun) {
  console.log(JSON.stringify({ report: artifacts.report, coverage: artifacts.coverage, retries: artifacts.retries }, null, 2));
} else {
  writeJson(NAR_INCREMENTAL_PATHS.candidates, artifacts.candidates);
  writeJson(NAR_INCREMENTAL_PATHS.report, artifacts.report);
  writeJson(NAR_INCREMENTAL_PATHS.coverage, artifacts.coverage);
  writeJson(NAR_INCREMENTAL_PATHS.retries, artifacts.retries);
}

console.log(JSON.stringify({
  collection_mode: parsedArgs.collectionMode,
  requested_scope: parsedArgs.requestedScope,
  meetings_discovered: artifacts.report.meetings_discovered,
  complete_meeting_candidates: artifacts.report.complete_meeting_candidates,
  blocked_meetings: artifacts.report.blocked_meetings,
  coverage_claim: artifacts.coverage.coverage_claim,
  unresolved_dates: artifacts.coverage.unresolved_dates.length,
  unresolved_meeting_ids: artifacts.coverage.unresolved_meeting_ids.length,
  publication_effect: artifacts.report.publication_effect,
}, null, 2));
