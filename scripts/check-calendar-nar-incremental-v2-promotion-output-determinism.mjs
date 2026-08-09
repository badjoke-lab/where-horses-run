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
const augustRecoveryPaths = [
  augustJraRecoveryPath,
  augustNarRecoveryPath,
  augustBaneiRecoveryPath,
  augustHkjcRecoveryPath,
];
const orderedCandidatePaths = [...historicalCandidatePaths, ...augustRecoveryPaths];
const availableCandidatePaths = orderedCandidatePaths.filter((inputPath) => fs.existsSync(path.join(root, inputPath)));
for (const requiredPath of orderedCandidatePaths) {
  if (!availableCandidatePaths.includes(requiredPath)) throw new Error(`required approved Candidate is missing: ${requiredPath}`);
}

const baseInputSources = new Set(meetingsDataset.input_sources ?? []);
for (const historicalPath of historicalCandidatePaths) {
  if (!baseInputSources.has(historicalPath)) throw new Error(`historical Candidate is not present in the PR base: ${historicalPath}`);
}

// The August recovery candidates were the continuation under test while PR #567
// was open. After #567 merged, later PR bases legitimately contain those inputs.
// Replay only candidates that are absent from the PR base; never reapply already
// promoted inputs. If a base contains a later August input while an earlier one is
// missing, fail rather than accepting a non-prefix promotion history.
const firstMissingAugustIndex = augustRecoveryPaths.findIndex((inputPath) => !baseInputSources.has(inputPath));
if (firstMissingAugustIndex >= 0) {
  const presentAfterGap = augustRecoveryPaths
    .slice(firstMissingAugustIndex + 1)
    .filter((inputPath) => baseInputSources.has(inputPath));
  if (presentAfterGap.length > 0) {
    throw new Error(`August recovery base history is non-prefix: ${JSON.stringify(presentAfterGap)}`);
  }
}

const expectedPendingAugustPaths = firstMissingAugustIndex < 0
  ? []
  : augustRecoveryPaths.slice(firstMissingAugustIndex);
const inputPaths = orderedCandidatePaths.filter((inputPath) => !baseInputSources.has(inputPath));
if (!exact(inputPaths, expectedPendingAugustPaths)) {
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
if (!exact(meetingsDataset, committedMeetings)) throw new Error('cumulative reviewed promotion output differs from committed canonical meetings');
if (!exact(detailsDataset, committedDetails)) throw new Error('cumulative reviewed promotion output differs from committed canonical details');

const expectedCounts = new Map([
  [augustJraRecoveryPath, [18, 0]],
  [augustNarRecoveryPath, [69, 0]],
  [augustBaneiRecoveryPath, [8, 0]],
  [augustHkjcRecoveryPath, [1, 0]],
]);
for (const inputPath of inputPaths) {
  const [expectedMeetings, expectedDetails] = expectedCounts.get(inputPath) ?? [];
  const entry = applied.find((item) => item.input_path === inputPath);
  if (entry?.promoted_meetings !== expectedMeetings || entry?.promoted_details !== expectedDetails) {
    throw new Error(`${inputPath} promotion count differs`);
  }
}
for (const inputPath of augustRecoveryPaths.filter((candidatePath) => baseInputSources.has(candidatePath))) {
  if (!expectedCounts.has(inputPath)) throw new Error(`unexpected August recovery Candidate in PR base: ${inputPath}`);
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
console.log(`AUGUST_BASE_CANDIDATES: ${JSON.stringify(augustRecoveryPaths.filter((inputPath) => baseInputSources.has(inputPath)))}`);
console.log(`APPLIED_CANDIDATES: ${JSON.stringify(applied)}`);
