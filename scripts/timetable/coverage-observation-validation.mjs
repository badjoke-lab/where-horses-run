const COLLECTION_MODES = Object.freeze([
  'date_window',
  'single_date',
  'selected_meetings',
  'source_visible_horizon',
]);

const COVERAGE_CLAIMS = Object.freeze([
  'none',
  'partial',
  'source_window_complete',
  'audited_complete',
]);

const SOURCE_ERROR_CODES = Object.freeze([
  'source_unavailable',
  'parser_failure',
  'rate_limited',
  'unexpected_response',
  'other',
]);

const SCOPE_KINDS = Object.freeze([
  'date_window',
  'single_date',
  'selected_meetings',
  'source_visible_horizon',
  'not_observed',
]);

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const REPO_REF_PATTERN = /^(?:data|docs)\/[A-Za-z0-9_./-]+$/;
const PROHIBITED_KEY_FRAGMENTS = Object.freeze([
  'raw_html',
  'raw_body',
  'source_body',
  'horse',
  'runner',
  'jockey',
  'trainer',
  'odds',
  'payout',
  'prediction',
  'tip',
  'credential',
  'cookie',
  'token',
  'stream_url',
]);

const TOP_LEVEL_KEYS = Object.freeze([
  'schema_version',
  'run_id',
  'system_id',
  'source_id',
  'checked_at',
  'requested_scope',
  'observed_scope',
  'collection_mode',
  'records_discovered',
  'records_updated',
  'unresolved_dates',
  'unresolved_meeting_ids',
  'source_errors',
  'coverage_claim',
  'completion_audit_ref',
]);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function realDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function validDateTime(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

function checkExactKeys(value, allowed, location, errors) {
  if (!isObject(value)) {
    errors.push(`${location} must be an object`);
    return false;
  }
  for (const key of allowed) {
    if (!Object.hasOwn(value, key)) errors.push(`${location}.${key} is required`);
  }
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) errors.push(`${location}.${key} is not allowed`);
  }
  return true;
}

