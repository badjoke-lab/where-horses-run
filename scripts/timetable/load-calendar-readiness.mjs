import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const BASE_PATH = 'data/static/calendar-readiness-registry.json';
const SUPPLEMENTS = Object.freeze([
  {
    key: 'nar_race_list',
    path: 'data/static/calendar-readiness-nar-race-list-v1.json',
    schemaVersion: 'calendar-readiness-nar-race-list-v1',
  },
  {
    key: 'nar_schedule_grid',
    path: 'data/static/calendar-readiness-nar-schedule-grid-v1.json',
    schemaVersion: 'calendar-readiness-nar-schedule-grid-v1',
  },
  {
    key: 'banei_detail',
    path: 'data/static/calendar-readiness-banei-detail-v1.json',
    schemaVersion: 'calendar-readiness-banei-detail-v1',
  },
]);
const AMENDMENTS_PATH = 'data/static/calendar-readiness-amendments-v1.json';
const AMENDMENT_FIELDS = new Set(['public_ceiling', 'confirmed_fields', 'reason']);

function readJson(root, relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function applySupplements(root, base) {
  const records = [...base.records];
  const ids = new Set(records.map((record) => record.readiness_id));
  const sourceKeys = new Set(records.map((record) => record.authority_source_key));

  for (const supplementDef of SUPPLEMENTS) {
    if (!existsSync(path.join(root, supplementDef.path))) continue;
    const supplement = readJson(root, supplementDef.path);
    assert(supplement?.schema_version === supplementDef.schemaVersion, `${supplementDef.key} Calendar Readiness supplement schema is invalid`);
    assert(Array.isArray(supplement.records), `${supplementDef.key} Calendar Readiness supplement records must be an array`);

    for (const record of supplement.records) {
      assert(!ids.has(record.readiness_id), `duplicate readiness supplement ID: ${record.readiness_id}`);
      assert(!sourceKeys.has(record.authority_source_key), `duplicate readiness supplement source key: ${record.authority_source_key}`);
      ids.add(record.readiness_id);
      sourceKeys.add(record.authority_source_key);
      records.push(record);
    }
  }

  return {
    ...base,
    records,
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
  return applyAmendments(root, applySupplements(root, base));
}

export const calendarReadinessPathsV1 = Object.freeze({
  base: BASE_PATH,
  ...Object.fromEntries(SUPPLEMENTS.map((entry) => [entry.key, entry.path])),
  amendments: AMENDMENTS_PATH,
});
