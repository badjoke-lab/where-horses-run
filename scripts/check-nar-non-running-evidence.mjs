import assert from 'node:assert/strict';
import { parseNarConfirmedNonRunningHtml } from './timetable/nar-non-running-evidence.mjs';

const checkedAt = '2026-09-22T00:00:00Z';

const kanazawa = parseNarConfirmedNonRunningHtml(`
<html><body>
<h1>JRAネット投票×地方競馬</h1><h2>お知らせ</h2>
<h3>金沢競馬の開催取り止めについて(8/26・9/2)</h3>
<p>金沢競馬は大雨の影響により、8月26日および9月2日の開催を取り止めることとなりました。</p>
</body></html>
`, {
  sourceUrl: 'https://www.keiba.go.jp/jranet/topics/2025/n000111.html',
  allowedDates: ['2025-08-26','2025-09-02','2025-09-03'],
  checkedAt,
});
assert.deepEqual(kanazawa.map((row) => row.meeting_id), [
  'nar-kanazawa-racecourse-2025-08-26',
  'nar-kanazawa-racecourse-2025-09-02',
]);

const monbetsu = parseNarConfirmedNonRunningHtml(`
<html><body>
<h1>門別競馬の開催取り止めについて(7/30)</h1>
<p>7月30日の門別競馬は、悪天候のため開催を取り止めます。</p>
</body></html>
`, {
  sourceUrl: 'https://www.keiba.go.jp/jranet/topics/2025/n000108.html',
  allowedDates: ['2025-07-30','2025-07-31'],
  checkedAt,
});
assert.equal(monbetsu.length, 1);
assert.equal(monbetsu[0].meeting_id, 'nar-monbetsu-racecourse-2025-07-30');

const saga = parseNarConfirmedNonRunningHtml(`
<html><body>
<h1>佐賀競馬の開催取り止めについて(8/29)および一部競走の順延について</h1>
<p>8月29日の佐賀競馬は台風の影響により開催を取り止めます。</p>
<p>一部の競走は9月1日に順延します。その他の競走は代替開催を行いません。</p>
</body></html>
`, {
  sourceUrl: 'https://www.keiba.go.jp/jranet/topics/2024/n000097.html',
  allowedDates: ['2024-08-29','2024-09-01'],
  checkedAt,
});
assert.deepEqual(saga.map((row) => row.meeting_id), [
  'nar-saga-racecourse-2024-08-29',
], 'replacement/rescheduled dates must never be invented as meeting-presence evidence');

const range = parseNarConfirmedNonRunningHtml(`
<html><body>
<h1>笠松競馬の開催取り止めについて(1/19〜22)</h1>
<p>笠松競馬は1月19日から22日までの開催を取り止めます。</p>
</body></html>
`, {
  sourceUrl: 'https://www.keiba.go.jp/jranet/topics/2021/n011901.html',
  allowedDates: ['2021-01-19','2021-01-20','2021-01-21','2021-01-22','2021-01-23'],
  checkedAt,
});
assert.deepEqual(range.map((row) => row.meeting_id), [
  'nar-kasamatsu-racecourse-2021-01-19',
  'nar-kasamatsu-racecourse-2021-01-20',
  'nar-kasamatsu-racecourse-2021-01-21',
  'nar-kasamatsu-racecourse-2021-01-22',
]);

const raceOnly = parseNarConfirmedNonRunningHtml(`
<html><body>
<h1>金沢競馬第4競走および第5競走の取り止めについて(7/28)</h1>
<p>金沢競馬の第4競走および第5競走を取り止めます。</p>
</body></html>
`, {
  sourceUrl: 'https://www.keiba.go.jp/jranet/topics/2025/n072801.html',
  allowedDates: ['2025-07-28'],
  checkedAt,
});
assert.equal(raceOnly.length, 0, 'race-only cancellation must not suppress a whole NAR meeting');

const banei = parseNarConfirmedNonRunningHtml(`
<html><body>
<h1>ばんえい競馬の開催取り止めについて(5/10)</h1>
<p>ばんえい競馬は5月10日の開催を取り止めます。</p>
</body></html>
`, {
  sourceUrl: 'https://www.keiba.go.jp/jranet/topics/2025/n051001.html',
  allowedDates: ['2025-05-10'],
  checkedAt,
});
assert.equal(banei.length, 0, 'Banei is outside the NAR-flat automation scope');

assert.throws(() => parseNarConfirmedNonRunningHtml('<h1>金沢競馬の開催取り止めについて(8/26)</h1>', {
  sourceUrl: 'https://example.com/jranet/topics/2025/n000111.html',
  allowedDates: ['2025-08-26'],
}), /official www\.keiba\.go\.jp/);

console.log('NAR_NON_RUNNING_EVIDENCE: pass');
