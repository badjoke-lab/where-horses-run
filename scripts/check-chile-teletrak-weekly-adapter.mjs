import fs from 'node:fs';
import assert from 'node:assert/strict';
import {
  CHILE_TELETRAK_ADAPTER_ID,
  CHILE_TELETRAK_DETAIL_ADAPTER_ID,
  CHILE_TELETRAK_URL,
  buildChileTeletrakCandidate,
  enrichChileTeletrakCandidateWithProgrammeResults,
  extractChileTeletrakProgrammeLinks,
  extractClubHipicoSantiagoOfficialPdfHref,
  parseChileTeletrakProgrammeText,
  parseChileTeletrakWeeklyHtml,
  resolveChileTeletrakRacecourseId,
  resolveClubHipicoSantiagoProgrammePdfCandidate,
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

const linkedHtml = `<!doctype html><html><body><h2>Semana de carreras</h2><p>TELETRAK</p>
<article><strong>JUE 10</strong><img alt="Icono Hipódromo Chile"><a href="https://storage.elturf.com/pdf_volantes/pdf_hch/101149.pdf">Descargar programa</a></article>
<article><strong>VIE 11</strong><img alt="Icono Club Hípico de Santiago"><a href="https://static.clubhipico.cl/archivos/volantes/11-09-2026.pdf">Descargar programa</a></article>
<article><strong>LUN 14</strong><img alt="Icono Valparaíso Sporting Club"><a href="https://example.test/vsc.pdf">Descargar programa</a></article>
<article><strong>MAR 15</strong><img alt="Icono Club Hípico de Concepción"><a href="https://example.test/chc.pdf">Descargar programa</a></article>
<article><strong>MIÉ 16</strong><img alt="Icono Valparaíso Sporting Club"><button>Ver detalles</button></article>
<script>var bogus='<a href="' + carrera.programa_pdf + '">📄 Descargar Programa</a>';</script></body></html>`;
const linked = parseChileTeletrakWeeklyHtml(linkedHtml, { referenceDate: '2026-09-10', startDate: '2026-09-10', endDateExclusive: '2026-09-17' });
assert.equal(linked.records.length, 5);
assert.equal(linked.parse_failures.length, 0);
assert.equal(linked.records.find((row) => row.date === '2026-09-10')?.programme_url, 'https://storage.elturf.com/pdf_volantes/pdf_hch/101149.pdf');
assert.equal(linked.records.find((row) => row.date === '2026-09-11')?.programme_url, 'https://static.clubhipico.cl/archivos/volantes/11-09-2026.pdf');
assert.equal(linked.records.find((row) => row.date === '2026-09-16')?.programme_url, null);
const programmeLinks = extractChileTeletrakProgrammeLinks(linkedHtml, { referenceDate: '2026-09-10' });
assert.equal(programmeLinks.programme_links.size, 4);
assert.equal(programmeLinks.conflicts.length, 0);

const clubHipicoViewer = 'https://www.clubhipico.cl/carreras/volante/?fecha=2026-09-21';
assert.equal(
  resolveClubHipicoSantiagoProgrammePdfCandidate(clubHipicoViewer, { racecourseId: 'club-hipico-de-santiago-racecourse' }),
  'https://static.clubhipico.cl/archivos/volantes/21-09-2026.pdf',
);
assert.equal(
  resolveClubHipicoSantiagoProgrammePdfCandidate(clubHipicoViewer, { racecourseId: 'hipodromo-chile' }),
  null,
  'viewer fallback must be Santiago-only',
);
assert.equal(
  resolveClubHipicoSantiagoProgrammePdfCandidate('https://example.test/carreras/volante/?fecha=2026-09-21', { racecourseId: 'club-hipico-de-santiago-racecourse' }),
  null,
  'viewer fallback must stay on official Club Hipico hosts',
);
const viewerHtmlWithPdf = '<html><body><a href="https://static.clubhipico.cl/archivos/volantes/21-09-2026.pdf">Descargar volante</a></body></html>';
assert.equal(
  extractClubHipicoSantiagoOfficialPdfHref(viewerHtmlWithPdf, { baseUrl: clubHipicoViewer }),
  'https://static.clubhipico.cl/archivos/volantes/21-09-2026.pdf',
);
assert.equal(
  extractClubHipicoSantiagoOfficialPdfHref('<a href="https://example.test/21-09-2026.pdf">external</a>', { baseUrl: clubHipicoViewer }),
  null,
  'viewer resolver must reject non-official PDF hosts',
);

const hch = parseChileTeletrakProgrammeText('12:15 aprox. 1.000 Mts. PREMIO: A\n12:40 aprox. 1.000 Mts. PREMIO: B\n13:05 aprox. 1.200 Mts. PREMIO: C', { racecourseId: 'hipodromo-chile' });
const chs = parseChileTeletrakProgrammeText('1ª 12:30\nARENA - 1.000 mts\n2ª 12:58\nPASTO - 1.200 mts\n3ª 13:24\nPASTO - 1.200 mts', { racecourseId: 'club-hipico-de-santiago-racecourse' });
const chc = parseChileTeletrakProgrammeText('1ª 12:05 hrs. PREMIO UNO\n2ª 12:35 hrs. PREMIO DOS\n3ª 13:05 hrs. PREMIO TRES', { racecourseId: 'club-hipico-de-concepcion-racecourse' });
const vsc = parseChileTeletrakProgrammeText('Carrera: 1ª PREMIO UNO Hora: 12:10 hrs\nCarrera: 2ª PREMIO DOS Hora: 12:40 hrs\nCarrera: 3ª PREMIO TRES Hora: 13:10 hrs', { racecourseId: 'valparaiso-sporting-club-racecourse' });
for (const result of [hch, chs, chc, vsc]) {
  assert.equal(result.status, 'available');
  assert.equal(result.timetable_rows.length, 3);
}
assert.deepEqual(hch.timetable_rows.map((row) => row.post_time_local), ['12:15', '12:40', '13:05']);
assert.deepEqual(chs.timetable_rows.map((row) => row.post_time_local), ['12:30', '12:58', '13:24']);
assert.equal(hch.format, 'hipodromo_chile_aprox_headers');
assert.equal(chs.format, 'club_hipico_santiago_numbered_headers');
assert.equal(chc.format, 'club_hipico_concepcion_hrs_headers');
assert.equal(vsc.format, 'valparaiso_sporting_hora_headers');
assert.equal(parseChileTeletrakProgrammeText('no race headers here', { racecourseId: 'hipodromo-chile' }).status, 'parse_failure');

const currentConcepcionText = `(16:00) Hrs. Premio : "OCEANO MAGICO" CONDICIONAL.- 1300 metros.
(16:30) Hrs. Premio : "OH DULZURA" HANDICAP.- 1000 metros.
(17:00) Hrs. Premio : "OBEDIENTE" HANDICAP.- 1100 metros.
(17:30) Hrs. Premio : "OCEAN KING" HANDICAP.- 1100 metros.
(18:00) Hrs. Premio : "OXFORD" HANDICAP.- 1100 metros.
(18:30) Hrs. Premio : "OAK MAN" HANDICAP.- 1000 metros.
(19:00) Hrs. Premio : "OLIVAR ALTO" HANDICAP.- 1000 metros.`;
const currentConcepcion = parseChileTeletrakProgrammeText(currentConcepcionText, { racecourseId: 'club-hipico-de-concepcion-racecourse' });
assert.equal(currentConcepcion.status, 'available');
assert.equal(currentConcepcion.format, 'club_hipico_concepcion_parenthesized_hrs_headers');
assert.deepEqual(currentConcepcion.timetable_rows.map((row) => row.post_time_local), ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00']);

const currentValparaisoText = `13:30 aprox. 1.100 Mts. (3.652) Premio: ROY
14:00 aprox. 1.100 Mts. (3.653) Premio: RIGEL II
14:30 aprox. 1.100 Mts. (3.654) Premio: RIVER MINE
15:00 aprox. 1.100 Mts. (3.655) Premio: RECLAMA
15:30 aprox. 1.100 Mts. (3.656) Premio: RUCO
16:00 aprox. 1.100 Mts. (3.657) Premio: RACCONTO
16:30 aprox. 1.100 Mts. (3.658) Premio: RINGARO
17:00 aprox. 1.100 Mts. (3.659) Premio: RABINO
17:30 aprox. 1.500 Mts. (3.660) Premio: GUSTAVO RIVERA B.
18:00 aprox. 1.100 Mts. (3.661) Premio: RIO LOBO
18:30 aprox. 1.100 Mts. (3.662) Premio: RAISE A LION
19:00 aprox. 1.100 Mts. (3.663) Premio: ROMIANO
19:30 aprox. 1.100 Mts. (3.664) Premio: RABALERO
20:00 aprox. 1.100 Mts. (3.665) Premio: RIVER CAFE
20:30 aprox. 1.100 Mts. (3.666) Premio: RONALCO`;
const currentValparaiso = parseChileTeletrakProgrammeText(currentValparaisoText, { racecourseId: 'valparaiso-sporting-club-racecourse' });
assert.equal(currentValparaiso.status, 'available');
assert.equal(currentValparaiso.format, 'valparaiso_sporting_aprox_headers');
assert.deepEqual(currentValparaiso.timetable_rows.map((row) => row.post_time_local), [
  '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
  '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
]);

for (const [racecourseId, malformedText] of [
  ['club-hipico-de-concepcion-racecourse', '(16:30) Hrs. Premio : UNO\n(16:00) Hrs. Premio : DOS'],
  ['valparaiso-sporting-club-racecourse', '14:00 aprox. 1.100 Mts. Premio: UNO\n13:30 aprox. 1.100 Mts. Premio: DOS'],
  ['club-hipico-de-concepcion-racecourse', '(16:00) Hrs. Premio : UNO\n(16:00) Hrs. Premio : DOS'],
  ['valparaiso-sporting-club-racecourse', '13:30 aprox. 1.100 Mts. Premio: UNO\n13:30 aprox. 1.100 Mts. Premio: DOS'],
  ['club-hipico-de-concepcion-racecourse', '(16:00) Hrs. Premio : INCOMPLETO'],
  ['valparaiso-sporting-club-racecourse', '13:30 aprox. 1.100 Mts. Premio: INCOMPLETO'],
]) {
  assert.equal(parseChileTeletrakProgrammeText(malformedText, { racecourseId }).status, 'parse_failure');
}

const linkedBuilt = buildChileTeletrakCandidate({ html: linkedHtml, checkedAt: '2026-09-10T23:00:00Z', startDate: '2026-09-10', endDateExclusive: '2026-09-17' });
const resultsByMeeting = {
  '2026-09-10/hipodromo-chile': hch,
  '2026-09-11/club-hipico-de-santiago-racecourse': chs,
  '2026-09-14/valparaiso-sporting-club-racecourse': vsc,
  '2026-09-15/club-hipico-de-concepcion-racecourse': chc,
};
const enriched = enrichChileTeletrakCandidateWithProgrammeResults(linkedBuilt.candidate, { resultsByMeeting, checkedAt: '2026-09-10T23:05:00Z' });
assert.equal(enriched.adapter_id, CHILE_TELETRAK_DETAIL_ADAPTER_ID);
for (const date of ['2026-09-10', '2026-09-11', '2026-09-14', '2026-09-15']) {
  const record = enriched.records.find((row) => row.date === date);
  assert.ok(record, date);
  assert.equal(record.capability_rank, 'A');
  assert.equal(record.detail_observation.status, 'available');
  assert.equal(record.detail_observation.evaluated_capability_rank, 'A');
  assert.equal(record.timetable_rows.length, 3);
  assert.equal(record.source.extraction_method, 'official_linked_programme_detail');
  assert.equal(record.capability_rank === 'A+', false, 'programme time rows alone must not fabricate A+');
}
const pending = enriched.records.find((row) => row.date === '2026-09-16');
assert.ok(pending);
assert.equal(pending.capability_rank, 'C');
assert.equal(pending.detail_observation.status, 'not_published');
assert.deepEqual(pending.timetable_rows, []);

const failedResults = { ...resultsByMeeting, '2026-09-10/hipodromo-chile': { status: 'source_error', error_code: 'http_503' } };
const failed = enrichChileTeletrakCandidateWithProgrammeResults(linkedBuilt.candidate, { resultsByMeeting: failedResults, checkedAt: '2026-09-10T23:06:00Z' });
const failedHch = failed.records.find((row) => row.date === '2026-09-10');
assert.equal(failedHch.capability_rank, 'C');
assert.equal(failedHch.detail_observation.status, 'source_error');
assert.equal(failedHch.detail_observation.error_code, 'http_503');
assert.deepEqual(failedHch.timetable_rows, []);

assert.equal(deriveBestAvailableRank({ first_race_time_local: '12:00', timetable_rows: [] }), 'B');
assert.equal(deriveBestAvailableRank({ first_race_time_local: '12:00', last_race_time_local: '17:00', timetable_rows: [] }), 'B+');
assert.equal(deriveBestAvailableRank({ timetable_rows: [{ label: 'Race 1', post_time_local: '12:00' }, { label: 'Race 2', post_time_local: '12:30' }] }), 'A');

const coreSource = fs.readFileSync('scripts/timetable/chile-teletrak-weekly-core.mjs', 'utf8');
const runnerSource = fs.readFileSync('scripts/timetable/run-chile-teletrak-official-window.mjs', 'utf8');
assert.match(coreSource, /deriveBestAvailableRank/, 'Chile adapter must derive rank from normalized evidence');
assert.doesNotMatch(coreSource, /buildChileRankCCandidate|rank-c-v1|capability_rank:\s*['"]C['"]/, 'Chile adapter must not hard-code a C rank');
assert.doesNotMatch(runnerSource, /public_rank_ceiling|capability_rank:\s*['"]C['"]/, 'Chile runner must not impose a source-local public/rank ceiling');
assert.match(runnerSource, /collection_target_rank:\s*['"]best_available['"]/, 'Chile runner must target best available rank');
assert.match(runnerSource, /parseChileTeletrakProgrammeText/, 'Chile runner must evaluate linked official programme detail');
assert.match(runnerSource, /resolveClubHipicoSantiagoProgrammePdfCandidate/, 'Chile runner must resolve Santiago viewer pages to verified official PDF candidates');
assert.match(runnerSource, /fetchProgrammeDocument\(candidatePdfUrl\)/, 'Chile runner must fetch the official PDF candidate before accepting it');

const unknown = html.replace('Icono Valparaíso Sporting Club', 'Icono Hipódromo Nuevo Chile');
const unknownParsed = parseChileTeletrakWeeklyHtml(unknown, { referenceDate: '2026-09-09', startDate: '2026-09-09', endDateExclusive: '2026-09-10' });
assert.equal(unknownParsed.records.length, 0);
assert.equal(unknownParsed.unknown_venues.length, 1);
assert.throws(() => parseChileTeletrakWeeklyHtml('<html>not teletrak</html>', { referenceDate: '2026-09-09' }), /fingerprint/);

const unifiedWorkflow = fs.readFileSync('.github/workflows/calendar-unified-official-refresh.yml', 'utf8');
assert.equal((unifiedWorkflow.match(/run-chile-teletrak-official-window\.mjs/g) ?? []).length, 2, 'Chile collector must run in normal and latest-main rebuild paths');
assert.equal((unifiedWorkflow.match(/--authority-id=teletrak-chile/g) ?? []).length, 2, 'Chile apply must run in normal and latest-main rebuild paths');
assert.equal((unifiedWorkflow.match(/--artifact=\.calendar-unified\/chile\.json/g) ?? []).length, 6, 'Chile artifact must be excluded, applied and presence-evaluated in both paths');
assert.doesNotMatch(unifiedWorkflow, /chile[^\n]{0,80}(?:public_rank_ceiling|capability_rank:\s*['"]C['"])/i, 'Chile unified refresh must not hard-code C');

console.log('CHILE_UNIFIED_REFRESH_WIRING: pass');
console.log('CHILE_TELETRAK_WEEKLY_ADAPTER: pass');
console.log('CHILE_TELETRAK_PROGRAMME_ENRICHMENT: pass');
console.log(`FIXTURE_RECORDS: ${parsed.records.length}`);
console.log('BEST_AVAILABLE_RANK_PATH: pass');
console.log('PENDING_DETAIL_PRESERVES_C: pass');
console.log('DETAIL_FAILURE_PRESERVES_C: pass');
console.log('UNKNOWN_VENUE_FAIL_CLOSED: pass');
