import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

const requiredFiles = [
  'data/static/countries.json',
  'data/static/racecourses.json',
  'data/static/sources.json',
  'data/static/glossary.json',
  'data/static/archive.json',
  'data/static/i18n/en.json',
  'data/static/i18n/ja.json',
  'data/generated/latest.json',
  'data/generated/today.json',
  'data/generated/tomorrow.json',
  'data/generated/calendar-30d.json',
  'data/generated/fetch-status.json'
];

const generatedStatusValues = new Set(['placeholder', 'ok', 'partial', 'stale', 'failed', 'unknown']);
const sourceStatusValues = new Set(['not_started', 'ok', 'partial', 'stale', 'failed', 'skipped', 'unknown']);
const meetingStatusValues = new Set(['placeholder', 'ok', 'partial', 'empty', 'stale', 'failed', 'skipped', 'unknown']);
const racecourseStatusValues = new Set(['active', 'seasonal', 'closed', 'unknown', 'under_review']);
const racecourseSurfaceValues = new Set([
  'turf',
  'dirt',
  'all-weather',
  'sand',
  'harness-track',
  'jump-course',
  'banei-straight-track'
]);
const racecourseDirectionValues = new Set(['left-handed', 'right-handed', 'straight', 'unknown']);
const racecourseRacingTypeValues = new Set([
  'thoroughbred-flat',
  'jump-racing',
  'harness-racing',
  'trotting',
  'pacing',
  'arabian-racing',
  'quarter-horse-racing',
  'banei-racing'
]);
const racecourseScheduleTodayStatusValues = new Set(['racing_today', 'no_racing_today', 'unknown']);
const racecourseScheduleStatusValues = new Set(['verified', 'partial', 'placeholder', 'stale', 'failed', 'manual', 'official-link-only', 'unknown']);
const racecoursePageDataStatusValues = new Set(['verified', 'partial', 'placeholder', 'stale', 'failed', 'manual', 'official-link-only', 'unknown']);
const racecourseSourceRoutingStatusValues = new Set(['link_first', 'verified', 'partial', 'placeholder', 'stale', 'failed', 'manual', 'unknown']);
const racecourseImageStatusValues = new Set(['planned', 'pending', 'available', 'placeholder', 'none']);
const racecourseCourseDiagramStatusValues = new Set(['pending', 'planned', 'available', 'none']);
const racecourseSeasonalityStatusValues = new Set(['verified', 'partial', 'placeholder', 'unknown']);
const racecourseOfficialLinkTypeValues = new Set(['official', 'schedule', 'racecard', 'visitor', 'source']);

function fail(message) {
  errors.push(message);
}

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!existsSync(fullPath)) {
    fail(`${relativePath}: missing file`);
    return null;
  }

  try {
    return JSON.parse(readFileSync(fullPath, 'utf8'));
  } catch (error) {
    fail(`${relativePath}: invalid JSON: ${error.message}`);
    return null;
  }
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`${label}: expected non-empty string`);
    return false;
  }
  return true;
}

function requireNullableString(value, label) {
  if (value === null) return true;
  return requireString(value, label);
}

function requireArray(value, label) {
  if (!Array.isArray(value)) {
    fail(`${label}: expected array`);
    return false;
  }
  return true;
}

function requireObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${label}: expected object`);
    return false;
  }
  return true;
}

function requireAllowed(value, allowed, label) {
  if (!requireString(value, label)) return;
  if (!allowed.has(value)) {
    fail(`${label}: unexpected value '${value}'`);
  }
}

function requireNullableNumber(value, label) {
  if (value === null) return true;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    fail(`${label}: expected number or null`);
  }
}

function requireNullableBoolean(value, label) {
  if (value === null) return true;
  if (typeof value !== 'boolean') {
    fail(`${label}: expected boolean or null`);
  }
}

function validateStringArrayValues(value, allowed, label) {
  if (!requireArray(value, label)) return;
  for (const item of value) {
    if (!requireString(item, `${label}:entry`)) continue;
    if (!allowed.has(item)) fail(`${label}: unexpected value '${item}'`);
  }
}

function validateIdRefs(value, knownIds, label) {
  if (!requireArray(value, label)) return;
  for (const item of value) {
    if (!requireString(item, `${label}:entry`)) continue;
    if (!knownIds.has(item)) fail(`${label}: unknown id '${item}'`);
  }
}

function requireIsoDate(value, label) {
  if (!requireString(value, label)) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(`${label}: expected YYYY-MM-DD`);
    return;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    fail(`${label}: invalid calendar date`);
  }
}

function requireNullableIsoDate(value, label) {
  if (value === null) return true;
  requireIsoDate(value, label);
}

function requireIsoDateTime(value, label) {
  if (!requireString(value, label)) return;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    fail(`${label}: expected valid date-time`);
  }
}

function requireUrl(value, label) {
  if (!requireString(value, label)) return;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) fail(`${label}: expected http or https`);
  } catch {
    fail(`${label}: invalid URL`);
  }
}

function requireUniqueIds(rows, label) {
  if (!requireArray(rows, label)) return new Set();
  const ids = new Set();
  for (const row of rows) {
    if (!requireObject(row, `${label}:entry`)) continue;
    requireString(row.id, `${label}:${row.id || 'unknown'}.id`);
    if (ids.has(row.id)) fail(`${label}: duplicate id '${row.id}'`);
    ids.add(row.id);
  }
  return ids;
}

function validateCountries(rows) {
  const ids = requireUniqueIds(rows, 'countries');
  for (const row of rows || []) {
    if (!row || typeof row !== 'object') continue;
    const label = `countries:${row.id || 'unknown'}`;
    for (const key of ['slug', 'name_en', 'name_ja', 'region', 'status', 'summary_en', 'summary_ja']) {
      requireString(row[key], `${label}.${key}`);
    }
    requireArray(row.racing_types, `${label}.racing_types`);
    requireArray(row.available_locales, `${label}.available_locales`);
    if (!Number.isInteger(row.coverage_level)) fail(`${label}.coverage_level: expected integer`);
    requireString(row.auto_level, `${label}.auto_level`);
  }
  return ids;
}

function validateCourseProfile(value, label) {
  if (!requireObject(value, label)) return;
  for (const key of ['turf_circumference_m', 'dirt_circumference_m', 'home_straight_m']) {
    requireNullableNumber(value[key], `${label}.${key}`);
  }
  for (const key of ['has_inner_outer_courses', 'has_lighting']) {
    requireNullableBoolean(value[key], `${label}.${key}`);
  }
  for (const key of ['elevation_notes_en', 'elevation_notes_ja', 'course_notes_en', 'course_notes_ja']) {
    requireNullableString(value[key], `${label}.${key}`);
  }
}

function validateDistanceBand(value, label) {
  if (!requireObject(value, label)) return;
  requireNullableNumber(value.min_m, `${label}.min_m`);
  requireNullableNumber(value.max_m, `${label}.max_m`);
  if (
    typeof value.min_m === 'number' &&
    typeof value.max_m === 'number' &&
    value.min_m > value.max_m
  ) {
    fail(`${label}: min_m must be before or equal to max_m`);
  }
  if (!requireArray(value.known_distances_m, `${label}.known_distances_m`)) return;
  for (const distance of value.known_distances_m) {
    if (typeof distance !== 'number' || !Number.isFinite(distance)) {
      fail(`${label}.known_distances_m: expected numeric distance entries`);
    }
  }
}

function validateDistanceProfile(value, label) {
  if (!requireObject(value, label)) return;
  for (const key of ['turf', 'dirt', 'all_weather', 'jump', 'harness']) {
    validateDistanceBand(value[key], `${label}.${key}`);
  }
  requireArray(value.upcoming_conditions, `${label}.upcoming_conditions`);
}

function validateRacecourseScheduleSummary(value, label) {
  if (!requireObject(value, label)) return;
  requireAllowed(value.today_status, racecourseScheduleTodayStatusValues, `${label}.today_status`);
  requireNullableIsoDate(value.next_meeting_date, `${label}.next_meeting_date`);
  requireArray(value.upcoming_meetings, `${label}.upcoming_meetings`);
  requireAllowed(value.status, racecourseScheduleStatusValues, `${label}.status`);
  requireNullableIsoDate(value.last_checked, `${label}.last_checked`);
}

function validateRacecourseSeasonality(value, label) {
  if (!requireObject(value, label)) return;
  requireString(value.summary_en, `${label}.summary_en`);
  requireString(value.summary_ja, `${label}.summary_ja`);
  requireAllowed(value.status, racecourseSeasonalityStatusValues, `${label}.status`);
}

function validateRacecourseOfficialLinks(value, label, sourceIds) {
  if (!requireArray(value, label)) return;
  for (const row of value) {
    const rowLabel = `${label}:${row && row.source_id ? row.source_id : 'unknown'}`;
    if (!requireObject(row, rowLabel)) continue;
    requireString(row.label_en, `${rowLabel}.label_en`);
    requireString(row.label_ja, `${rowLabel}.label_ja`);
    requireString(row.source_id, `${rowLabel}.source_id`);
    if (row.source_id && !sourceIds.has(row.source_id)) fail(`${rowLabel}.source_id: unknown source '${row.source_id}'`);
    requireUrl(row.url, `${rowLabel}.url`);
    requireAllowed(row.link_type, racecourseOfficialLinkTypeValues, `${rowLabel}.link_type`);
  }
}

function validateRacecourseDataStatus(value, label) {
  if (!requireObject(value, label)) return;
  requireAllowed(value.course_profile, racecoursePageDataStatusValues, `${label}.course_profile`);
  requireAllowed(value.schedule, racecoursePageDataStatusValues, `${label}.schedule`);
  requireAllowed(value.source_status, racecourseSourceRoutingStatusValues, `${label}.source_status`);
  requireNullableIsoDate(value.last_checked, `${label}.last_checked`);
}

function validateRacecourses(rows, refs) {
  const ids = requireUniqueIds(rows, 'racecourses');
  for (const row of rows || []) {
    if (!row || typeof row !== 'object') continue;
    const label = `racecourses:${row.id || 'unknown'}`;
    for (const key of ['slug', 'country_id', 'name_en', 'name_ja', 'city', 'region', 'timezone', 'status']) {
      requireString(row[key], `${label}.${key}`);
    }
    requireAllowed(row.status, racecourseStatusValues, `${label}.status`);
    if (row.country_id && !refs.countryIds.has(row.country_id)) {
      fail(`${label}.country_id: unknown country '${row.country_id}'`);
    }
    validateStringArrayValues(row.racing_types, racecourseRacingTypeValues, `${label}.racing_types`);
    validateStringArrayValues(row.surfaces, racecourseSurfaceValues, `${label}.surfaces`);
    requireAllowed(row.direction, racecourseDirectionValues, `${label}.direction`);
    validateCourseProfile(row.course_profile, `${label}.course_profile`);
    validateDistanceProfile(row.distance_profile, `${label}.distance_profile`);
    validateRacecourseScheduleSummary(row.schedule_summary, `${label}.schedule_summary`);
    requireArray(row.notable_races, `${label}.notable_races`);
    validateRacecourseSeasonality(row.seasonality, `${label}.seasonality`);
    validateRacecourseOfficialLinks(row.official_links, `${label}.official_links`, refs.sourceIds);
    validateIdRefs(row.related_terms, refs.glossaryIds, `${label}.related_terms`);
    validateIdRefs(row.related_sources, refs.sourceIds, `${label}.related_sources`);
    validateRacecourseDataStatus(row.data_status, `${label}.data_status`);
    requireAllowed(row.image_status, racecourseImageStatusValues, `${label}.image_status`);
    requireNullableString(row.image_path, `${label}.image_path`);
    requireString(row.image_alt_en, `${label}.image_alt_en`);
    requireString(row.image_alt_ja, `${label}.image_alt_ja`);
    requireAllowed(row.course_diagram_status, racecourseCourseDiagramStatusValues, `${label}.course_diagram_status`);
    if (row.image) {
      requireObject(row.image, `${label}.image`);
      requireString(row.image.alt_en, `${label}.image.alt_en`);
      requireString(row.image.alt_ja, `${label}.image.alt_ja`);
      requireString(row.image.status, `${label}.image.status`);
      if (typeof row.image.is_official_photo !== 'boolean') {
        fail(`${label}.image.is_official_photo: expected boolean`);
      }
    }
  }
  return ids;
}

function validateSources(rows, countryIds) {
  const ids = requireUniqueIds(rows, 'sources');
  for (const row of rows || []) {
    if (!row || typeof row !== 'object') continue;
    const label = `sources:${row.id || 'unknown'}`;
    for (const key of ['country_id', 'source_type', 'url', 'data_type', 'auto_level', 'terms_risk']) {
      requireString(row[key], `${label}.${key}`);
    }
    if (row.country_id && !countryIds.has(row.country_id)) {
      fail(`${label}.country_id: unknown country '${row.country_id}'`);
    }
    requireUrl(row.url, `${label}.url`);
  }
  return ids;
}

function validateGlossary(rows) {
  const ids = requireUniqueIds(rows, 'glossary');
  for (const row of rows || []) {
    if (!row || typeof row !== 'object') continue;
    const label = `glossary:${row.id || 'unknown'}`;
    for (const key of ['slug', 'term_en', 'term_ja', 'category', 'summary_en', 'summary_ja']) {
      requireString(row[key], `${label}.${key}`);
    }
  }
  return ids;
}

function validateArchive(rows) {
  requireUniqueIds(rows, 'archive');
  for (const row of rows || []) {
    if (!row || typeof row !== 'object') continue;
    const label = `archive:${row.id || 'unknown'}`;
    for (const key of ['slug', 'name_en', 'name_ja', 'status', 'summary_en', 'summary_ja']) {
      requireString(row[key], `${label}.${key}`);
    }
  }
}

function validateMeeting(row, label, refs) {
  if (!requireObject(row, label)) return;
  for (const key of ['meeting_id', 'country_id', 'track_id', 'track_name', 'local_date', 'timezone', 'source_id', 'source_url', 'status']) {
    requireString(row[key], `${label}.${key}`);
  }
  requireIsoDate(row.local_date, `${label}.local_date`);
  requireUrl(row.source_url, `${label}.source_url`);
  requireAllowed(row.status, meetingStatusValues, `${label}.status`);

  if (row.country_id && !refs.countryIds.has(row.country_id)) {
    fail(`${label}.country_id: unknown country '${row.country_id}'`);
  }
  if (row.track_id && !refs.racecourseIds.has(row.track_id)) {
    fail(`${label}.track_id: unknown racecourse '${row.track_id}'`);
  }
  if (row.source_id && !refs.sourceIds.has(row.source_id)) {
    fail(`${label}.source_id: unknown source '${row.source_id}'`);
  }
}

function validateMeetingArray(value, label, refs) {
  if (!requireArray(value, label)) return;
  const ids = new Set();
  for (const row of value) {
    const itemLabel = `${label}:${row && row.meeting_id ? row.meeting_id : 'unknown'}`;
    validateMeeting(row, itemLabel, refs);
    if (row && typeof row === 'object' && row.meeting_id) {
      if (ids.has(row.meeting_id)) fail(`${label}: duplicate meeting_id '${row.meeting_id}'`);
      ids.add(row.meeting_id);
    }
  }
}

function validateGeneratedSourcesList(value, label, sourceIds) {
  if (!requireArray(value, label)) return;
  for (const sourceId of value) {
    if (!requireString(sourceId, `${label}:entry`)) continue;
    if (!sourceIds.has(sourceId)) fail(`${label}: unknown source '${sourceId}'`);
  }
}

function validateGeneratedLatest(value, label) {
  if (!requireObject(value, label)) return;
  requireIsoDateTime(value.generated_at, `${label}.generated_at`);
  requireString(value.timezone, `${label}.timezone`);
  requireAllowed(value.status, generatedStatusValues, `${label}.status`);
  requireArray(value.notes, `${label}.notes`);

  for (const key of ['today_file', 'tomorrow_file', 'calendar_30d_file', 'fetch_status_file']) {
    requireString(value[key], `${label}.${key}`);
    if (typeof value[key] === 'string' && !existsSync(path.join(root, value[key]))) {
      fail(`${label}.${key}: referenced file does not exist`);
    }
  }
}

function validateGeneratedDaily(value, label, refs) {
  if (!requireObject(value, label)) return;
  requireIsoDateTime(value.generated_at, `${label}.generated_at`);
  requireString(value.date_basis, `${label}.date_basis`);
  validateMeetingArray(value.meetings, `${label}.meetings`, refs);
  validateGeneratedSourcesList(value.sources, `${label}.sources`, refs.sourceIds);
  requireArray(value.notes, `${label}.notes`);
}

function validateGeneratedCalendar30d(value, label, refs) {
  if (!requireObject(value, label)) return;
  requireIsoDateTime(value.generated_at, `${label}.generated_at`);
  requireIsoDate(value.start_date_utc, `${label}.start_date_utc`);
  requireIsoDate(value.end_date_utc, `${label}.end_date_utc`);
  if (
    typeof value.start_date_utc === 'string' &&
    typeof value.end_date_utc === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.start_date_utc) &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.end_date_utc) &&
    value.start_date_utc > value.end_date_utc
  ) {
    fail(`${label}: start_date_utc must be before or equal to end_date_utc`);
  }
  requireString(value.date_basis, `${label}.date_basis`);
  validateMeetingArray(value.meetings, `${label}.meetings`, refs);
  validateGeneratedSourcesList(value.sources, `${label}.sources`, refs.sourceIds);
  requireArray(value.notes, `${label}.notes`);
}

function validateFetchStatus(value, label, refs) {
  if (!requireObject(value, label)) return;
  requireIsoDateTime(value.generated_at, `${label}.generated_at`);
  requireAllowed(value.status, generatedStatusValues, `${label}.status`);
  requireArray(value.notes, `${label}.notes`);
  if (!requireArray(value.sources, `${label}.sources`)) return;

  for (const row of value.sources) {
    const rowLabel = `${label}.sources:${row && row.source_id ? row.source_id : 'unknown'}`;
    if (!requireObject(row, rowLabel)) continue;
    for (const key of ['source_id', 'country_id', 'status', 'checked_at', 'message']) {
      requireString(row[key], `${rowLabel}.${key}`);
    }
    requireAllowed(row.status, sourceStatusValues, `${rowLabel}.status`);
    requireIsoDateTime(row.checked_at, `${rowLabel}.checked_at`);
    if (row.source_id && !refs.sourceIds.has(row.source_id)) {
      fail(`${rowLabel}.source_id: unknown source '${row.source_id}'`);
    }
    if (row.country_id && !refs.countryIds.has(row.country_id)) {
      fail(`${rowLabel}.country_id: unknown country '${row.country_id}'`);
    }
  }
}

const data = Object.fromEntries(requiredFiles.map((file) => [file, readJson(file)]));

const countryIds = validateCountries(data['data/static/countries.json']);
const sourceIds = validateSources(data['data/static/sources.json'], countryIds);
const glossaryIds = validateGlossary(data['data/static/glossary.json']);
const racecourseIds = validateRacecourses(data['data/static/racecourses.json'], { countryIds, sourceIds, glossaryIds });
validateArchive(data['data/static/archive.json']);
requireObject(data['data/static/i18n/en.json'], 'i18n/en');
requireObject(data['data/static/i18n/ja.json'], 'i18n/ja');

const refs = { countryIds, racecourseIds, sourceIds };

validateGeneratedLatest(data['data/generated/latest.json'], 'data/generated/latest.json');
validateGeneratedDaily(data['data/generated/today.json'], 'data/generated/today.json', refs);
validateGeneratedDaily(data['data/generated/tomorrow.json'], 'data/generated/tomorrow.json', refs);
validateGeneratedCalendar30d(data['data/generated/calendar-30d.json'], 'data/generated/calendar-30d.json', refs);
validateFetchStatus(data['data/generated/fetch-status.json'], 'data/generated/fetch-status.json', refs);

if (errors.length) {
  console.error('Data validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Data validation passed.');
