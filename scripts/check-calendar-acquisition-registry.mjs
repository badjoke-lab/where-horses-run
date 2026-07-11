import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { loadAuthoritySourceInventoryV1 } from './timetable/load-authority-source-inventory.mjs';
import {
  acquisitionProfileMapV1,
  loadCalendarAcquisitionRegistryV1,
  resolveAcquisitionProfileV1,
} from './timetable/load-calendar-acquisition-registry.mjs';

const root = process.cwd();
const schemaPath = 'data/static/calendar-acquisition-registry.schema.json';
const registryPath = 'data/static/calendar-acquisition-registry.json';
const readinessRegistryPath = 'data/static/calendar-readiness-registry.json';
const japanReadinessPath = 'data/static/calendar-readiness-japan-v2.json';
const japanPolicyPath = 'data/static/japan-a-plus-policy.json';
const controlContractPath = 'docs/calendar/acquisition-control-plane-contract.md';
const implementationPlanPath = 'docs/calendar/acquisition-control-plane-implementation-plan.md';
const machineContractPath = 'docs/calendar/machine-readable-contracts.md';
const errors = [];
const rankOrder = new Map(['C', 'B', 'B+', 'A', 'A+'].map((rank, index) => [rank, index]));
const requiredProfiles = ['japan-jra-system', 'japan-nar-system', 'japan-banei-system', 'hong-kong-hkjc-system', 'uae-national-racing-system'];
const pendingCapableFields = new Set(['fallback_runner', 'schedule_source_id', 'detail_source_id', 'schedule_adapter_id', 'detail_adapter_id']);
const prohibitedKeyFragments = [
  'odds', 'payout', 'prediction', 'tip', 'entries', 'result', 'runner_name', 'horse_name', 'jockey', 'trainer',
  'raw_html', 'raw_body', 'source_body', 'credential', 'cookie', 'secret', 'private_note',
];

const fail = (message) => errors.push(message);
const readText = (relativePath) => {
  const absolute = path.join(root, relativePath);
  if (!existsSync(absolute)) {
    fail(`${relativePath} must exist.`);
    return '';
  }
  return readFileSync(absolute, 'utf8');
};
const readJson = (relativePath) => {
  const text = readText(relativePath);
  if (!text) return null;
  try { return JSON.parse(text); }
  catch (error) { fail(`${relativePath} must parse as JSON: ${error.message}`); return null; }
};
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
function exactArray(actual, expected, label) {
  if (!Array.isArray(actual) || actual.length !== expected.length || expected.some((value, index) => actual[index] !== value)) {
    fail(`${label} must equal ${JSON.stringify(expected)}.`);
  }
}
function walkKeys(value, trail = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walkKeys(entry, [...trail, String(index)]));
    return;
  }
  if (!isObject(value)) return;
  for (const [key, entry] of Object.entries(value)) {
    const normalized = key.toLowerCase();
    if (prohibitedKeyFragments.some((fragment) => normalized.includes(fragment))) {
      fail(`${registryPath}.${[...trail, key].join('.')} uses prohibited key fragment ${key}.`);
    }
    walkKeys(entry, [...trail, key]);
  }
}

const schema = readJson(schemaPath);
const registry = loadCalendarAcquisitionRegistryV1(root);
const authorityInventory = loadAuthoritySourceInventoryV1(root);
const readinessRegistry = readJson(readinessRegistryPath);
const japanReadiness = readJson(japanReadinessPath);
const japanPolicy = readJson(japanPolicyPath);
const controlContract = readText(controlContractPath);
const implementationPlan = readText(implementationPlanPath);
const machineContract = readText(machineContractPath);

const expectedRecordFields = [
  'system_id', 'country_id', 'authority_id', 'profile_status', 'primary_runner', 'fallback_runner',
  'schedule_source_id', 'detail_source_id', 'schedule_adapter_id', 'detail_adapter_id',
  'technical_capability_rank', 'collection_target_rank', 'public_ceiling', 'supported_observation_ranks',
  'supports_date_window', 'supports_cross_month_window', 'supports_selected_meetings',
  'supports_source_visible_horizon', 'supports_rank_upgrade_retry', 'pending_fields', 'operator_notes',
];
const expectedRunners = ['github_actions', 'local', 'reviewed_import'];
const expectedRanks = ['C', 'B', 'B+', 'A', 'A+'];
const expectedTargetRanks = ['best_available', ...expectedRanks];
const expectedStatuses = ['active', 'provisional'];
const supportFields = [
  'supports_date_window', 'supports_cross_month_window', 'supports_selected_meetings',
  'supports_source_visible_horizon', 'supports_rank_upgrade_retry',
];

