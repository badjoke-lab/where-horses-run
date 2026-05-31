import fs from 'node:fs';
import path from 'node:path';
import { parseSimpleRaceDayRows } from './timetable/parsers/simple-race-day-rows.mjs';

const root = process.cwd();

function readFixture(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const southAfricaRecords = parseSimpleRaceDayRows(
  readFixture('data/fixtures/timetable/south-africa-race-day.html'),
  {
    year: 2026,
    countryId: 'south-africa',
    groupId: '4racing-gold-circle-operator-rows',
    sourceUrl: 'https://www.4racing.com/racing',
    sourceCaptureDate: '2026-05-31',
    sourceType: 'official_operator_race_day_index',
    parserName: 'south-africa-operator-race-days'
  }
).map((record) => ({
  ...record,
  record_id: `pr112-south-africa-${slug(record.racecourse)}-${record.meeting_date}`,
  promotes_from: record.racecourse === 'Greyville' || record.racecourse === 'Scottsville'
    ? 'pr107-south-africa-gold-circle-source-target'
    : 'pr107-south-africa-4racing-source-target',
  supporting_source_note: 'NHRA remains a regulator/supporting source; operator rows are used for timetable promotion.'
}));

const koreaRecords = parseSimpleRaceDayRows(
  readFixture('data/fixtures/timetable/south-korea-kra-race-day.html'),
  {
    year: 2026,
    countryId: 'south-korea',
    groupId: 'kra',
    sourceUrl: 'https://race.kra.co.kr/',
    sourceCaptureDate: '2026-05-31',
    sourceType: 'official_race_day_index',
    parserName: 'kra-race-day-rows'
  }
).map((record) => ({
  ...record,
  record_id: `pr112-south-korea-kra-${slug(record.racecourse)}-${record.meeting_date}`,
  promotes_from: 'pr107-south-korea-kra-source-target'
}));

const outputPath = path.join(root, 'data/generated/timetable/pr-112-sa-korea-promotions.json');
const records = [...southAfricaRecords, ...koreaRecords];
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify({
  schema_version: 'pr-112-sa-korea-promotions-v0',
  generated_at: '2026-05-31T00:00:00Z',
  mode: 'fixture_parser_backed_no_live_fetch',
  source_fixtures: [
    'data/fixtures/timetable/south-africa-race-day.html',
    'data/fixtures/timetable/south-korea-kra-race-day.html'
  ],
  records
}, null, 2)}\n`);

console.log(`[pr-112-sa-korea] generated ${records.length} records`);
