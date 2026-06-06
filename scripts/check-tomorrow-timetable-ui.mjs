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

const englishPath = 'src/pages/tomorrow.astro';
const englishPage = read(englishPath);

requireIncludes(englishPage, 'normalizedTimetableCalendarPreviewRecords', englishPath);
requireIncludes(englishPage, 'getNormalizedTimetableMeetingDetail', englishPath);
requireIncludes(englishPage, 'tomorrowRecords', englishPath);
requireIncludes(englishPage, 'Tomorrow’s meeting list', englishPath);
requireIncludes(englishPage, 'Rank {record.capability_rank}', englishPath);
requireIncludes(englishPage, 'First: {displayTime(record.first_race_time_local)}', englishPath);
requireIncludes(englishPage, 'Last: {displayTime(record.last_race_time_local)}', englishPath);
requireIncludes(englishPage, 'View race timetable', englishPath);
requireIncludes(englishPage, 'Official source', englishPath);
requireIncludes(englishPage, "record.capability_rank === 'A' && hasRaceByRaceTimetable(record.meeting_id)", englishPath);
requirePattern(englishPage, /setUTCDate\([^)]*getUTCDate\(\)\s*\+\s*1/, englishPath, 'must compute tomorrow from the current timetable date');
requirePattern(englishPage, /record\.date\s*={2,3}\s*tomorrowTimetableDate/, englishPath, 'must match records using the computed tomorrow date');
requirePattern(englishPage, /record\.capability_rank !== 'C'[^\n]+First:/, englishPath, 'C records must not render first-race time');
requirePattern(englishPage, /record\.capability_rank === 'B\+' \|\| record\.capability_rank === 'A'/, englishPath, 'only B+ and A records should render last-race time');
requirePattern(englishPage, /record\.can_view_race_timetable && <a href=\{record\.detail_path\}>View race timetable<\/a>/, englishPath, 'internal race timetable link must be conditional');
requirePattern(englishPage, /official source links.*final confirmation|final confirmation.*official source links/i, englishPath, 'must include official confirmation wording');
requirePattern(englishPage, /Live fetching:\s*disabled/i, englishPath, 'must state live fetching is disabled');

forbidIncludes(englishPage, '<table', englishPath);
forbidIncludes(englishPage, 'NormalizedMeetingDetailLinks', englishPath);
forbidIncludes(englishPage, 'View meeting detail', englishPath);
forbidIncludes(englishPage, 'CurrentTimetableRecords', englishPath);
forbidIncludes(englishPage, 'source_id}</a>', englishPath);
forbidIncludes(englishPage, 'last_checked_at', englishPath);
forbidIncludes(englishPage, 'display_status', englishPath);

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
  if (pattern.test(englishPage)) fail(`${englishPath}: forbidden timetable display wording or field matched ${pattern}`);
}

if (errors.length) {
  console.error('Tomorrow timetable UI check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Tomorrow timetable UI check passed.');
