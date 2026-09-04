import assert from 'node:assert/strict';
import {
  discoverIwatekeibaOfficial30d,
  iwatekeibaMonthUrl,
  parseIwatekeibaCalendarMonth,
} from './timetable/iwatekeiba-official-30d-discovery.mjs';

assert.equal(iwatekeibaMonthUrl('2026-09-06'), 'https://www.iwatekeiba.or.jp/calendar/2026_09');
assert.equal(iwatekeibaMonthUrl('2026-10-01'), 'https://www.iwatekeiba.or.jp/calendar/2026_10');

const fixture = `
<table>
<tr><td><div>9月5日（土）場外発売</div></td></tr>
<tr><td rowspan="6"><img src="/dir/wp-content/uploads/2018/03/18_c_miz.png"></td><td><div>9月6日（日）</div></td></tr>
<tr><td>発売情報</td></tr>
<tr><td><div>9月7日（月）</div></td></tr>
<tr><td>発売情報</td></tr>
<tr><td><div>9月8日（火）</div></td></tr>
<tr><td>発売情報</td></tr>
<tr><td rowspan="4"><img src="/dir/wp-content/uploads/2018/03/18_c_mori.png"></td><td><div>9月13日（日）</div></td></tr>
<tr><td>発売情報</td></tr>
<tr><td><div>9月14日（月）</div></td></tr>
<tr><td>発売情報</td></tr>
</table>`;
const parsed = parseIwatekeibaCalendarMonth(fixture, {
  year: 2026,
  month: 9,
  allowedDates: ['2026-09-05', '2026-09-06', '2026-09-07', '2026-09-08', '2026-09-13', '2026-09-14'],
  sourceUrl: 'https://www.iwatekeiba.or.jp/calendar/2026_09',
});
assert.equal(parsed.structural_valid, true);
assert.equal(parsed.recognized_block_count, 2);
assert.equal(parsed.invalid_block_count, 0);
assert.deepEqual(parsed.meetings.map((row) => row.meeting_id), [
  'nar-mizusawa-racecourse-2026-09-06',
  'nar-mizusawa-racecourse-2026-09-07',
  'nar-mizusawa-racecourse-2026-09-08',
  'nar-morioka-racecourse-2026-09-13',
  'nar-morioka-racecourse-2026-09-14',
]);
assert.deepEqual(parsed.meetings.map((row) => row.venue_code), ['11', '11', '11', '10', '10']);
assert.ok(!parsed.meetings.some((row) => row.date === '2026-09-05'));

const invalid = parseIwatekeibaCalendarMonth('<table><tr><td>9月6日</td></tr></table>', {
  year: 2026,
  month: 9,
  allowedDates: ['2026-09-06'],
  sourceUrl: 'https://www.iwatekeiba.or.jp/calendar/2026_09',
});
assert.equal(invalid.structural_valid, false);
assert.deepEqual(invalid.meetings, []);

const fetchImpl = async (url) => ({
  ok: true,
  status: 200,
  url,
  headers: { get: () => 'text/html; charset=UTF-8' },
  arrayBuffer: async () => new TextEncoder().encode(fixture).buffer,
});
const discovered = await discoverIwatekeibaOfficial30d({
  dates: ['2026-09-06', '2026-09-07', '2026-09-08'],
  fetchImpl,
});
assert.equal(discovered.completeness.completeness, 'complete');
assert.equal(discovered.completeness.failure_count, 0);
assert.equal(discovered.completeness.parsed_meeting_count, 3);
assert.deepEqual(discovered.meetings.map((row) => row.meeting_id), [
  'nar-mizusawa-racecourse-2026-09-06',
  'nar-mizusawa-racecourse-2026-09-07',
  'nar-mizusawa-racecourse-2026-09-08',
]);
console.log('IWATEKEIBA_OFFICIAL_30D: pass');
