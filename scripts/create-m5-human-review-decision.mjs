import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildCandidateDiff, renderCandidateDiffHtml } from './timetable/candidate-diff-page.mjs';
import { validateScheduledCandidateRunLog } from './timetable/scheduled-candidate-run-log.mjs';
import { buildHumanReviewDecision } from './timetable/human-review-decision.mjs';

const EXPECTED_WORKFLOW = 'Calendar TJK current/future candidates';
const DEFAULT_BASELINE = 'data/generated/timetable/canonical/meetings.json';
const DEFAULT_BASELINE_DETAILS = 'data/generated/timetable/canonical/meeting-details.json';
const DIFF_TITLE = 'M5 TJK scheduled candidate review diff';

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    invariant(arg.startsWith('--'), `unexpected argument: ${arg}`);
    const value = argv[index + 1];
    invariant(value !== undefined && !value.startsWith('--'), `missing value for ${arg}`);
    invariant(!args.has(arg.slice(2)), `duplicate argument: ${arg}`);
    args.set(arg.slice(2), value);
    index += 1;
  }
  return args;
}

function required(args, key) {
  const value = args.get(key);
  invariant(typeof value === 'string' && value.trim().length > 0, `--${key} is required`);
  return value.trim();
}

function assertRelativePath(value, field, prefix = null) {
  invariant(!path.isAbsolute(value) && !value.split(/[\\/]/).includes('..'), `${field} must be repository/workspace relative`);
  const normalized = value.replaceAll('\\', '/');
  if (prefix) invariant(normalized.startsWith(prefix), `${field} must stay under ${prefix}`);
  return normalized;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function assertCandidatePending(candidate) {
  invariant(candidate?.schema_version === 'timetable-candidate-v1', 'candidate must use timetable-candidate-v1');
  invariant(candidate?.review?.status === 'pending', 'candidate envelope must remain pending before human decision');
  invariant(candidate?.review?.reviewed_at === null, 'candidate envelope reviewed_at must remain null');
  invariant(candidate?.review?.reviewer === null, 'candidate envelope reviewer must remain null');
  invariant(Array.isArray(candidate?.records) && candidate.records.length > 0, 'candidate must contain records');
  invariant(candidate.records.every((record) => record.review_status === 'pending'), 'candidate records must remain pending before human decision');
  if ('publication_effect' in candidate) invariant(candidate.publication_effect === 'none', 'candidate publication_effect must be none');
}

function assertRunLogSafe(runLog, candidate, actualCandidateSha, expectedCandidateSha, sourceRunId) {
  validateScheduledCandidateRunLog(runLog);
  invariant(runLog.run_mode === 'dry_run', 'source run log must be dry_run');
  invariant(runLog.status === 'success_candidate_generated', 'human candidate review requires success_candidate_generated');
  invariant(runLog.eligibility === 'eligible' || runLog.eligibility === 'reviewed_input_only', 'source run must have executable review eligibility');
  invariant(runLog.candidate.count === candidate.records.length, 'run-log candidate count does not match candidate');
  invariant(runLog.candidate.sha256 === actualCandidateSha, 'run-log candidate SHA-256 does not match downloaded candidate bytes');
  invariant(expectedCandidateSha === actualCandidateSha, 'expected candidate SHA-256 does not match downloaded candidate bytes');
  invariant(runLog.country_id === candidate.country_id, 'run-log country does not match candidate');
  invariant(runLog.authority_id === candidate.authority_id, 'run-log authority does not match candidate');
  invariant(runLog.adapter_id === candidate.adapter_id, 'run-log adapter does not match candidate');
  invariant(runLog.candidate.artifact_path.endsWith('/candidate.json'), 'run-log candidate path must end in candidate.json');
  invariant(runLog.candidate.artifact_path.includes(`/${sourceRunId}-`), 'run-log candidate path must be bound to the selected source run');
  invariant(runLog.effects.human_review_required === true, 'source run must require human review');
  for (const key of ['candidate_approved', 'promotion_invoked', 'canonical_write', 'public_projection_write', 'merge', 'deploy']) {
    invariant(runLog.effects[key] === false, `source run effects.${key} must be false`);
  }
}

function verifyDiff(candidate, downloadedDiffPath, baselinePath, baselineDetailsPath) {
  const baseline = readJson(baselinePath);
  const details = readJson(baselineDetailsPath);
  const diff = buildCandidateDiff(candidate, baseline, details);
  invariant(diff.review_only === true && diff.approval_effect === 'none' && diff.publication_effect === 'none', 'rebuilt diff must remain review-only');
  const rebuilt = renderCandidateDiffHtml(diff, { title: DIFF_TITLE });
  const downloaded = fs.readFileSync(path.resolve(downloadedDiffPath), 'utf8');
  invariant(downloaded === rebuilt, 'downloaded candidate diff does not byte-match a rebuild from the selected candidate and baseline commit');
  invariant(downloaded.includes('REVIEW ONLY — NOT PUBLICATION'), 'candidate diff is missing review-only warning');
  invariant(downloaded.includes('noindex,nofollow,noarchive'), 'candidate diff is missing noindex boundary');
  return diff;
}

function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

const args = parseArgs(process.argv.slice(2));
const sourceDir = assertRelativePath(required(args, 'source-dir'), 'source-dir', 'artifacts/review-source');
const output = assertRelativePath(required(args, 'output'), 'output', 'artifacts/m5-human-review/');
invariant(output.endsWith('.json'), 'output must be a JSON artifact');
const baselinePath = assertRelativePath(args.get('baseline') ?? DEFAULT_BASELINE, 'baseline');
const baselineDetailsPath = assertRelativePath(args.get('baseline-details') ?? DEFAULT_BASELINE_DETAILS, 'baseline-details');
const sourceRunId = required(args, 'source-run-id');
invariant(/^\d+$/.test(sourceRunId), 'source-run-id must be numeric');
const sourceWorkflowName = required(args, 'source-workflow-name');
invariant(sourceWorkflowName === EXPECTED_WORKFLOW, `source workflow must be ${EXPECTED_WORKFLOW}`);
const sourceHeadSha = required(args, 'source-head-sha');
invariant(/^[a-f0-9]{40}$/.test(sourceHeadSha), 'source-head-sha must be a 40-character commit SHA');
const sourceHeadBranch = required(args, 'source-head-branch');
invariant(sourceHeadBranch === 'main', 'source-head-branch must be main');
const sourceEvent = required(args, 'source-event');
invariant(['push', 'schedule', 'workflow_dispatch'].includes(sourceEvent), 'source event is not trusted for human review');
const sourceArtifactName = required(args, 'source-artifact-name');
invariant(sourceArtifactName.startsWith(`m5-tjk-scheduled-dry-run-${sourceRunId}-`), 'source artifact name does not match selected source run');
const reviewer = required(args, 'reviewer');
invariant(!/\[bot\]$/i.test(reviewer), 'reviewer must be a human actor');
const decisionInput = required(args, 'decision');
invariant(['approve', 'reject'].includes(decisionInput), 'decision must be approve or reject');
const reasonCode = required(args, 'reason-code');
const reviewedAt = required(args, 'reviewed-at');
invariant(!Number.isNaN(Date.parse(reviewedAt)), 'reviewed-at must be an ISO timestamp');
const expectedCandidateSha = required(args, 'expected-candidate-sha256').toLowerCase();
invariant(/^[a-f0-9]{64}$/.test(expectedCandidateSha), 'expected-candidate-sha256 must be a lowercase SHA-256 digest');

for (const file of [baselinePath, baselineDetailsPath]) invariant(fs.existsSync(path.resolve(file)), `missing source-head baseline file: ${file}`);
const candidateFile = `${sourceDir}/candidate.json`;
const runLogFile = `${sourceDir}/run-log.json`;
const diffFile = `${sourceDir}/candidate-diff.html`;
for (const file of [candidateFile, runLogFile, diffFile]) invariant(fs.existsSync(path.resolve(file)), `missing review source file: ${file}`);

const candidateBytes = fs.readFileSync(path.resolve(candidateFile));
const candidate = JSON.parse(candidateBytes.toString('utf8'));
const runLog = readJson(runLogFile);
const actualCandidateSha = sha256(candidateBytes);

assertCandidatePending(candidate);
assertRunLogSafe(runLog, candidate, actualCandidateSha, expectedCandidateSha, sourceRunId);
const diff = verifyDiff(candidate, diffFile, baselinePath, baselineDetailsPath);

const decision = buildHumanReviewDecision({
  source_run_id: sourceRunId,
  source_workflow_name: sourceWorkflowName,
  source_head_sha: sourceHeadSha,
  source_head_branch: sourceHeadBranch,
  source_event: sourceEvent,
  source_artifact_name: sourceArtifactName,
  candidate_path: runLog.candidate.artifact_path,
  candidate_sha256: actualCandidateSha,
  country_id: candidate.country_id,
  authority_id: candidate.authority_id,
  adapter_id: candidate.adapter_id,
  record_count: candidate.records.length,
  diff_path: runLog.candidate.artifact_path.replace(/candidate\.json$/, 'candidate-diff.html'),
  diff_counts: diff.counts,
  reviewer,
  reviewed_at: reviewedAt,
  decision: decisionInput,
  reason_code: reasonCode,
});

fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
fs.writeFileSync(path.resolve(output), serialize(decision));
console.log(`Wrote human review decision: ${output}`);
console.log(`decision=${decision.review.decision}`);
console.log(`candidate_sha256=${decision.candidate.sha256}`);
console.log(`baseline_commit_sha=${decision.diff.baseline_commit_sha}`);
console.log('candidate_mutated=false promotion_invoked=false canonical_write=false public_projection_write=false merge=false deploy=false');
