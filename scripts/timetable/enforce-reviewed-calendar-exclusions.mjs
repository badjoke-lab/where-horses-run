import fs from 'node:fs';
import path from 'node:path';
import { loadCalendarReadinessV1 } from './load-calendar-readiness.mjs';
import { reconcilePublicProjectionV1 } from './pipeline-v1/public-projection-core.mjs';

function arg(name, fallback = null) {
  const inline = process.argv.find((value) => value.startsWith(`--${name}=`));
  return inline ? inline.slice(name.length + 3) : fallback;
}
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

const exclusionsPath = arg('exclusions', 'data/static/calendar-reviewed-exclusions.json');
const canonicalPath = arg('canonical', 'data/generated/timetable/canonical/meetings.json');
const canonicalDetailsPath = arg('canonical-details', 'data/generated/timetable/canonical/meeting-details.json');
const publicPath = arg('public', 'data/generated/timetable/public/meeting-list.json');
const publicDetailsPath = arg('public-details', 'data/generated/timetable/public/meeting-details.json');
const artifactPaths = process.argv
  .filter((value) => value.startsWith('--artifact='))
  .map((value) => value.slice('--artifact='.length));

const exclusions = readJson(exclusionsPath);
const excludedIds = new Set((exclusions.records ?? []).map((row) => row.meeting_id).filter(Boolean));
if (!excludedIds.size) {
  console.log(JSON.stringify({ excluded_meeting_count: 0, purged_state_count: 0, filtered_artifact_count: 0 }));
  process.exit(0);
}

let filteredArtifactCount = 0;
let filteredArtifactRecordCount = 0;
for (const artifactPath of artifactPaths) {
  const artifact = readJson(artifactPath);
  let changed = false;
  for (const key of ['records', 'candidates', 'schedule_candidates', 'detail_candidates']) {
    if (!Array.isArray(artifact[key])) continue;
    const before = artifact[key].length;
    artifact[key] = artifact[key].filter((row) => !excludedIds.has(row?.meeting_id));
    const removed = before - artifact[key].length;
    if (removed > 0) {
      changed = true;
      filteredArtifactRecordCount += removed;
    }
  }
  if (changed) {
    writeJson(artifactPath, artifact);
    filteredArtifactCount += 1;
  }
}

const generatedAt = new Date().toISOString();
const canonical = readJson(canonicalPath);
const canonicalDetails = readJson(canonicalDetailsPath);
const publicList = readJson(publicPath);
const publicDetails = readJson(publicDetailsPath);

const nextMeetings = (canonical.meetings ?? []).filter((row) => !excludedIds.has(row?.meeting_id));
const nextDetails = (canonicalDetails.details ?? []).filter((row) => !excludedIds.has(row?.meeting_id));
const removedCanonicalMeetings = (canonical.meetings ?? []).length - nextMeetings.length;
const removedCanonicalDetails = (canonicalDetails.details ?? []).length - nextDetails.length;
let purgedStateCount = removedCanonicalMeetings + removedCanonicalDetails;

const nextCanonical = { ...canonical, generated_at: generatedAt, meetings: nextMeetings };
const nextCanonicalDetails = { ...canonicalDetails, generated_at: generatedAt, details: nextDetails };
if (purgedStateCount > 0) {
  writeJson(canonicalPath, nextCanonical);
  writeJson(canonicalDetailsPath, nextCanonicalDetails);
}

const publicProjection = reconcilePublicProjectionV1({
  canonicalMeetings: nextCanonical,
  canonicalDetails: nextCanonicalDetails,
  policyData: readJson('src/data/publicationDisplayPolicies.json'),
  readinessRegistry: loadCalendarReadinessV1(process.cwd()),
  sourceAliases: readJson('data/static/timetable-source-aliases-v1.json'),
  existingMeetingList: publicList,
  existingMeetingDetails: publicDetails,
  scopeMeetingIds: excludedIds,
  excludedMeetingIds: excludedIds,
  generatedAt,
});
const publicRemoved =
  (publicList.meetings ?? []).filter((row) => excludedIds.has(row?.meeting_id)).length
  + (publicDetails.details ?? []).filter((row) => excludedIds.has(row?.meeting_id)).length;
purgedStateCount += publicRemoved;

if (purgedStateCount > 0) {
  writeJson(publicPath, publicProjection.meetingListDataset);
  writeJson(publicDetailsPath, publicProjection.meetingDetailsDataset);
}

console.log(JSON.stringify({
  excluded_meeting_count: excludedIds.size,
  purged_state_count: purgedStateCount,
  filtered_artifact_count: filteredArtifactCount,
  filtered_artifact_record_count: filteredArtifactRecordCount,
  excluded_meeting_ids: [...excludedIds].sort(),
}));
