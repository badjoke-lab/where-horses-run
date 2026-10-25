import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import {
  PANAMA_RACECOURSE_ID,
  PANAMA_ALL_EVENTS_CALENDAR_URL,
  mergePanamaProgrammeRows,
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
