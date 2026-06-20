import {
  ACTIVE_PAGE_KINDS,
  DISPLAY_CEILINGS,
  ID_PATTERN,
  PAGE_KINDS,
  PROFILE_STATUSES,
  PROFILE_VERSION,
  SOURCE_TEST_STATUSES
} from './rules.mjs';

const requiredKeys = [
  'schema_version', 'country_id', 'slug', 'status', 'page_kind',
  'last_reviewed', 'public_display_ceiling', 'source_test_status',
  'hero', 'overview', 'racing_types', 'seasonality', 'schedule',
  'surfaces', 'systems', 'principal_racecourse_ids',
  'calendar_guidance_en', 'calendar_guidance_ja',
  'coverage_note_en', 'coverage_note_ja', 'revalidation',
  'related_glossary_ids'
];

const idList = (value, label, errors, allowEmpty = true) => {
  if (!Array.isArray(value)) return errors.push(`${label} must be an array`);
  if (!allowEmpty && value.length === 0) errors.push(`${label} must not be empty`);
  if (new Set(value).size !== value.length) errors.push(`${label} contains duplicates`);
  value.forEach((item) => {
    if (typeof item !== 'string' || !ID_PATTERN.test(item)) errors.push(`${label} contains invalid id: ${item}`);
  });
};

const namedIds = (items, label, errors) => {
  if (!Array.isArray(items)) return errors.push(`${label} must be an array`);
  const ids = [];
  items.forEach((item, index) => {
    if (!ID_PATTERN.test(item?.id ?? '')) errors.push(`${label}[${index}].id is invalid`);
    else ids.push(item.id);
  });
  if (new Set(ids).size !== ids.length) errors.push(`${label} contains duplicate ids`);
};

const projectDate = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

export const validateStructure = (profile, today = projectDate()) => {
  const errors = [];
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return ['profile must be an object'];
  requiredKeys.forEach((key) => {
    if (!(key in profile)) errors.push(`missing ${key}`);
  });

  if (profile.schema_version !== PROFILE_VERSION) errors.push(`schema_version must be ${PROFILE_VERSION}`);
  if (!ID_PATTERN.test(profile.country_id ?? '')) errors.push('country_id is invalid');
  if (!ID_PATTERN.test(profile.slug ?? '')) errors.push('slug is invalid');
  if (profile.country_id !== profile.slug) errors.push('country_id and slug must match');
  if (!PROFILE_STATUSES.has(profile.status)) errors.push('status is invalid');
  if (!PAGE_KINDS.has(profile.page_kind)) errors.push('page_kind is invalid');
  if (!DISPLAY_CEILINGS.has(profile.public_display_ceiling)) errors.push('public_display_ceiling is invalid');
  if (!SOURCE_TEST_STATUSES.has(profile.source_test_status)) errors.push('source_test_status is invalid');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.last_reviewed ?? '')) errors.push('last_reviewed is invalid');
  else if (profile.last_reviewed > today) errors.push('last_reviewed must not be in the future');

  namedIds(profile.racing_types, 'racing_types', errors);
  namedIds(profile.systems, 'systems', errors);
  idList(profile.schedule?.day_patterns, 'schedule.day_patterns', errors);
  idList(profile.schedule?.time_patterns, 'schedule.time_patterns', errors);
  idList(profile.surfaces?.ids, 'surfaces.ids', errors);
  idList(profile.principal_racecourse_ids, 'principal_racecourse_ids', errors);
  idList(profile.related_glossary_ids, 'related_glossary_ids', errors);

  if (ACTIVE_PAGE_KINDS.has(profile.page_kind)) {
    if (!profile.racing_types?.length) errors.push('active page requires racing_types');
    if (!profile.systems?.length) errors.push('active page requires systems');
  }

  (profile.systems ?? []).forEach((system, index) => {
    idList(system.organiser_source_ids, `systems[${index}].organiser_source_ids`, errors);
    idList(system.distributor_source_ids, `systems[${index}].distributor_source_ids`, errors);
    const organiserCount = system.organiser_source_ids?.length ?? 0;
    const distributorCount = system.distributor_source_ids?.length ?? 0;
    if (organiserCount + distributorCount === 0) {
      errors.push(`systems[${index}] requires at least one organiser or distributor source id`);
    }
    const organisers = new Set(system.organiser_source_ids ?? []);
    (system.distributor_source_ids ?? []).forEach((id) => {
      if (organisers.has(id)) errors.push(`systems[${index}] source id has both organiser and distributor roles: ${id}`);
    });
  });

  if (profile.source_test_status === 'pending' && profile.public_display_ceiling !== 'pending') {
    errors.push('pending source test requires pending public_display_ceiling');
  }
  return errors;
};