if (schema?.schema_version !== 'calendar-acquisition-registry-schema-v1') fail('Acquisition Registry schema version differs.');
exactArray(schema?.required_record_fields, expectedRecordFields, 'schema.required_record_fields');
exactArray(schema?.runner_enum, expectedRunners, 'schema.runner_enum');
exactArray(schema?.rank_enum, expectedRanks, 'schema.rank_enum');
exactArray(schema?.collection_target_rank_enum, expectedTargetRanks, 'schema.collection_target_rank_enum');
exactArray(schema?.profile_status_enum, expectedStatuses, 'schema.profile_status_enum');
exactArray(schema?.scope_support_fields, supportFields, 'schema.scope_support_fields');

if (registry?.schema_version !== 'calendar-acquisition-registry-v1') fail('Acquisition Registry version differs.');
if (registry?.schema_ref !== schemaPath) fail('Acquisition Registry schema_ref differs.');
if (registry?.work_id !== 'WHR-CAL-ACQUISITION-CONTROL-PLANE') fail('Acquisition Registry Work ID differs.');
if (!Array.isArray(registry?.records)) fail('Acquisition Registry records must be an array.');

const authoritySourceKeys = new Set((authorityInventory.records ?? []).map((record) => `${record.country_id}/${record.authority_id}/${record.official_source_id}`));
const globalReadinessBySystem = new Map((readinessRegistry?.records ?? []).map((record) => [record.system_id, record]));
const japanReadinessBySystem = new Map((japanReadiness?.records ?? []).map((record) => [record.system_id, record]));
const japanPolicyBySystem = new Map((japanPolicy?.records ?? []).map((record) => [record.system_id, record]));

const adapterEvidence = new Map([
  ['jra-normalized-programme-candidate-v1', { path: 'data/candidates/japan-jra-candidates.json', marker: '"adapter_id":"jra-normalized-programme-candidate-v1"' }],
  ['nar-schedule-aware-month-v1', { path: 'scripts/timetable/normalize-nar-schedule-aware-month.mjs', marker: 'parseNarMonthlyScheduleGrid' }],
  ['nar-monthly-detail-candidate-v1', { path: 'scripts/timetable/collect-nar-monthly-candidates.mjs', marker: '--allow-blockers' }],
  ['japan-banei-dry-run-adapter', { path: 'data/candidates/japan-banei-candidates.json', marker: '"source_adapter_id": "japan-banei-dry-run-adapter"' }],
  ['banei-nar-race-list-detail-v1', { path: 'data/fixtures/calendar-banei-live-smoke-evidence-v1.json', marker: '"adapter_id": "banei-nar-race-list-detail-v1"' }],
  ['hong-kong-hkjc-dry-run-adapter', { path: 'data/candidates/hong-kong-hkjc-candidates.json', marker: '"source_adapter_id": "hong-kong-hkjc-dry-run-adapter"' }],
  ['hkjc-fixture-artifact-bridge-v1', { path: 'scripts/timetable/hkjc-fixture-artifact-bridge-core.mjs', marker: "const ADAPTER_ID = 'hkjc-fixture-artifact-bridge-v1'" }],
  ['uae-era-pdf-grid-actions-v1', { path: 'scripts/timetable/uae-era-pdf-grid-candidate-core.mjs', marker: "const ADAPTER_ID = 'uae-era-pdf-grid-actions-v1'" }],
]);

function approvedCeilingFor(record) {
  if (record.country_id === 'japan') return japanPolicyBySystem.get(record.system_id)?.public_ceiling ?? null;
  return globalReadinessBySystem.get(record.system_id)?.public_ceiling ?? null;
}
function reviewedTechnicalRankFor(record) {
  if (record.country_id === 'japan') return japanReadinessBySystem.get(record.system_id)?.technical_rank ?? null;
  return globalReadinessBySystem.get(record.system_id)?.technical_rank ?? null;
}

