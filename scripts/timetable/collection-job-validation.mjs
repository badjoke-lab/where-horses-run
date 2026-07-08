const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const RANK_INDEX = new Map(RANKS.map((rank, index) => [rank, index]));
const RUNNER_POLICY_MODES = new Set(['registry_primary', 'registry_primary_or_fallback', 'exact']);
const RUNNERS = new Set(['github_actions', 'local', 'reviewed_import']);
const COLLECTION_MODES = new Set(['date_window', 'single_date', 'selected_meetings', 'source_visible_horizon']);
const RANK_STRATEGIES = new Set(['best_available', 'target_rank']);
const REASONS = new Set(['regular_refresh', 'coverage_gap', 'rank_upgrade_retry', 'source_revalidation', 'manual_recovery', 'completion_audit_support']);
const REQUIRED_FIELDS = Object.freeze([
  'schema_version',
  'job_id',
  'campaign_id',
  'system_id',
  'runner_policy',
  'collection_mode',
  'requested_scope',
  'rank_strategy',
  'target_rank',
  'reason',
  'requested_at',
]);
const SCOPE_FIELDS = Object.freeze({
  date_window: ['start_date', 'end_date_exclusive', 'timezone'],
  single_date: ['date', 'timezone'],
  selected_meetings: ['meeting_ids'],
  source_visible_horizon: ['start_date', 'end_date_exclusive', 'timezone'],
});
const FORBIDDEN_KEY_FRAGMENTS = Object.freeze([
  'source_id', 'adapter_id', 'raw_html', 'raw_body', 'source_body', 'credential', 'cookie', 'secret',
  'horse_name', 'jockey', 'trainer', 'odds', 'betting', 'result', 'payout', 'prediction', 'tip',
  'approval', 'promotion', 'publication', 'deployment',
]);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isRealDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function previousDate(value) {
  const parsed = new Date(`${value}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() - 1);
  return parsed.toISOString().slice(0, 10);
}

function crossesMonth(startDate, endDateExclusive) {
  return startDate.slice(0, 7) !== previousDate(endDateExclusive).slice(0, 7);
}

function stableId(value) {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function profileMap(registry) {
  const map = new Map();
  for (const profile of registry?.records ?? []) {
    if (!map.has(profile.system_id)) map.set(profile.system_id, profile);
  }
  return map;
}

function walkForbiddenKeys(value, errors, trail = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkForbiddenKeys(entry, errors, [...trail, String(index)]));
    return;
  }
  if (!isObject(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    const normalized = key.toLowerCase();
    if (FORBIDDEN_KEY_FRAGMENTS.some((fragment) => normalized.includes(fragment))) {
      errors.push(`forbidden job key ${[...trail, key].join('.')}`);
    }
    walkForbiddenKeys(entry, errors, [...trail, key]);
  }
}

export function validateCollectionJobV1(job, registry) {
  const errors = [];
  if (!isObject(job)) return ['job must be an object'];

  for (const field of REQUIRED_FIELDS) if (!Object.hasOwn(job, field)) errors.push(`missing required field ${field}`);
  for (const key of Object.keys(job)) if (!REQUIRED_FIELDS.includes(key)) errors.push(`unexpected field ${key}`);

  if (job.schema_version !== 'calendar-collection-job-v1') errors.push('schema_version must be calendar-collection-job-v1');
  if (!stableId(job.job_id)) errors.push('job_id must be lowercase kebab-case');
  if (!stableId(job.campaign_id)) errors.push('campaign_id must be lowercase kebab-case');
  if (typeof job.system_id !== 'string' || !job.system_id) errors.push('system_id must be a non-empty string');

  const profiles = profileMap(registry);
  const profile = profiles.get(job.system_id);
  if (!profile) errors.push(`unknown system_id ${job.system_id}`);

  if (!isObject(job.runner_policy)) {
    errors.push('runner_policy must be an object');
  } else {
    const keys = Object.keys(job.runner_policy).sort();
    if (JSON.stringify(keys) !== JSON.stringify(['mode', 'runner'])) errors.push('runner_policy must contain exactly mode and runner');
    const mode = job.runner_policy.mode;
    const runner = job.runner_policy.runner;
    if (!RUNNER_POLICY_MODES.has(mode)) errors.push(`unknown runner_policy mode ${mode}`);
    if (runner !== null && !RUNNERS.has(runner)) errors.push(`unknown runner ${runner}`);
    if (mode === 'registry_primary' && runner !== null) errors.push('registry_primary runner_policy requires runner null');
    if (mode === 'registry_primary_or_fallback') {
      if (runner !== null) errors.push('registry_primary_or_fallback requires runner null');
      if (profile && profile.fallback_runner === null) errors.push('registry_primary_or_fallback requires a registry fallback_runner');
    }
    if (mode === 'exact') {
      if (runner === null) errors.push('exact runner_policy requires runner');
      if (profile && ![profile.primary_runner, profile.fallback_runner].includes(runner)) {
        errors.push(`exact runner ${runner} is not registered for ${job.system_id}`);
      }
    }
  }

  if (!COLLECTION_MODES.has(job.collection_mode)) errors.push(`unknown collection_mode ${job.collection_mode}`);
  if (!isObject(job.requested_scope)) {
    errors.push('requested_scope must be an object');
  } else if (SCOPE_FIELDS[job.collection_mode]) {
    const expected = [...SCOPE_FIELDS[job.collection_mode]].sort();
    const actual = Object.keys(job.requested_scope).sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) errors.push(`requested_scope fields differ for ${job.collection_mode}`);

    if (job.collection_mode === 'date_window' || job.collection_mode === 'source_visible_horizon') {
      const { start_date: startDate, end_date_exclusive: endDateExclusive, timezone } = job.requested_scope;
      if (!isRealDate(startDate)) errors.push('requested_scope.start_date must be a real YYYY-MM-DD date');
      if (!isRealDate(endDateExclusive)) errors.push('requested_scope.end_date_exclusive must be a real YYYY-MM-DD date');
      if (isRealDate(startDate) && isRealDate(endDateExclusive) && startDate >= endDateExclusive) errors.push('requested_scope end must be after start');
      if (typeof timezone !== 'string' || !timezone) errors.push('requested_scope.timezone must be non-empty');
      if (profile && job.collection_mode === 'date_window') {
        if (profile.supports_date_window !== true) errors.push(`${job.system_id} does not support date_window`);
        if (isRealDate(startDate) && isRealDate(endDateExclusive) && crossesMonth(startDate, endDateExclusive) && profile.supports_cross_month_window !== true) {
          errors.push(`${job.system_id} does not support cross-month date windows`);
        }
      }
      if (profile && job.collection_mode === 'source_visible_horizon' && profile.supports_source_visible_horizon !== true) {
        errors.push(`${job.system_id} does not support source_visible_horizon`);
      }
    }

    if (job.collection_mode === 'single_date') {
      if (!isRealDate(job.requested_scope.date)) errors.push('requested_scope.date must be a real YYYY-MM-DD date');
      if (typeof job.requested_scope.timezone !== 'string' || !job.requested_scope.timezone) errors.push('requested_scope.timezone must be non-empty');
      if (profile && profile.supports_date_window !== true) errors.push(`${job.system_id} does not support single_date through date-window capability`);
    }

    if (job.collection_mode === 'selected_meetings') {
      const meetingIds = job.requested_scope.meeting_ids;
      if (!Array.isArray(meetingIds) || meetingIds.length === 0 || meetingIds.some((id) => typeof id !== 'string' || !id)) {
        errors.push('selected_meetings requires a non-empty meeting_ids string array');
      } else if (new Set(meetingIds).size !== meetingIds.length) {
        errors.push('selected_meetings meeting_ids must be unique');
      }
      if (profile && profile.supports_selected_meetings !== true) errors.push(`${job.system_id} does not support selected_meetings`);
    }
  }

  if (!RANK_STRATEGIES.has(job.rank_strategy)) errors.push(`unknown rank_strategy ${job.rank_strategy}`);
  if (job.rank_strategy === 'best_available' && job.target_rank !== null) errors.push('best_available requires target_rank null');
  if (job.rank_strategy === 'target_rank') {
    if (!RANK_INDEX.has(job.target_rank)) errors.push('target_rank strategy requires a valid target_rank');
    if (profile && RANK_INDEX.has(job.target_rank) && RANK_INDEX.get(job.target_rank) > RANK_INDEX.get(profile.technical_capability_rank)) {
      errors.push(`target_rank ${job.target_rank} exceeds technical capability ${profile.technical_capability_rank}`);
    }
  }

  if (!REASONS.has(job.reason)) errors.push(`unknown reason ${job.reason}`);
  if (job.reason === 'rank_upgrade_retry') {
    if (job.rank_strategy !== 'target_rank') errors.push('rank_upgrade_retry requires target_rank strategy');
    if (profile && profile.supports_rank_upgrade_retry !== true) errors.push(`${job.system_id} does not support rank_upgrade_retry`);
  }
  if (job.reason === 'completion_audit_support' && job.collection_mode !== 'date_window') {
    errors.push('completion_audit_support requires date_window mode');
  }

  if (typeof job.requested_at !== 'string' || Number.isNaN(Date.parse(job.requested_at))) errors.push('requested_at must be a valid date-time');

  walkForbiddenKeys(job, errors);
  return errors;
}

export function assertCollectionJobV1(job, registry) {
  const errors = validateCollectionJobV1(job, registry);
  if (errors.length) throw new Error(errors.join('\n'));
  return job;
}

export const collectionJobV1Contract = Object.freeze({
  ranks: RANKS,
  requiredFields: REQUIRED_FIELDS,
  scopeFields: SCOPE_FIELDS,
});
