const RUNNERS = Object.freeze(['github_actions', 'local', 'reviewed_import']);
const COVERAGE_CLAIMS = Object.freeze(['none', 'partial', 'source_window_complete', 'audited_complete']);
const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const SOURCE_ERROR_CODES = Object.freeze(['source_unavailable', 'parser_failure', 'rate_limited', 'unexpected_response', 'other']);
const TOP_LEVEL_KEYS = Object.freeze([
  'schema_version',
  'campaign_id',
  'job_id',
  'batch_id',
  'system_id',
  'runner_used',
  'requested_scope',
  'observed_scope',
  'coverage_claim',
  'records_discovered',
  'records_updated',
  'rank_counts',
  'unresolved_dates',
  'unresolved_meeting_ids',
  'source_errors',
  'artifact_refs',
]);
const ARTIFACT_KEYS = Object.freeze(['candidate_ref', 'coverage_observation_ref', 'collection_report_ref']);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const REPO_REF_PATTERN = /^(?:data|docs)\/[A-Za-z0-9_./+-]+$/;
const PROHIBITED_KEY_FRAGMENTS = Object.freeze([
  'raw_html', 'raw_body', 'source_body', 'credential', 'cookie', 'secret', 'token',
  'horse_name', 'jockey', 'trainer', 'odds', 'betting', 'payout', 'prediction', 'tip',
  'stream_url', 'approval', 'publication', 'deployment',
]);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function realDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function checkExactKeys(value, allowed, location, errors) {
  if (!isObject(value)) {
    errors.push(`${location} must be an object`);
    return false;
  }
  for (const key of allowed) if (!Object.hasOwn(value, key)) errors.push(`${location}.${key} is required`);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) errors.push(`${location}.${key} is not allowed`);
  return true;
}

