import { validateCollectionJobV1 } from './collection-job-validation.mjs';

const EXECUTION_SCHEMA_VERSION = 'calendar-runner-execution-v1';
const RUNNERS = Object.freeze(['github_actions', 'local', 'reviewed_import']);
const EXECUTION_KEYS = Object.freeze([
  'schema_version',
  'job_id',
  'campaign_id',
  'batch_id',
  'system_id',
  'runner_used',
  'executor_id',
  'invocation_kind',
  'entry_point',
  'collection_mode',
  'requested_scope',
  'rank_strategy',
  'target_rank',
  'reason',
  'source_route',
  'result_contract',
  'coverage_contract',
  'review_required',
  'side_effect_boundary',
]);
const ROUTE_KEYS = Object.freeze([
  'schedule_source_id',
  'detail_source_id',
  'schedule_adapter_id',
  'detail_adapter_id',
]);
const SIDE_EFFECT_KEYS = Object.freeze([
  'approval',
  'promotion',
  'canonical_write',
  'public_write',
  'publication',
  'deployment',
]);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function profileFor(registry, systemId) {
  return registry?.records?.find((record) => record.system_id === systemId) ?? null;
}

function executorFor(contract, systemId, runner) {
  return contract?.executors?.find((entry) => entry.system_id === systemId && entry.runner === runner) ?? null;
}

function exactKeys(value, allowed) {
  return isObject(value)
    && allowed.every((key) => Object.hasOwn(value, key))
    && Object.keys(value).every((key) => allowed.includes(key));
}

