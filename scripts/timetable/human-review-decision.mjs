const SCHEMA = 'timetable-human-review-decision-v1';
const ALLOWED_DECISIONS = new Set(['approved_for_separate_handoff', 'rejected']);
const ALLOWED_SOURCE_EVENTS = new Set(['push', 'schedule', 'workflow_dispatch']);
const REQUIRED_SAFE_EFFECTS = Object.freeze({
  candidate_mutated: false,
  promotion_invoked: false,
  canonical_write: false,
  public_projection_write: false,
  merge: false,
  deploy: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertString(value, field) {
  invariant(typeof value === 'string' && value.trim().length > 0, `${field} must be a non-empty string`);
}

function assertIsoTimestamp(value, field) {
  assertString(value, field);
  const parsed = Date.parse(value);
  invariant(!Number.isNaN(parsed), `${field} must be a valid ISO timestamp`);
}

function assertSha256(value, field) {
  assertString(value, field);
  invariant(/^[a-f0-9]{64}$/.test(value), `${field} must be a lowercase SHA-256 digest`);
}

function assertCommitSha(value, field) {
  assertString(value, field);
  invariant(/^[a-f0-9]{40}$/.test(value), `${field} must be a lowercase 40-character commit SHA`);
}

function assertReasonCode(value) {
  assertString(value, 'review.reason_code');
  invariant(/^[a-z0-9][a-z0-9._-]{1,79}$/.test(value), 'review.reason_code must be a 2-80 character lowercase audit code');
}

function assertReviewer(value) {
  assertString(value, 'review.reviewer');
  invariant(value.length <= 100, 'review.reviewer must be <= 100 characters');
  invariant(!/\[bot\]$/i.test(value), 'review.reviewer must be a human GitHub actor');
  invariant(!/^(github-actions|dependabot)(\[bot\])?$/i.test(value), 'review.reviewer must be a human GitHub actor');
}

function assertExactKeys(value, keys, field) {
  invariant(isObject(value), `${field} must be an object`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  invariant(JSON.stringify(actual) === JSON.stringify(expected), `${field} keys must be exactly: ${expected.join(', ')}`);
}

function assertEffects(effects) {
  assertExactKeys(effects, Object.keys(REQUIRED_SAFE_EFFECTS), 'effects');
  for (const [key, expected] of Object.entries(REQUIRED_SAFE_EFFECTS)) {
    invariant(effects[key] === expected, `effects.${key} must be ${expected}`);
  }
}

export const HUMAN_REVIEW_DECISION_SCHEMA = SCHEMA;
export const HUMAN_REVIEW_DECISIONS = Object.freeze([...ALLOWED_DECISIONS]);

export function validateHumanReviewDecision(decision) {
  assertExactKeys(decision, [
    'schema_version',
    'source_run',
    'candidate',
    'diff',
    'review',
    'effects',
  ], 'decision');
  invariant(decision.schema_version === SCHEMA, `schema_version must be ${SCHEMA}`);

  assertExactKeys(decision.source_run, [
    'run_id',
    'workflow_name',
    'head_sha',
    'head_branch',
    'event',
    'artifact_name',
  ], 'source_run');
  assertString(decision.source_run.run_id, 'source_run.run_id');
  assertString(decision.source_run.workflow_name, 'source_run.workflow_name');
  assertCommitSha(decision.source_run.head_sha, 'source_run.head_sha');
  invariant(decision.source_run.head_branch === 'main', 'source_run.head_branch must be main');
  invariant(ALLOWED_SOURCE_EVENTS.has(decision.source_run.event), `unsupported source_run.event: ${decision.source_run.event}`);
  assertString(decision.source_run.artifact_name, 'source_run.artifact_name');

  assertExactKeys(decision.candidate, [
    'schema_version',
    'path',
    'sha256',
    'country_id',
    'authority_id',
    'adapter_id',
    'record_count',
    'review_status_at_decision',
  ], 'candidate');
  invariant(decision.candidate.schema_version === 'timetable-candidate-v1', 'candidate.schema_version must be timetable-candidate-v1');
  assertString(decision.candidate.path, 'candidate.path');
  invariant(decision.candidate.path.startsWith('artifacts/m5-scheduled/'), 'candidate.path must refer to an M5 scheduled review artifact');
  invariant(!decision.candidate.path.includes('..'), 'candidate.path must not escape the M5 artifact partition');
  assertSha256(decision.candidate.sha256, 'candidate.sha256');
  assertString(decision.candidate.country_id, 'candidate.country_id');
  assertString(decision.candidate.authority_id, 'candidate.authority_id');
  assertString(decision.candidate.adapter_id, 'candidate.adapter_id');
  invariant(Number.isInteger(decision.candidate.record_count) && decision.candidate.record_count > 0, 'candidate.record_count must be an integer > 0');
  invariant(decision.candidate.review_status_at_decision === 'pending', 'candidate must remain pending at decision time');

  assertExactKeys(decision.diff, [
    'path',
    'verification',
    'baseline_commit_sha',
    'changed',
    'candidate_only',
    'baseline_only',
    'unchanged',
    'baseline_only_implies_deletion',
  ], 'diff');
  assertString(decision.diff.path, 'diff.path');
  invariant(decision.diff.verification === 'byte_equal_rebuild', 'diff.verification must be byte_equal_rebuild');
  assertCommitSha(decision.diff.baseline_commit_sha, 'diff.baseline_commit_sha');
  invariant(decision.diff.baseline_commit_sha === decision.source_run.head_sha, 'diff baseline must be the source run head SHA');
  for (const key of ['changed', 'candidate_only', 'baseline_only', 'unchanged']) {
    invariant(Number.isInteger(decision.diff[key]) && decision.diff[key] >= 0, `diff.${key} must be an integer >= 0`);
  }
  invariant(decision.diff.baseline_only_implies_deletion === false, 'baseline-only records must never imply deletion');

  assertExactKeys(decision.review, [
    'decision',
    'reviewer',
    'reviewed_at',
    'reason_code',
    'candidate_approved_for_canonical_promotion',
  ], 'review');
  invariant(ALLOWED_DECISIONS.has(decision.review.decision), `unsupported review decision: ${decision.review.decision}`);
  assertReviewer(decision.review.reviewer);
  assertIsoTimestamp(decision.review.reviewed_at, 'review.reviewed_at');
  assertReasonCode(decision.review.reason_code);
  invariant(decision.review.candidate_approved_for_canonical_promotion === false, 'human review decision must not directly approve canonical promotion');

  assertEffects(decision.effects);
  return decision;
}

export function buildHumanReviewDecision(input) {
  invariant(isObject(input), 'input must be an object');
  const decisionValue = input.decision === 'approve'
    ? 'approved_for_separate_handoff'
    : input.decision === 'reject'
      ? 'rejected'
      : input.decision;
  invariant(ALLOWED_DECISIONS.has(decisionValue), 'input.decision must be approve/reject or a supported normalized decision');

  const decision = {
    schema_version: SCHEMA,
    source_run: {
      run_id: String(input.source_run_id),
      workflow_name: input.source_workflow_name,
      head_sha: input.source_head_sha,
      head_branch: input.source_head_branch,
      event: input.source_event,
      artifact_name: input.source_artifact_name,
    },
    candidate: {
      schema_version: 'timetable-candidate-v1',
      path: input.candidate_path,
      sha256: input.candidate_sha256,
      country_id: input.country_id,
      authority_id: input.authority_id,
      adapter_id: input.adapter_id,
      record_count: input.record_count,
      review_status_at_decision: 'pending',
    },
    diff: {
      path: input.diff_path,
      verification: 'byte_equal_rebuild',
      baseline_commit_sha: input.source_head_sha,
      changed: input.diff_counts.changed,
      candidate_only: input.diff_counts.candidate_only,
      baseline_only: input.diff_counts.baseline_only,
      unchanged: input.diff_counts.unchanged,
      baseline_only_implies_deletion: false,
    },
    review: {
      decision: decisionValue,
      reviewer: input.reviewer,
      reviewed_at: input.reviewed_at,
      reason_code: input.reason_code,
      candidate_approved_for_canonical_promotion: false,
    },
    effects: { ...REQUIRED_SAFE_EFFECTS },
  };

  return validateHumanReviewDecision(decision);
}
