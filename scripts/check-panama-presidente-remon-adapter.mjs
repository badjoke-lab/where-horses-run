import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import {
  PANAMA_RACECOURSE_ID,
  PANAMA_ALL_EVENTS_CALENDAR_URL,
  mergePanamaProgrammeRows,
  classifyPanamaPageCoverage,
  panamaBoundedWindow,
  buildPanamaMeetingRecord,
  parsePanamaProgrammePage,
} from './timetable/panama-presidente-remon-core.mjs';

const sourceUrl = 'https://www.hipodromo.com/index.php/calendario/categoria/programa-oficial/';
const html = `<html><body>
<h1>Programa Oficial</h1>
<article><a href="/event/programa-oficial-jueves-24-de-septiembre-de-2026/">Programa Oficial Jueves 24 de septiembre de 2026</a><p>septiembre 24 @ 08:00 - 17:00</p></article>
<article><a href="/event/programa-oficil-sabado-26-de-septiembre-de-2026/">Programa Oficil Sabado 26 de septiembre de 2026</a><p>septiembre 26 @ 08:00 - 17:00</p></article>
<article><a href="/event/programa-oficial-domingo-27-de-septiembre-de-2026/">Programa Oficial Domingo 27 de septiembre de 2026</a><p>septiembre 27 @ 08:00 - 17:00</p></article>
<article><a href="/event/programa-oficial-domingo-6-d-septiembre-de-2026/">Programa Oficial Domingo 6 d septiembre de 2026</a></article>
</body></html>`;

const rows = parsePanamaProgrammePage(html, { sourceUrl });
assert.deepEqual(rows.map((row) => [row.date, row.racecourse_id]), [
  ['2026-09-06', PANAMA_RACECOURSE_ID],
  ['2026-09-24', PANAMA_RACECOURSE_ID],
  ['2026-09-26', PANAMA_RACECOURSE_ID],
  ['2026-09-27', PANAMA_RACECOURSE_ID],
]);

// Real-world regression: the Oct 24 Programa Oficial article was miscoded
// into the operator's SimulCasting category and omitted from the narrower
// Programa Oficial calendar even though it appeared in the general calendar.
// The older-year and provisional titles must not promote to a 2026 fixture.
const generalHtml = `<html><body>
<h1>Calendario de eventos</h1>
<a href="/index.php/evento/programa-oficial-sabado-24-de-octubre-de-2026/">Programa Oficial Sabado 24 de octubre de 2026</a>
<p>Categoria del Evento: SimulCasting; octubre 24 @ 08:00 - 17:00</p>
<a>Programa Oficial Domingo 25 de octubre de 2025</a>
<a>Provisional Domingo 25 de octubre de 2026</a>
<a>PESOS SABADO 24 OCTUBRE 2026</a>
</body></html>`;
const allYears = parsePanamaProgrammePage(generalHtml,{sourceUrl:PANAMA_ALL_EVENTS_CALENDAR_URL});
// Generic parser supports historical official programmes, but production
// retains only the requested 2026 rolling window. Do not count a 2025 title.
assert.deepEqual(allYears.map(row => row.date),['2025-10-25','2026-10-24']);
const supplemental = allYears.filter(row => row.date >= '2026-10-24' && row.date < '2026-11-23');
assert.deepEqual(supplemental.map(row => row.date),['2026-10-24']);
const overlapping = parsePanamaProgrammePage('<h1>Programa Oficial</h1><p>Programa Oficial Sabado 24 de octubre de 2026</p>');
const combined = mergePanamaProgrammeRows(supplemental,overlapping);
assert.deepEqual(combined.map(row=>row.date),['2026-10-24']);
assert.equal(combined[0].source_url,PANAMA_ALL_EVENTS_CALENDAR_URL);
const sourceRunner = fs.readFileSync('scripts/timetable/run-panama-presidente-remon-official-window.mjs','utf8');
assert.match(sourceRunner,/PANAMA_ALL_EVENTS_CALENDAR_URL/);
assert.match(sourceRunner,/mergePanamaProgrammeRows/);
assert.match(sourceRunner,/source_warnings: sourceWarnings/);

