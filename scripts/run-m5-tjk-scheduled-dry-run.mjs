import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { collectCandidateBatch, ENTRY_URL, turkeyDate } from './timetable/tjk-current-future-candidates.mjs';
import { validateArtifact } from './check-tjk-current-future-candidates.mjs';
import { buildTjkScheduledRankCCandidate, validateTjkScheduledRankCCandidate } from './timetable/tjk-current-future-rank-c-adapter.mjs';
import { buildScheduledCandidateRunLog } from './timetable/scheduled-candidate-run-log.mjs';
import { buildCandidateDiff, renderCandidateDiffHtml } from './timetable/candidate-diff-page.mjs';

const DEFAULT_BASELINE = 'data/generated/timetable/canonical/meetings.json';
const DEFAULT_DETAILS = 'data/generated/timetable/canonical/meeting-details.json';
const DAY_MS = 24 * 60 * 60 * 1000;

function invariant(condition, message) { if (!condition) throw new Error(message); }
function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    invariant(arg.startsWith('--'), `unexpected argument: ${arg}`);
    const value = argv[index + 1];
    invariant(value && !value.startsWith('--'), `missing value for ${arg}`);
    args.set(arg.slice(2), value);
    index += 1;
  }
  return args;
}
function assertRelativeOutputDir(value) {
  invariant(typeof value === 'string' && value.length > 0, 'output-dir is required');
  invariant(!path.isAbsolute(value) && !value.split(/[\\/]/).includes('..'), 'output-dir must be workspace-relative');
  const normalized = value.replaceAll('\\', '/');
  invariant(normalized.startsWith('artifacts/m5-scheduled/'), 'output-dir must stay under artifacts/m5-scheduled/');
  return normalized.replace(/\/$/, '');
}
function readJson(relativePath) { return JSON.parse(fs.readFileSync(path.resolve(relativePath), 'utf8')); }
function jsonBytes(value) { return `${JSON.stringify(value, null, 2)}\n`; }
function sha256(value) { return createHash('sha256').update(value).digest('hex'); }
function previousDay(isoDate) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  invariant(!Number.isNaN(date.valueOf()), `invalid exclusive end date: ${isoDate}`);
  return new Date(date.valueOf() - DAY_MS).toISOString().slice(0, 10);
}
function safeErrorMessage(error) {
  return String(error?.message ?? error ?? 'unknown error').replace(/[\r\n\t]+/g, ' ').replace(/<[^>]*>/g, '[markup]').replace(/\s+/g, ' ').trim().slice(0, 240);
}
function runtimeIdentity(runAt) {
  const compact = runAt.replace(/[^0-9TZ]/g, '');
  return { runId: process.env.GITHUB_RUN_ID || `local-${compact}`, attempt: Number(process.env.GITHUB_RUN_ATTEMPT || '1'), adapterVersion: process.env.GITHUB_SHA || 'local-uncommitted' };
}
function baseLogInput({ runAt, runId, attempt, adapterVersion, startedAt, completedAt, windowStart, windowEnd }) {
  return {
    country_id: 'turkey',
    authority_id: 'turkiye-jokey-kulubu',
    source_id: 'tjk-daily-programme',
    adapter_id: 'tjk-scheduled-current-future-best-available-v1',
    adapter_version: adapterVersion,
    run_mode: 'dry_run',
    window_start: windowStart,
    window_end: windowEnd,
    timezone: 'Europe/Istanbul',
    run_at: runAt,
    source_reference: ENTRY_URL,
    eligibility: 'eligible',
    run_id: runId,
    attempt,
    started_at: startedAt,
    completed_at: completedAt,
  };
}
function writeRunLog(outputDir, log) {
  fs.mkdirSync(path.resolve(outputDir), { recursive: true });
  const runLogPath = `${outputDir}/run-log.json`;
  fs.writeFileSync(path.resolve(runLogPath), jsonBytes(log));
  return runLogPath;
}

