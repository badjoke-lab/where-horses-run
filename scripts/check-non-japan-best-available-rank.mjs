import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { deriveBestAvailableRank } from './timetable/best-available-rank.mjs';

const aPlusRows = [
  { label: 'Race 1', post_time_local: '12:00', race_name: 'Opening', distance_m: 1200, surface: 'Dirt', course_label: 'Right-handed' },
  { label: 'Race 2', post_time_local: '12:30', race_name: 'Feature', distance_m: 1600, surface: 'Turf', course_label: 'Right-handed' },
];

assert.equal(
  deriveBestAvailableRank({ capability_rank: 'A', timetable_rows: aPlusRows }),
  'A+',
  'collector-declared A must not cap complete A+ evidence',
);
assert.equal(
  deriveBestAvailableRank({ capability_rank: 'A+', timetable_rows: aPlusRows.map(({ race_name, distance_m, surface, course_label, ...row }) => row) }),
  'A',
  'collector-declared A+ must not promote time-only rows above A',
);
assert.equal(
  deriveBestAvailableRank({ capability_rank: 'A+', first_race_time_local: '12:00', last_race_time_local: '18:00', timetable_rows: [] }),
  'B+',
);
assert.equal(deriveBestAvailableRank({ capability_rank: 'A+', first_race_time_local: '12:00', timetable_rows: [] }), 'B');
assert.equal(deriveBestAvailableRank({ capability_rank: 'A+', timetable_rows: [] }), 'C');

const policyText = fs.readFileSync('src/data/publicationDisplayPolicies.json', 'utf8');
const policies = JSON.parse(policyText);
assert.doesNotMatch(policyText, /"max_public_rank"/, 'publication policy must not contain authority/source rank ceilings');
for (const authorityId of [
  'hkjc',
  'emirates-racing-authority',
  'korea-racing-authority',
  'turkiye-jokey-kulubu',
  'sorec',
  'teletrak-chile',
  'horse-racing-ireland',
]) {
  const policy = policies.policies.find((row) => (row.match?.authority_ids ?? []).includes(authorityId));
  assert.ok(policy, `missing public policy for ${authorityId}`);
  assert.deepEqual(policy.detail_fields, {
    show_race_name: true,
    show_distance: true,
    show_surface: true,
    show_course: true,
  }, `${authorityId} must publish verified detail fields independently instead of using a rank-derived block`);
}

