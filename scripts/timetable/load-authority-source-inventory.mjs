import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const BASE_PATH = 'data/static/authority-source-inventory.json';
const SUPPLEMENTS = Object.freeze([
  {
    key: 'nar_race_list',
    path: 'data/static/authority-source-inventory-nar-race-list-v1.json',
    schemaVersion: 'authority-source-inventory-nar-race-list-v1',
  },
  {
    key: 'nar_schedule_grid',
    path: 'data/static/authority-source-inventory-nar-schedule-grid-v1.json',
    schemaVersion: 'authority-source-inventory-nar-schedule-grid-v1',
  },
]);

function readJson(root, relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sourceKey(record) {
  return `${record.country_id}/${record.authority_id}/${record.official_source_id}`;
}

export function loadAuthoritySourceInventoryV1(root) {
  const base = readJson(root, BASE_PATH);
  const records = [...base.records];
  const seen = new Set(records.map(sourceKey));

  for (const supplementDef of SUPPLEMENTS) {
    if (!existsSync(path.join(root, supplementDef.path))) continue;
    const supplement = readJson(root, supplementDef.path);
    assert(supplement?.schema_version === supplementDef.schemaVersion, `${supplementDef.key} authority/source supplement schema is invalid`);
    assert(Array.isArray(supplement.records), `${supplementDef.key} authority/source supplement records must be an array`);

    for (const record of supplement.records) {
      const key = sourceKey(record);
      assert(!seen.has(key), `duplicate authority/source supplement key: ${key}`);
      seen.add(key);
      records.push(record);
    }
  }

  return {
    ...base,
    records,
  };
}

export const authoritySourceInventoryPathsV1 = Object.freeze({
  base: BASE_PATH,
  ...Object.fromEntries(SUPPLEMENTS.map((entry) => [entry.key, entry.path])),
});
