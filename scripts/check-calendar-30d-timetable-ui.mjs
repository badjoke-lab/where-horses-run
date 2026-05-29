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

function requirePattern(content, pattern, label, message) {
  if (!pattern.test(content)) fail(`${label}: ${message}`);
}

const englishPath = 'src/pages/calendar/index.astro';
const japanesePath = 'src/pages/ja/calendar/index.astro';
const englishPage = read(englishPath);
const japanesePage = read(japanesePath);

for (const [label, content] of [
  [englishPath, englishPage],
  [japanesePath, japanesePage],
]) {
  requireIncludes(content, 'siteData.generated.timetables', label);
  requireIncludes(content, 'timetableData.generated_at', label);
  requireIncludes(content, 'calendarRecords', label);
  requireIncludes(content, 'groupedCalendarRecords', label);
  requirePattern(content, /getUTCDate\(\)\s*\+\s*30|setUTCDate\([^)]*\+\s*30|rangeEndDate/i, label, 'must compute a 30-day range from generated_at');
  requirePattern(content, /record\.date\s*>=\s*rangeStartDate|record\.date\s*>=\s*generatedTimetableDate/, label, 'must include records on or after the generated date');
  requirePattern(content, /record\.date\s*<\s*rangeEndDate/, label, 'must exclude records on or after generated date plus 30 days');
  requirePattern(content, /reduce\([^)]*groups|recordsByDate|groupedCalendarRecords/i, label, 'must group matching records by date');
  requirePattern(content, /safe timetable|安全な開催時刻/i, label, 'must include safe timetable wording');
  requirePattern(content, /official source links.*final confirmation|final confirmation.*official source links|公式ソースリンク.*最終確認|最終確認.*公式ソースリンク/i, label, 'must include official confirmation wording');
  requirePattern(content, /Live fetching:\s*<\/strong>\s*disabled|Live fetching:\s*disabled|live fetch:\s*<\/strong>\s*disabled|live fetch:\s*disabled/i, label, 'must state live fetch/fetching is disabled');

  for (const safeFieldPattern of [
    /Country|country_id/,
    /Racecourse|racecourse_name|racecourse_id/,
    /Date|record\.date/,
    /Start time|start_time_local/,
    /Official source|source_id|source_url/,
    /Last checked|last_checked_at/,
    /Status|record\.status/,
    /Confidence|record\.confidence/,
  ]) {
    requirePattern(content, safeFieldPattern, label, `missing safe field display readiness for ${safeFieldPattern}`);
  }
}

requireIncludes(englishPage, '30-day safe timetable calendar', englishPath);
requireIncludes(englishPage, 'Generated date', englishPath);
requireIncludes(englishPage, 'Range start', englishPath);
requireIncludes(englishPage, 'Range end', englishPath);
requireIncludes(englishPage, 'Matching records', englishPath);
requireIncludes(englishPage, 'No safe timetable records are listed for the next 30 days yet.', englishPath);
requireIncludes(englishPage, 'Use official source links for final confirmation.', englishPath);
requireIncludes(englishPage, 'Live fetching: disabled', englishPath);

requireIncludes(japanesePage, '30日間の安全な開催時刻カレンダー', japanesePath);
requireIncludes(japanesePage, 'Generated date', japanesePath);
requireIncludes(japanesePage, '対象開始日', japanesePath);
requireIncludes(japanesePage, '対象終了日', japanesePath);
requireIncludes(japanesePage, '一致レコード数', japanesePath);
requireIncludes(japanesePage, '今後30日間の安全な開催時刻レコードはまだありません。', japanesePath);
requireIncludes(japanesePage, '最終確認には公式ソースリンクを使用してください。', japanesePath);
requireIncludes(japanesePage, 'live fetch: disabled', japanesePath);

const forbiddenDisplayPatterns = [
  /racecard/i,
  /\bentries\b/i,
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

for (const [label, content] of [
  [englishPath, englishPage],
  [japanesePath, japanesePage],
]) {
  for (const pattern of forbiddenDisplayPatterns) {
    if (pattern.test(content)) fail(`${label}: forbidden timetable display wording or field matched ${pattern}`);
  }
}

if (errors.length) {
  console.error('30-day calendar timetable UI check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('30-day calendar timetable UI check passed.');
