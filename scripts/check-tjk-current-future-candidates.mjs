import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import {
  ENTRY_URL,
  SCHEMA,
  isProgrammeCityUrl,
  parseTjkDate,
  turkeyDate,
} from './timetable/tjk-current-future-candidates.mjs';

const FORBIDDEN_PAYLOAD_KEYS = new Set(['raw_html', 'html', 'raw_body', 'body', 'racecard', 'racecards', 'odds', 'results', 'payouts', 'tips']);

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

export function validateArtifact(artifact, { today = turkeyDate() } = {}) {
  assert(artifact && typeof artifact === 'object' && !Array.isArray(artifact), 'artifact must be an object');
  assert(artifact.schema === SCHEMA, `unsupported schema: ${artifact.schema ?? '<missing>'}`);
  assert(artifact.source === 'tjk', 'source must be tjk');
  assert(artifact.country === 'Turkey', 'country must be Turkey');
  assert(artifact.entry_url === ENTRY_URL, 'entry_url must be the official TJK programme index');
  assert(artifact.raw_body_retained === false, 'raw_body_retained must be false');
  assert(artifact.disposition?.target === 'candidate_only', 'target must be candidate_only');
  assert(artifact.disposition?.requires_review === true, 'requires_review must be true');
  assert(artifact.disposition?.canonical_write === false, 'canonical_write must be false');
  assert(artifact.disposition?.public_write === false, 'public_write must be false');
  assert(Array.isArray(artifact.candidates), 'candidates must be an array');
  scanForbiddenPayload(artifact);

  const ids = new Set();
  const urls = new Set();
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
    assert(typeof candidate.racecourse_source_id === 'string' && /^\d+$/.test(candidate.racecourse_source_id), `${prefix}.racecourse_source_id invalid`);

    let sourceUrl;
    let discoveredFrom;
    try {
      sourceUrl = new URL(candidate.source_url);
      discoveredFrom = new URL(candidate.provenance?.discovered_from);
    } catch {
      throw new Error(`${prefix} has invalid provenance/source URL`);
    }
    assert(isProgrammeCityUrl(sourceUrl), `${prefix}.source_url must be an official TJK city programme URL`);
    assert(discoveredFrom.protocol === 'https:' && discoveredFrom.hostname === 'www.tjk.org' && /\/Info\/Page\/GunlukYarisProgrami$/i.test(discoveredFrom.pathname), `${prefix}.provenance.discovered_from invalid`);
    assert(typeof candidate.provenance?.discovered_href === 'string' && candidate.provenance.discovered_href.length > 0, `${prefix}.provenance.discovered_href missing`);
    assert(candidate.provenance?.discovery_method === 'official_programme_index_anchor', `${prefix}.provenance.discovery_method invalid`);

    const resolved = new URL(candidate.provenance.discovered_href, candidate.provenance.discovered_from);
    assert(resolved.href === sourceUrl.href, `${prefix}.source_url was not resolved from discovered_href`);
    assert(sourceUrl.searchParams.get('SehirAdi') === candidate.racecourse, `${prefix}.racecourse does not match source URL`);
    assert(sourceUrl.searchParams.get('SehirId') === candidate.racecourse_source_id, `${prefix}.racecourse_source_id does not match source URL`);
    const sourceDate = parseTjkDate(sourceUrl.searchParams.get('QueryParameter_Tarih'));
    assert(sourceDate === candidate.date, `${prefix}.date does not match source URL`);
    assert(!urls.has(sourceUrl.href), `${prefix} duplicate source_url`);
    urls.add(sourceUrl.href);
  }

  return { ok: true, candidates: artifact.candidates.length, today };
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
