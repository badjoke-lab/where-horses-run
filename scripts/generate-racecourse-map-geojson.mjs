import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const sourceRelativePath = 'data/static/racecourse-locations-v1.json';
const outputRelativePath = 'public/data/racecourse-locations-v1.geojson';
const sourcePath = path.join(root, sourceRelativePath);
const outputPath = path.join(root, outputRelativePath);
const checkOnly = process.argv.includes('--check');

const registry = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

if (registry?.schema_version !== 'racecourse-locations-v1') {
  throw new Error(`${sourceRelativePath}: expected schema_version racecourse-locations-v1`);
}
if (!Array.isArray(registry?.locations)) {
  throw new Error(`${sourceRelativePath}: locations must be an array`);
}

const seen = new Set();
const features = registry.locations.map((entry) => {
  if (typeof entry?.id !== 'string' || entry.id.trim() === '') {
    throw new Error(`${sourceRelativePath}: location entry is missing id`);
  }
  if (seen.has(entry.id)) {
    throw new Error(`${sourceRelativePath}: duplicate location id ${entry.id}`);
  }
  seen.add(entry.id);

  const location = entry.location;
  if (!location || typeof location !== 'object' || Array.isArray(location)) {
    throw new Error(`${entry.id}: location must be an object`);
  }
  if (location.verification_state !== 'reviewed') {
    throw new Error(`${entry.id}: only reviewed locations may enter the public map projection`);
  }
  if (!Number.isFinite(location.latitude) || location.latitude < -90 || location.latitude > 90) {
    throw new Error(`${entry.id}: invalid latitude`);
  }
  if (!Number.isFinite(location.longitude) || location.longitude < -180 || location.longitude > 180) {
    throw new Error(`${entry.id}: invalid longitude`);
  }
  if (typeof location.precision !== 'string' || location.precision.trim() === '') {
    throw new Error(`${entry.id}: precision is required`);
  }
  if (typeof location.location_last_checked !== 'string' || location.location_last_checked.trim() === '') {
    throw new Error(`${entry.id}: location_last_checked is required`);
  }

  const properties = {
    racecourse_id: entry.id,
    precision: location.precision,
    verification_state: 'reviewed',
    location_last_checked: location.location_last_checked,
  };
  if (typeof location.address === 'string' && location.address.trim() !== '') {
    properties.address = location.address;
  }

  return {
    type: 'Feature',
    id: entry.id,
    geometry: {
      type: 'Point',
      coordinates: [location.longitude, location.latitude],
    },
    properties,
  };
}).sort((a, b) => a.id.localeCompare(b.id, 'en'));

const projection = {
  type: 'FeatureCollection',
  whr_schema_version: 'racecourse-map-geojson-v1',
  source_schema_version: registry.schema_version,
  source_reviewed_at: registry.reviewed_at ?? null,
  features,
};

const serialized = `${JSON.stringify(projection, null, 2)}\n`;

if (!checkOnly) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized, 'utf8');
  console.log(`Generated ${outputRelativePath}: ${features.length} reviewed racecourse points.`);
} else {
  JSON.parse(serialized);
  console.log(`Racecourse map projection OK: ${features.length} reviewed racecourse points generated from ${sourceRelativePath}.`);
}
