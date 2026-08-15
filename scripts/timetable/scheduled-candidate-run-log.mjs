const SCHEMA = 'scheduled-candidate-run-log-v1';

export const SCHEDULED_CANDIDATE_RUN_LOG_SCHEMA = SCHEMA;

export const RUN_LOG_STATUSES = Object.freeze([
  'success_candidate_generated',
  'success_no_candidates',
  'offseason_noop',
  'blocked_source',
  'disabled_by_policy',
  'source_error',
  'route_or_provenance_error',
  'parse_error',
  'candidate_validation_error',
]);

export const SCHEDULER_ELIGIBILITY_STATES = Object.freeze([
  'eligible',
  'reviewed_input_only',
  'offseason',
  'blocked',
  'disabled',
]);

const SUCCESS_STATUSES = new Set([
  'success_candidate_generated',
  'success_no_candidates',
]);

const ERROR_STATUSES = new Set([
  'source_error',
  'route_or_provenance_error',
  'parse_error',
  'candidate_validation_error',
]);

const EXECUTABLE_ELIGIBILITY = new Set(['eligible', 'reviewed_input_only']);

const FORBIDDEN_KEYS = new Set([
  'raw_html',
  'raw_body',
  'response_body',
  'html_body',
  'racecard',
  'racecards',
  'runner',
  'runners',
  'participant',
  'participants',
  'horse',
  'horses',
  'jockey',
  'jockeys',
  'trainer',
  'trainers',
  'owner',
  'owners',
  'odds',
  'result',
  'results',
  'payout',
  'payouts',
  'prediction',
  'predictions',
  'tip',
  'tips',
  'stream_url',
  'stream_urls',
]);

const EFFECTS = Object.freeze({
  human_review_required: true,
  candidate_approved: false,
  promotion_invoked: false,
  canonical_write: false,
  public_projection_write: false,
  merge: false,
  deploy: false,
});

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertNonEmptyString(value, field) {
  invariant(typeof value === 'string' && value.trim().length > 0, `${field} must be a non-empty string`);
}

function assertNullableString(value, field) {
  invariant(value === null || typeof value === 'string', `${field} must be null or a string`);
}

function assertIsoDate(value, field) {
  assertNonEmptyString(value, field);
  invariant(/^\d{4}-\d{2}-\d{2}$/.test(value), `${field} must use YYYY-MM-DD`);
  const parsed = new Date(`${value}T00:00:00Z`);
  invariant(!Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value, `${field} must be a valid calendar date`);
}

function assertIsoTimestamp(value, field) {
  assertNonEmptyString(value, field);
  invariant(/^\d{4}-\d{2}-\d{2}T/.test(value), `${field} must be an ISO timestamp`);
  const parsed = new Date(value);
  invariant(!Number.isNaN(parsed.valueOf()), `${field} must be a valid ISO timestamp`);
}

function assertRelativeArtifactPath(value, field) {
  assertNonEmptyString(value, field);
  invariant(!value.startsWith('/') && !value.startsWith('\\'), `${field} must be repository/workspace relative`);
  invariant(!value.split(/[\\/]/).includes('..'), `${field} must not escape its output partition`);
}

function assertSha256(value, field) {
  assertNonEmptyString(value, field);
  invariant(/^[a-f0-9]{64}$/.test(value), `${field} must be a lowercase SHA-256 hex digest`);
}

function normalizeKey(key) {
  return String(key).trim().toLowerCase().replace(/[ -]/g, '_');
}

function assertNoForbiddenKeys(value, path = 'input') {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoForbiddenKeys(entry, `${path}[${index}]`));
    return;
  }
  if (!isPlainObject(value)) return;

  for (const [key, child] of Object.entries(value)) {
    const normalized = normalizeKey(key);
    invariant(!FORBIDDEN_KEYS.has(normalized), `${path}.${key} is prohibited from scheduled run logs`);
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
}

function assertExactKeys(object, expectedKeys, field) {
  invariant(isPlainObject(object), `${field} must be an object`);
  const actual = Object.keys(object).sort();
  const expected = [...expectedKeys].sort();
  invariant(JSON.stringify(actual) === JSON.stringify(expected), `${field} keys must be exactly: ${expected.join(', ')}`);
}

function assertEffects(effects) {
  assertExactKeys(effects, Object.keys(EFFECTS), 'effects');
  for (const [key, expected] of Object.entries(EFFECTS)) {
    invariant(effects[key] === expected, `effects.${key} must be ${expected}`);
  }
}

function validateStatusEligibility(status, eligibility) {
  if (SUCCESS_STATUSES.has(status) || ERROR_STATUSES.has(status)) {
    invariant(EXECUTABLE_ELIGIBILITY.has(eligibility), `${status} requires eligible or reviewed_input_only eligibility`);
    return;
  }
  if (status === 'offseason_noop') invariant(eligibility === 'offseason', 'offseason_noop requires offseason eligibility');
  if (status === 'blocked_source') invariant(eligibility === 'blocked', 'blocked_source requires blocked eligibility');
  if (status === 'disabled_by_policy') invariant(eligibility === 'disabled', 'disabled_by_policy requires disabled eligibility');
}

