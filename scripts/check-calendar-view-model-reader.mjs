import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const helperPath = 'src/lib/timetable/calendar-view-model.ts';
const normalizedTimetablePath = 'data/generated/normalized-timetable.json';
const specPath = 'docs/specs/calendar-view-model-reader-contract.md';
const flowSpecPath = 'docs/specs/timetable-data-flow-and-display-contract.md';
const currentStatusPath = 'docs/runbooks/current-status.md';
const specsReadmePath = 'docs/specs/README.md';
const packagePath = 'package.json';
const scriptPath = 'scripts/check-calendar-view-model-reader.mjs';
const packageScriptName = 'validate:calendar-view-model-reader';

const requiredFields = [
  'meeting_id',
  'country_id',
  'authority_id',
  'racecourse_id',
  'date',
  'timezone',
  'source_id',
  'route_id',
  'source_status',
  'capability_rank',
  'first_race_time_local',
  'last_race_time_local',
  'official_source_url',
  'last_checked_date',
  'display_status',
  'notes'
];
const requiredHelpers = [
  'toCalendarMeetingSummary',
  'createCalendarMeetingSummaries',
  'readCalendarMeetingSummariesFromNormalizedTimetable',
  'filterCalendarMeetingSummariesByDate',
  'filterCalendarMeetingSummariesByDateRange',
  'groupCalendarMeetingSummariesByDate',
  'sortCalendarMeetingSummaries'
];
const prohibitedFragments = [
  'racecard',
  'odds',
  'result',
  'payout',
  'prediction',
  'tip',
  'entry',
  'entries',
  'runner',
  'raw_html',
  'source_body',
  'private',
  'internal'
];

const errors = [];

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
  if (text === '') return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${relativePath} must be valid JSON: ${error.message}`);
    return null;
  }
}

function requireIncludes(text, token, label) {
  if (!text.includes(token)) fail(`${label} must include ${token}.`);
}

function requireEqual(actual, expected, label) {
  if (actual !== expected) fail(`${label} must equal ${JSON.stringify(expected)}.`);
}

function requireNoProhibitedSummaryFields(helperText) {
  const summaryMatch = helperText.match(/export type CalendarMeetingSummary = \{(?<body>[\s\S]*?)\n\};/);
  if (!summaryMatch?.groups?.body) {
    fail(`${helperPath} must define CalendarMeetingSummary.`);
    return;
  }

  for (const fragment of prohibitedFragments) {
    if (summaryMatch.groups.body.toLowerCase().includes(fragment)) {
      fail(`${helperPath} CalendarMeetingSummary must not include prohibited field fragment '${fragment}'.`);
    }
  }
}

async function importHelper(helperText) {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'calendar-view-model-reader-'));
  const outputPath = path.join(tempDir, 'calendar-view-model.mjs');
  try {
    const transpiled = ts.transpileModule(helperText, {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
        strict: true
      }
    });
    writeFileSync(outputPath, transpiled.outputText);
    return await import(`file://${outputPath}`);
  } finally {
    setTimeout(() => rmSync(tempDir, { recursive: true, force: true }), 0);
  }
}

function sampleRecord(overrides) {
  return {
    meeting_id: overrides.meeting_id,
    country_id: overrides.country_id ?? 'jp',
    authority_id: overrides.authority_id ?? 'jra',
    racecourse_id: overrides.racecourse_id ?? 'tokyo',
    date: overrides.date ?? '2026-06-05',
    timezone: overrides.timezone ?? 'Asia/Tokyo',
    source_id: overrides.source_id ?? 'official-source',
    route_id: overrides.route_id ?? null,
    source_status: overrides.source_status ?? 'verified',
    capability_rank: overrides.capability_rank,
    first_race_time_local: overrides.first_race_time_local ?? '10:05',
    last_race_time_local: overrides.last_race_time_local ?? '16:30',
    official_source_url: overrides.official_source_url ?? 'https://example.com/official',
    last_checked_date: overrides.last_checked_date ?? '2026-06-05',
    display_status: overrides.display_status ?? 'displayable',
    notes: overrides.notes ?? 'Public-safe sample used by validator only.'
  };
}

const helperText = readText(helperPath);
const specText = readText(specPath);
const flowSpecText = readText(flowSpecPath);
const currentStatusText = readText(currentStatusPath);
const specsReadmeText = readText(specsReadmePath);
const packageJson = readJson(packagePath);
const normalizedTimetable = readJson(normalizedTimetablePath);

