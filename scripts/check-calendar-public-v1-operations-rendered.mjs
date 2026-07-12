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

const expectedDataStatus = process.env.WHR_EXPECTED_CALENDAR_DATA_STATUS;
if (!expectedDataStatus) fail('WHR_EXPECTED_CALENDAR_DATA_STATUS is required.');

const pages = {
  calendarEn: read('dist/calendar/index.html'),
  calendarJa: read('dist/ja/calendar/index.html'),
  todayEn: read('dist/today/index.html'),
  todayJa: read('dist/ja/today/index.html'),
  tomorrowEn: read('dist/tomorrow/index.html'),
  tomorrowJa: read('dist/ja/tomorrow/index.html'),
};

for (const name of ['calendarEn', 'todayEn', 'tomorrowEn']) {
  const html = pages[name];
  requireIncludes(html, 'Operations status', name);
  requireIncludes(html, 'Additional detail and source recovery are handled through reviewed operations. Updates are not automatic.', name);
  requireIncludes(html, 'Automatic publication is disabled.', name);
}
for (const name of ['calendarJa', 'todayJa', 'tomorrowJa']) {
  const html = pages[name];
  requireIncludes(html, '運用状態', name);
  requireIncludes(html, '追加詳細の取得とソース復旧は、人間レビューを伴う運用で管理します。更新は自動ではありません。', name);
  requireIncludes(html, '自動公開は無効です。', name);
}

for (const [name, html] of Object.entries(pages)) {
  requireIncludes(html, `data-calendar-data-status="${expectedDataStatus}"`, name);
  requireIncludes(html, 'data-calendar-retry-ownership="reviewed_operations"', name);
  requireIncludes(html, 'data-calendar-automatic-publication="false"', name);
  const hasReviewedSource = html.includes('data-calendar-source-presentation="visible_sources_reviewed"');
  const hasSourceAttention = html.includes('data-calendar-source-presentation="visible_source_attention"');
  if (!hasReviewedSource && !hasSourceAttention) fail(`${name} must expose a reviewed or attention source presentation state.`);
  if (html.includes('data-calendar-source-presentation="source_failure_under_review"')) {
    fail(`${name} must not invent a production source failure without a reviewed public-safe failure summary.`);
  }
  for (const forbidden of [
    'review_queue',
    'retry_queue',
    'retry_attempts',
    'attempt_history',
    'next_eligible_at',
    'operator_notes',
    'required_decision',
  ]) {
    if (html.includes(forbidden)) fail(`${name} exposes forbidden internal field ${forbidden}.`);
  }
}

if (errors.length) {
  console.error(`CALENDAR_PUBLIC_V1_OPERATIONS_RENDERED: failed (${errors.length})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('CALENDAR_PUBLIC_V1_OPERATIONS_RENDERED: pass');
console.log(`EXPECTED_DATA_STATUS: ${expectedDataStatus}`);
console.log('PUBLIC_ROUTES: 6');
console.log('RETRY_OWNERSHIP: reviewed_operations');
console.log('SOURCE_FAILURE_INVENTED: false');
console.log('AUTOMATIC_PUBLICATION: false');
