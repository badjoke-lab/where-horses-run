import assert from 'node:assert/strict';
import {
  discoverNankankeibaOfficial30d,
  nankankeibaQuarterUrl,
  parseNankankeibaCalendarMonth,
  parseNankankeibaProgrammeDates,
} from './timetable/nankankeiba-official-30d-discovery.mjs';

assert.equal(nankankeibaQuarterUrl('2026-09-07'), 'https://www.nankankeiba.com/calendar/202607.do');
assert.equal(nankankeibaQuarterUrl('2026-10-01'), 'https://www.nankankeiba.com/calendar/202610.do');

const blank = () => '<td></td>';
const venueRow = (name, cells) => `<tr><td>${name}</td>${cells.join('')}</tr>`;
const monthCells = Array.from({ length: 30 }, blank);
monthCells[6] = '<td><a href="/bangumi/20262107.do">番組</a></td>';
const calendarFixture = `<h3>9月</h3><table>
${venueRow('浦和', Array.from({ length: 30 }, blank))}
${venueRow('船橋', Array.from({ length: 30 }, blank))}
${venueRow('大井', Array.from({ length: 30 }, blank))}
${venueRow('川崎', monthCells)}
</table><h3>10月</h3>`;
const parsed = parseNankankeibaCalendarMonth(calendarFixture, {
  year: 2026,
  month: 9,
  allowedDates: ['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11'],
  sourceUrl: 'https://www.nankankeiba.com/calendar/202607.do',
});
assert.equal(parsed.structural_valid, true);
assert.deepEqual(parsed.meetings.map((row) => row.meeting_id), ['nar-kawasaki-racecourse-2026-09-07']);
assert.equal(parsed.programme_links[0].url, 'https://www.nankankeiba.com/bangumi/20262107.do');

const programmeFixture = '<table><tr><th>1日目</th><th>2日目</th><th>3日目</th><th>4日目</th><th>5日目</th></tr><tr><th>9月7日（月）</th><th>9月8日（火）</th><th>9月9日（水）</th><th>9月10日（木）</th><th>9月11日（金）</th></tr></table>';
assert.deepEqual(parseNankankeibaProgrammeDates(programmeFixture, 2026), [
  '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11',
]);

const discovered = await discoverNankankeibaOfficial30d({
  dates: ['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11'],
  fetchImpl: async (url) => new Response(url.includes('/bangumi/') ? programmeFixture : calendarFixture, { status: 200 }),
});
assert.equal(discovered.completeness.completeness, 'complete');
assert.equal(discovered.meetings.length, 5);
assert.deepEqual(discovered.meetings.map((row) => row.meeting_id), [
  'nar-kawasaki-racecourse-2026-09-07',
  'nar-kawasaki-racecourse-2026-09-08',
  'nar-kawasaki-racecourse-2026-09-09',
  'nar-kawasaki-racecourse-2026-09-10',
  'nar-kawasaki-racecourse-2026-09-11',
]);

const partial = await discoverNankankeibaOfficial30d({
  dates: ['2026-09-07', '2026-09-08'],
  fetchImpl: async (url) => url.includes('/bangumi/')
    ? new Response('', { status: 500 })
    : new Response(calendarFixture, { status: 200 }),
});
assert.equal(partial.completeness.completeness, 'partial');
assert.equal(partial.completeness.failure_count, 1);
console.log('NANKANKEIBA_OFFICIAL_30D: pass');
