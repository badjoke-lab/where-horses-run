import assert from 'node:assert/strict';
import {
  decodeSagaAnnualScheduleText,
  parseSagaMonthlyScheduleHtml,
  SAGA_FISCAL_YEAR_WINDOW,
  SAGA_SOURCE_ID,
} from './timetable/saga-official-30d-discovery.mjs';
import {
  IWATE_OFFICIAL_HOME_URL,
  KASAMATSU_OFFICIAL_NEWS_URL,
  parseIwateOfficialHomeTimes,
  parseKasamatsuFirstRaceTimes,
  parseKasamatsuMeetingNoticeLinks,
  withSagaOfficialStartFallback,
} from './timetable/saga-official-start-fallback.mjs';

const months = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
const selected = new Map(months.map((month) => [month, [1, 2]]));
selected.set(9, [3, 5, 6, 12, 19, 20, 21, 26, 27]);
selected.set(10, [1, 10, 11, 12, 17, 18, 24, 25, 26, 31]);

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function annualFixture({ omitMonth = null } = {}) {
  const items = [
    { str: '令和8年度', x: 300, y: 820, w: 50 },
    { str: '佐賀競馬', x: 360, y: 820, w: 50 },
    { str: '開催日程', x: 420, y: 820, w: 50 },
  ];
  months.forEach((month, index) => {
    const year = month >= 4 ? 2026 : 2027;
    const dayY = 760 - index * 50;
    const count = daysInMonth(year, month);
    for (let day = 1; day <= count; day += 1) items.push({ str: String(day), x: 100 + (day - 1) * 20, y: dayY, w: 8 });
    if (month !== omitMonth) {
      for (const day of selected.get(month)) items.push({ str: '●', x: 100 + (day - 1) * 20, y: dayY - 18, w: 8 });
    }
  });
  return items;
}

const decoded = decodeSagaAnnualScheduleText(annualFixture());
assert.equal(decoded.months.length, 12);
assert.deepEqual(decoded.dates.filter((date) => date.startsWith('2026-09-')), [
  '2026-09-03', '2026-09-05', '2026-09-06', '2026-09-12', '2026-09-19',
  '2026-09-20', '2026-09-21', '2026-09-26', '2026-09-27',
]);
assert.deepEqual(decoded.dates.filter((date) => date.startsWith('2026-10-')), [
  '2026-10-01', '2026-10-10', '2026-10-11', '2026-10-12', '2026-10-17',
  '2026-10-18', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-31',
]);
assert.throws(() => decodeSagaAnnualScheduleText(annualFixture({ omitMonth: 10 })), /meeting row missing/);
assert.throws(() => decodeSagaAnnualScheduleText(annualFixture().filter((item) => item.str !== '開催日程')), /schedule title marker missing/);

function monthlyFixture(year, month, homeDays) {
  const count = daysInMonth(year, month);
  const rows = Array.from({ length: count }, (_, index) => {
    const day = index + 1;
    return `<tr><td>${day}</td><td>曜</td><td>${homeDays.includes(day) ? '佐賀' : ''}</td><td></td></tr>`;
  }).join('');
  return `<!doctype html><html><head><title>月別開催日程 ${year}年${month}月 | 佐賀競馬（さがけいば）</title></head><body><table><tr><th colspan="2">日付・曜</th><th>本場<br>開催</th><th>主なレース等</th></tr>${rows}</table></body></html>`;
}

const septemberDays = [3, 5, 6, 12, 19, 20, 21, 26, 27];
assert.deepEqual(parseSagaMonthlyScheduleHtml(monthlyFixture(2026, 9, septemberDays), 2026, 9), septemberDays.map((day) => `2026-09-${String(day).padStart(2, '0')}`));
assert.throws(() => parseSagaMonthlyScheduleHtml(monthlyFixture(2026, 9, septemberDays).replace('<tr><td>30</td><td>曜</td><td></td><td></td></tr>', ''), 2026, 9), /day-row count invalid/);
assert.throws(() => parseSagaMonthlyScheduleHtml(monthlyFixture(2026, 9, septemberDays).replace('月別開催日程 2026年9月', '月別開催日程 2026年8月'), 2026, 9), /title invalid/);

const iwateFixture = `
<table>
<tr><th>開催日</th><th>本場入場開始</th><th>第1レース</th><th>メインレース</th><th>最終レース</th></tr>
<tr><td>水 09/13(日) <a href="#">開催情報</a></td><td>10:00</td><td>11:30</td><td>18:05</td><td>18:05</td></tr>
<tr><td>水 09/14(月) <a href="#">開催情報</a></td><td>10:00</td><td>11:40</td><td>18:05</td><td>18:05</td></tr>
<tr><td>水 09/15(火) <a href="#">開催情報</a></td><td>10:00</td><td>11:30</td><td>17:30</td><td>18:00</td></tr>
</table>`;
const iwateTimes = parseIwateOfficialHomeTimes(iwateFixture, 2026);
assert.deepEqual(iwateTimes.get('2026-09-13'), { first_race_time_local: '11:30', last_race_time_local: '18:05' });
assert.deepEqual(iwateTimes.get('2026-09-15'), { first_race_time_local: '11:30', last_race_time_local: '18:00' });
assert.equal(parseIwateOfficialHomeTimes('<table><tr><td>水 09/13(日)</td><td>11:30</td></tr></table>', 2026).size, 0);

