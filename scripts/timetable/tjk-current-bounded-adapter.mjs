import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const DEFAULT_REVALIDATION = path.join(ROOT, 'docs/timetable-source-tests/03-turkey/revalidation-2026-08-12.json');
export const DEFAULT_OUTPUT = path.join(ROOT, 'data/candidates/tjk-current-bounded-2026-08-11-v1.json');

const CURRENT_ROUTE = '/TR/YarisSever/Info/Page/GunlukYarisProgrami';
const VENUE_DETAIL_ROUTE = '/TR/YarisSever/Info/Sehir/GunlukYarisProgrami';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function formatDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) throw new Error(`invalid TJK programme date: ${isoDate}`);
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function makeLandingUrl(revalidation, meeting) {
  const url = new URL(revalidation.official_sources.daily_programme_landing);
  if (url.origin !== 'https://www.tjk.org' || url.pathname !== CURRENT_ROUTE) {
    throw new Error('TJK current landing route mismatch');
  }
  url.searchParams.set('QueryParameter_Tarih', formatDate(revalidation.current_observation.programme_date));
  url.searchParams.set('SehirAdi', meeting.racecourse);
  url.searchParams.set('SehirId', String(meeting.city_id));
  return url.toString();
}

function validateRevalidation(revalidation) {
  if (revalidation?.schema_version !== 'tjk-source-revalidation-v2') throw new Error('unexpected TJK revalidation schema');
  if (revalidation?.authority_id !== 'turkiye-jokey-kulubu') throw new Error('unexpected TJK authority');
  if (revalidation?.system_id !== 'tjk-national-racing-system') throw new Error('unexpected TJK racing system');
  if (revalidation?.status !== 'verified_with_page_discovered_venue_detail') throw new Error('current TJK programme evidence is not verified');
  if (revalidation?.technical_capability_rank !== 'A+') throw new Error('TJK technical capability must remain A+');
  if (revalidation?.public_ceiling !== 'A') throw new Error('TJK public ceiling must remain A');
  if (revalidation?.route_topology?.landing_route !== CURRENT_ROUTE) throw new Error('TJK adapter entrypoint must remain Info/Page');
  if (revalidation?.route_topology?.landing_route_verified !== true) throw new Error('TJK landing route must be verified');
  if (revalidation?.route_topology?.landing_exposes_current_venue_detail_links !== true) throw new Error('TJK landing must expose current venue-detail links');
  if (revalidation?.route_topology?.venue_detail_route !== VENUE_DETAIL_ROUTE) throw new Error('TJK venue-detail route mismatch');
  if (revalidation?.route_topology?.venue_detail_route_source !== 'discovered_from_current_landing_body') throw new Error('TJK venue-detail route must remain landing-discovered');
  if (revalidation?.current_observation?.parameterized_daily_body_verified !== true) throw new Error('TJK current programme evidence must remain verified');
  if (revalidation?.current_observation?.raw_body_retained !== false) throw new Error('TJK raw body must not be retained');
  if (revalidation?.decision?.current_schedule_capture_status !== 'verified') throw new Error('TJK current schedule capture must remain verified');
  if (revalidation?.decision?.canonical_write !== false || revalidation?.decision?.public_projection_write !== false || revalidation?.decision?.deployment !== false) {
    throw new Error('TJK current evidence must remain non-publication evidence');
  }
}

