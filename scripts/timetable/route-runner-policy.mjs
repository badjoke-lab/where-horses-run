const ROUTE_KINDS = Object.freeze(['schedule', 'detail']);
const SELECTION_CONTEXTS = Object.freeze(['collection_job', 'due_job_planner', 'operator_reviewed_import', 'operations_view']);
const RUNNERS = Object.freeze(['github_actions', 'local', 'reviewed_import']);
const RANKS = Object.freeze(['C', 'B', 'B+', 'A', 'A+']);
const COLLECTION_MODES = Object.freeze(['date_window', 'single_date', 'selected_meetings', 'source_visible_horizon']);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value, keys) {
  return isObject(value)
    && keys.every((key) => Object.hasOwn(value, key))
    && Object.keys(value).every((key) => keys.includes(key));
}

function unique(values) {
  return Array.isArray(values) && new Set(values).size === values.length;
}

function profileFor(registry, systemId) {
  return registry?.records?.find((record) => record.system_id === systemId) ?? null;
}

export function validateRouteRunnerPolicyV1(policy, registry, compatibilityContract = null) {
  const errors = [];
  if (!isObject(policy)) return ['route runner policy must be an object'];
  const rootKeys = ['schema_version', 'policy_version', 'registry_compatibility', 'routes', 'side_effect_boundary'];
  if (!exactKeys(policy, rootKeys)) errors.push('route runner policy root fields differ');
  if (policy.schema_version !== 'calendar-route-runner-policy-v1') errors.push('route runner policy schema_version differs');
  if (!ID_PATTERN.test(String(policy.policy_version ?? ''))) errors.push('route runner policy policy_version invalid');

  const compatibility = policy.registry_compatibility;
  const compatibilityKeys = [
    'system_level_fields_remain_authoritative_for_legacy_jobs',
    'route_policy_is_additive',
    'route_policy_may_not_activate_registry_fields',
  ];
  if (!exactKeys(compatibility, compatibilityKeys)) errors.push('registry_compatibility fields differ');
  else if (compatibilityKeys.some((key) => compatibility[key] !== true)) errors.push('all registry compatibility guards must be true');

  const boundaryKeys = [
    'automatic_import', 'automatic_approval', 'automatic_promotion', 'canonical_write',
    'public_write', 'automatic_publication', 'deployment',
  ];
  if (!exactKeys(policy.side_effect_boundary, boundaryKeys)) errors.push('route policy side-effect boundary fields differ');
  else if (boundaryKeys.some((key) => policy.side_effect_boundary[key] !== false)) errors.push('route policy side-effect boundary must remain all false');

  if (!Array.isArray(policy.routes) || policy.routes.length === 0) return [...errors, 'route runner policy routes must be non-empty'];
  const routeKeys = [
    'system_id', 'route_kind', 'status', 'selection_mode', 'primary_runner', 'fallback_runner',
    'source_id', 'adapter_id', 'entry_point', 'supported_collection_modes',
    'evidence_backed_observation_ranks', 'automatic_planning_allowed', 'automatic_execution_allowed',
    'human_review_required', 'registry_activation', 'evidence_ref',
  ];
  const seen = new Set();
  for (const [index, route] of policy.routes.entries()) {
    const label = `routes[${index}]`;
    if (!exactKeys(route, routeKeys)) errors.push(`${label} fields differ`);
    const key = `${route?.system_id}:${route?.route_kind}`;
    if (seen.has(key)) errors.push(`${label} duplicates ${key}`);
    seen.add(key);
    if (!ID_PATTERN.test(String(route?.system_id ?? ''))) errors.push(`${label}.system_id invalid`);
    if (!ROUTE_KINDS.includes(route?.route_kind)) errors.push(`${label}.route_kind invalid`);
    if (!['active', 'operator_path_evidence_backed', 'pending', 'blocked'].includes(route?.status)) errors.push(`${label}.status invalid`);
    if (!['collection_job', 'operator_only'].includes(route?.selection_mode)) errors.push(`${label}.selection_mode invalid`);
    if (!RUNNERS.includes(route?.primary_runner)) errors.push(`${label}.primary_runner invalid`);
    if (route?.fallback_runner !== null && !RUNNERS.includes(route.fallback_runner)) errors.push(`${label}.fallback_runner invalid`);
    if (!ID_PATTERN.test(String(route?.source_id ?? ''))) errors.push(`${label}.source_id invalid`);
    if (!ID_PATTERN.test(String(route?.adapter_id ?? ''))) errors.push(`${label}.adapter_id invalid`);
    if (typeof route?.entry_point !== 'string' || !route.entry_point.startsWith('scripts/')) errors.push(`${label}.entry_point invalid`);
    if (!unique(route?.supported_collection_modes) || route.supported_collection_modes.length === 0
      || route.supported_collection_modes.some((mode) => !COLLECTION_MODES.includes(mode))) errors.push(`${label}.supported_collection_modes invalid`);
    if (!unique(route?.evidence_backed_observation_ranks)
      || route.evidence_backed_observation_ranks.some((rank) => !RANKS.includes(rank))) errors.push(`${label}.evidence_backed_observation_ranks invalid`);
    if (typeof route?.automatic_planning_allowed !== 'boolean') errors.push(`${label}.automatic_planning_allowed invalid`);
    if (route?.automatic_execution_allowed !== false) errors.push(`${label}.automatic_execution_allowed must remain false`);
    if (route?.human_review_required !== true) errors.push(`${label}.human_review_required must be true`);
    if (route?.registry_activation !== false) errors.push(`${label}.registry_activation must remain false`);
    if (typeof route?.evidence_ref !== 'string' || route.evidence_ref.length === 0) errors.push(`${label}.evidence_ref invalid`);
    if (route?.selection_mode === 'operator_only' && route?.automatic_planning_allowed !== false) errors.push(`${label} operator-only route cannot allow automatic planning`);

    const profile = profileFor(registry, route?.system_id);
    if (!profile) errors.push(`${label} Registry profile missing`);
    else if (route.route_kind === 'schedule') {
      if (route.primary_runner !== profile.primary_runner) errors.push(`${label} schedule primary runner must match system-level Registry primary runner`);
      if (route.source_id !== profile.schedule_source_id || route.adapter_id !== profile.schedule_adapter_id) errors.push(`${label} schedule source/adapter must match Registry schedule route`);
    } else if (route.route_kind === 'detail' && route.selection_mode === 'operator_only') {
      if (profile.detail_source_id !== null || profile.detail_adapter_id !== null) errors.push(`${label} operator-only detail supplement requires unactivated Registry detail route`);
      if (profile.fallback_runner !== null) errors.push(`${label} operator-only detail supplement requires system fallback to remain unclaimed`);
    }

    if (compatibilityContract && route.selection_mode === 'collection_job') {
      const executor = compatibilityContract.executors?.find((entry) => entry.system_id === route.system_id && entry.runner === route.primary_runner);
      if (!executor) errors.push(`${label} collection_job route requires runner compatibility executor`);
      else {
        if (executor.entry_point !== route.entry_point) errors.push(`${label} entry_point differs from runner compatibility executor`);
        for (const mode of route.supported_collection_modes) {
          if (!executor.supported_collection_modes?.includes(mode)) errors.push(`${label} collection mode ${mode} missing from executor compatibility`);
        }
      }
    }
  }
  return errors;
}

