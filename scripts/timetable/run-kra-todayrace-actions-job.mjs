import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';
import { validateRunnerExecutionV1 } from './runner-compatibility.mjs';
import { validateCoverageObservation } from './coverage-observation-validation.mjs';
import { validateCollectionResultManifestV1 } from './collection-result-manifest-validation.mjs';

const root = process.cwd();
const TIMEZONE = 'Asia/Seoul';
const SYSTEM_ID = 'kra-national-racing-system';
const COUNTRY_ID = 'south-korea';
const AUTHORITY_ID = 'korea-racing-authority';
const SOURCE_ID = 'kra-today-race';
const ADAPTER_ID = 'kra-today-race-live-v1';
const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const RANK_INDEX = new Map(RANKS.map((rank, index) => [rank, index]));
const argument = (name) => process.argv.find((item) => item.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const executionArg = argument('execution');
const outputArg = argument('output-dir');
if (!executionArg) throw new Error('--execution=<path> is required');

const executionPath = path.resolve(root, executionArg);
const execution = JSON.parse(fs.readFileSync(executionPath, 'utf8'));
const registry = loadCalendarAcquisitionRegistryV1(root);
const compatibility = JSON.parse(fs.readFileSync(path.join(root, 'data/static/calendar-runner-compatibility-contract-v1.json'), 'utf8'));
const generatedAt = new Date().toISOString();
const job = {
  schema_version: 'calendar-collection-job-v1',
  job_id: execution.job_id,
  campaign_id: execution.campaign_id,
  system_id: execution.system_id,
  runner_policy: { mode: 'exact', runner: execution.runner_used },
  collection_mode: execution.collection_mode,
  requested_scope: structuredClone(execution.requested_scope),
  rank_strategy: execution.rank_strategy,
  target_rank: execution.target_rank,
  reason: execution.reason,
  requested_at: generatedAt,
};

function assertExecution() {
  const errors = validateRunnerExecutionV1(execution, job, registry, compatibility);
  if (errors.length) throw new Error(`KRA execution validation failed: ${errors.join('; ')}`);
  if (execution.system_id !== SYSTEM_ID) throw new Error(`KRA Actions executor requires ${SYSTEM_ID}`);
  if (execution.runner_used !== 'github_actions') throw new Error('KRA Actions executor requires github_actions');
  if (execution.executor_id !== 'kra-todayrace-actions') throw new Error('KRA Actions executor identity differs');
  if (execution.collection_mode !== 'selected_meetings') throw new Error('KRA Actions executor supports selected_meetings only');
  if (execution.rank_strategy !== 'best_available' || execution.target_rank !== null) {
    throw new Error('KRA selected-meeting execution currently requires best_available with no target_rank');
  }
  if (execution.source_route?.schedule_source_id !== SOURCE_ID
    || execution.source_route?.detail_source_id !== SOURCE_ID
    || execution.source_route?.schedule_adapter_id !== ADAPTER_ID
    || execution.source_route?.detail_adapter_id !== ADAPTER_ID) {
    throw new Error('KRA Actions source route differs from Acquisition Registry');
  }
  if (execution.review_required !== true) throw new Error('KRA Actions execution must require review');
  if (Object.values(execution.side_effect_boundary ?? {}).some((value) => value !== false)) {
    throw new Error('KRA Actions side-effect boundary must remain false');
  }
}

function parseMeetingId(meetingId) {
  const match = String(meetingId).match(/^kra-(seoul-racecourse|jeju-racecourse|busan-gyeongnam-racecourse)-(\d{4}-\d{2}-\d{2})$/);
  if (!match) throw new Error(`unsupported KRA meeting_id ${meetingId}`);
  const date = match[2];
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error(`invalid date in KRA meeting_id ${meetingId}`);
  }
  return { meetingId, racecourseId: match[1], date };
}

