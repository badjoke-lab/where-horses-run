import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SNAPSHOT_PATH = path.join(ROOT, 'data/static/calendar-98-tier-execution-coverage.json');
const fail = (message) => { throw new Error(`[calendar-98-tier-execution-coverage] ${message}`); };
const assert = (condition, message) => { if (!condition) fail(message); };
const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
const sorted = (values) => [...values].sort((a, b) => a.localeCompare(b));
const sameSet = (left, right) => JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));

assert(fs.existsSync(SNAPSHOT_PATH), 'execution coverage snapshot is missing');
const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf8'));
assert(snapshot.schema_version === 'calendar-98-tier-execution-coverage-v1', 'unexpected schema_version');

const methodIndex = readJson(snapshot.method_contract_ref);
const methodRecords = [];
for (const shard of methodIndex.shards ?? []) {
  const payload = readJson(shard.path);
  methodRecords.push(...(payload.records ?? []));
}
assert(methodRecords.length === 98, `method contract must expose 98 records, found ${methodRecords.length}`);

const registry = readJson(snapshot.execution_registry_ref);
const registryRecords = registry.records ?? [];
const registryCountryIds = new Set(registryRecords.map((record) => record.country_id));

const activeMethods = new Set(['active_source_driven', 'active_official']);
const statusMethods = new Set(['status_watch', 'annual_notice_watch']);
const noRunnerMethods = new Set(['explanatory_zero', 'dormant_archive']);

const derived = {
  registry_routed_country_ids: [],
  active_runner_gap_country_ids: [],
  status_only_country_ids: [],
  no_runner_required_country_ids: [],
};

for (const record of methodRecords) {
  if (registryCountryIds.has(record.country_id)) {
    derived.registry_routed_country_ids.push(record.country_id);
    continue;
  }
  if (activeMethods.has(record.method_class)) {
    derived.active_runner_gap_country_ids.push(record.country_id);
    continue;
  }
  if (statusMethods.has(record.method_class)) {
    derived.status_only_country_ids.push(record.country_id);
    continue;
  }
  if (noRunnerMethods.has(record.method_class)) {
    derived.no_runner_required_country_ids.push(record.country_id);
    continue;
  }
  fail(`${record.country_id}: unsupported method_class ${record.method_class}`);
}

for (const [field, values] of Object.entries(derived)) {
  assert(Array.isArray(snapshot[field]), `${field} must be an array`);
  assert(new Set(snapshot[field]).size === snapshot[field].length, `${field} must not contain duplicates`);
  assert(sameSet(snapshot[field], values), `${field} is stale relative to method contract / execution registry`);
}

const partition = [
  ...snapshot.registry_routed_country_ids,
  ...snapshot.active_runner_gap_country_ids,
  ...snapshot.status_only_country_ids,
  ...snapshot.no_runner_required_country_ids,
];
assert(partition.length === 98, `execution partition must contain 98 entries, found ${partition.length}`);
assert(new Set(partition).size === 98, 'execution partition must cover 98 unique country IDs');

const counts = snapshot.counts ?? {};
assert(counts.tier_total === 98, 'counts.tier_total must be 98');
assert(counts.registry_profile_total === registryRecords.length, `registry_profile_total must be ${registryRecords.length}`);
assert(counts.registry_routed_tiers === snapshot.registry_routed_country_ids.length, 'registry_routed_tiers count mismatch');
assert(counts.active_runner_gap_tiers === snapshot.active_runner_gap_country_ids.length, 'active_runner_gap_tiers count mismatch');
assert(counts.status_only_tiers === snapshot.status_only_country_ids.length, 'status_only_tiers count mismatch');
assert(counts.no_runner_required_tiers === snapshot.no_runner_required_country_ids.length, 'no_runner_required_tiers count mismatch');

const usNote = snapshot.policy_notes?.['united-states'] ?? '';
assert(usNote.includes('Equibase') && usNote.includes('blocked'), 'U.S. execution gap must retain the Equibase automation policy boundary');

console.log(
  `calendar 98-tier execution coverage: registry=${snapshot.registry_routed_country_ids.length}, active-runner-gap=${snapshot.active_runner_gap_country_ids.length}, status-only=${snapshot.status_only_country_ids.length}, no-runner-required=${snapshot.no_runner_required_country_ids.length}`,
);
