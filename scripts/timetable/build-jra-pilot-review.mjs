import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const argv = process.argv.slice(2);
const has = (name) => argv.includes(name);
const valueOf = (name) => {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : null;
};
if (has('--check') && has('--dry-run')) throw new Error('--check and --dry-run are mutually exclusive.');

const outputPath = valueOf('--output') ?? 'data/generated/timetable/jra-pilot-review.json';
const readText = (file) => readFileSync(path.join(root, file), 'utf8');
const readJson = (file) => JSON.parse(readText(file));
const sha256 = (file) => createHash('sha256').update(readText(file)).digest('hex');
const maxDate = (values) => values.filter(Boolean).sort().at(-1) ?? null;

const control = readJson('data/static/jra-pilot-control.json');
const inventory = readJson('data/static/authority-source-inventory.json');
const readiness = readJson('data/static/calendar-readiness-registry.json');
const meetings = readJson('data/generated/timetable/jra-normalized-timetable.json');
const details = readJson('data/generated/timetable/jra-normalized-meeting-details.json');
const candidate = readJson('data/candidates/japan-jra-candidates.json');
const publicList = readJson('data/generated/timetable/public/meeting-list.json');
const publicDetails = readJson('data/generated/timetable/public/meeting-details.json');

if (control.schema_version !== 'jra-pilot-control-v1') throw new Error('Unexpected JRA pilot control schema.');
const inventoryRecord = inventory.records.find((record) =>
  record.country_id === 'japan' && record.authority_id === 'jra' && record.official_source_id === 'jra-programme'
);
const readinessMatches = readiness.records.filter((record) => record.authority_source_key === control.source_key);
if (!inventoryRecord || readinessMatches.length !== 1) throw new Error('JRA canonical source identity is not unique.');
const readinessRecord = readinessMatches[0];

const meetingIds = meetings.records.map((record) => record.meeting_id).sort();
const detailIds = details.details.map((record) => record.meeting_id).sort();
const candidateIds = candidate.records.map((record) => record.meeting_id).sort();
const sourceCheckedDate = maxDate(candidate.records.map((record) => record.source.checked_at.slice(0, 10)));
const registryMinimumDate = maxDate([inventoryRecord.last_checked_date, readinessRecord.checked_date]);
const freshnessPass = Boolean(sourceCheckedDate && registryMinimumDate && sourceCheckedDate >= registryMinimumDate);
const inventoryHost = new URL(inventoryRecord.official_source_url).hostname;
const candidateHosts = [...new Set(candidate.records.map((record) => new URL(record.source.official_url).hostname))].sort();
const hostPass = candidateHosts.every((host) => control.allowed_hosts.includes(host)) && candidateHosts.includes(inventoryHost);
const parityPass = JSON.stringify(meetingIds) === JSON.stringify(detailIds) && JSON.stringify(meetingIds) === JSON.stringify(candidateIds);
const scopePass = candidate.records.every((record) =>
  record.racing_system_id === control.system_id &&
  (readinessRecord.racecourse_ids.length === 0 || readinessRecord.racecourse_ids.includes(record.racecourse_id))
);
const rankPass = candidate.records.every((record) => record.capability_rank === readinessRecord.technical_rank);
const fieldPairs = [
  ['race_name', 'race_name'],
  ['distance_m', 'distance'],
  ['surface', 'surface'],
  ['course_label', 'course']
];
const confirmedFieldsPass = candidate.records.every((record) => record.timetable_rows.every((row) =>
  fieldPairs.every(([field, readinessField]) => readinessRecord.confirmed_fields[readinessField] === true || row[field] === null)
));
const needsReviewPass = candidate.review.status === 'needs_review' && candidate.records.every((record) => record.review_status === 'needs_review');

