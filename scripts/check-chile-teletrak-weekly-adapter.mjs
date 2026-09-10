import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  CHILE_TELETRAK_ADAPTER_ID,
  CHILE_TELETRAK_URL,
  buildChileTeletrakCandidate,
  enrichChileRecordWithProgramme,
  parseChileOfficialProgrammeText,
  parseChileTeletrakWeeklyHtml,
  resolveChileTeletrakRacecourseId,
} from './timetable/chile-teletrak-weekly-core.mjs';
import { deriveBestAvailableRank } from './timetable/best-available-rank.mjs';

const fixturePath = 'data/fixtures/chile-teletrak-weekly-observed-v1.html';
const programmeFixturePath = 'data/fixtures/chile-teletrak-programme-observed-v1.txt';
const html = fs.readFileSync(fixturePath, 'utf8');
const programmeText = fs.readFileSync(programmeFixturePath, 'utf8');
const expectedVenues = new Map([
  ['Club Hípico de Concepción', 'club-hipico-de-concepcion-racecourse'],
  ['Club Hipico de Santiago', 'club-hipico-de-santiago-racecourse'],
  ['Hipódromo Chile', 'hipodromo-chile-racecourse'],
  ['Valparaíso Sporting Club', 'valparaiso-sporting-club-racecourse'],
]);
for (const [label, racecourseId] of expectedVenues) assert.equal(resolveChileTeletrakRacecourseId(label), racecourseId, label);
assert.equal(resolveChileTeletrakRacecourseId('Unknown Venue'), null);

const parsed = parseChileTeletrakWeeklyHtml(html, { referenceDate: '2026-09-09', startDate: '2026-09-09', endDateExclusive: '2026-09-16' });
assert.equal(parsed.records.length, 7);
assert.equal(parsed.source_card_count, 7);
assert.equal(parsed.unknown_venues.length, 0);
assert.equal(parsed.parse_failures.length, 0);
assert.deepEqual(parsed.records.map((row) => [row.date, row.racecourse_id]), [
  ['2026-09-09', 'valparaiso-sporting-club-racecourse'],
  ['2026-09-10', 'hipodromo-chile-racecourse'],
  ['2026-09-11', 'club-hipico-de-santiago-racecourse'],
  ['2026-09-12', 'hipodromo-chile-racecourse'],
  ['2026-09-13', 'club-hipico-de-santiago-racecourse'],
  ['2026-09-14', 'valparaiso-sporting-club-racecourse'],
  ['2026-09-15', 'club-hipico-de-concepcion-racecourse'],
]);
const sep10 = parsed.records.find((row) => row.date === '2026-09-10');
assert.equal(sep10.programme_url, 'https://storage.elturf.com/pdf_volantes/pdf_hch/fixture.pdf', 'weekly discovery must preserve the published programme href');

const programmeRows = parseChileOfficialProgrammeText(programmeText);
assert.deepEqual(programmeRows, [
  { label: 'Race 1', post_time_local: '12:15', race_name: 'Raquetazo', distance_m: 1000 },
  { label: 'Race 2', post_time_local: '12:40', race_name: 'Remansa', distance_m: 1000 },
  { label: 'Race 3', post_time_local: '13:05', race_name: 'Remendador', distance_m: 1000 },
]);

