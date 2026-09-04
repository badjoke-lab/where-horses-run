import assert from 'node:assert/strict';
import {
  decodeKanazawaAnnualScheduleGeometry,
  parseKanazawaOfficialMonthlySchedule,
} from './timetable/kanazawa-official-30d-discovery.mjs';

const monthOrder = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
const fullwidth = ['０', '１', '２', '３', '４', '５', '６', '７', '８', '９'];
const fw = (value) => String(value).replace(/\d/g, (digit) => fullwidth[Number(digit)]);
const textItems = [];
const markers = new Map();
for (const [index, month] of monthOrder.entries()) {
  const year = month >= 4 ? 2026 : 2027;
  const markerY = 529.92 - index * 41.4;
  markers.set(month, markerY);
  textItems.push({ str: fw(month), x: 30.12, y: markerY, w: month >= 10 ? 8.91 : 8.04 });
  textItems.push({ str: '月', x: 30.12, y: markerY - 13.32, w: 8.04 });
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  for (let day = 1; day <= days; day += 1) {
    const width = day < 10 ? 4.47 : 8.91;
    const center = 59.355 + (day - 1) * 24.96;
    textItems.push({ str: String(day), x: center - width / 2, y: markerY - 31.8, w: width });
  }
}

function bar(month, startDay, endDay, color = '#f7c7a7') {
  const y0 = markers.get(month) - 16.68;
  return {
    color,
    x0: 46.44 + (startDay - 1) * 24.96,
    x1: 46.56 + endDay * 24.96,
    y0,
    y1: y0 + 8.4,
    h: 8.4,
  };
}

const bars = [
  bar(9, 1, 1),
  bar(9, 6, 6),
  bar(9, 8, 8),
  bar(9, 13, 13),
  bar(9, 15, 15),
  bar(9, 21, 22),
  bar(9, 28, 29, '#b4c6e7'),
  bar(10, 4, 6, '#b4c6e7'),
  bar(10, 11, 11),
  bar(10, 13, 13),
  bar(10, 18, 20),
  bar(10, 25, 25),
  bar(10, 27, 27),
  bar(10, 30, 30),
];

const decoded = decodeKanazawaAnnualScheduleGeometry({ textItems, bars, months: [9, 10] });
assert.deepEqual(decoded.dates.filter((date) => date.startsWith('2026-09-')), [
  '2026-09-01',
  '2026-09-06',
  '2026-09-08',
  '2026-09-13',
  '2026-09-15',
  '2026-09-21',
  '2026-09-22',
  '2026-09-28',
  '2026-09-29',
]);
assert.deepEqual(decoded.dates.filter((date) => date.startsWith('2026-10-')), [
  '2026-10-04',
  '2026-10-05',
  '2026-10-06',
  '2026-10-11',
  '2026-10-13',
  '2026-10-18',
  '2026-10-19',
  '2026-10-20',
  '2026-10-25',
  '2026-10-27',
  '2026-10-30',
]);

function monthlyHtml(year, month, meetingDays, missingDay = null) {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = [];
  for (let day = 1; day <= days; day += 1) {
    if (day === missingDay) continue;
    cells.push(`<td class="open"><div class="cal_block"><span class="day">${day}<span class="dow"> 日</span></span><div class="cal_content">${meetingDays.includes(day) ? '<span class="place"><p class="kanazawa">本場開催</p></span>' : ''}</div></div></td>`);
  }
  return `<html><body><table id="table_honba"><tr>${cells.join('')}</tr></table></body></html>`;
}

const septemberDays = [1, 6, 8, 13, 15, 21, 22, 28, 29];
assert.deepEqual(parseKanazawaOfficialMonthlySchedule(monthlyHtml(2026, 9, septemberDays), 2026, 9), [
  '2026-09-01',
  '2026-09-06',
  '2026-09-08',
  '2026-09-13',
  '2026-09-15',
  '2026-09-21',
  '2026-09-22',
  '2026-09-28',
  '2026-09-29',
]);
assert.deepEqual(parseKanazawaOfficialMonthlySchedule(monthlyHtml(2026, 10, []), 2026, 10), []);
assert.throws(
  () => parseKanazawaOfficialMonthlySchedule(monthlyHtml(2026, 9, septemberDays, 30), 2026, 9),
  /day grid invalid/,
);
const withoutOctoberMarker = textItems.filter((row) => !(row.x < 40 && row.str === fw(10)));
assert.throws(
  () => decodeKanazawaAnnualScheduleGeometry({ textItems: withoutOctoberMarker, bars, months: [9, 10] }),
  /missing month marker: 10/,
);
assert.doesNotThrow(
  () => decodeKanazawaAnnualScheduleGeometry({ textItems: withoutOctoberMarker, bars, months: [9] }),
);

console.log('KANAZAWA_OFFICIAL_30D: pass');
