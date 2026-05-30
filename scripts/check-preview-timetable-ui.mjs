import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const paths = {
  page: 'src/pages/major-countries/preview-timetable.astro',
  component: 'src/components/PreviewTimetableSamples.astro',
  preview: 'data/static/preview-timetable-samples-batch-001.json',
  package: 'package.json',
};
const expectedGroups = [
  'japan/jra',
  'japan/nar',
  'japan/banei',
  'hong-kong/hkjc',
  'united-arab-emirates/era',
  'south-korea/kra',
];
const requiredPhrases = [
  'static manual sample',
  'not live coverage',
  'full country coverage is not complete',
  'official source',
];
const requiredRenderFields = [
  'display_country',
  'display_system',
  'display_racecourse',
  'display_meeting_date',
  'display_first_race_time',
  'display_races',
  'official_source_url',
  'source_capture_date',
  'user_notice',
];
const prohibitedDataKeys = new Set([
  'raw_body',
  'raw_html',
  'raw_source_body',
  'source_body',
  'html',
  'body',
  'generated_live_timetable_records',
  'live_timetable_records',
  'odds',
  'payouts',
  'predictions',
  'tips',
]);
const scrapingDependencies = new Set(['cheerio', 'jsdom', 'puppeteer', 'playwright', 'node-fetch', 'axios', 'got']);
const runtimeFetchPatterns = [/\bfetch\s*\(/, /XMLHttpRequest/, /EventSource/, /WebSocket/];
const parserPatterns = [/\bparse(?:r|Fixture|Timetable|Source)?\b/i, /DOMParser/, /querySelector/];
const wageringPatterns = [/\bodds\b/i, /\bpayouts?\b/i, /\bpredictions?\b/i, /\btips?\b/i];

function fail(message) {
  errors.push(message);
}

function readText(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`${relativePath} must exist.`);
    return '';
  }
  return readFileSync(absolutePath, 'utf8');
}

function readJson(relativePath) {
  const text = readText(relativePath);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${relativePath} must parse as JSON: ${error.message}`);
    return null;
  }
}

function groupKey(record) {
  return `${record?.country_id}/${record?.group_id}`;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function walk(value, visitor, trail = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, visitor, [...trail, String(index)]));
    return;
  }
  if (!isPlainObject(value)) return;
  visitor(value, trail);
  for (const [key, entry] of Object.entries(value)) walk(entry, visitor, [...trail, key]);
}

function readPackageAtHead() {
  try {
    return JSON.parse(execFileSync('git', ['show', 'HEAD:package.json'], { cwd: root, encoding: 'utf8' }));
  } catch {
    return null;
  }
}

const pageText = readText(paths.page);
const componentText = readText(paths.component);
const combinedUiText = `${pageText}\n${componentText}`;
const preview = readJson(paths.preview);
const packageJson = readJson(paths.package);
const packageAtHead = readPackageAtHead();

if (!pageText.includes('preview-timetable-samples-batch-001.json')) {
  fail(`${paths.page} must import or otherwise reference preview-timetable-samples-batch-001.json.`);
}
if (!pageText.includes('Major Country Timetable Preview')) {
  fail(`${paths.page} must include the title "Major Country Timetable Preview".`);
}
for (const phrase of requiredPhrases) {
  if (!pageText.toLowerCase().includes(phrase)) fail(`${paths.page} must include the phrase "${phrase}".`);
}
for (const field of requiredRenderFields) {
  if (!combinedUiText.includes(field)) fail(`Preview timetable UI must render or reference ${field}.`);
}

const previewRecords = Array.isArray(preview?.records) ? preview.records : [];
if (previewRecords.length < expectedGroups.length) {
  fail(`${paths.preview} must contain at least ${expectedGroups.length} records.`);
}
const previewGroups = previewRecords.map(groupKey);
for (const expected of expectedGroups) {
  if (!previewGroups.includes(expected)) fail(`${paths.preview} must contain the PR-098 group ${expected}.`);
}
walk(preview, (object, trail) => {
  for (const key of Object.keys(object)) {
    if (prohibitedDataKeys.has(key.toLowerCase())) {
      fail(`${paths.preview}.${[...trail, key].join('.')} must not store prohibited raw, live, wagering, prediction, or tip data.`);
    }
  }
});

for (const [label, text] of Object.entries({ [paths.page]: pageText, [paths.component]: componentText })) {
  for (const pattern of runtimeFetchPatterns) {
    if (pattern.test(text)) fail(`${label} must not add live fetch runtime.`);
  }
  for (const pattern of parserPatterns) {
    if (pattern.test(text)) fail(`${label} must not add parser implementation.`);
  }
  for (const pattern of wageringPatterns) {
    if (pattern.test(text)) fail(`${label} must not add odds, payouts, predictions, or tips.`);
  }
}

const deps = packageJson ?? {};
for (const field of ['dependencies', 'devDependencies', 'optionalDependencies']) {
  const after = deps[field] ?? {};
  for (const dep of Object.keys(after)) {
    if (scrapingDependencies.has(dep)) fail(`Scraping dependency ${field}.${dep} is not allowed.`);
  }
  if (packageAtHead) {
    const before = packageAtHead[field] ?? {};
    for (const dep of Object.keys(after)) {
      if (!(dep in before)) fail(`No new dependencies are allowed; added ${field}.${dep}.`);
    }
  }
}

const scripts = packageJson?.scripts ?? {};
if (scripts['validate:preview-timetable-ui'] !== 'node scripts/check-preview-timetable-ui.mjs') {
  fail('package.json must define validate:preview-timetable-ui.');
}
const check = scripts.check ?? '';
const samplesIndex = check.indexOf('validate:preview-timetable-samples-batch-001');
const uiIndex = check.indexOf('validate:preview-timetable-ui');
if (samplesIndex === -1 || uiIndex === -1 || uiIndex < samplesIndex) {
  fail('npm run check must run validate:preview-timetable-ui immediately after validate:preview-timetable-samples-batch-001.');
} else {
  const between = check.slice(samplesIndex + 'validate:preview-timetable-samples-batch-001'.length, uiIndex);
  if (!/^\s*&&\s*npm run\s+$/.test(between)) {
    fail('validate:preview-timetable-ui must be immediately after validate:preview-timetable-samples-batch-001 in npm run check.');
  }
}

if (errors.length > 0) {
  console.error('Preview timetable UI check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Preview timetable UI check passed.');
