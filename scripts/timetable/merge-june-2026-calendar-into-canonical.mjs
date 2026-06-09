import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const junePath = 'data/generated/timetable/june-2026-calendar.json';
const canonicalPath = 'data/generated/timetable/canonical/meetings.json';
const rankOrder = ['not_listed', 'D', 'C', 'B', 'B+', 'A', 'A+'];

const groupConfig = {
  'hong-kong::hkjc': {
    authority_id: 'hkjc',
    prefix: 'hkjc',
    timezone: 'Asia/Hong_Kong',
  },
  'ireland::hri': {
    authority_id: 'hri',
    prefix: 'hri',
    timezone: 'Europe/Dublin',
  },
  'japan::jra': {
    authority_id: 'jra',
    prefix: 'jra',
    timezone: 'Asia/Tokyo',
  },
  'japan::nar': {
    authority_id: 'nar-local-government-racing',
    prefix: 'nar',
    timezone: 'Asia/Tokyo',
  },
  'japan::banei': {
    authority_id: 'banei-tokachi',
    prefix: 'banei',
    timezone: 'Asia/Tokyo',
  },
  'united-kingdom::bha': {
    authority_id: 'bha',
    prefix: 'bha',
    timezone: 'Europe/London',
  },
};

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function writeJson(relativePath, value) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function slug(value) {
  return String(value ?? 'unknown')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';
}

function racecourseId(name) {
  const base = slug(name);
  return base.endsWith('-racecourse') ? base : `${base}-racecourse`;
}

function shouldReplace(existing, candidate) {
  if (!existing) return true;
  return rankOrder.indexOf(candidate.capability_rank) > rankOrder.indexOf(existing.capability_rank);
}

const june = readJson(junePath);
const canonical = readJson(canonicalPath);
const meetingMap = new Map((canonical.meetings ?? []).map((meeting) => [meeting.meeting_id, meeting]));
let added = 0;
let replaced = 0;
let skipped = 0;

for (const recordSet of june.record_sets ?? []) {
  const config = groupConfig[`${recordSet.country_id}::${recordSet.group_id}`];
  if (!config) continue;

  for (const meeting of recordSet.meetings ?? []) {
    const [date, racecourseName] = meeting;
    const courseId = racecourseId(racecourseName);
    const meetingId = `${config.prefix}-${courseId}-${date}`;
    const candidate = {
      meeting_id: meetingId,
      country_id: recordSet.country_id,
      authority_id: config.authority_id,
      racecourse_id: courseId,
      date,
      timezone: config.timezone,
      capability_rank: 'C',
      display_status: 'partial',
      first_race_time_local: null,
      last_race_time_local: null,
      source_trace: {
        source_id: `${recordSet.group_id}-june-2026-calendar`,
        route_id: null,
        source_status: 'verified',
        official_source_url: recordSet.source_trace.source_url,
        source_label: recordSet.group_label,
        extraction_method: recordSet.source_trace.parser,
        source_snapshot_path: junePath,
        normalized_from_path: junePath,
      },
      freshness: {
        last_checked_date: recordSet.source_trace.last_checked,
        generated_at: june.generated_at,
        stale_after_date: '2026-07-01',
        freshness_note: 'Official-source June 2026 meeting-level fixture record. Race times are not inferred.',
      },
      notes: 'Meeting-level fixture record from an official June 2026 calendar source. Official source remains final confirmation.',
    };

    const existing = meetingMap.get(meetingId);
    if (shouldReplace(existing, candidate)) {
      meetingMap.set(meetingId, candidate);
      if (existing) replaced += 1;
      else added += 1;
    } else {
      skipped += 1;
    }
  }
}

const meetings = [...meetingMap.values()].sort((left, right) =>
  `${left.date}:${left.country_id}:${left.racecourse_id}`.localeCompare(
    `${right.date}:${right.country_id}:${right.racecourse_id}`,
  ),
);

writeJson(canonicalPath, {
  ...canonical,
  generated_at: new Date().toISOString(),
  input_sources: [...new Set([...(canonical.input_sources ?? []), junePath])],
  meetings,
});

console.log(
  `[merge-june-2026-calendar-into-canonical] added=${added} replaced=${replaced} skipped=${skipped} total=${meetings.length}`,
);
