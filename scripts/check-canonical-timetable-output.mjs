import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function assertFile(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) fail(`Missing file: ${relativePath}`);
}

for (const file of [
  'scripts/timetable/build-canonical-timetable.mjs',
  'data/generated/timetable/canonical/meetings.json',
  'data/generated/timetable/canonical/meeting-details.json',
  'PR-242.md'
]) {
  assertFile(file);
}

const buildScript = read('scripts/timetable/build-canonical-timetable.mjs');
const meetings = readJson('data/generated/timetable/canonical/meetings.json');
const details = readJson('data/generated/timetable/canonical/meeting-details.json');
const notes = read('PR-242.md');

if (meetings.schema_version !== 'canonical-timetable-v0') fail('Unexpected canonical meetings schema_version.');
if (details.schema_version !== 'canonical-meeting-details-v0') fail('Unexpected canonical details schema_version.');

for (const source of [
  'data/generated/timetables.json',
  'data/generated/japan-active-timetable-records.json',
  'data/generated/normalized-timetable.json'
]) {
  if (!buildScript.includes(source)) fail(`Build script does not read ${source}.`);
}

for (const source of [
  'src/data/normalizedTimetableMeetingDetails.ts',
  'data/generated/timetable/hkjc-normalized-meeting-details.sample.json'
]) {
  if (!buildScript.includes(source)) fail(`Build script does not mention detail source ${source}.`);
}

const meetingIds = new Set((meetings.meetings ?? []).map((meeting) => meeting.meeting_id));
for (const id of [
  'jra-tokyo-racecourse-2026-06-06',
  'jra-tokyo-racecourse-2026-06-07',
  'nar-obihiro-racecourse-2026-06-06',
  'hkjc-sha-tin-racecourse-2026-06-07'
]) {
  if (!meetingIds.has(id)) fail(`Canonical meetings output missing ${id}.`);
}

const detailIds = new Set((details.details ?? []).map((detail) => detail.meeting_id));
for (const id of ['jra-tokyo-racecourse-2026-06-07', 'hkjc-sha-tin-racecourse-2026-06-07']) {
  if (!detailIds.has(id)) fail(`Canonical details output missing ${id}.`);
}

for (const meeting of meetings.meetings ?? []) {
  for (const field of ['meeting_id', 'country_id', 'authority_id', 'racecourse_id', 'date', 'timezone', 'capability_rank', 'display_status', 'source_trace', 'freshness']) {
    if (!(field in meeting)) fail(`${meeting.meeting_id ?? 'unknown'} missing ${field}.`);
  }
  if (!meeting.source_trace?.source_id) fail(`${meeting.meeting_id} missing source_trace.source_id.`);
  if (!meeting.source_trace?.official_source_url) fail(`${meeting.meeting_id} missing source_trace.official_source_url.`);
  if (!meeting.freshness?.last_checked_date) fail(`${meeting.meeting_id} missing freshness.last_checked_date.`);
}

for (const detail of details.details ?? []) {
  if (!['A', 'A+'].includes(detail.capability_rank)) fail(`${detail.meeting_id} detail rank must be A or A+.`);
  if (!Array.isArray(detail.timetable_rows) || detail.timetable_rows.length === 0) fail(`${detail.meeting_id} detail rows missing.`);
  for (const row of detail.timetable_rows) {
    if (!row.label || !row.post_time_local) fail(`${detail.meeting_id} detail row missing label/post_time_local.`);
  }
}

for (const token of [
  'No public view is generated.',
  'No page input is changed.',
  'Next roadmap item is PR-5 publication display policy resolver.'
]) {
  if (!notes.includes(token)) fail(`PR note missing ${token}`);
}

if (errors.length) {
  console.error('Canonical timetable output check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Canonical timetable output check passed.');
