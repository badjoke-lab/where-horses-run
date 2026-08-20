import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { promoteApprovedCandidateV1 } from './timetable/pipeline-v1/promotion-core.mjs';
import { loadAuthoritySourceInventoryV1 } from './timetable/load-authority-source-inventory.mjs';
import { loadCalendarReadinessV1 } from './timetable/load-calendar-readiness.mjs';

const root = process.cwd();
const baseSha = process.env.BASE_SHA;
if (!baseSha || !/^[0-9a-f]{40}$/.test(baseSha)) throw new Error('BASE_SHA must be a full commit SHA.');

const meetingsPath = 'data/generated/timetable/canonical/meetings.json';
const detailsPath = 'data/generated/timetable/canonical/meeting-details.json';
const historicalCPath = 'data/candidates/nar-incremental-v2-july-remainder-c-approved.json';
const historicalAPlusPath = 'data/candidates/nar-incremental-v2-july-remainder-a-plus-approved.json';
const currentWindowAPlusPath = 'data/candidates/nar-current-window-a-plus-approved.json';
const julyNarRecoveryPath = 'data/candidates/nar-august-2026-horizon-recovery-c-approved.json';
const julyJraRecoveryPath = 'data/candidates/jra-horizon-recovery-2026-08-01-through-2026-08-16-approved.json';
const julyBaneiRecoveryPath = 'data/candidates/banei-horizon-recovery-2026-08-15-through-2026-08-17-approved.json';
const augustJraRecoveryPath = 'data/candidates/jra-horizon-recovery-2026-08-18-through-2026-09-06-approved.json';
const augustNarRecoveryPath = 'data/candidates/nar-horizon-recovery-2026-08-18-through-2026-09-06-approved.json';
const augustBaneiRecoveryPath = 'data/candidates/banei-horizon-recovery-2026-08-18-through-2026-09-06-approved.json';
const augustHkjcRecoveryPath = 'data/candidates/hkjc-horizon-recovery-2026-09-06-approved.json';
const septemberNarRecoveryPath = 'data/candidates/nar-horizon-recovery-2026-09-15-approved.json';
const septemberNarExtensionPath = 'data/candidates/nar-horizon-extension-2026-09-17-approved.json';

const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readBaseJson = (relativePath) => JSON.parse(execFileSync('git', ['show', `${baseSha}:${relativePath}`], { cwd: root, encoding: 'utf8' }));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const authorityInventory = loadAuthoritySourceInventoryV1(root);
const readinessRegistry = loadCalendarReadinessV1(root);
let meetingsDataset = readBaseJson(meetingsPath);
let detailsDataset = readBaseJson(detailsPath);

const historicalCandidatePaths = [
  historicalCPath,
  historicalAPlusPath,
  currentWindowAPlusPath,
  julyNarRecoveryPath,
  julyJraRecoveryPath,
  julyBaneiRecoveryPath,
];
const recoveryContinuationPaths = [
  augustJraRecoveryPath,
  augustNarRecoveryPath,
  augustBaneiRecoveryPath,
  augustHkjcRecoveryPath,
  septemberNarRecoveryPath,
  septemberNarExtensionPath,
];
const orderedCandidatePaths = [...historicalCandidatePaths, ...recoveryContinuationPaths];
const availableCandidatePaths = orderedCandidatePaths.filter((inputPath) => fs.existsSync(path.join(root, inputPath)));
for (const requiredPath of orderedCandidatePaths) {
  if (!availableCandidatePaths.includes(requiredPath)) throw new Error(`required approved Candidate is missing: ${requiredPath}`);
}

const baseInputSources = new Set(meetingsDataset.input_sources ?? []);
for (const historicalPath of historicalCandidatePaths) {
  if (!baseInputSources.has(historicalPath)) throw new Error(`historical Candidate is not present in the PR base: ${historicalPath}`);
}

