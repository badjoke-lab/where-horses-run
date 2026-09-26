import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import assert from 'node:assert/strict';
import { validateCalendarAuthorityMetadataV1 } from './timetable/calendar-authority-metadata.mjs';
import {
  buildFnchFixtureRecord,
  buildFnchMixedMeetingRecord,
  buildFnchProgrammeRecord,
  parseFnchProgrammeText,
  parseFnchRegionalProgrammePage,
  resolveFranceRacecourseId,
} from './timetable/france-fnch-core.mjs';

const sourceUrl='https://www.fnch.fr/federation-test/programme-des-courses';
const html=`<html><body><h1>Programme des courses</h1>
<h2>Hippodrome Marseille-Borely</h2><div>Réunion</div><div>22 Sep. 2026 À 10h50</div><div>Discipline</div><div>Trot</div><a href="/sites/default/files/programs-fede/20260922_Hippodrome%20Marseille-Borely.pdf">Télécharger le programme</a>
<h2>Hippodrome Toulouse</h2><div>Réunion</div><div>23 Sep. 2026 À 16h02</div><div>Discipline</div><div>Galop</div>
<h2>Hippodrome Senonnes-Pouancé</h2><div>Réunion</div><div>24 Sep. 2026 À 11h00</div><div>Discipline</div><div>Galop</div><div>Obstacle</div>
</body></html>`;
const parsed=parseFnchRegionalProgrammePage(html,{sourceUrl});
assert.equal(parsed.records.length,3);
assert.equal(parsed.parse_failures.length,0);
assert.equal(parsed.unknown_disciplines.length,0);
const trot=parsed.records[0];const galop=parsed.records[1];
assert.equal(trot.system_key,'letrot');
assert.equal(trot.date,'2026-09-22');
assert.equal(trot.racecourse_id,'marseille-borely-racecourse');
assert.equal(trot.programme_url,'https://www.fnch.fr/sites/default/files/programs-fede/20260922_Hippodrome%20Marseille-Borely.pdf');
assert.equal(galop.system_key,'galop');
assert.equal(galop.racecourse_id,'toulouse-racecourse');
assert.equal(resolveFranceRacecourseId('Vichy-Auvergne'),'vichy-racecourse');
assert.equal(resolveFranceRacecourseId('La Teste de Buch'),'la-teste-racecourse');
assert.equal(resolveFranceRacecourseId('Senonnes-Pouancé'),'senonnes-pouance-racecourse');

const mixedHtml=`<html><body><h1>Programme des courses</h1>
<h2>Hippodrome Saint-Malo</h2><div>Réunion</div><div>27 Sep. 2026 À 14h10</div><div>Discipline</div><div>Trot Obstacle</div><a href="/sites/default/files/programs-fede/20260927_Hippodrome%20Saint-Malo.pdf">Télécharger le programme</a>
</body></html>`;
const mixed=parseFnchRegionalProgrammePage(mixedHtml,{sourceUrl});
assert.equal(mixed.records.length,1,'mixed FNCH physical meeting must be emitted once');
assert.equal(mixed.records[0].system_key,'galop','mixed meeting is routed once through France Galop rather than duplicated across two public systems');
assert.equal(mixed.records[0].mixed_disciplines,true);
const mixedRecord=buildFnchMixedMeetingRecord(mixed.records[0],{checkedAt:'2026-09-26T00:00:00Z'});
assert.equal(mixedRecord.capability_rank,'B');
assert.equal(mixedRecord.first_race_time_local,'14:10');
assert.equal(mixedRecord.detail_observation.status,'not_applicable');
assert.equal(mixedRecord.acquisition_completion.higher_rank_open,false);
assert.equal(mixedRecord.timetable_rows.length,0);

const applySource=fs.readFileSync('scripts/timetable/apply-official-rolling-observations.mjs','utf8');
assert.match(applySource,/artifact\.superseded_meeting_ids/,'rolling apply must consume explicit superseded meeting ids');
assert.match(applySource,/canonicalById\.delete\(meetingId\)/,'rolling apply must remove superseded canonical meetings');
assert.match(applySource,/detailsById\.delete\(meetingId\)/,'rolling apply must remove superseded canonical details');