const kasamatsuIndexFixture = `
<html><body>
<a href="/news/detail/1483">第９回競馬「西日本３歳優駿シリーズ」開催の お知らせ</a>
<a href="/news/detail/other">第１１回西日本３歳優駿 特設ページ</a>
</body></html>`;
assert.deepEqual(parseKasamatsuMeetingNoticeLinks(kasamatsuIndexFixture), [
  'https://www.kasamatsu-keiba.com/news/detail/1483',
]);
const kasamatsuNoticeFixture = `
<html><body>
<h1>第９回競馬「西日本３歳優駿シリーズ」開催のお知らせ</h1>
<p>〖開 催 日〗９月８日(火) ９日(水) １０日(木) １１日(金)</p>
<p>〖第１競走発走時刻〗９月８日 １１：５５、９日 １１：５５、１０日 １１：２５、１１日 １１：２０</p>
</body></html>`;
const kasamatsuTimes = parseKasamatsuFirstRaceTimes(kasamatsuNoticeFixture, 2026);
assert.equal(kasamatsuTimes.get('2026-09-08'), '11:55');
assert.equal(kasamatsuTimes.get('2026-09-10'), '11:25');
assert.equal(kasamatsuTimes.get('2026-09-11'), '11:20');
assert.equal(parseKasamatsuFirstRaceTimes('<html>開催のお知らせ</html>', 2026).size, 0);

function htmlResponse(url, body) {
  const bytes = new TextEncoder().encode(body);
  return {
    ok: true,
    status: 200,
    url: String(url),
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  };
}

const fallbackFetch = async (url) => {
  const value = String(url);
  if (value === IWATE_OFFICIAL_HOME_URL) return htmlResponse(value, iwateFixture);
  if (value === KASAMATSU_OFFICIAL_NEWS_URL) return htmlResponse(value, kasamatsuIndexFixture);
  if (value === 'https://www.kasamatsu-keiba.com/news/detail/1483') return htmlResponse(value, kasamatsuNoticeFixture);
  throw new Error(`unexpected fallback URL ${value}`);
};
const pendingInspect = async () => ({ status: 'scheduled_pending_details', reason: 'scheduled_pending_details' });
const regionalFallback = withSagaOfficialStartFallback(pendingInspect, fallbackFetch);
const iwateFallback = await regionalFallback({
  meeting_id: 'nar-mizusawa-racecourse-2026-09-13',
  date: '2026-09-13',
  authority_id: 'nar-local-government-racing',
  racing_system_id: 'japan-nar-system',
  racecourse_id: 'mizusawa-racecourse',
  venue_code: '11',
  official_source_url: 'https://www.keiba.go.jp/example',
});
assert.equal(iwateFallback.status, 'ok');
assert.equal(iwateFallback.meeting.capability_rank, 'B+');
assert.equal(iwateFallback.meeting.first_race_time_local, '11:30');
assert.equal(iwateFallback.meeting.last_race_time_local, '18:05');
assert.equal(iwateFallback.meeting.official_source_url, IWATE_OFFICIAL_HOME_URL);

const kasamatsuFallback = await regionalFallback({
  meeting_id: 'nar-kasamatsu-racecourse-2026-09-10',
  date: '2026-09-10',
  authority_id: 'nar-local-government-racing',
  racing_system_id: 'japan-nar-system',
  racecourse_id: 'kasamatsu-racecourse',
  venue_code: '23',
  official_source_url: 'https://www.keiba.go.jp/example',
});
assert.equal(kasamatsuFallback.status, 'ok');
assert.equal(kasamatsuFallback.meeting.capability_rank, 'B');
assert.equal(kasamatsuFallback.meeting.first_race_time_local, '11:25');
assert.equal(kasamatsuFallback.meeting.last_race_time_local, null);
assert.equal(kasamatsuFallback.meeting.official_source_url, 'https://www.kasamatsu-keiba.com/news/detail/1483');

const primaryOk = { status: 'ok', meeting: { capability_rank: 'A+' } };
const noDowngrade = withSagaOfficialStartFallback(async () => primaryOk, async () => { throw new Error('fallback should not fetch'); });
assert.equal(await noDowngrade({ venue_code: '23', racecourse_id: 'kasamatsu-racecourse', date: '2026-09-10' }), primaryOk);

assert.equal(SAGA_SOURCE_ID, 'saga-keiba-official-calendar');
assert.deepEqual(SAGA_FISCAL_YEAR_WINDOW, { start: '2026-04-01', end: '2027-03-31' });
console.log('SAGA_OFFICIAL_30D: pass');