export function validateScheduledCandidateRunLog(log) {
  assertNoForbiddenKeys(log, 'log');
  assertExactKeys(log, [
    'schema',
    'country_id',
    'authority_id',
    'source_id',
    'adapter_id',
    'adapter_version',
    'run_mode',
    'window',
    'run_at',
    'source_reference',
    'eligibility',
    'status',
    'execution',
    'candidate',
    'disposition',
    'effects',
  ], 'log');

  invariant(log.schema === SCHEMA, `schema must be ${SCHEMA}`);
  for (const field of ['country_id', 'authority_id', 'source_id', 'adapter_id', 'adapter_version', 'run_mode', 'source_reference']) {
    assertNonEmptyString(log[field], field);
  }

  assertExactKeys(log.window, ['start', 'end', 'timezone'], 'window');
  assertIsoDate(log.window.start, 'window.start');
  assertIsoDate(log.window.end, 'window.end');
  invariant(log.window.start <= log.window.end, 'window.start must be on or before window.end');
  assertNonEmptyString(log.window.timezone, 'window.timezone');
  assertIsoTimestamp(log.run_at, 'run_at');

  invariant(SCHEDULER_ELIGIBILITY_STATES.includes(log.eligibility), `unsupported eligibility: ${log.eligibility}`);
  invariant(RUN_LOG_STATUSES.includes(log.status), `unsupported status: ${log.status}`);
  validateStatusEligibility(log.status, log.eligibility);

  assertExactKeys(log.execution, ['run_id', 'attempt', 'started_at', 'completed_at'], 'execution');
  assertNonEmptyString(log.execution.run_id, 'execution.run_id');
  invariant(Number.isInteger(log.execution.attempt) && log.execution.attempt >= 1, 'execution.attempt must be an integer >= 1');
  assertIsoTimestamp(log.execution.started_at, 'execution.started_at');
  assertIsoTimestamp(log.execution.completed_at, 'execution.completed_at');
  invariant(new Date(log.execution.started_at) <= new Date(log.execution.completed_at), 'execution.started_at must be on or before execution.completed_at');

  assertExactKeys(log.candidate, ['count', 'artifact_path', 'sha256'], 'candidate');
  invariant(Number.isInteger(log.candidate.count) && log.candidate.count >= 0, 'candidate.count must be an integer >= 0');
  assertNullableString(log.candidate.artifact_path, 'candidate.artifact_path');
  assertNullableString(log.candidate.sha256, 'candidate.sha256');

  if (SUCCESS_STATUSES.has(log.status)) {
    assertRelativeArtifactPath(log.candidate.artifact_path, 'candidate.artifact_path');
    assertSha256(log.candidate.sha256, 'candidate.sha256');
    if (log.status === 'success_candidate_generated') {
      invariant(log.candidate.count > 0, 'success_candidate_generated requires candidate.count > 0');
    } else {
      invariant(log.candidate.count === 0, 'success_no_candidates requires candidate.count === 0');
    }
  } else {
    invariant(log.candidate.count === 0, `${log.status} must not report candidate records`);
    invariant(log.candidate.artifact_path === null, `${log.status} must not expose a candidate artifact`);
    invariant(log.candidate.sha256 === null, `${log.status} must not expose a candidate digest`);
  }

  assertExactKeys(log.disposition, ['reason_code', 'error_code', 'error_message'], 'disposition');
  assertNullableString(log.disposition.reason_code, 'disposition.reason_code');
  assertNullableString(log.disposition.error_code, 'disposition.error_code');
  assertNullableString(log.disposition.error_message, 'disposition.error_message');

  if (ERROR_STATUSES.has(log.status)) {
    assertNonEmptyString(log.disposition.error_code, 'disposition.error_code');
    invariant(log.disposition.reason_code === null, `${log.status} must use error_code, not reason_code`);
  } else if (['offseason_noop', 'blocked_source', 'disabled_by_policy'].includes(log.status)) {
    assertNonEmptyString(log.disposition.reason_code, 'disposition.reason_code');
    invariant(log.disposition.error_code === null, `${log.status} must use reason_code, not error_code`);
  } else {
    invariant(log.disposition.reason_code === null, `${log.status} must not set reason_code`);
    invariant(log.disposition.error_code === null, `${log.status} must not set error_code`);
  }

  assertEffects(log.effects);
  return log;
}

export function buildScheduledCandidateRunLog(input) {
  invariant(isPlainObject(input), 'input must be an object');
  assertNoForbiddenKeys(input);

  const log = {
    schema: SCHEMA,
    country_id: input.country_id,
    authority_id: input.authority_id,
    source_id: input.source_id,
    adapter_id: input.adapter_id,
    adapter_version: input.adapter_version,
    run_mode: input.run_mode,
    window: {
      start: input.window_start,
      end: input.window_end,
      timezone: input.timezone,
    },
    run_at: input.run_at,
    source_reference: input.source_reference,
    eligibility: input.eligibility,
    status: input.status,
    execution: {
      run_id: input.run_id,
      attempt: input.attempt,
      started_at: input.started_at,
      completed_at: input.completed_at,
    },
    candidate: {
      count: input.candidate_count ?? 0,
      artifact_path: input.candidate_artifact_path ?? null,
      sha256: input.candidate_sha256 ?? null,
    },
    disposition: {
      reason_code: input.reason_code ?? null,
      error_code: input.error_code ?? null,
      error_message: input.error_message ?? null,
    },
    effects: { ...EFFECTS },
  };

  return validateScheduledCandidateRunLog(log);
}
