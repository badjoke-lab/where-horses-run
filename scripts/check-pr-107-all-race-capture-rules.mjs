import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const rulesPath = path.join(root, 'data/static/pr-107-all-race-capture-rules.json');
const indexPath = path.join(root, 'data/static/pr-107-best-available-timetable-index.json');

function fail(message) {
  console.error(`[pr-107-best-available-capture-rules] ${message}`);
  process.exit(1);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) fail(`Missing file: ${path.relative(root, filePath)}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assertTrue(value, message) {
  if (value !== true) fail(message);
}

const rules = readJson(rulesPath);
const index = readJson(indexPath);

for (const key of [
  'keep_best_available_official_data',
  'annual_fixture_rows_are_level_c',
  'rolling_or_racecard_rows_can_promote_records',
  'level_a_requires_all_race_times',
  'level_b_requires_first_race_time',
  'level_c_requires_meeting_date_and_racecourse',
  'level_d_requires_official_source_url',
  'lower_levels_must_not_be_displayed_as_level_a'
]) {
  assertTrue(rules.rules?.[key], `Rule must be true: ${key}`);
}

if (rules.annual_fixture_policy?.data_level !== 'C') {
  fail('Annual fixture rows must enter as Level C.');
}
if (rules.annual_fixture_policy?.must_be_overridden_by_rolling_or_racecard_when_available !== true) {
  fail('Annual fixtures must be overridden by rolling/racecard data when available.');
}

for (const key of [
  'annual_fixture_stale_after_days',
  'rolling_fixture_stale_after_days',
  'racecard_daily_info_stale_after_days'
]) {
  if (!Number.isInteger(rules.update_policy?.[key]) || rules.update_policy[key] <= 0) {
    fail(`Update policy must define a positive integer for ${key}.`);
  }
}

if (rules.target_scope?.countries !== 13) fail('Target country count must remain 13.');
if (rules.target_scope?.active_groups !== 24) fail('Target active group count must remain 24.');
if (rules.target_scope?.legacy_groups !== 1) fail('Target legacy group count must remain 1.');

if (!Array.isArray(index.source_files) || index.source_files.length < 18) {
  fail('Index must list all PR-107 batch/source files.');
}

for (const file of index.source_files) {
  const filePath = path.join(root, file);
  readJson(filePath);
}

if (index.annual_fixture_policy?.annual_or_season_fixture_records_enter_as !== 'C') {
  fail('Index must keep annual or season fixtures as Level C.');
}
if (index.annual_fixture_policy?.rolling_or_racecard_overrides_annual !== true) {
  fail('Index must define rolling/racecard override behavior.');
}
if (index.current_snapshot?.countries_represented !== 13) {
  fail('Index must represent all 13 countries.');
}

console.log(`[pr-107-best-available-capture-rules] PASS: ${index.source_files.length} source files indexed with best-available rules.`);
