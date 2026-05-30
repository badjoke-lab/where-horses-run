import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const rulesPath = path.join(root, 'data/static/pr-107-all-race-capture-rules.json');
const timetablePath = path.join(root, 'data/static/major-country-timetable-v0.json');

function fail(message) {
  console.error(`[pr-107-all-race-capture-rules] ${message}`);
  process.exit(1);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) fail(`Missing file: ${path.relative(root, filePath)}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const rules = readJson(rulesPath);
const timetable = readJson(timetablePath);

for (const key of [
  'fixture_only_is_not_enough',
  'annual_calendar_only_is_not_enough',
  'source_link_only_is_not_enough',
  'first_race_time_only_is_not_enough',
  'confirmed_record_requires_all_races'
]) {
  if (rules.rules?.[key] !== true) fail(`Rule must be true: ${key}`);
}

if (rules.target_scope?.countries !== 13) fail('Target country count must remain 13.');
if (rules.target_scope?.active_groups !== 24) fail('Target active group count must remain 24.');
if (rules.target_scope?.legacy_groups !== 1) fail('Target legacy group count must remain 1.');

const confirmed = (timetable.records || []).filter((record) => record.display_status === 'confirmed_times');
if (confirmed.length === 0) fail('Expected at least one confirmed record to audit.');

const incompleteConfirmed = confirmed.filter((record) => {
  if (!record.first_race_time) return true;
  if (!Array.isArray(record.races)) return true;
  if (record.races.length <= 1) return true;
  return record.races.some((race) => !race.race_number || !race.race_time || !race.race_name_or_label);
});

if (incompleteConfirmed.length > 0) {
  const ids = incompleteConfirmed.map((record) => record.timetable_id || record.record_id || `${record.country_id}/${record.group_id}/${record.meeting_date}/${record.racecourse}`);
  fail(`Confirmed records must contain all official race rows, not only first-race/one-row data: ${ids.join(', ')}`);
}

console.log(`[pr-107-all-race-capture-rules] PASS: audited ${confirmed.length} confirmed records for all-race structure.`);
