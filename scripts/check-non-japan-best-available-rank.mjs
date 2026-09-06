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
  'first and last time evidence must derive B+',
);
assert.equal(
  deriveBestAvailableRank({ capability_rank: 'A+', first_race_time_local: '12:00', timetable_rows: [] }),
  'B',
  'first-time-only evidence must derive B',
);
assert.equal(
  deriveBestAvailableRank({ capability_rank: 'A+', timetable_rows: [] }),
  'C',
  'meeting-only evidence must derive C',
);

const policies = JSON.parse(fs.readFileSync('src/data/publicationDisplayPolicies.json', 'utf8'));
for (const authorityId of ['hkjc', 'emirates-racing-authority', 'korea-racing-authority', 'turkiye-jokey-kulubu']) {
  const policy = policies.policies.find((row) => (row.match?.authority_ids ?? []).includes(authorityId));
  assert.ok(policy, `missing public policy for ${authorityId}`);
  assert.equal(policy.max_public_rank, 'A+', `${authorityId} must not retain a fixed public cap below A+`);
  assert.equal(policy.a_plus_fields?.show_race_name, true, `${authorityId} A+ must expose race name`);
  assert.equal(policy.a_plus_fields?.show_distance, true, `${authorityId} A+ must expose distance`);
  assert.equal(policy.a_plus_fields?.show_surface, true, `${authorityId} A+ must expose surface`);
  assert.equal(policy.a_plus_fields?.show_course, true, `${authorityId} A+ must expose course`);
}

