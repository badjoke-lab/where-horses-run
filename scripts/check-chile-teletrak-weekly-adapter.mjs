import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  CHILE_TELETRAK_ADAPTER_ID,
  CHILE_TELETRAK_URL,
  buildChileTeletrakCandidate,
  parseChileTeletrakWeeklyHtml,
  resolveChileTeletrakRacecourseId,
} from './timetable/chile-teletrak-weekly-core.mjs';
import { deriveBestAvailableRank } from './timetable/best-available-rank.mjs';

const fixturePath = 'data/fixtures/chile-teletrak-weekly-observed-v1.html';
const html = fs.readFileSync(fixturePath, 'utf8');
const expectedVenues = new Map([
  ['Club Hípico de Concepción', 'club-hipico-de-concepcion-racecourse'],
  ['Club Hipico de Santiago', 'club-hipico-de-santiago-racecourse'],
  ['Hipódromo Chile', 'hipodromo-chile'],
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
  ['2026-09-10', 'hipodromo-chile'],
  ['2026-09-11', 'club-hipico-de-santiago-racecourse'],
  ['2026-09-12', 'hipodromo-chile'],
  ['2026-09-13', 'club-hipico-de-santiago-racecourse'],
  ['2026-09-14', 'valparaiso-sporting-club-racecourse'],
  ['2026-09-15', 'club-hipico-de-concepcion-racecourse'],
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
  assert.equal(record.first_race_time_local, null);
  assert.equal(record.last_race_time_local, null);
  assert.deepEqual(record.timetable_rows, []);
  assert.equal(record.source.official_url, CHILE_TELETRAK_URL);
}
assert.equal(deriveBestAvailableRank({ first_race_time_local: '12:00', timetable_rows: [] }), 'B');
assert.equal(deriveBestAvailableRank({ first_race_time_local: '12:00', last_race_time_local: '17:00', timetable_rows: [] }), 'B+');
assert.equal(deriveBestAvailableRank({ timetable_rows: [{ label: 'Race 1', post_time_local: '12:00' }, { label: 'Race 2', post_time_local: '12:30' }] }), 'A');

const coreSource = fs.readFileSync('scripts/timetable/chile-teletrak-weekly-core.mjs', 'utf8');
const runnerSource = fs.readFileSync('scripts/timetable/run-chile-teletrak-official-window.mjs', 'utf8');
assert.match(coreSource, /deriveBestAvailableRank/, 'Chile adapter must derive rank from normalized evidence');
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
assert.doesNotMatch(unifiedWorkflow, /chile[^\n]{0,80}(?:public_rank_ceiling|capability_rank:\s*['"]C['"])/i, 'Chile unified refresh must not hard-code C');

console.log('CHILE_UNIFIED_REFRESH_WIRING: pass');
console.log('CHILE_TELETRAK_WEEKLY_ADAPTER: pass');
console.log(`FIXTURE_RECORDS: ${parsed.records.length}`);
console.log(`CURRENT_OBSERVATION_RANK: ${built.candidate.records[0]?.capability_rank ?? 'none'}`);
console.log('BEST_AVAILABLE_RANK_PATH: pass');
console.log('UNKNOWN_VENUE_FAIL_CLOSED: pass');