const programme=`MARSEILLE BORELY\nMardi 22 septembre 2026\n1ère Course – Départ : 11 h. 12 PRIX A\n2ème Course – Départ : 11 h. 42 PRIX B\n3ème Course – Départ : 12 h. 17 PRIX C`;
const rows=parseFnchProgrammeText(programme);
assert.deepEqual(rows,[
  {label:'Race 1',post_time_local:'11:12'},
  {label:'Race 2',post_time_local:'11:42'},
  {label:'Race 3',post_time_local:'12:17'},
]);

const spacedOrdinalProgramme=`LE PERTRE
1 ère Course – Départ : 14 h. 45 PRIX A
2 ème Course – Départ : 15 h. 15 PRIX B
3 ème Course – Départ : 15 h. 45 PRIX C`;
assert.deepEqual(parseFnchProgrammeText(spacedOrdinalProgramme),[
  {label:'Race 1',post_time_local:'14:45'},
  {label:'Race 2',post_time_local:'15:15'},
  {label:'Race 3',post_time_local:'15:45'},
],'FNCH spaced ordinal race headers must parse exactly');

const galopProgramme=`TOULOUSE
mercredi 23 septembre 2026 : 16h02
1
16H32 Ø Prix Georges Sicard
2
17H07 Ø Prix Young Tiger
3
17H42 Ø Prix de l'Ariège`;
assert.deepEqual(parseFnchProgrammeText(galopProgramme),[
  {label:'Race 1',post_time_local:'16:32'},
  {label:'Race 2',post_time_local:'17:07'},
  {label:'Race 3',post_time_local:'17:42'},
]);

const noisyProgramme=`HEADER 20 16 h 45
1
14H40 Prix A
2
15H10 Prix B
3
15H40 Prix C`;
assert.deepEqual(parseFnchProgrammeText(noisyProgramme),[
  {label:'Race 1',post_time_local:'14:40'},
  {label:'Race 2',post_time_local:'15:10'},
  {label:'Race 3',post_time_local:'15:40'},
],'inline page/header numbers must not be mistaken for race numbers');

const laTesteProgramme=`PROGRAMME DU JEUDI 24 SEPTEMBRE 2026
1
11H51 Ø Prix STOA
2
12H23 Ø Prix Haras des Granges
3
12H55 Ø Prix du Haras du Mazet`;
assert.deepEqual(parseFnchProgrammeText(laTesteProgramme),[
  {label:'Race 1',post_time_local:'11:51'},
  {label:'Race 2',post_time_local:'12:23'},
  {label:'Race 3',post_time_local:'12:55'},
]);
const checkedAt='2026-09-22T10:00:00Z';
const pending=buildFnchFixtureRecord(galop,{checkedAt});
assert.equal(pending.capability_rank,'C');
assert.equal(pending.acquisition_completion.disposition,'pending_publication');
assert.equal(pending.acquisition_completion.observed_rank,'C');
assert.equal(pending.acquisition_completion.technical_capability_rank,'A');
assert.equal(pending.acquisition_completion.higher_rank_open,true);
assert.deepEqual(validateCalendarAuthorityMetadataV1({acquisition_attempt:pending.acquisition_attempt,acquisition_completion:pending.acquisition_completion,evidence_support:pending.evidence_support}),[]);
const detailed=buildFnchProgrammeRecord(trot,{checkedAt,programmeText:programme});
assert.equal(detailed.capability_rank,'A');
assert.equal(detailed.first_race_time_local,'11:12');
assert.equal(detailed.last_race_time_local,'12:17');
assert.equal(detailed.acquisition_completion.disposition,'complete_current_best_available');
assert.equal(detailed.acquisition_completion.higher_rank_open,false);
assert.deepEqual(validateCalendarAuthorityMetadataV1({acquisition_attempt:detailed.acquisition_attempt,acquisition_completion:detailed.acquisition_completion,evidence_support:detailed.evidence_support}),[]);

