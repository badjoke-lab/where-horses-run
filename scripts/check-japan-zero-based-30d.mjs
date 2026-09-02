import assert from 'node:assert/strict';
import { assertJapanCompleteness, japan30DayRange, runJapanZeroBased30d } from './timetable/japan-zero-based-30d-core.mjs';

const range = japan30DayRange('2026-09-04');
assert.equal(range.dates.length, 30); assert.equal(range.dates[0], '2026-09-04');
assert.equal(range.dates.at(-1), '2026-10-03'); assert.equal(range.end_exclusive, '2026-10-04');
const calls = []; let narAttempts = 0;
const meeting = (group, id, date = '2026-09-04') => ({ meeting_id: id, date, authority_id: group, racing_system_id: `japan-${group}-system`, racecourse_id: `${group}-course`, official_source_url: `https://official.example/${group}` });
const rich = (base) => ({ status: 'ok', meeting: { ...base, capability_rank: 'A+', timetable_rows: [1, 2].map((n) => ({ label: `Race ${n}`, post_time_local: n === 1 ? '10:00' : '16:00', race_name: `Race ${n}`, distance_m: 1200, surface: 'Dirt', course_label: 'Course' })) } });
const adapters = {
  jra: { discover: async () => { calls.push('discover:jra'); return [meeting('jra', 'new-jra')]; }, inspect: async (m) => { calls.push(`inspect:${m.meeting_id}`); return rich(m); } },
  'nar-standard': { discover: async () => { calls.push('discover:nar'); return [meeting('nar', 'nar-upgrade'), meeting('nar', 'nar-pending', '2026-09-05')]; }, inspect: async (m) => { calls.push(`inspect:${m.meeting_id}`); if (m.meeting_id === 'nar-upgrade' && ++narAttempts === 1) return { status: 'race_number_discovery_incomplete' }; if (m.meeting_id === 'nar-pending') return { status: 'scheduled_pending_details' }; return rich(m); } },
  banei: { discover: async () => { calls.push('discover:banei'); return [meeting('banei', 'new-banei')]; }, inspect: async (m) => { calls.push(`inspect:${m.meeting_id}`); return rich(m); } },
};
const result = await runJapanZeroBased30d({ executionDate: '2026-09-04', adapters, retryDelayMs: 0, loadExisting: () => {
  assert.deepEqual(calls.slice(0, 3), ['discover:jra', 'discover:nar', 'discover:banei'], 'existing state read before zero-based enumeration completed');
  return { canonical: [{ ...meeting('nar', 'nar-upgrade'), country_id: 'japan', capability_rank: 'C' }], public: [{ ...meeting('nar', 'nar-upgrade'), country_id: 'japan', capability_rank: 'C' }] };
}});
assert.equal(result.reconciliations.find((x) => x.meeting_id === 'new-jra').outcome, 'add');
assert.equal(result.reconciliations.find((x) => x.meeting_id === 'nar-upgrade').outcome, 'update');
assert.equal(narAttempts, 2); assert.equal(result.reconciliations.find((x) => x.meeting_id === 'nar-pending').outcome, 'details_pending');
assert.equal(result.reconciliations.find((x) => x.meeting_id === 'new-banei').outcome, 'add');
assert.equal(result.public.find((x) => x.meeting_id === 'nar-upgrade').capability_rank, 'A+'); assert.equal(result.complete, true);

// Completeness and rank gates cannot be bypassed by adapter/state behavior.
assert.throws(() => assertJapanCompleteness([{ meeting_id: 'missing' }], [], []), /reconciliation incomplete/);
assert.throws(() => assertJapanCompleteness([{ meeting_id: 'lower' }], [{ meeting_id: 'lower', outcome: 'update', official_rank: 'A+' }], [{ meeting_id: 'lower', capability_rank: 'C' }]), /rank completeness failed/);
console.log('JAPAN_ZERO_BASED_30D: pass');
