import fs from 'node:fs';
import path from 'node:path';
import { parseAqhaFullRacecard } from './timetable/parsers/aqha-full-racecard.mjs';

const root = process.cwd();
const fixturePath = path.join(root, 'data/fixtures/timetable/us-aqha-racecard-full.html');
const outputPath = path.join(root, 'data/generated/timetable/pr-116-aqha-level-a.json');

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const html = fs.readFileSync(fixturePath, 'utf8');
const records = parseAqhaFullRacecard(html, {
  sourceCaptureDate: '2026-05-31'
}).map((record) => ({
  ...record,
  record_id: `pr116-us-aqha-${slug(record.racecourse)}-${record.meeting_date}`,
  promotes_from: `pr113-us-aqha-${slug(record.racecourse)}-${record.meeting_date}`
}));

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify({
  schema_version: 'pr-116-aqha-level-a-v0',
  generated_at: '2026-05-31T00:00:00Z',
  mode: 'fixture_full_quarter_horse_racecard_no_live_fetch',
  source_fixture: 'data/fixtures/timetable/us-aqha-racecard-full.html',
  records
}, null, 2)}\n`);

console.log(`[pr-116-aqha] generated ${records.length} Level A records`);
