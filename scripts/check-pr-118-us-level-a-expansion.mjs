import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();

function fail(message) {
  console.error(`[pr-118-us-level-a-expansion] ${message}`);
  process.exit(1);
}

function run(command) {
  const result = spawnSync('node', [command], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    fail(`${command} failed.`);
  }
}

function readJson(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) fail(`Missing file: ${relativePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

run('scripts/generate-pr-114-equibase-level-a.mjs');
run('scripts/generate-pr-115-usta-level-a.mjs');
run('scripts/generate-pr-116-aqha-level-a.mjs');

const sources = [
  {
    label: 'Equibase',
    groupId: 'equibase-thoroughbred',
    path: 'data/generated/timetable/pr-114-equibase-level-a.json'
  },
  {
    label: 'USTA',
    groupId: 'usta-harness',
    path: 'data/generated/timetable/pr-115-usta-level-a.json'
  },
  {
    label: 'AQHA',
    groupId: 'aqha-quarter-horse',
    path: 'data/generated/timetable/pr-116-aqha-level-a.json'
  }
];

for (const source of sources) {
  const data = readJson(source.path);
  if (!Array.isArray(data.records)) fail(`${source.label}: records must be an array.`);
  if (data.records.length < 3) fail(`${source.label}: expected at least three Level A records.`);

  const racecourses = new Set();
  for (const record of data.records) {
    if (record.country_id !== 'united-states') fail(`${source.label}: country_id must be united-states.`);
    if (record.group_id !== source.groupId) fail(`${source.label}: unexpected group_id ${record.group_id}.`);
    if (record.data_level !== 'A') fail(`${source.label}: all records must be Level A.`);
    if (!Array.isArray(record.races) || record.races.length < 3) fail(`${source.label}: each record needs full race rows.`);
    if (record.first_race_time !== record.races[0].race_time) fail(`${source.label}: first race time mismatch.`);
    racecourses.add(record.racecourse);
  }

  if (racecourses.size < 3) fail(`${source.label}: expected at least three unique racecourses.`);
}

console.log('[pr-118-us-level-a-expansion] PASS: US Level A records expanded across all three source families.');
