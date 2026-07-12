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

for (const [label, html] of [
  ['English Calendar', englishCalendar],
  ['English Today', englishToday],
]) {
  requireIncludes(html, 'Reviewed coverage', label);
  requireIncludes(html, 'Additional detail', label);
  requireIncludes(html, 'Meeting date and racecourse only', label);
  requireIncludes(html, 'More detail not reviewed', label);
  requireIncludes(html, 'Source status', label);
  requireIncludes(html, 'Last checked', label);
  requireIncludes(html, 'Official source', label);
}

for (const [label, html] of [
  ['Japanese Calendar', japaneseCalendar],
  ['Japanese Today', japaneseToday],
]) {
  requireIncludes(html, '確認済み範囲', label);
  requireIncludes(html, '追加詳細', label);
  requireIncludes(html, '開催日・競馬場のみ', label);
  requireIncludes(html, '追加詳細は未確認', label);
  requireIncludes(html, 'ソース状態', label);
  requireIncludes(html, '最終確認', label);
  requireIncludes(html, '公式ソース', label);
}

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
console.log('BILINGUAL_COVERAGE_LABELS: pass');
console.log('INTERNAL_QUEUE_FIELDS_EXPOSED: false');
