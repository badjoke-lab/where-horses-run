import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function read(relativePath) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) {
    fail(`Missing file: ${relativePath}`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const config = readJson('data/sources/timetable/hkjc-racecard-route.json');
const fetchScript = read('scripts/timetable/fetch-hkjc-racecards.mjs');
const normalizeScript = read('scripts/timetable/normalize-hkjc-racecards.mjs');
const pkg = readJson('package.json');

if (config.schema_version !== 'hkjc-racecard-route-config-v0') fail('Unexpected route config schema.');
if (config.country_id !== 'hong-kong') fail('HKJC route must use hong-kong country_id.');
if (config.authority_id !== 'hkjc') fail('HKJC route must use hkjc authority_id.');
if (config.timezone !== 'Asia/Hong_Kong') fail('HKJC route must use Asia/Hong_Kong timezone.');
if (!config.target_rank_order?.join('>').includes('A>B+>B>C')) fail('HKJC route must try A before B+ and B.');
if (!config.official_sources?.racecard_url_template?.includes('RaceNo={race_number}')) fail('Racecard route must be race-number addressable.');
if (!config.official_sources?.racecard_url_template?.includes('racedate={yyyy}%2F{mm}%2F{dd}')) fail('Racecard route must be date addressable.');
if (!Array.isArray(config.meetings) || config.meetings.length < 7) fail('HKJC route must include June 2026 meeting candidates.');
if (!Array.isArray(config.race_numbers_to_probe) || config.race_numbers_to_probe.length < 12) fail('HKJC route must probe enough race numbers for A.');

for (const [label, content] of [
  ['fetch script', fetchScript],
  ['normalize script', normalizeScript],
]) {
  for (const forbidden of ['horse', 'jockey', 'trainer', 'odds', 'results', 'payouts', 'predictions', 'tips', 'raw official HTML body']) {
    if (content.toLowerCase().includes(`store ${forbidden}`)) fail(`${label} must not store ${forbidden}.`);
  }
}

if (!fetchScript.includes('public_safe_extracted_fields_only_no_raw_html')) fail('Fetch script must state public-safe no-raw-html storage policy.');
if (!fetchScript.includes('hkjc-racecard-source-snapshot.json')) fail('Fetch script must write source snapshot.');
if (!normalizeScript.includes("['A', 'B+', 'B', 'C']")) fail('Normalize script must preserve A/B+/B/C fallback order.');
if (!normalizeScript.includes("capabilityRank === 'A'")) fail('Normalize script must explicitly handle A detail output.');
if (!normalizeScript.includes('hkjc-normalized-timetable.sample.json')) fail('Normalize script must write normalized sample output.');
if (!normalizeScript.includes('hkjc-normalized-meeting-details.sample.json')) fail('Normalize script must write A-detail sample output.');

for (const scriptName of ['fetch:hkjc-racecards', 'normalize:hkjc-racecards', 'refresh:hkjc-racecards']) {
  if (!pkg.scripts?.[scriptName]) fail(`package.json missing ${scriptName}`);
}

if (errors.length) {
  for (const error of errors) console.error(`[hkjc-racecard-route] ${error}`);
  process.exit(1);
}

console.log('[hkjc-racecard-route] PASS fetch/normalize route configured');