// Recovery candidates form an ordered, append-only reviewed continuation.
// Later PR bases may already contain an initial prefix of this sequence. Replay
// only the missing suffix and fail closed if the base contains a later reviewed
// input while an earlier continuation input is missing.
const firstMissingRecoveryIndex = recoveryContinuationPaths.findIndex((inputPath) => !baseInputSources.has(inputPath));
if (firstMissingRecoveryIndex >= 0) {
  const presentAfterGap = recoveryContinuationPaths
    .slice(firstMissingRecoveryIndex + 1)
    .filter((inputPath) => baseInputSources.has(inputPath));
  if (presentAfterGap.length > 0) {
    throw new Error(`recovery continuation base history is non-prefix: ${JSON.stringify(presentAfterGap)}`);
  }
}

const expectedPendingRecoveryPaths = firstMissingRecoveryIndex < 0
  ? []
  : recoveryContinuationPaths.slice(firstMissingRecoveryIndex);
const inputPaths = orderedCandidatePaths.filter((inputPath) => !baseInputSources.has(inputPath));
if (!exact(inputPaths, expectedPendingRecoveryPaths)) {
  throw new Error(`unexpected promotion continuation order: ${JSON.stringify(inputPaths)}`);
}

const applied = [];
for (const inputPath of inputPaths) {
  const candidate = readJson(inputPath);
  if (candidate.review?.status !== 'approved' || candidate.review?.promotion_target !== 'canonical-timetable-v0') {
    throw new Error(`${inputPath} is not approved for canonical promotion`);
  }
  const result = promoteApprovedCandidateV1({
    candidate,
    meetingsDataset,
    detailsDataset,
    authorityInventory,
    readinessRegistry,
    inputPath,
  });
  meetingsDataset = result.meetingsDataset;
  detailsDataset = result.detailsDataset;
  applied.push({
    input_path: inputPath,
    promoted_meetings: result.summary.promoted_meeting_ids.length,
    promoted_details: result.summary.promoted_detail_ids.length,
  });
}

const committedMeetings = readJson(meetingsPath);
const committedDetails = readJson(detailsPath);
if (committedMeetings.schema_version !== meetingsDataset.schema_version) throw new Error('canonical meeting schema differs from cumulative reviewed promotion output');
if (committedDetails.schema_version !== detailsDataset.schema_version) throw new Error('canonical detail schema differs from cumulative reviewed promotion output');

const committedMeetingById = new Map(committedMeetings.meetings.map((meeting) => [meeting.meeting_id, meeting]));
const expectedMeetingIds = new Set(meetingsDataset.meetings.map((meeting) => meeting.meeting_id));
for (const expectedMeeting of meetingsDataset.meetings) {
  if (!exact(committedMeetingById.get(expectedMeeting.meeting_id), expectedMeeting)) {
    throw new Error(`cumulative reviewed promotion meeting differs from committed canonical row: ${expectedMeeting.meeting_id}`);
  }
}
const committedDetailById = new Map(committedDetails.details.map((detail) => [detail.meeting_id, detail]));
const expectedDetailIds = new Set(detailsDataset.details.map((detail) => detail.meeting_id));
for (const expectedDetail of detailsDataset.details) {
  if (!exact(committedDetailById.get(expectedDetail.meeting_id), expectedDetail)) {
    throw new Error(`cumulative reviewed promotion detail differs from committed canonical row: ${expectedDetail.meeting_id}`);
  }
}

const expectedInputSources = meetingsDataset.input_sources ?? [];
const expectedInputSourceSet = new Set(expectedInputSources);
const committedExpectedInputSources = (committedMeetings.input_sources ?? []).filter((inputPath) => expectedInputSourceSet.has(inputPath));
if (!exact(committedExpectedInputSources, expectedInputSources)) {
  throw new Error('cumulative reviewed promotion input-source order differs from committed canonical meetings');
}

