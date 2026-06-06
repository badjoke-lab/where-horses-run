import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function fail(message) {
  errors.push(message);
}

function read(relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!existsSync(fullPath)) {
    fail(`${relativePath}: file must exist`);
    return '';
  }
  return readFileSync(fullPath, 'utf8');
}

function requireIncludes(content, needle, label) {
  if (!content.includes(needle)) fail(`${label}: missing ${needle}`);
}

function forbidIncludes(content, needle, label) {
  if (content.includes(needle)) fail(`${label}: must not include ${needle}`);
}

function requirePattern(content, pattern, label, message) {
  if (!pattern.test(content)) fail(`${label}: ${message}`);
}

const calendarPath = 'src/pages/calendar/index.astro';
const calendarPage = read(calendarPath);

requireIncludes(calendarPage, 'normalizedTimetableCalendarPreviewRecords', calendarPath);
requireIncludes(calendarPage, 'getNormalizedTimetableMeetingDetail', calendarPath);
requireIncludes(calendarPage, 'groupedCalendarRecords', calendarPath);
requireIncludes(calendarPage, 'June 2026 Calendar', calendarPath);
requireIncludes(calendarPage, 'Meetings grouped by date.', calendarPath);
requireIncludes(calendarPage, 'Rank {record.capability_rank}', calendarPath);
requireIncludes(calendarPage, 'First: {displayTime(record.first_race_time_local)}', calendarPath);
requireIncludes(calendarPage, 'Last: {displayTime(record.last_race_time_local)}', calendarPath);
requireIncludes(calendarPage, 'View race timetable', calendarPath);
requireIncludes(calendarPage, 'Official source', calendarPath);
requireIncludes(calendarPage, "record.capability_rank === 'A' && hasRaceByRaceTimetable(record.meeting_id)", calendarPath);
requirePattern(calendarPage, /reduce[\s\S]{0,80}\(groups, record\)/, calendarPath, 'must group meetings by date with a reducer');
requirePattern(calendarPage, /record\.capability_rank !== 'C'[^\n]+First:/, calendarPath, 'C records must not render first-race time');
requirePattern(calendarPage, /record\.capability_rank === 'B\+' \|\| record\.capability_rank === 'A'/, calendarPath, 'only B+ and A records should render last-race time');
requirePattern(calendarPage, /record\.can_view_race_timetable && <a href=\{record\.detail_path\}>View race timetable<\/a>/, calendarPath, 'internal race timetable link must be conditional');

forbidIncludes(calendarPage, '<table', calendarPath);
forbidIncludes(calendarPage, 'View meeting detail', calendarPath);
forbidIncludes(calendarPage, 'NormalizedMeetingDetailLinks', calendarPath);
forbidIncludes(calendarPage, 'source_id}</a>', calendarPath);
forbidIncludes(calendarPage, 'last_checked_at', calendarPath);
forbidIncludes(calendarPage, 'display_status', calendarPath);

const forbiddenDisplayPatterns = [
  /racecard/i,
  /horse\s+names/i,
  /jockey\s+names/i,
  /\bodds\b/i,
  /\bresults\b/i,
  /\bpayouts\b/i,
  /prediction/i,
  /\btips\b/i,
  /raw\s*HTML/i,
  /record\.(?:racecard|card_body|entries?|horses?|jockeys?|odds?|results?|payouts?|dividends?|predictions?|tips?|raw_html)\b/i,
];

for (const pattern of forbiddenDisplayPatterns) {
  if (pattern.test(calendarPage)) fail(`${calendarPath}: forbidden timetable display wording or field matched ${pattern}`);
}

if (errors.length) {
  console.error('date-first calendar UI check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('date-first calendar UI check passed.');
