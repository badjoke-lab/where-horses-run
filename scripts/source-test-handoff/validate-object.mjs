import { CEILINGS, DECISIONS, FIELD_NAMES, METHODS, RANKS, SOURCE_TYPES } from './rules.mjs';

export const validateHandoff = (data) => {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) return ['handoff must be an object'];
  if (data.schema_version !== '1.0.0') errors.push('schema_version must be 1.0.0');
  if (!DECISIONS.has(data.decision?.status)) errors.push('decision.status is invalid');
  if (!RANKS.has(data.decision?.technical_rank)) errors.push('decision.technical_rank is invalid');
  if (!RANKS.has(data.decision?.fallback_rank)) errors.push('decision.fallback_rank is invalid');
  if (!CEILINGS.has(data.decision?.public_display_ceiling)) errors.push('decision.public_display_ceiling is invalid');
  if (!METHODS.has(data.capture?.method)) errors.push('capture.method is invalid');
  if (!SOURCE_TYPES.has(data.source?.source_type)) errors.push('source.source_type is invalid');
  for (const list of [data.decision?.confirmed_fields, data.decision?.unconfirmed_fields]) {
    if (!Array.isArray(list)) errors.push('decision field list must be an array');
    else for (const item of list) if (!FIELD_NAMES.has(item)) errors.push(`unsupported decision field: ${item}`);
  }
  return errors;
};
