import fs from 'node:fs';
import path from 'node:path';
import { parseHarnessAustraliaCurrentRaces } from './timetable/parsers/harness-australia-fields.mjs';

const root = process.cwd();
const fixturePath = path.join(root, 'data/fixtures/timetable/harness-australia-current-races.html');
const outputPath = path.join(root, 'data/generated/timetable/pr-110-harness-australia-promotions.json');

const html = fs.readFileSync(fixturePath, 'utf8');
const records = parseHarnessAustraliaCurrentRaces(html, {
  sourceUrl: 'https://www.harness.org.au/racing/fields/',
  sourceCaptureDate: '2026-05-31',
  meetingDate: '2026-02-20'
}).map((record) => ({
  ...record,
  record_id: `pr110-harness-australia-${record.racecourse.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-2026-02-20`,
  promotes_from: 'pr107-australia-harness-australia-source-target'
}));

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify({
  schema_version: 'pr-110-harness-australia-promotions-v0',
  generated_at: '2026-05-31T00:00:00Z',
  mode: 'fixture_parser_backed_no_live_fetch',
  source_fixture: 'data/fixtures/timetable/harness-australia-current-races.html',
  records
}, null, 2)}\n`);

console.log(`[pr-110-harness-australia] generated ${records.length} records`);
