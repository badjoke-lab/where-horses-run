import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

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
const requireIncludes = (text, marker, label) => {
  if (!text.includes(marker)) fail(`${label} missing ${marker}`);
};
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const auditPath = 'data/audits/calendar-public-v1-surface-audit-v1.json';
const audit = parse(auditPath);
const dynamicDatesAudit = parse('data/audits/calendar-dynamic-dates-release-gate.json');
const auditDoc = read('docs/calendar/public-v1-surface-audit.md');
const startHere = read('START-HERE.md');
const roadmap = read('docs/calendar/implementation-roadmap.md');
const meetingList = read('src/components/TimetableMeetingList.astro');
const dateStatus = read('src/components/CalendarDateStatus.astro');

const surfaces = {
  calendarEn: read('src/pages/calendar/index.astro'),
  calendarJa: read('src/pages/ja/calendar/index.astro'),
  todayEn: read('src/pages/today.astro'),
  todayJa: read('src/pages/ja/today.astro'),
  tomorrowEn: read('src/pages/tomorrow.astro'),
  tomorrowJa: read('src/pages/ja/tomorrow.astro'),
};

const expectedSurfaceRoutes = [
  '/calendar/',
  '/ja/calendar/',
  '/today/',
  '/ja/today/',
  '/tomorrow/',
  '/ja/tomorrow/',
];
const expectedDataStates = [
  'current_window_available',
  'no_public_records',
  'records_before_window',
  'records_after_window',
  'stale_generation_with_window_records',
];

if (audit) {
  if (audit.schema_version !== 'calendar-public-v1-surface-audit-v1') fail('unexpected Public v1 surface audit schema.');
  if (audit.work_id !== 'WHR-CAL-PUBLIC-V1') fail('Public v1 surface audit Work ID differs.');
  if (audit.audit_id !== 'PUBLIC-V1-SURFACE-AUDIT-01') fail('Public v1 surface audit ID differs.');
  if (audit.status !== 'source_and_rendered_fixture_audit_ready') fail('Public v1 surface audit status differs.');
  if (Number.isNaN(Date.parse(audit.reviewed_at))) fail('Public v1 surface audit reviewed_at is invalid.');
  if (!exact(audit.surfaces, expectedSurfaceRoutes)) fail('Public v1 surface route list differs.');
  if (!exact(audit.shared_components, [
    'src/components/CalendarDateStatus.astro',
    'src/components/TimetableMeetingList.astro',
  ])) fail('Public v1 shared component list differs.');

  for (const key of [
    'explicit_reference_date_and_timezone',
    'rolling_thirty_day_window',
    'bilingual_route_parity',
    'one_meeting_per_list_row',
    'visible_source_status_and_freshness',
    'honest_empty_and_stale_states',
    'meeting_detail_routes_remain_separate',
    'official_source_final_confirmation',
  ]) {
    if (audit.release_checks?.[key] !== true) fail(`release_checks.${key} must be true.`);
  }

  if (!exact(Object.keys(audit.public_rank_boundaries ?? {}), ['C', 'B', 'B+', 'A', 'A+'])) {
    fail('Public v1 rank-boundary keys differ.');
  }
  if (!Array.isArray(audit.rendered_fixture_matrix) || audit.rendered_fixture_matrix.length !== 2) {
    fail('Public v1 rendered fixture matrix must contain two fixtures.');
  }
  if (audit.legacy_validator_reconciliation?.decision !== 'replace_fixed_month_and_pre_shared_component_assumptions') {
    fail('legacy validator reconciliation decision differs.');
  }
  for (const [key, value] of Object.entries(audit.boundaries ?? {})) {
    if (value !== false) fail(`boundaries.${key} must remain false.`);
  }
  if (!Array.isArray(audit.next_units) || audit.next_units.length !== 4) fail('four Public v1 next units are required.');
}

if (!exact(dynamicDatesAudit?.data_states, expectedDataStates)) {
  fail('Dynamic Dates public data-state contract differs.');
}

for (const [name, source] of Object.entries(surfaces)) {
  requireIncludes(source, 'CalendarDateStatus', name);
  requireIncludes(source, 'TimetableMeetingList', name);
  requireIncludes(source, 'getTimetableDateContext', name);
  requireIncludes(source, 'getTimetableDataState', name);
  requireIncludes(source, 'context.timeZone', name);
}

for (const name of ['calendarJa', 'todayJa', 'tomorrowJa']) {
  requireIncludes(surfaces[name], 'lang="ja"', name);
}

requireIncludes(surfaces.calendarEn, 'getCurrentCalendarWindowGroups', 'calendarEn');
requireIncludes(surfaces.calendarEn, 'groups={groups}', 'calendarEn');
requireIncludes(surfaces.calendarEn, '30-day racing calendar', 'calendarEn');
requireIncludes(surfaces.calendarEn, 'canonicalPath="/calendar/"', 'calendarEn');
requireIncludes(surfaces.calendarEn, 'alternatePath="/ja/calendar/"', 'calendarEn');
requireIncludes(surfaces.calendarJa, 'getCurrentCalendarWindowGroups', 'calendarJa');
requireIncludes(surfaces.calendarJa, 'groups={groupedCalendarRecords}', 'calendarJa');
requireIncludes(surfaces.calendarJa, '30日間の開催カレンダー', 'calendarJa');
requireIncludes(surfaces.calendarJa, 'canonicalPath="/ja/calendar/"', 'calendarJa');
requireIncludes(surfaces.calendarJa, 'alternatePath="/calendar/"', 'calendarJa');

