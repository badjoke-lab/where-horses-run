const RANK_FIELDS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const RUNNERS = new Set(['github_actions', 'local', 'reviewed_import']);
const COVERAGE_CLAIMS = new Set(['none', 'partial', 'source_window_complete', 'audited_complete']);
const REQUIRED_FIELDS = Object.freeze([
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
  'generated_at',
]);
const FORBIDDEN_KEY_FRAGMENTS = Object.freeze([
  'raw_html', 'raw_body', 'source_body', 'credential', 'cookie', 'secret',
  'horse_name', 'jockey', 'trainer', 'odds', 'betting', 'result_data', 'payout', 'prediction', 'tip',
  'approval', 'promotion', 'publication', 'deployment',
]);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function stableId(value) {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}
function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function uniqueStrings(value) {
  return Array.isArray(value)
    && value.every((item) => typeof item === 'string' && item.length > 0)
    && new Set(value).size === value.length;
}
function normalizeJobScope(job) {
  const scope = job?.requested_scope;
  switch (job?.collection_mode) {
    case 'date_window':
      return { kind: 'date_window', ...scope };
    case 'single_date':
      return { kind: 'single_date', ...scope };
    case 'selected_meetings':
      return { kind: 'selected_meetings', ...scope, timezone: scope?.timezone ?? 'UTC' };
    case 'source_visible_horizon':
      return { kind: 'source_visible_horizon', ...scope };
    default:
      return null;
  }
}
function allowedRunners(profile, runnerPolicy) {
  if (!profile || !runnerPolicy) return [];
  if (runnerPolicy.mode === 'registry_primary') return [profile.primary_runner];
  if (runnerPolicy.mode === 'registry_primary_or_fallback') return [profile.primary_runner, profile.fallback_runner].filter(Boolean);
  if (runnerPolicy.mode === 'exact') return [runnerPolicy.runner].filter(Boolean);
  return [];
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
      errors.push(`forbidden manifest key ${[...trail, key].join('.')}`);
    }
    walkForbiddenKeys(entry, errors, [...trail, key]);
  }
}

