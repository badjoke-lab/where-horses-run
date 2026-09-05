import assert from 'node:assert/strict';
import { parseNarRaceListPage } from './timetable/japan-official-30d-adapters.mjs';

const currentUnquotedHrefFixture = `<table>
<tr class="data">
  <td>1R</td>
  <td>15:25</td>
  <td><span class="timechange"></span></td>
  <td>特別</td>
  <td><a href=/KeibaWeb/TodayRaceInfo/DebaTable?k_raceDate=2026%2F09%2F05&amp;k_raceNo=1&amp;k_babaCode=31>徳島県ミルクとすだち特別２歳－４</a></td>
  <td>右1300m</td>
</tr>
</table>`;

const unquotedRows = parseNarRaceListPage(currentUnquotedHrefFixture);
assert.equal(unquotedRows.length, 1);
assert.deepEqual(unquotedRows[0], {
  race_number: 1,
  label: 'Race 1',
  post_time_local: '15:25',
  race_name: '徳島県ミルクとすだち特別２歳－４',
  distance_m: 1300,
  surface: null,
  course_label: 'Right-handed',
});

const quotedHrefFixture = `<table>
<tr class="data">
  <td><a href="?k_raceNo=1">1R</a></td>
  <td>15:55</td>
  <td><a href="/KeibaWeb/TodayRaceInfo/DebaTable?k_raceNo=1">２歳－４組</a></td>
  <td>右1300m</td>
</tr>
</table>`;

const quotedRows = parseNarRaceListPage(quotedHrefFixture);
assert.equal(quotedRows.length, 1);
assert.equal(quotedRows[0].race_name, '２歳－４組');
assert.equal(quotedRows[0].post_time_local, '15:55');
assert.equal(quotedRows[0].distance_m, 1300);
assert.equal(quotedRows[0].course_label, 'Right-handed');

console.log('NAR RaceList current-markup parser checks passed.');
