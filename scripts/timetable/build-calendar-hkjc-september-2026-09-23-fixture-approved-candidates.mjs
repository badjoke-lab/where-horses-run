import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const CANDIDATES_INPUT = process.env.WHR_HKJC_REVIEW_CANDIDATES;
const REPORT_INPUT = process.env.WHR_HKJC_REVIEW_REPORT;
const OUTPUT = 'data/candidates/hkjc-september-2026-09-23-fixture-approved.json';
const REVIEWED_AT = '2026-08-26T08:23:00Z';
const REVIEWER = 'badjoke-lab';
const BATCH_ID = 'due-job-plan-2026-08-26-due-hong-kong-hkjc-season-wake-up-001-run-001';
const GENERATED_AT = '2026-08-26T08:16:14.292Z';
const CANDIDATES_BLOB_SHA = 'c957541f5682224d9c840f9285b567b5ae55cc1e';
const REPORT_BLOB_SHA = '63a866b17a7af602ba7be3ca3b3b8ed1c83af860';
const MEETING_ID = 'hkjc-happy-valley-racecourse-2026-09-23';

function assert(condition, message) { if (!condition) throw new Error(message); }
function readText(inputPath) {
  const full = path.isAbsolute(inputPath) ? inputPath : path.join(root, inputPath);
  return fs.readFileSync(full, 'utf8');
}
function gitBlobSha(text) {
  const content = Buffer.from(text, 'utf8');
  return createHash('sha1').update(Buffer.from(`blob ${content.length}\0`, 'utf8')).update(content).digest('hex');
}
function writeJson(relativePath, value) {
  const full = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, `${JSON.stringify(value, null, 2)}\n`);
}

assert(CANDIDATES_INPUT, 'WHR_HKJC_REVIEW_CANDIDATES is required');
assert(REPORT_INPUT, 'WHR_HKJC_REVIEW_REPORT is required');
const candidatesText = readText(CANDIDATES_INPUT);
const reportText = readText(REPORT_INPUT);
assert(gitBlobSha(candidatesText) === CANDIDATES_BLOB_SHA, 'HKJC candidate artifact blob SHA differs');
assert(gitBlobSha(reportText) === REPORT_BLOB_SHA, 'HKJC collection report blob SHA differs');
const source = JSON.parse(candidatesText);
const report = JSON.parse(reportText);

assert(report.schema_version === 'calendar-hkjc-fixture-artifact-report-v1', 'HKJC report schema differs');
assert(report.work_id === 'WHR-CAL-HONG-KONG-HKJC', 'HKJC Work ID differs');
assert(report.implementation_unit === 'HKJC-PILOT-02', 'HKJC implementation unit differs');
assert(report.batch_id === BATCH_ID, 'HKJC batch identity differs');
assert(report.generated_at === GENERATED_AT, 'HKJC report timestamp differs');
assert(report.requested_scope?.start_date === '2026-09-23', 'HKJC scope start differs');
assert(report.requested_scope?.end_date_exclusive === '2026-09-25', 'HKJC scope end differs');
assert(report.requested_scope?.timezone === 'Asia/Hong_Kong', 'HKJC timezone differs');
assert(JSON.stringify(report.requested_months) === JSON.stringify(['2026-09']), 'HKJC requested month differs');
assert(report.successful_month_count === 1, 'HKJC successful month count differs');
assert(report.source_error_count === 0, 'HKJC source errors must remain zero');
assert(report.records_discovered === 1, 'HKJC discovered record count differs');
assert(report.rank_counts?.C === 1 && report.rank_counts?.A === 0 && report.rank_counts?.['A+'] === 0, 'HKJC rank counts differ');
assert(report.coverage_claim === 'source_window_complete', 'HKJC coverage claim differs');
assert(report.publication_effect === 'none', 'HKJC source publication effect differs');
for (const key of ['canonical_write_enabled','public_write_enabled','automatic_approval_enabled','automatic_promotion_enabled','automatic_publication_enabled']) {
  assert(report[key] === false, `HKJC source boundary differs: ${key}`);
}

