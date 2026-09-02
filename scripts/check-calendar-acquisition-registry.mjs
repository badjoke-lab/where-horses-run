import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  acquisitionProfileMapV1,
  loadCalendarAcquisitionRegistryV1,
  resolveAcquisitionProfileV1,
} from './timetable/load-calendar-acquisition-registry.mjs';
import { loadAuthoritySourceInventoryV1 } from './timetable/load-authority-source-inventory.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readText = (relativePath) => {
  const absolute = path.join(root, relativePath);
  if (!existsSync(absolute)) {
    fail(`${relativePath} must exist.`);
    return '';
  }
  return readFileSync(absolute, 'utf8');
};
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;

const schemaPath = 'data/static/calendar-acquisition-registry.schema.json';
const registryPath = 'data/static/calendar-acquisition-registry.json';
const schema = readJson(schemaPath);
const registry = loadCalendarAcquisitionRegistryV1(root);
const sourceInventory = loadAuthoritySourceInventoryV1(root);
const japanPolicy = readJson('data/static/japan-a-plus-policy.json');

const expectedRecordFields = schema.required_record_fields ?? [];
const ranks = schema.rank_enum ?? [];
const runners = schema.runner_enum ?? [];
const targetRanks = schema.collection_target_rank_enum ?? [];
const statuses = schema.profile_status_enum ?? [];
const supportFields = schema.scope_support_fields ?? [];
const rankIndex = new Map(ranks.map((rank, index) => [rank, index]));
const requiredSystems = [
  'japan-jra-system',
  'japan-nar-system',
  'japan-banei-system',
  'hong-kong-hkjc-system',
  'uae-national-racing-system',
  'kra-national-racing-system',
];
const sourceKeys = new Set((sourceInventory.records ?? []).map((record) => `${record.country_id}/${record.authority_id}/${record.official_source_id}`));
const japanPolicyBySystem = new Map((japanPolicy.records ?? []).map((record) => [record.system_id, record]));

if (schema.schema_version !== 'calendar-acquisition-registry-schema-v1') fail('Acquisition Registry schema version differs.');
if (registry.schema_version !== 'calendar-acquisition-registry-v1') fail('Acquisition Registry version differs.');
if (registry.schema_ref !== schemaPath) fail('Acquisition Registry schema_ref differs.');
if (!Array.isArray(registry.records) || registry.records.length === 0) fail('Acquisition Registry records must be a non-empty array.');

const seen = new Set();
for (const [index, record] of (registry.records ?? []).entries()) {
  const label = `records[${index}]`;
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    fail(`${label} must be an object.`);
    continue;
  }
  for (const field of expectedRecordFields) if (!Object.hasOwn(record, field)) fail(`${label} missing ${field}.`);
  for (const key of Object.keys(record)) if (!expectedRecordFields.includes(key)) fail(`${label} has unexpected field ${key}.`);
  for (const field of ['system_id', 'country_id', 'authority_id', 'operator_notes']) if (!nonEmpty(record[field])) fail(`${label}.${field} must be non-empty.`);
  if (seen.has(record.system_id)) fail(`${label} duplicates system_id ${record.system_id}.`);
  seen.add(record.system_id);

  if (!statuses.includes(record.profile_status)) fail(`${label} has invalid profile_status ${record.profile_status}.`);
  if (!runners.includes(record.primary_runner)) fail(`${label} has invalid primary_runner ${record.primary_runner}.`);
  if (record.fallback_runner !== null && !runners.includes(record.fallback_runner)) fail(`${label} has invalid fallback_runner ${record.fallback_runner}.`);
  if (record.fallback_runner !== null && record.fallback_runner === record.primary_runner) fail(`${label} fallback_runner must differ from primary_runner.`);
  if (!ranks.includes(record.technical_capability_rank)) fail(`${label} has invalid technical_capability_rank.`);
  if (!targetRanks.includes(record.collection_target_rank)) fail(`${label} has invalid collection_target_rank.`);
  if (!ranks.includes(record.public_ceiling)) fail(`${label} has invalid public_ceiling.`);
  if (rankIndex.has(record.collection_target_rank) && rankIndex.get(record.collection_target_rank) > rankIndex.get(record.technical_capability_rank)) fail(`${label} collection target exceeds technical capability.`);
  if (rankIndex.has(record.public_ceiling) && rankIndex.get(record.public_ceiling) > rankIndex.get(record.technical_capability_rank)) fail(`${label} public ceiling exceeds technical capability.`);

  if (!Array.isArray(record.supported_observation_ranks) || record.supported_observation_ranks.length === 0) fail(`${label} supported_observation_ranks must be non-empty.`);
  else {
    if (new Set(record.supported_observation_ranks).size !== record.supported_observation_ranks.length) fail(`${label} supported_observation_ranks contains duplicates.`);
    for (const rank of record.supported_observation_ranks) {
      if (!ranks.includes(rank)) fail(`${label} has unsupported observation rank ${rank}.`);
      else if (rankIndex.get(rank) > rankIndex.get(record.technical_capability_rank)) fail(`${label} observation rank ${rank} exceeds technical capability.`);
    }
  }
  for (const field of supportFields) if (typeof record[field] !== 'boolean') fail(`${label}.${field} must be boolean.`);
  if (!Array.isArray(record.pending_fields) || new Set(record.pending_fields).size !== record.pending_fields.length) fail(`${label}.pending_fields must be a unique array.`);

  for (const field of ['schedule_source_id', 'detail_source_id']) {
    const sourceId = record[field];
    if (record.profile_status === 'active' && !nonEmpty(sourceId)) fail(`${label}.${field} is required for active profiles.`);
    if (sourceId !== null && !sourceKeys.has(`${record.country_id}/${record.authority_id}/${sourceId}`)) fail(`${label}.${field} does not resolve in authority/source inventory.`);
  }
  for (const field of ['schedule_adapter_id', 'detail_adapter_id']) {
    if (record.profile_status === 'active' && !nonEmpty(record[field])) fail(`${label}.${field} is required for active profiles.`);
  }
  if (record.profile_status === 'active' && record.pending_fields.length !== 0) fail(`${label} active profile must not retain pending_fields.`);

  const policy = japanPolicyBySystem.get(record.system_id);
  if (policy) {
    if (record.technical_capability_rank !== policy.technical_rank) fail(`${label} technical capability differs from Japan policy.`);
    if (record.public_ceiling !== policy.public_ceiling) fail(`${label} public ceiling differs from Japan policy.`);
  }
}
for (const systemId of requiredSystems) if (!seen.has(systemId)) fail(`required Acquisition Registry profile missing ${systemId}.`);