export function buildTjkCurrentBoundedCandidate({ revalidationPath = DEFAULT_REVALIDATION } = {}) {
  const revalidation = readJson(revalidationPath);
  validateRevalidation(revalidation);

  const programmeDate = revalidation.current_observation.programme_date;
  const meetings = revalidation.current_observation.meetings;
  if (!Array.isArray(meetings) || meetings.length !== 2) throw new Error('expected two reviewed current TJK meetings');

  const records = meetings.map((meeting) => {
    const rows = meeting.race_schedule.map((row) => ({
      race_number: Number(row.race_number),
      post_time_local: row.post_time_local,
    }));
    if (rows.length !== Number(meeting.race_count)) throw new Error(`TJK current race count mismatch: ${meeting.racecourse}`);
    rows.forEach((row, index) => {
      if (row.race_number !== index + 1) throw new Error(`non-contiguous current Race 1-N evidence: ${meeting.racecourse}`);
      if (!/^\d{2}:\d{2}$/.test(row.post_time_local)) throw new Error(`invalid TJK post time: ${meeting.racecourse} Race ${row.race_number}`);
    });
    if (rows[0]?.post_time_local !== meeting.first_post_time_local || rows.at(-1)?.post_time_local !== meeting.last_post_time_local) {
      throw new Error(`TJK first/last post mismatch: ${meeting.racecourse}`);
    }

    const sourceVenueId = String(meeting.city_id);
    const meetingId = `tjk-source-venue-${sourceVenueId}-${programmeDate}`;
    return {
      candidate_id: `candidate-${meetingId}`,
      meeting_id: meetingId,
      country_id: 'turkey',
      authority_id: 'turkiye-jokey-kulubu',
      racing_system_id: 'tjk-national-racing-system',
      source_venue_id: sourceVenueId,
      source_venue_label: meeting.racecourse,
      public_racecourse_identity_status: 'unregistered-not-authorized-by-evidence-unit',
      date: programmeDate,
      timezone: 'Europe/Istanbul',
      candidate_rank: 'A',
      technical_capability_rank: 'A+',
      publication_ceiling: 'A',
      first_race_time_local: rows[0].post_time_local,
      last_race_time_local: rows.at(-1).post_time_local,
      timetable_rows: rows,
      source: {
        source_id: 'tjk-daily-programme',
        landing_url: makeLandingUrl(revalidation, meeting),
        checked_at: revalidation.checked_date,
        extraction_method: 'reviewed_current_programme_evidence',
        venue_detail_discovery_rule: 'same-date same-city Info/Sehir link emitted by the verified current Info/Page landing response',
      },
      confidence: 'high',
      review_status: 'pending',
      notes: 'Current reviewed TJK schedule candidate. Source authority venue identity is preserved; no WHR public racecourse identity is created or authorized by this unit.',
    };
  }).sort((a, b) => Number(a.source_venue_id) - Number(b.source_venue_id));

  const raceCount = records.reduce((sum, record) => sum + record.timetable_rows.length, 0);
  return {
    schema_version: 'timetable-candidate-v1',
    generated_at: `${revalidation.checked_date}T00:00:00Z`,
    adapter_id: 'tjk-current-bounded-2026-08-11-v1',
    country_id: 'turkey',
    authority_id: 'turkiye-jokey-kulubu',
    source_id: 'tjk-daily-programme',
    technical_capability_rank: 'A+',
    candidate_rank: 'A',
    publication_ceiling: 'A',
    candidate_window: {
      start_date: programmeDate,
      end_date_exclusive: '2026-08-12',
      timezone: 'Europe/Istanbul',
    },
    reviewed_evidence: {
      source_revalidation: path.relative(ROOT, revalidationPath),
      probe_run_id: revalidation.evidence.probe_run_id,
      probe_artifact_id: revalidation.evidence.probe_artifact_id,
      probe_artifact_sha256: revalidation.evidence.probe_artifact_sha256,
      meeting_count: records.length,
      race_count: raceCount,
      raw_body_retained: false,
    },
    records,
    review: {
      status: 'pending',
      reviewed_at: null,
      reviewer: null,
      summary: 'Candidate-only current TJK bounded adapter output from reviewed 2026-08-11 programme evidence. No Canonical/public write is authorized.',
      promotion_target: 'separate-human-reviewed-current-promotion-unit',
    },
    publication_effect: 'none',
  };
}

export function loadTjkCurrentBoundedCandidate() {
  return buildTjkCurrentBoundedCandidate();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = loadTjkCurrentBoundedCandidate();
  const check = process.argv.includes('--check');
  if (check) {
    const committed = readJson(DEFAULT_OUTPUT);
    if (JSON.stringify(output) !== JSON.stringify(committed)) throw new Error('committed current TJK candidate differs from deterministic adapter output');
  } else {
    fs.mkdirSync(path.dirname(DEFAULT_OUTPUT), { recursive: true });
    fs.writeFileSync(DEFAULT_OUTPUT, `${JSON.stringify(output, null, 2)}\n`);
  }
  console.log(`TJK_CURRENT_BOUNDED_ADAPTER: ${check ? 'check-pass' : 'written'}`);
  console.log(`CANDIDATE_MEETINGS: ${output.records.length}`);
  console.log(`CANDIDATE_RACES: ${output.reviewed_evidence.race_count}`);
  console.log('CANDIDATE_RANK: A');
  console.log('TECHNICAL_CAPABILITY: A+');
  console.log('PUBLICATION_EFFECT: none');
}
