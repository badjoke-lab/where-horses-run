import fs from 'node:fs';
import path from 'node:path';

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

const datasets = [
  { file: canonicalPath, key: 'meetings' },
  { file: canonicalDetailsPath, key: 'details' },
  { file: publicPath, key: 'meetings' },
  { file: publicDetailsPath, key: 'details' },
];
let purgedStateCount = 0;
for (const { file, key } of datasets) {
  const dataset = readJson(file);
  const rows = Array.isArray(dataset[key]) ? dataset[key] : [];
  const next = rows.filter((row) => !excludedIds.has(row?.meeting_id));
  const removed = rows.length - next.length;
  if (removed > 0) {
    purgedStateCount += removed;
    writeJson(file, { ...dataset, generated_at: new Date().toISOString(), [key]: next });
  }
}

console.log(JSON.stringify({
  excluded_meeting_count: excludedIds.size,
  purged_state_count: purgedStateCount,
  filtered_artifact_count: filteredArtifactCount,
  filtered_artifact_record_count: filteredArtifactRecordCount,
  excluded_meeting_ids: [...excludedIds].sort(),
}));
