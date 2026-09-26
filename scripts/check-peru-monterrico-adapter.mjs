import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import {
  PERU_MONTERRICO_ENTRY_PROGRAMME_URL,
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
'<tr><td></td><td>Another race</td><td><a href="/carreras-proximos-programas?id_reunion=102402">Programa</a></td></tr>'+
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

if(process.env.GITHUB_ACTIONS==='true') {
  const liveOutput='.peru-live-fallback-smoke-'+process.pid+'.json';
  try {
    const stdout=execFileSync(process.execPath,[
      'scripts/timetable/run-peru-monterrico-official-window.mjs',
      '--as-of=2026-09-24',
      '--days=4',
      '--output='+liveOutput,
    ],{encoding:'utf8'});
    const artifact=JSON.parse(fs.readFileSync(liveOutput,'utf8'));
    const dates=new Set(artifact.records.map(row=>row.date));
    console.log('PERU_MONTERRICO_LIVE_FALLBACK_DEBUG:',JSON.stringify({
      records:artifact.records.length,
      dates:[...dates].sort(),
      acquisition_status:artifact.acquisition_attempt?.status,
      coverage_claim:artifact.window?.coverage_claim,
      fallback_discovery:artifact.discovery?.fallback_discovery,
      runner_stdout:stdout.trim(),
    }));
    if(!dates.has('2026-09-26') || !dates.has('2026-09-27')) {
      const response=await fetch(PERU_MONTERRICO_ENTRY_PROGRAMME_URL,{headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)'}});
      const body=await response.text();
      const idSnippets=[...body.matchAll(/.{0,120}id_reunion.{0,180}/gi)].slice(0,30).map(m=>m[0].replace(/\s+/g,' '));
      const programmeSnippets=[...body.matchAll(/.{0,120}Programa.{0,180}/gi)].slice(0,30).map(m=>m[0].replace(/\s+/g,' '));
      const apiSnippets=[...body.matchAll(/.{0,160}(?:\/api\/|axios|fetch\s*\().{0,220}/gi)].slice(0,40).map(m=>m[0].replace(/\s+/g,' '));
      const entryComponentSnippets=[...body.matchAll(/.{0,180}entrad.{0,300}/gi)].slice(0,40).map(m=>m[0].replace(/\s+/g,' '));
      const scriptSrcs=[...body.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(m=>new URL(m[1],PERU_MONTERRICO_ENTRY_PROGRAMME_URL).toString());
      const scriptDiagnostics=[];
      for(const scriptUrl of scriptSrcs.filter(url=>/app-mont|app-mixings|jcp-by-kapital/i.test(url)).slice(0,20)) {
        try {
          const scriptResponse=await fetch(scriptUrl,{headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)'}});
          const scriptBody=await scriptResponse.text();
          const hits=[...scriptBody.matchAll(/.{0,180}(?:programa-de-entradas|programas\/fecha|programas|id_reunion|reunion).{0,260}/gi)].slice(0,25).map(m=>m[0].replace(/\s+/g,' '));
          const entryHits=[...scriptBody.matchAll(/.{0,220}entrad.{0,360}/gi)].slice(0,60).map(m=>m[0].replace(/\s+/g,' '));
          const programaTemporadaHits=[...scriptBody.matchAll(/.{0,260}compProgramaTemporada.{0,420}/gi)].slice(0,20).map(m=>m[0].replace(/\s+/g,' '));
          const dominioApiHits=[...scriptBody.matchAll(/.{0,220}dominio_apis.{0,320}/gi)].slice(0,20).map(m=>m[0].replace(/\s+/g,' '));
          const componentDiagnostics=[];
          const componentImports=[...scriptBody.matchAll(/compProgramaTemporada\s*=\s*\(\)\s*=>\s*import\(["']([^"']+)["']/gi)].map(m=>{
            const componentUrl=new URL(m[1].replace(/\+.*$/,''),scriptUrl);
            if(componentUrl.searchParams.get('v')===''){
              const parentVersion=new URL(scriptUrl).searchParams.get('v');
              if(parentVersion) componentUrl.searchParams.set('v',parentVersion);
            }
            return componentUrl.toString();
          });
          for(const componentUrl of componentImports.slice(0,5)) {
            try {
              const componentResponse=await fetch(componentUrl,{headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)'}});
              const componentBody=await componentResponse.text();
              const componentHits=[...componentBody.matchAll(/.{0,260}(?:\/api\/|programa|temporada|reunion|fecha).{0,500}/gi)].slice(0,80).map(m=>m[0].replace(/\s+/g,' '));
              const staticPdfHits=[...componentBody.matchAll(/.{0,320}(?:pdf_programa_temporada|pdf_monterrico|programas-pdf-sistema|\.pdf).{0,900}/gi)].slice(0,80).map(m=>m[0].replace(/\s+/g,' '));
              const symbolHits={};
              for(const symbol of ['url_api_programas','app_pertenece_validacion','ruta_api_programas','dominio_apis','respuesta_items_programas','lista_programas','programas-pdf-sistema','tipo_calendario']) {
                const snippets=[];
                let from=0;
                while(snippets.length<12) {
                  const idx=componentBody.indexOf(symbol,from);
                  if(idx<0) break;
                  snippets.push(componentBody.slice(Math.max(0,idx-500),Math.min(componentBody.length,idx+1400)).replace(/\s+/g,' '));
                  from=idx+symbol.length;
                }
                symbolHits[symbol]=snippets;
              }
              componentDiagnostics.push({url:componentUrl,status:componentResponse.status,length:componentBody.length,static_pdf_hits:staticPdfHits,symbol_hits:symbolHits});
            } catch(error) {
              componentDiagnostics.push({url:componentUrl,error:String(error?.message??error)});
            }
          }
          if(hits.length || entryHits.length || programaTemporadaHits.length) scriptDiagnostics.push({url:scriptUrl,status:scriptResponse.status,length:scriptBody.length,hits,entry_hits:entryHits,programa_temporada_hits:programaTemporadaHits,dominio_api_hits:dominioApiHits,component_imports:componentImports,component_diagnostics:componentDiagnostics});
        } catch(error) {
          scriptDiagnostics.push({url:scriptUrl,error:String(error?.message??error)});
        }
      }
            const inferredMonthlyUrl='https://hipodromodemonterrico.com.pe/api/general/calendarios/programa_temporada/2026-09-01/2026-09-30';
      let inferredMonthlyProbe={url:inferredMonthlyUrl};
      try {
        const inferredResponse=await fetch(inferredMonthlyUrl,{headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)','accept':'application/json,text/plain;q=0.9,*/*;q=0.5'}});
        const inferredBody=await inferredResponse.text();
        inferredMonthlyProbe={url:inferredMonthlyUrl,status:inferredResponse.status,content_type:inferredResponse.headers.get('content-type'),length:inferredBody.length,preview:inferredBody.slice(0,5000)};
      } catch(error) {
        inferredMonthlyProbe={url:inferredMonthlyUrl,error:String(error?.message??error)};
      }
console.log('PERU_MONTERRICO_MONTHLY_API_PROBE:',JSON.stringify(inferredMonthlyProbe));
      console.log('PERU_MONTERRICO_ENTRY_HTML_DEBUG:',JSON.stringify({status:response.status,content_type:response.headers.get('content-type'),length:body.length,id_snippets:idSnippets,programme_snippets:programmeSnippets,api_snippets:apiSnippets,entry_component_snippets:entryComponentSnippets,script_srcs:scriptSrcs,script_diagnostics:scriptDiagnostics,inferred_monthly_probe:inferredMonthlyProbe}));
    }
    assert.ok(dates.has('2026-09-26'),'Peru live fallback must recover the published 2026-09-26 Monterrico meeting');
    assert.ok(dates.has('2026-09-27'),'Peru live fallback must recover the published 2026-09-27 Monterrico meeting');
    console.log('PERU_MONTERRICO_LIVE_FALLBACK:',JSON.stringify({
      records:artifact.records.length,
      dates:[...dates].sort(),
      acquisition_status:artifact.acquisition_attempt?.status,
      coverage_claim:artifact.window?.coverage_claim,
      fallback_discovery:artifact.discovery?.fallback_discovery,
      runner_stdout:stdout.trim(),
    }));
  } finally {
    fs.rmSync(liveOutput,{force:true});
  }
}

console.log('PERU_MONTERRICO_ADAPTER: pass');
