import assert from 'node:assert/strict';
import {
  discoverTokaiOfficial30d,
  parseTokaiOfficialMonthlySchedule,
  TOKAI_FISCAL_YEAR_WINDOW,
  TOKAI_MONTHLY_SCHEDULE_BASE_URL,
  TOKAI_OFFICIAL_PDF_URL,
} from './timetable/tokai-official-30d-discovery.mjs';

assert.equal(TOKAI_OFFICIAL_PDF_URL, 'https://www.kasamatsu-keiba.com/resources/pdfs/news/2026/1768888484_abd42430844a7f06de8d.pdf');
assert.equal(TOKAI_MONTHLY_SCHEDULE_BASE_URL, 'https://www.kasamatsu-keiba.com/schedule/');
assert.deepEqual(TOKAI_FISCAL_YEAR_WINDOW, { start: '2026-04-01', end: '2027-03-31' });

const septemberFixture = `
<html><head><title>開催日程 | 笠松けいば</title></head><body>
<table><tr class="schedule_name"><td>
<a href="https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList?k_raceDate=2026%2F09%2F08&k_babaCode=23">笠松 (第9回)</a>
</td></tr><tr class="schedule_link"><td>
<a href="https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList?k_raceDate=2026%2F09%2F04&k_babaCode=24">名古屋</a>
<a href="https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList?k_raceDate=2026%2F09%2F05&k_babaCode=27">園田</a>
</td></tr></table></body></html>`;
const octoberFixture = `
<html><head><title>開催日程 | 笠松けいば</title></head><body>
<table><tr class="schedule_name"><td>
<a href="https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList?k_raceDate=2026%2F10%2F06&k_babaCode=23">笠松 (第11回)</a>
</td></tr><tr class="schedule_link"><td>
<a href="https://www.keiba.go.jp/KeibaWeb/TodayRaceInfo/RaceList?k_raceDate=2026%2F10%2F01&k_babaCode=24">名古屋</a>
</td></tr></table></body></html>`;

const parsed = parseTokaiOfficialMonthlySchedule(
  septemberFixture,
  ['2026-09-04', '2026-09-05', '2026-09-08'],
  'https://www.kasamatsu-keiba.com/schedule/2026/09',
);
assert.deepEqual(parsed.map((row) => row.meeting_id), [
  'nar-nagoya-racecourse-2026-09-04',
  'nar-kasamatsu-racecourse-2026-09-08',
]);
assert.equal(parsed.find((row) => row.racecourse_id === 'nagoya-racecourse')?.venue_code, '24');
assert.equal(parsed.find((row) => row.racecourse_id === 'kasamatsu-racecourse')?.venue_code, '23');
assert.ok(parsed.every((row) => row.source_id === 'tokai-region-joint-official-calendar'));
assert.ok(parsed.every((row) => row.official_source_url === 'https://www.kasamatsu-keiba.com/schedule/2026/09'));
assert.throws(() => parseTokaiOfficialMonthlySchedule('<html></html>', ['2026-09-04'], 'https://www.kasamatsu-keiba.com/schedule/2026/09'), /title marker missing/);

const pdfBytes = Buffer.alloc(21000, 0);
pdfBytes.write('%PDF', 0, 'ascii');
const goodFetch = async (url) => {
  if (url === TOKAI_OFFICIAL_PDF_URL) {
    return {
      ok: true,
      status: 200,
      url,
      arrayBuffer: async () => pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength),
    };
  }
  const html = url.endsWith('/2026/09') ? septemberFixture : url.endsWith('/2026/10') ? octoberFixture : '<html></html>';
  return {
    ok: true,
    status: 200,
    url,
    text: async () => html,
  };
};
const good = await discoverTokaiOfficial30d({
  dates: ['2026-09-04', '2026-09-08', '2026-10-01', '2026-10-06'],
  fetchImpl: goodFetch,
});
assert.equal(good.completeness.completeness, 'complete');
assert.equal(good.completeness.failure_count, 0);
assert.equal(good.completeness.parsed_meeting_count, 4);
assert.deepEqual(good.meetings.map((row) => row.meeting_id), [
  'nar-nagoya-racecourse-2026-09-04',
  'nar-kasamatsu-racecourse-2026-09-08',
  'nar-nagoya-racecourse-2026-10-01',
  'nar-kasamatsu-racecourse-2026-10-06',
]);
assert.equal(good.completeness.source_urls.length, 3);
assert.equal(good.completeness.joint_calendar_bytes, 21000);
assert.match(good.completeness.joint_calendar_sha256, /^[0-9a-f]{64}$/);

const malformedFetch = async (url) => {
  if (url === TOKAI_OFFICIAL_PDF_URL) {
    return {
      ok: true,
      status: 200,
      url,
      arrayBuffer: async () => pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength),
    };
  }
  return { ok: true, status: 200, url, text: async () => '<html><title>broken</title></html>' };
};
const malformed = await discoverTokaiOfficial30d({ dates: ['2026-09-04'], fetchImpl: malformedFetch });
assert.equal(malformed.completeness.completeness, 'failed');
assert.equal(malformed.meetings.length, 0);
assert.match(malformed.completeness.failures[0].reason, /title marker missing/);

const outside = await discoverTokaiOfficial30d({ dates: ['2027-04-01'], fetchImpl: goodFetch });
assert.equal(outside.completeness.completeness, 'failed');
assert.ok(outside.completeness.failures.some((row) => /outside_tokai_fiscal_year_window/.test(row.reason)));

console.log('TOKAI_OFFICIAL_30D: pass');