const blockers = [];
if (!freshnessPass) blockers.push('source_fixture_predates_registry');
if (!hostPass) blockers.push('official_host_mismatch');
if (!parityPass) blockers.push('meeting_detail_candidate_id_mismatch');
if (!scopePass) blockers.push('racecourse_or_system_scope_mismatch');
if (!rankPass) blockers.push('technical_rank_mismatch');
if (!confirmedFieldsPass) blockers.push('unconfirmed_optional_field_present');
if (!needsReviewPass) blockers.push('candidate_review_state_invalid');

const review = {
  schema_version: 'jra-pilot-review-v1',
  work_id: 'WHR-CAL-JAPAN-JRA',
  generated_at: candidate.generated_at,
  mode: control.mode,
  boundaries: {
    network_fetch_performed: false,
    source_body_stored: false,
    candidate_modified: false,
    candidate_approved: false,
    canonical_written: false,
    public_projection_written: false,
    scheduled_operation_active: false
  },
  input_digests: {
    control_sha256: sha256('data/static/jra-pilot-control.json'),
    inventory_sha256: sha256('data/static/authority-source-inventory.json'),
    readiness_sha256: sha256('data/static/calendar-readiness-registry.json'),
    normalized_meetings_sha256: sha256('data/generated/timetable/jra-normalized-timetable.json'),
    normalized_details_sha256: sha256('data/generated/timetable/jra-normalized-meeting-details.json'),
    candidate_sha256: sha256('data/candidates/japan-jra-candidates.json'),
    public_meeting_list_sha256: sha256('data/generated/timetable/public/meeting-list.json'),
    public_meeting_details_sha256: sha256('data/generated/timetable/public/meeting-details.json')
  },
  source: {
    source_key: control.source_key,
    system_id: control.system_id,
    inventory_host: inventoryHost,
    candidate_hosts: candidateHosts,
    inventory_checked_date: inventoryRecord.last_checked_date,
    readiness_checked_date: readinessRecord.checked_date,
    registry_minimum_date: registryMinimumDate,
    candidate_source_checked_date: sourceCheckedDate,
    freshness_pass: freshnessPass,
    official_host_pass: hostPass
  },
  normalized: {
    meeting_count: meetingIds.length,
    detail_count: detailIds.length,
    candidate_count: candidateIds.length,
    meeting_ids: meetingIds,
    parity_pass: parityPass,
    racecourse_scope_pass: scopePass,
    technical_rank_pass: rankPass,
    confirmed_fields_pass: confirmedFieldsPass
  },
  candidate: {
    path: 'data/candidates/japan-jra-candidates.json',
    adapter_id: candidate.adapter_id,
    review_status: candidate.review.status,
    needs_review_pass: needsReviewPass,
    promotion_ready: blockers.length === 0,
    blockers
  },
  public_projection: {
    meeting_count: publicList.meetings.length,
    detail_count: publicDetails.details.length,
    generated_at: publicList.generated_at,
    changed_by_review: false
  },
  next_actions: blockers.length
    ? ['obtain_fresh_reviewed_jra_fixture', 'regenerate_normalized_jra_data', 'regenerate_candidate_v1', 'repeat_human_review']
    : ['assign_human_reviewer', 'review_candidate_v1', 'run_canonical_promotion_dry_run']
};

const serialized = `${JSON.stringify(review, null, 2)}\n`;
if (has('--dry-run')) {
  console.log(JSON.stringify({ source: review.source, candidate: review.candidate, next_actions: review.next_actions }, null, 2));
  process.exit(0);
}
const absoluteOutput = path.isAbsolute(outputPath) ? outputPath : path.join(root, outputPath);
if (has('--check')) {
  if (!existsSync(absoluteOutput) || readFileSync(absoluteOutput, 'utf8') !== serialized) throw new Error('JRA pilot review is stale.');
  console.log(`JRA_PILOT_REVIEW: current promotion_ready=${review.candidate.promotion_ready}`);
  process.exit(0);
}
mkdirSync(path.dirname(absoluteOutput), { recursive: true });
writeFileSync(absoluteOutput, serialized);
console.log(`JRA_PILOT_REVIEW: wrote ${outputPath} blockers=${blockers.length}`);
