import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const errors = [];
const paths = {
  page: 'src/pages/major-countries/preview-timetable.astro',
  detailPage: 'src/pages/timetable/meetings/[meeting_id].astro',
  component: 'src/components/NormalizedTimetableCalendarPreview.astro',
  dataModule: 'src/data/normalizedTimetableCalendarPreview.ts',
  helper: 'src/lib/timetable/calendar-view-model.ts',
  normalizedTimetable: 'data/generated/normalized-timetable.json',
  currentStatus: 'docs/runbooks/current-status.md',
  packageJson: 'package.json',
};
const expectedMeetingIds = [
  'jra-tokyo-racecourse-2026-06-06',
  'jra-tokyo-racecourse-2026-06-07',
  'nar-obihiro-racecourse-2026-06-06',
  'hkjc-sha-tin-racecourse-2026-06-07',
];
const safeDisplayFields = [
  'date',
  'country_id',
  'authority_id',
  'racecourse_id',
  'source_status',
  'capability_rank',
  'first_race_time_local',
  'last_race_time_local',
  'display_status',
  'official_source_url',
];
const prohibitedDisplayFields = [
  'meeting_id',
  'timezone',
  'source_id',
  'route_id',
  'last_checked_date',
  'notes',
  'race_number',
  'display_races',
  'odds',
  'results',
  'payouts',
  'predictions',
  'tips',
  'entries',
  'raw_html',
  'source_body',
  'private',
  'internal',
];
const runtimeFetchPatterns = [/\bfetch\s*\(/, /XMLHttpRequest/, /EventSource/, /WebSocket/];
const parserPatterns = [/DOMParser/, /querySelector/, /cheerio/, /playwright/, /puppeteer/];

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

function requireIncludes(text, token, label) {
  if (!text.includes(token)) fail(`${label} must include ${token}.`);
}

async function importHelper(helperText) {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'normalized-preview-ui-'));
  const outputPath = path.join(tempDir, 'calendar-view-model.mjs');
  try {
    const transpiled = ts.transpileModule(helperText, {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
        strict: true,
      },
    });
    writeFileSync(outputPath, transpiled.outputText);
    return await import(`file://${outputPath}`);
  } finally {
    setTimeout(() => rmSync(tempDir, { recursive: true, force: true }), 0);
  }
}

const pageText = readText(paths.page);
const componentText = readText(paths.component);
const detailPageText = readText(paths.detailPage);
const dataModuleText = readText(paths.dataModule);
const helperText = readText(paths.helper);
const currentStatusText = readText(paths.currentStatus);
const normalizedTimetable = readJson(paths.normalizedTimetable);
const packageJson = readJson(paths.packageJson);

requireIncludes(pageText, 'NormalizedTimetableCalendarPreview', paths.page);
requireIncludes(pageText, 'normalizedTimetableCalendarPreviewDays', paths.page);
requireIncludes(pageText, 'calendar view model reader', paths.page);
requireIncludes(dataModuleText, 'data/generated/normalized-timetable.json', paths.dataModule);
requireIncludes(dataModuleText, 'readCalendarMeetingSummariesFromNormalizedTimetable', paths.dataModule);
requireIncludes(dataModuleText, 'NormalizedTimetableCalendarPreviewRecord', paths.dataModule);
requireIncludes(componentText, 'Preview monthly/day calendar', paths.component);
requireIncludes(componentText, 'Loaded from generated JSON without live fetching', paths.component);
requireIncludes(componentText, 'record.detail_path', paths.component);
requireIncludes(componentText, 'View meeting detail', paths.component);
requireIncludes(detailPageText, 'getStaticPaths', paths.detailPage);
requireIncludes(detailPageText, 'meeting_id', paths.detailPage);
requireIncludes(detailPageText, 'Race-by-race detail is available at the official source when applicable, but not republished here.', paths.detailPage);
requireIncludes(detailPageText, 'racecards, entries, odds, results, payouts, predictions, tips', paths.detailPage);
requireIncludes(dataModuleText, 'createNormalizedTimetableMeetingDetailPath', paths.dataModule);
requireIncludes(currentStatusText, 'preview-readable through the calendar view model reader', paths.currentStatus);

