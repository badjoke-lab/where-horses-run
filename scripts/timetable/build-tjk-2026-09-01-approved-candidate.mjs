import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reviewPath = 'data/candidates/tjk-current-2026-09-01-promotion-review-v1.json';
const outputPath = 'data/candidates/tjk-current-2026-09-01-approved.json';
const checkOnly = process.argv.includes('--check');
const review = JSON.parse(fs.readFileSync(path.join(root, reviewPath), 'utf8'));
const assert = (condition, message) => { if (!condition) throw new Error(`[TJK 2026-09-01 approved candidate] ${message}`); };
const serialize = (value) => `${JSON.stringify(value, null, 2)}\n`;

assert(review.review?.status === 'approved', 'explicit human review is required');
assert(review.review?.reviewer === 'badjoke-lab', 'reviewer must be badjoke-lab');
assert(typeof review.review?.reviewed_at === 'string' && !Number.isNaN(Date.parse(review.review.reviewed_at)), 'reviewed_at must be a valid timestamp');
assert(review.meeting_count === 2 && review.race_count === 16 && review.records?.length === 2, 'approved scope must remain exactly 2 meetings / 16 races');
assert(review.candidate_rank === 'A' && review.public_ceiling === 'A', 'approved publication rank must remain A');
assert(review.identity_review?.existing_public_identity_found === true && review.identity_review?.registration_required_for_promotion === false, 'promotion must reuse existing reviewed identities only');
assert(review.publication_boundary?.automatic_approval === false && review.publication_boundary?.automatic_merge === false && review.publication_boundary?.deployment_performed === false, 'automation boundary differs');

const records = review.records.map((record) => {
  assert(record.candidate_rank === 'A' && record.race_count === 8 && record.race_schedule?.length === 8, `scope/rank differs for ${record.source_venue_id}`);
  record.race_schedule.forEach((row, index) => assert(row.race_number === index + 1, `non-contiguous race schedule for ${record.source_venue_id}`));
  return {
    candidate_id: `candidate-${record.canonical_meeting_id}`,
    meeting_id: record.canonical_meeting_id,
    country_id: 'turkey',
    authority_id: 'turkiye-jokey-kulubu',
    racing_system_id: 'tjk-national-racing-system',
    racecourse_id: record.public_racecourse_id,
    date: record.date,
    timezone: 'Europe/Istanbul',
    capability_rank: 'A',
    first_race_time_local: record.first_race_time_local,
    last_race_time_local: record.last_race_time_local,
    timetable_rows: record.race_schedule.map((row) => ({ label: `Race ${row.race_number}`, post_time_local: row.post_time_local })),
    source: {
      source_id: 'tjk-daily-programme',
      official_url: record.official_url,
      checked_at: review.review.reviewed_at,
      extraction_method: 'reviewed_live_best_available_candidate',
    },
    confidence: 'high',
    review_status: 'approved',
    notes: `Human-approved TJK Rank A timetable for ${record.source_venue_label} on 2026-09-01. Public output is limited to meeting identity and Race 1-N post times; A+ technical capability does not expand the public field set.`,
  };
});

const output = {
  schema_version: 'timetable-candidate-v1',
  generated_at: review.review.reviewed_at,
  adapter_id: 'tjk-current-2026-09-01-approved-v1',
  country_id: 'turkey',
  authority_id: 'turkiye-jokey-kulubu',
  source_id: 'tjk-daily-programme',
  technical_capability_rank: 'A+',
  publication_ceiling: 'A',
  candidate_window: review.candidate_window,
  records,
  review: {
    status: 'approved',
    reviewed_at: review.review.reviewed_at,
    reviewer: review.review.reviewer,
    promotion_target: 'canonical-timetable-v0',
  },
  publication_effect: 'reviewed-promotion-unit',
};

const content = serialize(output);
const absolute = path.join(root, outputPath);
if (checkOnly) {
  assert(fs.existsSync(absolute), `missing generated approved candidate: ${outputPath}`);
  assert(fs.readFileSync(absolute, 'utf8') === content, `generated approved candidate is stale: ${outputPath}`);
  console.log('TJK_2026_09_01_APPROVED_CANDIDATE: pass meetings=2 races=16');
} else {
  fs.writeFileSync(absolute, content);
  console.log('TJK_2026_09_01_APPROVED_CANDIDATE: wrote meetings=2 races=16');
}
