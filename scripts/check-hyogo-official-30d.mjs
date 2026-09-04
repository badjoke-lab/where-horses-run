import assert from 'node:assert/strict';
import {
  discoverHyogoOfficial30d,
  hyogoOfficialMonthUrl,
  parseHyogoOfficialCalendarMonth,
} from './timetable/hyogo-official-30d-discovery.mjs';

function fixture(year, month, meetings = {}, outMeeting = null) {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = [];
  for (let day = 1; day <= days; day += 1) {
    const venue = meetings[day];
    cells.push(`<td class="l-cal_itm"><div class="l-cal_date"><span>${String(day).padStart(2, '0')}</span>水</div>${venue ? `<div class="l-cal_race"><div>${venue}競馬1回${day}日目</div></div>` : ''}</td>`);
  }
  if (outMeeting) cells.push(`<td class="l-cal_itm -out"><div class="l-cal_date"><span>01</span>木</div><div class="l-cal_race"><div>${outMeeting}競馬2回1日目</div></div></td>`);
  return `<div class="l-cal_nav_date">${year}/${String(month).padStart(2, '0')}</div><table class="l-cal"><tbody><tr>${cells.join('')}</tr></tbody></table>`;
}

assert.equal(hyogoOfficialMonthUrl('2026-09-04'), 'https://www.sonoda-himeji.jp/schedule/2026/09');
assert.equal(hyogoOfficialMonthUrl('2026-10-01'), 'https://www.sonoda-himeji.jp/schedule/2026/10');

const september = fixture(2026, 9, { 4: '園田', 9: '園田', 10: '園田', 11: '園田' }, '姫路');
const parsed = parseHyogoOfficialCalendarMonth(september, {
  year: 2026,
  month: 9,
  allowedDates: ['2026-09-04', '2026-09-09', '2026-09-10', '2026-09-11'],
  sourceUrl: 'https://www.sonoda-himeji.jp/schedule/2026/09',
});
assert.equal(parsed.structural_valid, true);
assert.equal(parsed.current_cell_count, 30);
assert.equal(parsed.invalid_cell_count, 0);
assert.deepEqual(parsed.meetings.map((row) => row.meeting_id), [
  'nar-sonoda-racecourse-2026-09-04',
  'nar-sonoda-racecourse-2026-09-09',
  'nar-sonoda-racecourse-2026-09-10',
  'nar-sonoda-racecourse-2026-09-11',
]);
assert.ok(!parsed.meetings.some((row) => row.racecourse_id === 'himeji-racecourse'));
assert.deepEqual([...new Set(parsed.meetings.map((row) => row.venue_code))], ['27']);

const himeji = parseHyogoOfficialCalendarMonth(fixture(2026, 2, { 3: '姫路' }), {
  year: 2026,
  month: 2,
  allowedDates: ['2026-02-03'],
  sourceUrl: 'https://www.sonoda-himeji.jp/schedule/2026/02',
});
assert.equal(himeji.structural_valid, true);
assert.equal(himeji.meetings[0].meeting_id, 'nar-himeji-racecourse-2026-02-03');
assert.equal(himeji.meetings[0].venue_code, '28');

const broken = parseHyogoOfficialCalendarMonth('<div class="l-cal_nav_date">2026/09</div><table class="l-cal"><td class="l-cal_itm"><div class="l-cal_date"><span>04</span></div></td></table>', {
  year: 2026,
  month: 9,
  allowedDates: ['2026-09-04'],
  sourceUrl: 'https://www.sonoda-himeji.jp/schedule/2026/09',
});
assert.equal(broken.structural_valid, false);

const october = fixture(2026, 10, { 1: '園田', 2: '園田' });
const fetchImpl = async (url) => ({
  ok: true,
  status: 200,
  url,
  arrayBuffer: async () => new TextEncoder().encode(url.endsWith('/09') ? september : october).buffer,
});
const discovered = await discoverHyogoOfficial30d({
  dates: ['2026-09-04', '2026-09-09', '2026-09-10', '2026-09-11', '2026-10-01', '2026-10-02'],
  fetchImpl,
});
assert.equal(discovered.completeness.completeness, 'complete');
assert.equal(discovered.completeness.failure_count, 0);
assert.equal(discovered.completeness.parsed_meeting_count, 6);
assert.deepEqual(discovered.meetings.map((row) => row.meeting_id), [
  'nar-sonoda-racecourse-2026-09-04',
  'nar-sonoda-racecourse-2026-09-09',
  'nar-sonoda-racecourse-2026-09-10',
  'nar-sonoda-racecourse-2026-09-11',
  'nar-sonoda-racecourse-2026-10-01',
  'nar-sonoda-racecourse-2026-10-02',
]);
console.log('HYOGO_OFFICIAL_30D: pass');
