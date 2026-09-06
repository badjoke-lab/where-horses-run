import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  assessKraWindowCoverage,
  generateKraPlanMeetings,
  parseKraOperationPlan,
  validateKraGeneratedPlan,
} from './timetable/kra-operation-plan-core.mjs';

const source = fs.readFileSync('scripts/timetable/run-kra-official-window.mjs', 'utf8');
assert.match(source, /const DETAIL_CHILD_TIMEOUT_MS = \d[\d_]*;/, 'KRA detail collection must declare a bounded child timeout');
assert.match(source, /timeout:\s*DETAIL_CHILD_TIMEOUT_MS/, 'KRA detail child process must use the bounded timeout');
assert.match(source, /killSignal:\s*'SIGKILL'/, 'KRA detail child process must be force-terminated after the bound');
assert.match(source, /skipped_not_published/, 'KRA artifact must expose publication-gated detail skips');
assert.match(source, /fallback_full_detail/, 'KRA published-racecard probe failure must fall back to full detail collection');
assert.match(source, /PUBLISHED_RACECARD_URL[\s\S]*ThisWeekDetailInfoList\.do/, 'KRA detail gate must use the official published racecard page');
assert.match(source, /parsePublishedRacecardMeetings/, 'KRA detail gate must parse racecourse/date pairs from published racecards');
assert.match(source, /window_coverage:\s*windowCoverage/, 'KRA artifact must expose annual-plan window coverage');
assert.match(source, /completeness:\s*windowCoverage\.status/, 'KRA artifact must expose complete vs partial annual-plan coverage');
assert.doesNotMatch(source, /RegistStateList\.do/, 'KRA detail gate must not treat registration status as published racecard evidence');
assert.doesNotMatch(source, /PLAN_2026/, 'KRA runtime must not hard-code a 2026 annual plan');
assert.doesNotMatch(source, /PLAN_2027/, 'KRA runtime must not hard-code a 2027 annual plan');

const fixture = `
<html><body>
<h2>경마시행 기간 : 2026. 1.2.(금) ∼ 12.27.(일)</h2>
<table>
<tr><td>개최기간</td><td>1.3.~12.27</td><td>1.2.~12.27</td><td>9.13.~12.6</td><td>1.3.~12.26</td><td>1.2.~12.26</td></tr>
<tr><td>경마일수</td><td>101일</td><td>86일</td><td>12일</td><td>98일</td><td>101일</td></tr>
<tr><td>2.20. ∼ 2.22.</td><td>휴장</td><td>휴장</td><td></td><td>휴장</td><td>설 휴장</td></tr>
<tr><td>7.31. ∼ 8.2.</td><td>휴장</td><td>휴장</td><td></td><td>휴장</td><td>혹서기 휴장</td></tr>
<tr><td>9.25. ∼ 9.27.</td><td>휴장</td><td>휴장</td><td>휴장</td><td>휴장</td><td>추석 휴장</td></tr>
</table>
<section>월요일 공휴경마 운영 3.2(월) 8.17(월) 10.5(월)</section>
</body></html>`;

const track = {
  seoul: { racecourse_id: 'seoul-racecourse' },
  busan: { racecourse_id: 'busan-gyeongnam-racecourse' },
  yeongcheon: { racecourse_id: 'yeongcheon-racecourse' },
  jeju: { racecourse_id: 'jeju-racecourse' },
};
const plan = parseKraOperationPlan(fixture);
assert.equal(plan.year, 2026);
assert.equal(plan.periods.yeongcheon.start, '2026-09-13');
assert.deepEqual(plan.holiday_mondays, ['2026-03-02', '2026-08-17', '2026-10-05']);
const annual = generateKraPlanMeetings(plan, track);
assert.deepEqual(validateKraGeneratedPlan(annual, plan, track), {
  seoul: 101,
  busan: 86,
  yeongcheon: 12,
  jeju: 101,
});

assert.deepEqual(assessKraWindowCoverage(2026, '2026-09-06', 30), {
  status: 'complete',
  start_year_available: true,
  requested_plan_years: [2026],
  covered_plan_years: [2026],
  unresolved_plan_years: [],
  unresolved_reason: null,
  end_date_exclusive: '2026-10-06',
});
assert.deepEqual(assessKraWindowCoverage(2026, '2026-12-15', 30), {
  status: 'partial',
  start_year_available: true,
  requested_plan_years: [2026, 2027],
  covered_plan_years: [2026],
  unresolved_plan_years: [2027],
  unresolved_reason: 'official_annual_plan_not_available',
  end_date_exclusive: '2027-01-14',
});
assert.deepEqual(assessKraWindowCoverage(2026, '2027-01-01', 30), {
  status: 'unavailable',
  start_year_available: false,
  requested_plan_years: [2027],
  covered_plan_years: [],
  unresolved_plan_years: [2027],
  unresolved_reason: 'official_annual_plan_not_available',
  end_date_exclusive: '2027-01-31',
});

console.log('KRA_WINDOW_BOUNDS: pass');
