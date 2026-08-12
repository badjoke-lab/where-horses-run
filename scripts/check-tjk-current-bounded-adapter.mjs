import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadTjkCurrentBoundedCandidate } from './timetable/tjk-current-bounded-adapter.mjs';

const candidatePath = 'data/candidates/tjk-current-bounded-2026-08-11-v1.json';
const committed = JSON.parse(fs.readFileSync(candidatePath, 'utf8'));
const first = loadTjkCurrentBoundedCandidate();
const second = loadTjkCurrentBoundedCandidate();

assert.deepEqual(first, second, 'current TJK bounded adapter must be deterministic');
assert.deepEqual(first, committed, 'committed current TJK candidate differs from deterministic adapter output');
assert.equal(first.schema_version, 'timetable-candidate-v1');
assert.equal(first.adapter_id, 'tjk-current-bounded-2026-08-11-v1');
assert.equal(first.country_id, 'turkey');
assert.equal(first.authority_id, 'turkiye-jokey-kulubu');
assert.equal(first.source_id, 'tjk-daily-programme');
assert.equal(first.technical_capability_rank, 'A+');
assert.equal(first.candidate_rank, 'A');
assert.equal(first.publication_ceiling, 'A');
assert.equal(first.publication_effect, 'none');
assert.equal(first.review.status, 'pending');
assert.equal(first.review.promotion_target, 'separate-human-reviewed-current-promotion-unit');
assert.equal(first.records.length, 2, 'expected two reviewed current TJK meetings');
assert.equal(first.reviewed_evidence.meeting_count, 2);
assert.equal(first.reviewed_evidence.race_count, 18, 'expected 18 reviewed current TJK races');
assert.equal(first.reviewed_evidence.raw_body_retained, false);
assert.equal(first.candidate_window.start_date, '2026-08-11');
assert.equal(first.candidate_window.end_date_exclusive, '2026-08-12');

const expected = new Map([
  ['5', { label: 'Ankara', first: '14:00', last: '18:00', times: ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'] }],
  ['9', { label: 'Kocaeli', first: '17:15', last: '21:30', times: ['17:15', '17:45', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'] }],
]);

const forbiddenKeyFragments = [
  'horse', 'runner', 'participant', 'jockey', 'trainer', 'weight', 'odds', 'bet',
  'result', 'payout', 'prediction', 'stream', 'raw_html', 'raw_source', 'full_racecard',
  'distance', 'surface',
];

function walkKeys(value, trail = []) {
  if (Array.isArray(value)) return value.forEach((entry, index) => walkKeys(entry, [...trail, String(index)]));
  if (!value || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) {
    const normalized = key.toLowerCase();
    assert.ok(!forbiddenKeyFragments.some((fragment) => normalized.includes(fragment)), `forbidden current TJK candidate key: ${[...trail, key].join('.')}`);
    walkKeys(entry, [...trail, key]);
  }
}

const seen = new Set();
for (const record of first.records) {
  assert.ok(!seen.has(record.meeting_id), `duplicate current TJK meeting_id: ${record.meeting_id}`);
  seen.add(record.meeting_id);
  const expectedMeeting = expected.get(record.source_venue_id);
  assert.ok(expectedMeeting, `unexpected current TJK source venue id: ${record.source_venue_id}`);
  assert.equal(record.source_venue_label, expectedMeeting.label);
  assert.ok(!Object.hasOwn(record, 'racecourse_id'), 'current TJK candidate must not invent a WHR public racecourse_id');
  assert.equal(record.public_racecourse_identity_status, 'unregistered-not-authorized-by-evidence-unit');
  assert.equal(record.country_id, 'turkey');
  assert.equal(record.authority_id, 'turkiye-jokey-kulubu');
  assert.equal(record.racing_system_id, 'tjk-national-racing-system');
  assert.equal(record.date, '2026-08-11');
  assert.equal(record.timezone, 'Europe/Istanbul');
  assert.equal(record.candidate_rank, 'A');
  assert.equal(record.technical_capability_rank, 'A+');
  assert.equal(record.publication_ceiling, 'A');
  assert.equal(record.review_status, 'pending');
  assert.equal(record.first_race_time_local, expectedMeeting.first);
  assert.equal(record.last_race_time_local, expectedMeeting.last);
  assert.deepEqual(record.timetable_rows.map((row) => row.post_time_local), expectedMeeting.times);
  record.timetable_rows.forEach((row, index) => {
    assert.deepEqual(Object.keys(row), ['race_number', 'post_time_local'], `A-ceiling current TJK row leaked extra fields for ${record.meeting_id}`);
    assert.equal(row.race_number, index + 1, `non-contiguous Race 1-N for ${record.meeting_id}`);
    assert.match(row.post_time_local, /^\d{2}:\d{2}$/, `invalid post time for ${record.meeting_id}`);
  });
  assert.equal(record.source.source_id, 'tjk-daily-programme');
  assert.equal(record.source.extraction_method, 'reviewed_current_programme_evidence');
  assert.match(record.source.venue_detail_discovery_rule, /same-date same-city Info\/Sehir link emitted by the verified current Info\/Page landing response/);
  const url = new URL(record.source.landing_url);
  assert.equal(url.origin, 'https://www.tjk.org');
  assert.equal(url.pathname, '/TR/YarisSever/Info/Page/GunlukYarisProgrami');
  assert.equal(url.searchParams.get('QueryParameter_Tarih'), '11/08/2026');
  assert.equal(url.searchParams.get('SehirAdi'), expectedMeeting.label);
  assert.equal(url.searchParams.get('SehirId'), record.source_venue_id);
  assert.ok(!record.source.landing_url.includes('/Info/Sehir/'), 'current TJK adapter must not hard-code Info/Sehir as its entrypoint');
}

walkKeys(first);
const serialized = JSON.stringify(first).toLowerCase();
for (const fragment of ['raw_html', 'raw_source', 'direct_stream_url', 'canonical_written', 'public_projection_written']) {
  assert.ok(!serialized.includes(fragment), `forbidden current TJK candidate content: ${fragment}`);
}

console.log('TJK_CURRENT_BOUNDED_ADAPTER: pass');
console.log('CANDIDATE_MEETINGS: 2');
console.log('CANDIDATE_RACES: 18');
console.log('CANDIDATE_RANK: A');
console.log('TECHNICAL_CAPABILITY: A+');
console.log('PUBLICATION_EFFECT: none');
