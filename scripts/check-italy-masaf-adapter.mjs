import assert from 'node:assert/strict';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import { buildMasafMeetingRecord, classifyMasafCode, parseMasafCalendarPages } from './timetable/italy-masaf-core.mjs';
import { findLatestMasafCalendarDetailUrl, findMasafCalendarPdfUrl } from './timetable/run-italy-masaf-official-window.mjs';

assert.equal(classifyMasafCode('T'),'trot');assert.equal(classifyMasafCode('TF'),'trot');assert.equal(classifyMasafCode('G'),'gallop');assert.equal(classifyMasafCode('GF'),'gallop');assert.equal(classifyMasafCode('X'),null);
const normative='<a href="/flex/cm/pages/ServeBLOB.php/L/IT/IDPagina/25118">D.D.G. n. 456638 del 10/09/2026 - di modifica del calendario delle corse ippiche per l\'anno 2026</a>';
assert.equal(findLatestMasafCalendarDetailUrl(normative),'https://www.masaf.gov.it/flex/cm/pages/ServeBLOB.php/L/IT/IDPagina/25118');
const detail='<a href="/flex/cm/pages/ServeAttachment.php/L/IT/D/x/P/BLOB:ID=25118/E/pdf?mode=download">ALLEGATO n. 1 Calendario corse ippiche per l\'anno 2026 aggiornato al 10 settembre 2026</a>';
assert.match(findMasafCalendarPdfUrl(detail,'https://www.masaf.gov.it/flex/cm/pages/ServeBLOB.php/L/IT/IDPagina/25118'),/ServeAttachment/);
const xs=Array.from({length:30},(_,i)=>({str:String(i+1),x:200+i*12,y:500}));
const pages=[{page_number:1,items:[{str:'SETTEMBRE 2026',x:200,y:540},...xs,{str:'ROMA',x:50,y:450},{str:'G',x:200+24*12,y:450},{str:'MILANO',x:50,y:430},{str:'GF',x:200+26*12,y:430},{str:'TORINO',x:50,y:410},{str:'T',x:200+26*12,y:410}]}];
const parsed=parseMasafCalendarPages(pages,{year:2026,sourceUrl:'https://example.test/calendar.pdf'});
assert.equal(parsed.parse_failures.length,0);assert.equal(parsed.records.length,3);
assert.deepEqual(parsed.records.map(x=>[x.date,x.system,x.racecourse_id]),[
  ['2026-09-25','gallop','italy--ippodromo-di-roma-capannelle'],
  ['2026-09-27','gallop','italy--ippodromo-san-siro'],
  ['2026-09-27','trot','italy--ippodromo-stupinigi'],
]);
const rec=buildMasafMeetingRecord(parsed.records[0],{checkedAt:'2026-09-25T00:00:00Z'});
assert.equal(rec.capability_rank,'C');assert.equal(rec.first_race_time_local,null);assert.equal(rec.racing_system_id,'italy-masaf-gallop-system');
assert.deepEqual(validateCalendarAuthorityMetadataV1({acquisition_attempt:rec.acquisition_attempt,acquisition_completion:rec.acquisition_completion,evidence_support:rec.evidence_support}),[]);
console.log('ITALY_MASAF_ADAPTER: pass');
