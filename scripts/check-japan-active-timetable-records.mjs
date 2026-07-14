import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const historicalOverlayPath = 'data/generated/japan-active-timetable-records.json';
const historicalOverlay = readJson(historicalOverlayPath);
const dataTs = read('src/lib/data.ts');
const publicViewModel = read('src/lib/timetable/publicTimetableViewModel.ts');
const publicMeetings = readJson('data/generated/timetable/public/meeting-list.json');

if (historicalOverlay.schema_version !== 'japan-active-timetable-records-v0') {
  fail('Historical Japan active timetable overlay schema_version must remain japan-active-timetable-records-v0.');
}

const historicalRecords = historicalOverlay.records ?? [];
if (!Array.isArray(historicalRecords) || historicalRecords.length !== 15) {
  fail('Historical PR-064 Japan active timetable overlay must retain exactly 15 records.');
}

const historicalTypes = new Set(historicalRecords.map((record) => record.racing_type));
for (const type of ['NAR local meeting', 'Banei meeting']) {
  if (!historicalTypes.has(type)) fail(`Historical Japan overlay must retain record type: ${type}`);
}

for (const record of historicalRecords) {
  if (record.country_id !== 'japan') fail('Every historical overlay record must have country_id japan.');
  if (record.timezone !== 'Asia/Tokyo') fail(`${record.racecourse_id}: historical timezone must be Asia/Tokyo.`);
  if (record.status !== 'source-reviewed') fail(`${record.racecourse_id}: historical status must remain source-reviewed.`);
  const serialized = JSON.stringify(record).toLowerCase();
  for (const forbidden of ['horse name', 'jockey name', 'odds', 'payout', 'prediction', 'tip', 'raw html']) {
    if (serialized.includes(forbidden)) fail(`${record.racecourse_id} ${record.date}: forbidden detail marker found: ${forbidden}`);
  }
}

if (dataTs.includes('japan-active-timetable-records.json') || dataTs.includes('japanActiveTimetableRecords') || dataTs.includes('mergedTimetables')) {
  fail('src/lib/data.ts must not restore the retired Japan overlay runtime merge.');
}

for (const requiredSnippet of [
  "meeting-list.json",
  "meeting-details.json",
  'getPublicTimetableMeetingRowsByCountry',
  'effective_public_rank',
  'official_source_url',
]) {
  if (!publicViewModel.includes(requiredSnippet)) {
    fail(`Public timetable view model must include: ${requiredSnippet}`);
  }
}
if (publicViewModel.includes('japan-active-timetable-records.json')) {
  fail('Public timetable view model must not import the retired Japan overlay.');
}

if (publicMeetings.schema_version !== 'public-timetable-meeting-list-v0') {
  fail('Public timetable meeting list schema must be public-timetable-meeting-list-v0.');
}
const japanMeetings = (publicMeetings.meetings ?? []).filter((record) => record.country_id === 'japan');
if (japanMeetings.length === 0) fail('Public v1 meeting list must include reviewed Japan meetings.');

const meetingKeys = new Set();
for (const record of japanMeetings) {
  for (const field of ['meeting_id', 'authority_id', 'racecourse_id', 'date', 'timezone', 'effective_public_rank', 'official_source_url']) {
    if (record[field] === undefined || record[field] === null || record[field] === '') {
      fail(`${record.meeting_id ?? 'Japan meeting'} must include ${field}.`);
    }
  }
  if (record.timezone !== 'Asia/Tokyo') fail(`${record.meeting_id}: public Japan timezone must be Asia/Tokyo.`);
  const key = `${record.date}:${record.racecourse_id}:${record.authority_id}`;
  if (meetingKeys.has(key)) fail(`Duplicate Public v1 Japan meeting identity: ${key}`);
  meetingKeys.add(key);
  const serialized = JSON.stringify(record).toLowerCase();
  for (const forbidden of ['horse_name', 'jockey_name', 'odds', 'payout', 'prediction', 'tip', 'raw_html']) {
    if (serialized.includes(forbidden)) fail(`${record.meeting_id}: prohibited Public v1 field marker found: ${forbidden}`);
  }
}

if (errors.length) {
  console.error('Japan Public v1 timetable migration check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Japan Public v1 timetable migration check passed.');
console.log(`HISTORICAL_OVERLAY_RECORDS: ${historicalRecords.length}`);
console.log(`PUBLIC_JAPAN_MEETINGS: ${japanMeetings.length}`);
