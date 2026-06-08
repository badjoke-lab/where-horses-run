import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const canonicalMeetingsPath = 'data/generated/timetable/canonical/meetings.json';
const canonicalDetailsPath = 'data/generated/timetable/canonical/meeting-details.json';
const hkjcMeetingsPath = 'data/generated/timetable/hkjc-normalized-timetable.sample.json';

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function writeJson(relativePath, value) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function normalizeSourceStatus(value) {
  if (value === 'verified') return 'verified';
  if (value === 'stale') return 'stale';
  return 'partial';
}

function toCanonicalMeeting(record) {
  return {
    meeting_id: record.meeting_id,
    country_id: record.country_id,
    authority_id: record.authority_id,
    racecourse_id: record.racecourse_id,
    date: record.date,
    timezone: record.timezone,
    capability_rank: record.capability_rank,
    display_status: record.display_status,
    first_race_time_local: record.first_race_time_local,
    last_race_time_local: record.last_race_time_local,
    source_trace: {
      source_id: record.source_id,
      route_id: record.route_id ?? null,
      source_status: normalizeSourceStatus(record.source_status),
      official_source_url: record.official_source_url,
      source_label: 'Official source',
      extraction_method: 'official_racecard_route',
      source_snapshot_path: 'data/generated/timetable/hkjc-racecard-source-snapshot.json',
      normalized_from_path: hkjcMeetingsPath,
    },
    freshness: {
      last_checked_date: record.last_checked_date,
      generated_at: null,
      stale_after_date: null,
      freshness_note: 'HKJC normalized route record merged after canonical build.',
    },
    notes: record.notes ?? null,
  };
}

function mergeInputSources(existing, source) {
  return [...new Set([...(existing ?? []), source])];
}

const canonicalMeetings = readJson(canonicalMeetingsPath);
const canonicalDetails = readJson(canonicalDetailsPath);
const hkjcNormalized = readJson(hkjcMeetingsPath);

const hkjcRecords = hkjcNormalized.records ?? [];
const hkjcById = new Map(hkjcRecords.map((record) => [record.meeting_id, record]));

const meetingMap = new Map((canonicalMeetings.meetings ?? []).map((meeting) => [meeting.meeting_id, meeting]));
for (const record of hkjcRecords) {
  meetingMap.set(record.meeting_id, toCanonicalMeeting(record));
}

const mergedMeetings = [...meetingMap.values()].sort((left, right) =>
  `${left.date}:${left.country_id}:${left.racecourse_id}:${left.meeting_id}`.localeCompare(
    `${right.date}:${right.country_id}:${right.racecourse_id}:${right.meeting_id}`,
  ),
);

const mergedDetails = (canonicalDetails.details ?? []).map((detail) => {
  if (detail.authority_id !== 'hkjc') return detail;
  const record = hkjcById.get(detail.meeting_id);
  if (!record) return detail;

  return {
    ...detail,
    country_id: record.country_id,
    authority_id: record.authority_id,
    racecourse_id: record.racecourse_id,
    date: record.date,
    timezone: record.timezone,
    capability_rank: record.capability_rank,
    source_trace: {
      ...detail.source_trace,
      source_status: normalizeSourceStatus(record.source_status),
      official_source_url: record.official_source_url,
      normalized_from_path: 'data/generated/timetable/hkjc-normalized-meeting-details.sample.json',
    },
    freshness: {
      ...detail.freshness,
      last_checked_date: record.last_checked_date,
      freshness_note: 'HKJC detail aligned to merged normalized meeting record.',
    },
  };
});

writeJson(canonicalMeetingsPath, {
  ...canonicalMeetings,
  input_sources: mergeInputSources(canonicalMeetings.input_sources, hkjcMeetingsPath),
  meetings: mergedMeetings,
});

writeJson(canonicalDetailsPath, {
  ...canonicalDetails,
  input_sources: mergeInputSources(
    canonicalDetails.input_sources,
    'data/generated/timetable/hkjc-normalized-meeting-details.sample.json',
  ),
  details: mergedDetails,
});

console.log(`[merge-hkjc-normalized-into-canonical] merged ${hkjcRecords.length} HKJC records into canonical timetable output`);
