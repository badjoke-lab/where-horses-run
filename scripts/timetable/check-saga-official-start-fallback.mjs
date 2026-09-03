import assert from 'node:assert/strict';
import { parseSagaOfficialStartPage } from './saga-official-start-fallback.mjs';

const fixture = `
<section>
  <h3>2026年9月5日(土) 第9回4日目</h3>
  <table>
    <tr><th>R</th><th>JRA</th><th>1</th><th>2</th><th>3</th></tr>
    <tr><th>発走</th><td>15:45</td><td>15:55</td><td>16:25</td><td>17:00</td></tr>
  </table>
  <h3>2026年9月6日(日) 第9回5日目</h3>
  <p>佐賀メイン：4R　第37回九州ジュニアチャンピオン　サラ系2歳（18：05発走）</p>
  <table>
    <tr><th>R</th><th>JRA</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th></tr>
    <tr><th>発走</th><td>15:45</td><td>16:25</td><td>16:55</td><td>17:30</td><td>18:05</td><td>18:40</td><td>19:10</td><td>19:40</td><td>20:10</td><td>20:40</td></tr>
  </table>
  <h3>2026年9月12日(土) 第9回6日目</h3>
</section>`;

const rows = parseSagaOfficialStartPage(fixture, '2026-09-06');
assert.equal(rows.length, 9);
assert.deepEqual(rows.map((row) => row.label), Array.from({ length: 9 }, (_, index) => `Race ${index + 1}`));
assert.equal(rows[0].post_time_local, '16:25');
assert.equal(rows[3].post_time_local, '18:05');
assert.equal(rows[8].post_time_local, '20:40');
assert.equal(rows[0].race_name, null);
assert.deepEqual(parseSagaOfficialStartPage(fixture, '2026-09-07'), []);

console.log('SAGA_OFFICIAL_START_FALLBACK: pass');
