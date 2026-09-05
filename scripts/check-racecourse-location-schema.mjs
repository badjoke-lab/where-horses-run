import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const racecoursesPath = path.join(root, 'data/static/racecourses.json');
const schemaPath = path.join(root, 'data/static/racecourse-location.schema.json');

const racecourses = JSON.parse(fs.readFileSync(racecoursesPath, 'utf8'));
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

const errors = [];
const allowedLocationKeys = new Set([
  'address',
  'latitude',
  'longitude',
  'precision',
  'verification_state',
  'evidence',
  'location_last_checked',
]);
const requiredLocationKeys = [
  'latitude',
  'longitude',
  'precision',
  'verification_state',
  'evidence',
  'location_last_checked',
];

function fail(message) {
  errors.push(message);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStrictDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validateEvidence(racecourseId, evidence) {
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    fail(`${racecourseId}: location.evidence must be an object`);
    return;
  }

  const keys = Object.keys(evidence);
  for (const key of keys) {
    if (!['type', 'value'].includes(key)) {
      fail(`${racecourseId}: unsupported location.evidence key: ${key}`);
    }
  }

  if (!['url', 'repository_ref'].includes(evidence.type)) {
    fail(`${racecourseId}: location.evidence.type must be url or repository_ref`);
  }
  if (!isNonEmptyString(evidence.value)) {
    fail(`${racecourseId}: location.evidence.value must be a non-empty string`);
  }

  if (evidence.type === 'url' && isNonEmptyString(evidence.value)) {
    try {
      const parsed = new URL(evidence.value);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        fail(`${racecourseId}: location.evidence url must use http or https`);
      }
    } catch {
      fail(`${racecourseId}: location.evidence.value is not a valid URL`);
    }
  }
}

if (!schema || schema.type !== 'object') {
  fail('racecourse-location schema must define an object');
}
if (schema.additionalProperties !== false) {
  fail('racecourse-location schema must reject additional properties');
}
for (const key of requiredLocationKeys) {
  if (!schema.required?.includes(key)) {
    fail(`racecourse-location schema must require ${key}`);
  }
}

if (!Array.isArray(racecourses)) {
  fail('data/static/racecourses.json must be an array');
} else {
  const ids = new Set();
  for (const racecourse of racecourses) {
    const id = isNonEmptyString(racecourse?.id) ? racecourse.id : '<missing-id>';
    if (!isNonEmptyString(racecourse?.id)) {
      fail('racecourse record is missing id');
      continue;
    }
    if (ids.has(id)) fail(`duplicate racecourse id: ${id}`);
    ids.add(id);

    for (const legacyKey of ['latitude', 'longitude', 'coordinates', 'lat', 'lon', 'lng']) {
      if (Object.prototype.hasOwnProperty.call(racecourse, legacyKey)) {
        fail(`${id}: top-level ${legacyKey} is forbidden; use the canonical location.latitude/location.longitude fields`);
      }
    }

    if (!Object.prototype.hasOwnProperty.call(racecourse, 'location')) continue;

    const location = racecourse.location;
    if (!location || typeof location !== 'object' || Array.isArray(location)) {
      fail(`${id}: location must be an object`);
      continue;
    }

    for (const key of Object.keys(location)) {
      if (!allowedLocationKeys.has(key)) fail(`${id}: unsupported location key: ${key}`);
    }
    for (const key of requiredLocationKeys) {
      if (!Object.prototype.hasOwnProperty.call(location, key)) {
        fail(`${id}: location.${key} is required`);
      }
    }

    if (Object.prototype.hasOwnProperty.call(location, 'address') && !isNonEmptyString(location.address)) {
      fail(`${id}: location.address must be a non-empty string when present`);
    }
    if (!Number.isFinite(location.latitude) || location.latitude < -90 || location.latitude > 90) {
      fail(`${id}: location.latitude must be a finite number from -90 to 90`);
    }
    if (!Number.isFinite(location.longitude) || location.longitude < -180 || location.longitude > 180) {
      fail(`${id}: location.longitude must be a finite number from -180 to 180`);
    }
    if (!isNonEmptyString(location.precision)) {
      fail(`${id}: location.precision must be a non-empty string`);
    }
    if (!isNonEmptyString(location.verification_state)) {
      fail(`${id}: location.verification_state must be a non-empty string`);
    }
    validateEvidence(id, location.evidence);
    if (!isStrictDate(location.location_last_checked)) {
      fail(`${id}: location.location_last_checked must be a real YYYY-MM-DD date`);
    }
  }
}

if (errors.length > 0) {
  console.error('Racecourse location contract validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const withLocation = Array.isArray(racecourses)
  ? racecourses.filter((racecourse) => Object.prototype.hasOwnProperty.call(racecourse, 'location')).length
  : 0;
console.log(`Racecourse location contract OK: ${racecourses.length} racecourses, ${withLocation} location records present.`);
