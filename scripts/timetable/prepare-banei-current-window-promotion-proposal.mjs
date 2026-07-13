import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAuthoritySourceInventoryV1 } from './load-authority-source-inventory.mjs';
import { loadCalendarReadinessV1 } from './load-calendar-readiness.mjs';
import { promoteApprovedCandidateV1 } from './pipeline-v1/promotion-core.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const argument = (name) => process.argv.find((item) => item.startsWith(`--${name}=`))?.slice(name.length + 3) ?? null;
const requiredArgs = [
  'campaign-result',
  'july-candidate', 'july-report', 'july-coverage', 'july-manifest', 'july-review-queue',
  'august-candidate', 'august-report', 'august-coverage', 'august-manifest', 'august-review-queue',
  'output-dir',
];
const values = Object.fromEntries(requiredArgs.map((name) => [name, argument(name)]));
for (const name of requiredArgs) if (!values[name]) throw new Error(`--${name}=<path> is required`);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function externalPath(value, label) {
  const absolute = path.resolve(value);
  const relative = path.relative(root, absolute);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    throw new Error(`${label} must remain outside the repository`);
  }
  return absolute;
}
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}
function sha256Json(value) {
  return crypto.createHash('sha256').update(`${JSON.stringify(value, null, 2)}\n`).digest('hex');
}
function exact(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}
function validTime(value) {
  return typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}
function validateOfficialUrl(value, allowedHost, label) {
  const url = new URL(value);
  assert(url.protocol === 'https:' && url.hostname.toLowerCase() === allowedHost, `${label} official URL differs`);
}
function cloneApprovedRecord(record, notes) {
  return {
    candidate_id: `approved-${record.meeting_id}`,
    meeting_id: record.meeting_id,
    country_id: record.country_id,
    authority_id: record.authority_id,
    racing_system_id: record.racing_system_id,
    racecourse_id: record.racecourse_id,
    date: record.date,
    timezone: record.timezone,
    capability_rank: record.capability_rank,
    first_race_time_local: record.first_race_time_local,
    last_race_time_local: record.last_race_time_local,
    timetable_rows: structuredClone(record.timetable_rows ?? []),
    source: structuredClone(record.source),
    confidence: record.confidence,
    review_status: 'approved',
    notes,
  };
}

const paths = Object.fromEntries(Object.entries(values).map(([name, value]) => [name, externalPath(value, name)]));
const outputDir = paths['output-dir'];
const review = JSON.parse(fs.readFileSync(path.join(root, 'data/reviews/banei-current-window-promotion-review-v1.json'), 'utf8'));
const activation = JSON.parse(fs.readFileSync(path.join(root, 'data/reviews/banei-current-window-schedule-readiness-activation-v1.json'), 'utf8'));
const resultAudit = JSON.parse(fs.readFileSync(path.join(root, review.source_result_ref), 'utf8'));
const campaignResult = readJson(paths['campaign-result']);
const monthInputs = {
  july: {
    candidate: readJson(paths['july-candidate']),
    report: readJson(paths['july-report']),
    coverage: readJson(paths['july-coverage']),
    manifest: readJson(paths['july-manifest']),
    reviewQueue: readJson(paths['july-review-queue']),
  },
  august: {
    candidate: readJson(paths['august-candidate']),
    report: readJson(paths['august-report']),
    coverage: readJson(paths['august-coverage']),
    manifest: readJson(paths['august-manifest']),
    reviewQueue: readJson(paths['august-review-queue']),
  },
};

assert(review.schema_version === 'calendar-banei-current-window-promotion-review-v1', 'Banei review schema differs');
assert(review.work_id === 'WHR-CAL-JAPAN-BANEI-CURRENT-WINDOW-PROMOTION-REVIEW', 'Banei review Work ID differs');
assert(review.implementation_unit === 'BANEI-CURRENT-WINDOW-PROMOTION-01', 'Banei review implementation unit differs');
assert(review.review?.status === 'approved' && review.review?.promotion_target === 'canonical-timetable-v0', 'Banei review approval differs');
assert(review.review?.approval_scope === 'exact_split_source_candidate_sets', 'Banei review approval scope differs');
assert(Object.values(review.side_effect_boundary ?? {}).every((value) => value === false), 'Banei review side-effect boundary differs');
assert(activation.schema_version === 'calendar-banei-current-window-schedule-readiness-activation-v1', 'Banei readiness activation schema differs');
assert(activation.work_id === review.work_id && activation.implementation_unit === review.implementation_unit, 'Banei readiness activation identity differs');
assert(activation.authority_source_key === 'japan/banei-tokachi/banei-official-schedule', 'Banei readiness activation source key differs');
assert(activation.reviewed_transition?.from_automation_mode === 'link_only' && activation.reviewed_transition?.to_automation_mode === 'semi_automatic', 'Banei readiness transition differs');
assert(activation.evidence?.artifact_id === review.source_artifact.artifact_id, 'Banei readiness activation evidence differs');
assert(Object.values(activation.side_effect_boundary ?? {}).every((value) => value === false), 'Banei readiness activation side-effect boundary differs');
assert(resultAudit.schema_version === 'calendar-banei-current-window-acquisition-result-v1', 'Banei acquisition result schema differs');
assert(resultAudit.evidence?.artifact_id === review.source_artifact.artifact_id, 'Banei source artifact identity differs');

