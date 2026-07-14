import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];
const fail = (message) => errors.push(message);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const parse = (file) => JSON.parse(read(file));

const audit = parse('data/audits/racecourse-page-public-timetable-connection-v1.json');
const publicMeetings = parse('data/generated/timetable/public/meeting-list.json');
const helper = read('src/lib/racecourses/publicRacecourseMeetingState.ts');
const component = read('src/components/RacecoursePublicMeetingPanel.astro');
const englishPage = read('src/pages/tracks/[slug].astro');
const japanesePage = read('src/pages/ja/tracks/[slug].astro');

if (audit.schema_version !== 'racecourse-page-public-timetable-connection-v1') fail('audit schema differs');
if (audit.work_id !== 'WHR-RACECOURSE-PAGES-V1') fail('audit Work ID differs');
if (audit.implementation_unit !== 'RACECOURSE-PAGE-PUBLIC-TIMETABLE-CONNECTION-01') fail('audit implementation unit differs');
if (!['implemented_for_review', 'complete'].includes(audit.status)) fail('audit status differs');
if (audit.fixture_reference_date !== '2026-07-14' || audit.fixture_timezone !== 'Asia/Tokyo') fail('fixture boundary differs');
if (audit.scope?.canonical_racecourse_pages !== 36 || audit.scope?.racecourses_with_public_meetings !== 26 || audit.scope?.public_meetings !== 169) fail('scope counts differ');
if ((audit.scope?.today_fixture_racecourse_ids ?? []).length !== 5) fail('today fixture racecourse set differs');
if ((audit.scope?.next_fixture_examples ?? []).length !== 3) fail('next fixture examples differ');
if (audit.presentation?.upcoming_preview_limit !== 8) fail('upcoming preview limit differs');
if (Object.values(audit.boundaries ?? {}).some((value) => value !== false)) fail('connection boundaries must remain false');
if (audit.next_implementation_unit !== 'RACECOURSE-PAGE-PROFILE-EVIDENCE-01') fail('next implementation unit differs');

if ((publicMeetings.meetings ?? []).length !== 169) fail('public meeting count differs');
if (new Set(publicMeetings.meetings.map((meeting) => meeting.racecourse_id)).size !== 26) fail('public racecourse identity count differs');

for (const marker of [
  'createCalendarDateContext',
  'getPublicTimetableGeneratedAt',
  'getPublicTimetableMeetingRowsByRacecourse',
  'today_meetings',
  'next_meeting_date',
  'upcoming_meetings',
]) if (!helper.includes(marker)) fail(`racecourse meeting state helper missing ${marker}`);

for (const marker of [
  'data-racecourse-public-meeting-state',
  'data-reference-date',
  'data-today-count',
  'data-next-date',
  'Public Calendar connection',
  '公開カレンダー接続',
  'No reviewed public meeting is listed for today.',
  '本日の確認済み公開開催はありません。',
  'upcoming_meetings.slice(0, 8)',
]) if (!component.includes(marker)) fail(`racecourse meeting panel missing ${marker}`);

for (const [label, source] of [['English track page', englishPage], ['Japanese track page', japanesePage]]) {
  for (const marker of ['RacecoursePublicMeetingPanel', 'getPublicRacecourseMeetingState', 'publicMeetingState']) {
    if (!source.includes(marker)) fail(`${label} missing ${marker}`);
  }
}
if (!englishPage.includes('<RacecoursePublicMeetingPanel state={publicMeetingState} officialScheduleUrl={primaryScheduleUrl} />')) fail('English meeting panel binding differs');
if (!japanesePage.includes('<RacecoursePublicMeetingPanel state={publicMeetingState} lang="ja" officialScheduleUrl={primaryScheduleUrl} />')) fail('Japanese meeting panel binding differs');

