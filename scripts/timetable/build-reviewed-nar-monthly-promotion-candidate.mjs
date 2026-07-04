import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = 'data/candidates/nar-monthly-meeting-candidates.json';
const reportPath = 'data/generated/timetable/nar-monthly-collection-report.json';
const reviewPath = 'data/reviews/nar-monthly-2026-07-through-2026-07-04-review.json';
const outputPath = 'data/candidates/nar-monthly-2026-07-through-2026-07-04-approved.json';
const checkOnly = process.argv.includes('--check');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}
function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}
function equalJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function endExclusive(throughDate) {
  const date = new Date(`${throughDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

const source = readJson(sourcePath);
const report = readJson(reportPath);
const review = readJson(reviewPath);

assert(source.schema_version === 'nar-monthly-meeting-candidates-v1', 'unexpected source candidate schema');
assert(report.schema_version === 'nar-monthly-collection-report-v1', 'unexpected NAR monthly report schema');
assert(review.schema_version === 'nar-monthly-review-decision-v1', 'unexpected NAR monthly review schema');
assert(source.work_id === 'WHR-CAL-JAPAN-NAR-A-PLUS', 'unexpected source Work ID');
assert(review.work_id === source.work_id, 'review Work ID differs');
assert(review.source_candidate_path === sourcePath, 'review source candidate path differs');
assert(review.source_generated_at === source.generated_at, 'review source generated_at differs');
assert(review.target_month === source.target_month && review.through_date === source.through_date, 'review target boundary differs');
assert(report.generated_at === source.generated_at, 'report/source generated_at differs');
assert(report.target_month === source.target_month && report.through_date === source.through_date, 'report/source target boundary differs');
assert(source.review?.status === 'needs_review' && source.review?.promotion_eligible === false, 'source candidate envelope must remain review-only');
assert(source.review?.canonical_write === 'disabled' && source.review?.public_write === 'disabled', 'source candidate write boundary differs');
assert(review.review?.status === 'approved', 'review decision is not approved');
assert(typeof review.review?.reviewer === 'string' && review.review.reviewer, 'reviewer is required');
assert(!Number.isNaN(Date.parse(review.review?.reviewed_at)), 'reviewed_at must be a valid date-time');
assert(Date.parse(source.generated_at) <= Date.parse(review.review.reviewed_at), 'review predates source generation');
assert(review.review?.promotion_target === 'canonical-timetable-v0', 'promotion target differs');
assert((source.blockers ?? []).length === 0 && (report.blockers ?? []).length === 0, 'blocked meetings must be zero for this approved batch');

for (const [key, expected] of Object.entries(review.expected_counts ?? {})) {
  assert(report[key] === expected, `review expected count differs for ${key}`);
}

const meetings = source.meetings ?? [];
const sourceIds = sorted(meetings.map((meeting) => meeting.candidate_id));
const approvedIds = sorted(review.approved_candidate_ids ?? []);
assert(sourceIds.length === new Set(sourceIds).size, 'source candidate IDs must be unique');
assert(approvedIds.length === new Set(approvedIds).size, 'approved candidate IDs must be unique');
assert(equalJson(sourceIds, approvedIds), 'review approval set must exactly equal the complete source meeting candidate set');
assert(report.meetings_discovered === meetings.length, 'discovered meeting count must equal source meeting count');
assert(report.complete_meeting_candidates === meetings.length, 'complete candidate count must equal source meeting count');

const records = meetings.map((meeting) => {
  assert(meeting.schema_version === 'nar-monthly-meeting-candidate-v1', `${meeting.candidate_id} schema differs`);
  assert(meeting.review?.status === 'needs_review' && meeting.review?.promotion_eligible === false, `${meeting.candidate_id} must remain needs_review in source`);
  assert(meeting.meeting_completeness?.all_a_plus_fields_complete === true, `${meeting.candidate_id} is not A+ complete`);
  const rows = meeting.timetable_rows ?? [];
  assert(rows.length === meeting.meeting_completeness.expected_race_count, `${meeting.candidate_id} row count differs`);
  assert(rows.length > 0, `${meeting.candidate_id} has no timetable rows`);

  const timetableRows = rows.map((row, index) => {
    const raceNumber = index + 1;
    assert(row.race_number === raceNumber, `${meeting.candidate_id} race numbers are not continuous`);
    for (const field of ['label', 'post_time_local', 'race_name', 'distance_m', 'surface', 'course_label']) {
      assert(row[field] !== null && row[field] !== '', `${meeting.candidate_id} Race ${raceNumber} missing ${field}`);
    }
    return {
      label: row.label,
      post_time_local: row.post_time_local,
      race_name: row.race_name,
      distance_m: row.distance_m,
      surface: row.surface,
      course_label: row.course_label,
    };
  });

  return {
    candidate_id: `approved-${meeting.candidate_id}`,
    meeting_id: meeting.candidate_id,
    country_id: meeting.country_id,
    authority_id: meeting.authority_id,
    racing_system_id: meeting.racing_system_id,
    racecourse_id: meeting.racecourse_id,
    date: meeting.date,
    timezone: meeting.timezone,
    capability_rank: 'A+',
    first_race_time_local: timetableRows[0].post_time_local,
    last_race_time_local: timetableRows.at(-1).post_time_local,
    timetable_rows: timetableRows,
    source: {
      source_id: 'nar-monthly-convene-info',
      official_url: meeting.source.official_race_list_url,
      checked_at: source.generated_at,
      extraction_method: 'adapter_candidate',
    },
    confidence: 'high',
    review_status: 'approved',
    notes: 'Approved from the reviewed NAR monthly public-safe candidate set. The promoted record contains only meeting identity and the six approved timetable fields.',
  };
});

records.sort((a, b) => `${a.date}:${a.racecourse_id}:${a.meeting_id}`.localeCompare(`${b.date}:${b.racecourse_id}:${b.meeting_id}`));

const output = {
  schema_version: 'timetable-candidate-v1',
  generated_at: source.generated_at,
  adapter_id: 'nar-monthly-reviewed-promotion-candidate-v1',
  country_id: 'japan',
  authority_id: 'nar-local-government-racing',
  source_id: 'nar-monthly-convene-info',
  candidate_window: {
    start_date: `${source.target_month}-01`,
    end_date_exclusive: endExclusive(source.through_date),
    timezone: 'Asia/Tokyo',
  },
  records,
  review: {
    status: review.review.status,
    reviewed_at: review.review.reviewed_at,
    reviewer: review.review.reviewer,
    promotion_target: review.review.promotion_target,
  },
};

const content = serialize(output);
const absoluteOutput = path.join(root, outputPath);
if (checkOnly) {
  assert(fs.existsSync(absoluteOutput), `missing generated approved candidate: ${outputPath}`);
  assert(fs.readFileSync(absoluteOutput, 'utf8') === content, `generated approved candidate is stale: ${outputPath}`);
  console.log(`NAR_REVIEWED_PROMOTION_CANDIDATE: pass records=${records.length}`);
  process.exit(0);
}
fs.mkdirSync(path.dirname(absoluteOutput), { recursive: true });
fs.writeFileSync(absoluteOutput, content);
console.log(`NAR_REVIEWED_PROMOTION_CANDIDATE: wrote records=${records.length}`);
