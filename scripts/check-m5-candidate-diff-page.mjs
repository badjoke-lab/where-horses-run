import assert from 'node:assert/strict';
import { buildCandidateDiff, renderCandidateDiffHtml } from './timetable/candidate-diff-page.mjs';

const baseline = {
  schema_version: 'canonical-timetable-v0', generated_at: '2026-08-15T00:00:00Z', meetings: [
    { meeting_id: 'm1', country_id: 'turkey', authority_id: 'tjk', racecourse_id: 'ankara', date: '2026-08-16', timezone: 'Europe/Istanbul', capability_rank: 'A', first_race_time_local: '14:00', last_race_time_local: '18:00', source_trace: { official_source_url: 'https://example.test/ankara' } },
    { meeting_id: 'm2', country_id: 'turkey', authority_id: 'tjk', racecourse_id: 'kocaeli', date: '2026-08-16', timezone: 'Europe/Istanbul', capability_rank: 'A', first_race_time_local: '17:15', last_race_time_local: '21:30', source_trace: { official_source_url: 'https://example.test/kocaeli' } },
    { meeting_id: 'm3', country_id: 'turkey', authority_id: 'tjk', racecourse_id: 'istanbul', date: '2026-08-17', timezone: 'Europe/Istanbul', capability_rank: 'C', first_race_time_local: null, last_race_time_local: null, source_trace: { official_source_url: 'https://example.test/istanbul' } },
    { meeting_id: 'outside', country_id: 'turkey', authority_id: 'tjk', racecourse_id: 'outside', date: '2026-08-30', timezone: 'Europe/Istanbul', capability_rank: 'C' },
    { meeting_id: 'other-country', country_id: 'japan', authority_id: 'jra', racecourse_id: 'tokyo', date: '2026-08-16', timezone: 'Asia/Tokyo', capability_rank: 'A' }
  ]
};

const details = { schema_version: 'canonical-meeting-details-v0', generated_at: '2026-08-15T00:00:00Z', details: [
  { meeting_id: 'm1', timetable_rows: [{ label: 'Race 1', post_time_local: '14:00', race_name: null, distance_m: null, surface: null, course_label: null }] },
  { meeting_id: 'm2', timetable_rows: [{ label: 'Race 1', post_time_local: '17:15', race_name: null, distance_m: null, surface: null, course_label: null }] }
] };

const candidate = {
  schema_version: 'timetable-candidate-v1', generated_at: '2026-08-16T00:00:00Z', adapter_id: 'test-tjk-v1', country_id: 'turkey', authority_id: 'tjk',
  candidate_window: { start_date: '2026-08-16', end_date_exclusive: '2026-08-18', timezone: 'Europe/Istanbul' },
  records: [
    { meeting_id: 'm1', country_id: 'turkey', authority_id: 'tjk', racecourse_id: 'ankara', date: '2026-08-16', timezone: 'Europe/Istanbul', candidate_rank: 'A', capability_rank: 'A', first_race_time_local: '14:00', last_race_time_local: '18:00', timetable_rows: [{ label: 'Race 1', post_time_local: '14:05' }], source: { official_url: 'https://example.test/ankara' }, review_status: 'pending' },
    { meeting_id: 'm2', country_id: 'turkey', authority_id: 'tjk', racecourse_id: 'kocaeli', date: '2026-08-16', timezone: 'Europe/Istanbul', candidate_rank: 'A', capability_rank: 'A', first_race_time_local: '17:15', last_race_time_local: '21:30', timetable_rows: [{ label: 'Race 1', post_time_local: '17:15' }], source: { official_url: 'https://example.test/kocaeli' }, review_status: 'pending' },
    { meeting_id: 'm4', country_id: 'turkey', authority_id: 'tjk', racecourse_id: 'izmir', date: '2026-08-17', timezone: 'Europe/Istanbul', candidate_rank: 'C', capability_rank: 'C', first_race_time_local: null, last_race_time_local: null, timetable_rows: [], source: { official_url: 'https://example.test/izmir' }, review_status: 'pending' }
  ], review: { status: 'pending' }
};

const diff = buildCandidateDiff(candidate, baseline, details);
assert.equal(diff.review_only, true);
assert.equal(diff.approval_effect, 'none');
assert.equal(diff.publication_effect, 'none');
assert.deepEqual(diff.counts, { changed: 1, candidate_only: 1, baseline_only: 1, unchanged: 1 });
assert.deepEqual(diff.rows.find((row) => row.key === 'meeting:m1').changed_fields, ['timetable_rows']);
assert.equal(diff.rows.find((row) => row.key === 'meeting:m2').state, 'unchanged');
assert.equal(diff.rows.find((row) => row.key === 'meeting:m4').state, 'candidate_only');
const baselineOnly = diff.rows.find((row) => row.key === 'meeting:m3');
assert.equal(baselineOnly.state, 'baseline_only');
assert.equal(baselineOnly.removal_implied, false);
assert.match(baselineOnly.note, /not a deletion instruction/);
assert.equal(diff.rows.some((row) => row.key === 'meeting:outside'), false);
assert.equal(diff.rows.some((row) => row.key === 'meeting:other-country'), false);

const html = renderCandidateDiffHtml(diff);
assert.match(html, /REVIEW ONLY — NOT PUBLICATION/);
assert.match(html, /Baseline-only rows never imply removal/);
assert.match(html, /Candidate only 1/);
assert.match(html, /Changed 1/);
assert.match(html, /noindex,nofollow,noarchive/);
assert.doesNotMatch(html, /<button\b/i);
assert.doesNotMatch(html, /<form\b/i);
assert.doesNotMatch(html, /data-action=/i);

assert.throws(() => buildCandidateDiff({ ...candidate, records: [...candidate.records, { ...candidate.records[0] }] }, baseline, details), /duplicate candidate identity/);
assert.throws(() => buildCandidateDiff({ ...candidate, records: [{ ...candidate.records[0], odds: ['2.0'] }] }, baseline, details), /prohibited from candidate review output/);
assert.throws(() => buildCandidateDiff({ ...candidate, records: [{ ...candidate.records[0], source: { official_url: 'https://example.test/meeting?access_token=secret' } }] }, baseline, details), /sensitive query parameter/);
assert.throws(() => buildCandidateDiff({ ...candidate, records: [{ ...candidate.records[0], country_id: 'japan' }] }, baseline, details), /one country\/authority review partition/);
assert.throws(() => buildCandidateDiff({ ...candidate, schema_version: 'unknown-v1' }, baseline, details), /unsupported candidate schema/);

const escaped = buildCandidateDiff({ ...candidate, records: [{ ...candidate.records[2], meeting_id: 'm<script>', source: { official_url: 'https://example.test/izmir' } }] }, baseline, details);
const escapedHtml = renderCandidateDiffHtml(escaped);
assert.doesNotMatch(escapedHtml, /<script>/);
assert.match(escapedHtml, /m&lt;script&gt;/);

console.log('M5 candidate diff page check passed.');
console.log('- review artifact only; approval/publication effects are none');
console.log('- changed/candidate-only/baseline-only/unchanged states are explicit');
console.log('- baseline-only never implies deletion');
console.log('- candidate partition, source URL, prohibited-field and HTML escaping checks fail closed');
