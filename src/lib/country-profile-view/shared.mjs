export const toArray = (value) => Array.isArray(value) ? value : [];
export const toText = (value, fallback = '') =>
  typeof value === 'string' && value.trim() ? value : fallback;

export const normalizeSystemSources = (system, organiserIds, distributorIds) => ({
  id: system.id,
  name_en: system.name_en,
  name_ja: system.name_ja,
  summary_en: system.summary_en,
  summary_ja: system.summary_ja,
  organiser_source_ids: organiserIds,
  distributor_source_ids: distributorIds,
  source_ids: [...new Set([...organiserIds, ...distributorIds])]
});