function previousDate(endDateExclusive) {
  const value = new Date(`${endDateExclusive}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

function coverageScopeFromJob(job) {
  if (job.collection_mode === 'date_window' || job.collection_mode === 'source_visible_horizon') {
    return {
      kind: job.collection_mode,
      start_date: job.requested_scope.start_date,
      end_date_exclusive: job.requested_scope.end_date_exclusive,
      timezone: job.requested_scope.timezone,
    };
  }
  if (job.collection_mode === 'single_date') {
    return {
      kind: 'single_date',
      date: job.requested_scope.date,
      timezone: job.requested_scope.timezone,
    };
  }
  if (job.collection_mode === 'selected_meetings') {
    return {
      kind: 'selected_meetings',
      meeting_ids: structuredClone(job.requested_scope.meeting_ids),
      timezone: 'Asia/Tokyo',
    };
  }
  throw new Error(`unsupported collection mode ${job.collection_mode}`);
}

function expectedNonRacingJra403(entry) {
  if (entry?.status !== 'http_error' || entry?.http_status !== 403) return false;
  const date = new Date(`${entry.date}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  const day = date.getUTCDay();
  return day >= 1 && day <= 5;
}

function jraBadStatuses(report) {
  return (report?.statuses ?? []).filter((entry) =>
    !['meetings_extracted', 'no_racing_page'].includes(entry.status)
    && !expectedNonRacingJra403(entry));
}

export function resolveRunnerForJobV1(job, registry, requestedRunner = null) {
  const jobErrors = validateCollectionJobV1(job, registry);
  if (jobErrors.length) throw new Error(`invalid Collection Job: ${jobErrors.join('; ')}`);
  const profile = profileFor(registry, job.system_id);
  if (!profile) throw new Error(`Registry profile missing for ${job.system_id}`);
  const mode = job.runner_policy.mode;
  if (requestedRunner !== null && !RUNNERS.includes(requestedRunner)) throw new Error(`unsupported requested runner ${requestedRunner}`);

  if (mode === 'exact') {
    const exactRunner = job.runner_policy.runner;
    if (requestedRunner !== null && requestedRunner !== exactRunner) throw new Error(`exact runner policy requires ${exactRunner}`);
    return exactRunner;
  }

  if (mode === 'registry_primary') {
    if (requestedRunner !== null && requestedRunner !== profile.primary_runner) {
      throw new Error(`registry_primary policy requires ${profile.primary_runner}`);
    }
    return profile.primary_runner;
  }

  const allowed = [profile.primary_runner, profile.fallback_runner].filter(Boolean);
  const resolved = requestedRunner ?? profile.primary_runner;
  if (!allowed.includes(resolved)) throw new Error(`runner ${resolved} is not registered for ${job.system_id}`);
  return resolved;
}

export function compileRunnerExecutionV1(job, { batch_id: batchId, requested_runner: requestedRunner = null } = {}, registry, contract) {
  if (!ID_PATTERN.test(batchId ?? '')) throw new Error('batch_id must be lowercase kebab-case');
  const runner = resolveRunnerForJobV1(job, registry, requestedRunner);
  const profile = profileFor(registry, job.system_id);
  const executor = executorFor(contract, job.system_id, runner);
  if (!executor) throw new Error(`executor mapping missing for ${job.system_id}/${runner}`);

  const execution = {
    schema_version: EXECUTION_SCHEMA_VERSION,
    job_id: job.job_id,
    campaign_id: job.campaign_id,
    batch_id: batchId,
    system_id: job.system_id,
    runner_used: runner,
    executor_id: executor.executor_id,
    invocation_kind: executor.invocation_kind,
    entry_point: executor.entry_point,
    collection_mode: job.collection_mode,
    requested_scope: structuredClone(job.requested_scope),
    rank_strategy: job.rank_strategy,
    target_rank: job.target_rank,
    reason: job.reason,
    source_route: {
      schedule_source_id: profile.schedule_source_id,
      detail_source_id: profile.detail_source_id,
      schedule_adapter_id: profile.schedule_adapter_id,
      detail_adapter_id: profile.detail_adapter_id,
    },
    result_contract: contract.result_contract,
    coverage_contract: contract.coverage_contract,
    review_required: true,
    side_effect_boundary: structuredClone(contract.side_effect_boundary),
  };

  const errors = validateRunnerExecutionV1(execution, job, registry, contract);
  if (errors.length) throw new Error(errors.join('; '));
  return execution;
}

export function validateRunnerExecutionV1(execution, job, registry, contract) {
  const errors = [];
  if (!exactKeys(execution, EXECUTION_KEYS)) return ['execution fields differ from calendar-runner-execution-v1'];
  if (execution.schema_version !== EXECUTION_SCHEMA_VERSION) errors.push('execution schema_version differs');
  for (const key of ['job_id', 'campaign_id', 'batch_id', 'system_id', 'executor_id']) {
    if (typeof execution[key] !== 'string' || !ID_PATTERN.test(execution[key])) errors.push(`${key} must be lowercase kebab-case`);
  }
  if (!RUNNERS.includes(execution.runner_used)) errors.push('runner_used is unsupported');
  if (!job) return [...errors, 'matching Collection Job is required'];
  const profile = profileFor(registry, job.system_id);
  if (!profile) return [...errors, `Registry profile missing for ${job.system_id}`];
  const executor = executorFor(contract, job.system_id, execution.runner_used);
  if (!executor) errors.push('executor mapping missing for resolved system/runner');

  for (const key of ['job_id', 'campaign_id', 'system_id', 'collection_mode', 'rank_strategy', 'target_rank', 'reason']) {
    if (!exact(execution[key], job[key])) errors.push(`execution ${key} must match Collection Job`);
  }
  if (!exact(execution.requested_scope, job.requested_scope)) errors.push('execution requested_scope must match Collection Job');
  try {
    const expectedRunner = resolveRunnerForJobV1(job, registry, execution.runner_used);
    if (execution.runner_used !== expectedRunner) errors.push('execution runner_used does not satisfy Job runner policy');
  } catch (error) {
    errors.push(error.message);
  }

  if (executor) {
    for (const key of ['executor_id', 'invocation_kind', 'entry_point']) {
      if (!exact(execution[key], executor[key])) errors.push(`execution ${key} differs from compatibility contract executor mapping`);
    }
  }

  const expectedRoute = {
    schedule_source_id: profile.schedule_source_id,
    detail_source_id: profile.detail_source_id,
    schedule_adapter_id: profile.schedule_adapter_id,
    detail_adapter_id: profile.detail_adapter_id,
  };
  if (!exactKeys(execution.source_route, ROUTE_KEYS) || !exact(execution.source_route, expectedRoute)) {
    errors.push('execution source_route differs from Acquisition Registry');
  }
  if (execution.result_contract !== contract.result_contract) errors.push('execution result_contract differs from compatibility contract');
  if (execution.coverage_contract !== contract.coverage_contract) errors.push('execution coverage_contract differs from compatibility contract');
  if (execution.review_required !== true) errors.push('execution review_required must be true');
  if (!exactKeys(execution.side_effect_boundary, SIDE_EFFECT_KEYS)) {
    errors.push('execution side_effect_boundary fields differ');
  } else if (SIDE_EFFECT_KEYS.some((key) => execution.side_effect_boundary[key] !== false)) {
    errors.push('execution side-effect boundary must remain false for all write/publication effects');
  }
  return errors;
}

export function normalizeNarV2BatchResultV1({ job, runner_used: runnerUsed, report, coverage, collection_report_ref: collectionReportRef }) {
  if (report?.schema_version !== 'nar-incremental-collection-report-v2') throw new Error('NAR collection report schema mismatch');
  if (coverage?.schema_version !== 'calendar-coverage-observation-v1') throw new Error('NAR Coverage Observation schema mismatch');
  if (report.batch_id !== coverage.run_id) throw new Error('NAR report batch_id and Coverage run_id differ');
  if (job.system_id !== coverage.system_id) throw new Error('NAR Job system and Coverage system differ');
  const expectedScope = coverageScopeFromJob(job);
  if (!exact(coverage.requested_scope, expectedScope)) throw new Error('NAR Coverage requested_scope differs from Collection Job');
  if (report.scheduled_meetings !== coverage.records_discovered) throw new Error('NAR discovered count differs between report and Coverage');
  if (report.complete_detail_candidates + report.schedule_only_candidates !== report.scheduled_meetings) {
    throw new Error('NAR C/A+ rank accounting does not equal scheduled meeting count');
  }

  return {
    schema_version: 'calendar-collection-result-manifest-v1',
    campaign_id: job.campaign_id,
    job_id: job.job_id,
    batch_id: report.batch_id,
    system_id: job.system_id,
    runner_used: runnerUsed,
    requested_scope: structuredClone(job.requested_scope),
    observed_scope: structuredClone(coverage.observed_scope),
    coverage_claim: coverage.coverage_claim,
    records_discovered: coverage.records_discovered,
    records_updated: coverage.records_updated,
    rank_counts: {
      C: report.schedule_only_candidates,
      B: 0,
      'B+': 0,
      A: 0,
      'A+': report.complete_detail_candidates,
    },
    unresolved_dates: structuredClone(coverage.unresolved_dates),
    unresolved_meeting_ids: structuredClone(coverage.unresolved_meeting_ids),
    source_errors: structuredClone(coverage.source_errors),
    artifact_refs: {
      candidate_ref: report.candidate_path,
      coverage_observation_ref: report.coverage_observation_path,
      collection_report_ref: collectionReportRef,
    },
  };
}

export function normalizeJraRefreshReportToCoverageV1({ job, batch_id: batchId, report }) {
  if (report?.schema_version !== 'jra-refresh-report-v0') throw new Error('JRA refresh report schema mismatch');
  if (job.system_id !== 'japan-jra-system') throw new Error('JRA report normalization requires japan-jra-system Job');
  if (job.collection_mode !== 'date_window') throw new Error('JRA refresh report normalization currently requires date_window Job');
  if (report.refresh_window?.from !== job.requested_scope.start_date
    || report.refresh_window?.to !== previousDate(job.requested_scope.end_date_exclusive)) {
    throw new Error('JRA refresh report scope differs from Collection Job date window');
  }
  const badStatuses = jraBadStatuses(report);
  const unresolvedDates = badStatuses.map((entry) => entry.date).filter(Boolean);
  const sourceErrors = badStatuses.map((entry) => ({
    code: 'unexpected_response',
    scope_ref: entry.date,
    message: `JRA source status ${entry.status} (${entry.http_status ?? entry.network_error ?? 'unknown'}).`,
  }));
  const scope = coverageScopeFromJob(job);
  return {
    schema_version: 'calendar-coverage-observation-v1',
    run_id: batchId,
    system_id: job.system_id,
    source_id: 'jra-programme',
    checked_at: report.generated_at,
    requested_scope: structuredClone(scope),
    observed_scope: structuredClone(scope),
    collection_mode: job.collection_mode,
    records_discovered: report.meetings_extracted,
    records_updated: report.publishable_meetings,
    unresolved_dates: unresolvedDates,
    unresolved_meeting_ids: [],
    source_errors: sourceErrors,
    coverage_claim: badStatuses.length === 0 ? 'source_window_complete' : 'partial',
    completion_audit_ref: null,
  };
}

export function normalizeJraRefreshReportToManifestV1({ job, batch_id: batchId, runner_used: runnerUsed, report, coverage }) {
  if (coverage.run_id !== batchId) throw new Error('JRA Coverage run_id differs from batch_id');
  if (report.a_plus_meetings + report.a_level_meetings !== report.publishable_meetings) {
    throw new Error('JRA A/A+ rank accounting does not equal publishable meeting count');
  }
  return {
    schema_version: 'calendar-collection-result-manifest-v1',
    campaign_id: job.campaign_id,
    job_id: job.job_id,
    batch_id: batchId,
    system_id: job.system_id,
    runner_used: runnerUsed,
    requested_scope: structuredClone(job.requested_scope),
    observed_scope: structuredClone(coverage.observed_scope),
    coverage_claim: coverage.coverage_claim,
    records_discovered: coverage.records_discovered,
    records_updated: coverage.records_updated,
    rank_counts: {
      C: 0,
      B: 0,
      'B+': 0,
      A: report.a_level_meetings,
      'A+': report.a_plus_meetings,
    },
    unresolved_dates: structuredClone(coverage.unresolved_dates),
    unresolved_meeting_ids: structuredClone(coverage.unresolved_meeting_ids),
    source_errors: structuredClone(coverage.source_errors),
    artifact_refs: {
      candidate_ref: 'data/candidates/japan-jra-candidates.json',
      coverage_observation_ref: `data/generated/timetable/runner-compatibility/${batchId}-coverage.json`,
      collection_report_ref: 'data/generated/timetable/jra-refresh-report.json',
    },
  };
}

export function compareRunnerNeutralManifestSemanticsV1(left, right) {
  const ignored = new Set(['runner_used']);
  const keys = Object.keys(left).filter((key) => !ignored.has(key));
  const errors = [];
  for (const key of keys) {
    if (!exact(left[key], right[key])) errors.push(`runner-neutral manifest field differs: ${key}`);
  }
  return errors;
}

export const runnerCompatibilityContractV1 = Object.freeze({
  execution_schema_version: EXECUTION_SCHEMA_VERSION,
  execution_keys: EXECUTION_KEYS,
  route_keys: ROUTE_KEYS,
  side_effect_keys: SIDE_EFFECT_KEYS,
  runners: RUNNERS,
});
