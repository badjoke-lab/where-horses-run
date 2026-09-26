import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import {
  buildMonterricoFallbackRecord,
  buildMonterricoMeetingRecord,
  extractMonterricoEntryProgrammeLinks,
  extractMonterricoReunionIds,
  parseMonterricoProgrammeHtml,
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

const parsed=parseMonterricoProgrammeHtml(html,{expectedDate:'2026-09-20'});
assert.equal(parsed.meeting_date,'2026-09-20');
assert.equal(parsed.timetable_rows.length,3);
assert.deepEqual(parsed.timetable_rows[0],{label:'Race 1',post_time_local:'13:30',race_name:'Handicap',distance_m:1000});
assert.throws(()=>parseMonterricoProgrammeHtml(html,{expectedDate:'2026-09-21'}),/date mismatch/);

const htmlWithoutDate='<!doctype html><html><body>'+
'<h1>Reunión Hipódromo de Monterrico</h1>'+
'<table><tr><th>N°</th><th>Hora</th><th>Carrera</th><th>Dist.</th></tr>'+
'<tr><td>1 ª</td><td>13:30</td><td>Handicap</td><td>1000</td></tr>'+
'<tr><td>2 ª</td><td>14:00</td><td>Condicional</td><td>1200</td></tr></table></body></html>';
const parsedWithoutDate=parseMonterricoProgrammeHtml(htmlWithoutDate,{expectedDate:'2026-09-27'});
assert.equal(parsedWithoutDate.meeting_date,'2026-09-27');
assert.equal(parsedWithoutDate.timetable_rows.length,2);

const record=buildMonterricoMeetingRecord({date:'2026-09-20',reunionId:102400,programmeHtml:html,checkedAt:'2026-09-20T14:30:00Z'});
assert.equal(record.country_id,'peru');
assert.equal(record.racecourse_id,'monterrico-racecourse');
assert.equal(record.capability_rank,'A');
assert.equal(record.detail_observation.status,'available');
assert.equal(record.timetable_rows[2].distance_m,1600);
assert.deepEqual(validateCalendarAuthorityMetadataV1({acquisition_attempt:record.acquisition_attempt,evidence_support:record.evidence_support},record.meeting_id),[]);

const fallback=buildMonterricoFallbackRecord({date:'2026-09-21',reunionId:102401,checkedAt:'2026-09-20T14:30:00Z',status:'not_published',errorCode:'programme_not_published'});
assert.equal(fallback.capability_rank,'C');
assert.equal(fallback.detail_observation.status,'not_published');
assert.equal(fallback.acquisition_attempt.status,'pending_publication');

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
    console.log('PERU_LIVE_ROWS:',JSON.stringify({
      rows:artifact.records.map((row)=>({date:row.date,rank:row.capability_rank,detail:row.detail_observation?.status,race_count:row.detail_observation?.race_count,error_code:row.detail_observation?.error_code})),
      source_errors:artifact.diagnostics?.source_errors,
    }));
    if([...byDate.values()].some((row)=>row.capability_rank!=='A')){
      try{
        const componentUrl='https://hipodromodemonterrico.com.pe/generales_librerias/componentes_vue/generales/vue-comp-proximos-programas.js';
        const response=await fetch(componentUrl,{headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)'}});
        const body=await response.text();
        const symbols={};
        for(const symbol of ['url_api','url_api_carreras','url_api_reunion','url_api_pdf_elturf','app_pertenece_validacion','dominio_apis']){
          const escaped=symbol.replace(/[.*+?^$(){}|[\]\\]/g,'\\        const apiHits=[...body.matchAll(/.{0,300}(?:\$http\.(?:get|post)|id_reunion|url_api|ruta_api).{0,900}/gi)]
          .slice(0,40).map((m)=>m[0].replace(/\s+/g,' '));
        console.log('PERU_PROGRAMME_COMPONENT_API:',JSON.stringify({status:response.status,length:body.length,hits:apiHits}));');
          const re=new RegExp(escaped+'\\s*:\\s*\\{[\\s\\S]{0,500}?\\}','i');
          symbols[symbol]=body.match(re)?.[0]?.replace(/\s+/g,' ')??null;
        }
        const requestBlocks=[...body.matchAll(/(?:var ruta_api = this\.api_datos_reunion|this\.\$http\.get\(this\.api_pdf_elturf)[\s\S]{0,900}/gi)]
          .slice(0,10).map((m)=>m[0].replace(/\s+/g,' '));
        console.log('PERU_PROGRAMME_COMPONENT_API:',JSON.stringify({status:response.status,length:body.length,symbols,request_blocks:requestBlocks}));
      }catch(error){
        console.log('PERU_PROGRAMME_COMPONENT_API:',JSON.stringify({error:String(error?.message??error)}));
      }
    }
    for(const date of ['2026-09-26','2026-09-27']){
      const row=byDate.get(date);
      assert.ok(row,`live Monterrico route must recover ${date}`);
      assert.equal(row.capability_rank,'A',`published Monterrico programme must reach A for ${date}`);
      assert.equal(row.detail_observation?.status,'available');
      assert.ok(row.timetable_rows?.length>=2);
    }
    assert.equal(artifact.acquisition_attempt?.status,'success');
  }finally{
    fs.rmSync(liveOutput,{force:true});
  }
}

console.log('PERU_MONTERRICO_ADAPTER: pass');
