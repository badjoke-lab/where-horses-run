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

const paths = {
  calendarPage: 'src/pages/calendar/index.astro',
  tomorrowPage: 'src/pages/tomorrow.astro',
  currentTimetablePage: 'src/pages/major-countries/current-timetable.astro',
  detailPage: 'src/pages/timetable/meetings/[meeting_id].astro',
  listComponent: 'src/components/TimetableMeetingList.astro',
  dataModule: 'src/data/timetableMeetingRows.ts',
  publicViewModel: 'src/lib/timetable/publicTimetableViewModel.ts',
  publicMeetings: 'data/generated/timetable/public/meeting-list.json',
  publicDetails: 'data/generated/timetable/public/meeting-details.json',
  normalizedTimetable: 'data/generated/normalized-timetable.json',
  packageJson: 'package.json',
};

const calendarPage = readText(paths.calendarPage);
const tomorrowPage = readText(paths.tomorrowPage);
const currentTimetablePage = readText(paths.currentTimetablePage);
const detailPage = readText(paths.detailPage);
const listComponent = readText(paths.listComponent);
const dataModule = readText(paths.dataModule);
const publicViewModel = readText(paths.publicViewModel);
const publicMeetings = readJson(paths.publicMeetings);
const publicDetails = readJson(paths.publicDetails);
const normalizedTimetable = readJson(paths.normalizedTimetable);
const packageJson = readJson(paths.packageJson);

for (const [label, text, phrases] of [
  [paths.calendarPage, calendarPage, ['TimetableMeetingList', 'getCurrentCalendarWindowGroups', 'getTimetableDataState', '30-day racing calendar']],
  [paths.tomorrowPage, tomorrowPage, ['TimetableMeetingList', 'getTimetableMeetingRowsForDate', 'getTimetableDateContext', "Tomorrow's timetable"]],
  [paths.currentTimetablePage, currentTimetablePage, ['TimetableMeetingList', 'getCurrentCalendarWindowGroups', 'getTimetableDataState']],
  [paths.listComponent, listComponent, ['record.detail_path', 'record.official_source_url', 'record.capability_rank', 'Reviewed programme summary', '確認済み番組概要']],
  [paths.dataModule, dataModule, ['getPublicTimetableMeetingRows', 'effective_public_rank', "effectiveRank === 'A' || effectiveRank === 'A+'", 'detail_path !== null']],
  [paths.publicViewModel, publicViewModel, ['meeting-list.json', 'meeting-details.json', 'getPublicTimetableMeetingDetail', "Extract<CapabilityRank, 'A' | 'A+'>"]],
  [paths.detailPage, detailPage, ['getPublicTimetableMeetingDetail', 'getPublicTimetableMeetingRows', "detail.effective_public_rank === 'A+'", 'Programme summary', 'Race timetable', 'Publication boundary']],
]) {
  for (const phrase of phrases) requireIncludes(text, phrase, label);
}

for (const retiredToken of [
  'NormalizedTimetableCalendarPreview',
  'normalizedTimetableCalendarPreviewDays',
  'getNormalizedTimetableMeetingDetail',
  'NormalizedMeetingDetailLinks',
  'View race timetable',
]) {
  for (const [label, text] of [
    [paths.calendarPage, calendarPage],
    [paths.tomorrowPage, tomorrowPage],
    [paths.currentTimetablePage, currentTimetablePage],
  ]) {
    if (text.includes(retiredToken)) fail(`${label} must not use retired normalized-preview token ${retiredToken}.`);
  }
}

