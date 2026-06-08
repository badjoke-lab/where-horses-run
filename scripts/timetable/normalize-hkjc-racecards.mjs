import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'data/sources/timetable/hkjc-racecard-route.json');
const snapshotPath = path.join(root, 'data/generated/timetable/hkjc-racecard-source-snapshot.json');
const normalizedOutputPath = path.join(root, 'data/generated/timetable/hkjc-normalized-timetable.sample.json');
const detailsOutputPath = path.join(root, 'data/generated/timetable/hkjc-normalized-meeting-details.sample.json');
const reportPath = path.join(root, 'data/generated/timetable/hkjc-refresh-report.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readJsonIfExists(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return readJson(filePath);
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function formatDateParts(date) {
  const [yyyy, mm, dd] = date.split('-');
  return { yyyy, mm, dd };
}

function racecardUrl(template, meeting, raceNumber) {
  const { yyyy, mm, dd } = formatDateParts(meeting.meeting_date);
  return template
    .replace('{race_number}', String(raceNumber))
    .replace('{fixture_code}', meeting.fixture_code)
    .replace('{yyyy}', yyyy)
    .replace('{mm}', mm)
    .replace('{dd}', dd);
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
      official_source_url: race.source_url,
    }));
}

function isContinuousFromOne(rows) {
  return rows.length > 0 && rows.every((row, index) => row.race_number === index + 1);
}

function hasAPlusMetadata(row) {
  return Boolean(row.race_name && row.distance_m && (row.surface || row.course_label) && row.metadata_status === 'verified');
}

function missingAPlusFields(row) {
  const missing = [];
  if (!row.post_time_local) missing.push('post_time_local');
  if (!row.race_name) missing.push('race_name');
  if (row.distance_m == null) missing.push('distance_m');
  if (!row.surface && !row.course_label) missing.push('surface_or_course_label');
  return missing;
}

function snapshotMeetingByKey(snapshot) {
  return new Map((snapshot.observations ?? []).map((meeting) => [`${meeting.meeting_date}:${meeting.fixture_code}`, meeting]));
}

function normalizeMeeting({ config, snapshot, routeMeeting, observedMeeting }) {
  const meeting = observedMeeting ?? {
    meeting_date: routeMeeting.meeting_date,
    racecourse_id: routeMeeting.racecourse_id,
    racecourse_name: routeMeeting.racecourse_name,
    fixture_code: routeMeeting.fixture_code,
    races: [],
  };
  const rows = compactRaceRows(meeting);
  const id = meetingId(meeting);
  const officialSourceUrl = rows[0]?.source_url ?? racecardUrl(
    config.official_sources.racecard_url_template,
    routeMeeting,
    1,
  );

  const continuous = isContinuousFromOne(rows);
  const allRowsHaveMetadata = rows.length >= 2 && rows.every(hasAPlusMetadata);
  const capabilityRank = continuous && allRowsHaveMetadata ? 'A+' : continuous && rows.length >= 2 ? 'A' : rows.length >= 2 ? 'B+' : rows.length === 1 ? 'B' : 'C';
  const firstRaceTime = rows[0]?.post_time_local ?? null;
  const lastRaceTime = rows.length >= 2 ? rows.at(-1)?.post_time_local ?? null : null;
  const observed = Boolean(observedMeeting);

  return {
    record: {
      meeting_id: id,
      country_id: snapshot.country_id,
      authority_id: snapshot.authority_id,
      racecourse_id: routeMeeting.racecourse_id,
      date: routeMeeting.meeting_date,
      timezone: snapshot.timezone,
      source_id: 'hkjc-racecard-route',
      route_id: 'hkjc-racecard-date-raceno-route',
      source_status: rows.length > 0 ? 'verified' : observed ? 'partial' : 'route_config_only',
      capability_rank: capabilityRank,
      first_race_time_local: capabilityRank === 'C' ? null : firstRaceTime,
      last_race_time_local: capabilityRank === 'B+' || capabilityRank === 'A' || capabilityRank === 'A+' ? lastRaceTime : null,
      official_source_url: officialSourceUrl,
      official_fixture_url: routeMeeting.official_fixture_url ?? null,
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
                : observed
                  ? 'HKJC route snapshot included this meeting, but no race start time was extracted.'
                  : 'HKJC route config includes this meeting, but the current source snapshot has not captured race rows yet.',
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
                official_source_url: row.official_source_url,
              }
            : { label: row.label, post_time_local: row.post_time_local, official_source_url: row.official_source_url }),
        }
      : null,
    extraction_summary: {
      meeting_id: id,
      extracted_race_count: rows.length,
      race_numbers: rows.map((row) => row.race_number),
      continuous_from_one: continuous,
      metadata_fields: capabilityRank === 'A+' ? ['race_name', 'distance_m', 'surface', 'course_label', 'official_source_url'] : [],
      missing_a_plus_fields: rows.flatMap((row) => missingAPlusFields(row).map((field) => ({ race_number: row.race_number, field }))),
      chosen_rank: capabilityRank,
      route_config_meeting: true,
      snapshot_observation_present: observed,
    },
  };
}

const config = readJson(configPath);
const snapshot = readJson(snapshotPath);
const observations = snapshotMeetingByKey(snapshot);
const normalized = config.meetings.map((routeMeeting) => normalizeMeeting({
  config,
  snapshot,
  routeMeeting,
  observedMeeting: observations.get(`${routeMeeting.meeting_date}:${routeMeeting.fixture_code}`),
}));

writeJson(normalizedOutputPath, {
  schema_version: 'hkjc-normalized-timetable-sample-v0',
  generated_at: new Date().toISOString(),
  source_config: 'data/sources/timetable/hkjc-racecard-route.json',
  source_snapshot: 'data/generated/timetable/hkjc-racecard-source-snapshot.json',
  route_meeting_count: config.meetings.length,
  snapshot_observation_count: snapshot.observations?.length ?? 0,
  rank_fallback_order: ['A+', 'A', 'B+', 'B', 'C'],
  records: normalized.map((entry) => entry.record),
  extraction_summary: normalized.map((entry) => entry.extraction_summary),
});

writeJson(detailsOutputPath, {
  schema_version: 'hkjc-normalized-meeting-details-sample-v0',
  generated_at: new Date().toISOString(),
  source_config: 'data/sources/timetable/hkjc-racecard-route.json',
  source_snapshot: 'data/generated/timetable/hkjc-racecard-source-snapshot.json',
  details: normalized.map((entry) => entry.detail).filter(Boolean),
});

const rankCounts = normalized.reduce((counts, entry) => {
  counts[entry.record.capability_rank] = (counts[entry.record.capability_rank] ?? 0) + 1;
  return counts;
}, {});

console.log(`[normalize-hkjc-racecards] wrote ${path.relative(root, normalizedOutputPath)} route_meetings=${config.meetings.length} snapshot_observations=${snapshot.observations?.length ?? 0} ranks=${JSON.stringify(rankCounts)}`);
