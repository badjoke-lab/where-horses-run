import assert from 'node:assert/strict';
import { assertJapanCompleteness, japan30DayRange, runJapanZeroBased30d } from './timetable/japan-zero-based-30d-core.mjs';
import { parseJraProgrammePage, parseNarMonthlySchedule, parseNarRaceListPage } from './timetable/japan-official-30d-adapters.mjs';

const range = japan30DayRange('2026-09-04');
assert.equal(range.dates.length, 30);
assert.equal(range.dates[0], '2026-09-04');
assert.equal(range.dates.at(-1), '2026-10-03');
assert.equal(range.end_exclusive, '2026-10-04');

const jraFixture = `
<h2>4回中山1日</h2><table>
<tr><td>1レース</td><td>2歳未勝利 1,600（芝・外）</td><td>10時05分</td></tr>
<tr><td>2レース</td><td>2歳新馬 1,800（ダ）</td><td>10時40分</td></tr>
</table><h2>4回阪神1日</h2><table>
<tr><td>1レース</td><td>2歳未勝利 1,400（ダ）</td><td>9時55分</td></tr>
</table>`;
const jraParsed = parseJraProgrammePage(jraFixture, '2026-09-05', 'https://www.jra.go.jp/keiba/calendar2026/2026/9/0905.html');
assert.deepEqual(jraParsed.map((row) => row.meeting_id), ['jra-nakayama-racecourse-2026-09-05', 'jra-hanshin-racecourse-2026-09-05']);
assert.equal(jraParsed[0].programme_rows[0].race_name, '2歳未勝利');
assert.equal(jraParsed[0].programme_rows[0].distance_m, 1600);
assert.equal(jraParsed[0].programme_rows[0].surface, 'Turf');

const monthlyCells = Array.from({ length: 30 }, (_, index) => `<td>${index === 3 ? '☆' : ''}</td>`).join('');
const narMonthlyFixture = `<table><tr><td>名古屋</td>${monthlyCells}<td>名古屋</td></tr><tr><td>帯広ば</td>${monthlyCells}<td>帯広ば</td></tr></table>`;
const narMonthly = parseNarMonthlySchedule(narMonthlyFixture, '2026', '09', range.dates, 'https://www.keiba.go.jp/KeibaWeb/MonthlyConveneInfo/MonthlyConveneInfoTop?k_month=9&k_year=2026');
assert.equal(narMonthly.length, 1);
assert.equal(narMonthly[0].meeting_id, 'nar-nagoya-racecourse-2026-09-04');
assert.match(narMonthly[0].official_source_url, /k_babaCode=24/);

const narListFixture = `<table>
<tr><td><a href="?k_raceNo=1">1R</a></td><td>14:40</td><td><a href="/KeibaWeb/TodayRaceInfo/DebaTable?k_raceNo=1">Ｃ６組</a></td><td>右1500m</td></tr>
<tr><td><a href="?k_raceNo=2">2R</a></td><td>15:10</td><td><a href="/KeibaWeb/TodayRaceInfo/DebaTable?k_raceNo=2">Ｃ５組</a></td><td>右1500m</td></tr>
</table>`;
const narRows = parseNarRaceListPage(narListFixture);
assert.equal(narRows.length, 2);
assert.equal(narRows[0].race_name, 'Ｃ６組');
assert.equal(narRows[0].distance_m, 1500);

