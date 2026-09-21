import assert from 'node:assert/strict';
import { parseJraConfirmedNonRunningHtml } from './timetable/jra-non-running-evidence.mjs';

const sourceUrl = 'https://www.jra.go.jp/news/202609/092002.html';
const rows = parseJraConfirmedNonRunningHtml(`
<html><body>
<h3>第4回中山第7日（9月21日（祝日・月曜））</h3>
<p>明日の第4回中山競馬第7日は、台風の影響により安全な競馬の実施に支障があると判断されるため、開催を中止いたします。</p>
<h4>3R</h4><p>競走中止</p>
</body></html>
`, { sourceUrl, checkedAt: '2026-09-21T00:00:00Z' });
assert.equal(rows.length, 1);
assert.equal(rows[0].meeting_id, 'jra-nakayama-racecourse-2026-09-21');
assert.equal(rows[0].state, 'confirmed_non_running');
assert.equal(rows[0].scope, 'whole_meeting');

const reservationNotice = parseJraConfirmedNonRunningHtml(`
<html><body>
<p>9月21日（祝日・月曜）の中山競馬【第4回中山競馬第7日】は、台風による競馬開催への影響が予想されるため、開催が中止となりました。</p>
</body></html>
`, { sourceUrl: 'https://www.jra.go.jp/news/202609/092004.html', checkedAt: '2026-09-21T00:00:00Z' });
assert.equal(reservationNotice.length, 1);
assert.equal(reservationNotice[0].meeting_id, 'jra-nakayama-racecourse-2026-09-21');

const multiVenue = parseJraConfirmedNonRunningHtml(`
<html><body>
<h1>本日【2月8日（日曜）】の東京競馬および京都競馬は開催を中止します</h1>
<p>本日【2月8日（日曜）】の東京競馬および京都競馬は、雪のため、開催を中止します。</p>
<p>なお、本日の小倉競馬は第4レースを取りやめ、発走時刻を変更のうえ、開催します。</p>
</body></html>
`, { sourceUrl: 'https://www.jra.go.jp/news/202602/020802.html', checkedAt: '2026-09-21T00:00:00Z' });
assert.deepEqual(multiVenue.map((row) => row.meeting_id), [
  'jra-kyoto-racecourse-2026-02-08',
  'jra-tokyo-racecourse-2026-02-08',
]);

const raceOnly = parseJraConfirmedNonRunningHtml(`
<html><body>
<h3>第4回中山第6日（9月20日（日曜））</h3>
<h4>競走中止</h4>
<p>3R 1番 オオルリ 競走を中止</p>
</body></html>
`, { sourceUrl, checkedAt: '2026-09-21T00:00:00Z' });
assert.equal(raceOnly.length, 0, 'race-only cancellation must not suppress the whole meeting');

assert.throws(() => parseJraConfirmedNonRunningHtml('<p>開催中止</p>', {
  sourceUrl: 'https://example.com/news/202609/092002.html',
}), /official www\.jra\.go\.jp/);

console.log('JRA_NON_RUNNING_EVIDENCE: pass');