function checkDateRange(startDate, endDateExclusive, location, errors) {
  if (!realDate(startDate)) errors.push(`${location}.start_date must be a real YYYY-MM-DD date`);
  if (!realDate(endDateExclusive)) errors.push(`${location}.end_date_exclusive must be a real YYYY-MM-DD date`);
  if (realDate(startDate) && realDate(endDateExclusive) && startDate >= endDateExclusive) {
    errors.push(`${location}.end_date_exclusive must be after start_date`);
  }
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

function validateRequestedScope(scope, location, errors) {
  if (!isObject(scope)) {
    errors.push(`${location} must be an object`);
    return;
  }
  if (Object.hasOwn(scope, 'meeting_ids')) {
    if (!checkExactKeys(scope, ['meeting_ids'], location, errors)) return;
    checkUniqueStringArray(scope.meeting_ids, `${location}.meeting_ids`, errors, { id: true, allowEmpty: false });
    return;
  }
  if (Object.hasOwn(scope, 'date')) {
    if (!checkExactKeys(scope, ['date', 'timezone'], location, errors)) return;
    if (!realDate(scope.date)) errors.push(`${location}.date must be a real YYYY-MM-DD date`);
    if (typeof scope.timezone !== 'string' || scope.timezone.length < 3) errors.push(`${location}.timezone is required`);
    return;
  }
  if (!checkExactKeys(scope, ['start_date', 'end_date_exclusive', 'timezone'], location, errors)) return;
  checkDateRange(scope.start_date, scope.end_date_exclusive, location, errors);
  if (typeof scope.timezone !== 'string' || scope.timezone.length < 3) errors.push(`${location}.timezone is required`);
}

function validateObservedScope(scope, location, errors) {
  if (!isObject(scope)) {
    errors.push(`${location} must be an object`);
    return;
  }
  if (scope.kind === 'date_window' || scope.kind === 'source_visible_horizon') {
    if (!checkExactKeys(scope, ['kind', 'start_date', 'end_date_exclusive', 'timezone'], location, errors)) return;
    checkDateRange(scope.start_date, scope.end_date_exclusive, location, errors);
  } else if (scope.kind === 'single_date') {
    if (!checkExactKeys(scope, ['kind', 'date', 'timezone'], location, errors)) return;
    if (!realDate(scope.date)) errors.push(`${location}.date must be a real YYYY-MM-DD date`);
  } else if (scope.kind === 'selected_meetings') {
    if (!checkExactKeys(scope, ['kind', 'meeting_ids', 'timezone'], location, errors)) return;
    checkUniqueStringArray(scope.meeting_ids, `${location}.meeting_ids`, errors, { id: true, allowEmpty: false });
  } else if (scope.kind === 'not_observed') {
    checkExactKeys(scope, ['kind', 'timezone'], location, errors);
  } else {
    errors.push(`${location}.kind is unsupported`);
    return;
  }
  if (typeof scope.timezone !== 'string' || scope.timezone.length < 3) errors.push(`${location}.timezone is required`);
}

function validateSourceErrors(sourceErrors, errors) {
  if (!Array.isArray(sourceErrors)) {
    errors.push('source_errors must be an array');
    return;
  }
  sourceErrors.forEach((entry, index) => {
    const location = `source_errors[${index}]`;
    if (!checkExactKeys(entry, ['code', 'scope_ref', 'message'], location, errors)) return;
    if (!SOURCE_ERROR_CODES.includes(entry.code)) errors.push(`${location}.code is unsupported`);
    if (typeof entry.scope_ref !== 'string' || entry.scope_ref.trim() === '' || entry.scope_ref.length > 200) errors.push(`${location}.scope_ref is invalid`);
    if (typeof entry.message !== 'string' || entry.message.trim() === '' || entry.message.length > 500) errors.push(`${location}.message is invalid`);
  });
}

function validateArtifactRefs(refs, errors) {
  if (!checkExactKeys(refs, ARTIFACT_KEYS, 'artifact_refs', errors)) return;
  for (const key of ARTIFACT_KEYS) {
    const value = refs[key];
    if (value === null && key !== 'coverage_observation_ref') continue;
    if (typeof value !== 'string' || !REPO_REF_PATTERN.test(value) || value.includes('..')) {
      errors.push(`artifact_refs.${key} must be a safe repository ref${key === 'coverage_observation_ref' ? '' : ' or null'}`);
    }
  }
}

function walkForbiddenKeys(value, location, errors) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkForbiddenKeys(entry, `${location}[${index}]`, errors));
    return;
  }
  if (!isObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (PROHIBITED_KEY_FRAGMENTS.some((fragment) => key.toLowerCase().includes(fragment))) {
      errors.push(`${location}.${key} is prohibited in Collection Result Manifest`);
    }
    walkForbiddenKeys(child, `${location}.${key}`, errors);
  }
}

function requestedScopeFromCoverageObservation(observation) {
  const scope = observation?.requested_scope;
  if (!isObject(scope)) return null;
  if (scope.kind === 'selected_meetings') return { meeting_ids: scope.meeting_ids };
  if (scope.kind === 'single_date') return { date: scope.date, timezone: scope.timezone };
  if (scope.kind === 'date_window' || scope.kind === 'source_visible_horizon') {
    return { start_date: scope.start_date, end_date_exclusive: scope.end_date_exclusive, timezone: scope.timezone };
  }
  return null;
}