export function routePolicyForV1(policy, systemId, routeKind) {
  if (!ROUTE_KINDS.includes(routeKind)) throw new Error(`unsupported route kind ${routeKind}`);
  const route = policy?.routes?.find((entry) => entry.system_id === systemId && entry.route_kind === routeKind) ?? null;
  if (!route) throw new Error(`route policy missing for ${systemId}/${routeKind}`);
  return route;
}

export function resolveRouteRunnerPolicyV1(policy, {
  system_id: systemId,
  route_kind: routeKind,
  selection_context: selectionContext,
  collection_mode: collectionMode,
  requested_runner: requestedRunner = null,
}) {
  if (!SELECTION_CONTEXTS.includes(selectionContext)) throw new Error(`unsupported selection context ${selectionContext}`);
  const route = routePolicyForV1(policy, systemId, routeKind);
  if (!route.supported_collection_modes.includes(collectionMode)) throw new Error(`${systemId}/${routeKind} does not support ${collectionMode}`);
  if (route.selection_mode === 'operator_only' && selectionContext !== 'operator_reviewed_import' && selectionContext !== 'operations_view') {
    throw new Error(`${systemId}/${routeKind} is operator-only and cannot be selected by ${selectionContext}`);
  }
  if (selectionContext === 'due_job_planner' && route.automatic_planning_allowed !== true) {
    throw new Error(`${systemId}/${routeKind} does not allow due-job planning`);
  }
  if (selectionContext === 'operator_reviewed_import' && route.selection_mode !== 'operator_only') {
    throw new Error(`${systemId}/${routeKind} is not an operator-only reviewed-import route`);
  }
  const allowed = [route.primary_runner, route.fallback_runner].filter(Boolean);
  const runner = requestedRunner ?? route.primary_runner;
  if (!allowed.includes(runner)) throw new Error(`runner ${runner} is not allowed for ${systemId}/${routeKind}`);
  return Object.freeze({
    system_id: systemId,
    route_kind: routeKind,
    selection_context: selectionContext,
    selection_mode: route.selection_mode,
    runner,
    source_id: route.source_id,
    adapter_id: route.adapter_id,
    entry_point: route.entry_point,
    human_review_required: route.human_review_required,
    automatic_execution_allowed: route.automatic_execution_allowed,
    registry_activation: route.registry_activation,
  });
}

export function buildRouteRunnerPolicyStatusV1(policy, registry) {
  const systems = [...new Set(policy.routes.map((route) => route.system_id))].sort().map((systemId) => {
    const profile = profileFor(registry, systemId);
    const routes = policy.routes
      .filter((route) => route.system_id === systemId)
      .sort((left, right) => left.route_kind.localeCompare(right.route_kind))
      .map((route) => ({
        route_kind: route.route_kind,
        status: route.status,
        selection_mode: route.selection_mode,
        primary_runner: route.primary_runner,
        fallback_runner: route.fallback_runner,
        automatic_planning_allowed: route.automatic_planning_allowed,
        automatic_execution_allowed: route.automatic_execution_allowed,
        evidence_backed_observation_ranks: structuredClone(route.evidence_backed_observation_ranks),
      }));
    return {
      system_id: systemId,
      registry_primary_runner: profile?.primary_runner ?? null,
      registry_fallback_runner: profile?.fallback_runner ?? null,
      registry_fallback_pending: profile?.pending_fields?.includes('fallback_runner') ?? false,
      routes,
    };
  });
  return Object.freeze({
    schema_version: 'calendar-route-runner-policy-status-v1',
    policy_version: policy.policy_version,
    systems,
    side_effect_boundary: structuredClone(policy.side_effect_boundary),
  });
}

export const routeRunnerPolicyV1Contract = Object.freeze({
  route_kinds: ROUTE_KINDS,
  selection_contexts: SELECTION_CONTEXTS,
  runners: RUNNERS,
  ranks: RANKS,
  collection_modes: COLLECTION_MODES,
});
