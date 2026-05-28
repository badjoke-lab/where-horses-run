const allowedMethods = new Set(['GET']);
const allowedModes = new Set(['dry_run', 'manual', 'disabled']);

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function safeString(value, fallback = '') {
  return isNonEmptyString(value) ? value.trim() : fallback;
}

function validateHttpUrl(value) {
  if (!isNonEmptyString(value)) return false;

  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

export function createSourceFetchPlan(source, options = {}) {
  const mode = safeString(options.mode, 'dry_run');
  const requestedAt = safeString(options.requestedAt, new Date(0).toISOString());

  return {
    source_id: safeString(source?.id, 'unknown-source'),
    country_id: safeString(source?.country_id, 'unknown-country'),
    source_type: safeString(source?.source_type, 'unknown'),
    data_type: safeString(source?.data_type, 'unknown'),
    auto_level: safeString(source?.auto_level, 'unknown'),
    terms_risk: safeString(source?.terms_risk, 'unknown'),
    url: safeString(source?.url),
    method: 'GET',
    mode,
    requested_at: requestedAt,
    live_network_enabled: false
  };
}

export function validateSourceFetchPlan(plan) {
  const errors = [];
  const warnings = [];

  for (const key of ['source_id', 'country_id', 'source_type', 'data_type', 'auto_level', 'terms_risk', 'url', 'method', 'mode', 'requested_at']) {
    if (!isNonEmptyString(plan?.[key])) errors.push(`${key}: expected non-empty string`);
  }

  if (plan?.method && !allowedMethods.has(plan.method)) errors.push(`method: unsupported method '${plan.method}'`);
  if (plan?.mode && !allowedModes.has(plan.mode)) errors.push(`mode: unsupported mode '${plan.mode}'`);
  if (plan?.url && !validateHttpUrl(plan.url)) errors.push('url: expected valid http or https URL');
  if (plan?.live_network_enabled !== false) errors.push('live_network_enabled: must be false in this abstraction phase');

  if (plan?.terms_risk === 'high') warnings.push('High terms_risk source should remain link-first unless reviewed.');
  if (plan?.auto_level === 'manual' || plan?.auto_level === 'none') warnings.push('Source is not intended for automatic fetching.');

  return { errors, warnings };
}

export function createSkippedFetchResult(plan, reason = 'Live fetching is not enabled.') {
  const checkedAt = safeString(plan?.requested_at, new Date(0).toISOString());

  return {
    source_id: safeString(plan?.source_id, 'unknown-source'),
    country_id: safeString(plan?.country_id, 'unknown-country'),
    status: 'skipped',
    checked_at: checkedAt,
    source_url: safeString(plan?.url),
    raw_content_ref: null,
    message: reason,
    warnings: [],
    errors: []
  };
}

export function createSourceFetchPlans(sources, options = {}) {
  if (!Array.isArray(sources)) return [];
  return sources.map((source) => createSourceFetchPlan(source, options));
}