function runCollector(scope) {
  const result = spawnSync(process.execPath, [
    'scripts/timetable/collect-kra-todayrace.mjs',
    `--date=${scope.date}`,
    `--racecourse-id=${scope.racecourseId}`,
  ], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || `collector exited ${result.status}`).slice(0, 500));
  const observation = JSON.parse(result.stdout);
  if (observation.meeting_id !== scope.meetingId) throw new Error(`collector meeting_id differs for ${scope.meetingId}`);
  if (!RANK_INDEX.has(observation.capability_rank)) throw new Error(`collector rank invalid for ${scope.meetingId}`);
  if (observation.raw_html_stored !== false) throw new Error(`collector raw HTML boundary differs for ${scope.meetingId}`);
  return observation;
}

function sourceErrorFromStatus(meetingId, status) {
  if (status.status === 'success') return null;
  const code = status.http_status === 429
    ? 'rate_limited'
    : status.status === 'network_error' || status.status === 'timeout'
      ? 'source_unavailable'
      : 'unexpected_response';
  return {
    code,
    scope_ref: `${meetingId}:${status.source}`,
    message: `KRA source ${status.source} returned ${status.status}${status.http_status ? ` (${status.http_status})` : ''}.`.slice(0, 500),
  };
}

function candidateRecord(observation) {
  return {
    candidate_id: `${observation.meeting_id}-todayrace-candidate`,
    meeting_id: observation.meeting_id,
    country_id: COUNTRY_ID,
    authority_id: AUTHORITY_ID,
    racing_system_id: SYSTEM_ID,
    racecourse_id: observation.racecourse_id,
    date: observation.date,
    timezone: TIMEZONE,
    capability_rank: observation.capability_rank,
    first_race_time_local: observation.first_race_time_local,
    last_race_time_local: observation.last_race_time_local,
    timetable_rows: structuredClone(observation.timetable_rows ?? []),
    source: structuredClone(observation.source),
    confidence: 'high',
    review_status: 'needs_review',
    notes: 'Official KRA todayrace best-available observation. Review is required before any promotion or public write.',
  };
}

function logicalArtifactRefs(batchId) {
  const base = `data/generated/timetable/actions-multi-job/${batchId}`;
  return {
    candidate_ref: `${base}/candidates.json`,
    coverage_observation_ref: `${base}/coverage-observation.json`,
    collection_report_ref: `${base}/collection-report.json`,
  };
}

function rankCounts(records) {
  return Object.fromEntries(RANKS.map((rank) => [rank, records.filter((record) => record.capability_rank === rank).length]));
}

assertExecution();

const observations = [];
const unresolvedMeetingIds = [];
const sourceErrors = [];
for (const meetingId of execution.requested_scope.meeting_ids) {
  try {
    const scope = parseMeetingId(meetingId);
    const observation = runCollector(scope);
    observations.push(observation);
    for (const status of observation.source_statuses ?? []) {
      const sourceError = sourceErrorFromStatus(meetingId, status);
      if (sourceError) sourceErrors.push(sourceError);
    }
  } catch (error) {
    unresolvedMeetingIds.push(meetingId);
    sourceErrors.push({
      code: 'source_unavailable',
      scope_ref: meetingId,
      message: String(error?.message ?? error).slice(0, 500),
    });
  }
}

const records = observations.map(candidateRecord);
const observedMeetingIds = observations.map((observation) => observation.meeting_id);
const requestedCoverageScope = {
  kind: 'selected_meetings',
  meeting_ids: structuredClone(execution.requested_scope.meeting_ids),
  timezone: TIMEZONE,
};
const observedScope = observedMeetingIds.length > 0
  ? { kind: 'selected_meetings', meeting_ids: observedMeetingIds, timezone: TIMEZONE }
  : { kind: 'not_observed', timezone: TIMEZONE };
const coverageClaim = sourceErrors.length === 0 && observations.length === execution.requested_scope.meeting_ids.length
  ? 'source_window_complete'
  : observations.length > 0
    ? 'partial'
    : 'none';