function checkUniqueStringArray(value, location, errors, { id = false, date = false, allowEmpty = true } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${location} must be an array`);
    return;
  }
  if (!allowEmpty && value.length === 0) errors.push(`${location} must not be empty`);
  const seen = new Set();
  value.forEach((entry, index) => {
    if (typeof entry !== 'string' || entry.trim() === '') errors.push(`${location}[${index}] must be a non-empty string`);
    else if (id && !ID_PATTERN.test(entry)) errors.push(`${location}[${index}] must be a stable slug ID`);
    else if (date && !realDate(entry)) errors.push(`${location}[${index}] must be a real YYYY-MM-DD date`);
    if (seen.has(entry)) errors.push(`${location} must not contain duplicates`);
    seen.add(entry);
  });
}

function checkDateRange(start, endExclusive, location, errors) {
  if (!realDate(start)) errors.push(`${location}.start_date must be a real YYYY-MM-DD date`);
  if (!realDate(endExclusive)) errors.push(`${location}.end_date_exclusive must be a real YYYY-MM-DD date`);
  if (realDate(start) && realDate(endExclusive) && start >= endExclusive) {
    errors.push(`${location}.end_date_exclusive must be after start_date`);
  }
}

function validateScope(scope, location, errors) {
  if (!isObject(scope)) {
    errors.push(`${location} must be an object`);
    return;
  }
  if (!SCOPE_KINDS.includes(scope.kind)) {
    errors.push(`${location}.kind is unsupported`);
    return;
  }
  if (typeof scope.timezone !== 'string' || scope.timezone.length < 3) errors.push(`${location}.timezone is required`);

  if (scope.kind === 'date_window' || scope.kind === 'source_visible_horizon') {
    checkExactKeys(scope, ['kind', 'start_date', 'end_date_exclusive', 'timezone'], location, errors);
    checkDateRange(scope.start_date, scope.end_date_exclusive, location, errors);
    return;
  }
  if (scope.kind === 'single_date') {
    checkExactKeys(scope, ['kind', 'date', 'timezone'], location, errors);
    if (!realDate(scope.date)) errors.push(`${location}.date must be a real YYYY-MM-DD date`);
    return;
  }
  if (scope.kind === 'selected_meetings') {
    checkExactKeys(scope, ['kind', 'meeting_ids', 'timezone'], location, errors);
    checkUniqueStringArray(scope.meeting_ids, `${location}.meeting_ids`, errors, { id: true, allowEmpty: false });
    return;
  }
  checkExactKeys(scope, ['kind', 'timezone'], location, errors);
}

function walkKeys(value, location, errors) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkKeys(entry, `${location}[${index}]`, errors));
    return;
  }
  if (!isObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (PROHIBITED_KEY_FRAGMENTS.some((fragment) => key.toLowerCase().includes(fragment))) {
      errors.push(`${location}.${key} is prohibited in coverage observations`);
    }
    walkKeys(child, `${location}.${key}`, errors);
  }
}

export function validateCoverageObservation(value) {
  const errors = [];
  if (!checkExactKeys(value, TOP_LEVEL_KEYS, 'observation', errors)) return { valid: false, errors };

  if (value.schema_version !== 'calendar-coverage-observation-v1') errors.push('schema_version must be calendar-coverage-observation-v1');
  for (const key of ['run_id', 'system_id', 'source_id']) {
    if (typeof value[key] !== 'string' || !ID_PATTERN.test(value[key])) errors.push(`${key} must be a stable slug ID`);
  }
  if (!validDateTime(value.checked_at)) errors.push('checked_at must be a valid ISO date-time');

  validateScope(value.requested_scope, 'requested_scope', errors);
  validateScope(value.observed_scope, 'observed_scope', errors);

  if (!COLLECTION_MODES.includes(value.collection_mode)) errors.push('collection_mode is unsupported');
  if (value.collection_mode === 'date_window' && value.requested_scope?.kind !== 'date_window') errors.push('date_window collection_mode requires date_window requested_scope');
  if (value.collection_mode === 'single_date' && value.requested_scope?.kind !== 'single_date') errors.push('single_date collection_mode requires single_date requested_scope');
  if (value.collection_mode === 'selected_meetings' && value.requested_scope?.kind !== 'selected_meetings') errors.push('selected_meetings collection_mode requires selected_meetings requested_scope');

  for (const key of ['records_discovered', 'records_updated']) {
    if (!Number.isInteger(value[key]) || value[key] < 0) errors.push(`${key} must be a non-negative integer`);
  }
  if (Number.isInteger(value.records_discovered) && Number.isInteger(value.records_updated) && value.records_updated > value.records_discovered) {
    errors.push('records_updated must not exceed records_discovered');
  }

  checkUniqueStringArray(value.unresolved_dates, 'unresolved_dates', errors, { date: true });
  checkUniqueStringArray(value.unresolved_meeting_ids, 'unresolved_meeting_ids', errors, { id: true });

  if (!Array.isArray(value.source_errors)) errors.push('source_errors must be an array');
  else value.source_errors.forEach((entry, index) => {
    const location = `source_errors[${index}]`;
    if (!checkExactKeys(entry, ['code', 'scope_ref', 'message'], location, errors)) return;
    if (!SOURCE_ERROR_CODES.includes(entry.code)) errors.push(`${location}.code is unsupported`);
    if (typeof entry.scope_ref !== 'string' || entry.scope_ref.trim() === '' || entry.scope_ref.length > 200) errors.push(`${location}.scope_ref is invalid`);
    if (typeof entry.message !== 'string' || entry.message.trim() === '' || entry.message.length > 500) errors.push(`${location}.message is invalid`);
  });

  if (!COVERAGE_CLAIMS.includes(value.coverage_claim)) errors.push('coverage_claim is unsupported');
  if (value.coverage_claim === 'audited_complete') {
    if (typeof value.completion_audit_ref !== 'string' || !REPO_REF_PATTERN.test(value.completion_audit_ref) || value.completion_audit_ref.includes('..')) {
      errors.push('audited_complete requires a safe repository completion_audit_ref');
    }
    if ((value.unresolved_dates?.length ?? 0) > 0 || (value.unresolved_meeting_ids?.length ?? 0) > 0 || (value.source_errors?.length ?? 0) > 0) {
      errors.push('audited_complete cannot contain unresolved items or source errors');
    }
  } else if (value.completion_audit_ref !== null) {
    errors.push('completion_audit_ref must be null unless coverage_claim is audited_complete');
  }

  walkKeys(value, 'observation', errors);
  return { valid: errors.length === 0, errors };
}

export const coverageObservationContract = Object.freeze({
  schema_version: 'calendar-coverage-observation-v1',
  top_level_keys: TOP_LEVEL_KEYS,
  collection_modes: COLLECTION_MODES,
  coverage_claims: COVERAGE_CLAIMS,
  source_error_codes: SOURCE_ERROR_CODES,
  scope_kinds: SCOPE_KINDS,
  prohibited_key_fragments: PROHIBITED_KEY_FRAGMENTS,
});
