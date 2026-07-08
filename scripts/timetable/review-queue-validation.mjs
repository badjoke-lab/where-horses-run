const RUNNERS = Object.freeze(['github_actions', 'local', 'reviewed_import']);
const COVERAGE_CLAIMS = Object.freeze(['none', 'partial', 'source_window_complete', 'audited_complete']);
const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const REVIEW_STATES = Object.freeze(['review_ready', 'reviewing', 'approved', 'rejected']);
const PROMOTION_STATES = Object.freeze(['not_ready', 'promotion_ready', 'promoted', 'published']);
const TOP_LEVEL_KEYS = Object.freeze(['schema_version', 'generated_at', 'entries']);
const ENTRY_KEYS = Object.freeze([
  'campaign_id',
  'job_id',
  'batch_id',
  'system_id',
  'runner_used',
  'requested_scope',
  'coverage_claim',
  'rank_counts',
  'unresolved_dates_count',
  'unresolved_meeting_ids_count',
  'source_error_count',
  'review_state',
  'promotion_state',
  'manifest_ref',
]);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const REPO_REF_PATTERN = /^(?:data|docs)\/[A-Za-z0-9_./+-]+$/;
const PROHIBITED_KEY_FRAGMENTS = Object.freeze([
  'raw_html', 'raw_body', 'source_body', 'credential', 'cookie', 'secret', 'token',
  'horse_name', 'jockey', 'trainer', 'odds', 'betting', 'payout', 'prediction', 'tip',
  'stream_url',
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

function validDateTime(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
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

function checkUniqueStringArray(value, location, errors, { id = false, allowEmpty = true } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${location} must be an array`);
    return;
  }
  if (!allowEmpty && value.length === 0) errors.push(`${location} must not be empty`);
  const seen = new Set();
  value.forEach((entry, index) => {
    if (typeof entry !== 'string' || entry.trim() === '') errors.push(`${location}[${index}] must be a non-empty string`);
    else if (id && !ID_PATTERN.test(entry)) errors.push(`${location}[${index}] must be a stable slug ID`);
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

function walkForbiddenKeys(value, location, errors) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkForbiddenKeys(entry, `${location}[${index}]`, errors));
    return;
  }
  if (!isObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (PROHIBITED_KEY_FRAGMENTS.some((fragment) => key.toLowerCase().includes(fragment))) {
      errors.push(`${location}.${key} is prohibited in Review Queue`);
    }
    walkForbiddenKeys(child, `${location}.${key}`, errors);
  }
}

export function validateReviewQueueEntryV1(entry, location = 'entry') {
  const errors = [];
  if (!checkExactKeys(entry, ENTRY_KEYS, location, errors)) return errors;

  for (const key of ['campaign_id', 'job_id', 'batch_id', 'system_id']) {
    if (typeof entry[key] !== 'string' || !ID_PATTERN.test(entry[key])) errors.push(`${location}.${key} must be a stable slug ID`);
  }
  if (!RUNNERS.includes(entry.runner_used)) errors.push(`${location}.runner_used is unsupported`);
  validateRequestedScope(entry.requested_scope, `${location}.requested_scope`, errors);
  if (!COVERAGE_CLAIMS.includes(entry.coverage_claim)) errors.push(`${location}.coverage_claim is unsupported`);

  if (checkExactKeys(entry.rank_counts, RANKS, `${location}.rank_counts`, errors)) {
    for (const rank of RANKS) {
      if (!Number.isInteger(entry.rank_counts[rank]) || entry.rank_counts[rank] < 0) {
        errors.push(`${location}.rank_counts.${rank} must be a non-negative integer`);
      }
    }
  }

  for (const key of ['unresolved_dates_count', 'unresolved_meeting_ids_count', 'source_error_count']) {
    if (!Number.isInteger(entry[key]) || entry[key] < 0) errors.push(`${location}.${key} must be a non-negative integer`);
  }

  if (!REVIEW_STATES.includes(entry.review_state)) errors.push(`${location}.review_state is unsupported`);
  if (!PROMOTION_STATES.includes(entry.promotion_state)) errors.push(`${location}.promotion_state is unsupported`);
  if (['review_ready', 'reviewing', 'rejected'].includes(entry.review_state) && entry.promotion_state !== 'not_ready') {
    errors.push(`${location}.promotion_state must be not_ready until review_state is approved`);
  }
  if (['promotion_ready', 'promoted', 'published'].includes(entry.promotion_state) && entry.review_state !== 'approved') {
    errors.push(`${location}.promotion progress requires review_state approved`);
  }

  if (typeof entry.manifest_ref !== 'string' || !REPO_REF_PATTERN.test(entry.manifest_ref) || entry.manifest_ref.includes('..')) {
    errors.push(`${location}.manifest_ref must be a safe repository ref`);
  }

  walkForbiddenKeys(entry, location, errors);
  return errors;
}

export function validateReviewQueueV1(queue) {
  const errors = [];
  if (!checkExactKeys(queue, TOP_LEVEL_KEYS, 'queue', errors)) return errors;
  if (queue.schema_version !== 'calendar-review-queue-v1') errors.push('schema_version must be calendar-review-queue-v1');
  if (!validDateTime(queue.generated_at)) errors.push('generated_at must be a valid ISO date-time');
  if (!Array.isArray(queue.entries)) {
    errors.push('entries must be an array');
    return errors;
  }

  const seenBatchIds = new Set();
  const seenManifestRefs = new Set();
  queue.entries.forEach((entry, index) => {
    errors.push(...validateReviewQueueEntryV1(entry, `entries[${index}]`));
    if (seenBatchIds.has(entry?.batch_id)) errors.push(`entries must not contain duplicate batch_id ${entry?.batch_id}`);
    else seenBatchIds.add(entry?.batch_id);
    if (seenManifestRefs.has(entry?.manifest_ref)) errors.push(`entries must not contain duplicate manifest_ref ${entry?.manifest_ref}`);
    else seenManifestRefs.add(entry?.manifest_ref);
  });
  return errors;
}

export function buildReviewQueueEntryFromManifestV1(manifest, {
  review_state = 'review_ready',
  promotion_state = 'not_ready',
  manifest_ref,
} = {}) {
  if (!manifest_ref) throw new Error('manifest_ref is required');
  return {
    campaign_id: manifest.campaign_id,
    job_id: manifest.job_id,
    batch_id: manifest.batch_id,
    system_id: manifest.system_id,
    runner_used: manifest.runner_used,
    requested_scope: structuredClone(manifest.requested_scope),
    coverage_claim: manifest.coverage_claim,
    rank_counts: structuredClone(manifest.rank_counts),
    unresolved_dates_count: manifest.unresolved_dates.length,
    unresolved_meeting_ids_count: manifest.unresolved_meeting_ids.length,
    source_error_count: manifest.source_errors.length,
    review_state,
    promotion_state,
    manifest_ref,
  };
}

export function validateReviewQueueEntryAgainstManifestV1(entry, manifest) {
  const errors = [];
  if (!manifest) return ['matching Collection Result Manifest is required'];
  for (const key of ['campaign_id', 'job_id', 'batch_id', 'system_id', 'runner_used', 'requested_scope', 'coverage_claim', 'rank_counts']) {
    if (!exact(entry[key], manifest[key])) errors.push(`Review Queue ${key} must match Collection Result Manifest ${key}`);
  }
  if (entry.unresolved_dates_count !== manifest.unresolved_dates.length) errors.push('Review Queue unresolved_dates_count must equal manifest unresolved_dates length');
  if (entry.unresolved_meeting_ids_count !== manifest.unresolved_meeting_ids.length) errors.push('Review Queue unresolved_meeting_ids_count must equal manifest unresolved_meeting_ids length');
  if (entry.source_error_count !== manifest.source_errors.length) errors.push('Review Queue source_error_count must equal manifest source_errors length');
  return errors;
}

export function summarizeReviewQueueV1(queue) {
  const summary = {
    total_entries: queue.entries.length,
    by_review_state: Object.fromEntries(REVIEW_STATES.map((state) => [state, 0])),
    by_promotion_state: Object.fromEntries(PROMOTION_STATES.map((state) => [state, 0])),
    by_system: {},
    rank_counts: Object.fromEntries(RANKS.map((rank) => [rank, 0])),
    unresolved_dates_count: 0,
    unresolved_meeting_ids_count: 0,
    source_error_count: 0,
  };
  for (const entry of queue.entries) {
    summary.by_review_state[entry.review_state] += 1;
    summary.by_promotion_state[entry.promotion_state] += 1;
    summary.by_system[entry.system_id] = (summary.by_system[entry.system_id] ?? 0) + 1;
    for (const rank of RANKS) summary.rank_counts[rank] += entry.rank_counts[rank];
    summary.unresolved_dates_count += entry.unresolved_dates_count;
    summary.unresolved_meeting_ids_count += entry.unresolved_meeting_ids_count;
    summary.source_error_count += entry.source_error_count;
  }
  return summary;
}

export const reviewQueueV1Contract = Object.freeze({
  schema_version: 'calendar-review-queue-v1',
  top_level_keys: TOP_LEVEL_KEYS,
  entry_keys: ENTRY_KEYS,
  runners: RUNNERS,
  coverage_claims: COVERAGE_CLAIMS,
  ranks: RANKS,
  review_states: REVIEW_STATES,
  promotion_states: PROMOTION_STATES,
  prohibited_key_fragments: PROHIBITED_KEY_FRAGMENTS,
});
