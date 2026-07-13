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

const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readBaseJson = (relativePath) => JSON.parse(execFileSync('git', ['show', `${baseSha}:${relativePath}`], { cwd: root, encoding: 'utf8' }));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const authorityInventory = loadAuthoritySourceInventoryV1(root);
const readinessRegistry = loadCalendarReadinessV1(root);
let meetingsDataset = readBaseJson(meetingsPath);
let detailsDataset = readBaseJson(detailsPath);
const inputPaths = [historicalCPath, historicalAPlusPath, currentWindowAPlusPath].filter((inputPath) => fs.existsSync(path.join(root, inputPath)));
if (!inputPaths.includes(currentWindowAPlusPath)) throw new Error('current-window approved NAR Candidate is missing');

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
if (!exact(meetingsDataset, committedMeetings)) throw new Error('cumulative NAR meeting promotion output differs from committed canonical meetings');
if (!exact(detailsDataset, committedDetails)) throw new Error('cumulative NAR detail promotion output differs from committed canonical details');

const currentApplied = applied.find((entry) => entry.input_path === currentWindowAPlusPath);
if (currentApplied?.promoted_meetings !== 15 || currentApplied?.promoted_details !== 15) throw new Error('current-window NAR promotion count differs');

console.log('CALENDAR_NAR_INCREMENTAL_V2_PROMOTION_OUTPUT_DETERMINISM: pass');
console.log(`BASE_MEETINGS: ${readBaseJson(meetingsPath).meetings.length}`);
console.log(`HEAD_MEETINGS: ${committedMeetings.meetings.length}`);
console.log(`BASE_DETAILS: ${readBaseJson(detailsPath).details.length}`);
console.log(`HEAD_DETAILS: ${committedDetails.details.length}`);
console.log(`APPLIED_CANDIDATES: ${JSON.stringify(applied)}`);
