import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);

const expected = [
  ['37', 'malaysia', 'Malaysia', 'Complete at calendar level', 'C', 'C', 'remote_complete'],
  ['38', 'thailand', 'Thailand', 'Partial', 'C for reviewed RBSC calendar', 'C', 'remote_partial'],
  ['39', 'philippines', 'Philippines', 'Complete at calendar level', 'C', 'C', 'remote_complete'],
  ['40', 'mauritius', 'Mauritius', 'Complete at calendar level', 'C at season-calendar level', 'C', 'remote_complete'],
  ['41', 'argentina', 'Argentina', 'Partial', 'A for Palermo; wider coverage incomplete', 'C', 'remote_partial'],
  ['42', 'germany', 'Germany', 'Partial', 'A for Deutscher Galopp; country multi-code coverage incomplete', 'C', 'remote_partial'],
  ['43', 'italy', 'Italy', 'Complete at calendar level', 'C', 'C', 'remote_complete'],
  ['44', 'spain', 'Spain', 'Partial', 'A for reviewed gallop programmes; country multi-code coverage incomplete', 'C', 'remote_partial']
];

const prohibitedKeys = new Set([
  'horse', 'horses', 'horse_name', 'horse_names', 'jockey', 'jockeys',
  'trainer', 'trainers', 'owner', 'owners', 'odds', 'result', 'results',
  'payout', 'payouts', 'prediction', 'predictions', 'raw_html', 'raw_text',
  'stream_url', 'direct_stream_url', 'racecard'
]);

const inspectKeys = (value, location) => {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspectKeys(item, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (prohibitedKeys.has(key)) fail(`prohibited field ${key} at ${location}`);
    inspectKeys(child, `${location}.${key}`);
  }
};

for (const [deliveryNo, slug, country, status, rank, ceiling] of expected) {
  const relativePath = `docs/timetable-source-tests/${deliveryNo}-${slug}/final-summary.json`;
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`missing ${relativePath}`);
    continue;
  }
  let summary;
  try {
    summary = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    fail(`${relativePath} is not valid JSON: ${error.message}`);
    continue;
  }
  if (summary.country !== country) fail(`${slug} country must be ${country}`);
  if (summary.status !== status) fail(`${slug} status must be ${status}`);
  if (summary.technical_rank !== rank) fail(`${slug} technical_rank must be ${rank}`);
  if (summary.public_ceiling !== ceiling) fail(`${slug} public_ceiling must be ${ceiling}`);
  if (summary.checked_date !== '2026-06-20') fail(`${slug} checked_date must be 2026-06-20`);
  if (!Array.isArray(summary.systems) || summary.systems.length === 0) fail(`${slug} requires systems`);
  if (!Array.isArray(summary.official_sources) || summary.official_sources.length === 0) {
    fail(`${slug} requires official_sources`);
  } else {
    for (const url of summary.official_sources) {
      if (typeof url !== 'string' || !url.startsWith('https://')) fail(`${slug} has invalid official source URL: ${url}`);
    }
  }
  if (!summary.confirmed_fields || summary.confirmed_fields.meeting_date !== true || summary.confirmed_fields.racecourse !== true) {
    fail(`${slug} must confirm meeting_date and racecourse`);
  }
  if (typeof summary.decision !== 'string' || summary.decision.length < 40) fail(`${slug} requires a decision summary`);
  inspectKeys(summary, slug);
}

const indexPath = path.join(root, 'docs/timetable-source-tests/37-44-index.md');
if (!fs.existsSync(indexPath)) fail('missing docs/timetable-source-tests/37-44-index.md');
else {
  const index = fs.readFileSync(indexPath, 'utf8');
  for (const [deliveryNo, , country] of expected) {
    if (!index.includes(`| ${deliveryNo} | ${country} |`)) fail(`index is missing ${deliveryNo} ${country}`);
  }
}

const sourceRolePath = path.join(root, 'docs/timetable-source-tests/37-44-sources.md');
if (!fs.existsSync(sourceRolePath)) fail('missing docs/timetable-source-tests/37-44-sources.md');

const trackerPath = path.join(root, 'docs/country-pages/98-country-tracker.tsv');
const lines = fs.readFileSync(trackerPath, 'utf8').trimEnd().split(/\r?\n/);
const headers = lines[0].split('\t');
const rows = lines.slice(1).map((line, index) => {
  const values = line.split('\t');
  if (values.length !== headers.length) {
    fail(`tracker row ${index + 2} has ${values.length} columns; expected ${headers.length}`);
    return null;
  }
  return Object.fromEntries(headers.map((header, column) => [header, values[column]]));
}).filter(Boolean);

if (rows.length !== 98) fail(`tracker must contain 98 rows; found ${rows.length}`);
const stageOrder = ['not_started', 'source_research', 'source_tested', 'note_reviewed', 'profile_ready', 'page_qa', 'published'];

for (const [deliveryNo, slug, , , , , acquisitionStatus] of expected) {
  const row = rows.find((entry) => entry.delivery_no === deliveryNo);
  if (!row || row.slug !== slug) {
    fail(`tracker delivery ${deliveryNo} must be ${slug}`);
    continue;
  }
  if (stageOrder.indexOf(row.programme_status) < stageOrder.indexOf('source_tested')) fail(`${slug} must be at least source_tested`);
  if (row.acquisition_status !== acquisitionStatus) fail(`${slug} acquisition_status must be ${acquisitionStatus}`);
  if (row.source_last_checked !== '2026-06-20') fail(`${slug} source_last_checked must be 2026-06-20`);
  if (row.programme_status === 'source_tested') {
    if (row.note_status !== 'not_started') fail(`${slug} note_status must remain not_started at source_tested`);
    if (row.profile_status !== 'not_started') fail(`${slug} profile_status must remain not_started at source_tested`);
    if (row.en_route_status !== 'missing' || row.ja_route_status !== 'missing') fail(`${slug} routes must remain missing at source_tested`);
    if (row.qa_status !== 'not_started') fail(`${slug} QA must remain not_started at source_tested`);
  }
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}

console.log('COUNTRY_SOURCE_TESTS_37_44_VALID');
console.log('SUMMARY_FILES: 8');
console.log('PUBLIC_CEILINGS: C=8');
