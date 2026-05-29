import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

function fail(message) {
  errors.push(message);
}

function requireIncludes(content, needle, label) {
  if (!content.includes(needle)) fail(`${label}: missing ${needle}`);
}

function requirePattern(content, pattern, label, message) {
  if (!pattern.test(content)) fail(`${label}: ${message}`);
}

const dataTs = read('src/lib/data.ts');
const englishPage = read('src/pages/countries/[slug].astro');
const japanesePage = read('src/pages/ja/countries/[slug].astro');

requirePattern(
  dataTs,
  /import\s+timetables\s+from\s+['"]\.\.\/\.\.\/data\/generated\/timetables\.json['"];/,
  'src/lib/data.ts',
  'must import data/generated/timetables.json'
);
requirePattern(
  dataTs,
  /generated:\s*{[\s\S]*\btimetables\b[\s\S]*}/,
  'src/lib/data.ts',
  'must export timetables through siteData.generated'
);

for (const [label, content] of [
  ['src/pages/countries/[slug].astro', englishPage],
  ['src/pages/ja/countries/[slug].astro', japanesePage],
]) {
  requireIncludes(content, 'siteData.generated.timetables', label);
  requireIncludes(content, 'timetableRecords', label);
  requireIncludes(content, 'hasTimetableFallback', label);
  requirePattern(content, /manual fallback|手動fallback/i, label, 'must include fallback/manual state wording');
  requirePattern(content, /official source links for final confirmation|公式ソースリンク.*最終確認|最終確認.*公式ソースリンク/i, label, 'must include official confirmation wording');
  requirePattern(content, /Live fetching:\s*<\/strong>\s*disabled|live fetch:\s*<\/strong>\s*disabled/i, label, 'must state live fetch/fetching is disabled');
  requirePattern(content, /generated_at|Last generated|last generated/i, label, 'must show generated time when fallback data matches');
  requirePattern(content, /source_url|timetableSources|公式ソース|Official source/i, label, 'must show source IDs or source links');
}

requireIncludes(englishPage, 'Safe timetable data', 'src/pages/countries/[slug].astro');
requireIncludes(englishPage, 'No safe timetable records are listed for this country yet.', 'src/pages/countries/[slug].astro');
requireIncludes(englishPage, 'Records: no verified timetable records yet.', 'src/pages/countries/[slug].astro');
requireIncludes(japanesePage, '安全な開催時刻データ', 'src/pages/ja/countries/[slug].astro');
requireIncludes(japanesePage, '確認済みレコード', 'src/pages/ja/countries/[slug].astro');
requireIncludes(japanesePage, 'この国の安全な開催時刻レコードはまだありません。', 'src/pages/ja/countries/[slug].astro');

const forbiddenTimetableFieldPatterns = [
  /record\.(?:racecard|card_body|entries?|horses?|jockeys?|odds?|results?|payouts?|dividends?|predictions?|tips?)\b/i,
  /(?:racecard|card_body|entries?|horses?|jockeys?|odds?|results?|payouts?|dividends?|predictions?|tips?)\s*:/i,
];

for (const [label, content] of [
  ['src/pages/countries/[slug].astro', englishPage],
  ['src/pages/ja/countries/[slug].astro', japanesePage],
]) {
  const timetableSectionMatch = content.match(/<section class="section-grid" aria-label="(?:Safe timetable data|安全な開催時刻データ)">[\s\S]*?<\/section>/);
  if (!timetableSectionMatch) {
    fail(`${label}: missing safe timetable data section`);
    continue;
  }

  const timetableSection = timetableSectionMatch[0];
  for (const pattern of forbiddenTimetableFieldPatterns) {
    if (pattern.test(timetableSection)) {
      fail(`${label}: forbidden timetable display field matched ${pattern}`);
    }
  }
}

if (errors.length) {
  console.error('Country timetable UI check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Country timetable UI check passed.');
