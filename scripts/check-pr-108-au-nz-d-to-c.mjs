import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dataPath = path.join(root, 'data/static/pr-108-au-nz-d-to-c-batch-001.json');

function fail(message) {
  console.error(`[pr-108-au-nz-d-to-c] ${message}`);
  process.exit(1);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) fail(`Missing file: ${path.relative(root, filePath)}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const data = readJson(dataPath);

if (data.schema_version !== 'pr-108-au-nz-d-to-c-batch-001-v0') {
  fail('Unexpected schema_version.');
}

if (!Array.isArray(data.records) || data.records.length < 1) {
  fail('records must be a non-empty array.');
}

const expectedGroups = new Set([
  'racing-australia-thoroughbred',
  'hrnz-harness',
  'loveracing-thoroughbred'
]);
const seenGroups = new Set();
const seenLevels = new Set();

for (const record of data.records) {
  if (!record.record_id) fail('record_id is required.');
  if (!record.country_id) fail(`${record.record_id}: country_id is required.`);
  if (!record.group_id) fail(`${record.record_id}: group_id is required.`);
  if (!record.data_level) fail(`${record.record_id}: data_level is required.`);
  if (!['A', 'B', 'C'].includes(record.data_level)) {
    fail(`${record.record_id}: PR-108 promotion records must be A, B, or C, not ${record.data_level}.`);
  }
  if (!record.promotes_from || !record.promotes_from.startsWith('pr107-')) {
    fail(`${record.record_id}: promotes_from must reference a PR-107 source target.`);
  }
  if (!record.racecourse) fail(`${record.record_id}: racecourse is required for promoted records.`);
  if (!record.meeting_date || !/^\d{4}-\d{2}-\d{2}$/.test(record.meeting_date)) {
    fail(`${record.record_id}: meeting_date must be YYYY-MM-DD.`);
  }
  if (!record.source_url) fail(`${record.record_id}: source_url is required.`);
  if (!record.source_type) fail(`${record.record_id}: source_type is required.`);
  if (!record.source_capture_date) fail(`${record.record_id}: source_capture_date is required.`);
  if (!record.last_checked) fail(`${record.record_id}: last_checked is required.`);

  if (record.data_level === 'A') {
    if (!record.first_race_time) fail(`${record.record_id}: Level A requires first_race_time.`);
    if (!Array.isArray(record.races) || record.races.length < 2) {
      fail(`${record.record_id}: Level A requires multiple race rows.`);
    }
    for (const race of record.races) {
      if (!Number.isInteger(race.race_number)) fail(`${record.record_id}: race_number must be integer.`);
      if (!race.race_time) fail(`${record.record_id}: race_time is required for each Level A race.`);
      if (!race.race_name_or_label) fail(`${record.record_id}: race_name_or_label is required for each Level A race.`);
    }
  }

  if (record.data_level === 'C') {
    if (record.first_race_time !== null) fail(`${record.record_id}: Level C first_race_time must be null.`);
    if (!Array.isArray(record.races) || record.races.length !== 0) {
      fail(`${record.record_id}: Level C races must be an empty array.`);
    }
  }

  seenGroups.add(record.group_id);
  seenLevels.add(record.data_level);
}

for (const group of expectedGroups) {
  if (!seenGroups.has(group)) fail(`Missing promoted group: ${group}`);
}

if (!seenLevels.has('C')) fail('PR-108 must include Level C promoted records.');
if (!seenLevels.has('A')) fail('PR-108 should include at least one A record when all race times were captured.');

if (!Array.isArray(data.source_evidence_summary) || data.source_evidence_summary.length < 3) {
  fail('source_evidence_summary must include official source evidence notes.');
}

console.log(`[pr-108-au-nz-d-to-c] PASS: ${data.records.length} records across ${seenGroups.size} promoted groups.`);