if(process.env.GITHUB_ACTIONS==='true'){
  const galopOutput='.france-galop-live-'+process.pid+'.json';
  const letrotOutput='.france-letrot-live-'+process.pid+'.json';
  try{
    execFileSync(process.execPath,[
      'scripts/timetable/run-france-fnch-official-window.mjs',
      '--as-of=2026-09-26',
      '--days=3',
      '--galop-output='+galopOutput,
      '--letrot-output='+letrotOutput,
    ],{encoding:'utf8'});
    const galop=JSON.parse(fs.readFileSync(galopOutput,'utf8'));
    const letrot=JSON.parse(fs.readFileSync(letrotOutput,'utf8'));
    const physical=new Set(galop.records.map((row)=>row.date+'|'+row.racecourse_id));
    const overlaps=letrot.records.filter((row)=>physical.has(row.date+'|'+row.racecourse_id));
    assert.deepEqual(overlaps.map((row)=>row.date+'|'+row.racecourse_id),[],'live FNCH route must not duplicate one physical meeting across Galop and LETROT');
    assert.ok(Array.isArray(galop.superseded_meeting_ids),'France Galop artifact must expose explicit stale duplicate cleanup ids');
    assert.ok(galop.superseded_meeting_ids.some((id)=>id.includes('saint-malo-racecourse-2026-09-27')),'live mixed Saint-Malo meeting must supersede the stale LETROT duplicate id');
    const liveParseFailures=[
      ...(galop.diagnostics?.parse_failures??[]).filter((row)=>row.stage==='programme_pdf').map((row)=>({...row,system:'galop'})),
      ...(letrot.diagnostics?.parse_failures??[]).filter((row)=>row.stage==='programme_pdf').map((row)=>({...row,system:'letrot'})),
    ];
    if(liveParseFailures.length) {
      console.log('FRANCE_LIVE_PARSE_FAILURES:',JSON.stringify(liveParseFailures));
      for(const failure of liveParseFailures.slice(0,2)){
        try{
          const response=await fetch(failure.source_url,{headers:{'user-agent':'Mozilla/5.0 (compatible; WhereHorsesRun/1.0; +https://whr.badjoke-lab.com/)'}});
          const bytes=new Uint8Array(await response.arrayBuffer());
          const pdf=await getDocument({data:bytes,disableWorker:true}).promise;
          const out=[];
          for(let pageNumber=1;pageNumber<=Math.min(pdf.numPages,3);pageNumber+=1){
            const page=await pdf.getPage(pageNumber);
            const content=await page.getTextContent();
            let line='';
            for(const item of content.items){
              if(!('str' in item)) continue;
              const value=item.str.replace(/\s+/g,' ').trim();
              if(value) line+=`${line?' ':''}${value}`;
              if(item.hasEOL&&line){out.push(line);line='';}
            }
            if(line) out.push(line);
          }
          const rawHeaderItems=[];
          for(let pageNumber=1;pageNumber<=Math.min(pdf.numPages,4);pageNumber+=1){
            const page=await pdf.getPage(pageNumber);
            const content=await page.getTextContent();
            for(const item of content.items){
              if(!('str' in item)) continue;
              const value=String(item.str??'').replace(/\s+/g,' ').trim();
              if(/course|d[ée]part/i.test(value)) rawHeaderItems.push({page:pageNumber,x:item.transform?.[4]??null,y:item.transform?.[5]??null,value});
            }
          }
          const pdfjsHeaders=out.filter(line=>/Course\s*[–—-]\s*Départ/i.test(line));
          console.log('FRANCE_PARSE_TEXT:',JSON.stringify({source_url:failure.source_url,pdfjs_headers:pdfjsHeaders,raw_header_items:rawHeaderItems.slice(0,80)}));
        }catch(error){
          console.log('FRANCE_PARSE_TEXT:',JSON.stringify({source_url:failure.source_url,error:String(error?.message??error)}));
        }
      }
    }
    assert.equal(galop.diagnostics?.source_errors?.filter((row)=>row.stage==='programme_pdf').length,0,'live France Galop programme PDFs must not fail acquisition');
    assert.equal(letrot.diagnostics?.source_errors?.filter((row)=>row.stage==='programme_pdf').length,0,'live LETROT programme PDFs must not fail acquisition');
    assert.equal(galop.diagnostics?.parse_failures?.filter((row)=>row.stage==='programme_pdf').length,0,'live France Galop published programme PDFs must parse without race-row failure');
    assert.equal(letrot.diagnostics?.parse_failures?.filter((row)=>row.stage==='programme_pdf').length,0,'live LETROT published programme PDFs must parse without race-row failure');
  }finally{
    fs.rmSync(galopOutput,{force:true});
    fs.rmSync(letrotOutput,{force:true});
  }
}
console.log('FRANCE_FNCH_ADAPTER: pass');
