import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (relativePath) => {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`missing rendered file: ${relativePath}`);
    return '';
  }
  return readFileSync(absolutePath, 'utf8');
};
const requireIncludes = (text, marker, label) => {
  if (!text.includes(marker)) fail(`${label} missing ${marker}`);
};

const expectedReferenceDate = process.env.WHR_CALENDAR_REFERENCE_DATE ?? '2026-07-01';
const expectedTimezone = process.env.WHR_CALENDAR_TIMEZONE ?? 'Asia/Tokyo';
if (expectedReferenceDate !== '2026-07-01') fail('rendered pilot-record fixture must use 2026-07-01.');
if (expectedTimezone !== 'Asia/Tokyo') fail('rendered pilot-record fixture must use Asia/Tokyo.');

const englishCalendar = read('dist/calendar/index.html');
const japaneseCalendar = read('dist/ja/calendar/index.html');
const englishToday = read('dist/today/index.html');
const japaneseToday = read('dist/ja/today/index.html');

const languageContracts = {
  en: {
    markers: ['Public rank:', 'Authority:', 'Country:', 'Source:', 'Checked:', '>Official<'],
    verbose: ['Reviewed coverage', 'Additional detail', 'Meeting date and racecourse only', 'More detail not reviewed'],
    empty: `No reviewed public meetings are listed for ${expectedReferenceDate}.`,
  },
  ja: {
    markers: ['公開ランク:', '主催:', '国:', 'ソース:', '確認:', '>公式<'],
    verbose: ['確認済み範囲', '追加詳細', '開催日・競馬場のみ', '追加詳細は未確認'],
    empty: `${expectedReferenceDate}の確認済み公開開催はありません。`,
  },
};

function validateMeetingRows(label, html, lang, { allowEmpty = false } = {}) {
  const contract = languageContracts[lang];
  const hasRows = html.includes('class="meeting-row"');
  if (!hasRows) {
    if (!allowEmpty) fail(`${label} missing class="meeting-row"`);
    else requireIncludes(html, contract.empty, label);
    return;
  }
  for (const marker of contract.markers) requireIncludes(html, marker, label);
  for (const verboseLegacyMarker of contract.verbose) {
    if (html.includes(verboseLegacyMarker)) fail(`${label} restored oversized legacy meeting-card copy: ${verboseLegacyMarker}`);
  }
}

validateMeetingRows('English Calendar', englishCalendar, 'en');
validateMeetingRows('Japanese Calendar', japaneseCalendar, 'ja');
validateMeetingRows('English Today', englishToday, 'en', { allowEmpty: true });
validateMeetingRows('Japanese Today', japaneseToday, 'ja', { allowEmpty: true });

for (const [label, html] of [
  ['English Calendar', englishCalendar],
  ['Japanese Calendar', japaneseCalendar],
  ['English Today', englishToday],
  ['Japanese Today', japaneseToday],
]) {
  for (const forbidden of [
    'retry_queue',
    'operator_notes',
    'source_snapshot_path',
    'normalized_from_path',
    'raw_html',
    'raw_pdf',
    'raw_text',
  ]) {
    if (html.includes(forbidden)) fail(`${label} exposes forbidden internal field ${forbidden}.`);
  }
}

if (errors.length) {
  console.error(`CALENDAR_PUBLIC_V1_PILOT_RECORD_RENDERED: failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('CALENDAR_PUBLIC_V1_PILOT_RECORD_RENDERED: pass');
console.log(`REFERENCE_DATE: ${expectedReferenceDate}`);
console.log(`TIMEZONE: ${expectedTimezone}`);
console.log('COMPACT_MEETING_ROWS: pass_when_records_exist');
console.log('EMPTY_TODAY_STATE: allowed_when_no_reviewed_records');
console.log('LEGACY_VERBOSE_MEETING_CARDS: absent');
console.log('INTERNAL_QUEUE_FIELDS_EXPOSED: false');