function validateProfile(record, label, { policyCeilingOverride = null } = {}) {
  const localErrors = [];
  const push = (message) => localErrors.push(`${label}: ${message}`);
  if (!isObject(record)) return [`${label}: must be an object.`];

  for (const field of expectedRecordFields) if (!Object.hasOwn(record, field)) push(`missing ${field}`);
  for (const key of Object.keys(record)) if (!expectedRecordFields.includes(key)) push(`unexpected field ${key}`);
  for (const field of ['system_id', 'country_id', 'authority_id', 'operator_notes']) if (!nonEmptyString(record[field])) push(`${field} must be a non-empty string`);
  if (!expectedStatuses.includes(record.profile_status)) push(`unknown profile_status ${record.profile_status}`);
  if (!expectedRunners.includes(record.primary_runner)) push(`unknown or missing primary_runner ${record.primary_runner}`);
  if (record.fallback_runner !== null && !expectedRunners.includes(record.fallback_runner)) push(`unknown fallback_runner ${record.fallback_runner}`);
  if (record.fallback_runner !== null && record.fallback_runner === record.primary_runner) push('fallback_runner must differ from primary_runner');

  for (const field of ['schedule_source_id', 'detail_source_id', 'schedule_adapter_id', 'detail_adapter_id']) {
    if (record[field] !== null && !nonEmptyString(record[field])) push(`${field} must be a non-empty string or null`);
  }
  if (!expectedRanks.includes(record.technical_capability_rank)) push(`invalid technical_capability_rank ${record.technical_capability_rank}`);
  if (!expectedTargetRanks.includes(record.collection_target_rank)) push(`invalid collection_target_rank ${record.collection_target_rank}`);
  if (!expectedRanks.includes(record.public_ceiling)) push(`invalid public_ceiling ${record.public_ceiling}`);
  if (rankOrder.has(record.collection_target_rank) && rankOrder.has(record.technical_capability_rank)
    && rankOrder.get(record.collection_target_rank) > rankOrder.get(record.technical_capability_rank)) push('collection_target_rank exceeds technical_capability_rank');
  if (rankOrder.has(record.public_ceiling) && rankOrder.has(record.technical_capability_rank)
    && rankOrder.get(record.public_ceiling) > rankOrder.get(record.technical_capability_rank)) push('public_ceiling exceeds technical_capability_rank');

  const policyCeiling = policyCeilingOverride ?? approvedCeilingFor(record);
  if (policyCeiling && rankOrder.has(record.public_ceiling) && rankOrder.has(policyCeiling)
    && rankOrder.get(record.public_ceiling) > rankOrder.get(policyCeiling)) push(`public_ceiling exceeds approved policy ceiling ${policyCeiling}`);

  if (!Array.isArray(record.supported_observation_ranks) || record.supported_observation_ranks.length === 0) push('supported_observation_ranks must be a non-empty array');
  else {
    if (new Set(record.supported_observation_ranks).size !== record.supported_observation_ranks.length) push('supported_observation_ranks contains duplicates');
    for (const rank of record.supported_observation_ranks) {
      if (!expectedRanks.includes(rank)) push(`unsupported observation rank ${rank}`);
      else if (rankOrder.has(record.technical_capability_rank) && rankOrder.get(rank) > rankOrder.get(record.technical_capability_rank)) push(`observation rank ${rank} exceeds technical capability`);
    }
  }
  for (const field of supportFields) if (typeof record[field] !== 'boolean') push(`${field} must be boolean`);
  if (!Array.isArray(record.pending_fields) || new Set(record.pending_fields).size !== record.pending_fields.length) push('pending_fields must be a unique array');
  else for (const field of record.pending_fields) if (!pendingCapableFields.has(field)) push(`unsupported pending field ${field}`);

  const operationalFields = ['schedule_source_id', 'detail_source_id', 'schedule_adapter_id', 'detail_adapter_id'];
  if (record.profile_status === 'active') {
    for (const field of operationalFields) if (record[field] === null) push(`active profile requires ${field}`);
    if (record.pending_fields?.length) push('active profile must not retain pending_fields');
  }
  if (record.profile_status === 'provisional') {
    for (const field of pendingCapableFields) if (record[field] === null && !record.pending_fields?.includes(field)) push(`null ${field} must be listed in pending_fields`);
  }

  for (const field of ['schedule_source_id', 'detail_source_id']) {
    const sourceId = record[field];
    if (sourceId !== null) {
      const key = `${record.country_id}/${record.authority_id}/${sourceId}`;
      if (!authoritySourceKeys.has(key)) push(`${field} does not resolve authority/source key ${key}`);
    }
  }
  for (const field of ['schedule_adapter_id', 'detail_adapter_id']) {
    const adapterId = record[field];
    if (adapterId === null) continue;
    const evidence = adapterEvidence.get(adapterId);
    if (!evidence) push(`${field} has no reviewed adapter evidence mapping for ${adapterId}`);
    else if (!readText(evidence.path).includes(evidence.marker)) push(`${field} adapter evidence marker missing for ${adapterId}`);
  }

  if (record.supports_selected_meetings) {
    if (record.profile_status !== 'active' || record.schedule_adapter_id === null || record.detail_adapter_id === null) push('selected-meeting support requires an active complete adapter path');
    if (record.system_id === 'japan-nar-system') {
      const scheduleAdapter = readText('scripts/timetable/normalize-nar-schedule-aware-month.mjs');
      const actionsCore = readText('scripts/timetable/nar-incremental-v2-actions-core.mjs');
      if (!scheduleAdapter.includes('--meeting-ids=') || !actionsCore.includes('selected_meetings')) push('NAR selected-meeting adapter evidence is missing');
    } else if (record.system_id === 'japan-banei-system') {
      const selectedEvidence = readText('data/fixtures/calendar-banei-runner-selected-evidence-v1.json');
      const detailCollector = readText('scripts/timetable/collect-banei-detail-window.mjs');
      if (!selectedEvidence.includes('\"scope_mode\": \"selected_meetings\"')
        || !selectedEvidence.includes('\"selected_detail_live_success\": true')
        || !detailCollector.includes('--meeting-ids=')) {
        push('Banei selected-meeting adapter evidence is missing');
      }
    } else push(`selected-meeting adapter support is not evidenced for ${record.system_id}`);
  }
  return localErrors;
}

