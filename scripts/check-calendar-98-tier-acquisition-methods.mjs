import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const INDEX_PATH = path.join(ROOT, 'data/static/calendar-98-tier-acquisition-methods/index.json');
const fail = (message) => { throw new Error(`[calendar-98-tier-acquisition-methods] ${message}`); };
const assert = (condition, message) => { if (!condition) fail(message); };
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const methodClasses = new Set([
  'active_source_driven',
  'active_official',
  'status_watch',
  'annual_notice_watch',
  'explanatory_zero',
  'dormant_archive',
]);
const pageKinds = new Set(['country', 'special', 'explanatory', 'archive']);
const runnerStates = new Set(['candidate', 'status_only', 'not_applicable']);
const triggerByMethod = {
  active_source_driven: 'meeting_or_source_window',
  active_official: 'meeting_or_source_window',
  status_watch: 'official_publication_change',
  annual_notice_watch: 'current_year_official_notice',
  explanatory_zero: 'official_activation_signal',
  dormant_archive: 'official_restart_signal',
};
const zeroPolicyByMethod = {
  active_source_driven: 'emit_only_source_visible_current_meetings',
  active_official: 'emit_only_source_visible_current_meetings',
  status_watch: 'emit_zero_until_current_official_trigger',
  annual_notice_watch: 'emit_zero_until_current_year_official_notice',
  explanatory_zero: 'emit_zero_until_current_official_racing_source',
  dormant_archive: 'emit_zero_until_official_restart',
};
const runnerByMethod = {
  active_source_driven: 'candidate',
  active_official: 'candidate',
  status_watch: 'status_only',
  annual_notice_watch: 'status_only',
  explanatory_zero: 'not_applicable',
  dormant_archive: 'not_applicable',
};

assert(fs.existsSync(INDEX_PATH), `missing ${path.relative(ROOT, INDEX_PATH)}`);
const index = readJson(INDEX_PATH);
assert(index.schema_version === 'calendar-98-tier-acquisition-methods-v1', 'unexpected schema_version');
assert(index.expected_record_count === 98, 'expected_record_count must be 98');
assert(Array.isArray(index.shards) && index.shards.length > 0, 'shards must be non-empty');
assert(typeof index.tracker_ref === 'string' && index.tracker_ref.length > 0, 'tracker_ref is required');

const records = [];
for (const shardRef of index.shards) {
  assert(typeof shardRef.path === 'string' && shardRef.path.length > 0, 'shard path is required');
  assert(Array.isArray(shardRef.tier_range) && shardRef.tier_range.length === 2, `invalid tier_range for ${shardRef.path}`);
  const shardPath = path.join(ROOT, shardRef.path);
  assert(fs.existsSync(shardPath), `missing shard ${shardRef.path}`);
  const shard = readJson(shardPath);
  assert(shard.schema_version === index.schema_version, `${shardRef.path}: schema_version mismatch`);
  assert(JSON.stringify(shard.tier_range) === JSON.stringify(shardRef.tier_range), `${shardRef.path}: tier_range mismatch`);
  assert(Array.isArray(shard.records), `${shardRef.path}: records must be an array`);
  assert(shard.records.length === shardRef.record_count, `${shardRef.path}: record_count mismatch`);
  const [minTier, maxTier] = shardRef.tier_range;
  for (const record of shard.records) {
    assert(Number.isInteger(record.tier) && record.tier >= minTier && record.tier <= maxTier, `${shardRef.path}: tier ${record.tier} outside shard range`);
    records.push(record);
  }
}

assert(records.length === index.expected_record_count, `expected 98 records, found ${records.length}`);
const tierSet = new Set(records.map((record) => record.tier));
const countrySet = new Set(records.map((record) => record.country_id));
assert(tierSet.size === 98, `tier IDs must be unique; found ${tierSet.size}`);
assert(countrySet.size === 98, `country_id values must be unique; found ${countrySet.size}`);
for (let tier = 1; tier <= 98; tier += 1) assert(tierSet.has(tier), `missing tier ${tier}`);

const trackerPath = path.join(ROOT, index.tracker_ref);
assert(fs.existsSync(trackerPath), `missing tracker ${index.tracker_ref}`);
const trackerLines = fs.readFileSync(trackerPath, 'utf8').trimEnd().split(/\r?\n/);
const trackerHeader = trackerLines.shift().split('\t');
const deliveryIndex = trackerHeader.indexOf('delivery_no');
const slugIndex = trackerHeader.indexOf('slug');
assert(deliveryIndex >= 0 && slugIndex >= 0, 'tracker must contain delivery_no and slug columns');
const trackerRows = trackerLines.filter(Boolean).map((line) => line.split('\t'));
assert(trackerRows.length === 98, `tracker must contain 98 rows, found ${trackerRows.length}`);
const trackerByTier = new Map(trackerRows.map((row) => [Number(row[deliveryIndex]), row[slugIndex]]));

for (const record of records) {
  assert(typeof record.country_id === 'string' && record.country_id.length > 0, `tier ${record.tier}: country_id required`);
  assert(pageKinds.has(record.page_kind), `tier ${record.tier}: invalid page_kind ${record.page_kind}`);
  assert(methodClasses.has(record.method_class), `tier ${record.tier}: invalid method_class ${record.method_class}`);
  assert(Array.isArray(record.source_ids) && record.source_ids.length > 0, `tier ${record.tier}: source_ids required`);
  assert(new Set(record.source_ids).size === record.source_ids.length, `tier ${record.tier}: duplicate source_ids`);
  assert(record.source_ids.every((value) => typeof value === 'string' && value.length > 0), `tier ${record.tier}: invalid source_id`);
  assert(typeof record.primary_source_url === 'string' && /^https?:\/\//.test(record.primary_source_url), `tier ${record.tier}: primary_source_url must be http(s)`);
  assert(typeof record.cadence_class === 'string' && record.cadence_class.length > 0, `tier ${record.tier}: cadence_class required`);
  assert(record.trigger_class === triggerByMethod[record.method_class], `tier ${record.tier}: trigger_class does not match method_class`);
  assert(record.zero_policy === zeroPolicyByMethod[record.method_class], `tier ${record.tier}: zero_policy does not match method_class`);
  assert(runnerStates.has(record.runner_state), `tier ${record.tier}: invalid runner_state ${record.runner_state}`);
  assert(record.runner_state === runnerByMethod[record.method_class], `tier ${record.tier}: runner_state does not match method_class`);
  assert(record.method_complete === true, `tier ${record.tier}: method_complete must be true`);
  assert(trackerByTier.get(record.tier) === record.country_id, `tier ${record.tier}: tracker slug ${trackerByTier.get(record.tier)} != ${record.country_id}`);
  for (const key of Object.keys(record)) {
    assert(!key.includes('rank'), `tier ${record.tier}: rank field ${key} is forbidden in acquisition-method coverage contract`);
  }
}

console.log(`calendar 98-tier acquisition methods: ${records.length}/98 complete; ${index.shards.length} shards; tracker slugs aligned`);
