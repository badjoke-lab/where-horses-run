import fs from 'node:fs';
import path from 'node:path';
import { loadAuthoritySourceInventoryV1, authoritySourceInventoryPathsV1 } from './timetable/load-authority-source-inventory.mjs';
import { loadCalendarAcquisitionRegistryV1 } from './timetable/load-calendar-acquisition-registry.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const registry = loadCalendarAcquisitionRegistryV1(root);
const inventory = loadAuthoritySourceInventoryV1(root);
const evidence = readJson('data/fixtures/calendar-banei-live-smoke-evidence-v1.json');
const duePolicy = readJson('data/static/calendar-due-job-policy-v1.json');
const baneiProfile = registry.records.find((record) => record.system_id === 'japan-banei-system');
const sourceRecord = inventory.records.find((record) =>
  record.country_id === 'japan'
  && record.authority_id === 'banei-tokachi'
  && record.official_source_id === 'nar-banei-race-list-deba-table');

if (authoritySourceInventoryPathsV1.banei_detail !== 'data/static/authority-source-inventory-banei-detail-v1.json') {
  fail('Banei detail inventory supplement loader path differs.');
}
if (!sourceRecord) fail('Banei detail Authority Source Inventory record missing.');
else {
  if (sourceRecord.source_status !== 'verified') fail('Banei detail source_status must be verified.');
  if (sourceRecord.capability_rank !== 'A+') fail('Banei detail source capability rank must be A+.');
  if (sourceRecord.source_kind !== 'programme') fail('Banei detail source kind must be programme.');
  if (sourceRecord.official_source_url !== 'https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList') fail('Banei detail official source URL differs.');
  if (sourceRecord.last_checked_date !== '2026-07-09') fail('Banei detail last_checked_date differs.');
}

if (evidence.schema_version !== 'calendar-banei-live-smoke-evidence-v1') fail('Banei live evidence schema differs.');
if (evidence.source_id !== 'nar-banei-race-list-deba-table') fail('Banei live evidence source differs.');
if (evidence.adapter_id !== 'banei-nar-race-list-detail-v1') fail('Banei live evidence adapter differs.');
if (evidence.observed_rank !== 'A+') fail('Banei live evidence rank must be A+.');
if (evidence.race_row_count !== 12) fail(`Banei live evidence row count differs: ${evidence.race_row_count}`);
if (evidence.coverage.claim !== 'source_window_complete') fail('Banei live evidence coverage must be source_window_complete.');
if (evidence.coverage.records_discovered !== 1 || evidence.coverage.records_updated !== 1) fail('Banei live evidence record counts differ.');
if (evidence.coverage.unresolved_meeting_count !== 0 || evidence.coverage.source_error_count !== 0) fail('Banei live evidence must have zero unresolved meetings and source errors.');
if (evidence.runner_evidence.environment !== 'github_actions' || evidence.runner_evidence.scope_mode !== 'date_window') fail('Banei live runner/date-window evidence differs.');
if (evidence.runner_evidence.meetings_targeted !== 1 || evidence.runner_evidence.complete_a_plus_candidates !== 1 || evidence.runner_evidence.blocked_meetings !== 0) fail('Banei live execution counts differ.');
if (!Object.values(evidence.row_semantics).every((value) => value === true)) fail('Banei live row semantics must all be true.');

