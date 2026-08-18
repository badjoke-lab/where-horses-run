import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { promoteApprovedCandidateV1 } from './timetable/pipeline-v1/promotion-core.mjs';
import { loadAuthoritySourceInventoryV1 } from './timetable/load-authority-source-inventory.mjs';
import { loadCalendarReadinessV1 } from './timetable/load-calendar-readiness.mjs';

const root = process.cwd();
const baseSha = process.env.BASE_SHA;
if (!baseSha || !/^[0-9a-f]{40}$/.test(baseSha)) throw new Error('BASE_SHA must be a full commit SHA.');

const candidatePath = 'data/candidates/tjk-current-2026-08-11-approved.json';
const meetingsPath = 'data/generated/timetable/canonical/meetings.json';
const detailsPath = 'data/generated/timetable/canonical/meeting-details.json';

const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const readBaseJson = (relativePath) => JSON.parse(execFileSync('git', ['show', `${baseSha}:${relativePath}`], { cwd: root, encoding: 'utf8' }));
const exact = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const candidate = readJson(candidatePath);
if (candidate.review?.status !== 'approved' || candidate.review?.promotion_target !== 'canonical-timetable-v0') {
  throw new Error('TJK candidate is not approved for canonical promotion');
}

const baseMeetings = readBaseJson(meetingsPath);
const baseDetails = readBaseJson(detailsPath);
const committedMeetings = readJson(meetingsPath);
const committedDetails = readJson(detailsPath);

const result = promoteApprovedCandidateV1({
  candidate,
  meetingsDataset: baseMeetings,
  detailsDataset: baseDetails,
  authorityInventory: loadAuthoritySourceInventoryV1(root),
  readinessRegistry: loadCalendarReadinessV1(root),
  inputPath: candidatePath,
});

const candidateIds = new Set(candidate.records.map((record) => record.meeting_id));
const expectedMeetingById = new Map(result.meetingsDataset.meetings.map((meeting) => [meeting.meeting_id, meeting]));
const expectedDetailById = new Map(result.detailsDataset.details.map((detail) => [detail.meeting_id, detail]));
const committedMeetingById = new Map(committedMeetings.meetings.map((meeting) => [meeting.meeting_id, meeting]));
const committedDetailById = new Map(committedDetails.details.map((detail) => [detail.meeting_id, detail]));

for (const meetingId of candidateIds) {
  const expectedMeeting = expectedMeetingById.get(meetingId);
  const committedMeeting = committedMeetingById.get(meetingId);
  if (!expectedMeeting || !exact(committedMeeting, expectedMeeting)) {
    throw new Error(`TJK canonical meeting differs from deterministic promotion: ${meetingId}`);
  }

  const expectedDetail = expectedDetailById.get(meetingId);
  const committedDetail = committedDetailById.get(meetingId);
  if (expectedDetail) {
    if (!exact(committedDetail, expectedDetail)) {
      throw new Error(`TJK canonical detail differs from deterministic promotion: ${meetingId}`);
    }
  } else if (committedDetail) {
    throw new Error(`TJK canonical detail exists although deterministic promotion has none: ${meetingId}`);
  }
}

const authorityId = candidate.authority_id;
const baseAuthorityIds = new Set(baseMeetings.meetings.filter((meeting) => meeting.authority_id === authorityId).map((meeting) => meeting.meeting_id));
const expectedAuthorityIds = new Set(result.meetingsDataset.meetings.filter((meeting) => meeting.authority_id === authorityId).map((meeting) => meeting.meeting_id));
const committedAuthorityIds = new Set(committedMeetings.meetings.filter((meeting) => meeting.authority_id === authorityId).map((meeting) => meeting.meeting_id));

for (const meetingId of committedAuthorityIds) {
  if (!expectedAuthorityIds.has(meetingId)) {
    throw new Error(`unreviewed TJK canonical meeting addition bypasses reviewed promotion: ${meetingId}`);
  }
}
for (const meetingId of expectedAuthorityIds) {
  if (!committedAuthorityIds.has(meetingId)) {
    throw new Error(`reviewed TJK canonical meeting is missing: ${meetingId}`);
  }
}

const baseInputSources = new Set(baseMeetings.input_sources ?? []);
const committedInputSources = new Set(committedMeetings.input_sources ?? []);
for (const inputPath of baseInputSources) {
  if (!committedInputSources.has(inputPath)) throw new Error(`canonical input source from PR base was removed: ${inputPath}`);
}
if (!committedInputSources.has(candidatePath)) throw new Error('TJK approved candidate is missing from canonical input_sources');

const unrelatedMeetingAdditions = committedMeetings.meetings.filter((meeting) => !new Set(baseMeetings.meetings.map((item) => item.meeting_id)).has(meeting.meeting_id) && !candidateIds.has(meeting.meeting_id));
const unrelatedDetailAdditions = committedDetails.details.filter((detail) => !new Set(baseDetails.details.map((item) => item.meeting_id)).has(detail.meeting_id) && !candidateIds.has(detail.meeting_id));

console.log('TJK_CURRENT_CANONICAL_PROMOTION_DETERMINISM: pass');
console.log(`BASE_SHA: ${baseSha}`);
console.log(`BASE_AUTHORITY_MEETINGS: ${baseAuthorityIds.size}`);
console.log(`EXPECTED_AUTHORITY_MEETINGS: ${expectedAuthorityIds.size}`);
console.log(`HEAD_AUTHORITY_MEETINGS: ${committedAuthorityIds.size}`);
console.log(`REVIEWED_CANDIDATE_MEETINGS: ${candidateIds.size}`);
console.log(`UNRELATED_MEETING_ADDITIONS_ALLOWED: ${unrelatedMeetingAdditions.length}`);
console.log(`UNRELATED_DETAIL_ADDITIONS_ALLOWED: ${unrelatedDetailAdditions.length}`);
