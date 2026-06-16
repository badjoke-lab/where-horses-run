const exact = (value, keys, label, errors) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    errors.push(`${label} must be an object`);
    return;
  }
  Object.keys(value).forEach((key) => {
    if (!keys.includes(key)) errors.push(`${label} contains unexpected key: ${key}`);
  });
  keys.forEach((key) => {
    if (!(key in value)) errors.push(`${label} is missing key: ${key}`);
  });
};

export const validateShape = (profile) => {
  const errors = [];
  exact(profile, [
    'schema_version', 'country_id', 'slug', 'status', 'page_kind',
    'last_reviewed', 'public_display_ceiling', 'source_test_status',
    'hero', 'overview', 'racing_types', 'seasonality', 'schedule',
    'surfaces', 'systems', 'principal_racecourse_ids',
    'calendar_guidance_en', 'calendar_guidance_ja',
    'coverage_note_en', 'coverage_note_ja', 'revalidation',
    'related_glossary_ids'
  ], 'profile', errors);
  exact(profile.hero, ['summary_en', 'summary_ja'], 'hero', errors);
  exact(profile.overview, ['paragraphs_en', 'paragraphs_ja'], 'overview', errors);
  exact(profile.seasonality, ['pattern', 'summary_en', 'summary_ja'], 'seasonality', errors);
  exact(profile.schedule, ['timezone', 'utc_offset_label', 'day_patterns', 'time_patterns', 'summary_en', 'summary_ja'], 'schedule', errors);
  exact(profile.surfaces, ['ids', 'summary_en', 'summary_ja'], 'surfaces', errors);
  exact(profile.revalidation, ['triggers_en', 'triggers_ja'], 'revalidation', errors);
  (profile.racing_types ?? []).forEach((item, index) => {
    exact(item, ['id', 'name_en', 'name_ja', 'summary_en', 'summary_ja'], `racing_types[${index}]`, errors);
  });
  (profile.systems ?? []).forEach((item, index) => {
    exact(item, ['id', 'name_en', 'name_ja', 'summary_en', 'summary_ja', 'organiser_source_ids', 'distributor_source_ids'], `systems[${index}]`, errors);
  });
  return errors;
};
