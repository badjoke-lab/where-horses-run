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
const cPath = 'data/candidates/nar-incremental-v2-july-remainder-c-approved.json';
const aPlusPath = 'data/candidates/nar-incremental-v2-july-remainder-a-plus-approved.json';

const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readBaseJson = (relativePath) => JSON.parse(execFileSync('git', ['show', `${baseSha}:${relativePath}`], { cwd: root, encoding: 'utf8' }));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const authorityInventory = loadAuthoritySourceInventoryV1(root);
const readinessRegistry = loadCalendarReadinessV1(root);
let meetingsDataset = readBaseJson(meetingsPath);
let detailsDataset = readBaseJson(detailsPath);

for (const inputPath of [cPath, aPlusPath]) {
  const result = promoteApprovedCandidateV1({
    candidate: readJson(inputPath),
    meetingsDataset,
    detailsDataset,
    authorityInventory,
    readinessRegistry,
    inputPath,
  });
  meetingsDataset = result.meetingsDataset;
  detailsDataset = result.detailsDataset;
}

const committedMeetings = readJson(meetingsPath);
const committedDetails = readJson(detailsPath);
if (!exact(meetingsDataset, committedMeetings)) throw new Error('cumulative C -> A+ meeting promotion output differs from committed canonical meetings');
if (!exact(detailsDataset, committedDetails)) throw new Error('cumulative C -> A+ detail promotion output differs from committed canonical details');

console.log('CALENDAR_NAR_INCREMENTAL_V2_PROMOTION_OUTPUT_DETERMINISM: pass');
console.log(`BASE_MEETINGS: ${readBaseJson(meetingsPath).meetings.length}`);
console.log(`HEAD_MEETINGS: ${committedMeetings.meetings.length}`);
console.log(`BASE_DETAILS: ${readBaseJson(detailsPath).details.length}`);
console.log(`HEAD_DETAILS: ${committedDetails.details.length}`);
