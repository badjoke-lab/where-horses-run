import fs from 'node:fs';
import path from 'node:path';

const AUTHORITY_ID = 'turkiye-jokey-kulubu';
const COUNTRY_ID = 'turkey';
const TIMEZONE = 'Europe/Istanbul';
const SOURCE_ID = 'tjk-daily-programme';
const SOURCE_LABEL = 'Jockey Club of Turkey';
const RANK_ORDER = new Map([['C', 0], ['B', 1], ['B+', 2], ['A', 3], ['A+', 4]]);

const CANONICAL_MEETINGS = 'data/generated/timetable/canonical/meetings.json';
const CANONICAL_DETAILS = 'data/generated/timetable/canonical/meeting-details.json';
const RACECOURSE_IDENTITIES = 'data/static/racecourses-public-timetable-identities-v1.json';

function parseArgs(argv) {
  const read = (name) => {
    const inline = argv.find((arg) => arg.startsWith(`--${name}=`));
    if (inline) return inline.slice(name.length + 3);
    const index = argv.indexOf(`--${name}`);
    return index >= 0 ? argv[index + 1] : null;
  };
  const input = read('input');
  const output = read('output');
  if (!input || !output) throw new Error('Usage: node scripts/timetable/apply-tjk-zero-based-30d.mjs --input <candidates.json> --output <reconciliation.json>');
  return { input, output };
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function rankAtLeast(actual, minimum) {
  return RANK_ORDER.get(actual) >= RANK_ORDER.get(minimum);
}

function sourceTrace(candidate, inputPath) {
  return {
    source_id: SOURCE_ID,
    route_id: null,
    source_status: 'verified',
    official_source_url: candidate.source_url,
    source_label: SOURCE_LABEL,
    extraction_method: 'adapter',
    source_snapshot_path: null,
    normalized_from_path: inputPath,
  };
}

function freshness(candidate, retrievedAt) {
  return {
    last_checked_date: retrievedAt.slice(0, 10),
    generated_at: retrievedAt,
    stale_after_date: null,
    freshness_note: 'Refreshed directly from the official TJK 30-day source-visible mother set.',
  };
}

function makeMeeting(candidate, artifact, inputPath) {
  return {
    meeting_id: candidate.meeting_id,
    country_id: COUNTRY_ID,
    authority_id: AUTHORITY_ID,
    racecourse_id: candidate.racecourse_id,
    date: candidate.date,
    timezone: TIMEZONE,
    capability_rank: candidate.capability_rank,
    display_status: candidate.capability_rank === 'A' ? 'displayable' : 'partial',
    first_race_time_local: candidate.first_race_time_local,
    last_race_time_local: candidate.last_race_time_local,
    source_trace: sourceTrace(candidate, inputPath),
    freshness: freshness(candidate, artifact.retrieved_at),
    notes: candidate.capability_rank === 'A'
      ? 'Official TJK Race 1-N post times acquired from the current programme; public output remains capped at Rank A.'
      : 'Official TJK annual programme confirms meeting date and racecourse; race-level programme detail is not yet available.',
  };
}

function makeDetail(candidate, artifact, inputPath) {
  if (candidate.capability_rank !== 'A') return null;
  return {
    meeting_id: candidate.meeting_id,
    country_id: COUNTRY_ID,
    authority_id: AUTHORITY_ID,
    racecourse_id: candidate.racecourse_id,
    date: candidate.date,
    timezone: TIMEZONE,
    capability_rank: 'A',
    source_trace: sourceTrace(candidate, inputPath),
    freshness: freshness(candidate, artifact.retrieved_at),
    timetable_rows: candidate.timetable_rows.map((row) => ({
      label: `Race ${row.race_number}`,
      post_time_local: row.post_time_local,
      race_name: null,
      distance_m: null,
      surface: null,
      course_label: null,
      metadata_status: 'verified',
      source_label: null,
    })),
    summary_note: 'Official TJK Race 1-N post times only; A+ fields are intentionally not published under the reviewed TJK policy.',
  };
}

function makeIdentity(candidate) {
  const emptyCourse = () => ({
    turf_circumference_m: null,
    dirt_circumference_m: null,
    home_straight_m: null,
    has_inner_outer_courses: null,
    has_lighting: null,
    elevation_notes_en: null,
    elevation_notes_ja: null,
    course_notes_en: null,
    course_notes_ja: null,
  });
  const emptyDistance = () => ({ min_m: null, max_m: null, known_distances_m: [] });
  return {
    id: candidate.racecourse_id,
    slug: candidate.racecourse_id,
    country_id: COUNTRY_ID,
    name_en: candidate.racecourse_name_en,
    name_ja: candidate.racecourse_name_ja,
    name_local: candidate.racecourse,
    city: null,
    region: null,
    timezone: TIMEZONE,
    racing_types: [],
    status: 'active',
    surfaces: [],
    direction: 'unknown',
    course_profile: emptyCourse(),
    distance_profile: {
      turf: emptyDistance(), dirt: emptyDistance(), all_weather: emptyDistance(),
      jump: emptyDistance(), harness: emptyDistance(), upcoming_conditions: [],
    },
    schedule_summary: { today_status: 'unknown', next_meeting_date: null, upcoming_meetings: [], status: 'official-link-only', last_checked: null },
    notable_races: [],
    seasonality: {
      summary_en: 'Meeting dates must be confirmed through the public Calendar and official TJK sources.',
      summary_ja: '開催日は、公開カレンダーおよびTJK公式ソースで確認する必要がある。',
      status: 'unverified',
    },
    official_links: [{ label_en: 'TJK daily programme', label_ja: 'TJK公式競走プログラム', source_id: SOURCE_ID, url: candidate.source_url, link_type: 'official' }],
    related_terms: ['racecourse', 'meeting', 'fixture', 'post-time'],
    related_sources: [SOURCE_ID],
    data_status: { course_profile: 'unverified', schedule: 'official-link-only', source_status: 'link_first', last_checked: candidate.date },
    identity_status: 'verified_from_official_tjk_schedule',
    profile_status: 'identity_only',
    image_status: 'planned',
    image_path: null,
    image_alt_en: `Planned illustrative image for ${candidate.racecourse_name_en}.`,
    image_alt_ja: `${candidate.racecourse_name_ja}の説明用イメージ画像予定地。`,
    course_diagram_status: 'pending',
    image: {
      src: '',
      alt_en: `Planned illustrative image for ${candidate.racecourse_name_en}.`,
      alt_ja: `${candidate.racecourse_name_ja}の説明用イメージ画像予定地。`,
      image_type: 'placeholder',
      is_official_photo: false,
      note_en: 'Illustrative image. Not an official venue photo.',
      note_ja: '説明用のイメージ画像です。公式写真ではありません。',
      status: 'planned',
    },
  };
}

function sameIdentity(existing, candidate) {
  return existing.country_id === COUNTRY_ID && existing.authority_id === AUTHORITY_ID &&
    existing.racecourse_id === candidate.racecourse_id && existing.date === candidate.date && existing.timezone === TIMEZONE;
}

function sortRecords(records) {
  return records.sort((a, b) => `${a.date}:${a.country_id}:${a.racecourse_id}:${a.meeting_id}`.localeCompare(`${b.date}:${b.country_id}:${b.racecourse_id}:${b.meeting_id}`));
}

const { input, output } = parseArgs(process.argv.slice(2));
const artifact = readJson(input);
if (artifact.schema !== 'tjk_current_future_candidate_batch.v1') throw new Error(`unsupported TJK artifact schema: ${artifact.schema}`);
if (artifact.source !== 'tjk' || artifact.country !== 'Turkey' || artifact.timezone !== TIMEZONE) throw new Error('TJK artifact identity mismatch');
if (artifact.window?.days !== 30) throw new Error('TJK direct publication requires an exact 30-day window');
if (!Array.isArray(artifact.candidates) || artifact.candidates.length === 0) throw new Error('TJK official mother set is empty');
if (artifact.discovery?.official_fixture_count !== artifact.candidates.length) throw new Error('TJK annual official fixture count differs from candidate mother set');
if (artifact.candidates.some((x) => !x.meeting_id || !x.racecourse_id || !['C', 'A'].includes(x.capability_rank))) throw new Error('TJK candidate mother set contains an invalid record');

const officialIds = new Set();
for (const candidate of artifact.candidates) {
  if (officialIds.has(candidate.meeting_id)) throw new Error(`duplicate official TJK meeting id: ${candidate.meeting_id}`);
  officialIds.add(candidate.meeting_id);
  if (candidate.date < artifact.window.start_date || candidate.date >= artifact.window.end_date_exclusive) throw new Error(`${candidate.meeting_id} outside official 30-day window`);
  if (candidate.capability_rank === 'A') {
    if (!candidate.timetable_rows?.length || candidate.timetable_rows.some((row, index) => row.race_number !== index + 1)) throw new Error(`${candidate.meeting_id} has incomplete Race 1-N rows`);
  }
}

const meetingsDataset = readJson(CANONICAL_MEETINGS);
const detailsDataset = readJson(CANONICAL_DETAILS);
const meetingMap = new Map(meetingsDataset.meetings.map((x) => [x.meeting_id, x]));
const detailMap = new Map(detailsDataset.details.map((x) => [x.meeting_id, x]));
const outcomes = [];

for (const candidate of artifact.candidates) {
  const existing = meetingMap.get(candidate.meeting_id);
  if (existing && !sameIdentity(existing, candidate)) throw new Error(`${candidate.meeting_id} canonical identity collision`);

  if (existing && rankAtLeast(existing.capability_rank, candidate.capability_rank) && existing.capability_rank !== 'C' && candidate.capability_rank === 'C') {
    outcomes.push({ meeting_id: candidate.meeting_id, outcome: 'preserved_higher_official_detail', official_rank: 'C', public_candidate_rank: existing.capability_rank });
    continue;
  }

  const nextMeeting = makeMeeting(candidate, artifact, input);
  const nextDetail = makeDetail(candidate, artifact, input);
  const changed = JSON.stringify(existing ?? null) !== JSON.stringify(nextMeeting) || JSON.stringify(detailMap.get(candidate.meeting_id) ?? null) !== JSON.stringify(nextDetail);
  meetingMap.set(candidate.meeting_id, nextMeeting);
  if (nextDetail) detailMap.set(candidate.meeting_id, nextDetail);
  else detailMap.delete(candidate.meeting_id);
  outcomes.push({ meeting_id: candidate.meeting_id, outcome: changed ? 'update' : 'no_op', official_rank: candidate.capability_rank, public_candidate_rank: candidate.capability_rank });
}

const removedStale = [];
for (const [meetingId, meeting] of [...meetingMap.entries()]) {
  if (meeting.country_id !== COUNTRY_ID || meeting.authority_id !== AUTHORITY_ID) continue;
  if (meeting.date < artifact.window.start_date || meeting.date >= artifact.window.end_date_exclusive) continue;
  if (officialIds.has(meetingId)) continue;
  meetingMap.delete(meetingId);
  detailMap.delete(meetingId);
  removedStale.push(meetingId);
}

const generatedAt = artifact.retrieved_at;
writeJson(CANONICAL_MEETINGS, {
  ...meetingsDataset,
  generated_at: generatedAt,
  input_sources: [...new Set([...(meetingsDataset.input_sources ?? []), input])].sort(),
  meetings: sortRecords([...meetingMap.values()]),
});
writeJson(CANONICAL_DETAILS, {
  ...detailsDataset,
  generated_at: generatedAt,
  input_sources: [...new Set([...(detailsDataset.input_sources ?? []), input])].sort(),
  details: sortRecords([...detailMap.values()]),
});

const identities = readJson(RACECOURSE_IDENTITIES);
const identityIds = new Set(identities.map((x) => x.id));
const identitiesAdded = [];
for (const candidate of artifact.candidates) {
  if (identityIds.has(candidate.racecourse_id)) continue;
  identities.push(makeIdentity(candidate));
  identityIds.add(candidate.racecourse_id);
  identitiesAdded.push(candidate.racecourse_id);
}
identities.sort((a, b) => a.id.localeCompare(b.id));
writeJson(RACECOURSE_IDENTITIES, identities);

const reconciliation = {
  schema_version: 'tjk-zero-based-30d-reconciliation-v1',
  generated_at: generatedAt,
  window: artifact.window,
  official_fixture_count: artifact.candidates.length,
  official_rank_counts: artifact.discovery.rank_counts,
  detail_status_counts: artifact.discovery.detail_status_counts,
  official_meeting_ids: [...officialIds].sort(),
  outcomes,
  removed_stale_public_candidates: removedStale.sort(),
  identities_added: identitiesAdded.sort(),
  complete: true,
};
writeJson(output, reconciliation);
console.log(JSON.stringify({
  window: artifact.window,
  official_fixture_count: artifact.candidates.length,
  official_rank_counts: artifact.discovery.rank_counts,
  outcomes: Object.fromEntries([...new Set(outcomes.map((x) => x.outcome))].map((name) => [name, outcomes.filter((x) => x.outcome === name).length])),
  removed_stale: removedStale.length,
  identities_added: identitiesAdded.length,
  complete: true,
}, null, 2));