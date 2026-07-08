const RUNNERS = Object.freeze(['github_actions', 'local', 'reviewed_import']);
const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const TARGET_RANKS = Object.freeze([...RANKS, 'best_available']);
const MISSING_FIELDS = Object.freeze([
  'first_race_time_local',
  'last_race_time_local',
  'timetable_rows',
  'race_name',
  'distance_m',
  'surface',
  'course_label',
]);
const RETRY_REASONS = Object.freeze([
  'scheduled_pending_details',
  'detail_retry_required',
  'coverage_gap',
  'rank_upgrade_retry',
  'source_revalidation',
  'manual_recovery',
  'completion_audit_support',
]);
const TOP_LEVEL_KEYS = Object.freeze(['schema_version', 'generated_at', 'entries']);
const ENTRY_KEYS = Object.freeze([
  'meeting_id',
  'system_id',
  'current_reviewed_rank',
  'latest_observed_rank',
  'collection_target_rank',
  'missing_fields',
  'retry_reason',
  'retry_scope',
  'primary_runner',
  'fallback_runner',
  'adapter_id',
  'next_eligible_retry_at',
  'attempt_count',
  'last_attempt_at',
]);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const RANK_INDEX = new Map(RANKS.map((rank, index) => [rank, index]));
const UPGRADE_REASONS = new Set([
  'scheduled_pending_details',
  'detail_retry_required',
  'coverage_gap',
  'rank_upgrade_retry',
  'manual_recovery',
]);
const TARGET_EXCEPTIONS = new Set(['source_revalidation', 'completion_audit_support']);
const PROHIBITED_KEY_FRAGMENTS = Object.freeze([
  'raw_html', 'raw_body', 'source_body', 'credential', 'cookie', 'secret', 'token',
  'horse_name', 'jockey', 'trainer', 'odds', 'betting', 'payout', 'prediction', 'tip',
  'stream_url', 'approval', 'publication', 'deployment',
]);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validDateTime(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Date.parse(value));
}

function realDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function rankCompare(left, right) {
  return RANK_INDEX.get(left) - RANK_INDEX.get(right);
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

function checkUniqueStrings(value, location, errors, { allowed = null, allowEmpty = true } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${location} must be an array`);
    return;
  }
  if (!allowEmpty && value.length === 0) errors.push(`${location} must not be empty`);
  const seen = new Set();
  value.forEach((entry, index) => {
    if (typeof entry !== 'string' || entry.trim() === '') errors.push(`${location}[${index}] must be a non-empty string`);
    else if (allowed && !allowed.includes(entry)) errors.push(`${location}[${index}] is unsupported`);
    if (seen.has(entry)) errors.push(`${location} must not contain duplicates`);
    seen.add(entry);
  });
}

function meetingDateFromId(meetingId) {
  const match = typeof meetingId === 'string' ? meetingId.match(/(\d{4}-\d{2}-\d{2})$/) : null;
  return match?.[1] ?? null;
}

function validateRetryScope(scope, meetingId, location, errors) {
  if (!isObject(scope)) {
    errors.push(`${location} must be an object`);
    return;
  }
  if (scope.mode === 'selected_meetings') {
    if (!checkExactKeys(scope, ['mode', 'meeting_ids'], location, errors)) return;
    checkUniqueStrings(scope.meeting_ids, `${location}.meeting_ids`, errors, { allowEmpty: false });
    if (Array.isArray(scope.meeting_ids) && !scope.meeting_ids.includes(meetingId)) {
      errors.push(`${location}.meeting_ids must include entry meeting_id`);
    }
    return;
  }
  if (scope.mode === 'single_date') {
    if (!checkExactKeys(scope, ['mode', 'date', 'timezone'], location, errors)) return;
    if (!realDate(scope.date)) errors.push(`${location}.date must be a real YYYY-MM-DD date`);
    if (typeof scope.timezone !== 'string' || scope.timezone.length < 3) errors.push(`${location}.timezone is required`);
    const meetingDate = meetingDateFromId(meetingId);
    if (meetingDate && realDate(scope.date) && meetingDate !== scope.date) errors.push(`${location}.date must include meeting date`);
    return;
  }
  if (scope.mode === 'date_window' || scope.mode === 'source_visible_horizon') {
    if (!checkExactKeys(scope, ['mode', 'start_date', 'end_date_exclusive', 'timezone'], location, errors)) return;
    if (!realDate(scope.start_date)) errors.push(`${location}.start_date must be a real YYYY-MM-DD date`);
    if (!realDate(scope.end_date_exclusive)) errors.push(`${location}.end_date_exclusive must be a real YYYY-MM-DD date`);
    if (realDate(scope.start_date) && realDate(scope.end_date_exclusive) && scope.start_date >= scope.end_date_exclusive) {
      errors.push(`${location}.end_date_exclusive must be after start_date`);
    }
    if (typeof scope.timezone !== 'string' || scope.timezone.length < 3) errors.push(`${location}.timezone is required`);
    const meetingDate = meetingDateFromId(meetingId);
    if (meetingDate && realDate(scope.start_date) && realDate(scope.end_date_exclusive)
      && !(scope.start_date <= meetingDate && meetingDate < scope.end_date_exclusive)) {
      errors.push(`${location} date window must include meeting date`);
    }
    return;
  }
  errors.push(`${location}.mode is unsupported`);
}

function walkForbiddenKeys(value, location, errors) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkForbiddenKeys(entry, `${location}[${index}]`, errors));
    return;
  }
  if (!isObject(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (PROHIBITED_KEY_FRAGMENTS.some((fragment) => key.toLowerCase().includes(fragment))) {
      errors.push(`${location}.${key} is prohibited in Rank-aware Retry Queue`);
    }
    walkForbiddenKeys(child, `${location}.${key}`, errors);
  }
}

export function validateRankGapV1({
  current_reviewed_rank,
  latest_observed_rank,
  collection_target_rank,
  retry_reason,
  technical_capability_rank = null,
}) {
  const errors = [];
  if (!RANKS.includes(current_reviewed_rank)) errors.push('current_reviewed_rank is unsupported');
  if (latest_observed_rank !== null && !RANKS.includes(latest_observed_rank)) errors.push('latest_observed_rank is unsupported');
  if (!TARGET_RANKS.includes(collection_target_rank)) errors.push('collection_target_rank is unsupported');
  if (!RETRY_REASONS.includes(retry_reason)) errors.push('retry_reason is unsupported');
  if (errors.length) return errors;

  const exception = TARGET_EXCEPTIONS.has(retry_reason);
  if (collection_target_rank === 'best_available') {
    if (technical_capability_rank !== null && !RANKS.includes(technical_capability_rank)) {
      errors.push('technical_capability_rank is unsupported');
      return errors;
    }
    if (!exception && technical_capability_rank && rankCompare(technical_capability_rank, current_reviewed_rank) <= 0) {
      errors.push('best_available retry requires technical capability above current reviewed rank');
    }
    if (!exception && technical_capability_rank && latest_observed_rank
      && rankCompare(latest_observed_rank, technical_capability_rank) >= 0) {
      errors.push('latest observed rank already satisfies best_available technical capability');
    }
  } else {
    if (!exception && rankCompare(collection_target_rank, current_reviewed_rank) <= 0) {
      errors.push('retry target must be above current reviewed rank');
    }
    if (!exception && latest_observed_rank && rankCompare(latest_observed_rank, collection_target_rank) >= 0) {
      errors.push('latest observed rank already satisfies retry target');
    }
    if (technical_capability_rank && rankCompare(collection_target_rank, technical_capability_rank) > 0) {
      errors.push('retry target must not exceed technical capability rank');
    }
  }
  return errors;
}

export function validateRankAwareRetryQueueEntryV1(entry, location = 'entry') {
  const errors = [];
  if (!checkExactKeys(entry, ENTRY_KEYS, location, errors)) return errors;
  for (const key of ['meeting_id', 'system_id', 'adapter_id']) {
    if (typeof entry[key] !== 'string' || !ID_PATTERN.test(entry[key])) errors.push(`${location}.${key} must be a stable slug ID`);
  }
  if (!RANKS.includes(entry.current_reviewed_rank)) errors.push(`${location}.current_reviewed_rank is unsupported`);
  if (entry.latest_observed_rank !== null && !RANKS.includes(entry.latest_observed_rank)) errors.push(`${location}.latest_observed_rank is unsupported`);
  if (!TARGET_RANKS.includes(entry.collection_target_rank)) errors.push(`${location}.collection_target_rank is unsupported`);
  checkUniqueStrings(entry.missing_fields, `${location}.missing_fields`, errors, { allowed: MISSING_FIELDS });
  if (!RETRY_REASONS.includes(entry.retry_reason)) errors.push(`${location}.retry_reason is unsupported`);
  validateRetryScope(entry.retry_scope, entry.meeting_id, `${location}.retry_scope`, errors);
  if (!RUNNERS.includes(entry.primary_runner)) errors.push(`${location}.primary_runner is unsupported`);
  if (entry.fallback_runner !== null && !RUNNERS.includes(entry.fallback_runner)) errors.push(`${location}.fallback_runner is unsupported`);
  if (entry.fallback_runner !== null && entry.fallback_runner === entry.primary_runner) errors.push(`${location}.fallback_runner must differ from primary_runner`);
  if (entry.next_eligible_retry_at !== null && !validDateTime(entry.next_eligible_retry_at)) errors.push(`${location}.next_eligible_retry_at must be date-time or null`);
  if (!Number.isInteger(entry.attempt_count) || entry.attempt_count < 0) errors.push(`${location}.attempt_count must be a non-negative integer`);
  if (entry.last_attempt_at !== null && !validDateTime(entry.last_attempt_at)) errors.push(`${location}.last_attempt_at must be date-time or null`);
  if (entry.attempt_count === 0 && entry.last_attempt_at !== null) errors.push(`${location}.last_attempt_at must be null when attempt_count is zero`);
  if (entry.attempt_count > 0 && entry.last_attempt_at === null) errors.push(`${location}.last_attempt_at is required when attempt_count is positive`);
  if (entry.last_attempt_at && entry.next_eligible_retry_at
    && Date.parse(entry.next_eligible_retry_at) < Date.parse(entry.last_attempt_at)) {
    errors.push(`${location}.next_eligible_retry_at must not precede last_attempt_at`);
  }
  if (UPGRADE_REASONS.has(entry.retry_reason) && entry.missing_fields.length === 0) {
    errors.push(`${location}.missing_fields must not be empty for upgrade-oriented retry`);
  }
  if (entry.retry_reason === 'scheduled_pending_details' || entry.retry_reason === 'detail_retry_required') {
    if (entry.current_reviewed_rank !== 'C') errors.push(`${location}.${entry.retry_reason} requires current reviewed rank C`);
    if (entry.collection_target_rank !== 'best_available') errors.push(`${location}.${entry.retry_reason} requires best_available target`);
  }
  errors.push(...validateRankGapV1(entry).map((error) => `${location}.${error}`));
  walkForbiddenKeys(entry, location, errors);
  return errors;
}

export function validateRankAwareRetryQueueV1(queue) {
  const errors = [];
  if (!checkExactKeys(queue, TOP_LEVEL_KEYS, 'queue', errors)) return errors;
  if (queue.schema_version !== 'calendar-rank-aware-retry-queue-v1') errors.push('schema_version must be calendar-rank-aware-retry-queue-v1');
  if (!validDateTime(queue.generated_at)) errors.push('generated_at must be a valid ISO date-time');
  if (!Array.isArray(queue.entries)) {
    errors.push('entries must be an array');
    return errors;
  }
  const seen = new Set();
  queue.entries.forEach((entry, index) => {
    errors.push(...validateRankAwareRetryQueueEntryV1(entry, `entries[${index}]`));
    const key = `${entry?.system_id}:${entry?.meeting_id}`;
    if (seen.has(key)) errors.push(`entries must not contain duplicate system/meeting key ${key}`);
    seen.add(key);
  });
  return errors;
}

export function validateRetryEntryAgainstRegistryV1(entry, registry) {
  const errors = [];
  const profile = registry?.records?.find((record) => record.system_id === entry.system_id);
  if (!profile) return [`Acquisition Registry profile missing for ${entry.system_id}`];
  if (entry.primary_runner !== profile.primary_runner) errors.push('primary_runner must match Acquisition Registry');
  if (entry.fallback_runner !== profile.fallback_runner) errors.push('fallback_runner must match Acquisition Registry');

  const allowedAdapters = [profile.schedule_adapter_id, profile.detail_adapter_id].filter(Boolean);
  if (!allowedAdapters.includes(entry.adapter_id)) errors.push('adapter_id must resolve to Acquisition Registry schedule or detail adapter');
  if (['scheduled_pending_details', 'detail_retry_required', 'rank_upgrade_retry'].includes(entry.retry_reason)) {
    if (!profile.supports_rank_upgrade_retry) errors.push('rank-oriented retry requires Registry rank-upgrade retry support');
    if (profile.detail_adapter_id && entry.adapter_id !== profile.detail_adapter_id) errors.push('rank-oriented retry must use Registry detail adapter');
  }

  const scope = entry.retry_scope;
  if (scope.mode === 'selected_meetings' && !profile.supports_selected_meetings) errors.push('selected-meeting retry is not supported by Registry profile');
  if ((scope.mode === 'date_window' || scope.mode === 'single_date') && !profile.supports_date_window) errors.push('date retry scope is not supported by Registry profile');
  if (scope.mode === 'date_window' && profile.supports_date_window) {
    const crossMonth = scope.start_date.slice(0, 7) !== new Date(Date.parse(`${scope.end_date_exclusive}T00:00:00Z`) - 86400000).toISOString().slice(0, 7);
    if (crossMonth && !profile.supports_cross_month_window) errors.push('cross-month retry scope is not supported by Registry profile');
  }
  if (scope.mode === 'source_visible_horizon' && !profile.supports_source_visible_horizon) errors.push('source-visible-horizon retry is not supported by Registry profile');

  errors.push(...validateRankGapV1({
    ...entry,
    technical_capability_rank: profile.technical_capability_rank,
  }));
  return errors;
}

export function validateRetryEntryAgainstCanonicalMeetingV1(entry, meeting, registry) {
  const errors = [];
  if (!meeting) return [`canonical meeting missing for ${entry.meeting_id}`];
  if (meeting.meeting_id !== entry.meeting_id) errors.push('meeting_id must match canonical meeting');
  if (meeting.capability_rank !== entry.current_reviewed_rank) errors.push('current_reviewed_rank must match canonical meeting capability_rank');
  const profile = registry?.records?.find((record) => record.system_id === entry.system_id);
  if (profile && meeting.authority_id !== profile.authority_id) errors.push('canonical meeting authority must match Registry system authority');
  return errors;
}

function retryScopeFromNarArtifact(requestedScope) {
  if (requestedScope?.kind === 'date_window' || requestedScope?.kind === 'source_visible_horizon') {
    return {
      mode: requestedScope.kind,
      start_date: requestedScope.start_date,
      end_date_exclusive: requestedScope.end_date_exclusive,
      timezone: requestedScope.timezone,
    };
  }
  if (requestedScope?.kind === 'selected_meetings') {
    return { mode: 'selected_meetings', meeting_ids: structuredClone(requestedScope.meeting_ids) };
  }
  if (requestedScope?.kind === 'single_date') {
    return { mode: 'single_date', date: requestedScope.date, timezone: requestedScope.timezone };
  }
  throw new Error('unsupported NAR retry requested_scope');
}

export function buildNarV2RetryQueueV1({ retryArtifact, canonicalMeetings, registry }) {
  if (retryArtifact?.schema_version !== 'nar-incremental-retry-targets-v2') throw new Error('NAR retry artifact schema mismatch');
  const profile = registry?.records?.find((record) => record.system_id === retryArtifact.system_id);
  if (!profile) throw new Error(`Registry profile missing for ${retryArtifact.system_id}`);
  const reasonEntries = Object.entries(retryArtifact.reason_counts ?? {}).filter(([, count]) => Number.isInteger(count) && count > 0);
  if (reasonEntries.length !== 1) throw new Error('NAR retry projection requires one unambiguous reason count');
  const [retryReason, retryCount] = reasonEntries[0];
  if (!RETRY_REASONS.includes(retryReason)) throw new Error(`unsupported NAR retry reason ${retryReason}`);
  if (retryCount !== retryArtifact.meeting_targets.length) throw new Error('NAR retry reason count must equal meeting target count');

  const meetingMap = new Map(canonicalMeetings.map((meeting) => [meeting.meeting_id, meeting]));
  const scope = retryScopeFromNarArtifact(retryArtifact.requested_scope);
  const entries = retryArtifact.meeting_targets.map((meetingId) => {
    const canonical = meetingMap.get(meetingId);
    if (!canonical) throw new Error(`canonical meeting missing for NAR retry target ${meetingId}`);
    const entry = {
      meeting_id: meetingId,
      system_id: retryArtifact.system_id,
      current_reviewed_rank: canonical.capability_rank,
      latest_observed_rank: 'C',
      collection_target_rank: profile.collection_target_rank,
      missing_fields: ['timetable_rows', 'race_name', 'distance_m', 'surface', 'course_label'],
      retry_reason: retryReason,
      retry_scope: structuredClone(scope),
      primary_runner: profile.primary_runner,
      fallback_runner: profile.fallback_runner,
      adapter_id: profile.detail_adapter_id,
      next_eligible_retry_at: null,
      attempt_count: 0,
      last_attempt_at: null,
    };
    const structural = validateRankAwareRetryQueueEntryV1(entry);
    const registryErrors = validateRetryEntryAgainstRegistryV1(entry, registry);
    const canonicalErrors = validateRetryEntryAgainstCanonicalMeetingV1(entry, canonical, registry);
    const combined = [...structural, ...registryErrors, ...canonicalErrors];
    if (combined.length) throw new Error(`${meetingId}: ${combined.join('; ')}`);
    return entry;
  });

  const queue = {
    schema_version: 'calendar-rank-aware-retry-queue-v1',
    generated_at: retryArtifact.generated_at,
    entries,
  };
  const queueErrors = validateRankAwareRetryQueueV1(queue);
  if (queueErrors.length) throw new Error(queueErrors.join('; '));
  return queue;
}

export function summarizeRankAwareRetryQueueV1(queue) {
  const summary = {
    total_entries: queue.entries.length,
    by_system: {},
    by_current_rank: Object.fromEntries(RANKS.map((rank) => [rank, 0])),
    by_target_rank: Object.fromEntries(TARGET_RANKS.map((rank) => [rank, 0])),
    by_reason: Object.fromEntries(RETRY_REASONS.map((reason) => [reason, 0])),
    by_scope_mode: {
      selected_meetings: 0,
      date_window: 0,
      single_date: 0,
      source_visible_horizon: 0,
    },
    due_now_count: 0,
    deferred_count: 0,
  };
  const generatedAt = Date.parse(queue.generated_at);
  for (const entry of queue.entries) {
    summary.by_system[entry.system_id] = (summary.by_system[entry.system_id] ?? 0) + 1;
    summary.by_current_rank[entry.current_reviewed_rank] += 1;
    summary.by_target_rank[entry.collection_target_rank] += 1;
    summary.by_reason[entry.retry_reason] += 1;
    summary.by_scope_mode[entry.retry_scope.mode] += 1;
    if (entry.next_eligible_retry_at === null || Date.parse(entry.next_eligible_retry_at) <= generatedAt) summary.due_now_count += 1;
    else summary.deferred_count += 1;
  }
  return summary;
}

export const rankAwareRetryQueueV1Contract = Object.freeze({
  schema_version: 'calendar-rank-aware-retry-queue-v1',
  top_level_keys: TOP_LEVEL_KEYS,
  entry_keys: ENTRY_KEYS,
  runners: RUNNERS,
  ranks: RANKS,
  target_ranks: TARGET_RANKS,
  missing_fields: MISSING_FIELDS,
  retry_reasons: RETRY_REASONS,
  prohibited_key_fragments: PROHIBITED_KEY_FRAGMENTS,
});
