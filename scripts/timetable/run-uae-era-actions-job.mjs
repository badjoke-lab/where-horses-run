import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadCalendarAcquisitionRegistryV1 } from './load-calendar-acquisition-registry.mjs';
import { validateRunnerExecutionV1 } from './runner-compatibility.mjs';
import {
  buildUaeEraRankUpgradeArtifactsV1,
  buildUaeEraRetryQueueV1,
  buildUaeEraReviewQueueV1,
} from './uae-era-rank-upgrade-core.mjs';

const root = process.cwd();
const SUPPORTED_COLLECTION_MODES = Object.freeze(['source_visible_horizon', 'selected_meetings']);
const argument = (name) => process.argv.find((item) => item.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const executionArg = argument('execution');
const outputArg = argument('output-dir');
const fixtureArg = argument('check-only-fixture');
if (!executionArg) throw new Error('--execution=<path> is required');
const executionPath = path.resolve(root, executionArg);
const execution = JSON.parse(fs.readFileSync(executionPath, 'utf8'));
const registry = loadCalendarAcquisitionRegistryV1(root);
const compatibility = JSON.parse(fs.readFileSync(path.join(root, 'data/static/calendar-runner-compatibility-contract-v1.json'), 'utf8'));
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
  requested_at: '2026-07-13T00:00:00Z',
};
const executionErrors = validateRunnerExecutionV1(execution, job, registry, compatibility);
if (executionErrors.length) throw new Error(`UAE execution validation failed: ${executionErrors.join('; ')}`);
if (execution.system_id !== 'uae-national-racing-system') throw new Error('UAE Actions executor requires uae-national-racing-system');
if (execution.runner_used !== 'github_actions') throw new Error('UAE Actions executor requires github_actions');
if (execution.executor_id !== 'uae-era-actions') throw new Error('UAE Actions executor identity differs');
if (execution.collection_mode !== 'source_visible_horizon' && execution.collection_mode !== 'selected_meetings') {
  throw new Error(`UAE Actions executor mode unsupported: ${execution.collection_mode}; expected ${SUPPORTED_COLLECTION_MODES.join(',')}`);
}
if (Object.values(execution.side_effect_boundary ?? {}).some((value) => value !== false)) throw new Error('UAE Actions side-effect boundary must remain false');

function resolveOutputDir() {
  if (outputArg) return path.resolve(root, outputArg);
  return path.join(root, `data/generated/timetable/actions-multi-job/${execution.batch_id}`);
}

function runNodeJson(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${script} failed: ${(result.stderr || result.stdout || '').slice(0, 4000)}`);
  return JSON.parse(result.stdout);
}

function writeArtifacts(outputDir, artifacts) {
  fs.mkdirSync(outputDir, { recursive: true });
  for (const [name, value] of Object.entries(artifacts)) {
    fs.writeFileSync(path.join(outputDir, name), `${JSON.stringify(value, null, 2)}\n`);
  }
}

const outputDir = resolveOutputDir();

if (execution.collection_mode === 'source_visible_horizon') {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-uae-era-schedule-dispatch-'));
  const jobPath = path.join(tempDir, 'job.json');
  fs.writeFileSync(jobPath, `${JSON.stringify(job, null, 2)}\n`);
  try {
    const result = spawnSync(process.execPath, [
      'scripts/timetable/run-uae-era-pdf-grid-actions.mjs',
      `--execution=${executionPath}`,
      `--job=${jobPath}`,
      `--output-dir=${outputDir}`,
    ], { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`UAE schedule executor failed: ${result.stderr || result.stdout}`);
    console.log(result.stdout.trim());
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  process.exit(0);
}

if (execution.rank_strategy !== 'target_rank' || execution.target_rank !== 'A' || execution.reason !== 'rank_upgrade_retry') {
  throw new Error('UAE selected-meeting execution requires target_rank A and rank_upgrade_retry');
}
const canonical = JSON.parse(fs.readFileSync(path.join(root, 'data/generated/timetable/canonical/meetings.json'), 'utf8'));
const canonicalById = new Map((canonical.meetings ?? []).map((meeting) => [meeting.meeting_id, meeting]));
let evidenceByMeetingId = {};
let generatedAt = new Date().toISOString();

if (fixtureArg) {
  const fixtures = JSON.parse(fs.readFileSync(path.join(root, 'data/fixtures/calendar-uae-era-rank-upgrade-fixtures-v1.json'), 'utf8'));
  if (fixtureArg !== 'al-ain-a-proof') throw new Error(`unknown UAE rank-upgrade fixture ${fixtureArg}`);
  evidenceByMeetingId = fixtures.evidence_by_meeting_id;
  generatedAt = '2026-07-13T06:10:00Z';
} else {
  for (const meetingId of execution.requested_scope.meeting_ids) {
    const meeting = canonicalById.get(meetingId);
    if (!meeting) throw new Error(`canonical UAE meeting missing: ${meetingId}`);
    evidenceByMeetingId[meetingId] = runNodeJson('scripts/timetable/collect-uae-era-detail-artifacts.mjs', [
      `--date=${meeting.date}`,
      `--racecourse-id=${meeting.racecourse_id}`,
    ]);
  }
}

const artifacts = buildUaeEraRankUpgradeArtifactsV1({
  job,
  batchId: execution.batch_id,
  generatedAt,
  canonicalMeetings: canonical.meetings,
  evidenceByMeetingId,
  runnerUsed: execution.runner_used,
});
const retryQueue = buildUaeEraRetryQueueV1({ job, canonicalMeetings: canonical.meetings, generatedAt });
const reviewQueue = buildUaeEraReviewQueueV1({ manifest: artifacts.manifest, generatedAt });
writeArtifacts(outputDir, {
  'candidates.json': artifacts.candidate,
  'coverage-observation.json': artifacts.coverage,
  'collection-result-manifest.json': artifacts.manifest,
  'collection-report.json': artifacts.report,
  'rank-aware-retry-queue.json': retryQueue,
  'review-queue.json': reviewQueue,
});

console.log(JSON.stringify({
  schema_version: 'calendar-uae-era-actions-summary-v1',
  work_id: 'WHR-CAL-UAE-ERA-DETAIL-RECOVERY',
  implementation_unit: 'UAE-DETAIL-RECOVERY-02',
  batch_id: execution.batch_id,
  execution_mode: fixtureArg ? 'fixture_check_only' : 'live_selected_meetings',
  collection_mode: execution.collection_mode,
  selected_meeting_ids: structuredClone(execution.requested_scope.meeting_ids),
  records_discovered: artifacts.manifest.records_discovered,
  rank_counts: artifacts.manifest.rank_counts,
  coverage_claim: artifacts.manifest.coverage_claim,
  retry_entry_count: retryQueue.entries.length,
  review_state: reviewQueue.entries[0].review_state,
  output_dir: outputDir,
  raw_source_stored: false,
  canonical_write: false,
  public_write: false,
  publication_effect: 'none',
}, null, 2));