const expectedFileDigests = {
  'campaign-result': review.source_artifact.campaign_result_sha256,
  'july-candidate': review.source_artifact.july.candidate_sha256,
  'july-report': review.source_artifact.july.collection_report_sha256,
  'july-coverage': review.source_artifact.july.coverage_observation_sha256,
  'july-manifest': review.source_artifact.july.result_manifest_sha256,
  'july-review-queue': review.source_artifact.july.review_queue_sha256,
  'august-candidate': review.source_artifact.august.candidate_sha256,
  'august-report': review.source_artifact.august.collection_report_sha256,
  'august-coverage': review.source_artifact.august.coverage_observation_sha256,
  'august-manifest': review.source_artifact.august.result_manifest_sha256,
  'august-review-queue': review.source_artifact.august.review_queue_sha256,
};
for (const [name, expected] of Object.entries(expectedFileDigests)) {
  assert(sha256File(paths[name]) === expected, `${name} SHA-256 differs`);
}

assert(campaignResult.schema_version === 'calendar-banei-current-window-acquisition-result-v1', 'Banei campaign result schema differs');
assert(campaignResult.records_discovered === 13, 'Banei campaign discovered count differs');
assert(exact(campaignResult.rank_counts, { C: 12, B: 0, 'B+': 0, A: 0, 'A+': 1 }), 'Banei campaign rank counts differ');
assert(campaignResult.review_state === 'needs_review' && campaignResult.promotion_eligible === false, 'Banei campaign review boundary differs');
assert(campaignResult.canonical_write === false && campaignResult.public_write === false && campaignResult.publication_effect === 'none', 'Banei campaign write boundary differs');

const allSourceRecords = [];
for (const [month, input] of Object.entries(monthInputs)) {
  const expectedBatch = review.source_artifact[month].batch_id;
  assert(input.candidate.schema_version === 'timetable-candidate-v1', `${month} Candidate schema differs`);
  assert(input.candidate.review?.status === 'needs_review' && input.candidate.review?.promotion_target === null, `${month} Candidate review boundary differs`);
  assert(input.report.batch_id === expectedBatch && input.manifest.batch_id === expectedBatch, `${month} batch identity differs`);
  assert(input.coverage.run_id === expectedBatch, `${month} Coverage run identity differs`);
  assert(input.reviewQueue.entries?.[0]?.review_state === 'review_ready' && input.reviewQueue.entries?.[0]?.promotion_state === 'not_ready', `${month} Review Queue differs`);
  assert(input.report.publication_effect === 'none', `${month} publication effect differs`);
  assert(input.candidate.records.length === input.manifest.records_discovered, `${month} Candidate/Manifest count differs`);
  assert(input.candidate.records.length === input.coverage.records_discovered, `${month} Candidate/Coverage count differs`);
  allSourceRecords.push(...input.candidate.records);
}

const sourceByMeeting = new Map(allSourceRecords.map((record) => [record.meeting_id, record]));
assert(sourceByMeeting.size === 13 && allSourceRecords.length === 13, 'Banei source meeting set contains duplicates or missing records');
const approvedCSet = review.approved_sets.find((set) => set.capability_rank === 'C');
const approvedAPlusSet = review.approved_sets.find((set) => set.capability_rank === 'A+');
assert(approvedCSet?.source_id === 'banei-official-schedule' && approvedCSet.meeting_count === 12, 'Banei approved C set differs');
assert(approvedAPlusSet?.source_id === 'nar-banei-race-list-deba-table' && approvedAPlusSet.meeting_count === 1, 'Banei approved A+ set differs');
assert(exact([...approvedCSet.meeting_ids].sort(), [...resultAudit.lower_rank_meeting_ids].sort()), 'Banei approved C IDs differ from acquisition result');
assert(exact([...approvedAPlusSet.meeting_ids].sort(), [...resultAudit.a_plus_meeting_ids].sort()), 'Banei approved A+ IDs differ from acquisition result');
assert(new Set([...approvedCSet.meeting_ids, ...approvedAPlusSet.meeting_ids]).size === 13, 'Banei approved source sets do not close to 13 meetings');

