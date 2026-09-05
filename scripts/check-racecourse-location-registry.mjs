import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const sourceFiles = [
  'data/static/racecourses.json',
  'data/static/racecourses-extensions.json',
  'data/static/racecourses-public-timetable-identities-v1.json',
  'data/static/country-page-racecourses-01-04.json',
  'data/static/country-page-racecourses-11-oman.json',
  'data/static/country-page-racecourses-12-zimbabwe.json',
];

const registryPath = 'data/static/racecourse-locations-v1.json';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

const canonicalRecords = sourceFiles.flatMap((file) => {
  const value = readJson(file);
  if (!Array.isArray(value)) throw new Error(`${file} must contain an array`);
  return value.map((record) => ({ ...record, __source_file: file }));
});
const registry = readJson(registryPath);

const errors = [];
function fail(message) { errors.push(message); }
function nonempty(value) { return typeof value === 'string' && value.trim().length > 0; }
function strictDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

const canonicalById = new Map();
for (const record of canonicalRecords) {
  if (!nonempty(record.id)) {
    fail(`${record.__source_file}: racecourse record is missing id`);
    continue;
  }
  if (canonicalById.has(record.id)) {
    fail(`duplicate canonical racecourse id ${record.id}: ${canonicalById.get(record.id).__source_file} and ${record.__source_file}`);
    continue;
  }
  canonicalById.set(record.id, record);
}

if (canonicalById.size === 0) {
  fail('canonical racecourse set must not be empty');
}
if (canonicalById.size !== canonicalRecords.length) {
  fail(`canonical racecourse set contains duplicate ids: ${canonicalRecords.length} records / ${canonicalById.size} unique ids`);
}

if (registry?.schema_version !== 'racecourse-locations-v1') {
  fail(`${registryPath}: schema_version must be racecourse-locations-v1`);
}
if (!strictDate(registry?.reviewed_at)) {
  fail(`${registryPath}: reviewed_at must be a real YYYY-MM-DD date`);
}
if (!Array.isArray(registry?.locations)) {
  fail(`${registryPath}: locations must be an array`);
}

const registryById = new Map();
for (const entry of Array.isArray(registry?.locations) ? registry.locations : []) {
  if (!nonempty(entry?.id)) {
    fail(`${registryPath}: location entry is missing id`);
    continue;
  }
  if (registryById.has(entry.id)) {
    fail(`${registryPath}: duplicate location id ${entry.id}`);
    continue;
  }
  registryById.set(entry.id, entry);

  if (!canonicalById.has(entry.id)) {
    fail(`${registryPath}: orphan location id ${entry.id}`);
  }
  const location = entry.location;
  if (!location || typeof location !== 'object' || Array.isArray(location)) {
    fail(`${entry.id}: location must be an object`);
    continue;
  }
  const allowed = new Set(['address', 'latitude', 'longitude', 'precision', 'verification_state', 'evidence', 'location_last_checked']);
  const required = ['latitude', 'longitude', 'precision', 'verification_state', 'evidence', 'location_last_checked'];
  for (const key of Object.keys(location)) {
    if (!allowed.has(key)) fail(`${entry.id}: unsupported location key ${key}`);
  }
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(location, key)) fail(`${entry.id}: location.${key} is required`);
  }
  if (Object.prototype.hasOwnProperty.call(location, 'address') && !nonempty(location.address)) {
    fail(`${entry.id}: location.address must be non-empty when present`);
  }
  if (!Number.isFinite(location.latitude) || location.latitude < -90 || location.latitude > 90) {
    fail(`${entry.id}: invalid location.latitude`);
  }
  if (!Number.isFinite(location.longitude) || location.longitude < -180 || location.longitude > 180) {
    fail(`${entry.id}: invalid location.longitude`);
  }
  if (!nonempty(location.precision)) fail(`${entry.id}: location.precision must be non-empty`);
  if (location.verification_state !== 'reviewed') {
    fail(`${entry.id}: location.verification_state must be reviewed for the public location registry`);
  }
  if (!strictDate(location.location_last_checked)) {
    fail(`${entry.id}: location.location_last_checked must be a real YYYY-MM-DD date`);
  }
  const evidence = location.evidence;
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
    fail(`${entry.id}: location.evidence must be an object`);
  } else {
    if (!['url', 'repository_ref'].includes(evidence.type)) fail(`${entry.id}: invalid location.evidence.type`);
    if (!nonempty(evidence.value)) fail(`${entry.id}: location.evidence.value must be non-empty`);
    if (evidence.type === 'url' && nonempty(evidence.value)) {
      try {
        const parsed = new URL(evidence.value);
        if (!['http:', 'https:'].includes(parsed.protocol)) fail(`${entry.id}: evidence URL must use http or https`);
      } catch {
        fail(`${entry.id}: evidence URL is invalid`);
      }
    }
  }
}

const unresolved = [...canonicalById.keys()].filter((id) => !registryById.has(id)).sort();

if (errors.length > 0) {
  console.error('Racecourse location registry validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Racecourse location registry OK: ${registryById.size}/${canonicalById.size} public racecourses have reviewed locations.`);
if (unresolved.length > 0) {
  console.log(`Unresolved locations (${unresolved.length}): ${unresolved.join(', ')}`);
}
