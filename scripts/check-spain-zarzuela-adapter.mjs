import fs from 'node:fs';
import assert from 'node:assert/strict';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import {
  buildZarzuelaMeetingRecord,
  parseZarzuelaAutumnProgrammeText,
  parseZarzuelaMeetingHtml,
  zarzuelaMeetingUrl,
} from './timetable/spain-zarzuela-core.mjs';

const pdfText=`HIPÓDROMO DE LA ZARZUELA, S.A., S.M.E.
PROGRAMA DE LAS CARRERAS DE CABALLOS QUE SE DISPUTARÁN EN EL HIPÓDROMO DE LA ZARZUELA LOS DÍAS
10, 20, 24 y 27 de septiembre
4, 11, 18 y 25 de octubre
1, 8, 15, 22 y 29 de noviembre
Todas las carreras de este programa se disputarán sobre la pista de hierba.`;
const schedule=parseZarzuelaAutumnProgrammeText(pdfText,{sourceUrl:'https://example.test/autumn.pdf'});
assert.equal(schedule.length,13);
assert.deepEqual(schedule.slice(0,5).map((x)=>x.date),['2026-09-10','2026-09-20','2026-09-24','2026-09-27','2026-10-04']);
assert.equal(schedule.at(-1).date,'2026-11-29');
assert.equal(zarzuelaMeetingUrl('2026-09-20'),'https://www.hipodromodelazarzuela.es/carreras/jornada/20260920');

const html=`<html><body><h1>Domingo, 20 de Septiembre de 2026</h1><p>Carreras de la Jornada</p><table>
<tr><th>Premio</th><th>Dist.</th><th>Tipo</th><th>Cat.</th><th>Premio</th><th>Hora</th><th>Carrera</th></tr>
<tr><td>PREMIO UNO</td><td>Dist.:1.400</td><td>Tipo:L</td><td>Cat.:C</td><td>Premio:8.000 €</td><td>Hora: 11:30</td><td>Carrera: 1</td></tr>
<tr><td>PREMIO DOS</td><td>Dist.:1.600</td><td>Tipo:L</td><td>Cat.:B</td><td>Premio:15.000 €</td><td>Hora: 12:05</td><td>Carrera: 2</td></tr>
<tr><td>PREMIO TRES</td><td>Dist.:2.200</td><td>Tipo:L</td><td>Cat.:D</td><td>Premio:4.500 €</td><td>Hora: 12:40</td><td>Carrera: 3</td></tr>
</table></body></html>`;
const parsed=parseZarzuelaMeetingHtml(html,{date:'2026-09-20',sourceUrl:'https://example.test/jornada'});
assert.equal(parsed.status,'available');
assert.equal(parsed.meeting_present,true);
assert.equal(parsed.race_rows.length,3);
assert.equal(parsed.race_rows[0].distance_m,1400);
const checkedAt='2026-09-25T00:00:00Z';
const record=buildZarzuelaMeetingRecord(schedule[1],parsed.race_rows,{checkedAt,detailStatus:parsed.status,detailUrl:'https://example.test/jornada'});
assert.equal(record.capability_rank,'A');
assert.equal(record.first_race_time_local,'11:30');
assert.equal(record.last_race_time_local,'12:40');
assert.equal(record.acquisition_completion.disposition,'complete_current_best_available');
assert.deepEqual(validateCalendarAuthorityMetadataV1({acquisition_attempt:record.acquisition_attempt,acquisition_completion:record.acquisition_completion,evidence_support:record.evidence_support}),[]);

const futureHtml=`<html><body><p>Carreras de la Jornada</p><table><tr><td>PREMIO 197</td><td>Dist.:1.600</td><td>Hora:</td><td>Carrera:</td></tr></table></body></html>`;
const future=parseZarzuelaMeetingHtml(futureHtml,{date:'2026-10-18',sourceUrl:'https://example.test/future'});
assert.equal(future.status,'not_published');
assert.equal(future.meeting_present,true);
assert.equal(future.race_rows.length,0);

const runnerSource=fs.readFileSync('scripts/timetable/run-spain-zarzuela-official-window.mjs','utf8');
assert.match(runnerSource,/meeting_page_schedule_fallback/,'Zarzuela runner must recover schedule dates from official jornada pages when the season PDF is unavailable');
assert.match(runnerSource,/meetingPageCache/,'Zarzuela fallback discovery must reuse fetched meeting pages for detail parsing');

console.log('SPAIN_ZARZUELA_ADAPTER: pass');
