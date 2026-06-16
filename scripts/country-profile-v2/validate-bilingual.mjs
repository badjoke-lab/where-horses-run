const text = (value) => typeof value === 'string' && value.trim().length > 0;
const textList = (value) => Array.isArray(value) && value.length > 0 && value.every(text);

const pair = (value, enKey, jaKey, label, errors) => {
  if (!text(value?.[enKey])) errors.push(`${label}.${enKey} is required`);
  if (!text(value?.[jaKey])) errors.push(`${label}.${jaKey} is required`);
};

const namedEntries = (items, label, errors) => {
  if (!Array.isArray(items)) return errors.push(`${label} must be an array`);
  items.forEach((item, index) => {
    pair(item, 'name_en', 'name_ja', `${label}[${index}]`, errors);
    pair(item, 'summary_en', 'summary_ja', `${label}[${index}]`, errors);
  });
};

export const validateBilingual = (profile) => {
  const errors = [];
  pair(profile.hero, 'summary_en', 'summary_ja', 'hero', errors);
  if (!textList(profile.overview?.paragraphs_en)) errors.push('overview.paragraphs_en is required');
  if (!textList(profile.overview?.paragraphs_ja)) errors.push('overview.paragraphs_ja is required');
  namedEntries(profile.racing_types, 'racing_types', errors);
  pair(profile.seasonality, 'summary_en', 'summary_ja', 'seasonality', errors);
  pair(profile.schedule, 'summary_en', 'summary_ja', 'schedule', errors);
  pair(profile.surfaces, 'summary_en', 'summary_ja', 'surfaces', errors);
  namedEntries(profile.systems, 'systems', errors);
  if (!text(profile.calendar_guidance_en)) errors.push('calendar_guidance_en is required');
  if (!text(profile.calendar_guidance_ja)) errors.push('calendar_guidance_ja is required');
  if (!text(profile.coverage_note_en)) errors.push('coverage_note_en is required');
  if (!text(profile.coverage_note_ja)) errors.push('coverage_note_ja is required');
  if (!textList(profile.revalidation?.triggers_en)) errors.push('revalidation.triggers_en is required');
  if (!textList(profile.revalidation?.triggers_ja)) errors.push('revalidation.triggers_ja is required');
  return errors;
};
