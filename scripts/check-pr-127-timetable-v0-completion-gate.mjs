import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const expectedCountries = [
  'japan',
  'hong-kong',
  'united-arab-emirates',
  'united-kingdom',
  'ireland',
  'france',
  'australia',
  'new-zealand',
  'canada',
  'south-africa',
  'south-korea',
  'singapore',
  'united-states'
];

function fail(message) {
  console.error(`[pr-127-v0-gate] ${message}`);
  process.exit(1);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function run(script) {
  const result = spawnSync('node', [script], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    fail(`${script} failed.`);
  }
}

const registry = readJson('data/source-registry/major-country-sources.json');
if (registry.scope !== 'major-countries-timetable-v0') fail('Registry scope mismatch.');
if (registry.expected_counts?.countries !== 13) fail('Expected 13 countries.');
if (!Array.isArray(registry.sources)) fail('Registry sources must be an array.');

const countries = new Set(registry.sources.map((source) => source.country_id));
for (const countryId of expectedCountries) {
  if (!countries.has(countryId)) fail(`Missing country in source registry: ${countryId}`);
}
if (countries.size !== 13) fail(`Expected exactly 13 country ids, got ${countries.size}.`);

const activeSources = registry.sources.filter((source) => source.status === 'active');
const legacySources = registry.sources.filter((source) => source.status === 'legacy');
if (activeSources.length !== registry.expected_counts.active_groups) fail('Active group count mismatch.');
if (legacySources.length !== registry.expected_counts.legacy_groups) fail('Legacy group count mismatch.');

for (const source of registry.sources) {
  for (const key of ['country_id', 'group_id', 'status', 'source_kind', 'url', 'parser', 'target_level', 'refresh_cadence']) {
    if (!source[key]) fail(`Registry source missing ${key}.`);
  }
  if (!['annual', 'rolling', 'racecard'].includes(source.source_kind)) fail(`Unexpected source_kind ${source.source_kind}.`);
  if (!['A', 'B', 'C', 'E'].includes(source.target_level)) fail(`Unexpected target_level ${source.target_level}.`);
}

const current = readJson('data/generated/timetable/current-integrated.json');
if (current.schema_version !== 'current-timetable-integrated-v0') fail('Current timetable schema mismatch.');
if (!Array.isArray(current.records) || current.records.length < 9) fail('Current timetable records missing.');
for (const record of current.records) {
  for (const key of ['country_id', 'country_label', 'group_id', 'group_label', 'racecourse', 'meeting_date', 'first_race_time', 'all_race_times', 'source_trace', 'freshness']) {
    if (!record[key]) fail(`Current record missing ${key}.`);
  }
  if (!Array.isArray(record.all_race_times) || record.all_race_times.length < 1) fail(`${record.record_id}: all_race_times missing.`);
  if (!record.source_trace.last_checked) fail(`${record.record_id}: last_checked missing.`);
}

for (const file of [
  'src/pages/major-countries/current-timetable.astro',
  'src/components/CurrentTimetableRecords.astro',
  'src/components/CurrentTimetableDimensions.astro',
  '.github/workflows/timetable-scheduled-refresh.yml',
  'scripts/timetable/live-source-snapshot.mjs',
  'scripts/timetable/apply-live-source-snapshot.mjs',
  'scripts/check-pr-123-scheduled-refresh-foundation.mjs',
  'scripts/check-pr-124-refresh-health-report.mjs',
  'scripts/check-pr-125-refresh-output-safety-gate.mjs',
  'scripts/check-pr-126-scheduled-refresh-completion-gate.mjs'
]) {
  read(file);
}

run('scripts/check-pr-126-scheduled-refresh-completion-gate.mjs');

console.log('[pr-127-v0-gate] PASS');