for (const field of requiredFields) {
  requireIncludes(helperText, field, helperPath);
  requireIncludes(specText, field, specPath);
}
for (const helper of requiredHelpers) {
  requireIncludes(helperText, `export function ${helper}`, helperPath);
  requireIncludes(specText, helper, specPath);
}
for (const rankRule of [
  'C',
  'B',
  'B+',
  'A',
  'Do not expose `first_race_time_local` or `last_race_time_local`',
  'Expose `first_race_time_local` only',
  'Expose `first_race_time_local` and `last_race_time_local`',
  'Do not expose race-by-race detail'
]) {
  requireIncludes(specText, rankRule, specPath);
}
for (const token of [
  'Calendar view model reader',
  'calendar-view-model-reader-contract.md',
  'src/lib/timetable/calendar-view-model.ts',
  'Normalized Timetable Record',
  'normalized-timetable-output-schema.md'
]) {
  requireIncludes(specText, token, specPath);
  requireIncludes(specsReadmeText + currentStatusText + flowSpecText, token, `${specsReadmePath}, ${currentStatusPath}, or ${flowSpecPath}`);
}
for (const exclusion of [
  'no live source fetching',
  'no raw source body/html',
  'racecards, odds, results, payouts, predictions, tips',
  'private/internal notes'
]) {
  requireIncludes(specText, exclusion, specPath);
}

requireNoProhibitedSummaryFields(helperText);
requireEqual(packageJson?.scripts?.[packageScriptName], `node ${scriptPath}`, `${packagePath}.scripts.${packageScriptName}`);
if (!packageJson?.scripts?.check?.includes(`npm run ${packageScriptName}`)) {
  fail(`${packagePath}.scripts.check must run ${packageScriptName}.`);
}

if (errors.length === 0) {
  const helper = await importHelper(helperText);
  const cSummary = helper.toCalendarMeetingSummary(sampleRecord({ meeting_id: 'rank-c', capability_rank: 'C' }));
  if (cSummary.first_race_time_local !== null || cSummary.last_race_time_local !== null) {
    fail('Capability rank C must hide first and last race times.');
  }

  const bSummary = helper.toCalendarMeetingSummary(sampleRecord({ meeting_id: 'rank-b', capability_rank: 'B' }));
  if (bSummary.first_race_time_local !== '10:05' || bSummary.last_race_time_local !== null) {
    fail('Capability rank B must expose first race time only.');
  }

  const bPlusSummary = helper.toCalendarMeetingSummary(sampleRecord({ meeting_id: 'rank-b-plus', capability_rank: 'B+' }));
  if (bPlusSummary.first_race_time_local !== '10:05' || bPlusSummary.last_race_time_local !== '16:30') {
    fail('Capability rank B+ must expose first and last race time summaries.');
  }

  const aSummary = helper.toCalendarMeetingSummary(sampleRecord({ meeting_id: 'rank-a', capability_rank: 'A' }));
  if (aSummary.first_race_time_local !== '10:05' || aSummary.last_race_time_local !== '16:30') {
    fail('Capability rank A must preserve summary first/last race times when present.');
  }

  const summaries = helper.createCalendarMeetingSummaries([
    sampleRecord({ meeting_id: 'late', capability_rank: 'B+', country_id: 'jp', racecourse_id: 'tokyo', date: '2026-06-06', first_race_time_local: '11:00' }),
    sampleRecord({ meeting_id: 'early', capability_rank: 'B+', country_id: 'jp', racecourse_id: 'tokyo', date: '2026-06-05', first_race_time_local: '09:30' }),
    sampleRecord({ meeting_id: 'hidden-time', capability_rank: 'C', country_id: 'jp', racecourse_id: 'tokyo', date: '2026-06-05', first_race_time_local: '08:30' })
  ]);

  if (summaries.map((summary) => summary.meeting_id).join(',') !== 'early,hidden-time,late') {
    fail('Summaries must sort by date, country, racecourse, first race time when present, then meeting id.');
  }
  if (helper.filterCalendarMeetingSummariesByDate(summaries, '2026-06-05').length !== 2) {
    fail('Date filtering must return only summaries for the requested date.');
  }
  if (helper.filterCalendarMeetingSummariesByDateRange(summaries, '2026-06-05', '2026-06-05').length !== 2) {
    fail('Date-range filtering must be inclusive.');
  }
  if (!Array.isArray(helper.groupCalendarMeetingSummariesByDate(summaries)['2026-06-05'])) {
    fail('Grouping by date must return arrays keyed by date.');
  }
  if (helper.readCalendarMeetingSummariesFromNormalizedTimetable({ records: summaries }).length !== summaries.length) {
    fail('Normalized timetable reader must read the records array.');
  }

  const generatedSummaries = helper.readCalendarMeetingSummariesFromNormalizedTimetable(normalizedTimetable);
  if (generatedSummaries.length !== (normalizedTimetable?.records?.length ?? 0)) {
    fail(`${normalizedTimetablePath} records must be consumed by readCalendarMeetingSummariesFromNormalizedTimetable.`);
  }
  for (const requiredMeetingId of [
    'jra-tokyo-racecourse-2026-06-06',
    'nar-obihiro-racecourse-2026-06-06',
    'hkjc-sha-tin-racecourse-2026-06-07'
  ]) {
    if (!generatedSummaries.some((summary) => summary.meeting_id === requiredMeetingId)) {
      fail(`${normalizedTimetablePath} calendar summaries must include ${requiredMeetingId}.`);
    }
  }
}


if (errors.length > 0) {
  console.error('[calendar-view-model-reader] FAIL');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('[calendar-view-model-reader] PASS');
