import assert from 'node:assert/strict';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import {
  buildMonterricoFallbackRecord,
  buildMonterricoMeetingRecord,
  extractMonterricoReunionIds,
  parseMonterricoProgrammeHtml,
} from './timetable/peru-monterrico-core.mjs';

assert.deepEqual(extractMonterricoReunionIds({reuniones:[]}),[]);
assert.deepEqual(extractMonterricoReunionIds({reuniones:[{id_reunion:102400}]}),[102400]);
assert.deepEqual(extractMonterricoReunionIds({reuniones:[{idReunion:'102401'}]}),[102401]);
assert.throws(()=>extractMonterricoReunionIds({resultados:[]}),/missing reuniones/);
assert.throws(()=>extractMonterricoReunionIds({reuniones:[{foo:'bar'}]}),/without a resolvable reunion id/);

const html='<!doctype html><html><body>'+
'<h1>Reunión N°387 Hipódromo de Monterrico, Domingo 20 de Septiembre del año 2026</h1>'+
'<table><tr><th>N°</th><th>Hora</th><th>Carrera</th><th>Dist.</th></tr>'+
'<tr><td>1 ª</td><td>13:30</td><td>Handicap</td><td>1000</td></tr>'+
'<tr><td>2 ª</td><td>14:00</td><td>Condicional</td><td>1200</td></tr>'+
'<tr><td>3 ª</td><td>14:30</td><td>Clásico Ejemplo</td><td>1600</td></tr></table></body></html>';

const parsed=parseMonterricoProgrammeHtml(html,{expectedDate:'2026-09-20'});
assert.equal(parsed.meeting_date,'2026-09-20');
assert.equal(parsed.timetable_rows.length,3);
assert.deepEqual(parsed.timetable_rows[0],{label:'Race 1',post_time_local:'13:30',race_name:'Handicap',distance_m:1000});
assert.throws(()=>parseMonterricoProgrammeHtml(html,{expectedDate:'2026-09-21'}),/date mismatch/);

const record=buildMonterricoMeetingRecord({date:'2026-09-20',reunionId:102400,programmeHtml:html,checkedAt:'2026-09-20T14:30:00Z'});
assert.equal(record.country_id,'peru');
assert.equal(record.racecourse_id,'monterrico-racecourse');
assert.equal(record.capability_rank,'A');
assert.equal(record.detail_observation.status,'available');
assert.equal(record.detail_observation.evaluated_capability_rank,'A');
assert.equal(record.timetable_rows[2].distance_m,1600);
assert.equal('surface' in record.timetable_rows[0],false);
assert.equal('course_label' in record.timetable_rows[0],false);
assert.deepEqual(validateCalendarAuthorityMetadataV1({acquisition_attempt:record.acquisition_attempt,evidence_support:record.evidence_support},record.meeting_id),[]);

const fallback=buildMonterricoFallbackRecord({date:'2026-09-21',reunionId:102401,checkedAt:'2026-09-20T14:30:00Z',status:'not_published',errorCode:'programme_not_published'});
assert.equal(fallback.capability_rank,'C');
assert.equal(fallback.detail_observation.status,'not_published');
assert.equal(fallback.acquisition_attempt.status,'pending_publication');
assert.deepEqual(validateCalendarAuthorityMetadataV1({acquisition_attempt:fallback.acquisition_attempt,evidence_support:fallback.evidence_support},fallback.meeting_id),[]);

console.log('PERU_MONTERRICO_ADAPTER: pass');
