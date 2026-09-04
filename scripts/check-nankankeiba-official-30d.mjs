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
const venueRow = (name, cells) => `<tr><th><a>${name}競馬</a></th>${cells.join('')}</tr>`;
const septemberCells = Array.from({ length: 30 }, blank);
septemberCells[6] = '<td><a href="/bangumi/20262107.do">番組</a></td>';
septemberCells[8] = '<td>SⅠ</td>';
septemberCells[9] = '<td>SIII</td>';
const calendarFixture = `<nav><a>9月</a><a>10月</a></nav>
<h3>9月</h3><div class="calendar"><table>
${venueRow('浦和', Array.from({ length: 30 }, blank))}
${venueRow('船橋', Array.from({ length: 30 }, blank))}
${venueRow('大井', Array.from({ length: 30 }, blank))}
${venueRow('川崎', septemberCells)}
</table></div><footer><a>10月</a></footer>`;
const parsed = parseNankankeibaCalendarMonth(calendarFixture, {
  year: 2026,
  month: 9,
  allowedDates: ['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11'],
  sourceUrl: 'https://www.nankankeiba.com/calendar/202607.do',
});
assert.equal(parsed.structural_valid, true);
assert.deepEqual(parsed.meetings.map((row) => row.meeting_id), [
  'nar-kawasaki-racecourse-2026-09-07',
  'nar-kawasaki-racecourse-2026-09-10',
]);
assert.equal(parsed.programme_links[0].url, 'https://www.nankankeiba.com/bangumi/20262107.do');

const octoberRows = {
  urawa: Array.from({ length: 31 }, blank),
  funabashi: Array.from({ length: 31 }, blank),
  oi: Array.from({ length: 31 }, blank),
  kawasaki: Array.from({ length: 31 }, blank),
};
octoberRows.funabashi[0] = '<td><img alt="ナイター開催">JpnIII</td>';
octoberRows.oi[3] = '<td><img alt="ナイター開催"></td>';
octoberRows.oi[4] = '<td><img alt="ナイター開催"></td>';
octoberRows.kawasaki[11] = '<td><img title="ナイター開催"></td>';
const octoberFixture = `<nav><span>10月</span><span>11月</span></nav><h2>10月</h2><table>
${venueRow('浦和', octoberRows.urawa)}
${venueRow('船橋', octoberRows.funabashi)}
${venueRow('大井', octoberRows.oi)}
${venueRow('川崎', octoberRows.kawasaki)}
</table><h2>11月</h2>`;
const octoberParsed = parseNankankeibaCalendarMonth(octoberFixture, {
  year: 2026,
  month: 10,
  allowedDates: ['2026-10-01', '2026-10-04', '2026-10-05', '2026-10-12'],
  sourceUrl: 'https://www.nankankeiba.com/calendar/202610.do',
});
assert.equal(octoberParsed.structural_valid, true);
assert.deepEqual(octoberParsed.meetings.map((row) => row.meeting_id), [
  'nar-funabashi-racecourse-2026-10-01',
  'nar-oi-racecourse-2026-10-04',
  'nar-oi-racecourse-2026-10-05',
  'nar-kawasaki-racecourse-2026-10-12',
]);

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
