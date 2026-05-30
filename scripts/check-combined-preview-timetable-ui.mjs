import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const paths = {
  dataModule: 'src/data/majorCountryPreviewTimetableSamples.ts',
  page: 'src/pages/major-countries/preview-timetable.astro',
  component: 'src/components/PreviewTimetableSamples.astro',
  batch001: 'data/static/preview-timetable-samples-batch-001.json',
  batch002: 'data/static/preview-timetable-samples-batch-002.json',
  packageJson: 'package.json',
};
const expectedActiveGroups = [
  'japan/jra',
  'japan/nar',
  'japan/banei',
  'hong-kong/hkjc',
  'united-arab-emirates/era',
  'south-korea/kra',
  'united-kingdom/bha',
  'united-kingdom/point-to-point',
  'united-kingdom/purebred-arabian',
  'ireland/hri',
  'france/france-galop',
  'france/letrot',
  'united-states/equibase-thoroughbred',
  'united-states/usta-harness',
  'united-states/aqha-quarter-horse',
  'canada/standardbred-canada',
  'canada/woodbine-thoroughbred',
  'australia/racing-australia-thoroughbred',
  'australia/harness-australia',
  'new-zealand/loveracing-thoroughbred',
  'new-zealand/hrnz-harness',
  'south-africa/nhra',
  'south-africa/four-racing',
  'south-africa/gold-circle',
];
const requiredPagePhrases = [
  'Major Country Timetable Preview',
  'static manual sample',
  'not live coverage',
  'full country coverage is not complete',
  'Singapore',
  'legacy/no active racing',
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
const generatedLiveRecordPatterns = [/generated_live_timetable_records/i, /live_timetable_records/i];
const rawBodyPatterns = [/raw_source_body/i, /raw_body/i, /raw_html/i, /source_body/i];
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

const dataModuleText = readText(paths.dataModule);
const pageText = readText(paths.page);
const componentText = readText(paths.component);
const batch001 = readJson(paths.batch001);
const batch002 = readJson(paths.batch002);
const packageJson = readJson(paths.packageJson);
const packageAtHead = readPackageAtHead();
const uiText = `${pageText}\n${componentText}`;
const implementationText = {
  [paths.dataModule]: dataModuleText,
  [paths.page]: pageText,
  [paths.component]: componentText,
};

if (!dataModuleText.includes('data/static/preview-timetable-samples-batch-001.json')) {
  fail(`${paths.dataModule} must import batch 001 preview JSON.`);
}
if (!dataModuleText.includes('data/static/preview-timetable-samples-batch-002.json')) {
  fail(`${paths.dataModule} must import batch 002 preview JSON.`);
}
if (!/export\s+const\s+allPreviewTimetableSamples\b/.test(dataModuleText)) {
  fail(`${paths.dataModule} must export allPreviewTimetableSamples.`);
}
if (!/export\s+const\s+previewTimetableSummary\b/.test(dataModuleText)) {
  fail(`${paths.dataModule} must export previewTimetableSummary.`);
}
for (const sortField of ['display_country', 'display_system', 'display_meeting_date', 'display_racecourse']) {
  if (!dataModuleText.includes(sortField)) fail(`${paths.dataModule} must sort or summarize by ${sortField}.`);
}
for (const summaryField of ['total_samples', 'countries', 'systems', 'source_capture_dates', 'active_group_count', 'legacy_group_count', 'notice']) {
  if (!dataModuleText.includes(summaryField)) fail(`${paths.dataModule} summary must include ${summaryField}.`);
}
for (const notice of ['Static manual samples only', 'not live coverage', 'Full country/date/racecourse coverage is not complete']) {
  if (!dataModuleText.toLowerCase().includes(notice.toLowerCase())) fail(`${paths.dataModule} notice must include "${notice}".`);
}

if (!pageText.includes('majorCountryPreviewTimetableSamples')) {
  fail(`${paths.page} must reference the combined data module.`);
}
if (/import[^;]+preview-timetable-samples-batch-001\.json/.test(pageText)) {
  fail(`${paths.page} must no longer import only batch 001 JSON directly.`);
}
for (const phrase of requiredPagePhrases) {
  if (!pageText.toLowerCase().includes(phrase.toLowerCase())) fail(`${paths.page} must include the phrase "${phrase}".`);
}
for (const field of requiredRenderFields) {
  if (!uiText.includes(field)) fail(`Preview timetable page or component must render or reference ${field}.`);
}

const records = [
  ...(Array.isArray(batch001?.records) ? batch001.records : []),
  ...(Array.isArray(batch002?.records) ? batch002.records : []),
];
const activeKeys = records.map(groupKey);
const uniqueKeys = new Set(activeKeys);
if (records.length !== 24) fail(`Combined batch records must include exactly 24 active records; found ${records.length}.`);
if (uniqueKeys.size !== activeKeys.length) fail('Combined batch records must not contain duplicate active group keys.');
for (const expected of expectedActiveGroups) {
  if (!uniqueKeys.has(expected)) fail(`Combined batch records must include ${expected}.`);
}
for (const key of activeKeys) {
  if (!expectedActiveGroups.includes(key)) fail(`Combined batch records include unexpected active group ${key}.`);
}
if (uniqueKeys.has('singapore/singapore-turf-club-legacy')) {
  fail('Combined batch records must not include singapore/singapore-turf-club-legacy.');
}
if (activeKeys.some((key) => key.startsWith('singapore/'))) {
  fail('Combined batch records must not include Singapore active timetable coverage.');
}

for (const [label, json] of Object.entries({ [paths.batch001]: batch001, [paths.batch002]: batch002 })) {
  walk(json, (object, trail) => {
    for (const key of Object.keys(object)) {
      if (prohibitedDataKeys.has(key.toLowerCase())) {
        fail(`${label}.${[...trail, key].join('.')} must not store prohibited raw, live, wagering, prediction, or tip data.`);
      }
    }
  });
}

for (const [label, text] of Object.entries(implementationText)) {
  for (const pattern of runtimeFetchPatterns) if (pattern.test(text)) fail(`${label} must not add live fetch runtime.`);
  for (const pattern of parserPatterns) if (pattern.test(text)) fail(`${label} must not add parser implementation.`);
  for (const pattern of rawBodyPatterns) if (pattern.test(text)) fail(`${label} must not add raw source body/html storage.`);
  for (const pattern of generatedLiveRecordPatterns) if (pattern.test(text)) fail(`${label} must not add generated live timetable records.`);
  for (const pattern of wageringPatterns) if (pattern.test(text)) fail(`${label} must not add odds, payouts, predictions, or tips.`);
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
if (scripts['validate:combined-preview-timetable-ui'] !== 'node scripts/check-combined-preview-timetable-ui.mjs') {
  fail('package.json must define validate:combined-preview-timetable-ui.');
}
const check = scripts.check ?? '';
const batch002Index = check.indexOf('validate:preview-timetable-samples-batch-002');
const combinedIndex = check.indexOf('validate:combined-preview-timetable-ui');
if (batch002Index === -1 || combinedIndex === -1 || combinedIndex < batch002Index) {
  fail('npm run check must run validate:combined-preview-timetable-ui immediately after validate:preview-timetable-samples-batch-002.');
} else {
  const between = check.slice(batch002Index + 'validate:preview-timetable-samples-batch-002'.length, combinedIndex);
  if (!/^\s*&&\s*npm run\s+$/.test(between)) {
    fail('validate:combined-preview-timetable-ui must be immediately after validate:preview-timetable-samples-batch-002 in npm run check.');
  }
}

if (errors.length > 0) {
  console.error('Combined preview timetable UI check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Combined preview timetable UI check passed.');
