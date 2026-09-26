import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import {
  buildMonterricoApiMeetingRecord,
  buildMonterricoFallbackRecord,
  buildMonterricoMeetingRecord,
  extractMonterricoEntryProgrammeLinks,
  extractMonterricoReunionIds,
  parseMonterricoProgrammeHtml,
  parseMonterricoProgrammePayload,
} from './timetable/peru-monterrico-core.mjs';

assert.deepEqual(extractMonterricoReunionIds({reuniones:[]}),[]);
assert.deepEqual(extractMonterricoReunionIds({reuniones:[{id_reunion:102400}]}),[102400]);
assert.deepEqual(extractMonterricoReunionIds({reuniones:[{idReunion:'102401'}]}),[102401]);
assert.throws(()=>extractMonterricoReunionIds({resultados:[]}),/missing reuniones/);
assert.throws(()=>extractMonterricoReunionIds({reuniones:[{foo:'bar'}]}),/without a resolvable reunion id/);

const entryHtml='<!doctype html><html><body><table>'+
'<tr><td>26Sep26</td><td>Carlos Palacios Villacampa</td><td><a href="/carreras-proximos-programas?id_reunion=102401">Programa</a></td></tr>'+
'<tr><td>27Sep26</td><td>Deepak</td><td><a href="https://hipodromodemonterrico.com.pe/carreras-proximos-programas?id_reunion=102402">Programa</a></td></tr>'+
'</table></body></html>';
assert.deepEqual(extractMonterricoEntryProgrammeLinks(entryHtml),[
  {date:'2026-09-26',reunion_id:102401,programme_url:'https://hipodromodemonterrico.com.pe/carreras-proximos-programas?id_reunion=102401'},
  {date:'2026-09-27',reunion_id:102402,programme_url:'https://hipodromodemonterrico.com.pe/carreras-proximos-programas?id_reunion=102402'},
]);

const html='<!doctype html><html><body>'+
'<h1>Reunión N°387 Hipódromo de Monterrico, Domingo 20 de Septiembre del año 2026</h1>'+
'<table><tr><th>N°</th><th>Hora</th><th>Carrera</th><th>Dist.</th></tr>'+
'<tr><td>1 ª</td><td>13:30</td><td>Handicap</td><td>1000</td></tr>'+
'<tr><td>2 ª</td><td>14:00</td><td>Condicional</td><td>1200</td></tr>'+
'<tr><td>3 ª</td><td>14:30</td><td>Clásico Ejemplo</td><td>1600</td></tr></table></body></html>';
const parsedHtml=parseMonterricoProgrammeHtml(html,{expectedDate:'2026-09-20'});
assert.equal(parsedHtml.meeting_date,'2026-09-20');
assert.equal(parsedHtml.timetable_rows.length,3);
assert.throws(()=>parseMonterricoProgrammeHtml(html,{expectedDate:'2026-09-21'}),/date mismatch/);

const legacyRecord=buildMonterricoMeetingRecord({date:'2026-09-20',reunionId:102400,programmeHtml:html,checkedAt:'2026-09-20T14:30:00Z'});
assert.equal(legacyRecord.capability_rank,'A');

const apiPayload={
  calculos:{102454:0},
  resultados:{102454:0},
  reuniones:[{
    id_reunion:102454,
    fecha_reunion:'2026-09-26',
    nombre_hipodromo:'Hipódromo de Monterrico',
    carreras:[
      {correlativo:1,hora_carrera:'13:30',nombre_premio:'Condicional',distancia:1000},
      {correlativo:2,hora_carrera:'14:00',nombre_premio:'Handicap',distancia:1000},
      {correlativo:3,hora_carrera:'14:25',nombre_premio:'Condicional',distancia:1400},
    ],
  }],
};
const parsedApi=parseMonterricoProgrammePayload(apiPayload,{expectedDate:'2026-09-26',expectedReunionId:102454});
assert.equal(parsedApi.meeting_date,'2026-09-26');
assert.deepEqual(parsedApi.timetable_rows[0],{label:'Race 1',post_time_local:'13:30',race_name:'Condicional',distance_m:1000});
const apiRecord=buildMonterricoApiMeetingRecord({
  date:'2026-09-26',
  reunionId:102454,
  programmePayload:apiPayload,
  checkedAt:'2026-09-26T12:00:00Z',
  sourceUrl:'https://hipodromodemonterrico.com.pe/api/general/carreras/general/programas/102454',
});
assert.equal(apiRecord.capability_rank,'A');
assert.equal(apiRecord.detail_observation.status,'available');
assert.equal(apiRecord.first_race_time_local,'13:30');
assert.equal(apiRecord.last_race_time_local,'14:25');
assert.equal(apiRecord.route_id,'monterrico-date-api-to-reunion-api');
assert.deepEqual(validateCalendarAuthorityMetadataV1({acquisition_attempt:apiRecord.acquisition_attempt,evidence_support:apiRecord.evidence_support},apiRecord.meeting_id),[]);

const fallback=buildMonterricoFallbackRecord({date:'2026-09-21',reunionId:102401,checkedAt:'2026-09-20T14:30:00Z',status:'not_published',errorCode:'programme_not_published'});
assert.equal(fallback.capability_rank,'C');
assert.equal(fallback.detail_observation.status,'not_published');

if(process.env.GITHUB_ACTIONS==='true'){
  const liveOutput='.peru-live-'+process.pid+'.json';
  try{
    execFileSync(process.execPath,[
      'scripts/timetable/run-peru-monterrico-official-window.mjs',
      '--as-of=2026-09-24',
      '--days=4',
      '--output='+liveOutput,
    ],{encoding:'utf8'});
    const artifact=JSON.parse(fs.readFileSync(liveOutput,'utf8'));
    const byDate=new Map(artifact.records.map((row)=>[row.date,row]));
    for(const date of ['2026-09-26','2026-09-27']){
      const row=byDate.get(date);
      assert.ok(row,`live Monterrico route must recover ${date}`);
      assert.equal(row.capability_rank,'A',`official reunion API must reach A for ${date}`);
      assert.equal(row.detail_observation?.status,'available');
      assert.ok(row.timetable_rows?.length>=2);
      assert.equal(row.route_id,'monterrico-date-api-to-reunion-api');
    }
    assert.equal(artifact.acquisition_attempt?.status,'success');
    assert.equal(artifact.diagnostics?.source_errors?.filter((row)=>row.stage==='programme_detail').length,0);
  }finally{
    fs.rmSync(liveOutput,{force:true});
  }
}

console.log('PERU_MONTERRICO_ADAPTER: pass');