const calls = [];
let narIncompleteAttempts = 0;
let narPendingAttempts = 0;
let narLateAttempts = 0;
const meeting = (group, id, date = '2026-09-04') => ({
  meeting_id: id,
  date,
  authority_id: group,
  racing_system_id: `japan-${group}-system`,
  racecourse_id: `${group}-course`,
  official_source_url: `https://official.example/${group}`,
});
const rich = (base) => ({
  status: 'ok',
  meeting: {
    ...base,
    capability_rank: 'A+',
    timetable_rows: [1, 2].map((number) => ({
      label: `Race ${number}`,
      post_time_local: number === 1 ? '10:00' : '16:00',
      race_name: `Race ${number}`,
      distance_m: 1200,
      surface: 'Dirt',
      course_label: 'Dirt Right-handed',
    })),
  },
});
const adapters = {
  jra: {
    discover: async () => { calls.push('discover:jra'); return [meeting('jra', 'new-jra')]; },
    inspect: async (value) => { calls.push(`inspect:${value.meeting_id}`); return rich(value); },
  },
  'nar-standard': {
    discover: async () => {
      calls.push('discover:nar');
      return [
        meeting('nar', 'nar-upgrade'),
        meeting('nar', 'nar-pending', '2026-09-05'),
        meeting('nar', 'nar-late', '2026-09-06'),
      ];
    },
    inspect: async (value) => {
      calls.push(`inspect:${value.meeting_id}`);
      if (value.meeting_id === 'nar-upgrade' && ++narIncompleteAttempts === 1) return { status: 'race_number_discovery_incomplete', reason: 'race_number_discovery_incomplete' };
      if (value.meeting_id === 'nar-pending') { narPendingAttempts += 1; return { status: 'scheduled_pending_details', reason: 'scheduled_pending_details' }; }
      if (value.meeting_id === 'nar-late' && ++narLateAttempts === 1) return { status: 'scheduled_pending_details', reason: 'scheduled_pending_details' };
      return rich(value);
    },
  },
  banei: {
    discover: async () => { calls.push('discover:banei'); return [meeting('banei', 'new-banei')]; },
    inspect: async (value) => { calls.push(`inspect:${value.meeting_id}`); return rich(value); },
  },
};

const result = await runJapanZeroBased30d({
  executionDate: '2026-09-04',
  adapters,
  retryDelayMs: 0,
  loadExisting: () => {
    assert.deepEqual(calls.slice(0, 3), ['discover:jra', 'discover:nar', 'discover:banei'], 'existing state read before zero-based enumeration completed');
    return {
      canonical: [{ ...meeting('nar', 'nar-upgrade'), country_id: 'japan', capability_rank: 'C' }],
      public: [{ ...meeting('nar', 'nar-upgrade'), country_id: 'japan', capability_rank: 'C' }],
    };
  },
});

assert.equal(result.reconciliations.find((row) => row.meeting_id === 'new-jra').outcome, 'add');
assert.equal(result.reconciliations.find((row) => row.meeting_id === 'nar-upgrade').outcome, 'update');
assert.equal(narIncompleteAttempts, 2);
assert.equal(narPendingAttempts, 3, 'scheduled_pending_details must be retried before becoming details_pending');
assert.equal(result.reconciliations.find((row) => row.meeting_id === 'nar-pending').outcome, 'details_pending');
assert.equal(result.reconciliations.find((row) => row.meeting_id === 'nar-pending').official_rank, 'C');
assert.equal(result.canonical.find((row) => row.meeting_id === 'nar-pending').capability_rank, 'C');
assert.equal(result.public.find((row) => row.meeting_id === 'nar-pending').capability_rank, 'C');
assert.equal(narLateAttempts, 2, 'scheduled_pending_details must be able to succeed on retry');
assert.equal(result.reconciliations.find((row) => row.meeting_id === 'nar-late').outcome, 'add');
assert.equal(result.reconciliations.find((row) => row.meeting_id === 'new-banei').outcome, 'add');
assert.equal(result.public.find((row) => row.meeting_id === 'nar-upgrade').capability_rank, 'A+');
assert.equal(result.details.find((row) => row.meeting_id === 'new-banei').capability_rank, 'A+');
assert.equal(result.complete, true);

assert.throws(() => assertJapanCompleteness([{ meeting_id: 'missing' }], [], []), /reconciliation incomplete/);
assert.throws(() => assertJapanCompleteness([{ meeting_id: 'duplicate' }], [{ meeting_id: 'duplicate', outcome: 'no_op' }, { meeting_id: 'duplicate', outcome: 'no_op' }], []), /reconciliation incomplete/);
assert.throws(() => assertJapanCompleteness([{ meeting_id: 'public-missing' }], [{ meeting_id: 'public-missing', outcome: 'details_pending', official_rank: 'C' }], []), /public completeness failed/);
assert.throws(() => assertJapanCompleteness([{ meeting_id: 'lower' }], [{ meeting_id: 'lower', outcome: 'update', official_rank: 'A+' }], [{ meeting_id: 'lower', capability_rank: 'C' }]), /rank completeness failed/);
console.log('JAPAN_ZERO_BASED_30D: pass');