if (!baneiProfile) fail('Banei Acquisition Registry profile missing.');
else {
  if (baneiProfile.profile_status !== 'provisional') fail('Banei profile must remain provisional.');
  if (baneiProfile.primary_runner !== 'reviewed_import') fail('Banei primary runner must remain reviewed_import.');
  if (baneiProfile.fallback_runner !== null) fail('Banei fallback runner must remain null.');
  if (baneiProfile.schedule_source_id !== 'banei-official-schedule') fail('Banei schedule source differs.');
  if (baneiProfile.schedule_adapter_id !== 'japan-banei-dry-run-adapter') fail('Banei schedule adapter differs.');
  if (baneiProfile.detail_source_id !== 'nar-banei-race-list-deba-table') fail('Banei detail source activation differs.');
  if (baneiProfile.detail_adapter_id !== 'banei-nar-race-list-detail-v1') fail('Banei detail adapter activation differs.');
  if (!exact(baneiProfile.supported_observation_ranks, ['B', 'A+'])) fail(`Banei supported ranks differ: ${JSON.stringify(baneiProfile.supported_observation_ranks)}`);
  if (baneiProfile.supports_date_window !== true) fail('Banei date-window support must be true.');
  if (baneiProfile.supports_cross_month_window !== false) fail('Banei cross-month support must remain false.');
  if (baneiProfile.supports_selected_meetings !== false) fail('Banei selected-meeting support must remain false.');
  if (baneiProfile.supports_source_visible_horizon !== false) fail('Banei source-visible-horizon support must remain false.');
  if (baneiProfile.supports_rank_upgrade_retry !== false) fail('Banei rank-upgrade retry must remain false.');
  if (!exact(baneiProfile.pending_fields, ['fallback_runner'])) fail(`Banei pending_fields differ: ${JSON.stringify(baneiProfile.pending_fields)}`);
}

const baneiPolicy = duePolicy.system_rules.find((rule) => rule.system_id === 'japan-banei-system');
if (!baneiPolicy) fail('Banei Due-job policy missing.');
else {
  if (baneiPolicy.enabled !== false) fail('Banei Due-job policy must remain disabled.');
  if (baneiPolicy.regular_refresh.enabled !== false) fail('Banei automatic regular refresh must remain disabled.');
  if (baneiPolicy.coverage_gap.enabled !== false) fail('Banei automatic coverage-gap planning must remain disabled.');
  if (baneiPolicy.source_revalidation.enabled !== false) fail('Banei automatic source revalidation must remain disabled.');
  if (baneiPolicy.rank_retry.enabled !== false) fail('Banei automatic rank retry must remain disabled.');
}

const registryChecker = readText('scripts/check-calendar-acquisition-registry.mjs');
for (const phrase of [
  "['banei-nar-race-list-detail-v1'",
  "detail_source_id !== 'nar-banei-race-list-deba-table'",
  "detail_adapter_id !== 'banei-nar-race-list-detail-v1'",
  'BANEI_DETAIL_PROFILE: live-evidence-backed detail source/adapter',
]) {
  if (!registryChecker.includes(phrase)) fail(`Acquisition Registry checker missing Banei activation marker: ${phrase}`);
}

const docs = readText('docs/calendar/banei-detail-registry-activation.md');
for (const phrase of [
  'bounded GitHub Actions date-window live run',
  'race rows: 12',
  'source_window_complete',
  'profile_status: provisional',
  'supports_date_window: true',
  'supports_selected_meetings: false',
  'supports_rank_upgrade_retry: false',
  'Due-job Planner Banei policy also remains disabled',
]) {
  if (!docs.includes(phrase)) fail(`Banei Registry activation contract missing ${phrase}.`);
}

const serialized = JSON.stringify({ sourceRecord, baneiProfile }).toLowerCase();
for (const forbidden of ['horse_name', 'jockey_name', 'trainer_name', 'odds', 'payout', 'prediction', 'raw_html', 'source_body', 'stream_url']) {
  if (serialized.includes(`\"${forbidden}\"`)) fail(`forbidden activation key present: ${forbidden}`);
}

if (errors.length) {
  console.error(`CALENDAR_BANEI_DETAIL_REGISTRY_ACTIVATION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('CALENDAR_BANEI_DETAIL_REGISTRY_ACTIVATION: pass');
console.log('DETAIL_SOURCE: nar-banei-race-list-deba-table');
console.log('DETAIL_ADAPTER: banei-nar-race-list-detail-v1');
console.log('OBSERVATION_RANKS: B,A+');
console.log('DATE_WINDOW: enabled');
console.log('SELECTED_MEETINGS: disabled');
console.log('RANK_RETRY: disabled');
console.log('DUE_JOB_POLICY: disabled');
console.log('PROFILE_STATUS: provisional');
