import fs from 'node:fs';
import path from 'node:path';
import { parseCanadaWoodbineRaceDays } from './timetable/parsers/canada-woodbine-race-days.mjs';

const root = process.cwd();

function readFixture(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const woodbineRecords = parseCanadaWoodbineRaceDays(
  readFixture('data/fixtures/timetable/canada-woodbine-race-day.html'),
  {
    year: 2026,
    countryId: 'canada',
    groupId: 'woodbine-thoroughbred',
    racecourse: 'Woodbine Racetrack',
    sourceUrl: 'https://woodbine.com/race/',
    sourceCaptureDate: '2026-05-31',
    sourceType: 'official_operator_race_day_index'
  }
).map((record) => ({
  ...record,
  record_id: `pr111-canada-${record.group_id}-${slug(record.racecourse)}-${record.meeting_date}`,
  promotes_from: 'pr107-canada-woodbine-thoroughbred-source-target'
}));

const mohawkRecords = parseCanadaWoodbineRaceDays(
  readFixture('data/fixtures/timetable/canada-woodbine-mohawk-race-day.html'),
  {
    year: 2026,
    countryId: 'canada',
    groupId: 'standardbred-canada',
    racecourse: 'Woodbine Mohawk Park',
    sourceUrl: 'https://woodbine.com/mohawk/race/',
    sourceCaptureDate: '2026-05-31',
    sourceType: 'official_operator_race_day_index'
  }
).map((record) => ({
  ...record,
  record_id: `pr111-canada-${record.group_id}-${slug(record.racecourse)}-${record.meeting_date}`,
  promotes_from: 'pr107-canada-standardbred-canada-source-target',
  supporting_source_note: 'Woodbine Mohawk Park is used as an official operator source for Canadian standardbred race-day rows; Standardbred Canada remains the registry family source.'
}));

const records = [...woodbineRecords, ...mohawkRecords];
const outputPath = path.join(root, 'data/generated/timetable/pr-111-canada-promotions.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify({
  schema_version: 'pr-111-canada-promotions-v0',
  generated_at: '2026-05-31T00:00:00Z',
  mode: 'fixture_parser_backed_no_live_fetch',
  source_fixtures: [
    'data/fixtures/timetable/canada-woodbine-race-day.html',
    'data/fixtures/timetable/canada-woodbine-mohawk-race-day.html'
  ],
  records
}, null, 2)}\n`);

console.log(`[pr-111-canada] generated ${records.length} records`);