assert(source.schema_version === 'timetable-candidate-v1', 'HKJC source candidate schema differs');
assert(source.generated_at === GENERATED_AT, 'HKJC source candidate timestamp differs');
assert(source.adapter_id === 'hkjc-fixture-artifact-bridge-v1', 'HKJC source adapter differs');
assert(source.country_id === 'hong-kong' && source.authority_id === 'hkjc', 'HKJC source authority differs');
assert(source.source_id === 'hkjc-fixture-list', 'HKJC source ID differs');
assert(source.candidate_window?.start_date === '2026-09-23' && source.candidate_window?.end_date_exclusive === '2026-09-25', 'HKJC candidate window differs');
assert(source.review?.status === 'needs_review' && source.review?.promotion_target === null, 'HKJC source review boundary differs');
assert(Array.isArray(source.records) && source.records.length === 1, 'HKJC source record count differs');
const candidate = source.records[0];
assert(candidate.candidate_id === `${MEETING_ID}-fixture-candidate`, 'HKJC source candidate identity differs');
assert(candidate.meeting_id === MEETING_ID, 'HKJC meeting identity differs');
assert(candidate.racecourse_id === 'happy-valley-racecourse' && candidate.date === '2026-09-23', 'HKJC meeting coordinates differ');
assert(candidate.timezone === 'Asia/Hong_Kong', 'HKJC meeting timezone differs');
assert(candidate.capability_rank === 'C', 'HKJC fixture candidate must remain Rank C');
assert(candidate.first_race_time_local === null && candidate.last_race_time_local === null, 'HKJC fixture candidate must not claim race times');
assert(Array.isArray(candidate.timetable_rows) && candidate.timetable_rows.length === 0, 'HKJC fixture candidate must not contain timetable rows');
assert(candidate.source?.source_id === 'hkjc-fixture-list', 'HKJC fixture record source differs');
assert(candidate.source?.official_url === 'https://racing.hkjc.com/en-us/local/information/fixture?CalMonth=09&CalYear=2026', 'HKJC official fixture URL differs');
assert(candidate.source?.extraction_method === 'fixture_parser', 'HKJC extraction method differs');
assert(candidate.confidence === 'high' && candidate.review_status === 'needs_review', 'HKJC source review state differs');
assert(new Date(REVIEWED_AT) >= new Date(GENERATED_AT), 'review must not precede source generation');

const record = {
  ...candidate,
  candidate_id: `approved-${MEETING_ID}`,
  review_status: 'approved',
  notes: 'Approved from the pinned official HKJC September 2026 fixture artifact. Meeting identity only; race times and programme rows remain unclaimed.',
};
const serialized = JSON.stringify(record).toLowerCase();
for (const forbidden of ['horse_name','jockey','trainer','odds','payout','result','prediction','raw_html','stream_url']) {
  assert(!serialized.includes(forbidden), `HKJC approved record contains forbidden field ${forbidden}`);
}

const output = {
  schema_version: 'timetable-candidate-v1',
  generated_at: GENERATED_AT,
  adapter_id: 'hkjc-september-2026-09-23-reviewed-fixture-promotion-v1',
  country_id: 'hong-kong',
  authority_id: 'hkjc',
  source_id: 'hkjc-fixture-list',
  candidate_window: {
    start_date: '2026-09-23',
    end_date_exclusive: '2026-09-24',
    timezone: 'Asia/Hong_Kong'
  },
  records: [record],
  review: {
    status: 'approved',
    reviewed_at: REVIEWED_AT,
    reviewer: REVIEWER,
    summary: 'Approved exactly one HKJC September 23 Happy Valley fixture meeting identity at Rank C from pinned August 26 artifact evidence; no race times or programme rows are claimed.',
    promotion_target: 'canonical-timetable-v0'
  }
};
writeJson(OUTPUT, output);
console.log(JSON.stringify({ output: OUTPUT, approved_records: 1, meeting_id: MEETING_ID, publication_rank: 'C', timetable_rows: 0 }));
