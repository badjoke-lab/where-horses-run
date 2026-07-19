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
const narRecoveryPath = 'data/candidates/nar-august-2026-horizon-recovery-c-approved.json';
const jraRecoveryPath = 'data/candidates/jra-horizon-recovery-2026-08-01-through-2026-08-16-approved.json';
const baneiRecoveryPath = 'data/candidates/banei-horizon-recovery-2026-08-15-through-2026-08-17-approved.json';

const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readBaseJson = (relativePath) => JSON.parse(execFileSync('git', ['show', `${baseSha}:${relativePath}`], { cwd: root, encoding: 'utf8' }));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const authorityInventory = loadAuthoritySourceInventoryV1(root);
const readinessRegistry = loadCalendarReadinessV1(root);
let meetingsDataset = readBaseJson(meetingsPath);
let detailsDataset = readBaseJson(detailsPath);
const orderedCandidatePaths = [
  historicalCPath,
  historicalAPlusPath,
  currentWindowAPlusPath,
  narRecoveryPath,
  jraRecoveryPath,
  baneiRecoveryPath,
];
const availableCandidatePaths = orderedCandidatePaths.filter((inputPath) => fs.existsSync(path.join(root, inputPath)));
for (const requiredPath of [currentWindowAPlusPath, narRecoveryPath, jraRecoveryPath, baneiRecoveryPath]) {
  if (!availableCandidatePaths.includes(requiredPath)) throw new Error(`required approved Candidate is missing: ${requiredPath}`);
}

const baseInputSources = new Set(meetingsDataset.input_sources ?? []);
const inputPaths = availableCandidatePaths.filter((inputPath) => !baseInputSources.has(inputPath));
for (const recoveryPath of [narRecoveryPath, jraRecoveryPath, baneiRecoveryPath]) {
  if (!inputPaths.includes(recoveryPath)) throw new Error(`recovery Candidate is already present in the PR base or missing: ${recoveryPath}`);
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
  [narRecoveryPath, [51, 0]],
  [jraRecoveryPath, [18, 0]],
  [baneiRecoveryPath, [3, 0]],
]);
for (const [inputPath, [expectedMeetings, expectedDetails]] of expectedCounts) {
  const entry = applied.find((item) => item.input_path === inputPath);
  if (entry?.promoted_meetings !== expectedMeetings || entry?.promoted_details !== expectedDetails) {
    throw new Error(`${inputPath} promotion count differs`);
  }
}

const currentWindowCandidate = readJson(currentWindowAPlusPath);
const baseMeetingById = new Map(readBaseJson(meetingsPath).meetings.map((meeting) => [meeting.meeting_id, meeting]));
const baseDetailById = new Map(readBaseJson(detailsPath).details.map((detail) => [detail.meeting_id, detail]));
if (currentWindowCandidate.records.length !== 15 || !baseInputSources.has(currentWindowAPlusPath)) {
  throw new Error('current-window NAR A+ promotion is not present in the PR base');
}
for (const record of currentWindowCandidate.records) {
  if (baseMeetingById.get(record.meeting_id)?.capability_rank !== 'A+' || baseDetailById.get(record.meeting_id)?.capability_rank !== 'A+') {
    throw new Error(`current-window NAR A+ base state differs: ${record.meeting_id}`);
  }
}

console.log('CALENDAR_NAR_INCREMENTAL_V2_PROMOTION_OUTPUT_DETERMINISM: pass');
console.log(`BASE_MEETINGS: ${readBaseJson(meetingsPath).meetings.length}`);
console.log(`HEAD_MEETINGS: ${committedMeetings.meetings.length}`);
console.log(`BASE_DETAILS: ${readBaseJson(detailsPath).details.length}`);
console.log(`HEAD_DETAILS: ${committedDetails.details.length}`);
console.log(`BASE_INPUT_SOURCE_COUNT: ${baseInputSources.size}`);
console.log(`SKIPPED_BASE_CANDIDATES: ${JSON.stringify(availableCandidatePaths.filter((inputPath) => baseInputSources.has(inputPath)))}`);
console.log(`APPLIED_CANDIDATES: ${JSON.stringify(applied)}`);
