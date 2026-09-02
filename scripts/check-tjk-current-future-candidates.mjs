import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import {
  ENTRY_URL,
  SCHEMA,
  TIMEZONE,
  isProgrammeCityUrl,
  isProgrammeIndexUrl,
  parseTjkDate,
  turkeyDate,
} from './timetable/tjk-current-future-candidates.mjs';
import { ANNUAL_PAGE_URL, DOMESTIC_TJK_VENUES } from './timetable/tjk-annual-fixture-discovery.mjs';

const FORBIDDEN_PAYLOAD_KEYS = new Set(['raw_html', 'html', 'raw_body', 'body', 'racecard', 'racecards', 'odds', 'results', 'payouts', 'tips']);
const ALLOWED_RANKS = new Set(['C', 'A']);
const DETAIL_STATUSES = new Set(['available', 'not_published', 'conflict', 'source_error']);
const DISCOVERY_METHODS = new Set([
  'official_programme_page_anchors_plus_page_discovered_detail',
  'official_annual_programme_fixture_union_daily_detail',
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function scanForbiddenPayload(value, path = '$') {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForbiddenPayload(item, `${path}[${index}]`));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    assert(!FORBIDDEN_PAYLOAD_KEYS.has(key.toLowerCase()), `forbidden retained payload key at ${path}.${key}`);
    scanForbiddenPayload(child, `${path}.${key}`);
  }
}

