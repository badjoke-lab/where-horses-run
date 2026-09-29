import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';import {buildCzechMeetingRecord,extractCzechEventLinks,parseCzechEventDetail} from './timetable/czech-dostihy-calendar-core.mjs';
const list='<a href="/kalendar-akci/test-praha-2026">Více</a><a href="https://www.dostihy.cz/kalendar-akci/test-most-2026">Více</a>';
assert.deepEqual(extractCzechEventLinks(list),['https://www.dostihy.cz/kalendar-akci/test-praha-2026','https://www.dostihy.cz/kalendar-akci/test-most-2026']);
const englishList='<a href="/racing-calendar/crystal-cup-of-pardubice-2026">Read more</a>';
assert.deepEqual(extractCzechEventLinks(englishList,{sourceUrl:'https://www.dostihy.cz/racing-calendar'}),['https://www.dostihy.cz/racing-calendar/crystal-cup-of-pardubice-2026']);
const p=parseCzechEventDetail('<p>Štítky: Praha</p><p>Datum konání: 4. 10. 2026</p>',{sourceUrl:'https://www.dostihy.cz/kalendar-akci/test-praha-2026'});
assert.equal(p.date,'2026-10-04');assert.equal(p.venue.racecourse_id,'czech-republic--chuchle-arena-praha');
const en=parseCzechEventDetail('<p>Tags: Pardubice</p><p>Due date: 10/10/26</p>',{sourceUrl:'https://www.dostihy.cz/racing-calendar/crystal-cup-of-pardubice-2026'});
assert.equal(en.date,'2026-10-10');assert.equal(en.venue.racecourse_id,'czech-republic--pardubice-racecourse');
const r=buildCzechMeetingRecord({date:p.date,racecourse_id:p.venue.racecourse_id,source_url:p.source_url},{checkedAt:'2026-09-28T00:00:00Z'});
assert.equal(r.capability_rank,'C');assert.equal(r.first_race_time_local,null);assert.equal(r.last_race_time_local,null);assert.deepEqual(r.timetable_rows,[]);
if(process.env.GITHUB_ACTIONS==='true'){
  const output='.czech-live-'+process.pid+'.json';
  try{
    execFileSync(process.execPath,['scripts/timetable/run-czech-dostihy-official-window.mjs','--as-of=2026-09-29','--days=30','--output='+output],{encoding:'utf8',timeout:120000});
    const artifact=JSON.parse(fs.readFileSync(output,'utf8'));
    assert.equal(artifact.acquisition_attempt?.status,'success','Czech live route must recover through an official calendar route');
    assert.ok((artifact.records??[]).length>0,'Czech live route must recover current-window meetings');
    assert.equal(artifact.diagnostics?.source_errors?.length,0);
    assert.equal(artifact.diagnostics?.parse_failures?.length,0);
  }finally{fs.rmSync(output,{force:true});}
}
console.log('CZECH_DOSTIHY_ADAPTER: pass');
