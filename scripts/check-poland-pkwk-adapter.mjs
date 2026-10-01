import fs from 'node:fs';import {execFileSync} from 'node:child_process';import assert from 'node:assert/strict';
import {parseSopot2026Html,parseWarsawPlanPages,parseWroclawInfoHtml,resolvePolishOcrDay} from './timetable/poland-pkwk-calendar-core.mjs';

assert.equal(resolvePolishOcrDay('70',{year:2026,month:'10',weekdayWord:'sobota'}),10);
assert.equal(resolvePolishOcrDay('77',{year:2026,month:'10',weekdayWord:'niedziela'}),11);
assert.equal(resolvePolishOcrDay('77',{year:2026,month:'10',weekdayWord:'sobota'}),17);
assert.equal(resolvePolishOcrDay('24',{year:2026,month:'10',weekdayWord:'sobota'}),24);
assert.equal(resolvePolishOcrDay('25',{year:2026,month:'10',weekdayWord:'niedziela'}),25);

const warsaw=parseWarsawPlanPages([
 {page:1,text:'PLAN GONITW 2026 TOR SŁUŻEWIEC Dzień 35 - sobota, 3 października'},
 {page:2,text:'PLAN GONITW 2026 TOR SŁUŻEWIEC Dzień 36 - sobota, 70 października'},
 {page:3,text:'PLAN GONITW 2026 TOR SŁUŻEWIEC Dzień 37 - niedziela, 77 października'},
 {page:4,text:'PLAN GONITW 2026 TOR SŁUŻEWIEC Dzień 38 - sobota, 77 października'},
 {page:5,text:'PLAN GONITW 2026 TOR SŁUŻEWIEC Dzień 39 - sobota, 24 października'},
 {page:6,text:'PLAN GONITW 2026 TOR SŁUŻEWIEC Dzień 40 - niedziela, 25 października'}
]);
assert.deepEqual(warsaw.map(r=>r.date),['2026-10-03','2026-10-10','2026-10-11','2026-10-17','2026-10-24','2026-10-25']);

const wroclaw=parseWroclawInfoHtml('<h1>Informacje wyścigowe</h1> Warszawa Dodatkowy dzień wyścigowy 12.09.2026 Wrocław Plan Gonitw dla Wrocław-Partynice 2026 Gonitwy dodatkowe WTWK-Partynice (24.05, 14.06, 9.08, 13.09, 4.10, 18.10, 11.11) 10 dzień wyścigowy (4.10.2026) 11 dzień wyścigowy (18.10.2026) Sopot Plan Gonitw dla Hipodrom Sopot 2026');
assert.ok(wroclaw.some(r=>r.date==='2026-10-04'));
assert.ok(wroclaw.some(r=>r.date==='2026-10-18'));
assert.ok(!wroclaw.some(r=>r.date==='2026-09-12'));

const sopot=parseSopot2026Html('<h1>Wyścigi w Sopocie 2026</h1> Program gonitw na 11 – 12 lipca 2026 link Najbliższe spotkanie odbędzie się 18 -19 lipca 2026');
assert.deepEqual(sopot.map(r=>r.date),['2026-07-11','2026-07-12','2026-07-18','2026-07-19']);

if(process.env.GITHUB_EVENT_NAME==='pull_request'){
  const output='.poland-live-'+process.pid+'.json';
  try{
    execFileSync(process.execPath,['scripts/timetable/run-poland-pkwk-official-window.mjs','--as-of=2026-10-01','--days=30','--output='+output],{encoding:'utf8',timeout:180000});
    const artifact=JSON.parse(fs.readFileSync(output,'utf8'));
    console.log('POLAND_PKWK_LIVE: '+JSON.stringify({attempt:artifact.acquisition_attempt,discovery:artifact.discovery,diagnostics:artifact.diagnostics,records:(artifact.records??[]).map(r=>[r.date,r.racecourse_id])}));
    assert.equal(artifact.acquisition_attempt?.status,'success');
    const expected=[
      ['2026-10-03','poland--sluzewiec-warsaw'],
      ['2026-10-04','poland--wroclaw-partynice'],
      ['2026-10-10','poland--sluzewiec-warsaw'],
      ['2026-10-11','poland--sluzewiec-warsaw'],
      ['2026-10-17','poland--sluzewiec-warsaw'],
      ['2026-10-18','poland--wroclaw-partynice'],
      ['2026-10-24','poland--sluzewiec-warsaw'],
      ['2026-10-25','poland--sluzewiec-warsaw']
    ];
    for(const [date,id] of expected) assert.ok((artifact.records??[]).some(r=>r.date===date&&r.racecourse_id===id),'missing '+date+' '+id);
    assert.ok(!(artifact.records??[]).some(r=>r.racecourse_id==='poland--hipodrom-sopot'),'Sopot should have no meeting in the Oct 1 30-day window');
    assert.equal(artifact.diagnostics?.source_errors?.length,0);
    assert.equal(artifact.diagnostics?.parse_failures?.length,0);
  }finally{fs.rmSync(output,{force:true});}
}
console.log('POLAND_PKWK_ADAPTER: pass');
