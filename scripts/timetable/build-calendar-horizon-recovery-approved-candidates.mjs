import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const REVIEWED_AT = '2026-07-19T17:00:00Z';
const REVIEWER = 'badjoke-lab';
const PROMOTION_TARGET = 'canonical-timetable-v0';
const BANEI_AUGUST_SCHEDULE_URL = 'https://www.banei-keiba.or.jp/race_schedule.php?c=mon&d=1785510000';

const paths = Object.freeze({
  narBatches: [
    'data/candidates/nar-incremental-batches/due-job-plan-2026-07-19-due-japan-nar-coverage-gap-001-run-001/batch.json',
    'data/candidates/nar-incremental-batches/due-job-plan-2026-07-19-due-japan-nar-coverage-gap-002-run-001/batch.json',
  ],
  jraInput: 'data/candidates/jra-horizon-recovery-2026-08-01-through-2026-08-16.json',
  baneiInput: 'data/candidates/banei-horizon-recovery-2026-08-15-through-2026-08-17.json',
  narOutput: 'data/candidates/nar-august-2026-horizon-recovery-c-approved.json',
  jraOutput: 'data/candidates/jra-horizon-recovery-2026-08-01-through-2026-08-16-approved.json',
  baneiOutput: 'data/candidates/banei-horizon-recovery-2026-08-15-through-2026-08-17-approved.json',
});

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function writeJson(relativePath, value) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertIso(value, label) {
  assert(typeof value === 'string' && !Number.isNaN(new Date(value).getTime()), `${label} must be an ISO timestamp`);
}

function assertCRecord(record, label) {
  assert(record.capability_rank === 'C', `${label} must remain Rank C`);
  assert(record.first_race_time_local === null, `${label} must not claim first race time`);
  assert(record.last_race_time_local === null, `${label} must not claim last race time`);
  assert(Array.isArray(record.timetable_rows) && record.timetable_rows.length === 0, `${label} must not contain timetable rows`);
  const serialized = JSON.stringify(record).toLowerCase();
  for (const forbidden of [
    'horse_name', 'jockey', 'trainer', 'odds', 'payout', 'result', 'prediction',
    'post_position', 'gate', 'weight_carried', 'raw_html', 'stream_url',
  ]) {
    assert(!serialized.includes(forbidden), `${label} contains forbidden field ${forbidden}`);
  }
}

function approvedEnvelope(base, records, summary) {
  const output = structuredClone(base);
  output.records = records;
  output.review = {
    status: 'approved',
    reviewed_at: REVIEWED_AT,
    reviewer: REVIEWER,
    summary,
    promotion_target: PROMOTION_TARGET,
  };
  assertIso(output.generated_at, `${output.adapter_id}.generated_at`);
  assert(new Date(REVIEWED_AT) >= new Date(output.generated_at), `${output.adapter_id} review precedes generation`);
  for (const [index, record] of output.records.entries()) {
    record.candidate_id = `approved-${record.meeting_id}`;
    record.review_status = 'approved';
    assertCRecord(record, `${output.adapter_id}.records[${index}]`);
    assertIso(record.source?.checked_at, `${record.meeting_id}.source.checked_at`);
    assert(new Date(REVIEWED_AT) >= new Date(record.source.checked_at), `${record.meeting_id} review precedes source check`);
  }
  return output;
}

