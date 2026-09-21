import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarReadinessV1 } from './load-calendar-readiness.mjs';
import { reconcilePublicProjectionV1 } from './pipeline-v1/public-projection-core.mjs';
import { confirmedNonRunningMeetingIds, validateMeetingPresenceRegistry } from './meeting-presence-core.mjs';

function arg(name, fallback) {
  const inline = process.argv.find((value) => value.startsWith(`--${name}=`));
  return inline ? inline.slice(name.length + 3) : fallback;
}
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

const registryPath = arg('registry', 'data/static/calendar-meeting-presence-v1.json');
const canonicalPath = arg('canonical', 'data/generated/timetable/canonical/meetings.json');
const canonicalDetailsPath = arg('canonical-details', 'data/generated/timetable/canonical/meeting-details.json');
const publicPath = arg('public', 'data/generated/timetable/public/meeting-list.json');
const publicDetailsPath = arg('public-details', 'data/generated/timetable/public/meeting-details.json');

const registry = validateMeetingPresenceRegistry(readJson(registryPath));
const suppressedIds = new Set(confirmedNonRunningMeetingIds(registry));
if (!suppressedIds.size) {
  console.log(JSON.stringify({ confirmed_non_running_count: 0, public_removed_count: 0 }));
  process.exit(0);
}

const canonical = readJson(canonicalPath);
const canonicalDetails = readJson(canonicalDetailsPath);
const publicList = readJson(publicPath);
const publicDetails = readJson(publicDetailsPath);

const canonicalIds = new Set((canonical.meetings ?? []).map((row) => row.meeting_id));
for (const meetingId of suppressedIds) {
  if (!canonicalIds.has(meetingId)) {
    throw new Error(`confirmed_non_running meeting ${meetingId} is missing from canonical state; canonical evidence must be preserved`);
  }
}

const generatedAt = new Date().toISOString();
const projection = reconcilePublicProjectionV1({
  canonicalMeetings: canonical,
  canonicalDetails,
  policyData: readJson('src/data/publicationDisplayPolicies.json'),
  readinessRegistry: loadCalendarReadinessV1(process.cwd()),
  sourceAliases: readJson('data/static/timetable-source-aliases-v1.json'),
  existingMeetingList: publicList,
  existingMeetingDetails: publicDetails,
  scopeMeetingIds: suppressedIds,
  excludedMeetingIds: suppressedIds,
  generatedAt,
});

const publicBefore = new Set((publicList.meetings ?? []).map((row) => row.meeting_id));
const removed = [...suppressedIds].filter((meetingId) => publicBefore.has(meetingId));
writeJson(publicPath, projection.meetingListDataset);
writeJson(publicDetailsPath, projection.meetingDetailsDataset);

for (const meetingId of suppressedIds) {
  if (!canonicalIds.has(meetingId)) throw new Error(`${meetingId} canonical evidence was erased`);
  if ((projection.meetingListDataset.meetings ?? []).some((row) => row.meeting_id === meetingId)) {
    throw new Error(`${meetingId} confirmed_non_running survived public meeting projection`);
  }
  if ((projection.meetingDetailsDataset.details ?? []).some((row) => row.meeting_id === meetingId)) {
    throw new Error(`${meetingId} confirmed_non_running survived public detail projection`);
  }
}

console.log(JSON.stringify({
  confirmed_non_running_count: suppressedIds.size,
  public_removed_count: removed.length,
  confirmed_non_running_meeting_ids: [...suppressedIds].sort(),
  canonical_preserved: true
}));