const applySource = fs.readFileSync('scripts/timetable/apply-official-rolling-observations.mjs', 'utf8');
assert.match(applySource, /deriveBestAvailableRank\(record, record\?\.timetable_rows \?\? \[\]\)/, 'non-Japan apply layer must derive rank from observation evidence');
assert.match(applySource, /normalizeStoredCanonical/, 'non-Japan apply layer must re-derive legacy stored canonical rank before higher-rank protection');
assert.match(applySource, /public_reprojected/, 'non-Japan apply layer must reproject existing public rows against the current policy');
assert.match(applySource, /storedEvidenceRank\(meeting, detail\)/, 'public rank must be projected from stored evidence rather than a stale capability label');
assert.doesNotMatch(applySource, /return record\.capability_rank \?\? record\.candidate_rank/, 'non-Japan apply layer must not trust collector rank as canonical rank');

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
  const kraRows = [
    { label: 'Race 1', post_time_local: '11:25', race_name: 'Busan opener', distance_m: 1200 },
    { label: 'Race 2', post_time_local: '12:25', race_name: 'Busan feature', distance_m: 1600 },
  ];
  const tjkRows = [
    { label: 'Race 1', post_time_local: '14:30' },
    { label: 'Race 2', post_time_local: '15:00' },
  ];
  const sourceTrace = (url) => ({
    source_id: 'fixture-source', route_id: null, source_status: 'verified', official_source_url: url,
    source_label: null, extraction_method: 'adapter', source_snapshot_path: null, normalized_from_path: 'fixture',
  });
  const freshness = { last_checked_date: '2026-09-06', generated_at: generatedAt, stale_after_date: null, freshness_note: null };

  fs.writeFileSync(canonicalPath, `${JSON.stringify({
    schema_version: 'canonical-timetable-v0', generated_at: generatedAt, meetings: [
      {
        meeting_id: 'kra-busan-gyeongnam-racecourse-2026-09-06', country_id: 'south-korea', authority_id: 'korea-racing-authority',
        racing_system_id: 'kra-national-racing-system', racecourse_id: 'busan-gyeongnam-racecourse', date: '2026-09-06', timezone: 'Asia/Seoul',
        capability_rank: 'A+', display_status: 'displayable', first_race_time_local: '11:25', last_race_time_local: '12:25',
        source_trace: sourceTrace('https://race.kra.co.kr/example'), freshness,
      },
      {
        meeting_id: 'tjk-ankara-racecourse-2026-09-06', country_id: 'turkey', authority_id: 'turkiye-jokey-kulubu',
        racing_system_id: 'tjk-national-racing-system', racecourse_id: 'ankara-racecourse', date: '2026-09-06', timezone: 'Europe/Istanbul',
        capability_rank: 'A', display_status: 'displayable', first_race_time_local: '14:30', last_race_time_local: '15:00',
        source_trace: sourceTrace('https://www.tjk.org/example'), freshness,
      },
    ],
  }, null, 2)}\n`);

  fs.writeFileSync(canonicalDetailsPath, `${JSON.stringify({
    schema_version: 'canonical-meeting-details-v0', generated_at: generatedAt, details: [
      {
        meeting_id: 'kra-busan-gyeongnam-racecourse-2026-09-06', country_id: 'south-korea', authority_id: 'korea-racing-authority',
        racecourse_id: 'busan-gyeongnam-racecourse', date: '2026-09-06', timezone: 'Asia/Seoul', capability_rank: 'A+',
        source_trace: sourceTrace('https://race.kra.co.kr/example'), freshness, timetable_rows: kraRows,
      },
      {
        meeting_id: 'tjk-ankara-racecourse-2026-09-06', country_id: 'turkey', authority_id: 'turkiye-jokey-kulubu',
        racecourse_id: 'ankara-racecourse', date: '2026-09-06', timezone: 'Europe/Istanbul', capability_rank: 'A',
        source_trace: sourceTrace('https://www.tjk.org/example'), freshness, timetable_rows: tjkRows,
      },
    ],
  }, null, 2)}\n`);

  const stalePublic = (meetingId, countryId, authorityId, racecourseId, timezone, first, last, oldPolicy) => ({
    meeting_id: meetingId, country_id: countryId, authority_id: authorityId, racecourse_id: racecourseId, date: '2026-09-06', timezone,
    capability_rank: authorityId === 'korea-racing-authority' ? 'A+' : 'A', max_public_rank: 'A', effective_public_rank: 'A',
    first_race_time_local: first, last_race_time_local: last, policy_id: oldPolicy, source_status: 'verified',
    official_source_url: authorityId === 'korea-racing-authority' ? 'https://race.kra.co.kr/example' : 'https://www.tjk.org/example',
    last_checked_date: '2026-09-06', detail_path: `/timetable/meetings/${meetingId}/`, show_live_label: false, show_replay_label: false,
  });
  const kraPublic = stalePublic('kra-busan-gyeongnam-racecourse-2026-09-06', 'south-korea', 'korea-racing-authority', 'busan-gyeongnam-racecourse', 'Asia/Seoul', '11:25', '12:25', 'kra-reviewed-a');
  const tjkPublic = stalePublic('tjk-ankara-racecourse-2026-09-06', 'turkey', 'turkiye-jokey-kulubu', 'ankara-racecourse', 'Europe/Istanbul', '14:30', '15:00', 'tjk-reviewed-a');
  fs.writeFileSync(publicPath, `${JSON.stringify({ schema_version: 'public-timetable-meeting-list-v0', generated_at: generatedAt, meetings: [kraPublic, tjkPublic] }, null, 2)}\n`);
  fs.writeFileSync(publicDetailsPath, `${JSON.stringify({ schema_version: 'public-timetable-meeting-details-v0', generated_at: generatedAt, details: [] }, null, 2)}\n`);

  fs.writeFileSync(artifactPath, `${JSON.stringify({
    schema_version: 'kra-official-window-candidates-v1', generated_at: generatedAt, records: [
      {
        meeting_id: 'kra-busan-gyeongnam-racecourse-2026-09-06', country_id: 'south-korea', authority_id: 'korea-racing-authority',
        racing_system_id: 'kra-national-racing-system', racecourse_id: 'busan-gyeongnam-racecourse', date: '2026-09-06', timezone: 'Asia/Seoul',
        capability_rank: 'A+', first_race_time_local: '11:25', last_race_time_local: '12:25', timetable_rows: kraRows,
        source: { source_id: 'kra-today-race', official_url: 'https://race.kra.co.kr/example' },
      },
    ],
  }, null, 2)}\n`);

  const applied = spawnSync(process.execPath, [
    'scripts/timetable/apply-official-rolling-observations.mjs',
    `--artifact=${artifactPath}`,
    `--canonical=${canonicalPath}`,
    `--canonical-details=${canonicalDetailsPath}`,
    `--public=${publicPath}`,
    `--public-details=${publicDetailsPath}`,
    '--policies=src/data/publicationDisplayPolicies.json',
  ], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(applied.status, 0, `persistence regression fixture failed: ${applied.stderr || applied.stdout}`);

  const canonicalAfter = JSON.parse(fs.readFileSync(canonicalPath, 'utf8'));
  const canonicalDetailsAfter = JSON.parse(fs.readFileSync(canonicalDetailsPath, 'utf8'));
  const publicAfter = JSON.parse(fs.readFileSync(publicPath, 'utf8'));
  const publicDetailsAfter = JSON.parse(fs.readFileSync(publicDetailsPath, 'utf8'));
  const canonicalById = new Map(canonicalAfter.meetings.map((row) => [row.meeting_id, row]));
  const detailsById = new Map(canonicalDetailsAfter.details.map((row) => [row.meeting_id, row]));
  const publicById = new Map(publicAfter.meetings.map((row) => [row.meeting_id, row]));
  const publicDetailsById = new Map(publicDetailsAfter.details.map((row) => [row.meeting_id, row]));

  const kraCanonical = canonicalById.get('kra-busan-gyeongnam-racecourse-2026-09-06');
  const kraDetail = detailsById.get('kra-busan-gyeongnam-racecourse-2026-09-06');
  const kraPublished = publicById.get('kra-busan-gyeongnam-racecourse-2026-09-06');
  const kraPublishedDetail = publicDetailsById.get('kra-busan-gyeongnam-racecourse-2026-09-06');
  assert.equal(kraCanonical.capability_rank, 'A', 'legacy KRA A+ must self-heal to A when stored rows lack A+ surface/course evidence');
  assert.equal(kraDetail.capability_rank, 'A', 'canonical KRA detail rank must follow stored evidence rank');
  assert.equal(kraPublished.capability_rank, 'A', 'public KRA capability must be derived from canonical evidence');
  assert.equal(kraPublished.max_public_rank, 'A+', 'KRA current policy must be reprojected even when the old public row was capped at A');
  assert.equal(kraPublished.effective_public_rank, 'A', 'KRA incomplete A+ evidence must remain public A');
  assert.equal(kraPublished.policy_id, 'kra-reviewed-a-plus', 'KRA stale old policy id must be replaced');
  assert.equal(kraPublishedDetail.show_race_name, false, 'Rank A KRA must not expose A+ metadata flags');
  assert.equal(kraPublishedDetail.show_distance, false, 'Rank A KRA must not expose A+ metadata flags');
  assert.equal(kraPublishedDetail.show_surface, false, 'Rank A KRA must not expose A+ metadata flags');
  assert.equal(kraPublishedDetail.show_course, false, 'Rank A KRA must not expose A+ metadata flags');

  const tjkPublished = publicById.get('tjk-ankara-racecourse-2026-09-06');
  assert.equal(tjkPublished.capability_rank, 'A');
  assert.equal(tjkPublished.max_public_rank, 'A+', 'untouched TJK canonical row must still receive current A+ publication policy');
  assert.equal(tjkPublished.effective_public_rank, 'A');
  assert.equal(tjkPublished.policy_id, 'tjk-reviewed-a-plus', 'TJK stale old policy id must be replaced without a canonical change');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log('NON_JAPAN_BEST_AVAILABLE_RANK: pass');
