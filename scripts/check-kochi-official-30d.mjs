import assert from 'node:assert/strict';
import { decodeKochiAnnualScheduleText } from './timetable/kochi-official-30d-discovery.mjs';

const textItems = [
  { str: '令和8年度', x: 430, y: 664, w: 45 },
  { str: '開催日程', x: 545, y: 664, w: 40 },
];
const monthMarkers = new Map([
  [9, 381.18],
  [10, 330.87],
]);

function addMonth(month, year, meetingDays, marker = '☆') {
  const markerY = monthMarkers.get(month);
  textItems.push({ str: `${month}月`, x: month < 10 ? 51.2 : 48.46, y: markerY, w: 20 });
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  for (let day = 1; day <= days; day += 1) {
    const width = day < 10 ? 5.55 : 11.04;
    const center = 90.555 + (day - 1) * 28.92;
    textItems.push({ str: String(day), x: center - width / 2, y: markerY + 18.5, w: width });
  }
  for (const day of meetingDays) {
    const center = 90.555 + (day - 1) * 28.92;
    textItems.push({ str: day === meetingDays.at(-1) && marker === '◎' ? '◎' : '☆', x: center - 4.99, y: markerY - 6.65, w: 9.98 });
  }
}

addMonth(9, 2026, [5, 6, 12, 13, 20, 22, 26, 27]);
addMonth(10, 2026, [3, 4, 10, 11, 17, 18, 24, 25, 31], '◎');

const decoded = decodeKochiAnnualScheduleText(textItems, [9, 10]);
assert.deepEqual(decoded.dates, [
  '2026-09-05',
  '2026-09-06',
  '2026-09-12',
  '2026-09-13',
  '2026-09-20',
  '2026-09-22',
  '2026-09-26',
  '2026-09-27',
  '2026-10-03',
  '2026-10-04',
  '2026-10-10',
  '2026-10-11',
  '2026-10-17',
  '2026-10-18',
  '2026-10-24',
  '2026-10-25',
  '2026-10-31',
]);
assert.deepEqual(decoded.months, [
  { year: 2026, month: 9, meeting_count: 8 },
  { year: 2026, month: 10, meeting_count: 9 },
]);

assert.deepEqual(decodeKochiAnnualScheduleText(textItems, [9]).dates, decoded.dates.filter((date) => date.startsWith('2026-09-')));
assert.throws(
  () => decodeKochiAnnualScheduleText(textItems.filter((item) => item.str !== '10月'), [9, 10]),
  /month marker invalid for 2026-10/,
);
assert.throws(
  () => decodeKochiAnnualScheduleText(textItems.filter((item) => !(item.str === '30' && Math.abs(item.y - (381.18 + 18.5)) < 0.1)), [9]),
  /day grid invalid for 2026-09/,
);
const unmapped = textItems.map((item) => item);
unmapped.push({ str: '☆', x: 1000, y: 381.18 - 6.65, w: 9.98 });
assert.throws(() => decodeKochiAnnualScheduleText(unmapped, [9]), /does not map to a day/);
assert.throws(() => decodeKochiAnnualScheduleText(textItems.filter((item) => item.str !== '令和8年度'), [9]), /fiscal-year marker missing/);
assert.throws(() => decodeKochiAnnualScheduleText(textItems.filter((item) => item.str !== '開催日程'), [9]), /schedule title marker missing/);

console.log('KOCHI_OFFICIAL_30D: pass');
