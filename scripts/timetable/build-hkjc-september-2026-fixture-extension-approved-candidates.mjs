import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const INPUT_1 = process.env.WHR_HKJC_REVIEW_BATCH_1;
const INPUT_2 = process.env.WHR_HKJC_REVIEW_BATCH_2;
const OUTPUT = 'data/candidates/hkjc-september-2026-fixture-extension-approved.json';
const REVIEWED_AT = '2026-08-20T05:10:00Z';
const REVIEWER = 'badjoke-lab';
const PROMOTION_TARGET = 'canonical-timetable-v0';
const OFFICIAL_URL = 'https://racing.hkjc.com/en-us/local/information/fixture?CalMonth=09&CalYear=2026';

function readJson(file) {
  const fullPath = path.isAbsolute(file) ? file : path.join(root, file);
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

function assertSourceEnvelope(candidate, expected) {
  assert(candidate.schema_version === 'timetable-candidate-v1', `${expected.label}: schema differs`);
  assert(candidate.adapter_id === 'hkjc-fixture-artifact-bridge-v1', `${expected.label}: adapter differs`);
  assert(candidate.country_id === 'hong-kong', `${expected.label}: country differs`);
  assert(candidate.authority_id === 'hkjc', `${expected.label}: authority differs`);
  assert(candidate.source_id === 'hkjc-fixture-list', `${expected.label}: source differs`);
  assert(candidate.generated_at === expected.generatedAt, `${expected.label}: generated_at differs`);
  assert(candidate.candidate_window?.start_date === expected.start, `${expected.label}: start date differs`);
  assert(candidate.candidate_window?.end_date_exclusive === expected.end, `${expected.label}: end date differs`);
  assert(candidate.candidate_window?.timezone === 'Asia/Hong_Kong', `${expected.label}: timezone differs`);
  assert(candidate.review?.status === 'needs_review', `${expected.label}: source review must remain needs_review`);
  assert(candidate.review?.reviewed_at === null, `${expected.label}: source reviewed_at must remain null`);
  assert(candidate.review?.reviewer === null, `${expected.label}: source reviewer must remain null`);
  assert(candidate.review?.promotion_target === null, `${expected.label}: source promotion target must remain null`);
  assert(Array.isArray(candidate.records), `${expected.label}: records missing`);
}

function assertRankCBoundary(record, label) {
  assert(record.capability_rank === 'C', `${label}: rank must remain C`);
  assert(record.first_race_time_local === null, `${label}: first race time must remain null`);
  assert(record.last_race_time_local === null, `${label}: last race time must remain null`);
  assert(Array.isArray(record.timetable_rows) && record.timetable_rows.length === 0, `${label}: timetable rows must remain empty`);
  assert(record.review_status === 'needs_review', `${label}: source record must remain needs_review`);
  assert(record.source?.source_id === 'hkjc-fixture-list', `${label}: source id differs`);
  assert(record.source?.official_url === OFFICIAL_URL, `${label}: official URL differs`);
  assert(record.source?.extraction_method === 'fixture_parser', `${label}: extraction method differs`);
  assert(new URL(record.source.official_url).hostname === 'racing.hkjc.com', `${label}: source hostname differs`);
  const serialized = JSON.stringify(record).toLowerCase();
  for (const forbidden of ['horse_name', 'jockey', 'trainer', 'odds', 'payout', 'result', 'prediction', 'raw_html', 'stream_url']) {
    assert(!serialized.includes(forbidden), `${label}: forbidden field ${forbidden}`);
  }
}

assert(INPUT_1, 'WHR_HKJC_REVIEW_BATCH_1 is required');
assert(INPUT_2, 'WHR_HKJC_REVIEW_BATCH_2 is required');
const first = readJson(INPUT_1);
const second = readJson(INPUT_2);

assertSourceEnvelope(first, {
  label: 'first source',
  generatedAt: '2026-08-20T05:03:24.099Z',
  start: '2026-09-07',
  end: '2026-09-14',
});
assertSourceEnvelope(second, {
  label: 'second source',
  generatedAt: '2026-08-20T05:03:39.303Z',
  start: '2026-09-14',
  end: '2026-09-19',
});
assert(first.records.length === 2, 'first HKJC review source must contain exactly two records');
assert(second.records.length === 1, 'second HKJC review source must contain exactly one record');
for (const [index, record] of first.records.entries()) assertRankCBoundary(record, `first.records[${index}]`);
for (const [index, record] of second.records.entries()) assertRankCBoundary(record, `second.records[${index}]`);

const sourceRecords = [...first.records, ...second.records].sort((left, right) => left.date.localeCompare(right.date) || left.meeting_id.localeCompare(right.meeting_id));
const expectedIds = [
  'hkjc-happy-valley-racecourse-2026-09-09',
  'hkjc-sha-tin-racecourse-2026-09-13',
  'hkjc-happy-valley-racecourse-2026-09-16',
];
assert(JSON.stringify(sourceRecords.map((record) => record.meeting_id)) === JSON.stringify(expectedIds), 'HKJC reviewed meeting identity set differs');
assert(new Set(sourceRecords.map((record) => record.meeting_id)).size === 3, 'HKJC meeting IDs must be unique');

const records = sourceRecords.map((record) => ({
  candidate_id: `approved-${record.meeting_id}`,
  meeting_id: record.meeting_id,
  country_id: record.country_id,
  authority_id: record.authority_id,
  racing_system_id: record.racing_system_id,
  racecourse_id: record.racecourse_id,
  date: record.date,
  timezone: record.timezone,
  capability_rank: 'C',
  first_race_time_local: null,
  last_race_time_local: null,
  timetable_rows: [],
  source: {
    source_id: record.source.source_id,
    official_url: record.source.official_url,
    checked_at: record.source.checked_at,
    extraction_method: record.source.extraction_method,
  },
  confidence: 'high',
  review_status: 'approved',
  notes: 'Approved from the official HKJC September 2026 fixture. Meeting identity only; race times and programme rows remain unclaimed.',
}));

assert(new Date(REVIEWED_AT) >= new Date(first.generated_at), 'review must not precede first source generation');
assert(new Date(REVIEWED_AT) >= new Date(second.generated_at), 'review must not precede second source generation');

const output = {
  schema_version: 'timetable-candidate-v1',
  generated_at: second.generated_at,
  adapter_id: 'hkjc-september-2026-reviewed-fixture-extension-v1',
  country_id: 'hong-kong',
  authority_id: 'hkjc',
  source_id: 'hkjc-fixture-list',
  candidate_window: {
    start_date: '2026-09-09',
    end_date_exclusive: '2026-09-17',
    timezone: 'Asia/Hong_Kong',
  },
  records,
  review: {
    status: 'approved',
    reviewed_at: REVIEWED_AT,
    reviewer: REVIEWER,
    summary: 'Approved three HKJC September fixture meeting identities at Rank C from exact daily-acquisition review evidence; no race times or programme rows are claimed.',
    promotion_target: PROMOTION_TARGET,
  },
};

writeJson(OUTPUT, output);
console.log(JSON.stringify({ output: OUTPUT, approved_records: records.length, meeting_ids: expectedIds, max_rank: 'C', public_write: false }));
