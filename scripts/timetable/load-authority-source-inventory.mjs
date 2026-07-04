import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const BASE_PATH = 'data/static/authority-source-inventory.json';
const NAR_RACE_LIST_PATH = 'data/static/authority-source-inventory-nar-race-list-v1.json';

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
  if (!existsSync(path.join(root, NAR_RACE_LIST_PATH))) return base;

  const supplement = readJson(root, NAR_RACE_LIST_PATH);
  assert(supplement?.schema_version === 'authority-source-inventory-nar-race-list-v1', 'NAR authority/source supplement schema is invalid');
  assert(Array.isArray(supplement.records), 'NAR authority/source supplement records must be an array');

  const seen = new Set(base.records.map(sourceKey));
  for (const record of supplement.records) {
    const key = sourceKey(record);
    assert(!seen.has(key), `duplicate authority/source supplement key: ${key}`);
    seen.add(key);
  }

  return {
    ...base,
    records: [...base.records, ...supplement.records],
  };
}

export const authoritySourceInventoryPathsV1 = Object.freeze({
  base: BASE_PATH,
  nar_race_list: NAR_RACE_LIST_PATH,
});
