import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

const capacitySourceTypes = new Set(['official', 'authority', 'secondary', 'unknown']);
const profileStatuses = new Set(['verified', 'partial', 'secondary', 'stale', 'unknown']);
const operatorTypes = new Set([
  'national-authority',
  'regional-authority',
  'race-club',
  'private-operator',
  'public-operator',
  'other',
  'unknown'
]);

function fail(message) {
  errors.push(message);
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function checkOptionalString(value, label) {
  if (value === undefined || value === null) return;
  if (typeof value !== 'string' || value.trim() === '') fail(`${label}: expected non-empty string, null, or omission`);
}

function checkOptionalUrl(value, label) {
  if (value === undefined || value === null) return;
  checkOptionalString(value, label);
  if (typeof value !== 'string') return;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) fail(`${label}: expected http or https URL`);
  } catch {
    fail(`${label}: invalid URL`);
  }
}

function checkOptionalDate(value, label) {
  if (value === undefined || value === null) return;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail(`${label}: expected YYYY-MM-DD, null, or omission`);
  }
}

function checkOptionalNonNegativeNumber(value, label, integerOnly = false) {
  if (value === undefined || value === null) return;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || (integerOnly && !Number.isInteger(value))) {
    fail(`${label}: expected non-negative ${integerOnly ? 'integer' : 'number'}, null, or omission`);
  }
}

function checkCourseArray(value, label) {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    fail(`${label}: expected array`);
    return;
  }
  for (const [index, course] of value.entries()) {
    const rowLabel = `${label}[${index}]`;
    if (!isObject(course)) {
      fail(`${rowLabel}: expected object`);
      continue;
    }
    checkOptionalString(course.label, `${rowLabel}.label`);
    if (course.label === undefined || course.label === null) fail(`${rowLabel}.label: required`);
    checkOptionalNonNegativeNumber(course.circumference_m, `${rowLabel}.circumference_m`);
    checkOptionalString(course.direction, `${rowLabel}.direction`);
    checkOptionalString(course.surface, `${rowLabel}.surface`);
    checkOptionalString(course.note_en, `${rowLabel}.note_en`);
    checkOptionalString(course.note_ja, `${rowLabel}.note_ja`);
  }
}

function checkDistanceArray(value, label) {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    fail(`${label}: expected array`);
    return;
  }
  const seen = new Set();
  for (const [index, distance] of value.entries()) {
    checkOptionalNonNegativeNumber(distance, `${label}[${index}]`);
    if (seen.has(distance)) fail(`${label}: duplicate distance '${distance}'`);
    seen.add(distance);
  }
}