const scopedAuthorityIds = new Set(
  orderedCandidatePaths.flatMap((inputPath) => (readJson(inputPath).records ?? []).map((record) => record.authority_id)).filter(Boolean),
);
const unrelatedMeetingAdditions = committedMeetings.meetings.filter((meeting) => !expectedMeetingIds.has(meeting.meeting_id));
for (const meeting of unrelatedMeetingAdditions) {
  if (scopedAuthorityIds.has(meeting.authority_id)) {
    throw new Error(`unreviewed in-scope canonical meeting addition bypasses cumulative promotion replay: ${meeting.meeting_id}`);
  }
}
const unrelatedDetailAdditions = committedDetails.details.filter((detail) => !expectedDetailIds.has(detail.meeting_id));
for (const detail of unrelatedDetailAdditions) {
  const meeting = committedMeetingById.get(detail.meeting_id);
  if (!meeting) throw new Error(`canonical detail has no committed meeting: ${detail.meeting_id}`);
  if (scopedAuthorityIds.has(meeting.authority_id)) {
    throw new Error(`unreviewed in-scope canonical detail addition bypasses cumulative promotion replay: ${detail.meeting_id}`);
  }
}

const expectedCounts = new Map([
  [augustJraRecoveryPath, [18, 0]],
  [augustNarRecoveryPath, [69, 0]],
  [augustBaneiRecoveryPath, [8, 0]],
  [augustHkjcRecoveryPath, [1, 0]],
  [septemberNarRecoveryPath, [32, 0]],
  [septemberNarExtensionPath, [8, 0]],
]);
for (const inputPath of inputPaths) {
  const [expectedMeetings, expectedDetails] = expectedCounts.get(inputPath) ?? [];
  const entry = applied.find((item) => item.input_path === inputPath);
  if (entry?.promoted_meetings !== expectedMeetings || entry?.promoted_details !== expectedDetails) {
    throw new Error(`${inputPath} promotion count differs`);
  }
}
for (const inputPath of recoveryContinuationPaths.filter((candidatePath) => baseInputSources.has(candidatePath))) {
  if (!expectedCounts.has(inputPath)) throw new Error(`unexpected recovery Candidate in PR base: ${inputPath}`);
}

const currentWindowCandidate = readJson(currentWindowAPlusPath);
const baseMeetings = readBaseJson(meetingsPath);
const baseDetails = readBaseJson(detailsPath);
const baseMeetingById = new Map(baseMeetings.meetings.map((meeting) => [meeting.meeting_id, meeting]));
const baseDetailById = new Map(baseDetails.details.map((detail) => [detail.meeting_id, detail]));
if (currentWindowCandidate.records.length !== 15 || !baseInputSources.has(currentWindowAPlusPath)) {
  throw new Error('current-window NAR A+ promotion is not present in the PR base');
}
for (const record of currentWindowCandidate.records) {
  if (baseMeetingById.get(record.meeting_id)?.capability_rank !== 'A+' || baseDetailById.get(record.meeting_id)?.capability_rank !== 'A+') {
    throw new Error(`current-window NAR A+ base state differs: ${record.meeting_id}`);
  }
}

console.log('CALENDAR_NAR_INCREMENTAL_V2_PROMOTION_OUTPUT_DETERMINISM: pass');
console.log(`BASE_MEETINGS: ${baseMeetings.meetings.length}`);
console.log(`HEAD_MEETINGS: ${committedMeetings.meetings.length}`);
console.log(`BASE_DETAILS: ${baseDetails.details.length}`);
console.log(`HEAD_DETAILS: ${committedDetails.details.length}`);
console.log(`BASE_INPUT_SOURCE_COUNT: ${baseInputSources.size}`);
console.log(`HISTORICAL_BASE_CANDIDATES: ${JSON.stringify(historicalCandidatePaths)}`);
console.log(`RECOVERY_BASE_CANDIDATES: ${JSON.stringify(recoveryContinuationPaths.filter((inputPath) => baseInputSources.has(inputPath)))}`);
console.log(`APPLIED_CANDIDATES: ${JSON.stringify(applied)}`);
console.log(`UNRELATED_MEETING_ADDITIONS: ${unrelatedMeetingAdditions.length}`);
console.log(`UNRELATED_DETAIL_ADDITIONS: ${unrelatedDetailAdditions.length}`);
