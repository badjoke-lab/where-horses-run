import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const INPUT = process.env.WHR_NAR_REVIEW_BATCH;
const OUTPUT = 'data/candidates/nar-regular-refresh-2026-08-22-through-2026-08-25-a-plus-approved.json';
const REVIEWED_AT = '2026-08-21T14:30:00Z';
const REVIEWER = 'badjoke-lab';
const PROMOTION_TARGET = 'canonical-timetable-v0';
const EXPECTED_IDS = [
  'nar-kanazawa-racecourse-2026-08-23',
  'nar-kanazawa-racecourse-2026-08-24',
  'nar-kanazawa-racecourse-2026-08-25',
  'nar-morioka-racecourse-2026-08-23',
  'nar-saga-racecourse-2026-08-22',
  'nar-saga-racecourse-2026-08-23',
];
const REQUIRED_PUBLIC_ROW_FIELDS = [
  'label',
  'post_time_local',
  'race_name',
  'distance_m',
  'surface',
  'course_label',
];

function readJson(relativePath) {
  const fullPath = path.isAbsolute(relativePath) ? relativePath : path.join(root, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function writeJson(relativePath, value) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function publicRows(candidate) {
  const rows = candidate.timetable_rows ?? [];
  const completeness = candidate.meeting_completeness ?? {};
  assert(completeness.all_a_plus_fields_complete === true, `${candidate.candidate_id}: A+ completeness flag differs`);
  assert(completeness.continuous_race_numbers === true, `${candidate.candidate_id}: race numbers are not continuous`);
  assert(Number.isInteger(completeness.expected_race_count) && completeness.expected_race_count > 0, `${candidate.candidate_id}: expected race count invalid`);
  assert(completeness.observed_race_count === completeness.expected_race_count, `${candidate.candidate_id}: observed race count differs`);
  assert(rows.length === completeness.expected_race_count, `${candidate.candidate_id}: timetable row count differs`);
  assert(exact(completeness.expected_race_numbers, Array.from({ length: rows.length }, (_, index) => index + 1)), `${candidate.candidate_id}: expected race-number set differs`);

  return rows.map((row, index) => {
    const raceNumber = index + 1;
    assert(row.race_number === raceNumber, `${candidate.candidate_id}: race ${raceNumber} number differs`);
    for (const field of REQUIRED_PUBLIC_ROW_FIELDS) {
      assert(row[field] !== null && row[field] !== undefined && row[field] !== '', `${candidate.candidate_id}: race ${raceNumber} missing ${field}`);
    }
    assert(typeof row.label === 'string', `${candidate.candidate_id}: race ${raceNumber} label type differs`);
    assert(/^\d{2}:\d{2}$/.test(row.post_time_local), `${candidate.candidate_id}: race ${raceNumber} post time format differs`);
    assert(typeof row.race_name === 'string', `${candidate.candidate_id}: race ${raceNumber} race name type differs`);
    assert(Number.isInteger(row.distance_m) && row.distance_m > 0, `${candidate.candidate_id}: race ${raceNumber} distance differs`);
    assert(['Dirt', 'Turf'].includes(row.surface), `${candidate.candidate_id}: race ${raceNumber} surface differs`);
    assert(typeof row.course_label === 'string' && row.course_label.length > 0, `${candidate.candidate_id}: race ${raceNumber} course label differs`);
    assert(row.source_trace?.detail_parsed === true, `${candidate.candidate_id}: race ${raceNumber} detail parse is not verified`);
    assert(row.source_trace?.detail_http_status === 200, `${candidate.candidate_id}: race ${raceNumber} detail status differs`);
    assert(new URL(row.source_trace?.detail_url).hostname === 'www.keiba.go.jp', `${candidate.candidate_id}: race ${raceNumber} detail host differs`);

    return {
      label: row.label,
      post_time_local: row.post_time_local,
      race_name: row.race_name,
      distance_m: row.distance_m,
      surface: row.surface,
      course_label: row.course_label,
    };
  });
}

assert(INPUT, 'WHR_NAR_REVIEW_BATCH is required');
const batch = readJson(INPUT);
assert(batch.schema_version === 'nar-incremental-batch-v2', 'NAR review batch schema differs');
assert(batch.batch_id === 'due-job-plan-2026-08-21-due-japan-nar-regular-refresh-001-run-001', 'NAR review batch identity differs');
assert(batch.generated_at === '2026-08-21T04:38:58.183Z', 'NAR review batch timestamp differs');
assert(batch.work_id === 'WHR-CAL-JAPAN-NAR-A-PLUS', 'NAR Work ID differs');
assert(batch.collection_mode === 'date_window', 'NAR collection mode differs');
assert(batch.requested_scope?.kind === 'date_window', 'NAR requested scope kind differs');
assert(batch.requested_scope?.start_date === '2026-08-22', 'NAR requested start date differs');
assert(batch.requested_scope?.end_date_exclusive === '2026-09-05', 'NAR requested end date differs');
assert(batch.requested_scope?.timezone === 'Asia/Tokyo', 'NAR requested timezone differs');
assert(batch.review?.status === 'needs_review', 'source NAR review state differs');
assert(batch.review?.promotion_eligible === false, 'source NAR batch must remain promotion ineligible');
assert(batch.review?.canonical_write === 'disabled', 'source NAR canonical write boundary differs');
assert(batch.review?.public_write === 'disabled', 'source NAR public write boundary differs');
assert(batch.review?.raw_source_storage === 'disabled', 'source NAR raw-storage boundary differs');
assert(batch.detail_source?.source_id === 'nar-race-list-deba-table', 'NAR detail source differs');
assert(Array.isArray(batch.schedule_errors) && batch.schedule_errors.length === 0, 'NAR schedule errors must remain empty');
assert(new Date(REVIEWED_AT) >= new Date(batch.generated_at), 'review must not precede source generation');

const detailCandidates = batch.detail_candidates ?? [];
assert(detailCandidates.length === EXPECTED_IDS.length, `NAR complete A+ detail candidate count differs: ${detailCandidates.length}`);
assert(exact(sorted(detailCandidates.map((candidate) => candidate.candidate_id)), sorted(EXPECTED_IDS)), 'NAR A+ candidate identity set differs');
const blockedIds = new Set((batch.detail_blockers ?? []).map((blocker) => blocker.meeting_id));
const scheduleOnlyIds = new Set((batch.schedule_candidates ?? []).map((candidate) => candidate.meeting_id));
for (const id of EXPECTED_IDS) {
  assert(!blockedIds.has(id), `${id}: reviewed A+ candidate is also blocked`);
  assert(!scheduleOnlyIds.has(id), `${id}: reviewed A+ candidate is also schedule-only`);
}

const records = detailCandidates.map((candidate) => {
  assert(candidate.schema_version === 'nar-incremental-detail-candidate-v2', `${candidate.candidate_id}: detail schema differs`);
  assert(candidate.candidate_rank === 'A+', `${candidate.candidate_id}: source rank differs`);
  assert(candidate.review?.status === 'needs_review', `${candidate.candidate_id}: source review state differs`);
  assert(candidate.review?.promotion_eligible === false, `${candidate.candidate_id}: source candidate must remain promotion ineligible`);
  assert(candidate.source?.source_id === 'nar-official-race-list-and-deba-table', `${candidate.candidate_id}: source ID differs`);
  assert(candidate.source?.list_http_status === 200, `${candidate.candidate_id}: race-list status differs`);
  assert(candidate.source?.storage_policy === 'public_safe_extracted_fields_only_no_raw_html', `${candidate.candidate_id}: storage policy differs`);
  assert(new URL(candidate.source?.official_race_list_url).hostname === 'www.keiba.go.jp', `${candidate.candidate_id}: source hostname differs`);
  const rows = publicRows(candidate);
  const record = {
    candidate_id: `approved-${candidate.candidate_id}`,
    meeting_id: candidate.candidate_id,
    country_id: candidate.country_id,
    authority_id: candidate.authority_id,
    racing_system_id: candidate.racing_system_id,
    racecourse_id: candidate.racecourse_id,
    date: candidate.date,
    timezone: candidate.timezone,
    capability_rank: 'A+',
    first_race_time_local: rows[0].post_time_local,
    last_race_time_local: rows.at(-1).post_time_local,
    timetable_rows: rows,
    source: {
      source_id: 'nar-race-list-deba-table',
      official_url: candidate.source.official_race_list_url,
      checked_at: batch.generated_at,
      extraction_method: 'adapter_candidate',
    },
    confidence: 'high',
    review_status: 'approved',
    notes: 'Approved from the pinned NAR regular-refresh A+ detail candidate. Only meeting identity and the six public-safe A+ timetable fields are promoted.',
  };
  const serialized = JSON.stringify(record).toLowerCase();
  for (const forbidden of ['horse_name', 'jockey', 'trainer', 'odds', 'payout', 'result', 'prediction', 'raw_html', 'starter']) {
    assert(!serialized.includes(forbidden), `${candidate.candidate_id}: approved record contains forbidden field ${forbidden}`);
  }
  return record;
});

records.sort((a, b) => `${a.date}:${a.racecourse_id}:${a.meeting_id}`.localeCompare(`${b.date}:${b.racecourse_id}:${b.meeting_id}`));
assert(exact(sorted(records.map((record) => record.meeting_id)), sorted(EXPECTED_IDS)), 'approved NAR record identity set differs');

const output = {
  schema_version: 'timetable-candidate-v1',
  generated_at: batch.generated_at,
  adapter_id: 'nar-regular-refresh-2026-08-22-through-2026-08-25-reviewed-a-plus-promotion-v1',
  country_id: 'japan',
  authority_id: 'nar-local-government-racing',
  source_id: 'nar-race-list-deba-table',
  candidate_window: {
    start_date: '2026-08-22',
    end_date_exclusive: '2026-08-26',
    timezone: 'Asia/Tokyo',
  },
  records,
  review: {
    status: 'approved',
    reviewed_at: REVIEWED_AT,
    reviewer: REVIEWER,
    summary: 'Approved six complete Rank A+ NAR meetings from the pinned August 21 regular-refresh evidence: Kanazawa August 23-25, Morioka August 23, and Saga August 22-23. Publication is limited to the six public-safe timetable fields.',
    promotion_target: PROMOTION_TARGET,
  },
};

writeJson(OUTPUT, output);
console.log(JSON.stringify({
  input: INPUT,
  output: OUTPUT,
  approved_records: records.length,
  promoted_detail_records: records.length,
  meeting_ids: records.map((record) => record.meeting_id),
  first_date: records[0].date,
  last_date: records.at(-1).date,
  public_write: false,
}));