const refs = logicalArtifactRefs(execution.batch_id);
const counts = rankCounts(records);

const candidate = {
  schema_version: 'timetable-candidate-v1',
  generated_at: generatedAt,
  adapter_id: ADAPTER_ID,
  country_id: COUNTRY_ID,
  authority_id: AUTHORITY_ID,
  source_id: SOURCE_ID,
  candidate_window: {
    meeting_ids: structuredClone(execution.requested_scope.meeting_ids),
    timezone: TIMEZONE,
  },
  records,
  review: {
    status: 'needs_review',
    reviewed_at: null,
    reviewer: null,
    summary: 'KRA selected-meeting live acquisition. Best-available observations require review before promotion.',
    promotion_target: null,
  },
};

const coverage = {
  schema_version: 'calendar-coverage-observation-v1',
  run_id: execution.batch_id,
  system_id: SYSTEM_ID,
  source_id: SOURCE_ID,
  checked_at: generatedAt,
  requested_scope: requestedCoverageScope,
  observed_scope: observedScope,
  collection_mode: 'selected_meetings',
  records_discovered: records.length,
  records_updated: records.length,
  unresolved_dates: [],
  unresolved_meeting_ids: unresolvedMeetingIds,
  source_errors: sourceErrors,
  coverage_claim: coverageClaim,
  completion_audit_ref: null,
};

const manifest = {
  schema_version: 'calendar-collection-result-manifest-v1',
  campaign_id: execution.campaign_id,
  job_id: execution.job_id,
  batch_id: execution.batch_id,
  system_id: SYSTEM_ID,
  runner_used: execution.runner_used,
  requested_scope: { meeting_ids: structuredClone(execution.requested_scope.meeting_ids) },
  observed_scope: structuredClone(observedScope),
  coverage_claim: coverageClaim,
  records_discovered: records.length,
  records_updated: records.length,
  rank_counts: counts,
  unresolved_dates: [],
  unresolved_meeting_ids: unresolvedMeetingIds,
  source_errors: sourceErrors,
  artifact_refs: refs,
};

const report = {
  schema_version: 'kra-todayrace-actions-report-v1',
  batch_id: execution.batch_id,
  system_id: SYSTEM_ID,
  generated_at: generatedAt,
  collection_mode: 'selected_meetings',
  requested_meeting_ids: structuredClone(execution.requested_scope.meeting_ids),
  observed_meeting_ids: observedMeetingIds,
  rank_counts: counts,
  source_error_count: sourceErrors.length,
  review_required: true,
  canonical_write: false,
  public_write: false,
};

const coverageValidation = validateCoverageObservation(coverage);
if (!coverageValidation.valid) throw new Error(`KRA Coverage invalid: ${coverageValidation.errors.join('; ')}`);
const manifestErrors = validateCollectionResultManifestV1(manifest);
if (manifestErrors.length) throw new Error(`KRA Manifest invalid: ${manifestErrors.join('; ')}`);
if (candidate.review.status !== 'needs_review') throw new Error('KRA candidate review boundary differs');

const outputDir = outputArg
  ? path.resolve(root, outputArg)
  : path.join(root, `data/generated/timetable/actions-multi-job/${execution.batch_id}`);
fs.mkdirSync(outputDir, { recursive: true });
for (const [filename, value] of Object.entries({
  'candidates.json': candidate,
  'coverage-observation.json': coverage,
  'result-manifest.json': manifest,
  'collection-report.json': report,
})) {
  fs.writeFileSync(path.join(outputDir, filename), `${JSON.stringify(value, null, 2)}\n`);
}

console.log(JSON.stringify({
  schema_version: 'kra-todayrace-actions-summary-v1',
  batch_id: execution.batch_id,
  records_discovered: records.length,
  rank_counts: counts,
  coverage_claim: coverageClaim,
  source_error_count: sourceErrors.length,
  output_dir: path.relative(root, outputDir),
  review_required: true,
  canonical_write: false,
  public_write: false,
}, null, 2));