const cRecords = approvedCSet.meeting_ids.map((meetingId) => {
  const record = sourceByMeeting.get(meetingId);
  assert(record, `Banei approved C source record missing ${meetingId}`);
  assert(record.capability_rank === 'C', `${meetingId} approved C rank differs`);
  assert(record.source?.source_id === 'banei-official-schedule', `${meetingId} approved C source differs`);
  validateOfficialUrl(record.source.official_url, 'www.banei-keiba.or.jp', meetingId);
  assert(record.first_race_time_local === null && record.last_race_time_local === null, `${meetingId} C record invents race times`);
  assert(Array.isArray(record.timetable_rows) && record.timetable_rows.length === 0, `${meetingId} C record invents timetable rows`);
  assert(record.review_status === 'needs_review', `${meetingId} source review state differs`);
  return cloneApprovedRecord(record, 'Approved official Banei monthly-schedule meeting identity. Detail was not complete at observation time; no race times or programme rows are claimed.');
}).sort((left, right) => left.date.localeCompare(right.date));

const aPlusSource = sourceByMeeting.get(approvedAPlusSet.meeting_ids[0]);
assert(aPlusSource, 'Banei approved A+ source record missing');
assert(aPlusSource.capability_rank === 'A+', 'Banei approved A+ rank differs');
assert(aPlusSource.source?.source_id === 'nar-banei-race-list-deba-table', 'Banei approved A+ source differs');
validateOfficialUrl(aPlusSource.source.official_url, 'www.keiba.go.jp', aPlusSource.meeting_id);
assert(aPlusSource.first_race_time_local === '14:20' && aPlusSource.last_race_time_local === '20:35', 'Banei approved A+ time boundary differs');
assert(Array.isArray(aPlusSource.timetable_rows) && aPlusSource.timetable_rows.length === 12, 'Banei approved A+ row count differs');
for (const [index, row] of aPlusSource.timetable_rows.entries()) {
  const raceNumber = index + 1;
  assert(row.label === `Race ${raceNumber}`, `Banei A+ Race ${raceNumber} label differs`);
  assert(validTime(row.post_time_local), `Banei A+ Race ${raceNumber} post time differs`);
  assert(typeof row.race_name === 'string' && row.race_name.trim(), `Banei A+ Race ${raceNumber} race name differs`);
  assert(Number.isInteger(row.distance_m) && row.distance_m > 0, `Banei A+ Race ${raceNumber} distance differs`);
  assert(typeof row.surface === 'string' && row.surface.trim(), `Banei A+ Race ${raceNumber} surface differs`);
  assert(typeof row.course_label === 'string' && row.course_label.trim(), `Banei A+ Race ${raceNumber} course label differs`);
}
const aPlusRecords = [cloneApprovedRecord(aPlusSource, 'Approved complete public-safe Banei A+ programme from official NAR Banei RaceList and DebaTable evidence. Participant, betting, result, payout, prediction, raw-source, and stream fields are excluded.')];

const commonWindow = { start_date: '2026-07-13', end_date_exclusive: '2026-08-12', timezone: 'Asia/Tokyo' };
const approvedC = {
  schema_version: 'timetable-candidate-v1',
  generated_at: monthInputs.august.candidate.generated_at,
  adapter_id: 'banei-current-window-reviewed-schedule-promotion-v1',
  country_id: 'japan',
  authority_id: 'banei-tokachi',
  source_id: 'banei-official-schedule',
  candidate_window: structuredClone(commonWindow),
  records: cRecords,
  review: {
    status: 'approved',
    reviewed_at: review.review.reviewed_at,
    reviewer: review.review.reviewer,
    summary: 'Approved exactly 12 official Banei Rank C schedule identities from the pinned July/August current-window artifact.',
    promotion_target: review.review.promotion_target,
  },
};
const approvedAPlus = {
  schema_version: 'timetable-candidate-v1',
  generated_at: monthInputs.july.candidate.generated_at,
  adapter_id: 'banei-current-window-reviewed-detail-promotion-v1',
  country_id: 'japan',
  authority_id: 'banei-tokachi',
  source_id: 'nar-banei-race-list-deba-table',
  candidate_window: structuredClone(commonWindow),
  records: aPlusRecords,
  review: {
    status: 'approved',
    reviewed_at: review.review.reviewed_at,
    reviewer: review.review.reviewer,
    summary: 'Approved exactly one complete public-safe Banei A+ detail record from the pinned current-window artifact.',
    promotion_target: review.review.promotion_target,
  },
};

