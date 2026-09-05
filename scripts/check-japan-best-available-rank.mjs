import assert from 'node:assert/strict';
import { deriveJapanBestAvailableRank, runJapanZeroBased30d } from './timetable/japan-zero-based-30d-core.mjs';
import { parseNarDebaMetadata, parseNarMonthlySchedule } from './timetable/japan-official-30d-adapters.mjs';
import { parseMonbetsuOfficialRaceInfoPage } from './timetable/saga-official-start-fallback.mjs';

const aPlusRows = [1, 2].map((number) => ({
  label: `Race ${number}`,
  post_time_local: number === 1 ? '10:00' : '16:00',
  race_name: `Race ${number} title`,
  distance_m: 1200,
  surface: 'Dirt',
  course_label: 'Outer',
}));

assert.equal(deriveJapanBestAvailableRank({ capability_rank: 'A' }, aPlusRows), 'A+');
assert.equal(deriveJapanBestAvailableRank({ capability_rank: 'A+' }, aPlusRows.map(({ race_name, distance_m, surface, course_label, ...row }) => row)), 'A');
assert.equal(deriveJapanBestAvailableRank({ first_race_time_local: '10:00', last_race_time_local: '16:00' }, []), 'B+');
assert.equal(deriveJapanBestAvailableRank({ first_race_time_local: '10:00' }, []), 'B');
assert.equal(deriveJapanBestAvailableRank({}, []), 'C');

const narMonthlyMonbetsuFixture = `
<html><body>
<a href="/KeibaWeb/TodayRaceInfo/RaceList?k_babaCode=36&k_raceDate=2026%2F09%2F08">門別 9/8</a>
</body></html>`;
const monbetsuDiscovery = parseNarMonthlySchedule(
  narMonthlyMonbetsuFixture,
  '2026',
  '09',
  ['2026-09-08'],
  'https://www.keiba.go.jp/KeibaWeb/MonthlyConveneInfo/MonthlyConveneInfoTop?k_month=9&k_year=2026',
);
assert.equal(monbetsuDiscovery.length, 1);
assert.equal(monbetsuDiscovery[0].meeting_id, 'nar-monbetsu-racecourse-2026-09-08');
assert.equal(monbetsuDiscovery[0].racecourse_id, 'monbetsu-racecourse');
assert.equal(monbetsuDiscovery[0].venue_code, '36');
assert.match(monbetsuDiscovery[0].official_source_url, /k_babaCode=36/);

assert.deepEqual(
  parseNarDebaMetadata('<div>ダート 1000ｍ（外コース・右）</div>'),
  { surface: 'Dirt', distance_m: 1000, course_label: 'Dirt Outer Right-handed' },
);
assert.deepEqual(
  parseNarDebaMetadata('<div>ダート 1600ｍ（内コース・右）</div>'),
  { surface: 'Dirt', distance_m: 1600, course_label: 'Dirt Inner Right-handed' },
);

const monbetsuOfficialFixture = `
<html><body>
<div>2026年9月8日（火）</div>
<div>第11回 門別競馬 4日目 1000ｍ(外)</div>
<div>〖発走時刻〗14:25</div>
<h1>第１競走　２歳　未勝利</h1>
<div>（サラ系２歳　定量）</div>
</body></html>`;
const monbetsuOfficialRows = parseMonbetsuOfficialRaceInfoPage(monbetsuOfficialFixture, '2026-09-08', 1);
assert.deepEqual(monbetsuOfficialRows, [{
  label: 'Race 1',
  post_time_local: '14:25',
  race_name: '2歳 未勝利',
  distance_m: 1000,
  surface: 'Dirt',
  course_label: 'Outer',
}]);
assert.equal(deriveJapanBestAvailableRank({}, monbetsuOfficialRows), 'A+');

const monbetsuSponsorFixture = `
<html><body>
<div>2026年9月8日（火） 第11回 門別競馬 4日目 1100ｍ(外) 〖発走時刻〗15:30</div>
<h1>第３競走　公益社団法人日本軽種馬協会協賛<br>２歳牝馬　未勝利</h1>
<div>（サラ系２歳　定量）</div>
</body></html>`;
const sponsored = parseMonbetsuOfficialRaceInfoPage(monbetsuSponsorFixture, '2026-09-08', 3);
assert.equal(sponsored[0].race_name, '公益社団法人日本軽種馬協会協賛 2歳牝馬 未勝利');
assert.equal(sponsored[0].distance_m, 1100);
assert.equal(sponsored[0].surface, 'Dirt');
assert.equal(sponsored[0].course_label, 'Outer');

const meeting = {
  meeting_id: 'nar-generic-course-2026-09-08',
  date: '2026-09-08',
  authority_id: 'nar-local-government-racing',
  racing_system_id: 'japan-nar-system',
  racecourse_id: 'generic-course',
  official_source_url: 'https://official.example/racecard',
};

const adapters = {
  jra: { discover: async () => [], inspect: async () => { throw new Error('unexpected'); } },
  'nar-standard': {
    discover: async () => [meeting],
    inspect: async (value) => ({
      status: 'ok',
      meeting: {
        ...value,
        capability_rank: 'A',
        timetable_rows: aPlusRows,
      },
    }),
  },
  banei: { discover: async () => [], inspect: async () => { throw new Error('unexpected'); } },
};

const result = await runJapanZeroBased30d({
  executionDate: '2026-09-05',
  adapters,
  retryDelayMs: 0,
  checkedAt: '2026-09-05T00:00:00.000Z',
});

const canonical = result.canonical.find((row) => row.meeting_id === meeting.meeting_id);
const publicMeeting = result.public.find((row) => row.meeting_id === meeting.meeting_id);
const publicDetail = result.publicDetails.find((row) => row.meeting_id === meeting.meeting_id);
assert.equal(canonical.capability_rank, 'A+', 'adapter-declared A must not cap complete A+ evidence');
assert.equal(publicMeeting.capability_rank, 'A+');
assert.equal(publicMeeting.effective_public_rank, 'A+');
assert.equal(publicDetail.effective_public_rank, 'A+');
assert.equal(publicDetail.timetable_rows[0].race_name, 'Race 1 title');

console.log('JAPAN_BEST_AVAILABLE_RANK: pass');