import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const snapshotPath = path.join(root, 'data/generated/timetable/hkjc-racecard-source-snapshot.json');
const normalizedOutputPath = path.join(root, 'data/generated/timetable/hkjc-normalized-timetable.sample.json');
const detailsOutputPath = path.join(root, 'data/generated/timetable/hkjc-normalized-meeting-details.sample.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function racecourseSlug(name) {
  if (name === 'Sha Tin') return 'sha-tin-racecourse';
  if (name === 'Happy Valley') return 'happy-valley-racecourse';
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-racecourse`;
}

function meetingId(meeting) {
  return `hkjc-${racecourseSlug(meeting.racecourse_name)}-${meeting.meeting_date}`;
}

function compactRaceRows(meeting) {
  return (meeting.races ?? [])
    .filter((race) => race.fetch_status === 'time_extracted' && /^\d{1,2}:\d{2}$/.test(race.race_time_local ?? ''))
    .sort((left, right) => left.race_number - right.race_number)
    .map((race) => ({
      race_number: race.race_number,
      label: `Race ${race.race_number}`,
      post_time_local: race.race_time_local,
      race_name: race.race_name ?? null,
      distance_m: race.distance_m ?? null,
      surface: race.surface ?? null,
      course_label: race.course_label ?? null,
      metadata_status: race.metadata_status ?? 'pending',
      source_url: race.source_url,
    }));
}

function isContinuousFromOne(rows) {
  return rows.length > 0 && rows.every((row, index) => row.race_number === index + 1);
}

function hasAPlusMetadata(row) {
  return Boolean(row.race_name && row.distance_m && row.surface && row.metadata_status === 'verified');
}

function normalizeMeeting(snapshot, meeting) {
  const rows = compactRaceRows(meeting);
  const id = meetingId(meeting);
  const officialSourceUrl = rows[0]?.source_url ?? snapshot.official_source_url_template
    .replace('{race_number}', '1')
    .replace('{fixture_code}', meeting.fixture_code)
    .replace('{yyyy}', meeting.meeting_date.slice(0, 4))
    .replace('{mm}', meeting.meeting_date.slice(5, 7))
    .replace('{dd}', meeting.meeting_date.slice(8, 10));

  const continuous = isContinuousFromOne(rows);
  const allRowsHaveMetadata = rows.length >= 2 && rows.every(hasAPlusMetadata);
  const capabilityRank = continuous && allRowsHaveMetadata ? 'A+' : continuous && rows.length >= 2 ? 'A' : rows.length >= 2 ? 'B+' : rows.length === 1 ? 'B' : 'C';
  const firstRaceTime = rows[0]?.post_time_local ?? null;
  const lastRaceTime = rows.length >= 2 ? rows.at(-1)?.post_time_local ?? null : null;

  return {
    record: {
      meeting_id: id,
      country_id: snapshot.country_id,
      authority_id: snapshot.authority_id,
      racecourse_id: meeting.racecourse_id,
      date: meeting.meeting_date,
      timezone: snapshot.timezone,
      source_id: 'hkjc-racecard-route',
      route_id: 'hkjc-racecard-date-raceno-route',
      source_status: rows.length > 0 ? 'verified' : 'partial',
      capability_rank: capabilityRank,
      first_race_time_local: capabilityRank === 'C' ? null : firstRaceTime,
      last_race_time_local: capabilityRank === 'B+' || capabilityRank === 'A' || capabilityRank === 'A+' ? lastRaceTime : null,
      official_source_url: officialSourceUrl,
      last_checked_date: snapshot.generated_at.slice(0, 10),
      display_status: rows.length > 0 ? 'displayable' : 'partial',
      notes:
        capabilityRank === 'A+'
          ? 'HKJC official racecard route produced continuous public-safe race-by-race post times plus minimal timetable metadata: race title, distance, and surface/course type. Starter lists, odds, results, payouts, predictions, full racecard text, and raw HTML are not stored.'
          : capabilityRank === 'A'
            ? 'HKJC official racecard route produced continuous public-safe race-by-race post times for this meeting. No starter lists, odds, results, payouts, predictions, full racecard text, or raw HTML are stored.'
            : capabilityRank === 'B+'
              ? 'HKJC official racecard route produced first and last public-safe race start times, but the full continuous race-number set was not proven for A promotion.'
              : capabilityRank === 'B'
                ? 'HKJC official racecard route produced one source-verified race start time only. Last race time is not inferred.'
                : 'HKJC meeting is known, but no race start time was extracted by the official racecard route snapshot.',
    },
    detail: capabilityRank === 'A' || capabilityRank === 'A+'
      ? {
          meeting_id: id,
          summary_note: capabilityRank === 'A+'
            ? 'Public-safe HKJC timetable fields only: race label, post time, race title, distance, and surface/course type. Starter lists, odds, results, payouts, predictions, full racecard text, and raw HTML are not stored or republished.'
            : 'Public-safe HKJC race-by-race post times only. Starter lists, odds, results, payouts, predictions, full racecard text, and raw HTML are not stored or republished.',
          timetable_rows: rows.map((row) => capabilityRank === 'A+'
            ? {
                label: row.label,
                post_time_local: row.post_time_local,
                race_name: row.race_name,
                distance_m: row.distance_m,
                surface: row.surface,
                course_label: row.course_label,
                metadata_status: row.metadata_status,
              }
            : { label: row.label, post_time_local: row.post_time_local }),
        }
      : null,
    extraction_summary: {
      meeting_id: id,
      extracted_race_count: rows.length,
      race_numbers: rows.map((row) => row.race_number),
      continuous_from_one: continuous,
      metadata_fields: capabilityRank === 'A+' ? ['race_name', 'distance_m', 'surface', 'course_label'] : [],
      chosen_rank: capabilityRank,
    },
  };
}

const snapshot = readJson(snapshotPath);
const normalized = snapshot.observations.map((meeting) => normalizeMeeting(snapshot, meeting));

writeJson(normalizedOutputPath, {
  schema_version: 'hkjc-normalized-timetable-sample-v0',
  generated_at: new Date().toISOString(),
  source_snapshot: 'data/generated/timetable/hkjc-racecard-source-snapshot.json',
  rank_fallback_order: ['A+', 'A', 'B+', 'B', 'C'],
  records: normalized.map((entry) => entry.record),
  extraction_summary: normalized.map((entry) => entry.extraction_summary),
});

writeJson(detailsOutputPath, {
  schema_version: 'hkjc-normalized-meeting-details-sample-v0',
  generated_at: new Date().toISOString(),
  source_snapshot: 'data/generated/timetable/hkjc-racecard-source-snapshot.json',
  details: normalized.map((entry) => entry.detail).filter(Boolean),
});

const rankCounts = normalized.reduce((counts, entry) => {
  counts[entry.record.capability_rank] = (counts[entry.record.capability_rank] ?? 0) + 1;
  return counts;
}, {});

console.log(`[normalize-hkjc-racecards] wrote ${path.relative(root, normalizedOutputPath)} ranks=${JSON.stringify(rankCounts)}`);
