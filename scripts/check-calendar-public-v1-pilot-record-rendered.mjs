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

const expectedReferenceDate = process.env.WHR_CALENDAR_REFERENCE_DATE ?? '2026-07-01';
const expectedTimezone = process.env.WHR_CALENDAR_TIMEZONE ?? 'Asia/Tokyo';
if (expectedReferenceDate !== '2026-07-01') fail('rendered pilot-record fixture must use 2026-07-01.');
if (expectedTimezone !== 'Asia/Tokyo') fail('rendered pilot-record fixture must use Asia/Tokyo.');

const pages = [
  ['English Calendar', read('dist/calendar/index.html'), 'en'],
  ['Japanese Calendar', read('dist/ja/calendar/index.html'), 'ja'],
  ['English Today', read('dist/today/index.html'), 'en'],
  ['Japanese Today', read('dist/ja/today/index.html'), 'ja'],
];

const languageContracts = {
  en: {
    markers: ['Public rank', 'Authority', 'Country', 'Source', 'Checked', 'Official'],
    verbose: ['Reviewed coverage', 'Additional detail', 'Meeting date and racecourse only', 'More detail not reviewed'],
  },
  ja: {
    markers: ['公開ランク', '主催', '国', 'ソース', '確認', '公式'],
    verbose: ['確認済み範囲', '追加詳細', '開催日・競馬場のみ', '追加詳細は未確認'],
  },
};

const decodeText = (html) => html
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&#39;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/\s+/g, ' ')
  .trim();

function extractMeetingRows(html) {
  return [...html.matchAll(/<li[^>]*class="[^"]*\bmeeting-row\b[^"]*"[^>]*>[\s\S]*?<\/li>/g)]
    .map((match) => match[0]);
}

for (const [label, html, lang] of pages) {
  const rows = extractMeetingRows(html);
  if (rows.length === 0) {
    fail(`${label} missing rendered meeting rows for ${expectedReferenceDate}`);
    continue;
  }
  const contract = languageContracts[lang];
  rows.forEach((row, index) => {
    const text = decodeText(row);
    for (const marker of contract.markers) {
      if (!text.includes(marker)) fail(`${label} meeting row ${index + 1} missing ${marker}`);
    }
    for (const verboseLegacyMarker of contract.verbose) {
      if (text.includes(verboseLegacyMarker)) {
        fail(`${label} meeting row ${index + 1} restored oversized legacy copy: ${verboseLegacyMarker}`);
      }
    }
  });

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
console.log('COMPACT_MEETING_ROWS: pass');
console.log('MEETING_ROW_LABELS: pass');
console.log('LEGACY_VERBOSE_MEETING_CARDS: absent');
console.log('INTERNAL_QUEUE_FIELDS_EXPOSED: false');