const seenSystems = new Set();
for (const [index, record] of (registry?.records ?? []).entries()) {
  const label = `records[${index}]`;
  for (const error of validateProfile(record, label)) fail(error);
  if (seenSystems.has(record.system_id)) fail(`${label}: duplicate system_id ${record.system_id}`);
  seenSystems.add(record.system_id);

  const technicalRank = reviewedTechnicalRankFor(record);
  const approvedCeiling = approvedCeilingFor(record);
  if (!technicalRank) fail(`${label}: reviewed technical rank missing for ${record.system_id}`);
  if (!approvedCeiling) fail(`${label}: reviewed public ceiling missing for ${record.system_id}`);
  if (technicalRank && record.technical_capability_rank !== technicalRank) fail(`${label}: technical capability differs from reviewed readiness`);
  if (approvedCeiling && record.public_ceiling !== approvedCeiling) fail(`${label}: public ceiling differs from reviewed policy/readiness`);
}
for (const systemId of requiredProfiles) if (!seenSystems.has(systemId)) fail(`required Acquisition Registry profile missing ${systemId}`);

try {
  const map = acquisitionProfileMapV1(registry);
  if (map.size !== registry.records.length) fail('Acquisition Registry loader map size differs.');
  for (const systemId of requiredProfiles) if (resolveAcquisitionProfileV1(registry, systemId).system_id !== systemId) fail(`loader resolution differs for ${systemId}`);
} catch (error) {
  fail(`Acquisition Registry loader failed: ${error.message}`);
}

walkKeys(registry);
for (const [file, text, phrases] of [
  [controlContractPath, controlContract, ['Acquisition Registry', 'primary_runner', 'supported_observation_ranks', 'supports_selected_meetings']],
  [implementationPlanPath, implementationPlan, ['Stage ACP-3 — Acquisition Registry', 'Banei values may remain explicitly pending', 'missing primary runner']],
  [machineContractPath, machineContract, ['data/static/calendar-acquisition-registry.schema.json', 'data/static/calendar-acquisition-registry.json', 'japan-jra-system', 'japan-nar-system', 'japan-banei-system']],
]) for (const phrase of phrases) if (!text.includes(phrase)) fail(`${file} must include ${phrase}.`);