// In the real 2026-10-25 live probe, *both* pages returned HTTP 500.
// On other runs, one page can be unavailable while the other contains old
// records. Such a mixed result is partial, never a complete source horizon.
const okPage = { kind: 'official_category', status: 'success', parsed_rows: 10 };
const failedPage = { kind: 'official_calendar_overview', status: 'source_error', error: 'HTTP 500' };
assert.deepEqual(classifyPanamaPageCoverage([okPage, failedPage], 10), {
  status: 'success', coverage_claim: 'source_visible_partial',
});
assert.deepEqual(classifyPanamaPageCoverage([failedPage, failedPage], 0), {
  status: 'network_error', coverage_claim: 'acquisition_failed_preserve_verified_state',
});
assert.deepEqual(classifyPanamaPageCoverage([okPage, failedPage], 0), {
  status: 'parse_error', coverage_claim: 'acquisition_failed_preserve_verified_state',
});
assert.deepEqual(classifyPanamaPageCoverage([okPage, okPage], 10), {
  status: 'success', coverage_claim: 'official_source_visible_horizon',
});
assert.match(sourceRunner, /coverage_claim: classification.coverage_claim/);
assert.match(sourceRunner, /source_warnings: sourceWarnings.length/);

// Bound the replay to positive official dates; do not truncate future horizon.
const bounded = panamaBoundedWindow('2026-10-27', 30, 7);
assert.deepEqual(bounded, {
  start_date: '2026-10-20',
  forward_start_date: '2026-10-27',
  end_date_exclusive: '2026-11-26',
  days: 37,
  lookback_days: 7,
});
const candidates = ['2026-10-18', '2026-10-22', '2026-10-24', '2026-11-25', '2026-11-26'];
assert.deepEqual(
  candidates.filter(date => date >= bounded.start_date && date < bounded.end_date_exclusive),
  ['2026-10-22', '2026-10-24', '2026-11-25'],
);
assert.deepEqual(panamaBoundedWindow('2026-10-27', 30).start_date, '2026-10-27');
assert.throws(() => panamaBoundedWindow('2026-10-27', 30, 8), /lookback/);
assert.throws(() => panamaBoundedWindow('2026-02-30', 30, 7), /calendar date/);
assert.match(sourceRunner, /panamaBoundedWindow\(start, days, lookbackDays\)/);
assert.match(sourceRunner, /inWindow\(row.date, collectionWindow.start_date, end\)/);
for (const file of [
  '.github/workflows/calendar-unified-official-refresh.yml',
  '.github/workflows/calendar-near-official-refresh.yml',
  'scripts/timetable/rebuild-unified-non-japan-on-main.sh',
]) {
  const data = fs.readFileSync(file, 'utf8');
  const idx = data.indexOf('node scripts/timetable/run-panama-presidente-remon-official-window.mjs');
  assert.ok(idx >= 0 && data.slice(idx, idx + 225).includes('--lookback-days=7'), file);
}

const checkedAt = '2026-09-26T00:00:00Z';
const record = buildPanamaMeetingRecord(rows[2], { checkedAt });
assert.equal(record.country_id, 'panama');
assert.equal(record.authority_id, 'hipica-de-panama');
assert.equal(record.racing_system_id, 'presidente-remon-racing-system');
assert.equal(record.racecourse_id, PANAMA_RACECOURSE_ID);
assert.equal(record.capability_rank, 'C');
assert.equal(record.first_race_time_local, null);
assert.equal(record.last_race_time_local, null);
assert.deepEqual(record.timetable_rows, []);
assert.equal(record.acquisition_completion.disposition, 'not_applicable');
assert.equal(record.notes.includes('08:00'), false, 'event operating hours must not be retained as race time evidence');
assert.deepEqual(validateCalendarAuthorityMetadataV1({
  acquisition_attempt: record.acquisition_attempt,
  acquisition_completion: record.acquisition_completion,
  evidence_support: record.evidence_support,
}), []);

console.log('PANAMA_PRESIDENTE_REMON_ADAPTER: pass');
