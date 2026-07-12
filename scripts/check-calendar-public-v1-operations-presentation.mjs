import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  PUBLIC_CALENDAR_DATA_STATUSES,
  PUBLIC_SOURCE_PRESENTATION_STATUSES,
  PUBLIC_RETRY_OWNERSHIP_STATUSES,
  derivePublicOperationsPresentation,
  getPublicOperationsCopy,
} from '../src/lib/timetable/publicOperationsPresentation.mjs';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (relativePath) => {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`missing required file: ${relativePath}`);
    return '';
  }
  return readFileSync(absolutePath, 'utf8');
};
const parse = (relativePath) => {
  try {
    return JSON.parse(read(relativePath));
  } catch (error) {
    fail(`${relativePath} must parse: ${error.message}`);
    return null;
  }
};
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const requireIncludes = (text, marker, label) => {
  if (!text.includes(marker)) fail(`${label} missing ${marker}`);
};

const audit = parse('data/audits/calendar-public-v1-operations-presentation-v1.json');
const doc = read('docs/calendar/public-v1-operations-presentation.md');
const component = read('src/components/CalendarOperationsNotice.astro');
const model = read('src/lib/timetable/publicOperationsPresentation.mjs');
const dateStatus = read('src/components/CalendarDateStatus.astro');
const roadmap = read('docs/calendar/implementation-roadmap.md');
const routeSources = {
  calendarEn: read('src/pages/calendar/index.astro'),
  calendarJa: read('src/pages/ja/calendar/index.astro'),
  todayEn: read('src/pages/today.astro'),
  todayJa: read('src/pages/ja/today.astro'),
  tomorrowEn: read('src/pages/tomorrow.astro'),
  tomorrowJa: read('src/pages/ja/tomorrow.astro'),
};

if (audit) {
  if (audit.schema_version !== 'calendar-public-v1-operations-presentation-v1') fail('unexpected audit schema.');
  if (audit.work_id !== 'WHR-CAL-PUBLIC-V1') fail('audit Work ID differs.');
  if (audit.implementation_unit !== 'PUBLIC-V1-OPERATIONS-PRESENTATION-01') fail('implementation unit differs.');
  if (audit.status !== 'implemented_for_review') fail('audit status differs.');
  if (Number.isNaN(Date.parse(audit.reviewed_at))) fail('audit reviewed_at is invalid.');
  if (!exact(audit.calendar_data_states, PUBLIC_CALENDAR_DATA_STATUSES)) fail('Calendar data states differ.');
  if (!exact(audit.source_presentation_states, PUBLIC_SOURCE_PRESENTATION_STATUSES)) fail('source presentation states differ.');
  if (!exact(audit.retry_ownership_states, PUBLIC_RETRY_OWNERSHIP_STATUSES)) fail('retry ownership states differ.');
  if (!Array.isArray(audit.public_routes) || audit.public_routes.length !== 6) fail('six public routes are required.');
  if (!Array.isArray(audit.presentation_fixtures) || audit.presentation_fixtures.length !== 5) fail('five operations presentation fixtures are required.');
  if (!Array.isArray(audit.forbidden_public_fields) || audit.forbidden_public_fields.length < 10) fail('forbidden public field list is incomplete.');
  for (const [key, value] of Object.entries(audit.boundaries ?? {})) {
    if (value !== false) fail(`boundaries.${key} must remain false.`);
  }
}

for (const fixture of audit?.presentation_fixtures ?? []) {
  const presentation = derivePublicOperationsPresentation({
    records: fixture.records,
    dataState: { status: fixture.data_status },
    sourceFailureCount: fixture.source_failure_count,
    retryOwnershipStatus: fixture.retry_ownership_status ?? 'reviewed_operations',
  });
  if (presentation.source_presentation_status !== fixture.expected_source_presentation) {
    fail(`${fixture.fixture_id} source presentation differs.`);
  }
  if (presentation.retry_ownership_status !== fixture.expected_retry_ownership) {
    fail(`${fixture.fixture_id} retry ownership differs.`);
  }
  if (presentation.automatic_publication !== false) fail(`${fixture.fixture_id} automatic publication must remain false.`);

  const englishCopy = getPublicOperationsCopy(presentation, 'en');
  const japaneseCopy = getPublicOperationsCopy(presentation, 'ja');
  for (const [label, copy] of [['English', englishCopy], ['Japanese', japaneseCopy]]) {
    if (!copy.source || !copy.retry || !copy.automatic) fail(`${fixture.fixture_id} ${label} copy is incomplete.`);
  }
}