const narProfile = registry.records.find((record) => record.system_id === 'japan-nar-system');
if (narProfile?.primary_runner !== 'github_actions' || narProfile?.fallback_runner !== 'local') fail('NAR runner profile must be github_actions primary with local fallback.');
const jraProfile = registry.records.find((record) => record.system_id === 'japan-jra-system');
if (jraProfile?.primary_runner !== 'local') fail('JRA primary runner must remain local.');
const baneiProfile = registry.records.find((record) => record.system_id === 'japan-banei-system');
if (baneiProfile?.profile_status !== 'active'
  || baneiProfile?.primary_runner !== 'github_actions'
  || baneiProfile?.fallback_runner !== 'reviewed_import'
  || baneiProfile?.detail_source_id !== 'nar-banei-race-list-deba-table'
  || baneiProfile?.detail_adapter_id !== 'banei-nar-race-list-detail-v1'
  || baneiProfile?.supports_date_window !== true
  || baneiProfile?.supports_selected_meetings !== true
  || baneiProfile?.supports_rank_upgrade_retry !== true) {
  fail('Banei active runner profile must preserve GitHub Actions primary routing, reviewed-import fallback, evidence-backed detail source/adapter, date-window, selected-meeting, and rank-retry support.');
}
const hkjcProfile = registry.records.find((record) => record.system_id === 'hong-kong-hkjc-system');
if (hkjcProfile?.profile_status !== 'provisional' || hkjcProfile?.primary_runner !== 'github_actions' || hkjcProfile?.fallback_runner !== null) fail('HKJC provisional profile must preserve evidence-backed Actions schedule routing and no unproven fallback runner.');
if (!hkjcProfile?.pending_fields?.includes('fallback_runner')) fail('HKJC provisional profile must keep fallback_runner pending until runner compatibility evidence exists.');
if (hkjcProfile?.detail_source_id !== null || hkjcProfile?.detail_adapter_id !== null) fail('HKJC provisional profile must not claim implemented detail acquisition.');
if (JSON.stringify(hkjcProfile?.supported_observation_ranks) !== JSON.stringify(['C'])) fail('HKJC provisional profile must remain C-only until detail route evidence succeeds.');

const uaeProfile = registry.records.find((record) => record.system_id === 'uae-national-racing-system');
if (uaeProfile?.profile_status !== 'provisional' || uaeProfile?.primary_runner !== 'github_actions' || uaeProfile?.fallback_runner !== null) fail('UAE provisional profile must preserve evidence-backed Actions schedule routing and no fallback runner.');
if (uaeProfile?.schedule_source_id !== 'era-season-calendar' || uaeProfile?.schedule_adapter_id !== 'uae-era-pdf-grid-actions-v1') fail('UAE provisional profile must preserve the evidence-backed ERA PDF grid schedule route.');
if (uaeProfile?.detail_source_id !== null || uaeProfile?.detail_adapter_id !== null) fail('UAE provisional profile must not claim detail acquisition.');
if (JSON.stringify(uaeProfile?.supported_observation_ranks) !== JSON.stringify(['C'])) fail('UAE provisional profile must remain C-only.');
if (uaeProfile?.supports_source_visible_horizon !== true || uaeProfile?.supports_date_window !== false || uaeProfile?.supports_selected_meetings !== false || uaeProfile?.supports_rank_upgrade_retry !== false) fail('UAE profile scope support must remain source-visible-horizon only.');

const negativeBase = structuredClone(narProfile);
const negativeCases = [
  ['unknown runner', { ...negativeBase, primary_runner: 'remote_magic' }, {}],
  ['impossible rank', { ...negativeBase, technical_capability_rank: 'S' }, {}],
  ['target above capability', { ...negativeBase, technical_capability_rank: 'B', collection_target_rank: 'A' }, {}],
  ['public ceiling above policy', { ...negativeBase, public_ceiling: 'A+' }, { policyCeilingOverride: 'A' }],
  ['selected meeting without adapter', { ...negativeBase, detail_adapter_id: null, supports_selected_meetings: true }, {}],
  ['missing primary runner', { ...negativeBase, primary_runner: null }, {}],
];
for (const [name, profile, options] of negativeCases) if (validateProfile(profile, `negative:${name}`, options).length === 0) fail(`negative contract case unexpectedly passed: ${name}`);

if (errors.length) {
  console.error(`CALENDAR_ACQUISITION_REGISTRY: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_ACQUISITION_REGISTRY: pass');
console.log(`PROFILES: ${registry.records.length}`);
console.log(`ACTIVE_PROFILES: ${registry.records.filter((record) => record.profile_status === 'active').length}`);
console.log(`PROVISIONAL_PROFILES: ${registry.records.filter((record) => record.profile_status === 'provisional').length}`);
console.log('REQUIRED_SYSTEMS: japan-jra-system,japan-nar-system,japan-banei-system,hong-kong-hkjc-system,uae-national-racing-system');
console.log('NAR_RUNNER_PROFILE: github_actions primary / local fallback');
console.log('HKJC_PROFILE: provisional / github_actions schedule primary / fallback pending / detail pending / C-only');
console.log('UAE_PROFILE: provisional / github_actions schedule primary / source-visible-horizon only / C-only');
console.log('BANEI_RUNNER_PROFILE: github_actions primary / reviewed_import fallback / date-window+selected+rank-retry enabled');