export async function executeTjkScheduledDryRun({ runAt, outputDir, fetchImpl = fetch, baseline = DEFAULT_BASELINE, baselineDetails = DEFAULT_DETAILS, clock = () => new Date() } = {}) {
  invariant(typeof runAt === 'string' && !Number.isNaN(new Date(runAt).valueOf()), 'run-at must be an ISO timestamp');
  const normalizedOutputDir = assertRelativeOutputDir(outputDir);
  const runAtDate = new Date(runAt);
  const today = turkeyDate(runAtDate);
  const { runId, attempt, adapterVersion } = runtimeIdentity(runAt);
  const startedAt = clock().toISOString();
  let batch;
  try {
    batch = await collectCandidateBatch({ fetchImpl, now: runAtDate });
  } catch (error) {
    const completedAt = clock().toISOString();
    const status = /fetch failed|HTTP \d+/i.test(String(error?.message)) ? 'source_error' : 'route_or_provenance_error';
    const log = buildScheduledCandidateRunLog({ ...baseLogInput({ runAt, runId, attempt, adapterVersion, startedAt, completedAt, windowStart: today, windowEnd: today }), status, error_code: status === 'source_error' ? 'tjk-source-fetch-failed' : 'tjk-entry-route-rejected', error_message: safeErrorMessage(error) });
    return { ok: false, status, runLogPath: writeRunLog(normalizedOutputDir, log), candidatePath: null, diffPath: null };
  }
  try {
    validateArtifact(batch, { today });
  } catch (error) {
    const completedAt = clock().toISOString();
    const log = buildScheduledCandidateRunLog({ ...baseLogInput({ runAt, runId, attempt, adapterVersion, startedAt, completedAt, windowStart: today, windowEnd: today }), status: 'route_or_provenance_error', error_code: 'tjk-source-batch-validation-failed', error_message: safeErrorMessage(error) });
    return { ok: false, status: 'route_or_provenance_error', runLogPath: writeRunLog(normalizedOutputDir, log), candidatePath: null, diffPath: null };
  }
  let candidate;
  let diff;
  try {
    candidate = buildTjkScheduledRankCCandidate(batch, { today });
    validateTjkScheduledRankCCandidate(candidate);
    diff = buildCandidateDiff(candidate, readJson(baseline), readJson(baselineDetails));
    invariant(diff.review_only === true && diff.approval_effect === 'none' && diff.publication_effect === 'none', 'candidate diff must remain review-only');
  } catch (error) {
    const completedAt = clock().toISOString();
    const log = buildScheduledCandidateRunLog({ ...baseLogInput({ runAt, runId, attempt, adapterVersion, startedAt, completedAt, windowStart: today, windowEnd: today }), status: 'candidate_validation_error', error_code: 'tjk-best-available-candidate-validation-failed', error_message: safeErrorMessage(error) });
    return { ok: false, status: 'candidate_validation_error', runLogPath: writeRunLog(normalizedOutputDir, log), candidatePath: null, diffPath: null };
  }
  const candidatePath = `${normalizedOutputDir}/candidate.json`;
  const sourceBatchPath = `${normalizedOutputDir}/source-batch.json`;
  const diffPath = `${normalizedOutputDir}/candidate-diff.html`;
  const candidateBytes = jsonBytes(candidate);
  const sourceBatchBytes = jsonBytes(batch);
  const candidateSha = sha256(candidateBytes);
  const completedAt = clock().toISOString();
  const status = candidate.records.length > 0 ? 'success_candidate_generated' : 'success_no_candidates';
  const windowEnd = previousDay(candidate.candidate_window.end_date_exclusive);
  const log = buildScheduledCandidateRunLog({
    ...baseLogInput({ runAt, runId, attempt, adapterVersion, startedAt, completedAt, windowStart: candidate.candidate_window.start_date, windowEnd }),
    status,
    candidate_count: candidate.records.length,
    candidate_artifact_path: candidatePath,
    candidate_sha256: candidateSha,
  });
  fs.mkdirSync(path.resolve(normalizedOutputDir), { recursive: true });
  fs.writeFileSync(path.resolve(sourceBatchPath), sourceBatchBytes);
  fs.writeFileSync(path.resolve(candidatePath), candidateBytes);
  fs.writeFileSync(path.resolve(diffPath), renderCandidateDiffHtml(diff, { title: 'M5 TJK scheduled candidate review diff' }));
  const runLogPath = writeRunLog(normalizedOutputDir, log);
  return { ok: true, status, runLogPath, sourceBatchPath, candidatePath, candidateSha256: candidateSha, candidateCount: candidate.records.length, diffPath, diffCounts: diff.counts };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runAt = args.get('run-at');
  const outputDir = args.get('output-dir');
  invariant(runAt, '--run-at is required');
  invariant(outputDir, '--output-dir is required');
  const result = await executeTjkScheduledDryRun({ runAt, outputDir });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
}
