import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();

function fail(message) {
  console.error(`[timetable-refresh-skeleton] ${message}`);
  process.exit(1);
}

function readJson(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assertFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) fail(`Missing file: ${relativePath}`);
}

const registry = readJson('data/source-registry/major-country-sources.json');

if (registry.schema_version !== 'major-country-source-registry-v0') fail('Unexpected registry schema_version.');
if (!Array.isArray(registry.sources) || registry.sources.length < 25) fail('Registry must contain active and legacy source rows.');
if (registry.expected_counts?.countries !== 13) fail('Registry must keep 13 countries.');
if (registry.expected_counts?.active_groups !== 24) fail('Registry must keep 24 active groups.');
if (registry.expected_counts?.legacy_groups !== 1) fail('Registry must keep 1 legacy group.');

const countries = new Set(registry.sources.map((source) => source.country_id));
const activeGroups = new Set(registry.sources.filter((source) => source.status === 'active').map((source) => `${source.country_id}/${source.group_id}`));
const legacyGroups = new Set(registry.sources.filter((source) => source.status === 'legacy').map((source) => `${source.country_id}/${source.group_id}`));

if (countries.size !== 13) fail(`Expected 13 countries, got ${countries.size}.`);
if (activeGroups.size !== 24) fail(`Expected 24 active groups, got ${activeGroups.size}.`);
if (legacyGroups.size !== 1) fail(`Expected 1 legacy group, got ${legacyGroups.size}.`);

const allowedKinds = new Set(['annual', 'rolling', 'racecard']);
const allowedTargets = new Set(['A', 'B', 'C', 'E']);

for (const source of registry.sources) {
  for (const key of ['country_id', 'group_id', 'status', 'source_kind', 'url', 'parser', 'target_level', 'refresh_cadence']) {
    if (!source[key]) fail(`Source row missing ${key}: ${JSON.stringify(source)}`);
  }
  if (!['active', 'legacy'].includes(source.status)) fail(`Invalid source status: ${source.status}`);
  if (!allowedKinds.has(source.source_kind)) fail(`Invalid source_kind: ${source.source_kind}`);
  if (!allowedTargets.has(source.target_level)) fail(`Invalid target_level: ${source.target_level}`);
  if (!/^https:\/\//.test(source.url)) fail(`Source URL must be https: ${source.url}`);
}

for (const file of [
  'scripts/timetable/refresh-core.mjs',
  'scripts/timetable/refresh-annual.mjs',
  'scripts/timetable/refresh-rolling.mjs',
  'scripts/timetable/refresh-race-times.mjs',
  'scripts/timetable/promote-timetable.mjs',
  'scripts/timetable/archive-completed.mjs',
  'scripts/timetable/refresh-all.mjs',
  'scripts/timetable/build-current-timetable.mjs',
  'scripts/timetable/generate-update-report.mjs'
]) {
  assertFile(file);
}

const commands = [
  ['node', ['scripts/timetable/refresh-annual.mjs']],
  ['node', ['scripts/timetable/refresh-rolling.mjs']],
  ['node', ['scripts/timetable/refresh-race-times.mjs']],
  ['node', ['scripts/timetable/promote-timetable.mjs']],
  ['node', ['scripts/timetable/archive-completed.mjs']],
  ['node', ['scripts/timetable/build-current-timetable.mjs']],
  ['node', ['scripts/timetable/generate-update-report.mjs']],
  ['node', ['scripts/timetable/refresh-all.mjs']]
];

for (const [cmd, args] of commands) {
  const result = spawnSync(cmd, args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    fail(`Command failed: ${cmd} ${args.join(' ')}`);
  }
}

const current = readJson('data/generated/timetable/current.json');
const report = readJson('data/generated/timetable/update-report.json');
const health = readJson('data/generated/timetable/source-health.json');
const promotion = readJson('data/generated/timetable/promotion-status.json');

if (current.schema_version !== 'current-timetable-v0') fail('current.json schema mismatch.');
if (report.schema_version !== 'timetable-update-report-v0') fail('update-report.json schema mismatch.');
if (health.schema_version !== 'timetable-source-health-v0') fail('source-health.json schema mismatch.');
if (promotion.schema_version !== 'timetable-promotion-status-v0') fail('promotion-status.json schema mismatch.');
if (report.mode !== 'skeleton_no_live_fetch') fail('PR-109 must remain skeleton_no_live_fetch.');
if (current.mode !== 'skeleton_no_live_fetch') fail('current.json must remain skeleton_no_live_fetch.');

console.log(`[timetable-refresh-skeleton] PASS: ${countries.size} countries, ${activeGroups.size} active groups, ${legacyGroups.size} legacy group, ${registry.sources.length} source rows.`);
