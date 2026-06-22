import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const expected = [
  ['45', 'norway', 'Norway', 'Complete at reviewed multi-code calendar level', 'remote_complete'],
  ['46', 'finland', 'Finland', 'Complete at national harness calendar level', 'remote_complete'],
  ['47', 'netherlands', 'Netherlands', 'Complete at reviewed national calendar level', 'remote_complete'],
  ['48', 'switzerland', 'Switzerland', 'Complete at calendar level', 'remote_complete'],
  ['49', 'poland', 'Poland', 'Complete at national plan level', 'remote_complete'],
  ['50', 'romania', 'Romania', 'Partial', 'remote_partial'],
  ['51', 'serbia', 'Serbia', 'Partial', 'remote_partial'],
  ['52', 'slovakia', 'Slovakia', 'Complete at official calendar level', 'remote_complete']
];
const stageOrder = ['not_started', 'source_research', 'source_tested', 'note_reviewed', 'profile_ready', 'page_qa', 'published'];
const prohibited = new Set(['horses','horse_names','jockeys','trainers','odds','results','payouts','predictions','raw_html','raw_text','stream_url','racecard']);

const inspect = (value, location) => {
  if (Array.isArray(value)) return value.forEach((item, index) => inspect(item, `${location}[${index}]`));
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (prohibited.has(key)) fail(`prohibited field ${key} at ${location}`);
    inspect(child, `${location}.${key}`);
  }
};

for (const [deliveryNo, slug, country, status] of expected) {
  const relative = `docs/timetable-source-tests/${deliveryNo}-${slug}/final-summary.json`;
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) {
    fail(`missing ${relative}`);
    continue;
  }
  let summary;
  try {
    summary = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  } catch (error) {
    fail(`${relative} is invalid JSON: ${error.message}`);
    continue;
  }
  if (summary.country !== country) fail(`${slug} country must be ${country}`);
  if (summary.status !== status) fail(`${slug} status must be ${status}`);
  if (summary.checked_date !== '2026-06-20') fail(`${slug} checked_date must be 2026-06-20`);
  if (summary.public_ceiling !== 'C') fail(`${slug} public ceiling must be C`);
  if (!Array.isArray(summary.systems) || !summary.systems.length) fail(`${slug} requires systems`);
  if (!Array.isArray(summary.official_sources) || !summary.official_sources.length) fail(`${slug} requires official sources`);
  for (const url of summary.official_sources ?? []) {
    if (typeof url !== 'string' || !url.startsWith('https://')) fail(`${slug} invalid official URL: ${url}`);
  }
  if (summary.confirmed_fields?.meeting_date !== true || summary.confirmed_fields?.racecourse !== true) {
    fail(`${slug} must confirm meeting_date and racecourse`);
  }
  if (typeof summary.decision !== 'string' || summary.decision.length < 40) fail(`${slug} requires a decision`);
  inspect(summary, slug);
}

for (const file of ['docs/timetable-source-tests/45-52-index.md','docs/timetable-source-tests/45-52-sources.md','docs/timetable-source-tests/45-52-scope.md']) {
  if (!fs.existsSync(path.join(root, file))) fail(`missing ${file}`);
}

const lines = fs.readFileSync(path.join(root, 'docs/country-pages/98-country-tracker.tsv'), 'utf8').trimEnd().split(/\r?\n/);
const headers = lines[0].split('\t');
const rows = lines.slice(1).map((line) => Object.fromEntries(headers.map((header, index) => [header, line.split('\t')[index]])));
if (rows.length !== 98) fail(`tracker must contain 98 rows; found ${rows.length}`);
for (const [deliveryNo, slug, , , acquisition] of expected) {
  const row = rows.find((item) => item.delivery_no === deliveryNo);
  if (!row || row.slug !== slug) {
    fail(`tracker delivery ${deliveryNo} must be ${slug}`);
    continue;
  }
  if (stageOrder.indexOf(row.programme_status) < stageOrder.indexOf('source_tested')) fail(`${slug} must be at least source_tested`);
  if (row.acquisition_status !== acquisition) fail(`${slug} acquisition status must be ${acquisition}`);
  if (row.source_last_checked !== '2026-06-20') fail(`${slug} source check date mismatch`);
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}
console.log('COUNTRY_SOURCE_TESTS_45_52_VALID');
console.log('SUMMARY_FILES: 8');
console.log('PUBLIC_CEILINGS: C=8');
