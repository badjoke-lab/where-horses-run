import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const BASE_PATH = 'data/static/calendar-readiness-registry.json';
const JAPAN_V2_PATH = 'data/static/calendar-readiness-japan-v2.json';
const AMENDMENTS_PATH = 'data/static/calendar-readiness-amendments-v1.json';
const JAPAN_OVERLAY_FIELDS = new Set([
  'technical_rank',
  'public_ceiling',
  'readiness',
  'implementation_status',
  'automation_mode',
  'fallback',
]);
const AMENDMENT_FIELDS = new Set(['public_ceiling', 'confirmed_fields', 'reason']);

function readJson(root, relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function applyJapanV2(root, base) {
  if (!existsSync(path.join(root, JAPAN_V2_PATH))) return base;

  const japan = readJson(root, JAPAN_V2_PATH);
  assert(japan?.schema_version === 'japan-calendar-readiness-v2', 'Japan Calendar Readiness overlay schema is invalid');
  assert(Array.isArray(japan.records), 'Japan Calendar Readiness overlay records must be an array');
  assert(Array.isArray(japan.supersedes_records), 'Japan Calendar Readiness overlay supersedes_records must be an array');

  const bySourceKey = new Map();
  for (const record of base.records) {
    const records = bySourceKey.get(record.authority_source_key) ?? [];
    records.push(record);
    bySourceKey.set(record.authority_source_key, records);
  }

  const overlays = new Map();
  for (const overlay of japan.records) {
    const matches = bySourceKey.get(overlay.authority_source_key) ?? [];
    assert(matches.length === 1, `Japan Calendar Readiness overlay target must be unique: ${overlay.authority_source_key}`);
    const target = matches[0];
    assert(target.system_id === overlay.system_id, `Japan Calendar Readiness overlay system differs: ${overlay.authority_source_key}`);
    assert(japan.supersedes_records.includes(target.readiness_id), `Japan Calendar Readiness overlay must supersede ${target.readiness_id}`);
    assert(!overlays.has(target.readiness_id), `duplicate Japan Calendar Readiness overlay ${target.readiness_id}`);

    const projected = {};
    for (const field of JAPAN_OVERLAY_FIELDS) {
      if (overlay[field] != null) projected[field] = overlay[field];
    }
    overlays.set(target.readiness_id, projected);
  }

  return {
    ...base,
    records: base.records.map((record) => {
      const overlay = overlays.get(record.readiness_id);
      return overlay ? { ...record, ...overlay } : record;
    }),
  };
}

function applyAmendments(root, base) {
  if (!existsSync(path.join(root, AMENDMENTS_PATH))) return base;

  const amendments = readJson(root, AMENDMENTS_PATH);
  assert(amendments?.schema_version === 'calendar-readiness-amendments-v1', 'Calendar Readiness amendments schema is invalid');
  assert(Array.isArray(amendments.records), 'Calendar Readiness amendments.records must be an array');

  const byId = new Map(base.records.map((record) => [record.readiness_id, record]));
  const amended = new Map();

  for (const amendment of amendments.records) {
    assert(typeof amendment.readiness_id === 'string' && amendment.readiness_id, 'Calendar Readiness amendment has no readiness_id');
    assert(!amended.has(amendment.readiness_id), `duplicate Calendar Readiness amendment ${amendment.readiness_id}`);
    assert(byId.has(amendment.readiness_id), `Calendar Readiness amendment target is missing: ${amendment.readiness_id}`);
    assert(typeof amendment.reason === 'string' && amendment.reason.trim(), `Calendar Readiness amendment ${amendment.readiness_id} has no reason`);

    for (const key of Object.keys(amendment)) {
      if (key === 'readiness_id') continue;
      assert(AMENDMENT_FIELDS.has(key), `Calendar Readiness amendment ${amendment.readiness_id} has unsupported field ${key}`);
    }

    if (amendment.public_ceiling != null) {
      assert(['not_listed', 'D', 'C', 'B', 'B+', 'A', 'A+'].includes(amendment.public_ceiling), `Calendar Readiness amendment ${amendment.readiness_id} has invalid public_ceiling`);
    }

    if (amendment.confirmed_fields != null) {
      assert(amendment.confirmed_fields && typeof amendment.confirmed_fields === 'object' && !Array.isArray(amendment.confirmed_fields), `Calendar Readiness amendment ${amendment.readiness_id} confirmed_fields must be an object`);
      const baseFields = byId.get(amendment.readiness_id).confirmed_fields ?? {};
      for (const [field, value] of Object.entries(amendment.confirmed_fields)) {
        assert(field in baseFields, `Calendar Readiness amendment ${amendment.readiness_id} has unknown confirmed field ${field}`);
        assert(typeof value === 'boolean', `Calendar Readiness amendment ${amendment.readiness_id} confirmed field ${field} must be boolean`);
      }
    }

    amended.set(amendment.readiness_id, amendment);
  }

  return {
    ...base,
    records: base.records.map((record) => {
      const amendment = amended.get(record.readiness_id);
      if (!amendment) return record;
      return {
        ...record,
        ...(amendment.public_ceiling == null ? {} : { public_ceiling: amendment.public_ceiling }),
        confirmed_fields: {
          ...(record.confirmed_fields ?? {}),
          ...(amendment.confirmed_fields ?? {}),
        },
      };
    }),
  };
}

export function loadCalendarReadinessV1(root) {
  const base = readJson(root, BASE_PATH);
  return applyAmendments(root, applyJapanV2(root, base));
}

export const calendarReadinessPathsV1 = Object.freeze({
  base: BASE_PATH,
  japan_v2: JAPAN_V2_PATH,
  amendments: AMENDMENTS_PATH,
});