const built = buildChileTeletrakCandidate({ html, checkedAt: '2026-09-09T12:00:00Z', startDate: '2026-09-09', endDateExclusive: '2026-09-16' });
assert.equal(built.candidate.schema_version, 'timetable-candidate-v1');
assert.equal(built.candidate.adapter_id, CHILE_TELETRAK_ADAPTER_ID);
assert.equal(built.candidate.source_id, 'chile-teletrak-weekly-programme');
assert.equal(built.candidate.collection_target_rank, 'best_available');
assert.equal(built.candidate.records.length, 7);
for (const record of built.candidate.records) {
  assert.equal(record.country_id, 'chile');
  assert.equal(record.authority_id, 'teletrak-chile');
  assert.equal(record.racing_system_id, 'chile-teletrak-racing-system');
  assert.equal(record.timezone, 'America/Santiago');
  assert.equal(record.capability_rank, deriveBestAvailableRank(record, record.timetable_rows));
}
const discoveredSep10 = built.candidate.records.find((record) => record.date === '2026-09-10');
assert.ok(discoveredSep10?.programme_url, 'a published programme must create a detail route instead of terminal C');
const enrichedSep10 = enrichChileRecordWithProgramme(discoveredSep10, { text: programmeText, programmeUrl: discoveredSep10.programme_url });
assert.ok(enrichedSep10);
assert.equal(enrichedSep10.capability_rank, 'A', 'linked programme rows must promote meeting-only C to evidence-derived A');
assert.equal(enrichedSep10.first_race_time_local, '12:15');
assert.equal(enrichedSep10.last_race_time_local, '13:05');
assert.equal(enrichedSep10.timetable_rows.length, 3);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'whr-chile-detail-'));
try {
  const output = path.join(tmp, 'chile.json');
  const run = spawnSync(process.execPath, [
    'scripts/timetable/run-chile-teletrak-official-window.mjs',
    `--output=${output}`,
    '--as-of=2026-09-09',
    '--days=7',
    `--fixture=${fixturePath}`,
    `--programme-text-fixture=${programmeFixturePath}`,
  ], { cwd: process.cwd(), encoding: 'utf8' });
  assert.equal(run.status, 0, `Chile runner fixture failed: ${run.stderr || run.stdout}`);
  const artifact = JSON.parse(fs.readFileSync(output, 'utf8'));
  const promoted = artifact.records.find((record) => record.date === '2026-09-10');
  assert.equal(promoted?.capability_rank, 'A');
  assert.equal(promoted?.timetable_rows?.length, 3);
  assert.equal(artifact.acquisition.lower_rank_is_terminal, false);
  assert.equal(artifact.acquisition.policy, 'retry_every_refresh_until_a_plus');
  assert.equal(artifact.acquisition.detail_routes_published, 1);
  assert.equal(artifact.acquisition.detail_routes_attempted, 1);
  assert.equal(artifact.acquisition.detail_routes_succeeded, 1);
  assert.ok(artifact.acquisition.detail_routes_pending_publication.length >= 1, 'future lower-rank meetings without a programme must remain pending for a later refresh');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

const coreSource = fs.readFileSync('scripts/timetable/chile-teletrak-weekly-core.mjs', 'utf8');
const runnerSource = fs.readFileSync('scripts/timetable/run-chile-teletrak-official-window.mjs', 'utf8');
assert.match(coreSource, /deriveBestAvailableRank/, 'Chile adapter must derive rank from normalized evidence');
assert.match(coreSource, /programme_url/, 'Chile discovery must preserve programme detail routes');
assert.match(runnerSource, /retry_every_refresh_until_a_plus/, 'Chile runner must explicitly retry lower-rank meetings on later refreshes');
assert.match(runnerSource, /fetchProgrammeText/, 'Chile runner must follow published detail routes');
assert.doesNotMatch(coreSource, /buildChileRankCCandidate|rank-c-v1|capability_rank:\s*['"]C['"]/, 'Chile adapter must not hard-code a C rank');
assert.doesNotMatch(runnerSource, /public_rank_ceiling|capability_rank:\s*['"]C['"]/, 'Chile runner must not impose a source-local public/rank ceiling');
assert.match(runnerSource, /collection_target_rank:\s*['"]best_available['"]/, 'Chile runner must target best available rank');

const unknown = html.replace('Icono Valparaíso Sporting Club', 'Icono Hipódromo Nuevo Chile');
const unknownParsed = parseChileTeletrakWeeklyHtml(unknown, { referenceDate: '2026-09-09', startDate: '2026-09-09', endDateExclusive: '2026-09-10' });
assert.equal(unknownParsed.records.length, 0);
assert.equal(unknownParsed.unknown_venues.length, 1);
assert.throws(() => parseChileTeletrakWeeklyHtml('<html>not teletrak</html>', { referenceDate: '2026-09-09' }), /fingerprint/);

const unifiedWorkflow = fs.readFileSync('.github/workflows/calendar-unified-official-refresh.yml', 'utf8');
assert.equal((unifiedWorkflow.match(/run-chile-teletrak-official-window\.mjs/g) ?? []).length, 2, 'Chile collector must run in normal and latest-main rebuild paths');
assert.equal((unifiedWorkflow.match(/--authority-id=teletrak-chile/g) ?? []).length, 2, 'Chile apply must run in normal and latest-main rebuild paths');
assert.equal((unifiedWorkflow.match(/--artifact=\.calendar-unified\/chile\.json/g) ?? []).length, 4, 'Chile artifact must be excluded/applied in both paths');

console.log('CHILE_UNIFIED_REFRESH_WIRING: pass');
console.log('CHILE_TELETRAK_WEEKLY_ADAPTER: pass');
console.log(`FIXTURE_RECORDS: ${parsed.records.length}`);
console.log('PROGRAMME_DETAIL_ESCALATION: pass');
console.log('LOWER_RANK_RETRY_CONTRACT: pass');
console.log('UNKNOWN_VENUE_FAIL_CLOSED: pass');
