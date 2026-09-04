import assert from 'node:assert/strict';
import {
  decodeSagaAnnualScheduleText,
  parseSagaMonthlyScheduleHtml,
  SAGA_FISCAL_YEAR_WINDOW,
  SAGA_SOURCE_ID,
} from './timetable/saga-official-30d-discovery.mjs';

const months = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
const selected = new Map(months.map((month) => [month, [1, 2]]));
selected.set(9, [3, 5, 6, 12, 19, 20, 21, 26, 27]);
selected.set(10, [1, 10, 11, 12, 17, 18, 24, 25, 26, 31]);

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function annualFixture({ omitMonth = null } = {}) {
  const items = [
    { str: '令和8年度', x: 300, y: 820, w: 50 },
    { str: '佐賀競馬', x: 360, y: 820, w: 50 },
    { str: '開催日程', x: 420, y: 820, w: 50 },
  ];
  months.forEach((month, index) => {
    const year = month >= 4 ? 2026 : 2027;
    const dayY = 760 - index * 50;
    const count = daysInMonth(year, month);
    for (let day = 1; day <= count; day += 1) items.push({ str: String(day), x: 100 + (day - 1) * 20, y: dayY, w: 8 });
    if (month !== omitMonth) {
      for (const day of selected.get(month)) items.push({ str: '●', x: 100 + (day - 1) * 20, y: dayY - 18, w: 8 });
    }
  });
  return items;
}

const decoded = decodeSagaAnnualScheduleText(annualFixture());
assert.equal(decoded.months.length, 12);
assert.deepEqual(decoded.dates.filter((date) => date.startsWith('2026-09-')), [
  '2026-09-03', '2026-09-05', '2026-09-06', '2026-09-12', '2026-09-19',
  '2026-09-20', '2026-09-21', '2026-09-26', '2026-09-27',
]);
assert.deepEqual(decoded.dates.filter((date) => date.startsWith('2026-10-')), [
  '2026-10-01', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-17',
  '2026-10-18', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-31',
]);
assert.throws(() => decodeSagaAnnualScheduleText(annualFixture({ omitMonth: 10 })), /meeting row missing/);
assert.throws(() => decodeSagaAnnualScheduleText(annualFixture().filter((item) => item.str !== '開催日程')), /schedule title marker missing/);

function monthlyFixture(year, month, homeDays) {
  const count = daysInMonth(year, month);
  const rows = Array.from({ length: count }, (_, index) => {
    const day = index + 1;
    return `<tr><td>${day}</td><td>曜</td><td>${homeDays.includes(day) ? '佐賀' : ''}</td><td></td></tr>`;
  }).join('');
  return `<!doctype html><html><head><title>月別開催日程 ${year}年${month}月 | 佐賀競馬（さがけいば）</title></head><body><table><tr><th colspan="2">日付・曜</th><th>本場<br>開催</th><th>主なレース等</th></tr>${rows}</table></body></html>`;
}

const septemberDays = [3, 5, 6, 12, 19, 20, 21, 26, 27];
assert.deepEqual(parseSagaMonthlyScheduleHtml(monthlyFixture(2026, 9, septemberDays), 2026, 9), septemberDays.map((day) => `2026-09-${String(day).padStart(2, '0')}`));
assert.throws(() => parseSagaMonthlyScheduleHtml(monthlyFixture(2026, 9, septemberDays).replace('<tr><td>30</td><td>曜</td><td></td><td></td></tr>', ''), 2026, 9), /day-row count invalid/);
assert.throws(() => parseSagaMonthlyScheduleHtml(monthlyFixture(2026, 9, septemberDays).replace('月別開催日程 2026年9月', '月別開催日程 2026年8月'), 2026, 9), /title invalid/);

assert.equal(SAGA_SOURCE_ID, 'saga-keiba-official-calendar');
assert.deepEqual(SAGA_FISCAL_YEAR_WINDOW, { start: '2026-04-01', end: '2027-03-31' });
console.log('SAGA_OFFICIAL_30D: pass');
