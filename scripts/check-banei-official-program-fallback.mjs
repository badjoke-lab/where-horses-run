import assert from 'node:assert/strict';
import { parseBaneiRaceList } from './timetable/banei-detail-core.mjs';
import {
  findBaneiProgramDetailUrl,
  parseBaneiOfficialProgramRows,
} from './timetable/banei-official-program-fallback.mjs';

const indexFixture = `
<table>
  <tr><th>回次</th><th>期間</th><th>番組表</th></tr>
  <tr><td>10</td><td>8月15日</td><td>～</td><td>8月24日</td><td><a href="race_program_detail.php?d=2026&amp;n=10">番組表</a></td></tr>
  <tr><td>11</td><td>8月29日</td><td>～</td><td>9月7日</td><td><a href=race_program_detail.php?d=2026&amp;n=11>番組表</a></td></tr>
  <tr><td>12</td><td>9月12日</td><td>～</td><td>9月21日</td><td></td></tr>
</table>`;

assert.equal(
  findBaneiProgramDetailUrl(indexFixture, '2026-09-07'),
  'https://www.banei-keiba.or.jp/race_program_detail.php?d=2026&n=11',
  'target date must resolve to the official meeting program URL, including unquoted href attributes',
);
assert.equal(findBaneiProgramDetailUrl(indexFixture, '2026-09-12'), null, 'missing program links must fail closed');

const detailFixture = `
<h3>第11回 5日目 9月6日（日）</h3>
<table>
<tr><td>1</td><td>14:35</td><td>別日の競走</td><td>220万円未満</td><td>―８</td></tr>
</table>
<h3>第11回 6日目 9月7日（月）</h3>
<table>
<tr><th>レース</th><th>発走時刻</th><th>競走名</th><th>格付</th><th>編成順位</th></tr>
<tr><td>1</td><td>14:25</td><td>Ｃ　２</td><td>220万円未満</td><td>―１１</td></tr>
<tr><td>2</td><td>14:55</td><td>２　歳
Ｄ</td><td>220万円未満</td><td>―８</td></tr>
<tr><td>3</td><td>15:35</td><td>２　歳
Ｄ</td><td>220万円未満</td><td>―５</td></tr>
<tr><td>4</td><td>16:10</td><td>２　歳
Ｃ</td><td>220万円未満</td><td>―１</td></tr>
<tr><td>5</td><td>16:40</td><td>２　歳
Ｂ</td><td>220万円未満</td><td>―５</td></tr>
<tr><td>6</td><td>17:10</td><td>Ｃ　２</td><td>220万円未満</td><td>―７</td></tr>
<tr><td>7</td><td>17:40</td><td>Ｃ　１</td><td>340万円未満</td><td>―１</td></tr>
<tr><td>8</td><td>18:10</td><td>Ｂ　４</td><td>430万円未満</td><td>―７</td></tr>
<tr><td>9</td><td>18:45</td><td>Ｂ　４</td><td>430万円未満</td><td>―５</td></tr>
<tr><td>10</td><td>19:20</td><td>とかち
平原賞
Ｂ３混合</td><td>670万円未満</td><td>―８</td></tr>
<tr><td>11</td><td>19:55</td><td>フォーマルハウト
特別
Ａ１</td><td>1300万円未満</td><td>―１</td></tr>
<tr><td>12</td><td>20:30</td><td>とかち
秋晴れ賞
Ｂ２</td><td>670万円未満</td><td>―２</td></tr>
</table>
<h3>第12回 1日目 9月12日（土）</h3>
<table><tr><td>1</td><td>14:30</td><td>次開催</td><td>220万円未満</td><td>―１</td></tr></table>`;

const rows = parseBaneiOfficialProgramRows(detailFixture, '2026-09-07');
assert.equal(rows.length, 12, '9/7 official program fixture must expose all 12 races');
assert.deepEqual(rows.map((row) => row.race_number), Array.from({ length: 12 }, (_, index) => index + 1));
assert.equal(rows[0].post_time_local, '14:25');
assert.equal(rows.at(-1).post_time_local, '20:30');
assert.match(rows[9].race_name, /とかち\s*平原賞\s*Ｂ３混合/);
assert.match(rows[10].race_name, /フォーマルハウト\s*特別\s*Ａ１/);
assert.match(rows[11].race_name, /とかち\s*秋晴れ賞\s*Ｂ２/);
assert.ok(!rows.some((row) => row.race_name?.includes('別日の競走')), 'adjacent date rows must not leak into the target day');
assert.ok(rows.every((row) => row.distance_m === null && row.surface === null && row.course_label === null), 'program fallback must not invent A+ course metadata');

const unquotedNarFixture = `
<table><tr>
<td>1R</td><td>14:25</td>
<td><a href=/KeibaWeb/TodayRaceInfo/DebaTable?k_babaCode=3&k_raceDate=2026%2F09%2F07&k_raceNo=1>未引用リンク競走Ｃ２－１１</a></td>
<td>直200m</td>
</tr></table>`;
const narRows = parseBaneiRaceList(unquotedNarFixture, '2026-09-07');
assert.equal(narRows.length, 1, 'Banei NAR parser must accept unquoted href attributes');
assert.equal(narRows[0].race_name, '未引用リンク競走Ｃ２－１１');
assert.equal(narRows[0].post_time_local, '14:25');
assert.equal(narRows[0].list_distance_m, 200);

console.log('Banei official program fallback: PASS');