function validateTrack(track) {
  const label = `racecourse:${track.id || 'unknown'}`;

  checkOptionalString(track.overview_en, `${label}.overview_en`);
  checkOptionalString(track.overview_ja, `${label}.overview_ja`);

  if (track.operator !== undefined && track.operator !== null) {
    if (!isObject(track.operator)) {
      fail(`${label}.operator: expected object or null`);
    } else {
      checkOptionalString(track.operator.name, `${label}.operator.name`);
      if (track.operator.type !== undefined && track.operator.type !== null && !operatorTypes.has(track.operator.type)) {
        fail(`${label}.operator.type: unexpected value '${track.operator.type}'`);
      }
      checkOptionalUrl(track.operator.url, `${label}.operator.url`);
    }
  }

  if (track.capacity_profile !== undefined && track.capacity_profile !== null) {
    const value = track.capacity_profile;
    if (!isObject(value)) {
      fail(`${label}.capacity_profile: expected object or null`);
    } else {
      checkOptionalNonNegativeNumber(value.total_capacity, `${label}.capacity_profile.total_capacity`, true);
      checkOptionalNonNegativeNumber(value.seating_capacity, `${label}.capacity_profile.seating_capacity`, true);
      checkOptionalNonNegativeNumber(value.standing_capacity, `${label}.capacity_profile.standing_capacity`, true);
      checkOptionalString(value.scale_note_en, `${label}.capacity_profile.scale_note_en`);
      checkOptionalString(value.scale_note_ja, `${label}.capacity_profile.scale_note_ja`);
      checkOptionalUrl(value.source_url, `${label}.capacity_profile.source_url`);
      if (!capacitySourceTypes.has(value.source_type)) fail(`${label}.capacity_profile.source_type: unexpected value '${value.source_type}'`);
      if (!profileStatuses.has(value.status)) fail(`${label}.capacity_profile.status: unexpected value '${value.status}'`);
      checkOptionalDate(value.last_checked, `${label}.capacity_profile.last_checked`);
    }
  }

  if (track.course_layout !== undefined && track.course_layout !== null) {
    const value = track.course_layout;
    if (!isObject(value)) {
      fail(`${label}.course_layout: expected object or null`);
    } else {
      for (const key of ['turf_courses', 'dirt_courses', 'jump_courses', 'all_weather_courses', 'harness_courses', 'banei_courses']) {
        checkCourseArray(value[key], `${label}.course_layout.${key}`);
      }
      checkOptionalNonNegativeNumber(value.home_straight_m, `${label}.course_layout.home_straight_m`);
      checkOptionalString(value.elevation_note_en, `${label}.course_layout.elevation_note_en`);
      checkOptionalString(value.elevation_note_ja, `${label}.course_layout.elevation_note_ja`);
      checkOptionalString(value.inner_outer_note_en, `${label}.course_layout.inner_outer_note_en`);
      checkOptionalString(value.inner_outer_note_ja, `${label}.course_layout.inner_outer_note_ja`);
      checkOptionalUrl(value.source_url, `${label}.course_layout.source_url`);
      if (value.status !== undefined && !profileStatuses.has(value.status)) {
        fail(`${label}.course_layout.status: unexpected value '${value.status}'`);
      }
    }
  }

  if (track.race_distance_profile !== undefined && track.race_distance_profile !== null) {
    const value = track.race_distance_profile;
    if (!isObject(value)) {
      fail(`${label}.race_distance_profile: expected object or null`);
    } else {
      for (const key of ['turf_distances_m', 'dirt_distances_m', 'jump_distances_m', 'all_weather_distances_m', 'harness_distances_m']) {
        checkDistanceArray(value[key], `${label}.race_distance_profile.${key}`);
      }
      checkOptionalUrl(value.source_url, `${label}.race_distance_profile.source_url`);
      if (value.status !== undefined && !profileStatuses.has(value.status)) {
        fail(`${label}.race_distance_profile.status: unexpected value '${value.status}'`);
      }
      checkOptionalDate(value.last_checked, `${label}.race_distance_profile.last_checked`);
    }
  }

  if (track.visitor_links !== undefined && track.visitor_links !== null) {
    if (!isObject(track.visitor_links)) {
      fail(`${label}.visitor_links: expected object or null`);
    } else {
      for (const key of ['official_racecourse', 'official_schedule', 'official_course_details', 'official_access', 'official_racecard', 'official_results']) {
        checkOptionalUrl(track.visitor_links[key], `${label}.visitor_links.${key}`);
      }
    }
  }
}

const base = readJson('data/static/racecourses.json');
const extensions = readJson('data/static/racecourses-extensions.json');
const overrides = readJson('data/static/racecourse-profile-overrides.json');
const baseTracks = [...base, ...extensions];
const trackIds = new Set(baseTracks.map((track) => track.id));
const overrideIds = new Set();

for (const override of overrides) {
  if (!trackIds.has(override.id)) fail(`racecourse-profile-overrides:${override.id || 'unknown'}: unknown racecourse id`);
  if (overrideIds.has(override.id)) fail(`racecourse-profile-overrides:${override.id}: duplicate override id`);
  overrideIds.add(override.id);
  validateTrack(override);
}

const overrideById = new Map(overrides.map((override) => [override.id, override]));
const tracks = baseTracks.map((track) => ({ ...track, ...(overrideById.get(track.id) ?? {}) }));

for (const track of tracks) validateTrack(track);

if (errors.length) {
  console.error('Racecourse profile content model validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Racecourse profile content model validation passed for ${tracks.length} racecourses and ${overrides.length} overrides.`);