try {
  const map = acquisitionProfileMapV1(registry);
  if (map.size !== registry.records.length) fail('Acquisition Registry loader map size differs.');
  for (const systemId of requiredSystems) if (resolveAcquisitionProfileV1(registry, systemId).system_id !== systemId) fail(`loader resolution differs for ${systemId}.`);
} catch (error) {
  fail(`Acquisition Registry loader failed: ${error.message}`);
}

const profiles = new Map(registry.records.map((record) => [record.system_id, record]));
const nar = profiles.get('japan-nar-system');
if (nar?.primary_runner !== 'github_actions' || nar?.fallback_runner !== 'local' || nar?.supports_selected_meetings !== true || nar?.supports_rank_upgrade_retry !== true) fail('NAR current runner/retry capability differs.');
if (!readText('scripts/timetable/nar-incremental-v2-actions-core.mjs').includes('selected_meetings') || !readText('scripts/timetable/normalize-nar-schedule-aware-month.mjs').includes('--meeting-ids=')) fail('NAR selected-meeting implementation evidence is missing.');

const banei = profiles.get('japan-banei-system');
if (banei?.primary_runner !== 'github_actions' || banei?.supports_date_window !== true || banei?.supports_selected_meetings !== true || banei?.supports_rank_upgrade_retry !== true) fail('Banei current runner/retry capability differs.');
const baneiCollector = readText('scripts/timetable/collect-banei-detail-window.mjs');
const baneiExecutor = readText('scripts/timetable/banei-actions-executor-core.mjs');
if (!baneiCollector.includes('--meeting-ids=') || !baneiCollector.includes('Provide either start/end window or selected meeting IDs') || !baneiExecutor.includes("execution.collection_mode === 'selected_meetings'") || !baneiExecutor.includes("execution.collection_mode === 'date_window'")) fail('Banei current date-window/selected-meeting implementation evidence is missing.');

const hkjc = profiles.get('hong-kong-hkjc-system');
if (hkjc?.primary_runner !== 'github_actions' || hkjc?.detail_adapter_id !== 'hkjc-detail-reviewed-import-v1') fail('HKJC current route differs.');
if (!readText('scripts/timetable/hkjc-detail-reviewed-import-core.mjs').includes("adapter_id: 'hkjc-detail-reviewed-import-v1'")) fail('HKJC current reviewed-import implementation evidence is missing.');

const uae = profiles.get('uae-national-racing-system');
if (uae?.primary_runner !== 'github_actions' || uae?.supports_selected_meetings !== true || uae?.supports_rank_upgrade_retry !== true) fail('UAE current selected-meeting retry capability differs.');
if (!readText('scripts/timetable/run-uae-era-actions-job.mjs').includes("execution.collection_mode !== 'selected_meetings'") || !readText('scripts/timetable/uae-era-rank-upgrade-core.mjs').includes("collection_mode === 'selected_meetings'")) fail('UAE current selected-meeting implementation evidence is missing.');

const kra = profiles.get('kra-national-racing-system');
if (kra?.primary_runner !== 'github_actions' || kra?.supports_selected_meetings !== true || kra?.collection_target_rank !== 'best_available') fail('KRA current selected-meeting capability differs.');
if (!readText('scripts/timetable/run-kra-todayrace-actions-job.mjs').includes("execution.collection_mode !== 'selected_meetings'") || !readText('scripts/timetable/collect-kra-todayrace.mjs').includes('--racecourse-id=')) fail('KRA current selected-meeting implementation evidence is missing.');

const serialized = JSON.stringify(registry).toLowerCase();
for (const fragment of ['horse_name', 'jockey_name', 'trainer_name', 'odds_value', 'payout_amount', 'raw_html', 'source_body', 'credential', 'cookie', 'secret']) {
  if (serialized.includes(`\"${fragment}\"`)) fail(`registry contains prohibited field ${fragment}.`);
}

if (errors.length) {
  console.error(`CALENDAR_ACQUISITION_REGISTRY: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_ACQUISITION_REGISTRY: pass');
console.log(`PROFILES: ${registry.records.length}`);
console.log('CURRENT_IMPLEMENTATION_EVIDENCE: pass');
