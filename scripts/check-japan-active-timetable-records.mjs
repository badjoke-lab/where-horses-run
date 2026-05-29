import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(root, relativePath), 'utf8'));
}

const overlay = readJson('data/generated/japan-active-timetable-records.json');
const dataTs = readFileSync(path.join(root, 'src/lib/data.ts'), 'utf8');

if (overlay.schema_version !== 'japan-active-timetable-records-v0') {
  fail('Japan active timetable overlay schema_version must be japan-active-timetable-records-v0.');
}

const records = overlay.records ?? [];
if (!Array.isArray(records) || records.length < 15) {
  fail('Japan active timetable overlay must include at least 15 records after PR-064.');
}

const generatedAt = new Date(`${String(overlay.generated_at).slice(0, 10)}T00:00:00.000Z`);
const windowEnd = new Date(Date.UTC(generatedAt.getUTCFullYear(), generatedAt.getUTCMonth(), generatedAt.getUTCDate() + 30));

const requiredTypes = new Set(['NAR local meeting', 'Banei meeting']);
const seenTypes = new Set();
const seenKeys = new Set();

for (const record of records) {
  if (record.country_id !== 'japan') fail('Every overlay record must have country_id japan.');
  if (!record.racecourse_id) fail('Every overlay record must include racecourse_id.');
  if (!record.racecourse_name) fail('Every overlay record must include racecourse_name.');
  if (!record.date) fail('Every overlay record must include date.');
  if (!record.timezone) fail('Every overlay record must include timezone.');
  if (record.timezone !== 'Asia/Tokyo') fail(`${record.racecourse_id}: timezone must be Asia/Tokyo.`);
  if (!record.racing_type) fail('Every overlay record must include racing_type.');
  if (!record.source_id) fail('Every overlay record must include source_id.');
  if (!record.source_url) fail('Every overlay record must include source_url.');
  if (!record.last_checked_at) fail('Every overlay record must include last_checked_at.');
  if (record.status !== 'source-reviewed') fail(`${record.racecourse_id}: status must be source-reviewed.`);
  if (!record.confidence) fail('Every overlay record must include confidence.');

  const key = `${record.date}:${record.racecourse_id}`;
  if (seenKeys.has(key)) fail(`Duplicate Japan active timetable record: ${key}`);
  seenKeys.add(key);

  const recordDate = new Date(`${record.date}T00:00:00.000Z`);
  if (recordDate < generatedAt || recordDate >= windowEnd) {
    fail(`${record.racecourse_id} ${record.date}: record must be inside the active 30-day window.`);
  }

  seenTypes.add(record.racing_type);

  const serialized = JSON.stringify(record).toLowerCase();
  for (const forbidden of ['horse name', 'jockey name', 'odds', 'payout', 'prediction', 'tip', 'raw html']) {
    if (serialized.includes(forbidden)) {
      fail(`${record.racecourse_id} ${record.date}: forbidden detail marker found: ${forbidden}`);
    }
  }
}

for (const type of requiredTypes) {
  if (!seenTypes.has(type)) fail(`Missing active-window Japan record type: ${type}`);
}

for (const requiredKey of [
  '2026-05-30:urawa-racecourse',
  '2026-05-30:kasamatsu-racecourse',
  '2026-05-30:sonoda-racecourse',
  '2026-05-31:mizusawa-racecourse',
  '2026-05-31:kanazawa-racecourse',
  '2026-06-01:mizusawa-racecourse',
  '2026-06-01:funabashi-racecourse',
  '2026-06-01:saga-racecourse',
  '2026-06-01:obihiro-racecourse'
]) {
  if (!seenKeys.has(requiredKey)) fail(`Missing PR-064 expanded active-window record: ${requiredKey}`);
}

for (const sourceId of ['japan-nar-home', 'japan-banei-monthly-schedule']) {
  if (!(overlay.sources ?? []).includes(sourceId)) {
    fail(`Overlay sources must include ${sourceId}.`);
  }
}

for (const requiredSnippet of [
  'japan-active-timetable-records.json',
  'japanActiveTimetableRecords',
  'mergedTimetables',
  'records: [...(timetables.records ?? []), ...(japanActiveTimetableRecords.records ?? [])]'
]) {
  if (!dataTs.includes(requiredSnippet)) {
    fail(`src/lib/data.ts must merge overlay records using: ${requiredSnippet}`);
  }
}

if (errors.length) {
  console.error('Japan active timetable records check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Japan active timetable records check passed.');