export function validateCollectionResultManifestV1(manifest) {
  const errors = [];
  if (!checkExactKeys(manifest, TOP_LEVEL_KEYS, 'manifest', errors)) return errors;
  if (manifest.schema_version !== 'calendar-collection-result-manifest-v1') errors.push('schema_version must be calendar-collection-result-manifest-v1');
  for (const key of ['campaign_id', 'job_id', 'batch_id', 'system_id']) {
    if (typeof manifest[key] !== 'string' || !ID_PATTERN.test(manifest[key])) errors.push(`${key} must be a stable slug ID`);
  }
  if (!RUNNERS.includes(manifest.runner_used)) errors.push('runner_used is unsupported');
  validateRequestedScope(manifest.requested_scope, 'requested_scope', errors);
  validateObservedScope(manifest.observed_scope, 'observed_scope', errors);
  if (!COVERAGE_CLAIMS.includes(manifest.coverage_claim)) errors.push('coverage_claim is unsupported');

  for (const key of ['records_discovered', 'records_updated']) {
    if (!Number.isInteger(manifest[key]) || manifest[key] < 0) errors.push(`${key} must be a non-negative integer`);
  }
  if (Number.isInteger(manifest.records_discovered) && Number.isInteger(manifest.records_updated) && manifest.records_updated > manifest.records_discovered) {
    errors.push('records_updated must not exceed records_discovered');
  }

  if (checkExactKeys(manifest.rank_counts, RANKS, 'rank_counts', errors)) {
    let sum = 0;
    for (const rank of RANKS) {
      const value = manifest.rank_counts[rank];
      if (!Number.isInteger(value) || value < 0) errors.push(`rank_counts.${rank} must be a non-negative integer`);
      else sum += value;
    }
    if (Number.isInteger(manifest.records_discovered) && sum !== manifest.records_discovered) {
      errors.push('sum of rank_counts must equal records_discovered');
    }
  }

  checkUniqueStringArray(manifest.unresolved_dates, 'unresolved_dates', errors, { date: true });
  checkUniqueStringArray(manifest.unresolved_meeting_ids, 'unresolved_meeting_ids', errors, { id: true });
  validateSourceErrors(manifest.source_errors, errors);
  validateArtifactRefs(manifest.artifact_refs, errors);

  if (manifest.coverage_claim === 'audited_complete' && (
    (manifest.unresolved_dates?.length ?? 0) > 0
    || (manifest.unresolved_meeting_ids?.length ?? 0) > 0
    || (manifest.source_errors?.length ?? 0) > 0
  )) errors.push('audited_complete cannot contain unresolved items or source errors');

  walkForbiddenKeys(manifest, 'manifest', errors);
  return errors;
}

export function validateCollectionResultManifestAgainstJobV1(manifest, job, registry) {
  const errors = [];
  if (!job) return ['matching Collection Job is required'];
  if (manifest.campaign_id !== job.campaign_id) errors.push('manifest campaign_id must match Collection Job campaign_id');
  if (manifest.job_id !== job.job_id) errors.push('manifest job_id must match Collection Job job_id');
  if (manifest.system_id !== job.system_id) errors.push('manifest system_id must match Collection Job system_id');
  if (!exact(manifest.requested_scope, job.requested_scope)) errors.push('manifest requested_scope must equal Collection Job requested_scope');

  const profile = registry?.records?.find((record) => record.system_id === job.system_id);
  if (!profile) return [...errors, `Acquisition Registry profile missing for ${job.system_id}`];
  const policy = job.runner_policy;
  if (policy?.mode === 'exact' && manifest.runner_used !== policy.runner) errors.push('runner_used must equal exact Collection Job runner');
  if (policy?.mode === 'registry_primary' && manifest.runner_used !== profile.primary_runner) errors.push('runner_used must equal Registry primary runner');
  if (policy?.mode === 'registry_primary_or_fallback' && ![profile.primary_runner, profile.fallback_runner].filter(Boolean).includes(manifest.runner_used)) {
    errors.push('runner_used must equal Registry primary or fallback runner');
  }
  return errors;
}

export function validateCollectionResultManifestAgainstCoverageV1(manifest, observation) {
  const errors = [];
  if (!observation) return ['matching Coverage Observation is required'];
  if (manifest.system_id !== observation.system_id) errors.push('manifest system_id must match Coverage Observation system_id');
  if (!exact(manifest.requested_scope, requestedScopeFromCoverageObservation(observation))) errors.push('manifest requested_scope must match normalized Coverage Observation requested_scope');
  for (const key of ['observed_scope', 'coverage_claim', 'records_discovered', 'records_updated', 'unresolved_dates', 'unresolved_meeting_ids', 'source_errors']) {
    if (!exact(manifest[key], observation[key])) errors.push(`manifest ${key} must match Coverage Observation ${key}`);
  }
  return errors;
}

export const collectionResultManifestV1Contract = Object.freeze({
  schema_version: 'calendar-collection-result-manifest-v1',
  top_level_keys: TOP_LEVEL_KEYS,
  runners: RUNNERS,
  coverage_claims: COVERAGE_CLAIMS,
  ranks: RANKS,
  source_error_codes: SOURCE_ERROR_CODES,
  artifact_keys: ARTIFACT_KEYS,
  prohibited_key_fragments: PROHIBITED_KEY_FRAGMENTS,
});
