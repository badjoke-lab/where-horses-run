import assert from 'node:assert/strict';
import {
  hokkaidoOfficialMonthUrl,
  parseHokkaidoOfficialMonth,
} from './timetable/hokkaido-official-30d-discovery.mjs';

function fixtureMonth(year, month, meetingDays = new Map(), omitDay = null) {
  const total = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  const cells = [];
  for (let day = 1; day <= total; day += 1) {
    if (day === omitDay) continue;
    const marker = meetingDays.get(day);
    cells.push(`<td${marker ? ' class="has_nittel bgblue"' : ''}><div class="day">${day}</div>${marker ? `<img alt="ホッカイドウ競馬" src="logo.png">${marker}` : ''}</td>`);
  }
  const rows = [];
  for (let index = 0; index < cells.length; index += 7) rows.push(`<tr class="hokkaidokeiba">${cells.slice(index, index + 7).join('')}</tr>`);
  return `<html><head><title>開催カレンダー｜ホッカイドウ競馬</title></head><body><table class="calender_table"><tbody>${rows.join('')}</tbody></table></body></html>`;
}

assert.equal(hokkaidoOfficialMonthUrl('2026-09'), 'https://www.hokkaidokeiba.net/kaisai/nittei.php?p_ym=202609');
assert.throws(() => hokkaidoOfficialMonthUrl('2026-9'), /invalid Hokkaido year-month/);

const september = fixtureMonth('2026', '09', new Map([
  [1, '門別11回1日'],
  [8, '門別11回4日'],
  [10, '門別11回6日'],
  [15, '門別12回1日'],
  [24, '門別12回6日'],
  [29, '門別13回1日'],
  [30, '門別13回2日'],
]));
const parsed = parseHokkaidoOfficialMonth(september, '2026', '09', hokkaidoOfficialMonthUrl('2026-09'));
assert.equal(parsed.structural_valid, true);
assert.equal(parsed.day_count, 30);
assert.equal(parsed.unique_day_count, 30);
assert.deepEqual(parsed.meetings.map((row) => row.meeting_id), [
  'nar-monbetsu-racecourse-2026-09-01',
  'nar-monbetsu-racecourse-2026-09-08',
  'nar-monbetsu-racecourse-2026-09-10',
  'nar-monbetsu-racecourse-2026-09-15',
  'nar-monbetsu-racecourse-2026-09-24',
  'nar-monbetsu-racecourse-2026-09-29',
  'nar-monbetsu-racecourse-2026-09-30',
]);
assert.ok(parsed.meetings.every((row) => row.racecourse_id === 'monbetsu-racecourse'));
assert.ok(parsed.meetings.every((row) => row.venue_code === '04'));
assert.ok(parsed.meetings.every((row) => row.source_id === 'hokkaido-keiba-official-calendar'));

const missingDay = parseHokkaidoOfficialMonth(
  fixtureMonth('2026', '09', new Map([[8, '門別11回4日']]), 17),
  '2026',
  '09',
  hokkaidoOfficialMonthUrl('2026-09'),
);
assert.equal(missingDay.structural_valid, false);
assert.equal(missingDay.day_count, 29);

const badLogo = fixtureMonth('2026', '09', new Map([[8, '門別11回4日']]))
  .replace('<img alt="ホッカイドウ競馬" src="logo.png">門別11回4日', '門別11回4日');
const badLogoParsed = parseHokkaidoOfficialMonth(badLogo, '2026', '09', hokkaidoOfficialMonthUrl('2026-09'));
assert.equal(badLogoParsed.structural_valid, false);
assert.equal(badLogoParsed.invalid_cell_count, 1);
assert.equal(badLogoParsed.meetings.length, 0);

const missingTable = parseHokkaidoOfficialMonth('<html>門別11回1日</html>', '2026', '09', hokkaidoOfficialMonthUrl('2026-09'));
assert.equal(missingTable.structural_valid, false);
assert.equal(missingTable.reason, 'missing_calendar_table');

console.log('HOKKAIDO_OFFICIAL_30D: pass');
