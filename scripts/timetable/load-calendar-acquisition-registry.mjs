import { readFileSync } from 'node:fs';
import path from 'node:path';

export const calendarAcquisitionRegistryPathsV1 = Object.freeze({
  schema: 'data/static/calendar-acquisition-registry.schema.json',
  registry: 'data/static/calendar-acquisition-registry.json',
});

function readJson(root, relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

export function loadCalendarAcquisitionRegistryV1(root = process.cwd()) {
  return readJson(root, calendarAcquisitionRegistryPathsV1.registry);
}

export function acquisitionProfileMapV1(registry) {
  if (!registry || !Array.isArray(registry.records)) {
    throw new Error('Calendar Acquisition Registry records must be an array.');
  }
  const map = new Map();
  for (const record of registry.records) {
    if (map.has(record.system_id)) throw new Error(`duplicate Acquisition Registry system_id: ${record.system_id}`);
    map.set(record.system_id, record);
  }
  return map;
}

export function resolveAcquisitionProfileV1(registry, systemId) {
  const profile = acquisitionProfileMapV1(registry).get(systemId);
  if (!profile) throw new Error(`unknown Acquisition Registry system_id: ${systemId}`);
  return profile;
}
