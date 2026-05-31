import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outputPath = path.join(root, 'data/generated/timetable/current-integrated.json');

function run(command) {
  const result = spawnSync('node', [command], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
    throw new Error(`${command} failed`);
  }
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function groupLabel(groupId) {
  return {
    'equibase-thoroughbred': 'Equibase Thoroughbred',
    'usta-harness': 'USTA Harness',
    'aqha-quarter-horse': 'AQHA Quarter Horse'
  }[groupId] ?? groupId;
}

function normalize(record) {
  return {
    record_id: record.record_id,
    country_id: record.country_id,
    country_label: record.country_id === 'united-states' ? 'United States' : record.country_id,
    group_id: record.group_id,
    group_label: groupLabel(record.group_id),
    racecourse: record.racecourse,
    meeting_date: record.meeting_date,
    data_level: record.data_level,
    first_race_time: record.first_race_time,
    all_race_times: record.races.map((race) => ({
      race_number: race.race_number,
      race_time: race.race_time,
      race_name: race.race_name,
      distance: race.distance
    })),
    source_trace: {
      source_url: record.source_url,
      source_type: record.source_type,
      source_capture_date: record.source_capture_date,
      last_checked: record.last_checked,
      parser: record.parser,
      promotes_from: record.promotes_from
    },
    freshness: {
      status: 'sample_current',
      basis: 'fixture_source_capture_date',
      source_capture_date: record.source_capture_date,
      last_checked: record.last_checked
    }
  };
}

run('scripts/generate-pr-114-equibase-level-a.mjs');
run('scripts/generate-pr-115-usta-level-a.mjs');
run('scripts/generate-pr-116-aqha-level-a.mjs');

const inputs = [
  'data/generated/timetable/pr-114-equibase-level-a.json',
  'data/generated/timetable/pr-115-usta-level-a.json',
  'data/generated/timetable/pr-116-aqha-level-a.json'
];

const records = inputs.flatMap((input) => readJson(input).records.map(normalize));
records.sort((a, b) => [a.meeting_date, a.country_id, a.group_id, a.racecourse].join('|').localeCompare([b.meeting_date, b.country_id, b.group_id, b.racecourse].join('|')));

const output = {
  schema_version: 'current-timetable-integrated-v0',
  generated_at: '2026-05-31T00:00:00Z',
  mode: 'fixture_level_a_integration_no_live_fetch',
  source_inputs: inputs,
  display_dimensions: ['country', 'group', 'meeting_date', 'racecourse'],
  record_count: records.length,
  records
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`[current-integrated] wrote ${records.length} records`);
