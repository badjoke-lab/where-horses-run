import assert from 'node:assert/strict';
import { parseBaneiConfirmedNonRunningHtml } from './timetable/banei-non-running-evidence.mjs';

const rangeRows = parseBaneiConfirmedNonRunningHtml(`
<html><body>
<div>2025-05-04</div>
<h1>ばんえい競馬（5月10日～12日）の中止について</h1>
<p>5月10日（土）～12日（月）開催予定の帯広市第3回ばんえい競馬1日目～3日目については中止といたします。</p>
</body></html>
`, {
  sourceUrl: 'https://www.banei-keiba.or.jp/tp_detail.php?id=9659',
  checkedAt: '2026-09-21T00:00:00Z',
});
assert.deepEqual(rangeRows.map((row) => row.meeting_id), [
  'banei-obihiro-racecourse-2025-05-10',
  'banei-obihiro-racecourse-2025-05-11',
  'banei-obihiro-racecourse-2025-05-12',
]);

const single = parseBaneiConfirmedNonRunningHtml(`
<html><body>
<div>2022-12-23</div>
<h1>12/23（金） ばんえい競馬開催取り止めについて</h1>
<p>ばんえい十勝では、本日12月23日（金）、悪天候のため開催取り止めとなりました。</p>
</body></html>
`, {
  sourceUrl: 'https://banei-keiba.or.jp/tp_detail.php?id=7829',
  checkedAt: '2026-09-21T00:00:00Z',
});
assert.equal(single.length, 1);
assert.equal(single[0].meeting_id, 'banei-obihiro-racecourse-2022-12-23');

const partial = parseBaneiConfirmedNonRunningHtml(`
<html><body>
<div>2025-12-14</div>
<h1>12月14日（日）第5競走以降の競走取り止めについて</h1>
<p>ばんえい十勝では本日12月14日（日）の第5競走以降について、悪天候のため競走取り止めとなりました。</p>
</body></html>
`, {
  sourceUrl: 'https://www.banei-keiba.or.jp/tp_detail.php?id=10153',
  checkedAt: '2026-09-21T00:00:00Z',
});
assert.equal(partial.length, 0, 'partial-race stoppage must not suppress the whole meeting');

const external = parseBaneiConfirmedNonRunningHtml(`
<html><body>
<div>2026-02-07</div>
<h1>JRA 東京競馬第8レース以降取り止めについて</h1>
<p>2月7日の東京競馬は第8レース以降を取りやめます。</p>
</body></html>
`, {
  sourceUrl: 'https://www.banei-keiba.or.jp/tp_detail.php?id=10268',
  checkedAt: '2026-09-21T00:00:00Z',
});
assert.equal(external.length, 0, 'external-racing notices on Banei site must not become Banei meeting evidence');

assert.throws(() => parseBaneiConfirmedNonRunningHtml('<div>2025-05-04</div><p>ばんえい競馬開催中止</p>', {
  sourceUrl: 'https://example.com/tp_detail.php?id=9659',
}), /official tp_detail\.php/);

console.log('BANEI_NON_RUNNING_EVIDENCE: pass');
