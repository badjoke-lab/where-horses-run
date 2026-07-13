import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const readText = (relativePath) => {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`${relativePath} must exist.`);
    return '';
  }
  return readFileSync(absolutePath, 'utf8');
};
const readJson = (relativePath) => {
  const text = readText(relativePath);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${relativePath} must parse as JSON: ${error.message}`);
    return null;
  }
};
const requireIncludes = (text, token, label) => {
  if (!text.includes(token)) fail(`${label} must include ${token}.`);
};
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const files = {
  calendar: 'src/pages/calendar/index.astro',
  tomorrow: 'src/pages/tomorrow.astro',
  current: 'src/pages/major-countries/current-timetable.astro',
  detail: 'src/pages/timetable/meetings/[meeting_id].astro',
  list: 'src/components/TimetableMeetingList.astro',
  rows: 'src/data/timetableMeetingRows.ts',
  viewModel: 'src/lib/timetable/publicTimetableViewModel.ts',
  publicMeetings: 'data/generated/timetable/public/meeting-list.json',
  publicDetails: 'data/generated/timetable/public/meeting-details.json',
  normalized: 'data/generated/normalized-timetable.json',
  packageJson: 'package.json',
};

const text = Object.fromEntries(
  Object.entries(files)
    .filter(([, file]) => file.endsWith('.astro') || file.endsWith('.ts'))
    .map(([key, file]) => [key, readText(file)]),
);
const meetings = readJson(files.publicMeetings);
const details = readJson(files.publicDetails);
const normalized = readJson(files.normalized);
const packageJson = readJson(files.packageJson);

for (const [label, markers] of [
  ['calendar', ['TimetableMeetingList', 'getCurrentCalendarWindowGroups', 'getTimetableDataState', '30-day racing calendar']],
  ['tomorrow', ['TimetableMeetingList', 'getTimetableMeetingRowsForDate', 'getTimetableDateContext', "Tomorrow's timetable"]],
  ['current', ['TimetableMeetingList', 'getGroupedTimetableMeetingRows', 'groupedTimetableRecords']],
  ['list', ['record.detail_path', 'record.official_source_url', 'record.capability_rank', 'Reviewed programme summary', '確認済み番組概要']],
  ['rows', ['getPublicTimetableMeetingRows', 'effective_public_rank', "effectiveRank === 'A' || effectiveRank === 'A+'", 'detail_path !== null']],
  ['viewModel', ['meeting-list.json', 'meeting-details.json', 'getPublicTimetableMeetingDetail', "Extract<CapabilityRank, 'A' | 'A+'>"]],
  ['detail', ['getPublicTimetableMeetingDetail', 'getPublicTimetableMeetingRows', "detail.effective_public_rank === 'A+'", 'Programme summary', 'Race timetable', 'Publication boundary']],
]) {
  for (const marker of markers) requireIncludes(text[label], marker, files[label]);
}

for (const retired of [
  'NormalizedTimetableCalendarPreview',
  'normalizedTimetableCalendarPreviewDays',
  'getNormalizedTimetableMeetingDetail',
  'NormalizedMeetingDetailLinks',
]) {
  for (const label of ['calendar', 'tomorrow']) {
    if (text[label].includes(retired)) fail(`${files[label]} must not use retired token ${retired}.`);
  }
}

for (const [label, source] of Object.entries(text)) {
  for (const pattern of [/\bfetch\s*\(/, /XMLHttpRequest/, /EventSource/, /WebSocket/, /DOMParser/, /cheerio/, /playwright/, /puppeteer/]) {
    if (pattern.test(source)) fail(`${files[label]} must not add runtime fetch or parser logic.`);
  }
}

for (const marker of [
  'does not reproduce entries, runners, odds, results, payouts, predictions, tips, raw source text, or full racecards',
  'A details show only race label and post time',
  'A+ details show only policy-approved programme summary fields',
]) requireIncludes(text.detail, marker, files.detail);

if (meetings?.schema_version !== 'public-timetable-meeting-list-v0') fail('Public meeting-list schema differs.');
if (details?.schema_version !== 'public-timetable-meeting-details-v0') fail('Public meeting-details schema differs.');
if (meetings?.generated_at !== details?.generated_at) fail('Public meeting list/detail generation timestamps differ.');
if (!Array.isArray(meetings?.meetings)) fail('Public meetings must be an array.');
if (!Array.isArray(details?.details)) fail('Public details must be an array.');
if (normalized?.schema_version !== 'normalized-timetable-output-v0') fail('Historical normalized timetable schema differs.');

const detailById = new Map((details?.details ?? []).map((record) => [record.meeting_id, record]));
const meetingIds = new Set();
const allowedMeetingKeys = [
  'meeting_id', 'country_id', 'authority_id', 'racecourse_id', 'date', 'timezone',
  'capability_rank', 'max_public_rank', 'effective_public_rank', 'first_race_time_local',
  'last_race_time_local', 'policy_id', 'source_status', 'official_source_url',
  'last_checked_date', 'detail_path', 'show_live_label', 'show_replay_label',
].sort();
const allowedDetailKeys = [
  'meeting_id', 'country_id', 'authority_id', 'racecourse_id', 'date', 'timezone',
  'capability_rank', 'max_public_rank', 'effective_public_rank', 'policy_id',
  'official_source_url', 'source_status', 'last_checked_date', 'show_race_name',
  'show_distance', 'show_surface', 'show_course', 'show_live_label',
  'show_replay_label', 'timetable_rows',
].sort();
const allowedRowKeys = new Set(['label', 'post_time_local', 'race_name', 'distance_m', 'surface', 'course_label']);
const prohibitedFragments = [
  'horse', 'runner', 'jockey', 'trainer', 'entry', 'odds', 'betting', 'result',
  'payout', 'prediction', 'tip', 'raw_html', 'raw_body', 'source_body', 'stream_url',
];

function checkProhibited(value, label) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => checkProhibited(entry, `${label}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase();
    if (prohibitedFragments.some((fragment) => normalizedKey.includes(fragment))) {
      fail(`${label}.${key} uses a prohibited public key.`);
    }
    checkProhibited(entry, `${label}.${key}`);
  }
}