export function validateCollectionResultManifestV1({ manifest, job, coverageObservation, registry, coverageArtifactRef }) {
  const errors = [];
  if (!isObject(manifest)) return ['manifest must be an object'];
  for (const field of REQUIRED_FIELDS) if (!Object.hasOwn(manifest, field)) errors.push(`missing required field ${field}`);
  for (const key of Object.keys(manifest)) if (!REQUIRED_FIELDS.includes(key)) errors.push(`unexpected field ${key}`);
  if (manifest.schema_version !== 'calendar-result-manifest-v1') errors.push('schema_version must be calendar-result-manifest-v1');
  for (const field of ['campaign_id', 'job_id', 'batch_id', 'system_id']) if (!stableId(manifest[field])) errors.push(`${field} must be lowercase kebab-case`);
  if (manifest.campaign_id !== job?.campaign_id) errors.push('campaign_id differs from Collection Job');
  if (manifest.job_id !== job?.job_id) errors.push('job_id differs from Collection Job');
  if (manifest.system_id !== job?.system_id) errors.push('system_id differs from Collection Job');
  if (manifest.system_id !== coverageObservation?.system_id) errors.push('system_id differs from Coverage Observation');

  if (!RUNNERS.has(manifest.runner_used)) errors.push(`unknown runner_used ${manifest.runner_used}`);
  const profile = registry?.records?.find((record) => record.system_id === manifest.system_id);
  if (!profile) errors.push(`Acquisition Registry profile missing ${manifest.system_id}`);
  else if (!allowedRunners(profile, job?.runner_policy).includes(manifest.runner_used)) errors.push(`runner_used ${manifest.runner_used} is not permitted by Job runner_policy and Registry`);

  const normalizedScope = normalizeJobScope(job);
  if (!normalizedScope || !exact(manifest.requested_scope, normalizedScope)) errors.push('requested_scope differs from normalized Collection Job scope');
  if (!exact(manifest.requested_scope, coverageObservation?.requested_scope)) errors.push('requested_scope differs from Coverage Observation');
  if (!exact(manifest.observed_scope, coverageObservation?.observed_scope)) errors.push('observed_scope differs from Coverage Observation');
  if (!COVERAGE_CLAIMS.has(manifest.coverage_claim)) errors.push(`unknown coverage_claim ${manifest.coverage_claim}`);
  if (manifest.coverage_claim !== coverageObservation?.coverage_claim) errors.push('coverage_claim differs from Coverage Observation');

  for (const field of ['records_discovered', 'records_updated']) {
    if (!Number.isInteger(manifest[field]) || manifest[field] < 0) errors.push(`${field} must be a non-negative integer`);
    if (manifest[field] !== coverageObservation?.[field]) errors.push(`${field} differs from Coverage Observation`);
  }

  if (!isObject(manifest.rank_counts) || !exact(Object.keys(manifest.rank_counts), RANK_FIELDS)) errors.push('rank_counts must contain exactly C, B, B+, A, A+ in contract order');
  else {
    for (const rank of RANK_FIELDS) if (!Number.isInteger(manifest.rank_counts[rank]) || manifest.rank_counts[rank] < 0) errors.push(`rank_counts.${rank} must be a non-negative integer`);
    const sum = RANK_FIELDS.reduce((total, rank) => total + manifest.rank_counts[rank], 0);
    if (sum > manifest.records_discovered) errors.push('sum of rank_counts exceeds records_discovered');
  }

  for (const field of ['unresolved_dates', 'unresolved_meeting_ids', 'source_errors']) {
    if (!exact(manifest[field], coverageObservation?.[field])) errors.push(`${field} differs from Coverage Observation`);
  }
  if (!uniqueStrings(manifest.unresolved_dates)) errors.push('unresolved_dates must be a unique string array');
  if (!uniqueStrings(manifest.unresolved_meeting_ids)) errors.push('unresolved_meeting_ids must be a unique string array');
  if (!Array.isArray(manifest.source_errors)) errors.push('source_errors must be an array');

  if (!uniqueStrings(manifest.artifact_refs) || manifest.artifact_refs.length === 0) errors.push('artifact_refs must be a non-empty unique string array');
  else {
    for (const ref of manifest.artifact_refs) if (!/^data\/[A-Za-z0-9_./+-]+\.json$/.test(ref)) errors.push(`invalid artifact_ref ${ref}`);
    if (coverageArtifactRef && !manifest.artifact_refs.includes(coverageArtifactRef)) errors.push('artifact_refs must include Coverage Observation artifact');
  }

  if (typeof manifest.generated_at !== 'string' || Number.isNaN(Date.parse(manifest.generated_at))) errors.push('generated_at must be a valid date-time');
  else if (typeof coverageObservation?.checked_at === 'string' && Date.parse(manifest.generated_at) < Date.parse(coverageObservation.checked_at)) errors.push('generated_at predates Coverage Observation checked_at');

  walkForbiddenKeys(manifest, errors);
  return errors;
}

export function buildCollectionResultManifestV1({ job, batchId, runnerUsed, coverageObservation, registry, rankCounts, artifactRefs, generatedAt, coverageArtifactRef }) {
  const manifest = {
    schema_version: 'calendar-result-manifest-v1',
    campaign_id: job.campaign_id,
    job_id: job.job_id,
    batch_id: batchId,
    system_id: job.system_id,
    runner_used: runnerUsed,
    requested_scope: structuredClone(coverageObservation.requested_scope),
    observed_scope: structuredClone(coverageObservation.observed_scope),
    coverage_claim: coverageObservation.coverage_claim,
    records_discovered: coverageObservation.records_discovered,
    records_updated: coverageObservation.records_updated,
    rank_counts: Object.fromEntries(RANK_FIELDS.map((rank) => [rank, rankCounts?.[rank] ?? 0])),
    unresolved_dates: structuredClone(coverageObservation.unresolved_dates),
    unresolved_meeting_ids: structuredClone(coverageObservation.unresolved_meeting_ids),
    source_errors: structuredClone(coverageObservation.source_errors),
    artifact_refs: [...artifactRefs],
    generated_at: generatedAt,
  };
  const errors = validateCollectionResultManifestV1({ manifest, job, coverageObservation, registry, coverageArtifactRef });
  if (errors.length) throw new Error(errors.join('\n'));
  return Object.freeze(manifest);
}

export const collectionResultManifestV1Contract = Object.freeze({
  ranks: RANK_FIELDS,
  requiredFields: REQUIRED_FIELDS,
});