function buildNar() {
  const batches = paths.narBatches.map(readJson);
  const records = [];
  for (const batch of batches) {
    assert(batch.schema_version === 'nar-incremental-batch-v2', `${batch.batch_id} schema differs`);
    assert(batch.review?.status === 'needs_review', `${batch.batch_id} must begin at needs_review`);
    assert(batch.review?.promotion_eligible === false, `${batch.batch_id} must not already be promotion eligible`);
    assert(batch.review?.raw_source_storage === 'disabled', `${batch.batch_id} raw source storage must remain disabled`);
    assert(batch.schedule_source?.source_id === 'nar-monthly-schedule-grid', `${batch.batch_id} schedule source differs`);
    assert(Array.isArray(batch.scheduled_meetings), `${batch.batch_id} scheduled_meetings missing`);
    for (const meeting of batch.scheduled_meetings) {
      records.push({
        candidate_id: `approved-${meeting.meeting_id}`,
        meeting_id: meeting.meeting_id,
        country_id: 'japan',
        authority_id: 'nar-local-government-racing',
        racing_system_id: 'japan-nar-system',
        racecourse_id: meeting.racecourse_id,
        date: meeting.date,
        timezone: 'Asia/Tokyo',
        capability_rank: 'C',
        first_race_time_local: null,
        last_race_time_local: null,
        timetable_rows: [],
        source: {
          source_id: 'nar-monthly-schedule-grid',
          official_url: meeting.official_schedule_url,
          checked_at: batch.generated_at,
          extraction_method: 'adapter_candidate',
        },
        confidence: 'high',
        review_status: 'approved',
        notes: 'Approved from the official NAR August 2026 monthly schedule. Meeting date and racecourse only; race times and programme detail remain pending.',
      });
    }
  }

  records.sort((left, right) => left.date.localeCompare(right.date) || left.meeting_id.localeCompare(right.meeting_id));
  const meetingIds = new Set(records.map((record) => record.meeting_id));
  assert(records.length === 51, `expected 51 NAR records, found ${records.length}`);
  assert(meetingIds.size === records.length, 'NAR meeting IDs must be unique');
  assert(records[0].date === '2026-08-01', `NAR first date differs: ${records[0].date}`);
  assert(records.at(-1).date === '2026-08-17', `NAR final date differs: ${records.at(-1).date}`);
  records.forEach((record, index) => assertCRecord(record, `NAR records[${index}]`));

  return {
    schema_version: 'timetable-candidate-v1',
    generated_at: batches.map((batch) => batch.generated_at).sort().at(-1),
    adapter_id: 'nar-august-2026-horizon-recovery-reviewed-schedule-promotion-v1',
    country_id: 'japan',
    authority_id: 'nar-local-government-racing',
    source_id: 'nar-monthly-schedule-grid',
    candidate_window: {
      start_date: '2026-08-01',
      end_date_exclusive: '2026-08-18',
      timezone: 'Asia/Tokyo',
    },
    records,
    review: {
      status: 'approved',
      reviewed_at: REVIEWED_AT,
      reviewer: REVIEWER,
      summary: 'Approved 51 Rank C NAR meeting identities from the official August 2026 monthly schedule; no race times, rows, participants, betting, or result data.',
      promotion_target: PROMOTION_TARGET,
    },
  };
}

function buildReviewedCopy(inputPath, summary, adapterId) {
  const input = readJson(inputPath);
  assert(input.schema_version === 'timetable-candidate-v1', `${inputPath} schema differs`);
  assert(input.review?.status === 'needs_review', `${inputPath} must begin at needs_review`);
  const records = input.records.map((record) => ({
    ...structuredClone(record),
    candidate_id: `approved-${record.meeting_id}`,
    review_status: 'approved',
    notes: `${record.notes} Approved for Rank C publication after exact meeting-identity review.`,
  }));
  const output = approvedEnvelope({ ...input, adapter_id: adapterId }, records, summary);
  const ids = new Set(output.records.map((record) => record.meeting_id));
  assert(ids.size === output.records.length, `${inputPath} contains duplicate meeting IDs`);
  return output;
}

const nar = buildNar();
const jra = buildReviewedCopy(
  paths.jraInput,
  'Approved 18 Rank C JRA meeting identities from official advance programme pages; no race times or programme rows are published.',
  'jra-horizon-recovery-reviewed-programme-promotion-v1',
);
const banei = buildReviewedCopy(
  paths.baneiInput,
  'Approved three Rank C Banei Obihiro meeting identities from the registered official August schedule; ordinary automated Banei refresh remains disabled.',
  'banei-horizon-recovery-reviewed-schedule-promotion-v1',
);
for (const record of banei.records) {
  record.source.official_url = BANEI_AUGUST_SCHEDULE_URL;
  record.source.extraction_method = 'adapter_candidate';
  record.confidence = 'low';
  record.notes = 'Approved official Banei August monthly-schedule meeting identity. No race times or programme rows are claimed; ordinary automated Banei refresh remains disabled.';
}

assert(jra.records.length === 18, `expected 18 JRA records, found ${jra.records.length}`);
assert(banei.records.length === 3, `expected 3 Banei records, found ${banei.records.length}`);
assert(banei.records.every((record) => new URL(record.source.official_url).hostname === 'www.banei-keiba.or.jp'), 'Banei official source hostname differs');

const allIds = [...nar.records, ...jra.records, ...banei.records].map((record) => record.meeting_id);
assert(new Set(allIds).size === allIds.length, 'cross-system recovery meeting IDs must be unique');

writeJson(paths.narOutput, nar);
writeJson(paths.jraOutput, jra);
writeJson(paths.baneiOutput, banei);

console.log(JSON.stringify({
  reviewed_at: REVIEWED_AT,
  outputs: [paths.narOutput, paths.jraOutput, paths.baneiOutput],
  record_counts: { nar: nar.records.length, jra: jra.records.length, banei: banei.records.length, total: allIds.length },
  publication_rank: 'C',
  public_write: false,
}));
