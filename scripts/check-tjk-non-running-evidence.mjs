import assert from 'node:assert/strict';
import { parseTjkConfirmedNonRunningHtml } from './timetable/tjk-non-running-evidence.mjs';

const istanbul = parseTjkConfirmedNonRunningHtml(`
<html><body>
<div>Tarih:20.02.2019 12:00:00</div>
<h1>İstanbul Yarışlarına Hava Engeli!</h1>
<p>20.02.2019 Çarşamba günü İstanbul Veliefendi Hipodromunda koşulacak olan tüm koşuların olumsuz hava koşulları nedeniyle 25.02.2019 Pazartesi gününe tehir edilmesine karar verilmiştir.</p>
</body></html>
`, {
  sourceUrl: 'https://www.tjk.org/TR/Kurumsal/News/Data/32478',
  checkedAt: '2026-09-22T00:00:00Z',
});
assert.equal(istanbul.length, 1);
assert.equal(istanbul[0].meeting_id, 'tjk-istanbul-racecourse-2019-02-20');
assert.equal(istanbul[0].date, '2019-02-20');
assert.equal(istanbul[0].state, 'confirmed_non_running');
assert.equal(istanbul[0].scope, 'whole_meeting');
assert.notEqual(istanbul[0].date, '2019-02-25', 'replacement date must not replace the original non-running meeting');

const adana = parseTjkConfirmedNonRunningHtml(`
<html><body>
<div>Tarih:21.03.2026 13:22:00</div>
<h1>Adana Yarışları 23 Mart Pazartesi gününe ertelendi</h1>
<p>21 Mart Cumartesi günü Adana Hipodromunda yapılması planlanan tüm koşuların, olumsuz hava şartları nedeniyle 23 Mart Pazartesi gününe ertelenmesine karar verilmiştir.</p>
</body></html>
`, {
  sourceUrl: 'https://www.tjk.org/TR/YarisSever/News/Data/52094',
  checkedAt: '2026-09-22T00:00:00Z',
});
assert.equal(adana.length, 1);
assert.equal(adana[0].meeting_id, 'tjk-adana-racecourse-2026-03-21',
  'the original meeting date, not the replacement date in the title, must be suppressed');

const raceOnly = parseTjkConfirmedNonRunningHtml(`
<html><body>
<div>Tarih:01.02.2026 12:00:00</div>
<h1>İstanbul 3. ve 4. koşular hakkında</h1>
<p>1 Şubat günü İstanbul yarışlarında 3. ve 4. koşular iptal edilmiştir.</p>
</body></html>
`, {
  sourceUrl: 'https://www.tjk.org/TR/YarisSever/News/Data/99901',
  checkedAt: '2026-09-22T00:00:00Z',
});
assert.deepEqual(raceOnly, [], 'race-only cancellation must never suppress the whole TJK meeting');

const wrapperOnly = parseTjkConfirmedNonRunningHtml(`
<html><body>
<div>Tarih:21.03.2026 13:22:00</div>
<h1>Adana Yarışları 23 Mart Pazartesi gününe ertelendi</h1>
<iframe src="/TR/YarisSever/News/Data/52094"></iframe>
</body></html>
`, {
  sourceUrl: 'https://www.tjk.org/TR/YarisSever/News/Page/52094',
  checkedAt: '2026-09-22T00:00:00Z',
});
assert.deepEqual(wrapperOnly, [], 'title-only wrapper is insufficient without explicit whole-meeting body evidence');

assert.throws(() => parseTjkConfirmedNonRunningHtml('<p>tüm koşular iptal edilmiştir</p>', {
  sourceUrl: 'https://example.com/TR/YarisSever/News/Data/52094',
}), /official www\.tjk\.org/);

console.log('TJK_NON_RUNNING_EVIDENCE: pass');