function validTime(value) {
  return typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function validateLegacyProvenance(candidate, sourceUrl, prefix) {
  let discoveredFrom;
  try {
    discoveredFrom = new URL(candidate.provenance?.discovered_from);
  } catch {
    throw new Error(`${prefix} has invalid legacy discovery URL`);
  }
  assert(isProgrammeCityUrl(sourceUrl), `${prefix}.source_url must be a TJK venue-detail URL`);
  assert(isProgrammeIndexUrl(discoveredFrom), `${prefix}.provenance.discovered_from must be a TJK programme page`);
  assert(candidate.provenance?.discovery_method === 'official_page_discovered_venue_detail', `${prefix}.provenance.discovery_method invalid`);
  const resolved = new URL(candidate.provenance.discovered_href, candidate.provenance.discovered_from);
  assert(resolved.href === sourceUrl.href, `${prefix}.source_url was not resolved from discovered_href`);
}

function validateAnnualProvenance(candidate, sourceUrl, prefix) {
  assert(candidate.provenance?.discovery_method === 'official_annual_programme_fixture', `${prefix}.annual discovery method invalid`);
  assert(candidate.provenance?.discovered_from === ANNUAL_PAGE_URL, `${prefix}.annual discovered_from invalid`);
  assert(typeof candidate.provenance?.discovered_href === 'string' && candidate.provenance.discovered_href.length > 0, `${prefix}.annual discovered_href missing`);
  const annualFixtureUrl = new URL(candidate.provenance.discovered_href, ANNUAL_PAGE_URL);
  assert(isProgrammeIndexUrl(annualFixtureUrl), `${prefix}.annual fixture must resolve to TJK daily programme page`);
  assert(annualFixtureUrl.searchParams.get('SehirId') === candidate.racecourse_source_id, `${prefix}.annual fixture SehirId differs`);
  assert(parseTjkDate(annualFixtureUrl.searchParams.get('QueryParameter_Tarih')) === candidate.date, `${prefix}.annual fixture date differs`);

  if (candidate.provenance?.detail_discovered_href) {
    assert(candidate.provenance.detail_discovery_method === 'official_page_discovered_venue_detail', `${prefix}.detail discovery method invalid`);
    const detailUrl = new URL(candidate.provenance.detail_discovered_href, candidate.provenance.detail_discovered_from);
    assert(detailUrl.href === sourceUrl.href, `${prefix}.detail source_url differs from discovered detail href`);
    assert(isProgrammeCityUrl(sourceUrl), `${prefix}.discovered detail must be TJK venue-detail URL`);
  } else {
    assert(sourceUrl.href === annualFixtureUrl.href, `${prefix}.schedule-only source_url must remain annual fixture daily URL`);
  }
}

export function validateArtifact(artifact, { today = turkeyDate() } = {}) {
  assert(artifact && typeof artifact === 'object' && !Array.isArray(artifact), 'artifact must be an object');
  assert(artifact.schema === SCHEMA, `unsupported schema: ${artifact.schema ?? '<missing>'}`);
  assert(artifact.source === 'tjk', 'source must be tjk');
  assert(artifact.country === 'Turkey', 'country must be Turkey');
  assert(artifact.timezone === TIMEZONE, `timezone must be ${TIMEZONE}`);
  assert(artifact.entry_url === ENTRY_URL, 'entry_url must be the current TJK YarisSever programme landing');
  assert(artifact.effective_today === today, 'effective_today must match the validated Turkey date');
  assert(artifact.technical_capability_rank === 'A+', 'technical_capability_rank must remain A+');
  assert(artifact.publication_ceiling === 'A', 'publication_ceiling must remain A');
  assert(artifact.collection_target_rank === 'best_available', 'collection_target_rank must be best_available');
  assert(artifact.raw_body_retained === false, 'raw_body_retained must be false');
  assert(artifact.disposition?.target === 'candidate_only', 'target must be candidate_only');
  assert(artifact.disposition?.requires_review === true, 'requires_review must be true');
  assert(artifact.disposition?.canonical_write === false, 'canonical_write must be false');
  assert(artifact.disposition?.public_write === false, 'public_write must be false');
  assert(DISCOVERY_METHODS.has(artifact.discovery?.method), 'discovery.method invalid');
  assert(Array.isArray(artifact.candidates), 'candidates must be an array');
  scanForbiddenPayload(artifact);

  const ids = new Set();
  const urls = new Set();
  let rankC = 0;
  let rankA = 0;
  for (const [index, candidate] of artifact.candidates.entries()) {
    const prefix = `candidates[${index}]`;
    assert(candidate.source === 'tjk', `${prefix}.source must be tjk`);
    assert(candidate.country === 'Turkey', `${prefix}.country must be Turkey`);
    assert(typeof candidate.candidate_id === 'string' && candidate.candidate_id.length > 0, `${prefix}.candidate_id missing`);
    assert(!ids.has(candidate.candidate_id), `${prefix} duplicate candidate_id`);
    ids.add(candidate.candidate_id);

    assert(parseTjkDate(candidate.date?.split('-').reverse().join('/')) === candidate.date, `${prefix}.date invalid`);
    assert(candidate.date >= today, `${prefix}.date is in the past`);
    assert(typeof candidate.racecourse === 'string' && candidate.racecourse.length > 0, `${prefix}.racecourse missing`);
    assert(typeof candidate.racecourse_source_id === 'string' && DOMESTIC_TJK_VENUES.has(candidate.racecourse_source_id), `${prefix}.racecourse_source_id must be a reviewed domestic TJK venue`);
    assert(ALLOWED_RANKS.has(candidate.capability_rank), `${prefix}.capability_rank must be C or A`);
    assert(candidate.publication_ceiling === 'A', `${prefix}.publication_ceiling must be A`);
    assert(Array.isArray(candidate.timetable_rows), `${prefix}.timetable_rows must be an array`);
    assert(DETAIL_STATUSES.has(candidate.detail_observation?.status), `${prefix}.detail_observation.status invalid`);

    if (candidate.capability_rank === 'A') {
      rankA += 1;
      assert(candidate.detail_observation.status === 'available', `${prefix} A requires available detail`);
      assert(candidate.timetable_rows.length > 0, `${prefix} A requires timetable rows`);
      assert(validTime(candidate.first_race_time_local) && validTime(candidate.last_race_time_local), `${prefix} A requires first/last times`);
      assert(candidate.first_race_time_local === candidate.timetable_rows[0].post_time_local, `${prefix}.first_race_time_local differs`);
      assert(candidate.last_race_time_local === candidate.timetable_rows.at(-1).post_time_local, `${prefix}.last_race_time_local differs`);
      candidate.timetable_rows.forEach((row, rowIndex) => {
        assert(row.race_number === rowIndex + 1, `${prefix}.timetable_rows must be contiguous Race 1-N`);
        assert(validTime(row.post_time_local), `${prefix}.timetable_rows[${rowIndex}].post_time_local invalid`);
      });
    } else {
      rankC += 1;
      assert(candidate.first_race_time_local === null && candidate.last_race_time_local === null, `${prefix} C must not expose race times`);
      assert(candidate.timetable_rows.length === 0, `${prefix} C must not expose timetable rows`);
      assert(candidate.detail_observation.status !== 'available', `${prefix} C cannot claim available detail`);
    }

    let sourceUrl;
    try {
      sourceUrl = new URL(candidate.source_url);
    } catch {
      throw new Error(`${prefix} has invalid source URL`);
    }
    if (candidate.provenance?.discovery_method === 'official_annual_programme_fixture') {
      validateAnnualProvenance(candidate, sourceUrl, prefix);
    } else {
      validateLegacyProvenance(candidate, sourceUrl, prefix);
    }
    assert(sourceUrl.searchParams.get('SehirAdi') === candidate.racecourse, `${prefix}.racecourse does not match source URL`);
    assert(sourceUrl.searchParams.get('SehirId') === candidate.racecourse_source_id, `${prefix}.racecourse_source_id does not match source URL`);
    const sourceDate = parseTjkDate(sourceUrl.searchParams.get('QueryParameter_Tarih'));
    assert(sourceDate === candidate.date, `${prefix}.date does not match source URL`);
    assert(!urls.has(sourceUrl.href), `${prefix} duplicate source_url`);
    urls.add(sourceUrl.href);
  }

  assert(artifact.discovery?.detail_pages_attempted === artifact.candidates.length, 'detail_pages_attempted must equal candidate count');
  assert(artifact.discovery?.rank_counts?.C === rankC, 'discovery rank_counts.C differs');
  assert(artifact.discovery?.rank_counts?.A === rankA, 'discovery rank_counts.A differs');
  if (artifact.discovery?.method === 'official_annual_programme_fixture_union_daily_detail') {
    assert(artifact.discovery.official_fixture_count === artifact.candidates.length, 'official_fixture_count must equal candidate count');
    assert(artifact.discovery.schedule_source_id === 'tjk-annual-programme', 'schedule_source_id invalid');
    assert(artifact.discovery.schedule_source_url === ANNUAL_PAGE_URL, 'schedule_source_url invalid');
  }
  return { ok: true, candidates: artifact.candidates.length, rank_counts: { C: rankC, A: rankA }, today };
}

function main() {
  const file = process.argv[2];
  if (!file) throw new Error('Usage: node scripts/check-tjk-current-future-candidates.mjs <artifact.json>');
  const artifact = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(JSON.stringify(validateArtifact(artifact), null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}
