import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const DEFAULT_PLAN_PATH = path.join(ROOT, 'data/static/kra-2026-reviewed-calendar-plan-v1.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function assertPlan(plan) {
  if (plan?.schema_version !== 'kra-reviewed-calendar-plan-v1') throw new Error('unexpected KRA plan schema');
  if (plan?.country_id !== 'south-korea') throw new Error('unexpected country_id');
  if (plan?.authority_id !== 'korea-racing-authority') throw new Error('unexpected authority_id');
  if (plan?.publication_ceiling !== 'C') throw new Error('KRA reviewed plan must be capped at Rank C');
  if (!Array.isArray(plan?.venues) || plan.venues.length !== 3) throw new Error('KRA reviewed plan must contain exactly three venues');
}

export function buildKraRankCCandidate(plan) {
  assertPlan(plan);
  const records = plan.venues.flatMap((venue) => venue.dates.map((date) => {
    const meetingId = `kra-${venue.racecourse_id}-${date}`;
    return {
      candidate_id: `candidate-${meetingId}`,
      meeting_id: meetingId,
      country_id: plan.country_id,
      authority_id: plan.authority_id,
      racing_system_id: 'kra-national-racing-system',
      racecourse_id: venue.racecourse_id,
      date,
      timezone: plan.candidate_window.timezone,
      capability_rank: 'C',
      first_race_time_local: null,
      last_race_time_local: null,
      timetable_rows: [],
      source: {
        source_id: plan.source_id,
        official_url: plan.source_url,
        checked_at: plan.reviewed_at,
        extraction_method: 'reviewed_snapshot'
      },
      confidence: 'high',
      review_status: 'pending',
      notes: 'Official KRA operating plan supports the meeting date and venue identity. Candidate is capped at Rank C and requires human promotion review.'
    };
  }));

  records.sort((a, b) => a.date.localeCompare(b.date) || a.racecourse_id.localeCompare(b.racecourse_id));
  const ids = new Set(records.map((record) => record.meeting_id));
  if (ids.size !== records.length) throw new Error('duplicate KRA meeting_id');

  return {
    schema_version: 'timetable-candidate-v1',
    generated_at: plan.reviewed_at,
    adapter_id: 'kra-2026-reviewed-calendar-plan-rank-c-v1',
    country_id: plan.country_id,
    authority_id: plan.authority_id,
    source_id: plan.source_id,
    candidate_window: { ...plan.candidate_window },
    records,
    review: {
      status: 'pending',
      reviewed_at: null,
      reviewer: null,
      summary: 'Generated from a reviewed official KRA calendar plan. Human promotion review remains required.',
      promotion_target: 'canonical-timetable-v0'
    }
  };
}

export function loadKraRankCCandidate(planPath = DEFAULT_PLAN_PATH) {
  return buildKraRankCCandidate(readJson(planPath));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = loadKraRankCCandidate(process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_PLAN_PATH);
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}
