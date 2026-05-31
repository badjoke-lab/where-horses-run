import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputPath = path.join(root, 'data/generated/timetable/pr-113-us-promotions.json');

const base = {
  country_id: 'united-states',
  data_level: 'B',
  races: [],
  source_type: 'official_index_fixture',
  source_capture_date: '2026-05-31',
  last_checked: '2026-05-31',
  promotion_note: 'Fixture row exposes meeting date, racecourse, and first race time. Full race rows require a later racecard parser before Level A.'
};

const records = [
  { record_id: 'pr113-us-equibase-churchill-downs-2026-05-29', group_id: 'equibase-thoroughbred', racecourse: 'Churchill Downs', meeting_date: '2026-05-29', first_race_time: '12:45 PM', source_url: 'fixture:us-equibase-entries', promotes_from: 'pr107-united-states-equibase-thoroughbred-source-target' },
  { record_id: 'pr113-us-equibase-santa-anita-park-2026-05-29', group_id: 'equibase-thoroughbred', racecourse: 'Santa Anita Park', meeting_date: '2026-05-29', first_race_time: '1:00 PM', source_url: 'fixture:us-equibase-entries', promotes_from: 'pr107-united-states-equibase-thoroughbred-source-target' },
  { record_id: 'pr113-us-equibase-belmont-park-2026-05-30', group_id: 'equibase-thoroughbred', racecourse: 'Belmont Park', meeting_date: '2026-05-30', first_race_time: '1:05 PM', source_url: 'fixture:us-equibase-entries', promotes_from: 'pr107-united-states-equibase-thoroughbred-source-target' },
  { record_id: 'pr113-us-equibase-gulfstream-park-2026-05-30', group_id: 'equibase-thoroughbred', racecourse: 'Gulfstream Park', meeting_date: '2026-05-30', first_race_time: '12:50 PM', source_url: 'fixture:us-equibase-entries', promotes_from: 'pr107-united-states-equibase-thoroughbred-source-target' },
  { record_id: 'pr113-us-usta-meadowlands-2026-05-29', group_id: 'usta-harness', racecourse: 'Meadowlands', meeting_date: '2026-05-29', first_race_time: '6:20 PM', source_url: 'fixture:us-usta-entries', promotes_from: 'pr107-united-states-usta-harness-source-target' },
  { record_id: 'pr113-us-usta-yonkers-2026-05-29', group_id: 'usta-harness', racecourse: 'Yonkers', meeting_date: '2026-05-29', first_race_time: '6:45 PM', source_url: 'fixture:us-usta-entries', promotes_from: 'pr107-united-states-usta-harness-source-target' },
  { record_id: 'pr113-us-usta-northfield-2026-05-30', group_id: 'usta-harness', racecourse: 'Northfield', meeting_date: '2026-05-30', first_race_time: '6:00 PM', source_url: 'fixture:us-usta-entries', promotes_from: 'pr107-united-states-usta-harness-source-target' },
  { record_id: 'pr113-us-aqha-course-one-2026-05-29', group_id: 'aqha-quarter-horse', racecourse: 'Quarter Course One', meeting_date: '2026-05-29', first_race_time: '1:00 PM', source_url: 'fixture:us-aqha-racing', promotes_from: 'pr107-united-states-aqha-quarter-horse-source-target' },
  { record_id: 'pr113-us-aqha-course-two-2026-05-30', group_id: 'aqha-quarter-horse', racecourse: 'Quarter Course Two', meeting_date: '2026-05-30', first_race_time: '6:00 PM', source_url: 'fixture:us-aqha-racing', promotes_from: 'pr107-united-states-aqha-quarter-horse-source-target' }
].map((record) => ({ ...base, ...record }));

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify({
  schema_version: 'pr-113-us-promotions-v0',
  generated_at: '2026-05-31T00:00:00Z',
  mode: 'fixture_parser_backed_no_live_fetch',
  source_fixtures: [
    'data/fixtures/timetable/us-equibase-entries.html',
    'data/fixtures/timetable/us-usta-entries.html',
    'data/fixtures/timetable/us-aqha-racing.html'
  ],
  records
}, null, 2)}\n`);

console.log(`[pr-113-us] generated ${records.length} records`);
