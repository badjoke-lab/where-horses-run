import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const argv = process.argv.slice(2);
const has = (flag) => argv.includes(flag);
const valueOf = (flag) => {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : null;
};

if (has('--check') && has('--dry-run')) throw new Error('--check and --dry-run are mutually exclusive.');

const outputPath = valueOf('--output') ?? 'data/generated/timetable/local-racing-pilot-review.json';
const readText = (file) => readFileSync(path.join(root, file), 'utf8');
const readJson = (file) => JSON.parse(readText(file));
const digest = (file) => createHash('sha256').update(readText(file)).digest('hex');
const maxDate = (values) => values.filter(Boolean).sort().at(-1) ?? null;

const controlPath = 'data/static/local-racing-pilot-control.json';
const inventoryPath = 'data/static/authority-source-inventory.json';
const readinessPath = 'data/static/calendar-readiness-registry.json';
const publicListPath = 'data/generated/timetable/public/meeting-list.json';
const publicDetailsPath = 'data/generated/timetable/public/meeting-details.json';
const activeCandidatePath = 'data/candidates/japan-nar-candidates.json';
const archivedCandidatePath = 'data/archive/timetable/candidates/japan-nar-candidates.v0.json';

const control = readJson(controlPath);
const inventory = readJson(inventoryPath);
const readiness = readJson(readinessPath);
const publicList = readJson(publicListPath);
const publicDetails = readJson(publicDetailsPath);

if (control.schema_version !== 'local-racing-pilot-control-v1') throw new Error('Unexpected local racing pilot control schema.');

const inventoryMatches = inventory.records.filter((record) =>
  `${record.country_id}/${record.authority_id}/${record.official_source_id}` === control.source_key
);
const readinessMatches = readiness.records.filter((record) => record.authority_source_key === control.source_key);
if (inventoryMatches.length !== 1 || readinessMatches.length !== 1) throw new Error('Local racing canonical source identity must be unique.');

const inventoryRecord = inventoryMatches[0];
const readinessRecord = readinessMatches[0];
const inventoryHost = new URL(inventoryRecord.official_source_url).hostname;
const hostPass = control.allowed_hosts.includes(inventoryHost);
const readinessPass = readinessRecord.readiness === control.expected_readiness;
const rankPass = readinessRecord.technical_rank === control.expected_technical_rank;
const ceilingPass = readinessRecord.public_ceiling === control.expected_public_ceiling;
const implementationPass = readinessRecord.implementation_status === 'not_started';
const fallbackPass = readinessRecord.fallback === 'official_link_only';

const expectedConfirmedFields = {
  meeting_date: true,
  racecourse: true,
  first_race_time: false,
  last_race_time: false,
  per_race_post_times: false,
  race_name: false,
  distance: false,
  surface: false,
  course: false
};
const confirmedFieldsPass = JSON.stringify(readinessRecord.confirmed_fields) === JSON.stringify(expectedConfirmedFields);
const activeCandidateAbsent = !existsSync(path.join(root, activeCandidatePath));
const archivePresent = existsSync(path.join(root, archivedCandidatePath));
const archivedCandidate = archivePresent ? readJson(archivedCandidatePath) : null;
const archivePass = Boolean(
  archivedCandidate?.schema_version === 'timetable-candidates-v0' &&
  archivedCandidate?.source_adapter_id === 'japan-nar-dry-run-adapter' &&
  archivedCandidate?.generated_at === '2026-05-29T00:00:00Z' &&
  archivedCandidate?.review?.review_status === 'needs_review' &&
  archivedCandidate?.records?.length === 12
);

const publicMeetingIds = publicList.meetings
  .filter((record) => record.authority_id === 'nar-local-government-racing')
  .map((record) => record.meeting_id)
  .sort();
const publicDetailIds = publicDetails.details
  .filter((record) => record.authority_id === 'nar-local-government-racing')
  .map((record) => record.meeting_id)
  .sort();
const publicProjectionAbsent = publicMeetingIds.length === 0 && publicDetailIds.length === 0;
const jraIsolationPass =
  control.system_id === 'japan-nar-system' &&
  control.source_key !== 'japan/jra/jra-programme' &&
  readinessRecord.limitations.some((value) => value.includes('must not be flattened'));

const foundationBlockers = [];
if (!hostPass) foundationBlockers.push('official_host_mismatch');
if (!readinessPass) foundationBlockers.push('readiness_not_link_only');
if (!rankPass) foundationBlockers.push('technical_rank_not_c');
if (!ceilingPass) foundationBlockers.push('public_ceiling_not_c');
if (!confirmedFieldsPass) foundationBlockers.push('confirmed_fields_exceed_link_only_scope');
if (!implementationPass) foundationBlockers.push('implementation_status_not_not_started');
if (!fallbackPass) foundationBlockers.push('fallback_not_official_link_only');
if (!activeCandidateAbsent) foundationBlockers.push('active_candidate_must_not_exist');
if (!archivePresent) foundationBlockers.push('legacy_candidate_archive_missing');
else if (!archivePass) foundationBlockers.push('legacy_candidate_archive_invalid');
if (!publicProjectionAbsent) foundationBlockers.push('local_racing_public_projection_must_not_exist');
if (!jraIsolationPass) foundationBlockers.push('jra_capability_isolation_missing');

