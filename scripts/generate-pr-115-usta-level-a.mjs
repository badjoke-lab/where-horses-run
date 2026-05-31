import fs from 'node:fs';
import path from 'node:path';
import { parseUstaFullRacecard } from './timetable/parsers/usta-full-racecard.mjs';

const root = process.cwd();
const fixturePath = path.join(root, 'data/fixtures/timetable/us-usta-racecard-full.html');
const outputPath = path.join(root, 'data/generated/timetable/pr-115-usta-level-a.json');

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const html = fs.readFileSync(fixturePath, 'utf8');
const records = parseUstaFullRacecard(html, {
  sourceCaptureDate: '2026-05-31'
}).map((record) => ({
  ...record,
  record_id: `pr115-us-usta-${slug(record.racecourse)}-${record.meeting_date}`,
  promotes_from: `pr113-us-usta-${slug(record.racecourse)}-${record.meeting_date}`
}));

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify({
  schema_version: 'pr-115-usta-level-a-v0',
  generated_at: '2026-05-31T00:00:00Z',
  mode: 'fixture_full_harness_racecard_no_live_fetch',
  source_fixture: 'data/fixtures/timetable/us-usta-racecard-full.html',
  records
}, null, 2)}\n`);

console.log(`[pr-115-usta] generated ${records.length} Level A records`);
