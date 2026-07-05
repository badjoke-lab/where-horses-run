import fs from 'node:fs';
import { parseNarMonthlyScheduleGrid } from './timetable/parse-nar-monthly-schedule-grid.mjs';

const matrix = JSON.parse(fs.readFileSync('data/static/nar-flat-racecourse-compatibility-v1.json', 'utf8'));
const days = Array.from({ length: 31 }, (_, index) => `<th>${index + 1}</th>`).join('');
const rows = matrix.records.map((record, index) => {
  const inactive = ['mizusawa-racecourse', 'himeji-racecourse'].includes(record.racecourse_id);
  const cells = Array.from({ length: 31 }, (_, dayIndex) => {
    const day = dayIndex + 1;
    if (inactive) return '<td></td>';
    if (index === 0 && day === 1) {
      return `<td><a href="/KeibaWeb/TodayRaceInfo/RaceList?k_babaCode=${record.venue_code}&k_raceDate=2026%2F07%2F01">☆</a></td>`;
    }
    if ((index === 0 && day === 31) || (index > 0 && day === 15)) return '<td>●</td>';
    return '<td></td>';
  }).join('');
  return `<tr><th>${record.name_ja}</th>${cells}<th>${record.name_ja}</th></tr>`;
}).join('');
const html = `<table><tr><th>場</th>${days}<th>場</th></tr>${rows}</table>`;
const result = parseNarMonthlyScheduleGrid({
  html,
  month: '2026-07',
  venues: matrix.records.map((record) => ({
    venue_code: record.venue_code,
    racecourse_id: record.racecourse_id,
    name_en: record.name_en,
    name_ja: record.name_ja,
  })),
});

const errors = [];
if (result.racecourses_checked !== 14) errors.push('parser must return fourteen racecourses.');
if (result.month_length !== 31) errors.push('parser must preserve July month length.');
const monbetsu = result.records.find((record) => record.racecourse_id === 'monbetsu-racecourse');
if (JSON.stringify(monbetsu?.meeting_dates) !== JSON.stringify(['2026-07-01', '2026-07-31'])) errors.push('first venue day mapping differs.');
if (monbetsu?.meetings[0]?.race_list_linked_from_schedule !== true) errors.push('linked RaceList detection differs.');
for (const id of ['mizusawa-racecourse', 'himeji-racecourse']) {
  const record = result.records.find((row) => row.racecourse_id === id);
  if (record?.meeting_dates.length !== 0) errors.push(`${id} must remain no-meeting in synthetic July fixture.`);
}
if (errors.length) {
  console.error(`CALENDAR_NAR_FULL_MONTH_PARSER: failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}
console.log('CALENDAR_NAR_FULL_MONTH_PARSER: pass');
console.log(`RACECOURSES: ${result.racecourses_checked}`);
console.log(`SYNTHETIC_SCHEDULED_MEETINGS: ${result.meetings_scheduled}`);
console.log('MONTH_BOUNDARY: 2026-07-01..2026-07-31');