const registryMinimumDate = maxDate([inventoryRecord.last_checked_date, readinessRecord.checked_date]);
const generatedDate = maxDate([registryMinimumDate, readinessRecord.evidence_reviewed_at]) ?? '1970-01-01';
const activationBlockers = [
  'authority_specific_timetable_not_reviewed',
  'stable_scheduled_time_source_not_confirmed',
  'readiness_change_required_before_candidate'
];

const review = {
  schema_version: 'local-racing-pilot-review-v1',
  work_id: control.work_id,
  generated_at: `${generatedDate}T00:00:00.000Z`,
  mode: control.mode,
  foundation: {
    pass: foundationBlockers.length === 0,
    blockers: foundationBlockers
  },
  activation: {
    ready: false,
    blockers: activationBlockers,
    candidate_generation_allowed: false
  },
  source: {
    source_key: control.source_key,
    system_id: control.system_id,
    official_url: inventoryRecord.official_source_url,
    official_host: inventoryHost,
    host_pass: hostPass,
    inventory_status: inventoryRecord.source_status,
    inventory_checked_date: inventoryRecord.last_checked_date,
    readiness_checked_date: readinessRecord.checked_date,
    registry_minimum_date: registryMinimumDate
  },
  readiness: {
    status: readinessRecord.readiness,
    status_pass: readinessPass,
    technical_rank: readinessRecord.technical_rank,
    technical_rank_pass: rankPass,
    public_ceiling: readinessRecord.public_ceiling,
    public_ceiling_pass: ceilingPass,
    automation_mode: readinessRecord.automation_mode,
    implementation_status: readinessRecord.implementation_status,
    implementation_status_pass: implementationPass,
    fallback: readinessRecord.fallback,
    fallback_pass: fallbackPass,
    confirmed_fields: readinessRecord.confirmed_fields,
    confirmed_fields_pass: confirmedFieldsPass
  },
  repository_state: {
    active_candidate_path: activeCandidatePath,
    active_candidate_absent: activeCandidateAbsent,
    archived_candidate_path: archivedCandidatePath,
    archived_candidate_present: archivePresent,
    archived_candidate_valid: archivePass,
    archived_candidate_record_count: archivedCandidate?.records?.length ?? 0,
    public_meeting_ids: publicMeetingIds,
    public_detail_ids: publicDetailIds,
    public_projection_absent: publicProjectionAbsent,
    jra_isolation_pass: jraIsolationPass
  },
  input_digests: {
    control_sha256: digest(controlPath),
    inventory_sha256: digest(inventoryPath),
    readiness_sha256: digest(readinessPath),
    archived_candidate_sha256: archivePresent ? digest(archivedCandidatePath) : null,
    public_meeting_list_sha256: digest(publicListPath),
    public_meeting_details_sha256: digest(publicDetailsPath)
  },
  boundaries: {
    network_fetch_performed: false,
    normalized_data_created: false,
    candidate_created: false,
    canonical_written: false,
    public_projection_written: false,
    scheduled_operation_active: false
  },
  next_actions: [
    'review_authority_specific_sources',
    'map_venue_and_date_routes_without_flattening_authorities',
    'confirm_stable_scheduled_time_source',
    'submit_readiness_change_before_any_candidate_work'
  ]
};

const serialized = `${JSON.stringify(review, null, 2)}\n`;
if (has('--dry-run')) {
  console.log(JSON.stringify({ foundation: review.foundation, activation: review.activation, repository_state: review.repository_state, next_actions: review.next_actions }, null, 2));
  process.exit(0);
}

const absoluteOutput = path.isAbsolute(outputPath) ? outputPath : path.join(root, outputPath);
if (has('--check')) {
  if (!existsSync(absoluteOutput) || readFileSync(absoluteOutput, 'utf8') !== serialized) throw new Error('Local racing pilot review is stale.');
  console.log(`LOCAL_RACING_PILOT_REVIEW: current foundation_pass=${review.foundation.pass} activation_ready=${review.activation.ready}`);
  process.exit(0);
}

mkdirSync(path.dirname(absoluteOutput), { recursive: true });
writeFileSync(absoluteOutput, serialized);
console.log(`LOCAL_RACING_PILOT_REVIEW: wrote ${outputPath}`);
