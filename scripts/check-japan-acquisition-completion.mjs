import assert from 'node:assert/strict';
import { runJapanZeroBased30d } from './timetable/japan-zero-based-30d-core.mjs';

function meeting(group, id, date) {
  const authority = group === 'jra'
    ? 'jra'
    : group === 'nar-standard'
      ? 'nar-local-government-racing'
      : 'banei-tokachi';
  const system = group === 'jra'
    ? 'japan-jra-system'
    : group === 'nar-standard'
      ? 'japan-nar-system'
      : 'japan-banei-system';
  return {
    meeting_id: id,
    date,
    authority_id: authority,
    racing_system_id: system,
    racecourse_id: `${id}-racecourse`,
    official_source_url: `https://official.example/${id}`,
  };
}

function rows({ rich }) {
  return [1, 2].map((number) => ({
    label: `Race ${number}`,
    post_time_local: number === 1 ? '10:00' : '16:00',
    ...(rich ? {
      race_name: `Race ${number}`,
      distance_m: number === 1 ? 1200 : 1400,
      surface: 'Turf',
      course_label: 'Turf Right-handed',
    } : {}),
  }));
}

const jraAPlus = meeting('jra', 'japan-completion-jra-aplus', '2026-09-11');
const narPending = meeting('nar-standard', 'japan-completion-nar-pending', '2026-09-12');
const narA = meeting('nar-standard', 'japan-completion-nar-a', '2026-09-13');
const baneiFailed = meeting('banei', 'japan-completion-banei-failed', '2026-09-14');

const adapters = {
  jra: {
    discover: async () => [jraAPlus],
    inspect: async (value) => ({
      status: 'ok',
      meeting: { ...value, timetable_rows: rows({ rich: true }) },
    }),
  },
  'nar-standard': {
    discover: async () => [narPending, narA],
    inspect: async (value) => {
      if (value.meeting_id === narPending.meeting_id) {
        return { status: 'scheduled_pending_details', reason: 'official_detail_not_published' };
      }
      return {
        status: 'ok',
        meeting: { ...value, timetable_rows: rows({ rich: false }) },
      };
    },
  },
  banei: {
    discover: async () => [baneiFailed],
    inspect: async () => ({ status: 'acquisition_failed', reason: 'fixture_source_failure' }),
  },
};

const result = await runJapanZeroBased30d({
  executionDate: '2026-09-11',
  adapters,
  attempts: 1,
  retryDelayMs: 0,
  checkedAt: '2026-09-11T00:00:00.000Z',
  loadExisting: () => ({ canonical: [], public: [], details: [], publicDetails: [] }),
});

const canonical = new Map(result.canonical.map((row) => [row.meeting_id, row]));
const reconciliations = new Map(result.reconciliations.map((row) => [row.meeting_id, row]));

assert.equal(canonical.get(jraAPlus.meeting_id).capability_rank, 'A+');
assert.equal(canonical.get(jraAPlus.meeting_id).acquisition_completion.disposition, 'complete_current_best_available');
assert.equal(reconciliations.get(jraAPlus.meeting_id).acquisition_completion, 'complete_current_best_available');

assert.equal(canonical.get(narPending.meeting_id).capability_rank, 'C');
assert.equal(canonical.get(narPending.meeting_id).acquisition_completion.disposition, 'pending_publication');
assert.equal(reconciliations.get(narPending.meeting_id).acquisition_completion, 'pending_publication');

assert.equal(canonical.get(narA.meeting_id).capability_rank, 'A');
assert.equal(canonical.get(narA.meeting_id).acquisition_completion.disposition, 'implementation_gap');
assert.equal(reconciliations.get(narA.meeting_id).acquisition_completion, 'implementation_gap');

assert.equal(canonical.get(baneiFailed.meeting_id).capability_rank, 'C');
assert.equal(canonical.get(baneiFailed.meeting_id).acquisition_completion.disposition, 'retry_required');
assert.equal(reconciliations.get(baneiFailed.meeting_id).acquisition_completion, 'retry_required');

console.log(JSON.stringify({
  ok: true,
  cases: {
    a_plus_terminal: 'complete_current_best_available',
    details_pending: 'pending_publication',
    successful_below_a_plus_without_evaluation_proof: 'implementation_gap',
    acquisition_failure: 'retry_required',
  },
}, null, 2));
