import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const referenceDate = process.env.WHR_CALENDAR_REFERENCE_DATE;
const timeZone = process.env.WHR_CALENDAR_TIMEZONE ?? 'UTC';
const errors = [];
const fail = (message) => errors.push(message);

if (!referenceDate) fail('WHR_CALENDAR_REFERENCE_DATE is required for rendered Dynamic Dates QA.');

function readHtml(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`missing rendered page ${relativePath}`);
    return '';
  }
  const html = readFileSync(absolutePath, 'utf8');
  if (html.length < 500) fail(`${relativePath} is unexpectedly small.`);
  for (const marker of ['[object Object]', '>undefined<', '>NaN<', 'Internal Server Error']) {
    if (html.includes(marker)) fail(`${relativePath} contains render error marker ${marker}.`);
  }
  return html;
}

const pages = {
  calendarEn: readHtml('dist/calendar/index.html'),
  calendarJa: readHtml('dist/ja/calendar/index.html'),
  todayEn: readHtml('dist/today/index.html'),
  todayJa: readHtml('dist/ja/today/index.html'),
  tomorrowEn: readHtml('dist/tomorrow/index.html'),
  tomorrowJa: readHtml('dist/ja/tomorrow/index.html'),
};

for (const [name, html] of Object.entries(pages)) {
  if (!html.includes(referenceDate)) fail(`${name} does not show reference date ${referenceDate}.`);
  if (!html.includes(timeZone)) fail(`${name} does not show reference timezone ${timeZone}.`);
  if (html.includes('June 2026 Calendar') || html.includes('2026年6月 開催カレンダー')) {
    fail(`${name} retains fixed June Calendar copy.`);
  }
}

if (!pages.calendarEn.includes('30-day racing calendar')) fail('English Calendar title is not dynamic.');
if (!pages.calendarJa.includes('30日間の開催カレンダー')) fail('Japanese Calendar title is not dynamic.');

const oldMeetingLink = '/timetable/meetings/jra-tokyo-racecourse-2026-06-06/';
if (referenceDate === '2026-06-06') {
  for (const [name, html] of Object.entries(pages)) {
    if (!html.includes('data-calendar-data-status="current_window_available"')) {
      fail(`${name} must report current_window_available for the fixture date.`);
    }
  }
  if (!pages.todayEn.includes(oldMeetingLink) || !pages.todayJa.includes(oldMeetingLink)) {
    fail('Today pages do not render the known June 6 JRA meeting.');
  }
  if (!pages.calendarEn.includes(oldMeetingLink) || !pages.calendarJa.includes(oldMeetingLink)) {
    fail('Calendar pages do not render the known June 6 JRA meeting.');
  }
  if (!pages.tomorrowEn.includes('2026-06-07') || !pages.tomorrowJa.includes('2026-06-07')) {
    fail('Tomorrow pages do not resolve June 7 from the June 6 reference date.');
  }
}

if (referenceDate === '2026-07-01') {
  for (const [name, html] of Object.entries(pages)) {
    if (!html.includes('data-calendar-data-status="stale_generation_with_window_records"')) {
      fail(`${name} must report stale_generation_with_window_records for the July 1 reference date.`);
    }
    if (html.includes(oldMeetingLink)) fail(`${name} leaks an old June meeting into the current window.`);
  }
  if (!pages.todayEn.includes('Sha Tin Racecourse') || !pages.todayJa.includes('Sha Tin Racecourse')) {
    fail('July 1 Today pages do not render the reviewed Sha Tin meeting.');
  }
  if (!pages.calendarEn.includes('Happy Valley Racecourse') || !pages.calendarJa.includes('Happy Valley Racecourse')) {
    fail('July rolling Calendar pages do not render later reviewed meetings.');
  }
  if (!pages.tomorrowEn.includes('No reviewed public meetings are listed')) fail('English Tomorrow empty state is missing.');
  if (!pages.tomorrowJa.includes('確認済み公開開催')) fail('Japanese Tomorrow empty state is missing.');
}

if (errors.length) {
  console.error(`CALENDAR_DYNAMIC_DATES_RENDERED: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`CALENDAR_DYNAMIC_DATES_RENDERED: pass reference_date=${referenceDate} timezone=${timeZone}`);
console.log('BILINGUAL_CALENDAR_TODAY_TOMORROW: pass');
console.log('FIXED_JUNE_COPY: 0');
