import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const key = process.argv[index];
  const value = process.argv[index + 1];
  if (!key.startsWith('--') || !value || value.startsWith('--')) throw new Error(`invalid argument near ${key}`);
  args.set(key.slice(2), value);
  index += 1;
}

const beforeListPath = args.get('before-list');
const beforeDetailsPath = args.get('before-details');
const outputPath = args.get('output') ?? 'data/audits/calendar-public-projection-release-v1.json';
if (!beforeListPath || !beforeDetailsPath) {
  throw new Error('Usage: node scripts/build-calendar-public-projection-release-audit.mjs --before-list <path> --before-details <path> [--output <path>]');
}

const readJson = (file) => JSON.parse(readFileSync(path.isAbsolute(file) ? file : path.join(root, file), 'utf8'));
const beforeList = readJson(beforeListPath);
const beforeDetails = readJson(beforeDetailsPath);
const afterList = readJson('data/generated/timetable/public/meeting-list.json');
const afterDetails = readJson('data/generated/timetable/public/meeting-details.json');

function indexBy(records, key) {
  return new Map(records.map((record) => [record[key], record]));
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
}

function changedFields(before, after) {
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])].sort();
  return keys.filter((key) => JSON.stringify(stable(before?.[key])) !== JSON.stringify(stable(after?.[key])));
}

function compareCollection(beforeRecords, afterRecords, key) {
  const before = indexBy(beforeRecords, key);
  const after = indexBy(afterRecords, key);
  const added = [...after.keys()].filter((id) => !before.has(id)).sort();
  const removed = [...before.keys()].filter((id) => !after.has(id)).sort();
  const changed = [...after.keys()]
    .filter((id) => before.has(id))
    .map((id) => ({ id, fields: changedFields(before.get(id), after.get(id)) }))
    .filter((entry) => entry.fields.length > 0)
    .sort((left, right) => left.id.localeCompare(right.id));
  return { added, removed, changed };
}

function rankChanges(beforeRecords, afterRecords) {
  const before = indexBy(beforeRecords, 'meeting_id');
  return afterRecords
    .filter((record) => before.has(record.meeting_id))
    .map((record) => {
      const previous = before.get(record.meeting_id);
      if (previous.max_public_rank === record.max_public_rank && previous.effective_public_rank === record.effective_public_rank) return null;
      return {
        meeting_id: record.meeting_id,
        before_max_public_rank: previous.max_public_rank,
        after_max_public_rank: record.max_public_rank,
        before_effective_public_rank: previous.effective_public_rank,
        after_effective_public_rank: record.effective_public_rank
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.meeting_id.localeCompare(right.meeting_id));
}

const optionalKeys = ['race_name', 'distance_m', 'surface', 'course_label'];
function detailFieldCounts(details) {
  const counts = Object.fromEntries(optionalKeys.map((key) => [key, 0]));
  let rows = 0;
  for (const detail of details) {
    for (const row of detail.timetable_rows ?? []) {
      rows += 1;
      for (const key of optionalKeys) if (Object.hasOwn(row, key)) counts[key] += 1;
    }
  }
  return { rows, optional_fields: counts };
}

const forbiddenKeyFragments = ['horse', 'runner', 'jockey', 'trainer', 'odds', 'payout', 'prediction', 'raw_html', 'raw_markup', 'source_body', 'stream_url'];
function findForbiddenKeys(value, location = '$', found = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => findForbiddenKeys(item, `${location}[${index}]`, found));
    return found;
  }
  if (!value || typeof value !== 'object') return found;
  for (const [key, child] of Object.entries(value)) {
    const lower = key.toLowerCase();
    const fragment = forbiddenKeyFragments.find((item) => lower.includes(item));
    if (fragment) found.push({ location: `${location}.${key}`, fragment });
    findForbiddenKeys(child, `${location}.${key}`, found);
  }
  return found;
}

const meetingComparison = compareCollection(beforeList.meetings ?? [], afterList.meetings ?? [], 'meeting_id');
const detailComparison = compareCollection(beforeDetails.details ?? [], afterDetails.details ?? [], 'meeting_id');
const beforeFields = detailFieldCounts(beforeDetails.details ?? []);
const afterFields = detailFieldCounts(afterDetails.details ?? []);
const forbidden = [
  ...findForbiddenKeys(afterList),
  ...findForbiddenKeys(afterDetails)
];

const audit = {
  schema_version: 'calendar-public-projection-release-audit-v1',
  work_id: 'WHR-CAL-PIPELINE-V1',
  projection_generated_at: afterList.generated_at,
  before: {
    meeting_generated_at: beforeList.generated_at,
    detail_generated_at: beforeDetails.generated_at,
    meeting_count: beforeList.meetings?.length ?? 0,
    detail_count: beforeDetails.details?.length ?? 0,
    detail_field_counts: beforeFields
  },
  after: {
    meeting_generated_at: afterList.generated_at,
    detail_generated_at: afterDetails.generated_at,
    meeting_count: afterList.meetings?.length ?? 0,
    detail_count: afterDetails.details?.length ?? 0,
    detail_field_counts: afterFields
  },
  meetings: {
    added_ids: meetingComparison.added,
    removed_ids: meetingComparison.removed,
    changed: meetingComparison.changed.map(({ id, fields }) => ({ meeting_id: id, fields })),
    rank_changes: rankChanges(beforeList.meetings ?? [], afterList.meetings ?? [])
  },
  details: {
    added_ids: detailComparison.added,
    removed_ids: detailComparison.removed,
    changed: detailComparison.changed.map(({ id, fields }) => ({ meeting_id: id, fields })),
    optional_field_occurrence_delta: Object.fromEntries(optionalKeys.map((key) => [key, afterFields.optional_fields[key] - beforeFields.optional_fields[key]]))
  },
  boundaries: {
    forbidden_key_findings: forbidden,
    deterministic_generated_at_matches: afterList.generated_at === afterDetails.generated_at,
    public_schema_versions: [afterList.schema_version, afterDetails.schema_version]
  }
};

const absoluteOutput = path.join(root, outputPath);
mkdirSync(path.dirname(absoluteOutput), { recursive: true });
writeFileSync(absoluteOutput, `${JSON.stringify(audit, null, 2)}\n`);

console.log(JSON.stringify({
  output: outputPath,
  before_meetings: audit.before.meeting_count,
  after_meetings: audit.after.meeting_count,
  removed_meetings: audit.meetings.removed_ids.length,
  rank_changes: audit.meetings.rank_changes.length,
  before_details: audit.before.detail_count,
  after_details: audit.after.detail_count,
  removed_details: audit.details.removed_ids.length,
  forbidden_findings: forbidden.length
}, null, 2));

if (forbidden.length > 0 || !audit.boundaries.deterministic_generated_at_matches) process.exit(1);