const implementationText = `${helper}\n${component}`.toLowerCase();
for (const fragment of ['review_queue', 'retry_queue', 'attempt_history', 'operator_note', 'reviewer_identity', 'raw_html', 'source_body', 'stream_url']) {
  if (implementationText.includes(fragment)) fail(`public racecourse connection contains prohibited internal marker ${fragment}`);
}
for (const field of ['horse_name', 'jockey_name', 'trainer_name', 'odds', 'payout', 'prediction']) {
  const quotedKey = new RegExp(`["']${field}["']\\s*:`);
  const meetingAccess = new RegExp(`\\bmeeting\\.${field}\\b`);
  if (quotedKey.test(implementationText) || meetingAccess.test(implementationText)) {
    fail(`public racecourse connection reads prohibited field ${field}`);
  }
}

if (!fs.existsSync(path.join(root, 'dist'))) fail('dist is missing; run npm run build first');
const html = (route) => read(`dist/${route}/index.html`);
const attr = (content, name) => content.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? null;

const allTrackSlugs = fs.readdirSync(path.join(root, 'dist/tracks'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((slug) => fs.existsSync(path.join(root, 'dist/tracks', slug, 'index.html')));
if (allTrackSlugs.length !== 36) fail(`rendered English racecourse route count must be 36; found ${allTrackSlugs.length}`);
for (const slug of allTrackSlugs) {
  const en = html(`tracks/${slug}`);
  const ja = html(`ja/tracks/${slug}`);
  if (!en.includes('data-racecourse-public-meeting-state')) fail(`${slug}: English public meeting panel missing`);
  if (!ja.includes('data-racecourse-public-meeting-state')) fail(`${slug}: Japanese public meeting panel missing`);
  if (attr(en, 'data-reference-date') !== '2026-07-14' || attr(ja, 'data-reference-date') !== '2026-07-14') fail(`${slug}: fixture reference date differs`);
  if (!en.includes('/calendar/') || !ja.includes('/ja/calendar/')) fail(`${slug}: Calendar link missing`);
}

for (const racecourseId of audit.scope.today_fixture_racecourse_ids) {
  const en = html(`tracks/${racecourseId}`);
  const todayCount = Number(attr(en, 'data-today-count'));
  if (!Number.isInteger(todayCount) || todayCount < 1) fail(`${racecourseId}: expected reviewed meeting today`);
  if (!en.includes('2026-07-14') || !en.includes('Official source')) fail(`${racecourseId}: today state evidence missing`);
}

for (const example of audit.scope.next_fixture_examples) {
  const en = html(`tracks/${example.racecourse_id}`);
  const ja = html(`ja/tracks/${example.racecourse_id}`);
  if (attr(en, 'data-next-date') !== example.next_meeting_date || attr(ja, 'data-next-date') !== example.next_meeting_date) fail(`${example.racecourse_id}: next meeting date differs`);
  if (!en.includes(example.next_meeting_date) || !ja.includes(example.next_meeting_date)) fail(`${example.racecourse_id}: rendered next meeting date missing`);
}

const noFuture = html(`tracks/${audit.scope.no_future_fixture_example}`);
if (attr(noFuture, 'data-next-date') !== '') fail('no-future fixture must keep empty next date');
if (!noFuture.includes('No next meeting is listed in the current public 30-day window.')) fail('no-future empty state missing');

const kanazawaJa = html('ja/tracks/kanazawa-racecourse');
if (!kanazawaJa.includes('/ja/timetable/meetings/') || !kanazawaJa.includes('公式ソース')) fail('Japanese localized meeting links are missing');

if (errors.length) {
  console.error(`RACECOURSE_PAGE_PUBLIC_TIMETABLE_CONNECTION: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('RACECOURSE_PAGE_PUBLIC_TIMETABLE_CONNECTION: pass');
console.log('REFERENCE_DATE: 2026-07-14');
console.log('PUBLIC_MEETINGS: 169');
console.log('PUBLIC_RACECOURSE_IDS: 26');
console.log('RENDERED_BILINGUAL_RACECOURSE_ROUTES: 72');
console.log('TODAY_FIXTURE_RACECOURSES: 5');
console.log('INTERNAL_QUEUE_READ: false');
console.log('AUTOMATIC_PUBLICATION: false');
