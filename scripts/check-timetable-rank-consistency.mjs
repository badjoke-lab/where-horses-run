import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const normalized = readJson('data/generated/normalized-timetable.json');
const fixes = readJson('data/audits/timetable-rank-fixes.json');
const detailSource = read('src/data/normalizedTimetableMeetingDetails.ts');
const runbook = read('docs/runbooks/timetable-rank-consistency.md');
const notes = read('PR-238.md');

if (fixes.schema_version !== 'timetable-rank-fixes-audit-v0') fail('Unexpected timetable-rank-fixes schema version.');
if (fixes.next_roadmap_item !== 'PR-3 canonical timetable model') fail('Next roadmap item must be PR-3 canonical timetable model.');

for (const record of normalized.records ?? []) {
  const rank = record.capability_rank;
  if (rank === 'B' && !record.first_race_time_local) {
    fail(`${record.meeting_id}: B requires first_race_time_local.`);
  }
  if (rank === 'B+' && (!record.first_race_time_local || !record.last_race_time_local)) {
    fail(`${record.meeting_id}: B+ requires first_race_time_local and last_race_time_local.`);
  }
  if (rank === 'A') {
    if (!record.first_race_time_local || !record.last_race_time_local) {
      fail(`${record.meeting_id}: A summary requires first and last race times.`);
    }
    if (!detailSource.includes(record.meeting_id)) {
      fail(`${record.meeting_id}: A requires a linked approved detail source.`);
    }
  }
  if (rank === 'A+') {
    fail(`${record.meeting_id}: A+ is not allowed in normalized summary records before canonical/public view migration.`);
  }
}

const expectedRepairs = new Set([
  'jra-tokyo-racecourse-2026-06-06:B:C',
  'nar-obihiro-racecourse-2026-06-06:B:C',
  'hkjc-sha-tin-racecourse-2026-06-07:B+:C'
]);
for (const repair of fixes.repairs ?? []) {
  expectedRepairs.delete(`${repair.meeting_id}:${repair.before_rank}:${repair.after_rank}`);
}
if (expectedRepairs.size) fail(`Missing expected repair entries: ${[...expectedRepairs].join(', ')}`);

for (const snippet of [
  '`C` | Meeting date and racecourse are known.',
  '`B` | `first_race_time_local` is present.',
  '`B+` | `first_race_time_local` and `last_race_time_local` are both present.',
  '`A` | Race-by-race public-safe detail rows exist',
  'Next roadmap item is PR-3 canonical timetable model.'
]) {
  if (!runbook.includes(snippet)) fail(`Runbook missing snippet: ${snippet}`);
}

for (const snippet of [
  'No canonical conversion is added.',
  'No public view generation is added.',
  'Next roadmap item is PR-3 canonical timetable model.'
]) {
  if (!notes.includes(snippet)) fail(`PR note missing snippet: ${snippet}`);
}

if (errors.length) {
  console.error('Timetable rank consistency check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Timetable rank consistency check passed.');
