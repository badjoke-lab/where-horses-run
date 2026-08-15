import { validateArtifact } from '../check-tjk-current-future-candidates.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;
const CANDIDATE_SCHEMA = 'timetable-candidate-v1';
const ADAPTER_ID = 'tjk-scheduled-current-future-rank-c-v1';

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function nextDay(isoDate) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  invariant(!Number.isNaN(date.valueOf()), `invalid date: ${isoDate}`);
  return new Date(date.valueOf() + DAY_MS).toISOString().slice(0, 10);
}

function safeUrl(value, field) {
  const url = new URL(value);
  invariant(url.protocol === 'https:' && url.hostname === 'www.tjk.org', `${field} must stay on official TJK HTTPS`);
  invariant(!url.username && !url.password, `${field} must not contain credentials`);
  for (const key of url.searchParams.keys()) {
    invariant(!/^(token|access_token|api_key|apikey|secret|password|authorization)$/i.test(key), `${field} contains a sensitive query parameter`);
  }
  return url.toString();
}

export function buildTjkScheduledRankCCandidate(batch, { today } = {}) {
  invariant(typeof today === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(today), 'explicit Turkey run date is required');
  invariant(batch?.effective_today === today, 'source batch effective_today must match the explicit Turkey run date');
  validateArtifact(batch, { today });
  const dates = batch.candidates.map((candidate) => candidate.date).sort();
  const startDate = dates[0] ?? today;
  const endDateExclusive = nextDay(dates.at(-1) ?? today);

  const records = batch.candidates.map((candidate) => {
    const sourceVenueId = String(candidate.racecourse_source_id);
    const meetingId = `tjk-source-venue-${sourceVenueId}-${candidate.date}`;
    return {
      candidate_id: `candidate-${meetingId}`,
      meeting_id: meetingId,
      country_id: 'turkey',
      authority_id: 'turkiye-jokey-kulubu',
      racing_system_id: 'tjk-national-racing-system',
      source_venue_id: sourceVenueId,
      source_venue_label: candidate.racecourse,
      public_racecourse_identity_status: 'unregistered-not-authorized-by-scheduled-discovery',
      date: candidate.date,
      timezone: 'Europe/Istanbul',
      candidate_rank: 'C',
      technical_capability_rank: 'A+',
      publication_ceiling: 'C',
      first_race_time_local: null,
      last_race_time_local: null,
      timetable_rows: [],
      source: {
        source_id: 'tjk-daily-programme',
        official_url: safeUrl(candidate.source_url, 'candidate.source_url'),
        discovered_from: safeUrl(candidate.provenance.discovered_from, 'candidate.provenance.discovered_from'),
        discovery_method: candidate.provenance.discovery_method,
        checked_at: batch.retrieved_at,
        extraction_method: 'official_page_discovered_venue_identity_only',
      },
      confidence: 'high',
      review_status: 'pending',
      notes: 'Scheduled dry-run candidate limited to Rank C meeting date + source-authority venue identity. Race times/details require a separate reviewed evidence path.',
    };
  }).sort((a, b) => a.date.localeCompare(b.date) || Number(a.source_venue_id) - Number(b.source_venue_id));

  return {
    schema_version: CANDIDATE_SCHEMA,
    generated_at: batch.retrieved_at,
    adapter_id: ADAPTER_ID,
    country_id: 'turkey',
    authority_id: 'turkiye-jokey-kulubu',
    source_id: 'tjk-daily-programme',
    technical_capability_rank: 'A+',
    candidate_rank: 'C',
    publication_ceiling: 'C',
    candidate_window: {
      start_date: startDate,
      end_date_exclusive: endDateExclusive,
      timezone: 'Europe/Istanbul',
    },
    source_batch: {
      schema: batch.schema,
      entry_url: safeUrl(batch.entry_url, 'batch.entry_url'),
      effective_today: batch.effective_today,
      retrieved_at: batch.retrieved_at,
      candidate_count: records.length,
      raw_body_retained: false,
    },
    records,
    review: {
      status: 'pending',
      reviewed_at: null,
      reviewer: null,
      summary: 'Scheduled TJK discovery output. Human review required; no Canonical/public write is authorized.',
      promotion_target: 'separate-human-reviewed-promotion-unit',
    },
    publication_effect: 'none',
  };
}

export function validateTjkScheduledRankCCandidate(candidate) {
  invariant(candidate?.schema_version === CANDIDATE_SCHEMA, 'unexpected candidate schema');
  invariant(candidate?.adapter_id === ADAPTER_ID, 'unexpected scheduled TJK adapter');
  invariant(candidate?.country_id === 'turkey' && candidate?.authority_id === 'turkiye-jokey-kulubu', 'unexpected country/authority');
  invariant(candidate?.candidate_rank === 'C' && candidate?.publication_ceiling === 'C', 'scheduled TJK candidate must remain Rank C');
  invariant(candidate?.technical_capability_rank === 'A+', 'TJK technical capability metadata must remain A+');
  invariant(candidate?.review?.status === 'pending', 'scheduled TJK candidate must remain pending human review');
  invariant(candidate?.publication_effect === 'none', 'scheduled TJK candidate publication effect must be none');
  invariant(candidate?.source_batch?.raw_body_retained === false, 'raw source body must not be retained');
  invariant(Array.isArray(candidate?.records), 'candidate records must be an array');

  const ids = new Set();
  for (const record of candidate.records) {
    invariant(record.candidate_rank === 'C' && record.publication_ceiling === 'C', 'record rank must remain C');
    invariant(record.first_race_time_local === null && record.last_race_time_local === null, 'Rank C record must not expose race times');
    invariant(Array.isArray(record.timetable_rows) && record.timetable_rows.length === 0, 'Rank C record must not expose timetable rows');
    invariant(record.review_status === 'pending', 'record review_status must remain pending');
    invariant(record.public_racecourse_identity_status === 'unregistered-not-authorized-by-scheduled-discovery', 'scheduled discovery must not authorize public racecourse identity');
    invariant(!ids.has(record.candidate_id), `duplicate candidate_id: ${record.candidate_id}`);
    ids.add(record.candidate_id);
    safeUrl(record.source.official_url, 'record.source.official_url');
    safeUrl(record.source.discovered_from, 'record.source.discovered_from');
  }
  return { ok: true, records: candidate.records.length };
}