for (const meeting of meetings?.meetings ?? []) {
  if (meetingIds.has(meeting.meeting_id)) fail(`Duplicate public meeting ${meeting.meeting_id}.`);
  meetingIds.add(meeting.meeting_id);
  if (!exact(Object.keys(meeting).sort(), allowedMeetingKeys)) fail(`${meeting.meeting_id} public meeting keys differ.`);
  const hasDetailRank = meeting.effective_public_rank === 'A' || meeting.effective_public_rank === 'A+';
  if (hasDetailRank) {
    if (meeting.detail_path !== `/timetable/meetings/${meeting.meeting_id}/`) fail(`${meeting.meeting_id} detail path differs.`);
    if (!detailById.has(meeting.meeting_id)) fail(`${meeting.meeting_id} public detail is missing.`);
  } else {
    if (meeting.detail_path !== null) fail(`${meeting.meeting_id} lower-rank meeting exposes a detail path.`);
    if (detailById.has(meeting.meeting_id)) fail(`${meeting.meeting_id} lower-rank meeting has public detail.`);
  }
  if (meeting.effective_public_rank === 'C' && (meeting.first_race_time_local !== null || meeting.last_race_time_local !== null)) {
    fail(`${meeting.meeting_id} Rank C meeting exposes race times.`);
  }
  checkProhibited(meeting, `meeting:${meeting.meeting_id}`);
}

const detailIds = new Set();
for (const detail of details?.details ?? []) {
  if (detailIds.has(detail.meeting_id)) fail(`Duplicate public detail ${detail.meeting_id}.`);
  detailIds.add(detail.meeting_id);
  if (!meetingIds.has(detail.meeting_id)) fail(`${detail.meeting_id} detail has no public meeting.`);
  if (!exact(Object.keys(detail).sort(), allowedDetailKeys)) fail(`${detail.meeting_id} public detail keys differ.`);
  if (!['A', 'A+'].includes(detail.effective_public_rank)) fail(`${detail.meeting_id} detail rank must be A or A+.`);
  if (!Array.isArray(detail.timetable_rows) || detail.timetable_rows.length === 0) fail(`${detail.meeting_id} detail rows are empty.`);
  for (const [index, row] of (detail.timetable_rows ?? []).entries()) {
    const rowKeys = Object.keys(row);
    if (rowKeys.some((key) => !allowedRowKeys.has(key))) fail(`${detail.meeting_id} Race ${index + 1} uses unsupported public fields.`);
    if (typeof row.label !== 'string' || typeof row.post_time_local !== 'string') fail(`${detail.meeting_id} Race ${index + 1} label/time differs.`);
    if (detail.effective_public_rank === 'A' && rowKeys.some((key) => !['label', 'post_time_local'].includes(key))) {
      fail(`${detail.meeting_id} Rank A row exposes A+ fields.`);
    }
  }
  checkProhibited(detail, `detail:${detail.meeting_id}`);
}

const expectedDetailCount = (meetings?.meetings ?? []).filter((meeting) => ['A', 'A+'].includes(meeting.effective_public_rank)).length;
if ((details?.details ?? []).length !== expectedDetailCount) fail('Public meeting/detail count closure differs.');

const scripts = packageJson?.scripts ?? {};
if (scripts['validate:normalized-timetable-preview-ui'] !== 'node scripts/check-normalized-timetable-preview-ui.mjs') {
  fail('package.json must retain validate:normalized-timetable-preview-ui.');
}
if (!scripts.check?.includes('validate:normalized-timetable-preview-ui')) fail('npm run check must run validate:normalized-timetable-preview-ui.');

if (errors.length) {
  console.error('Public v1 timetable UI and dataset check failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Public v1 timetable UI and dataset check passed.');
console.log(`PUBLIC_MEETINGS: ${meetings.meetings.length}`);
console.log(`PUBLIC_DETAILS: ${details.details.length}`);
console.log('DETAIL_RANKS: A,A+');
console.log('RUNTIME_FETCH: false');
console.log('PROHIBITED_PUBLIC_FIELDS: absent');
