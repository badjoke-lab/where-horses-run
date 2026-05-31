import fs from 'node:fs';
import path from 'node:path';
import { parseEquibaseFullRacecard } from './timetable/parsers/equibase-full-racecard.mjs';

const root = process.cwd();
const fixturePath = path.join(root, 'data/fixtures/timetable/us-equibase-racecard-full.html');
const outputPath = path.join(root, 'data/generated/timetable/pr-114-equibase-level-a.json');

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const html = fs.readFileSync(fixturePath, 'utf8');
const records = parseEquibaseFullRacecard(html, {
  sourceCaptureDate: '2026-05-31'
}).map((record) => ({
  ...record,
  record_id: `pr114-us-equibase-${slug(record.racecourse)}-${record.meeting_date}`,
  promotes_from: `pr113-us-equibase-${slug(record.racecourse)}-${record.meeting_date}`
}));

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify({
  schema_version: 'pr-114-equibase-level-a-v0',
  generated_at: '2026-05-31T00:00:00Z',
  mode: 'fixture_full_racecard_no_live_fetch',
  source_fixture: 'data/fixtures/timetable/us-equibase-racecard-full.html',
  records
}, null, 2)}\n`);

console.log(`[pr-114-equibase] generated ${records.length} Level A records`);