const canonicalMeetings = JSON.parse(fs.readFileSync(path.join(root, 'data/generated/timetable/canonical/meetings.json'), 'utf8'));
const canonicalDetails = JSON.parse(fs.readFileSync(path.join(root, 'data/generated/timetable/canonical/meeting-details.json'), 'utf8'));
const existingWindowBanei = canonicalMeetings.meetings.filter((meeting) => meeting.authority_id === 'banei-tokachi' && meeting.date >= commonWindow.start_date && meeting.date < commonWindow.end_date_exclusive);
assert(existingWindowBanei.length === 0, `Banei promotion baseline differs: expected 0 current-window meetings, got ${existingWindowBanei.length}`);
const inventory = loadAuthoritySourceInventoryV1(root);
const readiness = loadCalendarReadinessV1(root);
const proposalReadiness = structuredClone(readiness);
const scheduleReadiness = proposalReadiness.records.find((record) => record.authority_source_key === activation.authority_source_key);
assert(scheduleReadiness, 'Banei schedule Calendar Readiness record is missing');
assert(scheduleReadiness.system_id === activation.system_id, 'Banei schedule readiness system differs');
assert(scheduleReadiness.automation_mode === activation.reviewed_transition.from_automation_mode, 'Banei schedule readiness pre-transition mode differs');
assert(activation.reviewed_transition.required_readiness.includes(scheduleReadiness.readiness), 'Banei schedule readiness state is not eligible for activation');
assert(activation.reviewed_transition.required_source_status.includes(scheduleReadiness.source_status), 'Banei schedule source status is not eligible for activation');
assert(scheduleReadiness.confirmed_fields?.meeting_date === true && scheduleReadiness.confirmed_fields?.racecourse === true, 'Banei schedule source does not confirm C identity fields');
const readinessBefore = structuredClone(scheduleReadiness);
scheduleReadiness.automation_mode = activation.reviewed_transition.to_automation_mode;
scheduleReadiness.refresh_classes = [...new Set([...(scheduleReadiness.refresh_classes ?? []), ...activation.reviewed_transition.refresh_classes_add])];
scheduleReadiness.implementation_status = activation.reviewed_transition.implementation_status;
scheduleReadiness.checked_date = activation.reviewed_transition.checked_date;
scheduleReadiness.evidence_reviewed_at = activation.reviewed_transition.evidence_reviewed_at;
scheduleReadiness.blocked_reason = null;
scheduleReadiness.notes = `${scheduleReadiness.notes ?? ''} Reviewed current-window activation: official July/August 2026 monthly schedule collection produced 13 public-safe meeting identities in workflow 29275669482; Canonical promotion remains review-gated.`.trim();
const readinessActivationProposal = {
  schema_version: 'calendar-banei-current-window-readiness-activation-proposal-v1',
  work_id: review.work_id,
  implementation_unit: review.implementation_unit,
  source_review_ref: 'data/reviews/banei-current-window-schedule-readiness-activation-v1.json',
  authority_source_key: activation.authority_source_key,
  before: readinessBefore,
  after: structuredClone(scheduleReadiness),
  evidence: structuredClone(activation.evidence),
  registry_write: false,
  human_merge_required: true,
};

