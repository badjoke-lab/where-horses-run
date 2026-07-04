import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const BASE_PATH = 'data/static/authority-source-inventory.json';
const JAPAN_V2_PATH = 'data/static/authority-source-inventory-japan-v2.json';
const ALLOWED_OVERLAY_FIELDS = new Set([
  'capability_rank',
  'source_status',
  'adapter_candidate_status',
  'notes',
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
  if (!existsSync(path.join(root, JAPAN_V2_PATH))) return base;

  const japan = readJson(root, JAPAN_V2_PATH);
  assert(japan?.schema_version === 'authority-source-inventory-japan-v2', 'Japan authority/source overlay schema is invalid');
  assert(Array.isArray(japan.records), 'Japan authority/source overlay records must be an array');

  const byKey = new Map(base.records.map((record) => [sourceKey(record), record]));
  const overlays = new Map();

  for (const overlay of japan.records) {
    const key = overlay.authority_source_key;
    assert(typeof key === 'string' && key, 'Japan authority/source overlay has no authority_source_key');
    assert(byKey.has(key), `Japan authority/source overlay target is missing: ${key}`);
    assert(!overlays.has(key), `duplicate Japan authority/source overlay: ${key}`);

    const projected = {};
    for (const field of ALLOWED_OVERLAY_FIELDS) {
      if (overlay[field] != null) projected[field] = overlay[field];
    }
    overlays.set(key, projected);
  }

  return {
    ...base,
    records: base.records.map((record) => {
      const overlay = overlays.get(sourceKey(record));
      return overlay ? { ...record, ...overlay } : record;
    }),
  };
}

export const authoritySourceInventoryPathsV1 = Object.freeze({
  base: BASE_PATH,
  japan_v2: JAPAN_V2_PATH,
});