const sourceFailureFixture = audit?.presentation_fixtures?.find((fixture) => fixture.fixture_id === 'source-failure-withheld');
if (!sourceFailureFixture) fail('source failure fixture missing.');
else {
  const presentation = derivePublicOperationsPresentation({
    records: sourceFailureFixture.records,
    dataState: { status: sourceFailureFixture.data_status },
    sourceFailureCount: sourceFailureFixture.source_failure_count,
  });
  const en = getPublicOperationsCopy(presentation, 'en');
  const ja = getPublicOperationsCopy(presentation, 'ja');
  for (const marker of ['No meeting is invented from that failure', 'official sources remain the fallback']) {
    if (!en.source.includes(marker)) fail(`English source-failure copy missing ${marker}.`);
  }
  for (const marker of ['開催情報を補完せず', '公式ソースを確認先として残します']) {
    if (!ja.source.includes(marker)) fail(`Japanese source-failure copy missing ${marker}.`);
  }
}

for (const [name, source] of Object.entries(routeSources)) {
  requireIncludes(source, 'CalendarOperationsNotice', name);
  requireIncludes(source, 'dataState={dataState}', name);
}
for (const name of ['calendarEn', 'calendarJa']) requireIncludes(routeSources[name], 'records={windowRecords}', name);
for (const name of ['todayEn', 'todayJa']) requireIncludes(routeSources[name], 'records={todayRecords}', name);
for (const name of ['tomorrowEn', 'tomorrowJa']) requireIncludes(routeSources[name], 'records={tomorrowRecords}', name);
for (const name of ['calendarJa', 'todayJa', 'tomorrowJa']) requireIncludes(routeSources[name], 'lang="ja"', name);

for (const marker of [
  'derivePublicOperationsPresentation',
  'getPublicOperationsCopy',
  'data-calendar-source-presentation',
  'data-calendar-retry-ownership',
  'data-calendar-automatic-publication',
  "const heading = lang === 'ja' ? '運用状態' : 'Operations status';",
]) requireIncludes(component, marker, 'CalendarOperationsNotice.astro');
for (const marker of [
  'source_failure_under_review',
  'visible_source_attention',
  'reviewed_operations',
  'Updates are not automatic',
  '更新は自動ではありません',
  'Automatic publication is disabled',
  '自動公開は無効です',
]) requireIncludes(model, marker, 'publicOperationsPresentation.mjs');
for (const status of PUBLIC_CALENDAR_DATA_STATUSES.filter((status) => status !== 'current_window_available')) {
  requireIncludes(dateStatus, status, 'CalendarDateStatus.astro');
}

const publicSourceText = `${Object.values(routeSources).join('\n')}\n${component}\n${model}`;
for (const forbidden of audit?.forbidden_public_fields ?? []) {
  if (publicSourceText.includes(forbidden)) fail(`public operations presentation exposes forbidden field marker ${forbidden}.`);
}
for (const marker of [
  'PUBLIC-V1-OPERATIONS-PRESENTATION-01',
  'source_failure_under_review',
  'Retry Queue entries',
  '2026-07-12 / Asia/Tokyo',
]) requireIncludes(doc, marker, 'public-v1-operations-presentation.md');
for (const marker of [
  'Current Work ID: `WHR-CAL-PUBLIC-V1`',
  'Completed implementation unit: `PUBLIC-V1-PILOT-RECORD-RECONCILIATION-01`',
  'Current implementation unit: `PUBLIC-V1-OPERATIONS-PRESENTATION-01`',
]) requireIncludes(roadmap, marker, 'implementation-roadmap.md');

for (const validator of [
  'scripts/check-calendar-public-v1-surface-audit.mjs',
  'scripts/check-calendar-public-v1-pilot-record-reconciliation.mjs',
]) {
  const result = spawnSync(process.execPath, [validator], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  if (result.status !== 0) fail(`required validator failed: ${validator}`);
}

if (errors.length) {
  console.error(`CALENDAR_PUBLIC_V1_OPERATIONS_PRESENTATION: failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('CALENDAR_PUBLIC_V1_OPERATIONS_PRESENTATION: pass');
console.log('PUBLIC_ROUTES: 6');
console.log('PRESENTATION_FIXTURES: 5');
console.log('SOURCE_FAILURE_INVENTS_MEETING: false');
console.log('RETRY_OWNERSHIP: reviewed_operations');
console.log('AUTOMATIC_PUBLICATION: false');
