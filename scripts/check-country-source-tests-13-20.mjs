import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const expected = [
  ['13', 'japan', 'Partial', 'A+ for JRA'],
  ['14', 'hong-kong', 'Complete', 'A+'],
  ['15', 'new-zealand', 'Partial', 'A+ for thoroughbred samples'],
  ['16', 'south-africa', 'Partial', 'A+ on tested operator pages'],
  ['17', 'uruguay', 'Complete at calendar level', 'C'],
  ['18', 'sweden', 'Complete at calendar level', 'C'],
  ['19', 'denmark', 'Partial', 'C'],
  ['20', 'czech-republic', 'Partial', 'C']
];

const today = new Date().toISOString().slice(0, 10);
const summaries = new Map();
for (const [deliveryNo, slug, status, rank] of expected) {
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
  summaries.set(deliveryNo, summary);
  if (summary.status !== status) fail(`${slug} status must be ${status}`);
  if (summary.technical_rank !== rank) fail(`${slug} technical_rank must be ${rank}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(summary.checked_date ?? '')) fail(`${slug} checked_date is invalid`);
  else if (summary.checked_date > today) fail(`${slug} checked_date must not be in the future`);
  if (!Array.isArray(summary.official_sources) || summary.official_sources.length === 0) {
    fail(`${slug} requires official_sources`);
  } else {
    for (const url of summary.official_sources) {
      if (typeof url !== 'string' || !url.startsWith('https://')) fail(`${slug} has invalid official source URL: ${url}`);
    }
  }
}

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

const expectedTracker = {
  '13': ['profile_ready', 'remote_partial'],
  '14': ['profile_ready', 'remote_complete'],
  '15': ['source_tested', 'remote_partial'],
  '16': ['source_tested', 'remote_partial'],
  '17': ['source_tested', 'remote_complete'],
  '18': ['source_tested', 'remote_complete'],
  '19': ['source_tested', 'remote_partial'],
  '20': ['source_tested', 'remote_partial']
};
for (const [deliveryNo, [programmeStatus, acquisitionStatus]] of Object.entries(expectedTracker)) {
  const row = rows.find((entry) => entry.delivery_no === deliveryNo);
  if (!row) {
    fail(`missing tracker delivery ${deliveryNo}`);
    continue;
  }
  if (row.programme_status !== programmeStatus) fail(`delivery ${deliveryNo} programme_status must be ${programmeStatus}`);
  if (row.acquisition_status !== acquisitionStatus) fail(`delivery ${deliveryNo} acquisition_status must be ${acquisitionStatus}`);
  if (row.source_last_checked !== '2026-06-17') fail(`delivery ${deliveryNo} source_last_checked must be 2026-06-17`);
}

const prohibited = /(?:raw_html|full_racecard|horse_names|jockeys|trainers|odds|results|payouts|predictions|direct_stream_url)/i;
for (const [deliveryNo, summary] of summaries.entries()) {
  const serialized = JSON.stringify(summary);
  if (prohibited.test(serialized)) fail(`delivery ${deliveryNo} summary contains a prohibited public field`);
}

if (errors.length) {
  errors.forEach((error) => console.error(`ERROR: ${error}`));
  process.exit(1);
}

console.log('COUNTRY_SOURCE_TESTS_13_20_VALID');
console.log('SUMMARY_FILES: 8');
console.log('TRACKER: Japan/Hong Kong profile_ready; entries 15-20 source_tested');
console.log('PUBLIC_BOUNDARY: no participant, betting, result, or direct-stream fields');