for (const field of safeDisplayFields) {
  requireIncludes(dataModuleText, `'${field}'`, paths.dataModule);
  requireIncludes(componentText, `record.${field}`, paths.component);
}
for (const field of prohibitedDisplayFields) {
  if (componentText.includes(`record.${field}`)) {
    fail(`${paths.component} must not display ${field} on the normalized preview surface.`);
  }
}
for (const [label, text] of Object.entries({ [paths.page]: pageText, [paths.component]: componentText, [paths.detailPage]: detailPageText, [paths.dataModule]: dataModuleText })) {
  for (const pattern of runtimeFetchPatterns) if (pattern.test(text)) fail(`${label} must not add live fetch runtime.`);
  for (const pattern of parserPatterns) if (pattern.test(text)) fail(`${label} must not add parser/scraper logic.`);
}

const scripts = packageJson?.scripts ?? {};
if (scripts['validate:normalized-timetable-preview-ui'] !== 'node scripts/check-normalized-timetable-preview-ui.mjs') {
  fail('package.json must define validate:normalized-timetable-preview-ui.');
}
if (!scripts.check?.includes('validate:normalized-timetable-preview-ui')) {
  fail('npm run check must run validate:normalized-timetable-preview-ui.');
}

if (errors.length === 0) {
  const helper = await importHelper(helperText);
  const summaries = helper.readCalendarMeetingSummariesFromNormalizedTimetable(normalizedTimetable);
  for (const meetingId of expectedMeetingIds) {
    if (!summaries.some((summary) => summary.meeting_id === meetingId)) {
      fail(`${paths.normalizedTimetable} must expose ${meetingId} through the calendar view model reader.`);
    }
  }

  const aLevelSample = summaries.find((summary) => summary.meeting_id === 'jra-tokyo-racecourse-2026-06-07');
  if (!aLevelSample) {
    fail('Normalized preview summaries must include the manually reviewed A-level JRA Tokyo sample.');
  } else {
    if (aLevelSample.capability_rank !== 'A') fail('The JRA Tokyo 2026-06-07 sample must use capability_rank A.');
    if (aLevelSample.first_race_time_local !== '10:05') fail('The A-level sample must expose the reviewed first race time.');
    if (aLevelSample.last_race_time_local !== '16:30') fail('The A-level sample must expose the reviewed last race time.');
  }

  const detailPaths = new Set(summaries.map((summary) => `/timetable/meetings/${encodeURIComponent(summary.meeting_id)}/`));

  const previewRows = summaries.map((summary) => ({
    date: summary.date,
    country_id: summary.country_id,
    authority_id: summary.authority_id,
    racecourse_id: summary.racecourse_id,
    source_status: summary.source_status,
    capability_rank: summary.capability_rank,
    first_race_time_local: summary.first_race_time_local,
    last_race_time_local: summary.last_race_time_local,
    display_status: summary.display_status,
    official_source_url: summary.official_source_url,
    detail_path: `/timetable/meetings/${encodeURIComponent(summary.meeting_id)}/`,
  }));

  for (const row of previewRows) {
    const keys = Object.keys(row).sort();
    const expectedKeys = [...safeDisplayFields, 'detail_path'].sort();
    if (keys.join(',') !== expectedKeys.join(',')) {
      fail('Normalized preview rows must contain only the safe summary display fields.');
    }
    if (!detailPaths.has(row.detail_path)) {
      fail(`Normalized preview detail path ${row.detail_path} must resolve to a generated meeting detail page.`);
    }
    if (row.capability_rank === 'C' && (row.first_race_time_local !== null || row.last_race_time_local !== null)) {
      fail('Rank C preview rows must not expose first/last times.');
    }
    if (row.capability_rank === 'B' && row.last_race_time_local !== null) {
      fail('Rank B preview rows must not expose last race time.');
    }
  }
}

if (errors.length > 0) {
  console.error('Normalized timetable preview UI check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Normalized timetable preview UI check passed.');