const cPromotion = promoteApprovedCandidateV1({
  candidate: approvedC,
  meetingsDataset: canonicalMeetings,
  detailsDataset: canonicalDetails,
  authorityInventory: inventory,
  readinessRegistry: proposalReadiness,
  inputPath: 'data/candidates/banei-current-window-c-schedule-approved.json',
});
const aPlusPromotion = promoteApprovedCandidateV1({
  candidate: approvedAPlus,
  meetingsDataset: cPromotion.meetingsDataset,
  detailsDataset: cPromotion.detailsDataset,
  authorityInventory: inventory,
  readinessRegistry: proposalReadiness,
  inputPath: 'data/candidates/banei-current-window-a-plus-approved.json',
});
assert(cPromotion.summary.promoted_meeting_ids.length === 12 && cPromotion.summary.promoted_detail_ids.length === 0, 'Banei C promotion summary differs');
assert(aPlusPromotion.summary.promoted_meeting_ids.length === 1 && aPlusPromotion.summary.promoted_detail_ids.length === 1, 'Banei A+ promotion summary differs');
const promotedMeetingIds = [...cPromotion.summary.promoted_meeting_ids, ...aPlusPromotion.summary.promoted_meeting_ids].sort();
assert(exact(promotedMeetingIds, [...sourceByMeeting.keys()].sort()), 'Banei combined promotion meeting set differs');

const combinedSummary = {
  schema_version: 'calendar-banei-current-window-promotion-summary-v1',
  promoted_meeting_ids: promotedMeetingIds,
  promoted_detail_ids: structuredClone(aPlusPromotion.summary.promoted_detail_ids),
  c_schedule_meeting_count: 12,
  a_plus_meeting_count: 1,
  a_plus_race_row_count: 12,
  retained_retry_target_count: 12,
  c_source_id: approvedC.source_id,
  a_plus_source_id: approvedAPlus.source_id,
  sequential_promotion_order: ['C_schedule_set', 'A_plus_detail_set'],
  readiness_activation_source_key: activation.authority_source_key,
};
const proposal = {
  schema_version: 'calendar-banei-current-window-promotion-proposal-v1',
  work_id: review.work_id,
  implementation_unit: review.implementation_unit,
  source_artifact: structuredClone(review.source_artifact),
  readiness_activation_ref: 'data/reviews/banei-current-window-schedule-readiness-activation-v1.json',
  readiness_activation_sha256: sha256Json(readinessActivationProposal),
  approved_c_candidate_sha256: sha256Json(approvedC),
  approved_a_plus_candidate_sha256: sha256Json(approvedAPlus),
  proposed_meetings_sha256: sha256Json(aPlusPromotion.meetingsDataset),
  proposed_details_sha256: sha256Json(aPlusPromotion.detailsDataset),
  promoted_meeting_count: promotedMeetingIds.length,
  promoted_detail_count: aPlusPromotion.summary.promoted_detail_ids.length,
  promoted_race_row_count: aPlusRecords[0].timetable_rows.length,
  retained_c_retry_target_count: cRecords.length,
  promoted_meeting_ids: promotedMeetingIds,
  promoted_detail_ids: structuredClone(aPlusPromotion.summary.promoted_detail_ids),
  reviewer: review.review.reviewer,
  reviewed_at: review.review.reviewed_at,
  mutation_boundary: {
    repository_write: false,
    readiness_registry_write: false,
    canonical_write: false,
    public_write: false,
    publication_effect: 'none',
    human_merge_required: true,
  },
};

fs.mkdirSync(outputDir, { recursive: true });
for (const [name, value] of Object.entries({
  'approved-c-schedule-candidate.json': approvedC,
  'approved-a-plus-detail-candidate.json': approvedAPlus,
  'reviewed-readiness-activation.json': readinessActivationProposal,
  'proposed-canonical-meetings.json': aPlusPromotion.meetingsDataset,
  'proposed-canonical-meeting-details.json': aPlusPromotion.detailsDataset,
  'promotion-summary.json': combinedSummary,
  'promotion-proposal.json': proposal,
})) {
  fs.writeFileSync(path.join(outputDir, name), `${JSON.stringify(value, null, 2)}\n`);
}
console.log(JSON.stringify({
  schema_version: 'calendar-banei-current-window-promotion-proposal-summary-v1',
  promoted_meeting_count: proposal.promoted_meeting_count,
  promoted_detail_count: proposal.promoted_detail_count,
  promoted_race_row_count: proposal.promoted_race_row_count,
  retained_c_retry_target_count: proposal.retained_c_retry_target_count,
  readiness_activation_sha256: proposal.readiness_activation_sha256,
  approved_c_candidate_sha256: proposal.approved_c_candidate_sha256,
  approved_a_plus_candidate_sha256: proposal.approved_a_plus_candidate_sha256,
  proposed_meetings_sha256: proposal.proposed_meetings_sha256,
  proposed_details_sha256: proposal.proposed_details_sha256,
  readiness_registry_write: false,
  canonical_write: false,
  public_write: false,
  human_merge_required: true,
}, null, 2));