for (const name of ['todayEn', 'todayJa']) {
  requireIncludes(surfaces[name], 'getTimetableMeetingRowsForDate', name);
  requireIncludes(surfaces[name], 'getTimetableMeetingRowsForDate(context.today)', name);
  requireIncludes(surfaces[name], 'records={todayRecords}', name);
  requireIncludes(surfaces[name], 'date={context.today}', name);
}
for (const name of ['tomorrowEn', 'tomorrowJa']) {
  requireIncludes(surfaces[name], 'getTimetableMeetingRowsForDate', name);
  requireIncludes(surfaces[name], 'getTimetableMeetingRowsForDate(context.tomorrow)', name);
  requireIncludes(surfaces[name], 'records={tomorrowRecords}', name);
  requireIncludes(surfaces[name], 'date={context.tomorrow}', name);
}

for (const marker of [
  'group.records.map((record) => (',
  '<li class="meeting-card">',
  "const shouldShowFirst = (record: TimetableMeetingRow) => record.capability_rank !== 'C';",
  "record.capability_rank === 'B+' || record.capability_rank === 'A' || record.capability_rank === 'A+'",
  'record.source_status',
  'record.last_checked_date',
  'record.detail_path',
  'record.official_source_url',
  'Use the official source for final confirmation.',
  '最終確認は公式ソースで行ってください。',
]) requireIncludes(meetingList, marker, 'TimetableMeetingList');

if ((meetingList.match(/group\.records\.map\(\(record\) => \(/g) ?? []).length !== 1) {
  fail('TimetableMeetingList must map each meeting row exactly once.');
}
if (meetingList.includes('<table')) fail('TimetableMeetingList must not render a full timetable table.');
if (/record\.(?:races|race_rows|programme)\.map/.test(meetingList)) fail('list pages must not expand race-by-race rows.');

for (const status of [
  'no_public_records',
  'records_before_window',
  'records_after_window',
  'stale_generation_with_window_records',
]) requireIncludes(dateStatus, status, 'CalendarDateStatus');
requireIncludes(dateStatus, 'data-calendar-data-status={dataState.status}', 'CalendarDateStatus');
requireIncludes(dateStatus, 'context.today', 'CalendarDateStatus');
requireIncludes(dateStatus, 'context.timeZone', 'CalendarDateStatus');
requireIncludes(dateStatus, 'dataState.windowRecordCount', 'CalendarDateStatus');

const publicSourceText = `${Object.values(surfaces).join('\n')}\n${meetingList}\n${dateStatus}`;
for (const forbidden of [
  /record\.(?:racecard|card_body|entries?|horses?|jockeys?|trainers?|odds?|results?|payouts?|dividends?|predictions?|tips?|raw_html|stream_url)\b/i,
  /<iframe\b/i,
  /direct stream/i,
]) {
  if (forbidden.test(publicSourceText)) fail(`public surface contains forbidden pattern ${forbidden}`);
}
for (const fixedCopy of ['June 2026 Calendar', '2026年6月 開催カレンダー']) {
  if (publicSourceText.includes(fixedCopy)) fail(`public surface retains fixed historical copy: ${fixedCopy}`);
}

for (const marker of [
  'Current Work ID: `WHR-CAL-PUBLIC-V1`',
  'audit Calendar, Today, and Tomorrow',
]) requireIncludes(startHere, marker, 'START-HERE.md');
for (const marker of [
  '## Stage 11 — Calendar public v1',
  'Status: active current programme work',
  'Work ID: `WHR-CAL-PUBLIC-V1`',
]) requireIncludes(roadmap, marker, 'implementation-roadmap.md');
for (const marker of [
  'PUBLIC-V1-SURFACE-AUDIT-01',
  'One meeting per list row',
  'validator drift',
  'unattended publication',
]) requireIncludes(auditDoc, marker, 'public-v1-surface-audit.md');

for (const validator of audit?.required_validators ?? []) {
  if (!existsSync(path.join(root, validator))) {
    fail(`missing required validator: ${validator}`);
    continue;
  }
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
  console.error(`CALENDAR_PUBLIC_V1_SURFACE_AUDIT: failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('CALENDAR_PUBLIC_V1_SURFACE_AUDIT: pass');
console.log('WORK_ID: WHR-CAL-PUBLIC-V1');
console.log('AUDIT_ID: PUBLIC-V1-SURFACE-AUDIT-01');
console.log('SURFACES: 6');
console.log('ONE_MEETING_PER_LIST_ROW: pass');
console.log('PUBLIC_RANK_BOUNDARY: C/B/B+/A/A+');
console.log('UNATTENDED_PUBLICATION: false');