for (const [label, text] of [
  [paths.calendarPage, calendarPage],
  [paths.tomorrowPage, tomorrowPage],
  [paths.currentTimetablePage, currentTimetablePage],
  [paths.detailPage, detailPage],
  [paths.listComponent, listComponent],
  [paths.dataModule, dataModule],
  [paths.publicViewModel, publicViewModel],
]) {
  for (const pattern of [/\bfetch\s*\(/, /XMLHttpRequest/, /EventSource/, /WebSocket/, /DOMParser/, /querySelector/, /cheerio/, /playwright/, /puppeteer/]) {
    if (pattern.test(text)) fail(`${label} must not add runtime fetch or parser logic.`);
  }
}

for (const phrase of [
  'does not reproduce entries, runners, odds, results, payouts, predictions, tips, raw source text, or full racecards',
  'A details show only race label and post time',
  'A+ details show only policy-approved programme summary fields',
]) requireIncludes(detailPage, phrase, paths.detailPage);

if (publicMeetings?.schema_version !== 'public-timetable-meeting-list-v0') fail('Public meeting-list schema differs.');
if (publicDetails?.schema_version !== 'public-timetable-meeting-details-v0') fail('Public meeting-details schema differs.');
if (publicMeetings?.generated_at !== publicDetails?.generated_at) fail('Public meeting list/detail generation timestamps differ.');
if (!Array.isArray(publicMeetings?.meetings)) fail('Public meetings must be an array.');
if (!Array.isArray(publicDetails?.details)) fail('Public details must be an array.');

const detailsById = new Map((publicDetails?.details ?? []).map((detail) => [detail.meeting_id, detail]));
const meetingIds = new Set();
const detailIds = new Set();
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
const allowedRowKeys = ['label', 'post_time_local', 'race_name', 'distance_m', 'surface', 'course_label'];
const prohibitedFragments = [
  'horse', 'runner', 'jockey', 'trainer', 'entry', 'odds', 'betting', 'result',
  'payout', 'prediction', 'tip', 'raw_html', 'raw_body', 'source_body', 'stream_url',
];

function checkProhibitedKeys(value, label) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => checkProhibitedKeys(entry, `${label}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) {
    const normalized = key.toLowerCase();
    if (prohibitedFragments.some((fragment) => normalized.includes(fragment))) {
      fail(`${label}.${key} uses prohibited public key.`);
    }
    checkProhibitedKeys(entry, `${label}.${key}`);
  }
}

for (const meeting of publicMeetings?.meetings ?? []) {
  if (meetingIds.has(meeting.meeting_id)) fail(`Duplicate public meeting ${meeting.meeting_id}.`);
  meetingIds.add(meeting.meeting_id);
  if (!exact(Object.keys(meeting).sort(), allowedMeetingKeys)) fail(`${meeting.meeting_id} public meeting keys differ.`);
  if (!['C', 'B', 'B+', 'A', 'A+'].includes(meeting.effective_public_rank)) fail(`${meeting.meeting_id} effective public rank differs.`);
  const canHaveDetail = meeting.effective_public_rank === 'A' || meeting.effective_public_rank === 'A+';
  if (canHaveDetail) {
    if (meeting.detail_path !== `/timetable/meetings/${meeting.meeting_id}/`) fail(`${meeting.meeting_id} detail path differs.`);
    if (!detailsById.has(meeting.meeting_id)) fail(`${meeting.meeting_id} detail record is missing.`);
  } else {
    if (meeting.detail_path !== null) fail(`${meeting.meeting_id} lower-rank record must not expose a detail path.`);
    if (detailsById.has(meeting.meeting_id)) fail(`${meeting.meeting_id} lower-rank record must not have public detail.`);
  }
  if (meeting.effective_public_rank === 'C' && (meeting.first_race_time_local !== null || meeting.last_race_time_local !== null)) {
    fail(`${meeting.meeting_id} Rank C record exposes race times.`);
  }
  checkProhibitedKeys(meeting, `meeting:${meeting.meeting_id}`);
}

for (const detail of publicDetails?.details ?? []) {
  if (detailIds.has(detail.meeting_id)) fail(`Duplicate public detail ${detail.meeting_id}.`);
  detailIds.add(detail.meeting_id);
  if (!meetingIds.has(detail.meeting_id)) fail(`${detail.meeting_id} public detail has no meeting row.`);
  if (!exact(Object.keys(detail).sort(), allowedDetailKeys)) fail(`${detail.meeting_id} public detail keys differ.`);
  if (!['A', 'A+'].includes(detail.effective_public_rank)) fail(`${detail.meeting_id} public detail rank must be A or A+.`);
  if (!Array.isArray(detail.timetable_rows) || detail.timetable_rows.length === 0) fail(`${detail.meeting_id} public detail rows are empty.`);
  for (const [index, row] of (detail.timetable_rows ?? []).entries()) {
    const rowKeys = Object.keys(row);
    if (rowKeys.some((key) => !allowedRowKeys.includes(key))) fail(`${detail.meeting_id} Race ${index + 1} uses an unsupported public row key.`);
    if (typeof row.label !== 'string' || typeof row.post_time_local !== 'string') fail(`${detail.meeting_id} Race ${index + 1} label/time differs.`);
    if (detail.effective_public_rank === 'A' && rowKeys.some((key) => !['label', 'post_time_local'].includes(key))) {
      fail(`${detail.meeting_id} Rank A row exposes programme-summary fields.`);
    }
  }
  checkProhibitedKeys(detail, `detail:${detail.meeting_id}`);
}

if ((publicDetails?.details ?? []).length !== [...meetingIds].filter((id) => {
  const meeting = publicMeetings.meetings.find((entry) => entry.meeting_id === id);
  return meeting?.effective_public_rank === 'A' || meeting?.effective_public_rank === 'A+';
}).length) fail('Public meeting/detail count closure differs.');

if (normalizedTimetable?.schema_version !== 'normalized-timetable-v0') fail('Historical normalized timetable schema differs.');

const scripts = packageJson?.scripts ?? {};
if (scripts['validate:normalized-timetable-preview-ui'] !== 'node scripts/check-normalized-timetable-preview-ui.mjs') {
  fail('package.json must retain validate:normalized-timetable-preview-ui.');
}
if (!scripts.check?.includes('validate:normalized-timetable-preview-ui')) {
  fail('npm run check must run validate:normalized-timetable-preview-ui.');
}

if (errors.length) {
  console.error('Public v1 timetable UI and dataset check failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('Public v1 timetable UI and dataset check passed.');
console.log(`PUBLIC_MEETINGS: ${publicMeetings.meetings.length}`);
console.log(`PUBLIC_DETAILS: ${publicDetails.details.length}`);
console.log('DETAIL_RANKS: A,A+');
console.log('RUNTIME_FETCH: false');
console.log('PROHIBITED_PUBLIC_FIELDS: absent');