const applySource = fs.readFileSync('scripts/timetable/apply-official-rolling-observations.mjs', 'utf8');
assert.match(applySource, /deriveBestAvailableRank\(record, record\?\.timetable_rows \?\? \[\]\)/, 'non-Japan apply layer must derive rank from observation evidence');
assert.match(applySource, /normalizeStoredCanonical/, 'non-Japan apply layer must re-derive legacy stored canonical rank');
assert.match(applySource, /public_reprojected/, 'non-Japan apply layer must reproject existing public rows');
assert.match(applySource, /storedEvidenceRank\(meeting, detail\)/, 'public rank must be projected from stored evidence');
assert.doesNotMatch(applySource, /capRank\(/, 'public rank must not be capped by policy');
assert.doesNotMatch(applySource, /policy\.max_public_rank/, 'public rank must not read an authority/source ceiling');
assert.doesNotMatch(applySource, /max_public_rank:/, 'generated public rows must not emit a ceiling');

const tjkSource = fs.readFileSync('scripts/timetable/run-tjk-current-best-available.mjs', 'utf8');
assert.doesNotMatch(tjkSource, /publication_ceiling:\s*'A'/, 'TJK must not retain a fixed public A ceiling');
assert.doesNotMatch(tjkSource, /capability_rank:\s*'A'/, 'TJK must not hard-code A for discovered schedules');
assert.match(tjkSource, /deriveBestAvailableRank/, 'TJK collector must derive its diagnostic rank from evidence');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-non-japan-best-available-'));
try {
  const canonicalPath = path.join(tmp, 'canonical.json');
  const canonicalDetailsPath = path.join(tmp, 'canonical-details.json');
  const publicPath = path.join(tmp, 'public.json');
  const publicDetailsPath = path.join(tmp, 'public-details.json');
  const artifactPath = path.join(tmp, 'artifact.json');
  const generatedAt = '2026-09-06T00:00:00Z';
  const meetingId = 'kra-busan-gyeongnam-racecourse-2026-09-06';
  const rows = [
    { label: 'Race 1', post_time_local: '11:25', race_name: 'Busan opener', distance_m: 1200 },
    { label: 'Race 2', post_time_local: '12:25', race_name: 'Busan feature', distance_m: 1600 },
  ];
  const sourceTrace = {
    source_id: 'fixture-source', route_id: null, source_status: 'verified', official_source_url: 'https://race.kra.co.kr/example',
    source_label: null, extraction_method: 'adapter', source_snapshot_path: null, normalized_from_path: 'fixture',
  };
  const freshness = { last_checked_date: '2026-09-06', generated_at: generatedAt, stale_after_date: null, freshness_note: null };

  fs.writeFileSync(canonicalPath, `${JSON.stringify({
    schema_version: 'canonical-timetable-v0', generated_at: generatedAt, meetings: [{
      meeting_id: meetingId, country_id: 'south-korea', authority_id: 'korea-racing-authority',
      racing_system_id: 'kra-national-racing-system', racecourse_id: 'busan-gyeongnam-racecourse', date: '2026-09-06', timezone: 'Asia/Seoul',
      capability_rank: 'A', display_status: 'displayable', first_race_time_local: '11:25', last_race_time_local: '12:25',
      source_trace: sourceTrace, freshness,
    }],
  }, null, 2)}\n`);
  fs.writeFileSync(canonicalDetailsPath, `${JSON.stringify({
    schema_version: 'canonical-meeting-details-v0', generated_at: generatedAt, details: [{
      meeting_id: meetingId, country_id: 'south-korea', authority_id: 'korea-racing-authority', racecourse_id: 'busan-gyeongnam-racecourse',
      date: '2026-09-06', timezone: 'Asia/Seoul', capability_rank: 'A', source_trace: sourceTrace, freshness, timetable_rows: rows,
    }],
  }, null, 2)}\n`);
  fs.writeFileSync(publicPath, `${JSON.stringify({
    schema_version: 'public-timetable-meeting-list-v0', generated_at: generatedAt, meetings: [{
      meeting_id: meetingId, country_id: 'south-korea', authority_id: 'korea-racing-authority', racecourse_id: 'busan-gyeongnam-racecourse',
      date: '2026-09-06', timezone: 'Asia/Seoul', capability_rank: 'A', max_public_rank: 'A', effective_public_rank: 'A',
      first_race_time_local: '11:25', last_race_time_local: '12:25', policy_id: 'kra-reviewed-a', source_status: 'verified',
      official_source_url: sourceTrace.official_source_url, last_checked_date: '2026-09-06', detail_path: `/timetable/meetings/${meetingId}/`,
      show_live_label: false, show_replay_label: false,
    }],
  }, null, 2)}\n`);
  fs.writeFileSync(publicDetailsPath, `${JSON.stringify({ schema_version: 'public-timetable-meeting-details-v0', generated_at: generatedAt, details: [] }, null, 2)}\n`);
  fs.writeFileSync(artifactPath, `${JSON.stringify({
    schema_version: 'kra-official-window-candidates-v1', generated_at: generatedAt, records: [{
      meeting_id: meetingId, country_id: 'south-korea', authority_id: 'korea-racing-authority', racing_system_id: 'kra-national-racing-system',
      racecourse_id: 'busan-gyeongnam-racecourse', date: '2026-09-06', timezone: 'Asia/Seoul', capability_rank: 'A+',
      first_race_time_local: '11:25', last_race_time_local: '12:25', timetable_rows: rows,
      source: { source_id: 'kra-today-race', official_url: sourceTrace.official_source_url },
    }],
  }, null, 2)}\n`);

  const applied = spawnSync(process.execPath, [
    'scripts/timetable/apply-official-rolling-observations.mjs',
    `--artifact=${artifactPath}`,
    `--canonical=${canonicalPath}`,
    `--canonical-details=${canonicalDetailsPath}`,
    `--public=${publicPath}`,
    `--public-details=${publicDetailsPath}`,
    '--policies=src/data/publicationDisplayPolicies.json',
    '--authority-id=korea-racing-authority',
  ], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(applied.status, 0, `persistence regression fixture failed: ${applied.stderr || applied.stdout}`);

  const publicAfter = JSON.parse(fs.readFileSync(publicPath, 'utf8'));
  const publicDetailsAfter = JSON.parse(fs.readFileSync(publicDetailsPath, 'utf8'));
  const published = publicAfter.meetings.find((row) => row.meeting_id === meetingId);
  const detail = publicDetailsAfter.details.find((row) => row.meeting_id === meetingId);
  assert.equal(published.capability_rank, 'A');
  assert.equal(published.effective_public_rank, 'A');
  assert.ok(!('max_public_rank' in published), 'reprojection must remove a stale legacy public rank ceiling');
  assert.equal(published.policy_id, 'kra-reviewed');
  assert.equal(detail.show_race_name, true, 'rank A may expose verified race names');
  assert.equal(detail.show_distance, true, 'rank A may expose verified distances');
  assert.equal(detail.show_surface, true, 'field visibility is policy-level, not A+ gated');
  assert.equal(detail.show_course, true, 'field visibility is policy-level, not A+ gated');
  assert.equal(detail.timetable_rows[0].race_name, 'Busan opener');
  assert.equal(detail.timetable_rows[0].distance_m, 1200);
  assert.ok(!('surface' in detail.timetable_rows[0]));
  assert.ok(!('course_label' in detail.timetable_rows[0]));
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log('NON_JAPAN_BEST_AVAILABLE_RANK: pass');
