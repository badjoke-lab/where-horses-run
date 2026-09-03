import assert from 'node:assert/strict';
import { parseBaneiOfficialMonthlySchedule } from './timetable/banei-official-30d-discovery.mjs';

const fixture = `
<h2>2026年9月</h2>
<table>
  <tr><td>日付</td><td>5</td><td>6</td><td>7</td><td>8</td></tr>
  <tr>
    <td>ばんえい開催</td>
    <td>帯広競馬場<br>開門 09:20<br>第1R 14:40<br>第12R 20:30</td>
    <td>帯広競馬場<br>開門 09:20<br>第1R 14:35<br>第12R 20:30</td>
    <td>帯広競馬場<br>開門 13:30<br>第1R 14:25<br>第12R 20:30</td>
    <td>開門 14:00</td>
  </tr>
</table>
<p>■2026年9月5日（土）</p>
`;

const rows = parseBaneiOfficialMonthlySchedule(
  fixture,
  ['2026-09-05', '2026-09-06', '2026-09-07', '2026-09-08'],
  'https://www.banei-keiba.or.jp/race_schedule.php?c=mon',
);
assert.deepEqual(rows.map((row) => row.meeting_id), [
  'banei-obihiro-racecourse-2026-09-05',
  'banei-obihiro-racecourse-2026-09-06',
  'banei-obihiro-racecourse-2026-09-07',
]);
assert(rows.every((row) => row.racing_system_id === 'japan-banei-system'));
assert(rows.every((row) => row.authority_id === 'banei-tokachi'));
console.log('BANEI_OFFICIAL_30D_DISCOVERY: pass');
